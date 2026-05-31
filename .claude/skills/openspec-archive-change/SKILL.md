---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

5. **OQ 收尾檢查（refine-supplementary-print-skip-review 後 vault-insight 2026-05-20 新增）**

   change archive 前必執行 OQ 收尾流程，避免孤兒 OQ / 撞號 / source-link 過期等治理債累積。

   **5.1 列出本 change 期間建立的 OQ**：

   ```bash
   # 方法 A：透過 source-link 反查
   grep -rn "source-link:.*<change-name>" memory/Sens_wiki/wiki/erp/08-open-questions/ --include="*.md"

   # 方法 B：透過 related-change 欄位反查
   grep -rn "related-change: <change-name>" memory/Sens_wiki/wiki/erp/08-open-questions/ --include="*.md"
   ```

   若無 OQ → 跳過此步驟。

   **5.2 對每筆 OQ 詢問 Miles 處理方式（AskUserQuestion）**：

   - **close**（answered）：問題已在本 change 解決 → 補 answered-at + answered-by + 在 OQ 卡內 append `## 答覆` 段
   - **改派下一 change**：問題延後到具體下一個 change 處理 → 更新 source-link 指向新 change 路徑 + related-change 改為新 change
   - **維持 open**：問題仍懸而未決 → 補 expected-resolution-at（若缺）

   **5.3 檢查 OQ 編號未撞號**：

   ```bash
   # 全域唯一性檢查
   grep -rh "^oq-id:" memory/Sens_wiki/wiki/erp/08-open-questions/ --include="*.md" \
     | sort | uniq -d
   ```

   若有重複 → 詢問 Miles 哪個重編號（建議：較晚建立者 +1）。

   **5.4 更新 source-link 路徑**：

   change archive 後 active 路徑會變成 archive 路徑，需更新 source-link：

   ```bash
   # 找指向 active change 的 source-link
   grep -rn "openspec/changes/<change-name>/" memory/Sens_wiki/wiki/erp/08-open-questions/ --include="*.md"

   # 改為 archive 路徑（archive 完成後跑）
   # sed 替換 openspec/changes/<change-name>/ → openspec/changes/archive/<YYYY-MM-DD>-<change-name>/
   ```

   **5.5 補納入 OQ README 清單表格**：

   檢查 `memory/Sens_wiki/wiki/erp/08-open-questions/README.md` 內 OQ 清單表格是否含本 change 新建的 OQ。若無 → 補上。

   **5.6 在 audit-log 記錄 OQ 收尾結果**：

   ```markdown
   ## [YYYY-MM-DD HH:MM] OQ-collect | archive <change-name>

   **本 change 建 OQ 數**：N
   **處理結果**：close X / 改派 Y / 維持 open Z
   **撞號修復**：（若有）
   **source-link 更新**：（若有）
   ```

6. **Perform the archive**

   Create the archive directory if it doesn't exist:
   ```bash
   mkdir -p openspec/changes/archive
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move the change directory to archive

   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

7. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use openspec-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- **OQ 收尾**：archive 前必走 Step 5 OQ 收尾流程；若 Vault 內無對應 change 的 OQ 則跳過。對應 [Vault Insight 2026-05-20 change-archive-OQ收尾流程缺口](../../../memory/Sens_wiki/wiki/erp/12-insights/2026-05-20-change-archive-OQ收尾流程缺口.md)
