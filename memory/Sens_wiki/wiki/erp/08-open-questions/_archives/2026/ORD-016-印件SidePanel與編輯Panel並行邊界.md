---
type: open-question
module:
  - 訂單管理
oq-id: ORD-016
status: answered
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: Miles
source-link: openspec/changes/refine-order-detail-tabs/design.md § Open Questions
related-vault:
  - "[[印件]]"
related-oq: []
expected-resolution-at: 2026-06-15
answered-at: 2026-06-11
answered-by: Miles
---

# ORD-016：印件詳情 Side Panel 與編輯印件 Panel 並行邊界

## 問題描述

refine-order-detail-tabs change 新增 PrintItemDetailSidePanel（檢視印件詳情），但訂單詳情頁印件 row 操作欄製作前同時保留「編輯印件」按鈕（觸發 EditOrderPrintItemPanel）。

兩個 Panel 同時為右側 ErpSidePanel（底層 shadcn Sheet），使用者操作邊界場景：
1. 點「檢視」開 PrintItemDetailSidePanel → 又點主表的「編輯印件」按鈕
2. 兩個 Panel 都用同樣的 `right` direction、同樣的 size=lg

當前實作未明示處理此並行衝突。Sheet 並行行為依 Radix Dialog 預設（後開的 Sheet 可能蓋住前開的、或前開的被強制關閉），UX 不確定。

## 涉及範圍

- 模組：order-management
- 相關卡：[[印件]]
- 影響範圍：訂單詳情頁印件清單操作 UX
- 對應 spec：openspec/specs/order-management/spec.md § ADDED「印件詳情 Side Panel」
- 程式碼：sens-erp-prototype/src/pages/OrderDetail.tsx（PrintItemDetailSidePanel + EditOrderPrintItemPanel 並存掛點）

## 討論記錄

refine-order-detail-tabs change 規劃階段：
- design.md § Risks 已記錄：兩個 Panel 共用 `selectedPrintItem*` state 但語意不同（view vs edit），需互斥
- 當前實作未追加互斥邏輯，留待 prototype 試用後依實際邊界場景決定

## 待解答

- [ ] 使用者開檢視 Panel 後再點編輯，UX 預期是哪種？
- [ ] 若採互斥，互斥的觸發點是「打開第二個時自動關第一個」還是「鎖定第二個按鈕」？
- [ ] 是否考慮將編輯動作合併進 Side Panel（內部新增「編輯」按鈕，取代主表分離的編輯入口）？

## 候選方案

### 方案 A：兩個 Panel 互斥（開一個關另一個）
- 優點：UX 單純、不會有「半透明遮罩疊半透明遮罩」視覺
- 缺點：使用者需重新點開另一個入口
- 實作：開檢視 Panel 時 `setEditingPrintItem(null)`，反之亦然

### 方案 B：允許並行（依 Radix Sheet 預設行為）
- 優點：無額外處理
- 缺點：UX 不可預期、視覺重疊嚴重

### 方案 C：編輯動作改為 Side Panel 內 inline 按鈕
- 優點：動線統一（檢視 → 切換為編輯模式）、主表操作欄精簡
- 缺點：Side Panel 需新增「編輯」按鈕 + view/edit mode 切換 state、開發成本上升
- 影響：DESIGN.md 「列表 row 詳細資訊預覽」決策樹可能要補「含編輯模式」變體

## 決議（2026-06-11）

定案採方案 A「兩個 Panel 互斥」：開檢視 Panel 時自動關閉編輯 Panel、開編輯 Panel 時自動關閉檢視 Panel。落地去處：Prototype `OrderDetail.tsx` 印件 row 操作欄兩個按鈕 onClick 已補互斥（2026-06-11 實作）。方案 C（編輯動作併入 Side Panel）不採，保持最小可行。
