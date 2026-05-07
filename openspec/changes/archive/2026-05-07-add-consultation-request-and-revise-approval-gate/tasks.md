## 1. OQ 解答（先於 prototype 實作）

- [x] 1.1 解 OQ #1：諮詢單轉需求單的欄位帶入細節 mapping table（已解 — 見 design.md D7）
- [x] 1.2 解 OQ #2：退款情境（已解 — 待諮詢取消觸發建諮詢訂單 + 退款 Payment + (issue_now) SalesAllowance；見 design.md D2 與 consultation-request spec § 諮詢取消觸發建諮詢訂單與退費）
- [x] 1.3 解 OQ #3：諮詢角色定位（已解 — 諮詢人員為組織獨立職位、ERP 內權限 = 業務權限、轉需求單時 consultant_id 自動成為需求單 owner）
- [x] 1.4 解 OQ #4：諮詢逾時自動結案規則（已解 — Phase 1 不實作自動結案，業務人工判斷；Phase 2 視運營資料補規則）
- [x] 1.5 解 OQ #5：estimated_quantity_band 校驗規則（已解 — 不校驗、不警示，級距僅作印件數量預填參考、諮詢費為固定金額）
- [x] 1.6 將 OQ 解答結果補入對應 spec / design.md（5 個 OQ 全部已落地）

## 2. 三視角審查（已執行 2026-05-06，部分結論需重新審視）

- [x] 2.1 senior-pm agent 審查：完成（核心建議：拆 change 否決，但補 KPI 與客人視角訊息層仍待落地）
- [x] 2.2 ceo-reviewer agent 審查：完成（部分建議因背景理解錯誤已忽略；諮詢訂單編號前綴 / 對外發票文字建議仍可採納）
- [x] 2.3 erp-consultant agent 審查：完成（揭示 Payment 對帳問題，已促成本 change 重新設計為 Payment polymorphic + OrderExtraCharge 機制）
- [x] 2.4 收斂審查 feedback 並大幅重新設計：完成（design.md 三度修訂、specs 全面對齊新機制）

## 3. Prototype 資料層（sens-erp-prototype）

- [ ] 3.1 在 `src/lib/types/` 新增 `ConsultationRequest` type，含 14 個表單欄位 + 系統內生欄位（id / created_at / consultant_id / consulted_at / status / result / linked_quote_request_id / linked_consultation_order_id）
- [ ] 3.2 擴充 `Order` type 的 `order_type` 為三值 enum（線下 / 線上 / 諮詢）
- [ ] 3.3 新增 `OrderExtraCharge` 實體 type（id / order_id / charge_type / amount / description / created_by），訂單應收計算改為 `∑ 印件費 + ∑ OrderExtraCharge + ∑ 已執行 OrderAdjustment`
- [ ] 3.4 擴充 `Payment` type 為 polymorphic：linked_entity_type / linked_entity_id / is_transferred / original_entity_type / original_entity_id（與 refactor change 協調）
- [ ] 3.5 mock 中模擬 webhook 觸發只建 ConsultationRequest + Payment（不建任何 Order）
- [x] 3.6 在 mock data store 新增 ConsultationRequest 範例資料（涵蓋待諮詢 / 已轉需求單 / 完成諮詢 / 已取消 4 個狀態各 1-2 筆）
- [ ] 3.7 mock 資料 id / 編號採真實業務格式（ConsultationRequest 編號 `CR-YYYYMM-NNNN`、諮詢訂單延用一般訂單編號規則）

## 4. Prototype 諮詢單模組 UI

- [ ] 4.1 建立 `src/components/consultation/` 模組目錄
- [ ] 4.2 諮詢單列表頁（含篩選：自己負責 / 全部、status 篩選、預約日期排序）
- [ ] 4.3 諮詢單詳情頁（顯示 14 個表單欄位 + 系統欄位 + 關聯 Payment + ActivityLog）
- [ ] 4.4 詳情頁「指派諮詢人員」動作（status = 待諮詢 才顯示）
- [ ] 4.5 詳情頁「開始諮詢」動作（status = 待諮詢 + 已指派才顯示）
- [ ] 4.6 詳情頁「結束諮詢」分支按鈕（status = 諮詢中 才顯示，含「不做大貨」與「轉需求單」兩按鈕）
- [ ] 4.7 詳情頁「取消諮詢」動作（status = 待諮詢 才顯示，觸發退費流程）
- [ ] 4.8 詳情頁顯示 `linked_quote_request_id` / `linked_consultation_order_id` 跳轉連結（若已關聯）
- [ ] 4.9 對齊 DESIGN.md（業務規範、視覺 token、UX 模式、頁面模板）

## 5. Prototype 需求單修訂（諮詢單 entry point）

> 業務主管 gate 位置調整由獨立 change `relocate-sales-manager-approval-from-quote-to-order` 處理，本章節僅含諮詢單 entry point 相關修訂。

- [x] 5.1 新增「來自諮詢單」資訊區塊（when linkedConsultationRequestId 非空，顯示諮詢費已預收提示）
- [x] 5.2 諮詢來源需求單流失時觸發建諮詢訂單流程（系統自動，非業務手動操作）
- [x] 5.3 需求單建立時自動帶入 linkedConsultationRequestId / requirementNote（從 ConsultationRequest 轉入時）

## 6. Prototype 訂單模組擴充

- [ ] 6.1 訂單列表頁支援 `order_type` 篩選（線下 / 線上 / 諮詢）
- [ ] 6.2 諮詢訂單詳情頁（短路徑 UI：建立 → 已開發票 → 訂單完成；無印件區塊、無工單區塊、無出貨區塊）
- [ ] 6.3 一般訂單詳情頁顯示「諮詢費已預收 X 元（OrderExtraCharge）」（when 訂單來自諮詢需求單）
- [ ] 6.4 訂單明細區塊支援 OrderExtraCharge 顯示（含 charge_type 標示）
- [ ] 6.5 主訂單三方對帳檢視面板算式更新為 `∑ 印件費 + ∑ OrderExtraCharge + ∑ OrderAdjustment`
- [ ] 6.6 諮詢取消對帳面板顯示「退費完成」標示（不顯示「對帳通過」）
- [ ] 6.7 與 refactor change 整合：確認 Payment / Invoice / SalesAllowance / OrderAdjustment 等實體在 sens-erp-prototype 中已 ready 後再做諮詢流程 UI

## 7. Prototype Webhook 模擬

- [ ] 7.1 提供「模擬 surveycake webhook 觸發」按鈕（dev only），用於本地測試自動建單
- [ ] 7.2 模擬器 SHALL 提供 14 欄位填寫表單，模擬 webhook payload
- [ ] 7.3 觸發後系統建立 ConsultationRequest + Payment（綁 ConsultationRequest），不建 Order；ActivityLog 寫入

## 8. 端到端情境驗證

- [ ] 8.1 情境 A：客人填表單 → 付款（defer_to_main_order）→ webhook 建 ConsultationRequest + Payment（綁 CR）→ 諮詢 → 不做大貨 → 建諮詢訂單 + Payment 轉移 + 開 Invoice → 訂單完成
- [ ] 8.2 情境 B：客人填表單 → 付款（issue_now）→ webhook 建 ConsultationRequest + Payment（綁 CR）→ 諮詢 → 不做大貨 → 建諮詢訂單 + Payment 轉移 + 立即開 Invoice → 訂單完成
- [ ] 8.3 情境 C：客人填表單 → 付款 → 諮詢 → 做大貨 → 建需求單（不建任何訂單）→ 議價 → 成交 → 業務轉訂單 → 建一般訂單 + OrderExtraCharge(consultation_fee) + Payment 從 CR 轉移至一般訂單 → 一般訂單應收 5000、已收 1000、待繳 4000（業務主管審核步驟由獨立 change 處理，不含於此情境）
- [ ] 8.4 情境 D：情境 C + issue_now → 一般訂單立即開立諮詢費 Invoice（金額 1000）+ 業務後續開立印件費 Invoice（金額 4000）
- [ ] 8.5 情境 E：情境 C + defer_to_main_order → 業務正常開立 Invoice 涵蓋全額（含諮詢費）
- [ ] 8.6 情境 F：諮詢結束做大貨後需求單議價中流失 → 系統建諮詢訂單 + Payment 轉移 + 開 Invoice → 訂單完成；ConsultationRequest 結局更新為「完成諮詢」
- [ ] 8.7 情境 G：諮詢結束做大貨後需求單在「需求確認中」就流失 → 系統行為同情境 F
- [ ] 8.8 情境 H：待諮詢取消（defer_to_main_order，未開票）→ 建諮詢訂單 + Payment 轉移 + 退款 Payment + 不開 Invoice → 訂單完成（退費完成）
- [ ] 8.9 情境 I：待諮詢取消（issue_now，已開票）→ 建諮詢訂單 + Payment 轉移 + 開 Invoice + 退款 Payment + 開 SalesAllowance → 訂單完成（退費完成）
- [ ] 8.10 情境 J：諮詢中嘗試取消 → 系統拒絕，UI 提示「諮詢已開始，無法退費」
- [ ] 8.11 情境 K：同一 ConsultationRequest 嘗試對應兩個訂單 → 系統拒絕（Payment is_transferred 鎖定）
- [ ] 8.12 情境 L：一般需求單（非諮詢來源）流失 → 不觸發任何諮詢訂單建立

## 9. doc-audit 與歸檔準備

- [ ] 9.1 觸發 doc-audit skill 檢查跨 spec 一致性（quote-request / order-management / state-machines / user-roles / business-processes / consultation-request 六份 delta spec）
- [ ] 9.2 修正 doc-audit 報告中的不一致項
- [ ] 9.3 確認 CLAUDE.md § Spec 規格檔清單需新增「諮詢單模組」一行（路徑 `openspec/specs/consultation-request/spec.md`）
- [ ] 9.4 確認 CLAUDE.md § ERP 高頻術語需補入「諮詢單 / 諮詢訂單 / OrderExtraCharge」三個術語
- [ ] 9.5 執行 `openspec validate add-consultation-request-and-revise-approval-gate --strict` 通過

## 10. 與 refactor-order-payment-and-invoice-with-billing-company 整合

- [ ] 10.1 確認 refactor change 進度：本 change 對 refactor change 的 Payment 模型有 polymorphic 修改需求，需協調
- [ ] 10.2 與 refactor change 撰寫者協調 Payment.linked_entity_type / linked_entity_id 的設計（推翻原 order_id 必填 FK 設計）
- [ ] 10.3 確認 OrderExtraCharge 與 OrderAdjustment 在 refactor change 對帳檢視面板算式中的權重相同（已執行 OrderAdjustment 與 OrderExtraCharge 都計入應收）
- [ ] 10.4 兩個 change 歸檔順序協調：建議兩個 change 一起歸檔，因為 Payment polymorphic 修改影響 refactor change 與本 change 各自的 spec 描述

## 11. 歸檔（Phase 1 完成 + refactor change 整合後）

- [ ] 11.1 執行 `/opsx:archive add-consultation-request-and-revise-approval-gate`（delta specs sync 進 main specs）
- [ ] 11.2 更新 CLAUDE.md § Spec 規格檔清單版本號（quote-request 增加諮詢單 entry point 修訂、order-management 對應更新、新增 consultation-request v0.1）
- [ ] 11.3 推送至 Notion Feature Database：
  - 諮詢單為新模組，新建 Notion 頁面
  - 需求單 Notion 頁面更新（補入諮詢單 entry point 描述）
  - 訂單管理 Notion 頁面更新（搭配 refactor change 推送）
- [ ] 11.4 將解答完的 OQ 在 Notion Follow-up DB 標記為已解

## 12. Agent 機制改善（後續處理）

- [ ] 12.1 整理 2026-05-06 三視角審查的問題：CEO agent 不知 ERP 從零建置 context、agent 用詞非台灣繁體中文、ERP 顧問挑出的對帳問題反映 spec 文字不夠精準
- [ ] 12.2 改善 agent 機制：在 agent prompt 中明示「Phase 1 prototype 階段、無正式系統部署」context；強化繁中用詞要求；要求 agent 先確認對使用者真實設計的理解才動審查
