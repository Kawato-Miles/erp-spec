---
type: meta
status: active
last-reviewed: 2026-05-21
---

# User Story 卡模板

> 給 [[erp-user-story]] skill 與 Miles 手動撰寫時複製套用。
> 規範詳見 [[README]] 與 [[wiki-schema#type=user-story]]。

複製以下 `--- 模板開始 ---` 與 `--- 模板結束 ---` 之間的內容，存為 `13-user-stories/<module>/US-<MODULE>-<NNN>-<簡述>.md`。

---

--- 模板開始 ---

```markdown
---
type: user-story
us-id: US-XX-NNN
module:
  - <module>
role:
  - "[[<角色卡，如 審稿>]]"
priority: medium
stage: business-only
status: draft
created-at: 2026-MM-DD
last-reviewed: 2026-MM-DD
source:
  - "[[<來源卡或 spec 路徑>]]"
related-spec: openspec/specs/<module>/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-XX-NNN <標題：動詞 + 名詞片語，繁體中文>

## 業務情境（穩定層）

> 階段 1：純業務描述，禁含 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）；禁中英夾雜（payment → 付款紀錄、printItem → 印件 等）。

### 作為
[[<角色名 wiki link，如 審稿>]]

### 我希望
<一句話業務動作；用介面中文；禁英文欄位名>

### 以便
<業務價值；可量化更佳，如「補件迴圈 ≤ 3 輪」「審稿員 5 分鐘內可接到通知」>

### 前置條件
- <條件 1>
- <條件 2>

### 業務流程

> 描述「業務動作」而非「UI 操作」。例：「審稿員確認稿件符合印刷規格」（業務）vs「審稿員點擊『通過』按鈕」（UI）。

1. <步驟 1，業務動作>
2. <步驟 2>
3. ...

### 成功條件（acceptance criteria）

> 2-5 條（業界共識，超過 5 建議 split story）；每條須**可驗證**（Test Case 引用）。

1. <可驗證條件 1>
2. <可驗證條件 2>
3. ...

## UI 操作（易變層）

<!-- ui-binding: draft | prototype-v1 | locked-v1.0 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/<...> -->

> 階段 2：Prototype 對應功能定案後填寫；填寫時 frontmatter `stage` 改為 `ui-bound`、補 `ui-binding`。

### 介面入口
- <Prototype 定案前留空 / 待補>

### 操作步驟
- <Prototype 定案前留空 / 待補>

### 介面元素
- <Prototype 定案前留空 / 待補>

## 來源（provenance）

> 必填 ≥ 1 條。指向 raw / spec / 業務邏輯卡 / 訪談紀錄；**禁指向其他 user-story 卡**（自迭代風險）。

- <[[來源卡]] 或 spec 路徑與 § 段>
```

--- 模板結束 ---

## 自審 checklist（INVEST 改編）

寫完後對照以下 6 點自審：

| 字母 | 含義 | 自審問題 |
|------|------|---------|
| **I** | Independent | 此 story 是否可獨立交付？是否依賴未完成的其他 story？|
| **N** | Negotiable | 描述是否預留討論空間？是否過度規範實作細節？|
| **V** | Valuable | 「以便」是否明示業務價值？是否能向利害關係人解釋價值？|
| **E** | Estimable | 是否能估規模（小時 / 故事點 / Sprint）？描述是否含糊到無法估算？|
| **S** | Small | 是否一個 Sprint 可完成？acceptance criteria 是否 ≤ 5 條？|
| **T** | Testable | 成功條件是否可驗證？Test Case 能否直接從 acceptance criteria 設計？|

## Lint 自檢（提交前）

- [ ] frontmatter 必填項全填（us-id / module / role / priority / stage / status / created-at / source）
- [ ] 業務情境段含「作為 / 我希望 / 以便 / 成功條件」全部 H3
- [ ] 業務情境段 grep 無 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 篩選器）
- [ ] 內容 grep 無英文欄位名（payment / printItem / orderAdjustment / quoteRequest / workOrder / productionTask / reviewRound / paymentPlan / afterSalesTicket）
- [ ] acceptance criteria 2-5 條
- [ ] `source` 至少 1 條，且不指向其他 user-story 卡
- [ ] 命名符合 `US-<MODULE>-<NNN>-<slug>.md`
- [ ] role 為 wiki link 至 `03-roles/`
- [ ] related-spec 指向實際存在的 spec 路徑

## 參考

- [[README]] — 13-user-stories 入口
- [[wiki-schema#type=user-story]] — frontmatter 正式規格
- [[wiki-schema#維度 13：User Story 撰寫紀律]] — lint 規則
- [[erp-user-story]] — 自動化 skill
