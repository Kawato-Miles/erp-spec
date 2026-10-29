#!/usr/bin/env python3
"""觸發評測無頭重放：每句送 claude -p，讀 stream-json，遇第一個 Skill 呼叫即停。
用法：trigger_runner.py <cases.tsv> <out.jsonl> <run_tag> [parallel]
cases.tsv 欄位：id \t 句子
"""
import json, os, signal, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

EVAL_DIR = os.environ.get("EVAL_DIR")
MAX_TOOLS = 8
MAX_SEC = 180
CMD = ["claude", "-p", None, "--output-format", "stream-json", "--verbose",
       "--no-session-persistence", "--strict-mcp-config",
       "--disallowedTools", "Edit Write NotebookEdit Bash Agent Workflow",
       "--max-budget-usd", "0.8"]


def run_one(case, run_tag):
    cid, sentence = case
    cmd = list(CMD)
    cmd[2] = sentence
    t0 = time.time()
    p = subprocess.Popen(cmd, cwd=EVAL_DIR, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                         text=True, start_new_session=True)
    tools, first_skill, model, end = [], None, None, "eof"
    try:
        for line in p.stdout:
            if time.time() - t0 > MAX_SEC:
                end = "timeout"; break
            try:
                d = json.loads(line)
            except Exception:
                continue
            if d.get("type") == "system" and d.get("subtype") == "init":
                model = d.get("model")
            if d.get("type") == "assistant":
                for c in d["message"].get("content", []):
                    if c.get("type") == "tool_use":
                        name = c["name"]
                        if name == "Skill":
                            first_skill = c["input"].get("skill")
                            tools.append("Skill:" + str(first_skill))
                        else:
                            tools.append(name)
                if first_skill:
                    end = "skill"; break
                if len(tools) >= MAX_TOOLS:
                    end = "max_tools"; break
            if d.get("type") == "result":
                end = "result"; break
    finally:
        try:
            os.killpg(p.pid, signal.SIGTERM)
        except Exception:
            pass
        p.wait()
    return {"id": cid, "run": run_tag, "first_skill": first_skill, "tools": tools,
            "end": end, "model": model, "sec": round(time.time() - t0, 1)}


def main():
    cases_path, out_path, run_tag = sys.argv[1:4]
    par = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    cases = []
    for l in open(cases_path, encoding="utf-8"):
        l = l.rstrip("\n")
        if l and "\t" in l:
            cid, s = l.split("\t", 1)
            cases.append((cid, s))
    done = set()
    if os.path.exists(out_path):
        for l in open(out_path, encoding="utf-8"):
            r = json.loads(l)
            if r["run"] == run_tag:
                done.add(r["id"])
    todo = [c for c in cases if c[0] not in done]
    with ThreadPoolExecutor(par) as ex, open(out_path, "a", encoding="utf-8") as f:
        for r in ex.map(lambda c: run_one(c, run_tag), todo):
            f.write(json.dumps(r, ensure_ascii=False) + "\n"); f.flush()
            print(r["id"], r["run"], r["first_skill"], r["end"], r["sec"], flush=True)


if __name__ == "__main__":
    main()
