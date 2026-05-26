## Context

業務主管目前在中台僅能透過「訂單列表 + 售後狀態 filter」間接查看部門內未結案售後訂單，缺乏 ticket-centric 視角的全公司售後監控頁面。本 change 新增中台「售後服務」檢視頁，作為與業務平台「我的售後服務」對稱的監督視角。

依 [user-roles spec § 業務主管角色職責](../../specs/user-roles/spec.md)，業務主管「不參與 AfterSalesTicket 系統流程」+ 「核可決策範圍 = 部門內」，但業務主管對「售後事件處理品質」具高度利害關係。本 change 確立「**檢視範圍 = 全公司唯讀**」與「**核可決策範圍 = 部門內**」並存的職責邊界。

**設計方法論**：依 [sequential-design-collaboration 協議](../../../memory/erp/ERP_Vault/11-review-knowledge/protocols/sequential-design-collaboration.md) 變動性質分級「流程節點調整（單模組內）」，本 change 走 Phase 1（PM 釐清商業需求）+ Phase 3（顧問實作設計）+ Phase 4（PM 收斂匯報）三階段，跳過 Phase 2（CEO 指標）。所有取捨已由 Phase 4 PM 拍板，本文件記錄關鍵設計決策與理由。

**對稱結構參考**：
- 業務平台「我的售後服務」Page：[MyAfterSales.tsx](../../../sens-erp-prototype/src/pages/MyAfterSales.tsx)
- 業務平台「我的售後服務」Spec：[after-sales-ticket spec § Requirement: 我的售後服務作業頁](../../specs/after-sales-ticket/spec.md)
- 業務平台 sidebar 入口 Spec：[sales-platform spec § Requirement: 業務平台「我的售後服務」入口](../../specs/sales-platform/spec.md)

**業界對標參考**：
- [Zendesk Workflow recipe: Managing your escalation queue](https://support.zendesk.com/hc/en-us/articles/4408821995290-Workflow-recipe-Managing-your-escalation-queue) — supervisor view 採「Latest Update / ID」分組與排序，對應「最後活動時間」欄
- [Freshservice Supervisor Rules](https://msp.support.freshservice.com/support/solutions/articles/50000011087-automating-ticket-workflows-using-supervisor-rules) — supervisor view 與 approval workflow 分離設計（看歸看、做歸做）
- [Global Shop Solutions Dashboards for Manufacturers](https://www.globalshopsolutions.com/dashboards-for-manufacturing) — 「tile 帶連結 drill-down」設計，對應點 StatusCard 套用 filter

## Goals / Non-Goals

**Goals**:
- 提供業務主管 ticket-centric 視角的全公司售後監控頁，補完目前缺少的「跨業務主管全局視野」入口
- 確立「檢視範圍 = 全公司唯讀」與「核可決策範圍 = 部門內」並存的角色職責邊界（user-roles spec 明示）
- 與業務平台「我的售後服務」共用底層元件以降低維護成本，但保留兩頁獨立 page 以容納未來分歧演化
- 透過「最後活動時間」欄補強「ticket 停滯」信號（區分「受理多久」與「最後一次有動作多久」）
- 處理舊路由 `/sales-manager/after-sales-tickets`（已 REMOVED）→ 新路由 redirect，避免主管書籤失效

**Non-Goals**:
- 不引入管理層 dashboard 視覺化（圖表 / 趨勢線 / 堆疊圖），依 CLAUDE.md feedback「ERP 核心流程完成前不規劃 dashboard 類功能」
- 不引入主管直接操作 ticket 動作（建立 / 結案 / 修改 resolution / 建關聯 OA / 批次操作）
- 不引入「公司認賠金額月度統計」「case_category 分布」等管理 KPI 切片（由 user-roles spec § 會計角色職責 既有 Scenario 涵蓋）
- 不變更 AfterSalesTicket 實體 / 狀態機 / lifecycle / ActivityLog 結構
- 不變更業務 / 諮詢「我的售後服務」既有行為
- 不變更會計查閱路徑（會計仍從訂單詳情頁售後 Tab 唯讀查閱單張 ticket）
- 不引入新 capability spec（如 `backoffice` 或 `sales-manager-platform`），spec 異動限 `after-sales-ticket` ADDED + `user-roles` MODIFIED

## Decisions

### Decision 1：路由命名採 `/sales-manager/after-sales`（不含 `-tickets` 後綴）

**Alternatives considered**:
- A1: `/sales-manager/after-sales-tickets`
- A2: `/sales-manager/after-sales`（採用）
- A3: `/back-office/after-sales`

**Rationale**：
- A1 與既有已 REMOVED 路由 `/sales-manager/after-sales-tickets`（依 sales-platform spec line 192 規定）相同，會引發歷史包袱混淆，且既有 sales-platform spec 明確要求「若直接 visit 舊路徑系統 MUST 拒絕」
- A2 與兄弟路由風格一致（`/sales-manager/approvals` / `/sales-manager/adjustments` 均為單數動作或集合名詞 + 不帶 `tickets` 後綴）
- A2 與業務平台 `/my-after-sales` 對稱：主管視角 = `/sales-manager/after-sales`，個人視角 = `/my-after-sales`
- A2 過 5 秒測試（[[erp-naming-rules]]）：「after-sales」業務口語對應「售後」，所有角色 5 秒內聽懂
- A3 與既有 sidebar 入口路由前綴 `/sales-manager/*` 不一致

### Decision 2：與「我的售後服務」採方案 B（各自獨立 page + 共用底層元件）

**Alternatives considered**:
- A: 立即抽 `AfterSalesTicketListPage` 共用 page，業務平台版傳「過濾 opened_by = self」props，中台版傳「無 opened_by 過濾 + 加 opened_by 欄」props
- B: 各自獨立 page，內部共用底層元件（`StatusCard` / `ErpTableCard` / helper 函式）（採用）
- C: 先各自獨立，等第三個類似頁出現再抽（Rule of Three 觸發）

**Rationale**：
- A 會在頭兩個使用點就引入 premature abstraction，參數膨脹後反而比兩個獨立 page 更難維護
- 兩頁的篩選器組合不同（業務版 4 個 / 中台版 6 個）、欄位不同（中台版多 2 欄）、權限不同（中台版無自動 `opened_by` filter），共用 page 抽象成本高
- B 保持兩個 page 獨立演化空間：業務平台版未來可能加 owner 工作流元素，中台版未來可能加部門切片
- B 同時共用 helper 函式（`calcMyAfterSalesActionGroup` 直接重用、`calcMyAfterSalesSummary` 擴充以支援非 user-scoped 查詢）與基礎元件（`StatusCard` / `ErpTableCard` / `ErpPagination`），維護成本可控
- C 預留：若未來第三個 ticket-centric list view（如「會計售後對帳檢視頁」「Supervisor 全部售後監控頁」）出現且 spec 行為相近時，再開抽 `AfterSalesListPage` 共用元件的 change

**Trade-off 記錄**：本決策參考 [add-side-panel-shared-components change](../../changes/archive/) design § D6 紀錄的 Rule of Three premature abstraction trade-off，避免重蹈覆轍。

### Decision 3：status filter 與 next action filter 並存（AND 邏輯）

**Alternatives considered**:
- A: status filter 為主、next action 隱藏
- B: 兩者並存但 next action 限定在 status ≠ 已結案 時生效
- C: 兩者並存 AND 邏輯，皆為 select（採用）

**Rationale**：
- 「我的售後服務」用 next action 作為主要分群（status 隱式 ≠ 已結案）—— 個人作業視角下，業務 / 諮詢主要關心「自己下一步要做什麼」
- 中台檢視頁要支援「篩到已結案」查歷史，所以 status 必須顯式可篩；同時主管也關心 next action 信號（逾期 / 待填決議等）
- next action 與 status 不是 1-1 對應（「逾期」可橫跨「受理中」與「處理中」），主管實際工作場景中可能組合查詢
- 統一 select 形式避免 [review-loading-checklist § 三「列表頁版型範式」誤審案例](../../../memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md) 重蹈覆轍（「列表頁狀態主篩 MUST 用 select」）
- 兩者皆 select 並列在篩選 grid 內，視覺密度與「我的售後服務」一致

### Decision 4：opened_by 欄採「人名單欄 + hover tooltip 顯示角色」

**Alternatives considered**:
- A: 只顯示人名
- B: 角色+人名同 cell（如「業務 Alice」）
- C: 角色 col + 人名 col 分兩欄
- D: 人名 + hover tooltip 顯示角色（採用）

**Rationale**：
- 業務主管的核心工作是「找哪個 Slack 帳號跟催」，業務 / 諮詢角色資訊對「找人跟催」的決策幫助有限（兩者 Slack 群組可能在同一頻道）
- C 表格欄位數爆增（12 欄變 13 欄），低效益
- B 視覺密度高，cell 寬度需擴大
- D 視覺乾淨 + 必要時可查角色，欄寬建議 110px（人名 5-7 字 + padding）

### Decision 5：採納「最後活動時間」欄（沿用 `updatedAt`，留 OQ AFT-9 觀察）

**Alternatives considered**:
- A: 不加「最後活動時間」欄（沿用業務版 11 欄）
- B: 加「最後活動時間」欄，沿用 `AfterSalesTicket.updatedAt`（採用）
- C: 加「最後活動時間」欄，立即新建 `last_activity_at` derived field 聚合 ticket / OA / PrintItem 補印 / Payment 等下游事件最新 timestamp

**Rationale**：
- 主管視角的「最後活動時間」是判斷「ticket 是否停滯」的關鍵信號（status 雖未結案但 30 天無 ActivityLog 變動 = 可能被遺忘）
- 業界對標（Zendesk escalation queue）使用 Latest Update 欄位作為 supervisor view 標準欄
- `AfterSalesTicket.updatedAt` 已存在，所有 transitions（submitResolution / modifyResolution / close）+ appendComplaintLog + slack_thread_url 變更 + ActivityLog 寫入時均寫 `updatedAt`（依 prototype `src/types/afterSalesTicket.ts` 三個 transition helpers 與 appendComplaintLog 行為驗證），prototype 階段足夠
- C 在正式系統實作時需考慮（避免 `updatedAt` 語意污染：未來 ticket 加新欄位如後台對帳註記時也會 bump `updatedAt`），但 prototype 階段成本不划算
- 留 OQ AFT-9 標記升級條件（業務主管反映語意混淆 / 統計顯示「最後活動時間」與「真實最後業務行動」差距 > N 天的 ticket 比例 > X% 時觸發升級）

### Decision 6：移除獨立「操作」欄，改整行可點擊

**Alternatives considered**:
- A: 保留獨立「操作」欄（60px 寬，含 `[→]` 按鈕）+ 整行可點擊（雙入口）
- B: 移除獨立「操作」欄，整行可點擊（採用）

**Rationale**：
- 12 欄擁擠（業務版 11 欄已接近 1280px），移除 60px 操作欄為其他欄位留出空間
- 操作欄重複功能性低（整行 click 與 `[→]` 按鈕都跳同一個訂單詳情頁售後 Tab）
- 業務版保留操作欄是因為視覺一致性（其他列表頁如 QuoteListPage 也保留），但中台版的差異（多 2 欄）使整行可點擊成為更好選擇

### Decision 7：sidebar 入口無數字徽章

**Alternatives considered**:
- A: 顯示全公司未結案 ticket 數字徽章（與業務 / 諮詢版「我的售後服務」對稱）
- B: 只顯示「全公司逾期數字徽章」（紅色，更有監督價值）
- C: 不顯示任何數字徽章（採用）

**Rationale**：
- 業務 / 諮詢版顯示「自己的未結案數」很有意義（提醒漏單） — owner-scoped 概念清晰
- 業務主管版顯示「全公司未結案數」可能是上百張，徽章常駐顯示反而沒有信號意義（業界 ERP supervisor dashboard 通常用「dashboard 進入即顯示摘要 tile」取代 sidebar 徽章）
- B 雖有監督價值但「逾期門檻」依 [既有 OQ AFT-2「逾期分級」](../../../memory/erp/ERP_Vault/08-open-questions/AFT-2-逾期分級.md) 尚未拍板，現在綁徽章邏輯為時過早
- C 與既有中台 sidebar 風格一致（「訂單審核」「訂單異動審核」均無徽章）

### Decision 8：spec 異動採 after-sales-ticket ADDED + user-roles MODIFIED（不寫 sales-platform）

**Alternatives considered**:
- A: 僅 user-roles spec MODIFIED（顧問 Phase 3 建議，理由「本頁本質是角色職責擴充」）
- B: after-sales-ticket spec ADDED Requirement + user-roles spec MODIFIED（採用，Miles 探索階段確認）
- C: 新建 `backoffice` capability spec 容器
- D: 寫入 `sales-platform` capability

**Rationale**：
- A 不夠：本頁是獨立列表頁，有具體路由 / 頁面結構 / 過濾邏輯 / 跳轉行為 / 空狀態 / 分頁等「功能規格」層級內容，spec 載體應是 after-sales-ticket spec
- B 採納：
  - **對稱原則**：既有「我的售後服務作業頁」Requirement 在 after-sales-ticket spec，本 change 新增的「業務主管全公司售後管理頁」與其對稱，應放在同一 spec 內形成「兩個列表頁 Requirement」對照組
  - **user-roles spec 的角色定位**：依其 Purpose「定義各角色權責範圍、模組存取權限與平台歸屬」，應記載「業務主管擁有檢視全公司售後 ticket 的權限 + 不可直接操作的紀律邊界」，而非完整列表頁規格
  - 同步在 user-roles spec § 業務主管角色職責 MODIFIED 補充「中台售後服務檢視」職責 + ADDED Scenario「業務主管查看非管轄業務的售後 ticket 紀律邊界」
- C 過度設計：中台 capability spec 至今未建（既有「訂單審核」「訂單異動審核」均散落於各模組 spec），本 change 不適合先建容器
- D 違反容器原則：sales-platform 是業務平台容器（業務 / 諮詢 / 會計），業務主管屬中台，寫進 sales-platform 會破壞既有「容器 = 角色集合」分類

### Decision 9：舊路由 `/sales-manager/after-sales-tickets` redirect + Toast 提示

**Alternatives considered**:
- A: 純 404（依 sales-platform spec line 196 既有「若直接 visit 舊路徑系統 MUST 拒絕」）
- B: Silent redirect 至新路由
- C: Redirect + Toast「已升級為全公司售後管理頁」（採用）

**Rationale**：
- A 對主管不友善（主管可能在收信件 / Slack 通知時點到舊書籤）
- B 改善了 404 問題但未告知使用者「為什麼路徑變了」，可能造成困惑
- C 兼顧書籤 / 殘留 link 處理與資訊揭露，同時保留既有 sales-platform spec 「舊路由不可用」的精神（主管已不能用舊路徑進入舊頁面，因為舊頁面已 REMOVED；只是改為「自動帶到新頁面」）
- 實作於 tasks 加一條：「移除所有指向 `/sales-manager/after-sales-tickets` 的內部 link，並於 router 加 redirect 規則」

### Decision 10：摘要卡維持 3 張（逾期 / 待填決議 / 待結案）

**Alternatives considered**:
- A: 拆為 4 張（逾期 / 待填決議 / 待建關聯動作 / 待結案）—— 主管視角下「待建關聯動作」與「待結案」跟催角度不同
- B: 維持 3 張，與「我的售後服務」對稱（採用，「待結案」內合併「待建關聯動作」計數）

**Rationale**：
- 「我的售後服務」採 3 張是設計基準，業務主管頁與其對稱是核心設計原則
- 「待結案」與「待建關聯動作」在主管視角的跟催動作都是「催業務行動」，本質相同
- 拆 4 張會增加摘要卡視覺密度，違反 DESIGN.md § 6.1 範式 B 摘要卡簡潔原則
- 若主管確實需區分，「next action」table 欄位已能顯示「待結案」vs「待建關聯動作」兩值，filter 也可選擇套用，無需在摘要卡層級分開

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `AfterSalesTicket.updatedAt` 語意污染：未來 ticket 加新欄位（如後台對帳註記）僅該欄位更新也會 bump updatedAt，可能與「最後業務活動」漂移 | 留 OQ AFT-9，標記升級條件（業務主管反映語意混淆 / 統計顯示差距 > N 天的 ticket 比例 > X% 時觸發），prototype 階段沿用 updatedAt 足夠 |
| `calcMyAfterSalesSummary` 寫死 `openedBy = currentUserName` 篩選邏輯，無法直接重用於全公司範圍 | 擴充 helper 接受 options（`scope: 'user' \| 'all'`），或新建並列函式 `calcAfterSalesSummary(tickets, options?)`；本 change 必須處理此擴充 |
| 主管預設「全公司範圍」可能首次進頁面看到 200+ ticket 列表（5 主管 × 40 ticket / 主管假設）導致認知超載 | 預設 status filter ∈ {受理中, 處理中} 已大幅縮減；主管可進一步用「業務 / 諮詢負責人」filter 收斂；摘要卡點擊套用 next action filter 提供「逾期 / 待填決議 / 待結案」三個快速分群 |
| 業務主管 A 看到業務主管 B 管轄 ticket 後若違反紀律直接於訂單詳情頁編輯 ticket（雖然 spec 規範不允許） | 訂單詳情頁的售後 Tab 自身權限控制負責隱藏編輯按鈕（依 `Order.approved_by_sales_manager_id ≠ current_user` 條件），不僅依賴本頁設計；本 change 不修改訂單詳情頁權限邏輯（既有規則覆蓋） |
| 「最後活動時間」與「受理時間」兩欄語意接近，使用者可能誤把兩欄視為等價 | 在 UI tooltip 中明示語意差異（「受理 = 開單那一刻」「最後活動 = 任何 ticket 狀態 / 內容變更那一刻」）+ spec 中明示資料來源 |
| 業務主管實際使用此頁頻率低（< 每週 2 次）導致設計投資回報不足 | PM Phase 4 已列為 KPI 監測項；上線 4 週後評估，若使用率過低需考慮：(a) 調整入口位置 / (b) 增加 Slack 主動通知 / (c) 重新評估頁面定位 |
| 「業務 / 諮詢負責人」filter 預設單選可能不足以滿足「同時看 A + B 業務」需求 | 留 OQ 觀察（PM Phase 1 假設 4 已明示），實際使用後若多選需求強烈再開 change 升級 |

## Migration Plan

**前期準備**：
1. 確認 prototype 中 sidebar 既有 `business_manager` group `訂單管理_業務主管` 結構正確（依 [AppSidebar.tsx](../../../sens-erp-prototype/src/components/layout/AppSidebar.tsx) line 79-80）
2. 確認既有 `/sales-manager/after-sales-tickets` 路由已 REMOVED（依 sales-platform spec line 192）
3. 確認 `AfterSalesTicket.updatedAt` 在所有 transitions + appendComplaintLog 中正確更新（依 `src/types/afterSalesTicket.ts` 既有實作驗證）

**部署順序**：
1. Helper 擴充：擴充 `calcMyAfterSalesSummary` 接受 `scope` option 或新建並列函式 `calcAfterSalesSummary`
2. Page 元件：新增 `SalesManagerAfterSales.tsx`（或 `src/pages/sales-manager/SalesManagerAfterSales.tsx`）
3. Sidebar 入口：在 `AppSidebar.tsx` `business_manager` group `訂單管理_業務主管` 加第 4 個 sub item「售後服務」
4. Router：在 `App.tsx` 加路由 `/sales-manager/after-sales` 與 redirect 規則 `/sales-manager/after-sales-tickets` → `/sales-manager/after-sales`
5. 角色路徑：確認 `roleAllowedPaths.sales_manager` 含 `/sales-manager/after-sales`
6. E2E 測試：Playwright spec 涵蓋導航 / 篩選 / 摘要卡 toggle / 跳轉 / 權限 / redirect 等場景

**Rollback strategy**：
- 本 change 為純新增功能，無 breaking change
- 回滾僅需移除 sidebar 入口 + 路由 + page 檔案（既有「我的售後服務」與訂單詳情頁不受影響）
- 舊路由 redirect 規則可保留（向下相容無副作用）

## Open Questions

### OQ AFT-9（新建）：「最後活動時間」欄是否需升級為 `last_activity_at` derived field

**背景**：本 change 沿用 `AfterSalesTicket.updatedAt` 作為「最後活動時間」欄資料來源（prototype 階段足夠）。但 `updatedAt` 在資料庫慣例中泛指「任何欄位被更新的時間」，未來若 ticket 加新欄位（如後台對帳註記欄位）僅該欄位更新也會 bump updatedAt，可能與業務意義的「最後活動」漂移。

**方向 A（採用 - prototype 階段）**：沿用 `updatedAt`
- 成本：低（既有欄位，無需擴充）
- 風險：未來語意污染

**方向 B（觀察後升級）**：新建 `last_activity_at` derived field 聚合 ticket / 關聯 OA / 關聯 PrintItem 補印 / Payment 等下游事件的最新 timestamp
- 成本：中（需在所有相關事件 hook 中寫入 `last_activity_at`）
- 風險：低，語意精準

**升級觸發條件**：
- 業務主管反映語意混淆（如「為什麼這個 ticket 顯示『3 天前』但實際 30 天沒人動過？」）
- 統計顯示「最後活動時間」與「真實最後業務行動」差距 > N 天的 ticket 比例 > X%

**處置**：本 change 沿用方向 A，標記 OQ AFT-9 進入 Vault `08-open-questions/`，等待業務累積反饋。

### OQ AFT-1（既有，本 change 不解但關聯）：業務離職轉派

業務 / 諮詢離職時 ticket 負責人轉派的實務替代方案。本 change 新增的「業務主管全公司售後管理頁」可作為部分替代方案：主管可監督全公司未結案 ticket 並透過 Slack 協調介入（業務離職後其他業務 / 諮詢承接 ticket 編輯）。正式離職轉派實務留 AFT-1 持續觀察。

### OQ（未編號 - 觀察）：業務 / 諮詢負責人 filter 是否需支援多選

**背景**：PM Phase 1 假設 4 + Phase 3 顧問建議本 change v1 採單選 select，與「我的售後服務」既有 4 個 filter 模式一致。

**處置**：本 change 採單選，上線後觀察使用情境。若實際使用顯示多選需求強烈（如主管常想看「A 業務 + B 業務同時交接案件」），再開 change 升級為多選 select。
