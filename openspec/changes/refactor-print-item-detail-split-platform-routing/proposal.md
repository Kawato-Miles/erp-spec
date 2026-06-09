## Why

印件詳情頁是印務 PM 與業務追蹤印件生命週期的核心介面，目前承擔雙重身分（印務戰情室 + 業務查閱），靠 `isSalesView` 條件分支控制 Tab 顯示。透過 impeccable critique 的 UX 評估識別兩個 P0 問題：

1. **生產進度藏在「資訊」Tab 第三張卡**：印務最高頻使用情境（日均 50+ 印件查看 = 「還欠多少張、哪張工單卡住」）被資訊架構錯置。預設停留資訊 Tab 雖然能看到生產資訊，但位於第三張卡需捲動；切到工單 Tab 看細節後想再看彙總，必須切回資訊 Tab + 捲動 = 兩次操作累積干擾。
2. **跨 Tab 上下文遺失**：訂單編號 / 客戶 / 交期作為使用者持續需要的錨點資訊，僅在「資訊」Tab 內顯示。切到工單 / QC / 出貨 Tab 後消失，違反 DESIGN.md §0.1 新補的「跨 Tab 上下文錨點原則」。

第三個觀察是後續擴充考量：`isSalesView` 條件分支模式在後續擴充其他單位平台時（諮詢平台 / 印務平台 / 工廠平台）會疊加變難維護，且破壞中台與各單位平台的職責邊界。雖然操作結果正確，但長期維護成本高。

## What Changes

1. **資訊架構重構**（印件詳情頁中台版）
   - 新增「生產進度 sub-header strip」永久 sticky：累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成度（已完成 / 總數）；位於 `ErpPageHeader` 下方，不在任何 Tab 內，永遠可見
   - 新增「訂單錨點 sub-header context strip」永久可見：訂單編號 + 客戶名 + 交期，訂單編號 link 至訂單詳情頁
   - 「資訊」Tab 內三張卡保留但「生產資訊」卡因核心數字已提升至 strip，調整為「明細導向」內容（per-WO 工單清單彙整 / 排程資訊 / 預期完工日等）
   - 「可報工 N 筆」標示從 TabsList 右側永久顯示改為僅工單 Tab active 時顯示（或收進工單 Tab 內）
   - 「資訊」Tab 內 ErpInfoTable + ErpSummaryGrid 並列視覺語言隨 strip 引入一併整理

2. **拆 routing：中台 vs 業務平台 vs 印務平台**（三平台分流，對齊 wiki [03-roles/](../../memory/Sens_wiki/wiki/erp/03-roles/) 各角色平台歸屬）
   - 中台：`/print-items/:id` 保留，給 Supervisor / 訂單管理人 / 審稿主管 / 印務主管 / 業務主管 / EC 商品管理，完整 7 Tab + sub-header 生產進度 strip + 訂單錨點 strip + 管理層動作（分配印件、審核工單）
   - 業務平台：新增 `/sales/print-items/:id`，給業務 / 諮詢 / 會計，3 Tab（資訊 / 審稿紀錄 / 活動紀錄）+ 訂單錨點 strip（無生產進度 strip）+ 純檢視（無報工 / 無管理動作）
   - 印務平台：新增 `/production/print-items/:id`，給印務（production_staff），完整 7 Tab + sub-header 生產進度 strip + 訂單錨點 strip + 印務聚焦動作（報工 / 勾選 PT）+ 隱藏管理層動作（分配印件 / 審核工單）
   - 移除 `PrintItemDetail.tsx` 內 `isSalesView` 條件分支邏輯，改為共用元件 + 三個 route entry（由 `platform` prop 控制 Tab 列表 + Sub-header 範圍 + 動作可見性）
   - 套用 `sales-platform` capability 既有差異描述模式（過濾規則 / 動作可見性 / 預設 Tab）

3. **新建 `production-platform` capability**
   - 類似 sales-platform 模式：承載「印務平台」容器內所有功能 spec 的集合，避免散落於 order-management / work-order 等模組 spec
   - 本次新增最小內容：容器定位 + 印件詳情頁
   - 後續印務平台功能（任務板 / 報工 board 等）由 follow-up change 增補

4. **後續擴充模式建立**
   - 為審稿平台 / 工廠平台 / 中國供應商平台後續拆 routing 建立先例，避免條件分支疊加

**BREAKING**：業務 / 諮詢使用者進入印件詳情頁的 URL 從 `/print-items/:id` 改為 `/sales/print-items/:id`。需更新所有外部連結來源（如業務平台印件總覽列表的 navigate 路徑）；既有書籤 / Slack 連結需 redirect 中介或廣播通知。

## Capabilities

### New Capabilities

- `production-platform`：「印務平台」容器（類似 sales-platform 結構），承載印務角色（production_staff）的工作介面 spec。本次新增最小內容：容器定位 + 印件詳情頁兩條 Requirement。後續印務平台功能由 follow-up change 增補

### Modified Capabilities

- `order-management`：新增 Requirement「印件詳情頁中台版資訊架構」（sub-header 進度 strip / 訂單錨點 / Tab 結構 / 可報工計數位置 / 「生產資訊」卡內容重整）。適用角色為中台管理層（Supervisor / 訂單管理人 / 審稿主管 / 印務主管 / 業務主管 / EC 商品管理）
- `sales-platform`：新增 Requirement「業務平台印件詳情頁」（路徑 `/sales/print-items/:id` / 3 Tab 範圍 / sub-header 簡化版 / 動作可見性差異）
- `user-roles`：新增 Requirement「印件詳情頁存取路徑分流」（三平台分流規則：中台 / 業務平台 / 印務平台，含 role-based redirect 規範）

## Impact

- **前端**：
  - 新增 sub-header strip 元件（位於 `ErpPageHeader` 與 Tabs 之間，sticky 行為，含生產進度 + 訂單錨點兩段）
  - `PrintItemDetail.tsx` 拆為兩個 page 元件，或保留共用元件 + 兩個 route entry（由 props 控制 Tab 列表 + sub-header strip 顯示與否）
  - 「資訊」Tab 內「生產資訊」卡內容重整（移除已上提至 strip 的累計數字）
  - 印件總覽列表（中台 + 業務平台版）點擊印件導航邏輯按使用者 role 決定路徑
- **Routing**：`App.tsx` 新增 `/sales/print-items/:id` route，role guard 同既有業務平台前綴規則（業務 / 諮詢可進；印務 / 主管可進但會被建議用中台 routing）
- **規格文件**：4 個 spec 新增 / 修改 delta（order-management / sales-platform / user-roles / work-order）
- **使用者**：
  - 印務 / 印務主管：跨 Tab 不再失去生產進度 + 訂單上下文，操作累積干擾降低（critique P0-1 + P0-2 解決）
  - 業務 / 諮詢：URL 改變，但操作行為一致；切換到業務平台版後與印務平台清楚分離（雙身分 OQ 解決）
- **風險**：
  - 既有書籤 / Slack 連結指向 `/print-items/:id` 的業務使用者：需 redirect 中介（業務 role 進入中台路徑時自動跳轉至業務平台版）或廣播通知 → 留 design 階段決定具體機制
  - sub-header strip 永久 sticky 佔據垂直空間（約 60-80px），需驗證視覺密度與下方 Tabs 不衝突 → 留 design 階段確認尺寸與斷點處理
  - 既有 critique 報告中 P1-1 ~ P1-5（手寫 Tabs 殼 / 任務子 Tab 三色 / inline Tailwind 色盤 / 無鍵盤快捷鍵 / inline empty state）不在本 change 範圍，由另一 change `align-print-item-detail-design-system-compliance` 處理

## OQ

依 Miles 指示，雙身分 OQ（印務戰情室 + 業務查閱應否拆 routing）已透過 impeccable critique 報告收斂為「拆 routing」決策。Notion Follow-up DB 中與印件詳情頁相關的既有未解 OQ 將於 design 階段一併檢視。
