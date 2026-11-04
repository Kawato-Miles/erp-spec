#!/usr/bin/env python3
"""wiki 寫入即檢查（寫檔後掛鉤、提交前掛鉤、vault-audit 共用）。

檢查項代號與意義的正本：memory/erp/wiki-normalization-20261104/掛鉤檢查項.md 定稿後移入
[[卡片撰寫共用規範]] § 四之四。門檻、錯誤等級名單、已完成遷移的領域，讀 references/稽核維度.md § 一。

用法（在 repo 根目錄或任何子目錄執行皆可）：
  python3 wiki_lint.py <檔...>          單卡檢查
  python3 wiki_lint.py --cross <檔...>  單卡＋跨卡檢查
  python3 wiki_lint.py --all            全庫單卡＋跨卡
  python3 wiki_lint.py --staged         提交前：暫存區的 wiki 卡，單卡＋跨卡；並重新產生 ERP 索引清單
  python3 wiki_lint.py --hook           寫檔後：從標準輸入讀 Claude Code PostToolUse 的 JSON
結束碼：有錯誤時，--hook 為 2（退回代理），其他模式為 1；否則 0。
"""
import argparse
import difflib
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mechanical_check as mc  # noqa: E402

ROOT, WIKI, ERP = mc.ROOT, mc.WIKI, mc.ERP
VAULT = mc.VAULT
GLOSSARY = ERP / "ERP 詞彙表.md"
INDUSTRY = WIKI / "跨產品/印刷業共用術語表.md"
OVERVIEW = "ERP 資料結構總覽"
ERP_INDEX = ERP / "00-meta/erp_index.md"
CANON_DIRS = ("03-roles", "04-business-logic", "05-entities", "06-state-machines", "07-scenarios")
LINK = re.compile(r"\[\[([^\]|#\\]+)(#[^\]|\\]+)?(?:\\?\|[^\]]*)?\]\]")
GEN_BEGIN, GEN_END = "<!-- 卡片清單：腳本產生，勿手改 -->", "<!-- 卡片清單結束 -->"

# 單卡規則的預設等級：沿用自既有規範者為錯誤；新規則先警告，經 lint_error_codes 升級
DEFAULT_ERROR = {"S1", "S2", "S4"}


# ---------- 設定 ----------

def config():
    th = mc.thresholds_from_dims_doc()
    lists = {}
    for ln in mc.read(mc.DIMS_DOC).splitlines():
        m = re.match(r"^\|\s*`(lint_[a-z_]+)`\s*\|\s*([^|]*)\|", ln)
        if m:
            lists[m.group(1)] = [v for v in re.split(r"[、,，\s]+", m.group(2).strip()) if v and v != "無"]
    return th, set(lists.get("lint_error_codes", [])) | DEFAULT_ERROR, set(lists.get("lint_done_domains", []))


# ---------- 卡片 ----------

class Card:
    def __init__(self, p):
        self.p = p
        self.text = mc.read(p)
        self.fm, _ = mc.parse_fm(self.text)
        self.fm = self.fm or {}
        self.rel = p.relative_to(WIKI) if WIKI in p.parents else p
        parts = self.rel.parts
        self.name = p.stem
        self.type = self.fm.get("type", "")
        self.archived = mc.is_archived(p)
        self.spec = p.name.startswith(("規範 - ", "範例 - "))
        self.canon = len(parts) > 2 and parts[0] == "erp" and parts[1] in CANON_DIRS and not self.spec
        self.domains = [t.split("/", 1)[1] for t in mc.as_list(self.fm.get("tags")) if t.startswith("領域/")]
        self._body = None

    def body(self):
        """[(行號, 去掉行內程式碼的行)]，略過 frontmatter、程式碼區塊與 HTML 註解。"""
        if self._body is None:
            out, comment = [], False
            for no, ln in mc.body_lines(self.text):
                if "<!--" in ln and "-->" not in ln:
                    comment = True
                if comment:
                    if "-->" in ln:
                        comment = False
                    continue
                ln = re.sub(r"<!--.*?-->", "", ln)
                out.append((no, re.sub(r"`[^`]*`", "", ln)))
            self._body = out
        return self._body

    def headings(self):
        return {re.sub(r"\s+", " ", m.group(2)).strip()
                for _, ln in self.body() for m in [re.match(r"^(#{1,6})\s+(.+?)\s*#*$", ln)] if m}


def all_cards():
    paths = [p for p in VAULT.rglob("*.md") if ".obsidian" not in p.parts]
    return {p: Card(p) for p in paths}


def skip(card):
    """不做單卡檢查的檔：歷史層、骨架、raw、封存。"""
    r = card.rel.parts
    return (card.p.name in ("log.md", "changelog.md") or card.archived or "範本" in r
            or "raw" in card.p.relative_to(VAULT).parts or WIKI not in card.p.parents)


# ---------- 詞彙表 ----------

class Glossary:
    def __init__(self, path):
        self.terms, self.avoid, self.problems = {}, {}, []
        if not path.exists():
            return
        card = Card(path)
        cur, defs, group = None, [], None

        next_is_sub = [False]

        def close():
            if cur is None:
                return
            text = "".join(d.strip() for d in defs)
            n = len([s for s in re.split(r"[。！？]", text) if s.strip()])
            if not text and not next_is_sub[0]:
                self.problems.append((cur[1], f"詞條「{cur[0]}」沒有定義"))
            elif n > 2:
                self.problems.append((cur[1], f"詞條「{cur[0]}」定義超過兩句（{n} 句）"))

        for no, ln in card.body():
            m = re.match(r"^(###|####)\s+(.+?)\s*$", ln)
            if m:
                next_is_sub[0] = m.group(1) == "####"
                close()
                next_is_sub[0] = False
                name = m.group(2).strip()
                if m.group(1) == "###":
                    group = name
                    cur, defs = (name, no), []
                    self.terms[name] = no
                else:
                    cur, defs = (f"{group}#{name}", no), []
                    self.terms[cur[0]] = no
                    self.terms.setdefault(name, no)
                continue
            if re.match(r"^\*\*[^*]+\*\*\s*[:：]", ln):
                self.problems.append((no, "詞條寫成粗體；依 G6 改成三級標題"))
            m = re.match(r"^_(?:Avoid|避免用詞)_\s*[:：]\s*(.+)$", ln.strip())
            if m and cur:
                for w in re.split(r"[、,，]\s*", m.group(1)):
                    w = w.strip()
                    if not w:
                        continue
                    if w in self.avoid and self.avoid[w] != cur[0]:
                        self.problems.append((no, f"避免用詞「{w}」同時列在「{self.avoid[w]}」與「{cur[0]}」"))
                    self.avoid[w] = cur[0]
                continue
            if cur and ln.strip() and not ln.startswith("#"):
                defs.append(ln)
            if ln.startswith("## "):
                close()
                cur = None
        close()
        for w, t in self.avoid.items():
            if w in self.terms:
                self.problems.append((self.terms[w], f"「{w}」同時是詞條與「{t}」的避免用詞"))


# ---------- 報告 ----------

class Report:
    def __init__(self, error_codes):
        self.items, self.error_codes = [], error_codes

    def add(self, code, card_or_path, no, msg, level=None):
        lv = level or ("錯誤" if code in self.error_codes else "警告")
        path = card_or_path.p if isinstance(card_or_path, Card) else card_or_path
        self.items.append((lv, code, mc.rel(path) if isinstance(path, Path) else str(path), no, msg))

    def errors(self):
        return [i for i in self.items if i[0] == "錯誤"]

    def text(self):
        lines = []
        for lv, code, path, no, msg in sorted(self.items, key=lambda i: (i[0] != "錯誤", i[2], i[3] or 0)):
            loc = f"{path}:{no}" if no else path
            lines.append(f"[{lv}] {code} {loc} {msg}")
        e, w = len(self.errors()), len(self.items) - len(self.errors())
        lines.append(f"總計：錯誤 {e}、警告 {w}")
        return "\n".join(lines)


# ---------- 單卡檢查 ----------

F_RULES = [
    ("S2", re.compile(r"同上|見前一條|見前條|見第 ?[0-9一二三四五六七八九十]+ ?條|前[一二三四五]條|如前所述|如上所述"), "相對引用"),
    ("S2", re.compile(r"第 ?[0-9]+ ?行|[^A-Za-z0-9]L[0-9]+(-[0-9]+)?([^0-9A-Za-z]|$)"), "行號引用"),
    ("S2", re.compile(r"们|这|为|么|时|说|对|与|还|过|发|开|关|电|动|产|业|应|经|会|体|来|国|问|题|实|际|节|计|让|显"), "簡體字"),
    ("S2", re.compile(r"[一二三四五六七八九十0-9]+ ?(必含段|種內容不|個維度|條紀律|項檢查)"), "寫死數量的名稱"),
    ("S3", re.compile(r"取此數|供[^。|]{0,10}(取用|引用)|下游[^。|]{0,8}(取用|引用|用它)"), "下游使用句"),
]
CARD = re.compile(r"(?<![0-9A-Za-z])(1|N|M)\s*[:：]\s*(1|N|M)(?![0-9A-Za-z])")
RULE_SIGNAL = re.compile(r"[≥≤≠]|>=|<=|[0-9]+ ?(天|日|%|張|份)以[上下內]")
SOURCE_OK = re.compile(r"^(Miles |\d{4}-\d{2}-\d{2}|訪談|既有介面|後端|現行|change |Sens |memory/|\[\[|拆自 )")


def check_card(card, ctx, rep):
    if skip(card):
        return
    # S1、S4：沿用 vault-audit 維度 5、6（只取錯誤與警告）
    for d in (mc.dim5([card.p], {}, ctx["enums"], ctx["tags"]), mc.dim6([card.p], {})):
        for lv, _, msg in d.items:
            if lv in ("錯誤", "警告"):
                rep.add("S1" if d.no == 5 else "S4", card, None, msg, level=lv)
    body = card.body()
    parts = card.rel.parts
    f_scope = len(parts) > 2 and parts[0] == "erp" and re.match(r"0[3-8]", parts[1]) and not card.spec
    for no, ln in body:
        for code, rx, label in F_RULES:
            if not f_scope:
                continue
            if rx.search(ln):
                rep.add(code, card, no, f"{label}：{ln.strip()[:50]}")
    # S2 F5：source 重複
    src = mc.as_list(card.fm.get("source"))
    for s in {x for x in src if src.count(x) > 1}:
        rep.add("S2", card, None, f"source 重複：{s[:40]}")
    # S5、S6：連結
    for no, ln in body:
        for m in LINK.finditer(ln):
            tgt, anchor = m.group(1).strip(), (m.group(2) or "")[1:].strip()
            if not tgt or tgt.startswith(("http", "#")):
                continue
            target = ctx["by_name"].get(Path(tgt).name)
            if target is None:
                rep.add("S5", card, no, f"連結對象不存在：[[{tgt}]]")
                continue
            if anchor and not anchor.startswith("^"):
                want = re.sub(r"\s+", " ", anchor.split("#")[-1]).strip()
                if want not in target.headings():
                    rep.add("S5", card, no, f"[[{tgt}#{anchor}]] 的標題不存在，點了只會到卡片開頭")
            if card.canon and target.archived:
                rep.add("S6", card, no, f"正本卡連到封存卡 [[{tgt}]]")
    # S7、S8：用詞
    g = ctx["glossary"]
    is_gloss = card.p in (GLOSSARY, INDUSTRY)
    if g.avoid and not is_gloss and not card.spec:
        done = bool(set(card.domains) & ctx["done"])
        for no, ln in body:
            plain = LINK.sub(lambda m: "", ln)
            for w, t in g.avoid.items():
                if w in plain:
                    rep.add("S7", card, no, f"避免用詞「{w}」，改用「{t}」",
                            level="錯誤" if done or "S7" in rep.error_codes else "警告")
    if g.terms and not is_gloss and card.canon:
        for no, ln in body:
            s = re.sub(r"^\s*[-*|]\s*", "", ln)
            for t in g.terms:
                if re.match(re.escape(t) + r"\s*(是|指|即|為)(?!否)", s):
                    rep.add("S8", card, no, f"疑似「{t}」的定義句；定義只寫在詞彙表")
    # S11：基數只在全系統總覽卡
    if card.name != OVERVIEW and not card.spec and WIKI in card.p.parents:
        for no, ln in body:
            if CARD.search(ln):
                rep.add("S11", card, no, "關聯基數寫在全系統總覽卡以外")
    # S12：規則句訊號只在規則卡、狀態機卡（實體卡算式欄另有規範）
    if card.canon and card.type not in ("business-rule", "state-machine", "entity", "rule-group"):
        for no, ln in body:
            if RULE_SIGNAL.search(ln):
                rep.add("S12", card, no, f"規則句訊號出現在{card.type or '此'}卡：{ln.strip()[:50]}")
    # S13：營運規則卡至少連到一個實體或狀態機
    if card.type == "business-rule" and card.fm.get("mutability") == "internal" and card.canon:
        linked = {ctx["by_name"].get(m.group(1).strip()) for _, ln in body for m in LINK.finditer(ln)}
        if not any(c and c.type in ("entity", "state-machine") for c in linked):
            rep.add("S13", card, None, "規則卡沒有連到任何實體或狀態機，拆解後接不回去")
    # S14：詞彙表格式
    if card.p == GLOSSARY:
        for no, msg in g.problems:
            rep.add("S14", card, no, msg)
    # S15：source 只留出處指標
    if card.canon:
        for s in src:
            bad = re.search(r"同上|如上", s) or re.search(r"[）)]\s*[：:]\s*\S", s) or len(s) > ctx["th"].get("source_max_chars", 120)
            short_basis = len(s) <= 30 and not re.search(r"[：:]", s)
            if bad or not (SOURCE_OK.search(s) or short_basis):
                rep.add("S15", card, None, f"source 不是純出處指標：{s[:50]}")
    # S9、S10：重複句
    dup_sentences(card, ctx, rep)
    # S3 F6：本分支新增的守衛、提示、預設
    if card.canon:
        diff = mc.git("diff", "-U0", "origin/master", "--", mc.rel(card.p)) or ""
        for ln in diff.splitlines():
            if ln.startswith("+") and not ln.startswith("+++") and re.search(
                    r"擋下|阻擋|不得建立|不可建立|提示|提醒|通知|警示|預設帶入|自動帶入|上限|下限|取整|四捨五入", ln):
                rep.add("S3", card, None, f"新增句含守衛、提示或預設，需對應拍板：{ln[1:].strip()[:50]}")


def sentences(card):
    out = []
    for no, ln in card.body():
        if ln.lstrip().startswith("#") or re.match(r"^\s*\|?\s*:?-{2,}", ln):
            continue
        for cell in re.split(r"\|", ln):
            for s in re.split(r"[。；！？]", LINK.sub(lambda m: m.group(1), cell)):
                s = re.sub(r"<br>|\s+", "", s).strip("-*>：:、，0123456789.")
                if s:
                    out.append((no, s))
    return out


def grams(s, n=4):
    return {s[i:i + n] for i in range(max(1, len(s) - n + 1))}


def corpus(ctx):
    if "corpus" not in ctx:
        idx, store = defaultdict(set), []
        minc = ctx["th"].get("dup_sentence_min_chars", 30)
        for c in ctx["cards"].values():
            if not c.canon or c.archived:
                continue
            for no, s in sentences(c):
                if len(s) >= minc:
                    sid = len(store)
                    store.append((c, no, s))
                    for gm in grams(s):
                        idx[gm].add(sid)
        ctx["corpus"] = (idx, store)
    return ctx["corpus"]


def dup_sentences(card, ctx, rep):
    if not card.canon:
        return
    idx, store = corpus(ctx)
    minc = ctx["th"].get("dup_sentence_min_chars", 30)
    ratio = ctx["th"].get("similar_percent", 85) / 100
    keys = ctx.setdefault("keyrx", re.compile("|".join(sorted((re.escape(n) for n in ctx["by_name"] if len(n) > 1),
                                                                  key=len, reverse=True))))
    for no, s in sentences(card):
        if len(s) < minc or len(re.sub(r"[、，,/／\s]", "", keys.sub("", s))) < minc // 2:
            continue
        gs = grams(s)
        hits = defaultdict(int)
        for gm in gs:
            for sid in idx.get(gm, ()):
                hits[sid] += 1
        same, near = set(), set()
        for sid, n in hits.items():
            other, ono, os_ = store[sid]
            if other.p == card.p or n / max(len(gs), 1) < ratio * 0.6:
                continue
            if os_ == s:
                same.add(other.name)
            elif difflib.SequenceMatcher(None, s, os_).ratio() >= ratio:
                near.add(f"{other.name}:{ono}")
        if same:
            rep.add("S9", card, no, f"與 {len(same)} 張卡逐字相同（{'、'.join(sorted(same)[:3])}）：{s[:40]}")
        elif near:
            rep.add("S10", card, no, f"與 {'、'.join(sorted(near)[:3])} 高度相似，判讀是否重複：{s[:40]}", level="警告")


# ---------- 跨卡檢查 ----------

def check_cross(ctx, rep, changed):
    cards = ctx["cards"]
    # X3：卡名唯一
    names = defaultdict(list)
    for c in cards.values():
        if WIKI in c.p.parents and "範本" not in c.rel.parts:
            names[c.name].append(c)
    for n, cs in names.items():
        if len(cs) > 1:
            rep.add("X3", cs[0], None, "卡名重複：" + "、".join(mc.rel(c.p) for c in cs), level="錯誤")
    g = ctx["glossary"]
    # X4：已完成遷移的領域，實體與角色都有詞條
    if g.terms:
        for c in cards.values():
            if c.canon and c.type in ("entity", "role") and set(c.domains) & ctx["done"] and c.name not in g.terms:
                rep.add("X4", c, None, f"詞彙表沒有「{c.name}」詞條（詞條名要與卡名逐字相同）", level="錯誤")
    # X5：避免用詞不重疊（詞彙表解析時已檢出）
    for no, msg in g.problems:
        if "同時" in msg:
            rep.add("X5", GLOSSARY, no, msg, level="錯誤")
    # X6：分類框架觸發詞不含避免用詞
    for no, ln in mc.body_lines(mc.read(mc.TAXONOMY)):
        if ln.startswith("**觸發詞**"):
            for w in re.split(r"[、，,：:\s]+", ln):
                if w in g.avoid:
                    rep.add("X6", mc.TAXONOMY, no, f"觸發詞「{w}」是避免用詞，改「{g.avoid[w]}」", level="錯誤")
    # X2：規則組資料夾成員與索引卡清單一致
    for c in cards.values():
        if c.type == "rule-group" and c.canon and not c.archived:
            listed = {m.group(1).strip() for ln in mc.section(c.text, "規則清單", 2) for m in LINK.finditer(ln)}
            members = {p.stem for p in c.p.parent.glob("*.md") if p != c.p}
            for x in sorted(members - listed):
                rep.add("X2", c, None, f"資料夾內的「{x}」沒列在索引卡", level="錯誤")
            for x in sorted(m for m in listed - members if cards_by(ctx, m) and cards_by(ctx, m).type == "business-rule"
                            and cards_by(ctx, m).p.parent != c.p.parent):
                rep.add("X2", c, None, f"索引卡列的「{x}」不在本資料夾", level="錯誤")
    # X8：新卡至少被一張卡連到
    inbound = defaultdict(int)
    for c in cards.values():
        if WIKI in c.p.parents and not c.archived:
            for _, ln in c.body():
                for m in LINK.finditer(ln):
                    if m.group(1).strip() != c.name:
                        inbound[m.group(1).strip()] += 1
    added = set((mc.git("diff", "--cached", "--name-only", "--diff-filter=A") or "").splitlines())
    for c in changed:
        if c.canon and mc.rel(c.p) in added and inbound[c.name] == 0:
            rep.add("X8", c, None, "新卡沒有被任何卡連到（孤島）", level="錯誤")
    # X7：log 條目
    since = mc.TODAY
    for lv, path, msg in mc.dim11([c.p for c in changed], since).items:
        rep.add("X7", path, None, msg, level="警告")
    # X9：權責結構
    if any(c.type in ("activity-list", "entity", "controlled-list", "state-machine", "scenario") for c in changed):
        r = subprocess.run([sys.executable, str(Path(__file__).parent / "authority_check.py")],
                           cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            tail = [ln for ln in r.stdout.splitlines() if ln.strip()][-3:]
            rep.add("X9", "authority_check.py", None, "權責結構檢查未通過：" + " / ".join(tail), level="錯誤")


def keep(item, touched):
    """只回報本次寫入的行；整張卡層級的項目在動到卡頭時回報。跨卡檢查一律回報。"""
    lv, code, path, no, msg = item
    p = ROOT / path
    if code.startswith("X") or p not in touched:
        return True
    lines = touched[p]
    if no:
        return no in lines
    fm_end = next((i + 1 for i, ln in enumerate(mc.read(p).splitlines()[1:], 1) if ln.strip() == "---"), 0)
    return any(n <= fm_end for n in lines)


def cards_by(ctx, name):
    return ctx["by_name"].get(name)


def regenerate_index(ctx):
    """X1：ERP 索引卡片清單，依目錄與卡型產生；索引卡沒有標記區段時不動。"""
    text = mc.read(ERP_INDEX)
    if GEN_BEGIN not in text or GEN_END not in text:
        return False
    groups = defaultdict(list)
    for c in ctx["cards"].values():
        if c.canon and not c.archived and c.type:
            groups[(c.rel.parts[1], c.type)].append(c.name)
    lines = []
    for (d, t), ns in sorted(groups.items()):
        lines.append(f"- {d}／{t}：" + " / ".join(f"[[{n}]]" for n in sorted(ns)))
    new = text.split(GEN_BEGIN)[0] + GEN_BEGIN + "\n" + "\n".join(lines) + "\n" + GEN_END + text.split(GEN_END, 1)[1]
    if new != text:
        ERP_INDEX.write_text(new, encoding="utf-8")
        subprocess.run(["git", "add", mc.rel(ERP_INDEX)], cwd=ROOT)
        return True
    return False


# ---------- 主程式 ----------

def build_ctx():
    th, err_codes, done = config()
    cards = all_cards()
    by_name = {}
    for c in cards.values():
        if c.name not in by_name or (by_name[c.name].archived and not c.archived):
            by_name[c.name] = c
    return {"th": th, "errors": err_codes, "done": done, "cards": cards, "by_name": by_name,
            "glossary": Glossary(GLOSSARY), "enums": mc.schema_enums(), "tags": mc.domain_tags()}


def main():
    ap = argparse.ArgumentParser(description="wiki 寫入即檢查")
    ap.add_argument("files", nargs="*")
    ap.add_argument("--cross", action="store_true")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--staged", action="store_true")
    ap.add_argument("--hook", action="store_true")
    a = ap.parse_args()
    touched = {}  # 檔 → 本次寫入的行號；沒有登記的檔整張檢查

    if a.hook:
        try:
            data = json.load(sys.stdin)
        except ValueError:
            return 0
        fp = (data.get("tool_input") or {}).get("file_path") or ""
        p = Path(fp).resolve() if fp else None
        if not p or p.suffix != ".md" or WIKI.resolve() not in p.parents:
            return 0
        a.files = [str(p)]
        ti = data.get("tool_input") or {}
        if data.get("tool_name") != "Write":
            news = [ti.get("new_string", "")] + [e.get("new_string", "") for e in ti.get("edits") or []]
            text = mc.read(p).splitlines()
            want = {ln.strip() for n in news for ln in n.splitlines() if ln.strip()}
            scope = {i + 1 for i, ln in enumerate(text) if ln.strip() in want}
            touched[p] = scope

    ctx = build_ctx()
    rep = Report(ctx["errors"])
    if a.all:
        targets = [c for c in ctx["cards"].values() if WIKI in c.p.parents]
    elif a.staged:
        names = (mc.git("diff", "--cached", "--name-only", "--diff-filter=ACMR") or "").splitlines()
        targets = [ctx["cards"][ROOT / n] for n in names
                   if n.startswith("memory/Sens_wiki/wiki/") and n.endswith(".md") and (ROOT / n) in ctx["cards"]]
        if not targets:
            return 0
        for c in targets:
            if mc.git("cat-file", "-e", f"HEAD:{mc.rel(c.p)}") is not None:
                diff = mc.git("diff", "--cached", "-U0", "--", mc.rel(c.p)) or ""
                lines = set()
                for m in re.finditer(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@", diff, re.M):
                    start, n = int(m.group(1)), int(m.group(2) or 1)
                    lines.update(range(start, start + n))
                touched[c.p] = lines
    else:
        targets = []
        for f in a.files:
            p = Path(f).resolve()
            targets.append(ctx["cards"].get(p) or Card(p))
    for c in targets:
        check_card(c, ctx, rep)
    if a.cross or a.all or a.staged:
        check_cross(ctx, rep, targets)
    if a.staged:
        regenerate_index(ctx)

    rep.items = [i for i in rep.items if keep(i, touched)]
    out = rep.text()
    if a.hook:
        if rep.errors():
            print("wiki 寫入檢查發現錯誤，請修正後再繼續：\n" + out, file=sys.stderr)
            return 2
        if rep.items:
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse",
                              "additionalContext": "wiki 寫入檢查的警告，逐筆判讀並在回報附處置：\n" + out}},
                             ensure_ascii=False))
        return 0
    print(out)
    return 1 if rep.errors() else 0


if __name__ == "__main__":
    sys.exit(main())
