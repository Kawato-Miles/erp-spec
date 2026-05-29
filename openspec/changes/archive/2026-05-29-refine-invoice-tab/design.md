## Context

訂單詳情頁發票 Tab 的呈現優化（事後封存，prototype 已實作 commit `7dfe8d6` + `fc99368`）。本 change 記錄純 UI 呈現的設計決策，不涉及業務規則 / 實體 / 狀態機 / 角色。背景見 [proposal.md](./proposal.md) 與 [付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)。

現況痛點：發票列表手寫展開塞滿六類資訊（資訊過載）；折讓單藏在展開區；開立 Dialog 沿用 `max-w-lg`（512px）使五欄商品明細擠迫，且先前以兩欄簡化卡（數量寫死 1 / 單位寫死「式」）未落實 v1.11「發票品項符合 ezPay」五欄 spec。

## Goals / Non-Goals

**Goals:**
- 發票列表對齊 v1.15 訂單列表印件子層的雙層展開範式（`ErpExpandableRow`）
- 複雜資訊收入詳情 Side Panel，父層列表僅留掃描必要欄位
- 開立 Dialog 對齊 Figma node `9041:297881` 版型框架（720px / 固定 header·footer / body 滾動 / 區塊分隔線）
- 商品明細五欄落實既有 ezPay 五欄 spec

**Non-Goals:**
- 不改發票 / 折讓 / 收款的業務規則、金額計算、狀態機
- 不改 PaymentAllocation 自動推導邏輯（對應收款維持 derived 唯讀）
- 不改折讓單建立 / 作廢的功能行為
- 不把 `InvoiceDetailSidePanel` 抽為跨模組共用元件（屬 order-management 使用方元件）

## Decisions

**D1：商品明細採五欄而非對齊 Figma 兩欄。** Figma `9041:297881` 商品明細為兩欄卡片（商品名稱 + 金額），但該稿含已廢止的「對應收款勾選」表，判定為 ezPay 五欄改版前的舊稿。Miles 拍板採五欄（對齊 ezPay 法規與 v1.11 spec），並以「Dialog 加寬至 720px」解決五欄在窄 Dialog 擠迫的根因。取捨：視覺非 Figma 卡片式，但功能完整（業務可填真實數量 / 單位）優先。

**D2：子層與 Side Panel 職責分工。** 子層展開 = 折讓單清單；Side Panel = 發票本身詳情（品項 / 對帳鍵 / 對應收款 / 買受人）。兩者不重複，避免資訊重疊。替代方案（折讓也放 Side Panel）會與雙層展開語意衝突，捨棄。

**D3：發票級操作集中父層、子層不放。** Miles 拍板：開立折讓 / 作廢 / 檢視 / 下載皆於父層操作欄；子層僅承載折讓單清單與折讓單自身操作（作廢折讓 / 上傳回簽檔）。優點：展開行為對所有發票一致（含無折讓者），操作入口單一。

**D4：父層精簡移兩欄入 Side Panel。** 對帳編號（藍新）與開立人 / 時間屬「需要時才查」的稽核資訊，移入 Side Panel，父層 10 → 8 欄降低掃描負荷。

**D5：spec delta 全用 ADDED 而非 MODIFIED。** 本次新增「版型 / 呈現」concern，未改既有「發票開立（藍新 Mockup）」「發票品項符合 ezPay」的行為，依 OpenSpec instruction「新增 concern 用 ADDED」，避免 MODIFIED 完整複製既有 Requirement（含 v1.14 未清的舊 PaymentInvoice junction Scenario）造成非必要改動。

**D6：Side Panel 品項明細用 `SidePanelTable` 唯讀而非 `InvoiceItemTable disabled`。** 後者為輸入元件（含 input box 與「新增品項」按鈕），唯讀情境視覺笨重；`SidePanelTable` 純展示，與 DESIGN.md §1.5 詳情預覽型一致。

## Risks / Trade-offs

- [Figma `9041:297881` 為舊稿（含廢止的對應收款勾選 + 兩欄商品明細）] → 實作對齊其「版型框架」（720px / 固定 header·footer / 分隔線），商品明細採五欄、對應收款採 PaymentAllocation derived，已與 Miles 確認偏離點。
- [移除 `FormRow` 的 `px-2` 以統一 body padding 對齊] → 連帶影響同檔折讓 Dialog 的 FormRow（屬改善：貼齊 p-6 邊界），已由 e2e 與截圖確認未破壞。
- [五欄視覺非 Figma 卡片式] → Miles 接受（功能優先 / 寬度問題已由 720px 解決）。
