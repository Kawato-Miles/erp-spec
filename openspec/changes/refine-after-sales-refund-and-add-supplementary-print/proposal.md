## Why

售後服務單 (`AfterSalesTicket`) 在 [add-after-sales-ticket](../../changes/archive/) v0.1 / [add-my-after-sales-action-page-and-remove-owner-transfer](../../changes/archive/) v0.2 / [refactor-my-after-sales-to-standard-list-pattern](../../changes/archive/) v0.3 連續三個 change 落地後，Miles 在實際走查業務 / 諮詢日常工作情境時識別出兩類獨立的 gap，需要在進入 UAT 前修補。背景對應 [Vault 售後服務實體](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)、[Vault 訂單實體](../../../memory/erp/ERP_Vault/05-entities/訂單.md)（含 `OrderAdjustment` 子實體）、[Vault 印件實體](../../../memory/erp/ERP_Vault/05-entities/印件.md)、[Vault 訂單狀態機](../../../memory/erp/ERP_Vault/06-state-machines/訂單狀態.md)。

### 問題群 1：退款收尾流程的證據鏈不完整（反饋 1+2）

`OrderAdjustment`（OA）目前設計把「業務退款意圖」與「金錢實際發生」混在同一個實體：

- **OA 編輯閘門過嚴**：金額一旦進入「待主管審核」即鎖定，業務想微調只能取消重建 → ticket 內 OA 數量爆增、難以對應原始退款動作。Miles 反問：「為什麼一個退款要產生多筆訂單異動？」
- **「已執行」判定脫離金錢實際發生**：目前綁業務手動按按鈕，業務反問「款項處理到底什麼時候算完成？」OA 上有「已執行」標記但關聯的退款 Payment 可能沒建（脫節風險）
- **退款 Payment 缺 metadata**：建立退款 Payment 時沒強制要求對帳資料（退款日期 / 銀行轉帳憑證），事後查帳時無事實依據

### 問題群 2：補印 PrintItem 在跨頁面缺少快速識別（反饋 3）

售後服務單 v0.1 允許從 ticket 內建立補印 PrintItem，但「補印」身份只靠 `relatedAfterSalesTicketId` FK 反向關聯，造成：

- 訂單列表 / 業務平台印件總覽 / 派工看板 / 工單列表上無法一眼識別「這是補印」
- 印務排程時無法快速判斷補印的製作優先度
- 業務 / 諮詢從 ticket 反查所衍生的補印印件需要逐筆點開印件詳情驗證

兩類 gap 同源於「ticket 內部端對端流程走查」的疏漏，需局部修補。

## What Changes

本 change 維持單一範疇但 `tasks.md` 分 **Phase A / B / C** 三區塊獨立 verify：

### Phase A：OrderAdjustment 編輯閘門放寬（對應反饋 1）

- **MODIFIED**：OA 編輯閘門新增「`已核可`（未執行）」狀態下業務可改金額，**不需重新送審**，狀態維持 `已核可`
- **新增**：OA 卡片顯示「主管核可金額 $X vs 當前金額 $Y（業務調整 $Z）」對照欄位（半透明監督），主管在訂單頁 / ticket 頁可即時看到業務的調整
- **新增**：OA 金額異動 audit log 必欄位（時間、操作者、舊金額、新金額）

設計理由：退款金額在 Payment 建立前都還沒「真的發生」，業務微調空間應該開放；信任業務 + 對照欄位 + audit log 三層構成半透明監督。

### Phase B：OA「已執行」綁定退款 Payment 建立（對應反饋 2）

- **REMOVED**：OA 上的「執行」按鈕（業務不再手動推進 OA 狀態）
- **MODIFIED**：OA「已執行」改綁「建立關聯退款 Payment」事件；提交退款 Payment 時系統自動：
  1. 建立 Payment（`amount = OA.amount`、`type = refund`、`linkedOrderAdjustmentId = OA.id`）
  2. 將 OA 狀態推進為 `已執行`、`executedAt = Payment.createdAt`
  3. 觸發訂單應收總額重算
- **MODIFIED**：退款 Payment 建立 dialog 新增必填欄位：退款日期、對帳附件（銀行轉帳憑證 / 對帳單截圖等）、對帳備註
- **新增 invariant**：`OA.status = '已執行' → linkedRefundPaymentId IS NOT NULL`（資料一致性閘門）

設計理由：建立 Payment 時款項處理已實際發生，附對帳資料 = 業務無法在「款項實際沒發生」的情況下推進 OA → 自動推進已執行有事實依據；移除冗餘的「執行」按鈕將操作路徑收斂為「OA 建立 → 主管核可 → 業務建 Payment（含對帳）」三步。OA 與 Payment 從現在開始語意對齊：**OA 是業務意圖記錄、Payment 是金錢實際發生證據**。

### Phase C：補印 PrintItem 識別資訊架構（對應反饋 3）

- **MODIFIED**：`PrintItem.type` 列舉值從 `'打樣印件' | '大貨印件'` 擴充為 `'打樣印件' | '大貨印件' | '補印印件'`
- **新增 invariant**：`PrintItem.type = '補印印件' → relatedAfterSalesTicketId IS NOT NULL`
- **新增**：ticket 詳情頁「建立補印印件」入口 dialog（與「建立退款異動單」並列）
- **新增**：ticket 詳情頁「補印印件清單區」獨立分組（列出該 ticket 衍生的所有補印 PrintItem，含印件名稱 / 規格摘要 / 當前狀態 / 跳轉印件詳情）
- **MODIFIED**：訂單詳情頁印件區表格新增「印件類型」欄位（三值都顯示，補印與大貨混合排列、不獨立分組）
- **新增共用元件**：`PrintItemTypeLabel`（三值通用 — 打樣 / 大貨 / 補印；不同顏色文字；補印 hover 顯示「補印（AS-XXX）」可跳轉 ticket）
- **MODIFIED**：四個列表頁統一新增「印件類型」欄位 + filter 三選項：業務平台印件總覽、派工看板、工單列表、訂單列表
- 補印的下游流程完全等同大貨印件（審稿 → 工單 → 排程 → 生產任務 → QC → 出貨），無流程縮減
- 補印 PrintItem 預設**不**自動建費用 OA（與 `responsibility` 解耦，避免聯動複雜）；若 `ticket.responsibility = 客戶承擔` 業務另外手動建一筆 OA

設計理由：採用「印件類型」三值通用欄位設計而非補印專屬徽章，是為了避免「特殊化識別」與既有設計系統脫節；補印 + 大貨 + 打樣統一在同一個欄位內表達差異，方便未來擴充其他類型。

**舊資料處理**：prototype 階段所有透過本次 ticket dialog 建的補印都會帶 `type = 補印印件`；舊資料（v0.1 ~ v0.3 期間透過 FK 建的補印）一律視為大貨印件，**不做 backfill**。

## Capabilities

### New Capabilities

無新建 capability。本 change 全部為 modified。

### Modified Capabilities

- `order-management`：OA 編輯閘門放寬（已核可可改不重審）+ OA「已執行」綁退款 Payment 建立 + Payment 對帳資料必填 + 主管核可金額對照欄位 + audit log + 訂單詳情頁印件區「印件類型」欄位
- `after-sales-ticket`：ticket 詳情頁「建立退款 Payment」入口 + 「建立補印印件」入口 + 「補印印件清單區」獨立分組 + responsibility 與費用 OA 解耦描述
- `prototype-shared-ui`：`PrintItem.type` 列舉值擴充 + `PrintItemTypeLabel` 共用元件規範（三值通用 — 打樣 / 大貨 / 補印）
- `sales-platform`：業務平台印件總覽新增「印件類型」欄位 + filter 三選項
- `work-order`：工單列表 / 工單詳情新增「印件類型」欄位顯示（待 design 階段最終確認）
- `task-dispatch-board`：派工看板新增「印件類型」欄位顯示（待 design 階段最終確認）

## Impact

### 前端
- 新檔：`SupplementaryPrintItemDialog.tsx`（ticket 內建立補印 dialog）
- 新檔：`PrintItemTypeLabel.tsx`（三值通用印件類型標籤元件）
- 修改：`OrderAdjustmentSection.tsx`（移除執行按鈕、已核可可改、顯示對照欄位）
- 修改：`OrderPaymentSection.tsx`（建立退款 Payment dialog 擴充對帳資料欄位）
- 修改：`AfterSalesTicketDetail.tsx`（新增建退款 Payment 入口、建補印入口、補印清單區）
- 修改：訂單詳情頁印件區表格（新增印件類型欄位）
- 修改：四個列表頁（業務平台印件總覽 / 派工看板 / 工單列表 / 訂單列表）— 統一加印件類型欄位 + filter

### Store / Type
- `types/order.ts`：`PrintItemType` 列舉擴充
- `store/useErpStore.ts`：`updateOrderAdjustment`（已核可可改）/ `createRefundPayment`（含對帳資料 + 自動推進 OA 為已執行）/ `createSupplementaryPrintItem`

### 規格文件
4-6 個 spec 異動（見上述 Modified Capabilities）；CLAUDE.md § Spec 規格檔清單版本號更新

### 使用者
- **業務 / 諮詢**：退款金額調整路徑由「取消 + 新增 OA」收斂為「修改既有 OA 金額」；建立退款 Payment 時必須附對帳資料；ticket 內補印建立 dialog + 補印清單區方便反查
- **主管**：在 OA 卡片可即時看到「核可金額 vs 當前金額」對照
- **印務**：派工看板 / 工單列表可篩選「補印」優先製作
- **會計**：退款 Payment 對帳資料齊全，事後查帳有事實依據

### 成功指標（驗收標準）

| Phase | 指標 | 驗證方式 |
|-------|------|---------|
| A | 同一筆退款動作從 OA 建立到 Payment 確認，產生 OA 筆數 ≤ 1 | Playwright 跑全流程，斷言 `ticket.linked_adjustments.length === 1` |
| B | OA `executedAt` 與關聯 Payment `createdAt` 相差 ≤ 1 秒 | Playwright 斷言時間戳 + 不存在 `OA.status = '已執行' AND linkedRefundPaymentId IS NULL` |
| C | 補印 PrintItem 在四個列表頁皆可透過「印件類型 = 補印」filter 篩出 | Playwright 跑四個列表頁的 filter 行為 |
| C | ticket 詳情頁「補印印件清單區」顯示的 PrintItem 數量 = 透過 `relatedAfterSalesTicketId` 反查的數量 | UI 層 / 資料層一致性斷言 |

### 風險與處理

| 風險 | 處理 |
|------|------|
| OA 已核可後業務濫改金額 | 對照欄位 + audit log + 主管隨時可在 OA 卡片監督；未來若實證有濫用，可加「異動 ≥ 核可金額 × 110% 重審」閘門（OQ-2） |
| 移除 OA 執行按鈕後業務找不到下一步 | Phase B 設計需在 OA「已核可」狀態下顯眼引導「建立退款 Payment」按鈕；e2e 跑此 UX 情境 |
| 舊資料中透過 FK 建的補印不 backfill 造成資料分裂 | 明確設計選擇：prototype 階段不 backfill；舊資料一律視為大貨；新建補印一律走新流程 |
| 跨期退款的折讓單流程未處理 | 不在本次範圍；建立退款 Payment 時若已開過發票，提示業務手動建 SalesAllowance（OQ-4） |

## 不在本次範圍

- 加印（additional print）形式化為 PrintItem.type 列舉值（Miles 已決定下次需要時再開）
- SalesAllowance 折讓單流程（待獨立 change 處理發票期間判定）
- OA 撤銷 / 反向退款流程
- 補費 OA 自動建議邏輯（補印 PrintItem 是否自動帶建補費 OA，留 OQ-6）
- 售後服務單收尾流程整體重構（連續 4 個 change 後建議下一輪做端到端走查，留 OQ-9 連結 [XM-001](../../../memory/erp/ERP_Vault/08-open-questions/XM-001-款項管理頁面業務最重要決策.md)）
