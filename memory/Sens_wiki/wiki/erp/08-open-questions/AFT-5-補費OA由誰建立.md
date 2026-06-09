---
type: open-question
module:
  - after-sales-ticket
  - 訂單管理
oq-id: AFT-5
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: Miles (plan 階段)
source-link: openspec/changes/archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/design.md
related-vault:
  - [[../05-entities/售後服務]]
  - [[../05-entities/訂單]]
related-oq:
related-change: refine-after-sales-refund-and-add-supplementary-print
related-insight:
  - 2026-05-20-售後ticket-reactive-補丁循環
expected-resolution-at: 2026-Q3
---

# AFT-5：補印情境下補費 OA 由誰建立 — 業務手動 vs 系統自動帶建

## 背景

本 change 補印 PrintItem 設計：

- ticket.responsibility = 公司認賠：補印免費，**不**建補費 OA
- ticket.responsibility = 客戶承擔：業務需另外**手動**建補費 OA（adjustment_type = 補退，金額 = 補印工本費）

本 change 採「業務手動建補費 OA」（解耦設計），原因是補費金額計算邏輯有歧義（工本費 vs 雙方協商價）。

## 問題

補印 PrintItem 建立時（ticket.responsibility = 客戶承擔），系統是否要：

候選做法：

1. **業務手動建補費 OA**（本 change 設計）：補印 dialog 提交後 ticket 顯示提示「請另外建補費 OA」，業務需到 ticket 內手動點「建立補費異動單」
2. **ticket dialog 內聯建補費 OA**：建補印 dialog 增加「補費金額」欄位，提交後系統一次性建 PrintItem + OA（草稿）
3. **系統自動建議補費金額**：依補印 PrintItem 的規格（材料 / 工序 / 裝訂）自動展算建議補費，業務在 dialog 內確認或修改
4. **強制系統自動建補費 OA（無建議金額，業務後填）**：補印 + 客戶承擔 = 強制建一張草稿 OA，業務後填金額

## 影響範圍

- 影響業務操作體驗（一氣呵成 vs 解耦）
- 影響補費金額計算邏輯設計（自動展算 vs 手動）
- 影響 ticket dialog 複雜度（單一責任 vs 多重責任）

## 待釐清

- 印刷業實務上補印的補費計算邏輯（工本費展算公式 / 雙方協商價慣例）
- 業務 / 諮詢角色在補費場景的常見操作流程
- 是否與 [[印件]] 的 BOM 展算 + 計價邏輯整合
- 待確認補費金額計算邏輯後決定方案

## 來源

- Miles plan 階段反饋（明確排除本次範圍）
- senior-pm 前期介入 第 4 段風險 D（補印取消後 ticket 不會自動結案，spec 既有處理）
- change `refine-after-sales-refund-and-add-supplementary-print` design.md § 決策 6 + § OQ-6
