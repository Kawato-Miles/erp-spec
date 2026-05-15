## Why

2026-05-15 Miles 對剛歸檔的 [extend-order-fields-from-vendor-feedback](../archive/2026-05-14-extend-order-fields-from-vendor-feedback/) v1.3 三項邏輯做精細化修正：

1. **諮詢訂單收尾情境分類錯誤**：原 spec 列了三種獨立情境（不做大貨 / 需求單流失 / 待諮詢取消），但「需求單流失」實際上是「不做大貨」的子情境（諮詢結束做大貨後需求單流失 = 最終沒做大貨），應併入「不做大貨」高層情境。Miles 釐清：諮詢訂單建立情境只有兩種「不做大貨」與「待諮詢取消」。
2. **業務轉單機制過重**：原 spec 設計「業務 / 訂單管理人可直接改 `Order.sales_id`」與既有「US-ORD-004 訂單分享與代理授權」機制重複，且直接改 sales_id 會丟失原業務指紋（後續對帳 / 績效追溯困難）。應沿用既有分享機制做臨時協助，正式轉單由 Supervisor 走特殊情境。
3. **編輯閘門範圍過嚴**：原 spec「已回簽」之後即走 OrderAdjustment，但審稿段（稿件未上傳 / 等待審稿 / 待補件）客戶仍可能調整規格，此階段走 OrderAdjustment 太重。應將閘門推遲至「製作等待中」（含），審稿段內維持自由編輯。

## What Changes

**諮詢訂單收尾情境（consultation-request + state-machines + order-management）**
- 諮詢訂單建立情境收斂為兩種高層分類：
  - **不做大貨**：涵蓋 (a) 諮詢人員直接點「結束諮詢 - 不做大貨」(b) 諮詢結束做大貨後，需求單流失自動歸類為「不做大貨」結局並建諮詢訂單收尾
  - **待諮詢取消（退費）**：業務於待諮詢階段取消，含退款 Payment
- 釐清：**非諮詢來源**的需求單流失與諮詢訂單無關，不建任何訂單
- 行為層面實作不變（需求單流失仍會自動建諮詢訂單），僅重新分類概念

**業務權限機制（order-management）**
- **REMOVED Requirement**：訂單階段改派負責業務（轉單）— 移除直接改 `Order.sales_id` 設計
- 業務協助 / 代理 SHALL 沿用 [US-ORD-004 訂單分享與代理授權](../../../specs/order-management/spec.md) 機制（分享 Tab、檢視 / 編輯權限授予）
- `Order.sales_id` 仍為原始負責業務指紋，變更僅由 Supervisor 走 [Requirement: Supervisor 重新指定訂單業務主管](../../../specs/order-management/spec.md) 既有機制（將擴展為含 sales_id 變更場景）

**訂單編輯閘門（order-management）**
- **MODIFIED Requirement**：訂單階段印件規格編輯時機
  - 階段一範圍：草稿 → 報價待回簽 → 已回簽 → 稿件未上傳 → 等待審稿 → 待補件（全部可自由編輯）
  - 階段二範圍：製作等待中（含）→ 工單已交付 → 製作中 → 製作完成 → 出貨中 → 訂單完成（走 OrderAdjustment）
  - 已取消：唯讀（同既有）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `consultation-request`: 諮詢訂單收尾情境分類整理（兩種高層情境）
- `order-management`: 移除改派 sales_id Requirement、調整編輯閘門至「製作等待中」
- `state-machines`: 訂單狀態機諮詢路徑情境分類重整

## Impact

**Code / Data**
- 無 schema 變更
- 業務邏輯：需求單流失觸發建諮詢訂單時，事件分類標籤改為「不做大貨」

**Specs**
- consultation-request spec：諮詢訂單建立情境 Requirement
- order-management spec：移除「訂單階段改派負責業務」Requirement、修改「訂單階段印件規格編輯時機」Requirement
- state-machines spec：訂單狀態機諮詢路徑說明分類

**Prototype**
- isBeforeSigned 變數重新命名為 isBeforeProduction，狀態列表擴展含審稿段
- OrderDetail.tsx 移除「改派」連結
- 訂單詳情頁 Tab 加「分享」入口（沿用既有 US-ORD-004 機制 UI；若尚未實作則先 toast 提示）

**Notion**
- 訂單模組 BRD v1.3 修訂備忘 callout 補一條 v1.4 註腳
- ORD-010（線上單 case_name）持續追蹤
