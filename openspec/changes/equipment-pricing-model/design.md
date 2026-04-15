## Context

現行 equipment-color-cost change 把「顏色」實作為 ProductionTask 上的 5 個獨立欄位（`colorMonoBlack` / `colorCmyk` 布林；`colorPantoneMultiplier` / `colorMetallicMultiplier` / `colorMetallicMinMultiplier` nullable 小數）；印務在生產任務端勾選 + 覆寫倍率，成本公式以「令 × 單黑或 CMYK 單價」為基礎加 3 種倍率計算。

但實際業務規則是：
- 印刷業設備以「**色數**」計價，且單價會依印量落在不同**區間**（1~2 千車、2~3 千車、4~5 千車、6~∞ 千車），單價越大量越低。
- 倍率（Pantone、金銀白螢光、最低色數）是設備機械能力的硬性規則，**印務不可覆寫**，Figma 明確註記「使用者不可手填等效單色數，系統依規則換算」。
- 印務對色數的表達習慣為「4/0」「4/4」「4+1/0」這類 job ticket 標記，而非逐色勾選。

本 change 要把資料模型從現行「5 個顏色 flag + 單一設備單價」升級為「色數標記 + 特殊色陣列 + 區間階梯定價 + 硬性倍率」。Prototype 不做設備主檔 CRUD UI，只動 type 與 mock data，以驗證生產任務端的 UX 與成本公式。

**stakeholders**：印務（生產任務建立與成本評估）、業務（報價依據）、生管（派工與排程）。

## Goals / Non-Goals

**Goals:**

- 設備主檔資料模型對齊 Figma「計價方式」Tab 的概念（三種設備類型、令/千車計價、開機費、色數區間階梯定價、硬性倍率）
- 生產任務顏色表達改為印刷業術語（色數標記 + 特殊色 chip），廢除「5 flag + 覆寫倍率」模型
- 成本公式以區間定價為基礎，倍率固定取自設備主檔
- Prototype 能完整 E2E 驗證（建立 PT → 選設備 → 填色數 → 勾特殊色 → 成本即時計算）
- 保留 equipment-color-cost 已完成的「顏色選項依設備 gate」行為（`supportsColors`）

**Non-Goals:**

- 不做設備主檔 CRUD UI（Figma 畫的 Drawer 留給後續 change）
- 不處理數位印刷 / 大圖輸出設備類型的差異化計價邏輯（本次只涵蓋平板印刷）
- 不實作特規尺寸加價、材料耗損率、咬口、可印厚度等計算細節
- 不處理已寫死 5 欄位的其他畫面（若本 change scope 之外有用到，留給後續清理）
- 不做「色組 template」的預設組合機制（題 2 的 B 做法，印務每次自填色數即可）
- 不做 equipment-color-cost 的 archive（避免把過渡模型合併進 main specs）

## Decisions

### 1. 顏色模型從「5 flag + 覆寫倍率」改為「色數標記 + 特殊色陣列」

**選擇**：ProductionTask 新增 `frontColorCount: number`、`backColorCount: number`、`specialColors: Array<SpecialColorType>`；廢除 5 個舊欄位。

**理由**：
- 色數標記（4/0、4/4、4+1/0）是印刷業 job ticket 標準（CIP4 規範亦使用類似模型），印務看一眼就懂，不需理解倍率概念
- 正/背面分開讓成本計算準確（雙面印刷成本等於兩面獨立計算，非數量翻倍）
- 特殊色用陣列而非個別 flag，表達彈性高（未來新增特殊色類型只需擴充 enum）

**替代方案**：
- 保留 5 flag 但 UI 改成唯讀倍率：最小侵入但違反「色數為印刷業主軸」的業務事實，UX 問題未根治
- 色組 template（題 2 的 B 做法）：避免印務重複填色數，但業務實際需求是「每次依稿件設計填」，預設組合價值低且主檔維護成本高

### 2. 倍率硬性化：Equipment 主檔為唯一正本，ProductionTask 唯讀顯示

**選擇**：`pantoneMultiplier` / `metallicMultiplier` / `metallicMinMultiplier` 由 Equipment 主檔定義，ProductionTask 不儲存、UI 唯讀顯示當前設備帶入值。

**理由**：
- 倍率是設備機械特性（油墨黏度、印版需求）導出的成本係數，不屬於單筆生產議價項目
- 集中在主檔便於維護（一台機器調整倍率全部生產任務同步更新）
- 與 Figma 設計「特殊色等效單色規則」區塊一致

**替代方案**：倍率仍存在 ProductionTask 並標示 readonly——資料冗餘、需額外同步機制，且若設備主檔倍率調整，歷史 PT 的行為難以定義

### 3. 設備計價改為「色數區間階梯定價」陣列

**選擇**：Equipment 新增 `pricingTiers: Array<{ minQty: number; maxQty: number | null; monoPricePerColor: number; cmykPricePerColor: number }>`；`maxQty = null` 代表無上限（∞）。移除既有 `monoBlackUnitPrice / cmykUnitPrice`。

**區間規則**：
- 採半開區間 `[minQty, maxQty)` — 下界含、上界不含；避免邊界點雙重匹配
- 相鄰 tier 必須連續：前一 tier 的 maxQty = 下一 tier 的 minQty
- 多個 tier 依 minQty 遞增排列；禁止有洞（若 mock data 出現不連續，系統應回報 invalid 並拒絕計算）
- 最後 tier 的 maxQty = null（代表 ∞）

**理由**：
- Figma 表格明示為「千車區間」對應「單黑 / 彩色 (CMYK)」各自單價
- 單價單位為「元/色」——一張印刷品用幾個顏色就乘幾次（例如正面 4 色 = 4 × 單價）
- 階梯以印量分界，計算時依 PT 的目標印量（轉換為令/千車）落到對應區間

**替代方案**：
- 單一單價 + 量折扣百分比：表達力較差，難以細緻對應 Figma 的實際價格表
- 連續函數（如指數衰減）：需要擬合參數，不如陣列直觀

### 4. 計價單位改為設備屬性（令 或 千車）

**選擇**：Equipment 新增 `pricingUnit: '令' | '千車'`；1 令 = 500 張、1 千車 = 1000 張。成本計算時依設備的 `pricingUnit` 把 PT 目標數量換算為對應單位數。

**理由**：Figma 已明示為設備級選擇（Tab 切換）；不同設備的計價慣例可能不同（如平板印刷慣用令、數位印刷慣用千車）。

**替代方案**：統一以令計算——不符合 Figma 設計，且無法涵蓋未來數位印刷的千車計價場景。

### 5. 特殊色成本 = 區間單價 × 特殊色數 × 倍率

**選擇**：成本公式如下：

```
令數 or 千車數 = targetQty / (500 或 1000)   ← 依設備 pricingUnit
tier = pricingTiers 中第一個符合 minQty <= 令/千車數 <= maxQty 的區間

基本印工 = (正面色數 + 背面色數) 對應 CMYK/單黑單價 × 令/千車數
      ※ 正面色數 <= 1 → 取 monoPricePerColor × 色數；否則取 cmykPricePerColor × 色數
      ※ 背面同理
      ※ 實作上先分別計算正/背面，再加總

特殊色成本 = 基本色單價參照（取 cmykPricePerColor） × 特殊色數 × 倍率 × 令/千車數
      ※ 每種特殊色類型依對應倍率計算
      ※ Pantone → pantoneMultiplier
      ※ 金/銀/白/螢光 → metallicMultiplier
      ※ 最低色數（單金銀白螢光） → metallicMinMultiplier

estimated_equipment_cost = 開機費 + 基本印工 + 所有特殊色成本
```

**理由**：
- Figma info tip 明示「特別色費用依據『單色區間價格』為基礎，乘以對應倍率計算」
- 「單色區間價格」解讀為取 CMYK 單價作為基礎（最常見的特殊色疊加情境），以此推倍率
- 一個 PT 可能同時有 Pantone + 金，分別倍率相乘

**替代方案**：特殊色用單獨單價表——Figma 沒提供、且業務已用倍率推導，重工

### 6. 單色 vs 四色的判斷：以色數 1 為分界

**選擇**：色數 = 1 時取 `monoPricePerColor`（單黑單價），色數 >= 2 時取 `cmykPricePerColor`（彩色單價）。

**理由**：印刷業慣例「單色 = 單黑（K）」、「彩色 = CMYK 或更多」；4 個顏色逐色都用 CMYK 單價計算，而非「整個 4 色套餐一個價」。

**已知失真**（CEO 審查指出）：2~3 色印刷（例：雙色名片 2 色、三色標籤）實際工藝比 CMYK 省工，本公式會高估 25-50%。短期以 UI 警語處理（色數 ∈ [2,3] 時顯示「2~3 色成本可能高估，請人工調整報價」），中期若業務反饋明顯再以 `twoColorPricePerColor` 欄位升級 pricingTier。

**替代方案**：單純把 `monoBlackUnitPrice` / `cmykUnitPrice` 視為「選項 A 單價 / 選項 B 單價」由印務選——違背業務認知，且增加一個選項。

### 7. Equipment 主檔 UI 不做，只用 mock data

**選擇**：Prototype 不實作 Figma 畫的「設備計價方式 Drawer」。`mockEquipmentList` 直接寫死區間定價、倍率、類型等欄位。

**理由**：
- 本 change 目標是驗證 ProductionTask 端的 UX 與成本公式是否正確
- 設備主檔 CRUD 是獨立 scope（涉及表單驗證、區間連續性檢查、歷史資料遷移等），應留給後續 change
- mock data 足以涵蓋 E2E 驗證（定義 3-5 台涵蓋有/無顏色、不同計價單位、不同區間的設備）

**替代方案**：同步做設備主檔 UI——scope 翻倍、本 change 無法單週完成；拖慢生產任務 UX 驗證節奏

### 8. equipment-color-cost archive 時標記 superseded

**選擇**：equipment-color-cost 正常 archive（delta 會併入 main specs，形成過渡版本的「5 flag + 覆寫倍率」），但 proposal.md 加 footer 註記「本 change 已被 equipment-pricing-model 取代（superseded）」。本 change archive 時，以 BREAKING 覆寫 production-task main spec。

**理由**：
- 保持 OpenSpec change 歸檔流程的一致性（每個完成的 change 都走完 archive）
- equipment-color-cost 的歷史足跡在 git + archive 目錄都可追溯
- main specs 允許階段性過渡（短暫包含 5 flag 模型），由本 change 清除
- 避免「tasks 全勾但未 archive」的懸掛狀態造成 OpenSpec 流程混亂

**替代方案**：
- 不 archive / 不 sync：main specs 乾淨但 OpenSpec 流程出現例外
- 合併兩 change 重 propose：已完成的設計決策被丟棄、浪費前期審查成本

### 9. 色數輸入的合理範圍與驗證

**選擇**：
- `frontColorCount` / `backColorCount` 為 integer ∈ [0, 8]
- 0 = 不印（例如 4/0 表示只印正面）
- 上限 8 = 實務上最多 CMYK + 4 特殊色（Pantone + 金 + 銀 + 螢光）
- `specialColors` 為 Array<SpecialColorType>，可含 0~N 個項目，類型以 enum 限制

**理由**：印刷業色數超過 8 色的場景罕見（專業藝術印刷以外），上限足以涵蓋 ERP 日常；0 的值明確表達「不印」。

### 10. 雙面印刷 tier 落點：總印量套 tier

**選擇**：雙面印刷（正背面皆 > 0 色）時，tier 落點以「目標印量（令/千車數）」為唯一依據，正反面共用同一 tier 的單價。

**理由**：印刷機一次過機壓上下兩版，實際印量等於目標印張數；不論正反面色數多寡，機器運作次數與紙張張數相同。

**替代方案**：正反面各算 tier（模擬兩次過機）——在本廠工藝不符合實際（一次過機即完成），會高估成本。

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 色數輸入與特殊色 chip 互相獨立，可能不一致（例如色數 4 但勾 3 個特殊色） | UI 顯示「總色數 = 色數欄位 + 特殊色數」作為摘要，印務自行驗證；後續可加驗證規則 |
| pricingTiers 區間若不連續或重疊，計算會挑錯 tier | mock data 階段人工保證連續；主檔 UI（未來 change）需加驗證；計算函式無匹配時回報 undefined 並 UI 顯示「設備區間未定義」 |
| 「單色用 monoPricePerColor、彩色用 cmykPricePerColor」的判斷在 2~3 色混印時可能不精準（例如 2 色印刷，實際工藝接近單色多版次） | 先以「色數 ≥ 2 = CMYK 單價」簡化處理；若業務反饋不準，後續以 enum（single/two/full）或分色數更細緻的單價表升級 |
| 特殊色計算以 CMYK 單價為基礎，若設備只有單黑無彩色（無 cmykPricePerColor），倍率無法計算 | 公式在特殊色 > 0 且 cmykPricePerColor 未設時，回報「設備不支援特殊色印刷」 |
| equipment-color-cost 的 E2E 驗證若已在 Lovable 跑過、使用者已看過舊模型，本 change 推翻可能造成認知混亂 | 本 change 的 proposal.md 明確註記 BREAKING；Prototype 推送到 Lovable 時同步告知使用者 |
| 現行 Prototype 有其他畫面讀取 5 個顏色欄位（如派工 / 報工相關頁） | 本 change 只處理 AddProductionTasks + WorkOrderDetail 的顏色區塊；其他畫面的 5 欄位引用後續清理（task 中列出 grep 檢查項） |
| Figma 的「設備類型 Tab」切換應該顯示不同欄位，但本 change 簡化為一組欄位涵蓋全部 | mock data 只建立平板印刷型設備；數位印刷 / 大圖輸出的欄位差異留待設備主檔 UI change 再設計 |

## Migration Plan

- **Prototype**：由於無 production 資料，mock data 直接重寫
- **Spec**：
  1. 本 change archive 時，production-task main spec 的顏色相關 Data Model 與 Requirements 直接由本 change 的 delta 覆寫
  2. equipment 新增一個 capability main spec（本 change 作為 New Capability 建立）
- **既有 equipment-color-cost change**：
  1. 維持 complete（tasks.md 不動）
  2. 在 proposal.md 追加 footer 註記「已被 equipment-pricing-model 覆蓋，不會 archive、不合併至 main specs」
  3. 本 change archive 後可以考慮人工移至 `openspec/changes/archive/` 目錄但保留「未 sync」標記

## Open Questions

（所有 OQ 統一寫入 Notion Follow-up DB：https://www.notion.so/32c3886511fa808e9754ea1f18248d92；此處僅列摘要供設計討論參考）

- **特殊色基礎價參照**：目前公式用 cmykPricePerColor 作為特殊色倍率基礎。若設備實際定義特殊色用獨立單價（如黑白機加印金的成本），公式需擴充為 `specialColorBasePrice: number` 欄位。待 Figma 提供更多設備定義範例後決定。→ Notion OQ 待建
- **開機費計價時機**：是「每台設備每次上機都收」還是「此工序用此設備就收一次」？目前假設為 PT 層級一次收取。同一設備連續印兩個 PT（例：4/0 正面印完換背面）若重收會高估成本。→ Notion OQ 待建
- **印量 = 0 的邊界**：目前公式在 targetQty = 0 時仍計算 setupFee，可能造成誤導性成本。建議 UI 在 targetQty 未填時顯示「待填印量」。→ Notion OQ 待建
- **色數上限 8 是否足夠**：高階包裝 / 酒標場景 CMYK + 多特殊色可能超過 8 色，需跟 CEO 確認廠的產品線範圍。→ Notion OQ 待建（若需要）
- **2~3 色印刷單價失真**：M4 Decision 採「UI 警語」短期方案，若業務反饋高估明顯，升級為 pricingTier 加 `twoColorPricePerColor` 欄位。→ 視業務反饋再決定
