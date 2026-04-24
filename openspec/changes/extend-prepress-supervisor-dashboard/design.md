## Context

現行 [SupervisorDashboard.tsx](/Users/b-f-03-029/sens-erp-prototype/src/pages/prepress/SupervisorDashboard.tsx) 在 `add-prepress-operational-views`（2026-04-22 歸檔）後已具備：

- **審稿人員 tab**：負擔儀表板、派案等級編輯
- **KPI 概覽 tab**：7 項基本指標 + 退件原因 Top N
- **今日營運指標**：新進稿、今日合格輪次、今日不合格輪次
- **個人對比表**：以審稿人員為行，可切今日 / 本週 / 本月

**主管決策缺口**：

| 決策需求 | 現有資料 | 缺口 |
|---------|---------|------|
| 審稿速度是否拖累產線 | 印件級 α 處理時間 | 缺訂單層整體滯留天數、缺反覆退件訂單識別 |
| 哪些稿反覆被退、誰退件異常 | 合併在退件率內 | 未分離首審退件與補件後退件 |
| 哪個客戶品質差、該找業務介入 | 無 | 無客戶維度切片 |

**三視角審查修訂**（2026-04-24）：

- CEO：反對「訂單合格數排名 + 審稿王」（小團隊內耗、可操弄、對經營無直接意義）→ 刪除
- PM：需補客戶維度、Scenario 需可測、OQ 需凍結歷史月份
- 顧問：訂單級統計需落地為冗餘欄位、補離職 reviewer 規則、效能風險

本 design 聚焦於修訂後的五個核心決策：資料模型落地、訂單級判定凍結、客戶維度切片、審稿環節經營指標、Dashboard 版型。

**相關資源**：
- [business-processes spec](openspec/specs/business-processes/spec.md) § 審稿合格後自動建工單
- [state-machines spec](openspec/specs/state-machines/spec.md) § 訂單上層狀態機（不改，沿用「製作等待中」表達審稿全部完成）
- [order-management spec](openspec/specs/order-management/spec.md) § Data Model
- [user-roles spec](openspec/specs/user-roles/spec.md) § 審稿主管權責

## Goals / Non-Goals

**Goals：**

- 讓審稿主管能單頁掃視「速度 / 品質 / 人員 / 客戶」四視角
- 指標定義具業務意義（訂單級、客戶級、滯留天數）並可量化、可凍結、可測
- 演算法落地為冗餘欄位以解決效能與歷史凍結兩個關鍵問題
- 不製造不必要的競爭壓力（無排行榜、預設依姓名而非名次排序）

**Non-Goals：**

- 不做排名性質功能（審稿王 / 訂單合格排行榜）——三視角一致反對
- 不涵蓋「諮詢人員退件」納入統計（資料模型不足）
- 不變更 ReviewerInbox / InProgressItems 的 Summary 版型（Miles 決定保留）
- 不提供「訂單層審稿事件流水」頁面（本 change 僅做統計，追溯沿用印件詳情頁）
- 不做「下鑽到印件清單」「異常徽章」「自動通知業務」等閉環功能（延後評估）
- 不做「改稿原因代碼結構化」（CEO 強烈建議但範疇獨立，另開 change）
- 不在本 change 的「補件後退件」指標上做行動判定（例如自動警示惡意退稿）——在改稿原因代碼結構化完成前，僅作觀察用
- 不新增訂單狀態節點（現有「製作等待中」已足夠）

## Decisions

### D1. 訂單級合格判定——冗餘欄位 + 凍結快照

**決策**：將「訂單是否達成審稿全部合格」的計算結果落地為兩個冗餘欄位，以取代動態計算。

```
Order.prepressApprovedAt: timestamp | null
Order.primaryContributorId: reviewerId | null
```

**寫入時機**：

```
當印件狀態轉為合格時：
  if Order.prepressApprovedAt === null
     && 訂單內所有非 skipReview 印件的當前 reviewDimensionStatus === '合格':
       Order.prepressApprovedAt = now
       Order.primaryContributorId = identifyPrimaryContributor(order)
```

**凍結規則**：

- 一經寫入不再變動（即便後續重審退件使任一印件退出合格）
- 理由：審稿績效對帳以「首次達成合格」為準；重審退件反映的是「再加工」，不該讓歷史月份數字倒退

**Dashboard 查詢方式**：

- 訂單合格數（區間內） = `WHERE prepressApprovedAt BETWEEN [startMs, endMs)` 的訂單數（O(n)）
- 按 reviewer 分組 = 同上 GROUP BY `primaryContributorId`
- 按客戶分組 = 同上 GROUP BY `customerId`
- 不再需要 runtime 遍歷所有印件重算

**配套輔助指標**：

- 「退件後重審中訂單數」= `prepressApprovedAt != null && 當前有印件 reviewDimensionStatus ∈ {不合格, 已補件}` 的訂單數，反映「已達過合格但又退件」的再加工負擔

**驗算範例**：

- **例 1（單月完成）**：O-001 9/20 最後一件合格 → `prepressApprovedAt = 9/20`；9 月 Dashboard 計入
- **例 2（跨月完成）**：O-002 P1 於 9/28 合格、P2 於 10/2 合格 → `prepressApprovedAt = 10/2`（最後一件達成合格時寫入）；9 月不計、10 月計入
- **例 3（重審退件）**：O-003 9/20 達成合格寫入；10/1 重審退件 → 欄位不清空；9 月仍計入；Dashboard「退件後重審中訂單數」+1
- **例 4（全免審）**：O-004 所有印件 skipReview → 不進入判定（條件：訂單內所有非 skipReview 印件皆合格，這條件在「無非免審印件」時為真 vs. 為假需明確定義 → 決定：若訂單全部印件皆 skipReview，**不寫入 `prepressApprovedAt`**，不計入訂單合格數）
- **例 5（含免審 + 審稿）**：O-005 P1 skipReview、P2 於 9/15 合格 → `prepressApprovedAt = 9/15`（僅 P2 需達成合格）；計入 9 月；歸屬給 P2 的審稿人員

**Alternatives considered：**

- (替代 1) 動態計算、不落地欄位 → 放棄，效能風險（O(n·m)）、無法凍結歷史
- (替代 2) 寫入後允許覆寫（重審合格時覆寫為新時間）→ 放棄，歷史月份數字會漂移，對帳失準
- (替代 3) 清空冗餘欄位於重審退件時 → 放棄，歷史統計倒退，主管 9 月對帳在 10/1 改變

### D2. 主要貢獻者歸屬演算法

**決策**：於 `prepressApprovedAt` 寫入時計算，存入 `primaryContributorId`。

```
identifyPrimaryContributor(order):
  1. 計算訂單內每位 reviewer 審的「當前 reviewDimensionStatus = 合格」印件數
     （該印件的合格 Round 由該 reviewer 負責）
  2. 取印件數最多者 → 歸屬該員
  3. 若步驟 2 平手 → 取「訂單內最後一件合格印件的 reviewedAt」所屬 reviewer（收尾者）
  4. 若步驟 3 仍平手（多人同時完成最後一件，極罕見）
     → 取 reviewerId 字典序最小者
```

**離職 reviewer 處理**：

- `primaryContributorId` 為寫入時快照，**不隨 reviewer 停用 / 離職而變動**
- 歷史統計仍保留該 reviewer 姓名（UI 可加「（已離職）」標註）
- 當期對比表：若該 reviewer 在時間區間內無任何 Round → 不顯示 row（避免填零誤導）

**範例驗算**：

- **例 1（單一審稿人員）**：O-001 P1-P5 全由小陳審 → `primaryContributorId = 小陳`
- **例 2（主要貢獻者明顯）**：O-002 小陳 P1-P4、小王 P5 → `primaryContributorId = 小陳`
- **例 3（平手收尾）**：O-003 小陳 P1-P2（P2 於 9/10 合格）、小王 P3-P4（P4 於 9/15 合格） → `primaryContributorId = 小王`（收尾者）
- **例 4（重審改派）**：O-004 P1 Round 1 小陳退件 → Round 2 改派小王合格 → P1 歸小王（依合格 Round 的 reviewer）
- **例 5（離職）**：O-005 primaryContributorId = 小陳（已離職）→ 歷史統計保留，UI 可標「已離職」

### D3. 補件後退件識別

**決策**：Dashboard 層聚合（非冗餘欄位）。

```
一筆 ReviewRound 視為「補件後退件」，當且僅當：
  - roundNo >= 2
  - result = '不合格'
  - reviewedAt 落區間內

補件後退件印件數：上述 Round 所屬印件去重
補件後退件次數：上述 Round 總數
歸屬：ReviewRound.reviewerId（與訂單主要貢獻者獨立）
```

**重要限制聲明**：在「改稿原因代碼」結構化之前，本指標**僅作觀察用**——不自動推論「審稿人員惡意退稿」或「稿本身有問題」的因果。主管看到異常只是啟動對話的觸發點，實際判定需人工介入。

**範例驗算**：

- **例 1（稿反覆被退）**：P1 Round 1 退 → 補件 → Round 2 退 → 補件 → Round 3 退 → 印件數 +1、次數 +2（Round 2、3 計入補件後退件；Round 1 屬首審退件）
- **例 2（疑似審稿嚴苛）**：10 件印件每件 Round 2 退一次（Round 3 合格）→ 印件數 +10、次數 +10（觀察用，不自動判定）
- **例 3（跨 reviewer）**：P1 Round 1 小陳退 → Round 2 小王退 → Round 3 小張合格 → Round 1 首審退件歸小陳；Round 2 補件後退件歸小王；P1 訂單歸屬小張（若該訂單僅此一印件）

### D4. Dashboard 版型（修訂後）

**決策原則**：依指標性質選擇呈現元件；**移除所有排名性質元件**。

| 區塊 | 元件 | 位置 |
|------|------|------|
| L1 今日營運（既有） | 4 格 StatusCard | 頁首第一排 |
| 審稿環節經營指標（新） | 2 格 highlight card：平均滯留天數、退件 >3 輪訂單數 | 頁首第二排 |
| 審稿人員對比表（擴欄） | Table，無排名，預設依姓名 | Tab 1 |
| 客戶審稿成果表（新） | Table，預設依訂單合格數降冪顯示（但非「冠軍」語意） | Tab 2 |
| KPI 概覽（既有） | 既有 7 項 + 退件原因 Top N | Tab 3 |
| 能力維護（既有） | 審稿人員能力 CRUD | Tab 4 |

**審稿人員對比表欄位**（依序）：

1. 姓名（可 icon 標「已離職」）
2. 派案等級
3. 進行中件數（不受時間影響）
4. 訂單合格數
5. 退件印件數
6. 退件次數
7. 補件後退件印件數
8. 補件後退件次數
9. 退件率（tooltip 標註「含排隊時間」）
10. 平均處理時間

**排序邏輯**：

- 預設：**姓名字母序**（無排名壓力）
- 可點欄位 header 切換排序（次級需求）
- 不再以「訂單合格數降冪」為預設——CEO 對「排名會製造內耗」的回應

**Alternatives considered：**

- (替代 1) 保留審稿王 + 加防禦指標門檻（退件率過高者不當冠軍）→ 放棄，根本問題是排名本身，加門檻只是 patch
- (替代 2) 全部用 chart（bar chart 視覺比例）→ 放棄，精確數字對人員檢討重要
- (替代 3) 維持預設依訂單合格數降冪 → 放棄，與「無排名」語意矛盾

### D5. 時間區間定義一致性

**決策**：沿用 `2026-04-24 統一日期維度` 的定義。Dashboard 所有指標時間篩選以 `ReviewRound.reviewedAt` / `Order.prepressApprovedAt` 為準（視指標性質）。

- Reviewer 層指標：`ReviewRound.reviewedAt` 落區間
- Order 層指標（訂單合格數、滯留天數）：`Order.prepressApprovedAt` 落區間
- 兩者語意都是「完成時間」，內在一致

### D6. 客戶維度指標

**決策**：新增 `客戶審稿成果表`，為主管 → 業務反應客戶品質提供具體證據。

**表格欄位**（依序）：

1. 客戶
2. 訂單合格數（該客戶於區間內 `prepressApprovedAt` 落區間的訂單數）
3. 退件印件數（該客戶所有訂單的印件退件聚合）
4. 補件後退件次數
5. 反覆退件訂單數（該客戶當前有印件 `rounds.length > 3` 的訂單數）
6. （選填）品質輔助欄位：退件率

**排序**：預設依「反覆退件訂單數」降冪——主管需要優先處理這類客戶；次序依「補件後退件次數」降冪。此排序是**運營需求**，不是「客戶排行」，語意上與「審稿王」不同。

**使用情境**：主管月會前切「本月」→ 看哪些客戶「反覆退件訂單 > 0」→ 清單帶到業務會議請業務介入客戶溝通。

**Alternatives considered：**

- (替代 1) 不做客戶維度，沿用訂單清單下鑽 → 放棄，proposal Why 第 3 點承諾解客戶層面，不做等於未交付
- (替代 2) 客戶維度做 highlight card（類似審稿環節經營指標）→ 放棄，客戶維度需要明細清單才能行動，card 數字無下鑽意義

### D7. 審稿環節經營指標

**決策**：新增 2 格 highlight card，放於 L1 之下，給主管「速度 + 品質」兩個經營視角。

**指標 1：審稿環節平均滯留天數**

```
target = orders where prepressApprovedAt BETWEEN [startMs, endMs)
value = avg(prepressApprovedAt - Order.createdAt) 於 target，單位：天
```

- 起點採 `Order.createdAt`（簡化，與訂單進入系統對齊）
- 若 Miles 偏好「付款後算起」可後續改用 `paid_at`——此為 plan 待確認項之一，暫以 `createdAt` 實作

**指標 2：退件 > 3 輪訂單數**

```
target = orders where 存在任一印件的 rounds.length > 3
       AND 該印件當前狀態 != '合格'（即仍在處理中）
value = count(target)
```

- 閾值 3 為暫定（plan 待確認項之二）；Prototype 先以 3 實作，Miles 試用後可調為 2 / 4
- 該指標點擊可展開當前全部訂單清單（下鑽功能延後，暫以純數字呈現）

**範例驗算**：

- **例 1（滯留天數）**：10 月 Dashboard 查本月，3 筆訂單 `prepressApprovedAt` 落本月（分別滯留 2 / 3 / 4 天） → 平均滯留 3.0 天
- **例 2（退件 >3 輪）**：O-100 印件 P1 目前 Round 4 仍在等待審稿 → 計入；O-101 印件 Round 5 最終合格 → 不計入（已合格）

**Alternatives considered：**

- (替代 1) 「付款到合格」平均（α 處理時間訂單層擴展）→ 放棄，現有 α 是 Round 級，擴展到 Order 級語意不直覺；用 `createdAt` 更乾淨
- (替代 2) 退件 >3 輪改用「已發生過」（歷史累計）→ 放棄，主管關心的是「目前仍在爛的訂單」，而非歷史事件

## Risks / Trade-offs

- **風險：冗餘欄位寫入時機被遺漏** → 緩解：寫入邏輯集中於「印件合格 action」內，所有改變印件狀態的 action 必須呼叫統一 hook；單元測試覆蓋 5 個寫入時機的 scenario
- **風險：凍結規則導致歷史與現況脫節** → 緩解：Dashboard 補「退件後重審中訂單數」輔助指標，讓主管看得到「歷史達成合格但又退件」的部分
- **風險：`skipReview` 訂單邊界處理錯誤** → 緩解：D1 例 4 明確界定「全 skipReview 訂單不寫入 `prepressApprovedAt`」；單元測試必有此 case
- **風險：補件後退件指標無行動判定，使用者可能仍誤用** → 緩解：UI 於指標欄位 header 加 tooltip「僅作觀察用，判定需人工介入」；設計文件明載「改稿原因代碼結構化完成後才開放行動判定」
- **Trade-off：冗餘欄位增加資料一致性維護成本** → 承擔，換取查詢效能 O(n·m) → O(n) 與歷史凍結可對帳的兩大收益
- **Trade-off：客戶維度排序依「反覆退件訂單數」可能讓某些客戶被視為「麻煩客戶」** → 承擔，這是運營層判斷；配套要求主管與業務以「品質改善」而非「責難」為對話框架

## Migration Plan

- **資料模型**：既有 Order 初始化兩欄位為 NULL；Prototype 階段 mock 資料重跑即可；無真實歷史資料需回填
- **新 util 函式**（加入 [prepressReview.ts](/Users/b-f-03-029/sens-erp-prototype/src/utils/prepressReview.ts)）：
  - `maybeWriteOrderPrepressApproval(order): Order`（判定 + 寫入 hook）
  - `identifyPrimaryContributor(order): string | null`（D2 演算法）
  - `countOrderApprovalsByReviewer(orders, range): Map`
  - `countOrderApprovalsByCustomer(orders, range): Map`
  - `computeAverageDwellDays(orders, range): number`
  - `countHighResupplyOrders(orders, threshold = 3): number`
  - `countReworkInProgressOrders(orders): number`（退件後重審中）
  - `countFirstRoundRejectionsByReviewer(orders, range): Map`（含首審的全部退件）
  - `countResupplyRejectionsByReviewer(orders, range): Map`（補件後退件）
- **Dashboard UI**：在既有 [SupervisorDashboard.tsx](/Users/b-f-03-029/sens-erp-prototype/src/pages/prepress/SupervisorDashboard.tsx) Tabs 架構內擴充
- **Rollback**：純前端計算 + 前端冗餘欄位，Rollback 即還原 Prototype；無後端遷移成本

## Open Questions

- **OQ-1（試用後調整）**：對比表欄位達 10 欄，若視覺過擠，退件率與平均處理時間是否移至 tooltip？
- **OQ-2（試用後調整）**：「退件 >3 輪訂單」閾值是 3 / 2 / 4？Lovable 試用後觀察實際分佈調整
- **OQ-3（試用後調整）**：「平均滯留天數」的起點是 `createdAt` 還是 `paid_at` / `signed_at` / `file_uploaded_at`？若 Miles 認為「付款後算起」更反映印務可控範圍，改用 `paid_at`
- **OQ-4（上線 4 週後評估）**：本 Dashboard 上線 4 週後，主管的派案 / 客戶溝通決策是否真的因此改變？若無行為變化，需追加「下鑽 + 自動通知」閉環功能。此 OQ 歸檔前遷移至 Notion Follow-up DB
