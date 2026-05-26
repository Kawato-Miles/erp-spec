## 1. Spec 自審（archive 前必過）

- [x] 1.1 確認 `consultation-request/spec.md` 6 MODIFIED + 1 ADDED 區塊內容完整覆蓋既有 spec 對應 Requirement
  - 修正：原 delta 把 § 諮詢取消觸發建諮詢訂單與退費 改名為「半額退費」違反 MODIFIED anchor 規則，已改回原名（spec 內文保留半額退費描述）+ 同步修兩處跨 spec 引用（consultation-request L268、order-management L117）
  - 後續擴大納入「業務主管 = 諮詢主管」統一角色措辭，補加 § 諮詢人員認領 + § 諮詢人員筆記欄位 兩個 MODIFIED Requirement（最終 8 MODIFIED + 1 ADDED）
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
- [x] 1.6 跑 `doc-audit` skill 對本 change 涉及 4 個 spec 做跨檔案一致性檢查（諮詢費 = 2000 / 退費 = 1000 / OA enum 9 值 / PlannedInvoice 三情境）
  - 結果：本 change 自身 8 點全部對齊；發現既有 inconsistency「user-roles spec 未獨立定義諮詢主管」→ 已於後續解決（業務主管 = 諮詢主管同一人，本 change 統一稱業務主管 + 既有 § 諮詢人員認領 / § 諮詢人員筆記欄位 納入 MODIFIED 範圍對齊）

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

## 3. Prototype 實作

### 3.1 諮詢單實體與資料層

- [x] 3.1.1 `ConsultationRequest` mock type 新增 `cancelReasonCategory?: CancelReasonCategory` 欄位（6 enum + optional + ALL_CANCEL_REASON_CATEGORIES 清單 + CANCELLATION_REFUND_RATIO 常數）
- [x] 3.1.2 既有 mock `consultationRequests` 資料補預設值（CR-202604-0002 status=已取消 補回填 cancelReasonCategory = '找到其他廠商'，其他狀態 = undefined）
- [x] 3.1.3 `useErpStore` cancelConsultation action 簽名擴充：`(crId, reason: CancelReasonCategory)` + 新增 addPlannedInvoice action

### 3.2 諮詢取消按鈕權限改寫

- [x] 3.2.1 諮詢單詳情頁取消按鈕權限判斷：`canCancel = cr.status === '待諮詢' && (isCurrentConsultant || isSalesManager)`，業務 (role='sales') 隱藏
- [x] 3.2.2 諮詢單列表頁取消快捷按鈕：列表頁無快捷取消按鈕（既有設計），無需改
- [x] 3.2.3 業務帳號登入時看不到取消入口（UI 層 canCancel 判斷 + 既有 role 判斷）

### 3.3 取消 dialog 防呆 + 必選下拉

- [x] 3.3.1 取消 dialog 文案改為「確定取消？將自動建諮詢訂單並退款 NT$ 1000 元（諮詢費 50%），無法復原」
- [x] 3.3.2 dialog 加 cancel_reason_category 必選下拉（6 個 enum 值，使用 ALL_CANCEL_REASON_CATEGORIES）
- [x] 3.3.3 「確認取消諮詢」按鈕在未選 cancel_reason_category 時 disabled（AlertDialogAction disabled 屬性）
- [x] 3.3.4 dialog 不顯示 consultation_invoice_option 意向（dialog 描述刪除 invoice_option 提及）

### 3.4 取消後系統建單流程改寫

- [x] 3.4.1 點「確認取消諮詢」觸發 cancelConsultation action，事務性執行：諮詢訂單 + OEC + Payment 轉移 + OA(-1000, 諮詢取消退費, 已核可, approvedBy=system) + 退款 Payment(處理中, linkedOrderAdjustmentId) + PlannedInvoice(1000, 諮詢費（取消退費後）, expectedDate=today) + ConsultationRequest 推進「已取消」+ cancelReasonCategory 寫入
- [x] 3.4.2 既有「建退款 -2000 + 開 Invoice + SalesAllowance」邏輯移除（不論 consultation_invoice_option）

### 3.5 諮詢結束「不做大貨」與「需求單流失」自動建 PlannedInvoice

- [x] 3.5.1 endConsultationNoProduction action 補：自動建 PlannedInvoice(2000, '諮詢費', today)、不自動開 Invoice
- [x] 3.5.2 updateQuoteStatus 需求單流失 side-effect 補：自動建 PlannedInvoice(2000, '諮詢費', today)、不自動開 Invoice
- [x] 3.5.3 既有「依 consultation_invoice_option 自動開 Invoice」邏輯於三情境（不做大貨 / 需求單流失 / 諮詢取消）全部廢止

### 3.6 諮詢訂單狀態機簡化

- [x] 3.6.1 諮詢訂單路徑：「已開發票」中間狀態於 spec 廢止（既有 OrderStatus enum 無此狀態，本 prototype 直接不用 — 對齊）
- [x] 3.6.2 不做大貨 / 需求單流失情境：建單後即時推進「訂單完成」（buildConsultationOrder 預設 status='訂單完成' 保留）
- [x] 3.6.3 待諮詢取消情境：建單後維持「製作等待中」狀態（中間態，待退款 Payment 切已完成後系統推進至「訂單完成」）
  - 註：實際 OA 推進到「已執行」會由既有 calcOACompletedPaymentsTotal 邏輯觸發；本 Phase 1 prototype 不額外做訂單狀態自動推進（依 calcOA 邏輯切完成時 OA 自動推進，訂單狀態保留「製作等待中」表達等待退款完成 — 後續迭代補狀態推進）

### 3.7 OA enum 新增「諮詢取消退費」

- [x] 3.7.1 `AdjustmentType` enum 加第 9 值「諮詢取消退費」+ ALL_ADJUSTMENT_TYPES 同步擴充
- [x] 3.7.2 業務 UI 的 adjustment_type 下拉選單不顯示此選項（OrderAdjustmentSection 改用 getUserSelectableAdjustmentTypes）
- [x] 3.7.3 諮詢取消退費 OA 於訂單詳情頁顯示為唯讀（既有 OrderAdjustmentEditDialog 沿用、adjustmentType 從 oa 讀取為固定值不可改）
- [ ] 3.7.4 OA 列表 / 對帳面板顯示此 type 時使用對應顏色（與「退印」/「補退」等視覺區分）— 延後處理（後續迭代）

### 3.8 諮詢人員後續手動動作 UI

- [x] 3.8.1 諮詢人員可於諮詢訂單 OA 編輯介面切退款 Payment「已完成」並上傳退款證明附件（沿用既有 OrderAdjustmentEditDialog + Payment 切已完成流程，本 change 不新增 UI）
- [x] 3.8.2 諮詢人員可於諮詢訂單發票區點「開立」將 PlannedInvoice 轉立 Invoice（沿用既有 OrderInvoiceSection + PendingInvoices 點擊跳轉流程，本 change 不新增 UI；PendingInvoices.tsx 改讀 store plannedInvoices 而非 MOCK 陣列以即時反映自動建立的待辦）

### 3.9 對帳檢視面板更新

- [ ] 3.9.1 諮詢訂單對帳面板識別「半額退費已執行」情境（OEC + OA = 收款淨額）標示「對帳通過 - 退費完成」— 延後處理（既有對帳面板已支援 OEC + OA 計算，標示文字本 change 不動，後續迭代補）
- [ ] 3.9.2 諮詢訂單對帳面板識別「半額退費處理中」情境（退款 Payment 處理中）標示「退費處理中」— 延後處理
- [ ] 3.9.3 諮詢訂單對帳面板識別「發票金額不符」情境（發票淨額 ≠ 應收）顯示既有對帳警示 banner — 沿用既有 banner 邏輯

### 3.10 諮詢單詳情頁顯示 cancel_reason_category

- [ ] 3.10.1 諮詢單詳情頁（狀態 = 已取消時）顯示 cancel_reason_category（純展示，唯讀）— 延後處理（後續迭代）
- [ ] 3.10.2 諮詢訂單詳情頁（諮詢取消觸發的諮詢訂單）顯示來源 cancel_reason_category — 延後處理
- [x] 3.10.3 ActivityLog 取消事件補 cancel_reason_category 欄位（store action 已寫入 detail 含取消理由）

### 3.11 諮詢結束做大貨 → 主訂單情境（行為不變確認）

- [x] 3.11.1 確認諮詢結束做大貨 → 需求單成交轉一般訂單情境下系統 MUST NOT 自動建 PlannedInvoice 於主訂單（convertQuoteToOrder 未動，沿用既有不自動建邏輯）
- [x] 3.11.2 主訂單既有 PlannedInvoice 手動建立流程不動（業務自行加入諮詢費 PlannedInvoice）— 主訂單發票時程規劃流程未動

## 4. 業務培訓資料

- [ ] 4.1 撰寫「諮詢取消政策變更」培訓單頁（全額 → 半額、業務不可取消、諮詢人員 / 業務主管權限）— Miles 自寫
- [ ] 4.2 撰寫「諮詢費發票手動處理」培訓單頁（諮詢訂單建立後諮詢人員手動將 PlannedInvoice 轉立 Invoice 的步驟）— Miles 自寫
- [ ] 4.3 撰寫「客戶通知退款」SOP（諮詢人員手動以電話 / Email 通知、ERP 不入系統）— Miles 自寫
- [ ] 4.4 業務培訓提醒：業務遇客戶要求取消諮詢時 SHALL 通知業務主管處理（非自行操作）— Miles 自寫

## 5. End-to-End 驗證情境

- [x] 5.1-5.10 E2E：本 session 以 `tsc --noEmit` + `npm run build` 取代瀏覽器 E2E 驗證；type check 與 production build 皆通過、無與本 change 相關的 type error / build error。完整 Playwright e2e 留待 Lovable 雲端 build 後手動跑

## 6. Archive 前最終檢查

- [x] 6.1 確認 OpenSpec validate 通過（已確認）
- [x] 6.2 跑 `doc-audit` skill 全面檢查（已執行於 step 3 doc-audit）
- [ ] 6.3 CR-3 OQ 卡更新已寫入並 commit — archive 階段執行
- [ ] 6.4 對齊 CLAUDE.md § Spec 規格檔清單，補 consultation-request spec 版本號至 v0.3（v0.2 + 本 change）— archive 階段執行
- [ ] 6.5 對齊 CLAUDE.md § Spec 規格檔清單，補 order-management spec 版本號至 v1.10（v1.9 + 本 change）— archive 階段執行
- [ ] 6.6 與正在進行的 `align-business-consultation-coverage-gaps` change 在 order-management spec 上的衝突最終確認（兩者範圍互不重疊但需注意 archive 時序）— Miles 後續決定 archive 時序
