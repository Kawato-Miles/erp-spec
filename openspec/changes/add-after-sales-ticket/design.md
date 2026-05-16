## Context

### 既有狀態
[order-management spec v1.2](../../specs/order-management/spec.md)（refactor-order-adjustment-and-cleanup 2026-05-12 歸檔）定義 OrderAdjustment 採雙重身份：

- `adjustment_phase = during_order`（訂單未完成）→ UI「訂單異動單」
- `adjustment_phase = after_completion`（訂單已完成）→ UI「售後服務單」

OrderAdjustment 狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行）預設業務在建單時已決定 `adjustment_type`、`amount`、明細。對 during_order 場景（加印追加、規格變更、追加折扣、加運費）此設計合理；對 after_completion 場景（客訴、退款、補印）則出現 3 個無法承載的需求：

1. 業務需與主管 Slack 討論才能決定處理方式 → 現況無「決議階段」狀態
2. 一個事件可能對應 0..N 個 OrderAdjustment 動作 → 現況 OrderAdjustment 是動作載具
3. 售後事件需要可追蹤的結案語意 → 現況無 lifecycle

### 探索結論
Miles 透過 explore session（[對比頁面](../../../decks/after-sales-design-comparison.html)）確認設計組合 **方向 B + 解讀 2**：新增獨立 AfterSalesTicket 實體 + 訂單狀態保持「已完成」不變 + UI 徽章推導。

### senior-pm 前期介入採納
senior-pm 在問題框架階段識別出 Miles 原述未涵蓋的策略性問題：**公司賠付的成本可量化失敗** — 售後事件若無結構化分類，將無法統計每月認賠金額、哪類瑕疵最常發生。本 design 採納 senior-pm 強推的 P0 擴充：新增 `case_category`（售後類型）、`responsibility`（責任歸屬）兩欄位 + 對應 KPI。

### 與既有設計對齊
- **不抽象 CustomerCase 父型**：諮詢單（ConsultationRequest）是售前 case，AfterSalesTicket 是售後 case，兩者業務語意完全不同，強行統一會引入泛化負擔
- **沿用既有下游流程**：退款走既有 Payment / SalesAllowance、補印走既有 PrintItem + 審稿 + 工單，AfterSalesTicket 僅作為容器與追蹤層
- **與 OrderAdjustment 鬆耦合**：ticket 內可掛 0..N 張 OrderAdjustment，OrderAdjustment 維持純金額異動載具

## Goals / Non-Goals

### Goals
- 提供售後事件從受理到結案的完整 lifecycle 容器，避免「事件遺漏」「結案不明」
- 讓 OrderAdjustment 回歸純金額異動載具，恢復 v1.2 之前雙重身份引入的語意污染
- 透過 `case_category` + `responsibility` 結構化分類，將售後事件轉成品質成本資料源，支援「公司認賠金額 / 月」「哪類瑕疵最常發生」等管理指標
- 「不處理」結局有合法承載實體（ticket 直接結案，無下游 OrderAdjustment 污染對帳）
- 補印場景的關聯實體（PrintItem）與 ticket 建立 FK 關聯，避免「靠日期猜哪個印件是補印」

### Non-Goals
- **不抽象 CustomerCase 共用父型**：諮詢單與售後 ticket 概念雖類似，但業務語意分離度高，統一抽象成本大於收益
- **不做自動分派演算法**：業務手動建單，不引入售後 ticket 的分配規則
- **不主動推 SLA 升級主管**：MVP 只做訂單列表紅燈與業務看板分桶提醒，不發 Slack / Email
- **不做客戶滿意度問卷系統**：預留 `customer_feedback_note` 文字欄位但不主動詢問客戶
- **不支援一張訂單多次售後**：MVP 強制最多 1 張 ticket，corner case（同訂單反覆客訴）走「ticket 內補述」（`additional_complaint_log` 陣列）
- **不做主管 dashboard / 月度檢討會儀式**：屬後驗 epic，等資料累積後再開 change
- **不做售後 ticket 跨訂單合併**：每張 ticket 強制屬於單一 Order

## Decisions

### D1: 採方向 B（獨立 AfterSalesTicket 實體）而非方向 A（OrderAdjustment 擴充）

**選擇**：新增獨立 AfterSalesTicket 實體，OrderAdjustment 回歸純金額異動載具。

**替代方案**：
- **方向 A（沿用 OrderAdjustment 擴充）**：在 OrderAdjustment 加 `resolution` / `closure_status` 欄位 + `adjustment_type = 不處理`（amount=0）值。實體不變但 OrderAdjustment 同時承擔「金額異動」與「售後容器」雙重角色。

**選擇理由**：
- 三個場景（不處理 / 退款 / 補印）中只有方向 B 的語意是乾淨的：
  - **不處理**：不會建出 amount=0 OrderAdjustment 污染對帳警示 banner（其觸發條件為 `executed_at > completed_at`）
  - **補印**：有明確 FK 關聯（PrintItem.related_after_sales_ticket_id）方便未來自動推導結案
  - **退款**：ticket 內加掛 OrderAdjustment(退印, -金額)，職責分離清楚
- OrderAdjustment scenarios.md 既有設計邊界（「OrderAdjustment 必為金額異動」「不建 amount=0」）保持不破壞
- 雖新增實體，下游動作（退款 Payment、補印 PrintItem、SalesAllowance）完全沿用既有流程，符合「沿用既有流程」原則

### D2: 採解讀 2（訂單狀態不變 + UI 徽章推導）

**選擇**：`Order.status` 永遠保持「已完成」，售後狀態為 derived 徽章。

**替代方案**：
- **解讀 1（狀態機新增階段）**：`已完成 → 售後處理中 → 售後完成` — 破壞 `adjustment_phase` 推算邏輯（依 `Order.status = 已完成` 判定）；對帳警示 banner 的 `executed_at > Order.completed_at` 觸發條件需重新定義 completed_at 是哪個時間點
- **解讀 3（parent + sub-status）**：新增 `Order.sub_status` 欄位 — 對印刷業 ERP 場景過度設計（一個訂單通常一次售後）

**選擇理由**：
- 最不侵入既有設計：`adjustment_phase`、對帳警示、三方對帳邏輯皆不受影響
- 售後處理時間戳記在 ticket 上（`opened_at` / `closed_at`），歷史追溯透過「訂單關聯的 ticket」即可
- 列表頁加一欄「售後」徽章即可，UI 變更最小

### D3: 結案純手動（業務手動點「結案」按鈕）

**選擇**：三種 resolution（不處理 / 退款 / 補印）皆由業務手動點 ticket 上的「結案」按鈕。

**替代方案**：
- **純自動**：依關聯動作狀態自動推導（補印印件出貨完成 / 退款 Payment 入帳 / 不處理立即）
- **混合**：不處理立即結案；退款 / 補印完成後提示業務確認再結案

**選擇理由**：
- Miles 明確選擇「純手動」，理由：補印「客戶實際收到滿意」這個業務判斷邊界被自動結案跳過會失準
- 但 senior-pm 警告「業務忘記結案」的風險：採納其建議補強「訂單列表 > N 天未結案紅燈 + 業務看板分桶」作為防呆

### D4: Slack 討論不存內容，只存 thread URL

**選擇**：AfterSalesTicket 加 `slack_thread_url`（URL 欄位）。業務在建 ticket 後將 Slack 討論串 URL 貼入。

**替代方案**：
- **不留痕**：純線下溝通，系統只看結果（resolution）
- **加 `decision_note` + 決議參與人**：文字欄位 + 主管 ID

**選擇理由**：
- Miles 明確：「討論不進 ERP，但要給 webhook 到 Slack 的連結存在售後服務單中，幫助後續回連到 Slack 查看過程」
- 避免在 ERP 重複維護 Slack 已有的討論內容，保持單一資料源
- 留下回溯路徑：後續稽核 / 客訴升級時可點 URL 回 Slack 看完整脈絡
- Slack 通知機制細節（系統主動 webhook vs 業務人工）見 [OQ-NOTIFY-1](#open-questions)

### D5: 補印收費走 ticket + OrderAdjustment 雙實體

**選擇**：
- 免費補印（公司認賠）→ ticket 只關聯 PrintItem，不建 OrderAdjustment
- 收費補印（客戶承擔）→ ticket 同時關聯 PrintItem + 一張 OrderAdjustment(adjustment_type=補退, amount=+補印費)

**替代方案**：
- **統一建 OrderAdjustment**：免費 amount=0、收費 amount > 0
- **收費補印不關聯 ticket**：走原 during_order OrderAdjustment 流程

**選擇理由**：
- 避免 amount=0 OrderAdjustment 污染對帳（與 D1 同源）
- OrderAdjustment 維持純金額語意，收費 / 免費路徑差異實體層級就分清楚
- senior-pm 警告「業務在 ticket 與 OA 兩處操作會混淆」：採納其建議「ticket 內必須直接顯示關聯的 OrderAdjustment 卡片（金額 + 狀態），ticket 提供『建立補印費 OrderAdjustment』一鍵按鈕」

### D6: 一張訂單最多 1 張 AfterSalesTicket（系統強制）

**選擇**：MVP 強制一個 Order 最多關聯 1 張 AfterSalesTicket，業務嘗試建第二張時 UI 拒絕。

**替代方案**：
- **不限張數**：corner case 友善但 UI 推導邏輯需處理多 ticket 聚合
- **預設 1 張，主管可例外開新**：權限規則複雜化

**選擇理由**：
- Miles 確認「一個訂單通常一次售後，不像保固有多次案件」
- senior-pm 建議補 escape hatch：ticket 內加 `additional_complaint_log`（文字 / 陣列欄位）讓業務在同一 ticket append 後續客訴紀錄，避免「同訂單第二次客訴」走不通系統
- 簡化「訂單售後徽章」推導邏輯（只看單張 ticket 狀態，不需聚合）

### D7: 採納 senior-pm P0 擴張（case_category + responsibility 兩欄位）

**選擇**：新增 `case_category`（售後類型）與 `responsibility`（責任歸屬）為 ticket 必填欄位。

**case_category enum 候選**（待 [OQ-AST-1](#open-questions) 確認）：
- 印件瑕疵（印刷品質問題：飛墨、背印、脫膜、污漬）
- 規格不符（規格寫錯、與打樣有出入）
- 物流問題（運送破損、寄錯地址、延遲）
- 工法限制（工法評估後無法達成、需用替代方案）
- 交期延誤（製作延誤、無法準時交貨）
- 其他

**responsibility enum 候選**（待 [OQ-AST-2](#open-questions) 確認）：
- 公司認賠（公司方造成）
- 客戶承擔（客戶方造成、客戶接受）
- 共同分擔（雙方協商各承擔部分）

**選擇理由**：
- 沒有這兩個欄位，「公司認賠金額 / 月」「哪類瑕疵最常發生」KPI 無法切片分析
- senior-pm 強推：「ticket 應視為公司品質回饋的資料源，不只是事件處理工具」— 否則 6 個月後只會變「業務日記本」
- enum 採固定值（非自由 tag）避免雜亂導致無法統計

### D8: 採納 senior-pm 防呆建議（紅燈 + 業務看板）

**選擇**：
- 訂單列表「售後」欄位：未結案 ticket 開立超過 7 天顯示紅色徽章（閾值見 [OQ-AST-3](#open-questions)）
- 業務看板新增「我的未結案售後」分桶，按開立日期排序

**選擇理由**：
- D3 純手動結案的副作用：業務可能忘記點結案
- senior-pm 提出的「行為設計反推填寫質量」邏輯：業務看到自己有未結案 ticket 會主動處理，反過來推動填寫品質
- 不發 Slack / Email 通知（範疇外）

### D9: AfterSalesTicket 列入新獨立 capability

**選擇**：新建 `openspec/specs/after-sales-ticket/spec.md`，不併入 order-management。

**替代方案**：併入 order-management spec § 售後服務章節。

**選擇理由**：
- AfterSalesTicket 是獨立實體含自己的狀態機、欄位、Scenarios，內容量足夠成獨立 capability
- order-management spec 已包含 OrderAdjustment / PaymentPlan / Payment / Invoice / SalesAllowance / BillingCompany 六實體 + 異動規則，再加 AfterSalesTicket 會過載
- 與 ConsultationRequest（諮詢單）成為獨立 capability 的做法一致

### D10: 業務主管不參與系統流程

**選擇**：AfterSalesTicket 狀態機無「待主管核可」關卡，業務直接推進。

**選擇理由**：
- Miles 明確：「業務與主管討論，目前不需要審核，討論出結果後就可以進行下一步。類似 Slack 通知後討論」
- 主管在 Slack 上參與決議（討論發生於 ERP 外），ERP 只看結果
- ticket 上的 `slack_thread_url` 提供回溯入口
- 若 ticket 內加掛 OrderAdjustment（退款 / 補印收費），該 OrderAdjustment 仍走「業務主管審核」流程（既有 OA 狀態機不變）— 主管在 OA 層級把關金額

## Risks / Trade-offs

| 風險 | 後果 | 緩解 |
|------|------|------|
| 業務忘記結案 | 訂單列表紅燈疲勞，售後狀態失真 | 業務看板分桶「我的未結案」+ > 7 天紅燈提示（D8） |
| 補印收費雙實體 UI 混淆 | 業務在兩處分開操作，遺漏關聯 | ticket 內直接顯示關聯 OA 卡片 + ticket 內一鍵建補印費 OA 按鈕（D5） |
| case_category enum 後期需擴充 | 統計切片中「其他」佔比過高，洞察失準 | 固定 6 值 + 「其他」逃生口；定期審視「其他」內容並補新 enum 值 |
| 歷史 OrderAdjustment(phase=after_completion) 遷移 | Prototype mockData 重建後對帳邏輯斷裂 | Migration Plan 明確：mockData 重建時把對應 OA 反向掛 ticket，並標 `legacy_migrated = true` 欄位（細節見 [OQ-MIGRATE-1](#open-questions)） |
| 「最多 1 張」corner case | 同訂單反覆客訴無法表達 | `additional_complaint_log` 陣列當 escape hatch（D6） |
| 對帳警示 banner 觸發條件 | ticket 關聯 OrderAdjustment 與獨立 OrderAdjustment 計入規則不清 | [OQ-RECON-1](#open-questions) 釐清；MVP 先沿用既有觸發條件（`OA.executed_at > Order.completed_at`），ticket 關聯不額外處理 |
| ticket 結案後可重開 | 客戶結案後再投訴需新建 ticket，違反「最多 1 張」 | [OQ-AST-5](#open-questions) 釐清；MVP 預設「結案後不可重開」，需新 ticket 場景納入「最多 1 張」例外規則 |
| ConsultationRequest 設計類比強烈但不統一 | 兩個 case-like 容器各自演進，未來可能出現重複邏輯 | 設計時保持命名 / API 風格類似（`linked_print_items` / `linked_adjustments`），實體獨立但可平行演進 |

## Migration Plan

### Prototype 階段（本 change 範疇）
1. **資料層重建**：
   - 新增 `AfterSalesTicket` entity + Factory + mockData seed
   - `OrderAdjustment` 移除 `adjustment_phase` 欄位（或保留但 default = during_order 並標 deprecated）
   - `PrintItem` 加 `related_after_sales_ticket_id` FK（nullable）
2. **既有 mockData 改寫**：
   - payment-invoice-scenarios.md 異動情境 1-3 對應的訂單 mockData（`ORD-20260322-01`、`ORD-20260301-01`、`ORD-20260331-02`）重建：
     - 情境 1（公司吸收）：建 AfterSalesTicket（resolution=不處理）+ 工單異動紀錄
     - 情境 2（補收）：建 AfterSalesTicket（resolution=補印）+ 補印 PrintItem + OA(+補印費)
     - 情境 3（退款）：建 AfterSalesTicket（resolution=退款）+ OA(退印, -金額) + 退款 Payment
   - 既有 OrderAdjustment(phase=after_completion) 歷史單反向關聯至對應 ticket
3. **UI 變更**：
   - 訂單詳情頁「建立售後服務單」按鈕邏輯改建 AfterSalesTicket
   - 訂單列表加「售後狀態」欄 + 篩選器
   - 業務看板加「我的未結案售後」分桶
4. **對帳警示 banner**：MVP 沿用既有觸發條件（[OQ-RECON-1](#open-questions) 釐清後再調整）

### Spec 同步
- `payment-invoice-scenarios.md` 異動情境 1-3 表述改寫
- `state-machines/spec.md` 新增 AfterSalesTicket 狀態機，OrderAdjustment 狀態機移除雙重身份註記
- `business-processes/spec.md` 訂單異動流程加入「售後階段」分支
- `business-scenarios/spec.md` 售後相關情境改用 AfterSalesTicket 路徑
- `user-roles/spec.md` 業務 / 業務主管權責補建立、結案 ticket 動作

### 部署 / Rollback
不涉及生產系統，Prototype 階段直接覆寫 mockData，無 rollback 需求。

## Open Questions

### 設計細節（senior-pm 提出）

#### OQ-AST-1: 售後類型分類 enum 採固定 7 值或可擴充
**問題**：`case_category` 採 7 個固定 enum（印件瑕疵 / 色差爭議 / 規格不符 / 物流 / 工法 / 交期 / 其他），或允許 admin 後台擴充？
**推薦**：固定 7 值（含 senior-pm 三視角審查補入的「色差爭議」）；後續若「其他」累積過多再評估擴充。
**影響**：業務分類選項、ticket 列表篩選

#### OQ-AST-2: 責任歸屬 enum 是否含「共同分擔」
**問題**：`responsibility` 採三值（公司認賠 / 客戶承擔 / 共同分擔），或簡化為二值（公司認賠 / 客戶承擔）？
**推薦**：三值。共同分擔場景實務存在（如「客戶補檔 + 公司加工失誤」雙方各退一半），二值會逼業務做不準確的歸因。共同分擔細節由業務於 `customer_complaint` 自由補述（不引入比例欄位以維持流程簡單）。
**影響**：決議補印是否收費 / 退款是否吸收 的操作判斷

#### OQ-AST-3: 未結案 ticket 紅燈閾值天數
**問題**：訂單列表「售後」欄超過幾天未結案顯示紅色徽章？
**推薦**：7 天（與 senior-pm 建議的中位結案目標 < 7 天一致）
**影響**：業務行為設計、訂單列表視覺壓力

#### OQ-AST-4: 「最多 1 張」escape hatch 設計
**問題**：senior-pm 建議補 `additional_complaint_log`（文字陣列）讓業務在同一 ticket append 後續客訴；資料結構採陣列、或單一文字欄位（append 時間戳）？
**推薦**：陣列（含 `logged_at` + `note` 兩欄位），未來可單列查詢
**影響**：ticket 詳情頁 UI、ticket 表單複雜度

#### OQ-AST-5: ticket 結案後可否重開
**問題**：ticket 結案後客戶再投訴，是重開原 ticket 還是新建第二張？
**推薦**：不可重開，需新 ticket（但與 D6「最多 1 張」衝突 → 結案後允許新建一張作為例外）
**影響**：狀態機定義、「最多 1 張」規則邊界

### 通知機制

#### OQ-NOTIFY-1: 建 ticket 時系統主動發 Slack webhook
**問題**：D4 採「業務人工貼 Slack URL」，但建 ticket 當下是否該由系統發 Slack webhook 通知主管（類似 [需求單成本評估通知印務主管](../../specs/business-processes/spec.md#L100) 模式）？業務從 webhook 結果取得 thread URL 自動回填？還是純人工通知？
**推薦**：MVP 純人工通知（業務 Slack 上 @ 主管後手動貼 URL 入 ticket）；未來若 Slack channel 標準化可整合自動 webhook。與 [XM-002 Slack Webhook Channel 清單](https://www.notion.so/32c3886511fa8106aef3d4f2d196c1f7) 合併處理。
**影響**：Slack 整合 infrastructure、業務 onboarding UX

### 遷移與對帳

#### OQ-MIGRATE-1: 既有 OrderAdjustment(phase=after_completion) 歷史單遷移
**問題**：Prototype mockData 中既有 `phase = after_completion` 的 OrderAdjustment 如何處理？(a) 全部反向掛到自動生成的 AfterSalesTicket、(b) 移除 phase 欄位但不掛 ticket（歷史單視為純金額異動）、(c) 標 deprecated 保留供參考
**推薦**：(a) 反向掛 ticket，並標 `legacy_migrated = true`；ticket 的 `customer_complaint` 從 OrderAdjustment.reason 帶入
**影響**：Prototype mockData 一致性、對帳邏輯回測

#### OQ-RECON-1: 對帳警示 banner 觸發條件校準
**問題**：現況觸發條件 `OrderAdjustment.executed_at > Order.completed_at` 在 ticket 路徑下是否仍適用？ticket 關聯的 OrderAdjustment 是否該以「ticket.opened_at > Order.completed_at」替代或並行判斷？
**推薦**：MVP 沿用既有條件不變（ticket 內 OrderAdjustment 在 ticket 內執行，`executed_at` 仍會 > `completed_at`），不另外處理
**影響**：[order-management spec § 對帳警示 banner 觸發條件](../../specs/order-management/spec.md)

#### OQ-RECON-2: 三方對帳檢視 ticket 關聯 OrderAdjustment 是否分桶顯示
**問題**：對帳檢視面板的「已執行 OrderAdjustment」是否該區分「ticket 關聯」與「獨立」兩桶顯示？
**推薦**：MVP 不分桶（保持應收計算公式不變），未來若管理層需要「售後異動金額」獨立 KPI 再分
**影響**：對帳檢視面板 UI

### UI 整合

#### OQ-UI-1: ticket 詳情頁嵌入訂單詳情頁 Tab 或獨立頁面
**問題**：AfterSalesTicket 詳情頁採訂單詳情頁的新 Tab（如「售後服務」Tab，與「資訊」「印件」「對帳」並列），或開獨立頁面（從訂單詳情頁點連結跳轉）？
**推薦**：訂單詳情頁新 Tab。理由：售後 ticket 強相依於訂單上下文（客戶、印件、付款歷史），獨立頁需多重切換才能對照。沿用 [refactor-detail-pages-to-subheader-tab-layout](https://github.com/Kawato-Miles/sens-erp-prototype) 既有 Tab 模式。
**影響**：訂單詳情頁 Tab 結構、navigation 設計

## 三視角審查結論（2026-05-14）

specs / design / tasks 完成後執行三視角平行審查（senior-pm + ceo-reviewer + erp-consultant），結果如下：

### 三方核心意見摘要

| 視角 | 核心意見 |
|------|---------|
| senior-pm（PM 視角）| 設計品質高。P0：KPI 公式漏算補印認賠成本。P1：補 case_category「色差爭議」、補比例欄位、業務離職轉派、OA / PrintItem 取消處理、Task DoD 補強 |
| ceo-reviewer（CEO 視角）| **建議退回重新評估範疇**。印刷 ERP ROI 不在 case management；Miles 原痛點被 senior-pm 策略性問題綁住過度擴張；KPI 沒 owner / baseline / target；建議 1/3 工程量替代版本（OrderAdjustment 擴 4 欄位）|
| erp-consultant（ERP 顧問視角）| 接近 SAP QM 標準但有顯著差距（b）。P0：缺 severity 欄位、缺 parent_ticket_id FK 維持血緣。P1：缺 root_cause / corrective_action / linked_qc_event_id / payment_source / Customer Master FK、`additional_complaint_log` 改獨立子實體 |

### Miles 決策（2026-05-14）

**對 CEO 退回的回應**：看不懂 ROI 影響分析，維持方向 B（不採 1/3 工程量版本）。

**對 P0 / P1 修正的原則**：「以流程可進行為主，稽核相關不考慮，看不懂為什麼要越用越複雜」。

依此原則整合修正範圍：

#### 採納（流程相關，本 change 修正）

| 修正項 | 來源 | 動作 |
|--------|------|------|
| `case_category` 補「色差爭議」（6 → 7 enum）| senior-pm | spec 已修 |
| 業務離職 / 請假時 ticket 負責人轉派 | senior-pm | spec 新增 Requirement |
| ticket 內 OrderAdjustment 取消後 resolution 清理流程 | senior-pm | spec 新增 Scenario |
| 補印 PrintItem 於審稿 / 工單階段取消後 ticket 處理 | senior-pm | spec 新增 Scenario |
| `case_category` / `responsibility` 用途描述去稽核化 | Miles 決策 | spec 已修（從「品質成本切片」改為「業務分類與接手 / 操作依據」）|
| Task DoD 補強（3.2 卡片排序、5.6 結案 dialog 文案、9.1 對帳驗證 mockData、16.5 驗證通過條件）| senior-pm | tasks.md 待修 |

#### 移除（稽核相關，與 Miles 原則衝突）

| 移除項 | 來源建議 | 移除理由 |
|--------|---------|---------|
| 「售後事件統計查詢（管理層 KPI 資料源）」Requirement | proposal / design / spec 原內容 | Miles 明確「稽核相關不考慮」，KPI / 月度報表不在本 change 範疇 |
| KPI 公式補補印認賠成本 | senior-pm P0 | 屬稽核 / 統計，整段移除 KPI Requirement |
| `severity` 必填欄位 | ERP 顧問 P0 | ISO 9001 稽核標配，超出流程需要 |
| `parent_ticket_id` FK 維持血緣 | ERP 顧問 P0 | 資料血緣稽核用，不在流程操作必要範圍 |
| `root_cause` + `corrective_action` 欄位 | ERP 顧問 P1 | ISO 9001 NCR 稽核要求，超出流程 |
| `linked_qc_event_id` 預留欄位 | ERP 顧問 P1 | 跨模組分析用，屬統計 / 追溯範疇 |
| Payment polymorphic source | ERP 顧問 P1 | 跨 capability 統計需要，本 change 範圍外 |
| Customer Master FK denormalize | ERP 顧問 P1 | 跨訂單客戶分析用，等 [ORD-011 Customer master OQ](https://www.notion.so/3493886511fa8144b5dae45221a0213d) 統一處理 |
| `additional_complaint_log` 升級為獨立子實體 | ERP 顧問 P1 | 業務原意是「補述紀錄」非可分析資料源，維持陣列即可 |
| `responsibility_company_ratio` 比例欄位 | senior-pm P1 | KPI 切片用，去稽核化後不需要 |
| processing sub_status derived field | ERP 顧問 P1 | 視覺化「業務在等什麼」，業務看板分桶已涵蓋核心訴求 |
| 紅燈閾值依 severity 分段 | ERP 顧問 P0 衍生 | severity 不採後，紅燈固定 7 天 |

#### 不採納 CEO 1/3 工程量替代版本

理由：
1. 方向 A（OrderAdjustment 擴 4 欄位）已於 explore 階段對比並由 Miles 選擇方向 B，現階段不重啟設計
2. amount=0 OrderAdjustment 仍打破既有 `payment-invoice-scenarios.md` 異動情境 1（公司吸收）的設計邊界（「不建 OrderAdjustment(amount=0)」）
3. 對帳警示 banner 條件加 `amount ≠ 0` 雖簡單，但「不處理」需要實體承載的需求（業務追蹤未結案）仍未解
4. ERP 顧問支持獨立 entity（接近 SAP QM 標準）

CEO 提出的「ROI 不足」「KPI 沒 owner」批評部分採納為「移除稽核相關內容」（避免做業務不會用的東西），但保留 AfterSalesTicket entity 本身。

### 列入新 OQ（待後續評估）

| OQ ID | 內容 | 觸發時機 |
|-------|------|---------|
| OQ-AUDIT-1 | 是否需要建立月度公司認賠金額報表 dashboard | 公司開始月度品質檢討會時 |
| OQ-AUDIT-2 | 是否引入 severity 欄位以支援 SLA / 紅燈分段 | 業務反映「紅燈疲勞」或「Critical case 漏處理」時 |
| OQ-AUDIT-3 | 是否引入 parent_ticket_id 維持反覆售後資料血緣 | 同訂單第二張售後 ticket 數量累積到管理層需要分析時 |
| OQ-AUDIT-4 | 是否將 AfterSalesTicket 與 QC NCR rework chain 整合（WO-010 延伸）| WO-010 OQ 處理時一併評估 |
| OQ-AUDIT-5 | 是否升級 additional_complaint_log 為獨立子實體 | 業務需要「補述頻率」分析或客服系統整合時 |

以上 5 個新 OQ 寫入 Notion Follow-up DB，狀態 = 未開始，優先順序 = 低（皆屬「業務反映需要時再評估」）。

### 三視角審查的延伸啟示

senior-pm + ERP 顧問皆指出設計品質高、業界對齊度尚可，CEO 的根本挑戰是「需求優先序」而非設計問題。Miles 的「以流程可進行為主」原則已對齊既有 feedback memory（「ERP 設計優先沿用既有流程」「發票 / 對帳類工具優先彈性」），此 change 維持輕量流程容器定位即符合產品策略。

## 驗證紀錄（2026-05-16 Lovable 端到端驗證）

於 Lovable preview（commit ea16744）對 Section 16 task 16.2-16.5 進行端到端驗證，結果如下：

### 16.2 訂單詳情頁「售後服務」Tab（情境 1 + 3 + demo3）

| 訂單 | 對應 ticket | resolution / status | 驗證結果 |
|------|------------|---------------------|---------|
| `ORD-20260322-01`（情境 1 公司吸收）| `ast-demo-nothing` (AS-20260512-01) | 不處理 / 已結案 | 卡片顯示「印件瑕疵 + 公司認賠 + 不處理 + 已結案」徽章；無下游 OA / PrintItem；Slack 討論串連結正確 |
| `ORD-20260331-02`（情境 3 退款）| `ast-legacy-a3` (AS-20260503-01) | 退款 / 已結案 | 卡片顯示「色差爭議 + 共同分擔 + 退款 + 歷史遷移」徽章；客訴內容「退款 8,000 + 折讓 INV-01」呼應 task 11.3 mockData |
| `ORD-20260413-07`（demo 3 補印逾期）| `ast-demo-reprint-overdue` (AS-20260505-01) | 補印 / 處理中（逾期 11 天）| 卡片顯示「規格不符 + 公司認賠 + 補印」+ 紅色「處理中（逾期 11 天）」徽章；後續補述紀錄正確顯示 |

### 16.3 訂單列表「售後」欄位 + 篩選器

- 訂單列表 toolbar 新增「售後狀態」篩選器，下拉選項含「全部 / 無 / 售後處理中 / 售後逾期 / 售後已結案」5 種
- 訂單列表「售後」欄依 derived `Order.after_sales_status` 顯示徽章（demo3 訂單 ORD-20260413-07 顯示紅色「售後逾期」徽章）
- 已結案訂單 + 無 ticket 訂單顯示空白「—」，符合 spec § Requirement: 訂單列表售後狀態欄位與篩選器

### 16.4 業務看板「我的未結案售後」分桶

- 業務「洪嘉駿」首頁分桶頂部顯示「我的未結案售後（2）按受理時間升序，逾期 7 天標紅燈」
- 桶內 2 筆卡片：
  - `AS-20260505-01` 處理中（逾期）+ 規格不符 + ORD-20260413-07 + 11 天前受理（紅燈）
  - `AS-20260513-01` 處理中 + 印件瑕疵（demo 2 退款）+ ORD-20260418-02 + 3 天前受理
- 點擊卡片導航至訂單詳情頁的「售後服務」Tab 並自動展開該 ticket（URL `?tab=afterSales&ticket=<id>`）

### 16.5 三個情境 mockData 驗證

| 情境 | 訂單 | 預期 mockData | 實際渲染 |
|------|------|--------------|---------|
| 情境 1 公司吸收 | `ORD-20260322-01` | 建 ticket(resolution=不處理) + 不建 OrderAdjustment | ✓ ticket 卡片有 + 售後 Tab 無 OA 區塊 |
| 情境 2 補收（沿用 OA 路徑）| `ORD-20260301-01` | 不關 ticket、走 OrderAdjustment | （task 11.2 mockData 走 OA 路徑，此情境訂單頁的「訂單異動」Tab 顯示原 OA；不在售後 Tab 驗證範圍）|
| 情境 3 退款 | `ORD-20260331-02` | 建 ticket(resolution=退款) + ticket 內掛 OA(退印, -金額, linked_after_sales_ticket_id) | ✓ ticket 卡片顯示「歷史遷移」徽章 + 客訴內容含「退款 8,000 + 折讓 INV-01」 |

### Section 8.6 / 8.7 業務主管批次轉派 + 業務角色拒絕

- **task 8.7 業務角色拒絕**：以業務「洪嘉駿」身分於 ticket 詳情頁點「轉派負責人」按鈕 → 右下角 toast「售後服務單負責人轉派需由業務主管執行」，dialog 不開啟 ✓
- **task 8.6 業務主管後台批次轉派**：
  - AppSidebar「訂單管理 → 售後服務單轉派」入口正確顯示
  - 後台頁列出 2 張未結案 ticket（3 張已結案者自動過濾）
  - 篩選器 4 項（訂單編號 / 負責業務 / 售後類型 / 只顯示逾期）+ Checkbox 多選 + 「批次轉派」按鈕（勾選 0 張時 disabled）
  - 勾選 2 張 + 點「批次轉派」→ Dialog 顯示「批次轉派 2 張售後服務單」+「新負責人 select」+「轉派原因 textarea」+ 提示「即將將 2 張 ticket.openedBy 從各自原負責人轉派為「蕭士龍」」
  - 選新負責人「蕭士龍」+ 填原因後點「確認轉派」→ toast「已轉派 2 張售後服務單給 蕭士龍」+ 表格負責人欄即時更新為「蕭士龍」✓

### 已知限制 / 不在本次驗證範圍

- Lovable preview 的 zustand store 無 persistence，MCP `navigate` 觸發 hard reload 會 reset store；以 SPA 內 link 點擊跳轉時 store state 維持
- 已結案 ticket 不在後台列表內，「跳過已結案」分支（spec § Scenario: 已結案 ticket 不支援轉派）已透過 store mutation 邏輯（檢查 `status !== '已結案'`）保證；於 UI 上需透過 url 直接訪問 + 將已結案 id 帶入勾選才能完整驗證，此情境暫列 UAT 階段補驗
