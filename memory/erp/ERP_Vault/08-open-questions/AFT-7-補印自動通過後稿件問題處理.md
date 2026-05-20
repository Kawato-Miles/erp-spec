---
type: open-question
module:
  - after-sales-ticket
  - prepress-review
oq-id: AFT-7
status: open
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: Miles (補印審稿自動通過設計)
source-link: openspec/changes/archive/2026-05-20-refine-supplementary-print-skip-review/design.md
related-vault:
  - [[../05-entities/印件]]
  - [[../05-entities/售後服務]]
related-oq:
  - AFT-6
related-change: refine-supplementary-print-skip-review
expected-resolution-at:
---

# AFT-7：補印自動通過後印務發現稿件實際有問題的標準處理動作

## 背景

`refine-supplementary-print-skip-review` change 設計：補印 PrintItem 建立時系統自動通過審稿（reviewStatus = '合格'、currentRoundId 指向自動通過輪次）。

但理論上的例外情境：印務分配工單時打開稿件發現實際有問題（例：客戶交付的原稿其實有錯字 / 設計缺陷，但前次審稿沒抓到、現在補印才發現）。此時印務應該怎麼推進？

## 問題

補印 PrintItem 已 reviewStatus = '合格'，但印務發現稿件實際有問題：

候選做法：

1. **走既有「補件」路徑**（spec 已暗示）
   - 印務 escalate 給業務 → 業務在 PrintItem 詳情頁點「補件」
   - 建立新 ReviewRound（補件路徑），業務上傳新稿 → 重新審稿
   - 補印 PrintItem 從「合格」回退到「等待審稿」/「待補件」狀態
   - 優點：複用既有狀態機，無需新流程
   - 缺點：補印 PrintItem 的「合格」狀態被回退，audit log 需明確記錄

2. **印務直接拒絕分配工單 + 觸發 ticket 升級**
   - 印務點擊「稿件有問題」按鈕，補印 PrintItem 自動標記「待重新審稿」
   - 系統自動 escalate 給審稿主管處理
   - 缺點：新增狀態機路徑，複雜

3. **取消此補印 + 業務重建**
   - 印務 escalate → 業務取消當前補印 PrintItem → 重建新的補印
   - 新補印同樣自動通過（如果業務仍想沿用原稿）→ 還是會卡住
   - 不合理，無解套

4. **建立反向 ActivityLog + 不改狀態機**
   - 印務只記錄「發現稿件問題」事件，業務 / 主管事後處理
   - 缺點：補印 PrintItem 仍可分配工單，可能誤用有問題的稿件

## 影響範圍

- 不影響本 change 主流程（已決定 99% 補印自動通過）
- 影響印務 / 業務 / 審稿主管的例外處理體驗
- 影響審稿狀態機（是否允許「合格」回退）

## 待釐清

- 實務上印務發現補印稿件有問題的發生頻率
- 既有「補件」路徑是否允許從「合格」狀態觸發（spec 未明）
- 印務的權限是否包含 escalate 補印審稿問題
- 標準操作流程（印務 → 業務 → 審稿主管？還是印務直接到審稿主管）

## 來源

- Miles 反饋（補印審稿自動通過設計）
- change `refine-supplementary-print-skip-review` design.md § OQ-SP-2 + § Migration Plan 風險 1
