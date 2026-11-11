#!/usr/bin/env python3
"""彙整第二輪重查結果（R-*.md）：統計、比對原文句是否在所寫的檔、輸出待裁決清單。
用法：aggregate_recheck.py <工作樹根目錄>
輸出：重查彙整-統計.txt、重查彙整-待裁決.md
"""
import os, re, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_quotes as vq

root = sys.argv[1].rstrip("/")
PROTO = "/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)"
here = os.path.dirname(os.path.abspath(__file__))
vq.ROOTS = [(p.replace(vq.W, root), e) for p, e in vq.ROOTS]
corpus = vq.load()
stat = collections.Counter()
per_batch = collections.defaultdict(collections.Counter)
bad_quote, pending, missing_rows = [], [], []

def expected(batch):
    p = os.path.join(here, f"重查清單-{batch}.md")
    keys = []
    for ln in open(p, encoding="utf-8").read().splitlines():
        c = vq.cells(ln) if ln.startswith("|") else []
        if len(c) >= 3 and c[0].endswith(".md"):
            keys.append((c[0], c[1]))
    return keys

for path in sorted(glob.glob(os.path.join(here, "R-P*.md"))):
    batch = os.path.basename(path)[2:-3]
    hdr, got = None, []
    for ln in open(path, encoding="utf-8").read().splitlines():
        if not ln.startswith("|"):
            hdr = None if not ln.strip() else hdr
            continue
        c = vq.cells(ln)
        if hdr is None:
            hdr = c
            continue
        if all(re.fullmatch(r":?-+:?", x) for x in c if x) or "結論" not in hdr or "原文句" not in hdr or len(c) != len(hdr):
            continue
        r = dict(zip(hdr, c))
        card, num, why, res, cat = r["記憶卡"].strip("`"), r["#"], r["重查原因"], r["結論"], r.get("分類", "—")
        got.append((card, num))
        stat[(why, res, cat if res in ("仍缺", "記憶卡較新") else "")] += 1
        per_batch[batch][res] += 1
        loc = next((r[k] for k in hdr if k.startswith("家（")), "")
        q = r["原文句"]
        if res in ("已有家", "同義", "家較新", "不是矛盾", "記憶卡較新"):
            nq = vq.norm(q)
            if len(nq) < 5:
                bad_quote.append((batch, card, num, res, "沒附原文句", loc[:60], q[:60]))
            else:
                name = re.sub(r":[\d,\-–、 ]+$", "", loc.strip("` ")).strip("` ")
                cands = [p for p in corpus if p.endswith(name) or (os.path.basename(name) and os.path.basename(p) == os.path.basename(name))]
                if any(nq in corpus[p] for p in cands):
                    pass
                elif any(nq in t for t in corpus.values()):
                    bad_quote.append((batch, card, num, res, "句子在別的檔", loc[:60], q[:60]))
                else:
                    bad_quote.append((batch, card, num, res, "句子找不到", loc[:60], q[:60]))
        if res in ("記憶卡較新", "判不出", "不同義") or (res == "仍缺" and cat == "商業規則"):
            pending.append((card, num, why, res, cat, r.get("記憶卡日期", ""), r.get("家的日期與證據", ""), loc, q, r.get("說明", "")))
    exp = expected(batch)
    miss = [k for k in exp if k not in got]
    if miss:
        missing_rows.append((batch, len(exp), len(got), miss[:8]))

with open(os.path.join(here, "重查彙整-統計.txt"), "w", encoding="utf-8") as o:
    o.write("== 重查原因 × 結論 × 分類\n")
    for k, n in sorted(stat.items()):
        o.write(f"{k[0]} | {k[1]} | {k[2]} | {n}\n")
    o.write("\n== 各批結論\n")
    for b, c in sorted(per_batch.items()):
        o.write(f"{b}: {dict(c)}\n")
    o.write(f"\n== 漏列：{missing_rows}\n")
    o.write(f"\n== 原文句比對不到 {len(bad_quote)} 列\n")
    for b in bad_quote:
        o.write(" | ".join(b) + "\n")
with open(os.path.join(here, "重查彙整-待裁決.md"), "w", encoding="utf-8") as o:
    o.write("# 重查彙整：待裁決與商業規則缺口\n\n收錄結論為「記憶卡較新」「判不出」「不同義」與分類為商業規則的「仍缺」。\n\n")
    o.write("| 記憶卡 | # | 重查原因 | 結論 | 分類 | 記憶卡日期 | 家的日期與證據 | 家 | 原文句 | 說明 |\n|---|---|---|---|---|---|---|---|---|---|\n")
    for p in sorted(pending):
        o.write("| " + " | ".join(p) + " |\n")
print(open(os.path.join(here, "重查彙整-統計.txt"), encoding="utf-8").read()[:6000])
print("待裁決列數", len(pending))
