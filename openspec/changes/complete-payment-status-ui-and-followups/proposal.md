## Why

原 change `2026-05-22-add-payment-status-and-decouple-oa-execution`（已 archive、delta 已合併回 main spec）引入 Payment「處理中 / 已完成」雙態設計後，留下三個漏實作面：（1）`OrderPaymentSection` 一般收款列表 row 完全無「編輯」按鈕，導致核心 user story「業務先填一半、補齊資料切已完成」實際 UI 操作走不通；（2）退款 Payment 切「已完成」後系統沒有提示業務開立銷貨折讓（SalesAllowance），對帳一致性風險增加；（3）原 change tasks.md § 10 列的 14 條新版 e2e 測試完全未實作、含一個 stale 失敗測試 `refund-payment-auto-execute-oa.spec.ts`（仍假設舊版「建立即推進」邏輯、與新 spec 不一致）。同時原 change 留下三個新 OQ（[[ORD-018-處理中Payment老化追蹤機制]]、[[ORD-019-會計處理中Payment應收應付處理]]、[[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]）未 resolve、與本範疇緊密相關。

商業背景：[ERP_Vault 付款發票邏輯卡 § 六、三方對帳](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)、[ERP_Vault 訂單實體卡 § OrderAdjustment 行為摘要](../../../memory/erp/ERP_Vault/05-entities/訂單.md)。

## What Changes

- **新增 Requirement「一般收款列表編輯入口」**：`OrderPaymentSection` 收款紀錄 ErpTable 操作欄 SHALL 提供單一「編輯」按鈕，點開 dialog 後業務 SHALL 能補對帳附件 / 實際完成日、切「已完成」並通過驗證；行為與 OA 編輯介面內的 Payment Edit 共用元件，確保兩處交互一致。
- **新增 Requirement「銷貨折讓弱提示（二者並存）」**：退款 Payment 切「已完成」事件後系統 SHALL 顯示弱提示（不阻擋業務）「此筆退款已完成、若訂單有對應發票請考慮開立 SalesAllowance」，提示位置兩處並存：PaymentEditDialog inline banner（切已完成成功後即時顯示）+ 訂單詳情頁對帳面板下方 sticky 提示（持續可見直到業務點關閉或建 SalesAllowance）。
- **新增 Requirement「處理中 Payment 老化追蹤」**（resolve [[ORD-018-處理中Payment老化追蹤機制]]）：處理中 Payment `createdAt > 7 天` 視為老化，訂單詳情頁列表 SHALL 顯示老化視覺標示（amber Badge「老化」+ 累積天數），業務主管 sidebar 列表頁 SHALL 新增「老化處理中 Payment」清單入口。
- **新增 Requirement「處理中 Payment 不入會計帳本」**（resolve [[ORD-019-會計處理中Payment應收應付處理]]）：處理中 Payment SHALL NOT 影響 General Ledger 應收應付帳本，僅在訂單詳情頁三方對帳面板顯示為資訊軸（已實作）；已完成才入帳。對帳面板「處理中（合計）」軸下方 SHALL 補註「不入 GL 應收應付帳本」說明。
- **MODIFY Payment Data Model 加邏輯刪除欄位**（resolve [[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]）：Payment 新增 `cancelled: boolean`（預設 false）、`cancelReason: string`、`cancelledAt: string | null`；`cancelPayment` 對「已完成」Payment SHALL 改為邏輯刪除（保留稽核軌跡），不從 `Order.payments` 陣列移除；`calcOACompletedPaymentsTotal` SHALL 排除 cancelled Payment；訂單詳情頁列表 SHALL 預設隱藏 cancelled、提供「顯示已取消」toggle 切換可見性。
- **MODIFY「收款記錄（Payment）」Requirement**：明確規範「處理中 Payment 編輯動線」+「對帳附件切已完成時必填」雙保護由 UI（dialog）與 store（updatePayment）共同檢驗，UI 失誤時 store 仍 SHALL 擋下。
- **重寫 e2e `refund-payment-auto-execute-oa.spec.ts`**：補 `updatePayment` 切已完成步驟對齊新 spec、檔名重命名為 `refund-payment-status-transition.spec.ts`。
- **新增 13 條 e2e 測試**：對應原 change tasks.md § 10.1～10.14（一般收款先填一半 / 補齊 / 退款分階段建檔 / 退款補齊切完成 / 分次退款累計 / 補收 OA 對稱情境 / 分次補收 / 缺資料驗證 / 取消處理中 Payment / 取消已完成 Payment 回退 / 取消已完成 Payment 雙筆累計仍達 / 對帳三軸顯示 / OA UI 兩處統一 / 棄用自動建補收 Payment）。
- **三視角審查補跑**：senior-pm + ceo-reviewer + erp-consultant 平行審查 specs + design + 既有實作，事後審視原 change 設計品質 + 本次補完設計，結果整合至 design.md。
- **治理收尾**：vault-audit 將「2026-05-22 archive 過早漏實作」事件記入 `00-meta/audit-log.md`；misjudgement-record skill 寫入跨 agent 通用誤審案例「OpenSpec change 主動 archive 但 tasks.md 含未勾選核心實作項」。
- **修正 OQ 撞號治理債**：`ORD-018-混合型SidePanel規範時機` 與 `ORD-018-處理中Payment老化追蹤機制` 撞號（兩個 OQ 都用 ORD-018），本 change 將後者改編為 `ORD-021-處理中Payment老化追蹤機制`，前者保留 ORD-018。

## Capabilities

### New Capabilities

無（本 change 不引入新 capability）。

### Modified Capabilities

- `order-management`：MODIFY「收款記錄（Payment）」Requirement（補編輯入口 / 銷貨折讓弱提示 / 老化追蹤 / 邏輯刪除規範）+ MODIFY「三方對帳檢視面板」Requirement（補處理中不入 GL 說明）+ Payment Data Model 新增三欄位（cancelled / cancelReason / cancelledAt）+ 新增 Scenario：「一般收款先填一半補齊切已完成」「老化處理中 Payment 顯示標示」「取消已完成 Payment 邏輯刪除保留軌跡」「銷貨折讓弱提示二者並存」

## Impact

### Spec
- `openspec/specs/order-management/spec.md` — 多條 Requirement MODIFIED + 新增 4 個 Scenario + Payment Data Model 加 3 欄位
- 無 state-machines / business-processes 異動（OA 狀態機與退款流程在原 change 已定義、本 change 不動）

### Prototype 程式碼
- `src/components/order/OrderPaymentSection.tsx`：補 row 編輯按鈕、對帳面板下方 sticky 弱提示 banner、老化 Badge 視覺、cancelled toggle
- `src/components/order/OrderAdjustmentEditDialog.tsx`：EditPaymentPanel 抽出為 `src/components/order/PaymentEditPanel.tsx` 共用元件、切已完成成功後 inline banner（退款型 Payment）
- `src/components/order/PaymentEditPanel.tsx`（新檔，從 OrderAdjustmentEditDialog 內 EditPaymentPanel 抽出）
- `src/store/useErpStore.ts`：`updatePayment` 切已完成事件加銷貨折讓 hint flag（退款型才回傳）、`cancelPayment` 對已完成改為邏輯刪除（不刪 array、設 cancelled + cancelReason + cancelledAt）、新增 helper `isPaymentAging(payment, nowMs)`
- `src/types/payment.ts`：Payment 加 `cancelled` / `cancelReason` / `cancelledAt`、helper `calcOACompletedPaymentsTotal` 排除 cancelled、新增 `isPaymentAging` helper
- `src/types/order.ts`：PaymentRecord interface 同步加三欄位（兩套並存）
- `src/pages/MyAfterSales.tsx` 或新增 `src/pages/AgingPaymentsPage.tsx`：業務主管「老化處理中 Payment」清單頁（依 prototype 現有 sidebar 模式整合）

### Mock data
- `src/data/mockPayments.ts`：既有 Payment backfill `cancelled = false`、`cancelReason = ''`、`cancelledAt = null`；新增 1 筆「已取消」demo 用於 cancelled toggle 顯示驗證；新增 1 筆「老化 14 天處理中」demo 用於老化視覺驗證

### e2e
- 重寫 `e2e/refund-payment-auto-execute-oa.spec.ts` → 重命名為 `e2e/refund-payment-status-transition.spec.ts`
- 新增 e2e（依拍板 14 條全實作）：`e2e/payment-status-*.spec.ts` 系列

### Vault 收尾
- `memory/erp/ERP_Vault/08-open-questions/ORD-018-處理中Payment老化追蹤機制.md` → 重編號為 `ORD-021-處理中Payment老化追蹤機制.md` 並標 resolved + 寫入決策
- `memory/erp/ERP_Vault/08-open-questions/ORD-019-會計處理中Payment應收應付處理.md` 標 resolved + 寫入決策
- `memory/erp/ERP_Vault/08-open-questions/ORD-020-取消已完成Payment邏輯刪除vs物理刪除.md` 標 resolved + 寫入決策
- `memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md` § 六、三方對帳 補「處理中不入 GL」說明
- `memory/erp/ERP_Vault/05-entities/訂單.md` § Payment 行為摘要 補老化追蹤、邏輯刪除規範

### 治理紀錄
- `memory/erp/ERP_Vault/00-meta/audit-log.md` 追加「2026-05-22 archive 過早漏實作」事件
- `memory/erp/ERP_Vault/11-review-knowledge/_shared/` 新增跨 agent 通用誤審案例

### 風險
- 三視角審查事後補跑可能識別更多漏項 → 本 change 範疇可能再擴大（風險控制：若擴大 > 2 個新 Requirement，獨立新 change 處理、本 change 凍結現有範疇）
- 邏輯刪除引入「已取消」狀態，需驗證對帳面板、報表、其他下游不誤計入 → e2e 覆蓋「已取消 Payment 不計入收款淨額」+「不計入 OA 累計」雙保護

### 後續關聯 change（不在本範疇）
- 處理中 Payment 老化追蹤的「主管看板」獨立頁面，若範疇過大可獨立新 change `add-aging-payments-dashboard`
- 銀行 API 自動對帳整合（Phase 3 進階分析期考慮）
