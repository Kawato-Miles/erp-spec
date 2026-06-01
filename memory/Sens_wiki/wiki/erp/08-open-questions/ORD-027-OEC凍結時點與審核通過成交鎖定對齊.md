---
type: open-question
module:
  - order-management
  - payment
oq-id: ORD-027
status: open
priority: medium
audience: internal
raised-at: 2026-06-01
raised-by: doc-audit（align-business-consultation-coverage-gaps archive 前一致性檢查）
source-link: openspec/changes/align-business-consultation-coverage-gaps/
related-vault: []
related-oq:
  - BI-1
---

# ORD-027：OrderExtraCharge 凍結時點與「審核通過」成交條件鎖定是否對齊

## 問題描述

`align-business-consultation-coverage-gaps` change 在線下訂單前段新增「審核通過」狀態，並把**成交條件鎖定錨點前移至「審核通過」**：`審核通過狀態下訂單修改` Requirement 規定，進入「審核通過」後，報價總額（含 OrderExtraCharge 加總）屬核心欄位，變更 MUST 走 OrderAdjustment、不可直接修改。

但既有 `OrderExtraCharge vs OrderAdjustment.fee 時間邊界` Requirement（order-management spec § 該 Requirement）將 OEC 凍結時點定義為「進入**報價待回簽**之後」——意即在「審核通過」狀態仍可直接新增 OEC。

兩條規則在「審核通過」狀態互相矛盾：
- OEC 時間邊界規則：審核通過態仍可加 OEC（凍結要到報價待回簽才生效）
- 核心欄位鎖定規則：審核通過態加 OEC（改動報價總額）須走 OrderAdjustment

## 涉及範圍

- 模組：order-management（OEC / OrderAdjustment 邊界）、payment（成交條件）
- 相關 Requirement：`OrderExtraCharge vs OrderAdjustment.fee 時間邊界`、`審核通過狀態下訂單修改`、`業務主管核准訂單`
- 影響：業務在「審核通過」態能否直接加運費 / 急件費（OEC）、或一律走 OrderAdjustment

## 待解答

- [ ] OEC 凍結時點是否由「報價待回簽」前移至「審核通過」，與成交條件鎖定一致？
- [ ] 該 Requirement 使用的 legacy 狀態詞（「報價評估階段」「訂單確認」）是否一併對齊現行線下狀態機（草稿 / 待業務主管審核 / 審核通過 / 報價待回簽）？

## 候選方案（若有）

### 方案 A：OEC 凍結前移至「審核通過」（建議）
- 優點：與成交條件鎖定一致——審核通過 = 業務主管已核可成交條件，此後任何影響報價總額的動作（含加 OEC）皆走 OrderAdjustment + 主管審核，把關完整
- 缺點：壓縮業務可直接加 OEC 的視窗（僅草稿 / 待業務主管審核兩態），但這兩態本就可自由編輯，影響有限

### 方案 B：維持 OEC 凍結於「報價待回簽」、核心欄位鎖定例外放行 OEC
- 優點：保留審核通過態加 OEC 的彈性
- 缺點：與「審核通過鎖定成交條件」的把關設計直接衝突，等於核可後仍可改報價總額繞過把關（正是本 change 要修補的漏洞型態）
