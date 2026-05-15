## Context

剛歸檔（2026-05-14）的 [extend-order-fields-from-vendor-feedback](../archive/2026-05-14-extend-order-fields-from-vendor-feedback/) v1.3 在三個地方有概念分類過細 / 設計重複 / 範圍過嚴的問題。本 change 為「跟班修正」（follow-up），只調整邏輯不擴充功能，影響面集中在三個 Requirement。

相依：
- [order-management spec](../../specs/order-management/spec.md) v1.3
- [consultation-request spec](../../specs/consultation-request/spec.md) v0.1
- [state-machines spec](../../specs/state-machines/spec.md)
- 既有 [Requirement: 訂單列表與分享權限](../../specs/order-management/spec.md) US-ORD-004 機制
- 既有 [Requirement: Supervisor 重新指定訂單業務主管](../../specs/order-management/spec.md) 機制

## Goals / Non-Goals

**Goals:**
- 諮詢訂單建立情境概念與實作對齊（兩種高層分類，行為不變）
- 業務協助 / 代理走分享，正式轉單走 Supervisor — 避免直接改 sales_id 丟失原業務指紋
- 審稿段內客戶仍可調整規格不走 OrderAdjustment，減少業務負擔
- 為 Prototype 改動鋪路（isBeforeSigned → isBeforeProduction）

**Non-Goals:**
- 不變更諮詢訂單建立行為（需求單流失仍自動建諮詢訂單，僅分類重整）
- 不擴充 Supervisor 重新指定機制的範圍（既有機制是改「業務主管」`approved_by_sales_manager_id`，本 change 不變更）
- 不新增「sales_id 改派」Supervisor UI（後續若有實際業務需求再另開 change）
- 不變更 OrderAdjustment.adjustment_type enum（沿用 8 值）

## Decisions

### Decision 1：諮詢訂單收尾情境採「兩種高層分類 + 內部觸發點」

**選擇：** 諮詢訂單建立情境收斂為兩種高層分類：
- **不做大貨**：兩個內部觸發點同歸此類
  - 觸發點 1.1：諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」
  - 觸發點 1.2：諮詢結束做大貨後，需求單流失系統自動推進（事件分類為「不做大貨」結局）
- **待諮詢取消（退費）**：業務於待諮詢階段取消，含退款 Payment

**替代方案：**
- B. 維持三種獨立分類（不做大貨 / 需求單流失 / 待諮詢取消）。問題：「需求單流失」實際上是「最終沒做大貨」的子情境，跟「不做大貨」結局相同，分類重複。
- C. 把「需求單流失」改稱「諮詢轉需求單後流失」獨立列。問題：對業務語意更精準但讓 spec 更冗長，沒實質好處。

**選 A 的理由：**
- 對應業務心智模型：客戶最終是否完成印製？沒有 → 諮詢費結算（不做大貨）；中途撤回 → 退費（待諮詢取消）
- 行為實作不變，僅 spec 分類重整，影響範圍可控
- 後續若有新的「沒做大貨」觸發點（如新增「諮詢轉需求單但永久擱置」），可繼續歸入「不做大貨」這條分類，spec 不需擴展

**重要釐清：** 非諮詢來源的需求單流失（直接從需求單建立、無 `linked_consultation_request_id`）與諮詢訂單無關，不建任何訂單；需求單流失走需求單自身的退款流程。

### Decision 2：移除「改派 sales_id」設計，雙軌處理業務協助與正式轉單

**選擇：** 移除 v1.3 新增的「訂單階段改派負責業務（轉單）」Requirement。業務協助 / 代理走兩條既有機制：
- **臨時協助 / 代理**：業務於訂單詳情頁分享 Tab 授予檢視 / 編輯權限（US-ORD-004，任何業務可主動執行）
- **正式轉單（離職交接 / 部門調整）**：Supervisor 走既有「Supervisor 重新指定」機制（既有機制範圍是 `approved_by_sales_manager_id`，本 change 不擴充至 `sales_id`，後續另議）

**替代方案：**
- B. 保留「直接改 sales_id」但加入 Supervisor 角色檢核。問題：仍會丟失原業務指紋，且與分享機制功能重複。
- C. 不處理，維持 v1.3 設計。問題：v1.3 與 US-ORD-004 功能重複且 sales_id 變更不可追溯。

**選 A 的理由：**
- `Order.sales_id` 維持原始指紋有助於後續對帳、業績計算、客戶溝通歷史追溯
- 既有兩個機制（US-ORD-004 / Supervisor 重新指定）覆蓋實際業務需求，不需新增
- 減少 Prototype 設計負擔（移除「改派」UI、不需建新的 Supervisor 改派頁）

### Decision 3：編輯閘門推遲至「製作等待中」

**選擇：** 印件規格 / 數量 / 單位 / 難易度 / 報價單價的編輯閘門從「已回簽」推遲至「製作等待中」（含）。

**狀態邊界明確：**

| 範圍 | 訂單狀態 | 編輯行為 |
|------|---------|----------|
| 階段一 | 草稿 / 待業務主管審核 / 報價待回簽 / 已回簽 / 等待付款 / 已付款 / 稿件未上傳 / 等待審稿 / 待補件 | 直接編輯，ActivityLog 記錄 |
| 階段二 | 製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成 | 走 OrderAdjustment |
| 終態 | 已取消 | 唯讀 |

**替代方案：**
- B. 沿用「已回簽」閘門。問題：審稿段內客戶常因檔案問題調整規格，業務每次都建 OrderAdjustment 太重。
- C. 用「工單已交付」為閘門（更後）。問題：製作等待中已配置工單 / 排程，此時改動會打亂排程，比較合理閘門位置。

**選 A 的理由：**
- 「製作等待中」是工單已建立並等待排程的關鍵節點，此後改動實際影響工序成本
- 審稿段中業務 / 客戶溝通頻繁，自由編輯較貼近實務
- 對應 Prototype 變數名 `isBeforeProduction`（含義清楚），取代 v1.3 的 `isBeforeSigned`

## Risks / Trade-offs

| 風險 | 緩解策略 |
|------|---------|
| 諮詢訂單情境重新分類後，前期 spec / 文件 / 留言提及「需求單流失（第三種情境）」可能造成讀者困惑 | spec 修訂時保留歷史備註說明分類重整原因；Notion BRD v1.3 callout 補一條 v1.4 修訂說明 |
| 「Supervisor 重新指定」機制目前限於 `approved_by_sales_manager_id`，業務若實際需要 sales_id 轉單（如離職交接）將無對應 UI | 本 change 不擴充；後續業務若有實際需求再開 change（如 `extend-supervisor-reassign-to-sales-id`） |
| 編輯閘門推遲至「製作等待中」可能讓部分過渡資料（v1.3 期間建立的訂單）的 Prototype isBeforeSigned 變數行為跟新規不一致 | Prototype 改名為 isBeforeProduction 並調整狀態列表，舊變數一次清除；既有 mock data 不受影響 |
| 「製作等待中」範圍下「工單已交付」也算在內，但此狀態工單剛交付印務、生產任務未開工，業務仍可能想小幅調整 | 維持走 OrderAdjustment 設計；後續若有實際業務反饋再評估細分閘門 |

## Migration Plan

1. **Spec 階段（本 change）**
   - 提交 proposal / design / specs / tasks
   - 不跑三視角審查（Miles 指定）
   - 直接進入 archive sync

2. **Prototype 階段（同步進行）**
   - isBeforeSigned → isBeforeProduction 重新命名 + 狀態列表更新
   - 移除「改派」連結 UI
   - 訂單詳情頁 Tab 加「分享」入口（沿用既有機制；UI 上若尚未實作可先 toast 提示）

3. **Notion 同步階段（archive 後）**
   - BRD v1.3 callout 補 v1.4 修訂說明條目

## Open Questions

無新增 OQ。ORD-010（線上單 case_name 規則）持續追蹤中。
