---
type: open-question
module:
  - consultation-request
oq-id: CR-3
status: resolved
priority: low
audience: internal
raised-at: 2026-05-22
raised-by: senior-pm-agent
resolved-at: 2026-05-26
resolved-via: refine-consultation-cancellation-and-invoice-flow change
source-link: openspec/changes/archive/2026-05-26-refine-consultation-cancellation-and-invoice-flow/
related-vault:
  - "[[13-user-stories/consultation-request/US-CR-006-諮詢取消預約退費]]"
related-oq: []
expected-resolution-at: 2026-Q4
---

# CR-3 諮詢取消三項擴充議題：部分退費 / 取消理由 / 退款 SLA

## 問題

[[13-user-stories/consultation-request/US-CR-006-諮詢取消預約退費|US-CR-006]] 涵蓋全額退費場景，但 spec 與 user story 均未涵蓋以下三項業務擴充：

### 議題 1：部分退費（保留手續費）

- 客戶取消預約但已預備一些前置成本（如：已準備好諮詢資料 / 業務已花時間溝通）
- 是否支援保留 X% 諮詢費作為手續費？
- 影響：金流計算邏輯、SalesAllowance 金額不再等於原 Payment 金額

### 議題 2：取消理由 enum

- 目前 user story 未要求業務記錄客戶取消原因
- 後續無法分析流失原因（客戶找到其他廠商 / 預算問題 / 時間衝突 等）
- 是否需要結構化 LOV（reject_reason_category 模式類似 PI-009）？

### 議題 3：退款撥付 SLA 與通知機制

- 系統建立負值 Payment 後實際銀行退款處理時間未定
- 客戶何時收到退款？由誰通知？
- 影響：客戶體驗（不知何時退款）+ 業務追蹤負擔

## 影響

- 影響 US-CR-006 acceptance criteria 是否補入相關條件
- 議題 1 影響資料模型（OrderExtraCharge / SalesAllowance 金額計算）
- 議題 2 影響統計分析能力
- 議題 3 影響 SLA 設計

## 決議（2026-05-26 隨 refine-consultation-cancellation-and-invoice-flow change archive 解答）

### 議題 1：部分退費 — RESOLVED

- **採半額退費（50% 寫死）**：諮詢費 2000 → 退 1000、不分時機、不分客戶 / 諮詢人員主動取消
- 比例 hardcode in code、**不開放系統設定**（避免「不同分公司不同設定」非預期使用情境）
- 退款載體：以 `OrderAdjustment(-1000, adjustment_type = 諮詢取消退費, status = 已核可, approved_by = system)` 表達半額退款，沿用「應收 = OEC + ∑OA」對帳公式
- spec 對應：consultation-request spec § 諮詢取消觸發建諮詢訂單與退費

### 議題 2：取消理由 enum — RESOLVED

- **新增 `cancel_reason_category` 必填欄位**（取消時必選 enum 6 值）：
  1. 找到其他廠商
  2. 預算問題
  3. 需求改變
  4. 時間無法配合
  5. 諮詢人員無法出席
  6. 其他（原因請參考備註）
- 不新增獨立 `cancel_reason_note` 欄位：補充說明（特別在「其他」情境）寫入既有 `consultant_note` 欄位
- 取消 dialog 強制必選下拉，未選不可提交
- spec 對應：consultation-request spec § 諮詢單實體與表單欄位 + § 諮詢取消觸發建諮詢訂單與退費 dialog 防呆 Scenario

### 議題 3：退款撥付 SLA 與通知機制 — RESOLVED

- **退款撥付**：依原付款方式刷退（諮詢付款限第三方金流），由第三方金流處理。ERP 只記錄取消事實與處理中退款 Payment、**不承諾撥款 SLA**
- **客戶通知**：由諮詢人員手動以電話 / Email 等管道通知、**不入系統**（無自動發送機制）
- spec 對應：consultation-request spec § 諮詢取消觸發建諮詢訂單與退費 退款金流處理段 + 諮詢人員後續手動段

## 衍生決議（同 change archive 一併紀錄）

- **CR-4**：凡允許退款的取消情境一律 50%（不分客戶 / 諮詢人員主動）
- **CR-5**：50% 比例 hardcode in code、不開放系統設定
- **CR-6**：諮詢費 Invoice 自動化全面退場 → 改為自動建 PlannedInvoice 由諮詢人員手動轉立（不做大貨 / 需求單流失各建 2000 元；諮詢取消建 1000 元；做大貨 → 主訂單成交情境不自動建）
- **CR-7**：取消 dialog 純防呆（不顯示 invoice_option 意向）+ cancel_reason_category 必選
- **CR-8**：自動建立的 PlannedInvoice `expectedDate` = 觸發時點當天
