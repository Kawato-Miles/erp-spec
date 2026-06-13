---
type: misjudgement-record
scope: cross-agent
agents:
  - senior-pm
  - ceo-reviewer
  - erp-consultant
case-id: ARCHIVE-001
recorded-at: 2026-05-26
recorded-by: Miles + Claude
related-change: complete-payment-status-ui-and-followups
related-vault:
  - [[../../00-meta/audit-log]]
  - [[../../08-open-questions/ORD-021-處理中Payment老化追蹤機制]]
  - [[../../08-open-questions/ORD-019-會計處理中Payment應收應付處理]]
  - [[../../08-open-questions/ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]
module: 跨模組
---

# 跨 agent 通用誤審：OpenSpec change 主動 archive 但 tasks.md 含未勾選核心實作項

## 案例情境

`2026-05-22-add-payment-status-and-decouple-oa-execution` change 的 archive 過程：
- proposal / design / specs 已完成
- tasks.md § 1-3（types / mock / store action）已勾選
- tasks.md § 4.5 / § 4.6 / § 4.8 部分 UI 已勾選
- tasks.md § 5 / § 6 / § 7 / § 8（OA 編輯介面 + 對帳面板）已勾選
- tasks.md **§ 4.4（OrderPaymentSection 操作欄編輯按鈕）未勾選**
- tasks.md **§ 4.7（已完成 → 處理中 UI 阻擋）未勾選**
- tasks.md **§ 9（SalesAllowance 弱提示）部分未勾選**
- tasks.md **§ 10.1-10.14（共 14 條 e2e）全部未勾選**
- tasks.md **§ 12.1-12.4（三視角審查）全部未勾選**
- tasks.md **§ 14.1-14.3（KPI 設定）全部未勾選**
- tasks.md § 15.1-15.2 已勾選但 § 15.3-15.4 未勾選即執行 archive

Claude 判斷「主要 spec / design / store action / mock data 已實作 → 可 archive」、忽略 tasks.md 內未勾選的 UI / e2e / 審查項目。

## 誤審內容

Claude 在 archive 階段未把「tasks.md 全部勾選」當 hard gate。判斷邏輯：
- 「核心邏輯已實作」≠「change 已完成」
- 「spec 已穩定」≠「tasks.md 列的所有實作項目都做完」
- 「§ 10 e2e 沒寫」被視為「技術債、可延後」、而非「change 內未完成項目」

## 實際情況

**功能性影響**：核心 user story「客戶說已匯但對帳未到、先填一半再補齊」**UI 上完全走不通**（一般收款列表 row 無編輯按鈕）。業務若於該流程嘗試操作 → 沒有入口可進入 PaymentEditDialog → 無法切已完成 → Payment 永遠停留處理中。

**測試覆蓋影響**：e2e `refund-payment-auto-execute-oa.spec.ts` 對應前版設計（Phase B 建立即推進），新版 BREAKING 翻轉後成 stale fail。新版 14 條 e2e 完全沒寫、無 regression 偵測。

**治理影響**：違反 Miles 自己定的 memory feedback `feedback_implement_all_spec_requirements`：「change 中所有 Requirement 都必須實作 Prototype，不允許列 OQ 延後逃避實作」。

## 教訓

**hard gate 條件**（archive 前 MUST 全部滿足）：

1. **tasks.md 全部勾選**：所有 `- [ ]` 必須為 `- [x]`；若某項真的無法完成、必須明確標註原因（如「依 Decision X 範疇凍結原則延後、開新 change Y 處理」）並從 tasks.md 移除或加註，而非保留未勾選狀態 archive
2. **e2e 全部跑過且通過**：若 tasks.md § X 列了「Playwright e2e 驗證」、archive 前 MUST 跑完所有列出的 case 並通過
3. **三視角審查（spec / design 完成後）必跑**：若 tasks.md 列了 senior-pm / ceo-reviewer / erp-consultant 審查項目、archive 前 MUST 跑完並把結果整合至 design.md
4. **`openspec validate --strict` + `/opsx:verify` 必跑**：兩個檢查通過才能 archive

**判斷邊界**：
- 若某 task 是「KPI 設定 / 後驗監測」類後驗 task、可延後（但 tasks.md 內必須明確標 deferred）
- 若某 task 是「實作 UI / 寫 e2e / 改 store / 修 mock」這類影響 user story 的 task、不可延後

**業務影響的具體場景**：
- 業務在訂單詳情頁建處理中 Payment 後找不到編輯入口（§ 4.4 漏實作）
- 退款 Payment 切已完成後系統沒提示 SalesAllowance（§ 9 漏實作）
- e2e 失敗時無法即時發現 regression（§ 10 漏實作）
- 設計品質沒被三視角覆審（§ 12 漏實作）

## 適用範圍

本誤審適用於**所有三視角 agent**（senior-pm / ceo-reviewer / erp-consultant）+ **Claude 主導 change workflow**：

- senior-pm：在前期介入確認問題框架後、若 tasks.md 漏列關鍵 UI / e2e 項目應主動補建議
- ceo-reviewer：在 KPI 對齊審查時、若 tasks.md 缺 KPI 設定 task 應主動指出
- erp-consultant：在 5 設計模式對照時、若 tasks.md 缺驗證 e2e 應主動指出
- Claude：在 `/opsx:archive` 工作流中、archive 前 MUST 檢查 tasks.md 全部勾選與 e2e 全部跑過

## 後續行動

- [[../../08-open-questions/]] 新增 OQ「OpenSpec archive workflow 加 hard gate 檢查」追蹤工具改善
- `/opsx:archive` skill 增強：archive 前自動跑 tasks.md 勾選率檢查 + e2e 結果檢查、未滿足條件直接 abort
- 各 agent 規範文件補「事後 archive 審視」職責（依本誤審案例提醒）

## 來源

- 本誤審案例由 `complete-payment-status-ui-and-followups` change 補完前 archive 漏實作識別
- 對應 Vault [audit-log.md](audit-log.md) 2026-05-26 18:00 entry
- 對應 memory feedback `feedback_implement_all_spec_requirements`
