# Tasks — 業務主管改派負責業務

> Prototype 路徑：`/Users/b-f-03-029/sens-erp-prototype/src/`。實作於 `/opsx:apply` 階段執行。

## 1. 資料層（型別 + store）

- [ ] 1.1 ActivityLog 新增 `OWNER_REASSIGNED` 事件型別，payload 含五要素：`before_owner` / `after_owner` / `reassigned_at` / `reassign_reason_category` / `reassign_note` / `operated_by`（design D1）
- [ ] 1.2 新增 `reassign_reason_category` LOV 五值（離職交接 / 長假代理 / 工作負荷平衡 / 客戶要求換窗口 / 其他）+ `reassign_note` 型別（design D1）
- [ ] 1.3 store 改派 action（三單據）：更新 owner（諮詢單 consultantId / 需求單 assignedSales / 訂單 salesPerson）+ 寫 ActivityLog OWNER_REASSIGNED + 依 reason_category 處置 sharedMembers（離職清空、其餘保留，design D5）+ 觸發通知（新負責人一律、原負責人依分類，Slack mock console.warn，design D6）。MUST NOT 改變單據狀態（design D2）
- [ ] 1.4 候選新負責人 selector：依 Role 模組權限篩選（訂單→訂單管理權限 / 需求單→需求單權限 / 諮詢單→諮詢權限），排除原負責人（design D4）
- [ ] 1.5 確認售後服務負責人衍生自訂單 salesPerson（design D3）：檢查既有實作是否已衍生；若為獨立欄位則改為衍生 + 改派訂單連帶轉移

## 2. UI 層（共用 Dialog + 三單據入口）

- [ ] 2.1 共用改派 Dialog 元件：選新負責人（候選來自 1.4）+ 必選 reason_category + 選填 note + 防呆（新≠原 disabled、單據非禁改派狀態、RoleGuard 業務主管）
- [ ] 2.2 訂單詳情頁「資訊」Tab 業務負責人 row：業務主管視角顯示「改派負責人」入口、業務/諮詢視角維持純文字（order-management MODIFIED 訂單詳情頁業務負責人 row 簡化）
- [ ] 2.3 需求單詳情頁業務主管視角「改派負責人」入口（與檢視權限管理/分享入口分開）
- [ ] 2.4 諮詢單詳情頁：consultant_id 為空→顯示「認領/代為認領」、已有值→顯示「改派負責人」，兩入口互斥（consultation-request MODIFIED 諮詢人員認領 § 認領 vs 改派區分）

## 3. 狀態 / 邊界閘門

- [ ] 3.1 終態禁改派 disabled + Tooltip：訂單已取消 / 需求單成交·流失 / 諮詢單完成諮詢·已取消（state-machines ADDED 負責業務改派的狀態約束）
- [ ] 3.2 訂單完成狀態例外允許改派（售後繼承，design D3 / state-machines Scenario）
- [ ] 3.3 電商訂單無 salesPerson 時改派入口 disabled + Tooltip（order-management Scenario 電商訂單無負責業務時改派 disabled）

## 4. 權限收斂

- [ ] 4.1 改派入口全程 RoleGuard 限業務主管（currentUser.role 業務主管權限）
- [ ] 4.2 業務「轉單」收斂為「僅分享」：確認 prototype 無業務自行改 owner 的 UI 殘留；業務/諮詢視角僅見分享入口（user-roles MODIFIED 業務與諮詢角色的工單查閱限制 + ADDED 業務主管改派負責業務職責）

## 5. e2e 驗證（Playwright，console.error/pageerror 嚴格斷言）

- [ ] 5.1 業務主管改派三單據 smoke：改派後 owner 欄位變更 + ActivityLog 新增 OWNER_REASSIGNED 五要素 + 狀態不變
- [ ] 5.2 角色權限斷言：切 sales_manager 三單據詳情頁出現改派入口；切 sales 無改派入口、僅見分享
- [ ] 5.3 終態/邊界：訂單已取消 disabled、訂單完成可改派、電商空負責人 disabled、需求單成交·流失 disabled、諮詢單完成·取消 disabled
- [ ] 5.4 reason_category 驅動：離職交接清空 sharedMembers + 不通知原負責人；其餘保留 + 通知原負責人；新負責人一律通知
- [ ] 5.5 諮詢單認領/改派互斥：consultant_id 空顯認領、有值顯改派

## 6. Spec / wiki 對齊（archive 階段）

- [ ] 6.1 archive 時 sync 5 delta 至 main spec（user-roles / order-management / quote-request / consultation-request / state-machines），確認 3 個 MODIFIED 的 exact-title 匹配
- [ ] 6.2 確認 after-sales-ticket spec 是否需補「售後負責人衍生自訂單負責人」delta（design Open Questions）
- [ ] 6.3 archive 後回補 wiki 商業邏輯卡（依 doc-audit）：[[訂單]] / [[需求單]] / [[諮詢單]] 實體卡 owner 改派語意、[[業務]] / [[業務主管]] / [[諮詢]] 角色卡（業務僅分享、主管改派）、03-roles _alignment-report（業務轉單收斂）
- [ ] 6.4 更新 OQ：XM-008 / CR-4 標 answered（oq-manage mode C）；AFT-1 補本 change 涵蓋前段三單據售後歸屬（mode C）
