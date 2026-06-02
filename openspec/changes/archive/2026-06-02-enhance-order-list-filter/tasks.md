## 1. 訂單列表篩選實作（OrderList.tsx）

- [x] 1.1 新增篩選 state（salesFilter / deadlineFrom / deadlineTo），併入既有 `filtered` useMemo：業務負責人比對 `order.salesPerson`、交期以 `order.deadline >= deadlineFrom` 且 `<= deadlineTo` 字串比較
- [x] 1.2 「業務負責人」下拉：選項由「角色可見訂單集」（套用 isSalesView 可見範圍後、其他篩選前）的 `order.salesPerson` 去重產生，放入篩選 grid 第一列
- [x] 1.3 「交期」起訖區間：兩個 `<Input type="date">`（deadlineFrom → deadlineTo），放入篩選 grid 第二列，任一值變更 `setPage(1)`
- [x] 1.4 「清空篩選」鍵：置於操作列（與「刷新」並列），重置所有篩選 state（含關鍵字與交期起訖）並 `setPage(1)`
- [x] 1.5 搜尋框補左內嵌 `Search` icon（`pl-9`），對齊範式 B（搜尋邏輯不變）
- [x] 1.6 版面：篩選 grid 維持範式 B `grid-cols-4` 兩列（4 個 select + 交期區間），不超欄、不抽共用元件；視覺用 DESIGN.md 既有 token（本就 Figma-aligned）

## 2. e2e 測試（e2e/order-list-filter.spec.ts）

- [x] 2.1 業務負責人篩選：選定某業務負責人後，列表所有列的業務負責人皆為該人（含業務視角選項僅自己 2.1b）
- [x] 2.2 交期區間：設定起訖後列數收斂且皆落在區間內；清空交期後回到全部
- [x] 2.3 清空篩選：設多條件後點「清空篩選」，所有篩選 + 關鍵字 + 交期重置、回到第一頁
- [x] 2.4 console.error / pageerror 嚴格斷言無錯誤（4 test 全含）

## 3. 驗證（範式 B + 型別 + e2e）

- [x] 3.1 `npx tsc --noEmit` 通過（exit 0、無型別錯誤）
- [x] 3.2 `npx playwright test e2e/order-list-filter.spec.ts` 全通過（4 passed）
- [x] 3.3 對照 DESIGN.md §6.1「列表頁稽核清單」：新增項皆合規（單一搜尋 Card / Search icon `pl-9` / 篩選變更 setPage(1) / 狀態主篩用 select）；既有未改之 pre-existing 偏差（卡片 `rounded-xl`/`font-bold` 非範式 B `rounded-lg`/`font-medium`、空狀態 inline 非 ErpEmptyState）留待另案，未在本次擴修
- [x] 3.4 `/orders` 視覺對齊 Figma 9223:18748 與範式 B（preview 1440 寬截圖確認：業務負責人下拉 + 交期區間 + 清空鍵 + 搜尋放大鏡 icon；console 無錯誤）

## 4. 規格同步與 wiki 回補（archive 階段）

- [ ] 4.1 archive 時 delta 合回 `order-management` 主 spec（篩選 scenario US-ORD-005 → US-ORD-009、篩選欄位集明列、清空 scenario）
- [ ] 4.2 依 pre-check「定案後回補清單」回填：US-ORD-009 卡 related-test-cases（待 TC 建立）、`03-roles/業務.md`、`訂單管理人.md` 可見範圍 R&R、`05-entities/訂單.md` 業務負責人/交期篩選定位（由 doc-audit 雙層稽核維度執行）

## 5. 第二輪追加（狀態型別連動 + 付款狀態，2026-06-02 Miles 試用回饋）

- [x] 5.1 狀態選項依訂單類型顯示「適用完整狀態集」（前段依類型 + 共用段 + 終態，對齊 state-machines spec § 訂單狀態機；以 statusesForOrderType 分段定義回傳，**非資料去重**——data-derived 會漏掉如線上單「稿件未上傳」等目前無訂單的共用段狀態）+ 切換類型重置已選狀態
- [x] 5.2 新增付款狀態篩選（paymentOptions memo + paymentFilter，data-derived，涵蓋 未付款/部分付款/已付款/已退款）
- [x] 5.3 補既有疏漏：訂單類型篩選清單（ALL_ORDER_TYPES）加入「諮詢訂單」（OrderType 型別與色票本有、篩選清單漏列致諮詢訂單可見不可篩）
- [x] 5.4 spec delta US-ORD-009 補付款狀態 + 狀態依訂單類型收斂 + 切換類型重置狀態註記
- [x] 5.5 e2e 2.5（付款狀態）；`tsc --noEmit` exit 0、e2e 6/6 通過、preview 版面確認（6 控制兩列、無 console error）
- [x] 5.6 狀態選項改 data-derived → 分段定義完整適用集（/goal：線上單缺共用段「稿件未上傳」修正）；e2e 2.4 改寫為逐類型驗證完整適用集（線下 15 / 線上·客製 12 含全共用段 / 諮詢 2 終態 / 全部 17 + 互斥 + 切換重置 + 選項總數）；tsc exit 0、e2e 6/6 通過、live app 逐類型讀取選項確認
```
