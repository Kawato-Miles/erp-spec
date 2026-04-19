## MODIFIED Requirements

### Requirement: 稿件管理規則

一個印件 SHALL 可包含多個檔案，並以 ReviewRound（審稿回合）為聚合單位管理。每次審稿人員送出審核皆 MUST 產生一筆 ReviewRound，聚合當輪的原稿、加工檔、縮圖與結果。

印件的合格稿件版本 SHALL 鎖定於合格輪次（`PrintItem.current_round_id` 指向的 Round）。工單建立時，系統 MUST 鎖定當時 current_round_id 指向的 Round 的加工檔與縮圖；後續該印件再經異動或補件重審（產生新輪次）時，已建立的工單 SHALL 不受影響，除非走工單異動流程。

歷史 ReviewRound SHALL 完整保留（含原稿、加工檔、備註、結果、時間、審稿人員），供追溯與稽核使用。

#### Scenario: 工單建立時鎖定合格輪次檔案

- **WHEN** 印務為某印件建立工單
- **THEN** 系統 SHALL 鎖定該印件當時 `current_round_id` 指向的 ReviewRound 底下的加工檔
- **AND** 後續該印件產生新輪次 SHALL **不**影響已建立的工單

#### Scenario: 多輪送審歷史保留

- **GIVEN** 印件經歷 3 輪審稿（第 1 輪不合格、第 2 輪不合格、第 3 輪合格）
- **WHEN** 任一角色檢視印件詳情頁
- **THEN** 系統 SHALL 呈現全部 3 輪的完整紀錄（檔案、結果、備註）

## ADDED Requirements

### Requirement: 審稿階段流程

業務流程「審稿階段」SHALL 遵循下列順序：

1. **觸發**：訂單付款成功（B2C）或訂單建立並付款（B2B）→ 系統執行自動分配演算法（見 prepress-review capability）
2. **首審**：被分配的審稿人員下載原稿、加工、上傳加工檔與縮圖、送審 → 結果為「合格」或「不合格」
3. **分支 A（合格）**：印件進入「合格」終態 → 系統依訂單來源分流建工單：
   - **B2C 訂單**：商品主檔已定義材料 / 工序 / 裝訂，系統 SHALL 自動建立工單並帶入生產任務（工單 + 生產任務一次建齊）
   - **B2B 訂單**：系統 SHALL 建立空工單草稿，生產任務由印務主管後續手動拆分（沿用 user-roles spec 既有「印務主管分配工單給印務」流程）
4. **分支 B（不合格）**：印件進入「不合格」狀態，ReviewRound 記錄 `reject_reason_category`（LOV 必填，見 PI-009）與 `review_note`（選填補充）→ 系統通知補件方（B2C 客戶 / B2B 業務），通知內容含分類與備註 → 補件方上傳補件 → 印件進入「已補件」→ 回到原審稿人員再審 → 回到步驟 2

免審稿印件 SHALL 跳過步驟 1-2，系統直接建立 `source=免審稿` 的 ReviewRound（見 prepress-review spec），印件狀態直接為「合格」，並按分支 A 流程繼續。

**合格為終態**：合格後若需變更印件內容 SHALL 透過「棄用原印件 + 建立新印件」處理，不回退至審稿階段。

#### Scenario: 付款後觸發自動分配

- **WHEN** 訂單付款成功
- **AND** 訂單內存在未走免審路徑的印件
- **THEN** 系統 SHALL 對每一筆印件執行自動分配演算法
- **AND** 分配結果 SHALL 記錄於該印件的 ActivityLog

#### Scenario: B2C 合格後自動建工單並帶入生產任務

- **GIVEN** 印件屬於 B2C 訂單，對應商品主檔已定義材料 / 工序 / 裝訂
- **WHEN** 審稿人員送審為「合格」（或免審路徑自動合格）
- **THEN** 系統 SHALL 自動建立工單
- **AND** 系統 SHALL 依商品主檔的工序定義自動建立對應生產任務
- **AND** 印務主管 SHALL 不需額外操作即可進入後續派工

#### Scenario: B2B 合格後建立空工單草稿

- **GIVEN** 印件屬於 B2B 訂單（自需求單建立）
- **WHEN** 審稿人員送審為「合格」
- **THEN** 系統 SHALL 建立一張空工單草稿（僅帶入印件基本資訊，生產任務為空）
- **AND** 印務主管 SHALL 於工單草稿中手動拆分生產任務並指派印務

#### Scenario: 免審稿印件跳過審稿階段並建立 source=免審稿 Round

- **GIVEN** 印件走免審稿快速路徑
- **WHEN** 訂單付款成功
- **THEN** 系統 SHALL 建立 `source=免審稿, result=合格, reviewer_id=NULL` 的 ReviewRound
- **AND** 設 PrintItem.current_round_id 指向此 Round
- **AND** 印件 SHALL 不進入自動分配與審稿人員待審列表
- **AND** 系統依 B2C / B2B 分流執行合格後建工單流程

---

### Requirement: 補件流程

當印件進入「不合格」狀態時，補件流程 SHALL 依訂單來源分流：

- **B2C 訂單**：補件由會員於電商前台自助完成；電商系統呼叫 ERP 介面回寫新檔並觸發狀態轉移
- **B2B 訂單**：補件由業務於 ERP 訂單詳情頁的印件入口完成

補件完成後，印件 SHALL 進入「已補件」狀態，並重新加入**原審稿人員**的待審列表（不重新執行自動分配）。若原審稿人員目前標註為不在崗，則待審案件 SHALL 於審稿主管覆寫清單中顯示，待主管轉指派後方能進入新審稿人員的待審列表。

#### Scenario: B2C 補件由電商前台觸發

- **GIVEN** B2C 印件處於「不合格」狀態
- **WHEN** 會員於電商前台上傳新檔案
- **THEN** 電商系統 SHALL 呼叫 ERP 補件介面
- **AND** ERP SHALL 新增補件檔案並將印件狀態轉為「已補件」

#### Scenario: B2B 補件由業務於訂單詳情頁觸發

- **GIVEN** B2B 印件處於「不合格」狀態
- **WHEN** 業務於訂單詳情頁點選該印件的「補件」入口並上傳新檔
- **THEN** ERP SHALL 新增補件檔案並將印件狀態轉為「已補件」

#### Scenario: 補件回原審稿人員

- **WHEN** 印件狀態由「不合格」轉為「已補件」
- **AND** 原審稿人員可用狀態為「在崗」
- **THEN** 系統 SHALL 將此印件加入原審稿人員的待審列表
- **AND** 系統 SHALL **不**重新執行自動分配演算法
