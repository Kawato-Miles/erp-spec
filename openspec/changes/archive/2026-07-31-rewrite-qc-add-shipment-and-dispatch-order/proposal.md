## Why

生產階段 openspec 清整的批二。批一（`cleanup-production-stage-specs`）已把 M1 工單管理、M2 派工與現場執行、M3 排程與工廠總覽重建完成、廢除五個過時 capability，並校對 M6 配方三份。剩下三塊在 spec 層仍是缺口或過時內容：

- **`qc`（31 行 1 Requirement）整份過時**：內容是「QC PT（type = qc）與 inspection PT（type = inspection）由 QC 角色接派工執行」的舊模型。2026-07-21 已拍板廢除品檢型生產任務與工序間品檢節點，品質帳改由印件層品檢紀錄承載（分次驗、隨驗隨入庫、一次一筆）。現行 spec 若被拿去實作，會做出一套不存在的派工品檢。
- **出貨從未建立 spec**：出貨單的行為規格只存在於 Prototype 與 wiki 卡，`order-management` 僅一句佔位（`SHP-006` 記錄此缺口）。批一驗收時 M4 出貨頁面已可操作，但沒有規格背書。
- **派單從未建立 spec**：派單是既有平台已實作的模組（13 值大陸處理狀態、報價核價、貨運單集運），ERP 端要做的是**迭代銜接**而非新建取代（`PT-032` 附帶結論）。目前 spec 層完全沒有它，工單製程審核完成自動產生派單這條鏈在 `work-order` 只寫得出一句話。
- **外圍 spec 殘留被推翻的生產概念**：`order-management` 三處（QC 狀態徽章、QC PT 與 inspection PT 的向上傳遞鏈、工單與任務層連動）、`business-scenarios` 兩處（QC 單步驟、任務層級欄）。批一的驗收判準 4.1 因此無法整庫零命中。

商業層的擋路項已於 2026-07-31 至 08-01 全數拍板封存：`QC-003`（不通過原因單選、初版六組選項）、`QC-005`（不建不符合報告單，品檢與打樣兩條路徑切開）、`QC-006`（外發回廠確認歸揀貨人員）、`SHP-013`（EC 海外訂單本輪當不存在）、`SHP-014`（退回實物不進系統）。出貨與外發的業務情境卡（`出貨與送達`、`外發委外與回廠點收`）已補齊，可作為 Scenario 的驗證來源。

## What Changes

- **重寫 `qc`（M4 品檢）**：改為印件層品檢紀錄的行為規格——待驗清單自轉交單明細按印件彙總、分次驗一次一筆、通過累計即入庫、不通過原因單選、缺口處置三分流由印務決策且掛印件層、品檢人員只記錄不決策。移除 QC PT 與 inspection PT 的全部條文。
- **新建 `shipment`（M4 出貨）**：業務建單與可出貨額度即時檢核、合箱不跨訂單、分批出貨、揀貨兩步、出貨三方式分流、送達確認與憑證、異常與作廢的額度回補、退回實物不進系統、印件與訂單的收尾觸發。解 `SHP-006`。
- **新建 `dispatch-order`（M5 派單）**：製程審核完成自動產生（廠商×工單）、任務交付＝派單發送、報價核價、外發在途段自動映射回生產任務、回廠點收即切終態並連動任務完成、運費關稅按重量攤回。海外直發三終態列為本輪範圍外。
- **外圍 spec 只改被推翻概念的段落**：`order-management` 三處、`business-scenarios` 兩處，其餘不碰。

## Capabilities

| capability | 動作 | 說明 |
|---|---|---|
| `qc` | 重寫 | M4 品檢：印件層品檢紀錄與缺口處置 |
| `shipment` | 新增 | M4 出貨：建單到送達的行為規格 |
| `dispatch-order` | 新增 | M5 派單：外發委外協作與回廠銜接 |
| `order-management` | 修改 | 三處被推翻的生產概念段落 |
| `business-scenarios` | 修改 | 兩處被推翻的生產概念段落 |

## Impact

- **spec 數量**：20 → 22 份（新增 `shipment`、`dispatch-order`）。
- **正本邊界不變**：三份 spec 皆不含欄位表與狀態列舉（欄位歸 wiki 實體卡、狀態列舉歸 wiki 狀態機卡、介面與互動歸 Prototype），只承載系統行為與轉換規則。
- **Prototype**：M4（`qc-shipping/inspection`、`qc-shipping/shipments`）與 M5（`dispatch-orders`）頁面在批一期間已落 `prototype/production-stage` 分支，本 change 的驗收含兩向缺口對照。
- **批一驗收判準 4.1** 於本 change archive 後可改為整庫零命中。
- **Linear 交付**：批一與批二全部 archive 後另開一輪走 `linear-delivery`，本 change 不含交付動作。
