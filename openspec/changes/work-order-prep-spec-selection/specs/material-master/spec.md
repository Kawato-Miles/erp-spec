# material-master delta：備料規格層

## ADDED Requirements

### Requirement: 備料規格

系統 SHALL 於 `pricing_type = 按重量` 的材料規格下提供備料規格子表（MaterialSpecPrepEntry）：備料名稱、備料尺寸（寬／長）與尺寸單位、開料數、所屬供應商原料（該規格重量計價尺寸表的一列）。所屬供應商原料與開料數 SHALL 必填；所屬供應商原料 SHALL 限同一材料規格下的列。按面積、按數量材料 SHALL NOT 建備料。備料 SHALL NOT 帶價格欄，價格一律在其供應商原料列。備料 SHALL NOT 承載設備關聯（原「適用設備」已移除）；材料與設備的可用性判斷只依 § 設備約束欄位。整張上機 SHALL 以一筆同尺寸、開料數 1 的備料表達。

欄位正本見 wiki [材料主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/材料主檔.md) § 備料規格。

**Priority**: P0

**Rationale**: 印務在工單上決定的是備成什麼尺寸上機，不是買進哪張整紙；備料層把「上機的紙」與「買進的紙」分開，材料費才能從上機張數換算回採購張數。備料不帶價格與設備，是因為價格已在供應商原料列、機台由印務判斷，再存一份就是兩地維護。

#### Scenario: 建立備料規格

- **GIVEN** 一級卡 300g（按重量）已有供應商原料列「四六全 787×1091」
- **WHEN** 印務新增備料「名片八開」393×272、開料數 8、所屬供應商原料四六全
- **THEN** 系統 SHALL 建立該備料；未填所屬供應商原料或開料數時 SHALL 擋下

#### Scenario: 按面積材料不得建備料

- **WHEN** 印務嘗試於按面積材料的規格下新增備料
- **THEN** 系統 SHALL 阻擋

#### Scenario: 備料改值不回寫已建任務

- **GIVEN** 某備料已被生產任務引用
- **WHEN** 印務把該備料開料數由 8 改為 6
- **THEN** 已建任務 SHALL 維持凍結的開料數 8 與材料費；新建任務取 6

## MODIFIED Requirements

### Requirement: 設備約束欄位

系統 SHALL 於 MaterialSpec 層提供設備約束欄位（最小 / 最大長邊、最小 / 最大短邊、起始倍數、最小面積），用於判斷設備是否能使用此材料。這些欄位 MUST 不用於成本計算。材料與設備的關聯僅此一途；備料規格層 SHALL NOT 承載設備關聯。

#### Scenario: 判斷設備可用性

- **WHEN** 系統於生產排程或工單建立時，評估設備與材料的匹配性
- **THEN** 系統 SHALL 依設備的承受尺寸範圍與材料規格的尺寸約束欄位比對，篩選可用設備

### Requirement: 生產任務引用材料規格

系統 SHALL 支援生產任務引用材料規格，除主檔項目外另記錄 `pricing_selection`（計價鍵）：按重量材料的計價鍵 SHALL 為備料規格（含其所屬供應商原料），按面積為面積區間與面積數值，按數量無計價鍵。生產任務的**廠商類別 SHALL 由所引用材料主檔項目的承作廠商決定且對印務唯讀**——承作廠商留空即自有工廠，填外部廠商時依該廠商的類別（加工廠／外包廠／中國廠商）帶出。BOM SHALL NOT 規定某類主檔只能配某類廠商。

pricing_selection SHALL 由部件配方工序段展開帶出（按重量材料的備料規格）或印務手選；系統 SHALL NOT 預填、SHALL NOT 留存系統預設值與覆寫值兩版（與 work-order spec § 生產任務目標數量預設與放損率「系統不預填」一致）。所選備料規格與其供應商原料列參數 SHALL 於選定當下凍結。

**Priority**: P0

**Rationale**: 執行方（自有或外發）的決策必須只有一個來源。若生產任務可人工改廠商類別，同一道工序會出現「BOM 說外包、任務說自有」兩個真相，外包成本與派單的產生條件都會跟著錯。

#### Scenario: 承作廠商決定廠商類別

- **GIVEN** 材料主檔項目的承作廠商為外部廠商、類別為加工廠
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的廠商類別為加工廠且唯讀

#### Scenario: 承作廠商留空即自有工廠

- **GIVEN** 材料主檔項目的承作廠商留空
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的廠商類別為自有工廠、不產生派單

#### Scenario: 按重量材料的 pricing_selection 為備料規格

- **WHEN** 印務於製程規劃建立引用按重量材料規格的生產任務
- **THEN** 系統 SHALL 提供該規格的備料列供選（或帶出配方段指定者），SHALL NOT 提供供應商原料列直選、SHALL NOT 預填

### Requirement: 成本計算流程

系統 SHALL 依 pricing_selection 回查對應 PricingRule 的單價，乘以生產任務用量（依計價方式換算）得出材料成本。按重量材料的用量 SHALL 為整紙張數＝ceil(任務目標數量（備料張）÷ 所選備料的開料數)。

#### Scenario: 按重量材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ prep_entry: "名片八開", weight_entry: "四六全" }`，規格子類型 = 重量計，目標數量 628 張備料、開料數 8
- **THEN** 系統 SHALL 依四六全列的重量與噸價套用公式計算整紙單張價，乘以 ceil(628 ÷ 8)＝79 張

#### Scenario: 按面積材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ area_range: "100-199", qty_range: "1-99" }`
- **THEN** 系統 SHALL 查 price_matrix[100-199][1-99] 取得單價，乘以用量

#### Scenario: 按數量材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ qty_tier: "100-199" }`，印量 150 件，該級距單價 4 元/件
- **THEN** 材料成本 SHALL = 4 × 150 = 600 元

---
