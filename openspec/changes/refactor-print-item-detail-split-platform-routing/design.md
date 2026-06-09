## Context

本 change 來自 impeccable critique 對印件詳情頁的 UX 評估（2026-05-18），識別兩個 P0 問題（生產進度藏在資訊 Tab、跨 Tab 上下文遺失）與一個 Persona Red Flag 雙身分 OQ（印務戰情室 + 業務查閱共用同一頁，靠 `isSalesView` 條件分支控制 Tab 顯示）。

當前狀態：
- `PrintItemDetail.tsx`（1226 行）為單一 page 元件，透過 `currentUser.role === 'sales' || 'consultant'` 控制 Tab 顯示（藏起 4 個 Tab）
- 唯一 routing：`/print-items/:id`，所有角色共用
- 既有 [print-item-detail-progress change](../archive/2026-05-18-print-item-detail-progress/) 已實作「工單與生產任務」區塊內容（含齊套性三欄、QC 徽章、報工入口），本 change 不重做這些內容，僅重構容器位置與 routing
- wiki [03-roles/](../../memory/Sens_wiki/wiki/erp/03-roles/) 各角色平台歸屬既定三平台對應（中台 / 業務平台 / 印務平台），但只有 sales-platform capability 已建（[2026-05-14 archive](../archive/2026-05-14-add-print-item-overview-to-sales-platform/)），印務平台 capability 尚未建立

約束：
- 跳過三視角審查（Miles 指示，本 change 路徑直接走 propose → specs → design → tasks）
- 跳過 senior-pm 前期介入（問題框架已透過 critique 報告收斂）
- ERP 桌機限定，不涉及行動裝置 RWD 設計
- 本 change 不涉及商業邏輯（齊套 / 付款 / 難易度等），ERP_Vault 卡不直接引用

## Goals / Non-Goals

**Goals**：

- 三平台拆 routing：中台 `/print-items/:id` / 業務平台 `/sales/print-items/:id` / 印務平台 `/production/print-items/:id`，對齊 user-roles spec § 平台歸屬分類
- 生產進度與訂單錨點提升為 Sub-header 持久區（跨 Tab 永久可見），對應 DESIGN.md §0.1「跨 Tab 上下文錨點原則」（已於 2026-05-18 補進規範）
- 移除 `isSalesView` 條件分支，改為三個 route entry 由 `platform` prop 控制差異
- 新建 `production-platform` capability，沿用 sales-platform 設計模式，為後續印務平台功能建立歸屬
- 為審稿 / 工廠 / 中國供應商三個尚未拆的平台 routing 建立可複用模式

**Non-Goals**：

- 不重做「工單與生產任務」區塊內容（已由 print-item-detail-progress 完成）
- 不新增 / 修改 production-task spec 內既有報工守門邏輯（沿用 print-item-detail-progress 規範）
- 不擴充印務平台到「印件詳情頁」以外的功能（任務板、報工 board 等留 follow-up change）
- 不修改其他「散落於 order-management 的印件相關 Requirement」（如「印件詳情頁工單與生產任務區塊」既已歸 order-management，不本次抽離至 production-platform）
- 不處理 critique 報告中 P1-1 ~ P1-5 純實作對齊（手寫 Tabs 殼 / 任務子 Tab 三色 / inline Tailwind 色盤 / 無鍵盤快捷鍵 / inline empty state），由另一 change `align-print-item-detail-design-system-compliance` 處理
- 不規劃舊 URL 永久 redirect（如 Slack / 書籤），僅做 session-level role-based redirect

## Decisions

### 1. 三平台拆 routing，非條件分支或雙平台

**選擇**：在中台 `/print-items/:id` 之外新增業務平台 `/sales/print-items/:id` 與印務平台 `/production/print-items/:id`，共三條獨立 routing。

**理由**：

- user-roles spec § 平台歸屬分類已將印務歸屬「印務平台」，印務主管歸「中台」，原本「印務在中台」的設計與 spec 不一致；本次正確對齊
- `isSalesView` 條件分支模式在每加一個平台時都要疊加（如 `isProductionView` / `isPrepressView`），最終會變成「同一頁面內藏 7 種角色組合」，可讀性與可維護性會崩潰
- 三平台分流為後續審稿 / 工廠 / 中國供應商平台建立可複用模式（user-roles spec § 平台歸屬分類已定義 6 個平台，目前僅 sales / production / 中台 三個有具體 routing）

**替代方案**：

- 雙平台（中台 + 業務平台，印務維持中台）：違反 user-roles spec 平台歸屬，且 critique Persona Red Flag「印務戰情室 vs 業務查閱」雙身分問題未完全解
- 條件分支持續疊加（加 `isProductionView` 等 flag）：累積維護債，違反「routing 分流」既有 sales-platform 設計範式

### 2. 新建 `production-platform` capability，沿用 sales-platform 模式

**選擇**：建立 `openspec/specs/production-platform/` 容器，本 change 內含「印務平台容器定位」+「印務平台印件詳情頁」兩個 Requirement。

**理由**：

- sales-platform 既有設計範式（容器 spec + 差異描述模式：過濾規則 / 動作可見性 / 預設 Tab）已驗證可行（2026-05-14 archive），印務平台直接套用同模式
- 印務平台未來會擴充（印務任務板、報工 board、跨印務協作介面等），早建容器避免日後散落於 order-management / work-order / production-task 等模組 spec
- 「印務平台版印件詳情頁」邏輯上屬於「印務平台容器」，不該強塞 order-management（業務 / 諮詢的「業務平台版印件詳情頁」也在 sales-platform，不在 order-management）

**替代方案**：

- 不新建 capability，把印務平台版內容塞 order-management：違反 sales-platform 設計範式一致性，且後續印務平台功能會無處安放
- 把所有平台版印件詳情頁 Requirement 都集中放在 order-management：違反「平台容器自治」原則，後續加印務任務板等功能會回頭挑戰此架構

### 3. 印務平台版內容對齊中台版（差動作可見性，不差 Tab 結構）

**選擇**：印務平台版印件詳情頁的 Tab 結構（完整 7 Tab）、Sub-header strip（生產進度 + 訂單錨點）與中台版完全一致；差別僅在動作可見性（隱藏「分配印件」「審核工單」等管理層動作）。

**理由**：

- 印務需要完整戰情室視角（看所有工單 / QC / 出貨進度），Tab 結構若閹割反而失去 print-item-detail-progress change 建立的跨工單透明化價值
- 動作層守門邏輯（報工只能對自己負責工單）已由 production-task spec § 印件詳情頁報工入口 規範，本 change 沿用，不重做
- 印務與管理層看相同戰情資訊有助於跨層溝通（印務跟印務主管討論時看到同一頁面結構，只是動作層差異）

**替代方案**：

- 印務平台版閹割為 4 Tab（資訊 / 工單 / QC / 活動紀錄，藏 審稿紀錄 / 轉交單 / 出貨單）：失去戰情室完整性，印務跨層協作時要切回中台才能看完整資訊
- 印務平台版 Tab 結構與中台版完全相同但動作層也一致（給印務管理動作）：違反 RBAC 邏輯（印務不該分配印件），會在多處 spec 內留矛盾

### 4. 共用 page 元件 + 三個 route entry，platform prop 控制差異

**選擇**：`PrintItemDetail.tsx` 重構為共用元件，吃 `platform: 'central' | 'sales' | 'production'` prop；`App.tsx` 加三個 route entry 各自傳對應 prop。

實作策略草圖（design level，不寫程式碼）：

```
App.tsx routes:
  /print-items/:id          → <PrintItemDetail platform="central" />
  /sales/print-items/:id    → <PrintItemDetail platform="sales" />
  /production/print-items/:id → <PrintItemDetail platform="production" />

PrintItemDetail 元件依 platform prop 決定：
  - Tab 列表（central / production = 7 Tab; sales = 3 Tab）
  - Sub-header 範圍（central / production = 進度 strip + 訂單錨點; sales = 僅訂單錨點）
  - 動作可見性（central = 含分配印件 / 審核工單; production = 含報工; sales = 純檢視）
```

**理由**：

- ERP 既有「業務平台印件總覽」也是共用元件 `PrintItemDashboard.tsx` 由 role 判斷差異（[add-print-item-overview-to-sales-platform change](../archive/2026-05-14-add-print-item-overview-to-sales-platform/)），同模式一致
- 印務平台版與中台版差異小（僅動作可見性），拆兩個獨立元件會大量重複；共用元件 + prop 更易維護
- 業務平台版差異大（3 Tab vs 7 Tab），但仍可用 platform prop 控制（早期回傳 null 跳過該 Tab）

**替代方案**：

- 三個獨立 page 元件：重複 1000+ 行程式碼，DRY 違反；任何 Tab 結構調整要改三處
- 拆 base 元件 + 三個 thin wrapper：對 ERP 規模 over-engineer，共用元件 + prop 已足夠

### 5. Role-based redirect 採雙向矩陣（middleware 層）

**選擇**：App.tsx 加 redirect middleware（或 HOC / route guard），偵測使用者 role 與當前路徑，自動 redirect 至對應平台：

- 業務 / 諮詢 / 會計 → 中台 / 印務平台 URL → 業務平台
- 印務 → 中台 / 業務平台 URL → 印務平台
- 中台 6 個角色 → 業務平台 / 印務平台 URL → 中台

**理由**：

- 既有書籤 / Slack 連結指向 `/print-items/:id`（中台路徑）的業務需要正確跳轉，避免看到不該看到的介面
- 雙向 redirect 保證每個 role 看到正確平台版本，不留「直接訪問錯誤路徑」漏洞
- 中台角色訪問業務 / 印務平台 URL 時自動轉回中台，避免印務主管誤入印務聚焦版而錯失「分配印件」管理動作

**替代方案**：

- 單向 redirect（僅業務 → 業務平台）：印務訪問中台 URL 會繼續看到中台介面，違反 routing 分流意圖
- 直接拒絕（顯示「無權訪問」）：UX 太差，使用者既有書籤無法用
- 不做 redirect，靠每個 page 元件自己檢查 role：違反 single source of truth，重複邏輯易出 bug

### 6. Sub-header strip 元件設計（生產進度 + 訂單錨點兩段）

**選擇**：新增 sub-header strip 元件（暫名 `PrintItemDetailSubHeader`），位於 `ErpPageHeader` 與 Tabs 之間，sticky 行為，承載兩段：

- **訂單錨點 strip**（上層）：訂單編號（link）+ 客戶名 + 交期，三項並排
- **生產進度 strip**（下層）：累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成度，四項數字並排

兩段都依 platform prop 決定顯示：
- central / production：兩段都顯示
- sales：僅顯示訂單錨點 strip

**理由**：

- 訂單錨點屬於 DESIGN.md §0.1「跨 Tab 錨點 B 類上下文關聯」，生產進度屬於「C 類戰情關鍵數字」，兩段語意不同應視覺區分
- 業務平台不需戰情層，僅訂單錨點即可（業務跟客戶溝通需要訂單編號這個錨點）
- Sticky 行為確保使用者捲動 Tab 內容時錨點仍在視野內

**替代方案**：

- 單一 strip 混合兩種資訊：違反 DESIGN.md §0.1 語意分層原則
- 把生產進度放回資訊 Tab 內：失去本 change 解 P0-1 的價值
- 把訂單錨點放 `ErpPageHeader` 內：違反 DESIGN.md §0.1「Header 只承載實體名稱 + 主動作」原則

### 7. 用 ADDED 取代 MODIFIED 簡化 spec 範圍

**選擇**：對 user-roles spec 不 MODIFY 既有「業務角色職責」/「諮詢角色職責」/「印務角色職責」三個 Requirement，改為 ADDED 一個新獨立 Requirement「印件詳情頁存取路徑分流」統一描述三平台分流規則。

**理由**：

- OpenSpec MODIFIED 要求 copy entire requirement 內容，三個 Requirement 加總 200+ 行，會讓 delta spec 變得龐大且有 90% 內容跟本 change 無關
- 「印件詳情頁存取路徑分流」是新概念，獨立成 Requirement 邏輯更清楚
- 既有三個角色 Requirement 的「印件詳情頁進入路徑」描述會被新 Requirement 隱含覆蓋（路徑分流是統一規則，不需在角色職責內重複描述）

**替代方案**：

- MODIFIED 三個既有 Requirement：spec 變龐大，重複內容；archive 後主 spec 內三個 Requirement 各自要加路徑描述，反而失去 single source of truth
- 不開新 Requirement，直接靠 sales-platform / production-platform 各自的 routing 描述：缺乏 user-roles spec 層的統一視角，使用者不知道「角色 → 平台 → 路徑」對應在哪查

## Risks / Trade-offs

- **Sub-header 永久 sticky 佔據垂直空間（~80-100px）**：訂單錨點 24px + 生產進度 56-72px。在 1280px 寬螢幕 + 800px 高螢幕下，Tab 內容區會被擠壓 → Mitigation：tasks 階段驗證最小視窗（1280×720）下的可用度；必要時兩段 strip 改單行（橫向擠壓而非縱向擠壓）

- **印務平台版內容與中台版高度重複（差動作可見性）**：未來中台版若有 Tab 結構調整，印務平台版要同步 → Mitigation：共用元件 + platform prop 設計避免兩處維護；任何 Tab 結構調整在 PrintItemDetail.tsx 一處改

- **既有書籤 / Slack 連結指向 `/print-items/:id` 大量存在**：Slack 上印務 / 業務分享的印件連結都是中台 URL → Mitigation：role-based redirect 自動轉向；不需通知用戶或改舊連結

- **production-platform capability 初版內容單薄（僅 1 個功能：印件詳情頁）**：可能被視為過早抽出 → Mitigation：sales-platform 初版也是單一功能（印件總覽），後續陸續擴充；早建容器避免日後散落

- **印務主管 redirect 規則的副作用**：印務主管訪問印務平台 URL 會被轉回中台，可能讓「印務主管想看印務聚焦版（避免被管理動作干擾）」這個情境失能 → Mitigation：留 OQ，看 Lovable 驗收後印務主管是否真有此需求；若有，可加「View as production_staff」mode 切換而非雙向 redirect

- **Tab 結構同步：印務平台版 vs 中台版**：若中台版 Tab 順序或數量調整，印務平台版要同步驗證 → Mitigation：共用元件 + platform prop 已涵蓋此風險；tasks 階段加 e2e 測試覆蓋三平台

## Migration Plan

本 change 為 Prototype 階段（無生產環境資料遷移），主要遷移點：

1. **Routing 層**：`App.tsx` 加兩條新 route（`/sales/print-items/:id` / `/production/print-items/:id`），保留既有 `/print-items/:id`
2. **PrintItemDetail.tsx 重構**：移除 `isSalesView` 條件分支，改為 `platform` prop 控制 Tab 列表與動作可見性
3. **PrintItemDashboard.tsx 點擊邏輯**：依 `currentUser.role` 決定 navigate 目標路徑（中台 / 業務平台 / 印務平台）
4. **Redirect middleware**：App.tsx 加 role-path 比對邏輯（route guard 或 wrapper component），偵測不匹配時 redirect
5. **Sub-header 元件**：新增 `PrintItemDetailSubHeader`（位於 `src/components/shared/` 或 `src/components/layout/`），由 PrintItemDetail.tsx 使用

Rollback 策略：
- 如 redirect middleware 行為意外，移除即可（不影響三條 routing 本身運作）
- 共用元件 + prop 設計可獨立部署中台 / 業務平台 / 印務平台三個 route（先上中台不變，再上業務 / 印務平台），降低同步上線風險

## Open Questions

- **OQ-1**：sub-header 在小視窗（< 1280px）的折疊行為 — 訂單錨點與生產進度若擠壓嚴重，是否要 (a) 折成 hamburger / (b) 橫向 scroll / (c) 限定最小視窗寬度。留 tasks 階段做最小視窗測試後決定
- **OQ-2**：印務主管是否需要「View as production_staff」模式 — 印務主管可能在某些情境（如代理印務報工、看印務日常視角）想看印務聚焦版而非中台版。目前 design 採雙向 redirect 不允許跨平台訪問。Lovable 驗收後若印務主管反饋有此需求，另開 follow-up change 加 view mode 切換
- **OQ-3**：「印件詳情頁工單與生產任務區塊」Requirement 是否應從 order-management 抽離至 production-platform — 此 Requirement 目前在 order-management（[2026-05-18 print-item-detail-progress archive](../archive/2026-05-18-print-item-detail-progress/)），但邏輯上屬印務戰情視角。本 change 範圍限定不動，但留 OQ 看後續是否要整理
