## Context

ezPay 電子發票 API（[EZP_INVI_1.2.2](../../../memory/erp/ERP_Vault/raw/_attachments/EZP_INVI_1.2.2.pdf)）對開立發票時的 PostData 強制要求五個品項欄位：`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`，且 ezPay 平台檢核硬性條件「`ItemAmt = ItemCount × ItemPrice`」與「發票金額 = 銷售額 + 稅額」（PDF page 19 §3-4）。此規格往上對接財政部電子發票整合服務平台 MIG（Message Implementation Guideline），是**法規 + 第三方 API 雙重硬約束**。

**現況落差**：

| 層 | 狀態 |
|----|------|
| Prototype `src/types/invoice.ts` `InvoiceItem` 介面 | 已對齊五欄（name / count / unit / unitPrice / itemAmount）|
| Prototype `OrderInvoiceSection.tsx` 開立 Dialog（L1518-1599）| UI 只暴露「名稱」「金額」兩欄；count / unit / unitPrice 用預設值寫入，違反 ezPay 檢核 |
| Prototype `src/types/plannedInvoice.ts` `PlannedInvoice` 介面 | 僅單 `description + scheduledAmount`，缺 `items[]`，鏈式品項預填斷在 PlannedInvoice 層 |
| OpenSpec `order-management/spec.md` § Invoice Data Model（L2955）| `items` 標為 JSON，無欄位結構展開 |
| OpenSpec `order-management/spec.md` § PlannedInvoice | **完全未定義**，spec 與 Prototype 不同步 |
| OpenSpec `order-management/spec.md` § 發票開立（L1130 「藍新 Mockup」）| 描述 Mockup 字軌規則與 PaymentInvoice 拆併合，未提品項欄位 |
| OpenSpec `quote-request/spec.md` § Data Model 印件單位（L569）| inline 寫死 9 項（張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批），未抽共用 |

詳細 ezPay 規格、印刷業實務衝突點、Miles 已決策的 A-F 取捨，已歸檔於 raw 卡 [2026-05-26-miles-upload-ezpay-invoice-api-spec](../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

## Goals / Non-Goals

**Goals:**

- 在 `order-management` spec 明文展開 InvoiceItem 五欄結構 + 檢核規則（涵蓋 ezPay 與電子發票法規硬約束）
- 在 `prototype-shared-ui` spec 建立跨模組共用單位 LOV，避免每處各自維護
- 在 `order-management` spec 補齊 PlannedInvoice Data Model 並加 `items[]` 結構，使 spec 與 Prototype 同步
- 明定「訂單印件 → PlannedInvoice → Invoice」品項鏈式預填規則（建立時帶入、後續可改、無即時連動）
- 開立發票 Dialog UI 行為：三欄輸入 + itemAmount 計算 disabled + Category-aware unitPrice label

**Non-Goals:**

- ezPay 真實 API 串接（Prototype 仍 mock，PostData 加密 / CheckCode 驗證等串接層細節不在此處理）
- 折讓單 / 作廢發票的品項欄位對齊（PDF §6 折讓有另一套規格，另開 change）
- 發票作廢時效規則（奇數月 14 日前可作廢前兩月發票，另議）
- 發票金額（`totalAmount`）由業務微調的彈性（既有「業務可微調」邏輯保留，但「`items` 與 `totalAmount` 是否強制一致」屬另一個議題，本 change 不處理）

## Decisions

### D1. InvoiceItem 採五欄結構，照搬 ezPay 規格

**決策**：spec 明定 InvoiceItem 五欄為 `name / count / unit / unitPrice / itemAmount`，欄位語意與型別約束完全照搬 ezPay PDF §4-(一)-3。

**理由**：
- 法規 + 第三方 API 雙重強制，無設計空間
- 與 Prototype 現有 `InvoiceItem` 介面（`src/types/invoice.ts` L25-36）完全一致，零變更
- 字段對應藍新 PostData 欄位（`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`）— 未來真實串接時可直接序列化

**Alternative considered**：
- 自訂縮減欄位（如只記 name + amount，count / unit / unitPrice 串接時動態組）— **拒絕**：違反「文件即規格」原則，且 amount 拆 count × unitPrice 無唯一解
- 加更多欄位（如 sku / cost / margin）— **拒絕**：超出 ezPay 規格，未來如要對接其他財稅平台會增加映射成本

### D2. 共用單位 LOV 範圍跨模組（需求單 + 發票）

**決策**：在 `prototype-shared-ui` spec 新增 Requirement「共用單位 LOV」，列舉 11 項（張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批 / 式 / 組）。需求單品項單位（quote-request）與發票品項單位（order-management）改引用此 LOV。

**理由**：
- 需求單既有 9 項全部 ≤ 2 中文字，已天然符合 ezPay 限制（Varchar(2) 中文 2 字 / 英數 6 字）
- 鏈式帶入「需求單印件 → 訂單印件 → PlannedInvoice → Invoice」時單位天生對齊，無需映射層
- 新增「式」（雜支用，如「製版費 1 式」）「組」（組合包裝用）兩項，補需求單缺口
- 統一 LOV 後，未來擴充選項只動一處

**Alternative considered**：
- 發票專用 LOV，需求單不動（**方案 A，已被 Miles 否決**）— 範疇小但留分歧
- 抽取到 `business-processes` spec — **拒絕**：UI dropdown 性質屬 prototype-shared-ui 範圍

**LOV 內容**（**注意：使用者輸入順序為事實正本，不重排**）：

```
張、本、冊、份、個、卷、盒、套、批、式、組
```

**字符約束驗證**（對齊 ezPay Varchar(2) 中文 2 字）：

| 單位 | 中文字數 | 符合 |
|------|---------|------|
| 張、本、冊、份、個、卷、盒、套、批、式、組 | 1 | ✓ |

全部單位皆為 1 中文字，符合 ezPay `ItemUnit` 限制。

### D3. unitPrice label 依 Category 切換

**決策**：開立發票 Dialog 內 `unitPrice` 輸入欄位 label，依 Invoice.category 切換：
- B2B：「單價（未稅）」
- B2C：「單價（含稅）」

**理由**：
- ezPay PDF §4-(一)-3：「ItemPrice — Category=B2B 時為未稅金額；Category=B2C 時為含稅金額」（B2B / B2C 規則不同）
- 業務切換 category 時若 label 不變，極易填錯（同樣輸入 1000 元，B2B 認為是未稅但實際被當含稅）
- 與既有「銷售額（未稅）」「發票金額（含稅）」欄位語意一致，業務看就懂

**Alternative considered**：
- 永遠顯示「單價」+ tooltip 解釋 — **拒絕**：tooltip 易忽略，仍會填錯
- B2B / B2C 各做兩個 Dialog — **拒絕**：UI 重複 + 切換 category 時資料流失

### D4. 鏈式品項預填：建立時帶入，無即時連動

**決策**：
- 建立 **PlannedInvoice** 時 SHALL 可從訂單印件清單預填 `items[]`，使用者可改
- 建立 **Invoice**（一鍵開立）時 SHALL 從 PlannedInvoice `items[]` 預填，使用者可改
- 上游印件 / PlannedInvoice 後續異動 SHALL NOT 即時連動已建立的下游品項

**理由**（Miles 在 explore 階段已決策）：
- 雙向同步邏輯複雜：PlannedInvoice 已開立後印件異動該不該回頭改？情境分歧多
- 業務需求只是「省手動輸入」，不是「即時對應」
- 一旦下游已開立 / 已送 ezPay，上游異動本來就不應影響歷史紀錄

**Alternative considered**：
- 即時雙向同步 — **拒絕**：複雜度爆炸，且已開立發票的 items 不應因印件變動而變
- 不預填，全部手動 — **拒絕**：違反 Miles 設計意圖，業務體驗差

### D5. 既有 mock 資料遷移策略

**決策**：Prototype `src/data/` 既有 mock invoice 資料需 backfill InvoiceItem 三欄（若有缺）：
- `count` 缺值預設 `1`
- `unit` 缺值預設 `'式'`（剛好對應 LOV 新加項）
- `unitPrice` 缺值預設 `itemAmount`

**理由**：
- 既有 InvoiceItem 介面已有五欄，但 UI 過往可能傳 count=1/unit='式'/unitPrice=itemAmount 進去；若有舊資料缺欄，補預設值即可符合 `count × unitPrice = itemAmount` 等式
- 「式」是會計界常用「無法以件計價」雜支單位，作為 fallback 合理

**Alternative considered**：
- 清空 mock 重建 — **拒絕**：影響 e2e 既有測試 fixture
- 強制業務手動補 — **拒絕**：Prototype 階段沒實際業務

### D6. 既有「發票開立（藍新 Mockup）」Requirement 改 MODIFIED + 補品項約束

**決策**：在 `order-management/spec.md`：
- **MODIFIED** § 「發票開立（藍新 Mockup）」Requirement — 在原段落補品項五欄送藍新對應規則
- **ADDED** 新 Requirement「發票品項符合 ezPay 與電子發票法規硬約束」— 專門承接五欄結構 + 等式檢核 + 整數驗證
- **MODIFIED** § Invoice Data Model 中 `items` 欄位描述（從 JSON 改為引用 InvoiceItem 子結構表格）
- **ADDED** § InvoiceItem Data Model 子結構表格
- **ADDED** § PlannedInvoice Data Model 完整表格（spec 過去未定義，本 change 補齊 + 加 items[]）
- **ADDED** 新 Requirement「PlannedInvoice 品項鏈式預填」

**理由**：
- 「發票開立」既有 Requirement 著重字軌 / Payment 拆併合，與品項主題重疊但不完全相同，分開兩個 Requirement 維護性較佳
- PlannedInvoice 在 spec 不存在屬「文件即規格」漏洞，本 change 既然動結構，順手補齊

**Alternative considered**：
- 把所有變更塞進 MODIFIED「發票開立」一個 Requirement — **拒絕**：MODIFIED 在 archive 時須完整貼上原內容 + 變更，混合多主題會難讀
- 只 ADDED 不動既有 — **拒絕**：既有 Requirement 內「業務開立 B2B 發票」Scenario 仍須補品項相關步驟，無法完全不改

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 業務介面三欄輸入比兩欄複雜，學習成本上升 | UI 設計 `count` + `unit` 同行緊湊排列，`itemAmount` 即時顯示讓業務馬上看到計算結果；提供「快速複製 PlannedInvoice 品項」入口減少手動 |
| `itemAmount` 自動計算後業務無法手動微調（如想湊整百元）| Trade-off — ezPay 強制 `count × unitPrice = itemAmount` 不允許微調，業務若要湊整應改 `unitPrice` 或新增折扣行。若未來業務反饋強烈，再考慮加「自由金額」品項類型（如 unit='式'、count=1、unitPrice 自由）|
| 既有 mock 資料 backfill 後可能跟業務實際填法不符（特別是「式」當預設）| backfill 標註於 commit message + tasks.md，並提示 Prototype 試用時優先檢視既有 invoice 是否需 mock 重編 |
| PlannedInvoice 加 `items[]` 後 UI dialog 變大 | 預設摺疊「品項明細」section，業務可展開編輯；若不展開則沿用「描述 + 金額」單筆當 fallback |
| 共用 LOV 從 quote-request 抽出，可能影響需求單既有 UI（dropdown 元件改型）| 需求單目前已是 dropdown 9 選項，抽出後選項從 9 變 11（多「式 / 組」），對需求單僅是擴充選項，無破壞性變更 |
| `unit` 型別從 `string` 變 `UnitOption` enum 後，既有 mock 資料若有非 LOV 值需 backfill | tasks.md 列遷移項；Prototype 階段範疇可控 |
| 鏈式預填「無即時連動」可能造成業務疑問「為什麼印件改了但 PlannedInvoice 沒跟著改」 | 設計決策已於 D4 寫明；UI 在預填來源旁加 hint「此處複製自訂單印件，後續異動需手動同步」 |

## Migration Plan

本 change 屬 Prototype 階段內部規格對齊，無正式環境遷移。實作分四階段：

1. **規格層**（本 change archive 後）：order-management / prototype-shared-ui / quote-request spec 更新
2. **型別層**：新增 `src/types/shared.ts`（或 `src/types/unitOption.ts`）匯出 `UnitOption` enum；`invoice.ts` `unit` 型別改用 `UnitOption`；`plannedInvoice.ts` 加 `items: InvoiceItem[]`、`scheduledAmount` 改 derived
3. **元件層**：新增共用 `UnitSelect` dropdown 元件（基於 shadcn/ui `Select`）；改 OrderInvoiceSection 開立 Dialog 品項表單；改 PlannedInvoice 建立 / 編輯 Dialog
4. **資料層**：mock invoice / plannedInvoice 資料 backfill；既有 e2e fixture 對齊

回滾：本 change 屬增量擴充（spec 加欄位 / UI 加欄位），可逐 PR 回滾單階段，不影響資料完整性。

## Open Questions

無。Miles 已在 explore 階段答完 A-F 與小 1-4 共 10 個決策點，本 change 範疇內無殘留不確定項。

折讓 / 作廢的品項對齊屬未來 change（建議名稱：`align-credit-note-and-invoice-void-to-ezpay-spec`），不開為 OQ — 待真實串接議題啟動時自然觸發。
