## 1. 訂單列表角色分流過濾（基礎）

- [x] 1.1 移植 PrintItemDashboard 的 isSalesView 模式（role === 'sales' || 'consultant'）至 OrderList
- [x] 1.2 業務／諮詢過濾條件：`order.salesPerson === currentUser.name` ∪ `sharedMembers` 含 currentUser；業務主管不過濾（看全部）
- [x] 1.3 過濾邏輯內聯於 OrderList 既有 useMemo（與狀態／類型／售後／搜尋過濾組合）

## 2. 訂單列表父層改造（套 ErpExpandableRow）

- [x] 2.1 父層第一欄加展開 toggle 欄，套用 ErpExpandableRow（參考 PrintItemDashboard 既有用法）
- [x] 2.2 colSpan 調整為 13（含 toggle 欄），驗證父層原 12 欄內容與行為不變
- [x] 2.3 重算兩個 cell-sticky-left 偏移量（toggle 欄 left:0、訂單編號 left:40、案名 left:190），ErpExpandableRow 加 optional toggleClassName/toggleStyle prop 讓 toggle 欄 sticky；橫向捲動無錯位
- [x] 2.4 父層「印件數」欄與展開行為對應（印件數即子層筆數）

## 3. 印件子層渲染

- [x] 3.1 子層 5 欄表頭：印件名稱(含印件類型標籤+協力標籤)／審稿狀態／印件狀態／交期／操作（去縮圖，符合 DESIGN.md line 52）
- [x] 3.2 印件類型用 PrintItemTypeLabel、審稿狀態用 ReviewDimensionStatusBadge、印件狀態用 PrintItemStatusBadge（一律重用，不另造）
- [x] 3.3 子層顯示訂單下全部印件（「已棄用」除外），不沿用印件總覽「製作完成隱藏」過濾
- [x] 3.4 子層排除縮圖（移至 Side Panel）、生產相關欄位（生產數量／產線／難易度／工單數／排程／負責印務）與父層已有欄位（案名／客戶／訂單編號）

## 4. Side Panel 資料源補齊

- [x] 4.1 OrderList 從 store 補取 workOrders（order.workOrders）與 reviewer 名單解析（移植 OrderDetail reviewerNameOf）
- [x] 4.2 子層「檢視」開啟 PrintItemDetailSidePanel，傳齊 6 個 props，驗證「相關工單」與「審稿紀錄」區塊非空白

## 5. 搜尋擴展與展開狀態

- [x] 5.1 搜尋 filter 擴展為「訂單編號／客戶／案名 ∪ 印件名稱／編號」的聯集
- [x] 5.2 因印件層命中而保留的訂單自動展開、命中印件列高亮（bg-amber-50）
- [x] 5.3 filter 命中後 setPage(1)（沿用 OrderList 既有換頁 pattern）
- [x] 5.4 清空搜尋收合所有展開、還原未過濾全集（展開狀態以 Set 管理）
- [x] 5.5 訂單尚無印件時子層顯示「此訂單尚無印件」空狀態

## 6. e2e 驗證

- [x] 6.1 業務僅見自己負責訂單、業務主管見全部（e2e/order-list-print-item-subrows.spec.ts）
- [x] 6.2 業務看不到他人訂單（搜尋「吳建廷」業務 0 筆 / 主管命中）
- [x] 6.3 展開訂單查看子層印件（5 欄正確、審稿+印件雙維度狀態、toggle 欄 sticky）
- [x] 6.4 搜尋印件名稱命中 → 過濾 + 自動展開 + 高亮命中印件
- [x] 6.5 清空搜尋 → 收合並還原全集
- [x] 6.6 子層檢視開 Side Panel → 相關工單與審稿紀錄區塊非空白
- [x] 6.7 橫向捲動 sticky 欄位無錯位（toggle 欄 cell-sticky-left 驗證）
- [x] 6.8 console.error／pageerror 嚴格斷言無錯誤（6 e2e 全過 + smoke/navigation 13 過）
- [x] 6.9 verify SUGGESTION 補強：諮詢角色過濾比照業務 + 無印件訂單空狀態（e2e 6.7）+ 已完成印件子層可見（e2e 6.3 斷言）

## 7. Vault 同步（商業 know-how）

- [x] 7.1 ORD-023（訂單列表 vs 印件總覽分工邊界）OQ 卡 Miles 已確認、標 answered
- [x] 7.2 ORD-024（業務平台/中台分流過濾）OQ 卡標 answered（Miles 已拍板）
- [x] 7.3 評估結論：不需獨立情境卡——查詢動作非跨模組端到端流程（07-scenarios 定位），由 US-ORD-034 承載業務情境
- [x] 7.4 03-roles/業務.md 關切點補「接客戶來電查詢時能在訂單列表快速定位並回覆印件審稿/印製狀態」
- [x] 7.5 撰寫 User Story US-ORD-034「業務查訂單下印件狀態」（ui-bound、INVEST 自審 + 中英夾雜 lint 通過）
