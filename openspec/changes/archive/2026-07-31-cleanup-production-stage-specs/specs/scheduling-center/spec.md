## REMOVED Requirements

> `scheduling-center` 整份廢除：把待排區、設備佇列、外包追蹤與日期推算混在一起。待排與佇列歸 M3、外包追蹤歸 M5、日期推算歸 M1（交期倒推）。本檔列出全部 Requirement 的去向；capability 目錄於 archive 時移除。

### Requirement: 排程中心待排區

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 設備佇列管理

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 佇列式自動日期推算

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 外包追蹤區

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。

### Requirement: 三週滾動時間軸

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 排程中心交期預警

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 部分交貨試算

**Reason**: 掛點不展開，本輪不寫 Requirement。

### Requirement: 工期預設值

**Reason**: 結構與規劃歸 `work-order`（M1）。
