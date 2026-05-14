## 1. Spec 確認與 OQ 對齊

- [ ] 1.1 將本 change 涉及的設計取捨（業務平台版閹割範圍 / 工單列表不可點擊取捨 / 業務平台側邊欄入口命名）登錄至 Notion Follow-up DB，標記與本 change 關聯
- [ ] 1.2 三視角審查的 Round 2 收斂結論（破窗效應觀察、諮詢角色定位、業務團隊組織架構等延伸議題）整理為未來 change 候選清單，記錄於 memory 或 Notion

## 2. Prototype 業務平台路由與導覽

- [x] 2.1 確認 `/Users/b-f-03-029/sens-erp-prototype` 既有業務角色 Prototype 導覽結構（業務側邊欄目前已有的 group 與 sub item）
- [x] 2.2 於業務平台側邊欄新增「印件總覽」入口（命名暫沿用「印件總覽」，命名最終決策見 design § Open Questions 第 1 點）— AppSidebar.tsx 新增 `訂單管理_業務` MenuItem，sales / consultant 採用此 group
- [x] 2.3 新增業務平台路由（如 `/sales/print-items` 或對應路徑），與中台版印件總覽路由區隔 — App.tsx 加 `/sales/print-items` route 指向同一個 `PrintItemDashboard` 元件，sales / consultant ROLE_ALLOWED_PREFIXES 加 `/sales/` prefix

## 3. Prototype 印件總覽元件與資料層

- [x] 3.1 盤點中台版印件總覽既有 React 元件路徑（印務主管使用的印件總覽頁），確認可重用元件範圍 — 中台版位於 `src/pages/PrintItemDashboard.tsx`，內含 `isManager` 判斷與印務「我參與」過濾邏輯，可直接擴充
- [x] 3.2 業務平台印件總覽頁面採用既有元件，包裝層套用以下差異：
  - 資料層：依當前登入業務的 user id 過濾 `Order.sales_id = current_user.id` 之下的印件 — 採用 `order.salesPerson === currentUser.name`（Prototype mock data 以名稱比對）
  - 動作層：隱藏「分配印件」按鈕、隱藏「審核工單」相關操作 — `isSalesView` 條件渲染整個「操作」欄（th + td + colgroup col 同步隱藏）
  - 互動層：印件展開後的工單列表項目改為純文字呈現（不可點擊導航） — `<tr>` 移除 cursor-pointer / onClick；工單編號移除 `text-primary` / ExternalLink icon
  - 預設 Tab：不套用任何篩選 Tab（顯示全部印件） — 與中台版預設行為一致（stageFilter 預設 ''），無需額外處理
  - 印件名稱純文字（業務 / 諮詢無 `/print-items/:id` 路由存取權，避免被 RoleGuard 擋）
- [ ] 3.3 驗證篩選 Tab（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）切換正常，業務僅看到自己負責訂單下的印件 — 待 Lovable build 完視覺驗證

## 4. Prototype 權限與資料驗證

- [ ] 4.1 業務 Role 登入後：側邊欄出現印件總覽入口；中台版印件總覽路由（若直接訪問）被擋
- [ ] 4.2 印務主管 / 業務主管 / 諮詢 Role 登入後：業務平台路由不出現於導覽（諮詢雖屬業務平台但本次不開放此功能）
- [ ] 4.3 業務 A 登入 — 訂單 X（sales_id = B）下的印件 MUST NOT 出現於業務 A 的印件總覽
- [ ] 4.4 業務點擊印件展開 — 顯示工單清單但工單項目不可點擊
- [ ] 4.5 業務嘗試以 URL 直接訪問印務主管動作（如分配印件 API）— 系統回傳權限不足

## 5. Spec 與 Prototype 對齊收尾

- [ ] 5.1 Prototype 完成後，比對 sales-platform spec § 業務平台印件總覽 五個 Scenario 全部可在 Prototype 中驗證
- [ ] 5.2 比對 user-roles spec delta § 業務 Role 業務平台功能存取 三個 Scenario 全部可在 Prototype 中驗證
- [x] 5.3 將實作中遇到的偏離 spec 議題（如資料層 join 邏輯、過濾性能、UI 細節差異）記錄回 design.md § Open Questions 或新增 OQ — 已補 OQ 4 & 5（印件詳情頁路由處理、`/sales/` 路由前綴決定）
- [ ] 5.4 執行 doc-audit skill 檢查 user-roles spec / sales-platform spec / work-order spec 跨檔案一致性

## 6. Notion 推送（累積後執行，不在本次必做）

- [ ] 6.1 待累積數個 change 後，連同其他 user-roles spec 異動一併推送至 [使用者權責 Notion 頁面](https://www.notion.so/32c3886511fa8144b38adc9266395d15)
- [ ] 6.2 sales-platform 為新 capability，需決定是否建立對應的 Notion BRD 頁面（屬未來決策，本次不執行）
