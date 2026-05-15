## 1. 資料層基礎（Prototype Data Store）

- [x] 1.1 新增 `types/afterSalesTicket.ts`：定義 AfterSalesTicket TypeScript type（含所有欄位、enum、derived field）
- [x] 1.2 於 `types/order.ts` OrderPrintItem 新增 `related_after_sales_ticket_id: string | null`
- [x] 1.3 於 `types/order.ts` OrderAdjustment 新增 `linked_after_sales_ticket_id: string | null`，移除 `adjustment_phase` 欄位
- [x] 1.4 於 `storeTestUtils.ts` 新增 `makeAfterSalesTicket(overrides)` factory，提供合理預設值（status=受理中、resolution=null、closure_status=未結案 等）
- [x] 1.5 於 `storeTestUtils.ts` 更新 `makeOrderAdjustment(overrides)` factory：移除 adjustment_phase，新增 linked_after_sales_ticket_id（預設 null）
- [x] 1.6 於 `storeTestUtils.ts` 更新 `makeOrderPrintItem(overrides)` factory：新增 related_after_sales_ticket_id（預設 null）
- [x] 1.7 於 `seedData.ts` 新增 `mockAfterSalesTickets`：含三筆情境驅動 mock（不處理-已結案、退款-處理中、補印-處理中）+ 對應關聯 OrderAdjustment / PrintItem
- [x] 1.8 於 `seedData.ts` 移除既有 `OrderAdjustment(phase=after_completion)` mock，改為「對應訂單建 AfterSalesTicket（legacy_migrated=true）+ ticket 內掛該 OrderAdjustment（linked_after_sales_ticket_id 寫入）」
- [x] 1.9 於 `seedData.ts` 更新 `enrichOrdersFromQuotes`：Order.after_sales_status derived field 推導邏輯（無 / 售後處理中 / 售後逾期 / 售後已結案）
- [x] 1.10 更新 `crossLayerAssertions.ts` TRACKED_PARITY_FIELDS：新增 AfterSalesTicket 相關欄位的跨層一致性檢查

## 2. ticket 業務邏輯（State Machine + 計算）

- [x] 2.1 實作 AfterSalesTicket 狀態機推進函式：`transitionTicketToProcessing(ticketId)`（受理中 → 處理中，前置：resolution 必填）
- [x] 2.2 實作 `transitionTicketToClosed(ticketId)`（處理中 → 已結案，前置：業務手動觸發，寫入 closed_at / closed_by）
- [x] 2.3 實作「一張訂單最多 1 張未結案 ticket」validation：建單時檢查同 Order 下未結案 ticket 數量 ≤ 0
- [x] 2.4 實作 `appendComplaintLog(ticketId, note)`：append 至 additional_complaint_log 陣列（含 logged_at），既有紀錄不可改
- [x] 2.5 實作 `Order.after_sales_status` derived field 計算函式（依關聯 ticket 狀態與 opened_at 距今天數推導，閾值 7 天可配置）

## 3. 訂單詳情頁「售後服務」Tab

- [x] 3.1 於訂單詳情頁 SubHeader Tab 結構新增「售後服務」Tab（沿用既有 tab layout 元件）
- [x] 3.2 Tab 內容區塊：訂單關聯 AfterSalesTicket 列表卡片
  - 卡片顯示：case_no、case_category（含「色差爭議」）、responsibility、resolution、status badge、opened_at（含「N 天前」相對時間）、closed_at（若已結案）
  - 卡片排序：未結案在上（按 opened_at 升序），已結案在下（按 closed_at 降序）
  - 空狀態文案：「尚無售後服務紀錄」+ 引導建單按鈕
  - 未結案卡片置頂顯示，可一眼看出當前處理進度
- [x] 3.3 「建立售後服務單」按鈕：僅 Order.status = 已完成 且無未結案 ticket 時可點擊，否則 disabled 並 tooltip 提示原因
- [x] 3.4 Order.status ≠ 已完成 時，Tab 內容顯示「訂單未完成時無售後服務」+ 引導文，按鈕隱藏

## 4. AfterSalesTicket 建單表單

- [x] 4.1 表單元件：customer_complaint（textarea）、case_category（select：6 個 enum）、responsibility（select：3 個 enum）、slack_thread_url（input，可選）
- [x] 4.2 表單必填 validation：customer_complaint / case_category / responsibility
- [x] 4.3 送出後系統自動產生 case_no（AS-YYYYMMDD-XX，YYYYMMDD 為今日，XX 為當日流水號）、opened_at、opened_by（current user）
- [x] 4.4 新 ticket.status 預設 = 受理中、resolution = null

## 5. ticket 詳情頁互動

- [ ] 5.1 ticket 詳情頁版型：header（case_no、status badge）+ body（客訴內容、決議區、關聯動作區、活動紀錄）
- [ ] 5.2 resolution 下拉選單（不處理 / 退款 / 補印 / 退款+補印）：填入後點「送出決議」推進 status 至處理中
- [ ] 5.3 resolution 修改：處理中 ticket 允許修改 resolution，UI 提供「修改決議」按鈕
- [ ] 5.4 case_category / responsibility 編輯：處理中允許修改；已結案唯讀
- [ ] 5.5 「補述客戶反映」按鈕 → append additional_complaint_log（含 logged_at + note）
- [ ] 5.6 「結案」按鈕：處理中可點擊，點擊後 confirm dialog 顯示具體確認文案
  - Dialog title：「結案售後服務單 AS-XXX」
  - Dialog body：「請確認：(1) 客戶已收到滿意處理；(2) 所有關聯 OrderAdjustment 已執行；(3) 所有補印 PrintItem 已出貨。結案後不可重開。」
  - 按鈕：「確認結案」（primary）/「取消」（secondary）
  - 若 ticket 內有未完結 OrderAdjustment（status ≠ 已執行 / 已取消），dialog 額外提示「該 ticket 仍有 N 筆未完結異動單，建議完成後再結案」（業務可選擇強制結案）
  - 確認後推進 status → 已結案，寫入 closed_at = 當下、closed_by = 操作業務
- [ ] 5.7 已結案 ticket UI：所有編輯按鈕 disabled，但 append complaint log 仍允許
- [ ] 5.8 Slack thread URL 區塊：顯示 URL 預覽 + 「在 Slack 開啟」按鈕；空值時提示「請貼入 Slack 討論串 URL」
- [ ] 5.9 ticket 內關聯 OrderAdjustment 取消後處理：ticket 詳情頁「關聯動作」區塊顯示提示「該決議的下游動作已取消，請確認是否變更 resolution 或重新建立關聯動作」；業務 SHALL 可選擇 (a) 修改 resolution、(b) 重新建關聯 OA、(c) 維持現狀
- [ ] 5.10 補印 PrintItem 取消後處理：ticket 詳情頁顯示「補印已取消」標示 + 提示「請於 ticket 內重新建立補印印件或變更 resolution」；ticket.status 與 ticket.resolution 維持原值（不自動清空）

## 6. ticket 內加掛關聯動作

- [ ] 6.1 「建立退款異動單」按鈕：resolution = 退款 或 退款+補印 時顯示；點擊後開啟 OrderAdjustment 表單，預填 adjustment_type=退印、linked_after_sales_ticket_id=此 ticket
- [ ] 6.2 「建立補印費異動單」按鈕：resolution = 補印 或 退款+補印 + responsibility = 客戶承擔 / 共同分擔 時顯示；預填 adjustment_type=補退、linked_after_sales_ticket_id=此 ticket
- [ ] 6.3 「建立補印印件」按鈕：resolution = 補印 或 退款+補印 時顯示；點擊後開啟 PrintItem 建單表單，預填 related_after_sales_ticket_id=此 ticket
- [ ] 6.4 ticket 詳情頁「關聯動作」區塊：列出所有 linked_adjustments（卡片含 OrderAdjustment 狀態 + 金額）與 linked_print_items（卡片含 PrintItem 狀態）
- [ ] 6.5 點擊關聯動作卡片可跳轉至 OrderAdjustment / PrintItem 詳情頁

## 7. 訂單列表「售後狀態」欄位 + 篩選器

- [x] 7.1 訂單列表新增「售後」欄位，依 Order.after_sales_status derived field 顯示徽章（無 / 售後處理中-黃 / 售後逾期-紅 / 售後已結案-綠）
- [x] 7.2 訂單列表 toolbar 新增「售後狀態」篩選器（dropdown：全部 / 無 / 售後處理中 / 售後逾期 / 售後已結案）
- [x] 7.3 篩選器與既有「狀態」篩選並列，支援多條件組合
- [x] 7.4 點擊「售後處理中」/「售後逾期」徽章可直接跳轉至訂單詳情頁「售後服務」Tab

## 8. 業務看板「我的未結案售後」分桶

- [x] 8.1 業務看板首頁新增「我的未結案售後」分桶（位置：與既有「我的待辦訂單」分桶並列）
- [x] 8.2 分桶內容：filter `opened_by = currentUser AND status ≠ 已結案`，按 opened_at 升序排序（最久優先）
- [x] 8.3 每筆顯示：case_no、訂單編號、客戶名稱、case_category、opened_at（含「N 天前」相對時間）、status badge
- [x] 8.4 opened_at 距今 > 7 天的 ticket 標紅色 badge「逾期」
- [x] 8.5 點擊 ticket 卡片導向訂單詳情頁的「售後服務」Tab 並自動展開該 ticket
- [ ] 8.6 業務主管後台「ticket 負責人管理」頁：列出全公司未結案 ticket，可勾選批次轉派 opened_by；轉派表單必填新負責人 + 轉派原因
- [ ] 8.7 業務本人嘗試自行轉派時系統 UI 拒絕並顯示「ticket 負責人轉派需由業務主管執行」

## 9. 對帳警示 banner 校準

- [x] 9.1 確認對帳警示 banner 觸發條件函式適用於 `linked_after_sales_ticket_id` 為 NULL 與非 NULL 兩種 OrderAdjustment（無需分桶判斷）
- [x] 9.2 驗證測試 mockData：以 ticket-001（退款 -5000）+ Order(completed_at=2026-03-15) + OrderAdjustment(executed_at=2026-05-06, linked_after_sales_ticket_id=ticket-001) 驗證
  - 訂單詳情頁對帳檢視面板顯示警示 banner
  - banner 文字精確比對：「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行，請會計確認原月結紀錄」
  - 對照組驗證：linked_after_sales_ticket_id=NULL 的 OA 跨期執行也應觸發相同 banner

## 10. 歷史資料遷移（mockData）

- [x] 10.1 撰寫 mockData 遷移腳本：掃描既有 `OrderAdjustment(phase=after_completion)` mock 並為每筆建立對應 AfterSalesTicket
  - 新 ticket.legacy_migrated = true
  - 新 ticket.customer_complaint 從 OrderAdjustment.reason 帶入
  - 新 ticket.case_category 預設「其他」（無原始分類資訊）
  - 新 ticket.responsibility 預設「公司認賠」（保守假設）
  - 新 ticket.status = 已結案（假設歷史單為已完成）
  - 新 ticket.closed_at = OrderAdjustment.executed_at（保守取執行時間）
- [x] 10.2 OrderAdjustment.linked_after_sales_ticket_id 回填至新建 ticket id
- [x] 10.3 OrderAdjustment 移除 adjustment_phase 欄位
- [x] 10.4 PrintItem.related_after_sales_ticket_id 補空值

## 11. 業務情境 mockData 改寫（payment-invoice-scenarios.md 對應）

- [x] 11.1 改寫情境 1（公司吸收，`ORD-20260322-01`）mockData：建 AfterSalesTicket（resolution=不處理 或 補印免費，依細節判斷）+ 不建 OrderAdjustment
- [x] 11.2 改寫情境 2（補收，`ORD-20260301-01`）mockData：此情境屬訂單期間補收，仍走 OrderAdjustment（不關 ticket），確認 mockData 路徑正確
- [x] 11.3 改寫情境 3（退款，`ORD-20260331-02`）mockData：建 AfterSalesTicket（resolution=退款）+ ticket 內掛 OrderAdjustment(退印, -金額, linked_after_sales_ticket_id)
- [x] 11.4 更新 `memory/erp/payment-invoice-scenarios.md` 異動情境 1-3 文字表述：將「建售後服務單」改為「建 AfterSalesTicket + 視需要建關聯 OrderAdjustment」

## 12. OpenSpec validate + Spec 同步

- [ ] 12.1 執行 `openspec validate --change "add-after-sales-ticket"`，修正任何 schema / format 錯誤
- [ ] 12.2 確認所有 spec delta 檔案 ADDED / MODIFIED / REMOVED 區塊格式正確（4 個 # 的 Scenario 標題、SHALL/MUST 規範用語）
- [ ] 12.3 確認跨檔案引用連結（spec.md / design.md / payment-invoice-scenarios.md / decks/）皆可導航

## 13. 三視角審查

- [x] 13.1 並行呼叫 senior-pm（審查模式，非前期介入）+ ceo-reviewer + erp-consultant，傳入 proposal.md / design.md / specs/ 完整內容
- [x] 13.2 整合審查結果至 design.md 「## 三視角審查結果」新章節（或回填 Risks / OQ）
- [x] 13.3 高優先 issue 即時修正 spec / design；中低優先 issue 列為新 OQ（記入 Notion Follow-up DB 與 design.md OQ 區）
- [x] 13.4 若審查發現重大設計風險（例：與既有 capability 衝突），暫停 commit 並請 Miles 決定是否需新一輪 explore

## 14. OQ 同步至 Notion Follow-up DB

- [x] 14.1 將 design.md 中 10 個 OQ（OQ-AST-1 ~ OQ-UI-1）寫入 Notion Follow-up DB，Feature 欄位關聯「訂單管理」與「售後服務」（若新建 Feature page 也需建立）
- [x] 14.2 確認部分解答的既有 OQ（ORD-002、訂單退款逆流程、WO-010、ORD-004）的「決議與理由」欄位補上本 change 處理範圍

## 15. doc-audit + commit

- [ ] 15.1 執行 doc-audit skill：檢查跨檔案一致性（state-machines vs business-processes vs after-sales-ticket）、新增欄位是否同步至所有引用點
- [ ] 15.2 修正 doc-audit 發現的不一致
- [ ] 15.3 更新 CLAUDE.md § Spec 規格檔清單：新增 after-sales-ticket spec 列項（v0.1 草稿）
- [ ] 15.4 commit 全部變更（pattern：`feat(after-sales): 新增 AfterSalesTicket 售後服務案件容器`）
- [ ] 15.5 確認 push hook 執行成功

## 16. Prototype UI 驗證（Lovable）

- [ ] 16.1 push Prototype 變更至 `sens-erp-prototype` main 分支
- [ ] 16.2 於 Lovable 環境驗證訂單詳情頁「售後服務」Tab 功能
- [ ] 16.3 於 Lovable 環境驗證訂單列表售後狀態欄位 + 篩選器
- [ ] 16.4 於 Lovable 環境驗證業務看板「我的未結案售後」分桶
- [ ] 16.5 於 Lovable 環境驗證三個情境 mockData 端到端流程
  - 情境一（不處理）：建 ticket → 填 resolution=不處理 → 結案；驗證不建任何 OA / PrintItem / Payment，三方對帳維持原狀
  - 情境二（退款）：建 ticket → 填 resolution=退款 → 加掛 OrderAdjustment(-5000) → 走 OA 狀態機 → 建退款 Payment + SalesAllowance → 結案；驗證對帳警示 banner 觸發、三方對帳數字符合 spec 預期（應收 / 發票淨額 / 收款淨額 = 45000）
  - 情境三（補印免費）：建 ticket → 填 resolution=補印 → 建補印 PrintItem (related_after_sales_ticket_id 寫入) → PrintItem 走原審稿 / 工單 / 出貨 → 結案；驗證不建 OA、ticket 不自動結案、訂單應收不變
  - 通過條件：每個情境在 Lovable 上完整跑完 spec § 業務情境 1-3 的端到端步驟，三方對帳數字與 spec 預期一致
- [ ] 16.6 將 Lovable 驗證螢幕截圖 / GIF 補入 design.md「驗證紀錄」段
