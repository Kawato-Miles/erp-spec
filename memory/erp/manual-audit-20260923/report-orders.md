報告檔沒有寫出來。工具拒絕子代理寫入報告檔，所以 `report-orders.md` 不存在，完整報告直接附在下方。其他檔案都沒改。

- **差異**：共 30 筆。功能改變 12、新增 7、改名 5、寫法 5、移除 1。
- **手冊未涵蓋的新功能**：6 項。
- **需 Miles 決定**：7 項。

路徑前綴一律為 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`，下表只寫相對路徑。

### 一、差異清單

| 頁 id | 段 | 手冊現況 | Prototype 現況（逐字） | 證據（檔:行） | 建議修正 | 類別 |
|---|---|---|---|---|---|---|
| o-overview | what | 「訂單資訊」列「客戶交期」 | 單頭無交期欄；顯示唯讀「訂單內部完成時間」「訂單預計交貨日期」「全部交完日」 | orders/_components/detail/InfoTab.js:70-73、357、367、383 | 刪客戶交期，改列三個日期 | 功能改變 |
| o-overview | what | 「包裝說明」 | 「包裝備註」 | orders/_components/detail/PrintItemEditDrawer.js:472；ItemsTab.js:1584；print-items/_components/detail/PrintItemInfoPanels.js:283 | 改名 | 改名 |
| o-overview | what | 印件組沒有日期欄 | 「印件內部完成日」「印件預計交期」「客戶指定收件日」 | ItemsTab.js:1013、1021；PrintItemEditDrawer.js:442 | 補三個日期欄 | 新增 |
| o-overview | what | lede 寫「其中三塊」，實際列四組 | — | unit-orders.json what.groups | 刪數量詞 | 寫法 |
| o-approve | story、steps | 「核對客戶、交期與金額」 | 單頭無交期；看「訂單預計交貨日期」 | InfoTab.js:70-73、367 | 改指「訂單預計交貨日期」 | 功能改變 |
| o-quote-signback | steps、check | 回簽後轉「稿件未上傳」 | 先轉「已回簽」再歸納。有稿在審或免審已「合格」時落「等待審稿」，有不合格印件時落「待補件」 | orders/_lib/store.js:450-455；order-review-derive.js:44-51 | 說明欄補免審或已交稿的落點 | 功能改變 |
| o-add-item | intro | 新增只建基本資料，數量與單價另外補 | 新增對話框必填「購買數量」「單位」「單價（未稅）」 | ItemsTab.js:1486-1518 | 改為新增時一次填齊 | 功能改變 |
| o-add-item | steps、fields | 「類型」 | 「生產類型」 | ItemsTab.js:1477 | 改名（另見三之 2） | 改名 |
| o-add-item | steps、fields | 「備註」 | 「規格備註」 | ItemsTab.js:1573 | 改名 | 改名 |
| o-add-item | steps | 第 5 至 7 步走「編輯印件」補數量、單價、難易度 | 七項必填都在「新增印件」對話框。「出貨方式」「包裝備註」也在同一對話框 | ItemsTab.js:1451-1548、1576-1587 | 刪編輯三步 | 功能改變 |
| o-add-item | steps | 沒有交期步驟 | 選填「未扣急件內部完成日」「客戶指定收件日」；「印件內部完成日」「印件預計交期」即時唯讀顯示 | ItemsTab.js:1550-1572、138-164 | 補一步 | 新增 |
| o-add-item | fields | 急件寫「訂單交期（扣除急件）＝客戶交期減天數」 | 「未扣急件內部完成日減急件選項凍結天數，以工作天計」 | ItemsTab.js:143-144；PrintItemEditDrawer.js:401 | 改用新定義 | 功能改變 |
| o-add-item | fields | 缺欄 | 「單位」「未扣急件內部完成日」「客戶指定收件日」「稿件備註」「印件配方」；編輯時另有「印件預計交期」 | ItemsTab.js:1495-1503、1550-1572、1606、1614；PrintItemEditDrawer.js:410-436 | 依表單實況補齊 | 新增 |
| o-add-item | fields | 「包裝說明」 | 「包裝備註」 | PrintItemEditDrawer.js:472 | 改名 | 改名 |
| o-add-item | notes | 「新印件的購買數量為什麼是 0？」 | 購買數量必填，最小 1 | ItemsTab.js:1486-1493 | 刪此題 | 移除 |
| o-add-item | notes | 加開「只需補數量與單價」 | 單價自原印件帶入：「單價（未稅，自原印件帶入）」 | ItemsTab.js:1667-1698 | 改為只補購買數量 | 功能改變 |
| o-maintain-info | entries、steps | 無改案名入口 | 「訂單資訊」卡「編輯」開「編輯訂單資訊」改「案名」，未取消即可改 | InfoTab.js:161-176、332-341、505-518 | 補一組步驟 | 新增 |
| o-maintain-info | before | 非「訂單完成」或「已取消」 | 案名與三類備註只在「已取消」鎖；出貨方式與窗口在「訂單完成」後就隱藏 | InfoTab.js:164、324、328、417；permissions.js:254 | 改成「非已取消」，另兩項的限制放 notes | 功能改變 |
| o-maintain-info | intro | 「這三個動作」 | 可編輯的區塊有四處 | InfoTab.js:335、397、417、437 | 刪數量詞 | 寫法 |
| o-maintain-info | story | 「順手」 | — | 手冊寫法規則 § 六 | 刪 | 寫法 |
| o-add-fee | check、notes | 「沒有這兩欄」 | 欄位在，費用列顯示「－」；欄名為「印件狀態」 | ItemsTab.js:120、827-846 | 改為顯示「－」 | 寫法 |
| o-upload-artwork | before | 只列待分派與稿件未上傳 | 免審印件已「合格」但缺完稿縮圖時也出現「上傳稿件」 | ItemsTab.js:1078-1087 | 補這個情形（09-08 前已有） | 新增 |
| o-upload-artwork | steps | 結果沒寫免審 | 「本印件免審，本輪由系統自動判合格，不進審稿人員待審清單」 | ItemsTab.js:362-365 | 說明欄補免審轉「合格」 | 功能改變 |
| o-confirm-production | entries | 只有清單入口 | 印件詳情頁頂部有「確認製作細節」鈕（限訂單管理人） | print-items/detail/page.js:236-252、493-497 | 補一個入口 | 新增 |
| o-confirm-production | steps | 依預計交期排序 | 依「內部完成日」排序，空白排最後 | production-detail-queue/page.js:77-85、169 | 改名與排序依據 | 功能改變 |
| o-confirm-production | steps | 「交期區間」 | 「內部完成日區間」 | production-detail-queue/page.js:236 | 改名 | 改名 |
| o-confirm-production | steps | 核對「預計交期」 | 清單欄為「內部完成日」 | production-detail-queue/page.js:169 | 改欄名 | 功能改變 |
| o-confirm-production | notes | 無 | 日期空白的印件，篩區間時被排除 | production-detail-queue/page.js:70-71 | 補一題 | 新增 |
| o-discussion | before | 沒有訂單狀態條件 | 兩顆建立鈕只在訂單非終態時出現 | ItemsTab.js:1291-1306 | 補條件（09-08 前已有） | 功能改變 |
| o-discussion | steps | 只寫到欄位名 | 在「印件基本資訊」區，連結字「檢視討論串」，未建時顯示「尚未建立」 | PrintItemInfoPanels.js:244-268 | 補區塊名與連結字 | 寫法 |

### 二、手冊未涵蓋的新功能

| 功能 | 入口 | 證據 | 建議 |
|---|---|---|---|
| 維護印件交期：改晚「印件預計交期」、填「客戶指定收件日」並提示早於預計交期、改急件後系統重算 | 「訂單項目」→「編輯印件」 | PrintItemEditDrawer.js:373-461、217-251 | 另開「調整印件交期」頁 |
| 交期逾期標示：「部分延遲」「整單逾期」「逾期 N 個工作天」「出貨準時」 | 訂單列表「訂單預計交貨日期」欄（可排序與篩選）、訂單資訊卡、訂單項目表 | orders/page.js:301-327、482；InfoTab.js:374-375；ItemsTab.js:1036-1042 | 併入 o-overview |
| 分享與代理授權：層級「檢視」與「編輯（代理）」，可新增、改層級、移除 | 「分享（N）」頁籤 | SharingTab.js:66-151；permissions.js:101-125 | 另開新頁 |
| 取消訂單、單一印件「取消製作」 | 詳情頁頂部、印件列 | orders/detail/page.js:176-205、291-295；ItemsTab.js:674-712、1170-1180 | 另開新頁（09-08 前已有） |
| 手動「推進狀態」 | 詳情頁頂部 | orders/detail/page.js:210-256、283-289 | 併入 o-overview（09-08 前已有） |
| 單價行內修改，按「儲存變更（N）」寫入 | 「訂單項目」表 | ItemsTab.js:894-913、1240-1244 | 併入 o-add-item 或另開頁（09-08 前已有） |

### 三、需 Miles 決定

1. **欄名「接單業務」或「業務負責人」**：wiki 訂單卡與 MOCK-DATA-CHAIN.md 改名規則都用「接單業務」。Prototype 訂單詳情仍寫「業務負責人」「改派業務負責人」（InfoTab.js:57、458、467）。印件基本資訊與訂單審核清單已改成「接單業務」（PrintItemInfoPanels.js:146；approval-queue/page.js:148）。手冊跟著訂單詳情寫，共 13 處。
2. **欄名「印件屬性」、「類型」或「生產類型」**：改名規則要求用「印件屬性」。Prototype 訂單項目表寫「類型」（ItemsTab.js:816），新增對話框寫「生產類型」（ItemsTab.js:1477）。wiki 情境卡也寫「生產類型」。
3. **同一欄兩個名字**：新增對話框與印件基本資訊叫「稿件備註」，編輯印件叫「印件檔案備註」（PrintItemEditDrawer.js:468）。
4. **出貨方式在「訂單完成」後能否改**：wiki 兩張卡互相矛盾。
   - 情境卡「訂單資訊分區編輯」：訂單完成後仍可編輯。
   - 訂單實體卡（訂單.md:50）：訂單完成前才可改。

   Prototype 在訂單完成後隱藏按鈕（InfoTab.js:417），手冊跟著 Prototype 寫。
5. **分區編輯的範圍與角色**：wiki 情境卡寫四個區塊，含「發票與收款」與六種備註，訂單管理人也可操作。Prototype 只有三個可編輯區塊，備註只收三類。手冊的操作角色只寫業務。
6. **Prototype 提示字還是舊交期定義**：「急件選項」提示寫「本印件預計出貨日減一天」（ItemsTab.js:1528、1706）。加開說明寫「預計出貨日選填」（ItemsTab.js:1641）。同畫面其他欄已用 09-21 定義。請決定是否先修 Prototype。
7. **授權分享、授權備註**：訂單資訊卡仍顯示這兩欄（InfoTab.js:74-75）。分享頁籤註解說兩欄已移除，後端沒有（SharingTab.js:26-27），wiki 也沒有。手冊目前沒寫。

### 四、比對範圍

- **訂單模組**：orders/detail/page.js、InfoTab、ItemsTab、PrintItemEditDrawer、ArtworkUploadSlots、AttachmentsTab、SharingTab；orders/page.js、approval-queue、production-detail-queue；_lib 下的 permissions、store、production-detail-actions、order-review-derive、urgent-due-date、artwork-upload；mock-data。
- **印件共用**：print-items/detail/page.js、PrintItemInfoPanels、PrintItemNotesEditDrawer、PrintItemProcessQcEditDrawer、print-items/_lib/permissions。
- **其他共用**：layout.js、work-orders/_lib/mock-data 與 permissions、packages/shared PanelDrawer、MOCK-DATA-CHAIN.md 前段。
- **wiki**：訂單.md、印件.md、訂單狀態.md、訂單資訊分區編輯.md、訂單印件規格維護.md。
- **改動日期**：用 git blame 確認。多數改動出自 09-11 的 c9784825、99a93959，以及 09-21 的 f6772840、013a1bec、ae6070fd。

**已查證、不列入的線索**：
- 製程說明與品檢需求：屬實，但只有印務與印務主管能改，本單元角色不操作。
- 分派審稿鈕回簽後才出現：屬審稿單元。
- 客戶欄改廠客主檔、無值符號統一：手冊沒寫這些細節，不用改。
- 寫法掃描：單號、實作詞、人稱代名詞都查無；句長也查無超標。