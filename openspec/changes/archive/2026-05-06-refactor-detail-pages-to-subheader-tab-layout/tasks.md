## 0. 設計反轉註記（2026-05-06）

> **重要**：本 change 經歷一次設計反轉。原 §1（ErpDetailSubHeader 元件）+ §3.5-3.7（工單 metadata 4 欄 / 進度條）+ §6.6-6.7（印件 metadata 4 欄）的實作**已完成後因設計反轉撤銷**。詳見 [design.md](openspec/changes/refactor-detail-pages-to-subheader-tab-layout/design.md) D10。
>
> **反轉後保留的成果**（commit `da60d87`）：
> - §3-§5（工單 Tabs 化）：保留 5 Tabs + defaultValue="info" + 退回原因 InfoBanner，移除 metadata 4 欄
> - §6-§8（印件 Tabs 化）：保留 7 Tabs + defaultValue="info" + 印件狀態 Badge bug 補修，移除 metadata 4 欄
> - §9（DESIGN.md）：§6.3.1 改寫為「Tabs 化詳情頁版型」（移除 Sub-header 描述）
>
> **反轉撤銷的內容**：
> - `ErpDetailSubHeader` 元件已從 `src/components/layout/` 刪除
> - WorkOrderDetail.tsx / PrintItemDetail.tsx 改回 `ErpPageHeader`（含 sticky）
> - DESIGN.md §0.1 Header 規範例外條款移除、§1.4 元件清單移除 ErpDetailSubHeader 條目
>
> 以下 task 列表的 `[x]` 標記為「實作當下完成」狀態；標 ~~strikethrough~~ 的 task 為反轉後撤銷。

## 1. ~~ErpDetailSubHeader 共用元件建置~~（設計反轉撤銷）

- [x] 1.1 建立元件檔案 `sens-erp-prototype/src/components/layout/ErpDetailSubHeader.tsx`
- [x] 1.2 定義 TypeScript Props 介面：`onBack`、`title`、`badges`、`metadata`（陣列 1–5 筆 union of tuple，元素含 `label` + `value`）、`actions`（拿掉 `backHref`，採單一 `onBack` callback 對齊既有 ErpPageHeader 模式）
- [x] 1.3 實作 rounded container DOM 結構（採 `rounded-xl border border-border bg-card`，對齊 ErpDetailCard / ErpPageHeader 視覺）
- [x] 1.4 實作返回按鈕區（左側）+ 標題區（標題 + Badge 插槽）+ 動作群（右對齊）佈局；返回按鈕視覺沿用 ErpPageHeader 既有樣式（`p-2 rounded-lg bg-[#f7f7f7]`）
- [x] 1.5 實作 metadata 列：動態 grid-cols-1~5 對應 metadata 長度，label 灰字（`text-xs text-muted-foreground`）+ value 黑字（`text-sm font-medium`）上下排列
- [x] 1.6 確保元件本身 NOT sticky（無 `position: sticky` className），註解明示與 ErpPageHeader 既有 sticky 行為差異化
- [x] 1.7 JSDoc 註解寫明：與 `ErpDetailHero` 差異化（Hero = sticky 4 欄 context-keeping、SubHeader = 不 sticky 折衷容器），並 `@see` 兩個 OpenSpec change 路徑
- [x] 1.8 加入 metadata 1–5 筆上限的 TypeScript 型別約束（採 union of readonly tuple，編譯時錯誤）

## 2. PrintItemStatusBadge 元件確認與補建

- [x] 2.1 檢查 `sens-erp-prototype/src/components/` — **既有 `src/components/shared/PrintItemStatusBadge.tsx`，狀態定義對齊 `src/utils/printItemStatus.ts` 的 7 個 PrintItemStatus 值（等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達）**
- [x] 2.2 若不存在：依 `WorkOrderStatusBadge` 結構新建 — **既有元件已涵蓋，不需新建**
- [x] 2.3 Badge 顏色不寫死 hex — **既有元件用 Tailwind preset class（如 `bg-amber-50 text-amber-700`），未寫死 hex，符合 task 形式要求；與 WorkOrderStatusBadge 用 hex 風格不一致為既有問題，不在本 change 範圍**

## 3. 工單詳情頁 Sub-header 重構

- [x] 3.1 讀取 [WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx) 既有 ErpPageHeader（line 547-620）與資訊區結構（line 622-807）
- [x] 3.2 ErpPageHeader 直接被 ErpDetailSubHeader 取代（更簡潔；模組麵包屑由 AppLayout breadcrumb prop 處理）
- [x] 3.3 工單編號、`WorkOrderTypeBadge`、`WorkOrderStatusBadge`、8 個主動作群、「異動中 — 等待生管確認」inline 訊息全數搬入 Sub-header
- [x] 3.4 ErpPageHeader import 移除（unused after refactor）；模組麵包屑沿用既有 AppLayout `breadcrumb={['工單管理', wo.workOrderNo]}`
- [x] ~~3.5 Sub-header metadata 4 欄：交期 / 完成度 / 排程進度 / 負責印務~~（設計反轉撤銷，metadata 整體取消）
- [x] ~~3.6 「排程進度」進度條：採 shadcn Progress 元件~~（設計反轉撤銷，OQ-4 自動失效）
- [x] ~~3.7 進度條 hover Tooltip~~（設計反轉撤銷）
- [x] 3.8 8 個依狀態主動作（送審 / 重新送審 / 審核通過 / 退回 / 收回工單 / 發起異動 / 填打樣結果 / 取消工單）皆在 Sub-header actions slot 正確顯示
- [x] 3.9 移除 Sub-header badges 內「已退回，需重新送審」inline 提示（避免與下方 InfoBanner 重複）

## 4. 工單詳情頁 InfoBanner 與資訊 Tab

- [x] 4.1 「退回原因提示」從資訊區（原 line 798-807）搬到 Sub-header 下方、Tabs 之上
- [x] 4.2 沿用既有紅底警告型 div（`rounded-xl border border-red-200 bg-red-50`，對齊 ui-business-rules.md Info Banner 規範）
- [x] 4.3 條件顯示邏輯保留：`wo.status === '重新確認製程' && wo.rejectReason`
- [x] 4.4 三張資訊卡（工單資訊 / 生產資訊 / 印件檔案）整段搬入新增「資訊」Tab 內
- [x] 4.5 三張卡用 `<div className="space-y-5">` 包覆，依 §0.1 工單頁順序單欄垂直排列
- [x] 4.6 三張卡保留 `ErpDetailCard` 邊框（PrintItemSpecCard / 生產資訊 InfoTable+SummaryGrid / PrintItemArtworkCard）內容不變

## 5. 工單詳情頁 Tab 結構調整

- [x] 5.1 `ErpDetailTabs` 由 4 → 5 Tabs：`資訊（NEW，首位）→ 生產任務（${wo.tasks.length}）→ QC 記錄（${wo.qcRecords.length}）→ 異動紀錄（${wo.modifications.length}）→ 活動紀錄`
- [x] 5.2 `defaultValue = "info"`
- [x] 5.3 「資訊」Tab label 為純文字「資訊」無 count badge
- [x] 5.4 其他 4 Tab.Content 內容（生產任務 / QC / 異動 / 活動）原樣保留，未動 Tab 內元件
- [x] 5.5 生產任務 Tab 內 Task 卡片 → 3 Category Tabs 巢狀結構未動
- [x] 5.6 異動紀錄 Tab 內 PT 異動快照子母 Table（外層展開 → 內層 nested table）未動；TS check 全 project 無錯誤

## 6. 印件詳情頁 Sub-header 重構

- [x] 6.1 讀取 [PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx) 既有 ErpPageHeader（line 438-459）與資訊區結構（line 461-554）
- [x] 6.2 ErpPageHeader 直接被 ErpDetailSubHeader 取代（line 438-459 → 新版 line 441-498）
- [x] 6.3 印件名稱、批次操作按鈕（清除選取 / 批次報工 / 分配印件）全數搬入 Sub-header
- [x] 6.4 **補修 bug**：在 Sub-header badges slot 加 `<PrintItemStatusBadge status={derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))} />`（既有 line 438 遺漏，違反 §0.1 規範，本 change 順手修正）
- [x] 6.5 ErpPageHeader 主流程已不用，但 fallback「查無印件」分支仍保留 ErpPageHeader（錯誤頁面不在重構範圍）
- [x] ~~6.6 Sub-header metadata 4 欄：交期 / 出貨方式 / 工單數 / 完成度~~（設計反轉撤銷，metadata 整體取消）
- [x] ~~6.7 「工單數」分母 = relatedWOs.length~~（設計反轉撤銷，OQ-5 自動失效）
- [x] 6.8 批次報工 / 清除選取 / 分配印件按鈕皆在 Sub-header actions slot 正確條件顯示

## 7. 印件詳情頁資訊 Tab

- [x] 7.1 三張資訊卡（印件資訊 / 印件檔案 / 生產資訊）整段搬入新增「資訊」Tab 內
- [x] 7.2 三張卡依 §0.1 印件頁順序「印件資訊 → 印件檔案 → 生產資訊」單欄垂直排列（用 `<div className="space-y-5">` 包覆）
- [x] 7.3 三張卡保留 `ErpDetailCard` 邊框與既有內容（PrintItemSpecCard / PrintItemArtworkCard / 生產資訊 InfoTable+SummaryGrid）

## 8. 印件詳情頁 Tab 結構調整

- [x] 8.1 `Tabs` 由 6 → 7 個：`資訊（NEW，首位）→ 審稿紀錄（${reviewRoundsCount}）→ 工單（${relatedWOs.length}）→ QC 紀錄（${piQcRecords.length}）→ 轉交單（${piTransferTickets.length}）→ 出貨單（${piShipments.length}）→ 活動紀錄（${printItemActivityEvents.length}）`
- [x] 8.2 `defaultValue = "info"`（從原動態 `reviewHistoryTabDefault` 改為固定 "info"，依 design.md D4）
- [x] 8.3 「資訊」Tab label 為純文字「資訊」無 count badge
- [x] 8.4 其他 6 個 Tab.Content（審稿 / 工單 / QC / 轉交 / 出貨 / 活動）內容原樣保留，未動 Tab 內元件
- [x] 8.5 「工單」Tab 內 4 層巢狀（印件→工單→任務→PT 3 Category Tabs）結構未動
- [x] 8.6 ReviewRoundTimeline / TransferTicketList / 其他元件未動；TS check 全 project 無錯誤；移除既有 unused 變數 `reviewHistoryTabDefault`（reactor 副作用）

## 9. DESIGN.md 規範修訂

- [x] 9.1 §0.1「印件三分類獨立 ErpDetailCard」段補「**呈現位置**」段：「三張卡可在 Tabs 之上（長捲版型）或新增『資訊』Tab 內單欄垂直排列（Sub-header + Tabs 折衷版型）呈現，依詳情頁版型決定（詳見 §6.3）；三分類獨立卡邊界規範兩種版型皆適用」
- [x] 9.2 §6.3 新增 §6.3.1 Sub-header + Tabs 折衷版型 sub-section（4 條結構規則 + 範例骨架 tsx code）
- [x] 9.3 §6.3.1 含「版型選擇判斷準則」對照表：context-keeping 強 → Sticky Hero；以 Tab 為核心操作 → Sub-header 折衷；資訊量少 / 偶爾查 → 長捲版型
- [x] 9.4 §1.4 元件清單在 ErpPageHeader 之後加 ErpDetailSubHeader 條目；§0.1「詳情頁 Header 只承載實體名稱 + 主動作」段補「例外」條款說明 ErpDetailSubHeader 可承載 4 欄 metadata

## 10. Lovable 驗收

- [ ] 10.1 commit 並 push `sens-erp-prototype` main 分支，確認 Lovable 自動部署成功
- [ ] 10.2 工單詳情頁第一屏可見性：1080p / Chrome / 100% 縮放，可同時看到 ErpPageHeader + Sub-header + Tabs 列 + 資訊 Tab 第一張卡（工單資訊卡）開頭 ≥ 200px
- [ ] 10.3 印件詳情頁第一屏可見性：同上條件，可同時看到 ErpPageHeader + Sub-header + Tabs 列 + 資訊 Tab 第一張卡（印件資訊卡）開頭 ≥ 200px
- [ ] 10.4 工單 Sub-header 4 欄 metadata 正確顯示（交期 / 完成度 / 排程進度進度條 / 負責印務），進度條 hover 有 Tooltip
- [ ] 10.5 印件 Sub-header 4 欄 metadata 正確顯示（交期 / 出貨方式 / 工單數「N 張工單」/ 完成度）
- [ ] 10.6 印件詳情頁狀態 Badge 必須顯示（補修 bug 驗證）
- [ ] 10.7 兩頁 Sub-header 不 sticky：向下捲動超過 Sub-header 高度後 Sub-header 離開視窗
- [ ] 10.8 工單 Tab 結構驗證：5 Tabs 順序正確、defaultValue = 「資訊」
- [ ] 10.9 印件 Tab 結構驗證：7 Tabs 順序正確、defaultValue = 「資訊」
- [ ] 10.10 兩頁「資訊」Tab 內三張卡邊界保留、順序符合 §0.1 規範
- [ ] 10.11 兩頁「資訊」Tab 內容高度 ≤ 1200px（避免「資訊 Tab 變雜物倉」）
- [ ] 10.12 工單退回原因 InfoBanner：狀態 = 重新確認製程時顯示紅底警告 Banner、其他狀態時隱藏
- [ ] 10.13 工單異動紀錄 Tab 的 PT 異動快照子母 Table 行為回歸驗證
- [ ] 10.14 印件「工單與生產任務」Tab 的 4 層巢狀結構行為回歸驗證
- [ ] 10.15 印件批次報工選取機制行為回歸驗證
- [ ] 10.16 工單 8 個依狀態主動作（送審 / 重新送審 / 審核通過 / 退回 / 收回工單 / 發起異動 / 填打樣結果 / 取消工單）在 Sub-header 右側正確顯示

## 11. 跨檔案稽核與收尾

- [ ] 11.1 觸發 `doc-audit` skill 檢查 [DESIGN.md](sens-erp-prototype/DESIGN.md) §0.1 / §6.3 / §1.4 修訂與 spec / 業務情境 DB / OQ DB 一致性
- [ ] 11.2 將 OQ-1（版型分裂收斂時機）/ OQ-2（印件 capability 歸屬）/ OQ-3（推廣到需求單 + 審稿）寫入 [Notion Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)，標註 Module 與 Source Change
- [ ] 11.3 更新 `/Users/b-f-03-029/Sens/CLAUDE.md` § Spec 規格檔清單：標記工單管理 v0.5 與 prototype-shared-ui 異動
- [ ] 11.4 commit 訊息格式：`refactor(refactor-detail-pages-to-subheader-tab-layout): 工單 + 印件詳情頁 Tab 化重構（Sub-header 折衷版型）`
- [ ] 11.5 驗收完成後手動執行 `/opsx:archive` 歸檔本 change，main specs 自動同步 delta 內容

## 12. 訂單詳情頁 Tabs 化（範圍擴展，依 D11）

- [x] 12.1 abandon 既有 `refactor-order-detail-to-hero-tab-layout` change（刪除目錄；該 change 為 Sticky Hero pilot 與 D10 反轉後方向衝突）
- [x] 12.2 [OrderDetail.tsx](sens-erp-prototype/src/pages/OrderDetail.tsx) 5 張資訊卡（訂單資訊 / 金額及付款狀態 / 發票設定[條件] / 物流設定[條件] / 客戶資訊）整段移入新增「資訊」Tab 內
- [x] 12.3 移除既有 `grid grid-cols-[1fr_380px]` 兩欄佈局，5 張卡單欄垂直排列（用 `<div className="space-y-5">`）
- [x] 12.4 條件邏輯保留：`order.invoiceEnabled` 控發票卡顯示；`order.shippingMethod` 控物流卡顯示
- [x] 12.5 Tabs 由 5 → 6：資訊（NEW，首位）→ 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄
- [x] 12.6 `defaultValue` 由 "printItems" 改為 "info"
- [x] 12.7 訂單資訊卡 header 內「編輯」按鈕保留（既有設計）
- [x] 12.8 ErpPageHeader 主動作不變：B2C 前台 Demo / 確認回簽（條件）/ 變更路徑導引 Tooltip / 取消訂單

## 13. 需求單詳情頁 Tabs 化（範圍擴展，依 D11）

- [x] 13.1 [QuoteDetailPage.tsx](sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx) 1 張基本資訊卡（含 StatusStepper + 主資訊欄位 + 報價金額橫排）移入新增「資訊」Tab 內
- [x] 13.2 條件性 inline banner（業務側提示 / 等待核可 / 業務主管視角對照 / 動作錯誤）位置不變（緊貼 ErpPageHeader 之下、Tabs 之上）
- [x] 13.3 Tabs 由 4 → 5：資訊（NEW，首位）→ 印件報價 → 報價紀錄（條件 hidden）→ 權限管理 → 活動紀錄
- [x] 13.4 `defaultValue` 由 "items" 改為 "info"
- [x] 13.5 ErpPageHeader 主動作（依角色 / 狀態條件顯示）不變：複製 / 編輯 / 流失 / 送印務評估 / 核可進入議價 / 一鍵確認 / 評估完成 / 成交 / 重新報價 / 建立訂單 / 重新指定主管
- [x] 13.6 Lovable commit + push（commit `dc2e8ab`）；TS check 全 project 無錯誤

## 14. 範圍擴展後驗證項補充

- [ ] 14.1 訂單頁第一屏：可同時看到 ErpPageHeader + Tabs 列 + 資訊 Tab 第一張卡（訂單資訊）開頭 ≥ 200px
- [ ] 14.2 訂單頁 6 Tabs 順序正確、defaultValue="info"
- [ ] 14.3 訂單頁「資訊」Tab 內 5 張卡邊界保留、順序符合（訂單資訊 → 金額 → 發票 → 物流 → 客戶）
- [ ] 14.4 訂單頁「資訊」Tab 內容高度（1500px 以下，因含發票/物流條件性卡放寬閾值）
- [ ] 14.5 訂單頁發票 / 物流卡條件顯示（測試帶 `invoiceEnabled=false` 與 `shippingMethod=''` 訂單）
- [ ] 14.6 訂單頁 ErpPageHeader 主動作（B2C / 確認回簽 / 變更路徑 / 取消訂單）正確顯示
- [ ] 14.7 需求單頁第一屏：可同時看到 ErpPageHeader + 條件 banner（如有）+ Tabs 列 + 資訊 Tab 內基本資訊卡開頭
- [ ] 14.8 需求單頁 5 Tabs 順序正確、defaultValue="info"、報價紀錄 Tab 條件 hidden 行為不變
- [ ] 14.9 需求單頁條件 inline banner（業務側提示 / 等待核可 / 業務主管對照 / 錯誤）位置正確（緊貼 Header）
- [ ] 14.10 需求單頁 ErpPageHeader 主動作依角色 / 狀態條件顯示正確
