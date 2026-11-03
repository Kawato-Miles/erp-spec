#!/usr/bin/env python3
"""vault-audit 機械維度檢查（只讀）。

涵蓋維度 2、5、6、7、8、9、10、11、17；判定標準正本在 references/稽核維度.md。
不涵蓋：維度 3、4（走 obsidian-cli）、維度 15（authority_check.py）、維度 16（規範卡機械自檢段）、
判讀維度 1、12、13、14 與維度 6 的判讀項。

門檻來源（不寫死在本檔）：
- vault-audit 自有門檻：references/稽核維度.md § 一門檻表（以代號讀取）
- raw 停留與累積門檻：.claude/skills/vault-ingest/references/掃描報告格式.md § 一
- OQ open 停留天數：.claude/skills/oq-manage/ 內的門檻句；讀不到時用 --oq-stale-days 指定，否則略過該項
值域來源：wiki-schema § 一（type）、§ 二（module）、§ 三（status）、§ 四（各 type 欄位）、§ 七（OQ 前綴）；
business-domain-taxonomy § 領域定義（領域 tag）。

用法：
  python3 mechanical_check.py                      全部機械維度；本輪異動＝與 origin/master 分岔點至今＋工作區
  python3 mechanical_check.py --dims 5,8           只跑指定維度
  python3 mechanical_check.py --base <提交>        本輪異動改從指定提交算起（維度 10、11）
  python3 mechanical_check.py --commit <提交>      指名批次：本輪異動＝該提交的檔案（模式 D）
  python3 mechanical_check.py --oq-stale-days N    OQ 停留天數門檻（oq-manage 讀不到時）
結束碼：任一維度判 Error 或有錯誤項為 1，否則為 0。
"""
import argparse
import datetime as dt
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve()
SKILL = HERE.parents[1]
ROOT = HERE.parents[4]
VAULT = ROOT / "memory/Sens_wiki"
WIKI = VAULT / "wiki"
RAW = VAULT / "raw"
ERP = WIKI / "erp"
SCHEMA = ERP / "00-meta/wiki-schema.md"
TAXONOMY = ERP / "00-meta/business-domain-taxonomy.md"
DIMS_DOC = SKILL / "references/稽核維度.md"
INGEST_DOC = ROOT / ".claude/skills/vault-ingest/references/掃描報告格式.md"
OQ_SKILL = ROOT / ".claude/skills/oq-manage"
REVIEW = ERP / "11-review-knowledge"
TODAY = dt.date.today()

LINK = re.compile(r"\[\[([^\]|#\\]+)(?:[#|\\][^\]]*)?\]\]")
CANON_TYPES = {"role", "service-blueprint", "activity-list", "controlled-list", "process-architecture",
               "business-rule", "entity", "structure-overview", "state-machine", "scenario"}
REMOVED_ON_CANON = ("module", "implemented-by", "related-spec")
TAG_DIRS = ("03-roles", "04-business-logic", "05-entities", "06-state-machines", "07-scenarios")
DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


# ---------- 共用 ----------

def rel(p):
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def read(p):
    try:
        return p.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def fm_block(text):
    m = re.match(r"^---\n(.*?)\n---\s*(\n|$)", text, re.S)
    return m.group(1) if m else None


def parse_fm(text):
    """回傳 (欄位字典, 原始行字典)。值為字串或字串清單；空值為 ""。"""
    block = fm_block(text)
    if block is None:
        return None, {}
    data, raw_lines, key = {}, {}, None
    for ln in block.splitlines():
        if not ln.strip() or ln.lstrip().startswith("#"):
            continue
        m = re.match(r"^([\w-]+):\s*(.*)$", ln)
        if m and not ln.startswith((" ", "\t")):
            key, val = m.group(1), m.group(2)
            raw_lines[key] = ln
            val = re.sub(r"\s+#.*$", "", val).strip()
            if val.startswith("[") and val.endswith("]"):
                inner = val[1:-1].strip()
                data[key] = [v.strip().strip('"\'') for v in inner.split(",")] if inner else []
            else:
                data[key] = val.strip('"\'')
            continue
        m = re.match(r"^\s+-\s*(.*)$", ln)
        if m and key:
            item = re.sub(r"\s+#.*$", "", m.group(1)).strip().strip('"\'')
            if not isinstance(data.get(key), list):
                data[key] = [] if data.get(key, "") == "" else [data[key]]
            data[key].append(item)
    return data, raw_lines


def as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else ([v] if v != "" else [])


def parse_date(s):
    m = DATE_RE.search(s or "")
    if not m:
        return None
    try:
        return dt.date.fromisoformat(m.group(1))
    except ValueError:
        return None


def split_row(line):
    s = line.strip().strip("|")
    return [c.strip() for c in re.split(r"(?<!\\)\|", s)]


def is_sep(line):
    cells = split_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c)


def section(text, title_prefix, level=2):
    """回傳某個標題底下的行（到同級或更高級標題為止）。"""
    lines, out, on, fence = text.splitlines(), [], False, False
    hdr = re.compile(r"^(#{1,%d})\s+(.*)$" % level)
    for ln in lines:
        if ln.lstrip().startswith("```"):
            fence = not fence
        m = None if fence else hdr.match(ln)
        if m:
            if on:
                break
            if len(m.group(1)) == level and m.group(2).strip().startswith(title_prefix):
                on = True
                continue
        elif on:
            out.append(ln)
    return out


def tables(lines):
    out, i = [], 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i + 1 < len(lines) and is_sep(lines[i + 1]):
            header, rows, j = split_row(lines[i]), [], i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                rows.append(split_row(lines[j]))
                j += 1
            out.append((header, rows))
            i = j
        else:
            i += 1
    return out


def body_lines(text):
    """frontmatter 之後的正文行，略過程式碼區塊。回傳 [(行號, 行)]。"""
    lines = text.splitlines()
    start = 0
    if text.startswith("---\n"):
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                start = i + 1
                break
    out, fence = [], False
    for i in range(start, len(lines)):
        if lines[i].lstrip().startswith("```"):
            fence = not fence
            continue
        if not fence:
            out.append((i + 1, lines[i]))
    return out


def git(*args):
    try:
        r = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=ROOT,
                           capture_output=True, text=True, check=True)
        return r.stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


# ---------- 門檻與值域 ----------

def thresholds_from_dims_doc():
    out = {}
    for ln in read(DIMS_DOC).splitlines():
        m = re.match(r"^\|\s*`([a-z0-9_]+)`\s*\|\s*(\d+)", ln)
        if m:
            out[m.group(1)] = int(m.group(2))
    return out


def ingest_thresholds():
    out = {}
    for header, rows in tables(section(read(INGEST_DOC), "一", 2)):
        for cells in rows:
            if len(cells) < 2:
                continue
            label, num = cells[0], re.search(r"(\d+)", cells[1])
            if not num:
                continue
            n = int(num.group(1))
            if "同主題" in label:
                out["same_topic"] = n
            elif "status=raw" in label and "累積" in label:
                out["raw_count"] = n
            elif "status=raw" in label and "天" in label:
                out["raw_days"] = n
            elif "status=reviewed" in label and "天" in label:
                out["reviewed_days"] = n
    return out


def oq_stale_days():
    for p in sorted(OQ_SKILL.rglob("*.md")):
        for ln in read(p).splitlines():
            if "open" not in ln or "天" not in ln:
                continue
            m = re.search(r"open[^\n|]{0,12}?(?:超過|逾|停留)[^\d\n|]{0,6}(\d+)\s*天", ln)
            if not m:
                m = re.search(r"open[^|\n]*\|\s*(\d+)\s*天", ln)
            if m:
                return int(m.group(1)), rel(p)
    return None, None


def schema_enums():
    text = read(SCHEMA)
    types = set()
    for _, rows in tables(section(text, "一、type", 2)):
        for cells in rows:
            m = re.match(r"^`([a-z-]+)`$", cells[0]) if cells else None
            if m:
                types.add(m.group(1))
    statuses = set()
    for _, rows in tables(section(text, "三、status", 2)):
        for cells in rows:
            m = re.match(r"^`([a-z-]+)`$", cells[0]) if cells else None
            if m:
                statuses.add(m.group(1))
    modules = set()
    for ln in section(text, "二、module", 2):
        m = re.match(r"^\s+-\s*(.+?)(\s+#.*)?$", ln)
        if m:
            modules.update(v.strip() for v in m.group(1).split("|") if v.strip())
    # § 四：各 type 的 yaml 區塊
    req, opt_named = {}, set(re.findall(r"`([\w-]+):`", "\n".join(
        ln for ln in section(text, "四、", 2) if "通則二" in ln)))
    sec4 = section(text, "四、", 2)
    cur_types, in_yaml, keys = None, False, []
    for ln in sec4:
        m = re.match(r"^###\s+type=(.+)$", ln)
        if m:
            cur_types = [re.sub(r"（.*?）", "", t).strip() for t in m.group(1).split("/")]
            continue
        if cur_types and ln.strip().startswith("```yaml"):
            in_yaml, keys = True, []
            continue
        if in_yaml and ln.strip().startswith("```"):
            in_yaml = False
            for t in cur_types:
                req[t] = keys
            cur_types = None
            continue
        if in_yaml:
            mk = re.match(r"^([\w-]+):(.*)$", ln)
            if mk:
                keys.append((mk.group(1), mk.group(2)))
    required = {}
    for t, kv in req.items():
        names, prev_opt_prefix = [], None
        for k, rest in kv:
            comment = rest.split("#", 1)[1] if "#" in rest else ""
            prefix = k.split("-")[0]
            optional = (k in opt_named or k == "title"
                        or re.search(r"選填|時填|無則刪|可選|回填", comment)
                        or re.search(r"\S\s*/\s*\S+\s*必填", comment)
                        or (prev_opt_prefix and prefix == prev_opt_prefix))
            prev_opt_prefix = prefix if optional and "-" in k else None
            if not optional:
                names.append(k)
        required[t] = names
    prefixes = set()
    for _, rows in tables(section(text, "七、", 2)):
        for cells in rows:
            for c in cells:
                if re.fullmatch(r"[A-Z]{2,4}", c):
                    prefixes.add(c)
    raw_status = set()
    for ln in section(text, "四、", 2):
        m = re.match(r"^status:\s*(raw\s*\|.*?)(\s+#.*)?$", ln)
        if m:
            raw_status = {v.strip() for v in m.group(1).split("|")}
    return types, statuses, modules, required, prefixes, raw_status


def domain_tags():
    text = read(TAXONOMY)
    tags = set()
    for ln in section(text, "領域定義", 2):
        m = re.match(r"^###\s+(\S+?)(（.*）)?\s*$", ln)
        if m:
            tags.add("領域/" + m.group(1))
    for ln in section(text, "領域 tag 標注規則", 2):
        tags.update(t for t in re.findall(r"`(領域/[^`<>]+)`", ln))
    return tags


# ---------- 卡片清單 ----------

def wiki_cards():
    """wiki 全卡；排除骨架目錄與已凍結的 00-meta/changelog.md（不讀）。"""
    return sorted(p for p in WIKI.rglob("*.md")
                  if "範本" not in p.relative_to(WIKI).parts and p.name != "changelog.md")


def is_archived(p):
    return "_archives" in p.parts


def changed_files(base, commit):
    if commit:
        out = git("show", "--name-only", "--format=", commit)
        date = (git("log", "-1", "--format=%ad", "--date=short", commit) or "").strip()
        files = (out or "").splitlines()
    else:
        if not base:
            base = (git("merge-base", "HEAD", "origin/master") or "").strip() or "HEAD"
        files = (git("diff", "--name-only", base, "HEAD", "--", "memory/Sens_wiki/wiki/") or "").splitlines()
        files += (git("diff", "--name-only", "--", "memory/Sens_wiki/wiki/") or "").splitlines()
        files += (git("ls-files", "--others", "--exclude-standard", "--", "memory/Sens_wiki/wiki/") or "").splitlines()
        date = (git("log", "-1", "--format=%ad", "--date=short", base) or "").strip()
    paths = sorted({ROOT / f for f in files if f.startswith("memory/Sens_wiki/wiki/") and f.endswith(".md")})
    return [p for p in paths if p.exists()], parse_date(date) or TODAY


# ---------- 報告 ----------

class Dim:
    def __init__(self, no, name):
        self.no, self.name, self.items, self.grade, self.note = no, name, [], "OK", ""

    def add(self, level, path, msg):
        self.items.append((level, rel(path) if isinstance(path, Path) else path, msg))

    def count(self, level):
        return sum(1 for lv, _, _ in self.items if lv == level)


def grade_by_count(d, n, warn_max, force_error=False):
    if force_error or n > warn_max:
        d.grade = "Error"
    elif n > 0 or d.count("警告"):
        d.grade = "Warning"


# ---------- 各維度 ----------

def dim2(cards, fms, th):
    d = Dim(2, "過時宣稱")
    days = th.get("stale_days")
    if days is None:
        d.note = "門檻 stale_days 讀不到，略過"
        return d
    cutoff = TODAY - dt.timedelta(days=days)
    for p in cards:
        fm = fms.get(p)
        if not fm or fm.get("status") != "active" or fm.get("type") == "example" or p.name == "log.md":
            continue
        lr = parse_date(fm.get("last-reviewed"))
        if lr and lr < cutoff:
            d.add("警告", p, f"last-reviewed {lr} 早於 {cutoff}")
    grade_by_count(d, d.count("警告"), th.get("d2_warn_max", 0))
    return d


def dim5(cards, th, enums, tags_enum):
    d = Dim(5, "frontmatter 完整性")
    types, statuses, modules, required, _, _ = enums
    force = False
    for p in cards:
        text = read(p)
        fm, _ = parse_fm(text)
        relp = p.relative_to(WIKI)
        if fm is None:
            if p.name not in ("index.md",):
                d.add("錯誤", p, "缺 frontmatter")
            continue
        if "business-domain" in fm and not is_archived(p):
            d.add("錯誤", p, "含已移除欄位 business-domain")
            force = True
        t = fm.get("type", "")
        if t == "example":
            continue
        if not t:
            d.add("錯誤", p, "缺 type")
        elif t not in types:
            d.add("錯誤", p, f"type「{t}」不在 wiki-schema § 一值域")
        st = fm.get("status", "")
        if not st:
            d.add("錯誤", p, "缺 status")
        elif st not in statuses:
            d.add("錯誤", p, f"status「{st}」不在 wiki-schema § 三值域")
        if is_archived(p):
            continue
        deprecated = st == "deprecated"
        for k in required.get(t, []):
            if deprecated and k in ("source", "tags"):
                continue
            if k == "tags":
                continue
            if k not in fm:
                d.add("錯誤", p, f"缺必填欄位 {k}（wiki-schema § 四 type={t}）")
        if t in CANON_TYPES:
            for k in REMOVED_ON_CANON:
                if k in fm:
                    d.add("錯誤", p, f"正本卡型含已移除欄位 {k}")
                    force = True
            if not deprecated and "source" not in fm:
                if "source" not in required.get(t, []):
                    d.add("錯誤", p, "正本卡型缺 source")
        # 領域 tag
        top = relp.parts[1] if len(relp.parts) > 1 and relp.parts[0] == "erp" else ""
        in_scope = (top in TAG_DIRS and t not in ("meta", "example")) or \
                   (top == "08-open-questions" and len(relp.parts) == 3 and st == "open" and t == "open-question")
        tag_vals = [v for v in as_list(fm.get("tags")) if v.startswith("領域/")]
        if in_scope and not deprecated and not tag_vals:
            d.add("錯誤", p, "必標範圍內缺領域 tag")
        for v in tag_vals:
            if v not in tags_enum:
                d.add("錯誤", p, f"領域 tag「{v}」不在 business-domain-taxonomy 值域")
        # module 英文殘留
        for v in as_list(fm.get("module")):
            if v and v not in modules and re.fullmatch(r"[A-Za-z][\w-]*", v):
                d.add("提醒", p, f"module 英文值殘留「{v}」")
        # title 冗餘與空欄位
        if fm.get("title") and fm.get("title") == p.stem:
            d.add("警告", p, "title 與檔名相同（wiki-schema § 四通則一）")
        for k, v in fm.items():
            if v == "" or v == []:
                d.add("警告", p, f"欄位 {k} 無值（wiki-schema § 四通則二）")
    grade_by_count(d, d.count("錯誤"), th.get("d5_warn_max", 0), force)
    return d


def dim6(cards, th):
    d = Dim(6, "規約遵守（機械項）")
    for p in cards:
        relp = p.relative_to(WIKI)
        parts = relp.parts
        text = read(p)
        in_oq = "08-open-questions" in parts
        hist = p.name == "log.md" or is_archived(p)
        canon = len(parts) > 1 and parts[0] == "erp" and parts[1] in TAG_DIRS
        for no, ln in body_lines(text):
            ln = re.sub(r"`[^`]*`", "", ln)  # 行內程式碼是在描述禁令本身，不計
            if not in_oq and re.match(r"^\s*>\s*\[!question\]", ln):
                d.add("錯誤", p, f"第 {no} 行用 [!question] callout")
            if canon and not p.name.startswith("規範 - ") and re.search(r"待補|待釐清", ln) \
                    and "[[" not in ln and "待補件" not in ln:
                d.add("錯誤", p, f"第 {no} 行 inline OQ 措辭：{ln.strip()[:60]}")
            if not hist and re.search(r"\[\[[^\]]*\|", ln):
                d.add("錯誤", p, f"第 {no} 行 wiki link 用別名")
    grade_by_count(d, d.count("錯誤"), th.get("d6_warn_max", 0))
    return d


def dim7(cards, fms):
    d = Dim(7, "出鏈有效性與方向")
    impl = re.compile(r"openspec/|sens-erp-prototype/")
    impl_body = re.compile(r"openspec/|sens-erp-prototype/|/erp/apps/")
    src_links = {}
    for p in cards:
        fm = fms.get(p) or {}
        srcs = as_list(fm.get("source"))
        for s in srcs:
            if impl.search(s):
                d.add("錯誤", p, f"source 指實作路徑：{s[:80]}")
        src_links[p.stem] = {l for s in srcs for l in LINK.findall(s)}
        parts = p.relative_to(WIKI).parts
        if len(parts) > 1 and parts[0] == "erp" and parts[1] in TAG_DIRS:
            for no, ln in body_lines(read(p)):
                if impl_body.search(ln):
                    d.add("錯誤", p, f"第 {no} 行正文外連實作路徑")
    seen = set()
    for a, targets in src_links.items():
        for b in targets:
            if b != a and a in src_links.get(b, set()) and (b, a) not in seen:
                seen.add((a, b))
                d.add("錯誤", f"[[{a}]] ↔ [[{b}]]", "source 直接互指")
    if d.items:
        d.grade = "Error"
    return d


def dim8(th, enums, oq_days, oq_src):
    d = Dim(8, "OQ 健康度")
    _, _, _, _, prefixes, _ = enums
    force = False
    oq_dir = ERP / "08-open-questions"
    for p in sorted(oq_dir.glob("*.md")):
        fm, raw_lines = parse_fm(read(p))
        if not fm or fm.get("type") != "open-question":
            continue
        st = fm.get("status", "")
        line = raw_lines.get("status", "")
        if st not in ("open", "answered", "cancelled") or "#" in line:
            d.add("錯誤", p, f"status 違規：{line.strip()}")
            force = True
        elif st in ("answered", "cancelled"):
            d.add("錯誤", p, f"status={st} 仍在平層，未封存")
            force = True
        m = re.match(r"^([A-Z]{2,4})-(\d{3})-.+$", p.stem)
        if not m:
            d.add("錯誤", p, "檔名不符「前綴-三位序號-簡述」")
        elif prefixes and m.group(1) not in prefixes:
            d.add("錯誤", p, f"前綴 {m.group(1)} 不在 wiki-schema § 七值域")
        if st == "open" and oq_days is not None:
            ra = parse_date(fm.get("raised-at"))
            if ra and (TODAY - ra).days > oq_days:
                pri = "，priority high" if fm.get("priority") == "high" else ""
                d.add("警告", p, f"open 已 {(TODAY - ra).days} 天{pri}")
        if not fm.get("source-link"):
            d.add("警告", p, "缺 source-link")
    if oq_days is None:
        d.note = "OQ 停留天數門檻讀不到（oq-manage），停留項略過；可用 --oq-stale-days 指定"
    else:
        d.note = f"OQ 停留天數門檻 {oq_days}（來源 {oq_src}）"
    grade_by_count(d, len(d.items), th.get("d8_warn_max", 0), force)
    return d


def dim9(enums, ith):
    d = Dim(9, "Raw 健康度")
    raw_status = enums[5] or {"raw", "reviewed", "ingested", "cancelled"}
    topics, raw_n = Counter(), 0
    for p in sorted(RAW.glob("*.md")):
        if p.name == "README.md":
            continue
        fm, _ = parse_fm(read(p))
        if not fm:
            d.add("錯誤", p, "缺 frontmatter")
            continue
        st, src = fm.get("status", ""), fm.get("source", "")
        if st not in raw_status:
            d.add("錯誤", p, f"status「{st}」不在 raw 值域")
        ca = parse_date(fm.get("created-at"))
        age = (TODAY - ca).days if ca else None
        if st == "raw":
            raw_n += 1
            for t in as_list(fm.get("topic-tag")):
                topics[t] += 1
            if age is not None and "raw_days" in ith and age > ith["raw_days"]:
                d.add("警告", p, f"status=raw 已 {age} 天")
        if st == "reviewed" and age is not None and "reviewed_days" in ith and age > ith["reviewed_days"]:
            d.add("警告", p, f"status=reviewed 已 {age} 天未確認")
        if src in ("claude-research", "miles-upload") and not fm.get("raw-source-link"):
            d.add("錯誤", p, f"source={src} 缺 raw-source-link")
        if src == "miles-upload" and not as_list(fm.get("attached-files")):
            d.add("錯誤", p, "source=miles-upload 缺 attached-files")
    if "same_topic" in ith:
        for t, n in sorted(topics.items()):
            if n >= ith["same_topic"]:
                d.add("警告", f"topic-tag「{t}」", f"status=raw 累積 {n} 張，建議 vault-ingest mode B")
    if "raw_count" in ith and raw_n >= ith["raw_count"]:
        d.add("提醒", "raw/", f"status=raw 共 {raw_n} 張，建議 vault-ingest mode C")
    if not ith:
        d.note = "vault-ingest 門檻讀不到，停留與累積項略過"
    d.grade = "Error" if d.count("錯誤") else ("Warning" if d.count("警告") else "OK")
    return d


def dim10(changed):
    d = Dim(10, "標題錨點（Info）")
    for p in changed:
        if re.search(r"spec\.md#Requirement:", read(p)):
            d.add("提醒", p, "含標題錨點，建議改指 spec 檔層")
    d.note = f"本輪異動卡 {len(changed)} 張"
    d.grade = "Info"
    return d


def log_entries():
    text, out = read(WIKI / "log.md"), []
    for chunk in re.split(r"(?m)^(?=## \[)", text):
        if not chunk.startswith("## ["):
            continue
        head = chunk.splitlines()[0]
        motive = re.search(r"(?m)^- 動機[：:]\s*(.*)$", chunk)
        out.append((parse_date(head), head, chunk, motive.group(1).strip() if motive else ""))
    return out


def dim11(changed, since):
    d = Dim(11, "log 條目完整性")
    entries = log_entries()
    targets = [p for p in changed if len(p.relative_to(WIKI).parts) > 1
               and p.relative_to(WIKI).parts[0] == "erp"
               and p.relative_to(WIKI).parts[1] in ("03-roles", "04-business-logic", "05-entities", "06-state-machines")]
    for p in targets:
        pat = re.compile(r"\[\[" + re.escape(p.stem) + r"(\]\]|#)")
        hits = [e for e in entries if e[0] and e[0] >= since and pat.search(e[2])]
        if not hits:
            d.add("警告", p, f"{since} 起 log 沒有含 [[{p.stem}]] 的條目")
            continue
        subst = [e for e in hits if "健檢" not in e[1] and "ingest" not in e[1]]
        if subst and all(not e[3] or e[3].startswith("免") for e in subst):
            d.add("警告", p, "實質異動條目的動機行空白")
    d.note = f"本輪異動的 03～06 卡 {len(targets)} 張；log 比對起日 {since}"
    d.grade = "Warning" if d.items else "OK"
    return d


def raw_status_map():
    out = {}
    for p in RAW.glob("*.md"):
        fm, _ = parse_fm(read(p))
        out[p.stem] = (fm or {}).get("status", "")
    return out


def dim17():
    d = Dim(17, "審查知識層健康")
    raws = raw_status_map()
    for p in sorted((REVIEW / "參考模型").glob("*.md")):
        text = read(p)
        fm, _ = parse_fm(text)
        src = {l for s in as_list((fm or {}).get("source")) for l in LINK.findall(s)}
        body = "\n".join(ln for _, ln in body_lines(text))
        cited = {l for l in LINK.findall(body) if re.match(r"^\d{4}-\d{2}-\d{2}-", l)}
        for name in sorted(src | cited):
            if name not in raws:
                d.add("錯誤", p, f"引用的 raw 卡不存在：[[{name}]]")
            elif raws[name] == "raw":
                d.add("錯誤", p, f"引用的 raw 卡 status 仍是 raw：[[{name}]]")
        for name in sorted(cited - src):
            d.add("錯誤", p, f"正文引用的 raw 卡未列進 source：[[{name}]]")
        for title in ("業界做法", "守恆量"):
            for header, rows in tables(section(text, title, 2)):
                if "出處" not in header:
                    continue
                k = header.index("出處")
                for cells in rows:
                    if k >= len(cells) or "[[" not in cells[k]:
                        d.add("錯誤", p, f"{title}「{cells[0]}」出處沒有 raw 卡連結")
        for header, rows in tables(section(text, "公司偏離", 2)):
            k = next((i for i, h in enumerate(header) if "出處" in h), None)
            if k is None:
                d.add("錯誤", p, "公司偏離段缺出處欄")
                continue
            for cells in rows:
                v = cells[k] if k < len(cells) else ""
                if not re.match(r"^(已定|待裁決)[：:]\s*\S", v):
                    d.add("錯誤", p, f"偏離「{cells[0]}」狀態與出處不是「已定：…」或「待裁決：…」")
    # 誤判案例與評測反例對照
    mis = REVIEW / "稽核誤判記錄.md"
    text = read(mis)
    cases = Counter(parse_date(ln) for ln in section(text, "二、", 2) if ln.startswith("### ") and parse_date(ln))
    rows = Counter()
    for _, trs in tables(section(text, "三、", 2)):
        for cells in trs:
            if cells and parse_date(cells[0]):
                rows[parse_date(cells[0])] += 1
    for day in sorted(set(cases) | set(rows)):
        if cases[day] != rows[day]:
            d.add("錯誤", mis, f"{day} 的誤判案例 {cases[day]} 筆，§ 三評測反例對照 {rows[day]} 列")
    # 評測集路徑存在（只測存在，不讀內容）
    router = read(REVIEW / "審查知識路由.md")
    for ln in router.splitlines():
        if "評測集" in ln:
            for path in re.findall(r"`(memory/[^`]+)`", ln):
                if not (ROOT / path).exists():
                    d.add("警告", REVIEW / "審查知識路由.md", f"評測集路徑不存在：{path}")
    d.grade = "Error" if d.count("錯誤") else ("Warning" if d.count("警告") else "OK")
    return d


# ---------- 主程式 ----------

def main():
    ap = argparse.ArgumentParser(description="vault-audit 機械維度檢查（只讀）")
    ap.add_argument("--dims", default="2,5,6,7,8,9,10,11,17")
    ap.add_argument("--base")
    ap.add_argument("--commit")
    ap.add_argument("--oq-stale-days", type=int)
    args = ap.parse_args()
    want = {int(x) for x in args.dims.split(",") if x.strip()}

    th = thresholds_from_dims_doc()
    enums = schema_enums()
    tags_enum = domain_tags()
    cards = wiki_cards()
    fms = {p: parse_fm(read(p))[0] for p in cards}
    oq_days, oq_src = (args.oq_stale_days, "--oq-stale-days") if args.oq_stale_days is not None else oq_stale_days()
    changed, since = changed_files(args.base, args.commit) if want & {10, 11} else ([], TODAY)

    results = []
    if 2 in want:
        results.append(dim2(cards, fms, th))
    if 5 in want:
        results.append(dim5(cards, th, enums, tags_enum))
    if 6 in want:
        results.append(dim6(cards, th))
    if 7 in want:
        results.append(dim7(cards, fms))
    if 8 in want:
        results.append(dim8(th, enums, oq_days, oq_src))
    if 9 in want:
        results.append(dim9(enums, ingest_thresholds()))
    if 10 in want:
        results.append(dim10(changed))
    if 11 in want:
        results.append(dim11(changed, since))
    if 17 in want:
        results.append(dim17())

    print("vault-audit 機械維度檢查報告")
    print(f"範圍：{rel(WIKI)}、{rel(RAW)}（只讀）；日期 {TODAY}")
    if not th:
        print(f"提醒：讀不到 {rel(DIMS_DOC)} 的門檻表，計數型判定以 0 為上限")
    fail = False
    for d in results:
        print(f"\n## 維度 {d.no} {d.name}：{d.grade}（錯誤 {d.count('錯誤')}、警告 {d.count('警告')}、提醒 {d.count('提醒')}）")
        if d.note:
            print(f"說明：{d.note}")
        for lv, path, msg in d.items:
            print(f"- {lv}｜{path}｜{msg}")
        if d.grade == "Error" or d.count("錯誤"):
            fail = True
    print("\n總計：" + "；".join(f"維度 {d.no} {d.grade}" for d in results))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
