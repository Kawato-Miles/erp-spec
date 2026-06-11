---
type: open-question
module:
  - 售後服務
oq-id: AFT-9
status: open
priority: low
audience: internal
raised-at: 2026-05-26
raised-by: Miles
notion-link:
expected-resolution-at: 2026-Q4
related-change: add-sales-manager-after-sales-page
related-insight:
---

# AFT-9：業務主管全公司售後管理頁「最後活動時間」欄是否需升級為 `last_activity_at` derived field

## 背景

`add-sales-manager-after-sales-page` change（2026-05-26）為業務主管在中台新增「售後服務」全公司管理頁，列表新增「最後活動時間」欄協助主管判斷「ticket 是否停滯」。

本 change 採方向 A：沿用既有 `AfterSalesTicket.updatedAt` 作為此欄資料來源（prototype 階段成本最低）。

## 問題

`updatedAt` 在資料庫慣例中泛指「任何欄位被更新的時間」。當前所有 transitions（`transitionTicketToProcessing` / `transitionTicketToClosed` / `modifyTicketResolution`）+ `appendComplaintLog` 都正確寫入 `updatedAt`，prototype 階段足夠。

但未來若 ticket 加新欄位（如後台對帳註記欄位、customer_feedback_note 修改、Slack URL 更新等）僅該欄位更新也會 bump `updatedAt`，可能與業務意義的「最後實質活動」漂移：

- 「業務主管視角下的最後活動」= 此 ticket 是否仍在被處理（推進 resolution、新補述、下游動作建立）
- 「資料庫 `updatedAt` 視角」= 任何欄位異動，含技術層 metadata 更新

兩者語意可能不一致，導致主管看「最後活動 3 天前」但實際 ticket 30 天無人處理。

## 候選做法

1. **方向 A（採用 - prototype 階段）**：沿用 `updatedAt`
   - 成本：低（既有欄位，無需擴充）
   - 風險：未來語意污染

2. **方向 B（觀察後升級）**：新建 `AfterSalesTicket.last_activity_at` derived field
   - 在所有「業務實質活動事件」hook 中寫入：transitions / appendComplaintLog / slackThreadUrl 變更 / 關聯 OA 建立 / 關聯 PrintItem 補印建立 / 關聯 Payment 建立
   - 不在「純 metadata 更新」事件中寫入
   - 成本：中（需在所有 hook 點寫入 + 既有資料 backfill）
   - 風險：低，語意精準

## 升級觸發條件

升級至方向 B 的條件（任一即可）：

1. 業務主管反映語意混淆（如「為什麼這個 ticket 顯示『3 天前』但實際 30 天沒人動過？」）
2. 統計顯示「最後活動時間」與「真實最後業務行動」差距 > N 天的 ticket 比例 > X%
3. AfterSalesTicket 實體加入「純技術 metadata 欄位」造成 `updatedAt` 漂移

## 影響範圍

- 不影響本 change 範圍（本 change 沿用 `updatedAt`）
- 影響 `AfterSalesTicket` 實體未來擴充時的設計決策
- 影響業務主管「售後服務」頁的「最後活動時間」欄資料準確性
- 影響 [Vault 售後服務實體卡](../05-entities/) 的 derived field 章節（升級後需補）

## 待釐清

- prototype 上線後業務主管實際使用頻率（驗證此 OQ 重要性）
- 是否有其他模組（OrderAdjustment / PrintItem / Payment）也有類似「最後實質活動時間 vs updatedAt」語意分歧需要一起治理
- 升級時點：等業務反映 vs 預先規劃（依本 OQ priority = low，傾向業務反映後再啟動）

## 來源

- change `add-sales-manager-after-sales-page` Phase 3 顧問識別風險（C5：updatedAt 語意污染）+ Phase 4 PM 採納為留 OQ 觀察
- 既有 spec：[after-sales-ticket spec § Requirement: 業務主管全公司售後管理頁](../../../../openspec/specs/after-sales-ticket/spec.md)（本 change ADDED）「最後活動時間」欄資料來源說明
- 業界對標：[Zendesk Workflow recipe: Managing your escalation queue](https://support.zendesk.com/hc/en-us/articles/4408821995290-Workflow-recipe-Managing-your-escalation-queue)（Latest Update 欄位通用模式）
