---
type: open-question
module:
  - 售後服務
oq-id: AFT-1
status: open
priority: medium
audience: internal
raised-at: 2026-05-19
raised-by: Miles
notion-link:
expected-resolution-at: 2026-Q3
related-change:
  - add-my-after-sales-action-page-and-remove-owner-transfer
  - add-sales-manager-reassign-owner
related-insight:
  - 2026-05-20-售後ticket-reactive-補丁循環
related-oq:
  - XM-008
---

# AFT-1：業務離職 / 請假時未結案 ticket 的實務替代處理方式

## 背景

`add-my-after-sales-action-page-and-remove-owner-transfer` change 確認**業務主管不會介入轉派**售後 ticket，因此移除「業務離職 / 請假時 ticket 負責人轉派」整個 Requirement、相關 Prototype 頁面（`ManageAfterSalesTicketOwnership.tsx`）、`owner_transfer_log` 欄位與 `transferAfterSalesTickets` store action。

但業務離職 / 長假的情境仍會發生，名下未結案 ticket 需要有人接手處理，否則會回到本 change 要解決的「漏單沒處理」痛點。

## 問題

業務 A 離職或長假，名下有 N 張未結案 AfterSalesTicket。系統不提供轉派功能後，這些 ticket 該如何讓其他業務 / 諮詢接手處理？

候選做法：

1. **資料庫手動 SQL 改 `openedBy`**（IT 出手，後台手動操作）
2. **訂單管理人逐張改**（依 Vault 售後服務實體卡，訂單管理人原規劃為轉派執行者）
3. **客戶聯繫業務本人**（不轉派，由客戶端發起，業務 A 線下交接）
4. **業務主管口頭分配，由接手業務手動建新 ticket 加 `additional_complaint_log` 補述歷史 ticket 內容**

## 影響範圍

- 不影響本 change 範圍（本 change 為移除既有 spec 功能）
- 影響資料治理層面：未結案 ticket 的 ownership 追溯
- 影響 [諮詢角色卡](諮詢.md) / [業務角色卡](業務.md) 的 R&R 描述

## 待釐清

- 印刷業實務上業務離職 / 長假的頻率（是否真的不需要系統功能）
- 若採做法 1，IT 介入成本與審計需求
- 若採做法 2，訂單管理人這個角色的 R&R 是否需要擴增「售後 ticket 接手」職責
- 若採做法 3 / 4，業務 / 諮詢端的客訴體驗是否可接受

## 來源

- change `add-my-after-sales-action-page-and-remove-owner-transfer` Miles 答覆：業務主管不會介入轉派
- 既有 spec：[after-sales-ticket spec § 業務離職 / 請假時 ticket 負責人轉派](../../../../openspec/specs/after-sales-ticket/spec.md)（本 change 將 REMOVED）
- Vault [售後服務實體卡](售後服務.md) § 相關角色：訂單管理人原為轉派執行者

## 部分涵蓋進展（2026-05-29）

`/opsx:explore` 探索「業務主管改派負責業務」（規劃 change `add-sales-manager-reassign-owner`）後，Miles 拍板：**前段三單據（諮詢單／需求單／訂單）的離職接手，改由業務主管於各單據詳情頁單張改派接手**。此部分回應本 OQ 的「跨人接手」痛點，範圍切割如下：

- **本次涵蓋**：前段業務單據（諮詢單 / 需求單 / 訂單）的負責業務改派 → 詳見 [[XM-008-業務主管改派負責業務的權限邊界與機制|XM-008（已封存）]]、[[CR-4-諮詢單認領後改派狀態限制|CR-4（已封存）]]
- **本 OQ 仍 open 的部分**：**售後服務 ticket** 的離職接手（Miles 限定本次只做三前段單據，售後 ticket 暫不納入）。售後 ticket 的 `openedBy` 接手機制仍待釐清（候選做法見上）。

故本 OQ status 維持 open，待售後 ticket 接手機制後續決議。
