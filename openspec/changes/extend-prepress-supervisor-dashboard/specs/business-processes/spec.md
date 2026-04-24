## MODIFIED Requirements

### Requirement: 審稿階段流程

業務流程「審稿階段」SHALL 遵循下列順序：

1. **觸發**：訂單付款成功（B2C）或訂單建立並付款（B2B）→ 系統執行自動分配演算法（見 prepress-review capability）
2. **首審**：被分配的審稿人員下載原稿、加工、上傳加工檔與縮圖、送審 → 結果為「合格」或「不合格」
3. **分支 A（合格）**：印件進入「合格」終態 → 系統執行下列動作（順序如下，合併於同一 transaction）：
   a. **訂單合格冗餘欄位寫入（新）**：若 `Order.prepressApprovedAt === NULL` 且訂單內**所有非 `skipReview` 印件**的當前 `reviewDimensionStatus === '合格'`，系統 SHALL 寫入：
      - `Order.prepressApprovedAt = now`
      - `Order.primaryContributorId = identifyPrimaryContributor(order)`（依 prepress-review capability 的主要貢獻者歸屬演算法）
      - 若訂單**全部**印件皆為 `skipReview = true`（全免審訂單），系統 MUST NOT 寫入上述兩欄位
      - 一經寫入，兩欄位 **MUST NOT** 被任何後續 action 清空或覆寫（凍結規則，見 order-management capability）
   b. **依訂單來源建工單**：
      - **B2C 訂單**：商品主檔已定義材料 / 工序 / 裝訂，系統 SHALL 自動建立工單並帶入生產任務（工單 + 生產任務一次建齊）
      - **B2B 訂單**：系統 SHALL 建立空工單草稿，生產任務由印務主管後續手動拆分（沿用 user-roles spec 既有「印務主管分配工單給印務」流程）
4. **分支 B（不合格）**：印件進入「不合格」狀態，ReviewRound 記錄 `reject_reason_category`（LOV 必填，見 PI-009）與 `review_note`（選填補充）→ 系統通知補件方（B2C 客戶 / B2B 業務），通知內容含分類與備註 → 補件方上傳補件 → 印件進入「已補件」→ 回到原審稿人員再審 → 回到步驟 2

**重要凍結規則**：
- 冗餘欄位寫入條件 `Order.prepressApprovedAt === NULL` 確保僅寫入一次
- 若訂單已寫入冗餘欄位後，任一印件因「重建新印件」「客戶變更稿件」等動作導致當前狀態退出合格，**不觸發清空或重新寫入**
- Dashboard 層依此凍結值做歷史統計，不因後續重審改寫

免審稿印件 SHALL 跳過步驟 1-2，系統直接建立 `source=免審稿` 的 ReviewRound（見 prepress-review spec），印件狀態直接為「合格」，並按分支 A 流程（含 3.a 冗餘欄位寫入判定）繼續。

**合格為終態**：合格後若需變更印件內容 SHALL 透過「棄用原印件 + 建立新印件」處理，不回退至審稿階段。

#### Scenario: 付款後觸發自動分配

- **WHEN** 訂單付款成功
- **AND** 訂單內存在未走免審路徑的印件
- **THEN** 系統 SHALL 對每一筆印件執行自動分配演算法
- **AND** 分配結果 SHALL 記錄於該印件的 ActivityLog

#### Scenario: B2C 合格後自動建工單並帶入生產任務

- **GIVEN** 印件屬於 B2C 訂單，對應商品主檔已定義材料 / 工序 / 裝訂
- **WHEN** 審稿人員送審為「合格」（或免審路徑自動合格）
- **THEN** 系統 SHALL 執行訂單合格冗餘欄位寫入判定（步驟 3.a）
- **AND** 系統 SHALL 自動建立工單
- **AND** 系統 SHALL 依商品主檔的工序定義自動建立對應生產任務
- **AND** 印務主管 SHALL 不需額外操作即可進入後續派工

#### Scenario: B2B 合格後建立空工單草稿

- **GIVEN** 印件屬於 B2B 訂單（自需求單建立）
- **WHEN** 審稿人員送審為「合格」
- **THEN** 系統 SHALL 執行訂單合格冗餘欄位寫入判定（步驟 3.a）
- **AND** 系統 SHALL 建立一張空工單草稿（僅帶入印件基本資訊，生產任務為空）
- **AND** 印務主管 SHALL 於工單草稿中手動拆分生產任務並指派印務

#### Scenario: 免審稿印件跳過審稿階段並建立 source=免審稿 Round

- **GIVEN** 印件走免審稿快速路徑
- **WHEN** 訂單付款成功
- **THEN** 系統 SHALL 建立 `source=免審稿, result=合格, reviewer_id=NULL` 的 ReviewRound
- **AND** 設 PrintItem.current_round_id 指向此 Round
- **AND** 印件 SHALL 不進入自動分配與審稿人員待審列表
- **AND** 系統 SHALL 執行訂單合格冗餘欄位寫入判定（步驟 3.a；若為全免審訂單則跳過寫入）
- **AND** 系統依 B2C / B2B 分流執行合格後建工單流程

#### Scenario: 訂單最後一件合格時寫入冗餘欄位

- **GIVEN** 訂單 O-001 有印件 P1（9/10 合格）、P2（9/15 合格）、P3（尚未合格）
- **AND** `Order.prepressApprovedAt === NULL`
- **WHEN** P3 於 9/20 轉為 `reviewDimensionStatus = '合格'`
- **THEN** 系統 SHALL 檢查訂單內所有非 `skipReview` 印件的當前狀態
- **AND** 判定成立（三件皆合格）後，系統 SHALL 寫入 `Order.prepressApprovedAt = 9/20` 與 `Order.primaryContributorId = 主要貢獻者`

#### Scenario: 非最後一件合格時不寫入冗餘欄位

- **GIVEN** 訂單 O-002 有印件 P1（9/10 合格）、P2（尚未合格）
- **WHEN** P1 於 9/10 轉為合格
- **THEN** 系統 SHALL 檢查訂單內所有非 `skipReview` 印件
- **AND** 判定不成立（P2 未合格），系統 MUST NOT 寫入 `Order.prepressApprovedAt`

#### Scenario: 重審退件不影響已寫入的冗餘欄位

- **GIVEN** 訂單 O-003 已於 9/20 寫入 `prepressApprovedAt = 9/20`
- **WHEN** 10/1 P3 因客戶變更稿件重建新 Round 並退件，當前狀態為「不合格」
- **THEN** 系統 MUST NOT 清空 `Order.prepressApprovedAt`
- **AND** 系統 MUST NOT 重新寫入或覆寫
- **AND** Dashboard 統計 9 月訂單合格數時 O-003 仍計入 9 月

#### Scenario: 全免審訂單不寫入冗餘欄位

- **GIVEN** 訂單 O-004 所有印件皆 `skipReview = true`
- **WHEN** 所有印件透過免審路徑直接合格
- **THEN** 系統 MUST NOT 寫入 `Order.prepressApprovedAt` 或 `Order.primaryContributorId`
- **AND** 該訂單 MUST NOT 計入 Dashboard 訂單合格數
