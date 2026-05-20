---
type: open-question
module:
  - after-sales-ticket
  - work-order
  - task-dispatch-board
oq-id: AFT-4
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: Miles (plan 階段)
source-link: openspec/changes/refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/印件]]
  - [[../05-entities/售後服務]]
related-oq:
related-change: refine-after-sales-refund-and-add-supplementary-print
expected-resolution-at:
---

# AFT-4：補印印件的優先度規則 — 視覺識別 vs 強制高優先排程

## 背景

本 change 在 PrintItem.type 擴充「補印印件」並在四個列表頁（業務平台印件總覽 / 派工看板 / 工單列表 / 訂單列表）統一加「印件類型」欄位 + filter。

Miles 反饋的初衷之一：「讓印務、業務可以知道該印件是補印的，以利確認製作優先度」。但本 change 僅做視覺識別 + filter，未強制系統層級的優先度規則。

## 問題

印務 / 派工人員看到「補印」類型的印件，系統是否要：

候選做法：

1. **僅視覺識別**（本 change 設計）：補印標籤顯示在列表，印務 / 派工人員自行判斷優先度
2. **預設高優先度排程**：補印 PrintItem 建立工單 / 生產任務時，系統自動標 priority = high，工序卡片排程時優先派工
3. **依 ticket SLA 動態優先度**：補印優先度由所屬 ticket 的 SLA / 客戶等級決定（OQ-AFT-2 逾期分級相關）
4. **客戶層級決定**：依客戶等級（VIP / 一般）自動決定補印優先度

## 影響範圍

- 不影響本 change 主流程（已決定僅視覺識別）
- 影響派工看板排程邏輯（自動 vs 手動）
- 影響生產任務優先度欄位設計（是否需要 priority 欄位）

## 待釐清

- 印務 / 派工人員實際的優先度判斷邏輯（待 UAT 觀察）
- 補印是否真的應該「永遠高優先」（部分情境下原訂單也是急件）
- 是否與 [[after-sales-ticket-AFT-2-逾期分級]] 整合（補印 ticket 的 SLA 規則）

## 來源

- Miles plan 階段反饋（初衷）
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § OQ-5
