## Context

訂單列表（`/orders`, `OrderList.tsx`）目前是「列表頁範式 B」早期版本：手寫篩選卡，含關鍵字搜尋 + 狀態 / 訂單類型 / 售後狀態三個下拉，篩選狀態以頁面內 `useState` 管理、`useMemo` 過濾。對照商業需求 [US-ORD-009](../../../memory/Sens_wiki/wiki/erp/13-user-stories/order-management/US-ORD-009-訂單管理人查看全公司訂單.md)（依業務負責人 / 訂單狀態 / 交期篩選），缺「業務負責人」與「交期」兩個篩選維度，且無「清空篩選」。視覺依據為 Figma 中台設計 filter 區塊（node 9223:18748），其 token 與 prototype `DESIGN.md` 既有 token 一致（`--primary` #2688ff、`--border` #e3e4e5、Noto Sans TC）。canonical 範式 B 參考為 `QuoteListPage.tsx`。

## Goals / Non-Goals

**Goals:**
- 訂單列表補「業務負責人」篩選、「交期」起訖區間、「清空篩選」鍵，並對齊範式 B（搜尋框補放大鏡 icon）。
- 沿用既有頁面內 `useState` + `useMemo` 過濾模式與既有元件（`Input` / 原生 `select` / `selectClass`），不引入新框架。
- 篩選卡寫得 extraction-ready（區塊邊界乾淨），為第二階段抽共用元件鋪路。

**Non-Goals:**
- 不抽共用篩選元件（議題 3「先做 A」+ `DESIGN.md` §6.1「暫不抽 ListPageLayout」）。
- 不做快捷篩選 chips、建立日期區間（第二階段）。
- 篩選不寫入網址（沿用既有列表無 URL 篩選慣例）。
- 不改訂單實體 schema、訂單狀態機、角色權限、可見範圍邏輯。

## Decisions

**D1：篩選實作沿用既有 local state + useMemo（不抽元件、不入網址）。**
- 在既有 `filtered` useMemo 內併入 `salesFilter`、`deadlineFrom`、`deadlineTo` 三條件；新增 `useState`。理由：與 `QuoteListPage` canonical 範式一致，最小變更；抽元件 / 入網址屬跨頁慣例變更，留第二階段。

**D2：「業務負責人」下拉選項來源 = 由「角色可見訂單集」的訂單負責業務去重。**
- 不直接用 `@/types/quote` 的 `SALES_PEOPLE`（那是需求單名冊，與訂單負責業務未必一致）。理由：去重自實際訂單資料，選項永遠與列表內容同步，且不顯示無訂單的業務；候選集取自「角色可見集」（套用業務 / 主管可見範圍之後、其他篩選之前），確保選項穩定。
- 篩選語意：對「當前角色可見訂單集」依 `order.salesPerson` 收斂，**不擴大可見範圍**（業務仍只見自己∪被分享）。

**D3：「交期」篩選以訂單層 `order.deadline` 字串比較。**
- 比照 `QuoteListPage` 的 `q.createdAt >= dateFrom` / `<= dateTo` 寫法（ISO 日期字串可直接比較）。理由：列表顯示與排序本就用 `order.deadline`；交期雖在印件層（`PrintItem.delivery_date`），但列表是訂單粒度，**不擴成跨印件聚合查詢**（pre-check 反模式提醒）。

**D4：版面採範式 B `grid-cols-4` 兩列，不超欄、不需新元件。**
- 篩選 grid 第一列（4 欄）：業務負責人 / 訂單狀態 / 訂單類型 / 售後狀態；第二列：交期起訖區間（兩個 `<Input type="date">` + `→`，佔 1-2 欄）。理由：5 個篩選控制以兩列容納，守住範式 B grid，不觸發版面改造或元件抽取。

**D5：「清空篩選」置於操作列（與「刷新」並列），一鍵重置 + 回第一頁。**
- handler 將所有篩選 state（含關鍵字、交期起訖）設回空字串並 `setPage(1)`；可參考 `QuoteListPage` 的 `isFiltered` 判斷決定是否高亮 / 啟用。理由：對齊 Figma filter 區塊的「清空篩選」與範式 B 操作列慣例。

**D6：搜尋框補左內嵌 `Search` icon（`pl-9`）。**
- 對齊範式 B 共同準則第 3 / 11 項與 Figma。屬視覺一致性微調，不改搜尋邏輯（仍跨訂單編號 / 客戶 / 案名 / 印件名稱 / 印件編號）。

## Risks / Trade-offs

- **[XM-003 角色命名未定]** 「業務負責人」下拉的「全公司視角」對象（訂單管理人 vs 業務主管誰看全公司）尚未收斂 → 緩解：下拉一律對「當前角色可見集」收斂，任何 XM-003 結論下行為皆正確；不阻擋本次。
- **[版面逼近上限]** 第 5 個篩選控制使範式 B grid 趨滿 → 緩解：採 D4 兩列佈局；若第二階段再加快捷篩選 / 建立日期，屆時才評估抽共用元件。
- **[業務負責人選項依資料去重]** 若可見集為空則下拉無選項 → 可接受（無訂單即無可篩業務）；不預載全名冊避免誤導。
- **[spec 編碼校正]** 本次同時把 spec 篩選 scenario 由 US-ORD-005 對齊 US-ORD-009 → 緩解：依 [ORD-1](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-1-Notion-US-ORD-005編碼重複處理.md) answered 決議執行，archive 後由 doc-audit 確認 vault / Notion 一致。

## Open Questions

- 無新增。相關 open OQ：[XM-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/XM-003-訂單管理人%20vs%20業務權責邊界.md)（不阻擋本次）。
