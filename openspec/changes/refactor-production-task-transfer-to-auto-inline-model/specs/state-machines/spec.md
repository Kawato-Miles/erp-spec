## MODIFIED Requirements

### Requirement: 生產任務狀態機

生產任務（Production Task）SHALL 依以下狀態流轉，依工廠類型有不同路徑：

自有工廠路徑：
- 待處理 → 製作中 → 已完成
- 「製作中」由首次報工觸發

加工廠路徑：
- 待處理 → 製作中 → 已完成
- 與自有工廠相同路徑

外包廠路徑：
- 待處理 → 製作中 → 運送中 → 已完成

中國廠商路徑：
- 待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

終態：已完成、已作廢、報廢。

生管指派師傅（assigned_operator）為欄位更新，不觸發狀態變更。生產任務維持「待處理」直到首次報工。

**依賴邊就緒前置條件**（取代屬性化 prerequisiteMet 設計）：
- 生產任務若有依賴邊（`dependsOn` 非空），派工 / 首次報工的前置條件為「**所有依賴邊的目前佇列量 ≥ 1**」
- 佇列量定義與計算詳見 [production-task spec](../production-task/spec.md) § 佇列量計算與消耗扣帳
- 「目前佇列量」為計算衍生值（不存欄位）：上游已送達 Line 累計 − 下游已報工 × 消耗比例
- 多依賴邊採 AND 邏輯：所有邊皆 ≥ 1 才可派工
- 不擴充狀態機節點數量（仍為 待處理 / 製作中 / 運送中 / 已送集運商 / 已完成 / 已作廢 / 報廢）

#### Scenario: 自有工廠生產任務首次報工進入製作中

- **WHEN** 生管或師傅為「待處理 + 所有依賴邊佇列 ≥ 1」狀態的自有工廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 自有工廠生產任務完成

- **WHEN** 自有工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 直接從「製作中」變為「已完成」

#### Scenario: 外包工廠生產任務含運送

- **WHEN** 外包工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 中國工廠生產任務含集運

- **WHEN** 中國工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「已送集運商」
- **AND** 集運商出貨後 SHALL 變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理 + 所有依賴邊佇列 ≥ 1」狀態的外包廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」
- **AND** 向上狀態傳遞 SHALL 正常觸發

#### Scenario: 供應商標記製作完畢觸發運送中

- **WHEN** 供應商將「製作中」狀態的外包廠生產任務標記為製作完畢
- **THEN** 狀態 SHALL 從「製作中」變為「運送中」

#### Scenario: 中國廠商標記出貨觸發已送集運商

- **WHEN** 中國廠商將「製作中」狀態的生產任務標記出貨
- **THEN** 狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 待處理狀態的生產任務作廢

- **WHEN** 「待處理」狀態的生產任務因異動需作廢
- **AND** 該 PT MUST NOT 被其他 PT 的依賴邊引用為上游（見 production-task spec § 上游 ProductionTask 作廢阻擋）
- **THEN** 狀態 SHALL 變為「已作廢」（無成本，因尚未實際生產）

#### Scenario: 任一依賴邊佇列為零阻擋首次報工

- **WHEN** 師傅或生管為 `status=待處理 AND 任一依賴邊佇列 = 0` 的生產任務提交報工
- **THEN** 系統 MUST 拒絕報工，提示「依賴邊 [上游名稱] 無可用料」
- **AND** 狀態 MUST NOT 變為「製作中」

#### Scenario: 已開工後上游 TransferTicket Header 作廢不回退下游狀態

- **WHEN** 下游 B `status=製作中`，上游 A 的某張 **TransferTicket Header** 被作廢、佇列量計算後變為負值
- **THEN** B.status MUST NOT 變動（已開工的事實不回退）
- **AND** UI MUST 顯示佇列負值警示「實際生產量超過已送達量，請補送料」
- **註**：此處「上游作廢」指 **TransferTicket Header** 級別（運送中物料的作廢），與 § 上游 ProductionTask 作廢阻擋（PT 級別結構保護）不同。

## ADDED Requirements

### Requirement: 生產任務依賴邊解鎖觸發鏈

系統 SHALL 在以下事件觸發 UI 對相關生產任務「目前佇列量」的重新計算與顯示，確保派工板與報工阻擋邏輯準確：

**觸發事件**：
- TransferTicket Header 狀態變更（建立 / 確認送達 / 作廢）
- ProductionTaskWorkRecord 寫入（報工事件）
- ProductionTask.dependsOn 變更（新增 / 修改 / 清空）

**計算範圍**：
- TransferTicket Header 狀態變更 → 重算其 lines 中所有 destinationProductionTaskId 對應 PT 的佇列量
- 報工事件 → 重算該 PT 各依賴邊的佇列量（依消耗比例扣帳）
- dependsOn 變更 → 僅重算該 PT 自身

**同步性**：佇列量為計算衍生值，UI 每次查詢時即時計算（不存欄位、不需重算事件鏈）。事件 trigger 主要用於通知 UI 重新拉資料 / 重新渲染。

#### Scenario: TransferTicket 送達觸發下游 UI 重算

- **WHEN** TransferTicket Header T1（含 Line：來源 P1-印刷、目的 P1-裁切、數量 100）狀態從「運送中」變為「已送達」
- **THEN** 系統 MUST 通知所有正在顯示 P1-裁切 的 UI 重新計算其佇列量

#### Scenario: 報工事件觸發自身佇列重算

- **WHEN** 下游 D 報工 30 個（D 有依賴邊指向 U，消耗比例 = 1）
- **THEN** 系統 MUST 即時更新 D.pt_produced_qty
- **AND** UI 重新計算 D 的「指向 U 的依賴邊」佇列 = 已送達累計 − 30

#### Scenario: dependsOn 變更觸發自身重算

- **WHEN** 印務為 B 設定 `dependsOn=[{upstreamPt:A, consumptionRatio:2}]`
- **THEN** 系統 SHALL 立即依公式重算 B 的依賴邊佇列量

#### Scenario: 上游 TransferTicket Header 作廢觸發下游佇列重算

- **WHEN** TransferTicket **Header** T1 從「運送中」或「已送達」變為「已作廢」
- **THEN** 系統 MUST 通知所有引用其包含 Line 的 destinationProductionTaskId 的 UI 重算佇列（T1 含 Line 數量從累計中剔除）
- **註**：此處「作廢」指 **TransferTicket Header** 層級（運送中物料的作廢），與 production-task spec § 上游 ProductionTask 作廢阻擋 是兩件事；PT 被引用時系統阻擋作廢，故沒有「PT 作廢觸發下游重算」情境

---

### Requirement: 依賴設計紀律（狀態不爆炸）

系統 SHALL 採用佇列量計算（衍生值）而非新增正式狀態節點，以維持狀態機節點數量穩定。

**紀律規則**：
- 依賴相關邏輯 MUST 以佇列量計算 + dependsOn 物件陣列表達
- 狀態機 MUST NOT 為依賴場景新增「阻擋 / 就緒」等正式狀態
- UI 層對「依賴邊佇列為零」的任務以禁用樣式區分，不使用 status 欄位表達

**理由**：
- 避免狀態機爆炸（保持七個正式狀態：待處理 / 製作中 / 運送中 / 已送集運商 / 已完成 / 已作廢 / 報廢）
- 向上狀態傳遞鏈不變
- 既有「師傅指派為欄位更新不觸發狀態」設計不受影響
- 佇列量為衍生值符合 Single Source of Truth（避免「儲存值 vs 公式」雙重真相）

#### Scenario: 派工板以佇列量過濾

- **WHEN** 派工板渲染「待處理」任務清單
- **THEN** UI MUST 以「所有依賴邊佇列 ≥ 1」作為可派工條件
- **AND** 任一依賴邊佇列 = 0 任務 MUST 顯示為禁用樣式（但 status 欄位值仍為「待處理」）

#### Scenario: 狀態查詢以 status 欄位為準

- **WHEN** 任何向上狀態傳遞或報表查詢詢問 PT 狀態
- **THEN** 回應 MUST 為 `status` 欄位值
- **AND** MUST NOT 將「依賴邊佇列為零」視為狀態值

---

### Requirement: 分批完成支援（佇列量驅動）

系統 SHALL 支援生產任務的分批完成行為。下游任務的「實際做幾個」由現場師傅依各依賴邊的佇列量自行決定，系統不強制最低批次量、不強制等齊套。

**業務情境**：
- 業務臨時急單：先出 30 本後送 70 本，裝訂可分兩批做
- 上游分批送達：印刷分多次完成、裁切分多次完成、折頁分多次完成
- 下游可邊做邊等：佇列有料就做、料不夠就停，等下批送達補充

**系統行為**：
- 佇列量隨「上游送達」與「下游報工消耗」即時變化
- 派工條件僅要求「所有依賴邊佇列 ≥ 1」，不強制多少
- 報工數量由師傅自行決定，系統依消耗比例扣減各邊佇列
- 若某邊扣到負值，UI 警示但不阻擋（已開工事實尊重）

#### Scenario: 分批裝訂第一批

- **WHEN** BOOK-裝訂 計畫 100 本，依賴 P1-裁切（比例 1）+ P2-折頁（比例 5）
- **AND** 已送達 P1-裁切 30 張、P2-折頁 150 張
- **THEN** 兩邊佇列皆 ≥ 1，BOOK-裝訂 可派工
- **WHEN** 師傅做 30 本完成
- **THEN** 系統扣減 P1-裁切 邊佇列 30、P2-折頁 邊佇列 150
- **AND** 兩邊佇列各為 0，下次報工前需等新料送達

#### Scenario: 分批裝訂第二批

- **WHEN** 接續上情境，後續 P1-裁切 再送達 70 張、P2-折頁 再送達 350 張
- **THEN** 佇列補充至 P1-裁切 70、P2-折頁 350
- **AND** 師傅可繼續做剩餘 70 本

#### Scenario: 上游不齊全亦可分批

- **WHEN** P1-裁切 累計送達 100 張（齊），但 P2-折頁 才送達 100 張（500 中 100，遠未齊）
- **AND** 業務急要 20 本先出
- **THEN** P2-折頁 邊佇列 = 100 = 20 本份料夠
- **AND** P1-裁切 邊佇列 = 100 = 100 本份料夠
- **AND** 師傅可派工做 20 本（系統不強制等 P2-折頁 到齊）
