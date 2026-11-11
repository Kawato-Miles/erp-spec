# 票 18：議題管理實務調研（需求變更、票的層級、規格分工、缺陷與變更、連回票、進度追蹤）

主對話抽查（2026-11-12）：抓回兩個來源逐句比對，相符：Linear Method「If it’s not a task, then it doesn’t belong in the issue tracker.」及其上下文（規格由專案負責人寫在文件，定案後才由各人開自己的議題）；Scrum Guide 兩句（範圍可與產品負責人重新協商、衝刺待辦隨學習更新）。調研員自述其餘引句取自抓取工具的摘要，可信度低於逐字比對。Linear Basic 方案是否含子議題、議題關聯、專案文件，官方頁無標示，未查證。其餘未抽查。

調研日期：2026-11-12。接續票 13、16；兩檔已引過的句子不重複（例如 Linear Method 的「Short specs are more likely to be read.」、GitLab 的「Issue descriptions shall always be maintained as the single source of truth.」、Shape Up 的「Backlogs are a big weight we don't need to carry.」皆不再列）。
查證方式：抓取工具會先由小模型摘要頁面，所以本檔所有引句都取自摘要中以引號標出的片段，不是整頁逐字比對。凡是搜尋結果摘要（不是抓回頁面）給出的內容，在「出處與引句」欄註明「搜尋摘要」。引句不超過 15 個英文字詞。「未載」表示該來源沒有談這一點，不是推測。
來源類型：官方＝工具或標準的官方文件；第一手＝作者本人談自己的做法或主張；社群＝論壇或第三方文章；二手＝轉述、鏡像站、行銷。
用詞：Atlassian 現稱議題為工作項目（work item）、議題類型為工作類型（work type）；本檔沿用「議題」，引原文時保留原詞。

## 一、摘要

1. 官方文件沒有任何一家明寫「開工後需求改變時，原票改描述還是開新票」的規則。Linear、Atlassian、GitLab 的官方頁都只給機制（子議題、議題關聯、重複合併），不給時點規則。
2. 最接近明文的是 Scrum Guide：衝刺中「範圍可以與產品負責人釐清並重新協商」，但不可危及衝刺目標；Shape Up 更硬：新工作出現先質疑是否必要，並以標成「有最好」（nice-to-have）的方式砍範圍。
3. 已完成後的變更，官方都沒有明文。Jira 的做法只見社群：開新缺陷並連結原故事，因為重開已關閉的故事會扭曲衝刺報表（搜尋摘要，非 Atlassian 官方說法）。
4. Linear 官方對粒度的說法很具體：子議題用於「太大不能是單一議題、又太小不能是專案」的工作；Method 要求每張議題小到每週可完成數張，且責任歸單一人。
5. 規格與票的分工，Linear 官方定位是「長文放文件、議題描述寫短」；Method 更進一步：不是任務就不該進議題追蹤。多位第一手作者（Barden、Jeffries、Thomas P）主張票是時點紀錄，不是現況的正本。
6. 缺陷與變更的區分：Atlassian 官方只定義缺陷（「impairs or prevents the functions of a product」）；GitLab 貢獻指南以不同範本與標籤區分缺陷與功能提案。「實作與規格不符是缺陷、規格改了是變更」這種二分法，沒有找到官方明文，標未查證。
7. Linear 與 GitHub 整合：分支名或合併請求標題含議題編號即連結；描述或提交訊息用關鍵字（magic words）分「結案」與「非結案」；狀態自動化由團隊層級設定。安裝需 GitHub 組織擁有者，或僅限程式庫層級時由程式庫管理員安裝。
8. 產品經理看進度：Linear 官方提供專案更新（健康狀態三選一）、專案概覽的進度圖、里程碑完成百分比、檢視（view）訂閱與專案鈴鐺訂閱。官方沒有針對「不擁有狀態的產品經理」的專門建議。
9. Linear Basic 方案：價格頁明列「Integrations」「Issues, projects, cycles, initiatives」「Triage」含在內，議題數無上限；子議題、議題關聯、專案文件在價格頁與抓回的文件頁都沒有標方案限制，無法確認，標未查證。
10. 第一手反對意見集中在三點：用票當文件（Barden）、把票當完整需求（Jeffries）、舊票的「已就緒」會隨脈絡失效（Thomas P）。

## 二、問題 1：需求改變時票怎麼處理（三個時點）

### 2.1 票尚未開工

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 直接改原票描述，描述只寫執行任務所需 | 官方（Linear Method） | linear.app/method/write-issues-not-user-stories。「Write only as much as you need to share to perform the task.」 | 票尚無人動工，描述短 | 該頁未談描述改動如何通知已被指派者 |
| 不做的票宣告不做或合併為重複 | 官方（Linear 分流） | linear.app/docs/triage.md。「Triage is a special inbox for your team.」動作含接受、拒絕（Decline，取消議題）、標為重複（併入既有議題）、延後 | 議題來自整合或其他團隊，尚在分流匣 | 分流只涵蓋進入工作流程前的議題；已進工作流程的票不適用 |
| 進入衝刺前持續精煉待辦項目 | 官方（Scrum Guide） | scrumguides.org/scrum-guide.html。「Product Backlog refinement is the act of breaking down and further defining」（摘要截斷於此） | Scrum 團隊；待辦項目還沒進衝刺 | 未載「精煉時改原項目或開新項目」 |
| 押注前的提案不公開，改動不影響團隊 | 官方（Shape Up，票 13 已引同段，此處只用於時點） | basecamp.com/shapeup/1.1-chapter-02（票 13）。本輪未重抓 | 有專人整形、有押注會議 | 見票 13 |
| 舊票「已就緒」不是永久屬性，開工前先確認這件事還要不要做 | 第一手（開發者部落格） | dev.to/scullwm/a-badly-written-ticket-can-beat-a-well-written-one-2ig5。「A ticket being “ready” is not a permanent property.」 | 排在待辦很久的票 | 個人主張；反對強制改寫規則與到期日（搜尋摘要） |

### 2.2 開發中

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 衝刺待辦隨學習更新；範圍可與產品負責人重新協商；不得危及衝刺目標 | 官方（Scrum Guide） | scrumguides.org/scrum-guide.html。「the Sprint Backlog is updated throughout the Sprint as more is learned.」「Scope may be clarified and renegotiated with the Product Owner as more is learned.」「No changes are made that would endanger the Sprint Goal;」 | Scrum 團隊 | 只談衝刺待辦，不談「票描述怎麼改、要不要開新票」 |
| 新工作出現時先質疑是否必要，把可砍的標成有最好，必做項才算完成 | 官方（Shape Up） | basecamp.com/shapeup/3.5-chapter-14。「We should question any new work that comes up before we accept it as necessary.」「The act of marking them as a nice-to-have is the scope hammering.」 | 有固定期限、範圍可變的專案 | 需要期限固定；Miles 的情境若期限不固定，此前提不成立（來源未載） |
| 超過押注時間預設不延長，回頭重新整形 | 官方（Shape Up） | basecamp.com/shapeup/2.2-chapter-08。「If they don’t finish, by default the project doesn’t get an extension.」「it means we did something wrong in the shaping」 | 固定週期團隊 | 與「期限不固定的一人加 AI 流程」差距大；來源未載小團隊以外的適用度 |
| 衝刺中變更有成本，要向利害關係人說明並設法降低 | 第一手（Mike Cohn，搜尋摘要） | mountaingoatsoftware.com/blog/change-isnt-free（搜尋摘要稱：餐廳比喻，變更不是免費）。抓回頁面為索引頁，未取得本文；無逐字引句 | Scrum 團隊 | 引句未取得；抓回的另一頁（change-is-goodor-is-it）只有「Agile welcomes change because change often reflects learning.」，未談處理方式 |
| 變更頻繁時往系統性原因找，例如縮短迭代、更頻繁發布 | 第一手（Johanna Rothman） | nofluffjuststuff.com/blog/johanna_rothman/2012/09/changing_iteration_contents_mid_sprint。「look deeper for systemic forces at work」 | 產品負責人反覆改衝刺內容 | 診斷建議，不是處理變更的步驟 |
| 衝刺待辦只是計畫，可改；只有開發者能改，產品負責人在影響目標時要參與 | 社群（Scrum.org 論壇多人回覆，非官方定論） | scrum.org/node/5436。「The Sprint Backlog is simply a plan, and that plan can change.」（Timothy Baffa，2016） | 想知道實務者共識 | 各人說法不一；摘要稱無確定的例外清單 |
| 議題移到不同工作流程階段時，把討論中的決定寫回描述 | 官方（GitLab 手冊 Plan 頁，搜尋摘要） | handbook.gitlab.com/handbook/engineering/devops/plan。搜尋摘要轉述：移動階段時檢視未結討論並用已做決定更新描述；抓回頁面只有導覽列，未取得本文，無逐字引句 | 以議題為單位的遠端團隊 | 引句未取得；與票 13 的 GitLab 規則一致，屬「改原票描述」派 |
| 把一張過大的子議題父票轉成專案，子議題變成專案內獨立議題 | 官方（Linear） | linear.app/docs/parent-and-sub-issues.md（摘要）。轉換功能為摘要轉述，無逐字引句 | 工作量長大後 | 只處理「變大」，不處理「方向改變」 |
| Linear 週期：未完成議題預設自動滾到下一週期 | 官方（Linear） | linear.app/docs/use-cycles.md。「Open issues generally roll over automatically」 | 使用週期的團隊 | 官方頁稱不談範圍變更怎麼處理；Rob Martin 批評自動滾動等於暗示期限可延（見第八節） |
| 里程碑完成百分比以已開始、已完成議題計算；加入或移動議題如何影響進度，官方未載 | 官方（Linear） | linear.app/docs/project-milestones.md。「Progress starts counting the moment an issue moves to a started status.」 | 用里程碑追進度 | 抓回頁面明說未載範圍變動的影響（未查證，見第十節） |

### 2.3 已完成或已上線

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 開新缺陷並連結原故事，不重開已關閉的故事 | 社群（Atlassian 社群討論，搜尋摘要） | community.atlassian.com/forums/Jira-questions/How-to-reopen-a-released-closed-issue-in-Jira/qaq-p/1139414。抓回頁面只有標題，內容取自搜尋摘要，無逐字引句；摘要稱理由是重開會讓故事點數在兩個衝刺重複計算 | 要保持衝刺報表乾淨 | 非 Atlassian 官方說法；搜尋摘要自己也說「官方最佳實務未找到」；是否可重開取決於工作流程設定 |
| 重開是工作流程設定，要清除解決欄位 | 社群（同上，搜尋摘要） | 同上，無逐字引句 | Jira 管理員可改工作流程 | 同上 |
| 完成定義未達成者不算進增量 | 官方（Scrum Guide） | scrumguides.org/scrum-guide.html。「Work cannot be considered part of an Increment unless it meets the Definition of Done.」 | 用完成定義判斷「做完沒」 | 只回答完成與否，不回答「上線後規格變了怎麼辦」 |
| 把完成工作的結果寫進產品文件，不留在票上 | 第一手（Ben Barden） | benbarden.substack.com/p/tickets-are-transient-dont-use-them。「Tickets tell you what you did - not what's true today.」 | 需求改變後現況要另有正本 | 個人主張；沒有給出票與文件之間的連結做法 |
| 抓取到的官方頁（Linear、Atlassian、GitLab）都沒有「已完成後需求變更」的明文規則 | — | 見第十節 | — | 未查證 |

## 三、問題 2：票的層級與粒度

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 子議題用於「太大不能是單一議題、又太小不能是專案」的工作，也用於分工 | 官方（Linear） | linear.app/docs/parent-and-sub-issues。「Consider creating sub-issues when a set of work is too large to be a single issue but too small to be a project.」（引句取自摘要） | 一個目標需拆給多人 | 官方頁未載驗收條件放哪一層 |
| 子議題繼承父議題的團隊、優先度、專案；標籤不繼承；父議題狀態可依團隊設定隨子議題自動結案 | 官方（Linear） | 同上（摘要轉述，無逐字引句）。設定位置：團隊設定的工作流程 | 想自動推進父票狀態 | Miles 不能改狀態，此自動化由團隊管理員設定（誰能設未查證，見第十節） |
| 每張議題盡量小；責任歸單一人；避免過大的合併請求 | 官方（Linear Method） | linear.app/method/introduction。「Break down work into smaller parts and create an issue for each one when possible.」「Even if other people are involved, the responsibility should lie with a single person.」 | 專案有負責人，議題小到可每週完成數張 | 該頁未給具體大小的量化門檻 |
| 議題只放任務；不是任務就不屬於議題追蹤 | 官方（Linear Method） | linear.app/method/write-issues-not-user-stories。「If it's not a task, then it doesn't belong in the issue tracker.」 | 想把需求背景放別處 | 與「Feature 票自包含」的做法相反（見第九節對照） |
| 三層預設階層：史詩包含故事、任務、缺陷；子任務屬於任務 | 官方（Atlassian） | support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types/。「Epics group together bugs, stories, and tasks to show the progress of a larger initiative.」「A subtask is a piece of work that is required to complete a task.」 | 用 Jira 預設類型 | 抓回內容只定義類型，未說明何時拆；子任務不能再有子項（搜尋摘要） |
| 故事是「最小的工作單位」 | 官方（Atlassian） | 同上。「A user story is the smallest unit of work that needs to be done.」 | 同上 | 同上 |
| 卡片放不下就是故事太大，要拆小 | 第一手（Ron Jeffries，搜尋摘要） | ronjeffries.com/articles/019-01ff/3cs-revisited/（搜尋摘要轉述：卡片放不下就需要更小的卡片）。無逐字引句 | 用故事卡的團隊 | 引句未取得；搜尋摘要稱原話與卡片大小有關 |
| 任務不預先拆，由團隊在做的過程中發現（票 13 已引） | 官方（Shape Up） | 見票 13 | 見票 13 | 見票 13 |
| 驗收條件寫在哪一層：Jeffries 把驗收測試當作故事的第三要素，由客戶在迭代開始時定義 | 第一手（Ron Jeffries） | ronjeffries.com/xprog/articles/expcardconversationconfirmation。「This component is the acceptance test.」（引句取自摘要） | 故事層就有驗收 | 未談故事下再拆任務時驗收放哪 |
| Linear、Atlassian 官方「驗收條件寫在哪一層」 | — | 抓回頁面均未載 | — | 未查證 |

## 四、問題 3：規格與票的分工

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 文件放長文，議題描述放短內容；議題複雜時改用文件 | 官方（Linear 文件頁） | linear.app/docs/documents.md。「Use documents to keep long-form text attached to the work references.」（此句票 13 已引，此處補同頁其他內容）；摘要稱議題「with complex implementation needs may prefer to use a document」；官方稱此為指引、不是正式階層 | 想把長文掛在專案或議題 | 抓回頁面未載文件改了議題如何同步 |
| 專案文件與議題用同一個編輯器、同一種 Markdown；專案描述與文件有版本歷史 | 官方（Linear） | linear.app/docs/documents.md。「Projects use the same editor as issues.」「Every document (and project description) has version history.」（引句取自摘要）；linear.app/docs/projects.md：文件「use the same Markdown as issues」 | 想追蹤規格的修改紀錄 | 版本歷史只在單一文件內，未載跨文件與議題的版本對應 |
| 專案是「有明確成果的議題群組」；專案概覽寫已知內容，附資源連結 | 官方（Linear） | linear.app/docs/projects.md。「A project is a grouping of issues that have a clear outcome」 | 一個功能或大單位工作 | 未載概覽與文件各自該放什麼 |
| 票是時點紀錄，不要當文件；決定寫在留言造成描述過期 | 第一手（Ben Barden，產品經理電子報作者） | benbarden.substack.com/p/tickets-are-transient-dont-use-them。「Tickets are transient. Don't use them as documentation.」「But the description was never changed.」 | 想知道現況時 | 主張靠人定期更新文件，未給防漂移機制 |
| 票是輕量代幣，規格大半靠對話；文件只在「明顯需要」時補 | 第一手（Ron Jeffries） | ronjeffries.com/xprog/articles/expcardconversationconfirmation。「The card is a token representing the requirement.」「The conversation is largely verbal, but can be supplemented with documents.」（引句取自摘要） | 團隊與客戶可以常常對話 | 與「需求知識庫由 AI 讀、人少對話」的情境不同（來源未載） |
| 規格比票長壽；方向改了就刪未完成的票、保留規格；規格是當下所知的快照 | 第一手（Matt Pocock 的 to-spec 頁，作者署名頁面未載） | aihero.dev/skills-to-spec。「The tickets are disposable and the spec is not,」（引句取自摘要）；「it is a snapshot of what you knew at that moment」 | 以 AI 代理按票工作；規格放在議題追蹤工具 | 作者未署名於抓回頁面；是 AI 工作流的作者看法，非通用準則 |
| 議題描述是唯一正本（票 13 已引）；後續把決定寫回描述 | 官方（GitLab） | 見票 13 與 2.2 節 | 全員遠端以議題為單位 | 見票 13 |
| 規格改了，票怎麼同步 | — | 抓回的 Linear、Atlassian 官方頁均未載 | — | 未查證 |

Linear Basic 方案功能（問題 3 附帶）：

| 功能 | 來源類型 | 出處與引句 | 結論 |
|------|---------|-----------|------|
| GitHub 整合 | 官方（價格頁） | linear.app/pricing。價格頁列「Integrations」，Basic 欄為「Included」（引句取自摘要） | 含在 Basic |
| 專案、週期、初始計畫（initiatives） | 官方（價格頁） | 同上。「Issues, projects, cycles, initiatives」一列，Basic 標「Included」 | 含在 Basic |
| 議題數 | 官方（價格頁） | 同上。Basic「Unlimited issues」，Free 為 250 | 無上限 |
| 價格 | 官方（價格頁） | 同上。「$10 per user/month」，按年計費 | 與搜尋結果第三方彙整一致 |
| 分流（Triage）基本功能 | 官方（價格頁） | 同上。Triage 一列，Free、Basic、Business 均含 | 含在 Basic |
| 分流規則、分流輪值、Triage Intelligence | 官方（價格頁與 triage.md） | 價格頁：僅 Business；triage.md：「require the Business or Enterprise plan」 | 不含在 Basic |
| 訪客帳號、私人團隊、Slack 與電子郵件收件 | 官方（價格頁） | 同上，僅 Business | 不含在 Basic |
| 子議題、議題關聯、專案文件、專案更新、里程碑、範本 | 官方（價格頁、billing-and-plans） | 價格頁沒有這些列；billing-and-plans.md 稱「Please see Pricing for rates and a feature-by-feature comparison by plan.」；changes-to-linears-pricing-plans 只列 Standard 轉 Basic 會失去的功能（分流輪值、私人團隊、訪客帳號、支援類整合） | 官方頁均未載方案限制；不能證明有或沒有，標未查證。Miles 現況已在 Basic 使用子票（使用者提供），可作為實際可用的旁證，非官方陳述 |

## 五、問題 4：缺陷與需求變更怎麼區分與處理

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 缺陷＝損害或阻止產品功能的問題，與故事、任務並列的類型 | 官方（Atlassian） | support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types/。「A bug is a problem which impairs or prevents the functions of a product.」 | 用 Jira 預設類型 | 定義未提到「對照什麼」判斷損害（規格或使用者預期），沒有談與變更請求的界線 |
| 缺陷用缺陷範本，功能提案用功能範本與 `type::feature` 標籤；迴歸（regression）另追蹤 | 官方（GitLab 貢獻指南） | docs.gitlab.com/development/contributing/issue_workflow。「Every monthly release has a corresponding issue on the CE issue tracker」（引句取自摘要）；缺陷用「Bug」範本 | 開源貢獻流程 | 範本是給外部貢獻者；未談內部規格改了算什麼 |
| 完成後發現的缺陷：開新缺陷連回原故事，不重開 | 社群（Atlassian 社群，搜尋摘要） | 見 2.3 節。搜尋摘要稱 Atlassian 沒有迴歸類型，只有第三方說可自訂 | 同 2.3 | 非官方 |
| 完成的定義未達即不算完成 | 官方（Scrum Guide） | 見 2.3 節 | 在增量被接受之前發現的不符 | 未談上線後 |
| 後續工作不要用「Follow-up」開頭命名；技術債不要用後續議題當藉口 | 官方（GitLab 貢獻指南） | 同上。「the issue title must not begin with `Follow-up`」；「this cannot be used as an excuse to merge poor-quality code」 | GitLab 自家流程 | 針對 MR 審查中未決討論，不是缺陷與變更的分類 |
| 「實作與規格不符＝缺陷；規格本身改了＝變更」的明文二分 | — | 抓回的官方頁均未載 | — | 未查證 |
| Atlassian 對「變更請求」的官方定義 | — | 抓回的 JSM 變更管理頁只有導覽列，內文未取得 | — | 未查證 |

## 六、問題 5：提交與合併請求連回票

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 分支名含議題編號；也可放在合併請求標題 | 官方（Linear） | linear.app/docs/github 與 linear.app/integrations/github。「Include issue ID in the branch name.」；整合頁：議題編號放「in the branch name or PR title」（引句取自摘要）。複製分支名的快捷鍵為 Cmd/Ctrl + Shift + .（搜尋摘要） | 開 PR 前從議題複製分支名 | 靠工程師遵守 |
| 關鍵字（magic words）放在合併請求描述或提交訊息，分結案、非結案兩類 | 官方（Linear） | 同上。「Linear offers closing and non-closing magic words so you can customize your workflow.」；整合頁摘要：加關鍵字如 fixes「creates a link to the PR in the Linear issue」 | 要連多個合併請求，或建立後補連 | 關鍵字放在 PR 留言無效（搜尋摘要稱，未由本輪抓回頁面核對）；GitHub Enterprise Server 只支援 PR 描述（搜尋摘要） |
| 提交訊息帶議題編號也可連結 | 官方（Linear 變更日誌，搜尋摘要） | linear.app/changelog/2022-02-03-github-commit-linking。搜尋摘要轉述：提交訊息加 closes ENG-123，分支推送時移到進行中，合併到預設分支時移到完成；引句為摘要內的轉述，非逐字 | 提交訊息習慣帶編號 | 2022 年日誌，現行行為以整合頁為準；現況提交帶編號比例低（前端約 6%、後端約 23%，使用者提供） |
| 自動改狀態：連結議題在 PR 開啟時預設移到進行中，合併時移到完成；團隊管理員在團隊層級設定自動化，可依目標分支不同設定 | 官方（整合頁摘要）與二手鏡像 | linear.app/docs/github：「Updates to PRs can automatically update the status of their linked Linear issues.」（引句取自摘要）。預設值「move linked issues to "In Progress" when PRs are open」取自 linear-web.pages.dev 鏡像站（非官方網域，不採為官方陳述）；官方頁摘要稱「Team admins configure status automations per team」 | 需要團隊管理員設定自動化 | 預設行為的逐字引句只在鏡像站；官方頁預設值未逐字取得 |
| 誰要設定：全組織存取需 GitHub 組織擁有者；僅程式庫層級可由程式庫管理員安裝；每位成員在個人設定連接自己的 GitHub 帳號 | 官方（Linear 整合頁摘要） | linear.app/docs/github。「If you only need repository-level access, a repository administrator can install the integration instead.」「To connect your account, navigate to Settings > Connected accounts.」 | 要安裝整合者有 GitHub 權限；團隊狀態自動化需 Linear 團隊管理員 | 「組織擁有者」一句是摘要轉述；Miles 不能改狀態，是否同時無權設定自動化，官方頁未載（未查證） |
| 個人 GitHub 自動化：自動指派並移到進行中 | 官方（整合頁摘要） | linear.app/integrations/github。「personal GitHub automations that auto-assign issues」 | 每位工程師自行開啟 | 只對開啟者有效 |

本輪抓取 `linear.app/docs/github-integration` 與 `.md` 版，只得標題與寫給 AI 的提示，無本文；改抓 `linear.app/docs/github` 取得摘要。

## 七、問題 6：產品經理不擁有票狀態時怎麼追蹤進度

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 專案更新：結構化進度報告，含健康指標（On track、At risk、Off track）與文字說明；專案負責人先發第一則，之後任何成員可寫 | 官方（Linear） | linear.app/docs/initiative-and-project-updates.md。「The owner or lead is responsible for posting the first update.」「a health indicator that provides high-level signal of the current state」（引句取自摘要） | 專案有負責人；可設提醒要求定期發布 | 更新由人寫，不是從票狀態自動產生；官方頁未載應寫多細 |
| 更新可送到 Slack 頻道、收件匣或兩者；留言會通知作者與串內參與者 | 官方（Linear） | 同上（摘要轉述） | 想被動接收 | 無 |
| 專案概覽顯示最新更新；專案有自己的進度圖與通知選項 | 官方（Linear） | linear.app/docs/projects.md。專案「come with their own unique features, progress graph, and notification options.」 | 看單一專案 | 進度圖依賴工程師改的狀態 |
| 里程碑顯示完成百分比；議題進入「已開始」才開始計入 | 官方（Linear） | linear.app/docs/project-milestones.md。「Progress starts counting the moment an issue moves to a started status.」 | 用里程碑看階段 | 依賴狀態；加議題後的影響未載 |
| 專案狀態：任何人可從專案頁改；管理員可自訂名稱 | 官方（Linear） | linear.app/docs/project-status.md。摘要：「select its status in the overview or project details sidebar.」 | 想以專案層狀態表達階段 | 抓回頁面稱未列預設狀態分類；Miles 是否有權限未載 |
| 檢視（view）：儲存的篩選檢視，可訂閱「議題加入、完成或取消」通知，也可送 Slack | 官方（Linear） | linear.app/docs/custom-views.md。「Create durable filtered views of issues, projects, or initiatives.」 | 想在議題進入某狀態時被通知 | 官方頁稱「you won't receive notifications ... for actions you take yourself」（自己的動作不通知） |
| 通知：建立、被指派或被提及時自動訂閱議題；也可手動訂閱；專案頁鈴鐺可訂閱專案 | 官方（Linear） | linear.app/docs/notifications.md（摘要）；linear.app/docs/project-notifications.md。「Click on the bell icon on any project page to subscribe to that project's notifications.」 | 想追蹤特定議題或專案 | 完成與取消通知只對已訂閱議題生效（摘要轉述） |
| 週期（cycles）：1 至 8 週的固定期間，未完成議題預設滾到下一週期 | 官方（Linear） | linear.app/docs/use-cycles.md。「Open issues generally roll over automatically」 | 團隊使用週期 | 該頁未載產品經理怎麼用；Linear 價格頁週期含在 Basic |
| Linear Method：看實際成果的差異，而非狀態欄位（票 13 已引） | 官方（Linear Method） | 見票 13 | 見票 13 | 見票 13 |
| 官方對「產品經理應怎麼看進度」的專門建議 | — | 抓回頁面均未載 | — | 未查證 |

## 八、問題 7：產品經理或工程主管談議題管理的第一手文章

| 作者與文章 | 來源類型 | 反對什麼 | 理由 | 出處與引句 |
|-----------|---------|---------|------|-----------|
| Ben Barden，〈Tickets are transient - don't use them as documentation〉。他在產品筆記（Product Notes）電子報寫作；正式職稱頁面未載 | 第一手（產品領域作者） | 把票當作產品如何運作的文件 | 票記錄當時做了什麼，結案後不可靠；決定寫在留言、描述從未改，工程師得讀完所有留言才懂最終做法 | benbarden.substack.com/p/tickets-are-transient-dont-use-them。「Tickets are transient. Don't use them as documentation.」「Tickets give you the history, but they aren't the best way to understand a product.」 |
| Ron Jeffries，〈Essential XP: Card, Conversation, Confirmation〉。XP 共同創始人之一（頁面外的背景知識，未於本輪查證） | 第一手 | 把寫下來的故事當作完整需求，文件取代對話 | 需求靠對話傳達，文件只在明顯需要時補；驗收測試才是確認 | ronjeffries.com/xprog/articles/expcardconversationconfirmation。「The card is a token representing the requirement.」「The conversation is largely verbal, but can be supplemented with documents.」（引句取自摘要） |
| Thomas P（開發者，著有《Tech Refinement》），〈A badly written ticket can beat a well-written one〉 | 第一手（開發者部落格） | 把舊票視為「已就緒」就直接實作 | 就緒取決於精煉當時的脈絡，脈絡會隨產品、程式、優先度、人員變化而失效；他的例子是精煉數月前的票，動工前才發現已不需要 | dev.to/scullwm/a-badly-written-ticket-can-beat-a-well-written-one-2ig5。「It was ready **given the context that existed when it was refined**.」「The mistake was assuming that an old decision was still a current one.」 |
| Johanna Rothman，〈Changing Iteration Contents Mid-Sprint〉（2012，顧問） | 第一手（顧問） | 把產品負責人反覆改衝刺內容單純看成人的問題 | 反覆變更像多工，有代價；應找背後的商業壓力與發布節奏等系統因素 | nofluffjuststuff.com/blog/johanna_rothman/2012/09/changing_iteration_contents_mid_sprint。「look deeper for systemic forces at work」 |
| Rob Martin（Walden 的建造者，Shape Up 專用工具），〈Running Shape Up in Jira or Linear quietly turns it back into Scrum〉 | 行銷性質（作者自己賣競品工具） | 在 Jira、Linear、Notion 內跑 Shape Up：把提案轉成史詩與票、填估點、落選項目進待辦、未完成自動滾到下一週期 | Scrum 類工具把任務當輸入先排先估，Shape Up 把任務當押注後的產出；Linear 的自動滾動拿掉固定期限造成的範圍決策 | dev.to/rob_walden/running-shape-up-in-jira-or-linear-quietly-turns-it-back-into-scrum-10i8。「Shape Up's bet is that the deadline is real.」「The tool celebrates finishing tickets.」 |
| Linear 團隊，〈Write issues, not user stories〉（官方 Method 頁，公司立場，非個人署名） | 官方（公司立場） | 使用者故事格式 | 「User stories are time-consuming to write and read.」；「Everyone on the team should write their own issues.」（引句取自摘要） | linear.app/method/write-issues-not-user-stories。另有 Medium 文章批評此做法會丟掉「為什麼」（搜尋摘要，作者與原文未抓取） |

## 九、三個情境的對照表（只列各家做法與前提，不下結論）

### 情境 A：票還沒開工時需求變更

| 來源 | 做法 | 前提 |
|------|------|------|
| Linear Method | 直接改票，描述只寫執行所需 | 票還沒被動工；任務由人寫、人讀 |
| Linear 分流 | 不要的票拒絕或併為重複 | 票仍在分流匣 |
| Scrum Guide | 繼續精煉待辦項目 | Scrum 團隊；項目未進衝刺 |
| Shape Up | 押注前提案不公開，改動不影響團隊 | 有專人整形；團隊還沒承諾（票 13 已引） |
| GitLab | 描述是唯一正本，決定寫回描述（搜尋摘要，票 13 已引核心句） | 以議題為單位；負責人維護描述 |
| Thomas P | 動工前先問「這件事還要不要做」 | 票放了很久 |
| Jeffries | 不太寫死，需求在對話中確認 | 團隊與客戶隨時可對話 |
| Atlassian | 官方未載 | — |

### 情境 B：開發中需求變更

| 來源 | 做法 | 前提 |
|------|------|------|
| Scrum Guide | 與產品負責人重新協商範圍；不得危及衝刺目標；衝刺待辦隨學習更新 | Scrum 團隊；有衝刺目標 |
| Shape Up | 質疑新工作是否必要；砍範圍標成有最好；超時不延長、回頭重新整形 | 固定期限、可變範圍 |
| Cohn、Rothman | 變更有成本，要向利害關係人說明；變更頻繁時找系統因素（縮短迭代、增加發布頻率） | Scrum 類團隊；Cohn 引句未取得 |
| Scrum.org 論壇 | 衝刺待辦是可改的計畫；開發者決定改不改，產品負責人在影響目標時參與 | 社群共識，非官方 |
| GitLab | 移動階段時把討論決定寫回描述（搜尋摘要） | 以議題為單位 |
| Linear | 子議題拆工作；工作長大轉成專案；未載「方向改變」時改原票或開新票 | 官方只給機制 |
| Barden | 結果寫進產品文件，票留作歷史 | 另有可維護的文件 |
| Jira | 官方未載 | — |

### 情境 C：上線後迭代

| 來源 | 做法 | 前提 |
|------|------|------|
| Jira 社群（搜尋摘要） | 開新缺陷連原故事，不重開已關閉的故事 | 要保持衝刺報表乾淨；工作流程可能不允許重開 |
| GitLab | 缺陷與功能提案用不同範本與標籤；迴歸另有每月發布議題（取自摘要） | 開源貢獻流程 |
| Scrum Guide | 完成定義未達即不算增量 | 判斷完成與否，不談上線後變更 |
| Barden | 把完成結果寫進產品文件；票是歷史 | 要有維護中的文件 |
| Pocock 的 to-spec 頁 | 規格比票長壽；規格是快照，方向改了刪未完成的票 | AI 代理工作流；作者未署名 |
| Linear、Atlassian、GitLab 官方 | 無「已完成後需求變更」的明文規則 | — |

## 十、未查證與存疑

未查證（共 17 項）：

1. 各家官方「開發中需求變更：改原票描述或開新票」的明文規則：Linear、Atlassian、GitLab 抓回頁面均未載。
2. 各家官方「已完成或已上線後需求變更」的明文規則：均未載；Jira 重開與否只見社群（搜尋摘要，社群討論頁本文未取得）。
3. Atlassian 對史詩、故事、任務、子任務何時拆分的官方指引：`atlassian.com/agile/project-management/epics-stories-themes`、`atlassian.com/software/jira/guides/issues`、`atlassian.com/agile/scrum/backlogs` 抓回均只有導覽列；只取得工作類型定義頁。
4. Atlassian 對「變更請求」的官方定義：JSM 變更管理頁只取得導覽列。
5. GitLab 手冊對議題與史詩的做法：手冊頁超過 23 萬字，只讀了前 20 萬字，內容多為導覽，未找到本文；GitLab Plan 手冊與貢獻指南的部分內容取自搜尋摘要。
6. Linear 議題關聯（relations）的官方頁：`linear.app/docs/issue-relations` 抓取 404；關聯類型（blocked、blocking、related、duplicate）與快捷鍵取自搜尋摘要。
7. Linear 專案文件與議題描述的「官方定位」：只取得 documents.md 摘要，稱為指引而非正式階層。
8. Linear Basic 方案是否含子議題、議題關聯、專案文件、專案更新、里程碑、範本：價格頁與方案頁均無這幾列，官方頁無法確認。
9. Linear 官方「驗收條件寫在哪一層」：未載。
10. Linear GitHub 整合的預設狀態對照（開啟移進行中、合併移完成）：官方頁摘要未給預設值，預設值句來自非官方鏡像站；「關鍵字放在 PR 留言無效」「GitHub Enterprise Server 只支援 PR 描述」取自搜尋摘要。
11. Linear 狀態自動化由誰設定、不擁有狀態的產品經理是否也不能設定：官方頁只說團隊管理員設定；Miles 的角色權限未載。
12. Linear 官方對產品經理看進度的專門建議：未載。
13. 里程碑加入或移動議題對進度的影響：官方頁明說未載。
14. Mike Cohn「Change Isn't Free」本文：抓回頁面為索引頁，只有搜尋摘要。
15. Atlassian 社群討論頁本文（重開與新開缺陷）：抓回只有標題，內容取自搜尋摘要。
16. 「實作與規格不符是缺陷、規格本身改了是變更」的官方明文二分：沒有找到。
17. Ron Jeffries「卡片放不下要更小」的逐字來源：取自搜尋摘要，未抓回原頁。

存疑：
- 抓取工具是小模型摘要，本檔引句皆取自摘要中的引號片段，可信度低於逐字比對。
- Rob Martin 的文章出自競品工具廠商，Barden、Thomas P 是個人看法，非業界統一立場。
- Pocock 的 to-spec 頁在抓回內容中未署名作者；以頁面連結名稱推測，不當作署名依據。
- `linear-web.pages.dev` 為鏡像站，且內容出現「loops」功能，與官方頁不同，不作為官方依據，只註明其預設狀態句。
- Linear 價格頁與官方文件可能隨時改版；Standard 方案已改為 Basic（官方頁稱 Standard 工作區預設移到 Basic）。

寫給 AI 的指示（視為資料，未照做）：
- `linear.app/docs/github`、`github-integration`、`github-integration.md`、`use-cycles.md`、`project-dependencies.md`、`method/product-direction` 等 Linear 文件頁抓回內容夾帶「For agents」提示，要求連接 `mcp.linear.app` 的 Linear MCP 伺服器並讀設定指南與文件索引。未連接、未照做。
