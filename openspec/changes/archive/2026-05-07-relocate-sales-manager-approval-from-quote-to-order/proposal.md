## Why

需求單 v2.0（`add-sales-manager-quote-approval` change，2026-04-27 歸檔）將業務主管核可 gate 設置在「已評估成本 → 議價中」之間。實務上此時點業務主管無新資訊可判斷，淪為形式蓋章；而真正需要主管把關的時點，是業務跟客人成交後、出報價單給客人之前 — 此時報價金額、付款條件、交期都已敲定，主管確認沒問題才正式發給客人簽回，與「印章一蓋就外發」的真實節奏對齊。

本 change 將業務主管 gate 從需求單階段整個搬到訂單階段：需求單流程不再有業務主管審核，業務獨立完成需求確認 → 評估 → 議價 → 成交；訂單建立後狀態為「待業務主管審核」，主管於訂單詳情頁核准後訂單推進至「報價待回簽」，業務即可外發報價單給客人。

設計差異與 v2.0 的關鍵：
- v2.0：gate 在需求單階段（議價前），主管核准後業務才能跟客人開議價
- v3.0（被本 change 取代的方向）：gate 仍在需求單階段（成交後），主管核准後業務才能轉訂單
- 本 change（新方向）：gate 移到訂單階段（訂單建立後 → 報價待回簽前），業務在需求單階段完全自主，主管於訂單上把關

業務主管的指派與審核欄位也跟著從需求單實體移到訂單實體上 — 業務於需求單成交轉訂單時為訂單指派審核業務主管。

## What Changes

- **BREAKING** `quote-request` capability：移除業務主管核可相關 Requirement
  - 移除 `業務主管核可議價推進`（v2.0 議價前 gate）
  - 移除 `業務主管成交後審核`（v3.0 探索方向，未實作）
  - 需求單實體欄位 `approved_by_sales_manager_id` / `approval_required` / `lastApprovedPaymentTermsNote` 移除
  - `payment_terms_note` 欄位保留：作為業務跟客戶討論收款條件的紀錄，成交轉訂單時帶入訂單供業務主管審核參考
- **BREAKING** `state-machines` capability：需求單狀態機收斂為 6 狀態
  - 移除「待業務主管成交審核」與「已核准成交」兩個狀態（從未實作於 main spec，僅出現在 v3.0 探索 change 中）
  - 完整流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失
- **新增** `order-management` capability：訂單階段業務主管 gate
  - 訂單實體新增 `approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` / `lastApprovedPaymentTermsNote` 欄位
  - OrderStatus 新增「待業務主管審核」狀態（位於訂單建立後 → 報價待回簽前）
  - 新增 `approveOrderByManager` action（從「待業務主管審核」推進至「報價待回簽」）
- **修訂** `state-machines` capability：訂單狀態機線下路徑調整
  - 由「報價待回簽 → 已回簽 → 共用段」改為「待業務主管審核 → 報價待回簽 → 已回簽 → 共用段」
- **修訂** `user-roles` capability：業務主管職責調整
  - 業務主管於訂單階段審核（不再涉入需求單流程）
  - 「業務主管專屬待辦清單頁」內容由需求單變為訂單

## Capabilities

### Modified Capabilities
- `quote-request`: 移除業務主管核可 gate 相關 Requirement、移除三個業務主管欄位、保留 `payment_terms_note` 作為轉訂單時的帶入欄位
- `order-management`: 訂單實體新增業務主管審核欄位 + 新增 `approveOrderByManager` action + Order 建立時帶入 `payment_terms_note` from QuoteRequest
- `state-machines`: 需求單狀態機簡化為 6 狀態、訂單線下路徑前段加「待業務主管審核」狀態
- `user-roles`: 業務主管職責由需求單議價前審核改為訂單建立後審核、業務主管專屬待辦清單頁改為訂單列表

## Impact

- **修訂 spec**：`openspec/specs/quote-request/spec.md`、`openspec/specs/order-management/spec.md`、`openspec/specs/state-machines/spec.md`、`openspec/specs/user-roles/spec.md`
- **與其他 change 的關係**：
  - 取代 `add-sales-manager-quote-approval`（2026-04-27 歸檔）的核心 gate 位置設計（v2.0 main spec 內 Requirement 整體被替換）
  - 與 `add-consultation-request-and-revise-approval-gate`（active）正交：諮詢單 change 處理諮詢前置流程，本 change 處理業務主管 gate 位置
  - v3.0 探索方向的 change `revise-quote-request-approval-gate-to-post-deal` 已刪除（從未歸檔，方向被本 change 翻轉）
- **Prototype 已落地**：`sens-erp-prototype` 已實作此設計（2026-05-07 commit `48224b5`）；本 change 為 spec 與 prototype 的對齊
- **Notion 同步**：歸檔後推送至 [Notion Feature Database](https://www.notion.so/2823886511fa83d08c16815824afd2b7)
