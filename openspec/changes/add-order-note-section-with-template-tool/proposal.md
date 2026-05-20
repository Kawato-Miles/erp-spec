## Why

業務 / 諮詢在 [訂單管理 spec](../../specs/order-management/spec.md) 階段填寫備註時，現況有兩個結構性問題：

1. **現有 5 個備註欄位語意各異**：`paymentTermsNote`（從 [需求單](../../specs/quote-request/spec.md) 帶入並鎖定）、`staffNotes`（內部員工溝通）、`notes`（線上單 EC 帶入）、`productionNote`（線下單商品需求）、`authNotes`（客戶授權條款）— 都不是「訂單成立後業務 / 諮詢補充對客戶說明」的標準化欄位。業務真正需要的「補件提醒、交貨注意、付款條件補充」沒有歸宿，只能擠進語意不對的欄位。
2. **手打 free-text 標準差大**：印刷業常用備註是反覆性條款（印刷須知、工作天、深色滿版浮 P 風險、金銀卡刮痕風險、付款條件等 28 條），業務每次手打措辭不一，後續對帳、客訴、補印爭議常追溯到「當初備註寫不清楚」。

詳見 [訂單實體](../../../memory/erp/ERP_Vault/05-entities/訂單.md) 與 [付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)。

業務手上已有一份「報價單備註產生器」原型（HTML 概念稿），按三類整理 28 條常用備註：訂單備註 / 交貨備註 / 付款備註，多選後組合插入。本 change 把這個工具規範化、整合到訂單詳情頁。

對齊 Phase 2 北極星指標「訂單流程完整完成率 >= 60%」：訂單階段備註標準化降低後段（出貨、對帳、客訴）的溝通成本與爭議成本。

## What Changes

- **ADDED** Order 實體 3 個 free-text 欄位：`orderNote` / `deliveryNote` / `paymentNote`，各 `text(500)`，由業務 / 諮詢在訂單階段填寫
- **ADDED** 訂單詳情頁「資訊 Tab」新增「訂單備註」section 容納這三個欄位
- **ADDED** 共用元件 `NoteTemplatePopover`：textarea 旁掛「插入常用備註」按鈕 → 跳出 Popover → 多選 seed 模板（checkbox）→ 點插入 → 文字 append 至 textarea 尾端、Toast 提示
- **ADDED** seed data 28 條（依附件 `/Users/b-f-03-029/Downloads/quote_note_html.html` 搬，按三類分配給三個欄位）
- **ADDED** DESIGN.md 補規範：Form Field label 右側 trailing action button 規範（位置、樣式、與既有 hint icon 共存規則）
- **修改** `OrderInfoEditDialog` 新增三個欄位的編輯區（沿用既有編輯入口、不另開獨立 dialog）

不在本 change 範圍（明確界定）：
- 不開模板 CRUD UI（Prototype 階段 seed data 寫死，未來路徑見 OQ XM-006）
- 不做變數佔位符替換 UI（`[日期]` `[金額]` 由業務手動 search-replace，OQ ORD-011 留 Phase 2）
- 不做多次插入去重（OQ ORD-010 留 Phase 2）
- 不做最近使用 / 常用排序
- 不動既有 `paymentTermsNote` 從 Quote 帶入並鎖定的邏輯
- 不擴展到 [需求單](../../specs/quote-request/spec.md) / 諮詢單 / 售後 ticket 等模組（本 change 範圍只訂單詳情頁）

## Capabilities

### New Capabilities

無（不新增 capability，所有變更掛入既有 spec）

### Modified Capabilities

- `order-management`：Data Model 新增 3 欄位 + 新增「訂單詳情頁訂單備註 section」Requirement（包含編輯權限、編輯時機、與 paymentTermsNote 的視覺區分）
- `prototype-shared-ui`：新增「NoteTemplatePopover 共用元件」Requirement（API、行為、視覺位置、a11y 規範）

## Impact

**程式碼影響**：
- `src/components/shared/NoteTemplatePopover.tsx`（新增）
- `src/data/orderNoteTemplates.ts`（新增 seed data）
- `src/pages/OrderDetail.tsx`（修改：資訊 Tab 加新 section）
- `src/components/order/OrderInfoEditDialog.tsx`（修改：加 3 欄位編輯）
- `src/store/useErpStore.ts`（修改：Order type 加 3 欄位 + update action）
- `sens-erp-prototype/DESIGN.md`（補規範）

**Spec 影響**：
- `openspec/specs/order-management/spec.md`：MODIFIED（Data Model + 新 Requirement）
- `openspec/specs/prototype-shared-ui/spec.md`：MODIFIED（新 Requirement）

**不影響**：
- `openspec/specs/quote-request/spec.md`（paymentTermsNote 帶入邏輯不變）
- `openspec/specs/state-machines/spec.md`（不改狀態機）
- `openspec/specs/business-processes/spec.md`（不改商業流程）
- `openspec/specs/user-roles/spec.md`（角色不變、編輯權限沿用既有業務 / 諮詢權限）

**Open Questions（必須在 design 階段對齊）**：

| OQ ID | 問題 | 影響 |
|-------|------|------|
| ORD-005 | 誰可以編輯這三個新欄位（業務 owner / 業務 + 諮詢 / 業務主管）？ | spec § Roles & Permissions |
| ORD-006 | 編輯時機（訂單成立後到出貨前 / 完成前 / 整個生命週期）？ | spec § Field Lock Rules |
| ORD-007 | 與既有 paymentTermsNote 的 UI 共存策略（兩個都顯示？如何區分「報價階段約定」vs「訂單階段補充」）？ | 訂單詳情頁版型 |
| ORD-008 | 異動追蹤（last_updated_by / last_updated_at / audit trail）是否需要？ | Data Model metadata |
| ORD-009 | 是否要顯示在業務平台訂單列表 / 我的訂單頁？ | sales-platform spec |
| ORD-010 | 重複插入防呆（Phase 2 議題） | 元件演進 |
| ORD-011 | 變數佔位符 [日期] [金額] 處理（Phase 2 議題） | UX 流程演進 |
| XM-006 | 模板維護路徑（系統設定模組 / 業務工具）（Phase 2 議題） | 系統範疇 |

**測試影響**：
- Playwright e2e spec 新增：訂單詳情頁 → 資訊 Tab → 訂單備註 section → 點按鈕 → 勾選 → 插入 → assert textarea value
- 三視角審查：本 change 為「結構性變更（新增 3 欄位 + 新元件）」級別，需 erp-consultant + ceo-reviewer + senior-pm 三視角完整輪次
- impeccable 兩輪審查：clarify（文案校準）+ polish（互動視覺）

**業務 ROI（待 ceo-reviewer 驗證）**：
- 預期降低訂單階段備註寫不清楚造成的後段爭議成本
- 預期加速備註填寫（業務點選取代手打）
- KPI 量化指標：訂單流程完整完成率（Phase 2 北極星）的間接貢獻
