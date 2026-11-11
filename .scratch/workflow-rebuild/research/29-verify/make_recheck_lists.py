#!/usr/bin/env python3
"""從第一輪產出抽出要重查的列，一批寫一個清單檔。
重查範圍：判定為矛盾、找不到、部分的全部列；另從「已有家」每 8 列抽 1 列做同義抽查。
用法：make_recheck_lists.py P1.md ...
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_quotes as vq

for path in sys.argv[1:]:
    card = hdr = None
    rows, n_ok, stat = [], 0, {}
    for ln in open(path, encoding="utf-8").read().splitlines():
        if ln.startswith("## "):
            card, hdr = ln[3:].strip(), None
            continue
        if not ln.startswith("|"):
            continue
        c = vq.cells(ln)
        if hdr is None:
            hdr = c
            continue
        if all(re.fullmatch(r":?-+:?", x) for x in c if x):
            continue
        if "判定" not in hdr or "原文句" not in hdr or len(c) != len(hdr) or not (card or "").endswith(".md"):
            continue
        row = dict(zip(hdr, c))
        v = row["判定"]
        kind = None
        if v in ("矛盾", "找不到", "部分"):
            kind = v
        elif v == "已有家":
            n_ok += 1
            if n_ok % 8 == 0:
                kind = "抽查"
        if kind:
            stat[kind] = stat.get(kind, 0) + 1
            dec = next((row[k] for k in hdr if k.startswith("決策")), "")
            loc = next((row[k] for k in hdr if "路徑" in k or k.startswith("家")), "")
            rows.append((card, row.get("#", "?"), kind, row.get("類型", ""), dec, loc, row["原文句"]))
    name = os.path.splitext(os.path.basename(path))[0]
    with open(f"重查清單-{name}.md", "w", encoding="utf-8") as out:
        out.write(f"# {name} 重查清單\n\n共 {len(rows)} 列：{stat}。第一輪明細在同資料夾 `{name}.md`（路徑縮寫表在該檔開頭）。\n\n")
        out.write("| 記憶卡 | # | 重查原因 | 第一輪類型 | 決策 | 第一輪寫的家 | 第一輪寫的原文句或說明 |\n|---|---|---|---|---|---|---|\n")
        for r in rows:
            out.write("| " + " | ".join(r) + " |\n")
    print(name, len(rows), stat)
