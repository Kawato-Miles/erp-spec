## Context

本 change 在序列協作 4 階段完成後立案：
- Phase 1 PM 釐清範疇（13 業務情境全可走通、8 個隱含假設、8 個 OQ 候選）
- Phase 2 CEO 提 9 觀測指標 + 6 條反向 challenge
- Phase 3 顧問五層實作設計 + 7 條反向 challenge + 7 個新 OQ-BI
- Phase 4 PM 收斂匯報（13 條 challenge 全採納、9 砍掉項、16 OQ 整合）
- Miles Phase 4 後拍板 4 個關鍵 OQ + 補充 2 個新 KPI（訂單收款變更率、收款逾期天數）

業界對照：NetSuite SuiteBilling 採「Billing Schedule + 一對一映射至 revenue element」模式，發票直接從排程生成；SAP S/4HANA Installment Plan + Billing Plan 同理。HighRadius Cash Application 業界主流是「自動配對 + 業務手動 override + 保留 audit trail」。本 change 對齊上述業界範式。

現況痛點：
- 規劃層 PaymentPlan + PlannedInvoice 雙實體高度重疊（情境檔提到 PaymentPlan 原本帶 expected_invoice_date，後被抽出成獨立 PlannedInvoice，造成雙頭維護）
- 事實層四組手動關聯（Payment↔PaymentPlan / Payment↔Invoice junction / PlannedInvoice↔Invoice / SalesAllowance↔Payment）
- 缺財務對帳 CSV，月結對帳依賴 Excel 人工拼湊
- 對帳 CSV 暴露結構性張力：發票（事實層）與應收計畫（規劃層）N:M 解耦，無法穩定地把「應收日 + 備註」對應到單張發票

商業背景依據：
- [Vault 業務邏輯卡](../../../memory/erp/ERP_Vault/04-business-logic/) — 請款 / 對帳邏輯
- [Vault 實體卡](../../../memory/erp/ERP_Vault/05-entities/) — PaymentPlan / PlannedInvoice / Invoice / Payment / SalesAllowance / OrderAdjustment 既有定義
- [Vault 角色卡](../../../memory/erp/ERP_Vault/03-roles/) — 業務 / 業務主管 / 諮詢 / 會計責任
- [探索計畫 csv-wobbly-liskov](/Users/b-f-03-029/.claude/plans/csv-wobbly-liskov.md) — 13 拍板決策、三條操作流、CSV 14 欄定稿

## Goals / Non-Goals

**Goals**：
- 規劃層合併：BillingInstallment 取代 PaymentPlan + PlannedInvoice 雙頭維護，業務一次建期次即含應收日 / 預計開票日 / 金額 / 品項 / 備註 / 雙維度狀態
- 期次↔發票 1:1 嚴格約束：發票自帶應收日（繼承來源期次），CSV 14 欄資料對齊無歧義
- 事實層自動分配：PaymentAllocation「依序填滿 + 業務手動覆寫」取代手動 junction 勾選
- 補退操作不對稱：補收進期次（正向核銷）/ 退款不進期次（OA + 折讓/作廢路徑），對齊台灣印刷業實務分權
- 異動審核簡化：僅退款負項需業務主管核可（補收正項免審 + 廢止付款計畫變更回審）
- 期次變更稽核軌跡：原始日期凍結基準 + 變更歷史 + 「原始 vs 現況」對照 + 變更次數，避免業務一直改
- 對帳 CSV：14 欄一列 = 一張已開立發票，會計月結對帳閉環

**Non-Goals**（依 Phase 4 PM 透明化過濾決策）：
- 跨訂單匯款對帳（Notion F9，走人工處理）
- 重新報價 / 重開報價單（屬需求單議價階段）
- 多期合期開一張發票（違反 1:1 核心約束、保留為 OQ）
- 既有 PaymentPlan + PlannedInvoice 資料 Migration（依 prototype-stage-context § 二，前系統視為遷移前歷史基準）
- EC 同步（Phase 2 範疇）
- Dashboard / KPI 視覺化（dashboard-deferred 原則）
- 作廢發票列入 CSV（預設不列，OQ 待會計實務反饋）
- 老化處理中 Payment 主管看板（v1.12 已 archive 改 csv 匯出）
- 月結閉檔批次「真鎖 PaymentAllocation」（顧問建議延遲導入，本 change locked_by_period_close 預設 false）

## Decisions

### D1：規劃層合併為 BillingInstallment（vs 維持雙實體）

**選擇**：合併 PaymentPlan + PlannedInvoice 為單一 BillingInstallment。

**理由**：
- 業界範式對齊（NetSuite SuiteBilling / SAP Billing Schedule 用單一 billing schedule 統一規劃，無雙實體）
- 痛點根因：雙實體高度重疊（PaymentPlan 管「錢何時收」、PlannedInvoice 管「票何時開」），業務要分別維護兩套時程造成同步成本
- CEO 指標 3「建立單一期次操作步數」直接量測收斂效果（baseline ≥ 8 次 → 重構後 ≤ 4 次）

**Alternatives 評估**：
- (X) 維持雙實體只改 UI 整合：表面簡化但底層仍有雙頭同步成本，business 對帳 CSV 的「應收日繼承發票」邏輯仍無乾淨來源
- (X) 完全砍 PlannedInvoice 只留 PaymentPlan：失去「發票排程」語意，諮詢取消半額退費自動建提醒功能無載體

### D2：期次↔發票 1:1 + 拆票=拆期 + 純追溯欄位

**選擇**：期次↔發票嚴格 1:1（Invoice.source_billing_installment_id NOT NULL UNIQUE FK），拆票 = 拆期，保留 split_from_installment_id 純追溯欄位（非 aggregation FK）。

**理由**：
- 1:1 約束讓「每張發票有唯一應收日 / 備註 / 來源期次」，CSV 第 6 / 9 欄資料對齊
- 拆票=拆期：拆票時連期次一起拆（多數真實情境 F2/F3/F6 都是「拆票=同時拆期請款」業務直覺），避免「一期多票」的應收日歸屬歧義
- 「無父子 FK」原意（Miles 拍板）= 拆完無 aggregation 級別父子關係（兩筆新期次平輩、可獨立 query），但保留 split_from_installment_id 純追溯欄位用於 CSV 諮詢取消半額退費的 lineage 稽核（顧問 C-PM-1 + CEO Challenge 3）
- Miles Phase 4 後拍板採 A：保留 split_from_installment_id + 配合 ActivityLog 7 事件 + 業務手動備注 + change_count 三管道稽核

**Alternatives 評估**：
- (X) N:M（一期多票 / 多期合票）：彈性最高但破壞 CSV 14 欄資料對齊
- (X) 徹底不留任何反向指針：CSV 諮詢取消半額退費追溯需另用 source_type 標籤拼湊（顧問 Challenge 3 指出此風險）
- (X) 父子 FK 結構：原期次成 parent、新期次成 child，aggregation 時要 sum 至 parent，違反 Miles「平輩無父子」原意

### D3：PaymentAllocation 取代 PaymentInvoice junction（依序填滿 + diff-based 手動覆寫判定）

**選擇**：
- 新實體 PaymentAllocation（payment_id + billing_installment_id + allocated_amount + auto_allocated + manually_overridden + locked_by_period_close）
- 預設「依序填滿（依 due_date 早→晚）」+ 業務可手動覆寫
- manually_overridden 採 diff-based 判定（最終 allocated_amount ≠ 依序填滿初次值才算）
- UI 即時校驗 sum = abs(Payment.amount) + 「自動回填差額」按鈕

**理由**：
- HighRadius 業界主流模式（自動配對 + 業務手動 override + ActivityLog 留軌跡），不採鎖死
- 依序填滿覆蓋 80% 場景（一期一票一款情境 A），業務手動覆寫處理 B2B+B2C 拆票（情境 3）+ 客戶口頭指定（情境 C1/C2）等少數情境
- diff-based 判定避免 false positive（業務點輸入框但沒實際改值不算 overridden），CEO 指標 5「手動覆寫率」可信
- 即時校驗 + 自動回填避免業務手滑致 sum ≠ 實收的事實層級錯誤（CEO Challenge 6）

**Alternatives 評估**：
- (X) 比例平攤（如實收 4000 → 期1 3000 / 期2 2000 按 3:2 拆 2400/1600）：兩期都變半吊子，不符實務直覺
- (X) 全手動填值（業務逐筆填每期金額）：沿用現況痛點，未簡化
- (X) PaymentAllocation 切已完成立即鎖死：業務「Payment 切已完成才發現分配錯」無修正路徑，業界做法是留軌跡可調

### D4：補收 OA 跳過審核中間態 + 退款 OA 沿用主管核可（對稱性破壞但語意分流）

**選擇**：
- 補收（正項）：requires_supervisor_approval = false derived，OA 跳過「待主管審核」中間態直達「已執行」，不綁 Payment 切已完成（Phase 1 假設 4 修正為 CEO Challenge 2 建議方向）
- 退款（負項）：requires_supervisor_approval = true derived，沿用 v1.13 主管核可 + 退款 Payment 切已完成累計達 OA.amount 才推進「已執行」
- 補收 OA 大額閾值監督（建議起始 50000）：超閾值 ActivityLog 紅標 + Slack 通知主管事後監督，閾值列 OQ-BI-4

**理由**：
- 對齊台灣印刷業實務：主管把關現金流出方向（退款）、不把關客戶下單追加方向（補收）
- 補收業務情境（加印追加、加運費、急件費、補退正項）本質是「客戶下訂單追加」的延續，業務本人扛責任，不需主管 gate
- 退款是「公司現金流出」必須雙重把關，主管核可機制保留
- Phase 1 假設 4「免審只取消主管 gate、OA 已執行仍綁 Payment」與 Phase 1 操作流補收 A.1「直接執行 → 應收 +N」（沒等收款）矛盾。本 design 採 CEO Challenge 2 澄清版：補收 OA 跳過全部審核中間態直達「已執行」、應收 +N 立即認列、收款後續獨立

**Alternatives 評估**：
- (X) 補收也沿用主管核可：保留對稱性但拖慢業務操作（業務想立即執行的補收要等主管）
- (X) 退款也免審：失去現金流出把關，責任歸屬模糊
- (X) 補收 OA 跳過審核但仍綁 Payment 已完成才認列應收：Phase 1 假設 4 原寫法，與操作流自相矛盾

### D5：廢止「付款計畫變更觸發回審」改為留軌跡（廢止 order-management spec L951）

**選擇**：BillingInstallment 變更（新增 / 修改 / 拆期）**不再觸發訂單回業務主管審核**，改為 ActivityLog 留軌跡 + change_count derived 供事後稽核。

**理由**：
- Miles 拍板「拆期不需審核」「期次有異動都要紀錄」
- 「回審」屬於事前主管 gate，與「事後稽核」是不同機制，Miles 選擇後者降低業務操作摩擦
- 變更次數（CEO 指標 4）+ Slack 通知主管（補收 OA 大額閾值）+ ActivityLog 完整軌跡，三管道共同稽核業務操作穩定性

**Alternatives 評估**：
- (X) 沿用既有「付款計畫變更回審」：業務每次調整期次都要等主管，違反「業務需求變動性質：流程節點調整單模組內」屬輕量範圍
- (X) 部分變更才回審（如金額變更回審、日期變更不回審）：規則過於複雜，業務難以記住

### D6：期次雙維度狀態（開票/收款獨立）

**選擇**：BillingInstallment 兩個狀態維度互相獨立：
- 開票維度（invoicing_status）：未開立 → 已開立 → 已作廢回未開立（可重新開票）
- 收款維度（payment_status，derived）：未收 → 部分收款 → 已收訖（推導自未取消已完成 PaymentAllocation 累計）

**理由**：
- 沿用 v1.13 spec L1144「先開後收、後收先開」彈性
- 13 情境覆蓋：C2 申請後付款（先開後收）+ F1 預開發票（先收後開）+ F4/F7 作廢重開（開票維度回退、收款維度不動）

**Alternatives 評估**：
- (X) 單維度狀態（包含開票 + 收款）：違背先收後開實務、無法表達「已收訖但未開票」中間態

### D7：source_type 拆三個 enum 值（Miles 拍板）

**選擇**：source_type enum 五值：`manual` / `consultation_cancellation` / `consultation_end_no_production` / `quote_lost` / `installment_split`

**理由**：
- Miles 拍板諮詢三情境拆三個語意精確 enum 值（OQ-BI-1 答案 B）
- 後續報表查詢可精準區分「諮詢取消（半額退費）」vs「諮詢結束不做大貨」vs「需求單流失」三種背景

**Alternatives 評估**：
- (X) 共用一值 consultation_cancellation：諮詢結束不做大貨（不是取消）與需求單流失（非客戶取消是業務流失）語意混淆

### D8：月結閉檔 PaymentAllocation 鎖死延遲導入

**選擇**：locked_by_period_close 欄位納入 PaymentAllocation 結構，**Phase 1 階段預設 false 不主動鎖**；月結閉檔批次機制本身列 OQ-BI-2 後續 change 處理。

**理由**：
- 顧問建議延遲導入（Phase 1 無正式月結 GL 系統，月結批次與會計實務操作流程需 Miles 拉會計確認觸發者與時點）
- 沿用既有 ORD-019 處理中 Payment 應收應付處理邊界規範
- 本 change 階段 PaymentAllocation 切「已完成」後仍可調整、留 ActivityLog 軌跡（PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE 事件型別）

**Alternatives 評估**：
- (X) Phase 1 立即實作月結閉檔批次：跨範疇 + 缺會計實務確認時點 + 跨模組整合複雜度高
- (X) 不留 locked_by_period_close 欄位：未來導入 GL 時還要 schema migration

### D9：對帳 CSV 主軸 = 已開立發票（vs 期次/收款紀錄）

**選擇**：CSV 一列 = 一張已開立發票（Miles 拍板）。已開立發票繼承來源期次的應收日 + 備註（透過 source_billing_installment_id FK）。

**理由**：
- 業界 AR aging report 標準（QuickBooks / HighRadius / SAP / NetSuite 都以發票為一列）
- 期次↔發票 1:1 約束讓「應收日 + 備註」對單張發票唯一可繼承
- 「未開立」期次不出現在對帳 CSV（由現有 PendingInvoices 視圖負責「該開未開」追蹤）
- 14 欄定稿：帳務公司 / 發票號碼 / 訂單編號 / 案名 / 開立日期 / 應收日期 / 客戶名稱 / 總金額(含稅，發票面額) / 備註 / 收款日期 / 收款狀態 / 業務名稱 / 開立日期月底 / 天數(應收日−開立日)

**Alternatives 評估**：
- (X) 一列 = 一期請款（含未開票）：能追蹤「該開未開」但與業界 AR aging 慣例違背 + 已開發票場景重複
- (X) 一列 = 一筆收款紀錄：對帳收款流水最精確但一發票多收款拆多列、未收發票不出現，違反月結對帳需求

## KPI 對齊（採納 CEO + Miles 補充共 11 個指標）

| 層級 | 指標 | 量測公式 | 健康範圍 | 連結 |
|------|------|---------|---------|------|
| **NSM 補強** | ①訂單款項操作時間中位數 | median(EOM(last_paid_at) - order_in_production_at) | ≤ 45 天 | 對齊 [NetSuite AR Dashboard](https://www.netsuite.com/portal/resource/articles/accounting/accounts-receivable-ar-dashboard.shtml) DSO benchmark |
| | ②三方對帳差錯訂單數 / 月 | count(orders where 應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額) limited to Order.status = 已完成 | ≤ 1% | 對齊 [HighRadius § Match Rate](https://www.highradius.com/resources/ebooks/ar-metrics-every-finance-executive-must-track/) |
| **營運** | ③建立單一期次操作步數 | UI interaction log 統計 | baseline ≥ 8 次 → ≤ 4 次 | 重構直接成效 |
| | ④期次變更次數 per-installment 平均 | sum(BillingInstallment.change_count) / count(BillingInstallment) by order | 健康 ≤ 1.5 / 警示 1.5-3 / 異常 ≥ 3 | Miles 拍板「避免業務一直改」+ 顧問 C-CEO-3 修正 |
| | ⑤收款核銷業務手動覆寫率（diff-based）| sum(PaymentAllocation where manually_overridden = true) / sum(all) by month | 健康 ≤ 20% / 警示 21-40% / 異常 ≥ 41% | 對齊 [HighRadius § Payment Error Rate](https://www.highradius.com/resources/ebooks/ar-metrics-every-finance-executive-must-track/) |
| | ⑥CSV 對帳匯出頻率 + 會計使用反饋 | 月匯出次數 + 對帳完成率 | 月匯出 ≥ 1 + 完成率 ≥ 95% | 會計閉環驗證 |
| **模組級** | ⑦退款 OA 審核 SLA | median(approved_at - created_at) | ≤ 8 小時 | 補收免審後驗證主管不成瓶頸 |
| | ⑧拆票兩條路徑使用分佈 | 規劃階段 vs 動態 Dialog 兩條路徑各自次數比 | 觀測用無閾值 | Phase 1 假設 3 事實驗證 |
| | ⑨諮詢取消退款 Payment 處理中→已完成中位時間 | median(completed_at - created_at) | ≤ 5 工作天 | 沿用 v1.10 半額退費流程 |
| **Miles 補充** | **⑩訂單收款變更率** | count(Payment 修改事件 + PaymentAllocation 修改事件 by order) / count(訂單下總 Payment) | 待累積實務數據後校準 | Miles 補充指標，搭配 ④ 整體稽核業務對訂單掌控度 |
| | **⑪收款逾期天數** | BillingInstallment.overdue_days = TODAY − due_date for payment_status ≠ 已收訖 | sum 全訂單最長逾期天數作為訂單帳齡（沿用 v1.13 spec L1609 既有設計） | Miles 補充指標，沿用既有 overdue_days |

**⑩ 訂單收款變更率定義**：
- 計算範圍：每張訂單的 BillingInstallment + PaymentAllocation 兩類修改事件
- 修改事件涵蓋：BILLING_INSTALLMENT_CREATED 不計入（建立）+ DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED + SPLIT + CANCELLED + PAYMENT_ALLOCATION_OVERRIDDEN + PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE
- 公式：`sum(訂單下所有修改事件次數) / count(訂單下總 Payment 數)`
- 與指標 ④ 期次變更次數差異：④ 是「期次層級」變更頻率、⑩ 是「訂單層級」整體收款相關修改頻率（含期次 + PaymentAllocation 兩類）

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 補收 OA 免主管核可，業務手滑或惡意建錯（如 +20000 變 +200000） | 大額閾值監督機制（建議起始 50000）：超閾值 ActivityLog 紅標 + Slack 通知主管事後監督，閾值列 OQ-BI-4 待 Miles 拍板實務值；月結批次跑指標 2「三方對帳差錯訂單數」自動產警示清單供會計檢視（採 CEO Challenge 1 (c) 路徑） |
| split_from_installment_id 純追溯欄位可能與「無父子 FK」原意有落差 | Miles Phase 4 後已拍板採 A 保留純追溯欄位（OQ-BI-5 答案）+ 配合 ActivityLog 7 事件 + 業務手動備注 + change_count 三管道稽核 |
| 依序填滿預設邏輯不符實務直覺 | diff-based 量測手動覆寫率（CEO 指標 5），> 41% 警示時觸發規則重新設計（如改為依金額大小 / 業務指定優先） |
| PaymentAllocation 切已完成不鎖死 → 資料完整性風險 | (a) ActivityLog 留軌跡（PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE 事件） (b) 月結批次跑完設 locked_by_period_close = true（延遲導入、OQ-BI-2 待定）|
| 期次↔發票 1:1 嚴格約束破壞「多期合票」彈性 | (a) Miles 拍板 1:1 為主軸 (b) 合期屬罕見反向操作（OQ-BI-E 待 Miles 決定是否擴充）(c) 大多數真實情境（13 中 11 個）天然是 1:1 |
| BillingInstallment 雙維度狀態增加業務認知成本 | UI 同時呈現兩維度 + 「先收後開」case banner 提示（apply 階段 UX 設計）|
| CSV 14 欄會計實務驗證缺失 | CEO Challenge 5 採納為 OQ-CSV-1「上線前需驗證」，prototype 階段先依探索結論定稿 |
| 期次規劃 invariant（應收 = Σ BillingInstallment）違反時的處理 | 對帳檢視顯示警示 banner「OA 已執行 N 元、但未對應期次規劃」+ action button「建立期次」（顧問 C-PM-2 採納） |
| 補收訂單完成前後分容器（OA 直接 vs 透過 AfterSalesTicket）的業務記憶負擔 | 既有 after-sales-ticket spec 已明定路徑分水嶺；UX 上業務只看到「售後服務」入口（Ticket 容器），不需業務記憶分水嶺規則 |

## Migration Plan

**Prototype 階段移除舊實體**：
- 直接從 `src/types/` 移除 `paymentPlan.ts` / `plannedInvoice.ts` 的 PaymentPlan + PlannedInvoice + PaymentInvoice junction（依 [prototype-stage-context](../../../memory/erp/ERP_Vault/00-meta/scope-boundary.md) § 二「資料遷移成本不納入新系統設計」）
- 既有 `mockPaymentPlans.ts` / `mockPlannedInvoices.ts` / `mockInvoices.ts` 內的 mock 資料一次性 backfill 轉換為 BillingInstallment + PaymentAllocation
- backfill 規則：
  - 既有 PaymentPlan + PlannedInvoice 對應同訂單同期次者：合併為 BillingInstallment
  - 既有 PaymentInvoice junction 轉換為 PaymentAllocation（保留原 amount + 補 auto_allocated = false / manually_overridden = false / locked_by_period_close = false）
  - 既有 PlannedInvoice 已連結 Invoice 者：BillingInstallment.linked_invoice_id 沿用 + Invoice.source_billing_installment_id 補寫
  - source_type 預設 = manual
  - original_due_date / original_expected_invoice_date 用 backfill 時點凍結（屬「歷史資料近似值」）

**Apply 階段重構順序**：
1. 型別層重構（BillingInstallment + PaymentAllocation + OrderActivityLog 擴充事件型別）
2. Store 層重構（核銷分配 helper + 拆期 action + 期次變更留痕 + 補收 OA 立即執行）
3. UI 層整合（OrderPaymentSection / OrderInvoiceSection / OrderReconciliationPanel + 新元件）
4. Mock 資料 backfill
5. Playwright e2e（13 業務情境 + 三方對帳 invariant + CSV 14 欄輸出 + 補退操作流五條）

**回滾策略**：本 change 為 Prototype 階段重構，無正式上線、不涉及客戶資料。若 apply 階段發現結構性問題，可從 git 回退至 v1.13 既有架構（PaymentPlan + PlannedInvoice + PaymentInvoice junction）。

## Open Questions

Phase 4 PM 整合 16 OQ，扣除 Miles 已拍板的 3 個（BI-5 拆期 lineage / US-1 user story 範疇 / BI-1 source_type enum）+ 已關閉的 BI-F（既有資料 Migration） = 12 個開放 OQ + 1 個 OQ-CSV-1 = 13 個開放 OQ。

**設計層 OQ（5 個，影響 spec / implementation）**：

1. **OQ-BI-A 原始日期基準凍結時點**：首次儲存當下 vs 訂單某次審核通過當下？
   - 影響：「原始 vs 現況」對照的基準語意 + 諮詢訂單 / 線上訂單沒有「審核通過」節點如何處理
   - PM 假設首次儲存當下凍結；待 Miles 拍板

2. **OQ-BI-B 折讓後「已收訖」判定基準**：發票面額 vs 折讓後淨額？
   - 影響：CSV #11 收款狀態欄推導邏輯 + 期次收款維度推進條件
   - 傾向折讓後淨額（業界主流）；待 Miles 拍板

3. **OQ-BI-C 溢收「預收（未分配）」後續處理**：日後核銷新期次 / 退款 / 兩者皆可？
   - 影響：對帳 CSV 是否列「未分配預收」 + 期次列表是否顯示「可從預收核銷」按鈕
   - 待 Miles 拍板

4. **OQ-BI-D CSV #10 收款日**：一張發票經多次部分收款時取最近收款 / 結清日？
   - 影響：CSV 第 10 欄語意 + 部分收款發票的呈現方式
   - 待 Miles 拍板

5. **OQ-BI-E 「多期合期開一張發票」（合期）是否支援**：1:1 模型下預設不支援
   - 影響：1:1 模型一致性 vs 業界邊緣情境覆蓋率
   - 預設不支援，待 Miles 決定未來是否擴充

**實作層 OQ（5 個，影響 apply / 後續 change）**：

6. **OQ-BI-2 月結閉檔批次觸發者與時點**：會計手動觸發 / 定時批次（每月 1 日 00:00）？
   - 影響：CEO Challenge 4 延遲導入機制落地（後續 change 處理）
   - 待 Miles 拉會計確認

7. **OQ-BI-3 預收（未分配）桶後續處理路徑**：與 OQ-BI-C 同議題（重複，整合為 OQ-BI-C）
   - 標記重複，不另開檔

8. **OQ-BI-4 補收 OA 大額閾值定義**：建議起始 50000
   - 影響：補收 OA 免主管核可的事後監督機制
   - 待 Miles 拍板實務值

9. **OQ-CSV-1 CSV 14 欄會計實務驗證**：標記「上線前需驗證」
   - 影響：CSV 欄位順序 / 格式 / 編碼是否符合 SENS 會計實務
   - prototype 階段先依探索結論定稿，上線前需與會計確認

10. **OQ-US-2 補收 OA「立即執行」與「Payment 切已完成才推進已執行」既有規則的相容性**：
    - 顧問 D4 採納 CEO Challenge 2「補收 OA 跳過全部審核中間態直達已執行、不綁 Payment」
    - 與既有 v1.13 spec「退款 OA 已執行綁 Payment 切已完成累計達 OA.amount」形成對稱破壞
    - 待 Phase 4 PM 確認對稱破壞的 spec 表述（補收 OA 與退款 OA 兩條獨立 invariant）

**收尾 / 文件層 OQ（3 個）**：

11. **OQ-BI-G 作廢發票是否提供篩選選項列入 CSV**：預設不列 / 待會計實務反饋
    - 影響：CSV 篩選 UI

12. **OQ-US-1B Phase 4 新增情境 user story 是否包含 F1 邊界全鏈路**：採顧問 C-PM-4 採納為 user story 範疇後 Miles 已拍板「13 情境 + Phase 4 新增全覆蓋」
    - 影響：user story 撰寫工作量
    - Miles 已拍板，本 OQ 標記為「已決定」不需另開檔

13. **OQ-BI-H 三方對帳警示 banner 觸發條件細化**：顧問 C-PM-2 採納「應收 ≠ Σ BillingInstallment scheduled」時警示
    - 影響：警示時機 + UX 文案
    - 待 apply 階段細化

**已 Miles 拍板（3 個 OQ 標記為已決定）**：
- OQ-BI-5 拆期 lineage = A 保留 split_from_installment_id 純追溯欄位
- OQ-US-1 user story 範疇 = 13 情境 + Phase 4 新增全覆蓋
- OQ-BI-1 source_type enum = 拆三個值（consultation_cancellation / consultation_end_no_production / quote_lost）

**已關閉（1 個 OQ）**：
- OQ-BI-F 既有資料 Migration = 不展開（依 prototype-stage-context § 二，前系統視為遷移前歷史基準）

---

業界參考：
- [NetSuite SuiteBilling Subscription Billing Guide](https://www.netsuite.com/portal/products/erp/financial-management/billing.shtml)
- [SAP S/4HANA Installment Plan Creation](https://learning.sap.com/courses/sap-s-4hana-cloud-for-contract-accounting-invoicing/creating-an-installment-plan)
- [HighRadius Cash Application Process Guide](https://www.highradius.com/resources/Blog/cash-application/)
- [HighRadius 13 AR KPI Metrics](https://www.highradius.com/resources/ebooks/ar-metrics-every-finance-executive-must-track/)
- [Emagia Unapplied Payment Definition](https://www.emagia.com/resources/glossary/unapplied-payment/)
- [Microsoft Dynamics 365 Finance General Ledger Period Close](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/close-general-ledger-at-period-end)
- [GoBD-Compliant ERP Audit Trail](https://erp-software.org/en/glossary/audit-trail/)
