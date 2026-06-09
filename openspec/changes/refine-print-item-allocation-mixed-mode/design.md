## Context

印刷業 ERP「印務主管」角色在訂單等待中、印件審稿通過後，於印件總覽（或印件詳情頁）點「分配印件」要將印件推進到生產階段。

**現況**：

- 線上單（B2C）審稿合格時，系統依 BOM 自動建立工單草稿並完整展開生產任務（[work-order spec § 工單草稿建立](../../specs/work-order/spec.md) L22-47、`useErpStore.ts` L1617-1694）
- 線下單（B2B）審稿合格時，系統自動建立 1 張空草稿（無生產任務），由印務主管後續手動新增
- [work-order spec § 印務主管印件總覽](../../specs/work-order/spec.md) L428 寫「一次完成工單草稿建立（可多份）與印務指派」，但實際 B2C / B2B 草稿狀態不同，spec 描述未對齊
- Prototype `AssignPrintItemDialog` 開啟時不讀既有草稿，預設「新增 1 列」；`onConfirm` 是 optional，兩個呼叫點都沒傳

**約束**：

- 不修改審稿合格自動建草稿的邏輯（`useErpStore.ts` L1617-1694），該段邏輯已正確，僅 UI 沒讀取
- 對齊 [work-order spec § 工單分配](../../specs/work-order/spec.md) L58「所有草稿工單均 MUST 完成分派」
- 對齊 wiki [印務主管](../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md) § 分配工單
- Prototype 技術棧：React + TypeScript + Tailwind + shadcn/ui；本地 `npm run dev` 開發伺服器與 Playwright 端對端測試（e2e）自驗，`git push` 後 Lovable 雲端建置同步部署

**利害關係人**：

- 印務主管（主要使用者）：要在最少操作下完成印件指派
- 印務（被指派者）：要清楚知道自己被分到哪些工單
- PM Miles：避免使用者反饋「不知道該指派還是該新增」、避免重複工單

## Goals / Non-Goals

**Goals:**

- spec 釐清「分配印件」雙路徑語意（指派既有草稿 + 追加新建）
- Prototype 補完 `AssignPrintItemDialog` 混合模式 UI 與 `onConfirm` 寫入
- 防止重複建立工單（解答 [Notion OQ PI-012「防掉單對帳機制」](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)）
- 兌現 [Notion OQ WO-005「一印件拆多工單分工」](https://www.notion.so/32c3886511fa808e9754ea1f18248d92) 已決議的「多工單分工 UX」
- Dialog 開啟時帶入「指派進度感」（senior-pm 建議的 Job framing）

**Non-Goals:**

- 不修改審稿合格自動建草稿的邏輯（`useErpStore.ts` L1617-1694）
- 不處理退回審稿後既有草稿命運（OQ-NEW-1，列入 Out of Scope）
- 不引入新狀態機、新角色或新欄位
- 不處理「印件多組件多工單」的視覺脈絡說明（design 細節，可後續強化）
- 不修改工單異動流程或印務間轉交流程

## Decisions

### Decision 1：既有草稿的類型 / 地區為唯讀

**選擇**：Dialog 上半區塊既有草稿的類型 / 地區欄位為唯讀，僅可改印務指派人。

**為什麼**：

- 自動建立時依印件內容（B2C BOM、B2B 印件 type）帶入；類型 / 地區異動會牽動生產任務結構（如 B2C 改 region 會觸發 BOM 重展）
- 「分配印件」Dialog 的職責是「指派狀態收斂」，類型 / 地區異動屬另一個動作（工單編輯）
- [work-order spec § 工單草稿建立](../../specs/work-order/spec.md) L46 雖允許印務主管選擇類型，但限於「手動建立工單草稿」階段，分配階段非建立階段

**替代方案**：允許改類型 / 地區 — 拒絕，因會破壞「分配 vs 異動」職責分界，且需設計 BOM 重展 / 生產任務同步邏輯，超出本 change 範圍。

### Decision 2：B2C 線上單不允許追加新工單

**選擇**：Dialog 下半區塊（追加區）僅 B2B 線下單顯示，B2C 完全隱藏。

**為什麼**：

- B2C BOM 已自動完整展開生產任務，追加會破壞 BOM 一致性（追加項是空草稿，與 B2C 的 BOM 完整展開原則衝突）
- B2C 商品主檔已預先決定產線分配（`material_spec` / `process` / `binding` 各自有 `production_line_id`），region 拆分在 PT 層完成，不需要拆工單
- 若 B2C 印件確實需要拆給多印務（極少見場景），應走「異動流程」或 [印務間轉交（add-production-task-transfer）](../add-production-task-transfer/proposal.md)，不在分配階段處理

**替代方案**：B2C 也允許追加 — 拒絕，會破壞 BOM 一致性，且 senior-pm 在 review 中提出此疑慮的 region 拆分情境，已透過 PT 層 `production_line_id` 機制涵蓋。

### Decision 3：提交校驗——所有既有草稿必須完成印務指派

**選擇**：上半區塊任一既有草稿留空印務指派人時，系統阻擋提交並反白標示未完成的列。

**為什麼**：

- 對齊 [work-order spec § 工單分配](../../specs/work-order/spec.md) L58「所有草稿工單均 MUST 完成分派」
- 印務主管 Job 的核心是「把印件推到所有工單都已指派」，留空違反 Job 框架
- 解答 PI-012「防掉單對帳機制」：若允許留空，會回到目前的「掉單感知缺口」

**替代方案**：允許留空 — 拒絕，違反 spec L58 與 PI-012 解答方向。

### Decision 4：Dialog UI 結構 — 上下半區塊垂直排列

**選擇**：Dialog 內容由上而下分為「既有草稿區（上半）」與「追加新工單區（下半，僅 B2B）」兩個區塊，垂直排列。

**為什麼**：

- 視覺上明確區分「指派既有」vs「追加新建」兩個動作；上下排列暗示「先處理既有，再考慮追加」的優先順序
- B2C 印件下半區塊隱藏，Dialog 簡化為單區塊（無視覺干擾）
- 與 senior-pm 建議的「狀態收斂頁」概念對齊

**替代方案**：

- Tab 切換（指派 Tab / 追加 Tab）— 拒絕，會弱化「同時可做兩件事」的混合模式語意
- 全部 row 平鋪（既有與追加混合在一個列表）— 拒絕，使用者難以區分哪些可改類型 / 地區、哪些不行

### Decision 5：Dialog 標題帶指派進度感

**選擇**：Dialog 標題或上半區塊頂部顯示「此印件 N/M 工單已指派印務」徽章（M = 既有草稿總數，N = 已填印務的草稿數）。

**為什麼**：

- 強化「狀態收斂」的視覺語意，讓印務主管一眼看出還缺多少
- 對應 senior-pm 建議的「印務主管 Job framing」（把印件推到所有工單都已指派狀態）
- 提交校驗失敗時，徽章可作為「為何提交失敗」的視覺解釋

**替代方案**：不顯示進度徽章 — 拒絕，缺乏 Job framing 對應的視覺提示。

### Decision 6：追加項預設值

**選擇**：「追加新工單」按鈕點擊時，預設帶入：類型 = 印件 type（'打樣印件' → '打樣'，否則 '大貨'）、地區 = '台灣'、印務指派人 = 空（必填）。同時，追加項建立時系統自動帶入 `wo_target_qty` = 印件 `ordered_qty`、`unit` = 印件 `unit`、`quantity_per_print_item` = 1（已寫入 spec delta Scenario「追加項建立後欄位完整性」）。

**為什麼**：

- 預設值對齊 `useErpStore.ts` L566-567 的自動建立邏輯（保持一致性）
- 印務指派人空：避免預設帶第一位印務造成「沒注意就誤指派」
- `wo_target_qty` 等欄位自動帶入：確保追加項符合 [work-order spec § 工單內容填寫](../../specs/work-order/spec.md) L69 送審前置條件，印務只需新增至少 1 個影響成品生產任務即可送審

**替代方案**：完全空白 — 拒絕，類型 / 地區是高頻欄位，預設值降低操作成本；`wo_target_qty` 不帶 — 拒絕，會導致追加項無法送審形成設計死路。

### Decision 8：既有草稿來源標籤

**選擇**：Dialog 上半區塊每張既有草稿 SHALL 顯示「來源標籤」（自動建立 / 手動建立）與「生產任務數量」摘要（如「3 個生產任務」）。

**為什麼**：

- 印務主管可能已透過 [工單草稿建立 Scenario：線下單印務主管手動建立](../../specs/work-order/spec.md) L37-43 先在工單列表手動建過 1 張帶部分生產任務的草稿，再進「分配印件」Dialog
- 若不顯示生產任務數量與來源，主管會誤以為這是空草稿，重複再建追加項
- 「自動建立」標籤 = 來自審稿合格自動建草稿邏輯；「手動建立」標籤 = 印務主管已先在工單列表頁手動建立

**替代方案**：

- 不顯示來源 / 生產任務數量 — 拒絕，會破壞「主管手動先建草稿」的既有流程
- 升格為狀態欄位 — 拒絕，超出本 change 範圍（屬資料模型異動）

### Decision 7：onConfirm signature 與寫入邏輯

**選擇**：`AssignPrintItemDialog` 改為必填 `onConfirm`，回傳資料結構為：

```ts
type AssignmentResult = {
  // 既有草稿的指派變更（key = 既有 workOrderId, value = 印務指派人 name）
  existingAssignments: Record<string, string>;
  // 追加新工單（線下單）
  newWorkOrders: Array<{ type: string; region: string; officer: string }>;
};
```

呼叫點（`PrintItemDetail` / `PrintItemDashboard`）的 `onConfirm` handler 負責：

1. 對 `existingAssignments` 中每筆，呼叫 `useErpStore` 的 `updateWorkOrder(id, { assignedTo })`（若 store 沒有此 action 則新增）
2. 對 `newWorkOrders` 中每筆，呼叫 `addWorkOrder` 建立空草稿（status='草稿'，無 tasks）
3. 寫入 order 的 `workOrders` summary 與 `workOrderCount`（對齊自動建草稿時的同步邏輯）

**為什麼**：

- 結構化的 `AssignmentResult` 讓呼叫點清楚知道「指派 vs 追加」兩個動作的資料形狀
- 將寫入邏輯放在呼叫點而非 Dialog 內部，符合 React 元件職責分離（Dialog 只管 UI，store 寫入由 page 處理）

**替代方案**：

- Dialog 直接呼叫 store — 拒絕，違反元件可重用原則（Dialog 應與 store 解耦）
- 兩個 callback（`onAssignExisting` + `onAddNew`） — 拒絕，使用者只按一次「確認」，不應拆成兩個 callback

### Decision 9：對齊 spec 修正 `buildAutoCreatedWorkOrder`（UAT 後追加範圍）

**選擇**：擴大本 change 範圍，修正 `useErpStore.ts` 的 `buildAutoCreatedWorkOrder` 函數，使自動建立工單時 `status='草稿'`、`assignedTo=''`、`supervisor=''`。

**背景**：UAT 發現 Dialog 撈不到「審稿合格時自動建立的草稿」。深入追查發現 prototype 既有實作（2026-04-21 data-consistency-audit hack）將自動建工單直接推進到 `status='製程確認中'` 並預設指派 `PRODUCTION_STAFF[0]`，違反 [work-order spec § 工單草稿建立 L47](../../specs/work-order/spec.md) 規定「工單狀態為『草稿』」。

**為什麼**：

- 本 change Dialog 設計依 spec 過濾 `status === '草稿'`，必須對齊
- 既有 hack 的理由（避免 `tryReportWork` 守門失效）在邏輯上不成立：草稿階段 + `assignedTo=''` 本來就不該允許報工，`tryReportWork` 的 deny 是正確守門行為，不是 bug
- 不修這個既有與 spec 不一致，本 change 的「分配既有草稿」情境永遠無法觸發

**影響範圍評估**：

- `derivePrintItemStatusFromWOs`（`src/utils/printItemStatus.ts`）：草稿 / 製程確認中 都 fall through 到「等待中」，印件層狀態派生不受影響
- `tryReportWork`：`assignedTo===''` 時 deny 報工，這是正確守門行為（草稿階段不該報工）
- `PrintItemDashboard` 優先顯示：`!wo.assignedTo` 置頂顯示，完美對齊本 change 設計目標
- `WorkOrderDetail.tsx` L495：草稿狀態可編輯排程，對齊 [work-order spec § 工單內容填寫 L66](../../specs/work-order/spec.md)
- UAT 路徑變化：原本「自動建工單後直接走報工流程」的測試路徑，現在需先透過 Dialog 完成指派——這是正確的業務流程，原 hack 是繞過

**替代方案**：

- 選項 B（折衷）：只改 status='草稿'，保留 `assignedTo=PRODUCTION_STAFF[0]` — 拒絕，違反「草稿待指派」設計意圖
- 選項 C（繞過）：Dialog filter 改為 `status='草稿' || '製程確認中'` — 拒絕，違反工單狀態機語意，會讓未來開發者困惑

## Risks / Trade-offs

- **[Risk 1] 既有草稿類型 / 地區唯讀，若印務主管真有需求改（例：自動建立時 BOM 帶錯）** → Mitigation：spec 中明確指引此情境走「工單編輯」流程；本 change 列為已知限制；若日後成為高頻需求，可開新 change 處理。
- **[Risk 2] B2C 不允許追加，可能限制極少數情境（多印務協作）** → Mitigation：spec 中標記，建議走「異動流程」或「印務間轉交（add-production-task-transfer）」；本 change 不破壞既有彈性。
- **[Risk 3] 退回審稿後既有草稿命運未解（OQ-NEW-1）** → Mitigation：proposal 列入 Out of Scope，建立 Notion OQ 追蹤；本 change Dialog 採取「Dialog 僅在印件等待中且至少 1 張草稿時可開啟，其他狀態下『分配印件』按鈕 disabled」（已寫入 spec delta），不主動處理非等待中狀態的編輯邏輯，待 OQ-NEW-1 解後再強化。
- **[Risk 4] 進度徽章可能與既有印件總覽的「3/5 工單已審核完成」進度顯示混淆** → Mitigation：Dialog 內徽章文案明確為「N/M 工單已指派印務」，與印件總覽的「審核完成」概念區分。

## Migration Plan

**無資料遷移**：本 change 僅修改 Dialog 行為與 spec 文字，不涉及 schema 變更。

**部署步驟**：

1. spec 修改（OpenSpec change 內 specs delta）
2. Prototype 修改（`AssignPrintItemDialog` 改混合模式 + 兩個呼叫點補 `onConfirm`）
3. 驗證：開啟 Lovable 部署版，分別測試 B2C 印件與 B2B 印件的分配 Dialog
4. 歸檔 change，spec 變更同步至 main spec

**回滾策略**：

- Prototype 變更：透過 git revert 回滾單一 commit
- spec 變更：archive 後若發現問題，可開新 change 反向修改

## Open Questions

### 待 Miles 決定（建議建立 Notion OQ 追蹤）

- **OQ-NEW-1：退回審稿後既有草稿命運**（保留 / 重建 / 棄用）— 本 change 透過「Dialog 僅在等待中可開啟」迴避此情境，但未根本解決；待此 OQ 決議後可開新 change 強化
- **OQ-NEW-2：審稿合格 → 印務接手的主動觸發機制**（CEO 視角）— 目前系統靜悄悄建草稿，靠印務主管自己刷頁面看到。本 change 僅修補 Dialog 視覺收斂與印件總覽優先顯示（被動），但缺主動觸發（通知 / 看板紅點 / Dashboard 數字）。這才是 PI-012「防掉單」的長期解，建議另開 change 處理觸發機制
- **OQ-NEW-3：印件分配完成狀態欄位**（ERP 顧問視角）— 「印務主管完成全部指派」目前僅為 Dialog 內 UI 概念（進度徽章），未升格為狀態欄位 / 狀態機節點。若未來需跨頁面一致辨識（印件總覽篩選、報表、通知），建議升格為狀態欄位（如 `PrintItem.officer_allocation_status`），但屬資料模型異動，需另開 change

### 已在 design 內決，無需 Miles

- **進度徽章視覺呈現細節**（位置、文案、icon）— Decision 5 規範方向，實作時對齊現有 `Badge` 元件樣式
- **Dialog 上半既有草稿來源標籤與生產任務數量顯示** — Decision 8 已決，必顯示

### 待實作後 UAT 決定

- **CEO 視角的範疇挑戰**：「線下單追加新工單」是否真的會在「分配印件」當下發生？或印務主管會分兩次處理（先指派、隔幾天再追加）？建議實作後觀察使用率，若追加區塊極少使用，可在後續 change 拆出獨立入口（如「為此印件新增工單」）
