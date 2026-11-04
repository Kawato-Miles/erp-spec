#!/usr/bin/env python3
"""erp-audit 收件檢查（只讀）。

檢查規劃資料夾（`.scratch/<主題>/`）是否可送稽核：
- spec.md 存在。
- spec.md 有 matt `to-spec` 範本的全部七節標題，節名與範本一致。
- Testing Decisions 節與 Implementation Decisions 節不是空的。
必含內容（評分準則 § 二）是否齊備，不在這裡比對標題；由稽核者在全文找證據並判定。

用法：python3 收件檢查.py <規劃資料夾>
結束碼：有缺項為 1，全部通過為 0。
"""
import re
import sys
from pathlib import Path

# matt `to-spec` 範本的七節，順序即範本順序。
SPEC_SECTIONS = [
    "Problem Statement",
    "Solution",
    "User Stories",
    "Implementation Decisions",
    "Testing Decisions",
    "Out of Scope",
    "Further Notes",
]
MUST_HAVE_CONTENT = {"Implementation Decisions", "Testing Decisions"}
HEADING = re.compile(r"^(#{1,6})\s+(.*)$")

passes, misses, notes = [], [], []


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
    body = []
    for ln in text.splitlines()[start + 1:]:
        m = HEADING.match(ln)
        if m and len(m.group(1)) <= level:
            break
        body.append(ln)
    return body


def check_spec(path):
    if not path.exists():
        misses.append("spec.md 不存在")
        return
    passes.append("spec.md 存在")
    text = path.read_text(encoding="utf-8")
    hs = headings(text)
    order = []
    for name in SPEC_SECTIONS:
        hit = [h for h in hs if h[2].lower() == name.lower()]
        if not hit:
            misses.append(f"缺節：{name}（節名須與 matt to-spec 範本一致）")
            continue
        line_no, level, title = hit[0]
        order.append(line_no)
        passes.append(f"{name}：第 {line_no + 1} 行")
        if name in MUST_HAVE_CONTENT:
            body = [ln for ln in section_body(text, line_no, level) if ln.strip()]
            if not body:
                misses.append(f"{name} 節沒有內容")
    if order != sorted(order):
        notes.append("七節順序與 matt to-spec 範本不同")


def main():
    if len(sys.argv) < 2:
        print("用法：python3 收件檢查.py <規劃資料夾>")
        return 1
    folder = Path(sys.argv[1])
    if not folder.is_dir():
        print(f"找不到規劃資料夾：{folder}")
        return 1

    check_spec(folder / "spec.md")

    print("erp-audit 收件檢查報告")
    print(f"規劃資料夾：{folder}")
    print(f"檢查範圍：spec.md 的 matt to-spec 七節（{'、'.join(SPEC_SECTIONS)}）")
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
