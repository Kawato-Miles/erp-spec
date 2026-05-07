## Context

業務主管 gate 的位置經歷三輪迭代：

- **v2.0**（`add-sales-manager-quote-approval`，2026-04-27 歸檔，已落地）：gate 在需求單階段「已評估成本 → 議價中」之間
- **v3.0 探索方向**（`revise-quote-request-approval-gate-to-post-deal`，從未歸檔，已刪除）：gate 仍在需求單階段，但移到「成交後 → 轉訂單前」
- **本 change（落地方向）**：gate 完全離開需求單，移到訂單階段「訂單建立後 → 報價待回簽前」

驅動本次調整的 insight：跟客人談成交、出報價單給客人，這個動作的決策時點本來就在訂單階段（業務跟客戶談妥後才產生訂單），把主管的把關也放在訂單階段才對齊「印章一蓋就外發」的真實節奏。需求單階段業務應該完全自主推進到成交，不需要主管中途蓋章。

## Goals / Non-Goals

**Goals:**
- 需求單流程業務完全自主，無業務主管 gate
- 訂單建立後、報價單外發前，業務主管於訂單詳情頁審核成交條件（收款備註、報價金額、交期）
- 業務主管的審核欄位（指派、收款備註、上次核准備註快照）放在訂單實體上，與「在訂單上審核」的流程位置一致
- 業務主管專屬待辦清單頁顯示「我被指派審核的訂單」（不再是需求單）

**Non-Goals:**
- 不改變業務主管以外的角色職責（業務、印務主管、Supervisor 不變）
- 不調整訂單其他流程段（共用段、出貨、製作）
- 不處理諮詢單流程（由獨立 change `add-consultation-request-and-revise-approval-gate` 處理）
- 不改變 Phase 1 的 `approval_required` 預設規則（仍預設 true）

## Decisions

### D1：gate 完整離開需求單，移到訂單階段

需求單階段的所有業務主管相關 Requirement、欄位、狀態整體移除，改放到訂單階段。

理由：
- 業務主管的把關決策時點本來就是「跟客人成交、要出報價單」，這是訂單建立後的事件，放在需求單上是位置錯誤
- v2.0 / v3.0 都把 gate 放在需求單上，造成需求單實體與訂單實體之間 gate 位置與審核欄位的反覆遷移
- 訂單實體本來就包含「報價待回簽」狀態（訂單已建立但業務還在跟客人最終確認），把「待業務主管審核」插在報價待回簽之前是線下路徑的自然延伸

替代方案：
- (A) gate 仍在需求單成交後（v3.0 方向）：否決，「業務主管核准 → 業務出報價單 → 客人簽回成立訂單」這條順序中，「業務出報價單」本身就是訂單建立的觸發點，gate 放在「訂單建立前」等於放錯時序
- (B) gate 在訂單建立後但放在「已回簽」之後：否決，已回簽代表客人已答應成交，再來主管審核已沒意義

### D2：業務主管指派欄位放在訂單上，需求單成交轉訂單時指派

業務於需求單成交轉訂單時為訂單指派審核業務主管（`approved_by_sales_manager_id`）。需求單階段不再有業務主管欄位。

理由：
- 業務主管的指派 = 「誰負責審核這個訂單成交條件」，應該在訂單建立時決定
- 業務在需求單成交時已知道要找哪位主管審核，自然帶入訂單

實作（Phase 1 簡化）：訂單建立時預設第一位業務主管，未來可加 UI dropdown 讓業務轉訂單時選擇。

### D3：`payment_terms_note` 留在需求單，成交轉訂單時帶入訂單

需求單的 `payment_terms_note` 欄位**保留**，作為業務跟客戶討論收款條件的紀錄。成交轉訂單時，此欄位的內容帶入訂單的 `payment_terms_note` 欄位，業務主管於訂單上審核時查看。

理由：
- 業務跟客戶談收款條件本來就在需求單議價階段發生，這個欄位的「寫入時機」屬於需求單
- 訂單上業務主管要看的「成交條件審核依據」也包含這個內容
- 兩端都需要此欄位，採「寫在需求單、帶入訂單」的雙寫策略

對 v2.0 既有資料的處理：v2.0 設計把 `payment_terms_note` 設為「業務主管核可前的決策依據」，鎖定時點為「進入議價中」；本 change 改為「業務於需求單任何狀態（成交 / 流失終態除外）皆可編輯」，沒有議價前的鎖定點。Phase 1 prototype 階段無正式運行資料，無需遷移。

### D4：訂單線下路徑加「待業務主管審核」狀態

訂單線下路徑由「報價待回簽 → 已回簽 → 共用段」變成「待業務主管審核 → 報價待回簽 → 已回簽 → 共用段」。

理由：
- 「待業務主管審核」是訂單建立後的初始狀態，主管核准後才推進至「報價待回簽」
- 業務主管核准動作為單向狀態轉換（無「退回」按鈕），業務主管不核准時透過 Slack thread 與業務溝通
- 訂單其他路徑（線上、諮詢）不適用業務主管 gate

`approval_required` 預設 true，Phase 1 範疇所有線下訂單皆需經業務主管核准。Phase 2 條件化升級（依規則動態計算）保留為未來路徑。

### D5：業務主管專屬待辦清單頁改為訂單列表

業務主管登入後的首頁「待辦清單頁」（`/sales-manager/approvals`）內容由「需求單核可」改為「訂單審核」：
- 篩選條件：`order.approved_by_sales_manager_id = self` 且 `status ∈ {待業務主管審核, 報價待回簽, 已回簽, 已取消}`
- 預設篩選 `status = 待業務主管審核`，按進入時間 ASC 排序（最久優先）
- 業務主管 sidebar：訂單管理 → 訂單列表 / 訂單審核 / 訂單異動審核（移除「需求單核可」）

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Spec 與 prototype 已分歧（prototype 已落地新方向）| 本 change 為 spec 與 prototype 對齊，歸檔後 main spec 與 prototype 一致 |
| v2.0 既有 prototype 程式碼有殘留業務主管欄位 / 邏輯 | prototype 已完整清理（commit `48224b5`），無殘留 |
| 業務主管視角的需求單可見範圍變動（從「我被指派的需求單」改為「全部需求單只讀」）| 業務主管 sidebar 明確區分「需求單管理（只讀）」與「訂單管理（含審核）」 |
| 跨 change 衝突：本 change 與 add-consultation 都動到 quote-request / state-machines / user-roles | 兩 change 修訂的 Requirement 不重疊（諮詢 change 加 entry point；本 change 移除 gate），可獨立歸檔 |

## Migration Plan

1. **Phase 1：spec 對齊（本 change）**
   - 完成 4 份 delta spec（quote-request / order-management / state-machines / user-roles）
   - 與 add-consultation change 並行（諮詢 change 不動業務主管 gate 相關內容）

2. **Phase 2：歸檔**
   - 確認 prototype 已落地（2026-05-07 commit `48224b5`）
   - 執行 `openspec archive` 將 delta sync 進 main spec
   - 推送至 Notion Feature Database

歸檔順序建議：本 change 可獨立歸檔，不依賴其他 change。
