---
type: open-question
module:
  - order-management
oq-id: ORD-1
status: answered
priority: low
audience: internal
raised-at: 2026-05-22
raised-by: claude-on-task
answered-at: 2026-05-22
answered-by: claude-on-task
source-link: 訂單模組 user story 遷移時識別
related-vault:
  - "[[US-ORD-005-訂單發票與配送資訊編輯]]"
  - "[[US-ORD-009-訂單管理人查看全公司訂單]]"
related-oq:
  - "[[AR-2-Notion-US-AR-002編碼重複處理]]"
---

# ORD-1 Notion US-ORD-005 編碼重複處理

## 問題

Notion User Story DB 內 `US-ORD-005` 編碼有兩個不同條目：
1. 訂單發票與配送資訊編輯（中，主要流程）
2. 訂單管理人查看全公司訂單（中，主要流程）

且 US-ORD-009 為缺號。

## 決策（2026-05-22 沿用 AR-2 模式）

採與 [[AR-2-Notion-US-AR-002編碼重複處理]] 相同處理：
- US-ORD-005 保留「訂單發票與配送資訊編輯」（原始 005，內容完整）
- 「訂單管理人查看全公司訂單」重新編號為 **US-ORD-009**（補既有缺號）

Notion 端歷史資料：下次 mode C 推送時，將 Notion 重複的 US-ORD-005 改編號為 US-ORD-009 update（不刪除歷史）。

## 待 Miles 確認

無需確認，採已驗證模式（AR-2 相同處理）；如有異議再回頭調整。
