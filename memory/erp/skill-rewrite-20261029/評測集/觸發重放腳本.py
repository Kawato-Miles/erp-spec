#!/usr/bin/env python3
"""觸發評測無頭重放：每句送 claude -p，讀 stream-json，遇第一個 Skill 呼叫即停。
用法：MODEL=<模型代號> EVAL_DIR=<乾淨工作樹> trigger_runner.py <cases.tsv> <out.jsonl> <run_tag> [parallel]
cases.tsv：觸發評測句.tsv（首列表頭；第一欄是編號，最後一欄是句子；中間的標註欄不送給模型）
MODEL 未設時用命令列預設模型。
遇到 API 錯誤（額度用盡、登入失效等）：該句不寫入結果，其餘未開始的句子不再送出，結束碼 2。
同一 run_tag 可續跑：已寫入的句子跳過，因錯誤沒寫入的句子會重送。
"""
import json, os, signal, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

EVAL_DIR = os.environ.get("EVAL_DIR")
MODEL = os.environ.get("MODEL")
MAX_TOOLS = 8
MAX_SEC = 180
CMD = ["claude", "-p", None, "--output-format", "stream-json", "--verbose",
       "--no-session-persistence", "--strict-mcp-config",
       "--disallowedTools", "Edit Write NotebookEdit Bash Agent Workflow",
       "--max-budget-usd", "0.8"]
if MODEL:
    CMD += ["--model", MODEL]

STOP = threading.Event()


def run_one(case, run_tag):
    if STOP.is_set():
        return None
    cid, sentence = case
    cmd = list(CMD)
    cmd[2] = sentence
    t0 = time.time()
    p = subprocess.Popen(cmd, cwd=EVAL_DIR, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                         text=True, start_new_session=True)
    tools, first_skill, model, end, error = [], None, None, "eof", None
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
                if d.get("subtype") == "error_max_budget_usd":
                    end = "budget"
                elif d.get("is_error") or d.get("terminal_reason") == "api_error":
                    end, error = "api_error", str(d.get("result") or d.get("errors"))[:200]
                else:
                    end = "result"
                break
    finally:
        try:
            os.killpg(p.pid, signal.SIGTERM)
        except Exception:
            pass
        p.wait()
    if end == "api_error":
        STOP.set()
        print(f"{cid} API 錯誤，停止送出：{error}", file=sys.stderr, flush=True)
        return None
    return {"id": cid, "run": run_tag, "first_skill": first_skill, "tools": tools,
            "end": end, "model": model, "sec": round(time.time() - t0, 1)}


def main():
    cases_path, out_path, run_tag = sys.argv[1:4]
    par = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    cases = []
    for i, l in enumerate(open(cases_path, encoding="utf-8")):
        cols = l.rstrip("\n").split("\t")
        if i == 0 or len(cols) < 2:
            continue
        cases.append((cols[0], cols[-1]))
    done = set()
    if os.path.exists(out_path):
        for l in open(out_path, encoding="utf-8"):
            r = json.loads(l)
            if r["run"] == run_tag:
                done.add(r["id"])
    todo = [c for c in cases if c[0] not in done]
    with ThreadPoolExecutor(par) as ex, open(out_path, "a", encoding="utf-8") as f:
        for r in ex.map(lambda c: run_one(c, run_tag), todo):
            if r is None:
                continue
            f.write(json.dumps(r, ensure_ascii=False) + "\n"); f.flush()
            print(r["id"], r["run"], r["model"], r["first_skill"], r["end"], r["sec"], flush=True)
    sys.exit(2 if STOP.is_set() else 0)


if __name__ == "__main__":
    main()
