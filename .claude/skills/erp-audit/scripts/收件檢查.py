#!/usr/bin/env python3
"""erp-audit 收件檢查（只讀）。

檢查 change 資料夾是否可送稽核：
- design.md 存在，且有必含段的段標題；段名於執行時從評分準則卡 § 二讀取，不寫死。
- 必含段④的段內有「隱含假設」清單（條列或至少一列資料的表格）。
- 必含段⑥首輪可寫「待稽核比對」，只提醒不算缺。
- grill.md 存在，且有拍板紀錄（標題或表頭含「拍板」）。
規則正本：規劃品質評分準則 § 二。

用法：python3 收件檢查.py <change 資料夾> [評分準則卡路徑]
結束碼：有缺項為 1，全部通過為 0。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CRITERIA = ROOT / "memory/Sens_wiki/wiki/erp/11-review-knowledge/規劃品質評分準則.md"
MARKERS = "①②③④⑤⑥⑦⑧⑨⑩"
HEADING = re.compile(r"^(#{1,6})\s+(.*)$")

passes, misses, notes = [], [], []


def split_row(line):
    s = line.strip().strip("|")
    return [c.strip() for c in re.split(r"(?<!\\)\|", s)]


def is_sep(line):
    cells = split_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c)


def headings(text):
    """回傳 (行號, 層級, 標題文字)；略過程式碼區塊內的行。"""
    out, fence = [], False
    for i, ln in enumerate(text.splitlines()):
        if ln.lstrip().startswith("```"):
            fence = not fence
            continue
        m = HEADING.match(ln)
        if m and not fence:
            out.append((i, len(m.group(1)), m.group(2).strip()))
    return out


def section_body(text, start, level):
    lines = text.splitlines()
    body = []
    for ln in lines[start + 1:]:
        m = HEADING.match(ln)
        if m and len(m.group(1)) <= level:
            break
        body.append(ln)
    return body


def required_sections(criteria_text):
    """從評分準則卡 § 二表格讀必含段：[(標記, 段名)]。"""
    lines = criteria_text.splitlines()
    out, inside = [], False
    for ln in lines:
        if ln.startswith("## "):
            inside = ln.startswith("## 二")
            continue
        if inside and ln.strip().startswith("|") and not is_sep(ln):
            first = split_row(ln)[0]
            if first and first[0] in MARKERS:
                out.append((first[0], first[1:].strip()))
    return out


def has_list(body):
    items = [ln for ln in body if re.match(r"^\s*([-*]|\d+[.、])\s+\S", ln)]
    rows = [ln for ln in body if ln.strip().startswith("|") and not is_sep(ln)]
    return bool(items) or len(rows) >= 2


def check_design(path, sections):
    if not path.exists():
        misses.append("design.md 不存在，必含段無法檢查")
        return
    passes.append("design.md 存在")
    text = path.read_text(encoding="utf-8")
    hs = headings(text)
    for mark, name in sections:
        key = re.sub(r"段$", "", name).replace(" ", "")
        hit = [h for h in hs if key in h[2].replace(" ", "")]
        if not hit:
            near = [h[2] for h in hs if mark in h[2]]
            hint = f"（有含 {mark} 的標題但段名不符：{near[0]}）" if near else ""
            misses.append(f"必含段{mark} {name}：找不到段標題{hint}")
            continue
        line_no, level, title = hit[0]
        body = section_body(text, line_no, level)
        passes.append(f"必含段{mark} {name}：第 {line_no + 1} 行「{title}」")
        joined = "\n".join(body)
        if mark == "④":
            if "隱含假設" in joined and has_list(body):
                passes.append("必含段④ 有隱含假設清單")
            else:
                misses.append("必含段④ 缺隱含假設清單（段內須有「隱含假設」字樣與條列或表格）")
        if mark == "⑥":
            if not joined.strip():
                misses.append("必含段⑥ 段內沒有內容（首輪可寫「待稽核比對」）")
            elif "待稽核比對" in joined:
                notes.append("必含段⑥ 寫「待稽核比對」：只限首輪；第二輪起每個偏離都要有一條")


def check_grill(path):
    if not path.exists():
        misses.append("grill.md 不存在")
        return
    passes.append("grill.md 存在")
    text = path.read_text(encoding="utf-8")
    by_heading = any("拍板" in h[2] for h in headings(text))
    lines = text.splitlines()
    by_table = any(
        ln.strip().startswith("|") and "拍板" in ln
        and i + 1 < len(lines) and is_sep(lines[i + 1])
        for i, ln in enumerate(lines)
    )
    if by_heading or by_table:
        passes.append("grill.md 有拍板紀錄")
    else:
        misses.append("grill.md 找不到拍板紀錄（標題或表頭須含「拍板」）")


def main():
    if len(sys.argv) < 2:
        print("用法：python3 收件檢查.py <change 資料夾> [評分準則卡路徑]")
        return 1
    change = Path(sys.argv[1])
    criteria = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_CRITERIA
    if not change.is_dir():
        print(f"找不到 change 資料夾：{change}")
        return 1
    if not criteria.exists():
        print(f"找不到評分準則卡：{criteria}")
        return 1
    sections = required_sections(criteria.read_text(encoding="utf-8"))
    if not sections:
        print(f"評分準則卡 § 二讀不到必含段：{criteria}")
        return 1

    check_design(change / "design.md", sections)
    check_grill(change / "grill.md")

    print("erp-audit 收件檢查報告")
    print(f"change 資料夾：{change}")
    print(f"評分準則卡：{criteria}")
    print(f"必含段（取自 § 二）：{'、'.join(m + n for m, n in sections)}")
    for title, items in (("缺", misses), ("通過", passes), ("提醒", notes)):
        print(f"\n## {title}（{len(items)}）")
        if not items:
            print("（無）")
        for it in items:
            print(f"- {it}")
    print(f"\n總計：通過 {len(passes)} 項、缺 {len(misses)} 項、提醒 {len(notes)} 項")
    print("結論：" + ("退件" if misses else "可送稽核"))
    return 1 if misses else 0


if __name__ == "__main__":
    sys.exit(main())
