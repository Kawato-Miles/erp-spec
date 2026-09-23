報告檔沒有寫成。工具不允許子代理人寫報告檔，所以完整報告附在下方。主對話可以存到 `/private/tmp/claude-501/-Users-b-f-03-029-Sens/0069649d-bdb4-4720-b3ee-54da9de276e2/scratchpad/report-presales.md`。

**差異共 44 筆：**

| 類別 | 筆數 |
|---|---|
| 功能改變 | 17 |
| 改名 | 15 |
| 新增 | 6 |
| 寫法 | 4 |
| 移除 | 2 |

另有手冊沒寫的新功能 5 項，需 Miles 決定的事項 7 筆。

---

# 需求單管理單元：手冊與 Prototype 現況比對報告

比對基準是手冊內容 `unit-presales.json`（七頁），對照 erp repo 分支 prototype/production-stage 的現況（2026-09-23）。

路徑縮寫：

| 縮寫 | 實際路徑 |
|---|---|
| `Q/` | `apps/erp/src/app/(prototype)/quote-prototype/` |
| `O/` | `apps/erp/src/app/(prototype)/orders/` |
| `P/` | `apps/erp/src/app/(prototype)/` |

## 一、差異清單

| # | 頁 id | 段 | 手冊現況 | Prototype 現況（逐字） | 證據（檔:行） | 建議修正 | 類別 |
|---|---|---|---|---|---|---|---|
| 1 | q-overview | intro（單頭群組） | 單頭列「印件類型」 | 「需求品項類別」 | Q/page.js:506；Q/detail/page.js:1169 | 改「需求品項類別」 | 改名 |
| 2 | q-overview | intro（單頭群組） | 「交期與報價截止日」 | 單頭只剩「報價截止日」 | Q/_lib/constants.js:333-349；Q/page.js:525 | 刪「交期」 | 移除 |
| 3 | q-overview | intro（印件群組） | 「印件類型（打樣或大貨）」「毛利率」 | 「印件屬性」「利潤率」 | Q/detail/page.js:618、702 | 兩欄改名 | 改名 |
| 4 | q-overview | intro（印件群組） | 沒列日期欄 | 「印件內部完成日」「印件預計交期」 | Q/detail/page.js:642、654 | 補兩個日期欄 | 新增 |
| 5 | q-overview | roles | 印務主管只確認成本、按「評估完成」 | 被指派的評估印務主管在「待評估成本」「已評估成本」可改「成本估算（未稅）」與「預計產線」 | Q/_lib/permissions.js:44-59；Q/detail/page.js:573 | 補上這兩欄的修改權 | 功能改變 |
| 6 | q-overview | handoff | 「預計交貨日期」帶入，成為訂單的客戶交期 | 訂單單頭沒有交期欄。每筆印件的「印件內部完成日」帶入訂單印件 | O/_lib/store.js:314-325、388-391；O/_components/detail/InfoTab.js:70-73 | 改寫為逐筆印件帶入 | 功能改變 |
| 7 | q-overview | handoff | 收款條件備註與備註帶入「訂單備註」 | 前者進「收款備註」，後者進「訂單須知」 | O/_lib/store.js:380、385；InfoTab.js:62、108 | 拆成兩列 | 改名 |
| 8 | q-overview | handoff | 接單業務帶入「訂單負責業務」 | 「業務負責人」 | InfoTab.js:57 | 改「業務負責人」（見三之 7） | 改名 |
| 9 | q-overview | handoff | 印件帶入項目少三欄 | 難易度、預計產線、印件檔案備註都有帶入 | O/_lib/store.js:329-332 | 補這三欄 | 新增 |
| 10 | q-overview | handoff | 「印件層出貨方式帶進各印件」 | 印件沒填出貨方式時，改帶單頭的值 | O/_lib/store.js:291-296 | 補一句 | 功能改變 |
| 11 | q-overview | handoff | 成本估算、「毛利率」不帶入 | 「利潤率」 | Q/detail/page.js:702 | 改名 | 改名 |
| 12 | q-overview | handoff | 審核業務主管可在送審後改派 | 查無改派入口（搜過 `assigned_manager`、「改派審核」「更換審核」） | InfoTab.js:244-252；O/_lib/store.js:282 | 待決定（見三之 3） | 功能改變 |
| 13 | q-overview | goals、how.lede | 「六個狀態」 | — | ste100 句法規則 11 | 刪掉數量詞 | 寫法 |
| 14 | q-create | steps、fields | 「印件類型」 | 「需求品項類別」 | Q/page.js:506 | 改名 | 改名 |
| 15 | q-create | steps、fields | 選填「預計交貨日期」 | 新增表單沒有這一欄 | Q/page.js:397-546；constants.js:333-349 | 刪除這一欄 | 移除 |
| 16 | q-create | fields、check | 客戶「從客戶主檔搜尋選取」 | 客戶來自廠客主檔，客戶身分為「無」的純廠商不列。詳情另顯示「客戶編號」 | Q/page.js:62-64；Q/detail/page.js:1135-1141 | 補這兩點 | 功能改變 |
| 17 | q-create | fields | 「Slack 連結」列為唯讀 | 新增表單不顯示。編輯表單在沒值時可填「請輸入對話串連結」，有值後停用 | Q/page.js:461-465；Q/detail/page.js:1380-1382 | 從欄位表移出，改放常見問題 | 功能改變 |
| 18 | q-create | notes | 換客戶時系統清空窗口聯絡人 | 系統改帶新客戶的主要窗口。沒有主要窗口時帶第一位。沒有聯絡人才清空 | Q/page.js:421-429 | 改寫答句 | 功能改變 |
| 19 | q-create | actor | 業務 | 「新增」鈕開放給業務、諮詢 | Q/page.js:84、287 | actor 改為「業務、諮詢」 | 功能改變 |
| 20 | q-create、q-items | steps | 一步裡列出多個欄位名 | — | 寫法規則 § 四之 9 | 欄位細節留在 fields 表 | 寫法 |
| 21 | q-items | steps、fields | 「印件類型」 | 「印件屬性」，錯誤提示「請選擇印件屬性」 | Q/detail/page.js:1502-1506 | 改名 | 改名 |
| 22 | q-items | steps、fields | 「預計交貨日期」 | 「印件內部完成日」 | Q/detail/page.js:1548-1553 | 改名 | 改名 |
| 23 | q-items | fields | 沒列 | 唯讀的「印件預計交期」（下一個工作天）。編輯時另有唯讀的「印件編號」 | Q/detail/page.js:1556-1565、1476-1479 | 補兩列 | 新增 |
| 24 | q-items | fields | 單位：張、本、冊、份、個、卷、盒、套、批 | 張、本、個、組、份、件、套、座、盒 | Q/mock-data.js:133-143 | 照畫面改（見三之 5） | 改名 |
| 25 | q-items | points、fields、notes | 「毛利率」 | 「利潤率」 | Q/detail/page.js:702、1698 | 改名 | 改名 |
| 26 | q-items | fields | 依必填、選填排序 | 表單分五區：「基本資訊」「規格與製程」「審稿設定」「成本評估區」「參考附件」 | Q/detail/page.js:1475、1518、1630、1659、1705 | 依五區順序重排 | 功能改變 |
| 27 | q-items | fields | 是否免審稿：「直接走免審路徑」 | 提示圖示：「勾選後此印件轉訂單時自動合格，不進入審稿流程」 | Q/detail/page.js:204、1636-1642 | 對齊提示文字 | 改名 |
| 28 | q-items | notes | 「新增印件」按鈕不見了 | 按鈕還在但停用，並顯示「需求單已成交，印件不可再修改」或「需求單已流失，印件不可再修改」 | Q/detail/page.js:851-859；permissions.js:71-74 | 問句改為「按鈕不能點？」 | 功能改變 |
| 29 | q-estimate | steps | 只有業務回填成本估算 | 印務主管也能點編輯圖示（提示「編輯成本估算與預計產線」）。表單頂部提示「僅能編輯成本估算（未稅）與預計產線，其餘欄位唯讀顯示。」 | Q/detail/page.js:567-580、1463-1467；permissions.js:49-59 | 補印務主管（見三之 1） | 功能改變 |
| 30 | q-estimate | notes | 評估完成後只有業務能改成本 | 「已評估成本」時印務主管也能改 | permissions.js:49-59 | 補印務主管 | 功能改變 |
| 31 | q-estimate | notes | 送不出去是因為沒填難易度 | 印件表單的「難易度」已是必填。實際擋下的提示是「目前沒有任何印件項目，請先新增印件才能送印務評估。」 | Q/detail/page.js:1610-1614、119-123 | 答句改以「沒有印件」為主 | 功能改變 |
| 32 | q-estimate | entries、steps | 印務主管開需求單 | 印務主管側欄沒有「需求單管理」 | P/layout.js:198 | 待決定（見三之 2） | 功能改變 |
| 33 | q-estimate | before | 只寫業務身分 | 後兩步由印務主管操作 | permissions.js:35-40 | 補上「被指派的評估印務主管」 | 寫法 |
| 34 | q-quote | before、steps | 開始條件只寫「已評估成本」 | 「流失」在需求確認中、待評估成本、已評估成本、議價中都能按 | constants.js:53-61；Q/detail/page.js:1075-1079 | 補上這一點 | 新增 |
| 35 | q-quote | notes | 沒寫終態後還能改什麼 | 「需求單已成交或流失，僅需求備註可修改，其餘欄位維持唯讀。」 | Q/detail/page.js:1058-1062、1272-1299 | 補一題常見問題 | 新增 |
| 36 | q-order | intro、story | 交期帶進訂單 | 帶入的是各印件的印件內部完成日 | O/_lib/store.js:314-325、388-391 | 改寫 | 改名 |
| 37 | q-order | steps | 核對「基本資訊」，含負責業務、客戶交期 | 頁籤叫「資訊」，欄名「業務負責人」。沒有客戶交期，改顯示唯讀的「訂單內部完成時間」「訂單預計交貨日期」「全部交完日」 | O/detail/page.js:304；InfoTab.js:57、70-73、353-388 | 依現況改寫 | 改名 |
| 38 | q-order | steps（說明） | 審核業務主管可改派 | 查無改派入口 | InfoTab.js:61、244-252 | 待決定（見三之 3） | 功能改變 |
| 39 | q-order | steps | 核對「數量」 | 「購買數量」 | O/_components/detail/ItemsTab.js:885、1013 | 改名 | 改名 |
| 40 | q-order | notes | 「成本與毛利率」 | 「利潤率」 | Q/detail/page.js:702 | 改名 | 改名 |
| 41 | q-order | notes | 草稿時「金額與發票」頁籤不能用 | 查無這個停用條件。頁籤只在訂單完成、已取消時唯讀 | O/detail/page.js:89；BillingTab.js:60-72 | 待決定（見三之 4） | 功能改變 |
| 42 | q-duplicate | steps | 複製後改數量與金額 | 複製會沿用舊單的「印件內部完成日」 | Q/_lib/store.js:241-267 | 補「重填印件內部完成日」 | 新增 |
| 43 | q-duplicate | before | 任何狀態都能複製 | 複製圖示只給業務或諮詢，且須是接單業務、建立者，或持「編輯（代理）」的人 | Q/detail/page.js:1029-1038；permissions.js:14-27 | 補上身分條件 | 功能改變 |
| 44 | q-quote | steps（說明） | 「流失原因六選一」 | — | ste100 句法規則 11 | 刪掉數量詞 | 寫法 |

## 二、手冊未涵蓋的新功能

| 功能 | 入口 | 證據 | 建議 |
|---|---|---|---|
| 刪除需求單 | 需求單列表操作欄的刪除圖示，限接單業務、建立者或持「編輯（代理）」的人 | Q/page.js:196-229；wiki [[需求單狀態]] | 併入 q-create 常見問題 |
| 從列表編輯單頭 | 需求單列表操作欄的編輯圖示 | Q/page.js:209-215 | 併入 q-create 入口表 |
| 分享需求單 | 「權限管理」頁籤點「新增人員」，權限層級可選「檢視」或「編輯（代理）」，可改層級、可撤銷 | Q/detail/page.js:951-977、1982-2058 | 另開一頁，或併入概覽 |
| 業務看得到哪些需求單 | 業務只看得到自己接單、自己建立或被分享的需求單 | permissions.js:86-93；Q/page.js:109-111 | 併入常見問題 |
| 列表統計卡與篩選 | 列表上方有四張狀態統計卡。篩選條件：「狀態」「帳務公司」「接單業務」「日期範圍」 | Q/page.js:33-59、290-346 | 併入概覽或 q-create |

## 三、需 Miles 決定

1. **成本估算由誰填。**
   - 手冊：業務回填。
   - Prototype：業務與被指派的評估印務主管都能填。
   - wiki [[需求單]]：印務主管評估時填。wiki [[需求單狀態]]：已評估成本時由主管直接改。
2. **印務主管從哪裡進需求單。**
   - 印務主管側欄沒有「需求單管理」（P/layout.js:198）。
   - wiki [[印務主管]] 把成本評估列為負責的工作。
   - 可能是 Prototype 缺這個入口。也可能正式環境靠通知連結進入，但 Prototype 沒做。
3. **審核業務主管能不能改派。**
   - 手冊：可改派。
   - wiki [[訂單]]：審核通過前，主管或業務主管可以重新指定。
   - Prototype：查無入口。
   - 這屬訂單階段，也請確認由哪個單元負責寫。
4. **草稿訂單的「金額與發票」頁籤。**
   - 手冊：草稿時不能用。
   - Prototype：草稿時可以用。
   - wiki [[訂單狀態]]：查無相關限制。
   - 可能是手冊寫錯，也可能是 Prototype 缺限制。
5. **單位選項。** 手冊與 wiki 的單位選項，和 Prototype 不同（Q/mock-data.js:133-143）。寫法規則要求先照 Prototype，但 wiki 也不同，請確認以哪一份為準。
6. **業務主管能不能在需求單上改派接單業務。**
   - wiki [[業務主管]] § 6：可以。
   - Prototype：管理權限只給業務、諮詢（permissions.js:26-27）。
   - 手冊：業務主管不在需求單上動作。
7. **訂單上業務欄的名稱。** 訂單詳情顯示「業務負責人」（InfoTab.js:57）。資料主鏈文件寫訂單要改成「接單業務」。Prototype 內部兩處不一致，請決定手冊要跟哪一個。

## 四、比對範圍說明

| 範圍 | 讀過的檔案 |
|---|---|
| 需求單模組 | Q/page.js、Q/detail/page.js（全檔）；Q/_lib 的 constants、permissions、store、transitions、pricing；Q/mock-data.js（主檔段） |
| 共用 | P/layout.js、P/_lib/sessionStore.js、P/_lib/internal-due-date-display.js、共用元件 PanelDrawer.js 與 TrendValue.js |
| 訂單模組（轉訂單相關） | O/_lib/store.js（由需求單建立訂單段）、O/_lib/permissions.js、O/detail/page.js；O/_components/detail 的 InfoTab、ItemsTab、BillingTab；billing 資料夾的收款項目、款項紀錄、發票三個區塊 |
| 資料主鏈 | P/MOCK-DATA-CHAIN.md：交期欄位、欄名改名、廠客主檔、鏈八 |
| 異動紀錄 | 09-08 以後需求單模組的 22 筆 commit；另追查了下列改動的時間點：需求品項類別、印件內部完成日、毛利率、預計交貨日期、印務主管側欄 |
| wiki | 需求單、需求單狀態、印務主管、業務主管、訂單、訂單狀態 |

有兩項已知的選項衝突沒列入差異：流失原因、評估印務主管人數。寫法規則已指示這類衝突先照 Prototype，手冊現況也和 Prototype 一致。