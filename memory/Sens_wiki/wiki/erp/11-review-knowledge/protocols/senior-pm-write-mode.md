---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-19
---

# Senior PM 寫入流程（Mode A / Mode B）

> 適用情境：[senior-pm](../../../../../.claude/agents/senior-pm.md) 是本系統唯一可直接寫入 Notion 的 review agent。本卡定義其兩種寫入模式的觸發、執行邏輯、限制。
> **觸發來源**：[[multi-agent-discussion-protocol]] § 討論後處置「BRD 內容修改」類型；或 Miles 直接指定 Mode A/B。

## 一、預設行為

每次呼叫 [senior-pm](../../../../../.claude/agents/senior-pm.md) 時，呼叫方（Claude 協調者）**MUST** 在 prompt 中指定寫入模式。**若 prompt 未包含模式信號，預設為純分析（不執行任何寫入）**。

## 二、Mode A：前置授權執行

**觸發信號**：prompt 包含 `[MODE: EXECUTE]`

**適用情境**：寫入範圍已由 Miles 確認，scope 與內容明確，直接執行。

**執行邏輯**：

1. 依 prompt 指定的 scope 與內容，直接呼叫 Notion 寫入工具
2. 執行完畢後，return 中附上「已寫入清單」：
   - 更新了哪個頁面的哪個段落
   - 主要內容變更摘要（2-3 句）

**限制**：寫入內容 **MUST** 嚴格依 prompt 指定，**MUST NOT** 額外推論或擴充。

## 三、Mode B — Phase 1：規劃（不寫入）

**觸發信號**：prompt 包含 `[MODE: PLAN]`

**適用情境**：scope 需由 [senior-pm](../../../../../.claude/agents/senior-pm.md) 分析後決定，Claude 尚未知道要改什麼，先由 [senior-pm](../../../../../.claude/agents/senior-pm.md) 提出計畫。

**執行邏輯**：

1. 完成正常分析（審查、問題框架等）
2. **MUST NOT** 執行任何 Notion 寫入工具
3. 在 return 結尾附上結構化「寫入計畫」：

```
[寫入計畫]
---
操作 N：
  目標頁面：[Notion 頁面名稱]（URL）
  操作類型：更新段落 / 新增段落 / 新增評論
  目標段落：[§ 段落標題]
  變更理由：[1-2 句說明為什麼要改]
  變更前（現況）：[現有內容完整摘錄或摘要]
  變更後（預計寫入內容）：[完整的新內容，供 Miles 審閱與 Phase 2 直接使用]
---
```

**關鍵限制**：

> 「變更後」**MUST** 是可直接貼入 Notion 的完整內容，**MUST NOT** 只寫「調整措辭」或「加入說明」——Phase 2 執行時不會重新推論，只依計畫寫入。

## 四、Mode B — Phase 2：執行計畫

**觸發信號**：prompt 包含 `[MODE: EXECUTE | plan]` 並附帶 Phase 1 的完整寫入計畫

**執行邏輯**：

1. 讀取 prompt 中的寫入計畫
2. 依計畫逐項呼叫 Notion 寫入工具，**MUST 嚴格按計畫執行，MUST NOT 額外推論或擴充**
3. return 中列出「已執行清單」（格式同 Mode A）

**限制**：**MUST NOT** 執行計畫以外的任何寫入操作。

## 五、從多 Agent 討論觸發的標準流程

[[multi-agent-discussion-protocol]] § 討論後處置 識別「BRD 內容修改」行動項目時，Claude 協調者依下序執行：

### 步驟一：觸發 Mode B Phase 1

```
Claude 呼叫 senior-pm，傳入：
- [MODE: PLAN]
- 最終彙整結論全文
- BRD Notion 頁面連結
- 本次需處理的行動項目清單
```

### 步驟二：senior-pm 返回寫入計畫，Claude 呈現給 Miles

```
[Senior PM 寫入計畫 — 待確認]

以下修改將由 Senior PM 直接寫入 Notion，請確認後執行：

操作 N：[目標頁面] § [段落]
  理由：[...]
  變更前：[...]
  變更後：[...]

確認執行？（確認後 Senior PM 將直接寫入，不再經由 Claude 轉述）
```

### 步驟三：Miles 確認後，觸發 Mode B Phase 2

```
Claude 呼叫 senior-pm，傳入：
- [MODE: EXECUTE | plan]
- Phase 1 完整寫入計畫
```

senior-pm 執行完畢，返回已寫入清單。Claude 將清單摘要回報 Miles。

## 六、為何只有 senior-pm 有寫入能力

| 視角 | 為何不開放寫入 |
|------|--------------|
| [ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md) | CEO 視角是「挑戰者」角色，寫入會混淆「審查 vs 決策」邊界 |
| [erp-consultant](../../../../../.claude/agents/erp-consultant.md) | ERP 顧問視角是「系統一致性檢查者」，寫入會與 OpenSpec change 工作流衝突 |
| [senior-pm](../../../../../.claude/agents/senior-pm.md) | PM 是 BRD 的最終整合者，寫入 BRD 是其本職 |

## 七、相關卡

- [[multi-agent-discussion-protocol]] — 多 Agent 輪次討論
- [[lightweight-review-mode]] — 單 Agent 輕量審查
- [[user-story-spec]] — User Story 撰寫規格（寫入 User Story DB 的格式）
