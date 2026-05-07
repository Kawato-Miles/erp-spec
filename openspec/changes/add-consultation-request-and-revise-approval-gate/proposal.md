## Why

部分客人在下單前會先預約諮詢，討論完成後才決定是否實際製作大貨。現行 ERP 沒有這段前置流程的紀錄，諮詢費收款、諮詢結果、後續是否轉需求單都散落在 surveycake 表單與業務的個人筆記中，無法串起客人從「諮詢付款」到「最終下單」的完整足跡。

## What Changes

- **新增** `consultation-request` capability：客人付款後 webhook 自動建立 ConsultationRequest 諮詢單，諮詢結束可流向「諮詢訂單（不做大貨）」或「轉需求單（要做大貨）」兩個出口
- **訂單 order_type 三值化**：由「線下 / 線上(EC)」擴成「線下 / 線上(EC) / 諮詢」；諮詢訂單沒有印件、不需製作、不出貨
- **PaymentRecord 補強**：新增跨單據關聯能力，諮詢費可 mapping 為後續一般訂單的已收訂金，做大貨時抵扣
- **新增** 表單入口：外部 surveycake 表單 + 金流 webhook 自動建單，14 個表單欄位 mapping 進 ConsultationRequest
- **新增** 需求單 entry point：從 ConsultationRequest 轉入時自動填入客戶資料、`linkedConsultationRequestId`、需求備註，需求單流失時觸發建諮詢訂單收尾流程

> 業務主管 gate 的位置調整（從需求單議價前 → 訂單建立後）由獨立 change `relocate-sales-manager-approval-from-quote-to-order` 處理，本 change 不涉及。

## Capabilities

### New Capabilities
- `consultation-request`: 客人付款後自動建立的諮詢單前置實體，含表單蒐集欄位（14 題）、狀態機（v2 簡化：待諮詢 → 已轉需求單 / 完成諮詢 / 已取消）、雙出口轉換邏輯與發票時間點處理（由表單 Q4 客人自選 issue_now / defer_to_main_order）

### Modified Capabilities
- `quote-request`: 新增從 ConsultationRequest 轉入的 entry point；新增 `linkedConsultationRequestId` / `requirementNote` 欄位；需求單流失（議價中前）若由諮詢單轉入，觸發建諮詢訂單收尾流程
- `order-management`: order_type 由二值擴成三值（含「諮詢」）、PaymentRecord 補齊跨單據關聯能力、訂單建立時帶入諮詢費為初始已收訂金、諮詢來源訂單建立時自動加 OrderExtraCharge(charge_type=consultation_fee)
- `state-machines`: 訂單狀態機新增諮詢訂單路徑（無印件、無製作、無出貨）；ConsultationRequest 狀態機獨立定義
- `user-roles`: 諮詢角色職責細化（諮詢單建立後的指派、諮詢結束後的轉單動作）
- `business-processes`: 新增「客人填表單 → 付款 → 諮詢 → 決定走向 → 諮詢訂單或一般訂單」端到端流程

## Impact

- **新建 spec**：`openspec/specs/consultation-request/spec.md`
- **修訂 spec**：`openspec/specs/quote-request/spec.md`、`openspec/specs/order-management/spec.md`、`openspec/specs/state-machines/spec.md`、`openspec/specs/user-roles/spec.md`、`openspec/specs/business-processes/spec.md`
- **外部整合**：surveycake 表單 + 金流平台 webhook（諮詢費付款成功事件 → ERP 自動建 ConsultationRequest）
- **Notion 同步**：歸檔後推送至 [Notion Feature Database](https://www.notion.so/2823886511fa83d08c16815824afd2b7)；諮詢單為新模組，需新建 Notion 頁面
- **Prototype 衝擊**：
  - `sens-erp-prototype` 已新增 `src/components/consultation/` 模組與 `src/pages/Consultation*` 頁面（已落地）
  - 訂單模組已支援 OrderExtraCharge / linkedConsultationRequestId / 諮詢來源 Payment 帶入（已落地）
- **資料遷移**：現行透過 surveycake 已收的諮詢資料是否需回填 ERP — design.md 階段討論

## Open Questions（待 design.md 階段帶解）

| # | OQ | 必解時機 |
|---|----|---------|
| 1 | 諮詢單轉需求單時的欄位帶入規則（哪些 mapping、哪些重填、印件規格何時釐清） | design.md ✓ 已解 |
| 2 | 退款情境（ConsultationRequest 是否需「已取消 / 已退費」狀態、PaymentRecord refund 處理） | design.md ✓ 已解 |
| 3 | 諮詢角色定位（諮詢專人 vs 業務兼任、權限邊界） | user-roles spec 撰寫時 ✓ 已解 |
| 4 | 諮詢無法成案的時限（自動結案規則、結案後的金流走向） | state-machines spec 撰寫時 |
| 5 | estimated_quantity_band 與需求單印件數量校驗（級距 vs 實際量不一致時的警示與分級定價影響） | spec 校驗章節 |
