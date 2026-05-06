## ADDED Requirements

### Requirement: 需求單詳情頁 Tabs 化版型

需求單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → （條件性 inline banners）→ ErpDetailTabs（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 需求單案名（標題）
- 需求單號 Badge（success 色系）
- 主動作群（依角色 / 狀態條件顯示）：
  - 業務：複製 / 編輯 / 流失 / 送印務評估 / 成交 / 重新報價 / 建立訂單
  - 業務主管：核可進入議價 / 一鍵確認（條件未變）
  - PM 或業務：評估完成
  - Supervisor：重新指定業務主管 / 重新指定印務主管

`ErpPageHeader` 與 `ErpDetailTabs` 之間 SHALL 保留條件性 inline banner 區（緊貼 Header 之下、Tabs 之上）：
- 業務側：需求確認中狀態下未指定業務主管或印務主管時的提示 banner
- 業務側：已評估成本 + 等待業務主管核可中的等待 banner
- 業務主管側：上次核可條件對照 banner
- 動作錯誤訊息 banner

需求單詳情頁 SHALL 包含 5 個 Tab（含條件隱藏 Tab），順序：`資訊（首位，defaultValue）→ 印件報價（{count}）→ 報價紀錄（{count}，業務 / 業務主管 才顯示）→ 權限管理（{count}）→ 活動紀錄`。

「資訊」Tab 為本 change 新增 Tab，SHALL 承載原 Tabs 之上的「基本資訊卡」：StatusStepper（狀態步驟條）+ 主資訊欄位（業務 / 業務主管 / 印務主管 / 客戶 / 等等）+ 收款備註 + 備註 + 流失原因 / 流失說明（status='流失' 時顯示）+ 報價金額橫排（報價輪次 / 小計 / 稅額 / 含稅總額）。

#### Scenario: 業務進入需求單詳情頁預設停留資訊 Tab

- **WHEN** 業務或業務主管進入需求單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 顯示基本資訊卡（含 StatusStepper + 主資訊欄位 + 報價金額橫排）

#### Scenario: 需求單詳情頁 Tab 順序符合業務流先後

- **WHEN** 業務瀏覽需求單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件報價 → 報價紀錄 → 權限管理 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）
- **AND** 「報價紀錄」Tab SHALL 在使用者非業務或業務主管時隱藏（沿用既有 `hidden: !(isSales || isSalesManager)` 邏輯）

#### Scenario: 需求單詳情頁資訊區重組

- **WHEN** 業務進入需求單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「基本資訊」卡
- **AND** 基本資訊卡 SHALL 在「資訊」Tab 內呈現

#### Scenario: 條件性 inline banner 位置

- **WHEN** 需求單 `status === '需求確認中'` 且使用者為業務、且未指定業務主管或印務主管
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示提示 banner
- **AND** banner SHALL NOT 出現在「資訊」Tab 內或其他 Tab 中

- **WHEN** 需求單 `status === '已評估成本'` 且 `approvalRequired === true` 且使用者為業務
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示等待核可 banner（含等待天數）

- **WHEN** 需求單 `status === '已評估成本'` 且使用者為指定業務主管 且 `lastApprovedPaymentTermsNote` 不為 null
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示「上次核可條件對照」banner
