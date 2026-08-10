## Context

段 2 的商業層決策已全數定案於 `production-stage-seg2-design.md`（三輪 plan-audit 全過、拍板紀錄 `production-stage-seg2-alignment.md` § 一至 § 九），wiki 已落卡。本文件只處理 PRD 層與 prototype 實作的技術取捨，不重述商業決策。

實作約束（沿段 1，handover § 二）：只動 erp repo（`/Users/b-f-03-029/erp`）`prototype/production-stage` 分支、不開 PR；實作經 repo 內 `prototype-from-prompt` skill（既有配方與真元件、禁自創 UI、禁手寫 hex 與 px、巢狀表用 `SubTableWrapper`）；只動 `apps/erp/src/app/(prototype)/`；dev server `http://localhost:3000`。

## Goals / Non-Goals

### Goals

- 五份 main spec 的報工與轉交規格對齊 wiki 拍板現況（H1–H26）
- prototype 的報工、工作包、轉交三個介面群依新口徑校正並貫通資料流（報工 → 可搬量 → 建單 → 點收 → 到料 → 放行）
- 師傅行動版版型（報工＋點收）、工作包子母列表、批次報工欄位形式對話框三個新介面

### Non-Goals

- 品檢驗收流程本體、暫存區三類轉交路徑、外部廠商目的地（段 3）
- 副流程：工單異動、訂單取消連鎖、售後補印、加印（段 4）
- 庫存扣帳、物料消耗記錄、工單預留（庫存模組，未設計）
- 產出更正單（拍板不做）；Slack 通道實作（spec 承載四前提，prototype 以桌機按鈕代位）

## Decisions

### D1 轉交狀態機在 prototype store 的承載

轉交單五態與額度帳全部落在 `production-floor/_lib/store.js`（既有 `confirmTransfer` 重寫為五個動作：`createTransfer`／`startTransfer`／`deliverTransfer`／`receiveTransfer`／`voidTransfer`），到料量與可搬量為衍生計算（selector），不另存欄位——與指標「查詢時即時算」哲學一致，且避免段 1 踩過的「跨模組寫入斷鏈」坑（handover 坑 2）：唯一的寫入是轉交單本身，其餘全部推導。

替代方案（每個狀態轉換各自寫入下游 `arrived_qty` 存量欄）被否決：寫入點多、漏一次即靜默錯帳，正是稽核抓到的現況缺陷（差異 #10）。

### D2 歷程紀錄（log）的實作形態

生產任務與轉交單的歷程為 append-only 陣列（`history: [{at, actor, event, ref}]`），mock 與 store 動作統一經一個 `logEvent` helper 寫入；詳情頁「歷程」區塊唯讀渲染。不做獨立 log 實體與跨單查詢頁——B5 拍板要的是「單據＋log 找斷點」，掛在單據上即可。

### D3 行動版版型

師傅行動版為 `(prototype)` 下新路由（`production-floor/mobile`），用既有元件以窄版單欄呈現（`resize_window` 可驗），不引入新 UI 框架；內容兩區塊：待點收（目的地 × 角色過濾）、待報工（我的工作包）。品檢人員點收沿用同版型、不同角色過濾。桌機 transfers 頁保留廠務起搬與送達的代位按鈕（頁面加註實際通道為 Slack）。

### D4 批次報工對話框

參照 `prepress-review/_components/ReviewDialog.js` 範式重構：單筆與批次共用同一 dialog、每筆任務一張 `BorderBlock` 卡（卡內垂直欄位：投入／良品／不良品／工時）、共用欄位置頂（運轉設備唯讀顯示）。取代現行過寬表格。

### D5 spec 的欄位引用紀律

delta specs 不複寫 wiki 欄位表與狀態列舉（單一正本鐵則）：轉交五態引 [轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、報工欄位引 [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)；spec 只承載轉換條件（guard）、觸發事件與 Scenario。

## Risks / Trade-offs

- [erp repo 多方同時在動（handover 坑 6）] → 每批 commit 前 `git status` 確認範圍，只 stage 本批檔案
- [實作與規格不同批改造成漂移（handover 坑 1）] → delta spec 與 prototype 同批任務內完成，verify 前不留「spec 待補」
- [到料量全衍生的效能疑慮] → prototype 資料量小、無虞；真實系統的存量 vs 衍生取捨屬開發階段決策，spec 不鎖定實作形態
- [批次建單依目的地分組的互動細節無 wiki 承載] → 介面與互動正本歸 Prototype，實作時以 Prototype 為準，spec 只寫行為（勾選多筆 → 按目的地各成一張單）

## Migration Plan

Prototype 校正無部署議題。批次順序：報工欄位與檢核 → 轉交五態與佇列 → 指標取數 → 行動版與對話框 → 收尾貫通。每批走「實作（Sonnet）→ 稽核（Opus，只報發現）→ 裁決（Fable）→ commit」循環（handover § 二）。回滾＝git revert 單批 commit。

## Open Questions

無新增。既有 open OQ 與本 change 的關係：PT-042（拼版模數）不擋——材料任務目標量 mock 直接給值；PT-026（供應商門戶）不擋——供應商自助管道只落 spec 行為，介面標待驗。

## 另案處理（delta specs 撰寫期間發現，不在本 change 範圍）

| # | 發現 | 落點 | 為什麼另案 |
|---|------|------|-----------|
| A1 | `production-overview` § 三視角負荷（設備視角的「停機狀態」）與 § 設備運作總覽（「是否停機（含停機原因）」）在停機兩欄自報工移除之後失去資料來源 | `openspec/specs/production-overview/spec.md` | 段 2 只拍板「報工不收停機兩欄、稼動率分子不扣停機」；設備層要不要另設停機狀態的來源（設備主檔或另一種回報）未經拍板，屬新設計而非規格對齊 |
| A2 | `openspec` 各 spec 的 `## Purpose` 與 `**範圍**`／`**設計原則**` 段落無法由 delta 表達——production-execution Purpose 的「已交付的生產任務」（應為「已交付產線」）、production-overview Purpose 與設計原則的「五指標（時間稼動率／良率／折損率／毛利率／成本達成率）」（應為六指標） | 兩份 main spec 的檔頭 | delta 只承載 Requirement；檔頭需於 `/opsx:archive` 合併時一併手改 |
| A3 | 「bubble-up」用詞殘留於 `order-management` § 訂單審稿段 Bubble-up 派生（含 Requirement 名稱）、§ 訂單確認觸發，以及 `prepress-review` § 狀態同步的 Rationale | 審稿段規格 | 段 2 涉及的 § 印件詳情頁工單與生產任務區塊 已於段 1 收斂為「狀態向上傳遞」；剩餘殘留全在審稿段與 prepress-review，屬全庫用詞清整，一次做完比夾在生產段 change 裡做乾淨 |
