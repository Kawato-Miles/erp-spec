---
type: open-question
module:
  - 諮詢單
oq-id: CR-4
status: answered
priority: medium
audience: internal
raised-at: 2026-05-29
raised-by: Miles
resolved-at: 2026-05-30
resolved-by: Miles
resolution-change: add-sales-manager-reassign-owner
source-link: /opsx:explore add-sales-manager-reassign-owner 探索（2026-05-29）
related-vault:
  - "[[諮詢單]]"
related-oq:
  - CR-1
  - XM-008
expected-resolution-at: 2026-Q2
---

# CR-4：諮詢單認領後改派的狀態限制

## 問題描述

本次探索拍板「諮詢單改派 = 業務主管重新指定 `consultant_id`（突破認領後鎖定）」。但「認領後改派」的狀態限制未定：諮詢單已認領並進入後續狀態（如「諮詢中」）後，業務主管能否改派？哪些狀態可改、哪些不可？

## 背景

[[CR-1-諮詢分派模式自派他派或混合|CR-1]]（已 closed）拍板諮詢單採「純自派 + 主管代為認領」，但只解決**初始認領**模式，未涵蓋「認領**後**的重新指定（改派）」。本功能首次開放主管在認領後改派，需補狀態限制。

諮詢單與需求單／訂單不同：諮詢單是認領制（誰認領誰負責），改派本質是「重新指定認領人」，突破了 CR-1「認領後鎖定」的隱含設計。

## 涉及範圍

- 模組：consultation-request
- 相關卡：[[諮詢單]]
- 影響範圍：諮詢單狀態機、改派動線、ActivityLog 事件型別

## 待解答

- [ ] 哪些諮詢單狀態允許主管改派（待諮詢 / 諮詢中 / 已結束？）
- [ ] 改派後諮詢單狀態是否回退（如從「諮詢中」回「待諮詢」），還是維持現狀僅換人
- [ ] 改派後是否通知原認領人（與 [[XM-008-業務主管改派負責業務的權限邊界與機制|XM-008]] 子項 2 通知機制呼應）

## 決議與理由（2026-05-30）

由 change `add-sales-manager-reassign-owner` 拍板並實作（2026-05-30 archive）：

- **可改派狀態**：限「待諮詢」且已認領（consultantId 有值）；「完成諮詢 / 已轉需求單 / 已取消」終態禁止改派（store gate + UI 互斥）。
- **改派不回退狀態**（design D2）：改派只重新指定 consultantId、不改變諮詢單狀態。
- **通知**：改派後通知原認領人（`reassignNotifiesPrevious`，非離職情境）。
- **與認領互斥**：未認領顯示「指派諮詢人員」、已認領顯示「改派負責人」。

**決策者**：Miles（2026-05-30）

## 相關 OQ

- [[CR-1-諮詢分派模式自派他派或混合]]（初始認領模式已拍板，本 OQ 補認領後改派）
- [[XM-008-業務主管改派負責業務的權限邊界與機制]]（跨模組改派機制母題）
