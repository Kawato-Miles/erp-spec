#!/usr/bin/env python3
"""檢核子代理產出：每條附的原文句是否真的存在於候選的家。
用法：verify_quotes.py <產出檔.md> [...]
"""
import os, re, sys, glob

W = "/Users/b-f-03-029/Sens/.claude/worktrees/workflow-rebuild-05-aa3491"
ROOTS = [
    (W + "/AGENTS.md", None),
    (W + "/GLOSSARY-MAP.md", None),
    (W + "/.claude", (".md",)),
    (W + "/memory", (".md",)),
    (W + "/docs", (".md",)),
    (W + "/erp-prototype-tests", (".md", ".mjs", ".js")),
    (W + "/.scratch", (".md",)),
    ("/Users/b-f-03-029/.claude/CLAUDE.md", None),
    ("/Users/b-f-03-029/.claude/output-styles/ste100-pm.md", None),
    ("/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)", (".md", ".js", ".jsx", ".ts", ".tsx")),
    ("/Users/b-f-03-029/erp/.claude/skills", (".md",)),
    ("/Users/b-f-03-029/erp/AGENTS.md", None),
    ("/Users/b-f-03-029/erp/CLAUDE.md", None),
]
SKIP_DIRS = {"node_modules", "worktrees", ".git", "29-verify", "test-results", "playwright-report"}


def norm(s):
    s = s.replace("\\|", "|")
    s = re.sub(r"[`*_\s「」『』\"'“”‘’]", "", s)
    s = s.replace("（", "(").replace("）", ")").replace("，", ",").replace("：", ":").replace("；", ";")
    return s


def load():
    corpus = {}
    for root, exts in ROOTS:
        if os.path.isfile(root):
            files = [root]
        else:
            files = []
            for d, dirs, fs in os.walk(root):
                dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
                for f in fs:
                    if exts and f.endswith(exts):
                        files.append(os.path.join(d, f))
        for p in files:
            try:
                with open(p, encoding="utf-8", errors="ignore") as fh:
                    corpus[p] = norm(fh.read())
            except OSError:
                pass
    return corpus


def cells(line):
    parts = re.split(r"(?<!\\)\|", line.strip())
    return [c.strip() for c in parts[1:-1]]


def main():
    corpus = load()
    for path in sys.argv[1:]:
        card = None
        hdr = None
        total = ok = wrongfile = 0
        bad = []
        verdict_count = {}
        with open(path, encoding="utf-8") as fh:
            lines = fh.read().splitlines()
        for ln in lines:
            if ln.startswith("## "):
                card = ln[3:].strip()
                hdr = None
                continue
            if not ln.startswith("|"):
                continue
            c = cells(ln)
            if hdr is None:
                hdr = c
                continue
            if all(re.fullmatch(r":?-+:?", x) for x in c if x):
                continue
            if "原文句" not in hdr or "判定" not in hdr or len(c) != len(hdr):
                continue
            row = dict(zip(hdr, c))
            v = row["判定"]
            verdict_count[v] = verdict_count.get(v, 0) + 1
            if v not in ("已有家", "部分", "別處已有"):
                continue
            q = row["原文句"]
            if not q or q in ("—", "-", "無") or "見下方" in q:
                continue
            loc = next((row[k] for k in hdr if "路徑" in k or "位置" in k or k.startswith("家")), "")
            raw = re.split(r"…+|\.\.\.+|<br>|；|;|／|」；「|\\\|", q)
            raw = [re.sub(r"^\s*[「『]?[A-Za-z0-9\-\.一-龥 ]{1,14}[:：](?!//)\d*\s*", "", f) for f in raw]
            raw = [re.sub(r"[（(][^）)]*[）)]\s*$", "", f) for f in raw]
            frags = [norm(f) for f in raw]
            frags = [f for f in frags if len(f) >= 5]
            if not frags:
                continue
            total += 1
            missing = [f for f in frags if not any(f in t for t in corpus.values())]
            if len(missing) < len(frags) and len(missing) <= len(frags) // 2:
                partial = missing
                missing = []
            if missing:
                bad.append((card, row.get("#", "?"), v, loc, q[:90], missing[0][:40]))
                continue
            ok += 1
            names = re.findall(r"([^\s`；;、/]+\.(?:md|jsx?|tsx?|mjs))", loc)
            if names:
                hit_files = [p for p, t in corpus.items() if any(f in t for f in frags)]
                if not any(os.path.basename(p) == n or p.endswith(n) for p in hit_files for n in names):
                    wrongfile += 1
                    bad.append((card, row.get("#", "?"), v + "（句子在別的檔）", loc, q[:90],
                                ";".join(os.path.basename(p) for p in hit_files[:3])))
        print(f"== {os.path.basename(path)}：判定分布 {verdict_count}")
        print(f"   有原文句的列 {total}；原文句存在 {ok}；其中檔名對不上 {wrongfile}；原文句找不到 {total - ok}")
        for b in bad:
            print("   ! " + " | ".join(str(x) for x in b))


if __name__ == "__main__":
    main()
