## Why

生產相關 spec 經長期迭代已與 wiki 商業正本脫節，導致規劃功能與交付時取到錯的前提。實測落差（2026-07-30 清查）：

- `production-task`（1756 行 63 Requirement）含已被推翻的「QC PT 自動建立」「品檢 PT 印務手動加入」（07-21 拍板改印件層品檢紀錄）、「任務層 Bottom-up 作廢」與末段「任務（Task）層狀態機摘要」（07-28 拍板移除任務層）、NCR 實體與 Disposition、供應商自助報工與報價、拼版試算工具、產線管理、排程兩階段分離。
- `work-order`（1084 行 36 Requirement）含 QC 單建立與執行、工單區域設定（區域欄已棄用）、BOM 行項目管理（[[PT-037]] 裁決廢止），以及三條純 UI 條文（design token、Tab 共用元件、Tabs 化版型）——介面與互動的正本已歸 Prototype。
- `task-dispatch-board`（220 行）用介面名當 capability，`scheduling-center`（234 行）把待排區與外包追蹤混在一起，兩者的職責在本輪重新分配。
- 出貨與派單兩個模組從未建立 spec（`SHP-006` 記錄出貨缺口）。

生產階段尚未交付 Linear，交付前先清整。設計依據為 `production-stage-high-level-design.md`（六模組、實體與狀態機處置、端到端資料流、五指標與成本雙軌）與 `factory-business-current-state-2026-07-22.md`（15 步端到端流程、13 角色 R&R）。

本 change 為兩批中的批一：生產核心（M1 工單管理、M2 派工與現場執行、M3 排程與工廠總覽），並併入 M6 配方管理的三處校對（M6 的缺口全部咬著 M1 的展開行為與工單草稿建立，分批會讓中間狀態互相打架）。批二（M4 品檢與出貨、M5 派單、外圍 spec 生產引用段落）另立 change。

## What Changes

- **重寫 `work-order`（M1）**：吸收生產任務的結構與展開、預估成本凍結、交期倒推、補生產承接；移除 QC 單、工單區域、BOM 行項目與三條 UI 條文；欄位表與狀態列舉改引用 wiki 正本。
- **新建 `production-execution`（M2）**：待派任務接收、合批打包工作包、拉料備料、報工、場內轉交。吸收 `production-task` 的派工報工段、`work-package` 全部、`task-dispatch-board` 全部。
- **新建 `production-overview`（M3）**：三視角負荷（師傅／產線／設備）、設備運作總覽、五指標、卡點與閒置、類似品估算參考。取代 `scheduling-center`（交期倒推歸 M1）。
- **廢除五個 capability**：`production-task`、`work-package`、`task-dispatch-board`、`scheduling-center`、`schedule-backtrack`。
- **`equipment` 與 BOM 三類主檔微調**：設備所屬產線改產線標籤形態；三類主檔的承作廠商決定生產任務的生產單位類別。
- **M6 三處校對**：`print-item-recipe`／`component-recipe`／`recipe-expansion` 補角色權限；展開行為的正本收斂到 `recipe-expansion`（`work-order` 不再複寫）；落點改第一張工單、引用即覆蓋、印件層工序段自動建立跨工單前置。

## Capabilities

| capability | 動作 | 說明 |
|---|---|---|
| `work-order` | 重寫 | M1 工單管理 |
| `production-execution` | 新增 | M2 派工與現場執行 |
| `production-overview` | 新增 | M3 排程與工廠總覽 |
| `production-task` | 移除 | 結構歸 M1、報工歸 M2 |
| `work-package` | 移除 | 併入 M2 |
| `task-dispatch-board` | 移除 | 併入 M2 |
| `scheduling-center` | 移除 | 併入 M3，交期倒推歸 M1 |
| `schedule-backtrack` | 移除 | 倒推簡化後歸 M1，不另設階段概念 |
| `equipment` | 修改 | 產線標籤化、排程相關段歸 M3 |
| `material-master`／`process-master`／`binding-master` | 修改 | 承作廠商決定生產單位類別 |
| `print-item-recipe`／`component-recipe`／`recipe-expansion` | 修改 | 角色權限、展開行為歸屬、落點與覆蓋語意 |

## Impact

- **商業正本**：wiki `05-entities/`（工單、生產任務、工作包、報工紀錄、物料消耗記錄、轉交單、設備、產線、印件配方、部件配方）、`06-state-machines/`（工單狀態、生產任務狀態、轉交單狀態）、`04-business-logic/營運規則/訂單到交付/`（配方展開規則、工序相依性規則、報工規則、齊套邏輯、數量換算規則、BOM結構、印件生產流程）皆已於 2026-07-30 對齊本輪拍板，本 change 只引用、不改 wiki。
- **Prototype**：`erp` repo 分支 `prototype/production-stage` 的 M1 工單列表與詳情、M2/M3 production-floor 六頁、M6 recipes 四頁已實作，為介面與互動正本；本 change 的 Requirement 以其實際行為為對照基準。Prototype 待補的識別字改名（`MOCK_STYLES`／`style_no` 等）與路由（`recipes/styles` → `recipes/print-items`）隨本 change 的 apply 階段處理。
- **未涉及**：M4 品檢與出貨、M5 派單、外圍 spec 的生產引用段落（批二）；行動版介面（現場四角色的行動版為既有拍板，本輪 Prototype 只做桌面）。
