## Why

本輪完成業務 / 諮詢日常工作情境盤點與 35 個新 user story 匯入 [Notion User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d?v=32c3886511fa809d9259000c8ff3753d)。盤點過程中識別出 12 項 spec 缺口，加上 user story 拆乾淨後的新設計決議（訂單前段審核流程細化、退款流程三組件組合明示），需在進入正式開發前一次補齊 spec，確保 spec、user story、prototype 三方對齊。

此 change 直接服務 Phase 2 北極星指標「訂單流程完整完成率 ≥ 60%」：訂單前段流程清楚、退款流程組件邊界明確、付款計劃稽核可回溯、線下單客戶資料連動正確，是業務 / 諮詢日常工作系統化的基礎。

## What Changes

### A. 訂單前段流程細化（對應 user story US-ORD-001 ~ 003）

- 訂單線下路徑狀態流轉：**草稿 → 待業務主管審核 → 審核通過 → 報價待回簽 → 已回簽 → 共用段**（僅 `order_type = 線下`）
- **新增訂單狀態「審核通過」**（業務主管審核通過後 / 業務送報價單給客戶前的中間狀態）
- **正式定義「草稿」初始狀態 + 業務「送主管審核」動作**（草稿 → 待業務主管審核）：需求單轉訂單以「草稿」為初始狀態，取代既有 US-ORD-001 / state-machines 線下路徑「轉訂單直接進入報價待回簽 / 待業務主管審核」描述；業務於草稿態調整帶入內容後點「送主管審核」推進；新增 `submitted_for_review_at` 時戳
- **草稿與待業務主管審核兩態業務皆可自由編輯訂單全部內容**，進入「審核通過」起鎖定成交條件；業務主管（`approved_by_sales_manager_id`）於草稿建立時即指派
- 業務主管訂單審核 Requirement：核可推進至「審核通過」；**業務主管不核准時維持「待業務主管審核」、走 Slack 討論，不設退回鈕**（無「退回草稿」動作；業務可於待審核態持續修改）
- 業務送出報價單給客戶 Requirement：業務手動推進「審核通過」→「報價待回簽」；新增 `quote_sent_at` 時戳
- **修正 `payment_terms_note` / `approved_by_sales_manager_id` 鎖定錨點**：自「進入報價待回簽後鎖定」前移至「進入審核通過後鎖定」（業務主管核准當下即鎖），避免新增「審核通過」中間態後出現「核准後、外發前偷改收款條件繞過把關」的漏洞
- **修正 OrderExtraCharge（OEC）凍結時點（解 [[ORD-027-OEC凍結時點與審核通過成交鎖定對齊]]，方案 A）**：線下訂單 OEC 凍結點自「報價待回簽」前移至「審核通過」，與成交條件鎖定一致——審核通過後新增任何影響報價總額的費用（含運費 / 急件費）一律走 OrderAdjustment + 主管審核；OEC 可直接新增視窗收斂為「草稿 / 待業務主管審核」兩態。順手校正該 Requirement 舊版 legacy 狀態詞（「訂單確認」「報價評估階段」）對齊現行線下狀態機
- 訂單審核待辦頁 filter 納入「審核通過」（供主管追蹤已核准未外發）、排除「草稿」（業務側未送審）；預設排序改用 `submitted_for_review_at`
- **校正既有主 spec staleness（以 MODIFIED 整條取代、archive sync 自動完成）**：state-machines § 訂單狀態機 線下路徑列舉補完五階段並移除過時備註、order-management § 訂單建立 US-ORD-001 入口改為「草稿」（避免新增前段狀態後主 spec 出現新舊路徑並存矛盾）
- 角色守衛：送主管審核僅訂單可編輯角色（業務 / 諮詢）可發起；Supervisor 重新指定業務主管收斂為「僅待業務主管審核階段解卡、審核通過後為核可者歷史紀錄不再重指派」

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

- `order-management`：草稿初始狀態 + 業務「送主管審核」動作、訂單「審核通過」新狀態、業務主管審核欄位鎖定錨點前移（含 `submitted_for_review_at` / `quote_sent_at` 新欄位）、訂單審核待辦頁 filter 調整、訂單複製、客戶資料 relation 規則、多印件出貨追蹤、付款計劃稽核、發票金額誤差核銷、發票作廢 vs 折讓規則（Requirement 補齊 / 修訂）
- `state-machines`：新增 ADDED「訂單前段審核通過狀態」（草稿入口 + 送主管審核 + 審核通過）+ MODIFIED「訂單狀態機」線下路徑補完五階段並移除過時備註
- `after-sales-ticket`：退款流程三組件組合在售後場景的應用（明示 ticket → 訂單異動單 + 退款款項處理 + 發票異動）
- `business-processes`：跨齊報稅期作廢 vs 折讓流程節點補完

## Impact

- **specs（4 個 modified）**：order-management（主要影響）、state-machines、after-sales-ticket、business-processes
- **記憶檔（1 個 modified）**：`memory/erp/payment-invoice-scenarios.md` 補 I7 / I10 情境範例
- **Prototype 影響**（後續另案實作）：
  - 訂單前段審核流程（草稿態編輯、業務「送主管審核」按鈕、業務主管審核頁、業務「已送報價單」按鈕、訂單狀態流轉 UI；轉訂單落點改為草稿）
  - `source_order_id` / `original_expected_date` / `change_count` / `submitted_for_review_at` / `quote_sent_at` 五個新欄位
  - `payment_terms_note` / `approved_by_sales_manager_id` 鎖定時機前移至「審核通過」
  - 多品項稅額算法（無條件進位 + 差額集中最後品項）
  - 發票異動 UI 拆作廢 / 折讓兩按鈕（既有已拆，補後端規則判斷）
  - 訂單複製功能 UI
- **User Story（已匯入 Notion）**：US-ORD-001 ~ 012、US-PO-001 ~ 013、US-AS-001 ~ 006、US-CR-001 ~ 006、US-SP-001 ~ 005、US-PI-002 ~ 003，共 44 個 user story（含本輪改寫與重編號）
- **業務培訓**：作廢 vs 折讓的選擇邏輯、退款流程三組件組合、訂單前段審核流程的新狀態與動作
- **ORD-027 已解（方案 A，Miles 2026-06-01 拍板）**：[[ORD-027-OEC凍結時點與審核通過成交鎖定對齊]]——OEC 凍結時點自「報價待回簽」前移至「審核通過」，已於本 change order-management delta 新增 MODIFIED Requirement「OrderExtraCharge vs OrderAdjustment.fee 時間邊界」整條取代校正。其餘設計決議已於 user story / 本輪 Miles 拍板確認
