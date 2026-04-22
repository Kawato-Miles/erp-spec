# add-production-task-transfer — Design

## Context

生產任務完成後的跨站點物件運送，目前是 ERP 系統外的真空地帶。印件從完工到送達下一站（廠內產線 / 外部加工廠 / 倉庫）沒有任何系統紀錄，實務上依賴口頭、LINE、Slack 溝通。問題本質不是「溝通工具選錯」，而是「沒有被指派為當責運送者」與「缺乏可追溯憑證」。

既有規格狀態：
- `production-task/spec.md` 已定義三條狀態機路徑（自有 / 外包 / 中國），外包廠「運送中」、中國廠「已送集運商」狀態存在但無對應欄位記錄運送資訊
- `user-roles/spec.md` 未定義廠務角色（XM-010 追蹤）
- `business-scenarios/spec.md` 無跨任務轉交鏈路情境（XM-011 追蹤）

260417 會議結論：廠務為系統外被動執行者；印務 + 師傅在系統內共同擔責。Miles 在 explore 階段拍板三項決策（擴充既有運送狀態、MVP 範疇、Drawer 分區 UI）。senior-pm 前期介入指出三項補強（當責視角、一鍵複製 Slack、Baseline 測量）。本 change 的設計決策整合上述輸入。

## Goals / Non-Goals

### Goals

1. 讓「生產任務完工 → 物件送達下一站」可在系統內被指派、記錄、查詢
2. 三種轉交情境（廠內自送 / 貨運行 / 外包廠商自取）在資料模型與 UI 中顯性支援
3. 印務 + 師傅有明確的確認動作與權責邊界
4. 確保 Slack 通知鏈路在 PT-002 落地前不斷鏈（一鍵複製文字作橋接）
5. 設計可量化的成功指標路徑（Baseline 測量方式明確）

### Non-Goals

1. 不做 Slack Webhook 自動推送（PT-002 延後）
2. 不補 user-roles 的廠務角色正式定義（XM-010 延後）
3. 不補 business-scenarios 跨任務鏈路情境（XM-011 延後）
4. 不做日程面板「待轉交」篩選（PT-003 延後）
5. 不整合紙本工單列印（WO-013 延後）
6. 不改造師傅報工流程的主架構，只新增「報工後可直接轉交確認」的流線
7. 不支援多站點連續轉交（一任務只有一次轉交），若需跨多站轉交由多個生產任務表達

## Decisions

### D1：狀態機擴充策略 — 統一使用「運送中」作為轉交語意載體

**決策**：保留外包廠 / 中國廠既有的「運送中」狀態名稱，不重命名為「待轉交」；自有 / 加工廠的需轉交路徑新增「運送中」狀態，使所有工廠類型共用同一狀態承載轉交欄位。

**理由**：
- Miles 拍板「擴充既有運送狀態」，排除「正交維度」方案
- 重命名會引入額外 migration 成本且影響 `supplier-portal` change 觸發邏輯
- 「運送中」在業務語境上等同「物件正在從 A 點到 B 點」，符合轉交語意
- 列表 Badge 可以獨立顯示「待轉交 / 已轉交」文字，對業務端展示不受狀態名稱限制

**替代方案**：
- （A）新增正交維度 `transfer_status`（三態），與主狀態機並存 — 被 Miles 排除，會造成外包廠「運送中」與「待轉交」兩個概念並存
- （B）重命名「運送中」→「待轉交」 — 需要改動 supplier-portal 觸發邏輯、business-scenarios scenarios；風險高，收益低

### D2：transfer_required 預設值依工廠類型差異化

**決策**：
- 自有 / 加工廠：`transfer_required` 預設 `false`，使用者主動開啟
- 外包廠 / 中國廠：`transfer_required` 預設 `true`，不可關閉

**理由**：
- 外包 / 中國廠本質上必然有物件運送階段（供應商做完必須送回或送下一站），讓使用者能關閉等於允許資料缺失
- 自有廠多數完工就地交接（例如印刷完成直接進入廠內裝訂線），不強制填會降低採用阻力
- 與 D1 配合：外包廠既有流程本就走「運送中」，這個決策只是把已存在的語意欄位化

**替代方案**：
- 一律預設 `false` 讓使用者決定 — 外包廠會出現「運送中狀態無轉交資訊」的不一致態，品質防守失守
- 一律預設 `true` — 自有廠多餘摩擦，降低採用率

### D3：轉交確認權限按工廠類型拆分

**決策**：
- 產線任務（自有工廠 / 加工廠）：指派師傅 **或** 印務任一方可點擊「確認已轉交」
- 外部任務（外包廠 / 中國廠商）：僅印務可確認

**理由**：
- 附件原 OQ #01「印務能否進工廠」是這個決策的前置，現有 user-roles spec 中印務角色並未限制進出工廠，本 change 假設印務可進工廠（與現場實務一致）
- 產線任務由師傅確認最合理（他本人執行了工作、看著物件送走），但印務代確認作為 fallback，避免師傅未在系統中操作時狀態卡住
- 外部任務師傅未實際參與，由印務單一視窗確認避免責任分散

**替代方案**：
- 僅印務可確認 — 簡單但違反「由實際執行者承擔」原則，且師傅報工後還要等印務另外操作會拉長流程
- 僅師傅可確認 — 外部任務沒有對應師傅，無法操作

**對應 OQ 關閉**：附件 OQ #01 決議 = 印務可進工廠，採本 D3 方案。

### D4：轉交撤回機制

**決策**：「已完成」可由印務撤回至「運送中」，必填原因、寫入 `TransferRevocationLog`，師傅無撤回權限。

**理由**：
- 附件原 OQ #04 建議「允許撤回 + 異動紀錄」，本 change 採納
- 撤回權限僅給印務，避免師傅誤點 / 亂撤回造成數據混亂
- 撤回後 `transfer_actual_date` / `transfer_confirmed_by` 重置，允許重新確認；撤回原因獨立寫入 log，不污染轉交主欄位

**替代方案**：
- 不可撤回，送錯另外開異動單 — 實務上頻繁發生送錯，強制走異動單太重
- 任何角色都可撤回 — 增加數據誤操作風險

**對應 OQ 關閉**：附件 OQ #04 決議 = 允許撤回 + 原因 + 異動紀錄，採本 D4 方案。

### D5：廠內執行者欄位純文字，不接系統帳號

**決策**：`transfer_handler_name` 為純文字欄位，不與 User 表 relation。

**理由**：
- 附件原 OQ #05 建議「純文字輸入」，本 change 採納
- 廠務為系統外角色（XM-010 追蹤），沒有 ERP 帳號，無法做 FK
- 記錄目的是事後追責的線索，不需要系統級聯操作
- 未來若廠務納入系統（目前無規劃），再遷移為 FK

**替代方案**：
- 接 User 表 — 廠務無帳號，需要先建「系統外使用者」概念，範圍暴增
- 不記錄 — 失去「阿明今天送的這批」的追蹤線索

**對應 OQ 關閉**：附件 OQ #05 決議 = 純文字輸入，採本 D5 方案。

### D6：Slack 摘要一鍵複製 — MVP 必要橋接

**決策**：MVP 包含生產任務詳情頁「Slack 摘要複製」純 UI 區塊（前端剪貼簿 API），不整合 Webhook。

**理由**：
- senior-pm 審查指出：若 Slack 推送延後但沒替代方案，印務確認轉交後廠務收不到指令，被迫口頭再通知一次，功能會流於裝飾，採用率崩潰
- 一鍵複製純前端，零後端 / 整合成本，可在 Prototype 階段實作
- 與 PT-002 整合路徑：未來加 Webhook 時只需把「顯示摘要」改為「按一下發送」，摘要模板可直接沿用

**替代方案**：
- 只等 PT-002 完成再一起做 — MVP 採用率風險過高
- 直接做 Webhook — 需要 Slack Channel 配置（XM-002 前置未解），時程失控

### D7：UI 放置在 ProductionTaskDrawer 分區，不做 tab 結構

**決策**：轉交欄位與操作放在 `ProductionTaskDrawer` 內新增「轉交」分區（section）；列表 Badge 加在 `ProductionTaskList` 每列右側。

**理由**：
- Miles 拍板 Drawer 分區，避免 tab 結構擴張複雜度（現有 Drawer 無 tab）
- 附件 UI mock 的 tab 假設現有材料 / 工序 / 裝訂 tab 在任務層，但實際這些 tab 在 `WorkOrderDetail`（工單層），附件認知錯誤
- 分區形式：基本資訊 → 轉交設定（transfer_required toggle + 條件欄位）→ 轉交確認（按鈕 + 紀錄）→ Slack 摘要複製

**替代方案**：
- 獨立 Dialog（類似 TransferOperatorDialog）— 操作中斷，Drawer 開著還要另外開 Dialog，UX 摩擦高
- 做 tab — 與現有 Drawer 無 tab 不一致，視覺突兀

### D8：完工報工與轉交確認的流線銜接

**決策**：`WorkReportDialog`（報工 Dialog）在師傅提交報工達到 `pt_target_qty` 且 `transfer_required = true` 時，顯示「前往轉交確認」按鈕，點擊直接跳到 ProductionTaskDrawer 的轉交分區。

**理由**：
- senior-pm 審查指出：師傅報工與轉交確認若分兩次操作，第二次動作容易被忽略
- 報工完成的當下是自然的「物件準備送走」時刻，嵌入轉交引導最符合工作流
- 按鈕是引導性，不強制，允許師傅「先走再說」

**替代方案**：
- 自動導向轉交畫面 — 強制跳轉破壞師傅原有操作節奏
- 不銜接 — 採用率低（senior-pm 明確反對）

## Risks / Trade-offs

**風險 1：自有廠 `transfer_required` 預設 false，可能被遺漏**
→ 緩解：生產任務詳情頁加「提示 Banner」提示使用者若任務需跨站點，記得勾選轉交；tasks.md 內排預上線 UX 測試驗證此點

**風險 2：Slack 摘要一鍵複製只是前端功能，印務可能「忘記貼」**
→ 緩解：列表 Badge 顯示「待轉交」，讓印務主管能一眼看到未完成轉交的任務；PT-002 Webhook 整合後此風險消除

**風險 3：撤回機制被濫用，數據品質下降**
→ 緩解：撤回寫入 `TransferRevocationLog`，成功指標監控「撤回率 < 5%」，超標則審視使用行為

**風險 4：轉交 Badge 與主狀態 Badge 並列可能造成視覺擁擠**
→ 緩解：列表列設計上 Badge 限制在右側固定區域；若實測後仍擁擠，考慮改為 tooltip-on-hover

**風險 5：外包廠 transfer_required 強制 true 可能造成既有任務 migration 問題**
→ 緩解：本 change 為新欄位新增，既有任務設 default value；tasks.md 內排 Prototype seed data 統一處理

## Migration Plan

Prototype 階段無正式 migration（資料在 localStorage / mock store），但需：
1. 型別補欄位後，既有 mock ProductionTask 全部補 `transfer_required`（外包 / 中國：true；自有 / 加工：false）
2. 新增 `TransferRevocationLog` 型別與 mock store slice
3. `crossLayerAssertions.ts` 評估是否納入轉交欄位的跨層檢查（design 階段暫判：無跨層需求，轉交為生產任務單層概念）
4. Rollback 策略：Prototype 直接清 mock 即可；正式上線後的撤回機制為業務層能力，不需 data rollback

## Open Questions

本 change 範疇內已全數解答（D3 / D4 / D5 分別關閉附件 OQ #01 / #04 / #05）。

延後至後續 change 的 OQ（Notion Follow-up DB 追蹤）：
- [PT-002](https://www.notion.so/34a3886511fa81dfbe9bc320b1d99aca)：Slack 摘要自動產生與轉發
- [XM-010](https://www.notion.so/34a3886511fa81e0aa18df3345c2e875)：user-roles 廠務角色定義
- [XM-011](https://www.notion.so/34a3886511fa812bb142d48ccf5ceefa)：business-scenarios 跨任務轉交鏈路情境
- [PT-003](https://www.notion.so/34a3886511fa81fb99a3cfa4bb44b807)：日程面板「待轉交」篩選
- [WO-013](https://www.notion.so/34a3886511fa81f6bc18cb162bb328e9)：紙本工單列印需求範圍

待 Prototype 實作階段回頭驗證的細節：
1. `TransferRevocationLog` 的資料型別與 store slice 結構（放 `src/types/dispatch.ts` 還是新建 `src/types/transfer.ts`）
2. Slack 摘要模板的欄位缺失顯示策略（省略整行 vs 顯示「—」占位符）
3. 列表 Badge 的視覺層級與主狀態 Badge 的排序
