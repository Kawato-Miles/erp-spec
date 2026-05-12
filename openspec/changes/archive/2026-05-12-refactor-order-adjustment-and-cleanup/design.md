## Context

訂單款項與發票場景源自 [Notion follow-up「提供收款情境」](https://www.notion.so/3573886511fa80b39093d8c76b57737a)（2026-05-08），蒐集 13 個典型業務情境（特殊發票 9 個 + 特殊收款 4 個 + 異動 4 個）。經 explore 階段與三視角審查後，本 change 拆分為兩個 change，本 change 為其中之一：

- 本 change `refactor-order-adjustment-and-cleanup`：聚焦在 OrderAdjustment 重構與廢除補收款訂單預留欄位（資料結構層面）
- 後續 change `add-pending-receivables-and-invoicing-pages`：聚焦在待收款 / 待開發票兩個列管模組（行為改變層面），依賴本 change 完成

當前 `order-management` spec 已透過 `2026-05-07-refactor-order-payment-and-invoice-with-billing-company` change 建立 BillingCompany / PaymentPlan / Payment / Invoice / SalesAllowance / OrderAdjustment / OrderExtraCharge 七個核心實體與三方對帳檢視面板。本 change 在此基礎上補完「訂單異動 vs 售後服務職責分工」「OrderAdjustment 與 OrderExtraCharge 時間邊界」「對帳警示時點觸發」三個缺口，並廢除過早預留的 `Order.is_supplemental` + `parent_order_id`。

設計哲學：「沿用既有流程，不另開例外路徑」。OrderAdjustment 不自帶 PrintItem 建立 / 工單派工；補收款不另開 supplemental order；公司吸收成本走純工單異動，不建 OrderAdjustment。所有跨流程整合走既有入口。

## Goals / Non-Goals

**Goals:**

- OrderAdjustment 同時涵蓋「訂單異動」與「售後服務」兩種業務情境，不分裂實體
- 補收款場景收斂為「訂單異動單」單一路徑，廢除「補收款訂單」預留欄位
- 對帳警示 banner 由執行時點跨期決定，涵蓋 phase = during_order 但跨期執行的真實場景
- 訂單異動 vs 工單異動的職責邊界清楚（金額變動為界）
- 與既有 PaymentPlan / Payment / Invoice / SalesAllowance / 對帳檢視面板無縫銜接
- 為下個 change（列管模組）提供穩固的 OrderAdjustment 行為基礎

**Non-Goals:**

- 待收款 / 待開發票 列管模組 模組（轉至下個 change）
- PaymentPlan.expected_invoice_date 欄位（轉至下個 change，與 列管模組 一起出）
- 業務拆分印件數量開多張發票 Scenario（轉至下個發票相關 change）
- 跨訂單合併出貨、跨訂單混合匯款對帳工具（屬人工協調或後期工具）
- 大貨重新報價（屬需求單議價階段，需求單模組另開 change）
- 售後退印的實物入庫流程（屬庫存模組，未來 change 處理）
- 規格變更新建 PrintItem 的系統護欄（業務語意判定，未來考慮加 ECM 風格防呆）

## Decisions

### D1：OrderAdjustment 雙重身份用 `adjustment_phase` 欄位而非分離實體

`OrderAdjustment` 增加 `adjustment_phase` 欄位（enum: `during_order` / `after_completion`），由建單時 `Order.status` 自動推算。UI 名稱依 phase 切換為「訂單異動單」或「售後服務單」。

**替代方案**：建獨立 `AfterSalesTicket` 實體與 OrderAdjustment 並列。

**選擇理由**：
- 兩者 90% 行為相同（金額異動 + 業務主管審核 + 加總回應收 + 對帳影響）
- 售後服務單的「不新增 PrintItem」「發票處理提示」屬 UI / 行為限制，不是新業務邏輯
- 既有 spec「已完成訂單仍可建立 OrderAdjustment（售後服務）」已隱含同一實體設計
- 分離實體會造成跨表查詢、對帳算式分散、報表複雜化

**權衡**：phase 由 Order.status 自動推算後鎖定，業務無法手動指定。若未來出現「訂單未完成但要建售後服務」的特殊情境，需評估是否開放手動 override。當售後服務未來出現庫存沖銷 / 跨期申報補正 / 稅務調整等業務需求時，需要重新評估「單實體 + phase 欄位」vs「分離為 AfterSalesTicket 實體」的取捨。

### D2：售後服務單發票處理採建議式提示而非自動跳轉

售後服務單執行後顯示提示「此筆異動涉及金額變動，請至訂單詳情頁的發票區處理（作廢 / 折讓）」，**非問句、非自動跳轉**。業務自行判斷時序與合規期決定處理方式。

**替代方案**：執行後自動跳轉至發票處理頁、或彈出問句「是否處理發票？」。

**選擇理由**：
- 自動跳轉會中斷業務的工作流（業務可能還在審核其他售後單）
- 問句「是否處理發票？」會讓業務誤以為系統會自動執行某些動作
- 業務需要依「發票是否跨期 / 是否已申報」判斷走作廢還是折讓，非單純執行
- 提示式設計符合業務「先收齊資訊再決定」的工作習慣

**權衡**：業務可能忘記處理發票，導致對帳檢視面板長期顯示警示 banner。對帳面板的警示已是充分提醒，不額外加強制阻擋。CEO 視角審查建議「7 天未處理自動進紅色清單」屬於下個 列管模組 change 的範疇，本 change 不處理。

### D3：訂單異動加印 / 規格變更走既有審稿 / 工單流程

OrderAdjustment 只負責「金額憑證」與「業務主管審核流程」，不自動建立 / 修改 PrintItem。業務需手動到訂單詳情頁編輯 PrintItem，後續走既有審稿（`prepress-review`）+ 工單（`work-order`）流程。

**替代方案**：OrderAdjustment 執行時自動觸發 PrintItem 建立、新工單派工。

**選擇理由**：
- 維持 PrintItem 入口單一（訂單詳情頁是唯一新增 / 編輯 PrintItem 的地方）
- OrderAdjustment 自帶觸發路徑會造成「兩條 PrintItem 建立路徑」，未來維護成本高
- 業務直接操作 PrintItem 比透過 OrderAdjustment 間接操作更直觀
- 符合「沿用既有流程」原則（feedback memory: ERP 設計優先沿用既有流程）

**權衡**：業務可能建了 OrderAdjustment 但忘記去改 PrintItem，造成金額異動與生產內容不同步。緩解：OrderAdjustment 表單明確區分「金額異動」與「生產內容變更」兩個欄位，並提示業務「若涉及生產內容請至訂單詳情頁編輯印件」。CEO 視角審查建議「強制勾選對應 PrintItem」屬於 UX 強化，可於 prototype 階段評估，spec 暫不強制。

### D4：訂單異動 vs 工單異動以「金額變動」為分界

業務遇到變更需求時的判定樹：
- **有金額變動**（向客戶補收 / 退費）→ 訂單異動單（OrderAdjustment）
- **無金額變動**（含成本上升公司吸收）→ 工單異動流程（既有工單機制）

**替代方案**：用 `type` 欄位細分（規格 / 紙材 / 工序 / 排程……）；或不區分流程，所有變更都走 OrderAdjustment。

**選擇理由**：
- 「是否需要客戶補錢 / 退錢」是最直觀的分界，業務一眼判斷
- 與既有 OrderAdjustment 的應收計算邏輯一致（已執行 OrderAdjustment 累加進應收）
- 工單異動屬生產面內部調整，不需業務主管審核流程

**「公司吸收成本」走純工單異動**：紙廠停產換紙、瑕疵補印、規格寫錯等情境，雖然涉及內部成本上升，但不向客戶補收 → 純走工單異動流程。工單異動本身會反映於訂單成本欄位 / 利潤分析（屬下游工單管理職責），不需建立 `OrderAdjustment(amount=0)` 重複紀錄。原三視角審查建議的「OrderAdjustment(amount=0) 雙紀錄」設計被推翻，理由：amount=0 不屬於「金額變動」，建立反而違反 D4 的判定邊界。

### D5：對帳警示 banner 觸發條件改用「執行時點跨期」

對帳檢視面板的警示 banner 觸發條件 SHALL 為 `OrderAdjustment.executed_at > Order.completed_at`（執行時點晚於訂單完成時點），而非「`adjustment_phase = after_completion`」。

**替代方案**：依 `adjustment_phase` 觸發。

**選擇理由**：
- 涵蓋「phase = during_order 但跨期執行」的時間錯位場景：業務於訂單未完成時建單，主管核可後業務拖到訂單完成後才執行 → 會計帳上仍是跨期調整，需警示
- 對齊業界做法：SAP / NetSuite 對「closed period 後的調整」依「執行時點」而非「文件類型」判定是否需特殊處理（retroactive accounting）
- 與 phase 解耦讓警示邏輯更穩健

**權衡**：實作上需多一個比較運算（`executed_at vs completed_at`）。若 Order 尚未完成（completed_at IS NULL），則 banner 不觸發（一律視為訂單期內調整）。

### D6：OrderExtraCharge vs OrderAdjustment.fee 時間邊界

`OrderExtraCharge` SHALL 限於「訂單成立時即確定」的費用使用（如報價時就含的運費、訂單建立時加的急件費）。訂單成立後新增的費用 SHALL 走 OrderAdjustment（含 fee 明細），即使費用類型相同（如後加運費）。

**替代方案**：兩者並存無界線，業務自由選擇。

**選擇理由**：
- 兩者審核流程不同：OrderExtraCharge 不需審核（訂單明細的一部分），OrderAdjustment 需業務主管審核
- 時間邊界清晰：訂單成立時點 = 業務主管審核通過進入「報價待回簽」之時
- 避免業務在訂單成立後新增 OrderExtraCharge 跳過審核流程，破壞控管機制

**權衡**：業務需明確記憶此邊界，spec 提供明確 Scenario 引導。實作上 UI 可在訂單已成立後隱藏「新增 OrderExtraCharge」按鈕，引導業務走 OrderAdjustment。

### D7：廢除 `Order.is_supplemental` + `Order.parent_order_id`（補收款訂單退場）

移除 `Order` 資料表的 `is_supplemental`（布林）與 `parent_order_id`（FK）兩欄位，移除「補收款訂單」概念。所有補收款場景走 `OrderAdjustment`。

**替代方案**：保留欄位作 Phase 2 預留功能。

**選擇理由**：
- Miles 已決定補收場景全走訂單異動單（OrderAdjustment 已能涵蓋）
- 保留無用欄位會讓未來開發者誤用、增加 schema 維護成本
- 既有資料庫沒有任何 `is_supplemental = true` 的紀錄（線下單未實作此功能）
- 補收款訂單概念與 OrderAdjustment 邏輯重疊（都是「訂單成立後追加費用」）

**補收款場景判定表**（廢除 is_supplemental 後的所有補收路徑）：

| 補收款場景 | 處理路徑 |
|----------|---------|
| 訂單成立後加印追加（原訂單範圍內） | OrderAdjustment + during_order + 加印追加 |
| 已完成訂單發現多印需補收 | OrderAdjustment + after_completion + 補退 |
| 已完成訂單客戶投訴部分退款 | OrderAdjustment + after_completion + 退印 |
| 訂單未評估運費出貨前補收 | OrderAdjustment + during_order + 加運費 |
| 規格升級補收（紙材升級 / 加工升級） | OrderAdjustment + during_order + 規格變更 |
| 整張需求單回簽走完整審核（如客戶要重新議價） | 走需求單流程開新訂單，不走 OrderAdjustment |
| 諮詢費結算（既有設計） | OrderExtraCharge（既有） |
| 紙廠停產換紙、公司吸收成本（無向客戶補收） | 純工單異動，不建 OrderAdjustment |

**權衡**：理論上「整張新報價單回簽走完整審核流程」的補收款場景無法用 OrderAdjustment 涵蓋（OrderAdjustment 不需重新報價），此場景走需求單流程開新訂單。

### D8：規格變更新建 vs 修改 PrintItem 的判定按業務語意

業務於訂單詳情頁編輯 PrintItem 時的判定邏輯（建議業務遵循）：
- **新建 PrintItem**：打樣 NG 稿件問題（既有 sample_result = NG-稿件問題 路徑）、追加印製數量
- **修改原 PrintItem**：其他規格變更（紙材升級、加工調整、規格升級、字距微調等）

**替代方案**：以「是否有作業中工單」為界（工單已派工 → 新建；未派工 → 可改）。

**選擇理由**：
- 業務語意比技術狀態直觀
- 「打樣 NG 稿件問題」原本就走新印件路徑（既有 sample_result 機制），保持一致
- 「追加印製數量」邏輯上是「新批次」，需走獨立審稿與工單，與原批次分開記錄
- 規格變更（紙材升級等）通常在原工單尚未開始或可吸收的階段，修改原 PrintItem 較合理

**權衡**：實際業務判斷可能複雜（「規格升級的同時又加印數量」），由業務依主因判斷，不強制由系統規則決定。spec 補 Scenario 列舉典型情境協助業務判斷。

### D9：OrderAdjustment.adjustment_type 完整 enum 與 phase 限制

`OrderAdjustment.adjustment_type` 完整 enum 列舉與依 phase 限制可選範圍：

| adjustment_type | during_order 可選 | after_completion 可選 |
|----------------|------------------|----------------------|
| 規格變更 | 是 | 否 |
| 加印追加 | 是 | 否 |
| 退印 | 是 | 是 |
| 折扣 | 是 | 是 |
| 加運費 | 是 | 否 |
| 急件費 | 是 | 否 |
| 補退 | 否 | 是 |
| 其他 | 是 | 是 |

限制 SHALL 在 API 與 UI 雙重防護（業務層校驗，非資料庫 enum constraint，方便未來擴充）。

**理由**：避免業務透過 API 繞過 UI 校驗送出不合 phase 的 type。Spec 明示限制是雙重防護後，工程實作不會遺漏。

## Risks / Trade-offs

- **既有 OrderAdjustment 資料回填**：所有歷史 OrderAdjustment 記錄需回填 `adjustment_phase = during_order`（因 spec 在歷史上未啟用售後服務語意）→ Mitigation：撰寫一次性回填腳本，新建立的 OrderAdjustment 由 Order.status 自動推算
- **`Order.is_supplemental` + `parent_order_id` 移除前資料引用檢查**：若資料庫有 `is_supplemental = true` 或 `parent_order_id IS NOT NULL` 的紀錄將阻擋移除 → Mitigation：移除前跑掃描，理論上現況零引用（線下單未實作）；若未來進入正式系統階段，需走 Expand-Migrate-Contract 三段式
- **OrderAdjustment 金額異動與生產內容不同步**：業務建了 OrderAdjustment(amount=+20K) 但忘記改 PrintItem 數量 → Mitigation：OrderAdjustment 表單於「執行」時提示「此異動可能涉及生產內容變更，請至訂單詳情頁確認 PrintItem」；不強制阻擋（CEO 視角建議的強制勾選機制留待 prototype UX 評估）
- **售後服務單發票處理被忽略**：業務執行售後服務單後沒處理發票，對帳面板長期警示 → Mitigation：對帳警示 banner 已是充分提醒；未來 列管模組 change 可加入「7 天未處理進紅色清單」機制
- **adjustment_phase 與 executed_at 跨期的雙觸發邏輯**：spec 既有 phase 區分行為，又用 executed_at > completed_at 觸發警示 → Mitigation：兩者語意分工清楚（phase 控制 type 限制與 UI 名稱、executed_at > completed_at 控制對帳警示），不互相干擾
- **OrderAdjustmentItem 子實體與既有 OrderExtraCharge 的語意重疊**：D6 已明確時間邊界，但業務記憶仍是風險 → Mitigation：UI 在訂單已成立後隱藏「新增 OrderExtraCharge」按鈕，引導業務走 OrderAdjustment
- **「沿用既有流程」原則的延伸風險**：當售後服務未來出現庫存沖銷 / 跨期申報補正等業務需求時，需重新評估單實體 vs 雙實體取捨 → Mitigation：本 change 範疇內穩固，未來需求出現時再開新 change

## Migration Plan

1. **Schema migration**（資料層先行，UI 不變）：
   - `OrderAdjustment` 加 `adjustment_phase` 欄位（NOT NULL，預設 `during_order`）
   - 新建 `OrderAdjustmentItem` 子表（`order_adjustment_id` FK + `item_type` + `description` + `amount`）
   - 一次性腳本：所有既有 `OrderAdjustment.adjustment_phase` 回填 `during_order`
2. **資料引用掃描**：跑 `SELECT count(*) FROM orders WHERE is_supplemental = true OR parent_order_id IS NOT NULL`，確認零引用
3. **Schema migration（移除欄位）**：`Order` 移除 `is_supplemental` + `parent_order_id`
4. **後端邏輯**：
   - OrderAdjustment 建立時依 `Order.status` 推算 phase
   - 對帳檢視面板的警示 banner 觸發條件改為 `executed_at > completed_at`
5. **UI 上線**：
   - 訂單詳情頁的 OrderAdjustment 表單（含 phase 顯示、明細編輯、執行後提示）
   - 訂單詳情頁的售後服務單執行後 banner
6. **Prototype 同步**：[sens-erp-prototype](https://github.com/Kawato-Miles/sens-erp-prototype) 對應 OrderAdjustment 表單與 banner mock 補上

**Rollback 策略**：
- UI 層可下架 phase 顯示（不影響資料）
- `adjustment_phase` 與 `OrderAdjustmentItem` 為新欄位 / 新表，保留即可
- 已移除的 `Order.is_supplemental` + `parent_order_id` 若需回復，需重新 schema migration（理論上不需要）

## Open Questions

- **OQ-1（UX 細節）**：對帳檢視面板的「歷史對帳警示」banner 是否可摺疊？建議可摺疊，避免售後服務單執行後永久占據視覺空間。設計階段確認。
- **OQ-2（資料完整性）**：是否允許業務手動 override `adjustment_phase`？建議不允許，phase 由 Order.status 自動推算後鎖定。若未來真有需求再開放。
- **OQ-3（延後處理 — 售後實物入庫）**：售後服務單退印（amount < 0、type = 退印）時，是否觸發實物入庫流程與 cogs 沖銷？目前 spec 完全未定義，屬庫存模組範疇，未來 change 處理。
- **OQ-4（延後處理 — PrintItem 規格變更護欄）**：D8 的判定靠業務語意，是否要加 ECM 風格防呆（已派工 PrintItem 不可直接修改規格）？暫留 OQ，prototype 階段評估必要性。
- **OQ-5（延後處理 — milestone billing 升級路徑）**：未來若引入 milestone billing（如打樣 / 大貨分階段開票），是否需從 PaymentPlan 升級為獨立 InvoicePlan 實體？暫留 OQ。
- **OQ-6（延後處理 — 售後根因分類）**：CEO 視角建議「售後服務單根因分類欄位 + 月度根因報表」讓上游問題浮現。暫留 OQ，未來 change 處理。
