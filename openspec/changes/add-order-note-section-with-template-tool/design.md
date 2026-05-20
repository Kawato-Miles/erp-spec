## Context

本 change 為訂單詳情頁的「資訊 Tab」新增「訂單備註」section，加 3 個 Order 新欄位（`order_note` / `delivery_note` / `payment_note`），並提供 `NoteTemplatePopover` 共用元件實現「按欄位分類的 seed 模板多選插入」工作流。設計動機詳見 [proposal](./proposal.md)。

**現況**：
- Order 實體既有 5 個備註欄位：`payment_terms_note`（從 Quote 帶入鎖定）、`payment_detail`、`customer_note`（線上單帶入）、`internal_note`（內部）、`production_note`（線下單訂單製作備註）
- spec.md:1496-1525 既有「訂單備註三類分欄」Requirement 已按「來源／可見性」拆三類
- 業務手上有 28 條「報價單備註產生器」HTML 原型 seed
- Prototype 技術棧：React + TypeScript + Tailwind + shadcn/ui，路徑 `/Users/b-f-03-029/sens-erp-prototype/`
- DESIGN.md §1.4.2 既有 Popover / Checkbox / Sonner Toast / Sheet / Dialog 規範

**三視角審查 round 1 結論**：
- erp-consultant 反對「扁平 3 欄位」、建議多型實體 → Miles 拍板**保留扁平**
- ceo-reviewer 條件通過、建議「customer-facing 出口」+ 「砍 1 欄位 + Tab」→ Miles 拍板**承諾後續報價單匯出 epic** + **保留三欄位**
- senior-pm 條件通過、建議「擴展到需求單編輯 panel」→ Miles 拍板**仍只做訂單詳情頁**

**約束**：
- Prototype 階段不寫實作程式碼，只驗證規格、邏輯、UI 與 UX
- 不引入新後端依賴（mock store 模擬）
- 不動既有「訂單備註三類分欄」Requirement
- 模板 seed data 寫死，不做 CRUD UI

## Goals / Non-Goals

**Goals**：

1. 在訂單詳情頁資訊 Tab 新增「訂單備註」section，明確區分**內部備註**（既有 3 類）與**對客戶說明**（新 3 類）兩個維度
2. 業務 / 諮詢可在每個新欄位旁透過 Popover 多選 seed 模板，組合插入備註
3. 共用元件 NoteTemplatePopover 設計為「可掛在任意 textarea 欄位旁」的通用 molecule，未來其他模組可重用
4. 28 條 seed 模板按業務主題分類至三個欄位，業務上手成本低
5. 對齊 Phase 2 北極星指標「訂單流程完整完成率 >= 60%」：間接降低後段（出貨／對帳／客服）的爭議返工成本

**Non-Goals**：

1. 不做模板 CRUD UI（不允許業務增刪改 seed）
2. 不做變數佔位符替換 UI（`[日期]` `[金額]` 業務手動 search-replace）
3. 不做多次插入去重（業務自行控管）
4. 不做最近使用 / 常用排序
5. 不擴展到需求單 / 諮詢單 / 售後 ticket 等模組
6. 不做客戶端輸出（PDF / 客戶 portal 顯示）— 由後續報價單匯出 epic 承接
7. 不取代既有 `production_note` 等欄位（兩套並存）
8. 不引入後端 API（Prototype 階段 mock store）

## Decisions

### 決策 1：採扁平 3 欄位、不採多型 OrderNote 子實體

**選擇**：Order 實體直接新增 `order_note` / `delivery_note` / `payment_note` 三個 `text(500)` 欄位。

**理由**：
- **Prototype 階段優先簡單性**：扁平欄位實作成本低，與 Order CRUD 流程一致；多型子實體需新增 entity / mock store 子集合 / UI 多 row 渲染 / join 邏輯，超出 Phase 1 範疇
- **與既有 spec 風格一致**：既有「訂單備註三類分欄」（customer_note / internal_note / production_note）就是扁平多欄位設計，保持一致降低業務認知負擔
- **欄位數量可控**：5 既有 + 3 新增 = 8 個備註欄位，但既有 3 類**依 order_source 條件顯示**（線上單只顯示 customer_note + internal_note，線下單只顯示 internal_note + production_note），實際同時可見的欄位最多 5 個（不會出現全部 8 個並排）
- **未來路徑保留**：若 Phase 2+ 需擴展更多分類，可遷移至多型子實體（Vault 中 [ORD-013 OQ](../../../memory/erp/ERP_Vault/08-open-questions/ORD-013-新三類與既有production_note職責分工.md) 留下路徑）

**Alternatives considered**：
- **多型 OrderNote 子實體**（erp-consultant 建議）：被否決。Prototype 階段成本過高，且既有「訂單備註三類分欄」尚未驗證過業務實務分類維度，現在改成子實體會把未驗證假設固化到資料結構
- **1 欄位 + Popover 內 Tab 分類**（ceo-reviewer 建議）：被否決。三類業務主題在實務上對應到不同的下游需求（交貨備註 → 出貨單、付款備註 → 對帳、訂單備註 → 印件確認），合併單欄位後下游無法分流查詢；新增三類分欄符合業務分流需求

### 決策 2：與既有「訂單備註三類分欄」並存，視覺分組區分「內部 vs 對客戶」

**選擇**：訂單詳情頁資訊 Tab 呈現兩組 textarea：
- **既有「訂單備註」區塊**（`customer_note` / `internal_note` / `production_note`，依 order_source 條件顯示）：保持原位置
- **新增「訂單備註」區塊**（`order_note` / `delivery_note` / `payment_note`，三欄全顯示）：放在訂單資訊卡與既有訂單備註區塊之間，作為對外條款集中區

**理由**：
- **維度不同**：既有三類按「來源／可見性」（誰寫的、誰能看）拆分；新三類按「業務主題」（訂單條件／交貨條件／付款條件）拆分。兩個維度正交，理論上可並存
- **業務主題對應下游需求**：未來報價單匯出 / 訂單確認 PDF 帶出**只取新三類**（這是給客戶看的對外條款），既有三類仍是內部備註
- **避免破壞既有資料**：保留既有 `production_note` 等欄位的歷史資料，不做 reclassify 風險（線下單既有資料量大）

**視覺分組策略**：
```
[訂單資訊卡]
  - payment_terms_note（唯讀：來自需求單）
  - payment_detail（內部備註）
  ...

[新增：訂單備註 section]  ← 新增區塊
  Section Title: 訂單備註
  Section Subtitle: 訂單階段對客戶說明的標準化條款（後續匯出至報價單／訂單確認單）
  [訂單備註 textarea] [插入常用備註]
  [交貨備註 textarea] [插入常用備註]
  [付款備註 textarea] [插入常用備註]

[既有：訂單備註 section]（依 order_source 顯示適用欄位）
  Section Title: 內部備註
  Section Subtitle: 員工內部紀錄，客戶不可見
  [customer_note]（線上單顯示，唯讀）
  [internal_note]（線上 / 線下皆顯示，可編輯）
  [production_note]（線下單顯示，可編輯）
```

**Alternatives considered**：
- **取代既有 production_note**：被否決。線下單既有資料量大，reclassify 風險高，且 production_note 含「製作 / 交易 / 出貨備註彙整」語意已固化
- **整合到既有「訂單備註三類分欄」Requirement 內**：被否決。維度不同，硬塞會破壞 spec 既有 § Requirement 的語意一致性

### 決策 3：編輯權限與時機（解 ORD-005 / ORD-006）

**選擇**：
- **編輯權限**：訂單 sales_id 對應的業務 + 諮詢角色 + 業務主管 + 訂單管理人（沿用既有 `staffNotes` / `productionNote` 的權限模式）
- **編輯時機**：訂單成立後（status >= 訂單建立）到訂單完成前（completed_at IS NULL）皆可編輯；訂單完成後鎖定為唯讀

**理由**：
- **與既有欄位權限模式一致**：避免新欄位另立權限機制造成業務混亂
- **訂單完成後鎖定**：避免訂單結算後業務改備註影響歷史對帳（與 spec § 對帳警示 banner 觸發條件邏輯一致）
- **諮詢角色**：諮詢階段補記要點時可寫，諮詢結尾轉訂單後仍可由諮詢補充

**Alternatives considered**：
- **整個生命週期都可編輯**：被否決。訂單已完成後改備註會造成對帳爭議
- **只業務 owner 可編**：被否決。業務主管代編 / 諮詢補記是常見場景

### 決策 4：與 payment_terms_note 共存策略（解 ORD-007）

**選擇**：兩個欄位皆顯示，**用 section 分組明確區分**：
- `payment_terms_note`（唯讀）放在「訂單資訊卡」內（既有位置），label 加註「（來自需求單）」
- `payment_note`（可編輯）放在「訂單備註」section 內，label 加註「（訂單階段補充）」

**理由**：
- **語意清晰**：兩者位置與 label 明確區分「報價約定」vs「訂單補充」
- **法律意義保留**：`payment_terms_note` 是報價回簽的合約條款，不能被覆蓋；`payment_note` 是後續補充說明
- **業務心智模型友善**：業務看 section 就知道哪邊是合約條款、哪邊是補充

**Alternatives considered**：
- **隱藏 payment_terms_note 改顯示 payment_note**：被否決。報價合約條款必須在訂單頁可見
- **合併兩個欄位為 payment_note**：被否決。違反「報價回簽後 payment_terms_note 鎖定」既有 spec 規則

### 決策 5：NoteTemplatePopover 元件設計

**元件位置**：`src/components/shared/NoteTemplatePopover.tsx`（shared，未來可重用至其他模組）

**API**：

```ts
export interface NoteTemplate {
  id: string;
  label: string;        // checkbox 顯示文字（如「已知悉印刷注意事項（通用）」）
  text: string;         // 實際插入到 textarea 的文字（含 ★ 前綴）
}

export interface NoteTemplatePopoverProps {
  templates: NoteTemplate[];           // 該欄位適用的全部模板
  currentValue: string;                // textarea 現值（用於 append 行為）
  onInsert: (combinedText: string) => void;  // 父元件負責 append 邏輯
  buttonLabel?: string;                // 預設「插入常用備註」
  align?: 'start' | 'end';             // 預設 'end'（貼欄位右側）
  disabled?: boolean;                  // 對應 textarea disabled 時也要 disable
}
```

**結構**：
- **觸發按鈕**：`Button variant="ghost" size="sm"` + FileText icon + 「插入常用備註」
- **PopoverContent**：寬 `w-[420px]` max-height `480px` overflow-y-auto
  - Header：`text-xs text-muted-foreground`「勾選後按『插入』追加至備註尾端」+ 右側「全部清除」link（僅在有勾選時顯示）
  - Checkbox List：每列含 Checkbox + label 文字 + hover 顯示前 60 字預覽（`line-clamp-2`）
  - Footer：「取消」+「插入 N 條」（N=0 時 disabled）

**行為**：
- 開啟 popover → 所有 checkbox 預設未勾
- 勾選 / 反勾 → 即時更新「插入 N 條」按鈕的 N
- 點插入 → 呼叫 `onInsert(composed)`，其中 `composed = checked.map(t => t.text).join('\n')`；父元件負責 `newValue = currentValue ? currentValue + '\n' + composed : composed`
- Toast 提示「已插入 N 條模板」（2-3 秒）
- 關閉 popover → 不保留勾選狀態
- ESC 關閉、外部點擊關閉、鍵盤可達性（Tab / 上下方向鍵 / Space）

**插入行為**：**Append at end**（追加至 textarea 現值尾端，前置 `\n` 若現值非空）

**理由**：
- 業務 80% 場景是「先打草稿 → 補上模板條件」，cursor 位置插入會打斷文字節奏
- 不主動覆蓋手寫內容
- 實作簡單，不需追蹤 textarea ref + selectionStart

### 決策 6：seed data 設計（28 條按三類分配）

**檔案**：`src/data/orderNoteTemplates.ts`

**結構**（按欄位 keyed by `fieldKey`）：
```ts
export type OrderNoteFieldKey = 'order_note' | 'delivery_note' | 'payment_note';

export const ORDER_NOTE_TEMPLATES: Record<OrderNoteFieldKey, NoteTemplate[]> = {
  order_note: [   // 10 條：附件 orderNote on1-on10
    { id: 'on1', label: '已知悉印刷注意事項（通用）', text: '★已悉知並同意感官文化印刷官網...' },
    // ... 9 more
  ],
  delivery_note: [   // 12 條：附件 deliveryNote dn1-dn12
    { id: 'dn1', label: '盒型打樣工作天（7–10 天）', text: '★盒型打樣工作天：...' },
    // ... 11 more
  ],
  payment_note: [    // 6 條：附件 paymentNote pn1-pn5（其中 dn10「規格調整酌收費用」原本在交貨類但實務上更接近付款，移到 payment_note）
    { id: 'pn1', label: '全額付款（3–5 工作天）', text: '★請於回簽報價單 3–5 個工作天內支付全額款項。' },
    // ... 5 more
  ],
};
```

**id 命名規則**：保留附件原 id（on1-on10 / dn1-dn12 / pn1-pn5），方便對照附件查證

**Alternatives considered**：
- **id 改用統一前綴（如 pt1-pt28）**：被否決。失去與附件對照的便利性
- **seed 改用 nested category structure**：被否決。增加查詢複雜度，扁平 keyed by fieldKey 對 TypeScript narrowing 友善

### 決策 7：DESIGN.md 補規範「form field label 右側 trailing action button」

**位置**：`/Users/b-f-03-029/sens-erp-prototype/DESIGN.md` §0.1 附近

**內容要點**：
- 既有規範：label 列右側可放 Info icon + Tooltip
- 新增規範：label 列右側可放「操作按鈕」（如「插入常用備註」「智能填寫」），但須遵守：
  - 使用 `Button variant="ghost" size="sm"`（保持輕量，不搶 textarea 視覺焦點）
  - 與字數計數同列時，按鈕在左、計數在最右
  - 按鈕 disabled 條件必須與 textarea disabled 條件同步
  - 多個輔助按鈕排列方式：用 `gap-2` 間距、左對齊

**Alternatives considered**：
- **不補規範，元件自由設計**：被否決。未來其他模組做類似元件時會風格不一
- **改開獨立規範文件**：被否決。DESIGN.md 是唯一權威，分散會破壞單一來源原則

### 決策 8：編輯入口採獨立 `OrderNotesEditDialog`，不沿用既有 `OrderInfoEditDialog`

**選擇**：新建 `src/components/order/OrderNotesEditDialog.tsx`，獨立於既有 `OrderInfoEditDialog`：
- OrderDetail 訂單備註 section header 右上掛「編輯」按鈕（同訂單資訊 / 出貨資訊 / 發票設定 / 客戶資訊 section pattern）
- 點編輯 → 開啟 `OrderNotesEditDialog`（內含 3 個 textarea + 3 個 NoteTemplatePopover）
- Section body 為 **read-only 顯示**（label + 多行文字塊，空值顯示「尚未填寫」）

**理由**：
- **編輯時機 lock 規則不同**：`OrderInfoEditDialog` 受 `isBeforeProduction`（製作前）約束，而本 change 對訂單備註的編輯時機是「訂單完成前」（含製作中、製作完成、已出貨等狀態）。若沿用 OrderInfoEditDialog 會被既有 lock 規則綁住，與決策 3 衝突。
- **避免破壞既有 dialog 行為**：放寬 OrderInfoEditDialog 進入時機會影響該 dialog 內所有欄位（案名 / 業務負責人 / 折扣碼 / staffNotes / productionNote 等），副作用大。
- **與其他 section 一致**：訂單資訊 / 出貨資訊 / 發票設定 / 客戶資訊 等 section 都有自己的編輯 dialog（OrderInfoEditDialog / ShippingInfoEditDialog / InvoiceSettingEditDialog 等），新增 OrderNotesEditDialog 符合既有 pattern。
- **編輯權限與時機在 OrderDetail 父元件判斷**：父元件決定編輯按鈕是否 disabled、dialog 接到時即視為已授權（不重複判斷）。

**Alternatives considered**：
- **OrderInfoEditDialog 新增 3 欄位編輯區（原 proposal）**：被否決。如上 lock 規則衝突 + 副作用大。
- **OrderDetail inline 編輯（不開 dialog）**：被否決。與其他 section 行為不一致，使用者體驗破碎（Miles round 2 feedback）。
- **OrderInfoEditDialog 內部加「進階備註」分頁**：被否決。Tab 切換增加認知負擔，且 lock 規則仍需在 dialog 內部分欄位判斷。

**詳見** [ORD-014](../../../memory/erp/ERP_Vault/08-open-questions/ORD-014-訂單備註與訂單資訊編輯dialog分開.md) 記錄此決策來源（apply 階段 implementation feedback）。

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| **8 個 textarea 業務分不清哪欄填哪類** | 用 section 分組（「訂單備註」vs「內部備註」）、label 加註語意、placeholder 引導；上線後追蹤業務填寫分佈（OQ ORD-013 待 UAT 驗證） |
| **新舊三類職責分工未明，業務寫到錯欄** | spec § Data Model 補職責分工表（見 ORD-013 OQ 候選做法 1）；下游報價單匯出只取新三類，逼業務養成正確分流習慣 |
| **客戶看不到備註，ROI 兌現延後** | 承諾後續報價單匯出 epic（OQ ORD-012）；Phase 1 業務可手動貼到 LINE / email |
| **欄位語意切分依附件原型作者直覺、未經 UAT 驗證** | seed 模板來自業務既有手稿、有實證基礎；上線後追蹤填寫率與業務反饋，必要時 reclassify |
| **多次插入會造成 textarea 內出現重複文字** | Phase 1 不偵測，業務自行控管；OQ ORD-010 留 Phase 2 設計防呆 |
| **變數佔位符 `[日期]` `[金額]` 業務漏改** | Phase 1 業務手動 search-replace；OQ ORD-011 留 Phase 2 設計變數填入 UI |
| **seed data 寫死無法更新** | 接受。Phase 1 範疇明確排除 CRUD；XM-006 OQ 留 Phase 2 設計維護介面 |
| **NoteTemplatePopover 元件耦合 Order 結構** | 元件 API 設計為 `templates: NoteTemplate[]`（不耦合 fieldKey），其他模組可傳入自己的 seed |

## Migration Plan

**Phase 1（本 change）**：
1. 更新 Order type / mock store 加 3 欄位（預設值 `''`）
2. 既有 demo 訂單資料保留，新欄位顯示為空白 textarea
3. 不做歷史資料遷移（既有資料的 production_note / payment_terms_note 等保留原狀）

**rollback**：純前端變更，不需 rollback 機制；若回退只需 revert commit

**Phase 2+（後續 change）**：
- 報價單匯出 epic 引用新三類欄位（OQ ORD-012）
- 模板 CRUD UI（OQ XM-006）
- 重複插入防呆（OQ ORD-010）
- 變數佔位符替換 UI（OQ ORD-011）

## Open Questions

詳見 [proposal § Open Questions](./proposal.md)。本 change 進入 implementation 前**必解**的 P0 OQ：

- **ORD-005**（編輯權限）：已在「決策 3」初步定案（業務 + 諮詢 + 業務主管 + 訂單管理人），待業務確認
- **ORD-006**（編輯時機）：已在「決策 3」初步定案（訂單完成前可編、完成後鎖定），待業務確認
- **ORD-007**（與 payment_terms_note 共存）：已在「決策 4」定案（section 分組 + label 加註）
- **ORD-013**（新舊三類職責分工）：design 階段已給出 UI 視覺分組策略，但「業務寫到錯欄」風險仍存在，需上線後 UAT 驗證

P1（design 階段帶過、不阻斷實作）：

- **ORD-008**（異動追蹤）：Phase 1 不做，沿用既有欄位無 audit 模式
- **ORD-009**（業務平台列表可見性）：本 change 不做，留 sales-platform spec 後續
- **ORD-012**（匯出至客戶文件）：下游 epic 承接

Phase 2 議題（留未來）：
- ORD-010（重複插入防呆）
- ORD-011（變數佔位符處理）
- XM-006（模板維護路徑）
