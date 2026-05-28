# Design — relax-order-detail-edit-conditions

## D1：翻轉 v1.7 設計理由

### v1.7 原設計脈絡

[refine-order-detail-tabs](../archive/) change（2026-05-21 歸檔）對 order-management spec § 訂單階段印件規格編輯時機 拆分「製作前 / 製作後」雙閘門控，立兩條動線：

- **金額異動 → 訂單異動 Tab**：業務於 Tab 5 OA 建單 → 業務主管核可 → 執行
- **印件規格異動 → 業務通知印務從工單異動處理**：業務通知印務（Slack / 電話），印務於工單模組從 WorkOrderModification 流程處理規格變更

v1.7 設計本意：避免訂單側雙閘審核、保持訂單異動 Tab 為金額異動的單一權威動線、印件規格層的生產配置由印務集中處理。

### 翻轉觸發點

Miles Phase 1 探索識別到 v1.7 設計實施 7 天後出現 3 個問題：

1. **業務無法在訂單側直接調整印件規格**：v1.7 把製作後的印件規格類欄位（spec_note / pi_ordered_qty / unit / difficulty_level）全部封鎖，業務只能透過「通知印務 → 印務工單異動」處理，動線長且非同步成本高
2. **業務主管職責邊界與 spec line 2557 矛盾**：v1.7 沒處理 spec line 2557 既有「業務主管可編輯訂單備註（代編場景）」與 user-roles spec line 94「業務主管訂單模組 X」的歷史矛盾
3. **既有附件機制只支援 OrderSignedFile 單一用途**：v1.7 沒涵蓋「其他訂單附件」需求（合約 / 規格說明 / 客戶聲明等）

### 本次解法

將 v1.7「製作前 / 製作後」時機門控降為僅「印件售價」一處保留，其餘 5 個 Section 統一為「訂單未取消即可編輯」粗粒度規則；印件規格異動仍可直接改但推系統自動通知承擔印務感知責任；連帶解 ORD-005 / ORD-006 + 修正 spec line 2557 業務主管矛盾。

**保留 v1.7「金額 / 規格分開動線」核心理念**（議題 5 拍板）：規格走 Side Panel、金額走 Tab 5 OA / 售後 ticket；業務若遇到「規格 + 金額」同時變更須分兩步操作。

**權責邊界明確化**（Miles 拍板，超出 v1.7 範疇）：
- 業務：訂單中的資訊（含 PrintItem）— Side Panel 為 PrintItem 規格的單一寫入入口
- 印務：工單中的資訊（含 ProductionTask / 製程 / 材料規格）— 工單異動不寫回 PrintItem
- 異動發起時序由人工協作管控（業務驅動或印務通知業務）

---

## D2：5 個 Section 編輯時機統一規則 + helper functions

### 統一規則

| Section | v1.7 既有條件 | v1.13 新條件 |
|---|---|---|
| 訂單資訊（OrderInfoEditDialog）| `isBeforeProduction(status)` | `order.status !== '已取消'` |
| 訂單備註（OrderNotesEditDialog）| `completed_at IS NULL` + 角色限制 | `order.status !== '已取消'` + 對齊 user-roles spec 粗粒度權限 |
| 出貨資訊（ShippingInfoEditDialog）| `isBeforeProduction(status)` | `order.status !== '已取消'` |
| 發票設定（InvoiceSettingEditDialog）| `order.status !== '已取消'`（已對齊） | 維持現況 |
| 印件 Side Panel 規格類欄位 | `isOrderBeforeProduction(status)` | `order.status !== '已取消'` |

### helper functions（prototype 實作層）

```ts
// src/lib/order/orderPermissions.ts（新檔）

import type { Order, PrintItem, User, UserRole } from '@/types';
import { isOrderBeforeProduction } from './orderStages';

/**
 * 統一判定訂單詳情頁編輯型 Section 是否可編輯。
 * 4 個 Section（訂單資訊 / 訂單備註 / 出貨資訊 / 發票設定）+ 印件 Side Panel 規格類欄位 + 上傳區皆使用此 helper。
 */
export function canEditOrderSection(order: Order, currentUser: User): boolean {
  if (order.status === '已取消') return false;
  if (currentUser.role === 'supervisor') return false;  // 唯讀模式
  if (currentUser.role === 'accountant') return false;  // 細粒度唯讀

  const allowedRoles: UserRole[] = ['sales', 'consultant', 'production_manager'];
  if (!allowedRoles.includes(currentUser.role)) return false;

  // 業務 / 諮詢需額外檢查訂單範圍（自己負責或被分享編輯權限）
  if (currentUser.role === 'sales' || currentUser.role === 'consultant') {
    return order.salesId === currentUser.id || hasSharedEditPermission(order, currentUser.id);
  }

  return true;  // 訂單管理人可編輯所有訂單
}

/**
 * 印件 Side Panel 整體是否可開啟編輯（規格類欄位）。
 * 對齊 canEditOrderSection（已包含已取消檢查與角色檢查）。
 */
export function canEditPrintItemInSidePanel(printItem: PrintItem, order: Order, currentUser: User): boolean {
  return canEditOrderSection(order, currentUser);
}

/**
 * 印件 Side Panel 內成交單價 / inline 售價是否可編輯。
 * 額外受「製作前」門控：v1.13 spec 全局僅此一處保留 isOrderBeforeProduction 細粒度時機門控。
 */
export function canEditPrintItemPrice(printItem: PrintItem, order: Order, currentUser: User): boolean {
  if (!canEditPrintItemInSidePanel(printItem, order, currentUser)) return false;
  return isOrderBeforeProduction(order.status);
}
```

### 實作位置建議

- 新建 `src/lib/order/orderPermissions.ts` 收口三個 helper
- `src/pages/OrderDetail.tsx`：4 個 Section 編輯按鈕的 `disabled` 條件統一接 `canEditOrderSection()`
- `src/components/order/EditOrderPrintItemPanel.tsx`：`allDisabled` 改接 `!canEditPrintItemInSidePanel()`；`canEditAmount` 改接 `canEditPrintItemPrice()`

### 已被砍掉的 helper

- `hasActiveWorkOrderModification(printItem)` — Phase 3 顧問曾規劃，後因 Miles 拍板「印務不寫 PrintItem 職責邊界」砍掉（不存在並行衝突需 query WorkOrderModification）

---

## D3：印件售價單一細粒度時機門控保留理由 + Tab 5 OA 動線

### 為何保留售價門控

v1.13 全局僅 `PrintItem.price_per_unit` 一處保留「製作前可編輯、製作後 disabled」細粒度時機門控，理由：

1. **售價變動影響應收**：製作後若直接改售價，會破壞應收 / 收款 / 發票三方對帳邏輯（spec § 三方對帳檢視面板 line 1512 既有規則）
2. **金額異動需審核**：OrderAdjustment 既有設計含「業務主管核可」閘門，是會計稽核軌跡的權威來源；直接改售價會繞過審核流程
3. **議題 5 拍板「金額 / 規格分開動線」**：售價屬金額層、規格屬規格層；spec 設計保持分離

### Tab 5 OA 動線（保留）

製作後業務需調整金額時：

```
業務於 Side Panel 看到 price_per_unit disabled + Tooltip 引導
  → 點 Tooltip 內「點此跳轉」link
  → router push 至 Tab 5「訂單異動」+ focus「新增異動」按鈕
  → 業務填寫 OrderAdjustment（adjustment_type 對應）
  → 送業務主管審核
  → 核可後執行 → 系統同步建立補收 / 退款 Payment
```

### Tooltip 文案（Challenge 5 PM 收斂）

- **售價欄位 disabled 時**：「訂單已進入製作階段，售價變更需走『訂單異動』Tab 建立補收 / 折讓單。點此跳轉」
- **i18n key 建議**：`order.printItem.priceDisabled.afterProduction.tooltip`

---

## D4：OrderAttachment 實體設計

### Data Model

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單 |
| `file_url` | string | Y | 檔案 URL（既有 mock file upload 機制） |
| `file_name` | string | Y | 檔案名稱 |
| `purpose_note` | text(200) | Y | 用途說明 free-text |
| `uploaded_by` | FK -> User | Y | 上傳者 |
| `uploaded_at` | timestamp | Y | 上傳時間 |

### Free-text trade-off

**Phase 3 顧問識別**：採 free-text 違反 [[erp-design-patterns]] § 2「狀態碼結構化（LOV + 備註）」原則。

**Miles 議題 2 拍板方案 A（接受 trade-off）**：
- Prototype 階段優先驗證「上傳功能本身被使用的頻率」
- 分類功能待累積 ≥ 20 筆樣本後再升級為 LOV
- 樣本累積後若可歸納為 5-7 個 LOV 選項，則上線前轉 `purpose_type` enum 欄位（保留 purpose_note 作補充說明）

**未來升級成本**：
- 若上線後決定轉 LOV，需要：
  1. 新增 `purpose_type` enum 欄位 + LOV 選項定義
  2. backfill 既有 purpose_note 為對應 enum（人工 / 規則分類）
  3. UI 從 textarea 改為 Select + textarea（可選備註）

### 與 OrderSignedFile 並存策略

兩個附件子表並存於 Tab 9：

- **回簽檔案區**（OrderSignedFile）：上方獨立 Section，首次上傳於「報價待回簽」狀態時推進狀態；後續上傳走 append 不覆寫
- **其他附件區**（OrderAttachment）：下方獨立 Section，上傳時填用途 free-text；MUST NOT 觸發任何狀態推進

### 邊界規則

議題反向挑戰 3 拍板「不訂明、來源並存」：

- 訂單完成後客訴相關附件 SHALL 由業務自由判斷上傳位置（訂單其他附件區 / 售後 ticket 附件區皆可）
- spec 不約束邊界規則，業務經驗判斷
- Prototype 試用累積案例後若反映查找困難，再評估是否需來源 enum

### OQ 連動

archive 時觸發 oq-manage mode B 開立 [[ORD-019]]「附件用途 free-text 上線前驗證是否轉 LOV」。

---

## D5：並行衝突防呆設計砍掉理由

### Phase 3 顧問原規劃

顧問 Phase 3 提反向挑戰 1：「業務 Side Panel 改規格 vs 工單異動並行衝突」，原規劃在本 change 納入「query WorkOrderModification.status = '異動中' → 規格類欄位 disabled + Tooltip」單向防呆。

對應原規劃 ADDED Requirement「Side Panel 編輯與工單異動並行衝突防呆」+ helper `hasActiveWorkOrderModification()`。

### Miles 最終拍板砍掉

**核心訊息**（Miles 決策點 2 回覆）：
- 業務 vs 印務的修改範圍互不重疊
- 業務：訂單中的資訊（含 PrintItem）
- 印務：工單中的資訊（含 ProductionTask）
- 兩者本質不衝突

### 砍掉的合理性

work-order spec § 工單異動流程 line 147-213 既有定義：

- 印務發起工單異動可調整內容：生產任務（新增 / 作廢 / 報廢 / 修改）+ 製程說明 + 材料規格
- **work-order spec 沒寫工單異動會回寫 PrintItem.spec_note**

但 v1.7 order-management spec line 2018 寫了「印件規格異動 → 業務通知印務，由印務從工單異動流程處理」這條動線 — 暗示印務的工單異動會處理 PrintItem 規格，造成兩個 spec 不一致。

**本次解法**：order-management spec line 2018 動線完全廢止，對齊 work-order spec 既有「工單異動只改工單層」的設計。**印務不寫 PrintItem**，並行衝突風險自然消失。

### 風險轉嫁

砍掉系統層防呆後，潛在風險：

| 情境 | 處理 |
|---|---|
| 業務改 spec_note（產生 X 版本） | 系統推通知給印務 |
| 印務同時開工單異動但只改製程 / 材料（不寫 PrintItem）| 無 PrintItem 並行寫入衝突 |
| 業務改 pi_ordered_qty / unit | 印務感知後依需求調整工單 / 生產任務數量（人工協作）|
| 印務發現製程問題需改 PrintItem 規格 | 印務 SHALL 通知業務，業務於 Side Panel 改（職責邊界） |

### 例外：spec_note 共用欄位的人工協作

唯一可能的衝突源：印務發現製程問題（如紙張缺貨需改紙張）通知業務改規格時，業務當下若同時改其他規格（如數量）會撞同一 PrintItem update。實務上業務在收到印務通知時通常會先回應印務需求再改自己的，prototype 階段不做系統防呆，依賴業務 / 印務人工協作。

---

## D6：通知對象 + fallback 規則（Challenge 4 PM 收斂）

### 通知對象標準路徑

製作後業務於 Side Panel 改印件規格類欄位（`spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level`）時觸發：

1. **工單負責印務**（PrintItem 關聯 WorkOrder.printing_owner_id）
2. **印務主管**（role = `production_manager`，即既有印務主管角色）
3. **訂單管理人**（Order.order_manager_id）

### Fallback 規則（Miles 拍板選項 A）

Order.order_manager_id 為**非強制**欄位（對齊既有 Order 實體可選欄位設計），為空時 fallback：

- 通知對象 = 業務（Order.sales_id 對應使用者）+ 工單負責印務 + 印務主管
- 業務作為訂單建立者，對訂單異動有第一手感知責任

### 工單負責印務 fallback

若 PrintItem 關聯工單的 `printing_owner_id` 也為空：

- 通知對象退化為：印務主管 + 訂單管理人（或業務 fallback）
- 印務主管在無指派情況下承擔感知責任

### ActivityLog payload 結構

```json
{
  "action_type": "print_item_spec_modified_in_production",
  "triggered_by": "<user_id>",
  "before": { "spec_note": "500g 銅版紙", "pi_ordered_qty": 500 },
  "after": { "spec_note": "350g 雪銅", "pi_ordered_qty": 600 },
  "notified_recipients": ["user_id_printing", "user_id_supervisor", "user_id_order_manager"],
  "order_manager_fallback_to_sales": false,
  "printing_owner_fallback_skip": false
}
```

### 通知形式

採既有 in-app 通知元件（NotificationCenter / Toast）複用，prototype 階段不接 Slack webhook（依 [[prototype-stage-context]] § 五「上線前需驗證對外溝通方式」）。

### 通知內容

```
業務 [name] 修改了印件 [item_name]（[item_code]）的規格：
- spec_note：500g 銅版紙 → 350g 雪銅
- pi_ordered_qty：500 → 600

請確認是否需調整工單 / 生產任務 / 採購

[查看印件詳情] link
```

### 不觸發通知的情境

- 訂單狀態 ∈ 製作前狀態：不推通知（無印務介入需要）
- 訂單狀態 = 已取消：所有編輯禁止，不會觸發
- 編輯非規格類欄位（如 price_per_unit 製作後本就 disabled）：不會觸發
- 其他 Section 編輯（訂單資訊 / 備註 / 出貨資訊 / 發票設定 / 附件上傳）：不推通知（沿用既有靜默 ActivityLog）

### 風險緩解

- **通知濫發**：上線後 ActivityLog 記錄通知對象與時間，便於驗證頻率；若頻率過高再評估 debounce
- **印務不確認**：spec 不引入印務確認動作（議題 1 拍板方案 C），依賴印務組織紀律 + ActivityLog 稽核軌跡

---

## D7：角色權限對齊 user-roles spec + spec line 2557 矛盾修正

### 既有矛盾

| spec 段落 | 業務主管權限規定 |
|---|---|
| user-roles spec line 94 § 完整權限對照表 | 業務主管對「報價單/訂單」模組為 **X**（無存取） |
| order-management spec line 2557 § 訂單階段訂單備註編輯權限與時機 | 業務主管「可編輯（代編場景）」|

兩者直接矛盾。

### v1.13 修正

採方案 A（直接移除業務主管 row）：

- order-management spec § 訂單階段訂單備註編輯權限與時機 移除「業務主管 / 可編輯（代編場景）」row
- 補「Supervisor 唯讀」+「會計唯讀」明示
- 業務主管 MUST NOT 透過任何路徑修改訂單詳情頁編輯型 Section
- 如需協助補備註場景：透過 Supervisor 重新指定訂單業務主管（既有 line 871 機制）或業務分享編輯權限（既有 US-ORD-004 機制）

### 連帶解 OQ

- **[[ORD-005]]**：訂單階段備註欄位編輯權限 → 對齊 user-roles spec 粗粒度權限
- **[[ORD-006]]**：訂單階段備註欄位編輯時機 → 「訂單未取消即可編輯」粗粒度規則
- archive 時觸發 oq-manage mode C 更新兩個 OQ status = answered

### 角色權限總表（v1.13）

| 角色 | 訂單模組粗粒度 | 訂單詳情頁編輯型 Section | 印件 Side Panel | 其他附件上傳 |
|------|-------------|-----------------------|----------------|-----------|
| Supervisor | R/W | **唯讀** | 唯讀 | 唯讀 |
| 訂單管理人 | R/W | 可編輯 | 可編輯 | 可上傳 |
| 業務 | R/W | 可編輯（限負責訂單）| 可編輯（限負責訂單）| 可上傳（限負責訂單）|
| 諮詢 | R/W | 可編輯（同業務）| 可編輯（同業務）| 可上傳（同業務）|
| 會計 | R/W（細粒度為讀取）| **唯讀** | 唯讀 | 唯讀 |
| 業務主管 / 其他模組 X 角色 | X | 路由禁止進入 | 路由禁止進入 | 路由禁止進入 |

---

## D8：撰寫指引 — Prototype 實作層注意事項

### 程式碼結構建議

```
src/
├── lib/order/
│   └── orderPermissions.ts          ← 新增：3 個 helper
├── types/
│   └── orderAttachment.ts           ← 新增：OrderAttachment 型別
├── store/
│   └── useErpStore.ts               ← 修改：新增 orderAttachments slice + selector + actions
├── components/order/
│   ├── EditOrderPrintItemPanel.tsx  ← 修改：allDisabled / canEditAmount 改接 helper
│   ├── OrderAttachmentSection.tsx   ← 新增：Tab 9 其他附件區
│   └── OrderAttachmentUploadDialog.tsx ← 新增：上傳 + 用途 free-text dialog
└── pages/
    └── OrderDetail.tsx              ← 修改：4 個 Section 編輯按鈕條件 + Tab 9 + 印件 row 編輯按鈕 + 其他費用 disabled
```

### v1.7 → v1.13 行為對照（debugger 友善）

| 場景 | v1.7 行為 | v1.13 行為 |
|---|---|---|
| 製作中業務點訂單資訊「編輯」 | Toast「需走訂單異動流程」+ Dialog 不開 | Dialog 開啟、可編輯儲存 |
| 製作中業務點訂單備註「編輯」 | Disabled（completed_at != NULL 才禁止）| 啟用、可編輯 |
| 訂單完成後業務點訂單備註「編輯」 | Disabled（completed_at != NULL）| 啟用、可編輯（v1.13 放寬）|
| 製作中業務點印件 row「編輯」 | 按鈕不顯示 | 顯示、開 Side Panel；售價 disabled |
| 製作中業務改 spec_note | 無法操作 | 直接改；系統推通知 |
| 製作中印務開工單異動寫 PrintItem | spec line 2018 寫了但無實作 | 廢止；印務只改工單 |
| 製作後 / 訂單完成後上傳回簽 | 按鈕不顯示（限報價待回簽）| 顯示、可上傳；不推進狀態 |
| 已取消訂單任何 Section | Disabled | Disabled（不變）|
| 業務主管編輯訂單備註 | 可編輯（spec line 2557 列）| Disabled（v1.13 移除破例）|

### ActivityLog 事件型別新增

- `print_item_spec_modified_in_production`（製作後印件規格異動）：payload 含 before / after / notified_recipients
- `print_item_spec_modified`（製作前印件規格異動，新事件型別與製作後區分）
- `order_attachment_uploaded`（其他附件上傳）：payload 含 file_name / purpose_note
- 其他 Section 編輯沿用既有 `order_info_modified` / `order_note_modified` / `order_shipping_modified` / `order_invoice_modified`

### Mock 資料設計

- seed 至少 2 筆 OrderAttachment 範例（不同 purpose_note 樣本，便於未來 LOV 升級判斷）
- ActivityLog seed `print_item_spec_modified_in_production` 範例（含 notified_recipients 陣列）

### Playwright e2e 重點測試案例

1. 製作中業務於 Side Panel 改 spec_note → 確認 ActivityLog 寫入 + Toast 顯示通知文案
2. 訂單完成後業務改訂單備註 → 確認可編輯 + 儲存成功
3. 訂單完成後業務上傳其他附件 → 確認附件清單顯示 + purpose_note 顯示
4. 業務主管登入後查看訂單備註 Section → 確認編輯按鈕 disabled
5. 已取消訂單 → 確認所有編輯按鈕 disabled

### 未來 change 候選（從本 change 衍生）

- **附件用途 LOV 升級**（依 ORD-019）：累積樣本後決定
- **規格異動審核流程**（從砍項回收）：若印務反映通知不足以承擔感知責任，引入印務確認動作
- **樂觀鎖機制**（從砍項回收）：若並行衝突反向情境發生 ≥ 3 次，引入 PrintItem.version 欄位
- **訂單附件 vs 售後 ticket 附件邊界**（從風險回收）：若業務反映查找困難，加來源 enum
- **ActivityLog 內容定義 change**（Miles 議題 3 留延後）：事後補登標籤 / 內容結構統一
