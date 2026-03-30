# 工廠平台（Factory Portal）

## Problem

1. **師傅缺少自助入口**：師傅不使用 ERP 系統，靠生管口頭告知當日工作，無法自行查看被分派任務或主動回報進度
2. **生管入口不明確**：生管的日程面板、分派、報工等功能散落在 ERP 各模組中，缺乏統一的工廠平台入口

## Approach

建立工廠平台作為統一入口，涵蓋生管與師傅的操作。生管在工廠平台內完成日程管理、分派、報工等日常作業；師傅查看自己被分派的任務並自助報工。

工廠平台涵蓋的角色（依 user-roles spec 的平台歸屬）：
- 生管：日程面板、分派、報工（已在 wo-dispatch-ux 實作，納入工廠平台範疇）
- 師傅：師傅任務平台（今日任務、報工）
- 外包廠商：（由 supplier-portal change 另行處理）
- QC：（Phase 2）
- 出貨：（Phase 2）

Phase 1 新增功能範圍（本 change）：
- 師傅今日任務表格（已指派且待處理 + 製作中的生產任務）
- 師傅自助報工（單筆 + 批次，填完成數量，首次報工觸發「製作中」）
- 明日預覽（查看明天排定的任務，唯讀）
- Prototype User 切換：生管與師傅角色切換後進入工廠平台

已完成功能（由其他 change 提供，納入工廠平台範疇）：
- 生管日程面板（wo-dispatch-ux）

## Capabilities

- factory-portal: 工廠平台 — 統一生管與師傅的操作入口，角色切換帶出對應功能

## Affected Specs

- production-task: 新增師傅自助報工的 Requirement
- user-roles: 更新師傅角色權責；生管平台歸屬納入工廠平台；定義工廠平台統一入口與 User 切換
- state-machines: 無狀態機異動，「待處理 → 製作中」觸發邏輯不變

## Design Constraints

- 平台限制：僅支援桌機瀏覽器（與 ERP 系統統一）
- 認證：使用 ERP 統一帳號，由 Supervisor/生管 建立並設定平台權限
- 資料範圍：師傅僅能看到 assigned_operator 為自己的生產任務
- 唯讀原則：師傅不可修改排程、設備、數量，僅能報工
- Prototype User 切換：角色切換至生管/師傅時，自動進入工廠平台

## Dependencies

- wo-dispatch-ux change 的 assigned_operator 欄位與生管日程面板
- 生產任務 spec 的報工邏輯（completed_quantity 記錄）

## Open Questions

- 師傅平台是否需要即時通知（Push notification）？
- 報工是否需要拍照佐證（Phase 1 或 Phase 2）？
