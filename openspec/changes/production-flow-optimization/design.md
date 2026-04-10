## Context

目前生產流程存在六項結構性缺口，詳見 proposal.md。本設計文件說明各項變更的技術決策與設計理由。

現狀架構：Order → PrintItem → WorkOrder → Task (by factory) → ProductionTask。工單無區域概念、生產任務無產線與排序、印件總覽缺乏案名獨立欄位、稿件管理僅有基礎檔案結構。

## Goals / Non-Goals

**Goals：**
- 工單層級引入 region 維度，實現台灣/中國分廠的資料篩選與約束
- 建立產線資料表，支援生管依產線篩選任務
- 為工序引入 category 分類，生產任務支援分類內拖曳排序
- 印件總覽支援印務角色篩選、案名獨立顯示
- 印件與生產任務詳情顯示稿件檔案與成品縮圖

**Non-Goals：**
- 產線產能計算（未來需求，本次不涉及）
- sort_order 與 scheduled_date 的自動同步（暫不處理衝突）
- 工序合併邏輯（XM-003 待定，不阻塞本次）
- 行動裝置版適配（ERP 僅桌機版）

## Decisions

### D1：region 掛在 WorkOrder 層級，而非 Task 或 PrintItem

**決策**：WorkOrder 新增 `region` 欄位（台灣/中國），作為 factory_type 篩選的依據。

**理由**：
- 一個印件可拆成台灣工單 + 中國工單，因此 region 不能掛印件（PrintItem 是跨區域的）
- Task 是由工序自動分組的中間層，沒有獨立的建立入口
- WorkOrder 是印務主管/印務建立時的操作單位，region 在此設定最自然

**替代方案**：region 掛在 Task 層 → 缺點：Task 是自動分組產物，不應承擔業務分類責任

### D2：factory_type 擴充為四值

**決策**：factory_type 從三值（自有工廠/加工廠/外包廠）擴充為四值，新增「中國廠商」。

**理由**：
- 中國廠商有獨立的狀態路徑（多了「已送集運商」中間態），在狀態機中已存在
- 將中國廠商納入 factory_type 枚舉，讓現有依 factory_type 分流的邏輯（狀態機、供應商平台、報價流程）自然生效
- region 篩選規則：台灣工單 → 自有/加工/外包；中國工單 → 中國廠商（唯一選項）

### D3：工序 → 工廠對應不因 region 改變

**決策**：維持現有「工序決定 factory_type（唯讀）」的邏輯。若同一道工序台灣/中國都能做，建立兩筆獨立的生產任務。

**理由**：
- 避免引入「工序 × 區域 → 工廠」的複雜映射
- 實務上台灣和中國的工序通常不同（加工方式、設備不同）
- 少數重疊的情況，兩筆獨立生產任務更清晰

### D4：ProductionLine 為獨立資料表，與工序無關

**決策**：新增 ProductionLine 資料表（id, name），ProductionTask 新增 production_line_id（FK, 選填）。產線為純分工單位，不限定工序。

**理由**：
- 生管依產線分工，每位生管負責特定產線
- 產線不與工序綁定，保持排程彈性
- 產能計算為未來需求，本次不引入

### D5：Process.category 作為分類來源

**決策**：在 Process（工序）上新增 `category`（材料/工序/裝訂），而非讓印務手動分類。

**理由**：
- 每道工序天然屬於固定分類（如「紙張採購」永遠是材料、「騎馬釘」永遠是裝訂）
- 掛在 Process 上可確保全局一致，不依賴個別印務的判斷
- 生產任務透過 process_id 間接取得 category

### D6：sort_order 為分類內排序

**決策**：ProductionTask 新增 `sort_order`（整數），僅在同一工單、同一 category 內有意義。不可跨分類拖曳。

**理由**：
- 材料 → 工序 → 裝訂的大順序是固定的（先備料、再加工、最後裝訂）
- 分類內的細項順序由印務依實際生產需求決定
- 拖曳排序更新 sort_order，不影響 scheduled_date

### D7：成品縮圖掛在 PrintItem 而非 PrintItemFile

**決策**：PrintItem 新增 `thumbnail_url`（字串），由審稿人員獨立上傳。

**理由**：
- 成品縮圖是印件級別的概念（代表最終成品樣貌），不是單一檔案的縮圖
- 審稿人員在審稿通過後上傳成品縮圖，與稿件檔案的上傳流程獨立
- 印件詳情和生產任務詳情均引用此縮圖

### D8：Order.case_name 從需求單 title 帶入

**決策**：Order 新增 `case_name`（字串），需求單轉訂單時自動從需求單 title 帶入。

**理由**：
- 需求單已有 title（案名），但轉訂單時未帶入，導致訂單沒有案名欄位
- 印件總覽需要顯示案名，案名源自訂單層
- 案名帶入後允許編輯（業務可能需要調整）

### D9：預計產線掛在 PrintItem 層，與 ProductionTask.production_line_id 獨立

**決策**：PrintItem 新增「預計產線」多選欄位（M:N，透過 PrintItemExpectedLine junction table），記錄該印件預計涉及的產線。ProductionTask 的 production_line_id 為生產任務的確定產線，二者各自獨立。

**理由**：
- 印件尚未拆工單時，印務已可預估涉及哪些產線（例如一個印件可能同時需要數位線 + 裝訂線）
- 產線選項包含實體產線（裝訂線、數位線等）與路徑分類（台灣外包、中國外包、全客製化品相），統一放 ProductionLine 表
- 生產任務的 production_line_id 是單選（一個任務只在一條產線執行），印件的預計產線是多選（規劃概覽），語意不同

**替代方案**：預計產線掛在 WorkOrder 層 → 缺點：工單建立在印件之後，規劃時機太晚；且同一印件可能拆成多個工單分散到不同產線

## Risks / Trade-offs

- **[region 與 factory_type 的耦合]** → region 篩選規則目前寫死（台灣=三種、中國=一種）。若未來新增區域（如東南亞），需擴充 factory_type 枚舉與篩選規則。緩解：設計文件記錄此限制，未來再評估。
- **[sort_order 與排程脫鉤]** → sort_order 僅表示印務期望的生產順序，不自動同步到 scheduled_date。可能導致排序與實際排程不一致。緩解：本次先保持脫鉤，未來可加入「依排序生成排程建議」功能。
- **[Process 資料表未獨立定義]** → Process 目前在各 spec 中以 FK 引用，無獨立的 Data Model 定義。本次新增 category 欄位，需在 production-task spec 中補充 Process 資料表定義。
- **[印務印件篩選的效能]** → 篩選邏輯需查詢 WorkOrder.assigned_to 反向關聯到 PrintItem。緩解：資料量可控（印務負責的工單數有限），Prototype 階段不需優化。
