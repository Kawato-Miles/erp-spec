# 生產任務 BOM 材料選項改為備料規格層

## Why

### Background

紙張有兩層：公司向供應商買進的整張紙（供應商原料，重量計價尺寸表的每一列）與切好上機的紙（備料規格，每筆指向一列供應商原料、帶開料數）。後端 sens-print-core 於 2026-09-02 已把備料規格改為必指一列供應商原料並移除「適用設備」。wiki 已於 2026-09-07 落卡：[材料主檔](../../../memory/Sens_wiki/wiki/erp/05-entities/材料主檔.md) § 備料規格、[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 數量「備料規格」欄、[BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md) § 拼版與張數、[部件配方](../../../memory/Sens_wiki/wiki/erp/05-entities/部件配方.md) 工序段材料欄、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) § 三與 § 四。

設計正本：[work-order-prep-spec-selection-design.md](../../../work-order-prep-spec-selection-design.md)（grill 十一題拍板、plan-audit 全過、wiki 十八檔已落卡）。相依 change `work-order-material-pricing-input` 已於 2026-09-07 歸檔，本 change 在其之上 MODIFIED。

### Problem Statement

工單製程規劃時，按重量材料的材料型生產任務只能選到整張紙那一層（原名「母版規格列」）。印務真正決定的是備成什麼尺寸上機，選不到備料就填不出上機張數的來源；材料費以上機張數直接乘整張紙單價，會多算開料數倍。

## What Changes

- 「母版規格列」全庫改名「供應商原料」；材料型任務的計價選項由供應商原料改為**備料規格**（一備料一列；沒建備料的規格不出列）
- 材料費：整紙張數＝ceil(任務目標數量 ÷ 開料數)，材料費＝供應商原料單張價 × 整紙張數；工序費與設備費不變，取任務自己的目標數量（張層依任務實際處理的紙）
- 材料型任務名稱＝材料名＋規格名＋備料名稱，不加「備料」二字
- 部件配方工序段按重量材料改指備料規格；展開直接帶出，印務製程確認階段可改選、定案後走工單異動
- 凍結範圍：備料尺寸、開料數與供應商原料列全部參數
- 材料主檔 spec 補備料規格 Requirement（後端已有結構）；生產任務引用結構的 `pricing_selection` 預填與兩版留存句收斂為手選、不預填
- 單位口徑：按重量材料型任務以備料張計；良率與折損率換算句的「大紙」改「上機紙」
- 錨例：名片印件 PI-2026-0801 改用開料數 8 的備料「名片八開」，數量 615／628

## Capabilities

### Modified Capabilities

- work-order：製程規劃的材料計價選項改備料規格、材料費算式、單位呈現、凍結與異動重算
- material-master：備料規格結構、生產任務引用結構、成本計算 Scenario、設備約束說明
- recipe-expansion：展開帶出配方段指定的備料規格
- component-recipe：工序段材料引用層級
- production-execution：拉料備料的材料費數量輸入換算
- production-overview：良率換算 Scenario 用詞

## Impact

- OpenSpec：上列六份 spec
- Prototype（erp repo）：BOM 主檔 mock 補備料層、面板列展開改一備料一列、成本算式、名片錨例、規格名去尺寸
- wiki：十八檔已先行落卡（BRD 先行），本 change 不再動 wiki
- 範圍外：線上報價引擎（sensation-api）、線上單自動建工單（PT-050）、拼版代算（PT-042）、庫存模組原料扣帳
