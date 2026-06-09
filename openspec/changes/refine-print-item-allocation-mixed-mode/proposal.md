## Why

印務主管在訂單等待中、印件審稿通過後，於印件總覽（或印件詳情頁）點「分配印件」要將印件推進到生產階段。目前 spec 與 prototype 有三層問題：

**1. 跨 spec 描述不對齊（根因）**

[work-order spec § 印務主管印件總覽](../../specs/work-order/spec.md) L428 寫「一次完成工單草稿建立（可多份）與印務指派」，把 B2C（線上單）「草稿已自動建立、缺指派」與 B2B（線下單）「草稿尚未建立、需手動建」兩條本質不同的路徑混為一談；而 wiki [印件生產流程](../../memory/Sens_wiki/wiki/erp/04-business-logic/印件生產流程.md) § 審稿階段流程已明確分流 B2C / B2B。兩份 spec 對同一動作描述未對齊，導致下游實作搖擺。

**2. 印務主管的 Job 沒被正確框架**

印務主管真正的工作不是「分配印件」這個動作，而是「在等待中印件清單上，把每張印件推到『所有工單都已指派印務』的狀態」（對應 wiki [印務主管](../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md) § 分配工單）。Dialog 是這個 Job 的工具，spec 目前的描述讓 Dialog 看起來像「建立 + 指派的綜合表單」，而非「指派狀態收斂工具」。

**3. Prototype 實作落差，使用者已反饋**

- `AssignPrintItemDialog` 開啟時不讀既有草稿，預設一律「新增 1 列」，誤導使用者重複建立工單（解答 [Notion OQ PI-012「審稿合格 → 印務工單對帳機制（掉單感知缺口）」](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)）
- Dialog 的 `onConfirm` 是 optional，兩個呼叫點（`PrintItemDetail`、`PrintItemDashboard`）都沒傳，按確認只關閉視窗，沒任何寫入
- PM 已收到使用者反饋：「點分配印件時，因為系統會先預建立一筆工單草稿，但並未顯示目前預設的該筆工單，不確定要如何分配，或重複建立」

## What Changes

### Spec 層級（work-order capability）

- **MODIFIED Requirement: 印務主管印件總覽**：明確化「分配印件」操作為混合模式雙路徑：
  - 路徑 A — 指派既有草稿：對審稿合格時系統已自動建立的工單草稿（B2C/B2B 共通），印務主管僅可填印務指派人，類型 / 地區為唯讀（依印件內容自動帶入，不允許在分配階段異動）
  - 路徑 B — 追加新工單草稿（僅線下單）：印務主管可額外建立新空草稿（無生產任務），需自行設定類型 / 地區 / 印務指派人。線上單因 BOM 已自動完整展開生產任務，不允許追加（避免破壞 BOM 一致性）
  - 提交校驗：所有既有草稿 MUST 完成印務指派才能提交（對齊 [work-order spec § 工單分配](../../specs/work-order/spec.md) L58「所有草稿工單均 MUST 完成分派」）

### Prototype 層級（不在 spec capability 範圍，列入 Impact）

- `AssignPrintItemDialog` 改為混合模式 UI（上半既有草稿區 + 下半追加區）
- `PrintItemDetail` 與 `PrintItemDashboard` 兩個呼叫點補上 `onConfirm` 實作（既有草稿 update `assignedTo`、追加項 insert 新工單草稿）
- Dialog 文案修正：避免「將為此印件建立 N 張工單草稿」誤導

### Out of Scope（不在本 change 處理）

- **退回審稿後既有草稿的命運**：印件審稿通過 → 自動建草稿 → 後續因任何原因退回審稿 / 異動，既有草稿是否保留 / 重建 / 棄用？此情境跨多個 capability（prepress-review / work-order / business-processes），需另開 change 處理（新 OQ：`OQ-NEW-退回審稿後既有工單草稿命運`，建議建立於 Notion Follow-up DB）
- **印件多組件多工單的脈絡顯示**：「為什麼這張印件需要 N 張工單」的視覺說明屬 design 階段細節，本 change 只負責 spec 對齊與 Dialog 行為改造
- **印務主管狀態收斂進度感（如「此印件 2/3 工單已指派」徽章）**：senior-pm 建議的 UX 強化，可在本 change design.md 中保留為設計建議，但不列入 spec 必要 Requirement

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `work-order`：「印務主管印件總覽」Requirement 拆解「分配印件」為混合模式雙路徑（指派既有 + 追加新建），明確 B2C / B2B 分流，並強化提交校驗

## Impact

### 受影響 spec

- [work-order spec](../../specs/work-order/spec.md)：§ 印務主管印件總覽（L418-446）— 明確化分配印件 Dialog 的雙路徑語意

### 受影響 prototype

- `src/components/workorder/AssignPrintItemDialog.tsx`：改為混合模式 UI，補 `onConfirm` 必填
- `src/pages/PrintItemDetail.tsx` L783-793：呼叫點補 `onConfirm` handler
- `src/pages/PrintItemDashboard.tsx` L552-561：呼叫點補 `onConfirm` handler
- `src/store/useErpStore.ts` L1617-1694（自動建草稿邏輯）：**僅參考，不變動**

### 不影響

- 其他模組 spec（quote-request / order-management / production-task / state-machines）
- 審稿合格時自動建草稿的邏輯本身（store.ts 邏輯正確，僅 UI 沒讀取）
- 工單分配 Requirement（spec L49-58，本 change 與該 Requirement 對齊但不修改）

### 對齊既有 OQ

- **解答 [PI-012「審稿合格 → 印務工單對帳機制（掉單感知缺口）」](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)**：本 change 兌現 Dialog 視覺收斂，避免 B2B 空草稿被忽略
- **兌現 [WO-005「一印件拆多工單分工角色」](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)**：本 change 是該 OQ 已決議「交 UX」的 UI 兌現時機

### 成功指標（量測本 change 是否解決問題）

- **目標指標**（上線後量測）：印件總覽上「等待中且工單數 > 0 但有任一工單未指派印務」的印件平均停留時間下降（Phase 2 — 訂單流程完整完成率 ≥ 60% 對齊）
- **防禦指標**（上線後量測）：每張印件的工單草稿總數，混合模式生效後應接近 BOM 展開後的理論值 + 線下單必要追加數（追蹤是否還有重複工單建立）
- **Prototype 階段驗證方式**（歸檔前）：
  - UAT 反饋：印務主管不再回報「不知道該指派還是該新增」
  - Lovable mock data 比對：對 B2C 印件分配，工單草稿總數 = 1（不應因 Dialog 操作增加）；對 B2B 印件分配，工單草稿總數 = 1 + 追加項數量（明確可預期）
- **失敗條件**：上線後仍有印務主管反饋「不知道該指派還是該新增」、或重複工單比例未下降

### 衍生 OQ（建議建立 Notion OQ 追蹤）

- **OQ-NEW-退回審稿後既有工單草稿命運**：印件審稿通過 → 自動建草稿 → 後續退回審稿 / 異動，既有草稿是否保留 / 重建 / 棄用？跨 prepress-review / work-order / business-processes 三個 capability，需另開 change
- **OQ-NEW-審稿合格到印務接手的主動觸發機制**（CEO 視角）：目前系統靜悄悄建草稿，靠印務主管自己刷頁面看到，缺主動觸發（通知 / 看板紅點 / Dashboard 數字）。這才是 PI-012「防掉單」的長期解，本 change 僅修補 Dialog 視覺收斂，建議另開 change 處理觸發機制
- **OQ-NEW-印件分配完成狀態欄位**（ERP 顧問視角）：「印務主管完成全部指派」目前僅為 Dialog 內 UI 概念（進度徽章），未升格為狀態欄位 / 狀態機節點。若未來需跨頁面一致辨識（印件總覽篩選、報表、通知），建議升格為狀態欄位（如 `PrintItem.officer_allocation_status`），但屬資料模型異動，需另開 change
