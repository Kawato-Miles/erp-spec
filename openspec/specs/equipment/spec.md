# equipment Specification

## Purpose
設備主檔 -- 維護工廠內所有設備的基本資料：名稱、適用工序（能力標籤）、所屬產線標籤、啟用狀態、每日可用時數，以及印刷計價參數與自身成本參數。

**範圍**：主檔維護與停用連動。設備佇列、負荷與停機的可視化歸 [production-overview](../production-overview/spec.md)（M3）；選機由印務於製程規劃時決定，見 [work-order](../work-order/spec.md) § 製程規劃。

**正本邊界**：欄位表見 wiki [設備](../../../memory/Sens_wiki/wiki/erp/05-entities/設備.md)、產線標籤見 wiki [產線](../../../memory/Sens_wiki/wiki/erp/05-entities/產線.md)、計價參數的計算框架見 wiki [BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md) § 計價引擎計算框架。
## Requirements
### Requirement: 設備主檔管理

系統 SHALL 提供設備主檔，維護工廠內所有設備的基本資料。每筆設備 MUST 包含：設備名稱、適用工序（能力標籤，選機匹配的依據）、所屬產線、啟用狀態、每日可用時數，以及印刷計價參數（開機費、階梯價、色數模式與特殊色倍率）與自身成本參數（折舊、固定開機損）。

所屬產線 SHALL 為產線標籤（印件、BOM 部件配方工序段與設備三個掛點共用同一套標籤，正本見 wiki [產線](../../../memory/Sens_wiki/wiki/erp/05-entities/產線.md)），SHALL NOT 為獨立於標籤之外的固定枚舉。設備主檔的維護責任為印務。欄位定義的正本見 wiki [設備](../../../memory/Sens_wiki/wiki/erp/05-entities/設備.md)。

設備停用時，已排入其佇列的生產任務 SHALL 移回待排區並提示筆數；佇列與負荷的呈現歸 `production-overview`（M3），本 spec 不規範其版型。

**Priority**: P0

**Rationale**: 設備側原本掛一套固定產線枚舉，與印件與 BOM 掛的產線標籤是兩套字典，M3 的產線視角要同時彙總設備佇列與工作包負荷時就需要一張人工維護的對照表——那張表就是下一個矛盾來源。

#### Scenario: 新增設備掛產線標籤

- **WHEN** 印務新增設備「海德堡 SM102 四色機」，適用工序選平版印刷、所屬產線選標籤「平版線」
- **THEN** 系統建立設備記錄，狀態預設啟用、每日可用時數預設 8 小時
- **AND** 該設備出現在產線視角的「平版線」分組下

#### Scenario: 停用設備後任務移回待排區

- **WHEN** 印務將某設備改為停用
- **THEN** 該設備不再出現於設備視角，已排入其佇列的生產任務移回待排區，系統提示有 N 筆需重新排程

#### Scenario: 設備名稱不可重複

- **WHEN** 印務嘗試新增與現有設備同名的設備
- **THEN** 系統阻擋並提示名稱已存在
