# 師傅任務平台（Operator Task Portal）

## Problem

師傅（機台操作員）不使用 ERP 系統，目前靠生管口頭告知當日工作內容。師傅無法自行查看被分派的生產任務，也無法主動回報進度。生管需要逐一通知師傅並代為記錄報工，溝通成本高且容易遺漏。

## Approach

在 ERP 系統中建立師傅任務平台，透過角色切換帶出師傅專屬選單與路由。師傅登入後僅能看到自己被分派的生產任務，其他 ERP 模組不可見。

Phase 1 MVP 功能範圍：
- 今日任務表格（已指派且待處理 + 製作中的生產任務）
- 師傅自助報工（單筆 + 批次，填完成數量，首次報工觸發「製作中」）
- 明日預覽（查看明天排定的任務，唯讀）
- 角色選單權限（師傅僅看到任務平台，其他角色看到對應模組）

不含：歷史查詢、統計報表、跨日排程調整。

## Capabilities

- operator-task-portal: 師傅任務平台 — 角色切換進入，師傅查看自身生產任務並自助報工（單筆/批次）

## Affected Specs

- production-task: 新增師傅自助報工的 Requirement（目前 spec 註明 Phase 1 由生管代報，需擴充為師傅可直接報工）
- user-roles: 更新師傅角色權責（新增「查看自身生產任務」「自助報工」權限）
- state-machines: 無狀態機異動，「待處理 → 製作中」觸發邏輯不變（報工者從生管擴充為師傅本人）

## Design Constraints

- 平台限制：僅支援桌機瀏覽器（與 ERP 系統統一）
- 認證：使用 ERP 統一帳號，由 Supervisor/生管 建立並設定平台權限
- 資料範圍：師傅僅能看到 assigned_operator 為自己的生產任務
- 唯讀原則：師傅不可修改排程、設備、數量，僅能報工

## Dependencies

- wo-dispatch-ux change 的 assigned_operator 欄位為前提
- 生產任務 spec 的報工邏輯（completed_quantity 記錄）

## Open Questions

- 師傅平台是否需要即時通知（Push notification）？
- 報工是否需要拍照佐證（Phase 1 或 Phase 2）？
