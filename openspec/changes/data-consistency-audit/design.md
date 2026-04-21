## Context

### 既有 e2e 架構（2026-04-20 已沉澱）

Prototype 於 [2026-04-20-end-to-end-data-flow](../../changes/archive/2026-04-20-end-to-end-data-flow/) 歸檔 change 建立完整 e2e 資料架構，沉澱為 [prototype-data-store spec](../../specs/prototype-data-store/spec.md)：

- 單一 Zustand store（`src/store/useErpStore.ts`）作為唯一真相源
- seedData 從 mock 檔組裝初始狀態（`src/store/seedData.ts`）
- Factory 函數集（`src/test/helpers/storeTestUtils.ts`）
- 步驟累積式 e2e 測試（`src/test/scenarios/`）
- 所有 ID 改為業務編號、印件 FK 貫通所有層級

### 新發現：現行 mock 設計與 UAT 目的錯位

經與 Miles 2026-04-20 對齊，真正的痛點不是「所有 mock 欄位對齊」，而是：

1. **UAT 驗證目標**：使用者要從需求單建立一路走到報工，觀察端到端資料流動與狀態機推進
2. **業務情境覆蓋**：[business-scenarios spec](../../specs/business-scenarios/spec.md) 定義的 15 個情境是 UAT 的測試計劃
3. **現有 mock 架構錯位**：現行 `mockOrders`（5 筆）/ `mockWorkOrders` / `mockDispatch` / `mockPrepressReview` 是「已跑到不同階段的快照」，UAT 者切入任一筆都是半路狀態，無法觀察完整流動。且資料量大、各檔彼此不一致、維護成本高

Miles 的新決策（2026-04-20，兩輪對齊後的最終版）：

- **資料鏈必須連續**（Miles 關鍵澄清）：不能有「訂單但沒需求單」、「印件但沒訂單」這種斷鏈；但允許 mock 預載到情境中間階段（例：審稿不合格、待 QC），只要從 Quote 到該階段的所有 FK 完整
- **需求單為資料鏈源頭**：每筆 mock 從一筆 Quote 開始；若情境需要更後的起點，Quote 之後的衍生實體同步 mock
- 現有 mockOrders / mockWorkOrders 等分散快照**全部清除**
- 重建 7 筆情境驅動 mock 資料鏈覆蓋優先情境（P0: 6 情境 / P1: 5 情境 / P2 另立 / 情境 14 移除）
- 難易度等擴充欄位以 1 或 5 的簡單值填入
- **B2C 補件（情境 13）無 EC Demo**：依賴假檔案資料跳過客戶 EC 上傳驗證（Miles 澄清）
- **不提供 UAT empty state 緩解機制**（Miles 決策）：UAT 使用者自行避免 F5，沒有「重置至情境 N」或「snapshot/restore」按鈕
- **流程機制移出本 change**（§ 10 原規劃的 config.yaml rules / CLAUDE.md 原則等）：CEO 視角反對「工程自嗨」，Miles 同意移出；另立 follow-up change 於未來踩到同類痛點時處理

### 15 情境到 7 筆 mock 資料鏈的歸納（v2.0）

業務情境中許多只是「操作路徑差異」；本 change 採「每筆 mock 為完整資料鏈」策略，允許預載中間階段：

| 類型 | 涵蓋情境 | 預載階段 | 分級 |
|------|---------|---------|------|
| A 基礎打樣+大貨 (Q1) | 1 | 無（Quote 起點）| P0 |
| B 複雜多工單 (Q2) | 2 | 無（Quote 起點）| P0 |
| C 高量 + QC 階段 (Q3) | 10, 11 | 製作中待 QC | P0 (10) / P1 (11) |
| D B2B 補件 (Q4) | 12 | 首審不合格 | P0 |
| E B2C 補件 (Q5) | 13 | 首審不合格 + round 2 審稿中 | P0 |
| G 免審稿 (Q6) | 15 | 無（Quote 起點）| P0 |
| H 打樣完成待填結果 (Q7) | 3, 4, 5, 6 | 打樣工單已完成 | P1 |

**P0 共 6 項**：1, 2, 10, 12, 13, 15
**P1 共 5 項**：3, 4, 5, 6, 11
**P2（另立 change）**：7, 8, 9
**移除（Miles 決策）**：14（審稿員離職情境本 Prototype 不做）

具體 7 筆 mock 的資料結構（含預載 Order / WO / ReviewRound / Report 範圍）見 `demo-intent.md`（v2.0）。

### 現況落差（延續前版）

**跨層欄位漂移**：`add-prepress-review` 新增的擴充欄位（`difficultyLevel` 等）在既有 mock 之間對不齊。新 mock 架構重建時會自然解決（因為唯一起點是需求單），但 audit 常駐保護機制仍須建立，防止未來類似事件重演。

**UAT 使用者視角失敗情境**：使用者從「大方文創禮盒組」需求單切換到對應訂單，難易度欄位顯示不同值 → 當場質疑「系統在騙我」→ UAT 被拉回討論資料對錯、無法驗證流程邏輯。

## Goals / Non-Goals

**Goals:**
- 建立 7 筆情境驅動 mock 資料鏈作為 UAT 起點，每筆鏈從 Quote 開始，必要時預載到情境中間階段
- 清除 `mockOrders` / `mockWorkOrders` / `mockDispatch` / `mockPrepressReview` 既有分散快照資料
- 確保從這 7 筆 mock 出發，UI actions 能把 P0 情境推進到情境終點；P1 情境能做就做
- 跨層欄位一致性透過常駐 audit（`dataConsistency.test.ts`）保護

**Non-Goals:**
- 不改動既有 e2e 架構設計（store / selector / FK 貫通 / 業務編號 ID）
- 不改 UI 視覺與互動行為
- 不動實際 ERP 後端
- 不做 UAT empty state 緩解機制（不加重置按鈕、不加 snapshot/restore）
- 不建 config.yaml rules 或跨層欄位 discipline 制度（§ 10 已移出本 change）
- 不覆蓋情境 7, 8, 9（P2 另立 change）、不覆蓋情境 14（本 Prototype 不做）
- 不追求「完全 factory 生成式 seed」——7 筆 mock 仍是明確的靜態資料
- 不保留 mockOrders / mockWorkOrders / mockDispatch / mockPrepressReview 既有 demo 資料（僅保留 reference data 如審稿員、師傅、設備清單）

## Decisions

### D1：Mock 架構—7 筆情境驅動需求單 + 清除分散快照

**選擇**：所有 UAT 起點為需求單。`mockQuotes.ts` 重建為 7 筆情境驅動 Quote；`mockOrders` / `mockWorkOrders` / `mockDispatch` / `mockPrepressReview` 的 demo 資料清除。UAT 者從需求單開始透過 UI actions 走完整段流程。

**替代方案**：
- (a) 維持現有 5 筆 Order + 新增 7 筆 Quote（兩者共存）
- (b) 所有情境做完整歷史快照（mock 大幅擴張）

**理由**：
- Miles 明確要求：「所有起點都是需求單 → 訂單 → 審稿 → 工單 → 報工連貫」
- 清除分散快照大幅降低維護成本（不用維護 5 個 mock 檔的跨檔一致性）
- 15 個情境許多只是操作路徑差異，同一筆需求單可驗證多情境，不需 15 筆 mock
- 方案 (a) 會出現「UAT 看到舊 Order 資料 vs UAT 跑新需求單的資料並存」的認知混亂
- 方案 (b) 投資大、維護難、違反「Prototype 優先於實現」原則（太接近完整系統產生的資料）

### D2：保留 mock 檔案結構但清空 demo 資料

**選擇**：`mockOrders.ts` / `mockWorkOrders.ts` / `mockDispatch.ts` / `mockPrepressReview.ts` 保留檔案與匯出結構，但 `mockOrders = []`、`mockWorkOrderDetails = []` 等改為空陣列。必要的 reference data（如 `mockWorkers`、`mockEquipment`、`PREPRESS_REVIEWERS`）保留。

**理由**：
- 完全刪除檔案會破壞既有 import 語法（25+ 檔案 import 這些 mock）
- 空陣列等同於「沒有 demo 資料」但保留型別與 runtime 契約
- 審稿員 / 師傅 / 設備等 reference data 是系統運作必需，不是「情境資料」

### D3：15 情境到 7 需求單的對應

**選擇**：依「類型 A-G」歸納 7 筆需求單，每筆有明確的情境覆蓋目標。具體案名與印件細節由 Miles 草擬於 `demo-intent.md`。

**理由**：
- 情境差異許多在操作選擇（例：情境 3 vs 4 都從同類型需求單出發，UAT 者填「NG-製程」或「NG-稿件」觸發不同路徑）
- 7 筆涵蓋所有情境所需的資料結構變化（印件數 / 審稿設定 / 訂單類型 / 數量等級）
- Miles 草擬案名 / 客戶 / 印件細節更貼近其印刷業語感

### D4：Store Actions 完備性驗證為本 change 關鍵工作

**選擇**：對 15 個 business-scenario 逐一驗證「從對應需求單出發 → UI actions 能推進到情境終點」。缺的 action 補齊、跑不通的 bug 修正。

**需驗證的 actions**：
- `addQuote` / `updateQuoteFields` / `updateQuoteStatus` / `convertQuoteToOrder`
- `confirmSignBack`（審稿前段推進）
- 審稿：`submitReview`（合格 / 不合格 / 免審稿）/ `rebuildPrintItem`（NG-稿件問題建新印件）
- 工單：`addWorkOrder` / `updateWorkOrderStatus` / `submitWorkOrderForReview` / `approveWorkOrder` / `rejectWorkOrder` / `recallWorkOrder`
- 任務：`addTaskToWorkOrder` / `addProductionTask` / `cancelTask` / `addTaskLevel`
- 生產：`dispatchTask` / `addWorkReport` / `updateProductionTask`
- QC：`createQC` / `passQC` / `failQC`
- 出貨：`createShipment`
- 異動：`workOrderModification`

盤點現有 `useErpStore.ts` actions，缺的補上。這是本 change 最重的工作，tasks.md § 4-5 處理。

**理由**：
- 沒有這些 actions，情境無法從需求單走到終點，整個改造意義不大
- 既有 `fullProductionFlow.test.ts` 等測試已驗證部分 actions 可運作，但未系統性驗證 15 情境覆蓋

### D5：Audit 採用「runtime test 針對 seedData + actions 後狀態斷言」

**選擇**：新增 `src/test/scenarios/dataConsistency.test.ts`，斷言對象是「seedData 載入後狀態」+「執行情境 actions 後狀態」。

**替代方案**：
- (a) 寫 TypeScript lint rule / codemod 靜態檢查 mock 檔
- (b) runtime 啟動時 assert，失敗就 throw
- (c) 引入 Zod / TypeBox schema-first fixture

**理由**：
- mock 檔是資料不是 code pattern，lint 難以表達跨檔語意
- runtime assert 在啟動時 throw 會打斷 UI 開發 hot reload
- vitest 與既有 scenarios 測試一致
- Zod schema 路線為業界更優解，但屬於架構變更，本次範圍不擴大，留 OQ

### D6：金額彙總一致性 Audit（erp-consultant I1 建議）

**選擇**：除 parity + FK 外，加入訂單金額彙總斷言：`Order.totalAmount === sum(printItems.orderedQty * pricePerUnit)`（容差 ≤ 1）。

**理由**：UAT 使用者第一眼看訂單金額，對不上立即崩盤 UAT 可信度。新 mock 架構下此檢查仍有意義（UI 建立 Order 時的金額計算邏輯若有 bug，audit 會揪出）。

### D7：~~Change 工作流 Rules 採 Schema 化~~ — 移出本 change

原計畫於 `openspec/config.yaml` 新增 `crossLayerFieldRules` section 建立跨層欄位 checklist 機制，但 CEO 視角審查（2026-04-20）強烈反對：

- CEO 核心批評：「從一個坑跳到另一個坑」，把「商業問題（情境驅動 UAT）」和「工程自嗨（rules 機制）」綁在一起
- Miles 2026-04-20 決策：同意移出本 change
- 後續處理：待本 change archive 後若再次發生跨層欄位漂移事件，另立 follow-up change `cross-layer-field-discipline` 處理

本 change 核心保護機制改為僅依靠 D5 的 `dataConsistency.test.ts` 常駐 audit。若 audit 足夠（CI 會 fail），則不需額外的 config.yaml rule；若 audit 不足，先補 audit 再考慮 rules。

### D8：難易度值填 1 或 5（Miles 2026-04-20 決策）

**選擇**：7 筆需求單的 `difficultyLevel` 統一填 1 或 5（依 Miles 指示）。不追求真實業務值。

**理由**：
- Miles 明確：「難易度用 1 / 5 即可，不用考慮實際複雜度，只是要確認流程、資料流、自動分配審稿是通的」
- 本 change 目的是**流程連貫性驗證**，不是業務語意精確度
- Audit 仍然檢查跨層一致性（Quote.difficultyLevel === Order.difficultyLevel），只是比對基準是 1 或 5

### D10：Mock 檔資料分層宣告（erp-consultant B2-new 建議）

**選擇**：明確區分三層資料，指引 tasks § 3「清除舊 mock demo 資料」的範圍：

```
1. Configuration（組織結構 / 廠別 / 倉別）
   當前 Prototype 階段不處理。

2. Master Data（系統運作必需，本 change 必保留）
   - mockPrepressReview.PREPRESS_REVIEWERS（審稿員主檔，需確認至少 1 位 active 可接情境 12/13/7）
   - mockDispatch.mockWorkers（師傅主檔）
   - mockDispatch.mockEquipmentList（設備主檔）
   - bomMasterMock（材料 / 工序 / 裝訂主檔，不影響本 change）

3. Transactional Data（本 change 清除並以 7 筆情境驅動 mock 取代）
   - mockOrders.mockOrders
   - mockWorkOrders.mockWorkOrderDetails / mockWorkOrders
   - mockDispatch.mockDispatchTasks / mockWorkPackages / mockWorkReports
   - mockPrepressReview demo 資料（保留 PREPRESS_REVIEWERS 主檔）
   - mockArtwork（demo 資料清除）
   - mockSchedulePanel / mockSchedulingCenter / mockDispatchBoard（若有 demo 資料清除）
```

**理由**：
- 業界 ERP（SAP、Oracle、NetSuite）標準作法：明確區分 Configuration / Master Data / Transactional Data
- 本 change 清除的是 Transactional 層；若誤清 Master Data 會導致 7 筆 mock 無法運作（例：移除所有審稿員後情境 12/13 的審稿 action 無人可分派）
- tasks § 3 依此清單決策每個檔案保留或清空

### D9：Quote 為跨層欄位的規範源頭（涵蓋本次 7 筆需求單的使用欄位）

**選擇**：`TRACKED_PARITY_FIELDS`（`difficultyLevel` / `expectedProductionLines` / `skipReview` / `specNotes` / `shippingMethod` / `packagingNotes` / `deliveryDate`）以 Quote 為源頭，Order 以 Quote 為基準繼承。Order 建立後此類欄位值不再變更。

**理由**：
- 與既有 [add-prepress-review design.md D5](../../changes/archive/2026-04-20-add-prepress-review/design.md) 描述一致（成交轉訂單時自動繼承）
- Miles 確認：業務初估後不改（例如難易度），適合 fill-down 模式
- 審稿階段可變動的欄位（如 reviewDimensionStatus / reviewRounds）不在此 parity 清單，走 intra-layer invariant 檢查

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 清除 mockOrders 等會破壞既有頁面的 demo 畫面 | seedData 的「組裝 Order」改為 empty，UI 頁面展示空列表直到 UAT 者從需求單轉訂單 |
| Store actions 盤點可能發現大量缺漏，超出本 change 時程 | tasks.md § 4 明列盤點 → 補齊順序；若缺漏嚴重，後續 change 拆分處理（本 change 至少讓情境 1 走通） |
| 既有 e2e 測試（fullProductionFlow 等）依賴 mock 資料 | 這些測試已改用 factory 建資料（如 `makeOrder`、`makeWorkOrderDetail`），清除 mock 不影響；若發現依賴 mock 的測試，改用 factory |
| Audit 第一次跑出大量斷點 | 新 mock 架構下只有 7 筆 Quote，parity 對象少；第一次跑預期綠（因為 Order 空），斷點主要來自 UI actions 建 Order 後的欄位繼承是否正確 |
| Miles 草擬 7 筆需求單的時程未知 | tasks.md § 2 明定等待 Miles 草擬；在此之前優先做 § 3-4（清除舊 mock + actions 盤點）不受影響 |

## Migration Plan

Prototype 層變更，無實際資料遷移。階段性部署：

1. **Phase A**：審查階段（三視角重跑，因主軸變更）
2. **Phase B**：清除舊 mock demo 資料（保留檔案結構）
3. **Phase C**：Miles 草擬 7 筆需求單於 `demo-intent.md`；Claude 依此建立新 `mockQuotes.ts`
4. **Phase D**：盤點並補齊情境所需 store actions
5. **Phase E**：建立 scenarios 測試（dataConsistency + scenarioCoverage + fieldInheritance）
6. **Phase F**：Factory 擴充 + enrichment + config.yaml rules
7. **Phase G**：verify + archive

**soft fail TTL**：`dataConsistency.test.ts` 在 Phase E 初建時可為 soft fail，本 change archive 前必須轉 hard fail。

## Open Questions

1. `reviewRounds` / `reviewActivityLogs` 是純審稿階段資料，不做 parity 檢查；intra-layer invariant 檢查範圍已定義於 spec
2. `orderSource`（B2C / B2B）衍生邏輯放 selector vs enrichment：本 change 暫不處理
3. 下階段是否引入 Zod / TypeBox schema-driven fixture：留 OQ 待後續評估
4. 狀態機合法性 + 時間序列單調性 audit：本次只補金額彙總，其他標配 audit 留後續
5. 未來「Order 階段可修改欄位」出現時的繼承模型：可能需要業界主流 snapshot 模型
6. 非 prepress-review 欄位的全面掃描：`data-consistency-audit-phase2` 另立 change
7. 7 筆需求單的具體草擬（Miles 提供）：記錄於 `demo-intent.md`
8. Store actions 盤點後若發現重大缺漏（例：工單異動、任務層級作廢的 action 完全不存在），本 change 範圍是否涵蓋這些 action 的實作？還是另立 change？
