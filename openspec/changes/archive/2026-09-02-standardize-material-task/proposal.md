## Why

### Background

生產任務是標準化結構這件事於 2026-09-02 由 Miles 拍板。商業正本已落卡：

- [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)（報工變體收為場內與外發回廠兩種、刪領用量欄、材料成本與料帳平衡改掛生產數量累計）
- [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)（§ 數量「欄位結構不依任務類型分支」、放損率三類一律顯示、需轉交三類一體適用且預設是）
- [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)（完成判定依廠商類別取數：場內看投入累計、外發看產出累計）
- [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)（報工內容與完成取數的變體措辭改場內與外發回廠）
- [工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)（刪材料型需轉交固定為否的例外、不需轉交前置的到料量正名為已報工的生產數量）
- [齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)（例子 3 材料型任務列改記生產數量與良品、不良品）
- [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)（料帳平衡的實際領用側改取材料型任務生產數量累計；材料數量單位依計價方式分張與件兩種）
- [工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)（材料清單段的材料行改為報工、完成判定與轉交同工序任務）
- [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)（實際成本的材料分項改取生產數量累計 × 材料單價）

落卡紀錄見 [wiki/log.md](../../../memory/Sens_wiki/wiki/log.md) 2026-09-02「材料型生產任務標準化」條目。

### Problem Statement

五份 spec 把「材料型」寫成一個處處分支的特例，與拍板後的商業正本相反：

1. `production-execution` 讓材料型報工只填領用量一欄、報工即完成、固定不需轉交，並以此為完成判定三變體與到料取數分支的依據。
2. `work-order` 同樣寫材料型固定不需轉交、放損率僅工序型顯示、實際成本的材料分項取領用量；製程規劃的計畫設備只提工序型與裝訂型，與材料型任務放損取計畫設備固定開機損自相矛盾。
3. `recipe-expansion` 的展開理由只交代材料型要能被派工報工，未交代它與其他兩類走同一套執行規則。
4. `production-overview` 與 `order-management` 的成本取數仍寫領用量，該欄已不存在。
5. `work-order` 的單位對照把材料型硬綁「張」，與材料數量單位依計價方式分張與件兩種相反。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：報工變體收為兩種（場內、外發回廠），領用量欄相關規格改為生產數量；材料型任務的完成判定改與場內其他任務同一取數；材料型需轉交由固定為否改為預設是、印務可標例外；到料取數不再依任務類型分支；報工作廢的兩道檢核改依需轉交與否分流、不再點名任務類型。
- `work-order`：材料型需轉交改與其他任務同規則；放損率三類任務一律顯示、無值填「—」；材料實際成本取生產數量累計 × 材料單價；計畫設備的指定範圍含材料型；單位對照改依所引用主檔項目的計價方式推導。
- `recipe-expansion`：明訂展開出的材料型任務與工序型、裝訂型走同一套報工、完成判定與轉交規則。
- `production-overview`：成本達成率的材料分項來源改生產數量累計。
- `order-management`：印件詳情頁實際成本段的材料分項來源改生產數量累計。

**BREAKING**：材料型生產任務的需轉交預設值由否改為是，其下游到料量的取數隨之由「上游報工量」改為「轉交單已點收量」，除非印務標為不需轉交。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `production-execution`：Requirement「拉料備料」、「報工」、「報工數量上限警示」、「報工作廢與留痕」、「需轉交標記的適用與變更把關」、「派工前置檢查」、「生產任務狀態轉換」。
- `work-order`：Requirement「製程規劃」、「生產任務結構與帶入規則」、「生產任務單位呈現」、「生產任務目標數量預設與放損率」、「工單成本對照」。
- `recipe-expansion`：Requirement「配方段展開為生產任務」。
- `production-overview`：Requirement「六指標」。
- `order-management`：Requirement「印件詳情頁工單與生產任務區塊」。

## Impact

- 受影響 spec：`openspec/specs/production-execution/spec.md`、`openspec/specs/work-order/spec.md`、`openspec/specs/recipe-expansion/spec.md`、`openspec/specs/production-overview/spec.md`、`openspec/specs/order-management/spec.md`。
- 後端 `sens-print-core`：報工欄位由三變體收為兩變體（材料型任務改收生產數量、良品數、不良品數、實際工時）；材料型任務完成判定改投入累計達標；需轉交預設值與到料取數改寫；材料成本改取生產數量累計。
- 前端：現場報工介面的材料型任務改用場內報工同一表單；製程規劃的放損率欄對材料型與裝訂型顯示「—」；需轉交欄對材料型開放編輯。
- Prototype：報工表單、生產任務欄位表與成本對照三處同步（另案處理）。
- Linear：工單與派工現場執行兩個 Feature 票及其 Task 票同步。
