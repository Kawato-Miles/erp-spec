## MODIFIED Requirements

### Requirement: 完成度計算（齊套性邏輯 Kitting Logic）

工單完成度 SHALL 以下列公式計算：

`floor(min(各「影響成品」生產任務之 QC 通過數 / 每份工單需生產數量))`

此計算 MUST 基於 QC 加總邏輯，不需序列化。

「QC 通過數」的正式欄位定義與計算公式見 [qc capability § QC 通過數與入庫數量的分層定義](../qc/spec.md)（`pt_qc_passed` = 該生產任務所有已完成 QC 紀錄之 `passed_quantity` 加總）。

#### Scenario: 工單完成度計算範例

WHEN 某工單有 2 個影響成品的生產任務 A 與 B
AND 生產任務 A 的 QC 通過數為 120，每份工單需生產數量為 50
AND 生產任務 B 的 QC 通過數為 90，每份工單需生產數量為 50
THEN 工單完成度 SHALL 為 floor(min(120/50, 90/50)) = floor(min(2.4, 1.8)) = floor(1.8) = 1

#### Scenario: 異動期間完成度計算持續運作

WHEN 工單處於異動流程中
THEN 完成度計算 SHALL 持續運作，不因異動狀態而暫停

#### Scenario: 打樣工單完成度獨立計算

WHEN 工單為打樣工單
THEN 其完成度 SHALL 獨立計算，不納入正式工單的完成度統計

## REMOVED Requirements

### Requirement: QC 單狀態機

**Reason**: QC 單狀態機移至獨立 `qc` capability 作為 Single Source of Truth（決策 D1）。原規則外加「已作廢」終態（D3b）於新位置定義，見 [qc capability § QC 單狀態機](../qc/spec.md)。

**Migration**: 讀者查詢 QC 單狀態流轉時，改讀 `openspec/specs/qc/spec.md` § QC 單狀態機。
