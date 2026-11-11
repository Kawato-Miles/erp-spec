# 票 23：多項工作追蹤調研（階段定義、在製上限、等待他人的項目、跨專案總覽、外部系統狀態要不要重記）

主對話抽查（2026-11-12）：用 `curl` 抓回兩個來源全文，逐字比對 12 句，全部相符：《看板指南》6 句、DJAA〈等待或阻擋項目要不要計入在製上限〉6 句。另核對三項轉述：指南現行版為 2025 年 5 月版；DJAA 原文把停車場設上限列為成熟度第 4 級實務（LW 4.1），並說太早導入會招致抗拒；個人看板官網的起手值「2–3 for individuals, 3–7 for teams」。三項皆正確。檔內網址全部回 200。其餘未抽查。

調研日期：2026-11-12。接續票 13、16、18、19；已引過的網址不重複（同網站的其他頁可用）。
範圍：一個人或小團隊同時追多項工作的成熟做法。涵蓋看板方法（Kanban Method）、個人看板（Personal Kanban）、專案組合層的流動層級（Flight Levels）、專案經理對個人在製品的管理（Johanna Rothman）、阻擋項實務（David J. Anderson 事務所與從業者）。不找工具。
查證方式：除標註「抓取摘要」者外，所有引句都先用 `curl -sL` 取得原始檔（HTML 或 PDF 轉文字），再以腳本正規化（還原 HTML 字元實體、統一引號與連字號、合併空白、不分大小寫）後做子字串比對，結果全部逐字相符。引句不超過 15 個英文字詞。
- 只有摘要的項目：flightlevels.io 的句子先由 WebFetch 摘要找出，再回原始 HTML 比對，皆相符；「第 3 層是否限制在製品、有無跨專案總覽」只有 WebFetch 摘要，原頁未載，標「未載」。
- personalkanban.com 根網址回傳「請稍候，正在驗證」的機器人檢查頁，未取得內容；本檔改引同站 `learn/` 與 `pk/` 的文章頁（可直接抓回全文），不繞過檢查。
- Little 定律（Little's Law）出處為 Daniel Vacanti 於 Scrum.org 的白皮書（PDF，已轉文字比對）。

來源類型：官方＝標準或方法指南的發行單位；第一手＝方法原作者，或有實務年資的從業者談自己的做法；社群＝論壇、第三方文章；二手＝轉述、行銷。

## 一、摘要

1. 所有做法都以三件事為核心：把工作攤開看見、限制同時進行的數量、定期回頭檢視。分歧只在細節。
2. 階段怎麼定義：《看板指南》（Kanban Guide）只要求寫出「開始點、完成點、中間狀態、在製品控制方式」，不規定欄位樣式。個人看板的起手式是三欄（選項、進行中、完成），之後才視需要加「今天」「等待」「阻擋」。
3. 在製上限怎麼設：2025 年版《看板指南》刻意放寬為「必須明確控制數量，形式不限」。個人看板給的起手值是個人 2 到 3 項。Rothman 給的是團隊算法（欄位內人數除以 2）。沒有找到「某種工作該設幾項」的官方數字。
4. 「等別人」的項目：看板方法有兩套並存的做法。一套是原地標記（旗標或顏色），項目留在原欄、仍計入該欄在製品、時鐘不停。另一套是停車場（parking lot），專放等待外部單位且時間已知的項目，計時，超過約定時間就改標為阻擋。
5. 阻擋項要不要算進在製上限：Anderson 事務所（DJAA）的看板成熟度模型把「對停車場設上限」放在較高成熟度（第 4 級），並警告太早做會引發強烈抗拒。
6. 跨專案總覽：流動層級（Flight Levels）把總覽分成三層（執行、協調、策略）；跨價值流的板子「實體或虛擬合併」以看見依賴。Rothman 的做法是個人層用一塊板，專案組合層限制「進行中專案數」。
7. 外部系統狀態要不要重記：沒有任何來源明文回答這題。最接近的線索是三項。《看板指南》允許一個流程有多個開始點與完成點。DJAA 的停車場變體用「另開一張代表外部請求的卡」。Pereira 主張阻擋用旗標、不用「阻擋欄」，理由是保住資料與位置。這些都不等於「不重記」的規則，標未查證。
8. 共同缺點：個人看板類方法的起手值（2 到 3 項）出自作者經驗，不是實證；流動層級的文獻以大型組織為背景；停車場與阻擋政策需要團隊事先約定，單人用起來是否過重，來源未載。

## 二、階段怎麼定義

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 《看板指南》的工作流程定義（Definition of Workflow）：寫出工作項目、開始與完成的定義、狀態、在製品控制、政策、服務等級預期 | 官方（Kanban Guide，Vacanti 為共同創作者） | kanbanguides.org/english/ 。「A definition for when work items are started and finished within the workflow.」「Depending on the work item, your workflow may have more than one started or finished point.」「Kanban system members also often require more than one DoW.」「There are no specific guidelines for how a visualization should look.」 | 任何知識工作；一個人與一個組織都能用；允許不同層級各有一份定義 | 只給必備元素，不給欄位範例；「開始」「完成」要自己定，定義不清會讓之後的在製品與流動時間失真 |
| 個人看板三欄起手：選項、進行中、完成；之後依需要加欄 | 第一手（Personal Kanban 作者 Jim Benson 與 Tonianne DeMaria Barry 的官網） | personalkanban.com/learn/personal-kanban/ 。「Create a board with three columns: Options, Doing, Done」；「Additional columns (for example, Today, Waiting, Blocked)」 | 一個人管多條互相重疊的責任；剛開始導入，想用最少的規則 | 三欄只表示「做到哪」，看不出每項工作的內部階段；該頁未談階段多於三個時怎麼定義 |
| 把待辦分成三段優先欄（優先過濾器，Priority Filter），各欄自帶上限 | 第一手（Jim Benson） | personalkanban.com/pk/designpatterns-the-priority-filter-a-prioritization-tutorial/ 。「P3 (WIP: 10) → P2 (WIP: 6) → P1 (WIP: 3)」 | 待辦很多、每項都像急件，需要逐步篩選 | 數字（10、6、3）是範例；頁面未說明依據 |
| 專案經理自用的實體板，每週重排，視情況加「今天」欄 | 第一手（Johanna Rothman，專案管理顧問） | jrothman.com/mpd/project-management/2017/02/why-i-use-a-paper-kanban-board/ 。「I often—not always—have a “today” column」 | 單人、工作會常變、願意每週回顧 | 作者自述的個人偏好，未談他人是否適用 |
| 看板的階段是描述「價值流」的步驟，不是工具欄位 | 第一手（Jim Benson） | personalkanban.com/pk/designpatterns-mission-based-kanban-personal-kanban-for-small-teams/ 。「a shared agreement about what “done” means」（頁面以 Draft → Edit → Accept → Publish 為例） | 小任務、兩人協作的短期工作 | 範例是一次性的三小時任務，不涵蓋長期多需求 |

## 三、在製上限怎麼設

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 必須明確控制在製品數，形式不限；2025 年版刻意放寬「如何控制」 | 官方（Kanban Guide） | kanbanguides.org/english/ 。「Kanban system members must explicitly control the number of work items」；2025 年修訂說明：「Less explicit (and hence more flexible) how WIP is controlled」 | 任何情境；不想被固定數字綁住 | 沒有數字，也沒有算法；新手不知道從哪裡起算 |
| 個人起手值：個人 2 到 3 項，團隊 3 到 7 項，視情況調整；進行中已滿就不拉新工作 | 第一手（personalkanban.com） | personalkanban.com/learn/personal-kanban/ 。「2–3 for individuals, 3–7 for teams, depending on context」 | 個人或小團隊起步 | 數字是作者建議，頁面未給實證；未談「同時有多個專案時是一個總上限，還是每專案各一個」 |
| 團隊算法：欄位內人數除以 2 | 第一手（Johanna Rothman） | jrothman.com/mpd/agile/2017/02/how-agile-creates-and-manages-wip-limits/ 。「Divide that number by 2」（前一句說明被除數為在該欄工作的人數） | 有明確人數、有「不單獨作業」政策的團隊 | 以人數為基礎，對單人（除以 2 後不足 1）不適用 |
| 管理者自己也要限制個人在製品；否則顧不到最重要的工作，下游人員會朝錯誤方向做事 | 第一手（Johanna Rothman） | nofluffjuststuff.com/blog/johanna_rothman/2011/10/reducing_your_own_wip_and_yves_who_is_series 。「you have to limit your own WIP」 | 專案經理、專案群經理、任何「靠別人產出工作」的人 | 該文提到向管理者推廣時，常得到「不用看板」的回答；理由是個人看板對高階主管的效益未談 |
| 專案組合層：限制「同時進行的專案總量」，用成本延誤（Cost of Delay）排序，先問「這件事要不要做」 | 第一手（Johanna Rothman） | jrothman.com/mpd/2021/12/manage-interruptions-with-defensive-project-portfolio-management/ 。「Limit the total WIP」；「Visualize all the work」；「Zeroth question」 | 一個團隊同時有產品工作與臨時插單 | 要靠固定週期（作者建議從每週起）與所有提需求的人一起評估，單人情境未談 |
| 在製品是流動時間的主因：流動時間太長，先想的是降在製品，而不是加開新工作 | 第一手（Daniel Vacanti，Scrum.org 白皮書） | scrumorg-website-prod.s3.amazonaws.com（檔名《Little’s Law for Professional Scrum with Kanban》，2018，3 頁）。「the first thing you should consider is lowering WIP」；「the more things that you work on at any given time」 | 想用數據支持「為什麼要限制」；要往機率式預測發展 | 該文明說 Little 定律只能回頭看，不能拿來做確定式預測：「we are in the measurement business, not the forecasting business」 |
| 上限太低要留意，但知識工作很少出現 | 社群（Prokanban 部落格；署名欄與內文作者不一致，作者未確認） | prokanban.org/blog/https-prokanban-org-blog-dont-just-limit-wip-optimize-it 。「having too low a WiP limit is rarely an issue for knowledge work」 | 把限制當學習用的政策 | 作者不確定，可信度標低 |
| 看不見的工作不在上限內：沒上板的工作、過大的卡片、個人在團隊板上的過載 | 第一手（Jim Benson） | personalkanban.com/pk/expert-finding-hidden-wip-2/ 。「Limiting WIP only works on the WIP you can see」；「The work that isn’t on your board is managing you」 | 已有板子但仍覺得被淹沒 | 該文以人為單位談隱藏在製品；未提如何把「另一個系統裡的工作」算進個人上限 |

## 四、「等別人」的項目怎麼表示

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 原地標記：阻擋項停在原欄、加旗標與備註，仍計入該欄在製品；時鐘不停 | 第一手（Steve Pereira，流動顧問；引用 Pro Kanban 做法） | visibleconsulting.substack.com/p/my-blocker-playbook 。「The Clock Never Stops」；「items should never go backwards on a board」；定義：「the item is officially blocked」（句首為「若團隊無法靠自己的行動推進該項目」）；並明寫反對「阻擋欄」：「Why can’t we use a swimlane or column to track blocks?」 | 在乎流動數據、想知道「卡在哪個階段、卡多久」；工具支援旗標 | 文中以 Jira 為前提；單人是否需要「阻擋類型分群」未談；個人經驗文章 |
| 看板成熟度模型（Kanban Maturity Model）的阻擋標示：用符號或指定顏色的便利貼，留在原欄，計入該欄在製品 | 第一手（DJAA，David J. Anderson 的事務所） | djaa.com/kanban-evergreen-should-we-include-waiting-or-blocked-items-in-wip-limits/ 。「they add to the WIP for that column」 | 團隊要把阻擋項當成需要升級處理的異常 | 頁面說明這會製造壓力（「impedes pulling work into the column」），故意以壓力促成快速排除，不適合不想被卡住的情境 |
| 停車場（parking lot）：專放等待外部單位（另一服務、客戶、供應商）且時間已知的項目；要計時；超過約定的服務等級預期後改標為阻擋 | 第一手（DJAA） | 同上頁。「designate a special area of the kanban board, a parking lot」；「Make sure to track the time the card spends in the parking lot」；「mark and manage the work item as blocked」 | 等待時間不由自己決定，且大致可預期（例：供應商交貨、客戶回覆） | 需要事先約定「等多久算阻擋」；頁面說明這是成熟度第 3 級以上的做法，太早導入可能引起抗拒 |
| 對停車場設在製品上限：成熟度第 4 級的做法 | 第一手（DJAA） | 同上頁。「Limit WIP for a dependency parking lot」；「may result in too much stress」 | 對方系統的前置時間穩定、可預測 | 頁面明說這會產生壓力；初次設定值「略高於平均在製品」，需用歷史資料調整 |
| 「Waiting」欄：個人看板可加的欄位；Rothman 把「有六項卡在各種等待狀態」的板子當成失敗範例 | 第一手（Jim Benson；Johanna Rothman） | personalkanban.com/learn/personal-kanban/ 。「Additional columns (for example, Today, Waiting, Blocked)」；jrothman.com/mpd/portfolio-management/2017/02/visualize-your-work-so-you-can-say-no/ 。「six stuck in various Waiting states」 | 想用最簡單的方式標示等待 | Pereira 反對設阻擋欄，理由是欄位會讓項目離開原階段、丟失位置；兩邊說法衝突，來源未調和 |
| 《看板指南》只要求「解除阻擋」是主動管理項目之一，沒有規定怎麼表示 | 官方（Kanban Guide） | kanbanguides.org/english/ 。「Unblocking blocked work」 | 想保留彈性 | 沒有表示法、沒有升級門檻 |

## 五、跨多個專案的總覽怎麼做

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 流動層級（Flight Levels）三層：第 1 層執行、第 2 層協調、第 3 層策略組合；第 2 層管跨團隊依賴 | 第一手（Klaus Leopold 與 Siegfried Kaltenecker 合著的《Flight Levels: A Short Introduction》，2022，PDF） | flowsphere.ch/wp-content/uploads/2024/02/Flight-Levels-A-Short-Introduction.pdf 。「These dependencies must be managed - that is the task of Flight Level 2.」；「the various boards on which value streams are visualised are brought together physically or virtually」；「Starting work costs money. Finishing work makes money.」 | 多團隊、多價值流的組織；要看見跨團隊依賴 | 該書明說這「不是組織圖，也不是成熟度模型」（「Flight Levels Model is neither an organisational model nor a maturity model」）；內容為大型組織背景，單人適用性未談；文中未給在製品數字 |
| 流動層級官網：第 2 層「跨團隊限制在製品、看見依賴」 | 第一手（flightlevels.io，Leopold 方法的官方站） | flightlevels.io/what-is-flight-levels 。「start limiting your work-in-progress across teams」；「visualize your dependencies」；第 1 層：「Work of individual teams or departments」；第 3 層：「Bridge the gap between strategy and execution」（以上皆經原始 HTML 比對）。「是否有跨專案總覽」：WebFetch 摘要指出該頁未載，標未載 | 想知道層級間要放哪些東西 | 官網為行銷頁，只有口號；細節要靠書或課程（付費） |
| 專案組合層看板：先把全部工作攤開，限制總量，定期（建議每週起）與提需求的人一起排序 | 第一手（Johanna Rothman） | jrothman.com/mpd/2021/12/manage-interruptions-with-defensive-project-portfolio-management/ 。「Visualize all the work」；「Limit the total WIP」 | 同時有產品工作與臨時插單的團隊 | 作者推薦實體或虛擬白板，並明說「I recommend against a spreadsheet」；數位化後如何維持「一眼可見」未談 |
| 工具只是輔助：用白板加便利貼，拍照貼到共用網站，而不是花時間更新工具 | 第一手（Johanna Rothman） | nofluffjuststuff.com/blog/johanna_rothman/2011/10/reducing_your_own_wip_and_yves_who_is_series 。「the best tool is a wall and stickies」；「take a picture with their phone and post it on their common site」 | 工作內容常變，更新工具的成本高於收益 | 2011 年的建議，現今協作工具已不同；不適用於需要多人即時更新的情境 |
| 把「沒上板的工作」納入總覽：隱藏在製品會讓上限形同虛設 | 第一手（Jim Benson） | personalkanban.com/pk/expert-finding-hidden-wip-2/ 。「Unboarded work」（小節標題） | 想讓總覽反映真實負載 | 該文以人為例，未談跨主題 |

## 六、別的系統已有的狀態要不要重記

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 用「另一張卡」代表外部請求：在原卡上放視覺標示，另開一張新卡放進停車場，兩者有同儕依賴 | 第一手（DJAA） | djaa.com/kanban-evergreen-should-we-include-waiting-or-blocked-items-in-wip-limits/ 。「spawning a new ticket with peer-to-peer dependency」 | 等待的工作其實在別的團隊或系統裡進行 | 這是「在自己板上另記一筆」，與「不重記」相反；頁面未談如何與對方系統同步狀態 |
| 一個流程可有多個開始點與完成點：可把「交給別的系統」定義為完成點 | 官方（Kanban Guide） | kanbanguides.org/english/ 。「Depending on the work item, your workflow may have more than one started or finished point.」 | 想明確界定自己板子的範圍 | 這是工作流程定義的規則，指南未將它連結到「外部系統狀態是否重記」 |
| 阻擋不要靠另一個欄位或另一份紀錄：保留項目原位置與資料 | 第一手（Steve Pereira） | visibleconsulting.substack.com/p/my-blocker-playbook 。「items should never go backwards on a board」 | 想保住單一份流動資料 | 這談的是同一塊板內的資料完整，不是跨系統 |
| 明文建議「不要在自己的板上複寫另一個系統的狀態」 | 未查證 | 缺：在上述來源（《看板指南》、個人看板官網、流動層級簡介、Rothman、DJAA）中，沒有找到明文建議或反對。Leopold 的書另有「高層板顯示下層進度」的說法，只見搜尋摘要，未讀到原書，未查證 | — | — |

## 七、各做法的適用條件與缺點（彙整）

| 做法 | 適用條件 | 缺點 |
|------|---------|------|
| 看板方法（以《看板指南》為標準） | 任何知識工作；要連結流動與價值；願意定義開始與完成點並收集四項流動指標（在製品、產出量、工作項目年齡、週期時間） | 不給表示法與數字；單人導入時，四項指標與服務等級預期的成本是否值得，指南未談 |
| 個人看板 | 一個人或小團隊；先要能看見、能說不；起步最簡單 | 數字與欄位多為作者建議；沒有跨專案層；對「別系統狀態」未談 |
| 流動層級 | 多團隊多價值流；跨團隊依賴多 | 以大型組織為背景；文獻未給個人層做法；細節需付費課程 |
| 專案經理的個人與組合層限制（Rothman） | 專案經理、臨時插單多、要向主管說明為何不能再接 | 以經驗與建議為主；單人看板的上限算法（人數除以 2）不適用單人 |
| 原地旗標（Pereira，DJAA 阻擋標示） | 重視流動數據、有升級管道 | 需要工具支援旗標或紀律；成熟度模型警告太早限制阻擋項會招致抗拒 |
| 停車場（DJAA） | 等待時間已知、由外部單位決定 | 需約定等待期限；計時與到期改標阻擋是額外動作 |

## 對照 Miles 情境

只逐項寫前提成立與否，不下結論，不給建議。

| 做法的前提 | Miles 情境 | 成立與否 |
|-----------|-----------|---------|
| 要有明確的開始點與完成點（Kanban Guide） | 每個需求從「給需求」到「上線」，中間階段已列出（釐清、寫進知識庫、寫規劃單、做 Prototype、等 Miles 看、開 Linear 票、開發中、待驗收、上線） | 成立。但「開發中」之後的進度在 Linear，Miles 不能改 Linear 狀態；自己板子的完成點要定在哪（開票後、驗收後、上線後），來源只說可有多個，未規定 |
| 個人起手 2 到 3 項在製（個人看板） | 一個人同時追多個需求，另有多個 AI 代理對話並行 | 數字前提成立（單人）；但 AI 代理的並行是否算 Miles 個人在製品，來源未載 |
| 團隊算法（人數除以 2，Rothman） | 單人 | 不成立 |
| 管理者要限制自己的在製品（Rothman） | Miles 是產品經理，靠他人（前後端、代理）產出 | 成立（Rothman 的條件是「靠別人的產出工作的人」） |
| 阻擋項原地標記並仍計入在製品（DJAA、Pereira） | 「等 Miles 看 Prototype」是等自己，「待驗收」是等自己或別人，「開發中」是等 Linear 上的前後端 | 部分成立：等自己的項目，不屬於「外部阻擋」（Pereira 把「團隊可自行解決」稱為內部阻礙，未列為阻擋）；等前後端的項目屬外部依賴 |
| 停車場放等外部單位、時間已知的項目 | 「開發中」交給前後端、時間由對方決定 | 前提部分成立；是否「時間可預期」要看歷史，來源要求用歷史資料設定期限 |
| 對停車場設在製品上限（成熟度第 4 級） | 單人，目前沒有歷史資料 | 前提不成立（DJAA 要求先有歷史資料與穩定的對方前置時間） |
| 阻擋欄不好用，改用旗標（Pereira） | 工作管理放 repo 內的 Markdown 檔，不放工具 | 部分成立：Markdown 沒有原生旗標功能，是否能以行內標記模擬，來源未載 |
| 跨專案總覽（流動層級第 2 層；Rothman 專案組合板） | 一個人、多個主題資料夾，各含地圖與票檔 | 流動層級的前提（多團隊）不成立；Rothman 的專案組合做法（攤開全部工作、限制總量）前提成立 |
| 別的系統已有的狀態不重記 | 開發進度已定在 Linear，不另記一份 | 來源沒有明文，無法說成立或不成立 |
| 實體白板優於工具（Rothman） | 工作管理放 Markdown 檔，由人與 AI 代理讀寫 | 前提部分不成立：Rothman 的理由是避免更新工具的成本；AI 代理讀寫檔案的成本結構與人不同，來源未載 |
| 看不見的工作會讓上限失效（Benson） | 多個 AI 代理對話並行，代理的對話本身是否算「在製品」未定 | 前提成立（有可能存在未上板的並行工作）；是否算入上限，來源未載 |

## 未查證與存疑

1. 「外部系統已有的狀態要不要重記」：沒有找到明文。上述各項只能說「做法的前提」，不能說「來源建議不重記」。要補，需找整合式看板（板上卡片連結到另一系統的議題）的原作者文件，本票未涉及。
2. Flight Levels：官網為動態網頁，只能比對原始 HTML 內的少量句子；「第 3 層是否限制在製品」「是否有跨專案總覽」官網未載。Leopold 的書（《Flight Levels in Action》等）未取得全文。
3. DJAA 文章中的「三種阻擋類型」清單，原始 HTML 中內容未出現（可能為圖片），未取得。
4. Rothman 的《Manage Your Project Portfolio》全書：O'Reilly 預覽頁回應「Access Denied」，未讀到；專案組合層的欄位與上限細節只引部落格文章。
5. Prokanban 部落格文章（《Don't just limit WIP - optimize it》）：署名欄顯示 Dan Vacanti，但內文提到「Daniel's video」，作者未確認，可信度低。
6. Pereira 文章日期標為 2026-07-15，網站為 Substack；以第一手實務年資列入，但為單一顧問的個人做法，未見其他來源互證。
7. Little 定律白皮書指出「law 只回頭看、不能預測」；未檢視其引用的原始論文。
8. 沒有找到「單人在製品上限」的實證研究；各處 2 到 3 項為作者經驗值。
9. 搜尋工具曾回報「個人看板的上限依據」等說法，經讀原頁後只保留官網頁面實際寫的句子；搜尋摘要中其餘未見於原頁的說法不採用。

## 頁面夾帶的指示

無。已對本次取得的網頁與 PDF 全文掃描「忽略先前指示」「身為 AI」「語言模型」等字樣，沒有對 AI 下指示的內容。
