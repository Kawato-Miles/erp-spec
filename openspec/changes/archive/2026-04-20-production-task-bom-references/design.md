## Context

前次三個連續 commit 建立了 `material-master` / `process-master` / `binding-master` 三個 BOM 底層 spec，作為工單 / 生產任務 / 報價 / 訂單引用材料、工序、裝訂成本的底層規範。但這些 master 與 `production-task` spec 的 Data Model 尚未接軌：

- production-task 目前有一張簡化版 `Process` 資料表（僅 id / name / category），category enum 為 `材料 / 工序 / 裝訂` — 這是 BOM 底層 spec 建立前的設計殘留
- 新三個 master 中，只有 process-master 的 Process 對應「工序」category；material-master 的 MaterialSpec 對應「材料」、binding-master 的 Binding 對應「裝訂」
- 生產任務成本計算需要 pricing_selection 回查 BOM 的 pricing rule 表；但目前 spec 無此欄位

本 change 正式化「生產任務多形引用三個 master」設計，並同步 work-order 的 BOM 展開語意、prototype type/mock。

## Goals / Non-Goals

**Goals**：
- 讓 ProductionTask Data Model 正確引用三個 master（類型安全、DB FK 可驗證）
- 為成本計算提供 pricing_selection 回查基礎（混合帶入模式）
- 細化 work-order spec 的 BOM 展開為生產任務的欄位帶入規則
- prototype type / mock data 與新設計對齊，為後續 UI 開發準備

**Non-Goals**：
- 不改 UI 元件（ProductionTaskDrawer / SchedulePlanner / DispatchBoard 等）
- 不改三個 master spec（已穩定）
- 不改 quote-request 或 order-management spec 對材料的引用（另提 change）
- 不實作 pricing_selection 的自動計算邏輯（留待排程模組）

## Decisions

### 1. 生產任務 BOM 引用：三個互斥 FK（方案 A），非多形單欄位

**選擇**：
```
bom_type: enum(material | process | binding)
material_spec_id: FK → MaterialSpec (nullable)
process_id:       FK → Process       (nullable)
binding_id:       FK → Binding       (nullable)
```
依 `bom_type`，恰好一個 FK 有值，其餘 null。

**理由**：
- 每個 FK 可在 DB schema 層建立實際外鍵約束（referential integrity）
- 查詢時可直接 JOIN 目標表，無需依 `bom_type` 動態決定
- 現有 Requirement 對 `process_id` 已有多處引用（工序相依性、產線、設備成本等）— 保留此欄位名稱可減少 Requirements 重寫幅度

**替代方案**：polymorphic 單欄位 `{ bom_type, bom_ref_id }`。缺點為失去 DB FK 約束；優點為新增 BOM 類型時 schema 不需擴欄。考量三個 master 已定型、不預期新增，方案 A 的類型安全優先。

### 2. `processCategory` 欄位從 enum 改為衍生

**選擇**：保留 `processCategory`，但定義為「從 `bom_type` 衍生的唯讀顯示欄位」，對應關係：
| bom_type | processCategory |
|----------|----------------|
| material | 材料 |
| process | 工序 |
| binding | 裝訂 |

**理由**：既有 Requirement「生產任務分類排序」以 category 為分組鍵，若直接移除 category 將波及大量 Requirements；保留為衍生欄位可最小化變動面。

**實作備註**：DB 可用 generated column 或應用層計算；prototype type 中以 getter 或 computed 呈現。

### 3. 舊的簡化版 Process 表刪除

production-task spec 中的 `Process { id, name, category }` 資料表定義刪除。所有 process_id FK 統一改指向 `openspec/specs/process-master/spec.md` 定義的 Process 表。

### 4. pricing_selection 形狀依 bom_type 與 master 的 pricing 類型決定

| bom_type | 引用 master | pricing_selection 形狀 |
|----------|-----------|----------------------|
| material | MaterialSpec（依 Material.pricing_type）| 按重量：`{ size_name }`；按面積：`{ area_range_id, qty_range_id }`；按數量：`{ qty_tier_id }` |
| process | Process（依 Process.pricing_method）| 巢狀：`{ x_range_id, y_range_id }`；單一：`{ tier_id }` |
| binding | Binding（統一）| `{ x_axis_id, y_axis_id }` |

JSON 儲存，形狀由應用層依 master 類型驗證。

### 5. 帶入模式：混合（目前手動 → 排程上線後自動）

- 現階段：使用者手動選擇 pricing_selection；`pricing_selection_default` 為 null、`pricing_selection_overridden` 預設為 true
- 排程模組上線後：系統依印件內容（尺寸、印量、拼版結果、裝訂所需台數 / 頁數 / 本數）自動計算 `pricing_selection_default`；使用者仍可覆寫

與三個 master spec 的「生產任務引用」Requirement 一致。

### 6. work-order 新增 BOMLineItem 資料表

工單下的印件（PrintItem）先前以 BOM 行項目為基礎展開生產任務，但 BOM 行項目無獨立資料表定義。本 change 新增 `BOMLineItem` 資料表：
- 每筆對應 PrintItem 的一項 BOM（材料 / 工序 / 裝訂 之一）
- 含 `bom_type` + 三個互斥 FK + 預計用量 + `production_line_id`
- 工單依 BOM 展開時，每筆 BOMLineItem 產生一筆 ProductionTask，直接複製 bom_type / FK，並由系統依用量換算 `pricing_selection_default`

### 7. Prototype 向後相容策略

`processContentCatalog.ts` 的 public API（`getCatalogByProcess` / `MATERIAL_PROCESSES` / `BINDING_PROCESSES` 等）保留不動，內部實作改為從 `bomMasterMock.ts` 聚合。既有 UI 元件（ProductionTaskDrawer 等）不需修改。

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 舊 spec 或 prototype 中殘留對內部 Process 表的引用 | delta spec 以 MODIFIED Requirement 明確列出；prototype 以 TypeScript type-check 確認無殘留 |
| pricing_selection JSON 形狀無 DB 約束，易資料不一致 | 應用層驗證：依 `bom_type` + master 的 pricing 類型驗證；後續可考慮 JSON schema 驗證 |
| 三個互斥 FK 的約束無法用 CHECK constraint 精確表達（部分 DB 支援） | 應用層強制；插入時驗證恰好一個 FK 有值 |
| `processCategory` 衍生欄位若被舊程式當成可寫欄位誤用 | prototype type 中標註 readonly；spec 中明確定義唯讀 |
| BOMLineItem 與 PrintItem 之間的關聯在 work-order spec 外部（擴及 order-management） | 本 change 僅在 work-order spec 定義 BOMLineItem；跨 spec 的整合留待後續 change |

## Migration

本 change 為 spec 層變更 + prototype mock 更新，**不涉及正式 DB 資料遷移**。中台實作已有三個 master 的資料，prototype 的 mock 重寫即可。

後續若正式系統接入，需處理：
1. 既有 ProductionTask 資料補齊 `bom_type` + 對應 FK
2. 從既有 `process_id`（若指向舊簡化 Process）對應到 process-master 的 Process
3. 既有 category = 材料 / 裝訂 的資料需從對應 master 建立 FK

以上遷移路徑不在本 change 範圍。

## Open Questions

1. 排程模組上線時，pricing_selection_default 的自動計算邏輯是否為獨立 change？（目前傾向獨立）
2. 中台既有實作的 ProductionTask 是否已有 BOM 引用欄位？若有，欄位命名是否與本 spec 一致？（需與實作端確認）
3. BOMLineItem 與 PrintItem 的「成交價」「計費方式」欄位是否需在本 change 定義？（目前僅定義 BOM 引用與用量，價格相關留待 quote-request 對接）
