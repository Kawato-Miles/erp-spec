---
type: open-question
module:
  - 訂單管理
oq-id: ORD-017
status: answered
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: Miles
source-link: openspec/changes/refine-order-detail-tabs/design.md § Open Questions
related-vault:
  - "[[付款發票邏輯]]"
  - "[[訂單]]"
related-oq: []
expected-resolution-at: 2026-07-31
answered-at: 2026-06-11
answered-by: Miles
---

# ORD-017：金額組成混合稅率（免稅品）UI 呈現策略

## 問題描述

refine-order-detail-tabs change 將訂單詳情頁「金額組成」區塊改為業界模式 A1：
- 分項區 ErpTable 四欄（分項名稱 / 數量摘要 / 未稅小計 / 含稅小計）
- 底部 summary stack：小計（未稅）/ 營業稅 5% / = 應收總額（含稅）

**問題假設**：所有分項採單一稅率（5%）。

**實務情境**：印刷業有免稅品（如書籍出版品、特定文教用品），同一訂單可能混合應稅 + 免稅分項。當前 UI 結構無法表達：
- 分項層級無「該分項是否免稅」標記
- summary stack「營業稅 5%」單行無法表達「應稅 / 免稅分計」

## 涉及範圍

- 模組：order-management
- 相關卡：[[付款發票邏輯]] / [[訂單]]
- 影響範圍：金額組成區塊 + 發票開立 + 對帳 + Invoice Data Model
- 對應 spec：openspec/specs/order-management/spec.md § MODIFIED「雙欄計價輸入與顯示」

## 討論記錄

refine-order-detail-tabs change 規劃階段：
- 業界調研（SAP / NetSuite / Odoo）模式 A 主流支援多稅率
- 印刷業免稅品場景未在當前 spec 範圍
- Miles 決議：本 change 採單一稅率（5%）假設，混合稅率場景另開 change 處理

當前 prototype 未涵蓋免稅品，需後續確認：
1. 公司業務是否真的有免稅品訂單？頻率？
2. 若有，發票端如何拆？單張發票可混應稅 + 免稅項目嗎？（藍新 / 財政部規範）

## 待解答

- [ ] 公司業務是否有免稅品訂單？實際業務頻率？
- [ ] 若有，發票端的處理是「拆兩張發票」還是「單張混項目」？
- [ ] UI 呈現方案選擇？

## 候選方案

### 方案 A：分項 row 加 Badge 標記免稅
- 視覺：免稅分項在「分項名稱」欄旁加「免稅」Badge（`bg-amber-50 text-amber-700`）
- summary stack「營業稅 5%」row 展開為兩行：「應稅小計 × 5%」「免稅小計（× 0%）」
- 優點：分項可見性高、summary 透明
- 缺點：分項 row 視覺密度上升

### 方案 B：summary stack 分行（不動分項區）
- 分項區 row 不變動
- summary stack 加一行「應稅 / 免稅小計」對照表
- 優點：分項區簡潔
- 缺點：使用者需在 summary 區回推「哪些分項免稅」

### 方案 C：完全另開「免稅品訂單」view
- 不混用同一 UI、依 `order.has_tax_exempt = true` 切換不同金額組成版型
- 優點：兩種場景不互相干擾
- 缺點：UI 維護成本翻倍

## 依賴

- 需先確認業務需求（方案選擇依賴實際業務頻率與發票規範）
- 可能影響：Invoice Data Model（need `tax_exempt_amount` 欄位？）、發票開立 spec、ezpay 整合

## 決議（2026-06-11）

定案維持單一稅率（5%）假設（沿原 change 決議）。混合稅率（免稅品）場景待實際業務需求出現時另開 change 處理，屆時一併確認免稅品訂單頻率與發票拆分規範。落地去處：無需落地（現況即定案）；UI 候選方案 A/B/C 留存本卡供屆時參考，不預先實作。
