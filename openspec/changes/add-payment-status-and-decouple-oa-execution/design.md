## Context

### 既有設計現狀

refine-after-sales-refund-and-add-supplementary-print change（2026-05-20 歸檔）建立了「Payment 建立 ＝ 退款完成」硬綁定：業務於售後 ticket 內建退款 Payment 時，同 transaction 強制對帳附件必填 ≥ 1 個，並自動推進關聯 OrderAdjustment.status 為「已執行」。同時對「補收 OA」（加印追加 / 加運費 / 急件費）採取 asymmetric 設計：spec L1719 寫「OrderAdjustment 經核可並執行後系統 SHALL 同步更新 PrintItem.ordered_qty 並建立補收 Payment」，spec L1734 寫「系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）」。Prototype 實際 `createRefundPayment` action 在 store/useErpStore.ts:3425-3491 同 transaction 推進 OA。

### Miles 反饋的痛點

2026-05-21 plan mode 討論中 Miles 明確指出：
- 「目前系統中上傳了收款紀錄後，就會自動認定退款。實務上業務可能先填一半，陸續補齊資料」
- 「金流上實際還沒退款 / 退款失敗，但帳上已扣減」
- 一般收款也有同樣場景（「客戶說已匯但對帳未到」）

### senior-pm agent 前期介入發現（已吸收）

senior-pm 在 plan approve 後審查問題框架，給出 3.5/5 評分，提出多項風險（業務嫌麻煩規避、處理中老化追蹤、會計實務未確認、缺成功指標）。Miles 決定維持原 plan 範疇不縮減，但本 design 吸收 senior-pm 提的關鍵風險與成功指標進入 §「Risks / Trade-offs」與 §「Open Questions」段。

### 商業層引用

- [ERP_Vault 訂單實體卡 § OrderAdjustment 行為摘要](../../../memory/erp/ERP_Vault/05-entities/訂單.md)
- [ERP_Vault 付款發票邏輯卡 § 三方對帳](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)
- [ERP_Vault OQ ORD-003 取消退款 Payment 是否回退 OA](../../../memory/erp/ERP_Vault/08-open-questions/ORD-003-取消退款Payment是否回退OA.md)（本 change resolve）
- [ERP_Vault OQ ORD-004 跨期退款 SalesAllowance 自動建立](../../../memory/erp/ERP_Vault/08-open-questions/ORD-004-跨期退款SalesAllowance自動建立.md)（本 change 補 constraint）

### 階段範疇對齊

本 change 屬於 Phase 2 範疇延伸（訂單流程完整完成率 ≥ 60%），改善的是「款項記錄真實性」而非核心訂單流程。senior-pm 評估為「支線」而非 Phase 2 主推動力。

## Goals / Non-Goals

### Goals

1. Payment 新增 `paymentStatus`（處理中 / 已完成）欄位，通用化適用一般收款 / 退款 / 補收三類
2. 解耦「Payment 建立 ↔ OA 已執行」自動綁定：OA「已執行」改由「對應 Payment 累計達 OA.amount」自動推進
3. 對稱化退款 OA 與補收 OA 流程（棄用「執行 OA 自動建補收 Payment」asymmetric 設計）
4. `paidAt` 重新定義為「款項實際完成日」通用語意；attachments 切已完成時必填（所有 Payment 適用）
5. OA UI 兩處統一改 ErpTable 形式（售後 ticket 內 + 訂單詳情頁訂單異動 Tab）
6. resolve 既有 ORD-003 OQ（取消已完成 Payment 自動回退 OA）；補 ORD-004 constraint（處理中期間禁止觸發 SalesAllowance）

### Non-Goals

1. **不接銀行 API 自動對帳**（替代 D，Phase 3 進階分析期再考慮）
2. **不新增 Reconciliation 對帳事件實體**（替代 C，會計實務未確認需求，先列 OQ）
3. **不實作處理中 Payment 老化追蹤機制**（> 7 天提醒、主管看板）— 列為後續 change
4. **不變動 SalesAllowance 自動建立邏輯**（仍由業務手動建，ORD-004 完整決策仍 open）
5. **不變動 PaymentPlan schema**（仍維持「應收期次永遠正數」設計，不擴展支援負值期次）
6. **不影響諮詢費 webhook 自動建立 Payment 流程**（webhook 觸發代表金流已實際發生，paymentStatus 預設 '已完成'）
7. **不引入 Payment 狀態機**（paymentStatus 為簡單 enum 切換、業務手動觸發、無自動推進規則；已完成 → 處理中 反向禁止由 UI / store 阻擋而非狀態機規範）

## Decisions

### 決策 1：OA 狀態機不加「退款執行中」中間態（採變體 A）

**選擇**：OA 狀態機維持「已核可 → 已執行」，只改「已執行」觸發條件（從 Payment 建立改為 Payment 累計達 OA.amount）。

**替代方案**：變體 B 在 OA 狀態機插入「退款執行中」中間態（已核可 → 退款執行中 → 已執行）。

**理由**：
- OA 是「業務意圖載體」、Payment 是「金錢實際發生」，兩者職責分離；事實是否齊備（status）的 axis 應該在 Payment 而非 OA
- 變體 B 會把焦點搶回 OA、變動 state-machines spec 較大、需要 OA 資料 migration
- 變體 A 實施成本最低、影響範圍可控

### 決策 2：一般收款也適用 paymentStatus（不限縮只動退款）

**選擇**：一般收款 / 退款 / 補收三類 Payment 通用化 paymentStatus 邏輯。

**替代方案**：senior-pm 建議的替代 B（只動退款，一般收款不變）。

**理由**：
- Miles 明確指出一般收款也有「客戶說已匯但對帳未到」實際場景，需同邏輯支持「先填一半」
- 通用化讓 mental model 對稱，業務不需記憶「哪類 Payment 適用哪些規則」
- 既有諮詢費 webhook 流程不受影響（webhook 預設 '已完成'）

### 決策 3：棄用「執行 OA 自動建補收 Payment」（採對稱化）

**選擇**：補收 OA 與退款 OA 共用「業務手動建處理中 Payment + 補齊切已完成」流程，棄用既有 spec L1719 / L1734 的「系統自動建補收 Payment」行為。

**替代方案**：保留既有設計（補收業務手動建 + 退款業務手動建分軌處理）。

**理由**：
- 既有 spec 對補收 OA 已執行的觸發描述不一致（L1224 寫「加印型 OA 經正常路徑推進」、L1734 寫「自動或提示手動建」、Prototype ALLOWED_TRANSITIONS 仍有 execute action）— 是模糊地帶
- 對稱化讓業務在 OA 編輯介面看到統一的「新增 Payment」入口，不需記憶 OA 類型差異
- 解 senior-pm 指出的「補收場景手動建負擔」風險：補收場景在實務上頻率低（多數補收是加運費 / 急件費 / 加印追加，金額相對小），手動建一筆 Payment 不算高負擔

**風險**：refine-after-sales-refund-and-add-supplementary-print 在 2026-05-20 才歸檔（1.5 個月內第二次翻轉同議題），對應 [12-insights/2026-05-20-售後ticket-reactive-補丁循環](../../../memory/erp/ERP_Vault/12-insights/2026-05-20-售後ticket-reactive-補丁循環.md) 指出的 reactive 補丁模式。

**Mitigation**：本 change 並非否定 refine-after-sales-refund 的核心設計（對帳附件必填 / OA 與 Payment 連動），只是把「Payment 建立 = 完成」這層硬綁定鬆開、把補收與退款的不對稱拉平。設計方向是「延伸對齊」非「翻轉」。

### 決策 4：「已完成 → 處理中」反向禁止（採變體 Y）

**選擇**：Payment.paymentStatus 從「已完成」切回「處理中」禁止。業務發現錯誤的修正路徑為「取消 Payment → 重建」。

**替代方案**：
- 變體 X：可雙向切換（簡單，但 OA 狀態反覆翻動）
- 變體 Z：可逆但需理由記錄（中間方案）

**理由**：
- 維持 OA「已執行」的終態語意一致性（避免狀態反覆翻動讓主管 / 會計困惑）
- 「取消重建」路徑與既有 ORD-003 決策（取消已完成 Payment 自動回退 OA）對齊，邏輯統一
- senior-pm 提的「業務想改回去」場景未在 Miles 反饋中出現，過度設計反而增加複雜度

### 決策 5：UI Dialog 單一表單 + 單一儲存按鈕（不分草稿/標完成兩個 button）

**選擇**：Payment 編輯 Dialog 單一表單、單一「儲存」button、paymentStatus 在 Dialog 內 toggle 切換。

**替代方案**：
- 變體 P1（plan 原推薦）：同表單兩個 footer button（儲存草稿 / 儲存並標完成）
- 變體 P2：兩段式 wizard
- 變體 P3：兩個獨立 Dialog

**理由**（Miles 在 plan approve 過程中明確要求）：
- 不分「草稿 / 標完成」措辭，業務心智模型「建立 + 編輯 + 儲存」最直觀
- 列表 row 也只用「編輯」單一按鈕，不發散「補齊資料 / 標記已完成 / 編輯草稿」多個按鈕
- 驗證在「儲存」事件觸發，依 paymentStatus 切換必填規則（conditional required）

### 決策 6：linkedOrderAdjustmentId 必填規則對稱化

**選擇**：
- 從 OA 編輯介面建立的 Payment（不論退款 / 補收）：linkedOrderAdjustmentId 必填 = OA.id，amount 符號 = OA.amount 符號
- 從 OrderPaymentSection 建立的一般收款 Payment：linkedOrderAdjustmentId 可空（沿用 spec L850）
- 退款 / 補收 Payment 不允許從 OrderPaymentSection 直接建立

**替代方案**：強制所有 Payment 必須 linkedOrderAdjustmentId（破壞 spec L850 既有設計）。

**理由**：
- 一般收款不對 OA、退款 / 補收必對 OA 的雙軌設計是 spec L850 既有合理設計（4 筆 mock 退款全部 paymentPlanId = null 驗證此設計）
- 對稱化只針對「OA → Payment」這條路徑（不論退款 / 補收都從 OA 入口建）
- 入口分流（OrderPaymentSection vs OA 編輯介面）讓 UI 流程清晰

### 決策 7：OA UI 兩處統一改 ErpTable（不拆獨立 UI change）

**選擇**：售後 ticket 內 OA section 與訂單詳情頁訂單異動 Tab 兩處統一改 ErpTable 形式，併入本 change。

**替代方案**：senior-pm 建議拆獨立 UI change（C4）。

**理由**：
- OA Table 化與本 change 的「Payment 在 OA 編輯 dialog 內管理」高度耦合（dialog 內含 Payment 列表）
- 拆獨立 UI change 會讓本 change 的「業務在哪建 Payment」流程描述不完整
- Miles 在 plan approve 過程確認「OA 不要用卡片要用 Table」是本 change 範疇一部分

### 決策 8：單一 change（不拆 4 個獨立 change）

**選擇**：本 change 涵蓋 paymentStatus + OA 觸發點 + 對稱化 + OA UI Table 全部範疇，不拆。

**替代方案**：senior-pm 建議拆 C1 / C2 / C3 / C4 四個獨立 change。

**理由**（Miles 明確選擇）：
- 三大議題（paymentStatus / OA 觸發 / 對稱化）高度耦合，拆分後中間期 spec / Prototype 不一致期過長
- senior-pm 提的「審查焦點散」風險靠本 design 內明確分節 Decisions 化解（每個 decision 獨立闡述）

## Risks / Trade-offs

### 風險 1：業務嫌麻煩規避「手動切完成」

**Risk**：業務每次建 Payment 都要回來補資料、切狀態，可能規避：
- 規避 1：建立時就直接切「已完成」（資料不齊），系統 validation 擋下 → 業務等資料齊才建（回到原狀，痛點未解）
- 規避 2：建了「處理中」就忘了回來切「已完成」（比現狀更糟，OA 永遠不推進、對帳長期掛帳）

**Mitigation**：
- UI 設計上「處理中 Payment」用半透明 + 虛線邊強化視覺差異，讓業務一眼識別「未完成項目」
- 對帳面板顯示「處理中（合計）X 元」資訊軸，業務 / 會計可即時看到未完成的款項
- **遺漏處理：列為後續 change**（處理中 Payment 老化追蹤 > 7 天提醒、主管看板可見度），不在本範疇
- UAT 階段監測「處理中 Payment 老化率」指標（見 § 成功指標），若 > 20% 代表機制失敗需重新設計

### 風險 2：refine-after-sales-refund 1.5 個月內第二次翻轉同議題

**Risk**：refine-after-sales-refund 2026-05-20 才歸檔，本 change 2026-05-21 即翻轉部分設計（解耦 Payment 建立 ↔ OA 已執行的綁定、棄用自動建補收 Payment），對應 [2026-05-20-售後ticket-reactive-補丁循環 insight](../../../memory/erp/ERP_Vault/12-insights/2026-05-20-售後ticket-reactive-補丁循環.md) 指出的 reactive 補丁模式。

**Mitigation**：
- 本 change 並非否定 refine-after-sales-refund 的核心設計（對帳附件必填 / OA 與 Payment 連動 / 三方對帳公式），而是延伸對齊 + 補對稱化
- 設計方向是「業務手動切完成」這個新原則統一適用，不再有特例
- 若 UAT 後仍需翻轉，下個 change 應重新評估替代 A / B / C / D 路徑（見 plan 內 senior-pm 建議）

### 風險 3：會計實務對「處理中 Payment」的應收應付處理未確認

**Risk**：會計實務上「期末結帳」會盤點當期所有應收應付。處理中 Payment 是否要納入應收 / 應付帳列？plan 與本 design 假設「不入帳」（對帳收款淨額只計已完成），但會計實務未確認。

**Mitigation**：
- 列入 § Open Questions，建議 Miles 與會計確認後再上線
- UAT 階段請會計試用對帳面板，回饋是否需要「處理中應收 / 應付帳列」獨立顯示

### 風險 4：「取消已完成 Payment」會計抗拒邏輯刪除

**Risk**：plan 設計「取消 Payment」可能涉及刪除（邏輯刪除 vs 物理刪除未明）。會計實務上抗拒「刪除已對帳憑證」，因審計需要連續編號 / 異動軌跡。

**Mitigation**：
- Prototype 階段採用「物理刪除」（mock data 直接從陣列移除），但 spec 描述為「取消」（語意上保留可審計性）
- 列入 § Open Questions，正式實作時改為「邏輯刪除 + 顯示劃線標註」需與會計協作確認
- 既有 ORD-003 OQ 已記錄此議題，本 change resolve 部分但保留實作細節

### 風險 5：本 change 不在 Phase 2 北極星鏈路上（支線改動）

**Risk**：senior-pm 指出本 change 是「支線」，不直接貢獻 Phase 2 北極星「訂單流程完整完成率」。

**Mitigation**：
- 接受此為改善「款項記錄真實性」的支線投資（非 Phase 2 主推動力）
- 不挪用 Phase 2 核心訂單流程資源（本 change 與訂單建立 / 工單 / 出貨流程不衝突）

## Migration Plan

### 一次性 Backfill（spec 已定義 ADDED Requirement）

本 change 上線時對既有所有 Payment 執行：

```typescript
for each Payment p where p.paymentStatus is null:
  p.paymentStatus = '已完成'
  p.completedAt = p.createdAt
```

Migration 為冪等（重複執行不變動已 backfill 的資料）。Prototype 階段直接修改 `src/data/mockPayments.ts` mock data。

### 既有 invariant 過渡

| 階段 | invariant |
|------|----------|
| Migration 前 | OA.status = '已執行' AND adjustment_type IN (退印, 補退) → 存在至少一筆關聯 refund Payment |
| Migration 後 | OA.status = '已執行' → 對應已完成 Payment 累計 amount = OA.amount（含符號比較）|

Migration 不變動 OA 狀態（既有已執行 OA 維持已執行，invariant 自動滿足因 Payment 已 backfill 為「已完成」）。

### UI 上線順序

1. types 層加 paymentStatus / completedAt 欄位 + 通用化 helpers
2. mock data 執行 backfill + 新增 demo 處理中 Payment
3. store action 改寫（createRefundPayment 拆解 + 新增 updatePayment / cancelPayment）
4. OrderPaymentSection 列表加狀態 column + 編輯 dialog 加 paymentStatus 切換
5. AfterSalesTicketDetail + OrderAdjustmentSection 改 ErpTable + OA 編輯 dialog 含關聯 Payment 列表
6. OrderReconciliationPanel 收款淨額 breakdown 加處理中軸 + 差額 hint
7. Vault OQ 更新（ORD-003 resolved / ORD-004 補 constraint）

### Rollback 策略

Prototype 階段：git revert 本 change 對應 commits + mock data 還原。

正式實作（如未來部署）：
- 新 column `paymentStatus` 可保留（NOT NULL constraint 移除即可）
- store action 還原為單一 `createRefundPayment`（不破壞 schema）
- UI 還原為卡片 + 自動推進 OA

## Open Questions

### OQ 1：處理中 Payment 老化追蹤機制（後續 change）

**問題**：處理中 Payment 超過 X 天未切「已完成」時，系統應如何提醒業務 / 主管？

**待釐清**：
- 老化閾值（建議 7 天，依 UAT 業務反饋調整）
- 提醒方式：列表頁標示「處理中 N 天」/ 主管看板「處理中超過 7 天清單」/ Slack 通知
- 主管角色（業務主管 / 印務主管）的可見度需求

**處置**：列入後續 change 範疇，不在本 change 處理。

### OQ 2：會計實務對「處理中 Payment」的應收應付處理

**問題**：會計期末結帳時，處理中 Payment 是否要納入應收 / 應付帳列？

**待釐清**：
- 會計實務的應收應付分類規則
- 對帳面板是否需要「處理中應收 / 處理中應付」獨立顯示（除既有「處理中合計」資訊軸外）
- 是否需要會計獨立 dashboard 顯示處理中狀態

**處置**：上線前 Miles SHALL 與會計確認；UAT 階段請會計試用回饋。

### OQ 3：取消已完成 Payment 的刪除模式（邏輯 vs 物理）

**問題**：「取消已完成 Payment」是邏輯刪除（保留紀錄、劃線標註）還是物理刪除（從資料層移除）？

**待釐清**：
- 會計審計需求（是否要求連續編號）
- 異動軌跡保留期限
- 取消後在對帳面板的顯示方式

**處置**：Prototype 階段採物理刪除（mock data 移除）；正式實作前 SHALL 與會計確認、實作為邏輯刪除 + UI 劃線標註。

### OQ 4：諮詢取消退費的 paymentStatus 適用範圍

**問題**：諮詢取消退費的退款 Payment（linkedOrderAdjustmentId = null）是否適用 paymentStatus？

**處置**（本 change 採用）：適用（語意一致）。但因無 OA 連動，「切完成」純粹是業務內部對帳標記，不觸發其他連動。後續若有特殊邏輯需求再開 change。

### OQ 5：補收 OA 自動建 Payment 的舊行為若實際業務有需求是否回復

**問題**：棄用「執行 OA 自動建補收 Payment」後，若實務上業務確實覺得加印追加 / 加運費 / 急件費場景手動建 Payment 太麻煩（特別是高頻場景），是否考慮恢復自動建立？

**處置**：本 change 採對稱化（業務手動建），UAT 階段監測「補收 Payment 建立耗時 / 業務反饋」；若實證業務負擔大可考慮 follow-up change 提供「自動建處理中 Payment」選項（仍需業務切已完成）。

## 成功指標（吸收 senior-pm 建議）

本 change 上線後 SHALL 追蹤以下 3 個量化指標，作為驗證機制是否真的解問題的依據：

| 指標 | 定義 | 目標值 | 衡量方式 |
|------|------|--------|---------|
| **款項資料齊備率** | （已完成 Payment 含對帳附件且 paidAt ≠ null）/ 全部已完成 Payment | ≥ 95% | 每月底掃 Payment 表 |
| **處理中 Payment 老化率** | 處理中 Payment 中 > 7 天未切完成的比率 | ≤ 5%（基準線需先量測）| 每週掃處理中清單 |
| **OA 平均推進時間** | OA「已核可」到「已執行」的中位數天數 | 上線後不應比現狀延長超過 50%（基準線需先量測）| OA 狀態歷程 |

### 失敗條件（避免上線後各說各話）

- 若「處理中 Payment 老化率」> 20%，代表業務不切完成 → 機制失敗，需重新評估替代方案
- 若「OA 平均推進時間」延長 3 倍以上，代表業務卡關 → UX 失敗，需檢視 UI 流程
- 若「處理中變已完成的修改次數 / 已完成 Payment 數」< 10%，代表「處理中」階段沒被真實使用 → 機制冗餘，可考慮回退

### KPI 對應

建議於 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f) 新增上述 3 個 KPI 條目，Feature 欄位掛「訂單管理」。

## 參考

- [Plan: warm-nibbling-crane（Miles approved）](file:///Users/b-f-03-029/.claude/plans/warm-nibbling-crane.md)
- [refine-after-sales-refund-and-add-supplementary-print archived change](../../archive/2026-05-20-refine-after-sales-refund-and-add-supplementary-print/)
- 業界參考（senior-pm 引用）：
  - [Stripe — Payment Processing Best Practices](https://stripe.com/guides/payment-processing-best-practices)
  - [Billtrust — Modern ERP Payment Processing](https://www.billtrust.com/resources/blog/erp-payment-processing)
  - [Microsoft Learn — Reconcile a Bank Account (Dynamics 365)](https://learn.microsoft.com/en-us/dynamics365/finance/cash-bank-management/reconcile-bank-account)
