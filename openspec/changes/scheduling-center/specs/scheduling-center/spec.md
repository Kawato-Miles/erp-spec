## ADDED Requirements

### Requirement: 排程中心待排區

系統 SHALL 在排程中心提供「待排區」，顯示所有已建立但尚未排入設備佇列的生產任務。待排區 SHALL 依交期急迫度排序（交貨日期最早者優先），並顯示每筆任務的相依性狀態。

待排區 SHALL 顯示以下資訊：任務編號、所屬工單編號、印件名稱、工序、工廠類型、預估工期、交貨日期、前置任務狀態（已完成 / 已排程 / 待排 / 無前置）。

僅顯示所屬任務（Task）狀態為「待交付」之前（含製程審核完成後）且 equipment_id 為空的生產任務。

#### Scenario: 印務開啟排程中心查看待排區

- **WHEN** 印務開啟排程中心
- **THEN** 系統 SHALL 在左側待排區顯示所有 equipment_id 為空的生產任務
- **AND** 任務 SHALL 依交貨日期遞增排序，交期相同時依建立時間遞增排序
- **AND** 每筆任務 MUST 顯示：任務編號、工單編號、印件名稱、工序、工廠類型、預估工期、交貨日期

#### Scenario: 待排區顯示前置任務狀態

- **WHEN** 某生產任務的 stage_order > 1（存在前置階段）
- **THEN** 系統 SHALL 在待排區標示前置任務狀態：
  - 前置階段所有任務已完成：顯示「前置：已完成」
  - 前置階段所有任務已排入設備：顯示「前置：已排程」
  - 前置階段有任務尚在待排區：顯示「前置：待排」
- **AND** 無前置任務（stage_order = 1 或無 stage_order）的生產任務 SHALL 顯示「前置：無」

#### Scenario: 外包類任務不顯示在待排區

- **WHEN** 生產任務的 factory_type 為「外包廠」或工序不需要自有設備
- **THEN** 系統 MUST NOT 在待排區顯示該任務
- **AND** 該任務 SHALL 顯示在外包追蹤區

#### Scenario: 待排區急件標記

- **WHEN** 生產任務所屬印件的交貨日期在今天起 3 天內（含今天）
- **THEN** 系統 SHALL 以紅色標記該任務為急件
- **AND** 急件 SHALL 排在待排區最前方（在交期排序之上加權）

### Requirement: 設備佇列管理

系統 SHALL 在排程中心右側提供設備佇列視圖，每台啟用中的設備顯示為一個獨立佇列。印務 SHALL 可將待排區的生產任務拖入設備佇列，調整佇列內的任務順序。

佇列內任務 SHALL 依 queue_position 遞增排列。印務調整順序時，系統 SHALL 自動更新相關任務的 queue_position。

#### Scenario: 印務將任務排入設備佇列

- **WHEN** 印務將待排區的生產任務拖入「海德堡四色機」佇列
- **THEN** 系統 SHALL 將該任務的 equipment_id 設為該設備的 ID
- **AND** 系統 SHALL 將 queue_position 設為佇列末尾（現有最大值 + 1）
- **AND** 該任務 SHALL 從待排區移除，顯示在設備佇列中

#### Scenario: 印務調整佇列內任務順序

- **WHEN** 印務在設備佇列中將位置 #3 的任務拖到位置 #1
- **THEN** 系統 SHALL 更新所有受影響任務的 queue_position
- **AND** 佇列內所有任務的日期 SHALL 依新順序自動重算

#### Scenario: 印務將任務從佇列移回待排區

- **WHEN** 印務將設備佇列中的任務拖回待排區
- **THEN** 系統 SHALL 清除該任務的 equipment_id 與 queue_position
- **AND** 系統 SHALL 清除該任務的 scheduled_date 與 planned_end_date
- **AND** 佇列內後續任務的日期 SHALL 自動重算

#### Scenario: 設備佇列顯示負載摘要

- **WHEN** 印務查看排程中心的設備佇列
- **THEN** 每台設備 SHALL 顯示未來三週的負載摘要：「已排 N 天 / 可用 M 天」
- **AND** M 為三週內的工作天數（排除週日）

### Requirement: 佇列式自動日期推算

系統 SHALL 依設備佇列的任務順序與工期，自動推算每筆任務的開工日（scheduled_date）與預計完工日（planned_end_date）。預設為緊密排列（前一任務完工次日即接續），印務可手動覆蓋開工日以產生空隙。

推算規則：
- 佇列首位任務：scheduled_date = 今天（若未手動設定）
- 後續任務：scheduled_date = 前一任務 planned_end_date + 1 工作天
- 若任務有跨階段相依性：scheduled_date = max(佇列推算日, 前置任務 planned_end_date + 1 工作天)
- planned_end_date = scheduled_date + estimated_duration_days（跳過週日，與 scheduling-completion-date change 一致）

#### Scenario: 佇列緊密排列推算日期

- **WHEN** 海德堡佇列有三筆任務：A（工期 2 天）、B（工期 1 天）、C（工期 3 天），A 的開工日為 4/1（週二）
- **THEN** 系統 SHALL 推算：
  - A：4/1 - 4/2
  - B：4/3 - 4/3
  - C：4/4 - 4/7（跳過 4/6 週日）

#### Scenario: 印務手動覆蓋開工日

- **WHEN** 印務手動將佇列 #2 任務的開工日設為 4/7（原推算為 4/3）
- **THEN** 系統 SHALL 保留手動設定的 4/7 為該任務的 scheduled_date
- **AND** 後續任務的日期 SHALL 從 4/7 + 工期後接續推算
- **AND** 系統 SHALL 在該任務旁標示「手動設定」提示

#### Scenario: 相依性約束優先於佇列順序

- **WHEN** 任務 B（上光，stage_order = 2）排入上光機佇列，佇列推算開工日為 4/3
- **AND** 任務 B 的前置任務 A（印刷，stage_order = 1）planned_end_date 為 4/5
- **THEN** 系統 SHALL 將任務 B 的 scheduled_date 設為 4/6（前置完工日 + 1）
- **AND** 系統 SHALL 在該任務旁標示「等待前置：印刷（4/5 完工）」

#### Scenario: 佇列順序變更觸發全部重算

- **WHEN** 印務調整設備佇列中任一任務的順序
- **THEN** 系統 SHALL 重算該佇列所有任務的 scheduled_date 與 planned_end_date
- **AND** 若有其他設備佇列的任務相依於被調整任務，相關日期亦 SHALL 重算

### Requirement: 外包追蹤區

系統 SHALL 在排程中心提供外包追蹤區，顯示所有 factory_type 為「外包廠」或「加工廠」的生產任務。外包追蹤區為追蹤看板，印務 MUST NOT 操作佇列排序（外包順序由廠商決定）。

外包追蹤區 SHALL 依工廠分組，每筆任務顯示：任務編號、工單編號、工序、狀態、預計回廠日（expected_return_date）、實際狀態標記。

#### Scenario: 印務查看外包任務狀態

- **WHEN** 印務在排程中心查看外包追蹤區
- **THEN** 系統 SHALL 顯示所有外包類生產任務，依工廠分組
- **AND** 每筆任務 MUST 顯示：任務編號、工單編號、工序、狀態（待處理/製作中/運送中）、預計回廠日

#### Scenario: 印務設定外包預計回廠日

- **WHEN** 印務為外包生產任務設定 expected_return_date
- **THEN** 系統 SHALL 記錄 expected_return_date
- **AND** 若後續自有工序相依於該外包任務，佇列日期推算 SHALL 以 expected_return_date + 1 為最早可開工日

#### Scenario: 外包任務逾期提醒

- **WHEN** 外包生產任務的 expected_return_date 早於今天，且狀態非「已完成」
- **THEN** 系統 SHALL 以紅色標記該任務為「逾期未回」
- **AND** 若有後續自有工序受影響，系統 SHALL 在對應設備佇列任務旁標示「前置逾期」

### Requirement: 三週滾動時間軸

系統 SHALL 在排程中心提供三週滾動時間軸視覺化，以設備為縱軸、日期為橫軸，甘特圖呈現各設備佇列的排程分布。時間範圍預設為本週起三週（含外包追蹤的時間區段）。

#### Scenario: 印務查看設備時間軸

- **WHEN** 印務在排程中心切換至時間軸視圖
- **THEN** 系統 SHALL 以甘特圖顯示：縱軸為各啟用設備，橫軸為日期（本週 + 未來兩週）
- **AND** 每筆任務以色塊表示，色塊長度對應工期天數
- **AND** 外包追蹤區的任務以虛線色塊表示在時間軸上

#### Scenario: 印件交貨日標示在時間軸

- **WHEN** 時間軸範圍內有印件交貨日
- **THEN** 系統 SHALL 以垂直虛線標示交貨日位置
- **AND** 虛線旁 SHALL 標注印件名稱與交貨日期

#### Scenario: 時間軸可前後捲動

- **WHEN** 印務需要查看三週以外的排程
- **THEN** 系統 SHALL 支援左右捲動時間軸，以週為單位

### Requirement: 排程中心交期預警

系統 SHALL 在排程中心底部提供印件層交期風險摘要。系統沿齊套性邏輯向上匯算：生產任務 planned_end_date → 工單預估完成日 → 印件預估完成日，與印件交貨日比對。

預警分級沿用 scheduling-completion-date change 定義：
- 紅色預警（已超期）：印件預估完成日 > 交貨日期
- 黃色預警（即將超期）：印件預估完成日在交貨日期前 2 天以內

#### Scenario: 印件交期風險顯示

- **WHEN** 排程中心計算出某印件的預估完成日超過交貨日期
- **THEN** 系統 SHALL 在交期預警區以紅色顯示：印件名稱、交貨日期、預估完成日、超期天數
- **AND** 系統 SHALL 標示瓶頸工單與瓶頸生產任務（最晚完成的那筆）

#### Scenario: 未完成排程的印件提醒

- **WHEN** 某印件的工單下有生產任務尚在待排區（未排入設備）
- **THEN** 系統 SHALL 在交期預警區標示「排程不完整：N/M 筆已排程」
- **AND** 預估完成日 SHALL 標註「基於不完整排程」

### Requirement: 部分交貨試算

系統 SHALL 提供部分交貨試算功能，印務或業務輸入印件與目標數量，系統沿齊套性公式反推各工單所需完成數量，結合排程日期以線性推算，回答「前 N 組最快何時可出貨」。

線性推算公式：某工單完成 X 個所需時間 = (X / 工單總目標數量) x 工單內最晚完工的生產任務工期，加上該任務的 scheduled_date。

#### Scenario: 業務查詢部分交貨時間

- **WHEN** 業務（或印務）在排程中心開啟部分交貨試算，選擇印件「導覽文宣組」，輸入目標數量 200
- **THEN** 系統 SHALL 計算：
  1. 反推各工單所需數量：WO-001 手冊 200 x 1 = 200 本、WO-002 折頁 200 x 1 = 200 份、WO-003 小卡 200 x 3 = 600 張
  2. 各工單內沿排程推算到達該數量的時間（線性推算）
  3. 齊套性取最慢：max(各工單到達時間)
- **AND** 系統 SHALL 顯示結果：「前 200 組最快 X 月 Y 日可出貨」
- **AND** 系統 SHALL 列出各工單的預估到達時間，標示瓶頸工單

#### Scenario: 部分交貨試算遇到未排程任務

- **WHEN** 某工單的生產任務尚未全部排入設備佇列
- **THEN** 系統 SHALL 標示「此工單排程不完整，結果為估算」
- **AND** 系統 SHALL 以最晚交貨日作為未排程任務的假設完工日進行推算

#### Scenario: 部分交貨試算遇到外包任務

- **WHEN** 某工單的生產鏈包含外包任務
- **THEN** 系統 SHALL 以 expected_return_date 作為該任務的完工日進行推算
- **AND** 若 expected_return_date 未設定，系統 SHALL 標示「外包回廠日未設定，無法精確推算」

### Requirement: 工期預設值

系統 SHALL 依「工序 x 工廠類型」組合提供工期預設值。印務在排程中心排入設備佇列時，若 estimated_duration_days 尚未填寫，系統 SHALL 自動帶入預設值。印務可隨時修改。

預設值對照表（初始值，可由系統管理員調整）：

| 工序類型 | 工廠類型 | 預設工期（天）|
|---------|---------|-------------|
| 印刷 | 自有工廠 | 1 |
| 上光 | 自有工廠 | 1 |
| 裁切 | 自有工廠 | 1 |
| 摺紙 | 自有工廠 | 1 |
| 裝訂 | 自有工廠 | 2 |
| 一般加工 | 外包廠 | 5 |
| 燙金 | 外包廠 | 5 |
| 模切 | 外包廠 | 3 |

#### Scenario: 自動帶入工期預設值

- **WHEN** 印務將工序為「印刷」、工廠類型為「自有工廠」的生產任務排入設備佇列
- **AND** 該任務的 estimated_duration_days 尚未填寫
- **THEN** 系統 SHALL 自動設定 estimated_duration_days = 1
- **AND** 印務 SHALL 可在佇列內直接修改工期

#### Scenario: 已填寫工期的任務不覆蓋

- **WHEN** 印務將已填寫 estimated_duration_days = 3 的生產任務排入設備佇列
- **THEN** 系統 MUST NOT 覆蓋已填寫的工期值
