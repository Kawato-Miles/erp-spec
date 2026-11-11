#!/usr/bin/env python3
"""第二輪檢核：把 verify_quotes.py 比對不到的列分類。
用法：triage_unmatched.py <工作樹根目錄> <產出檔.md> [...]

分類：
  路徑縮寫   句子存在，只是子代理把資料夾名與檔名黏在一起，檔名比對不上
  句子在別檔 句子存在，但不在子代理寫的那個檔
  引號內存在 整格比對不到，但格內「」裡的句子都存在（格內混了子代理的說明）
  改寫       字面比對不到，但四字片段有七成以上出現在子代理寫的檔（併句或改寫）
  待人工     四字片段覆蓋四成到七成
  疑似無出處 四字片段覆蓋不到四成
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_quotes as vq


def grams(s, n=4):
    return {s[i:i + n] for i in range(len(s) - n + 1)} if len(s) >= n else {s}


def coverage(frag, text):
    g = grams(frag)
    return sum(1 for x in g if x in text) / len(g)


def main():
    root = sys.argv[1]
    vq.ROOTS = [(p.replace(vq.W, root), e) for p, e in vq.ROOTS]
    corpus = vq.load()
    base = {}
    for p in corpus:
        base.setdefault(vq.norm(os.path.splitext(os.path.basename(p))[0]), []).append(p)
    grand = {}
    for path in sys.argv[2:]:
        card = hdr = None
        tally = {}
        out = []
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
            if "原文句" not in hdr or "判定" not in hdr or len(c) != len(hdr):
                continue
            row = dict(zip(hdr, c))
            v = row["判定"]
            if v not in ("已有家", "部分", "別處已有"):
                continue
            q = row["原文句"]
            if not q or q in ("—", "-", "無") or "見下方" in q:
                continue
            loc = next((row[k] for k in hdr if "路徑" in k or "位置" in k or k.startswith("家")), "")
            nloc = vq.norm(loc)
            cand = [p for b, ps in base.items() if len(b) >= 4 and b in nloc for p in ps]
            whole = vq.norm(re.sub(r"[（(][^）)]*[）)]", "", q))
            quoted = [vq.norm(x) for x in re.findall(r"「([^「」]{5,})」", q)]
            quoted = [x for x in quoted if len(x) >= 5]
            pieces = []
            for seg in re.split(r"…+|\.\.\.+|<br>|；|;|／|。|\\\|", q):
                seg = re.sub(r"[（(][^）)]*[）)]", "", seg)
                seg = vq.norm(seg)
                if len(seg) >= 5:
                    pieces.append(seg)
            if not pieces:
                continue
            anywhere = lambda f: any(f in t for t in corpus.values())
            incand = lambda f: any(f in corpus[p] for p in cand)
            if all(anywhere(f) for f in pieces):
                if not cand or all(incand(f) for f in pieces) or any(incand(f) for f in pieces):
                    continue  # 完全比對到，不列
                kind = "句子在別檔"
            elif quoted and all(anywhere(f) for f in quoted):
                kind = "引號內存在"
            else:
                texts = [corpus[p] for p in cand] or list(corpus.values())
                target = "".join(quoted) if quoted else "".join(pieces)
                cov = max(coverage(target, t) for t in texts)
                kind = "改寫" if cov >= 0.7 else ("待人工" if cov >= 0.4 else "疑似無出處")
                kind += f"({cov:.2f}{'' if cand else '，檔名解不出'})"
            key = (v, re.sub(r"\(.*", "", kind))
            tally[key] = tally.get(key, 0) + 1
            grand[key] = grand.get(key, 0) + 1
            if not kind.startswith(("引號內存在",)):
                out.append(f"   ! {kind} | {v} | {card} | #{row.get('#', '?')} | {loc[:70]} | {q[:110]}")
        print(f"== {os.path.basename(path)}：{ {f'{a}/{b}': n for (a, b), n in sorted(tally.items())} }")
        print("\n".join(out))
    print("== 合計：", {f"{a}/{b}": n for (a, b), n in sorted(grand.items())})


if __name__ == "__main__":
    main()
