## Context

需求單流程現行（v2.0）的業務主管 gate 位於「已評估成本 → 議價中」之間。Miles 在實際試用 / 設計討論中發現，此時點業務主管並無新資訊可判斷（成本評估完成但條款尚未敲定），核可動作淪為形式。真正需要業務主管介入的時點是議價已成交、業務正要把報價單外發給客人簽回之前。

此 change 翻轉 gate 位置，使業務主管在「成交 → 已核准成交」之間執行單一道審核。設計參照 `add-consultation-request-and-revise-approval-gate` change 的 design.md D3，已先定義此翻轉方向，本 change 是該方向在 spec / prototype 層級的正式落地。

## Goals / Non-Goals

**Goals:**

- 業務主管 gate 對齊真實工作節奏：成交後一次審核，不在議價前重複蓋章
- 流程定義清楚的「已核准成交」終態，作為「轉訂單」的明確前提
- 維持既有 `approval_required` / `approved_by_sales_manager_id` / `payment_terms_note` 欄位的語意延續性（綁定的 gate 變更，但欄位設計不需大改）
- 與諮詢流程 change 的「諮詢來源需求單流失」路徑對齊（流失發生在 v3 任何狀態都會觸發建諮詢訂單收尾，與本翻轉無衝突）

**Non-Goals:**

- 不重新設計 v2.0 的「Slack thread 溝通」「業務主管首次查看記錄」「重新評估後一鍵確認」等附帶機制（保留所有 mechanism，僅 gate 位置翻轉）
- 不引入「多級主管核可」「條件化核可規則 v2」（仍在 Phase 2 範疇）
- 不調整 v2.0 的「approval_required = true 全強制」原則
- 不改變印務主管角色（成本評估流程不變）

## Decisions

### D1：QuoteStatus enum 擴充而非修改既有狀態

**選擇**：在現有 `'需求確認中' / '待評估成本' / '已評估成本' / '議價中' / '成交' / '流失'` enum 上新增 `'待業務主管成交審核' / '已核准成交'` 兩個狀態，總共 8 個 status。

**為什麼**：
- 「成交」維持為「業務認定客戶接受報價」的時點（業務動作觸發），這個語意維持不變
- 「待業務主管成交審核」為新增的中間態，標示「業務已認成交、等業務主管把關」
- 「已核准成交」為新增的終態，標示「業務主管已審核、可發報價單轉訂單」
- 這個設計保留「成交」這個業務語意點，業務主管審核是在其上加的把關層
- 替代方案（直接改「成交」語意為「成交待審核」）：否決，因為「成交」這個詞在業務口中有明確意義，改語意會混淆

### D2：「轉訂單」前提從「成交」改為「已核准成交」

**選擇**：`convertQuoteToOrder` 動作的前提條件從 `status = '成交'` 改為 `status = '已核准成交'`。

**為什麼**：
- 業務主管未審核前不應外發報價單給客戶簽回，所以「轉訂單」必須等審核通過
- 既有 `convertQuoteToOrder` action 邏輯不需大改，只改前提條件
- UI 上「轉訂單」按鈕只在「已核准成交」狀態顯示

### D3：業務主管 action 改名（approveQuoteByManager → approveDealByManager）

**選擇**：v2 的 `approveQuoteByManager`（核可進議價）改名為 `approveDealByManager`（核准成交），語意精準對齊新位置。

**為什麼**：
- 名稱「approveQuote」過於泛用，無法傳達「在哪個時點核可什麼」
- 「approveDeal」明確指向「核准成交（讓單據可轉訂單）」
- 替代方案（保留舊名）：否決，名稱與新行為不符會誤導未來閱讀者

### D4：欄位語意保留、不改名

**選擇**：`approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` / `lastApprovedPaymentTermsNote` 欄位保留原名，僅綁定的 gate 從議價前改為成交後。

**為什麼**：
- 欄位本身的語意（「指派的審核業務主管」「是否需審核」「收款備註」「上次核可時的備註快照」）在新 gate 下仍合理
- 改名涉及 mock data、prototype UI、ActivityLog 歷史等多處連動，改動成本高且收益低
- 註解 / spec 描述需更新，但程式邏輯改動小

### D5：「重新評估後一鍵確認」機制延續

**選擇**：v2 的 `lastApprovedPaymentTermsNote` 機制（重新評估報價時若 payment_terms_note 與上次核可時相同，提供業務主管「一鍵確認（條件未變）」捷徑）延續至 v3，但綁定點從「議價前核可」變成「成交後審核」。

**為什麼**：
- 此機制是 v2.0 的優秀設計，反映業務主管避免重複審查相同條件的需求
- 在 v3 下「重新評估」流程：議價中 → US-QR-006 重新評估 → 待評估成本 → 已評估成本 → 議價中 → 成交 → 待業務主管成交審核（此時若 payment_terms_note 未變，提供一鍵確認）
- 程式邏輯與 v2 相同，僅觸發時點變更

### D6：諮詢來源需求單流失維持既有處理

**選擇**：`add-consultation-request-and-revise-approval-gate` change 已定義「諮詢來源需求單流失自動建諮詢訂單收尾」流程，本 change MUST NOT 改變此邏輯。

**為什麼**：
- 流失可發生在 v3 任何非終態（需求確認中 / 待評估成本 / 已評估成本 / 議價中 / 待業務主管成交審核），都不影響「諮詢費收尾」邏輯
- 本 change 聚焦於成交後 gate 翻轉，不擴大範疇

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 業務主管 SLA 變報價單外發瓶頸（v2 議價前 gate 不卡客戶體驗，v3 卡在客戶議價熱度最高的時點） | 業務主管核准 SLA 設 24 小時、Slack 通知、prototype 階段量測審核耗時，視結果再評估自動 fallback |
| 既有 mock 資料 `status = '成交'` / `'流失'` 在 v3 下需重新映射 | 提供 migration script 將既有 `'成交'` 映射為 `'已核准成交'`（作為「假設這些是經審核過的成交」的歷史資料假設），不需手動逐筆改 |
| `lastApprovedPaymentTermsNote` 語意翻轉（從議價前快照變成成交後快照），既有 mock 中已寫入此欄位的資料變舊資料 | 既有資料保留，新 actions 寫入新快照；spec 中明確標示語意更新時點 |
| 業務角色 UX 翻轉：v2 業務在「已評估成本」看到「等待業務主管核可」、v3 改為在「成交」看到「等待業務主管審核」 | UI 文字更新，業務的工作流邏輯保持「等業務主管」這個共通模式 |

## Migration Plan

1. **Phase 1：spec 層**（本 change）
   - 完成 proposal / design / 3 份 delta specs / tasks
   - openspec validate --strict 通過
   - 不動 prototype（保持 v2 運作）

2. **Phase 2：prototype 資料層**
   - QuoteStatus enum 擴充
   - 既有 mock 資料 `'成交'` 映射為 `'已核准成交'`（作為「歷史已審核」假設）
   - 既有 mock 中無「待業務主管成交審核」狀態的資料，保留以驗證新流程的入口

3. **Phase 3：prototype actions 與 UI**
   - store: 新增 `approveDealByManager`、移除 `approveQuoteByManager`、改 `convertQuoteToOrder` 前提
   - SalesManagerApprovals.tsx：篩選改為「待業務主管成交審核」
   - QuoteDetail.tsx：「核可進議價」按鈕移除、「核准成交」按鈕新增
   - StatusStepper：步驟條增加兩步

4. **Phase 4：歸檔與 sync**
   - 兩個翻轉 v2 的 change（本 change + add-consultation-request-and-revise-approval-gate）統一歸檔
   - main spec 更新

**回滾策略**：本 change 為 prototype 階段，無正式部署；若決策反悔，回滾 = 還原 prototype commits + 刪除 change directory。
