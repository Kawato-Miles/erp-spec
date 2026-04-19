## Context

ERP 既有 specs 中的印件審稿為雙維度狀態機的「審稿維度」（state-machines spec L309-310），僅有三個狀態：`稿件未上傳 → 等待審稿 → 合格`。business-scenarios spec L102-122 對「不合格」的處理方式是**棄用舊印件建新印件**，未支援「同印件內補件重審」的 loop。user-roles spec L163-177 定義 `審稿`、`審稿主管` 兩角色，但職責敘述停留在一行概述，且 L170 明確指定「案件分派」由審稿主管手動執行。

PrintItemFile 模型（order-management spec L325-340）雖已有 `review_status` 欄位，但缺版本鏈、檔案角色（原稿 / 加工檔 / 縮圖）、審稿回合關聯等概念。Prototype（`sens-erp-prototype`）中 RoleSwitcher 僅有 5 種角色（業務、印務主管、印務、生管、師傅），無審稿相關 UI。

本 change 的目標是把「審稿」從概念骨架變成可運作的完整模組，包含資料模型、狀態機、角色職責、自動分配邏輯、UI 規格，與下游工單生成的銜接。

### 對齊過的決策（explore 階段已定）

本 design 在 `/Users/b-f-03-029/.claude/plans/1-1-nifty-reef.md` 記錄的探索結論基礎上擴充。該 plan 已鎖定：狀態機形狀、角色職責範疇、分配機制（D → A 挑選順序）、難易度量綱（1-10 整數）、檔案模型（方案 Q，ReviewRound 聚合）、補件流程（B2C 自助 / B2B 業務）、免審沿用既有路徑。design.md 聚焦於「這些決策如何具體落地」的技術抉擇與邊界。

## Goals / Non-Goals

**Goals**

1. 定義一個**完整可運作的印件審稿流程**：從分配觸發、審稿作業、補件 loop、到合格建工單的每一步都能在 Prototype 與正式系統中重現
2. 建立**可追溯的檔案版本模型**（ReviewRound）：每一輪送審的原稿、加工檔、縮圖、結果、備註全部保留
3. 建立**可量化的分配規則**（能力最接近 → 負載最少）：能用測試情境驗證任一印件應被分配給誰
4. 建立**角色對應的兩個工作台介面**：審稿人員列表 + 詳情；審稿主管能力 + 儀表板 + 覆寫
5. **與既有上下游無縫銜接**：上游（需求單必填 difficulty_level）、下游（合格後自動建工單沿用既有規則）、免審路徑（不動）

**Non-Goals**

1. 不處理 **B2C 會員前台**的實作細節（補件 UI 屬於電商系統，ERP 只接收狀態同步；跨系統介面列入 XM-006）
2. 不處理 **通知機制**（Email / 站內 / EC 同步）的技術選型；僅定義觸發點（XM-006）
3. 不重構 **印製維度**狀態機；本 change 僅動審稿維度
4. 不調整 **免審稿快速路徑**；沿用 order-management L126-128 既有設計
5. 不調整 **合格後建工單**的規則；沿用 state-machines L78「印件審稿合格後建立工單」
6. 不處理 **審稿人員的排班 / 假勤 / 輪班管理**；本次僅處理能力（max_difficulty_level）與即時負載
7. 不處理 **跨印件批次審稿**（一次處理多件）；以單印件為審稿單位

## Decisions

### D1：狀態機形狀——採「不合格 ↔ 已補件 → 合格」loop，保留「已補件」命名

**決策**：印件審稿維度狀態機擴充為：

```
稿件未上傳 → 等待審稿 → 合格
                │
                └─► 不合格 ◄─► 已補件 ─► 合格
                        ▲            │
                        └── 再審 NG ──┘
```

新增狀態轉移：
- `等待審稿 → 不合格`：審稿人員審稿後標註內容不符
- `不合格 → 已補件`：客戶（B2C）/ 業務（B2B）完成補件上傳
- `已補件 → 合格`：審稿人員再審通過
- `已補件 → 不合格`：審稿人員再審仍發現問題

**替代方案考慮**：
- 方案 α：用「等待再審稿」取代「已補件」（對齊語法 `等待X`）——被否決，Miles 選擇保留「已補件」以強調「補件動作已完成」的前置語境
- 方案 β：補件後回到「等待審稿」不新增狀態——被否決，無法區分首輪與補件後的審稿

**Rationale**：保留「已補件」讓審稿人員看板能把「首審待辦」與「補件重審」清楚分類；前者可能為完全陌生印件，後者審稿人員已有脈絡、處理速度較快，業務上視為兩類工作。

### D2：審稿核可層級——單層放行，主管不核可

**決策**：審稿人員可自行標「合格」放行，無需主管複核。審稿主管的職責限縮為：
1. 維護審稿人員 `max_difficulty_level`
2. 檢視審稿人員負擔（進行中審稿數）
3. 覆寫自動分配（例外處理）
4. KPI 監管（速度、不合格率、負擔分布）

**替代方案考慮**：
- 方案 α：雙層核可（審稿人員送審 → 主管核准）——被否決，Miles 指出會成瓶頸
- 方案 β：分層抽檢（新人強制核可、資深人員自動放行）——被否決，增加規則複雜度，且 `max_difficulty_level` 已隱含能力分級

**Rationale**：分配時已用能力值比對把關，合格與否的判斷屬於審稿人員專業範疇。主管的價值在於**資源調度**而非審核決策，避免主管成為流量瓶頸。user-roles spec L170 的「案件分派」需相應調整為「**覆寫**自動分配」。

### D3：分配演算法——能力最接近優先，負載最少為次要

**決策**：B2C 付款後、B2B 訂單建立付款後自動觸發分配：

```
輸入：印件 difficulty_level = D
候選集：所有 max_difficulty_level ≥ D 的審稿人員
篩選順序：
  1. 從候選集中取 max_difficulty_level 最小者（= 能力最接近 D）
  2. 若並列多人，取進行中審稿數最少者
  3. 若仍並列，取 user_id 字典序最小者（deterministic tie-break）
輸出：被分配者 user_id
```

**替代方案考慮**：
- 方案 α：僅負載平均（round-robin）——被否決，高階人員會處理過量低難度件
- 方案 β：能力值完全匹配（== D）——被否決，限制過嚴，難易度 10 常無人完全匹配
- 方案 γ：加入優先級（印件交期）——被否決，本 change 先做基本規則，交期權重列入後續迭代

**Rationale**：印刷業審稿人力成本差異大（高階人員時薪高），低難度件用高階人員是資源浪費。能力最接近原則使每人工作量維持在「剛好能處理」的水位，延長職業生涯並降低疲勞錯誤率。

**邊界**：`max_difficulty_level` 的值必須 ≥ 1，且系統需至少有一位 `max_difficulty_level = 10` 的審稿人員以涵蓋最高難度件（否則觸發 PI-004 降級策略）。

**「進行中審稿數」定義**：審稿維度狀態為「等待審稿」或「已補件」，且被分配給該審稿人員的印件數。不計入「合格」「不合格」與未分配的印件。

### D4：檔案模型——方案 Q（ReviewRound 聚合）+ PrintItem 層指針

**決策**：新增 `ReviewRound` 實體，介於 `PrintItem` 與 `PrintItemFile` 之間；**「當前合格輪次」以 PrintItem 層的 `current_round_id` FK 指標標示，取代 Round 層 `is_current_display` 旗標**，避免並發 race condition 與多列為 TRUE 的風險。同時**廢除既有 `PrintItemFile.is_final`**，由指針鏈取代。

```
PrintItem (1) ──► (N) ReviewRound (1) ──► (N) PrintItemFile
   │                  │
   │                  ├─ round_no: int (同印件內遞增，從 1 開始)
   │                  ├─ reviewer_id: FK User (免審路徑為 NULL)
   │                  ├─ source: enum (審稿 / 免審稿)
   │                  ├─ submitted_at: timestamp
   │                  ├─ result: enum (合格 / 不合格)
   │                  ├─ reject_reason_category: enum LOV (不合格必填，選項見 PI-009)
   │                  └─ review_note: text (補充備註，選填)
   │
   └─ current_round_id: FK ReviewRound (新增；unique；指向當前合格輪次；尚未合格時為 NULL)

PrintItemFile (延伸既有模型)
  ├─ round_id: FK ReviewRound (新增)
  ├─ file_role: enum (原稿 / 加工檔 / 縮圖) (新增，詳見 PI-003)
  ├─ review_status: 保留但標為衍生值（= Round.result 投影）
  ├─ is_final: **移除**（由 PrintItem.current_round_id → Round → File 取代）
  └─ 其他既有欄位（file_url, file_size_kb, uploaded_at, ...）保留
```

印件摘要呈現「當前合格輪次」的檔案與縮圖：透過 `PrintItem.current_round_id → ReviewRound → PrintItemFile (file_role ∈ {加工檔, 縮圖})` 查詢。

**替代方案考慮**：
- 方案 α：在 `PrintItemFile` 加 `version` + `previous_version_id` 平面版本鏈——被否決，同輪多檔（原稿 + 加工檔 + 縮圖）關聯鬆散
- 方案 β：不分輪，只留最新版 + 審稿歷程日誌——被否決，無法回溯「第 2 輪的加工檔長什麼樣」

**Rationale**：一輪審稿是一個原子業務事件（收件 → 加工 → 送審 → 結果），把當輪的所有檔案與結果聚合到一個 Round 物件，查詢歷史（「這印件經歷了幾輪？第 3 輪為何不合格？」）極為直覺。PrintItem 層用指針（`current_round_id`）而非 Round 層旗標（`is_current_display`），避免並發切換時的 race condition；DB 層可用 unique constraint 保證唯一性。

**合格為終態 — 合格後要改請開新印件**：`合格` 狀態無任何出向轉移。若印件合格後需變更內容（客戶改稿、印務拼版時發現原稿錯誤等），SHALL 透過「棄用原印件 + 建立新印件」處理（參考 `business-scenarios` spec § 打樣 NG 建新印件既有路徑）。實務上，合格後要改幾乎都意味著「業務內容變更」，視為新的業務單位，重走完整審稿 + 工單流程。本 change 的補件 loop 僅適用於**審稿階段**（尚未合格）的稿件內容修正，不擴及合格後。

### D5：難易度欄位位置——全層級繼承鏈

**決策**：

| 位置 | 欄位 | 填寫時機 | 驗證 |
|------|------|---------|------|
| B2C 商品主檔 | `difficulty_level` (1-10) | 商品建立時 | EC 商品管理必填 |
| 需求單印件 | `difficulty_level` (1-10) | 業務建需求單時 | 未填不可送出 |
| 訂單印件 | `difficulty_level` (1-10) | 訂單建立時自需求單繼承 | 自動帶入 |
| EC 訂單印件 | `difficulty_level` (1-10) | 自商品主檔繼承 | 自動帶入 |
| 審稿人員（User） | `max_difficulty_level` (1-10) | 審稿主管設定 | 必填 |

**替代方案考慮**：
- 方案 α：僅在訂單層填寫——被否決，業務在需求單階段已掌握內容複雜度，延到訂單反而需重填
- 方案 β：允許訂單層覆寫需求單值——暫不提供，避免分配依據漂移；若後續有業務需求再開

**Rationale**：繼承鏈確保「同一份印件從需求到訂單」難易度不變，自動分配的依據穩定。業務在需求階段填寫一次即可。

### D6：補件觸發來源分流

**決策**：

- **B2C 路徑**：會員於電商前台重新上傳檔案 → 電商系統呼叫 ERP API → ERP 建立新 Round（不含審稿 result，暫標「待再審」）→ 印件狀態 `不合格 → 已補件` → 原審稿人員列表重新出現此件
- **B2B 路徑**：業務於**訂單詳情頁**的印件列表中找到該筆不合格印件 → 點「補件」→ 彈出上傳元件 → 上傳新檔 → 系統建立新 Round → 印件狀態 `不合格 → 已補件`

業務僅能檢視到訂單層，不涉及工單 / 生產任務層。

**替代方案考慮**：
- 方案 α：B2B 由客戶服務專員補件——被否決，業務為單一對口人，增加轉手層反而降低效率
- 方案 β：補件由業務轉送再由印務主管確認——被否決，印務主管不涉及稿件內容

**Rationale**：B2C 客戶自助縮短等待；B2B 業務對客戶需求最熟，由業務直接代為補件，避免客戶來回溝通。

### D7：退回對象——原審稿人員，不重新分配

**決策**：`已補件 → 原審稿人員的待辦列表`。不重新執行 D3 分配演算法。

**Rationale**：原審稿人員對此印件有完整脈絡，再審速度快。重新分配會丟失脈絡且增加整體成本。若原審稿人員已離職 / 請假（系統標註不在崗），才觸發主管覆寫重指派。

### D8：ActivityLog on PrintItem

**決策**：印件層新增 ActivityLog，記錄下列事件：

| 事件 | 欄位 |
|------|------|
| 稿件上傳 | timestamp, actor, file_ids |
| 自動分配 | timestamp, assigned_to, rule_hit (D/A/tie-break) |
| 主管覆寫 | timestamp, actor (supervisor), from_user, to_user, reason |
| 送出審核 | timestamp, actor (reviewer), round_no, result, note |
| 補件完成 | timestamp, actor (customer/業務), round_no, file_ids |
| 狀態轉移 | timestamp, from_status, to_status |

格式對齊需求單 ActivityLog 樣式。印件詳情頁右側呈現時間軸。

### D9：免審稿路徑——產生 source=免審稿 的 Round 作為合格依據

**決策**：沿用 order-management spec L126-128 的免審語意（無需審稿人員介入、不入待審列表），但**仍建立一筆 `ReviewRound(round_no=1, result=合格, reviewer_id=NULL, source=免審稿)` 並設 `PrintItem.current_round_id` 指向該 Round**。印件檔案（原稿作為「加工檔」）綁在此 Round 底下，縮圖由系統自動或業務上傳時綁入。

**Rationale**（修正先前決策）：原案「免審直接改 review_status=合格、不產生 Round」造成 `PrintItemFile.review_status` 同時承擔「正本」與「衍生值」兩種語意，導致下游查詢分岔。修正後 ReviewRound 成為單一正本，無論免審或審稿路徑，查詢合格檔案一律走 `current_round_id → Round → Files` 指針鏈，語意乾淨。

**影響**：免審印件不進審稿人員列表、不觸發通知，但在印件詳情頁的歷史輪次中會呈現一筆 `source=免審稿` 的 Round，讓稽核完整可追溯。

### D10：capability 歸屬——獨立為 prepress-review

**決策**：新建 `prepress-review` capability spec，**不**塞進 order-management 或 work-order。

**替代方案考慮**：
- 方案 α：併入 order-management（因印件屬於訂單）——被否決，審稿涉及獨立資料模型（ReviewRound）、獨立 UI（兩個工作台）、獨立角色（審稿、審稿主管），併入會讓 order-management 過於臃腫
- 方案 β：併入 work-order（因審稿為工單前置）——被否決，審稿結果是觸發工單建立的 **前置事件**，而非工單內部流程

**Rationale**：prepress-review 為獨立業務環節，有自己的狀態機、角色、UI。獨立 capability 也讓未來擴充（如多階段審稿、外部審稿人員）較單純。

### D11：合格後建工單的分流規則（原 OQ3 已解答）

**決策**：審稿合格後系統自動建工單的行為**依訂單來源分流**：

| 訂單來源 | 行為 |
|---------|------|
| **B2C（EC 商品）** | 商品主檔建立時已定義材料、工序、裝訂；合格後系統 SHALL 自動建立工單並**帶入生產任務**（工單 + 生產任務一次建齊） |
| **B2B（需求單轉訂單）** | 合格後系統 SHALL 建立**空工單草稿**；生產任務的建立由印務主管後續手動拆分（沿用既有 user-roles L196「印務主管分配工單給印務」流程） |

**Rationale**：B2C 商品因商品主檔已規格化，生產任務可依商品 BOM 自動展開；B2B 印件內容常客製，需印務主管依印件需求拆分多張工單 / 多個生產任務，不適合自動化。此分流邏輯對齊既有業界慣例（電商規格品自動化 vs 客製品人工展開）。

**既有 spec 調整**：原 `business-processes` delta 中「若無製程 / 材料設定則不建工單」的 fallback 語意 SHALL 移除——B2C 一律有設定（商品主檔層級必填），B2B 一律建空草稿（不需前置條件）。

**原 OQ3（製程 / 材料已設定判定規則）狀態**：已解答。Notion PI-005 於本 change 歸檔時更新為「已完成」。

### D12B：退件原因結構化（LOV + 備註）

**決策**：ReviewRound 的不合格原因採 **enum LOV（`reject_reason_category`，必填）+ text 備註（`review_note`，選填）** 雙欄位結構。

**Rationale**：對齊既有 `quote-request` spec § 需求單流失歸因的 LOV 設計模式（`QR-002` 流失原因選單），避免自由文字導致後續無法結構化分析：
- **退件原因 Top N 統計**：儀表板可量化哪類退件最多
- **分類補件回流率**：可按不同退件原因分別計算補件回流率，與圖編器 Preflight（XM-007）檢查規則對映，計算 ROI
- **技術性退件 KPI 排除**：以 enum 值判定而非文字標籤匹配，不受使用者拼寫 / 格式差異影響

**選項清單**：待 PI-009 定案。至少必含「技術性退件」一項（原稿檔案損毀、字型缺失等非內容問題）。實務候選包含：出血不足、解析度過低、色彩模式錯誤、缺少必要元素、尺寸不符、特殊工藝圖層異常、字型未外框、技術性退件、其他等（詳細列表由業務實測後定案）。

**替代方案考慮**：
- 自由文字（原案）—— 已否決，無法結構化分析
- 多選 enum —— 否決，複雜化資料模型；若需多項原因可於 review_note 補充
- 固定 enum 不可擴充 —— 否決，業務場景會演化；採 LOV 可於系統後台擴充

### D12：主管抽檢機制——本 change 不實作

**決策**：不提供主管抽檢機制。維持 D2 單層放行設計，主管完全不介入核可。

**Rationale**：Miles 明確指示不實作。抽檢機制可於未來 ISO 認證或客戶投訴事件後由獨立 change 加入，不在本 change 範圍。列為 future consideration，不開 OQ。

## Success Metrics

本 change 對 Phase 2 KPI「訂單流程完整完成率 ≥ 60%」的貢獻路徑：

- 閉環審稿流程使「付款 → 工單建立」環節可被系統追蹤；未閉環的審稿會讓訂單卡在「等待審稿」狀態無法推進到工單階段。

**本 change 的模組自指標**（上線 Phase 2 第一個月作為基線觀測；第二個月起開始追蹤改善幅度）：

| 指標 | 目標 | 計算方式 | 意義 |
|------|------|---------|------|
| 自動分配命中率 | ≥ 90% | (自動分配 - 主管覆寫) / 自動分配 | 驗證 D3 演算法的業務契合度；低於 90% 表示覆寫過多，規則需調整 |
| 首審通過率 | 基線觀測值（Phase 2 第一個月）| 首輪 result=合格 / 首輪總數 | 反映客戶稿件品質與審稿判斷標準一致性；過低表示上游檔案品質差 |
| 付款到印件合格平均時長 | ≤ 24 小時（可依實測調整） | 各印件（合格時間 − 訂單付款時間）取平均 | 反映審稿流量與補件 loop 效率；SLA 等級指標 |
| 補件 loop 平均輪數 | ≤ 1.3 輪 | 每印件（合格時的 round_no）取平均 | 過高表示退件品質判定過嚴或上游攔截不足 |
| B2C 退件後補件回流率 | 基線觀測值（Phase 2 前三個月）| B2C 不合格印件中，補件完成並最終合格數 / 總不合格數 | 量化 CEO 擔心的「B2C 退件流失率」；為後續 Preflight（上游攔截 change）的 ROI 計算基礎 |
| 技術退件比率 | 觀測值（排除於首審通過率分母） | `reject_reason_category = 技術性退件` 的不合格數 / 不合格總數 | 分離「內容問題」與「技術問題」，避免技術退件污染不合格率 |
| 退件原因 Top N | 儀表板統計項 | 依 `reject_reason_category` 分組計數 | 業務洞察：哪類問題最常見，驅動圖編器 Preflight 規則優先順序（XM-007）|

**KPI 儀表板（審稿主管工作台）SHALL 呈現前四項**；後二項可由 admin / 商業分析報表呈現。

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| **高難度印件無人可接** — 若沒有 `max_difficulty_level ≥ 10` 的審稿人員，D3 演算法候選集為空 | PI-004 待決定降級策略；Prototype 階段以 Mock 資料保證至少一位能力 10 的人 |
| **難易度填寫主觀差異** — 不同業務對同類印件可能標不同難易度 | 需建立難易度分級指引（文件，非系統機制），列入後續 spec 補充 |
| **補件來源模糊** — 已補件狀態下若同時收到 B2C 會員補件與業務補件，系統如何處理？ | 補件為單人動作（客戶或業務其中一方），實務上不會同時；Prototype 假設不重疊，正式系統加樂觀鎖 |
| **原審稿人員長期離線** — 退回後若原審稿人員請假，印件會卡住 | 新增「審稿人員可用狀態」旗標，離線時由主管覆寫重指派（PI-007 主管工作台範圍） |
| **ReviewRound 與既有 PrintItemFile.review_status 雙寫** — 舊模型 `PrintItemFile.review_status` 與新模型 `ReviewRound.result` 語意重疊 | 以 ReviewRound.result 為單一正本，`PrintItemFile.review_status` 在本 change 中作為當輪結果的衍生值；資料遷移策略：既有印件視為 round_no=1 的單輪 |
| **自動分配演算法對生產環境的即時性要求** — 付款後須秒級分配 | Prototype 階段用同步計算；正式系統可接受 1-5 秒延遲（用 queue 處理）|
| **難易度量綱過細（1-10）** — 業務可能僅實際用到 1/5/10 | 允許自然收斂，量綱保留整數範圍；若實際使用上只分 3-5 級，後續可收斂 |

## Migration Plan

1. **資料遷移**：既有印件（已存在 `PrintItemFile` 紀錄）回填 `ReviewRound` 為 `round_no=1`，`result` 依 `PrintItemFile.review_status` 對應（合格 → 合格；待審稿 → 尚無 result；不合格 → 不合格但無補件 round）
2. **既有印件 `difficulty_level` 回填**：B2C 商品主檔由 EC 商品管理一次性盤點填寫；既有需求單與訂單印件批次標預設 `difficulty_level=5`（後續可人工調整）
3. **審稿人員 `max_difficulty_level` 初始化**：審稿主管首次登入時強制設定所有審稿人員的能力值
4. **Prototype 階段順序**：先 state-machines + prepress-review capability spec → 再 quote-request / order-management delta → 最後 Prototype UI（Reviewer 工作台 → Supervisor 工作台 → 業務補件入口）

**Rollback**：本 change 為新增能力，不破壞既有流程。Rollback 策略為隱藏 UI 入口，保留資料（不刪除）。

## Open Questions

六項列入 Notion Follow-up DB（原 OQ3 於 D11 解答後關閉），不阻塞 proposal / design 通過，但影響 tasks 排序與部分規格細節：

1. **PI-003 — ReviewRound 內 file_role 欄位枚舉**：原稿 / 加工檔 / 縮圖 三值是否足夠？是否需加「刀模」「拼版檔」等？
2. **PI-004 — 能力不足降級策略**：印件難易度 10 但無人能力 ≥10 時，系統行為：(a) 擱置通知主管 / (b) 派給能力最高者 / (c) 通知主管補充人力 / (d) 混合？
3. ~~**OQ3 — 自動建工單前置條件**~~：已於 D11 解答（B2C 自動帶任務 / B2B 空草稿）。PI-005 歸檔時標為已完成。
4. **PI-006 — 審稿人員工作台 UI**：列表排序預設（交期？難易度？分配時間？）、詳情頁檔案預覽元件（PDF viewer？圖片縮放？）、上傳元件（單檔？多檔？拖放？）
5. **PI-007 — 審稿主管工作台 UI**：能力設定面板結構、KPI 儀表板指標、覆寫分配介面的操作流程（確認步驟？通知被覆寫者？）
6. **ORD-010 — 業務補件 UI**：訂單詳情頁的補件入口位置（印件列表旁按鈕？印件詳情抽屜？）、上傳元件樣式
7. **XM-006 — 不合格通知機制**：B2C 通知客戶的管道（Email？EC 站內？APP push？）、B2B 通知業務的管道（ERP 站內？Slack？Email？）、通知內容模板
8. **PI-008 — 角色拆分未來檢視**：審稿人員規模成長至 N 人時，是否拆分為 Prepress Operator（印前加工）+ Approver（審稿放行）兩個獨立角色。本 change 採小廠合併模型，此 OQ 追蹤未來檢視時點。
9. **PI-009（新增）— 退件原因選單的完整清單**：reject_reason_category 的 LOV 選項明細（參考 QR-002 流失原因選單的設計模式）。至少含「技術性退件」一項；其餘按業務實測後定案。
10. **跨產品（XM-007）— 圖編器 Preflight 自動檢查**：出血 / 解析度 / 色彩模式等上游攔截規則，於圖編器另開 change 處理。不在本 ERP change 範疇，但本 change 的「B2C 退件後補件回流率」與「退件原因 Top N」KPI 為其 ROI 計算基礎。
