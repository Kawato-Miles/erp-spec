## Why

印件審稿階段，Order.status 無法區分以下三種截然不同的業務情境，因為它們在訂單層全部顯示為「等待審稿」：

| 情境 | 印件 reviewDimensionStatus 聚合 | 球在誰手上 | 目前 Order.status |
|------|-------------------------------|-----------|------------------|
| 剛進入審稿階段、尚未送審 | 全部「等待審稿」 | 審稿人員 | 等待審稿 |
| 送審後有印件不合格，待業務補件 | 存在「不合格」 | **業務** | 等待審稿（❌ 誤導）|
| 業務已補件，等待重審 | 存在「已補件」、無「不合格」 | 審稿人員 | 等待審稿 |

**業務問題**：
1. 業務在訂單列表看到「等待審稿」時，無法分辨自己需不需要動作 → 漏補件，延誤進度
2. 審稿主管看「等待審稿」訂單時，混進「有印件被退件但業務未處理」的訂單，誤判待審量
3. 訂單詳情頁雖能看到每個印件的 `reviewDimensionStatus` Badge，但 OrderList 聚合層遺失這層資訊

**為什麼用「待補件」而非「審稿不合格」**：Order 層狀態表達的是「球在誰手上」（業務下一步要做什麼），而非「發生了什麼事件」。業務在 OrderList 的 JTBD 是「我要做什麼」，用「待補件」直接對齊動作語意。技術上雖然是審稿維度的不合格，但業務視角與老闆 / 客戶的理解都是「這張單還欠補件」。

## What Changes

### 新增（Order 層狀態）

- **`OrderStatus` 新增「待補件」**：位於共用段「等待審稿」的平行子態（`等待審稿 ↔ 待補件`）
- `OrderStatusBadge` 新增紅色系樣式（對齊印件層 `ReviewDimensionStatusBadge` 的「不合格」色票 `#FDE8E8` / `#B91C1C`）
- `OrderList` 的 `ALL_STATUSES` 下拉加入「待補件」

### 新增（Bubble-up 邏輯）

新增 `deriveOrderReviewStatus(currentStatus, printItems)` — 訂單位於審稿段（稿件未上傳 / 等待審稿 / 待補件）時的派生規則：

1. 若存在任一印件 `reviewDimensionStatus = '不合格'` → Order.status = **待補件**
2. 否則，若所有印件 `reviewDimensionStatus = '合格'` → Order.status = **製作等待中**（進入製作段）
3. 否則，若存在任一印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'` → Order.status = **等待審稿**（該印件稿件已上傳 / 已補件，球在審稿人員）
4. 否則（全部「稿件未上傳」；或「合格」+「稿件未上傳」混合）→ Order.status = **稿件未上傳**

**規則 3 的設計**：`reviewDimensionStatus = '等待審稿'` 本身即隱含「稿件已上傳、等待審稿人員處理」；EC 混合訂單（免審稿合格 + 需審稿印件）中，需審稿但還沒上傳的印件狀態是「稿件未上傳」而非「等待審稿」，規則 3 不會被誤觸發，由規則 4 正確派生為「稿件未上傳」（球在客戶 / 業務上傳那端）。

**觸發時機**：
- `submitReviewForPrintItem`（印件送審完成）
- 補件完成（`OrderDetail.tsx` / `MockEcOrderDetail.tsx` 的 `onResupply` callback 透過 `updateOrder` 間接觸發）
- `confirmSignBack`（訂單回簽後自動分配；本身已有首次進入審稿段邏輯，保留不動）
- `uploadArtworkFile`（稿件首次上傳可能觸發 稿件未上傳 → 等待審稿）
- **原訂單新增免審稿印件**（打樣 NG 棄用舊印件 + 原訂單新增免審稿印件）：Order 若已離開審稿段，bubble-up 依不可逆原則不觸發；Order 仍在審稿段時新印件直達「合格」，由規則 2 派生為「製作等待中」

**統一串接點**：`updateOrder(orderId, updater)` action 內部自動套 `applyOrderReviewBubbleUpForOrder`，所有透過 `updateOrder` 改動印件狀態的路徑都自動 bubble-up，不需呼叫端重複處理。

### 修正（spec narrative）

- **訂單狀態不可逆原則**修訂（`state-machines/spec.md` Requirement: 訂單狀態不可逆）：
  - 原：「訂單狀態向前推進後 MUST NOT 回退至先前狀態」
  - 新：「訂單段落（付款段 → 審稿段 → 製作段 → 出貨段）間 MUST NOT 回退；但審稿段內子狀態（等待審稿 ↔ 待補件）允許互換」
- 訂單狀態機流程圖更新，補 `等待審稿 ↔ 待補件` 雙向箭頭
- 免審稿快速路徑敘述 NO CHANGE

### 測試 / Mock

- `scenarioCoverage.test.ts` 或對應斷言補：
  - **情境 A（S3 / S4）**：單印件不合格 → Order 轉「待補件」→ 業務補件 → Order 回「等待審稿」→ 重審合格 → Order 進「製作等待中」
  - **情境 B**：多印件其中一件不合格 → Order 維持「待補件」直到該件補件且通過
  - **情境 C**：免審稿訂單 → Order 不經過「待補件」
  - **情境 D（S5）**：打樣 NG 棄用 → **原訂單新增印件**（設為免審稿） → 若原訂單已離開審稿段，Order.status 維持當前製作段狀態（bubble-up 不觸發，對齊不可逆原則）
  - **情境 E（S10）**：訂單混合「免審稿合格印件 + 需審稿未上傳印件」→ Order 應為「稿件未上傳」直到需審稿印件上傳稿件
- `mockOrders` 補「待補件」示範資料（可讀性）

## Impact

### Spec 變更
- `state-machines/spec.md`：訂單狀態機 Requirement、訂單狀態不可逆 Requirement
- `order-management/spec.md`：若 Data Model 有欄位定義 Order.status 枚舉，需同步

### Code 變更（Prototype）
- `src/types/order.ts`：`OrderStatus` 型別加「待補件」
- `src/components/order/OrderStatusBadge.tsx`：樣式 map 加 entry
- `src/store/useErpStore.ts`：新增 `deriveOrderReviewStatus` + 觸發點串接
- `src/pages/OrderList.tsx`：篩選清單補「待補件」
- `src/data/mockOrders.ts`：補示範資料
- `src/test/scenarios/`：補 A/B/C/D/E 五情境斷言

### 與通知機制（OQ XM-006）的關係

本 change 建立「待補件」作為**通知事件的觸發源節點**。實際通知發送（Email / 站內訊息 / SLA 追蹤）由 [OQ XM-006「審稿不合格的通知管道與內容模板」](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 推進的後續 change 綁定。

**未綁定通知時的定位**：本狀態在 OrderList 作為業務主動盤點的 UI 信號（篩選、顏色標示）。若通知機制始終未建立，「待補件」將淪為 UI-only 信號（SAP 社群稱之為 zombie status），採用率依賴業務主動檢視習慣。因此本 change 歸檔後，**SHOULD** 立即推進 XM-006 的後續 change，避免狀態節點長期無下游消費者。

### 不影響
- 印件層 `reviewDimensionStatus` 五值維持不變（稿件未上傳 / 等待審稿 / 不合格 / 已補件 / 合格）
- 工單 / 任務 / 生產任務 / QC / 出貨的狀態機完全不動
- QC 不合格邏輯不在此 scope — **訂單本身永遠沒有 QC 不合格狀態**（QC 不合格走生產任務層的 bubble-up，不冒到 Order）
- 審稿人員工作台 / 收件匣不動 — 審稿人員的 JTBD 是「我有多少印件要審」，看印件層工作台即可，不需要知道 Order.status
- 審稿相關 KPI 計算（由審稿主管另行討論）

## Out of Scope

- **X1**：QC 不合格狀態設計（與本 change 明確分離）
- **X2**：工單異動期間的 Order.status（製作段例外，另議）
- **X3**：出貨異常 hold（出貨段例外，另議）
- **X4**：客訴 / 退貨 hold（跨段例外，若出現屬於「第 2 個段落內例外維度」，觸發重構評估 — 見 design.md D7）
- **X5**：審稿退件通知 / SLA（OQ XM-006 獨立 change）
- **X6**：**同印件追加製作**（客戶已有合格印件想加印量）— 業務實務走**新訂單**承接，不在原訂單追加。本 change 不支援從原訂單分裂新製作批次的邏輯
  - 對照：**打樣 NG 棄用 → 原訂單新增免審稿印件**的情境 **in scope**（見「測試 / Mock 情境 D」與 `state-machines/spec.md` Scenario）
- **X7**：並行補件 race condition — 業務實務上**一訂單一業務**負責，不存在兩位業務同時對同一訂單不同印件補件的情境
- **X8**：審稿人員工作台的訂單維度呈現 — 審稿人員只需印件層工作台，不需 Order.status
- **X9**：Order 層審稿 KPI / 儀表板（審稿主管另提）
