# 技術設計：線下單審稿人員分派機制變更

## Context

現行 Prototype 的審稿分派實作於 `sens-erp-prototype/src/utils/prepressReview.ts`：`autoAssignReviewer`（上傳觸發自動分配）與 `overrideAssignment`（審稿主管覆寫、能力不足事後拒絕 throw error）。印件審稿維度為 7 狀態（`src/types/order.ts`）。本 change 引入：分派執行者雙型、審稿維度第 8 狀態「待分派」、改派模型（取代覆寫）、Slack 討論串（mock webhook）、訂單管理人角色視角。

商業邏輯正本已先行更新於 wiki（BRD 先行），本設計只處理實作規格層。

## Goals / Non-Goals

**Goals**

- 印件審稿維度 enum 新增「待分派」為初始態，判準＝無負責審稿人員；既有 7 狀態語意調整（「稿件未上傳」＝已分派等稿）
- 線下單分派 UI（訂單詳情印件清單勾選、分派 Dialog 候選全列＋參考標示、批次分派）
- 改派取代覆寫：`overrideAssignment` 的能力過濾（throw error）移除，改為候選全列＋參考標示；執行角色擴為訂單管理人＋審稿主管
- Slack 討論串按鈕與 mock webhook（記錄送出 payload 與模擬討論串連結，不真實呼叫）
- 線上單自動分派邏輯保留不動（僅觸發範圍限縮至線上單）

**Non-Goals**

- 真實 Slack webhook 串接（待 AR-15 / AR-16 裁決後另案）
- 待分派停滯提醒（待 AR-17 裁決）
- 待審清單排序與急單標示（AR-5 範圍，另案）
- 審稿主管工作台的指標重設計（自動分配命中率隨覆寫概念廢除，新指標另案）

## Decisions

1. **「待分派」以派生為主、欄位為輔**：`reviewDimensionStatus` 維持 denormalized 快取欄位（與既有 7 狀態同模式），新增待分派值；判準邏輯（無負責審稿人員）封裝於狀態同步 action，避免 UI 各處自行判斷。理由：與既有「印件審稿狀態與 Round 同步」Requirement 的快取模式一致，不另創派生機制。
2. **分派與改派共用同一 Dialog 元件**：候選全列＋參考標示＋原因欄（首次分派原因選填、改派必填）。理由：兩者規則一致（不過濾、留紀錄），減少重複元件。
3. **mock webhook 以資料層記錄取代真實呼叫**：`openReviewDiscussion` action 產生模擬討論串連結存於訂單、payload 記入 console 與 ActivityLog。理由：Prototype 驗證流程與資訊架構，真實整合屬另案（Non-Goals）。
4. **訂單來源判斷沿用既有 `orderSource`**（線下 / 線上）分流分派觸發：上傳稿件 action 內判斷——線上單呼叫 `autoAssignReviewer`、線下單檢查有無負責審稿人員決定是否停留待分派並通知。理由：分派流程單一條、執行者分型，避免兩套流程程式碼分岔。
5. **角色權限**：Prototype 以現有角色切換機制新增「訂單管理人」角色；分派與改派操作對訂單管理人與審稿主管開放。

## Risks / Trade-offs

- **既有 mock 資料遷移**：既有印件 mock 資料無「負責審稿人員為空」的線下單樣態，需補待分派情境的種子資料（含「稿件已上傳但未分派」邊界）。
- **狀態機語意變更的回歸影響**：「稿件未上傳」語意改變（已分派等稿），既有以該狀態判斷「尚未開始」的 UI 邏輯需逐一檢查（e2e smoke 需涵蓋線上單全流程回歸）。
- **雙角色身兼的操作混淆**：現階段訂單管理人與審稿主管實務同一人，Prototype 角色切換需可分別驗證兩角色權限，避免權限設計被身兼現實掩蓋。

## Migration Plan

Prototype 為 mock 資料，無真實資料遷移。實作順序：型別與狀態同步 → 分派/改派 action 與 Dialog → 訂單詳情整合（勾選、開啟討論）→ 種子資料 → e2e。回滾＝git revert（單一 main 分支，依 Lovable 限制不開 feature branch）。

## Open Questions

- [AR-15 審稿討論 webhook 建立失敗補救](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-15-審稿討論webhook建立失敗補救.md)
- [AR-16 Slack 帳號對應維護](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-16-Slack帳號對應維護.md)
- [AR-17 待分派停滯提醒機制](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-17-待分派停滯提醒機制.md)

（三者均不阻擋本 change 實作，Prototype 以 mock 與 Non-Goals 邊界隔離。）
