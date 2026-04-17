## Purpose

工序主檔（Process Master）-- 定義 ERP 工序的兩層結構（群組 / 工序）與七種計價方式（成品面積 / 工序面積 / 時間計價 / 成品數量 / 原紙張數 / 原紙令數 / 上機印數），作為後續工單、生產任務、報價、訂單等模組引用工序成本的底層 BOM 規範。

**問題**：
- 工序模組已於 ERP 中台實作（Figma 稿為準），但規則散落於介面稿，無正式 OpenSpec 記錄
- 工單 / 生產任務的資料模型需引用工序規格與計價規則，缺少共同參考基準
- 七種計價方式的單價欄位、資料形狀不同（巢狀矩陣 vs 單維級距），生產任務引用時需要一致的 selection 語意

**目標**：
- 主要：將工序模組的兩層結構與七種計價方式正式化為 OpenSpec spec，作為 BOM 底層參考
- 次要：定義生產任務引用工序時的 `pricing_selection` 形狀與混合帶入模式

- 實作位置：ERP 中台（Figma 稿為準），Prototype 不另建置
- 相依模組：工單管理、生產任務、報價、訂單管理（皆為下游引用方）；廠商管理（上游資料源）
- 本 spec 為「既有實作的結構性記錄」，不預期頻繁變更；後續若需變更，走 OpenSpec change 流程
- 設計取捨：三種巢狀計價（成品面積 / 工序面積 / 時間計價）共用「二維區間矩陣」物理結構，僅 X 軸單位語意不同；四種單一計價（成品數量 / 原紙張數 / 原紙令數 / 上機印數）共用「一維級距表」物理結構，僅 tier_type 語意不同。採**統一 schema**（ProcessPricingRange + ProcessPricingMatrix + ProcessPricingTier）而非七張分立表

---

## Requirements

### Requirement: 工序群組管理

系統 SHALL 提供工序群組作為工序的頂層分類，群組為單層結構（無巢狀父子關係）。群組可啟用或停用，並可調整顯示排序。

#### Scenario: 管理員建立新群組

- **WHEN** 管理員於工序管理頁點擊「修改群組」並新增群組
- **THEN** 系統 SHALL 建立 ProcessGroup，並顯示於左側群組導覽

#### Scenario: 群組僅單層

- **WHEN** 管理員嘗試於群組內建立子群組
- **THEN** 系統 SHALL 不提供此操作；群組結構限制為單層

### Requirement: 工序管理

系統 SHALL 支援在群組下建立工序（Process），每筆工序需指定所屬群組、工序廠商（FK -> 廠商主檔）、計價方式（七選一）。工序與群組為明確主從關係，**不可跨群組共用**。

#### Scenario: 建立工序並指定計價方式

- **WHEN** 管理員點擊「新增工序」，輸入工序名稱、選擇工序廠商、工序分組、計價方式
- **THEN** 系統 SHALL 建立 Process，並依所選 pricing_method 展開對應的計價設定區塊

#### Scenario: 工序廠商從廠商主檔帶入

- **WHEN** 管理員於編輯工序時點開「工序廠商」下拉選單
- **THEN** 系統 SHALL 顯示廠商主檔的廠商清單供選擇；vendor_id 儲存為 FK -> Supplier

#### Scenario: 工序不可跨群組

- **WHEN** 管理員嘗試將同一工序歸屬於多個群組
- **THEN** 系統 SHALL 不提供此操作；每筆 Process 僅對應單一 ProcessGroup

### Requirement: 計價方式 - 巢狀（二維區間矩陣）

系統 SHALL 為下列三種 pricing_method 提供「二維區間矩陣」計價結構：成品面積、工序面積、時間計價。三者共用 ProcessPricingRange + ProcessPricingMatrix 物理結構，差異僅在 X 軸 range_type（area 或 time）與單位語意。

#### Scenario: 成品面積計價設定

- **WHEN** 管理員於工序設定 pricing_method = 成品面積
- **THEN** 系統 SHALL 提供面積區間（m²）與數量區間兩個一維陣列
- **AND** 系統 SHALL 顯示提示文字「按照產品總面積計價，適用於任何滿版處理的工藝，如覆膜、過油等等」
- **AND** 系統 SHALL 產生 N × M 筆 ProcessPricingMatrix 項，每筆對應 (area_range, qty_range) 的單價

#### Scenario: 工序面積計價設定

- **WHEN** 管理員於工序設定 pricing_method = 工序面積
- **THEN** 系統 SHALL 提供面積區間（m²）與數量區間的巢狀矩陣；結構同成品面積，用於非滿版工藝

#### Scenario: 時間計價設定

- **WHEN** 管理員於工序設定 pricing_method = 時間計價
- **THEN** 系統 SHALL 提供時間區間（min）與數量區間的巢狀矩陣
- **AND** ProcessPricingRange 之 X 軸 range_type MUST 為 `time`，單位為 min

### Requirement: 計價方式 - 單一（一維級距）

系統 SHALL 為下列四種 pricing_method 提供「一維級距」計價結構：成品數量、原紙張數、原紙令數、上機印數。四者共用 ProcessPricingTier 物理結構，差異僅在 tier_type 語意。

#### Scenario: 成品數量計價設定

- **WHEN** 管理員於工序設定 pricing_method = 成品數量
- **THEN** 系統 SHALL 提供級距表（數量下限 / 數量上限 / 單位 / 單價）；tier_type = `qty`

#### Scenario: 原紙張數計價設定

- **WHEN** 管理員於工序設定 pricing_method = 原紙張數
- **THEN** 系統 SHALL 顯示提示文字「按照原紙張數單價計價，常見工藝如獨立版覆膜、上光等等，僅限於獨立版」
- **AND** tier_type MUST 為 `sheet`

#### Scenario: 原紙令數計價設定

- **WHEN** 管理員於工序設定 pricing_method = 原紙令數
- **THEN** 系統 SHALL 提供級距表；tier_type = `ream`（1 令 = 500 張全開紙）

#### Scenario: 上機印數計價設定

- **WHEN** 管理員於工序設定 pricing_method = 上機印數
- **THEN** 系統 SHALL 提供級距表；tier_type = `print_run`

### Requirement: pricing_method 與 pricing_rule 對應

系統 SHALL 依 Process.pricing_method 決定對應的計價規則資料表與欄位語意。

#### Scenario: pricing_method 對應表

- **WHEN** 系統建立或讀取 Process 的計價規則
- **THEN** 對應關係 MUST 遵循下列對應：

  | pricing_method | 用表 | X 軸 range_type / tier_type |
  |----------------|------|--------------------------|
  | 成品面積 | ProcessPricingRange + ProcessPricingMatrix | x: area (m²) / y: qty (張) |
  | 工序面積 | ProcessPricingRange + ProcessPricingMatrix | x: area (m²) / y: qty (張) |
  | 時間計價 | ProcessPricingRange + ProcessPricingMatrix | x: time (min) / y: qty (張) |
  | 成品數量 | ProcessPricingTier | tier_type: qty |
  | 原紙張數 | ProcessPricingTier | tier_type: sheet |
  | 原紙令數 | ProcessPricingTier | tier_type: ream |
  | 上機印數 | ProcessPricingTier | tier_type: print_run |

### Requirement: 生產任務引用工序

系統 SHALL 支援生產任務引用 Process，除 `process_id` 外，另需記錄 `pricing_selection`（使用者選擇的計價鍵），形狀依 pricing_method 分類不同。pricing_selection 採混合帶入模式：目前先由使用者手動輸入；後續排程上線後系統將依印件內容自動計算（含多工單拼版換算邏輯）並預填，使用者仍可覆寫。

#### Scenario: 巢狀計價 -- selection 為二維鍵

- **WHEN** 生產任務引用 pricing_method 為成品面積 / 工序面積 / 時間計價 的工序
- **THEN** pricing_selection SHALL 形狀為 `{ x_range_id, y_range_id }`；分別對應 ProcessPricingRange 的 X 軸區間（面積或時間）與 Y 軸區間（數量）

#### Scenario: 單一級距 -- selection 為單一鍵

- **WHEN** 生產任務引用 pricing_method 為成品數量 / 原紙張數 / 原紙令數 / 上機印數 的工序
- **THEN** pricing_selection SHALL 形狀為 `{ tier_id }`；對應 ProcessPricingTier 的單一級距

#### Scenario: 手動輸入 pricing_selection（目前階段）

- **WHEN** 開立生產任務時綁定工序
- **THEN** 使用者 SHALL 手動選擇 pricing_selection；系統 MUST 不自動計算

#### Scenario: 自動預填 pricing_selection（排程模組上線後）

- **WHEN** 排程模組上線後開立生產任務，關聯至印件
- **THEN** 系統 SHALL 依印件的尺寸、印量、拼版結果（含多工單拼版換算）自動計算並預填 pricing_selection
- **AND** 使用者 SHALL 可手動覆寫；生產任務 MUST 留存系統預設值與覆寫值兩版供稽核

### Requirement: 工序成本計算流程

系統 SHALL 依 pricing_selection 回查對應計價規則的單價，乘以生產任務用量得出工序成本。

#### Scenario: 巢狀計價成本計算

- **WHEN** 生產任務 pricing_selection = `{ x_range_id, y_range_id }`
- **THEN** 系統 SHALL 查 ProcessPricingMatrix 對應 cell 取得單價，乘以實際用量

#### Scenario: 單一級距成本計算

- **WHEN** 生產任務 pricing_selection = `{ tier_id }`
- **THEN** 系統 SHALL 查 ProcessPricingTier 對應級距取得單價，乘以實際用量（依 tier_type 語意：張數 / 令數 / 件數 / 上機次數）

### Requirement: 設備選擇由使用者自行判斷

工序層 MUST 不設定設備約束欄位（最小面積 / 最小邊 / 設備 FK 等）。生產任務執行時由使用者自行判斷此工序應使用哪台設備。

#### Scenario: 工序不含設備約束

- **WHEN** 管理員編輯工序
- **THEN** 系統 MUST 不提供設備約束欄位；設備選擇延後至生產任務階段由使用者自行判斷

---

## Data Model

> 來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### ProcessGroup（工序群組）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 群組名稱 | name | 字串 | Y | | 表面處理 / 燙金燙銀 / 模切 / 壓線 / 打孔⋯ |
| 顯示排序 | display_order | 整數 | | | 左側群組導覽排序 |
| 啟用狀態 | enabled | 布林值 | Y | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**約束**：群組為單層結構，無 parent_id。

### Process（工序）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬群組 | group_id | FK | Y | | FK -> ProcessGroup；單群組主從關係 |
| 工序名稱 | name | 字串 | Y | | 光膜 / 工序 A⋯，由使用者自訂 |
| 工序廠商 | vendor_id | FK | | | FK -> Supplier（廠商主檔） |
| 計價方式 | pricing_method | 單選 | Y | | 成品面積 / 工序面積 / 時間計價 / 成品數量 / 原紙張數 / 原紙令數 / 上機印數 |
| 啟用狀態 | enabled | 布林值 | Y | | |
| 備註 | notes | 文字 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**約束**：工序僅屬於單一群組，不可跨群組。

### ProcessPricingRange（計價區間軸，統一表）

適用 pricing_method ∈ { 成品面積, 工序面積, 時間計價 }。每筆 Process 可擁有 X 軸、Y 軸共兩組區間。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬工序 | process_id | FK | Y | Y | FK -> Process |
| 軸別 | axis | 單選 | Y | | x / y |
| 區間類型 | range_type | 單選 | Y | | area / time / qty |
| 區間下限 | min | 小數 | Y | | |
| 區間上限 | max | 小數 | | | null 代表 ∞ |
| 單位 | unit | 單選 | Y | | m² / min / 張（依 range_type 決定） |
| 顯示排序 | display_order | 整數 | | | |

**軸別語意**：

| pricing_method | X 軸 range_type / unit | Y 軸 range_type / unit |
|----------------|---------------------|---------------------|
| 成品面積 | area / m² | qty / 張 |
| 工序面積 | area / m² | qty / 張 |
| 時間計價 | time / min | qty / 張 |

### ProcessPricingMatrix（巢狀價格矩陣 cell）

適用 pricing_method ∈ { 成品面積, 工序面積, 時間計價 }。每 (X 軸區間 × Y 軸區間) 組合對應一筆。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬工序 | process_id | FK | Y | Y | FK -> Process |
| X 軸區間 | x_range_id | FK | Y | | FK -> ProcessPricingRange（axis = x） |
| Y 軸區間 | y_range_id | FK | Y | | FK -> ProcessPricingRange（axis = y） |
| 單價 | price | 小數 | Y | | 單位：NTD |

**約束**：同一 Process 下，(x_range_id, y_range_id) 組合 MUST 唯一。

### ProcessPricingTier（單一級距，統一表）

適用 pricing_method ∈ { 成品數量, 原紙張數, 原紙令數, 上機印數 }。每筆 Process 擁有多列級距。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬工序 | process_id | FK | Y | Y | FK -> Process |
| 級距類型 | tier_type | 單選 | Y | | qty / sheet / ream / print_run |
| 數量下限 | min | 整數 | Y | | |
| 數量上限 | max | 整數 | | | null 代表 ∞ |
| 單位 | unit | 單選 | Y | | 件 / 張 / 令 / 次（依 tier_type 決定） |
| 單價 | price | 小數 | Y | | 單位：NTD |
| 顯示排序 | display_order | 整數 | | | |

**tier_type 語意**：

| pricing_method | tier_type | unit |
|----------------|-----------|------|
| 成品數量 | qty | 件 |
| 原紙張數 | sheet | 張 |
| 原紙令數 | ream | 令（1 令 = 500 張全開紙） |
| 上機印數 | print_run | 次 |

**約束**：同一 Process 下，tier_type MUST 與 Process.pricing_method 對應（不可混用）。

### 生產任務對工序的引用（下游模組參考）

下列為生產任務（ProductionTask）引用工序時應包含的欄位，正式定義見生產任務 spec。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 工序 | process_id | FK | Y | FK -> Process |
| 計價選擇 | pricing_selection | JSON | Y | 形狀依 Process.pricing_method 分類不同 |
| 系統預設值 | pricing_selection_default | JSON | | 排程模組上線後由系統依印件自動計算的原始值；目前階段為 null |
| 覆寫標記 | pricing_selection_overridden | 布林值 | Y | 使用者是否手動覆寫；目前階段預設 true |

**pricing_selection 形狀**：

| pricing_method 分類 | pricing_selection JSON 結構 |
|-------------------|---------------------------|
| 巢狀（成品面積 / 工序面積 / 時間計價）| `{ "x_range_id": "...", "y_range_id": "..." }` |
| 單一級距（成品數量 / 原紙張數 / 原紙令數 / 上機印數）| `{ "tier_id": "..." }` |

---

## Scenarios（端到端計算範例）

### Scenario E2E-1：巢狀 -- 成品面積計價

- **工序**：光膜（pricing_method = 成品面積，廠商 = 台灣積體電路公司）
- **生產任務**：印件成品面積 0.5 m² × 150 張 = 75 m²（但查詢時 area_range 以單張面積或累計面積判斷，本 spec 暫不規範）
- **pricing_selection**：`{ x_range_id: "1-99 m²", y_range_id: "100-199 張" }`
- **查表**：ProcessPricingMatrix → price = 11 NTD
- **計算**：工序成本 = 11 × 實際用量（用量換算規則見生產任務 spec）

### Scenario E2E-2：巢狀 -- 時間計價

- **工序**：某機台加工工序（pricing_method = 時間計價）
- **生產任務**：印件預估加工時間 80 min × 150 張
- **pricing_selection**：`{ x_range_id: "60-119 min", y_range_id: "100-199 張" }`
- **查表**：ProcessPricingMatrix → price = 8 NTD
- **計算**：工序成本 = 8 × 實際用量

### Scenario E2E-3：單一級距 -- 原紙張數

- **工序**：獨立版覆膜（pricing_method = 原紙張數）
- **生產任務**：原紙用量 150 張
- **pricing_selection**：`{ tier_id: "100-199" }`
- **查表**：ProcessPricingTier → price = 4 NTD/張
- **計算**：工序成本 = 4 × 150 = 600 NTD

### Scenario E2E-4：使用者手動覆寫 pricing_selection

- 同 E2E-3，使用者預期會擴單，手動改為 `{ tier_id: "200-299" }`
- **計算**：工序成本 = 3 × 150 = 450 NTD
- 生產任務留存 pricing_selection_default = `{ tier_id: "100-199" }`、pricing_selection = `{ tier_id: "200-299" }`、pricing_selection_overridden = true

---

## Open Questions

1. **「成品面積」與「工序面積」的語意區分**：前者為產品總面積（滿版處理用），後者未見明確定義；何時該選何者？是否存在驗證規則避免管理員選錯？
2. **多工單拼版下的用量換算**：排程模組上線後，印件拼版可能將多工單合併上機。原紙張數 / 原紙令數 / 上機印數等 tier_type 的「用量」如何在多工單間分攤至各生產任務？
3. **時間計價的時間來源權威**：排程上線後，時間由印件 / 設備標準工時推算還是由排程演算法動態估算？誰是權威來源？
4. **工序廠商（vendor）為外包語意還是制費語意**：FK → Supplier 指外包給該廠商施作，還是僅為制費參考廠商？影響後續外包單、應付帳款模組的整合

---

## Version History

- v0.1（2026-04-17）：初版，依 Figma 中台介面稿（node-id: 124-67074 / 2-2098 / 2-4142 / 2-3165）逆向建立；定義兩層結構、七種計價方式（3 巢狀 + 4 單一級距）、生產任務引用 pricing_selection 形狀與混合帶入模式；採統一 schema（ProcessPricingRange + ProcessPricingMatrix + ProcessPricingTier）
