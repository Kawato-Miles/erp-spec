## ADDED Requirements

### Requirement: 訂單審稿完成冗餘欄位

`Order` SHALL 具備兩個冗餘欄位，反映「訂單審稿全部完成」的時間戳與歸屬，支援 Dashboard 訂單級統計查詢、歷史凍結與效能 O(n) 查詢。

**欄位定義**（加入 `Order` § Data Model）：

- `prepressApprovedAt: timestamp | null`
  - 語意：訂單所有非 `skipReview` 印件首次全部進入 `reviewDimensionStatus = '合格'` 的時間
  - 生命週期：由 `business-processes § 審稿合格後自動建工單` 章節定義的 hook 在印件狀態轉為合格時寫入；一經寫入**不得變動**
  - 初始值：NULL
- `primaryContributorId: reviewerId | null`
  - 語意：訂單主要貢獻者（依「主要貢獻者歸屬演算法」：審最多印件者 → 平手時取收尾者 → 再平手取 `reviewerId` 字典序最小者）
  - 生命週期：與 `prepressApprovedAt` 同時寫入；快照凍結，不隨 reviewer 停用 / 離職而變動
  - 初始值：NULL

**凍結規則**：

- 一旦寫入，即便後續重審退件使任一印件退出合格狀態，兩欄位 MUST NOT 清空或覆寫
- 若訂單最終從未達成全印件合格（例如長期卡在不合格），兩欄位保持 NULL

**資料遷移**：

- 既有 Order 初始化為 NULL
- Prototype 階段 mock 資料重跑即可；無歷史回填需求

**排除規則**：

- 若訂單所有印件皆 `skipReview = true`（免審訂單），兩欄位 MUST 保持 NULL（不寫入）

#### Scenario: 訂單首次達成全印件合格時寫入

- **GIVEN** 訂單 O-001 有印件 P1、P2、P3；P1 於 9/10 合格、P2 於 9/15 合格
- **WHEN** P3 於 9/20 轉為合格
- **THEN** 系統 SHALL 將 `Order.prepressApprovedAt` 設為 9/20
- **AND** `Order.primaryContributorId` SHALL 設為該訂單主要貢獻者

#### Scenario: 已寫入後重審退件不清空欄位

- **GIVEN** 訂單 O-002 已於 9/20 寫入 `prepressApprovedAt = 9/20`、`primaryContributorId = 小陳`
- **WHEN** 10/1 P3 因客戶變更稿件重建新 Round 並退件，印件當前狀態變為 `不合格`
- **THEN** 系統 MUST NOT 清空 `Order.prepressApprovedAt`
- **AND** 系統 MUST NOT 清空 `Order.primaryContributorId`
- **AND** Dashboard 查詢「9 月訂單合格數」時 O-002 仍計入 9 月（歷史凍結）

#### Scenario: 從未達成全合格的訂單保持 NULL

- **GIVEN** 訂單 O-003 有印件 P1（合格）、P2（長期不合格）
- **WHEN** 主管於任何時間查詢該訂單
- **THEN** `Order.prepressApprovedAt` SHALL 為 NULL
- **AND** `Order.primaryContributorId` SHALL 為 NULL

#### Scenario: 全免審訂單不寫入欄位

- **GIVEN** 訂單 O-004 所有印件皆 `skipReview = true`
- **WHEN** 所有印件透過免審路徑直接合格
- **THEN** `Order.prepressApprovedAt` SHALL 保持 NULL
- **AND** `Order.primaryContributorId` SHALL 保持 NULL
- **AND** 該訂單 MUST NOT 計入 Dashboard 的「訂單合格數」

#### Scenario: 含免審 + 審稿混合訂單

- **GIVEN** 訂單 O-005 P1（`skipReview = true`）、P2（審稿流程）
- **WHEN** P2 於 9/15 合格
- **THEN** 系統 SHALL 將 `Order.prepressApprovedAt` 設為 9/15
- **AND** `Order.primaryContributorId` SHALL 設為 P2 合格 Round 的 reviewerId
- **AND** 判定條件「所有非 skipReview 印件皆合格」於 P2 合格後即滿足

#### Scenario: 離職 reviewer 的歸屬保留

- **GIVEN** 訂單 O-006 主要貢獻者為小陳，`Order.primaryContributorId = 小陳`
- **WHEN** 小陳於之後被設為停用（離職）
- **THEN** `Order.primaryContributorId` MUST NOT 變更
- **AND** Dashboard 統計仍將該訂單歸屬於小陳（UI 可標「已離職」）
