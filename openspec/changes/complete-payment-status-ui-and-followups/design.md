## Context

原 change `2026-05-22-add-payment-status-and-decouple-oa-execution`（已 archive、delta 已合併回 main spec）引入 Payment「處理中 / 已完成」雙態設計，store action 三隻（createRefundPayment / updatePayment / cancelPayment）已對齊新 spec，但 archive 時 tasks.md 留下未實作項目（§ 4.4 OrderPaymentSection 操作欄編輯按鈕、§ 4.7 已完成→處理中反向阻擋部分、§ 9 銷貨折讓弱提示、§ 10 全 14 條 e2e、§ 12 三視角審查、§ 14 KPI 設定）。導致 e2e `refund-payment-auto-execute-oa.spec.ts` 三案例失敗、業務「先填一半補齊資料」核心情境 UI 走不通。

同時原 change 留下三個新 OQ 未 resolve：[[ORD-018-處理中Payment老化追蹤機制]]（撞號待重編號）、[[ORD-019-會計處理中Payment應收應付處理]]、[[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]，與本範疇緊密相關。

商業背景參考：[ERP_Vault 付款發票邏輯卡 § 六、三方對帳](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)、[ERP_Vault 訂單實體卡 § Payment 行為摘要](../../../memory/erp/ERP_Vault/05-entities/訂單.md)。

## Goals / Non-Goals

**Goals：**
- 補完 add-payment-status-and-decouple-oa-execution 漏實作的 UI 行為規範（一般收款列表編輯入口、銷貨折讓弱提示、處理中 Payment 老化追蹤）
- Resolve 三條原 change 留下的 OQ，將決議寫入 spec 層
- 補完原 change tasks.md § 10 共 14 條 e2e 測試（含重寫 stale 失敗測試）
- 補跑三視角審查（事後審視原 change + 本次補完設計品質）
- 治理收尾：記入 audit-log + misjudgement-record 防止重犯

**Non-Goals：**
- 不重新設計 paymentStatus 雙態邏輯（原 change 已定義、本 change 沿用）
- 不修改 OA 狀態機定義（state-machines spec 不動）
- 不引入新 capability
- 不擴大老化追蹤主管看板成為獨立 Dashboard 頁（若範疇過大列為後續 change `add-aging-payments-dashboard`）
- 不整合銀行 API 自動對帳（Phase 3 進階分析期考慮）

## Decisions

### Decision 1：UI 編輯入口採用「單一編輯按鈕」而非「row 整列點擊」

**選擇：** OrderPaymentSection 列表 row 操作欄加單一「編輯」按鈕，點開 PaymentEditDialog。

**理由：**
- 與 OA 編輯介面內的 Payment Edit 兩處共用相同元件（PaymentEditPanel），業務認知一致
- ErpTable 既有設計：列表 row 通常以「操作」欄按鈕為主要 affordance（如付款計畫 row 已有 onEdit / onDelete 按鈕，line 789-794），符合 ERP 中台慣例
- row 整列點擊在 ErpTable 內未廣泛使用、需額外設計 hover 提示，認知成本較高

**Alternatives：**
- 點 row 整列展開 dialog：考慮過、但與既有 ErpTable 風格不一致，棄用
- row 加「補資料」+「切已完成」兩個 icon 分支：原 spec § 4.4 明文否決（避免多按鈕分支造成決策疲勞），棄用

### Decision 2：銷貨折讓弱提示採「二者並存」（dialog inline banner + 對帳面板 sticky）

**選擇：** 退款 Payment 切已完成事件後同時在兩處顯示提示：(a) PaymentEditDialog 切已完成成功 toast 後內嵌 banner、(b) 訂單詳情頁對帳面板下方 sticky 提示（持續可見直到對應 SalesAllowance 建立）。

**理由：**
- (a) Dialog inline 提供即時情境，業務剛切已完成、注意力在 dialog 內，看到 banner 立刻決定下一步動作
- (b) Sticky 提示處理「業務當下沒空建 SalesAllowance、離開 dialog 後忘了」情境，刷新訂單詳情頁仍能看到提示
- 兩者互補、不重複（dialog 顯示時通常還沒離開 dialog；sticky 持續顯示直到對應 SalesAllowance 建立後消失）
- 與既有對帳警示 banner（spec § 三方對帳檢視面板的 executedAt > completedAt 觸發邏輯）模式一致

**Alternatives：**
- 只放 dialog inline：考慮過、但業務關 dialog 後容易忘，棄用
- 只放對帳面板 sticky：考慮過、但 dialog 切已完成當下沒提示、業務需多刷一次頁才看到，棄用
- toast 暫時提示：考慮過、會自動消失、業務可能錯過，棄用

### Decision 3：處理中 Payment 老化閾值定為 7 天（resolve ORD-021）

**選擇：** 7 天作為老化判定閾值。

**理由：**
- 業務一般週期：客戶說「已匯款」到實際對帳單到位通常 1-3 個工作天（含週末約 5 天），7 天為合理「該追的時間點」
- 業界參考：印刷業客戶款項追蹤週期通常週對齊（每週對帳會議），7 天剛好對應一個週期
- 留有彈性：本次 Prototype 為固定 7 天、未來累積 UAT 數據後若發現過嚴（太多誤觸發）或過鬆（漏追蹤）可由 KPI「處理中 Payment 老化率」回饋調整

**Alternatives：**
- 3 天：考慮過、但對銀行對帳週期過嚴、會造成大量誤老化標記，棄用
- 14 天：考慮過、太鬆、客戶失聯一週才開始追，棄用
- 工作日計算（排除週末國定假）：考慮過、複雜度高且實務上週末客戶也可能匯款、自然日計算更直觀，初版用自然日、未來必要時再升級

### Decision 4：處理中 Payment 不入 GL 應收應付（resolve ORD-019）

**選擇：** 處理中 Payment SHALL NOT 影響 General Ledger 應收應付帳本，僅在三方對帳面板顯示為資訊軸；已完成才入帳。

**理由：**
- 會計準則：應收應付認列須有「實際交易發生」的事實依據（對帳附件），處理中 Payment 屬於業務預登記、未有事實依據，不應入帳
- 雙重保護：對帳面板顯示處理中合計（業務 / 會計可見、便於追蹤）+ GL 不入帳（避免財報虛胖）
- 業務影響：業務先建處理中不影響月結 / 季結報表正確性，會計報表只看已完成
- Prototype 階段：當前無正式 GL 系統、決策作為未來導入 GL 時的入帳邊界規範

**Alternatives：**
- 處理中也入 GL 暫掛科目：考慮過、增加會計記帳負擔、且暫掛科目沖銷邏輯複雜，棄用
- 處理中入 GL 但加標記：考慮過、混淆會計帳本「實際發生」語意，棄用

### Decision 5：取消已完成 Payment 採邏輯刪除（resolve ORD-020）

**選擇：** Payment 新增 cancelled / cancelReason / cancelledAt 三欄位，cancelPayment 對已完成 Payment 改為邏輯刪除（不從陣列移除），對處理中 Payment 維持物理刪除。

**理由：**
- 已完成 Payment 表示「實際金流已發生且對帳已過」，物理刪除會造成稽核軌跡缺失（無法回查「為什麼這筆 Payment 不見了」）
- 處理中 Payment 屬於「業務預登記未實際發生」，刪除等同於放棄此登記、無稽核需求
- 對帳 / OA 累計計算邏輯需排除 cancelled = true 的 Payment（calcOACompletedPaymentsTotal / 對帳面板收款淨額）
- UI 預設隱藏已取消 row 避免列表雜訊、提供「顯示已取消」toggle 給有需要查稽核軌跡的業務 / 會計

**Alternatives：**
- 全部物理刪除：考慮過、稽核軌跡缺失風險高，棄用
- 全部邏輯刪除：考慮過、處理中 Payment 邏輯刪除增加 UI 顯示複雜度且無實際意義，棄用

### Decision 6：本 change 範疇「凍結」原則

**選擇：** 本 change 範疇固定五項（UI 補完 + 3 OQ resolve + e2e 補完 + 三視角審查 + 治理收尾）；三視角審查若識別新漏項（> 2 個新 Requirement），獨立開新 change 處理、本 change 不擴大。

**理由：**
- 範疇控制：原 change 失敗的根因之一是「審查跳過、範疇控管失效」，本 change 不可重蹈覆轍
- 預期可控：若審查只識別 1-2 個微小 Requirement，可在本 change 補入；> 2 個則表示有更深層問題、應獨立評估

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 三視角審查事後補跑可能識別更多漏項 → 本 change 範疇可能再擴大 | Decision 6 範疇凍結原則：> 2 個新 Requirement 必獨立 change |
| 邏輯刪除引入「已取消」狀態，下游（對帳 / 報表 / KPI）可能誤計入 | e2e 覆蓋「已取消 Payment 不計入收款淨額」+「不計入 OA 累計」雙保護；vault-audit 後驗 |
| 老化追蹤 7 天閾值若實務上過嚴 / 過鬆造成業務雜訊 | KPI「處理中 Payment 老化率」追蹤、累積 1 個月 UAT 數據後決定是否調整 |
| 銷貨折讓弱提示「二者並存」可能被業務視為重複嘮叨 | 兩個提示時序不同（dialog 即時 + 對帳面板持續），實際不會同時看到；UAT 觀察業務反饋 |
| PaymentEditPanel 共用元件抽出可能影響 OA 編輯介面內既有行為 | 抽出時保留 OrderAdjustmentEditDialog 原有 props 介面、確保兩處呼叫端不需改動；e2e 覆蓋兩處行為一致 |
| OQ 撞號 ORD-018（既有 SidePanel OQ vs 老化追蹤 OQ）若不修正持續造成稽核混亂 | 本 change 重編號為 ORD-021、寫入 audit-log 治理債紀錄 |

## Migration Plan

本 change 為純前端 Prototype 異動，無資料 migration 需求（mock data 即時生效）。

### Backfill 既有 mock data
- `src/data/mockPayments.ts` 所有既有 Payment backfill：`cancelled = false`、`cancelReason = ''`、`cancelledAt = null`
- 新增 demo mock：1 筆「已取消」Payment（驗證 cancelled toggle 顯示）+ 1 筆「老化 14 天處理中」Payment（驗證老化 Badge 視覺）

### Rollback 策略
- 若 UAT 發現 UI 改動造成業務操作混亂 → revert prototype commits、spec 維持本 change 設計（未來再嘗試其他 UI 形式）
- 若三視角審查識別根本性設計問題 → 本 change 中止 archive、開新 change 處理

## Open Questions

本 change 不留新 OQ（原 change 留下的 3 個 OQ 全部本 change resolve）。

若三視角審查補跑識別新議題 → 依 Decision 6 範疇凍結原則處理。

## 三視角審查整合（補跑後填寫）

### Senior PM 視角
（待 task 6 三視角審查觸發後整合）

### CEO Reviewer 視角
（待 task 6 三視角審查觸發後整合）

### ERP Consultant 視角
（待 task 6 三視角審查觸發後整合）
