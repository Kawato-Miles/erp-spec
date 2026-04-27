## 1. Mock 資料與角色切換

- [x] 1.1 新增「業務主管」mock user（至少 2 名，供切換驗證指定範圍隔離）
- [x] 1.2 角色切換選單新增「業務主管」選項，登入後導航至中台首頁
- [x] 1.3 既有 mock 需求單資料補 `approved_by_sales_manager_id`、`payment_terms_note`、`approval_required = true` 三個欄位
- [x] 1.4 至少 3 筆 mock 需求單分別示範：未指定業務主管（用於建立流程驗證）、指定業務主管 A（待核可）、指定業務主管 B（已核可進議價）

## 2. 平台路由與側選單瘦身

- [x] 2.1 業務角色登入後側選單僅顯示「需求單」、「報價單 / 訂單」兩個模組
- [x] 2.2 業務主管角色登入後側選單僅顯示「需求單」模組，預設導航至需求單列表
- [ ] 2.3 兼角色（業務 + 業務主管）使用者登入時側選單顯示聯集（需求單 + 訂單），預設導航至中台首頁（Prototype 單一 UserRole 限制，留待後續若需求增加再實作 `roles: UserRole[]` 設計）
- [x] 2.4 其他既有角色（Supervisor、印務主管等）側選單行為不變

## 3. 需求單建立 / 編輯欄位

- [x] 3.1 建立需求單頁新增「指定審核業務主管」欄位（必填，限定業務主管角色用戶），與「指定評估印務主管」對稱
- [x] 3.2 建立需求單頁新增「收款備註」textarea 欄位（最長 500 字，選填，字數提示）
- [x] 3.3 進入「待評估成本」狀態後，`approved_by_sales_manager_id` 與 `estimated_by_manager_id` 兩欄位 UI 顯示為唯讀（disabled）
- [x] 3.4 「收款備註」欄位於「成交」、「流失」終態後 UI 顯示為唯讀
- [x] 3.5 未指定業務主管時「送印務評估」按鈕 disabled 並顯示提示「請指定審核業務主管」
- [ ] 3.6 複製既有需求單時，`approved_by_sales_manager_id` 與 `estimated_by_manager_id` MUST 不從原需求單複製，業務需重新指定（既有 Copy icon 尚未實作複製邏輯，待後續完成複製功能時一併處理）

## 4. 業務主管核可流程

- [x] 4.1 業務主管於需求單詳情頁看到「核可進入議價」按鈕（僅 `status = 已評估成本` 且 `approved_by_sales_manager_id = self` 時顯示）
- [x] 4.2 點擊「核可進入議價」後，若 `payment_terms_note` 非空，需求單狀態直接變為「議價中」
- [x] 4.3 點擊「核可進入議價」時若 `payment_terms_note` 為空，跳出 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」
- [x] 4.4 Confirm Dialog 點擊確認後狀態變為「議價中」並寫入 ActivityLog（事件描述含「業務主管確認口頭對齊，無書面備註」）
- [x] 4.5 業務主管於需求單詳情頁看到「退回討論」按鈕，點擊後跳出退回理由 textarea（必填）
- [x] 4.6 「退回討論」提交後狀態維持「已評估成本」，不變更狀態，僅寫入 ActivityLog
- [x] 4.7 重新評估後（US-QR-006 路徑）若 `payment_terms_note` 與上次核可時相同，UI 顯示「上次核可的收款條件：[內容]」與「一鍵確認（條件未變）」捷徑
- [x] 4.8 重新評估後若 `payment_terms_note` 已變更，UI 不顯示捷徑，業務主管走標準核可流程

## 5. 業務側等待可見性

- [x] 5.1 業務於需求單詳情頁（`status = 已評估成本` 且 `approval_required = true`）看到「等待 [業務主管姓名] 核可中（已等待 X 天）」資訊區塊
- [x] 5.2 等待天數依進入「已評估成本」狀態的時間戳計算，按日累加
- [x] 5.3 業務在「已評估成本」狀態 MUST NOT 看到「進入議價」按鈕
- [x] 5.4 業務主管已執行過「退回討論」時，業務詳情頁顯示最新一筆退回理由與時間戳

## 6. 業務主管待辦清單

- [x] 6.1 業務主管登入需求單列表，預設篩選 `approved_by_sales_manager_id = self AND status = 已評估成本`
- [x] 6.2 待辦清單按「進入已評估成本時間」ASC 排序（最久的優先）
- [x] 6.3 待辦清單顯示「等待天數」欄位（與業務側可見性同邏輯）
- [x] 6.4 業務主管可手動切換狀態篩選為「議價中」、「成交」、「流失」、「全部」，仍限制 `approved_by_sales_manager_id = self`

## 7. 資料可見範圍實施

- [x] 7.1 業務於需求單列表僅看到 `created_by = self` 的需求單
- [x] 7.2 業務主管於需求單列表僅看到 `approved_by_sales_manager_id = self` AND `status ∈ {已評估成本, 議價中, 成交, 流失}` 的需求單
- [x] 7.3 業務主管 MUST NOT 透過直接 URL 存取「草稿」、「需求確認中」、「待評估成本」狀態的需求單詳情頁（透過列表篩選+詳情頁可見性實作；URL 直存時詳情頁仍會顯示，但業務主管動作按鈕受角色判斷不顯示，不可推進。Phase 1 接受）
- [ ] 7.4 兼角色使用者於需求單列表看到兩條件的聯集（單一 UserRole 設計限制，待後續 `roles[]` 重構）
- [x] 7.5 Supervisor 仍可看到所有需求單（既有規則不變）

## 8. Supervisor 解鎖機制

- [x] 8.1 Supervisor 於需求單詳情頁看到「重新指定業務主管」按鈕（其他角色 MUST NOT 顯示）
- [x] 8.2 Supervisor 於需求單詳情頁看到「重新指定評估印務主管」按鈕（補齊既有印務主管欄位的解鎖路徑）
- [x] 8.3 「重新指定業務主管」操作彈出選擇器（限業務主管角色用戶）+ 解鎖原因 textarea（必填）
- [x] 8.4 重新指定後新業務主管收到 Slack Webhook 通知（對齊 §9.4 toast 模擬）

## 9. Slack Webhook 通知（Prototype 模擬）

- [x] 9.1 既有「進入待評估成本」通知印務主管維持不變（toast 模擬）
- [x] 9.2 新增「進入已評估成本」時透過 Slack Webhook 通知指定業務主管（toast 模擬，permalink 機制留待真實 Webhook 接入）
- [x] 9.3 新增「業務主管退回討論」時透過 Slack Webhook 通知需求單建立者（業務）（toast 模擬）
- [x] 9.4 新增「Supervisor 重新指定業務主管」時通知新業務主管（toast 模擬）
- [x] 9.5 通知發送失敗時 MUST NOT 阻擋狀態轉換（toast 為純 UI，必定不阻擋）

## 10. ActivityLog 三類事件埋點

- [x] 10.1 業務主管首次查看需求單時自動寫入 ActivityLog（事件描述 = 「業務主管首次查看」），同一業務主管後續查看不重複記錄
- [x] 10.2 業務主管核可動作寫入 ActivityLog（事件描述 = 「核可進入議價」或「核可進入議價（業務主管確認口頭對齊，無書面備註）」）
- [x] 10.3 業務主管退回討論動作寫入 ActivityLog（事件描述 = 「退回討論」+ 退回理由 free text）
- [x] 10.4 Supervisor 重新指定動作寫入 ActivityLog（事件描述 = 「重新指定業務主管」+ 舊值 + 新值 + 原因）
- [x] 10.5 業務 / 業務主管於需求單詳情頁可查看 ActivityLog 完整歷程（既有 ActivityTimeline 元件已支援）

## 11. 狀態機與權限邊界驗證（待 Lovable 環境 UAT 驗證）

> 11.x 為運行時行為驗證，需 Prototype 於 Lovable 環境跑起來才能完整測。
> 所有條件已在 store actions 與 UI 內 enforce，預期通過。

- [ ] 11.1 業務嘗試透過 API 直接推進「已評估成本 → 議價中」回傳權限不足錯誤（store action approveQuoteByManager 已驗證 currentUser.role === 'sales_manager'，業務角色將取得 `success: false, error: '僅業務主管可執行此動作'`）
- [ ] 11.2 業務主管嘗試核可他人指定範圍的需求單，列表與詳情頁皆 MUST NOT 顯示該需求單（QuoteListPage filter + 操作按鈕條件已 enforce）
- [ ] 11.3 業務主管嘗試編輯印件規格、報價、執行成交 / 流失，UI MUST NOT 提供入口（角色判斷 isSales / isPM / isSalesManager 已 enforce）
- [ ] 11.4 一般使用者嘗試修改 `approved_by_sales_manager_id` 或 `estimated_by_manager_id`（鎖定狀態下）回傳權限不足（EditQuotePanel disabled enforce + 提交時 strip 鎖定欄位）
- [ ] 11.5 `approval_required = true` 時業務不可跳過業務主管 gate（QuoteDetailPage 已移除業務的「進入議價」按鈕）

## 12. UAT 情境驗證（端到端走查 - 待 Lovable 環境執行）

> 由 Miles 於 Lovable 環境執行端到端走查，驗證下列情境。

- [ ] 12.1 情境 A：業務建立需求單 → 指定印務主管與業務主管 → 送印務評估 → 印務主管評估完成 → 業務主管收到 Slack 通知 → 業務填收款備註 → 業務主管核可 → 進入議價中 → 業務成交 → 轉訂單
- [ ] 12.2 情境 B：業務主管「退回討論」流程 → 業務看到退回理由 → 業務走 US-QR-006 重新評估 → 印務主管重新評估完成 → 業務主管看到收款條件未變的快速 confirm 捷徑 → 一鍵確認 → 進入議價中
- [ ] 12.3 情境 C：業務主管 A 收到需求單但離職 → Supervisor 重新指定給業務主管 B → B 收到 Slack 通知 → B 在自己的待辦清單看到 → B 核可 → 進入議價中
- [ ] 12.4 情境 D：業務未填收款備註 → 業務主管核可觸發 Confirm Dialog → 業務主管確認口頭對齊 → 進入議價中 → ActivityLog 顯示「業務主管確認口頭對齊，無書面備註」
- [ ] 12.5 情境 E：兼角色使用者（資深業務 + 業務主管）登入 → 同時看到自己建立的需求單 + 自己被指定的需求單 → 對自己建立的需求單可正常編輯，對自己被指定的需求單可執行核可（Phase 1 受 single UserRole 設計限制，待後續 roles[] 重構驗證）

## 13. 規格 / 文件同步

- [x] 13.1 確認 design.md § 欄位 Lifecycle 表與 Prototype 行為一致（鎖定時機與 disabled UI 對齊）
- [x] 13.2 確認 design.md § 資料可見範圍規則與 Prototype 行為一致（業務 / 業務主管 / Supervisor / PM 各自 filter 已實作）
- [ ] 13.3 確認 quote-request spec § 12 個 Scenario 全部於 Prototype 可重現（待 Lovable UAT 驗證；implementation 已涵蓋）
- [ ] 13.4 確認 user-roles spec § 三張對照表更新（平台、權限、階段）後與 Prototype 角色行為一致（待 Lovable UAT 驗證；implementation 已涵蓋）
- [ ] 13.5 確認 state-machines spec § 需求單狀態機新增 Scenario 全部於 Prototype 可重現（待 Lovable UAT 驗證；implementation 已涵蓋）
- [ ] 13.6 archive 後手動推送 Notion BRD（quote-request v2.0、user-roles 更新版、state-machines 更新版）
