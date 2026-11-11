#!/usr/bin/env python3
"""記憶目錄寫入檢查（PreToolUse：Write、Edit、MultiEdit）。

擋下寫進記憶目錄的 project 類記憶卡。規則正本：AGENTS.md § 記憶目錄。
結束碼 2 代表擋下，訊息寫到 stderr 給代理看。檢查本身出錯時放行。
"""
import json
import os
import re
import sys

MEMORY_CARD = re.compile(r"/\.claude/projects/[^/]+/memory/[^/]+\.md$")
TYPE_LINE = re.compile(r"^\s*type:\s*[\"']?(\w+)", re.MULTILINE)

MESSAGE = (
    "記憶目錄不收 project 類的卡，這次寫入已擋下。請改寫到正本：\n"
    "- 商業決策（規則、欄位、狀態、權限）：寫進 wiki 卡；未定案的開 OQ。\n"
    "- 工作進度、待辦、交接：寫進地圖與票。\n"
    "- 完成紀錄：寫進提交訊息。\n"
    "記憶目錄只放 Miles 新給的做事指示（feedback 類）與外部資源的位置（reference 類）。"
    "依據：AGENTS.md § 記憶目錄。"
)


def frontmatter_type(text):
    """回傳 frontmatter 內 type 欄的值；沒有 frontmatter 或沒有 type 欄回傳 None。"""
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    match = TYPE_LINE.search(text[3:end])
    return match.group(1).lower() if match else None


def main():
    payload = json.load(sys.stdin)
    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or ""
    if not MEMORY_CARD.search(path) or os.path.basename(path) == "MEMORY.md":
        return 0

    if os.path.basename(path).startswith("project_"):
        return 2

    if payload.get("tool_name") == "Write":
        card_type = frontmatter_type(tool_input.get("content") or "")
    else:
        # Edit、MultiEdit：看改完之後的類型。新字串有 type 欄就用它，否則用現有檔的。
        edits = tool_input.get("edits") or [tool_input]
        new_text = "\n".join(e.get("new_string") or "" for e in edits)
        match = TYPE_LINE.search(new_text)
        if match:
            card_type = match.group(1).lower()
        elif os.path.isfile(path):
            with open(path, encoding="utf-8") as handle:
                card_type = frontmatter_type(handle.read())
        else:
            card_type = None

    return 2 if card_type == "project" else 0


if __name__ == "__main__":
    try:
        code = main()
    except Exception:
        code = 0
    if code == 2:
        print(MESSAGE, file=sys.stderr)
    sys.exit(code)
