## Why

本輪完成業務 / 諮詢日常工作情境盤點與 35 個新 user story 匯入 [Notion User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d?v=32c3886511fa809d9259000c8ff3753d)。盤點過程中識別出 12 項 spec 缺口，加上 user story 拆乾淨後的新設計決議（訂單前段審核流程細化、退款流程三組件組合明示），需在進入正式開發前一次補齊 spec，確保 spec、user story、prototype 三方對齊。

此 change 直接服務 Phase 2 北極星指標「訂單流程完整完成率 ≥ 60%」：訂單前段流程清楚、退款流程組件邊界明確、付款計劃稽核可回溯、線下單客戶資料連動正確，是業務 / 諮詢日常工作系統化的基礎。

## What Changes

### A. 訂單前段流程細化（對應 user story US-ORD-001 ~ 003）

- 新增訂單狀態「審核通過」（業務主管審核通過後 / 業務送報價單給客戶前的中間狀態）
- 訂單線下路徑狀態流轉：草稿 → 待主管審核 → **審核通過** → 報價待回簽 → 已回簽 → 共用段
- 業務主管訂單審核 Requirement：核可推進至「審核通過」/ 退回回「草稿」
- 業務送出報價單給客戶 Requirement：業務手動推進「審核通過」→「報價待回簽」

### B. 訂單複製功能（對應 US-ORD-007 / 灰色情境 I1）

- Order 新增 `source_order_id` 欄位指向複製來源（追蹤 reorder 關係）
- 業務於訂單列表執行「複製訂單」帶入客戶 / 印件 / 規格 / 價格至新訂單

### C. 線下單客戶資料關聯帶出（對應 US-ORD-012 / 灰色情境 I8）

- `order.customer` 明示為 Customer entity relation（非 snapshot 快照）
- 廠客資料異動後既有訂單自動同步顯示
- 例外規則：已開發票仍保留當時的客戶資料快照（稅務規則要求）

### D. 多印件分次出貨追蹤（對應灰色情境 I9）

- 印件層新增 `shipment_quantity` 累計欄位
- 印件狀態依入庫量 vs 已出貨量自動推進
- 出貨單列表呈現印件級分次出貨進度

### E. 付款計劃變更稽核（對應 US-PO-008 / J10 規格調整）

- `PaymentPlan` 新增 `original_expected_date` / `change_count` 兩個稽核欄位
- 分階段稽核邏輯：
  - 業務主管審核通過前：變更不觸發稽核（訂單仍為內部初版）
  - 業務主管審核通過後：變更自動填入 `original_expected_date`（首次變更時）+ `change_count + 1`

### F. 發票金額誤差核銷（對應 US-PO-012 / 灰色情境 I10）

- 多品項發票稅額計算規則：每品項各自無條件進位計算含稅金額後加總
- 與「總額一次計算」比對，差額（通常 1 元）集中於最後一個品項
- **禁止平均分攤**：會破壞每品項稅額正確性，違反中華民國稅務規則

### G. 發票作廢 vs 折讓規則（對應 US-PO-007 / US-PO-013 / 灰色情境 I7 / J9）

- UI 維持「作廢」「折讓」兩個按鈕讓使用者依情境選擇
- 後端規則：作廢呼叫第三方發票平台，跨齊報稅期失敗時顯示明確錯誤訊息「此發票已跨齊報稅期無法作廢，請改開折讓單」
- 退款流程三組件明示組合：訂單異動單 + 業務主管審核 → 退款款項處理（負值收款）→ 開立折讓單 或 作廢發票

### H. payment-invoice-scenarios.md 補情境範例

- 補 I7 跨齊報稅期作廢失敗 → 折讓的完整情境範例
- 補 I10 多品項發票進位差額算法的計算情境範例

### I. business-processes spec 補流程節點

- 跨齊報稅期作廢 vs 折讓的流程節點明示

## Capabilities

### New Capabilities

無（本 change 全為既有 capability 補齊）。

### Modified Capabilities

- `order-management`：訂單「審核通過」新狀態、訂單複製、客戶資料 relation 規則、多印件出貨追蹤、付款計劃變更稽核、發票金額誤差核銷、發票作廢 vs 折讓規則（7 項 Requirement 補齊 / 修訂）
- `state-machines`：訂單狀態機新增「審核通過」狀態節點 + 線下路徑流轉補完
- `after-sales-ticket`：退款流程三組件組合在售後場景的應用（明示 ticket → 訂單異動單 + 退款款項處理 + 發票異動）
- `business-processes`：跨齊報稅期作廢 vs 折讓流程節點補完

## Impact

- **specs（4 個 modified）**：order-management（主要影響）、state-machines、after-sales-ticket、business-processes
- **記憶檔（1 個 modified）**：`memory/erp/payment-invoice-scenarios.md` 補 I7 / I10 情境範例
- **Prototype 影響**（後續另案實作）：
  - 訂單前段審核流程（業務主管審核頁、業務送報價單按鈕、訂單狀態流轉 UI）
  - `source_order_id` / `original_expected_date` / `change_count` 三個新欄位
  - 多品項稅額算法（無條件進位 + 差額集中最後品項）
  - 發票異動 UI 拆作廢 / 折讓兩按鈕（既有已拆，補後端規則判斷）
  - 訂單複製功能 UI
- **User Story（已匯入 Notion）**：US-ORD-001 ~ 012、US-PO-001 ~ 013、US-AS-001 ~ 006、US-CR-001 ~ 006、US-SP-001 ~ 005、US-PI-002 ~ 003，共 44 個 user story（含本輪改寫與重編號）
- **業務培訓**：作廢 vs 折讓的選擇邏輯、退款流程三組件組合、訂單前段審核流程的新狀態與動作
- **無新 OQ**（本 change 為 spec 補齊，所有設計決議已於 user story 階段確認）
