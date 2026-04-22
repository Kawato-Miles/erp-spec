## Why

上一輪 [`add-prepress-review`](../archive/2026-04-20-add-prepress-review/proposal.md) change 已讓審稿模組的資料模型、流程與工作台骨架落地，但歸檔後與 Miles 對齊現況時，發現**前期 BRD 的 Why 與商業問題敘述有三處落差**，若不修正，後續 Prototype / Notion BRD 發布版本將以錯誤的問題框架對外溝通，也會污染跨團隊（圖編器 / CEO）對審稿投入的 ROI 判斷：

| 面向 | 前期 BRD 敘述 | 對齊後真相 |
|------|--------------|------------|
| 分配問題 | 「人工分配無效率、無自動分配機制」 | 印件複雜度於 **EC 商品建立 / 線下需求單建立**階段就已決定，分派是結果而非問題；過往營運已能運作 |
| 審稿定位 | 「Phase 2 訂單生產前必經閘門」 | 審稿本質是**客戶 / 業務與印務的溝通介面**，不是訂單閘門 |
| 商業問題重心 | 六點痛點皆為「流程骨架不可運作」角度 | 過往**營運正常**；真正需要系統化的是將既有溝通介面的兩個備註場景落地為欄位（給審稿看的稿件說明、審稿寫給下游的備註） |

同時識別出 Prototype 兩個實質功能缺口：
- **印件上傳時缺「稿件備註」欄位**：會員 / 業務提供印件時，沒地方寫「此件客戶堅持要 RGB」「特殊加工注意事項」這類給審稿參考的說明
- **印件詳情 / 印務視角缺「最新一筆審稿備註」顯示**：`ReviewRound.review_note` 已存在但僅寫入，印件層沒有把最新一筆帶出來給印務 / 後續角色看

此 change 的目的：**修正 BRD 認知偏差，不動功能骨架，補足兩種備註欄位的語意與 UI 曝光**，確保後續撰寫 Notion BRD / 跨部門溝通（圖編器 Preflight ROI、CEO 投入決策）時以正確的問題框架為基礎。

**KPI / 儀表板 / Metrics 相關需求由審稿主管自行討論後另行提案，本 change 不處理**。

## What Changes

### 修正（Narrative / 定位）

- **`prepress-review` spec Purpose**：從 `TBD` 改寫，承認過往流程運作正常、定位為「既有審稿流程 ERP 化 + 承載客戶 / 業務與審稿的雙向溝通介面」、審稿本質為溝通介面而非訂單閘門
- **既有 Requirement narrative 重寫**：`印件自動分配機制`、`審稿人員工作台`、`審稿主管工作台`、`印件 ActivityLog` 等 Requirement 的敘述語境由「補齊不可運作的骨架」改為「既有規則 ERP 化 + 溝通介面系統化」；Functional 行為不變

### 新增（資料欄位與 UI）

**稿件備註（Client Note，新欄位）**

- 欄位：`PrintItem.client_note`
- 層級：印件（PrintItem）**1:1**，跟著印件走、**不跟 ReviewRound 輪次**
- 最長 500 字、**非必填**
- 語意：**會員（B2C）/ 業務（B2B）提供印件時寫給審稿的稿件說明**
- 來源點：
  - B2B：需求單印件建立時（`quote-request` 延伸）
  - B2C：EC 會員上傳印件時（`order-management` 延伸，EC 介面回寫）
- **生命週期**：印件首次建立時填寫，補件階段**不再填寫新備註**（經 Miles 對齊確認現況無此痛點）
- **覆寫稽核**：若後續（主管 / 業務）需編輯既存 `client_note`，SHALL 寫 ActivityLog「稿件備註修改」事件（from / to）確保 ISO 9001 稽核合規（erp-consultant 三視角審查採納）

**審稿備註（Review Note，既有欄位語意擴充）**

- 欄位：沿用 `ReviewRound.review_note`（既有）
- **語意擴充**：原 spec 敘述為「不合格時建議填寫」，本 change 擴充為**合格 / 不合格每輪皆可填**（審稿來回多次，每輪皆有機會給補件方 / 後續角色留備註）
- **字數上限**：本 change 明訂 1000 字、非必填
- **送出後可修改 + 稽核**：該輪 Round submit 後 `review_note` **允許原審稿人員修改**（糾正打錯字 / 補充內容）；每次修改 MUST 寫入印件 ActivityLog「審稿備註修改」事件（actor / round_no / from / to / timestamp）；修改發生於補件方已進入補件頁時 SHALL 觸發 Toast 通知（跨系統真實通知待 [XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 處理）
- **工單鎖檔不鎖備註**：已建立工單只鎖「檔案」，不鎖備註；review_note 修改 SHALL 反映於印件層與工單單據的最新內容（讓糾正能傳到下游印務），ActivityLog 保留歷次修改供稽核還原
- **印件層顯示**：實作為 UI 層讀 `current_round_id → review_note`（UI 層計算，不加衍生欄位快取）

**UI 補缺**

- 審稿人員列表頁 / 詳情頁：顯示 `PrintItem.client_note`
- 會員補件頁（B2C）/ 業務補件頁（B2B）：顯示**完整歷史輪次 `review_note` 清單**（供補件方參照修正）
- 印件詳情頁（給印務 / 其他角色）：新增「最新一筆審稿備註」顯示區

### 本次不做（明確列出）

- **KPI 相關功能**（Success Metrics 清單、L1 / L2 分層框架、審稿主管儀表板 UI、審稿人員個人視角 KPI、審稿延誤 → 訂單準交連結指標）：由審稿主管自行討論需求後另行提案
- **補件方 → 審稿的回話通道**：Miles 確認現況無此痛點，沿用既有外部管道（Slack / 電話 / 業務中介）
- **跨系統通知機制**（[XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473)）：沿用既有 Prototype Toast demo
- **圖編器 Preflight 上游攔截**（[XM-007](https://www.notion.so/3473886511fa81738471f2f2753e0f97)）：圖編器產品範疇，獨立 change

### 不變

- 所有既有 Functional Requirement（自動分配演算法、能力維護、覆寫、ReviewRound、ActivityLog、B2C / B2B 補件流程、LOV 10 項、技術退件 KPI 排除邏輯）
- 既有資料模型（`ReviewRound`、`PrintItem.current_round_id`、`PrintItemFile.file_role` 等）
- 已關閉的 P0（D4 指針方案、`is_final` 移除、免審路徑產生 `source=免審稿` Round、合格為終態、覆寫 `reason` 必填）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `prepress-review`：
  - Purpose 補寫（從 TBD）
  - 既有 Requirement narrative 重寫（ERP 化 + 溝通介面敘述）
  - 新增 Requirement：「稿件備註欄位（`PrintItem.client_note`）於審稿工作台曝光」
  - 修改 Requirement：`ReviewRound.review_note` 語意擴充（合格 / 不合格皆可填 + 送出後允許修改 + ActivityLog 稽核 + 補件方在線時 Toast 通知）+ 印件層顯示最新一筆
  - 新增 Requirement：「補件頁顯示歷史輪次 `review_note` 清單」
  - 新增 Requirement：「審稿備註修改稽核」（ActivityLog + 即時通知）
  - 新增 Requirement：「稿件備註覆寫稽核」

- `quote-request`：
  - 新增 Requirement：「業務建立印件時可填寫稿件備註」（`PrintItem.client_note` B2B 來源點；帶入訂單後脫鉤）

- `order-management`：
  - 新增 Requirement：「B2C 會員於 EC 上傳印件時可填寫稿件備註」（`PrintItem.client_note` B2C 來源點，EC → ERP 回寫）
  - 修改 Requirement：「訂單詳情頁印件補件入口」補件頁顯示歷史 `review_note` 清單

- `business-processes`（erp-consultant 三視角審查採納，補 delta）：
  - 修改 § 稿件管理規則：narrative 補「印件 SHALL 持有 `client_note`（上游 → 審稿單向說明），ReviewRound SHALL 持有 `review_note`（審稿 → 下游，每輪各自保留）」

## Impact

### 資料模型影響

- **新增**：`PrintItem.client_note`（text / 長度 ≤ 500 / nullable）
- **語意擴充**：`ReviewRound.review_note`（合格 / 不合格皆可填；送出後允許修改 + ActivityLog 稽核；1000 字上限）
- **衍生欄位 / UI 投影**：印件層「最新一筆審稿備註」採 UI 層計算（讀 `current_round_id → review_note`）；不新增衍生欄位

### Prototype 異動（`sens-erp-prototype`）

- 需求單印件建立 UI（`components/quote/`）：新增 `client_note` textarea
- 會員補件頁（B2C demo）/ 業務補件頁（B2B demo）：
  - 若為印件首次建立階段，新增 `client_note` textarea
  - 補件時顯示**歷史輪次 `review_note` 清單**
- 審稿人員工作台（`components/prepress-review/reviewer/`）：
  - 列表 / 詳情新增 `client_note` 顯示區
  - 送審 UI 確認 `review_note` 合格 / 不合格皆可填（既有 UI 若限定不合格才顯示 textarea，需放寬）
  - 既存 Round 的 `review_note` 允許原審稿人員回頭修改，每次修改觸發 ActivityLog + Toast 通知補件方（若在線）
- 印件詳情頁（印務視角 / 跨角色可見）：新增「最新一筆審稿備註」顯示區

### EC 整合影響

- EC 商品 / 下單頁：B2C 上傳印件時須帶 `client_note` 欄位回寫 ERP（同既有 `difficulty_level` 欄位的 EC → ERP 路徑）

### 流程交界影響

- 上游（需求單 / EC）：新增 `client_note` 欄位，非必填不阻塞現有流程
- 審稿本身：工作台多兩個顯示區（`client_note` + 歷史 `review_note`），不動分配 / 送審行為
- 下游（工單 / 印務）：印件詳情頁多一個「最新一筆審稿備註」顯示區，供印務查看

### 相關 OQ

| OQ | 狀態 | 與本 change 關係 |
|----|------|------------------|
| [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) | 未開始 | 審稿主管 KPI 面板規劃；**本 change 不涉及**，待審稿主管自行討論後另行提案 |
| [XM-007](https://www.notion.so/3473886511fa81738471f2f2753e0f97) | 未開始 | 圖編器 Preflight 上游攔截；圖編器產品範疇，本 change 不涉及 |
| [XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) | 進行中 | 本 change 沿用 Prototype Toast demo；真跨系統通知待後續 change |
| [ORD-011](https://www.notion.so/3493886511fa8144b5dae45221a0213d) | 未開始 | Customer master 議題，本 change 不涉及 |
| [PI-011](https://www.notion.so/3493886511fa81bc99ecfbe50de03d97) | 未開始 | 不在崗切換機制與本 change 無直接相依；不處理 |
