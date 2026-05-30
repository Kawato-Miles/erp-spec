---
type: meta
status: active
last-reviewed: 2026-05-30
---

# 商業邏輯卡迭代日誌（Changelog）

> 商業邏輯正本卡的迭代史集中於此，讓正本卡正文只留當前生效規則（依 [[business-logic-writing-guide]] 原則 5）。
>
> **組織方式**：以「卡」為主鍵分節，每節反向時序（最新在上）。
> **agent 反查**：找某卡的變更 → 該卡 section；找某 change 影響哪些卡 → 全檔 grep change-id 跨 section 聚合。
> **每筆格式**：日期 +（change-id）+ 一句話變更 + 動機。
> **雙向連結**：本檔每節「→ 正本卡 [[卡名]]」（史→卡）；正本卡「來源」段指向本檔對應 section（卡→史）。

## Wiki 結構與撰寫規範（wiki-architecture）
→ 正本卡：[[wiki-architecture]]

- **2026-05-31**（規範定案）：[[wiki-architecture]] 由 draft 轉 active，並精簡為純規範文件（移除一次性專案計畫與過程性紀錄）。本次拍板含下列決議：operating-principles 初版定 2 條（① 現金流出須把關 ② 彈性優先、事後對帳兜底）；source-gap 採漸進回填策略（試點兩主題回填、其餘排專輪、新卡與被 change 異動的卡優先補，既有 `related-spec` 過渡期保留為 `implemented-by` 弱版）；既有 `#R1` 連結位置一次性遷移為業務語意命名並由 lint 偵測斷鏈兜底；`implemented-by` 不強制（允許留空＝待實作）；`04-business-logic/對帳一致性.md` 採「帶實例階段建」（待具體數字實例可填時動筆，不空殼佔位）；營運原則層沿用既有 `product-vision` type、不新增 `operating-principle` type。動機：把「文件管理規範」與「過程性專案紀錄」分離，讓本卡只留永久性的卡片撰寫規範，拍板過程改記於本日誌。

## 訂單異動規則
→ 正本卡：[[訂單異動規則]]

- **2026-05-30**（原子化拆分，依 [[business-logic-writing-guide]] 原則 6）：新建訂單異動規則正本卡，作為補收／退款不對稱分權、已執行認列與回退、應收重算公式、一致性條件的單一正本（Single Source of Truth）。動機：同一套規則原本同時散在 [[訂單異動狀態]] §一二三、[[售後服務]]、[[訂單]] 三處（已執行一致性條件三份重複定義），改一處漏其他處造成版本漂移；改為本卡寫完整規則、三處 wiki link 引用。本卡正文只收當前生效規則，規則背後各 change 的演進史見 [[business-logic-changelog#訂單異動狀態]]（狀態與規則同源迭代）。

## 訂單異動狀態
→ 正本卡：[[訂單異動狀態]]

- **2026-05-30**（`converge-consultation-cancel-to-order-cancel-flow`）：諮詢取消退費異動單由「系統建直接已執行」改為「系統建已核可」（核可人＝系統、執行時間初始為空），沿用一般退款「款項到位才推進已執行」機制。動機：既有「一建即已執行」會鎖死退款金額（業務無法調整）並配「處理中」退款款項，破壞「已執行必有已完成款項累計達金額」一致性條件；改建已核可同時滿足系統免人工審核、業務仍可調整金額、修補一致性破洞。
- **2026-05-28**（`unify-billing-installment-and-reconciliation-csv`）：建立補收／退款不對稱分權（補收正項略過審核直達已執行、退款負項沿用主管核可路徑），新增 requires_supervisor_approval 派生欄位決定路徑。同時廢止「業務／諮詢變更付款計畫 → 訂單回業務主管審核」規則：請款期次變更改寫活動紀錄（OrderActivityLog）與 change_count 派生欄位，訂單狀態不回退；事後稽核改走三管道（CEO 指標「期次變更次數」+ Slack 大額補收通知 + 活動紀錄軌跡）。詳見 [[分期請款狀態]]。
- **2026-05-21**（`add-payment-status-and-decouple-oa-execution`）：「已執行」推進條件改為綁關聯款項累計達金額，新增取消已完成款項致累計不足時自動回退已核可的機制（resolve ORD-003）。「執行」由業務手動觸發改為系統自動觸發。
- **（`add-after-sales-ticket`）**：廢止異動單「雙重身份」設計，移除 adjustment_phase 欄位，所有異動類型可於任何訂單狀態下建立；原「訂單完成後售後」情境改由售後服務單承載。新增 linked_after_sales_ticket_id 欄位標示異動單來源（訂單期間直建／售後單內建），兩者共用同一狀態機。

## 分期請款狀態
→ 正本卡：[[分期請款狀態]]

- **2026-05-28**（`unify-billing-installment-and-reconciliation-csv`）：請款期次（BillingInstallment）作為單一規劃實體上線，合併並取代原本分頭維護的付款計畫（PaymentPlan）與待開發票（PlannedInvoice）兩個實體。
  - 收款進度（payment_status）取代原付款計畫狀態（未收 / 部分收款 / 已收訖三態）；推導過濾條件改為「未取消且已完成的核銷明細（PaymentAllocation）」。
  - 開票進度（invoicing_status：未開立 / 已開立 / 已作廢）取代原待開發票狀態（預計開立 / 已開立 / 已取消），對應換算為：預計開立 → 未開立、已開立 → 已開立、已取消 → 期次標記取消；並新增「已作廢」狀態承接發票作廢觸發的開票進度回退（原待開發票設計無此態）。
  - 廢止 v1.13 規則「業務 / 諮詢變更已建立的付款計畫觸發訂單回到『業務主管審核』狀態」；改為記操作軌跡（OrderActivityLog）+ 累計變更次數，訂單狀態不回退，事後稽核走變更次數指標 + 操作軌跡。詳見 [[訂單異動狀態]]。
