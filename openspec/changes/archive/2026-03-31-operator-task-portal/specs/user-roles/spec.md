## MODIFIED Requirements

### Requirement: 師傅角色權責

師傅角色 SHALL 擁有以下權限：

| 權限 | 說明 |
|------|------|
| 查看自身生產任務 | 僅限 assigned_operator 為自己的生產任務 |
| 自助報工 | 填寫完成數量、報工工時（選填）、報工備註（選填） |
| 查看任務排程 | 查看今日與明日的任務排程（唯讀） |

師傅 MUST NOT 擁有以下權限：
- 修改排程（設備、日期）
- 修改目標數量
- 查看其他師傅的任務
- 存取 ERP 其他模組

#### Scenario: 師傅角色權限驗證

- **WHEN** 師傅嘗試存取非自身任務或修改排程資訊
- **THEN** 系統 MUST 回傳權限不足錯誤

### Requirement: 平台歸屬分類

#### Scenario: 工廠平台統一入口

- **WHEN** 系統初始化角色設定
- **THEN** 生管、師傅、外包廠商、QC、出貨 SHALL 歸屬於工廠平台
- **AND** 工廠平台內依角色顯示對應功能：生管看到日程面板；師傅看到師傅任務平台

#### Scenario: Prototype User 切換對應

- **WHEN** 使用者在 Prototype 的角色切換選單選擇生管
- **THEN** 系統 SHALL 自動導航至工廠平台首頁（日程面板）
- **AND** 側選單 SHALL 僅顯示工廠平台功能

- **WHEN** 使用者在 Prototype 的角色切換選單選擇師傅
- **THEN** 系統 SHALL 自動導航至師傅任務平台
- **AND** 側選單 SHALL 僅顯示師傅任務平台功能
