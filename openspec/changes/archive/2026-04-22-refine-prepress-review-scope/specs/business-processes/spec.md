## MODIFIED Requirements

### Requirement: 稿件管理規則

一個印件 SHALL 可包含多個檔案，並以 ReviewRound（審稿回合）為聚合單位管理。每次審稿人員送出審核皆 MUST 產生一筆 ReviewRound，聚合當輪的原稿、加工檔、縮圖與結果。

**備註欄位雙向切分**（本 change 明確化）：
- 印件 SHALL 持有 **`client_note`**（稿件備註）：會員（B2C）/ 業務（B2B）提供印件時寫給審稿人員的單向說明，印件 1:1、跟著印件走、**不跟 ReviewRound 輪次**。生命週期為印件首次建立時填寫，補件階段不再更新（詳見 [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)）。
- ReviewRound SHALL 持有 **`review_note`**（審稿備註）：審稿人員寫給補件方 / 後續角色的每輪備註，合格 / 不合格皆可填；每輪各自保留不覆寫；**送出後允許原審稿人員修改**，每次修改寫入印件 ActivityLog「審稿備註修改」事件，並於補件方在線時觸發即時通知（詳見 [prepress-review spec § 審稿備註修改稽核](../prepress-review/spec.md)）。
- 印件層 SHALL 透過 `current_round_id → review_note` 顯示最新一筆審稿備註給印務 / 後續角色；審稿備註修改會即時反映於此。

印件的合格稿件版本 SHALL 鎖定於合格輪次（`PrintItem.current_round_id` 指向的 Round）。工單建立時，系統 MUST 鎖定當時 current_round_id 指向的 Round 的**加工檔與縮圖**；後續該印件再經異動或補件重審（產生新輪次）時，已建立的工單 SHALL 不受影響，除非走工單異動流程。**備註不納入鎖定範圍**：工單只鎖檔案，不鎖備註；review_note 後續修改 SHALL 反映於印件層顯示與工單單據可見的最新內容（審稿糾正打錯字能即時傳到下游印務），ActivityLog 保留歷次修改供稽核還原。

歷史 ReviewRound SHALL 完整保留（含原稿、加工檔、備註現值、結果、時間、審稿人員），備註歷次修改紀錄由印件 ActivityLog 提供，供追溯與稽核使用。

#### Scenario: 工單建立時鎖定合格輪次檔案

- **WHEN** 印務為某印件建立工單
- **THEN** 系統 SHALL 鎖定該印件當時 `current_round_id` 指向的 ReviewRound 底下的加工檔與縮圖
- **AND** 後續該印件產生新輪次 SHALL **不**影響已建立的工單
- **AND** review_note 不納入鎖定範圍（見下方 scenario）

#### Scenario: 多輪送審歷史保留

- **GIVEN** 印件經歷 3 輪審稿（第 1 輪不合格、第 2 輪不合格、第 3 輪合格）
- **WHEN** 任一角色檢視印件詳情頁
- **THEN** 系統 SHALL 呈現全部 3 輪的完整紀錄（檔案、結果、備註現值）
- **AND** 備註歷次修改 SHALL 於印件 ActivityLog 中查詢

#### Scenario: 兩種備註欄位的讀取路徑

- **WHEN** 任一角色需查看印件上的文字備註
- **THEN** 系統 SHALL 依語意分流：
  - 會員 / 業務對審稿的稿件說明 → 讀 `PrintItem.client_note`
  - 審稿人員對補件方 / 下游的備註歷史 → 讀各輪 `ReviewRound.review_note`（各輪現值）
  - 印件層最新審稿結論 → 讀 `PrintItem.current_round_id → ReviewRound.review_note`
  - 備註歷次修改軌跡 → 讀印件 ActivityLog「審稿備註修改」事件

#### Scenario: 工單鎖定後審稿備註修改不影響檔案鎖定

- **GIVEN** 印件第 3 輪合格，工單已依此輪建立並鎖定加工檔與縮圖
- **WHEN** 審稿人員回頭修改第 3 輪的 review_note
- **THEN** 系統 SHALL 允許修改並寫入印件 ActivityLog
- **AND** 工單的**檔案**鎖定不受影響（檔案仍為建單當下版本）
- **AND** 工單單據顯示的「審稿備註」SHALL 反映最新版（讓糾正能傳到下游印務）
- **AND** 若需追查工單建立時的備註版本，SHALL 查印件 ActivityLog 的時間序列
