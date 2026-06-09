---
type: meta
status: active
last-reviewed: 2026-06-10
---

# Wiki 結構與撰寫規範

> Sens ERP 商業需求 Wiki（ERP_Vault）的資訊架構正本。
> 定義分層結構、連結方向、各層模板位置。
> Vault 與 OpenSpec 的分工見專案 [CLAUDE.md](../../../../../CLAUDE.md) § wiki 與 OpenSpec 分工。

## 分層結構

每層只負責自己該負責的細緻度。上層不下放到個案、下層不僭越定價值。

| 分層 | 載體 | 職責 | 目錄 |
|------|------|------|------|
| **產品策略** | `product-vision` / `phase` / `metric` | 願景、痛點、Phase、北極星指標、利害關係人 | `01-products/` |
| **商業邏輯** | `service-blueprint` / `business-rule` | 服務藍圖（端到端業務鏈）+ 商業規則（決策邏輯、領域知識、外部約束）| `04-business-logic/` |
| **流程 / 狀態 / 角色 / 資料** | `scenario` / `state-machine` / `role` / `entity` | 展開為跨模組情境、狀態轉換、角色權責、實體欄位 | `07` / `06` / `03` / `05` |
| **操作步驟** | `user-story` | 角色在情境下的具體操作與驗收條件 | `13-user-stories/` |
| **驗收項目** | `test-case` | 業務層驗收（UAT） | `15-test-cases/` |

## 商業邏輯層內部結構

`04-business-logic/` 有兩種卡型和三種可變性，詳見模板 `04-business-logic/_template-business-logic.md`。

**兩種卡型**：

| 卡型 | `type` | 用途 |
|------|--------|------|
| 服務藍圖 | `service-blueprint` | 端到端業務鏈（公司怎麼服務客戶） |
| 商業規則 | `business-rule` | 決策邏輯、領域知識、外部約束 |

服務藍圖描述流程階段與角色交接，適用的規則用 `[[wiki link]]` 引用商業規則卡。商業規則獨立於流程存在——同一條規則可能在多個流程中被引用。規則只寫一次（Ronald Ross 原則），不複寫。

**三種可變性**（商業規則的 frontmatter `mutability`）：

| `mutability` | 意義 | 子目錄 | 誰能改 |
|---|---|---|---|
| `external` | 外部約束（法規 / 第三方規格） | `外部約束/` | 只有外部來源變更時 |
| `domain` | 領域知識（產業事實） | `領域知識/` | 產業本身改變時（極少） |
| `internal` | 營運規則（公司決策） | `營運規則/` | 訪談、管理層拍板可改 |

## 連結方向

兩個語意不同、永不同向的欄位：

| 欄位 | 方向 | 語意 | 限制 |
|------|------|------|------|
| `source` | 往**上** | 這張卡為什麼對（依據） | 只指更上層卡或外部已確認來源（使用者拍板 / 產業慣例 / 法規）。禁指同層、下層、OpenSpec |
| `implemented-by` | 往**下** | 被誰實作（導航） | 指 OpenSpec spec / Prototype。不承載正確性。04 層級不使用此欄位 |

因兩欄位永不同向，結構上不可能形成循環引用。

**依據鏈**：

```
驗收項目 → 操作步驟 → 商業規則 → 商業規則（source）→ 使用者拍板 / 產業慣例 / 法規
```

每層 source 只往上。商業規則之間的依賴靠 source 連結表達（如訂單異動規則 source 指向現金流出把關），不需要目錄層級強化。

**依據鏈範例**（訂單異動補收免審）：

```
驗收項目  TC：補收 +6000 → 直達已執行
  │ source
操作步驟  US-ORD-026 業務建補收免主管核可直接執行
  │ source
商業規則  [[訂單異動規則#補收免審]]
  │ source
商業規則  [[現金流出把關]]（加單方向不阻擋）
  │ source
外部來源  使用者拍板（補退不對稱）+ 台灣印刷業實務分權
```

## 各層模板

| 分層 | 模板路徑 | 重點 |
|------|---------|------|
| 商業邏輯 | `04-business-logic/_template-business-logic.md` | 撰寫流程六步驟 + 分類判斷表 + 前提確認 + 可變性檢查 + 產出格式 |
| 狀態機 | `06-state-machines/_template-state-machine.md` | 狀態清單 + 轉換規則 + 營運動機；轉換規則引用商業規則卡，不寫規則本體 |
| 情境 | `07-scenarios/_template-scenario.md` | 跨模組角色傳遞 + 狀態鏈；每步引用商業規則卡 |
| 角色 | `03-roles/_template-role.md` | 職責 + 職責邊界 + 關切點；分權判準引用商業規則卡 |
| 實體 | `05-entities/_template-entity.md` | 欄位表（業務可見）+ 關鍵關聯 + 相關狀態機 |
| 操作步驟 | `13-user-stories/_template.md` | 業務情境 + 驗收條件 |
| 驗收項目 | `15-test-cases/_template-test-case.md` | 前置 + 業務動作 + 可觀察結果；Vault 僅索引卡，正文存 Notion |

## frontmatter 共同欄位

所有 wiki 卡片共用：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `type` | 是 | 卡片類型（見分層結構表） |
| `module` | 是 | 對應模組 |
| `business-domain` | 是 | 業務領域 |
| `status` | 是 | `draft` / `active` / `deprecated` |
| `last-reviewed` | 是 | 最後審閱日期 |

各層級專有欄位：

| 欄位 | 適用層級 | 說明 |
|------|---------|------|
| `source` | 商業規則、操作步驟、驗收項目 | 依據來源（往上指） |
| `mutability` | 商業規則 | `external` / `domain` / `internal` |
| `implemented-by` | 狀態機、實體、角色、情境 | 被誰實作（往下指，導航用） |

## 增修紀律

1. **每筆增修須附影響分析**：列出連帶影響的卡清單，不可用「大致沒問題」帶過
2. **無把握時明說不知道**：缺乏背景不得編造結論，該開 OQ 就開
3. **規則只寫一次**：商業規則卡是規則的唯一正本，其他層級引用不複寫
4. **修改前檢查可變性**：商業規則卡的 `mutability` 為 `external` 或 `domain` 時，須確認外部來源或產業事實是否真的改變

## 相關卡

- [[wiki-schema]] — frontmatter 各 type 的完整欄位定義
- [[scope-boundary]] — Vault 收 / 不收邊界
- [[business-logic-changelog]] — 商業邏輯迭代史
- [[editing-conventions]] — 編輯規約
