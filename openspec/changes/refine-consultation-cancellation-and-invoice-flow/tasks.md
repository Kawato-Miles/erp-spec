## 1. Spec 自審（archive 前必過）

- [x] 1.1 確認 `consultation-request/spec.md` 6 MODIFIED + 1 ADDED 區塊內容完整覆蓋既有 spec 對應 Requirement
  - 修正：原 delta 把 § 諮詢取消觸發建諮詢訂單與退費 改名為「半額退費」違反 MODIFIED anchor 規則，已改回原名（spec 內文保留半額退費描述）+ 同步修兩處跨 spec 引用（consultation-request L268、order-management L117）
- [x] 1.2 確認 `order-management/spec.md` 4 MODIFIED + 1 ADDED 區塊正確（含 OA enum 第 9 值「諮詢取消退費」）
  - 4 個 MODIFIED header 對齊既有 spec（訂單建立 / OrderAdjustment.adjustment_type 完整 enum / 諮詢訂單發票時間點處理 / 諮詢取消對帳邏輯）
  - 1 個 ADDED：諮詢訂單收尾自動建 PlannedInvoice 規則
- [x] 1.3 確認 `state-machines/spec.md` § 訂單狀態機 MODIFIED 完整保留非諮詢相關 Scenario、僅改寫諮詢段
  - 保留：線下訂單回簽 / 上傳檔案 / 線上訂單付款 / 不進入共用段 / 訂單推進至製作完成 Scenarios
  - 改寫：諮詢結束不做大貨 / 需求單流失 / 待諮詢取消 / 待諮詢取消退款 Payment 切已完成 4 個 Scenarios
- [x] 1.4 確認 `business-processes/spec.md` § 諮詢前置流程端到端規則 ASCII 圖含半額退費 / PlannedInvoice / OA / 退款 Payment 各節點
  - ASCII 圖補：自動建 OA(-1000) / 自動建退款 Payment / 自動建 PlannedInvoice / cancel_reason_category 寫入 / 諮詢人員後續手動動作
  - 對帳邏輯段：四情境分別寫清楚（應收 / 收款 / 發票淨額）
- [x] 1.5 跑 `openspec validate refine-consultation-cancellation-and-invoice-flow` 確認無語法錯誤
  - 結果：Change 'refine-consultation-cancellation-and-invoice-flow' is valid
- [ ] 1.6 跑 `doc-audit` skill 對本 change 涉及 4 個 spec 做跨檔案一致性檢查（諮詢費 = 2000 / 退費 = 1000 / OA enum 9 值 / PlannedInvoice 三情境）

## 2. Vault OQ 更新（archive 時執行）

- [ ] 2.1 透過 `oq-manage` mode C 更新 `memory/erp/ERP_Vault/08-open-questions/CR-3-諮詢取消三項擴充議題.md`：
  - status: `open` → `resolved`
  - source-link 補本 change archive 路徑（`openspec/changes/archive/2026-XX-XX-refine-consultation-cancellation-and-invoice-flow/`）
  - 內文「待 Miles 確認」段補三議題決議：
    - 議題 1：部分退費 = 50% 寫死、不分時機、不分主動方、不開放系統設定
    - 議題 2：取消理由 = cancel_reason_category enum 6 值必填、補充說明寫入 consultant_note
    - 議題 3：退款依原付款方式刷退由第三方金流處理、客戶通知由諮詢人員手動執行
- [ ] 2.2 確認 Vault `05-entities/諮詢單.md` 反映新欄位 cancel_reason_category（若 Vault 卡有列欄位）
- [ ] 2.3 確認 Vault `04-business-logic/付款發票邏輯.md` 反映 PlannedInvoice 自動建立規則三情境（若 Vault 卡涵蓋此邏輯）
- [ ] 2.4 確認 Vault `03-roles/諮詢.md` 反映取消權限收歸（限當前 consultant_id + 業務主管，業務不可）

## 3. Prototype 實作（後續另案，archive 後啟動）

### 3.1 諮詢單實體與資料層

- [ ] 3.1.1 `ConsultationRequest` mock type 新增 `cancel_reason_category: '找到其他廠商' | '預算問題' | '需求改變' | '時間無法配合' | '諮詢人員無法出席' | '其他（原因請參考備註）' | null` 欄位
- [ ] 3.1.2 既有 mock `consultationRequests` 資料補預設值（cancel_reason_category: null，已取消的歷史案例補回填）
- [ ] 3.1.3 `useErpStore` 暴露 cancelConsultationRequest action（接收 cancel_reason_category 參數）

### 3.2 諮詢取消按鈕權限改寫

- [ ] 3.2.1 諮詢單詳情頁取消按鈕權限判斷：限當前 consultant_id 自己 + 業務主管，業務隱藏
- [ ] 3.2.2 諮詢單列表頁取消快捷按鈕（若有）同步權限判斷
- [ ] 3.2.3 確認業務帳號登入時看不到取消入口（UI 層）

### 3.3 取消 dialog 防呆 + 必選下拉

- [ ] 3.3.1 取消 dialog 文案改為「確定取消？將自動建諮詢訂單並退款 1000 元，無法復原」
- [ ] 3.3.2 dialog 加 cancel_reason_category 必選下拉（6 個 enum 值）
- [ ] 3.3.3 「確認取消諮詢」按鈕在未選 cancel_reason_category 時 disabled
- [ ] 3.3.4 dialog 不顯示 consultation_invoice_option 意向（避免使用者誤解）

### 3.4 取消後系統建單流程改寫

- [ ] 3.4.1 點「確認取消諮詢」觸發 cancelConsultationRequest action，依序執行（事務性、全成功或全回滾）：
  - 建諮詢訂單（order_type = 諮詢、total_with_tax = 2000）
  - 建 OrderExtraCharge(consultation_fee, 2000)
  - 將 Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  - 建 OrderAdjustment(amount = -1000, adjustment_type = '諮詢取消退費', status = '已核可', approved_by = 'system', approved_at = now, linked_after_sales_ticket_id = null, reason = '諮詢取消退費（50%）')
  - 建退款 Payment(amount = -1000, paymentMethod = '退款', paymentStatus = '處理中', linkedOrderAdjustmentId = 上述 OA.id)
  - 建 PlannedInvoice(orderId = 諮詢訂單 ID, scheduledAmount = 1000, description = '諮詢費（取消退費後）', expectedDate = today, status = '預計開立', createdBy = 'system')
  - 推進 ConsultationRequest 至「已取消」 + cancel_reason_category 寫入
- [ ] 3.4.2 確認既有「建退款 -2000 + 開 Invoice + SalesAllowance」邏輯**移除**（不論 consultation_invoice_option）

### 3.5 諮詢結束「不做大貨」與「需求單流失」自動建 PlannedInvoice

- [ ] 3.5.1 完成諮詢「不做大貨」action 補：自動建 PlannedInvoice(2000, '諮詢費', today)、移除既有 Invoice 自動開立邏輯
- [ ] 3.5.2 需求單流失 side-effect 補：自動建 PlannedInvoice(2000, '諮詢費', today)、移除既有 Invoice 自動開立邏輯
- [ ] 3.5.3 確認既有「依 consultation_invoice_option 自動開 Invoice」邏輯於三情境（不做大貨 / 需求單流失 / 諮詢取消）全部廢止

### 3.6 諮詢訂單狀態機簡化

- [ ] 3.6.1 諮詢訂單路徑：去除「已開發票」中間狀態
- [ ] 3.6.2 不做大貨 / 需求單流失情境：建單後即時推進「訂單完成」
- [ ] 3.6.3 待諮詢取消情境：建單後維持「建立」狀態、退款 Payment 切已完成 → OA 推進已執行 → 訂單推進「訂單完成」（沿用 [order-management § OA 已執行推進規則](../../specs/order-management/spec.md)）

### 3.7 OA enum 新增「諮詢取消退費」

- [ ] 3.7.1 `OrderAdjustment.adjustmentType` enum 加第 9 值「諮詢取消退費」
- [ ] 3.7.2 業務 UI 的 adjustment_type 下拉選單**不顯示**此選項（系統內生 type）
- [ ] 3.7.3 諮詢取消退費 OA 於訂單詳情頁顯示為唯讀（業務不可編輯系統內生 type 的 OA）
- [ ] 3.7.4 OA 列表 / 對帳面板顯示此 type 時使用對應顏色（與「退印」/「補退」等視覺區分）

### 3.8 諮詢人員後續手動動作 UI

- [ ] 3.8.1 諮詢人員可於諮詢訂單 OA 編輯介面切退款 Payment「已完成」並上傳退款證明附件（沿用既有 OA 編輯 dialog 流程）
- [ ] 3.8.2 諮詢人員可於諮詢訂單發票區點「開立」將 PlannedInvoice 轉立 Invoice（金額由諮詢人員依客戶需求決定）

### 3.9 對帳檢視面板更新

- [ ] 3.9.1 諮詢訂單對帳面板識別「半額退費已執行」情境（OEC + OA = 收款淨額）標示「對帳通過 - 退費完成」
- [ ] 3.9.2 諮詢訂單對帳面板識別「半額退費處理中」情境（退款 Payment 處理中）標示「退費處理中」
- [ ] 3.9.3 諮詢訂單對帳面板識別「發票金額不符」情境（發票淨額 ≠ 應收）顯示既有對帳警示 banner

### 3.10 諮詢單詳情頁顯示 cancel_reason_category

- [ ] 3.10.1 諮詢單詳情頁（狀態 = 已取消時）顯示 cancel_reason_category（純展示，唯讀）
- [ ] 3.10.2 諮詢訂單詳情頁（諮詢取消觸發的諮詢訂單）顯示來源 cancel_reason_category
- [ ] 3.10.3 ActivityLog 取消事件補 cancel_reason_category 欄位顯示

### 3.11 諮詢結束做大貨 → 主訂單情境（行為不變確認）

- [ ] 3.11.1 確認諮詢結束做大貨 → 需求單成交轉一般訂單情境下系統 MUST NOT 自動建 PlannedInvoice 於主訂單
- [ ] 3.11.2 主訂單既有 PlannedInvoice 手動建立流程不動（業務自行加入諮詢費 PlannedInvoice）

## 4. 業務培訓資料

- [ ] 4.1 撰寫「諮詢取消政策變更」培訓單頁（全額 → 半額、業務不可取消、諮詢人員 / 業務主管權限）
- [ ] 4.2 撰寫「諮詢費發票手動處理」培訓單頁（諮詢訂單建立後諮詢人員手動將 PlannedInvoice 轉立 Invoice 的步驟）
- [ ] 4.3 撰寫「客戶通知退款」SOP（諮詢人員手動以電話 / Email 通知、ERP 不入系統）
- [ ] 4.4 業務培訓提醒：業務遇客戶要求取消諮詢時 SHALL 通知業務主管處理（非自行操作）

## 5. End-to-End 驗證情境

- [ ] 5.1 E2E：客人 surveycake 付 2000 → webhook 建 CR + Payment(+2000) → 諮詢人員認領 → 點取消 → 確認 dialog 選「找到其他廠商」→ 諮詢訂單建立 + OA(-1000) + 退款 Payment(-1000, 處理中) + PlannedInvoice(1000) + CR.status=已取消、cancel_reason_category=「找到其他廠商」
- [ ] 5.2 E2E：續上、諮詢人員切退款 Payment「已完成」+ 上傳退款證明 → OA 推進「已執行」→ 諮詢訂單推進「訂單完成」→ 對帳面板顯示「對帳通過 - 退費完成」
- [ ] 5.3 E2E：續上、諮詢人員將 PlannedInvoice 轉立 1000 元 Invoice → 三方對帳通過（應收 1000 = 收款 1000 = 發票淨額 1000）
- [ ] 5.4 E2E：客人 surveycake 付 2000 → 諮詢人員點「完成諮詢（不做大貨）」→ 諮詢訂單建立 + Payment 轉移 + PlannedInvoice(2000) + 即時推進「訂單完成」、不自動開 Invoice
- [ ] 5.5 E2E：客人 surveycake 付 2000 → 諮詢結束做大貨 → 需求單建立 → 議價中流失 → 系統建諮詢訂單 + Payment 轉移 + PlannedInvoice(2000) + 即時推進「訂單完成」
- [ ] 5.6 E2E：客人 surveycake 付 2000 → 諮詢結束做大貨 → 需求單議價成交 → 業務轉訂單 → 一般訂單 OEC(2000) + Payment 轉移 + 系統 NOT 自動建諮詢費 PlannedInvoice
- [ ] 5.7 E2E（權限）：業務帳號開啟諮詢單詳情頁 → 看不到「取消諮詢」按鈕 / API 直接取消回 403
- [ ] 5.8 E2E（權限）：諮詢人員 B 開啟諮詢人員 A 負責的諮詢單 → 看不到「取消諮詢」按鈕 / API 直接取消回 403
- [ ] 5.9 E2E（權限）：業務主管開啟任一諮詢單 → 可取消、ActivityLog 標明「業務主管代為」+ assigned_consultant_id
- [ ] 5.10 E2E（防呆）：取消 dialog 未選 cancel_reason_category 時「確認取消諮詢」按鈕 disabled

## 6. Archive 前最終檢查

- [ ] 6.1 確認 OpenSpec validate 通過
- [ ] 6.2 跑 `doc-audit` skill 全面檢查
- [ ] 6.3 CR-3 OQ 卡更新已寫入並 commit
- [ ] 6.4 對齊 CLAUDE.md § Spec 規格檔清單，補 consultation-request spec 版本號至 v0.3（v0.2 + 本 change）
- [ ] 6.5 對齊 CLAUDE.md § Spec 規格檔清單，補 order-management spec 版本號至 v1.10（v1.9 + 本 change）
- [ ] 6.6 與正在進行的 `align-business-consultation-coverage-gaps` change 在 order-management spec 上的衝突最終確認（兩者範圍互不重疊但需注意 archive 時序）
