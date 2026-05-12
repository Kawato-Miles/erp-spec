## 1. Spec 完整性與背景文件對齊

- [x] 1.1 與 BillingCompany / PaymentPlan / Payment / Invoice / SalesAllowance / OrderExtraCharge 既有 spec 交叉檢查無矛盾（已驗證：與 OrderExtraCharge 補時間邊界、與三方對帳檢視面板共用警示觸發邏輯，皆於 delta spec 明示無矛盾）
- [x] 1.2 確認 Notion 業務情境 DB 是否需新增「售後服務單跨期執行」「OrderAdjustment phase 限制」相關情境（判斷：不新增。spec 內 Scenario 已涵蓋該時點邏輯；業務情境 DB 主要記錄端到端複雜場景，本 change 屬單一 Requirement 內的觸發邏輯）
- [x] 1.3 確認 Notion KPI DB 是否有相關量化指標需更新（如「訂單異動正確走對 phase 的比率」）（判斷：不更新。屬後驗指標，需先有真實使用資料才能計算 baseline；列為 design.md OQ-1 候選，未來實作完成有資料後再加）
- [x] 1.4 確認 [Notion follow-up「提供收款情境」](https://www.notion.so/3573886511fa80b39093d8c76b57737a) task 是否需更新狀態為「實作中」（已於 2026-05-08 在頁面內容補「實作進度」段，紀錄 Change A 完成 commit cf8fc44 與 Change B 待 A 歸檔；狀態維持「進行中」）

## 2. Prototype 資料層 mock

- [x] 2.1 OrderAdjustment mock 資料結構增加 `adjustment_phase` 欄位（enum: during_order / after_completion）
- [x] 2.2 OrderAdjustmentItem 子實體 mock 結構（id / order_adjustment_id / item_type / description / amount / created_at / updated_at）
- [x] 2.3 既有 OrderAdjustment mock 資料一次性回填 `adjustment_phase = during_order`
- [x] 2.4 從 Order mock 移除 `is_supplemental` 與 `parent_order_id` 欄位（prototype Order interface 本來就沒有此兩欄位，無需移除動作）
- [x] 2.5 OrderAdjustment.amount 改為 derived（自動加總明細金額），mock 層提供加總工具函式（types/orderAdjustment.ts § calcAmountFromItems）

## 3. Prototype UI 變更（OrderAdjustment 表單）

- [x] 3.1 訂單詳情頁的 OrderAdjustment 表單支援 phase 切換顯示（訂單異動單 / 售後服務單）
- [x] 3.2 OrderAdjustment 表單明細項編輯介面（item_type 切換 print_item / fee、金額自動加總顯示）（MVP 簡化版：建單時依 adjustment_type 自動推測 itemType，金額同步 main amount；多筆明細編輯介面留給後續迭代）
- [x] 3.3 adjustment_type 下拉選單依 phase 動態過濾（during_order 顯示 7 種 / after_completion 顯示 4 種）
- [x] 3.4 售後服務單禁用加印追加 / 加運費 / 急件費選項（dialog dropdown 動態過濾 + getAvailableAdjustmentTypes 函式雙重防護）
- [x] 3.5 訂單異動執行後若含 print_item 明細顯示生產內容變更提示（透過 hasPrintItemAdjustmentItem 判斷觸發 toast.info）
- [x] 3.6 售後服務單執行後顯示發票處理建議式提示（非問句、非自動跳轉）（toast.info + 8 秒持續，內容對齊 spec Scenario）

## 4. Prototype UI 變更（對帳警示與 OrderExtraCharge 邊界）

- [x] 4.1 對帳檢視面板的警示 banner 觸發邏輯改為 `executed_at > completed_at`（與 phase 解耦）（OrderReconciliationPanel 用 getEarliestReconciliationWarningAdjustment）
- [x] 4.2 banner 文字含完成日期與執行日期，例：「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行」
- [x] 4.3 訂單成立後（進入「報價待回簽」之後）隱藏「新增 OrderExtraCharge」按鈕，引導走 OrderAdjustment（prototype 既有元件無 OrderExtraCharge 新增 UI 入口，spec § OrderExtraCharge vs OrderAdjustment.fee 時間邊界 已涵蓋規範；正式系統實作時對應）
- [x] 4.4 訂單成立後 OrderExtraCharge 寫入 API 回傳 400 錯誤（含友善錯誤訊息）（prototype 無 API 層；spec § OrderExtraCharge 時間邊界 Scenario 已涵蓋；正式系統實作時對應）

## 5. 業務情境驗證

- [ ] 5.1 驗證：訂單未完成時建立加印追加 → adjustment_phase 自動 = during_order
- [ ] 5.2 驗證：訂單已完成時建立售後服務 → adjustment_phase 自動 = after_completion，UI 標題切為「售後服務單」
- [ ] 5.3 驗證：phase = during_order 但跨期執行 → 對帳警示 banner 觸發（執行時點 > 訂單完成日）
- [ ] 5.4 驗證：訂單未完成時 phase 鎖定後即使 Order 推進至已完成 → phase 維持 during_order 不變動
- [ ] 5.5 驗證：訂單成立後加運費走 OrderAdjustment 而非 OrderExtraCharge
- [ ] 5.6 驗證：紙廠停產換紙公司吸收純走工單異動，不建 OrderAdjustment(amount=0)
- [ ] 5.7 驗證：售後服務單嘗試選擇加印追加 → 系統拒絕並提示

## 6. 文件同步

- [x] 6.1 確認 user-roles spec 售後服務單角色操作權責與既有 OrderAdjustment 角色權責一致（驗證：售後服務單沿用業務 / 諮詢建立、業務主管審核、會計唯讀，與既有 OrderAdjustment 角色權責一致）
- [x] 6.2 確認 state-machines spec 對帳警示觸發邏輯與 order-management spec 一致（驗證：兩 spec 皆採 `executed_at > completed_at` 觸發，state-machines 補新 Scenario 對齊 order-management 的「對帳警示 banner 觸發條件」Requirement）
- [x] 6.3 確認 business-processes spec「訂單異動 vs 工單異動職責分工」與 order-management spec 一致（驗證：金額變動為界、公司吸收純走工單異動，business-processes 的 Decision 與 order-management design.md D4 一致）
- [ ] 6.4 Spec 修訂版本累積後手動推送至 Notion 發布版本（與其他 change 一起推送）

## 7. 歸檔準備

- [x] 7.1 spec 全文 strict 驗證通過（`openspec validate refactor-order-adjustment-and-cleanup --strict`）（已通過，於 2026-05-08 驗證）
- [x] 7.2 與後續 change `add-pending-receivables-and-invoicing-pages` 的依賴關係確認（後者依賴本 change 的對帳警示觸發邏輯與 OrderAdjustment 雙身份）（依賴關係已於後者 proposal.md 與 design.md 明示）
- [x] 7.3 三視角審查記錄（已於 2026-05-08 執行 senior-pm + ceo-reviewer + erp-consultant 平行審查）保留於 design.md OQ 段落（已保留）
- [ ] 7.4 archive change，sync delta specs 至 main specs
