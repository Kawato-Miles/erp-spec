---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-19
---

# ERP 顧問命名誤審記錄

> [erp-consultant](../../../../../.claude/agents/erp-consultant.md) 過去命名 / 用語建議的誤審案例。每次提改名建議前 MUST 對照本卡，避免重複犯錯。
> **跨 agent 通用誤審**（如「設計理解摘要不充分」）見 [[review-loading-checklist]] § 三；**CEO 視角誤區**見 [[ceo-review-pitfalls]]。

## 一、案例 1：2026-05-08「期次待收金額」改名建議

**背景**：審查 `refactor-order-adjustment-with-watchlists` change 時，建議將「應收金額」改為「期次待收金額」。

**理由（誤審當時）**：
- 「PaymentPlan 期次層 vs Order 訂單層的應收名稱衝突」
- 「資料模型語義學要求兩個層次的應收用不同詞」

**Miles 反饋**：
1. 「期次待收金額」**不是台灣繁中用法**
2. 連 Miles（PM）都**看不懂建議的用處與效益**

**教訓 1**：學術名稱衝突 ≠ 業務認知衝突
- UI 上下文已能區分「Payment 是訂單的還是期次的」
- 強行直譯只會增加閱讀成本

**教訓 2**：建議的「為什麼」要用具體場景（誰會在哪裡混淆），**MUST NOT** 用學術理由（資料模型語義學）

**教訓 3**：規則本身的描述也要通過 5 秒測試
- 連規則文字都 **MUST NOT** 用學術術語（「資料模型語義學」這種詞 Miles 也看不懂）

## 二、案例 2：2026-05-08「watchlist」命名

**背景**：審查同一個 change 時，capability 命名為 `receivables-watchlist` / `invoicing-watchlist`，change name 為 `add-receivables-and-invoicing-watchlists`。

**Miles 反饋**：「watchlist 是在講什麼？」
- 連 PM 都看不懂
- 誤以為「代收款項模組」

**教訓**：英文 ERP 慣用詞（`watchlist` / `dunning` / `reconciliation`）在中文業務環境**沒有對應心智模型**，即使工程上常見也 **MUST NOT** 用

**規則**：**英文 capability / change 名稱也要過 5 秒測試**
- Miles 看到 change name 應該能直覺懂這個 change 在做什麼
- **MUST NOT** 需要查術語表

## 三、新增誤審案例的流程

**MUST 觸發 `misjudgement-record` skill mode B**（不可手動寫入避免格式不一致）。skill 自動完成：

1. **分類**：判定為 ERP 命名 / 用語類誤審 → 自動歸位至本卡
2. **去重**：搜尋既有案例（如「期次待收金額」「watchlist」），相似度高建議擴充而非新增
3. **四要素提取**：背景（change name / capability name）/ 誤審理由（agent 當時的學術理由）/ Miles 原話反饋 / 教訓
4. **強制規則**：教訓 MUST 用具體場景（誰會在哪裡混淆），MUST NOT 用學術理由（資料模型語義學等）
5. **規則演化**：若需更新 [[erp-naming-rules]] 規則，由 Miles 確認後同步更新
6. **更新 frontmatter** `last-reviewed`

詳見 [`.claude/skills/misjudgement-record/SKILL.md`](../../../../../.claude/skills/misjudgement-record/SKILL.md)。

## 四、相關卡

- [[erp-naming-rules]] — 命名與用語規則（含 5 秒測試）
- [[language-conventions]] — 共用語言規範
- [[review-loading-checklist]] — 跨 agent 通用防誤審記錄
- [[ceo-review-pitfalls]] — CEO 視角誤區（商業推論類）
