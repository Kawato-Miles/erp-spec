#!/usr/bin/env python3
"""wiki 權責結構檢查（只讀）。

檢查活動清單卡、實體卡操作段、狀態機觸發操作欄、情境卡活動欄的格式與關聯。
規則正本：規範 - 活動清單／規範 - 實體／規範 - 狀態機／規範 - 業務情境／wiki-schema § 七／受控清單。
只檢查已轉成新結構的卡；舊結構卡略過並計數。

用法：python3 authority_check.py [wiki 根目錄]
結束碼：有錯誤為 1，否則為 0。
"""
import re
import sys
from pathlib import Path

LINK = re.compile(r"\[\[([^\]|#\\]+)(?:[#|\\][^\]]*)?\]\]")
OP_ID = re.compile(r"OP-[A-Z]+-\d+")
ACT_ID = re.compile(r"ACT-[A-Z]+-\d+")
OP_FMT = re.compile(r"^OP-([A-Z]{2,4})-(\d{3})$")
ACT_FMT = re.compile(r"^ACT-([A-Z]{2,4})-(\d{3})$")
OP_REF = re.compile(r"^\[\[([^\]|#]+)\]\]\s*(OP-[A-Z]+-\d+)\s+(.+)$")
ACT_HEADER = ["活動編號", "活動", "執行角色", "範圍", "依據欄位", "操作"]
SHARED_SCOPES = {"被分享（檢視）", "被分享（編輯）"}
ACTOR_VERBS = "輸入|填|按|改|建|執行|確認|送|點收|點|選|上傳|手動|自行|回報|核准|核可|退回|可改|可編輯|可修改|可做|可建|負責填|操作"

errors, warnings, notes = [], [], []


def err(f, msg, row=""):
    errors.append((f, msg, row))


def warn(f, msg, row=""):
    warnings.append((f, msg, row))


def note(f, msg, row=""):
    notes.append((f, msg, row))


def split_row(line):
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|") and not s.endswith("\\|"):
        s = s[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", s)]


def is_sep(cells):
    return all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c) and any(cells)


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    fm = {}
    if m:
        for ln in m.group(1).splitlines():
            mm = re.match(r"^([\w-]+):\s*(.*)$", ln)
            if mm:
                fm[mm.group(1)] = mm.group(2).strip().strip('"')
    return fm


def sections(text):
    """回傳 [(標題層級, 標題, 起始行號, 行列表)]，以 ## 為切分。"""
    out, cur, title, start = [], [], None, 0
    for i, ln in enumerate(text.splitlines()):
        if ln.startswith("## "):
            if title is not None or cur:
                out.append((title, start, cur))
            title, start, cur = ln[3:].strip(), i, []
        else:
            cur.append(ln)
    out.append((title, start, cur))
    return out


def tables(lines):
    """從行列表抽出表格：[(header, [(row_cells, raw_line)])]。"""
    out, i = [], 0
    while i < len(lines):
        if lines[i].lstrip().startswith("|") and i + 1 < len(lines) and is_sep(split_row(lines[i + 1])):
            header = split_row(lines[i])
            rows, j = [], i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                rows.append((split_row(lines[j]), lines[j].strip()))
                j += 1
            out.append((header, rows))
            i = j
        else:
            i += 1
    return out


def links(s):
    return [m.group(1).strip() for m in LINK.finditer(s)]


def main():
    here = Path(__file__).resolve()
    default = here.parents[4] / "memory" / "Sens_wiki" / "wiki"
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else default
    erp = root / "erp"
    if not erp.is_dir():
        print(f"找不到 wiki 的 erp 目錄：{erp}")
        return 2

    files = {}
    for p in root.rglob("*.md"):
        files.setdefault(p.stem, p)
    texts = {p: p.read_text(encoding="utf-8") for p in erp.rglob("*.md")}

    def rel(p):
        return str(p.relative_to(root))

    def by_type(t, sub):
        return [p for p, tx in texts.items()
                if p.is_relative_to(erp / sub) and frontmatter(tx).get("type") == t]

    # ---------- 受控清單 ----------
    cl = [p for p, tx in texts.items() if frontmatter(tx).get("type") == "controlled-list"]
    if not cl:
        print("找不到受控清單卡（type: controlled-list）")
        return 2
    cl_path = cl[0]
    scopes, action_types, doc_codes, list_codes = set(), set(), {}, {}
    for title, _, lines in sections(texts[cl_path]):
        # 以 ### 子段切表
        block, cur = {}, None
        for ln in lines:
            if ln.startswith("### "):
                cur = ln[4:].strip()
                block[cur] = []
            elif cur:
                block[cur].append(ln)
        for name, blines in block.items():
            for header, rows in tables(blines):
                for cells, _ in rows:
                    if not cells or not cells[0]:
                        continue
                    if name == "範圍用詞":
                        scopes.add(cells[0])
                    elif name == "動作類型":
                        action_types.add(cells[0])
                    elif name == "單據代碼":
                        lk = links(cells[1]) if len(cells) > 1 else []
                        doc_codes[cells[0]] = lk[0] if lk else ""
                    elif name == "活動清單代碼":
                        lk = links(cells[1]) if len(cells) > 1 else []
                        list_codes[cells[0]] = lk[0] if lk else ""

    # ---------- 角色 ----------
    roles = {p.stem for p in by_type("role", "03-roles")}

    # ---------- 作廢編號（log 中「移除 X（編號不回收）」）----------
    retired, retired_parsed = set(), False
    log_path = root / "log.md"
    if log_path.exists():
        for ln in log_path.read_text(encoding="utf-8").splitlines():
            if "不回收" in ln:
                for m in re.finditer(r"移除\s*((?:OP|ACT)-[A-Z]+-\d{3})", ln):
                    retired.add(m.group(1))
                    retired_parsed = True
    if not retired_parsed:
        note(rel(log_path) if log_path.exists() else "log.md",
             "解析不到「移除〈編號〉…不回收」的作廢紀錄，作廢編號重用檢查略過")

    # ---------- 實體卡 ----------
    skipped = {"實體卡": 0, "狀態機卡": 0, "情境卡": 0}
    entities = {}  # 卡名 -> {"ops": {id: name}, "fields": set, "path": p}
    for p in by_type("entity", "05-entities"):
        secs = sections(texts[p])
        op_sec = [s for s in secs if s[0] == "操作"]
        if not op_sec:
            skipped["實體卡"] += 1
            continue
        fields = set()
        for title, _, lines in secs:
            for header, rows in tables(lines):
                if header and header[0] == "介面欄位":
                    fields.update(c[0] for c, _ in rows if c and c[0])
        ops = {}
        _, _, lines = op_sec[0]
        tbs = tables(lines)
        if not tbs or tbs[0][0][:3] != ["操作編號", "操作", "動作類型"]:
            err(rel(p), "操作段沒有固定欄位表（操作編號｜操作｜動作類型）")
        else:
            for cells, raw in tbs[0][1]:
                if len(cells) < 3 or not all(cells[:3]):
                    err(rel(p), "操作表有空格", raw)
                    continue
                oid, oname, otype = cells[:3]
                m = OP_FMT.match(oid)
                if not m:
                    err(rel(p), f"操作編號格式不符 OP-<代碼>-<三位流水號>：{oid}", raw)
                elif m.group(1) not in doc_codes:
                    err(rel(p), f"單據代碼 {m.group(1)} 不在受控清單", raw)
                elif doc_codes[m.group(1)] != p.stem:
                    err(rel(p), f"單據代碼 {m.group(1)} 在受控清單登記為 [[{doc_codes[m.group(1)]}]]，不是本卡", raw)
                if oid in ops:
                    err(rel(p), f"操作編號卡內重複：{oid}", raw)
                if oid in retired:
                    err(rel(p), f"重用已作廢的操作編號：{oid}", raw)
                if otype not in action_types:
                    err(rel(p), f"動作類型不在受控清單：{otype}", raw)
                ops[oid] = oname
        if not any(ln.startswith("無操作的動作類型") or ln.startswith("本實體無使用者發起的操作") for ln in lines):
            err(rel(p), "操作表下缺「無操作的動作類型」行")
        entities[p.stem] = {"ops": ops, "fields": fields, "path": p}

    referenced_ops = set()

    def resolve_op(cell, f, raw, ctx):
        m = OP_REF.match(cell)
        if not m:
            err(f, f"{ctx}格式不符「[[實體卡]] OP-xxx 名稱」：{cell}", raw)
            return
        ent, oid, oname = m.group(1).strip(), m.group(2), m.group(3).strip()
        if ent not in entities:
            if ent in files:
                err(f, f"{ctx}指向的 [[{ent}]] 沒有操作段", raw)
            else:
                err(f, f"{ctx}指向不存在的卡 [[{ent}]]", raw)
            return
        ops = entities[ent]["ops"]
        if oid not in ops:
            err(f, f"{ctx} {oid} 不存在於 [[{ent}]] 操作段", raw)
        elif ops[oid] != oname:
            err(f, f"{ctx} {oid} 名稱不一致：寫「{oname}」，實體卡為「{ops[oid]}」", raw)
        else:
            referenced_ops.add((ent, oid))

    # ---------- 活動清單卡 ----------
    activities = {}  # ACT id -> (卡名, 活動名)
    act_paths = by_type("activity-list", "04-business-logic")
    for p in act_paths:
        f = rel(p)
        tbs = [t for t in tables(texts[p].splitlines()) if t[0] and t[0][0] == "活動編號"]
        if not tbs:
            err(f, "找不到活動表")
            continue
        for header, rows in tbs:
            if header != ACT_HEADER:
                err(f, f"活動表欄位不符，應為「{'｜'.join(ACT_HEADER)}」，實為「{'｜'.join(header)}」")
                continue
            for cells, raw in rows:
                if len(cells) != 6 or not all(cells):
                    err(f, "活動表有空格或欄數不符", raw)
                    if len(cells) >= 2 and cells[0] and cells[0] not in activities:
                        activities[cells[0]] = (p.stem, cells[1])  # 仍登記，避免情境卡連帶誤報
                    continue
                aid, aname, actors, scope, basis, op = cells
                m = ACT_FMT.match(aid)
                if not m:
                    err(f, f"活動編號格式不符 ACT-<代碼>-<三位流水號>：{aid}", raw)
                elif m.group(1) not in list_codes:
                    err(f, f"活動清單代碼 {m.group(1)} 不在受控清單", raw)
                elif list_codes[m.group(1)] != p.stem:
                    err(f, f"活動清單代碼 {m.group(1)} 在受控清單登記為 [[{list_codes[m.group(1)]}]]，不是本卡", raw)
                if aid in activities:
                    err(f, f"活動編號全庫重複：{aid}（另見 [[{activities[aid][0]}]]）", raw)
                if aid in retired:
                    err(f, f"重用已作廢的活動編號：{aid}", raw)
                activities[aid] = (p.stem, aname)
                # 範圍
                if scope not in scopes:
                    err(f, f"範圍不在受控清單：{scope}", raw)
                # 執行角色
                if actors == "所有角色":
                    if scope not in SHARED_SCOPES:
                        err(f, "「所有角色」只能用於被分享範圍", raw)
                else:
                    parts = [x.strip() for x in actors.split("、")]
                    for part in parts:
                        lk = re.fullmatch(r"\[\[([^\]|#]+)\]\]", part)
                        if not lk:
                            err(f, f"執行角色不是角色卡 wiki link：{part}", raw)
                        elif lk.group(1) not in roles:
                            err(f, f"執行角色 [[{lk.group(1)}]] 不是 03-roles 的角色卡", raw)
                # 依據欄位
                if scope == "全公司":
                    if basis != "—":
                        err(f, f"範圍為全公司時依據欄位應填「—」：{basis}", raw)
                elif scope in scopes:
                    bm = re.fullmatch(r"\[\[([^\]|#]+)\]\]\s*(.+)", basis)
                    if not bm:
                        err(f, f"依據欄位格式不符「[[單據]] 欄位」：{basis}", raw)
                    else:
                        ent, fld = bm.group(1).strip(), bm.group(2).strip()
                        if scope in SHARED_SCOPES:
                            if fld != "分享成員":
                                err(f, f"被分享範圍的依據欄位應為「[[單據]] 分享成員」：{basis}", raw)
                        elif ent not in files:
                            err(f, f"依據欄位指向不存在的卡 [[{ent}]]", raw)
                        elif ent in entities:
                            if fld not in entities[ent]["fields"]:
                                err(f, f"依據欄位「{fld}」不在 [[{ent}]] 欄位表", raw)
                        else:
                            warn(f, f"依據欄位指向的 [[{ent}]] 不是新結構實體卡，欄位存在性未檢查", raw)
                # 操作
                resolve_op(op, f, raw, "操作欄")

    # ---------- 狀態機卡 ----------
    sm_new = []
    for p in by_type("state-machine", "06-state-machines"):
        f = rel(p)
        tbs = [t for t in tables(texts[p].splitlines()) if "觸發操作" in t[0]]
        if not tbs:
            skipped["狀態機卡"] += 1
            continue
        sm_new.append(p)
        for header, rows in tbs:
            k = header.index("觸發操作")
            for cells, raw in rows:
                cell = cells[k] if k < len(cells) else ""
                if not cell:
                    err(f, "觸發操作欄留白", raw)
                    continue
                for part in re.split(r"、(?=\[\[|系統：)", cell):
                    part = part.strip()
                    if part.startswith("系統："):
                        continue
                    resolve_op(part, f, raw, "觸發操作")

    # ---------- 情境卡 ----------
    sc_new = []
    for p in by_type("scenario", "07-scenarios"):
        f = rel(p)
        tbs = [t for t in tables(texts[p].splitlines())
               if t[0][:2] == ["步驟", "活動"] or (len(t[0]) >= 3 and t[0][0] == "分支點" and t[0][2] == "改走活動")]
        if not tbs:
            skipped["情境卡"] += 1
            continue
        sc_new.append(p)
        for header, rows in tbs:
            k = 1 if header[0] == "步驟" else 2
            for cells, raw in rows:
                cell = cells[k] if k < len(cells) else ""
                if not cell:
                    err(f, "活動欄留白", raw)
                    continue
                refs = list(re.finditer(r"\[\[([^\]|#]+)\]\]\s*(ACT-[A-Z]+-\d+)\s*", cell))
                bare = set(ACT_ID.findall(cell)) - {r.group(2) for r in refs}
                for b in bare:
                    err(f, f"活動編號未附活動清單卡連結：{b}", raw)
                for r in refs:
                    card, aid = r.group(1).strip(), r.group(2)
                    rest = cell[r.end():]
                    if aid not in activities:
                        err(f, f"活動 {aid} 不存在於任何活動清單卡", raw)
                    elif activities[aid][0] != card:
                        err(f, f"活動 {aid} 登記在 [[{activities[aid][0]}]]，不是 [[{card}]]", raw)
                    elif not rest.startswith(activities[aid][1]):
                        err(f, f"活動 {aid} 名稱不一致：活動清單卡為「{activities[aid][1]}」", raw)
                if not refs and not bare and not re.match(r"^(系統事件|外部事件)：", cell):
                    warn(f, "活動欄沒有活動編號，也不是系統事件或外部事件開頭（請人工確認是否為「同主流程／同他卡第 N 步」的轉引）", raw)

    # ---------- 覆蓋 ----------
    for ent, info in entities.items():
        for oid, oname in info["ops"].items():
            if (ent, oid) not in referenced_ops:
                warn(rel(info["path"]), f"操作 {oid} {oname} 沒有被任何活動或狀態機觸發操作引用")

    # ---------- 殘留角色名 ----------
    role_pat = re.compile(r"(?:\[\[)?(" + "|".join(sorted(map(re.escape, roles), key=len, reverse=True)) + r")(?:\]\])?(?:" + ACTOR_VERBS + ")") if roles else None

    def scan_roles(f, rows):
        if not role_pat:
            return
        for raw in rows:
            hits = sorted({m.group(1) for m in role_pat.finditer(raw)})
            if hits:
                warn(f, f"疑似以角色名當執行者：{'、'.join(hits)}", raw)

    for ent, info in entities.items():
        rows = []
        for _, _, lines in sections(texts[info["path"]]):
            for header, trows in tables(lines):
                if header and header[0] in ("介面欄位", "操作編號"):
                    rows += [raw for _, raw in trows]
        scan_roles(rel(info["path"]), rows)
    for p in sm_new:
        rows = []
        for header, trows in tables(texts[p].splitlines()):
            if "觸發操作" in header:
                rows += [raw for _, raw in trows]
        scan_roles(rel(p), rows)
    for p in sc_new:
        rows = []
        for header, trows in tables(texts[p].splitlines()):
            if header[:2] == ["步驟", "活動"] or (header and header[0] == "分支點"):
                rows += [raw for _, raw in trows]
        scan_roles(rel(p), rows)

    # ---------- 未解問題 ----------
    oq_dir = erp / "08-open-questions"
    open_oq = {p.stem for p in oq_dir.glob("*.md") if frontmatter(texts.get(p, "")).get("status") == "open"}
    for p in act_paths + [i["path"] for i in entities.values()] + sm_new:
        hit = sorted(set(links(texts[p])) & open_oq)
        for h in hit:
            note(rel(p), f"連結到未結案問題 [[{h}]]")

    # ---------- 報告 ----------
    print("wiki 權責結構檢查報告")
    print(f"wiki 根目錄：{root}")
    print(f"檢查範圍：活動清單卡 {len(act_paths)} 張、實體卡（有操作段）{len(entities)} 張、"
          f"狀態機卡（有觸發操作欄）{len(sm_new)} 張、情境卡（有活動欄）{len(sc_new)} 張")
    print(f"略過舊結構卡：實體卡 {skipped['實體卡']} 張、狀態機卡 {skipped['狀態機卡']} 張、情境卡 {skipped['情境卡']} 張")
    for title, items in (("錯誤", errors), ("警告", warnings), ("提醒", notes)):
        print(f"\n## {title}（{len(items)}）")
        if not items:
            print("（無）")
        for f, msg, row in items:
            print(f"- {f}：{msg}")
            if row:
                print(f"    列內容：{row}")
    print(f"\n總計：錯誤 {len(errors)} 筆、警告 {len(warnings)} 筆、提醒 {len(notes)} 筆")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
