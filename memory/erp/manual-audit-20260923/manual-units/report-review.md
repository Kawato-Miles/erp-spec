我沒能寫出報告檔：執行環境不允許子代理寫報告檔，所以沒有產生 `/private/tmp/claude-501/-Users-b-f-03-029-Sens/0069649d-bdb4-4720-b3ee-54da9de276e2/scratchpad/report-review.md`。完整報告改貼在下方，需要存檔請主對話照原文寫入。

另外寫了一個中間檔 `/private/tmp/claude-501/-Users-b-f-03-029-Sens/0069649d-bdb4-4720-b3ee-54da9de276e2/scratchpad/draft-r-assign.json`，是第五段草稿的 JSON，任務書沒要求這個檔。erp repo 與 Sens repo 都沒有改動。

- **差異共 36 筆**：功能改變 15、改名 3、新增 5、移除 0、寫法 13。
- **需 Miles 決定 3 筆**，另附 1 筆 Prototype 字串瑕疵供轉前端。
- **四條已知線索**：前三條查證後手冊已對齊，無差異。只有「合格輪完稿縮圖」手冊沒寫，列進第二段。

---

# 審稿管理單元：手冊 vs Prototype 現況比對報告

- 單元：審稿管理（r-overview、r-assign、r-judge、r-resupply、r-return、r-history、r-edit-note）
- Prototype 分支：prototype/production-stage
- 路徑前綴：`P/` ＝ `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`

| 已知線索 | 查證結果 | 證據 |
|---|---|---|
| 回簽前印件詳情頁不出現分派審稿鈕 | 成立。r-assign 常見問題第四題已對齊 | `P/print-items/detail/page.js:232-234、486-490`；`P/prepress-review/_lib/selectors.js:182`；commit 3647441b |
| 審稿三角色重建 | 成立。角色名與選單「待審訂單」「待分派審稿」一致 | `P/_lib/sessionStore.js:16-18`；`P/layout.js:64-75、194-196`；commit 4ab9e108 |
| 分派下拉只留人名與能力 | 成立。選項為「姓名（能力 N）」或「姓名（能力 未設定）」 | `P/prepress-review/_components/AssignReviewerDialog.js:47-52` |
| 合格輪完稿縮圖 | 成立。「印件檔案」面板只顯示當前合格輪次的完稿縮圖，手冊未提 | `P/print-items/_components/detail/PrintItemInfoPanels.js:440-469` |

## 一、差異清單

| 頁 id | 段 | 手冊現況 | Prototype 現況（逐字） | 證據 | 建議修正 | 類別 |
|---|---|---|---|---|---|---|
| r-overview | intro | 業務「在審稿管理」送稿 | 上傳在訂單詳情「訂單項目」操作欄「上傳稿件」；審稿管理沒有上傳動作 | `P/orders/_components/detail/ItemsTab.js:1111-1125`；`ReviewOrderList.js:469-497` | 改成在「訂單項目」頁籤上傳 | 功能改變 |
| r-overview | what lede | 「審稿紀錄」頁籤看得到負責審稿人員 | 「負責審稿人員」在「印件基本資訊」面板；頁籤只有各輪「審稿人員」欄 | `PrintItemInfoPanels.js:188-193`；`ReviewHistoryTab.js:77-82` | 分開寫兩處各看什麼 | 功能改變 |
| r-overview | what 印件審稿欄位 | 印件檔、審稿後檔案；負責審稿 | 面板欄名「原始印件檔」「審稿後印件檔」「完稿縮圖」；詳情頁「負責審稿人員」 | `PrintItemInfoPanels.js:467-469、189` | 照面板欄名寫 | 改名 |
| r-overview | what 兩張清單 | 用「母列」「子表」「母集合」 | 畫面上沒有這些字（程式註解用語） | `ReviewOrderList.js:50-57` | 改白話，刪「母集合」 | 寫法 |
| r-overview | what 待審訂單 | 沒寫審稿人員看到的範圍 | 審稿人員只看到自己負責、審稿還沒完結的訂單 | `ReviewOrderList.js:93-100`；`selectors.js:71-79` | 補一句 | 新增 |
| r-overview | stages 稿件未上傳 | 負責角色「審稿人員」 | 在等業務交稿；上傳鈕只給業務 | wiki [[印件狀態]] 審稿維度；`P/orders/_lib/permissions.js:173` | 改「業務」 | 功能改變 |
| r-overview | stages 已確認可製作 | 「業務、系統」；寫「建立工單草稿」 | 線下單要等訂單管理人「確認製作細節」才建工單草稿；只有線上單由系統直接建 | `ReviewDialog.js:168-179`；`print-items/detail/page.js:236-242、493-497`；wiki [[訂單管理人]] 職責 5 | 刪「系統」，處境改寫 | 功能改變 |
| r-overview | flow 箭頭 | 箭頭字是按鈕名（「完成審核：合格」「補件上傳」等）；「待分派→等待審稿」含「免審上傳稿件」 | 免審印件上傳後由系統直接判合格 | `ItemsTab.js:362-365`；`orders/_lib/artwork-upload.js:17-18` | 改寫業務事件，刪該標籤 | 寫法 |
| r-overview | roles | 手動分派「僅適用線下單」 | 線上單經系統分派後可手動換人 | `selectors.js:165-174`；wiki [[訂單管理人]] | 補線上單換人 | 功能改變 |
| r-assign | intro | 「線下單稿件交出後」才指派；首句 38 字 | 分派不看稿件有無；稿件未到時轉「稿件未上傳」 | `orders/_lib/store.js:1376-1385` | 改「訂單回簽後」並拆句 | 功能改變 |
| r-assign | entries、steps | 「展開訂單列」 | 清單預設全部展開 | `ReviewOrderList.js:506` | 刪「展開」 | 功能改變 |
| r-assign | steps | 點「批次分派」 | 按鈕名「分派審稿人員」 | `ReviewOrderList.js:484-493` | 改名 | 改名 |
| r-assign | steps 說明 | 分派後一律依稿件有無轉狀態 | 已有負責人時是換人：印件審稿狀態不變，活動紀錄寫「改派」 | `store.js:1365-1375` | 補換人情形 | 功能改變 |
| r-assign | fields | 只有「審稿人員」「原因」 | 對話框有「印件資訊」表，列印件編號、名稱、訂單編號、難易度，可逐列移除 | `AssignReviewerDialog.js:59-102、150-158` | 補一列 | 新增 |
| r-assign | before | 沒寫已棄用、線上單待分派 | 這兩種都不能分派 | `selectors.js:170-174` | 補兩條 | 功能改變 |
| r-assign | check | 「「待分派審稿」不再列出這件印件」 | 清單列出訂單下全部印件；訂單沒有其他待分派印件時，整張訂單才離開清單 | `ReviewOrderList.js:50-57`；`selectors.js:83-86` | 改寫成活動紀錄一點 | 功能改變 |
| r-assign | check、steps | 沒寫活動紀錄 | 印件活動紀錄寫「手動分派」或「改派」 | `store.js:1367-1377`；`ActivityTab.js:26-31` | 補活動紀錄 | 寫法 |
| r-assign | notes | 「「批次分派」按不下去？」 | 按鈕名「分派審稿人員」；另有提示「先於展開的訂單內勾選印件」 | `ReviewOrderList.js:194-204、491` | 改問句，補未勾選 | 改名 |
| r-judge | entries | 沒有清單操作欄入口 | 操作欄有「審稿」圖示鈕，點了進印件詳情頁 | `ReviewOrderList.js:383-401` | 補入口 | 新增 |
| r-judge | entries | 「展開訂單」 | 預設全部展開 | `ReviewOrderList.js:506` | 刪「展開」 | 功能改變 |
| r-judge | fields | 沒有「共用審稿備註」 | 一次審多件且判不合格時出現，選填 | `ReviewDialog.js:97-101、247-266` | 補一列 | 新增 |
| r-judge | fields | 退件原因「十選一」 | 值域：出血不足、解析度過低、色彩模式錯誤、缺少必要元素、版面超出安全區、尺寸不符、特殊工藝圖層異常、字型未外框、技術性退件、其他 | `P/_lib/prepressReview.js:28-39` | 列出值域，不寫死數量 | 寫法 |
| r-judge | notes | 按不下去的原因含「不可審的印件」 | 不可審的印件本來就勾不下去；實際只有「未勾選」「跨訂單」 | `ReviewOrderList.js:59-63、414` | 改答句 | 功能改變 |
| r-judge | intro | 首句 37 字 | － | － | 拆句 | 寫法 |
| r-resupply | steps 第 5 步 | 審稿人員在「待審訂單」重新看到印件 | 這是系統行為，不是操作者動作；而且這張訂單在「不合格」期間一直留在清單上 | `selectors.js:53-54、71-79` | 刪這一步 | 寫法 |
| r-resupply | check | 補件後標「重審」 | 只有自「合格」退回重審的印件才標「重審」；「不合格」補件後不標 | `selectors.js:205-211`；`ReviewOrderList.js:318-336` | 限定為待改稿路徑，或刪除 | 功能改變 |
| r-resupply | steps 說明 | 只寫兩種落點 | 免審印件補件後直接判合格：「已補件與完稿縮圖；本印件免審，本輪由系統自動判合格」 | `store.js:602-659`；`ItemsTab.js:409-413` | 補免審落點 | 新增 |
| r-resupply | intro | 首句 38 字 | － | － | 拆句 | 寫法 |
| r-return | steps、check | 結果只寫狀態 | 活動紀錄寫「確認可製作」或「退回重審」 | `ActivityTab.js:42-47`；`store.js:1414-1419` | 補活動紀錄 | 寫法 |
| r-history | actor | 「全角色（唯讀）」 | － | － | 只寫角色名 | 寫法 |
| r-history | entries | 由「訂單項目」點印件名稱進詳情頁 | 「訂單項目」的名稱欄不是連結，要點「檢視印件」圖示鈕；審稿清單的名稱才是連結 | `ItemsTab.js:782-803、1190-1197`；`ReviewOrderList.js:285-287` | 分寫兩條路徑 | 功能改變 |
| r-history | fields | 空陣列 | － | － | 依寫法規則填 null | 寫法 |
| r-history | intro、story | 32 字、34 字 | － | － | 拆句 | 寫法 |
| r-edit-note | actor | 「審稿人員（限該輪原審稿人員本人）」 | － | － | 只寫「審稿人員」，本人限制放 before | 寫法 |
| r-edit-note | entries | 「只有本人審的那一輪有「操作」欄」 | 任一輪可改時整欄都出現；只有本人審的輪次有「修改備註」圖示鈕 | `ReviewHistoryTab.js:57-60、146-168` | 改寫適用時機 | 功能改變 |
| r-edit-note | intro | 首句 32 字 | － | － | 拆句 | 寫法 |

## 二、手冊未涵蓋的新功能

| 功能 | 入口 | 證據 | 建議 |
|---|---|---|---|
| 清單依印件內部完成日近者優先排序；印件列有「急件」標籤、「印件預計交期」「印件內部完成日」欄；訂單列有「距印件預計交期天數」 | 「待審訂單」「待分派審稿」 | `ReviewOrderList.js:139-155、240-259、288-296、356-371` | 併入 r-overview what；r-judge 補一題常見問題 |
| 「重審」標籤，滑鼠提示帶退回原因；未填時顯示「業務未填退回原因」 | 清單「審稿狀態」欄 | `ReviewOrderList.js:318-336`；`selectors.js:205-213` | 併入 r-judge 常見問題 |
| 「完稿縮圖」只顯示當前合格輪次；尚無時顯示「－」 | 印件詳情頁「印件檔案」面板 | `PrintItemInfoPanels.js:440-469`；`FileCells.js:41-53` | 併入 r-history |
| 分派與完成審核對話框都能逐件移除印件 | 兩個對話框 | `AssignReviewerDialog.js:92-99`；`ReviewDialog.js:292-298` | r-assign 已寫進草稿；r-judge 補一步 |
| 活動紀錄記下列事件：手動分派、改派、送出審核、退回重審、確認可製作、審稿備註修改 | 印件詳情頁「活動紀錄」頁籤 | `ActivityTab.js:19-55`；`print-items/detail/page.js:378-382` | 併入 r-history 步驟 |
| 「審稿狀態」篩選；關鍵字搜尋訂單編號、客戶名稱、案名 | 兩張清單的篩選區 | `ReviewOrderList.js:445-467` | 併入 r-overview what |

## 三、需 Miles 決定

1. **退回重審的執行角色三方不一致。**

   | 來源 | 誰能退回重審 | 證據 |
   |---|---|---|
   | Prototype | 業務、諮詢 | `P/orders/_lib/permissions.js:195-201` |
   | 手冊 r-return | 業務、諮詢 | － |
   | 手冊訂單單元 o-confirm-producible | 業務 | － |
   | wiki（多數卡） | 業務 | [[印件狀態]]、[[審稿人員]]、[[審稿輪次]] |
   | wiki（審稿主管卡） | 業務／諮詢 | [[審稿主管]] 第 36 行 |

2. **同一件工作在兩個單元各有一頁。** r-return 與訂單單元的 o-confirm-producible 內容重複，角色寫法也不同步（見第 1 點）。要決定保留哪一頁。
3. **圖示鈕怎麼稱呼。** 下列按鈕只有圖示，名稱只出現在滑鼠提示：「補件」「確認可製作」「退回重審」「檢視印件」「修改備註」「審稿」。手冊現在照提示文字寫「點「補件」」。選項是沿用現寫法，或統一寫「點「補件」圖示鈕」。
4. **供轉前端的 Prototype 字串瑕疵**（不是手冊問題）：
   - 活動紀錄的「改派」顯示英文「reason：」（`ActivityTab.js:31`）。
   - 「退回重審」對話框的說明句約 90 字（`ItemsTab.js:1388`）。

## 四、比對範圍說明

- **審稿模組**：`prepress-review/` 下全部頁面，含 `ReviewOrderList.js`、`AssignReviewerDialog.js`、`ReviewDialog.js`、`_lib/selectors.js`、`README.md`。
- **共用層**：`_lib/prepressReview.js`、`_lib/sessionStore.js`、`layout.js`。
- **印件**：`print-items/detail/page.js`、`ReviewHistoryTab.js`、`ActivityTab.js`、`FileCells.js`、`PrintItemInfoPanels.js`。
- **訂單**：`orders/detail/page.js`、`ItemsTab.js`、`ArtworkUploadSlots.js`、`PrintItemEditDrawer.js`、`_lib/artwork-upload.js`、`_lib/permissions.js`、`_lib/store.js`、`_lib/order-review-derive.js`、`mock-data.js`。
- **資料主鏈**：`MOCK-DATA-CHAIN.md`。
- **09-08 後相關 commit**：3647441b、0299a920、4ab9e108、c9784825、99a93959、f6772840、013a1bec。
- **wiki 卡**：[[印件狀態]]、[[審稿人員]]、[[審稿主管]]、[[訂單管理人]]、[[業務]]、[[審稿分配規則]]、[[稿件管理規則]]、[[審稿輪次]]。
- **手冊對照**：訂單單元 o-upload-artwork、o-confirm-producible。

## 五、r-assign 改寫草稿

```json
{
 "id": "r-assign",
 "kind": "howto",
 "title": "分派審稿人員",
 "actor": "訂單管理人、審稿主管",
 "intro": "訂單回簽後，訂單管理人或審稿主管在審稿管理指派審稿人員。\n已分派的印件要換人時，也用同一個動作。",
 "goals": ["完成印件的審稿人員分派，讓稿件交到審稿人員手上"],
 "points": ["分派審稿人員", "待分派", "能力等級", "負責審稿"],
 "story": "客戶的精裝書訂單已回簽，封面稿也交來了。封面印件的審稿狀態停在「待分派」。你是訂單管理人，要指派一位審稿人員接手。",
 "before": [
  "以訂單管理人或審稿主管身分登入",
  "訂單已回簽；線上單為已付款",
  "印件審稿狀態不是「合格」或「已確認可製作」",
  "印件不是免審印件，也未被取消製作（非「已棄用」）",
  "線上單印件已由系統分派過；系統分派前不能手動分派"
 ],
 "entries": [
  ["審稿管理「待分派審稿」", "左側「審稿管理」點「待分派審稿」。", "只看還有印件待分派的訂單"],
  ["審稿管理「待審訂單」", "左側「審稿管理」點「待審訂單」。", "已分派的印件要換人時"],
  ["印件詳情頁「分派審稿人員」", "在審稿清單點印件名稱，進印件詳情頁。", "只分派這一件時"]
 ],
 "steps": [
  ["在清單勾選印件後點「分派審稿人員」，或在印件詳情頁點頁首同一鈕。開啟「分派審稿人員」對話框。", "分派限同一張訂單內的印件。不能分派的印件勾不下去。"],
  ["在「印件資訊」核對印件。不分派的印件點該列的移除圖示。", ""],
  ["在「審稿人員」選一位人員。", ""],
  ["視情況填「原因（選填）」，點「確認分派」。印件活動紀錄多一筆「手動分派」。", "稿件已交轉「等待審稿」，未交轉「稿件未上傳」。換人時紀錄為「改派」，印件審稿狀態不變。"]
 ],
 "fields": [
  ["印件資訊", "本次要分派的印件與難易度。可逐列移除", "唯讀"],
  ["審稿人員", "啟用中的審稿人員，選項附能力等級。能力等級未設定者也列出", "必填"],
  ["原因", "改派或特殊指派時補充原因", "選填"]
 ],
 "check": [
  "印件的「負責審稿」顯示所選人員",
  "首次分派的印件審稿狀態轉「等待審稿」或「稿件未上傳」",
  "印件「活動紀錄」頁籤多一筆「手動分派」或「改派」"
 ],
 "notes": [
  ["候選清單有請假中或能力等級「未設定」的人？", "系統不記錄請假，能力等級也只供參考。要不要選這個人，由分派者自行判斷。"],
  ["「待分派審稿」看不到線上單的印件？", "線上單首次上傳稿件時由系統自動分派。要換人時，到「待審訂單」勾選後分派。"],
  ["「分派審稿人員」按不下去？", "還沒勾選印件，或勾選跨了訂單。分派限同一張訂單，取消其他訂單的勾選後再按。"],
  ["印件詳情頁沒有「分派審稿人員」？", "訂單還沒回簽，或印件已合格、已確認可製作、是免審印件。這些情形不能分派。"]
 ]
}
```

草稿已用程式逐句計數：扣掉「」內字串後，操作指示都在 25 字內，說明句都在 30 字內。說明欄只用兩處。沒有單號、實作詞、人稱代名詞或跨單元指涉。

### 草稿與現行版不同之處

| 鍵 | 現行版 | 草稿 | 依據 |
|---|---|---|---|
| intro | 「線下單稿件交出後」；首句 38 字 | 改「訂單回簽後」，補換人，拆句 | `store.js:1365-1386`；wiki [[訂單管理人]] |
| goals | 「進到」審稿人員手上 | 改「交到」 | － |
| story | 沒寫回簽前提 | 加「訂單已回簽」，改用「你是訂單管理人」 | 寫法規則 § 三 |
| before | 回簽、非免審 | 補線上單已付款、未取消製作、線上單須系統先分派 | `selectors.js:19-24、165-174` |
| entries | 兩條清單入口都寫「展開」；「待審訂單」排第一 | 刪「展開」；「待分派審稿」排第一；「待審訂單」改為換人入口 | `ReviewOrderList.js:506`；`selectors.js:83-86` |
| steps 第 1、2 步 | 「子表勾選」後點「批次分派」 | 勾選與點鈕合成一步，並列印件詳情頁路徑；按鈕改名「分派審稿人員」 | `ReviewOrderList.js:491`；`print-items/detail/page.js:486-490` |
| steps 新增一步 | 無 | 在「印件資訊」核對並移除 | `AssignReviewerDialog.js:59-102` |
| steps 能力等級說明 | 放在步驟說明欄 | 移到 fields 與常見問題（說明欄限兩處） | 寫法規則 § 四第 8 條 |
| steps 最後一步 | 只寫狀態 | 補活動紀錄「手動分派」；說明補換人時狀態不變 | `store.js:1365-1386`；`ActivityTab.js:26-31` |
| fields | 兩列 | 補「印件資訊」列 | `AssignReviewerDialog.js:59-102` |
| check | 「待分派審稿不再列出」 | 改成活動紀錄；狀態轉換限定首次分派 | `ReviewOrderList.js:50-57` |
| notes | 「批次分派」、只講能力未設定 | 按鈕改名；補請假、未勾選、換人入口、不能分派的具體情形 | `ReviewOrderList.js:194-204`；`selectors.js:170-182`；`prepressReview.js:6-10` |