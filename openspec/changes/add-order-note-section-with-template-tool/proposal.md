## Why

業務 / 諮詢在 [訂單管理 spec](../../specs/order-management/spec.md) 階段填寫備註時，現況有兩個結構性問題：

1. **既有備註欄位按「來源／可見性」拆分，缺「業務主題」維度的欄位**：[既有 spec § 訂單備註三類分欄](../../specs/order-management/spec.md)（spec.md:1496-1525）已將備註拆為三類 — `customer_note`（線上單客戶端帶入、唯讀）、`internal_note`（內部員工備註、客戶不可見）、`production_note`（線下單訂單製作備註，含「製作／交易／出貨備註彙整」）。但這三類的切分維度是「誰寫的／誰能看」，**沒有按「業務主題」（訂單條件／交貨條件／付款條件）分欄**。實務上業務在訂單階段補充對客戶說明的話術，會擠進語意對應度低的欄位（多塞進 `production_note`），導致下游（出貨／對帳／客服）難以快速定位「客戶當初被告知的條件」。
2. **手打 free-text 標準差大**：印刷業常用備註是反覆性條款（印刷須知、工作天、深色滿版浮 P 風險、金銀卡刮痕風險、付款條件等 28 條），業務每次手打措辭不一，後續對帳、客訴、補印爭議常追溯到「當初備註寫不清楚」。

詳見 [訂單實體](../../../memory/erp/ERP_Vault/05-entities/訂單.md) 與 [付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)。

業務手上已有一份「報價單備註產生器」原型（HTML 概念稿），按三類整理 28 條常用備註：訂單備註 / 交貨備註 / 付款備註，多選後組合插入。本 change 把這個工具規範化、整合到訂單詳情頁。

**業務 vs 諮詢使用情境差異**（待 [ORD-005](../../../memory/erp/ERP_Vault/08-open-questions/ORD-005-訂單階段備註欄位編輯權限.md) UAT 驗證）：
- 業務：訂單成立後補充對客戶說明的詳細條款（高頻、字數多、傾向用模板）
- 諮詢：諮詢階段對客戶口頭說明後補記要點（中頻、字數少、傾向 free-text）

**客戶溝通閉環路徑**：本 change 只負責「業務在訂單階段標準化填寫備註」這一步；客戶看見備註的路徑由**後續報價單／訂單確認單匯出功能**承接（OQ [ORD-012](../../../memory/erp/ERP_Vault/08-open-questions/ORD-012-訂單備註匯出至客戶文件路徑.md) 留下游 epic）。Phase 1 業務可手動將備註內容貼到 LINE／email 給客戶，待匯出功能完成後改為系統自動帶出。

對齊 Phase 2 北極星指標「訂單流程完整完成率 >= 60%」：訂單階段備註標準化降低後段（出貨、對帳、客訴）的溝通成本與爭議成本。**ROI 量化指標**待 design 階段補 baseline（建議統計：售後 ticket 中 `responsibility=communication` 且關鍵字含「備註／條款／沒講清楚」的月件數，作為對照基線）。

## What Changes

- **ADDED** Order 實體 3 個 free-text 欄位：`order_note` / `delivery_note` / `payment_note`，各 `text(500)`，由業務 / 諮詢在訂單階段填寫
- **ADDED** 訂單詳情頁「資訊 Tab」新增「訂單備註」section 容納這三個欄位，並與既有「訂單備註三類分欄」（`customer_note` / `internal_note` / `production_note`）視覺分組，明確區分兩個維度：
  - 既有三類：**按「來源／可見性」分**（誰寫的、誰能看）
  - 新增三類：**按「業務主題」分**（訂單條件 / 交貨條件 / 付款條件）
- **ADDED** 共用元件 `NoteTemplatePopover`：textarea 旁掛「插入常用備註」按鈕 → 跳出 Popover → 多選 seed 模板（checkbox）→ 點插入 → 文字 append 至 textarea 尾端、Toast 提示
- **ADDED** seed data 28 條（依附件 `/Users/b-f-03-029/Downloads/quote_note_html.html` 搬，按新三類分配給三個欄位）
- **ADDED** DESIGN.md 補規範：Form Field label 右側 trailing action button 規範（位置、樣式、與既有 hint icon 共存規則）
- **ADDED** User Story US-ORD-005「業務於訂單階段補充客戶溝通備註」（依 [user-story-spec](../../../memory/erp/ERP_Vault/11-review-knowledge/protocols/user-story-spec.md) 起草）
- **新增** `OrderNotesEditDialog`（獨立 dialog）：點訂單備註 section header 的「編輯」按鈕開啟，含 3 個 textarea + NoteTemplatePopover。不沿用既有 `OrderInfoEditDialog`，原因是兩者進入時機規則不同（OrderInfoEditDialog 受 `isBeforeProduction` 約束、本 dialog 受「訂單完成前」約束），詳見 [ORD-014](../../../memory/erp/ERP_Vault/08-open-questions/ORD-014-訂單備註與訂單資訊編輯dialog分開.md)

不在本 change 範圍（明確界定）：
- 不開模板 CRUD UI（Prototype 階段 seed data 寫死，未來路徑見 OQ [XM-006](../../../memory/erp/ERP_Vault/08-open-questions/XM-006-備註模板維護路徑.md)）
- 不做變數佔位符替換 UI（`[日期]` `[金額]` 由業務手動 search-replace，OQ [ORD-011](../../../memory/erp/ERP_Vault/08-open-questions/ORD-011-備註模板變數佔位符處理.md) 留 Phase 2）
- 不做多次插入去重（OQ [ORD-010](../../../memory/erp/ERP_Vault/08-open-questions/ORD-010-備註模板重複插入防呆.md) 留 Phase 2）
- 不做最近使用 / 常用排序
- 不動既有 `payment_terms_note` 從 Quote 帶入並鎖定的邏輯
- 不動既有「訂單備註三類分欄」Requirement 的 `customer_note` / `internal_note` / `production_note` 欄位
- 不擴展到 [需求單](../../specs/quote-request/spec.md) / 諮詢單 / 售後 ticket 等模組（本 change 範圍只訂單詳情頁；需求單 paymentTermsNote 在報價階段已可填寫且帶入訂單，本 change 是訂單階段補充）
- 不做客戶端輸出（PDF / 客戶 portal 顯示）— 由後續報價單匯出 epic 承接（OQ [ORD-012](../../../memory/erp/ERP_Vault/08-open-questions/ORD-012-訂單備註匯出至客戶文件路徑.md)）

## Capabilities

### New Capabilities

無（不新增 capability，所有變更掛入既有 spec）

### Modified Capabilities

- `order-management`：Data Model 新增 3 欄位 + 新增「訂單詳情頁訂單備註 section」Requirement（包含編輯權限、編輯時機、與既有三類分欄的視覺分組策略、與 `payment_terms_note` 的共存策略）
- `prototype-shared-ui`：新增「NoteTemplatePopover 共用元件」Requirement（API、行為、視覺位置、a11y 規範）

## Impact

**程式碼影響**：
- `src/components/shared/NoteTemplatePopover.tsx`（新增）
- `src/data/orderNoteTemplates.ts`（新增 seed data）
- `src/pages/OrderDetail.tsx`（修改：資訊 Tab 加新 section）
- `src/components/order/OrderNotesEditDialog.tsx`（新增：獨立 dialog，3 個 textarea + NoteTemplatePopover）
- `src/store/useErpStore.ts`（修改：Order type 加 3 欄位 + update action）
- `sens-erp-prototype/DESIGN.md`（補規範）

**Spec 影響**：
- `openspec/specs/order-management/spec.md`：MODIFIED（Data Model + 新 Requirement）
- `openspec/specs/prototype-shared-ui/spec.md`：MODIFIED（新 Requirement）

**既有 spec 既存欄位（不修改）**（修正：對齊 spec snake_case，刪除誤引用的 authNotes）：
- `payment_terms_note`（收款條件，從需求單帶入鎖定）— 仍唯讀顯示
- `payment_detail`（付款方式備註：分期資訊／發票備註）— 不動
- `customer_note`（線上單客戶端，原 `notes` 欄位）— 依 order_source 顯示
- `internal_note`（內部員工備註，Prototype 沿用 `staffNotes` 命名）— 依 order_source 顯示
- `production_note`（線下單訂單製作備註）— 依 order_source 顯示

**不影響**：
- `openspec/specs/quote-request/spec.md`（`payment_terms_note` 帶入邏輯不變）
- `openspec/specs/state-machines/spec.md`（不改狀態機）
- `openspec/specs/business-processes/spec.md`（不改商業流程）
- `openspec/specs/user-roles/spec.md`（角色不變、編輯權限沿用既有業務 / 諮詢權限）

**Open Questions**：

P0（必須在 design 階段對齊）：

| OQ ID | 問題 | 影響 |
|-------|------|------|
| [ORD-005](../../../memory/erp/ERP_Vault/08-open-questions/ORD-005-訂單階段備註欄位編輯權限.md) | 誰可以編輯這三個新欄位（業務 owner / 業務 + 諮詢 / 業務主管）？ | spec § Roles & Permissions |
| [ORD-006](../../../memory/erp/ERP_Vault/08-open-questions/ORD-006-訂單階段備註欄位編輯時機.md) | 編輯時機（訂單成立後到出貨前 / 完成前 / 整個生命週期）？ | spec § Field Lock Rules |
| [ORD-007](../../../memory/erp/ERP_Vault/08-open-questions/ORD-007-新備註欄位與paymentTermsNote共存策略.md) | 與既有 `payment_terms_note`（唯讀）的 UI 共存策略？如何區分「報價階段約定」vs「訂單階段補充」？ | 訂單詳情頁版型 |
| [ORD-013](../../../memory/erp/ERP_Vault/08-open-questions/ORD-013-新三類與既有production_note職責分工.md) | 新三類與既有 `production_note`（已涵蓋「製作 / 交易 / 出貨備註彙整」）的職責分工：deliveryNote 與 production_note 的「出貨備註」如何劃分？ | spec § Data Model + UI 業務溝通策略 |

P1（design 階段帶過，未來路徑）：

| OQ ID | 問題 | 影響 |
|-------|------|------|
| [ORD-008](../../../memory/erp/ERP_Vault/08-open-questions/ORD-008-訂單備註欄位異動追蹤.md) | 異動追蹤（last_updated_by / last_updated_at / audit trail）是否需要？ | Data Model metadata |
| [ORD-009](../../../memory/erp/ERP_Vault/08-open-questions/ORD-009-訂單備註欄位業務平台可見性.md) | 是否要顯示在業務平台訂單列表 / 我的訂單頁？ | sales-platform spec |
| [ORD-012](../../../memory/erp/ERP_Vault/08-open-questions/ORD-012-訂單備註匯出至客戶文件路徑.md) | 後續報價單／訂單確認單匯出功能如何引用這三個欄位（順序、標題、視覺）？ | 下游 epic |

Phase 2 議題：

| OQ ID | 問題 |
|-------|------|
| [ORD-010](../../../memory/erp/ERP_Vault/08-open-questions/ORD-010-備註模板重複插入防呆.md) | 重複插入防呆（已插入模板顯示為已勾選/已用） |
| [ORD-011](../../../memory/erp/ERP_Vault/08-open-questions/ORD-011-備註模板變數佔位符處理.md) | 變數佔位符 [日期] [金額] 處理 |
| [XM-006](../../../memory/erp/ERP_Vault/08-open-questions/XM-006-備註模板維護路徑.md) | 模板維護路徑（系統設定模組 / 業務工具） |

**測試影響**：
- Playwright e2e spec 新增：訂單詳情頁 → 資訊 Tab → 訂單備註 section → 點按鈕 → 勾選 → 插入 → assert textarea value
- impeccable 兩輪審查：clarify（文案校準）+ polish（互動視覺）

**業務 ROI 量化基線**（待 design 階段補）：
- 對照指標：售後 ticket 中 `responsibility=communication` 且關鍵字含「備註／條款／沒講清楚」的月件數
- 預期：上線 3 個月後該指標下降 X%（具體 X 待 baseline 統計後設定）
- 北極星指標貢獻：間接（不直接影響「訂單流程完整完成率」），但降低後段返工成本

**三視角審查 round 1 結論**：
- erp-consultant：反對「扁平 3 欄位」、建議「多型 OrderNote 子實體」→ Miles 拍板**保留扁平**（理由：Prototype 階段優先簡單性、與既有 spec 風格一致）
- ceo-reviewer：條件通過，建議「砍到 1 欄位 + Popover Tab」+「customer-facing 出口」→ Miles 拍板**保留三欄位 + 承諾後續報價單匯出 epic**
- senior-pm：條件通過，建議「擴展到需求單編輯 panel」→ Miles 拍板**仍只做訂單詳情頁**（理由：需求單階段的 paymentTermsNote 已能標準化填寫並帶入訂單，本 change 是訂單階段補充而非取代）
- 共識：proposal 已修正既有欄位描述事實錯誤（snake_case + 刪除 authNotes）、補上「customer-facing 路徑承諾」、補上「ORD-013 新舊三類職責分工」OQ
