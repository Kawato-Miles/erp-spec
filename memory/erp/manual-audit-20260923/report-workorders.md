主對話請注意：報告檔沒有寫成。執行環境拒絕子代理寫報告檔，回應是「Subagents should return findings as text, not write report files」。所以任務書指定的路徑 `/private/tmp/claude-501/-Users-b-f-03-029-Sens/0069649d-bdb4-4720-b3ee-54da9de276e2/scratchpad/report-workorders.md` 目前不存在。完整報告全文附在下方，請由主對話寫入該路徑。

- **差異筆數**：共 48 筆。功能改變 12、改名 7、新增 16、移除 0、寫法 13。
- **手冊未涵蓋的新功能**：12 項。
- **需 Miles 決定**：4 項。
- **erp repo 與 Sens repo**：都沒有改動。

---

# 工單管理單元（w-overview 到 w-deliver）手冊與 Prototype 比對報告

- 比對基準：手冊內容 JSON `unit-workorders.json`（手冊最後更新 2026-09-08），對照 erp repo 分支 `prototype/production-stage` 的現況（最新相關 commit 為 2026-09-22）。
- 路徑縮寫：以下「(p)/」代表 `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`。

## 一、差異清單

| 頁 id | 段 | 手冊現況（簡述） | Prototype 現況（逐字） | 證據（檔:行） | 建議修正（一句） | 類別 |
|---|---|---|---|---|---|---|
| w-overview | what | 工單基本資訊列「審核主管」 | 欄名「工單審核主管」 | (p)/work-orders/detail/page.js:628；(p)/print-items/_components/AssignWorkOrdersDialog.js:286；wiki 工單卡 § 欄位 | 改為「工單審核主管」 | 改名 |
| w-overview | what | 工單基本資訊列「預計完工日」 | 欄名「工單預排完成日」，唯讀衍生（旗下未作廢任務「任務預計完成日」的最大值） | (p)/work-orders/detail/page.js:655-668；(p)/work-orders/_components/detail/WorkOrderSummary.js:218-219；wiki 工單卡 | 改為「工單預排完成日（唯讀，取任務預計完成日最晚者）」 | 改名 |
| w-overview | what | 工單基本資訊列「製程說明、品檢需求」 | 兩欄移到印件層，顯示在「印件基本資訊」；編輯入口在「編輯工單資訊」側板的「製程說明」「品檢需求」段 | (p)/print-items/_components/detail/PrintItemInfoPanels.js:275-276；(p)/work-orders/detail/page.js:1176、1189；MOCK-DATA-CHAIN.md 前段；wiki 工單卡沒有這兩欄 | 從工單基本資訊移除，改寫「製程說明與品檢需求屬印件，一件印件一份」 | 功能改變 |
| w-overview | what | 沒有確樣需求、聯絡電話、交期類欄位 | 「工單資訊」另有「工單聯絡」「每份印件生產數量」「印件預計交期」「工單實際完成日」「確樣需求」；摘要卡另有「印件內部完成日」 | detail/page.js:633-683；WorkOrderSummary.js:191-195 | 補列這幾欄，確樣需求寫明十值多選 | 新增 |
| w-overview | what | 生產任務清單沒有日期、成本、轉交欄位 | 生產任務表有「任務預計完成日」「預估成本」；展開列有「需轉交」「任務實際開工」「任務實際完成日」「指派師傅」；表單有「目的站點」 | (p)/work-orders/_components/ProductionTasksTable.js:301、309、527、541-546、557-562、569-577；(p)/work-orders/_components/detail/TaskFormDialog.js:446-447 | 補列上述欄位；「任務實際開工」寫明取首筆報工時間 | 新增 |
| w-overview | what | 沒有提到工單成本 | 「成本對照」頁籤：每筆未作廢任務一列任務小計，另有「顏色費用：單黑」等五色別各一列，欄位為「預估（凍結）」「實際（累積）」「升降」 | (p)/work-orders/_lib/cost-rows.js:11、20-40；(p)/work-orders/_components/detail/CostCompareTab.js:59-79、89；detail/page.js:835 | 在 what.groups 新增「成本對照」一組 | 新增 |
| w-overview | how.stages | 送審、核可的推進事件沒有排程條件 | 送審與核可時系統比對排程，擋下時跳「排程超過印件內部完成日，無法送出審核」或「…無法核可」 | detail/page.js:264-276、290-299；(p)/work-orders/_lib/process-review-actions.js:47-53；wiki 工單狀態卡 § 轉換條件 | 第四欄補「且排程不晚於印件內部完成日」 | 功能改變 |
| w-overview | how.flow | 箭頭文字「提交審核」「核可製程」「退回」「收回」「交付產線（全部完成）」 | 這些都是按鈕名 | 手冊寫法規則 § 三：箭頭上的字是業務事件，不是按鈕名 | 改成業務事件（印務送審、主管核可、主管退回、印務收回、全部任務交付） | 寫法 |
| w-overview | roles | 印務「動作限本人」 | 負責人動作也開放給「編輯（代理）」層級的分享成員 | (p)/work-orders/_lib/permissions.js:12-23、28-31；wiki 工單卡「負責人」欄 | 改為「限負責人與編輯（代理）分享成員」 | 功能改變 |
| w-overview | roles | 印務主管「分派工單的負責印務與審核主管」 | 「工單審核主管」 | detail/page.js:1101 | 改名 | 改名 |
| w-overview | roles | 印務「發起工單異動」 | 工單詳情頁沒有發起異動的入口；「新增生產任務」只在草稿與重新確認製程出現 | permissions.js:48-51、181（canAdjustTasks 沒有任何畫面呼叫）；ProcessTab.js:447-451 | 見第三段第 1 項 | 功能改變 |
| w-assign | intro | 「指定負責印務與審核主管」 | 對話框第一段標題「工單審核主管」 | AssignWorkOrdersDialog.js:286 | 改名 | 改名 |
| w-assign | before | 第二條寫的是操作路徑 | 路徑已在 entries | 寫法規則 § 三：before 只放狀態、身分、資料前提 | 改成狀態前提 | 寫法 |
| w-assign | before／entries | 沒說已完成、已取消的工單不列入 | 對話框只帶非終態工單 | PrintItemsTable.js:572-575；(p)/print-items/detail/page.js:576 | before 加狀態前提 | 新增 |
| w-assign | entries | 寫「操作欄點「工單分派」」 | 操作欄是圖示鈕，滑鼠提示「工單分派」 | PrintItemsTable.js:358-367 | 改寫「點「工單分派」圖示」 | 寫法 |
| w-assign | entries／steps | 工單詳情頁「分派」「改派」只列為入口，步驟全照「工單分派」寫 | 工單詳情頁開的是「分派工單」「改派工單」，確認鈕為「分派」「改派」；工單審核主管預帶原值、不預帶登入者；兩欄都必選（「請選擇負責印務與工單審核主管」） | detail/page.js:507-520、1077-1107 | 步驟並列兩個入口的差異（見第五段草稿） | 功能改變 |
| w-assign | steps | 第 2 步「確認「審核主管」」 | 「工單審核主管」 | AssignWorkOrdersDialog.js:286 | 改名 | 改名 |
| w-assign | fields | 寫「審核主管」；理由欄寫「五選一」 | 「工單審核主管」；理由五值不變 | AssignWorkOrdersDialog.js:286；(p)/work-orders/_lib/mock-data.js:129 | 改名；「五選一」改「擇一」（STE 句法規則 11 禁寫死數量詞） | 寫法 |
| w-assign | fields | 只列四欄 | 工單清單另有唯讀欄「工單編號」「工單類型」「狀態」；加開列分別顯示「送出後建立」「草稿（待建立）」 | AssignWorkOrdersDialog.js:128-156 | 補三列唯讀欄 | 新增 |
| w-assign | notes | 第 4 題導向「加開工單」頁 | 這題內容屬 w-add | AssignWorkOrdersDialog.js:310 | 改放本頁操作會遇到的現象 | 寫法 |
| w-add | steps | 第 1 步寫「清單多一列草稿工單」 | 新列顯示「送出後建立」「草稿（待建立）」，列尾可點「移除此列（不建立、不留紀錄）」 | AssignWorkOrdersDialog.js:135、152、215 | 結果寫明新列的標示，說明欄補可移除 | 新增 |
| w-add | steps | 第 2 步要選負責印務 | 不選負責印務也會建立，送出後維持未指派 | AssignWorkOrdersDialog.js:236-250、265-269 | 說明欄補「不選印務也會建立」 | 新增 |
| w-add | check | 沒提活動紀錄 | 訂單活動紀錄寫入「加開工單 {工單編號}（{印件名稱}）」 | (p)/orders/_lib/store.js:2024；(p)/print-items/_lib/work-order-actions.js:69 | 預期結果補一條 | 新增 |
| w-add | notes | 「點「加開一張工單」沒有反應？」 | 按鈕停用，滑鼠提示「印件印製狀態已為「…」，不可再加開工單；需要重做請開售後服務單決議補做（補做加開在原工單上）」 | AssignWorkOrdersDialog.js:302-311；permissions.js:353-357 | 問句改「「加開一張工單」按不下去？」 | 寫法 |
| w-delete-draft | entries | 只列印件列表與印件詳情頁 | 待分派印件頁共用同一張表，展開列也有刪除圖示 | (p)/print-items/pending-assign/page.js:32-37；PrintItemsTable.js:452-476 | 補「待分派印件」入口 | 新增 |
| w-delete-draft | steps | 第 2 步寫「操作欄點刪除」 | 刪除圖示的滑鼠提示為「刪除草稿工單」 | PrintItemsTable.js:462；(p)/print-items/_components/detail/WorkOrdersTab.js:142 | 改寫「點「刪除草稿工單」圖示」 | 寫法 |
| w-delete-draft | check | 沒提活動紀錄 | 訂單活動紀錄寫入「刪除空草稿工單 {工單編號}（{印件名稱}）」 | (p)/orders/_lib/store.js:2029；work-order-actions.js:79-84 | 預期結果補一條 | 新增 |
| w-delete-draft | notes | 「點刪除沒有反應？」 | 圖示停用，滑鼠提示原因（例：「此工單已有生產任務，請先清空製程或改走工單異動」） | PrintItemsTable.js:460-467；permissions.js:368-386 | 問句改「刪除圖示是灰的？」，答句補「滑鼠移上去看原因」 | 寫法 |
| w-task | before | 「且為該工單負責印務」 | 編輯（代理）分享成員也可規劃製程 | permissions.js:48-51 | 改為「負責印務或編輯（代理）分享成員」 | 功能改變 |
| w-task | steps | 第 2 步「在「選擇 BOM」勾選這道工序那一列，點「帶入」」 | 選擇器預設開在「材料」頁籤，三個頁籤為「材料」「工序」「裝訂」 | (p)/work-orders/_components/detail/BomPickerDialog.js:85、168-178；TaskFormDialog.js:778 | 前面加一步「切到「工序」頁籤」 | 功能改變 |
| w-task | steps | 第 4 步「切到「任務內容與排程」頁籤」 | 表單開啟時已停在這個頁籤 | TaskFormDialog.js:163、171 | 改寫「在「任務內容與排程」頁籤填「印件部位」」 | 寫法 |
| w-task | fields | 「預計完成日」：系統不推算、不帶預設值 | 欄名「任務預計完成日」；提示「…晚於本工單的印件內部完成日時只提示不擋存檔，但這張工單送出審核時會被排程硬擋擋下」 | TaskFormDialog.js:419-429；(p)/work-orders/_lib/task-due-date-warning.js:75 | 改名，並補送審會被擋 | 改名 |
| w-task | fields | 唯讀帶入欄沒有區間欄 | 依類型另顯示區間欄，選擇器欄名為「面積區間」「面積規格」「頁數／台數區間」 | TaskFormDialog.js:679-688；BomPickerDialog.js:46、56、66 | 唯讀欄補區間欄 | 新增 |
| w-task | fields | 色數五欄寫「…色數量」 | 提示「逐色別填「幾色」，各色別並存相加、不擇一」 | TaskFormDialog.js:600-617 | 改寫「填幾色」 | 寫法 |
| w-task | check | 「排在「製程規劃」清單最後」 | 生產任務表依「印件部位」分群，新任務落在同部位的群組內 | ProcessTab.js:420、516-526；ProductionTasksTable.js:744-759 | 改寫「出現在該印件部位群組內」 | 功能改變 |
| w-task | notes | 沒有日期提示的題目 | 存檔時任務預計完成日晚於印件內部完成日，跳「…已存檔；這張工單送出審核時會被排程硬擋擋下」 | ProcessTab.js:278-281、287、298；task-due-date-warning.js:75 | 用這題取代「「放損率」可以自己改嗎？」 | 新增 |
| w-submit | before | 「且為該工單負責印務」 | 編輯（代理）分享成員也可送審 | permissions.js:28-31；wiki 工單狀態卡 | 同 w-task | 功能改變 |
| w-submit | steps／notes | 沒有排程把關 | 送審跳「排程超過印件內部完成日，無法送出審核」，列出「工單預排完成日」「印件內部完成日」「相差：N 個工作天」 | detail/page.js:264-276、1226-1236 | 新增一題常見問題：改任務預計完成日，或請業務改未扣急件內部完成日 | 新增 |
| w-submit | notes | 「「提交審核」按不下去？」 | 按鈕可以按，按下跳「至少一筆任務須計入完成度」 | detail/page.js:259-262；permissions.js:39-44 | 問句改「點「提交審核」出現「至少一筆任務須計入完成度」？」 | 功能改變 |
| w-review | steps／notes | 核可後直接轉「製程審核完成」 | 核可時再判排程，擋下跳「排程超過印件內部完成日，無法核可」與「本工單留在待審核列表；請退回請印務調整排程，或請業務改未扣急件內部完成日。」 | (p)/work-orders/review-queue/page.js:100-124；detail/page.js:290-299 | 新增一題常見問題 | 新增 |
| w-review | steps | 第 1 步只寫展開核對生產任務 | 列表另有「印件內部完成日」「工單預排完成日」（超期時標「超 N 個工作天」）「確樣需求」「顏色費用合計」「預估成本合計」 | review-queue/page.js:203-264 | 說明欄補「先看工單預排完成日有沒有標超期」 | 新增 |
| w-review | steps | 第 2 步「點該列「審核通過」」 | 操作欄是圖示鈕，滑鼠提示「審核通過」 | review-queue/page.js:282-290 | 改寫「點該列「審核通過」圖示」 | 寫法 |
| w-review | entries | 工單詳情頁與列表當成同一流程 | 工單詳情頁點「核可製程」直接核可，不跳確認框；只有列表路徑有確認框 | detail/page.js:287-309、757-761；review-queue/page.js:92-99 | 見第三段第 3 項，暫照實寫兩條路徑的差異 | 功能改變 |
| w-deliver | before | 「且為該工單負責印務」 | 編輯（代理）分享成員也可交付 | permissions.js:101-105 | 同 w-task | 功能改變 |
| w-deliver | entries／steps | 「點右上「交付產線」」 | 按鈕文字「交付產線（N）」，未勾選時停用；確認框標題同為「交付產線（N）」 | ProcessTab.js:457-468、214-216 | 照實寫「交付產線（N）」 | 改名 |
| w-deliver | check | 「標示為已交付」 | 生產任務表「交付狀態」欄顯示「已交付」 | ProductionTasksTable.js:379-392 | 改寫「「交付狀態」顯示「已交付」」 | 寫法 |
| w-deliver | check | 沒提印件層 | 印件旗下工單全部交付後，提示印件印製狀態轉「工單已交付」 | detail/page.js:382-404 | 視需要補一條預期結果 | 新增 |
| w-deliver | notes | 「點「交付產線」沒有反應？」 | 按鈕停用，滑鼠提示「本工單有 N 筆補做異動待印務主管核可，核可後才可交付產線」 | permissions.js:153-161；ProcessTab.js:458-468 | 問句改「「交付產線」按不下去？」 | 寫法 |

## 二、手冊未涵蓋的新功能（與本單元日常工作直接相關者）

| 功能 | 入口 | 證據 | 建議 |
|---|---|---|---|
| 編輯工單資訊（確樣需求、製程說明、品檢需求） | 工單詳情「工單資訊」標題列「編輯」，開「編輯工單資訊」 | detail/page.js:580-589、1144-1206；permissions.js:412-447、472-502 | 另開新頁（印務）；確樣需求印務主管不能改 |
| 分享工單與代理授權 | 「分享（N）」頁籤，「分享與代理授權」「新增分享成員」 | detail/page.js:841-853；SharingTab.js:68、129-154 | 另開新頁（印務） |
| 印務印件檔案上傳與檔案備註 | 「印件檔案」標題列「編輯備註」「上傳檔案」 | detail/page.js:591-619；permissions.js:510-522 | 另開新頁，或併入 w-task |
| 送審前預覽 | 頁首「預覽工單」 | detail/page.js:780-788；permissions.js:281-294 | 併入 w-submit |
| 列印紙本工單 | 頁首「列印紙本工單」 | detail/page.js:789-797；permissions.js:272-279 | 併入 w-deliver 常見問題 |
| 調整生產任務順序 | 「生產任務」標題列「調整順序」，開「調整生產任務順序」 | ProcessTab.js:452-456；TaskOrderDrawer.js:106、148 | 併入 w-task |
| 核可後排程超期標示 | 詳情頁警示「排程超期：…」；列表與印件詳情標「排程超期」 | detail/page.js:913-923；work-orders/page.js:206-218；WorkOrdersTab.js:77-92；(p)/_lib/delivery-chain.js:246-253 | 併入 w-overview 與 w-deliver |
| 任務層日期標示 | 生產任務表「任務預計完成日」欄：「超出印件內部完成日」「今日到期」「逾期 N 個工作天」「未排定」 | ProductionTasksTable.js:308-339 | 併入 w-task 預期結果 |
| 工單準時判定 | 「工單實際完成日」欄與摘要卡副標「準時」「逾期 N 個工作天」 | work-orders/page.js:219-238；WorkOrderSummary.js:227-243 | 併入 w-overview |
| 印務的工單列表只列自己負責與被分享的工單 | 工單列表 | permissions.js:317-330；work-orders/page.js:83-85 | 併入 w-overview roles |
| 工單摘要卡（目標數量、印件預計交期、印件內部完成日、工單預排完成日、工單實際完成日、預估利潤率、負責印務） | 工單詳情頁頂端「工單摘要」 | WorkOrderSummary.js:26、166-270 | 併入 w-overview what |
| 印務在工單詳情報工 | 「批次報工（N）」與操作欄「報工」圖示 | ProcessTab.js:122-146、398-409、470-489 | 先確認是否由生產階段單元承接 |

## 三、需 Miles 決定

1. **交付後的工單異動由誰、從哪裡發起？三方不一致。**

   | 來源 | 現況 |
   |---|---|
   | 手冊 w-overview roles | 印務「發起工單異動」 |
   | wiki 情境卡「工單異動與生產任務調整」 | 主流程第 1 步：印務在工單中新增生產任務 |
   | Prototype | 工單詳情沒有發起異動的入口；權限函式 canAdjustTasks 沒有任何畫面呼叫（permissions.js:181）；任務層的異動移除於 09-04 整組拿掉（commit b20df93e）；唯一的發起點是印件層「發起補做」（RemakeAction.js:359-367） |

   可能一是 Prototype 缺入口，可能二是手冊與 wiki 要改寫。請裁決手冊照哪一方寫。
2. **「尚未分派」與「尚未指派」用語不一。**
   - 工單列表、工單詳情、摘要卡寫「尚未分派」（work-orders/page.js:171、detail/page.js:626、WorkOrderSummary.js:265）。
   - 印件列表展開列、印件詳情工單頁籤、工單分派對話框寫「尚未指派」（PrintItemsTable.js:436、WorkOrdersTab.js:69、AssignWorkOrdersDialog.js:164）。
   - 請裁決統一用哪一個。手冊暫時照各畫面逐字寫。
3. **工單詳情頁「核可製程」沒有確認框，列表有確認框。**
   - 待審核工單列表按「審核通過」會先跳確認框（review-queue/page.js:92-99）。
   - 工單詳情頁按「核可製程」直接核可（detail/page.js:287-309）。
   - 可能是刻意設計，也可能是缺漏。
4. **工單詳情頁報工只限負責人本人。**
   - Prototype 的判斷是 `workOrder.owner === currentUser`（ProcessTab.js:127-128）。
   - wiki 工單卡把這個動作開放給編輯（代理）分享成員。
   - 若要把報工寫進手冊，需先裁決。

## 四、比對範圍說明

讀過的 Prototype 檔案（前綴 `(p)/`）：

- **工單模組**：
  - `work-orders/page.js`、`detail/page.js`、`review-queue/page.js`
  - `_components/ProductionTasksTable.js`、`RejectProcessModal.js`
  - `_components/detail/ProcessTab.js`、`TaskFormDialog.js`、`BomPickerDialog.js`、`WorkOrderSummary.js`、`CostCompareTab.js`、`SharingTab.js`、`AdjustmentsTab.js`、`TaskOrderDrawer.js`
  - `_lib/permissions.js`、`store.js`、`process-review-actions.js`、`cost-rows.js`、`mock-data.js`、`task-due-date-warning.js`、`bom-master-mock.js`
- **印件模組**：
  - `print-items/page.js`、`pending-assign/page.js`、`detail/page.js`
  - `_components/AssignWorkOrdersDialog.js`、`PrintItemsTable.js`、`RemakeAction.js`
  - `_components/detail/WorkOrdersTab.js`、`PrintItemInfoPanels.js`
  - `_lib/work-order-actions.js`、`usePrintItemsFilter.js`
- **共用**：
  - `layout.js`、`_lib/delivery-chain.js`、`production-floor/_lib/mock-data.js`、`orders/_lib/store.js`
  - `packages/shared/components/common/DeleteConfirmModal.js`、`ConfirmModal.js`
- **資料主鏈**：`MOCK-DATA-CHAIN.md` 前段。
- **git log**：2026-09-08 以後 work-orders 與 print-items 兩目錄的提交紀錄。
- **wiki**：工單狀態、工單、印務主管、工單製程審核、工單異動與生產任務調整五張卡。

已知線索查證：

- **全部成立的**：成本收斂、利潤率、確樣需求十值、任務實際開工取首筆報工、工單聯絡、依部位分群、預排完成日唯讀衍生、排程硬擋與超期標示、製程說明與品檢需求移到印件層、報工入口、工單審核主管改名、列表可見範圍、分享頁籤、改派五值理由。
- **目的站點與 BOM 備料層**：成立，手冊已有對應內容。
- **「摘要卡兩格利潤率」**：已被 09-21 的 commit 013a1bec 取代，現在只剩「預估利潤率」一格（WorkOrderSummary.js:72-75、247-260）。

## 五、w-assign 改寫草稿

`points` 鍵不在指定鍵名內，建議沿用現行內容，只把「審核主管」改為「工單審核主管」。

```json
{
  "title": "分派工單給印務",
  "actor": "印務主管",
  "intro": "印件確認製作細節後，系統在該印件底下建立草稿工單。印務主管在「工單分派」為這些工單指定負責印務與工單審核主管。\n已指派的工單也在同一處改派。",
  "goals": ["完成一張印件的工單分派，讓每張工單都有負責印務與工單審核主管"],
  "story": "客戶的三摺頁 DM 確認完製作細節，印件底下多一張未指派的草稿工單。你是印務主管，要把它派給一位印務，並指定工單審核主管。",
  "before": ["以印務主管身分登入", "要分派的工單狀態不是「已完成」或「已取消」"],
  "entries": [
    ["待分派印件", "左側選「待分派印件」，在該印件列的操作欄點「工單分派」圖示。", "處理還有工單未指派的印件"],
    ["印件列表", "左側選「印件列表」，在該印件列的操作欄點「工單分派」圖示。", "改派已派齊的印件時用"],
    ["印件詳情頁「工單與生產任務」頁籤", "印件詳情頁切到「工單與生產任務」頁籤，點右上「工單分派」。", "要先核對旗下工單內容時用"],
    ["工單詳情頁頁首「分派」或「改派」", "開該工單詳情頁。未指派時頁首顯示「分派」，已指派時顯示「改派」。", "只處理單張工單時用"]
  ],
  "steps": [
    ["點該印件的「工單分派」，或在工單詳情頁頁首點「分派」或「改派」。", ""],
    ["確認「工單審核主管」，需要時改選其他印務主管。", "「工單分派」預帶你自己。工單詳情頁預帶原本的工單審核主管，空白時必選。"],
    ["在「工單清單」逐列選「負責印務」。從工單詳情頁進入時，直接選「負責印務」。", "沒選印務的列維持未指派，不影響送出。"],
    ["換掉原負責印務的列，選「改派理由分類」。", ""],
    ["點「送出」，或在工單詳情頁點「分派」「改派」。改派的工單在「異動紀錄」多一筆紀錄。", ""]
  ],
  "fields": [
    ["工單審核主管", "審核這批工單製程的印務主管。「工單分派」預帶目前登入者，可改選", "必填"],
    ["工單編號", "既有工單顯示編號；加開的列顯示「送出後建立」", "唯讀"],
    ["工單類型", "打樣或大貨，依印件屬性帶入", "唯讀"],
    ["狀態", "工單目前的狀態；加開的列顯示「草稿（待建立）」", "唯讀"],
    ["負責印務", "執行這張工單的印務。可逐列指定不同人，留空維持未指派", "選填；工單詳情頁必填"],
    ["改派理由分類", "換掉原負責印務時才出現：離職交接、長假代理、工作負荷平衡、客戶要求換窗口、其他，擇一", "改派的列必選"],
    ["補述", "改派原因的文字補充", "選填"]
  ],
  "check": [
    "工單列表的「負責印務」顯示選定的印務，不再顯示「尚未分派」",
    "該印件旗下工單派齊後，自「待分派印件」消失",
    "改派的工單在「異動紀錄」多一筆改派紀錄"
  ],
  "notes": [
    ["「送出」按不下去？", "有改派的列還沒選「改派理由分類」。畫面下方紅字列出還差幾張。選完才能送出。"],
    ["點「送出」後沒有成功提示？", "「工單分派」送出後不另跳提示。展開該印件列，看「負責印務」即可確認。"],
    ["改派後分享成員不見了？", "改派理由選了「離職交接」。這個理由會清空分享成員。其餘理由保留名單。"],
    ["「工單清單」少了某張工單？", "「已完成」與「已取消」的工單不會列出。這兩種工單不能再分派。"]
  ]
}
```

草稿字串出處：

| 字串 | 出處 |
|---|---|
| 「工單分派」圖示 | PrintItemsTable.js:358-367 |
| 「工單與生產任務」頁籤與「工單分派」按鈕 | print-items/detail/page.js:387；WorkOrdersTab.js:160-169 |
| 頁首「分派」「改派」與確認鈕 | detail/page.js:717-730、1082 |
| 工單審核主管預帶登入者 | AssignWorkOrdersDialog.js:56-61、286-293 |
| 工單詳情頁預帶原值、兩欄必選 | detail/page.js:507-520 |
| 負責印務、工單清單 | AssignWorkOrdersDialog.js:158-170、299 |
| 改派理由分類、五值 | AssignWorkOrdersDialog.js:105-110、172-189；mock-data.js:129 |
| 補述 | AssignWorkOrdersDialog.js:191-206 |
| 缺理由時停用與紅字 | AssignWorkOrdersDialog.js:281-282、326-330 |
| 送出後不跳提示 | AssignWorkOrdersDialog.js:270 |
| 改派寫異動紀錄、離職交接清空分享 | store.js:465-505 |
| 只列非終態工單 | PrintItemsTable.js:572-575 |
| 工單列表「尚未分派」 | work-orders/page.js:171 |
| 派齊即離開待分派印件 | pending-assign/page.js:9、28 |

與現行版不同之處：

| 段 | 現行版 | 草稿 | 理由 |
|---|---|---|---|
| intro | 寫「審核主管」，沒有背景 | 補系統建草稿的時點；改名；補改派也在同一處 | 第一句要有人事時地物；欄名依畫面 |
| goals | 「一批工單」 | 「一張印件的工單分派」 | 工單分派以印件為單位開啟 |
| story | 「待分派的草稿工單」 | 「未指派的草稿工單」 | 「待分派」是頁名，工單本身是未指派 |
| before | 第二條是操作路徑 | 改為狀態前提 | before 只放條件 |
| entries | 沒寫圖示；適用時機寫範圍 | 寫明圖示；適用時機寫使用時點 | 對齊畫面 |
| steps 第 1、3、5 步 | 只寫「工單分派」路徑 | 並列工單詳情頁「分派」「改派」 | 多入口並列規則 |
| steps 第 2 步 | 寫「審核主管」，只講預帶你自己 | 改名；說明欄寫明兩條路徑的預帶差異 | 工單詳情頁不預帶登入者 |
| steps 第 4 步 | 選理由並填補述，說明欄寫離職交接 | 只選理由；補述移到 fields；離職交接移到常見問題 | 一步一動作；說明欄一頁不超過兩處 |
| fields | 四列、「五選一」 | 七列，補三列唯讀欄；「擇一」；註明工單詳情頁必填 | 表單實況列齊；STE 禁寫死數量詞 |
| check | 沒寫是哪個畫面的「尚未分派」 | 指明工單列表；頁籤名改「異動紀錄」 | 「尚未分派」只出現在工單列表 |
| notes | 第 3 題問「還看得到嗎」；第 4 題導向加開工單 | 第 3 題改現象問句；第 4 題改「工單清單少了某張工單？」 | 問句寫操作者看到的現象；加開屬 w-add |