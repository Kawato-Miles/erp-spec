# add-production-task-transfer — Design

## Context

生產任務完成後的跨站點物件運送是 ERP 系統外的真空地帶：印件從完工到送達下一站沒有任何系統紀錄，實務上依賴口頭、LINE、Slack。問題本質不是「溝通工具選錯」，而是「**沒有被指派為當責運送者**」+「**缺乏可追溯憑證**」。

260417 會議結論確立：廠務為系統外被動執行者（不進 ERP、透過 Slack 接收指令），印務在系統內承擔所有轉交當責。explore 階段 Miles 拍板擴充既有運送狀態 + MVP 範疇 + Drawer 分區 UI；senior-pm 前期介入指出採用率地雷與 ROI 論述；三視角審查（Round 1，第一版設計）CEO 與 ERP 顧問共同指向**本設計該往「獨立轉交單實體（類 QC 單）」抽象**，而非把 12 個欄位塞進 ProductionTask 主表。Miles 審閱比較後決定採方案 B（TransferTicket 實體），理由是「分批出貨已在規劃，分批轉交自然也要支援，轉交單架構更合適」。

本 design 以 TransferTicket 為中心，類比 QCRecord 的實體地位與狀態機設計，讓每次轉交都是一張可獨立建立 / 確認 / 撤回 / 作廢的單據，承擔當責與憑證功能。

## Goals / Non-Goals

### Goals

1. 建立 TransferTicket 獨立實體，讓生產任務跨站點運送有明確、可追溯的單據載體
2. 支援一生產任務多次轉交（分批、重送、跨站接力）而不需拆分生產任務
3. 生產任務「運送中 / 已完成」由 TransferTicket 聚合自動計算，不由使用者手動推進，解決 supplier-portal 自動觸發的 inconsistent state 風險
4. 所有工廠類型（自有 / 加工 / 外包 / 中國）統一由 TransferTicket 承擔轉交語意
5. 印務單一確認權限，解決「師傅假確認」地雷
6. 提供 PT-002 Slack Webhook 落地前的自動複製橋接，確保採用率
7. 建立可量化的 Baseline 測量與成功指標（由 Miles 代填 5 天輕量版）
8. 設計預備承接未來 XM-011（跨任務轉交鏈路情境）與 IoT / QR 掃碼擴充

### Non-Goals

1. 不做 Slack Webhook 自動推送（PT-002 延後；本 change 僅做建單時自動複製到剪貼簿）
2. 不補 user-roles 廠務角色正式定義（XM-010 延後）
3. 不補 business-scenarios 跨任務鏈路情境（XM-011 延後）
4. 不做日程面板「待轉交」篩選（PT-003 延後）
5. 不做紙本工單列印整合（WO-013 延後）
6. **不抽出 TransferAttachment 獨立表**（簽收照片沿用 TransferTicket.signature_photos 陣列；待法律級追溯需求觸發再拆）
7. **不做工單詳情頁「轉交單彙總」tab**（類 QC 單聚合，可選擴充，MVP 不做）
8. 不做多站點連續轉交的自動建單（每次轉交皆印務手動建新 Ticket）
9. 不做 Process 主檔的 `is_cross_station` 欄位擴充（本 change 於 Prototype 以硬編碼清單處理跨站類工序判定）

## Decisions

### D1：採 TransferTicket 獨立實體（類 QCRecord 地位）

**決策**：新增 `TransferTicket` 實體，透過 `production_task_id` FK 關聯生產任務；所有轉交欄位、狀態、撤回、作廢皆於 TransferTicket 上承載；ProductionTask 僅保留 `transfer_required` 布林旗標。

**理由**：
- Miles 審視比較後拍板採方案 B，理由與業界 MES 實務（SAP Material Document、Oracle Move Transaction、ISO 9001 Chain of Custody）對齊
- 分批轉交（一任務 1000 份分兩批送）在「欄位塞 ProductionTask」架構下無法表達（actual_date 只能一個），在 Ticket 架構下天然支援
- 送錯重送的歷史紀錄完整保留（作廢原單 + 開新單），不會被 revocation log 單筆 reason 覆蓋
- 未來 XM-011 跨任務鏈路情境直接用 Ticket 鏈承接，不需推倒重來
- QC 單既有模式（獨立實體 + 多張 / 上限 / 作廢保留紀錄）可直接類比，降低印務學習成本

**替代方案**：
- （A）欄位塞 ProductionTask（原第一版設計）— 已被 Round 1 審查指出設計漏洞，不採
- （B）event sourcing 升級撤回機制 — 與 Ticket 架構等效解決同一問題，Miles 採 Ticket 方向直覺較符合 PM 視角

### D2：生產任務狀態由 TransferTicket 聚合自動計算

**決策**：若 `transfer_required = true`，生產任務「運送中 / 已完成」狀態 SHALL 由聚合邏輯自動推進，不由使用者手動按按鈕。

**聚合規則**：
- 任一非作廢 Ticket `status = 運送中` → 生產任務「運送中」
- 所有非作廢 Ticket `status = 已送達`（至少一張）+ 報工達標 → 生產任務「已完成」
- Ticket 全部作廢 → 視同無 Ticket，依報工達標判斷

**理由**：
- 類比工單透過齊套性（pt_qc_passed、pi_warehouse_qty 聚合）計算完成度的成熟模式
- 使用者手動按推進會產生「狀態不準」空窗（如忘按、誤按），聚合自動推進保資料正確性
- 解決 ERP 顧問指出的 supplier-portal 衝突：供應商觸發時若無 Ticket，生產任務進「待建立轉交單」子態而非直跳「運送中」

**替代方案**：
- 使用者手動推進 — 同步原設計問題，不採
- 混合模式（Ticket 聚合 + 使用者覆蓋）— 增加複雜度，無明確收益

### D3：印務單一確認權限，師傅不介入轉交

**決策**：所有 TransferTicket 的「確認已送達」「撤回」「作廢」操作皆由印務執行；師傅無轉交相關操作權限、無 UI 介入點。

**理由**：
- Miles 明確拍板：轉交都由印務驗證（包含表單填寫與完成），現場印務會親自與師傅 / 外包廠 / 中國廠商確認
- CEO 審查指出「報工銜接按鈕」會讓師傅在物件還沒走時就假確認，採納原方案 D8 銜接設計取消
- 單一權限簡化責任歸屬，撤回 / 作廢等操作失誤可追責到人

**對應 OQ 關閉**：附件 OQ #01「印務能否進工廠」— 印務可進工廠屬既有 user-roles 權責，確認動作由印務操作不受限。

### D4：supplier-portal 觸發銜接改為「待建立轉交單」子態

**決策**：外包廠供應商標記「製作完畢」時，生產任務狀態進入「待建立轉交單」子態（非原直接跳「運送中」）；需印務建立第一張 TransferTicket 才能推進至「運送中」。

**理由**：
- ERP 顧問明確指出原設計下 supplier-portal 觸發會造成「狀態運送中但轉交欄位全空」的 inconsistent state
- 新狀態「待建立轉交單」讓系統與印務都明確知道下一步動作（建 Ticket）
- 中國廠路徑同理：已送集運商 → 集運商交貨前進「待建立轉交單」

**替代方案**：
- 觸發時阻擋供應商送出 — 過度嚴格，供應商已完成不應被印務未動作拖累
- 允許狀態進運送中但列表紅字警示 — 狀態語意失真，違反 D2 聚合自動計算原則

### D5：Slack 摘要建單時自動複製（非點按鈕複製）

**決策**：`TransferTicket` 儲存時，系統自動呼叫 `navigator.clipboard.writeText` 將摘要寫入剪貼簿，同時顯示 Toast「已複製至剪貼簿，可貼到 Slack」；Ticket 詳情頁保留「重新複製」按鈕供重複使用。

**理由**：
- CEO 審查指出「確認完轉交要再點複製、切 Slack、貼上、送出」共 4 個動作，現場趕工時會跳過用手機 LINE 通知，系統紀錄與實際通知脫鉤
- 建單時自動複製把「印務主動複製」簡化為「自動發生」，降低採用摩擦
- 為 PT-002 Webhook 整合的前身，摘要模板可直接沿用

**替代方案**：
- 只在 UI 顯示摘要讓印務自己選取複製 — 多手動步驟，採用率風險
- 等 PT-002 Webhook 整合 — 時程失控（XM-002 前置未解）

### D6：撤回加 revocation_type enum（ISO 9001 對齊）

**決策**：TransferTicket 撤回時要求選擇 revocation_type（送錯目的地 / 數量不符 / 品質不符 / 其他）並填原因；紀錄於獨立 `TransferRevocationLog`（append-only，支援多次撤回）。

**理由**：
- ERP 顧問指出原單純文字 reason 欄位不達 ISO 9001 NCR 可追溯標準
- 三類結構化類型（送錯 / 數量 / 品質）為 NCR 聯動的前置識別，未來可串 QC 重驗或客訴追溯
- append-only log 支援同一 Ticket 多次撤回（例如撤回後又撤回）的完整時序

**替代方案**：
- 只留自由文字 reason — 報表切片困難、ISO 不合規
- 撤回不留紀錄 — 違反當責與追溯目的

### D7：作廢機制（類 QC 單，誤建救濟）

**決策**：TransferTicket 於「運送中」狀態可由印務作廢（建錯、情境變更）；作廢為終態，target_quantity 不計入「已申請轉交量」，紀錄保留供稽核。

**理由**：
- 建單錯誤是實務常見（目的地打錯、target_quantity 填錯、選錯廠商），不提供作廢會迫使印務「硬著頭皮確認送達再撤回」污染資料
- 類 QC 單作廢模式，印務認知負擔低

**替代方案**：
- 只允許編輯不作廢 — 若情境已變（例：原要送 X 改送 Y），編輯會混淆原紀錄
- 直接硬刪 — 失去稽核線索

### D8：UI 類 QC 單列表模式（ProductionTaskDrawer 內）

**決策**：`ProductionTaskDrawer` 新增「轉交單」分區，顯示該任務的 TransferTicket 列表 + 「新增轉交單」按鈕；每張 Ticket 可展開詳情、執行確認 / 撤回 / 作廢；列表 Badge 基於聚合顯示。

**元件組成**：
- `TransferTicketList`：列表顯示 Ticket（編號、目的地、數量、狀態 Badge、預計日、實際日）
- `TransferTicketDialog`：建單 / 編輯表單（條件欄位依 target_type 切換）
- `TransferRevokeDialog`：撤回 Dialog（revocation_type select + reason textarea）
- `TransferCancelDialog`：作廢 Dialog（原因 textarea）

**理由**：
- 類比 WorkOrderDetail 的 QC 單列表模式，維持 Prototype 內部 UI 一致性
- 列表形式天然表達「多張 Ticket」，不用 tab、不用獨立 Dialog 嵌套

**替代方案**：
- 獨立頁面（TransferTicketPage）— 脫離生產任務 context，體驗斷裂
- Tab 結構 — 現有 Drawer 無 tab，突兀

### D9：自有廠 transfer_required 推薦勾選（跨站類工序）

**決策**：自有廠生產任務建立時，系統依 process 類別預設 `transfer_required`：跨站類（印刷 / 上光 / 模切 / 燙金）預設 true；非跨站類（清點 / 包裝）預設 false。印務可覆蓋。

**理由**：
- CEO 審查指出 D2「預設 false」會讓印務忘勾、Badge 不顯示、失控
- 以 process 類別做智能推薦比 banner 提示強度高
- Prototype 以硬編碼清單實作，正式上線前需遷至 Process 主檔欄位 `is_cross_station`（本 change 不涵蓋，留作 Process 主檔 change）

**替代方案**：
- Banner 提示印務記得勾 — 弱緩解，採用率不夠
- 全部預設 true — 自有廠就地交接任務會多餘 UI 摩擦

### D10：簽收照片沿用陣列欄位，不拆 TransferAttachment 表

**決策**：TransferTicket.signature_photos 為檔案陣列欄位，不另建 TransferAttachment 獨立表。

**理由**：
- Miles 採「維持欄位」方案，範疇不擴大
- Prototype 階段簡化資料模型
- 正式上線若法律級追溯需求觸發，可另開 change 抽表

**風險**：正式環境缺乏 uploader / uploaded_at / file_hash 等稽核線索 → 法律糾紛時可能證據力不足。緩解：Prototype 驗證完成後、上線前再評估是否補。

## Risks / Trade-offs

**風險 1：TransferTicket 聚合邏輯錯誤會污染生產任務狀態**
→ 緩解：tasks.md § 聚合邏輯單元測試（涵蓋所有 Ticket 狀態組合、作廢情境、撤回回退）；設計獨立 `src/lib/transfer/aggregateTransferStatus.ts` 模組便於驗證

**風險 2：supplier-portal 改為「待建立轉交單」子態可能造成既有 Prototype 測試失敗**
→ 緩解：tasks.md § 檢查既有 supplier-portal 相關情境是否需連動更新（雖然 supplier-portal change 尚未完整 apply，此風險較低）

**風險 3：Slack 自動複製可能被瀏覽器安全政策阻擋（需使用者手勢觸發）**
→ 緩解：`navigator.clipboard.writeText` 需在使用者點擊事件中觸發（「儲存」按鈕本身即為手勢），技術上可行；tasks 內驗證桌機 Chrome / Safari 皆可用

**風險 4：印務不習慣「建立多張 Ticket」觀念，可能把 1000 份都塞一張**
→ 緩解：UI 設計時「新增轉交單」按鈕顯性，詳情頁提示「如需分批可新增多張」；Baseline 測量後若觀察到採用不足，Prototype 驗證階段調整 UX

**風險 5：撤回與作廢的使用情境邊界可能混淆**
→ 緩解：spec Scenario 明確區分——送錯目的地 = 撤回（已送達 → 運送中 + 重填送達）；建單資訊有誤需重開 = 作廢 + 建新 Ticket。UI 在對應按鈕加 tooltip 說明

**風險 6：跨站類工序硬編碼清單在 Prototype 之外不可維護**
→ 緩解：design D9 明記待 Process 主檔 change 遷出；tasks 內加 TODO 註解指向 XM 追蹤

**風險 7：一生產任務建多張 Ticket 的 target_quantity 總和校驗可能在並行建單時失準**
→ 緩解：Prototype 為單一使用者操作（localStorage），此風險低；正式後端需加 transaction-level 校驗，但非本 change 範疇

## Migration Plan

Prototype 階段（localStorage / mock store）：
1. 新增 `src/types/transfer.ts` 定義 TransferTicket、TransferRevocationLog、相關 enums
2. `ProductionTask` 型別加 `transfer_required` 布林；既有 mock 任務全部補預設值（外包 / 中國：true；自有 / 加工：依 process 類別推薦）
3. mock store 新增 `transferTickets` slice 與 `transferRevocationLogs` slice
4. `src/lib/transfer/` 建資料夾，放 `buildSlackSummary.ts`、`aggregateTransferStatus.ts`、`validateTransferQuantity.ts`
5. `crossLayerAssertions.ts` 評估：聚合邏輯（pt.status 是否與 Ticket 聚合一致）值得納入一項斷言
6. Prototype 無正式 migration，rollback 直接清 store；正式上線時 TransferTicket 為新表，不影響既有資料

## Open Questions

本 change 範疇內已全數解答（D3 / D6 / D7 / D10 分別關閉附件 OQ #01 / #04 / #05，#05 依 D10 / TransferTicket 設計處理）。

延後至後續 change 的 OQ（Notion Follow-up DB 追蹤）：
- [PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca)：Slack Webhook 自動推送（本 change 做自動複製作為前身）
- [XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875)：user-roles 廠務角色定義
- [XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa)：business-scenarios 跨任務轉交鏈路情境（TransferTicket 實體已預備承接）
- [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807)：日程面板「待轉交」篩選
- [WO-013](https://www.notion.so/34a3886511fa81f6bc18cb162bb328e9)：紙本工單列印需求範圍

待 Prototype 實作階段驗證的細節：
1. TransferTicket 列表在 Drawer 中的視覺層級與 QC 單列表的一致性（若未來擴充工單詳情頁轉交單 tab 時基準）
2. Slack 摘要建單自動複製在 Chrome / Safari 桌機端的可靠性測試
3. 跨站類工序清單硬編碼位置（建議 `src/lib/transfer/crossStationProcesses.ts` 獨立檔案便於後續遷 Process 主檔）
4. 撤回 / 作廢的 UI 差異是否足夠明顯讓印務辨認（tooltip + 按鈕顏色區分）
5. Ticket 聚合邏輯對已完成任務的回退處理（已完成 → 運送中）是否對工單層完成度計算造成非預期影響
