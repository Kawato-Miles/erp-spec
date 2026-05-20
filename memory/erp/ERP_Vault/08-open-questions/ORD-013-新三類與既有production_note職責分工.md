---
type: open-question
module:
  - order-management
oq-id: ORD-013
status: open
priority: high
audience: internal
raised-at: 2026-05-20
raised-by: erp-consultant (三視角審查 round 1)
source-link: openspec/changes/add-order-note-section-with-template-tool/proposal.md
related-vault:
  - [[../05-entities/訂單]]
related-oq:
  - ORD-005
  - ORD-007
related-change: add-order-note-section-with-template-tool
expected-resolution-at:
---

# ORD-013：新三類備註與既有 production_note 的職責分工

## 背景

erp-consultant 三視角審查 round 1 指出：

[既有 spec § 訂單備註三類分欄](../../../openspec/specs/order-management/spec.md)（spec.md:1496-1525）已將備註拆為三類：
- `customer_note`（線上單客戶端，唯讀）
- `internal_note`（內部備註，客戶不可見）
- `production_note`（**線下單訂單製作備註：製作 / 交易 / 出貨備註彙整**）

本 change 又新增「訂單 / 交貨 / 付款」三類：
- `order_note`（訂單備註：訂單條件）
- `delivery_note`（交貨備註：交貨條件）
- `payment_note`（付款備註：付款條件）

兩套並存後，業務在訂單詳情頁會看到**最多 8 個 textarea**（5 既有 + 3 新增），且職責有重疊：
- `production_note`「出貨備註」vs 新 `delivery_note`「交貨條件」
- `payment_terms_note`「收款條件」vs 新 `payment_note`「付款條件」
- `internal_note`「內部備註」vs 新 `order_note`「訂單條件」

Miles 拍板：保留既有 + 新增三類並存（不取代既有欄位）。但需明確職責分工，避免業務寫的時候不知道該填哪欄。

## 問題

兩套備註的職責分工應該如何明確化？

候選做法：

1. **明文寫入 spec 的職責分工表**：
   ```
   既有 production_note：內部製作流程細節（材料 / 工序 / 印務注意事項）
   新 delivery_note：對客戶說明的交貨時程與運送方式條款
   既有 payment_terms_note：報價階段約定的收款條件（唯讀）
   新 payment_note：訂單階段補充的付款條件變更或客戶溝通記錄
   既有 internal_note：純內部備註（如「客戶說週五前急要」「業務 LINE 已通知」）
   新 order_note：對客戶說明的整體訂單注意事項（如印刷須知 / 不打樣聲明）
   ```
2. **依「資料受眾」分軸線**：
   - 既有三類：**內部受眾**（員工流程備註）
   - 新三類：**對外受眾**（客戶溝通條款）
3. **UI 視覺分組強化**：
   - 既有三類放在「內部備註」區（左側 / 摺疊）
   - 新三類放在「對客戶說明」區（右側 / 展開）
4. **欄位 placeholder 文字明示**：用 placeholder 引導業務該寫什麼

## 影響範圍

- spec § Data Model：每欄位的 description 文字必須明確區分
- 訂單詳情頁版型：兩組 textarea 的視覺分組策略
- 業務培訓：上線後業務需理解新舊兩套切分維度
- ORD-012 報價單匯出：客戶文件只帶新三類，不帶舊三類（如此分軸線才有意義）

## 待釐清

- 業務 / 諮詢實務上能不能維持兩套切分維度，還是會混用？
- 是否需要 UI 上提供「跳轉到 internal_note」的快捷（避免業務把內部話寫到 order_note）
- production_note 既有歷史資料如何 reclassify（不動 / 自動拆 / 業務手動拆）

## 來源

- erp-consultant 三視角審查 round 1（「同一個訂單上會存在兩套並行三類分欄、共 8 個 textarea」）
- Miles 回應：保留既有 + 新增三類並存
- change `add-order-note-section-with-template-tool` proposal.md
