## Context

### 既有售後服務設計（2026-05-18 add-after-sales-ticket 歸檔）

- 訂單詳情頁「售後服務」Tab（[AfterSalesSection.tsx](../../../../sens-erp-prototype/src/components/order/AfterSalesSection.tsx)）：單訂單 scope
- 首頁 widget「我的未結案售後」（[MyAfterSalesBucket.tsx](../../../../sens-erp-prototype/src/components/order/MyAfterSalesBucket.tsx)）：被動展示，無 next action 提示
- 訂單列表「售後狀態」欄位 + 篩選器（[OrderList.tsx](../../../../sens-erp-prototype/src/pages/OrderList.tsx)）：訂單視角，非 ticket 視角
- 業務主管後台「售後服務單轉派」頁（[ManageAfterSalesTicketOwnership.tsx](../../../../sens-erp-prototype/src/pages/sales-manager/ManageAfterSalesTicketOwnership.tsx)）：全公司 ticket + 批次轉派

### 商業層商業背景

- [售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)：明確標示「業務 / 諮詢」為 ticket 開單與執行角色
- [諮詢角色卡](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)：諮詢與業務在系統權限與職責大部分重疊（負責 EC 客服 + 售前評估），可繼承業務權限
- [user-roles spec § 諮詢角色額外職責](../../../specs/user-roles/spec.md)：spec 已明確「諮詢角色 SHALL 具備與業務角色相同的模組權限」

### 痛點與決策驅動

- **漏單沒處理**（Miles 答覆）：widget 信號太被動，業務 / 諮詢未養成主動追蹤習慣
- **業務主管不會介入轉派**（Miles 答覆）：既有「業務主管後台轉派頁」屬冗餘功能，應整套移除
- **諮詢也是 ticket owner**（Miles 答覆）：spec 既有支援（諮詢繼承業務），但 after-sales-ticket spec 文字未顯式化
- **視圖範圍「我的就好」**（Miles 答覆）：不做 saved views、不做「全公司」視圖

## Goals / Non-Goals

**Goals:**

- 業務 / 諮詢有專屬作業頁，登入後可從 sidebar 一鍵進入，明確看到「我有什麼要處理」
- 加強漏單信號：頂端待辦摘要（逾期 / 待填決議 / 待結案）+ 依 next action 分組 + 逾期紅色徽章
- 諮詢角色在 after-sales-ticket spec 文字明確化（spec 既有支援，但需顯式以避免理解歧義）
- 移除冗餘的業務主管轉派功能整套（spec + Prototype + schema + store action）
- Vault 商業層同步：售後服務實體卡與諮詢角色卡

**Non-Goals:**

- 不做「全公司未結案」視圖（Miles 明確不要 admin 視角，業務 / 諮詢只看自己的）
- 不做 dashboard / KPI 視覺化（依專案原則：核心流程完成前不做 dashboard 類功能）
- 不做業務離職 / 請假的系統替代方案（標 [OQ AFT-1](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md)，留待未來釐清）
- 不做 saved views 機制（單一視角即可，量級不需要）
- 不做 kanban / queue 領取機制（印刷業 ticket 量級不需要，業界對 3 狀態 ticket 採 kanban 為反模式）
- 不引入 SLA policy 引擎（沿用既有 `DEFAULT_RED_LIGHT_DAYS = 7` 單一閾值，[OQ AFT-2](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-2-逾期分級.md) 留待分級設計）

## Decisions

### D1：採用「依 next action 分組」而非「依 status 分組」

**選擇**：頁面 ticket 列表按 next action 分組（逾期 / 待填決議 / 待建關聯動作 / 待結案），各組內按 `openedAt` 升序。

**Rationale**：
- spec 中 status 只有 3 種（受理中 / 處理中 / 已結案），分組粒度過粗，業務 / 諮詢無法直接看出下一步該做什麼
- next action 直接對應業務 / 諮詢的動作（填 resolution / 建 OrderAdjustment / 結案），減少認知負擔
- 業界客服 ticket 系統（Zendesk / Freshdesk）也常以「待處理動作」為分組依據

**Alternatives considered**：
- 依 status 分組（受理中 / 處理中 兩組）→ 太粗，業務仍要逐張看才知道下一步
- FIFO 排序無分組 → 業界反模式，緊急 case 容易被淹沒
- 全混合排序但 next action 標籤化 → 信號弱

**邏輯定義**：

| next action 分組 | 條件 |
|------|------|
| 逾期 | `opened_at > DEFAULT_RED_LIGHT_DAYS (7 天)` 且 `status ≠ 已結案`（含所有未結案逾期 ticket）|
| 待填決議 | `status = 受理中` 且 `resolution = NULL` 且 **非逾期** |
| 待建關聯動作 | `status = 處理中` 且 `resolution ∈ {退款, 補印, 退款+補印}` 且該 resolution 對應的下游動作（OrderAdjustment / 補印 PrintItem）尚未建立 且 **非逾期** |
| 待結案 | `status = 處理中` 且 對應下游動作已執行（或 `resolution = 不處理`）且 **非逾期** |

注：「逾期」與其他三組互斥（逾期優先），確保每張 ticket 僅出現在一組。

### D2：移除業務主管轉派功能整套（BREAKING）

**選擇**：spec REMOVED「業務離職 / 請假時 ticket 負責人轉派」整個 Requirement、schema REMOVED `owner_transfer_log` 欄位、Prototype 整頁刪 `ManageAfterSalesTicketOwnership.tsx`、`useErpStore.transferAfterSalesTickets` action 移除。

**Rationale**：
- Miles 明確答覆：「業務主管不會有轉派售後服務的情境，相關功能要先拿掉」
- 既有功能在 prototype 中為孤立路徑（沒有從業務 / 諮詢角度的真實使用情境驅動）
- 業務離職 / 長假的實務情境少且不需系統化解決方案（標 OQ 留待釐清）

**Risk**：本 change 屬 BREAKING（spec + schema + Prototype 同步移除）；mock data 中現有的 `ownerTransferLog` 紀錄將遺失，但 prototype 屬 mock 階段無正式資料需要保留。

### D3：諮詢角色透過既有「諮詢繼承業務權限」Requirement 隱含支援，after-sales-ticket spec 文字顯式化

**選擇**：不動 user-roles spec；after-sales-ticket spec 中所有「業務」字眼改為「業務 / 諮詢」（顯式化）。

**Rationale**：
- [user-roles spec § Requirement: 諮詢角色額外職責](../../../specs/user-roles/spec.md) 既有「諮詢角色 SHALL 具備與業務角色相同的模組權限」
- 但 after-sales-ticket spec 中所有 Requirement / Scenario 都以「業務」描述執行者，會讓讀者誤以為諮詢不在範圍內
- 顯式化「業務 / 諮詢」可避免歧義，且不破壞既有權限模型

**Alternatives considered**：
- 動 user-roles spec 明確列出諮詢的售後權責 → 與既有「諮詢繼承業務」原則衝突，且加重維護成本
- 維持「業務」不改 → 讀者歧義風險，與 Vault 售後服務卡標示「業務 / 諮詢：開單、執行」不一致

### D4：移除 MyAfterSalesBucket widget，sidebar 入口數字徽章替代

**選擇**：刪除 `MyAfterSalesBucket.tsx` 元件、從 `Index.tsx` 移除嵌入；新模組的 sidebar 入口顯示未結案 ticket 數字徽章作為 quick glance 提醒。

**Rationale**：
- Miles 指出：`Index.tsx`（首頁）標題為「需求單管理」、麵包屑為「首頁 → 需求單管理」、內容為 `QuoteListPage`（需求單列表），但卻嵌入了售後 widget — 業務情境上需求單尚未成交不會有售後事件，widget 屬資訊架構錯位
- 既有 widget 的「漏單提醒」功能已由新模組的兩個機制替代：(1) sidebar 入口持續顯示未結案數字徽章 (2) 新頁頂端待辦摘要 + next action 分組提供更強信號
- 移除 widget 可釋出首頁空間給真正屬於「需求單管理」的內容；後續若需要「業務工作台」獨立頁，再開新 change

**Alternatives considered**：
- 保留 widget 加 footer link（plan 原本決議）→ Miles 否決：需求單列表頁不該有售後資訊
- 保留 widget 移到別處（如新建「業務看板」獨立頁）→ 超出本 change 範圍，且新模組已能替代功能
- 保留 widget 元件但不嵌入任何頁面 → karpathy-guidelines 反 pattern（orphan 元件，本 change 造成的死碼應該刪）

### D5：預設視圖「我的未結案」單一視圖，不做 saved views

**選擇**：頁面僅顯示 `openedBy = currentUser AND status ≠ 已結案` 的 ticket。

**Rationale**：
- Miles 確認「我的就好」
- 業界共識：客服 ticket 系統做 saved views 是因量級大（每日上百張），印刷業售後 ticket 量級遠小於此
- 若未來業務 / 諮詢有「看歷史結案 ticket」需求，可從訂單詳情頁「售後服務」Tab 進入

**Alternatives considered**：
- Tab 切換「我的 / 全公司 / 逾期」→ 與「我的就好」決策衝突
- 預設「我的未結案」+ 篩選器加 status 篩選 → 雖技術上可行，但會打開業務 / 諮詢看其他人 ticket 的可能（與 Miles 確認「我的就好」精神不符）

### D6：「逾期」維持 7 天單一閾值（沿用 DEFAULT_RED_LIGHT_DAYS）

**選擇**：MVP 沿用既有常數 `DEFAULT_RED_LIGHT_DAYS = 7`，不分級。

**Rationale**：
- MVP 求簡化，分級設計需要客戶 SLA / case 緊急度分析支援
- 沿用既有常數，與訂單列表售後欄位、業務看板分桶邏輯一致
- 標 [OQ AFT-2](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-2-逾期分級.md) 留待後續釐清

### D7：next action 計算邏輯抽至 useErpStore selector

**選擇**：新增 store selector：
- `selectMyActiveAfterSalesTickets(state)`：當前使用者未結案 ticket
- `selectMyAfterSalesActionGroups(state)`：依 next action 分組的 ticket map
- `selectMyAfterSalesSummary(state)`：頂端待辦摘要的數字（逾期 / 待填決議 / 待結案）

**Rationale**：
- 邏輯依賴 ticket / OrderAdjustment / 時間判斷的綜合計算，分散在元件層難維護
- 統一在 store selector 便於跨元件複用（widget 也用到）
- 利於 unit test 保護邏輯正確性

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 業務 / 諮詢未養成使用新頁的習慣，漏單問題持續 | sidebar 入口持續顯示未結案數字徽章（任何頁面都看得到）；新頁待辦摘要設計提供更強信號；未來可考慮加 in-app notification |
| 業務離職後未結案 ticket 無法系統化轉派 | 短期靠人工流程（手動改 mock data 或 IT 介入）；長期由 [OQ AFT-1](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md) 決議 |
| 移除 owner_transfer_log 欄位後，舊資料若有歷史轉派紀錄會遺失 | prototype 屬 mock data 無正式資料；正式上線前需評估歷史紀錄歸檔（OQ） |
| next action 分組邏輯複雜，selector 與測試成本 | 邏輯抽至 useErpStore selector 統一管理；搭配 unit test 與 e2e 驗證 |
| 諮詢角色「售後 ticket owner」顯式化後，諮詢實際使用時可能發現權限或流程細節未涵蓋 | spec 與 prototype 完成後做諮詢角色 dogfooding；若發現缺漏，後續 change 補強 |

## Migration Plan

1. **Prototype 階段（依 tasks.md 執行）**：
   - 新增 `/my-after-sales` 路由與元件
   - sidebar：業務 / 諮詢加新入口（含未結案數字徽章）、移除 `/sales-manager/after-sales-tickets` 入口
   - 刪除 `ManageAfterSalesTicketOwnership.tsx` 整頁
   - 刪除 `MyAfterSalesBucket.tsx` 整個元件
   - 從 `Index.tsx` 移除 widget import 與嵌入
   - 清 `transferAfterSalesTickets` action、`OwnerTransferLog` type
   - mock data 清 `ownerTransferLog` 欄位
   - 新增 selectors（`selectMyActiveAfterSalesTickets` 等）

2. **Spec 階段**：
   - after-sales-ticket spec：應用本 change delta（ADDED + MODIFIED + REMOVED）
   - sales-platform spec：應用本 change delta（ADDED「業務平台『我的售後服務』入口」）
   - 不動 user-roles spec（既有「諮詢繼承業務」已涵蓋）

3. **Vault 同步階段**：
   - [售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)：核心欄位段移除 `owner_transfer_log` row、相關角色段移除「訂單管理人：批次轉派 ticket 負責人」
   - [諮詢角色卡](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)：frontmatter `module` 加 `after-sales-ticket`

4. **驗證階段**：
   - `openspec validate add-my-after-sales-action-page-and-remove-owner-transfer --strict`
   - Playwright e2e：`tests/e2e/my-after-sales.spec.ts` 涵蓋業務 / 諮詢兩角色 + 待辦摘要 + next action 分組 + 跨頁面導航 + 舊功能移除驗證

5. **Rollback 策略**：
   - 新頁面下架可單獨進行（不影響其他 spec）
   - spec REMOVED 不執行直到 prototype 驗證通過
   - schema 移除 `owner_transfer_log` 屬不可逆（資料層面），但 mock data 階段無正式資料風險

## Open Questions

- [OQ AFT-1：業務離職 / 請假時未結案 ticket 的實務替代處理方式](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md)
- [OQ AFT-2：「逾期」是否分 7 / 14 / 30 三級](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-2-逾期分級.md)
