## Context

售後服務單 (`AfterSalesTicket`) 在 v0.1 / v0.2 / v0.3 連續三個 change 落地後，Miles 在實際走查業務 / 諮詢日常工作情境時識別出兩類獨立的 gap：

1. **退款收尾流程的證據鏈不完整**（反饋 1+2）：OA 編輯閘門過嚴造成多筆異動爆增、「已執行」與金錢實際發生脫節、退款 Payment 缺對帳 metadata
2. **補印 PrintItem 跨頁面缺少快速識別**（反饋 3）：補印靠 FK 反查、印務 / 業務在列表頁無法一眼識別

senior-pm 前期介入確認：兩類 gap 同源於 v0.1 ~ v0.3「ticket 內部端對端流程走查」的疏漏，需局部修補。本 change 維持單一範疇但 `tasks.md` 分 **Phase A / B / C** 三區塊使其可獨立 verify（依 senior-pm 建議）。

商業背景對應：
- [Vault 售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)
- [Vault 訂單實體卡](../../../memory/erp/ERP_Vault/05-entities/訂單.md)（含 `OrderAdjustment` 子實體）
- [Vault 印件實體卡](../../../memory/erp/ERP_Vault/05-entities/印件.md)
- [Vault 訂單狀態機卡](../../../memory/erp/ERP_Vault/06-state-machines/訂單狀態.md)

## Goals / Non-Goals

**Goals**：

1. 退款收尾流程的證據鏈完整化：OA 編輯閘門放寬 + Payment 含對帳 metadata + OA 與 Payment 語意對齊（業務意圖 vs 金錢實際發生）
2. 補印 PrintItem 跨四個列表頁（業務平台印件總覽 / 派工看板 / 工單列表 / 訂單列表）快速識別 + filter
3. 「印件類型」欄位三值通用設計，避免補印專屬徽章造成設計系統脫節
4. ticket 詳情頁可反查所衍生的補印 PrintItem

**Non-Goals**：

- 加印（additional print）形式化為 PrintItem.type 列舉值（下次需要時開新 change）
- SalesAllowance 折讓單流程細節（待獨立 change 處理發票期間判定）
- OA 撤銷 / 反向退款流程（若 OA 已執行後業務反悔，目前靠新建反向 OA）
- 補費 OA 自動建議邏輯（補印 PrintItem 是否自動帶建補費 OA，OQ-6 留待後續討論）
- 售後服務單收尾流程整體重構（OQ-9 建議下一輪做端到端走查）

## Decisions

### 決策 1：OA 編輯閘門放寬到「已核可（未執行）」可改金額不需重新送審

**背景**：原規則僅「草稿 / 已退回」可改金額，業務想微調已核可金額只能取消重建，造成 ticket 內 OA 數量爆增。

**選擇**：純信任 + 「主管核可金額 vs 當前金額」對照欄位 + audit log 三層構成半透明監督

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) 加「異動 ≥ 核可金額 × 110% 需重新送審」閘門 | 自動降回草稿要求重送 | 業界主流（Ordway）做法但初版不做；待業務濫用實證再加（OQ-2）|
| (b) 主動推播通知主管 | 每次改金額觸發 Slack / email 給主管 | 過度干擾主管；對照欄位已提供被動監督 |
| (c) 拿掉「已核可」中間態，簡化為「草稿 / 已執行」兩態 | 流程更簡 | 失去主管覆核點，風險過高 |

**核心理由**：

- 退款金額在 Payment 建立前都還沒「真的發生」，業務微調空間應該開放
- 信任業務不會繞過主管授權做大幅調整（極端情境靠 audit log 事後查核）
- 對照欄位提供半透明監督：主管在訂單詳情頁的異動清單即時看到「業務已調整 ${diff}」視覺強調

**風險**（風險 A）：OA 已核可後業務濫改金額 → 處理：對照欄位 + audit log + 未來若實證有濫用，可加 OQ-2 提及的閾值閘門

### 決策 2：OA「已執行」綁退款 Payment 建立事件，移除獨立執行按鈕

**背景**：原 OA 上有「執行」按鈕，業務手動推進；Payment 建立是事後另一個動作（脫節風險）。Miles 反問「款項處理到底什麼時候算完成？」

**選擇**：當業務於 ticket 內建立關聯退款 Payment（含對帳資料）的事件**自動推進** OA 為「已執行」

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) 業務手動按執行按鈕（現況）| 業務主導 | OA 已執行但 Payment 沒建的脫節風險；業務反問「款項什麼時候算完成」無明確答案 |
| (c) 對應 Payment 對帳完成才算 | 會計確認到帳才推進 | 最嚴謹但延後鎖定時點；業務需等會計作業才看到狀態變更 |

**核心理由**（語意對齊）：

- **OA 是業務意圖記錄、Payment 是金錢實際發生證據**
- Payment 建立要求附帶對帳資料（退款日期 / 對帳附件 / 對帳備註）= 業務無法在「款項實際沒發生」的情況下建 Payment → 自動推進已執行有事實依據
- 移除「執行」按鈕將操作路徑收斂為「OA 建立 → 主管核可 → 業務建退款 Payment（含對帳）」三步
- 同一 transaction 建立 Payment + 推進 OA，杜絕脫節

**Insight（來自 senior-pm 第 5 段）**：未來其他類型 OA（規格變更 / 加印追加）的「執行」綁定也應循同樣原則設計 — 綁實際下游事件而非業務手動按鈕。本 change 先處理退款型 OA，加印 / 規格變更型留下一輪。

### 決策 3：PrintItem.type 列舉值擴充為三值，採通用「印件類型」欄位設計

**背景**：補印目前靠 `relatedAfterSalesTicketId` FK 反查，跨列表頁無法快速識別。

**選擇**：擴充 `PrintItem.type = '打樣印件' | '大貨印件' | '補印印件'`，配「印件類型」三值通用欄位

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) 用獨立 `origin` 欄位記錄（normal / additional / reprint），type 維持兩值 | 印件性質與來源解耦 | 前端要兩個欄位聯合判斷，模型複雜；查詢成本高 |
| (b) 同時加「補印 + 加印」四值 | 一次到位 | 範圍變大；加印識別需求尚未由 Miles 確認 |
| (c) 補印專屬徽章（SupplementaryPrintBadge）| 視覺最強烈 | 與既有設計系統脫節；其他類型沒有徽章造成「補印特殊化」 |

**核心理由**：

- 列舉值 type 簡單，前端 type narrowing 容易
- 通用三值欄位（打樣 / 大貨 / 補印）避免「補印特殊化」與設計系統脫節
- 補印與大貨在訂單詳情頁印件區混合排列（不獨立分組），靠「印件類型」欄位識別 — 符合 Miles 明確指示

**識別 UI 規範**：

- 列表頁（4 個）+ 訂單詳情頁印件區 + 印件詳情頁 sub-header + ticket 補印清單區 統一新增「印件類型」欄位
- 共用元件 `PrintItemTypeLabel`（三值通用，補印 hover 顯示 AS 編號、click 跳轉 ticket）
- 篩選器三選項 chip-style multi-select，可複選

### 決策 4：補印 + 大貨在訂單詳情頁印件區混合排列（不獨立分組）

**背景**：Miles 明確反饋「不用獨立分組，但要在表格中顯示『印件類型』」

**選擇**：訂單詳情頁印件區同一張表混合排列，靠「印件類型」欄位識別

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) 補印獨立分組（標題 + 分隔線）| 視覺強烈 | Miles 明確反對 |
| (b) 排序時補印置頂或置底 | 自動分組視覺 | 過度設計；同訂單印件數量有限不需強調 |

**核心理由**：同訂單印件數量有限，加分組 / filter 反而干擾；補印靠欄位識別 + 標籤可跳轉 ticket 已足夠。

### 決策 5：舊資料補印不 backfill

**背景**：v0.1 ~ v0.3 期間業務透過 ticket dialog 建的補印 PrintItem，當時 type 必為「大貨印件」（無補印列舉值），靠 FK 反查識別。

**選擇**：明確聲明「prototype 階段所有透過本次 ticket dialog 建的補印帶 `type = '補印印件'`；舊資料一律視為大貨，不做 backfill」

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) 系統自動 backfill：`where related_after_sales_ticket_id IS NOT NULL AND type = '大貨印件' → type = '補印印件'` | 資料一致性 | prototype 階段資料量小但 backfill 邏輯有副作用（如某些舊資料的 FK 是測試用，backfill 反而誤判）|

**核心理由**：

- prototype 階段資料量小，舊資料 ≤ 10 筆
- 業務認知上「v0.4 上線後新建補印才走新流程」較清晰
- 訂單詳情頁印件區的「印件類型」欄位呈現舊資料的真實 type（不誤導）

### 決策 6：補印 PrintItem 不自動帶建補費 OA（與 responsibility 解耦）

**背景**：客戶承擔的補印場景，理論上應該帶建一筆補費 OA（adjustment_type = 補退、+補印費）

**選擇**：補印 PrintItem 不自動帶建補費 OA；業務需另外手動建（保留 v0.1 既有設計）

**替代方案考慮**：

| 方案 | 說明 | 為何不採用 |
|------|------|----------|
| (a) ticket dialog 內聯帶建補費 OA：填印件規格 + 補費金額一次完成 | 一氣呵成 | 聯動複雜：補費金額計算邏輯（工本費 vs 雙方協商價）有歧義；建議留 OQ-6 |

**核心理由**：

- 補印 PrintItem 與費用議題解耦，避免單一 dialog 太多責任
- 客戶承擔時業務有彈性決定補費金額（協商空間）
- 未來補費 OA 自動建議邏輯定下來再開新 change 整合（OQ-6）

## Risks / Trade-offs

| 風險 | 影響 | 處理 |
|------|------|------|
| 風險 A：OA 已核可後業務濫改金額 | 業務繞過主管授權做大幅調整 | 對照欄位（半透明監督）+ audit log + 主管隨時可在訂單頁監督；未來實證有濫用可加 OQ-2 閾值閘門 |
| 風險 B：移除 OA 執行按鈕後業務找不到下一步 | UAT 時業務 confused | Phase B 設計：OA「已核可」卡片顯眼放「建立退款 Payment」按鈕；e2e 跑此 UX 情境 |
| 風險 C：舊資料補印視為大貨造成資料分裂 | 業務 / 印務看舊補印顯示「大貨」覺得不對 | 明確聲明設計選擇於 spec；業務培訓時說明「v0.4 上線後新建補印才走新流程」 |
| 風險 D：補印取消後 ticket 永遠停在「處理中」 | ticket 流程不順暢 | spec 既有處理（v0.1 第 316-323 行），補印清單區顯示「已取消」+ 提示業務重建 / 變更 resolution |
| 風險 E：跨期退款的折讓單流程未處理 | 已開發票後退款，需手動建 SalesAllowance | 不在本次範圍；建立退款 Payment 時若已開過發票，提示業務手動建（OQ-4 留待後續）|

## Migration Plan

### Prototype 階段（本 change 範圍）

無 production migration。直接在 prototype 上實作新規則：

1. types/order.ts 擴充 `PrintItemType` 列舉值
2. store 改動：
   - `updateOrderAdjustment` 允許已核可可改金額不重審
   - `createRefundPayment`（新方法）：建 Payment + 同一 transaction 推進關聯 OA 為已執行
   - `createSupplementaryPrintItem`（新方法）：建 PrintItem 自動帶 `type = '補印印件'` + `relatedAfterSalesTicketId`
3. UI 改動：
   - `OrderAdjustmentSection.tsx`：移除執行按鈕、已核可可改金額、對照欄位
   - `OrderPaymentSection.tsx`：建退款 Payment dialog 擴充對帳資料欄位
   - `AfterSalesTicketDetail.tsx`：新增建退款 Payment 入口、建補印入口、補印印件清單區
   - `SupplementaryPrintItemDialog.tsx`（新檔）：建補印 dialog
   - `PrintItemTypeLabel.tsx`（新檔）：三值通用標籤元件
4. 列表頁改動：4 個列表頁（業務平台印件總覽 / 派工看板 / 工單列表 / 訂單列表）統一新增「印件類型」欄位 + filter；訂單詳情頁印件區也加欄位（不需 filter）

### 舊資料處理

- 不執行 backfill script
- v0.1 ~ v0.3 期間透過 FK 建的補印 PrintItem 維持 `type = '大貨印件'`
- 業務在訂單詳情頁印件區看到舊補印顯示為「大貨」是預期行為

### Rollback Strategy

prototype 階段直接 git revert；無 production rollback 議題。

## Open Questions

| OQ ID | 議題 | 處理時機 |
|-------|------|---------|
| OQ-1 | 已核可 OA 改金額是否需通知主管 / 顯示給主管查看？audit log 必有，但是否要主動推播？ | 本 change 不做主動推播；對照欄位已提供被動監督，待業務反饋 |
| OQ-2 | 是否設「異動金額 ≥ 核可金額 × 110% 需重新送審」閘門？ | 初版不做，待業務濫用實證再加 |
| OQ-3 | 建立 Payment 後若發現錯誤怎辦？取消 Payment 是否自動回退 OA 為「已核可」狀態？ | 本 change 不處理，留待下一輪 |
| OQ-4 | 跨期退款的折讓單（SalesAllowance）自動 vs 手動？建立退款 Payment 時系統自動產生折讓單，還是只提示業務手動建？ | 本 change 不處理（折讓單流程獨立 change）|
| OQ-5 | 補印印件的優先度：印務看到「補印」類型是否預設高優先度排程？還是只是視覺識別？ | 本 change 只做視覺識別 + filter；優先度由派工人員自行判斷 |
| OQ-6 | 補印的費用 OA 由誰建立：業務手動建（解耦設計，目前推薦）vs ticket dialog 內聯帶建？ | 本 change 採手動建；自動建議邏輯下一輪 |
| OQ-7 | PrintItem.type = 補印印件時，是否強制 relatedAfterSalesTicketId 必填？ | 本 change 採強制（已寫入 spec invariant）|
| OQ-8 | 「印件類型」欄位是否在現有頁面已存在？需檢查既有列表頁是否已有此欄位 | implement 時檢查；若無則一併新增（已在 prototype-shared-ui spec 規範）|
| OQ-9 | 售後服務單收尾流程是否需要做一輪「使用者端到端走查 + 流程整體性審視」？ | 列入 2026 Q3 ticket 模組重構規劃，連結 [XM-001](../../../memory/erp/ERP_Vault/08-open-questions/XM-001-款項管理頁面業務最重要決策.md) 作為前置依賴 |

OQ-1 ~ OQ-9 SHALL 於 implement 階段觸發 `oq-manage` mode B 開立獨立 OQ 卡（Vault `08-open-questions/`），含完整去重檢查。
