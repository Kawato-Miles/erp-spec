## Why

現況 OrderAdjustment v1.2 雙重身份設計（`adjustment_phase = during_order` 訂單異動單 / `adjustment_phase = after_completion` 售後服務單）無法承載售後服務的真實業務流程：

1. **缺少決議階段**：客訴 / 不良發生時，業務 / 諮詢需與業務主管討論決議處理方式（退款 / 補印 / 不處理），但現況 OrderAdjustment 假設業務已決定動作直接送審
2. **缺少 Case 容器**：一個售後事件可能對應 0 個（不處理）/ 1 個（退款 OR 補印）/ N 個（退款 + 補印）執行動作，OrderAdjustment 是動作載具而非容器
3. **缺少結案語意**：售後事件從受理到結案沒有 lifecycle，業務無法追蹤「這個客訴處理完了嗎」
4. **品質成本不可量化**：售後事件缺乏結構化分類（瑕疵類型 / 責任歸屬），無法統計公司每月認賠金額、哪類瑕疵最常發生（senior-pm 前期介入識別的策略性問題）

本 change 透過新增 AfterSalesTicket 實體解決上述問題，同時將 OrderAdjustment 回歸為純金額異動載具，恢復語意乾淨度。設計組合 **方向 B + 解讀 2** 已與 Miles 透過 [對比頁面](../../../decks/after-sales-design-comparison.html) 確認。

## What Changes

### 新增實體與功能

- **新增 AfterSalesTicket 實體**：訂單已完成後的售後事件容器
  - 狀態機：受理中 → 處理中 → 已結案（無核可關卡，業務手動推進）
  - 核心欄位：`customer_complaint`（客訴內容）/ `resolution`（不處理 / 退款 / 補印 / 退款+補印）/ `case_category`（售後類型分類）/ `responsibility`（責任歸屬）/ `closure_status` / `slack_thread_url` / `closed_at` / `closed_by`
  - 關聯：0..N OrderAdjustment（金額異動）、0..N PrintItem（補印）
  - 規則：一個 Order 最多 1 張 AfterSalesTicket（系統強制）

- **新增訂單詳情頁「售後服務」區塊**：顯示訂單關聯的 AfterSalesTicket（最多 1 張）、提供建立 / 結案操作

- **新增訂單列表「售後狀態」欄位 + 篩選器**：依 AfterSalesTicket 推導徽章；超過閾值天數未結案顯示紅燈提示（閾值預設 7 天，[OQ-AST-3](#open-questions)）

- **新增業務看板「我的未結案售後」**：業務查看自己負責的未結案 ticket 集合，避免遺漏

### 修改既有設計

- **BREAKING：OrderAdjustment 移除 `adjustment_phase` 雙重身份**：
  - 廢止 `phase = after_completion` 路徑
  - 廢止 `adjustment_type` 對 after_completion 的限制規則（原本限退印 / 折扣 / 補退 / 其他）
  - OrderAdjustment 回歸純金額異動載具（原 during_order 路徑全部保留）
  - 既有歷史 OrderAdjustment(phase=after_completion) 資料遷移：反向掛到對應 AfterSalesTicket 下（細節見 [OQ-MIGRATE-1](#open-questions)）

- **訂單詳情頁「建立售後服務單」按鈕邏輯變更**：原本建 OrderAdjustment(phase=after_completion)，改為建 AfterSalesTicket。after_completion 階段的補退金額調整改為「於 ticket 內加掛 OrderAdjustment」

- **訂單狀態保持「已完成」不變**：售後處理中為 derived 徽章，不進 Order.status 狀態機；adjustment_phase 簡化、對帳警示 banner 觸發條件需校準（[OQ-RECON-1](#open-questions)）

- **業務情境 1-3（公司吸收 / 補收 / 退款）路徑改寫**：[payment-invoice-scenarios.md](../../../memory/erp/payment-invoice-scenarios.md) 異動情境 1-3 的「建售後服務單」表述改為「建 AfterSalesTicket + 視需要建關聯 OrderAdjustment」

## Capabilities

### New Capabilities

- `after-sales-ticket`: 售後服務案件容器，承載訂單已完成後的客訴 / 不良 / 規格不符等售後事件，記錄業務與主管討論後的決議結果、責任歸屬與售後類型分類，關聯下游動作（退款 OrderAdjustment / 補印 PrintItem / SalesAllowance），並追蹤結案狀態

### Modified Capabilities

- `order-management`:
  - 移除 OrderAdjustment 雙重身份（`adjustment_phase` + after_completion type 限制）
  - 訂單詳情頁「建立售後服務單」按鈕改為建 AfterSalesTicket
  - 訂單列表新增「售後狀態」欄位 + 篩選器
  - 三方對帳檢視警示 banner 觸發條件校準
- `state-machines`:
  - OrderAdjustment 狀態機移除雙重身份註記
  - 新增 AfterSalesTicket 狀態機（受理中 → 處理中 → 已結案）
- `business-processes`:
  - 訂單異動流程章節新增「售後階段」分支（建 ticket → 決議 → 動作 → 結案）
- `business-scenarios`:
  - 異動情境 1-3（公司吸收 / 補收 / 退款）改用 AfterSalesTicket 路徑表述
- `prototype-data-store`:
  - 新增 AfterSalesTicket entity 與 Factory
  - OrderAdjustment 移除 `adjustment_phase` 欄位
  - PrintItem 加 `related_after_sales_ticket_id` FK
- `user-roles`:
  - 業務 / 業務主管角色補建立、結案 AfterSalesTicket 權責說明

## Impact

### 直接影響
- OrderAdjustment v1.2 設計收斂：移除 `adjustment_phase` 雙重身份相關欄位與規則
- 訂單對帳邏輯：警示 banner 觸發條件需重新定義（與 ticket 是否關聯有關）
- 訂單列表 / 詳情頁 UI 變更：新增售後徽章、ticket 區塊
- 既有 OrderAdjustment(phase=after_completion) 歷史資料需遷移路徑

### 採納 senior-pm 前期介入建議（流程 / UX 範疇）
- **新增 P0 欄位**：`case_category`（售後類型分類，7 enum 含色差爭議）、`responsibility`（責任歸屬 3 enum），用於業務分類、ticket 列表篩選、決議補印是否收費 / 退款是否吸收的操作判斷
- **補強防呆**：訂單列表超過 7 天未結案紅燈、業務看板分桶「我的未結案 ticket」、業務離職轉派機制（三視角審查補入）

### 不採納（稽核 / 統計範疇，Miles 三視角審查後決策）
- 月度公司認賠金額 KPI dashboard（移為 [OQ-AUDIT-1](design.md#三視角審查結論2026-05-14)）
- severity 必填欄位（ISO 9001 標配，移為 [OQ-AUDIT-2](design.md#三視角審查結論2026-05-14)）
- parent_ticket_id 維持反覆售後血緣（移為 [OQ-AUDIT-3](design.md#三視角審查結論2026-05-14)）
- root_cause / corrective_action / linked_qc_event_id / payment_source / Customer Master FK 等稽核欄位
- responsibility_company_ratio 比例欄位
- 完整三視角審查結論見 [design.md § 三視角審查結論](design.md#三視角審查結論2026-05-14)

### 部分解答的既有 OQ
- [ORD-002 線下訂單付款退款狀態設計](https://www.notion.so/32c3886511fa813a993cfec22d161b1d)（進行中、高優）：本 change 提供 AfterSalesTicket 作為退款流程的承載
- [訂單退款逆流程 OQ](https://www.notion.so/3423886511fa8091ba6ef05ee433e8a8)（未開始、中優）：本 change 統一售後退款路徑
- [WO-010 QC 不通過 rework chain 客訴追溯資料鏈](https://www.notion.so/3473886511fa815a8bd5f91d984b4d16)（中優）：本 change `case_category` 可承接 QC 不通過追溯入口
- [ORD-004 業務誤建印件可否走負數補收款](https://www.notion.so/34c3886511fa81cda408f84059af1547)（中優）：本 change 提供「業務誤建可走 ticket → 不處理 / 退款」的非取消路徑

### 範疇外（不在本 change 處理）
- 售後 ticket 自動分派演算法（業務手動建單）
- 客戶滿意度系統化回饋（預留 `customer_feedback_note` 欄位但不主動詢問）
- 跨訂單售後合併處理（極端 corner case）
- 主管 dashboard / 月度品質檢討會儀式設計（屬後驗 epic，等資料累積）
- 售後 ticket 的 SLA 自動升級主管（簡化版本只做訂單列表紅燈，不發通知）
- **稽核 / 統計範疇全部排除**（三視角審查 2026-05-14 後 Miles 決策）：月度認賠 KPI、ISO 9001 NCR 結構化欄位（severity / root_cause / corrective_action）、跨模組分析欄位（linked_qc_event_id / Payment polymorphic source / Customer Master FK）、反覆售後血緣維護（parent_ticket_id）、responsibility 比例欄位
