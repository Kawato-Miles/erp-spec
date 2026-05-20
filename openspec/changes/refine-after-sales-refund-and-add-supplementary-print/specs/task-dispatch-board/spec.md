## MODIFIED Requirements

### Requirement: 工序卡片內任務明細表

每張工序卡片內 SHALL 以表格顯示生產任務明細。表格欄位 MUST 包含：勾選框、任務編號、所屬工單號、印件名稱、**印件類型（本 change 新增）**、目標數量（pt_target_qty）、工廠、設備、狀態、操作。

**[本 change 新增] 印件類型欄位**：派工看板工序卡片內任務明細表 SHALL 在「印件名稱」欄位後新增「印件類型」欄位，呈現規範依 [prototype-shared-ui spec § 列表頁印件類型欄位通用設計](../prototype-shared-ui/spec.md) — 三值通用（打樣 / 大貨 / 補印），印務主管 / 生管可即時識別補印任務優先排程。

工序卡片頂部 SHALL 提供「印件類型」filter（chip-style multi-select，三選項可複選），讓印務主管快速篩出補印任務優先派工。

#### Scenario: 任務明細顯示

- **WHEN** 生管展開某工序卡片
- **THEN** 表格每列顯示一筆生產任務，包含上述所有欄位（含印件類型）
- **AND** 狀態以色彩徽章顯示
- **AND** 印件類型以 `PrintItemTypeLabel` 元件呈現

#### Scenario: 依狀態排序

- **WHEN** 同工序內有「待處理」與「製作中」任務並存
- **THEN** 「待處理」任務排在前面，「製作中」任務排在後面

#### Scenario: 印務主管以印件類型 filter 鎖定補印任務（新規）

- **GIVEN** 「平版印刷」工序卡片內有 10 筆任務（7 大貨、3 補印）
- **WHEN** 印務主管於該卡片 filter 取消勾選「大貨」，只保留「補印」
- **THEN** 該工序卡片任務明細表 SHALL 僅顯示 3 筆補印任務
- **AND** 印務主管 SHALL 可優先勾選這 3 筆批次派工，提升補印製作優先度

#### Scenario: 補印任務 hover 顯示來源 ticket

- **GIVEN** 工序卡片內含 1 筆補印任務（對應印件 PI-101，補印來自 AS-001）
- **WHEN** 印務主管 hover 該任務的「補印」標籤
- **THEN** 系統 SHALL 顯示 tooltip「補印（AS-001）」
- **AND** click SHALL 跳轉至 ticket AS-001 詳情頁
