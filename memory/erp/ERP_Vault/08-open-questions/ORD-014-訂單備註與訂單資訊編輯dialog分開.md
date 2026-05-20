---
type: open-question
module:
  - order-management
oq-id: ORD-014
status: answered
priority: medium
audience: internal
raised-at: 2026-05-20
raised-by: apply 階段 implementation feedback
source-link: openspec/changes/add-order-note-section-with-template-tool/design.md
related-vault:
  - [[../05-entities/訂單]]
related-oq:
  - ORD-006
  - ORD-007
related-change: add-order-note-section-with-template-tool
expected-resolution-at: 2026-05-20
answered-at: 2026-05-20
answered-by: Miles + Claude apply-stage feedback
---

# ORD-014：訂單備註編輯 dialog 為何不沿用 OrderInfoEditDialog（apply 階段 deviation 記錄）

## 背景

OpenSpec change `add-order-note-section-with-template-tool` 在 propose 階段的設計（design.md 原始版）為：

> 沿用既有 `OrderInfoEditDialog`，在 dialog 內新增三個 textarea（訂單備註 / 交貨備註 / 付款備註）的編輯區。

apply 階段發現衝突：

- `OrderInfoEditDialog` 既有進入時機受 `isBeforeProduction` 約束（PRE_PRODUCTION_STATUSES：草稿 / 待業務主管審核 / 報價待回簽 / 已回簽 / 等待付款 / 已付款 / 稿件未上傳 / 等待審稿 / 待補件），即訂單進入「製作等待中」之後 dialog 不再可開啟（line OrderDetail.tsx:166-172）
- 但 design.md 決策 3 對訂單備註的編輯時機規則是「訂單成立後到訂單完成前」（含製作中、製作完成、已出貨等）— 兩者範圍不一致

## 問題

如何解決編輯時機規則衝突？

候選做法：

1. **沿用 OrderInfoEditDialog（原 proposal）**：被否決 — 放寬 dialog 進入時機會影響其他欄位（案名 / 業務負責人 / 折扣碼 / staffNotes / productionNote），副作用大
2. **OrderDetail inline 編輯（apply 階段初版）**：被否決 — Miles round 2 feedback「行為要同其他 Section」，inline 編輯與其他 section（訂單資訊 / 出貨資訊 / 發票設定）「點編輯開 dialog」pattern 不一致
3. **OrderInfoEditDialog 內部加「進階備註」分頁，Tab 切換**：被否決 — Tab 切換增加認知負擔，且 lock 規則仍需在 dialog 內部分欄位判斷
4. **新建獨立 `OrderNotesEditDialog`（最終採用）**：對齊其他 section pattern + 編輯時機獨立判斷不影響其他欄位

## 決定

**採做法 4**：新建 `src/components/order/OrderNotesEditDialog.tsx`，獨立於 `OrderInfoEditDialog`。

- OrderDetail 訂單備註 section header 右上掛「編輯」按鈕（同其他 section pattern）
- 編輯時機由父元件 OrderDetail 判斷（`isOrderCompleted` + 角色權限），按鈕 disabled 條件直接控制
- Dialog 接到時即視為已授權（不重複判斷）
- 儲存路徑：dialog.onConfirm → updateOrder + 加 ActivityLog「編輯訂單備註」+ Toast

## 影響範圍

- 程式碼：
  - 新增 `src/components/order/OrderNotesEditDialog.tsx`
  - OrderDetail.tsx 新增 state `orderNotesEditOpen` + section 改 read-only + dialog 渲染
  - **不修改** `OrderInfoEditDialog.tsx`
- spec：
  - `order-management/spec.md` § Requirement「訂單詳情頁訂單備註 section」明文「點 section 編輯按鈕開啟 OrderNotesEditDialog」
  - 不影響「訂單備註三類分欄」既有 Requirement
- design.md：新增「決策 8：編輯入口採獨立 OrderNotesEditDialog」段落

## 副作用 / 限制

- 兩個 dialog 對「訂單資訊」與「訂單備註」分開管理，使用者切換成本：低（操作分屬不同 section、視覺已分隔）
- 未來若有「訂單階段全欄位整批編輯」需求，需在 OrderDetail 提供獨立入口（不放在現有 section 內）
- OrderInfoEditDialog 內仍含 staffNotes / productionNote 欄位編輯（既有「訂單備註三類分欄」），與 OrderNotesEditDialog 編輯的 3 個新欄位**不重疊**（兩組欄位 by design 並存）

## 來源

- propose 階段 design.md（原始版「沿用 OrderInfoEditDialog」決策）
- apply 第二段 implementation feedback：發現 `isBeforeProduction` lock 規則衝突 → Claude 主動 pause + 提示 deviation
- Miles round 2 feedback（2026-05-20）：要求「行為要同其他 Section」，即「點編輯開 dialog」pattern
- 最終決定：新建 `OrderNotesEditDialog`，spec / design 同步更新
