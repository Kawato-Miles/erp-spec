## 1. Spec 撰寫

- [x] 1.1 quote-request delta spec：移除「業務主管核可議價推進」Requirement、修訂「需求單狀態轉換」與「成交轉訂單」、修訂「收款備註欄位」（保留欄位但移除主管 gate 綁定）
- [x] 1.2 order-management delta spec：新增「訂單建立時帶入業務主管審核欄位」Requirement、新增「業務主管核准訂單」Requirement、修訂「訂單建立」前置條件
- [x] 1.3 state-machines delta spec：修訂「需求單狀態機」（移除 v3.0 探索方向痕跡，明確 6 狀態）、修訂「訂單狀態機」線下路徑（加「待業務主管審核」狀態）
- [x] 1.4 user-roles delta spec：修訂「業務主管角色職責」（從需求單議價前審核改為訂單建立後審核）

## 2. 三視角審查

- [ ] 2.1 senior-pm agent 審查：確認 gate 位置調整對業務工作流的衝擊與優先順序合理
- [ ] 2.2 ceo-reviewer agent 審查：確認本次調整不會擴散至非預期模組
- [ ] 2.3 erp-consultant agent 審查：確認需求單 → 訂單 → 報價單外發 → 客人簽回的時序設計合理

## 3. Prototype 已落地驗證

- [x] 3.1 Prototype types 層：QuoteStatus 6 值、OrderStatus 含「待業務主管審核」、Order 加 `approvedBySalesManager` / `approvalRequired` / `paymentTermsNote` / `lastApprovedPaymentTermsNote` 欄位
- [x] 3.2 Prototype mock：mockQuotes 移除業務主管欄位、convertQuoteToOrder 預設訂單為「待業務主管審核」並帶入 paymentTermsNote
- [x] 3.3 Prototype store actions：移除 `approveQuoteByManager` / `submitQuoteForDealApproval` / `markQuoteFirstViewedByManager`、新增 `approveOrderByManager`
- [x] 3.4 Prototype UI：QuoteDetailPage / CreateQuotePanel / EditQuotePanel / StatusStepper 清理、OrderDetail 加核准按鈕 + 等待 banner + 空收款備註 confirm dialog + 資訊表格欄位、SalesManagerApprovalListPage 改為 order-based
- [x] 3.5 Prototype 路由與選單：App.tsx role home / ROLE_ALLOWED_PREFIXES / AppSidebar.tsx sales_manager 菜單調整
- [x] 3.6 type-check 通過 + commit `48224b5` 推送

## 4. 端到端情境驗證

- [ ] 4.1 情境 A：業務於需求單一路推進至成交（無主管介入）→ 業務轉訂單 → 訂單狀態 = 待業務主管審核 → 業務主管核准 → 訂單狀態 = 報價待回簽 → 業務外發報價單 → 客人簽回 → 訂單進入共用段
- [ ] 4.2 情境 B：訂單建立時 paymentTermsNote 為空 → 業務主管核准時跳 confirm dialog「確認已與業務口頭對齊」→ 確認後核准、ActivityLog 記錄「口頭對齊」
- [ ] 4.3 情境 C：業務主管不是訂單指派審核者 → 訂單詳情頁不顯示「核准訂單」按鈕、訂單不會出現在自己的待辦清單
- [ ] 4.4 情境 D：諮詢來源訂單建立（from add-consultation change）→ 訂單同樣經過「待業務主管審核」狀態 → 主管核准後推進至報價待回簽

## 5. doc-audit 與歸檔準備

- [ ] 5.1 觸發 doc-audit skill 檢查跨 spec 一致性（quote-request / order-management / state-machines / user-roles 四份 delta spec）
- [ ] 5.2 修正 doc-audit 報告中的不一致項
- [ ] 5.3 確認 CLAUDE.md § Spec 規格檔清單需更新（quote-request 版本標記為「業務主管 gate 移除」、order-management 版本標記為「新增業務主管審核狀態」）
- [ ] 5.4 執行 `openspec validate relocate-sales-manager-approval-from-quote-to-order --strict` 通過

## 6. 歸檔

- [ ] 6.1 執行 `openspec archive relocate-sales-manager-approval-from-quote-to-order`（delta specs sync 進 main specs）
- [ ] 6.2 更新 CLAUDE.md § Spec 規格檔清單版本與描述
- [ ] 6.3 推送至 Notion Feature Database：
  - 需求單 Notion 頁面更新（移除業務主管 gate 描述、簡化為 6 狀態）
  - 訂單管理 Notion 頁面更新（新增「待業務主管審核」狀態、業務主管審核流程）
  - 使用者角色 Notion 頁面更新（業務主管職責）
