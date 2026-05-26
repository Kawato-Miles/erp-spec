## Why

原 change `2026-05-26-complete-payment-status-ui-and-followups`（已 archive、delta 已合併回 main spec）為 resolve [[ORD-021-處理中Payment老化追蹤機制]]，引入「老化處理中 Payment」雙層提示機制：訂單詳情頁 row amber Badge「老化 N 天」+ 業務主管 sidebar「老化處理中 Payment」清單頁入口（跨訂單聚合）。Miles 評估後決定收回「主管看板」這條 — 業務主管追蹤跨訂單老化清單改採「匯出 csv row data 後 Excel 自行篩選」的方式進行；ERP 系統內保留訂單層級的 row Badge 提示（讓業務在訂單詳情頁仍能看到該筆 Payment 已老化），但移除「主管看板」這個跨訂單聚合視圖。

商業背景：[ERP_Vault 付款發票邏輯卡 § 六、三方對帳](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)、[ERP_Vault 訂單實體卡 § Payment 行為摘要](../../../memory/erp/ERP_Vault/05-entities/訂單.md)。

設計動機：跨訂單聚合的「老化清單頁」在 ERP 系統內維護成本與 Excel 匯出後篩選的彈性不對等 — 業務主管更習慣用 Excel 對 Payment row data 做臨機篩選、排序、樞紐分析，系統內固定欄位的清單頁反而限制彈性。row Badge 的「單訂單內提示」仍有價值（業務看訂單時不需離開頁面就知道有 Payment 老化），保留。

## What Changes

- **MODIFY Requirement「處理中 Payment 老化追蹤」**（[order-management/spec.md:2781](../../../openspec/specs/order-management/spec.md:2781)）：
  - 保留：判定條件（處理中 + 未取消 + createdAt > 7 天）、訂單詳情頁 row amber Badge「老化 N 天」視覺標示、判定後行為第 1 條（row 視覺標示）、設計理由段
  - 移除：判定後行為第 2 條（業務主管 sidebar 入口）+ 第 3 條（清單頁欄位）
  - 移除 Scenario「業務主管查看老化處理中 Payment 清單」
  - 設計理由段補註：主管追蹤跨訂單老化清單改採 csv 匯出後 Excel 篩選方式進行（csv 匯出機制本 change 不定義、另議）

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `order-management`：MODIFY「處理中 Payment 老化追蹤」Requirement（拆主管看板入口 + 清單頁定義 + 對應 Scenario，保留 row Badge 與判定條件）

## Impact

### Spec
- `openspec/specs/order-management/spec.md` — Requirement「處理中 Payment 老化追蹤」MODIFIED（拆主管看板）+ Scenario 從 4 條收斂至 3 條

### Prototype 程式碼
- `src/pages/finance/AgingPaymentsPage.tsx`：整檔刪除（清單頁元件）
- `src/App.tsx`：移除 `AgingPaymentsPage` import（L42）+ Route `/finance/aging-payments`（L188）
- `src/components/layout/AppSidebar.tsx`：移除「款項管理」群組下的「老化處理中 Payment」navLink（L154-155）
- `src/store/useErpStore.ts`：移除 `getAgingPendingPayments` selector interface（L661-676）+ implementation（L3942-3972）；保留 `isPaymentAging` helper（OrderPaymentSection row Badge 仍用）+ 保留 PaymentRecord.createdAt 欄位（老化判定仍要用）

### Mock data
- 無 backfill 異動（`pay-aging-demo-001` 既有 mock 可保留，僅作為 row Badge 視覺驗證用，不再驅動清單頁）

### e2e
- 既有 e2e 無引用 `aging-payments` 路徑或 `getAgingPendingPayments` selector（已查證）
- 不新增、不刪除 e2e；row Badge 視覺驗證沿用既有 prototype 試用

### Vault 收尾
- `memory/erp/ERP_Vault/08-open-questions/ORD-021-處理中Payment老化追蹤機制.md` resolved 決策補註：「2026-05-26 後續決策：主管看板入口移除，改用 csv 匯出後 Excel 篩選方式進行（csv 匯出機制另議）」
- 新增 OQ：「Payment csv 匯出機制（觸發位置 / 欄位 / 權限）」status = open

### 風險
- row Badge 仍保留 → 業務在訂單詳情頁仍會看到老化提示、user story 不致斷裂
- 主管看板拆除後 csv 匯出機制尚未定義 → 過渡期主管無系統內聚合視圖，需手動依現有 prototype 功能組合篩選（風險可接受、Miles 確認）
- 後續若 csv 匯出 spec 補上、可獨立 change `add-payment-csv-export` 處理

### 後續關聯 change（不在本範疇）
- Payment csv 匯出機制（觸發位置 / 欄位 / 權限）spec — 另議、待累積使用情境後決定
