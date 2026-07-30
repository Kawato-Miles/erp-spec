## REMOVED Requirements

> `production-task` 整份廢除：63 條 Requirement 橫跨工單結構、派工、報工、轉交、品檢、成本六件事，capability 的邊界本身就是矛盾來源。任務層（同生產單位分組實體）已於 2026-07-28 拍板移除，被報工與被算完成度的最小單位是生產任務。本檔列出全部 Requirement 的去向；capability 目錄於 archive 時移除。

### Requirement: 派工板

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 設備選擇與工廠指定

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 開工日期設定與完工推算

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 設備/工廠負載視圖

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 任務交付

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 生管接收與分派

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 師傅查看工作包

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 生產任務狀態機

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 師傅自助報工

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 供應商自助報工

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。

### Requirement: 供應商報價

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。

### Requirement: 生管確認報價

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。

### Requirement: 師傅任務平台今日視圖

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 生管代替報工

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 狀態向上傳遞

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 生產進度追蹤與工單完成度

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 任務異動管理

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 異動期間生產任務行為

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 供應商平台異動呈現

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。

### Requirement: 任務層 Bottom-up 作廢

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: 生管日程執行面板

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 合批分派操作

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 師傅指派歸屬

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 設備覆蓋機制

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 批次報工操作

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 提前分派

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 工序相依性管理

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 重新排程

**Reason**: 可視化與指標歸 `production-overview`（M3）。

### Requirement: 自動派工建議（Phase 2）

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: 拼版試算工具

**Reason**: 掛點不展開，本輪不寫 Requirement。

### Requirement: 產線管理

**Reason**: 欄位表與狀態列舉的正本歸 wiki，spec 不複寫。

### Requirement: 生產任務分類排序

**Reason**: 介面與互動的正本歸 Prototype，spec 不承載版型。

### Requirement: 生產任務詳情顯示稿件

**Reason**: 介面與互動的正本歸 Prototype，spec 不承載版型。

### Requirement: 設備預計成本計算

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 顏色倍率自動帶入

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: BOM 多形引用

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: pricing_selection 混合帶入

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: BOM 單價回查與成本計算

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: 色數加價計算

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: BOM 分類以 Tab 呈現

**Reason**: 介面與互動的正本歸 Prototype，spec 不承載版型。

### Requirement: TransferTicket 實體定位

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: TransferTicket 狀態機

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: TransferTicket 建立流程

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: Line-level 可申請上限

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: Slack 通知連結欄位

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: 印件詳情頁「轉交單」Tab

**Reason**: 介面與互動的正本歸 Prototype，spec 不承載版型。

### Requirement: TransferTicket Data Model

**Reason**: 欄位表與狀態列舉的正本歸 wiki，spec 不複寫。

### Requirement: TransferTicketLine Data Model

**Reason**: 欄位表與狀態列舉的正本歸 wiki，spec 不複寫。

### Requirement: 印件詳情頁報工入口

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 報工來源管道紀錄

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: 排程兩階段分離

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: ProductionTask type 與 scope 分類

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: ProductionTask 規劃期屬性

**Reason**: 結構與規劃歸 `work-order`（M1）。

### Requirement: QC PT 自動建立（每印件強制 1 個）

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: 品檢 PT 印務手動加入（工序層選擇性）

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: ProductionTaskWorkRecord 結果欄位

**Reason**: 欄位表與狀態列舉的正本歸 wiki，spec 不複寫。

### Requirement: QC / 品檢 PT 完成判定與累計

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: PT 相依性檢查（生管派工前置）

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: NCR（不合格紀錄）實體

**Reason**: 品檢歸批二的 `qc`（M4）。

### Requirement: NCR Disposition 機制

**Reason**: 品檢歸批二的 `qc`（M4）。

### Requirement: 派工板顯示多 type 任務

**Reason**: 現場執行歸 `production-execution`（M2）。

### Requirement: ActivityLog 稽核鉤子（P2-4）

**Reason**: 本輪拍板廢止，無承接者。

### Requirement: 供應商報價審核流程

**Reason**: 外包協作歸批二的 `dispatch-order`（M5）。
