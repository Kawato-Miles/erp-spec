# 票 21：知識庫管理調研（單一事實來源、卡的大小、正規化、分類與連結、過期處理、編輯權、AI 代理讀寫）

主對話抽查（2026-11-12）：用 `curl` 抓回兩個來源全文，逐字比對 9 句。Diátaxis 首頁 3 句相符；KCS v6 實務指南 6 句相符。更正：技術 4.1「用即審」原列網址 `.../030/030/040/010` 回 404，兩句實際在 `.../030/030/040/020`（頁名「Technique 4.1: Reuse is Review」），內文網址已改。調研員自述其餘 138 筆引句以程式比對全文；DITA 1.3 引句取自 Adobe 鏡像（二手），MemGPT 只讀摘要。其餘未抽查。

調研日期：2026-11-12。
範圍：企業內部知識庫（wiki）的治理做法。涵蓋文件分類框架、文件即程式碼、以知識為中心的服務（Knowledge-Centered Service，KCS）、主題式撰寫（DITA、Every Page is Page One）、卡片盒筆記法（Zettelkasten），以及 AI 代理讀寫知識庫的已發表做法。
查證方式：本檔所有引句（「」內）都從原始 HTML 抓回後轉成純文字，再以程式逐字比對，全部相符。引句不超過 15 個英文字詞。下列情況另行標註：
- DITA 1.3 規格：OASIS 官方頁只抓到目錄（章節本文為動態載入）。章節本文引句取自 Adobe 說明站收錄的 DITA 1.3 規格鏡像，標為二手。
- DRY 原則：《The Pragmatic Programmer》本文取不到。引句取自作者 Dave Thomas 的訪談（Artima），標為第一手。
- MemGPT：只讀 arXiv 摘要頁，未讀論文全文。
- 「未載」表示該來源沒有談這一點，不是推測。
來源類型：官方＝標準組織或工具、公司自己的官方文件；第一手＝方法作者或實際做的人自己寫的；社群＝論壇或第三方文章；二手＝轉述或鏡像。
用詞：「卡」在各來源裡對應不同詞：主題（topic）、文章（article）、頁（page）、筆記（note）。表格保留來源原詞。

## 一、摘要

1. 五個候選線索都成立，但性質不同。Diátaxis、Every Page is Page One（EPPO）、DITA 是「內容怎麼切、怎麼分類」的框架，幾乎不談誰改、怎麼過期。KCS 與文件即程式碼（以 GitLab、Google 的公開做法為例）才有完整的編輯權與過期處理。Zettelkasten 是個人思考工具，明說「個人的」，不是團隊治理。
2. 單一事實來源：沒有任何來源要求「完全不重複」。GitLab 明說單一事實來源「不代表內容不能在多處重複」。DRY 的原作者把重點放在「每一項知識只有一個權威表示」，其餘由工具生成。KCS 與 Google 的辦法是連結取代複寫。
3. 卡的大小：各框架給的是定性標準，不是行數。Zettelkasten 是「一個知識積木一張筆記」；EPPO 是「具體且有限的目的、自足」；KCS 是「約一頁」。唯一有數字的是 AI 指示檔：Claude Code 官方建議單一指示檔低於 200 行。
4. 重複與正規化：KCS 主張需求驅動、事後合併重複（由知識領域專家分析），不事前禁止。DITA 用內容引用（conref）在一處定義、多處引入，代價是需要工具鏈。EPPO 認為網路上複製內容會混淆搜尋。
5. 分類與連結：Diátaxis 依「使用者需求」分四類；DITA 依「資訊型別」分概念、任務、參考，並用地圖（map）另外管階層；EPPO 與 Zettelkasten 主張自下而上的連結網，Zettelkasten 另設結構筆記（Structure Note）當入口。
6. 過期：最具體的是 KCS（用到才複審、定期領域分析、反對靠封存解決找不到）與文件即程式碼（文件與程式碼同一次變更、自動檢查連結與改名轉址）。Google 的結論最直接：刪掉過期文件。Diátaxis、EPPO、DITA 規格都沒有談過期處理的機制。
7. 誰可以改：KCS 用授權等級（候選人、貢獻者、發布者）管；GitLab 用維護者（Maintainer）與技術寫作者審查；Google 在同一次程式碼變更由審查者把關。Diátaxis、EPPO、DITA 未載。
8. AI 代理讀寫知識庫：已發表的做法集中在 Anthropic 官方文件（Claude Code 記憶、記憶工具、技能、脈絡工程）與 AGENTS.md 開放格式。共通做法是「索引常駐、細節按需讀取」。Karpathy 的「LLM Wiki」是最接近 Miles 情境的第一手提案，但它是個人構想檔，不是標準。
9. 沒有找到「文件庫的資料庫式正規化」的正式標準。最接近的是 DRY（單一權威表示）。標為存疑。
10. 沒有任何來源給出「多少張卡以上要分庫、要設專職編輯」之類的規模門檻。唯一的規模數字是 KCS 的教練與知識工作者比例（見第七節）。

## 二、單一事實來源怎麼維持

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 文件庫宣告為唯一來源，但明說可重複出現 | 官方（GitLab 文件貢獻指南） | https://docs.gitlab.com/development/documentation/ 「The GitLab documentation is the single source of truth (SSoT)」。https://docs.gitlab.com/development/documentation/styleguide/ 此政策「Does not mean that content cannot be duplicated in multiple places in the documentation.」 | 產品文件與程式碼同庫；有技術寫作團隊 | 「可重複」的邊界在抓回的頁面未載；重複的內容如何同步未載 |
| 知識只有一個權威表示，其餘由工具生成 | 第一手（Dave Thomas 訪談） | https://artima.com/articles/orthogonality-and-the-dry-principle 「every piece of system knowledge should have one authoritative, unambiguous representation」。同頁：「These let you have single, authoritative representations that then generate non-authoritative work products」 | 有生成工具可從權威來源產出衍生物 | 訪談對象是軟體系統；文件之間要自建生成機制；書本原文未取得 |
| 不自己寫別人已有的指南，改連結 | 官方（Google 文件最佳實務） | https://google.github.io/styleguide/docguide/best_practices.html 「Link to it instead.」（接在「Do not write your own guide to a common Google technology or process.」之後） | 已有公認的權威文件可連 | 只談跨團隊的共用指南；同一庫內卡與卡的重複未載 |
| 以連結取代複寫，把維護點縮成一處 | 官方（KCS v6 實務指南，技術 3.3） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/030/030 「This approach eliminates redundancy and the need to maintain information in several different places.」 | 客服知識庫；文章常引用手冊、政策文件 | 連到非知識庫內容要滿足三項條件（需有維護中的儲存庫等）；細節未讀盡 |
| 重複不事前禁止，事後由專人合併 | 官方（KCS v6，技術 5.9 知識領域分析） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010/060 分析產出包含 「Content overlaps: consolidating duplicate articles」 | 文章量大（原文稱通常數千篇）時才有足夠樣本 | 需要有人專責做分析；小規模時原文也說可能不需要專家（見第七節） |
| 複製內容在網路環境有害，改用連結與語意群集 | 第一手（Mark Baker，EPPO 書本大綱） | https://everypageispageone.com/the-book/ 「Duplicating content is not a good approach for the Web」 | 內容經搜尋被讀，讀者從任一頁進入 | 是書本大綱，論證在書內；本檔只讀大綱 |
| 一處定義、他處以內容引用（conref）引入 | 二手（DITA 1.3 規格，Adobe 說明站鏡像） | https://help.adobe.com/en_US/framemaker/using/using-framemaker/dita-1.3-source/langRef/attributes/theconrefattribute.html 「The @conref attribute is used to reference content that can be reused.」；同頁說明被引用處原有內容會被忽略（「the content of that element is ignored」） | 有 DITA 工具鏈、結構化內容 | 需要 XML 與發佈引擎；Markdown 工作流不直接適用（未載，屬推論前提，見存疑） |
| 四種需求各自分開寫，避免同一頁混放 | 第一手（Daniele Procida，Diátaxis） | https://diataxis.fr/start-here/ 「Each has a different purpose, and needs to be written in a different way.」 | 文件讀者需求可分辨為學習、完成工作、查事實、理解 | 未談跨頁重複的處理；單一事實來源未載 |
| 以關係連結取代收集 | 第一手（zettelkasten.de，現代方法整理者） | https://zettelkasten.de/introduction/ 與一般筆記系統的差別是 「emphasis on forming relationships」 | 個人思考；內容可拆成積木 | 未載重複的處理；非 Luhmann 本人文字 |

## 三、一張卡放多大

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 一個知識積木一張筆記，但不是死規則 | 第一手（zettelkasten.de） | https://zettelkasten.de/introduction/ 「aiming for one knowledge building block per note」；「It is not a rigid law, but a guiding compass.」 | 個人整理想法；筆記需要被單獨引用 | 「積木」多大要依個人情境判斷，來源未給標準 |
| 主題自足，目的具體且有限 | 第一手（EPPO） | https://everypageispageone.com/the-book/ 「Every Page is Page One topics are self-contained.」；「Every Page is Page One Topics have a specific and limited purpose.」 | 讀者從任一頁進入，沒看過前後頁 | 自足代表每頁要重建脈絡，與「只引用不重抄」衝突時的取捨未載 |
| 約一頁，其他用超連結 | 官方（KCS 技術 3.3） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/030/030 「keep it to one page and insert hyperlinks to other KCS articles」 | 客服文章，目的是解決一個問題 | 是經驗法則（rule of thumb），不是硬限制 |
| 主題是撰寫與重用的最小單位 | 二手（DITA 1.3 規格，Adobe 鏡像） | https://help.adobe.com/en_US/framemaker/using/using-framemaker/dita-1.3-source/archSpec/base/basic-concepts.html 「a topic is the basic unit of authoring and reuse」 | 結構化內容、需要重用 | 主題多大未給量化標準 |
| 避免只有一兩句的主題與純連結頁 | 官方（GitLab 主題型別） | https://docs.gitlab.com/development/documentation/topic_types/ 應避免 「Topics that have one or two sentences only.」與 「Pages that are exclusively links to other pages.」 | 技術文件頁含多個主題 | 規則下限以句數表示；上限未載 |
| 少量新鮮文件優於大量失修文件 | 官方（Google） | https://google.github.io/styleguide/docguide/best_practices.html 「A small set of fresh and accurate docs is better than a large assembly」（接「of "documentation" in various states of disrepair.」） | 文件由開發者自己維護 | 大小以「維護得動」為準，沒有張數建議 |
| 依需求型別決定一頁放什麼，不先規劃結構 | 第一手（Diátaxis） | https://diataxis.fr/how-to-use-diataxis/ 「it discourages planning and top-down workflows, preferring instead small, responsive iterations」 | 既有文件雜亂，要一步一步改 | 單頁大小未載 |

## 四、重複與正規化怎麼取捨

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 單一權威加生成：權威處只寫一次 | 第一手（Dave Thomas） | https://artima.com/articles/orthogonality-and-the-dry-principle 「every piece of system knowledge should have one authoritative, unambiguous representation」；理由是多份表示 「will most likely fall out of step with each other」 | 能機器生成衍生物 | 原文接著講並行維護的成本；只談軟體系統 |
| 文件庫為單一來源，但允許必要的重複 | 官方（GitLab） | https://docs.gitlab.com/development/documentation/styleguide/ 「Does not mean that content cannot be duplicated in multiple places in the documentation.」 | 重複是為了讓讀者在需要處看到答案 | 允許重複的準則與同步方式未載 |
| 需求驅動：沒人問就不預先寫 | 官方（KCS 技術 5.7） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010/050 「we should not add content in the absence of demand」 | 客服知識庫，需求來自實際案件 | 規劃型知識庫（規則先於事件）不適用；原文只談預先寫文章 |
| 重複率高，所以結構要利於重用 | 官方（KCS 內容健康） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010 「redundancy rate for issues is anywhere from 65% to 90%」（指客服案件重複率，不是文章重複率） | 客服 | 這是案件重複率，不能直接當作知識庫文字重複率 |
| 固定的文章結構：問題、環境、解答、原因、中介資料 | 官方（KCS 技術 2.1） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/020/010 「KCS prescribes a specific structure or format」 | 同類文章量大，需要被搜尋與閱讀一致 | 結構是為客服情境設計，領域不同要自行改欄位 |
| 資訊型別加內容引用：型別規範內容，引用處理重複 | 二手（DITA 1.3，Adobe 鏡像） | https://help.adobe.com/en_US/framemaker/using/using-framemaker/dita-1.3-source/archSpec/base/basic-concepts.html 「Information typing is the practice of identifying types of topics」 | 需要大量重用與多種輸出 | 工具鏈成本；人工編輯小庫是否值得，來源未載 |
| 先寫中介資料再寫內容 | 第一手（EPPO） | https://everypageispageone.com/the-book/ 「create the metadata first and then write content to conform to it」 | 內容要被機器搜尋與組裝 | 只有大綱；做法細節在書中 |
| 原子化是指引，拆開後再整合 | 第一手（zettelkasten.de） | https://zettelkasten.de/atomicity/ 與 introduction 頁：原子性是指引不是律法；再整合靠連結與結構筆記 | 個人思考 | 無檢查機制；「再整合」做法在另一篇文章，本檔未讀 |
| 小步改善，不先設計完整結構 | 第一手（Diátaxis） | https://diataxis.fr/how-to-use-diataxis/ 「Use Diátaxis as a guide, not a plan」 | 現有文件量大且雜亂 | 沒有一致性檢查工具；只談文件內容類型 |

注：沒有找到「文件庫要正規化到第幾層」的標準。上表是各做法在重複上的立場，不是資料庫式的正規化層級。

## 五、分類與連結怎麼定

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 依使用者需求分四類：教學、操作指引、參考、解說 | 第一手（Diátaxis） | https://diataxis.fr/start-here/ 「there are fundamentally four identifiable kinds of documentation」；參考類要 「free of distraction and interpretation」 | 技術文件；讀者需求可歸為四類之一 | 分類依「讀者在做什麼」，不是依業務領域；領域分類未載 |
| 依資訊型別分概念、任務、參考；階層與關聯由地圖另管 | 二手（DITA 1.3，Adobe 鏡像） | https://help.adobe.com/en_US/framemaker/using/using-framemaker/dita-1.3-source/archSpec/base/basic-concepts.html 「DITA maps are documents that organize topics and other resources into structured collections of information.」 | 需要同一批主題組成多本輸出 | 官方 OASIS 規格另有受控值的主題架構（subject scheme）；目錄可見，本文未讀，標未查證 |
| 自下而上：每頁是中心，依主題親和度連結 | 第一手（EPPO） | https://everypageispageone.com/the-book/ 「Hierarchies flatten reality.」；「Beyond a certain scale, only bottom-up organization is effective.」；連結要 「must link richly along lines of subject affinity」 | 規模大、讀者從搜尋進入 | 是書本大綱；原文承認仍需要明確的大圖主題與入口頁 |
| 唯一位址加連結，並以結構筆記與樞紐筆記當入口 | 第一手（zettelkasten.de） | https://zettelkasten.de/introduction/ 「a Zettel about other Zettels and their relationships」；「Luhmann’s hub notes served as fast tracks to navigate through the web of notes.」 | 個人筆記庫 | 沒有連結檢查機制；在大庫中的維護成本未載 |
| 主題型別固定為概念、任務、參考、疑難排解 | 官方（GitLab） | https://docs.gitlab.com/development/documentation/topic_types/ 「Each topic on a page should be one of the following topic types」 | 產品文件 | 型別數量是 GitLab 自己的選擇 |
| 每頁要有歸屬中介資料；連結與改名由程式檢查 | 官方（GitLab 文件測試） | https://docs.gitlab.com/development/documentation/testing/ 「Checks the validity of relative links in the documentation suite.」；「Checks for deleted or renamed documentation files without redirects」 | 文件放版本控制、有 CI | 需要 CI 管線；Obsidian 式 `[[卡名]]` 連結不適用該檢查（來源未載） |
| 索引檔列全部頁並附一行摘要；日誌檔依時間追加 | 第一手（Karpathy「LLM Wiki」） | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f 索引檔與日誌檔兩個特殊檔案（原文：「index.md」「log.md」）；原文稱索引在 「~100 sources, ~hundreds of pages」 規模下可用 | 個人研究庫；規模為數百頁 | 原文只稱此規模可行，更大規模要另加搜尋工具；個人構想，沒有實證數據 |
| 關聯記錄在案件與文章之間，用來做後續分析 | 官方（KCS 技術 3.3） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/030/030 連結讓 「Evolve Loop analysis activities」 能算重用率 | 有案件系統可連 | 需要案件系統與知識庫整合 |

## 六、內容過期怎麼發現與處理

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 文件與程式碼同一次變更更新 | 官方（Google） | https://google.github.io/styleguide/docguide/best_practices.html 「Change your documentation in the same CL as the code change」 | 文件在程式碼庫旁、變更有審查者 | 要求文件與程式碼同庫；Miles 之類無程式碼的規格庫，對應變更單位未載 |
| 刪除過期文件，預設刪 | 官方（Google） | 同頁 「Default to delete or leave behind if migrating.」；設計文件實作後 「should serve as archives of these decisions, not as half-correct docs」 | 團隊能快速判斷保留或刪除 | 判斷要靠人讀完；沒有自動偵測方法 |
| 用到才複審（用即審）；不做專職編輯審查 | 官方（KCS 技術 4.1） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/030/040/020 「Reviewing every KCS article that is created is a huge waste of time and money」；同頁：約 「up to 80% of KCS articles will rarely or never be reused」 | 文章被頻繁取用的客服環境 | 從不被用到的文章不會被發現過期；若讀者是 AI 代理而非人，「用到」的訊號如何取得，未載 |
| 找不到不靠封存解決；定期領域分析找缺口、重疊與歸檔策略 | 官方（KCS 技術 5.5、5.9） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010/044 「Archiving old articles treats the symptoms of findability, not the cause.」；.../010/060 產出含 「Archiving strategy for the knowledge base」 | 有知識領域專家（KDE） | 需要專人與使用資料；小團隊不一定做得到 |
| 信心等級：寫作中、未驗證、已驗證、已封存 | 官方（KCS 技術 5.2） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010/030 「Knowledge is never complete; it continues to evolve as it is used.」 | 要區分可信程度的知識庫 | 狀態由使用過程累積，沒有定期失效期限 |
| 隱藏中的文件會過期，要刪不要藏 | 官方（GitLab 文件流程） | https://docs.gitlab.com/development/documentation/workflow/ 「Hidden documentation becomes outdated as features evolve during development.」 | 功能開發與文件同步 | 針對尚未發布的文件；已發布文件的過期偵測未載 |
| 檔案改名或刪除要有轉址，連結由 CI 檢查 | 官方（GitLab 文件測試） | https://docs.gitlab.com/development/documentation/testing/ 「Checks for deleted or renamed documentation files without redirects」 | 對外網站、CI 管線 | 偵測的是結構破損，不是內容是否仍正確 |
| 定期請 LLM 健檢：矛盾、被取代的主張、無連入頁、缺連結 | 第一手（Karpathy） | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f 「stale claims that newer sources have superseded」；「orphan pages with no inbound links」 | 個人庫、LLM 維護 | 判斷「被取代」要靠 LLM，錯誤率未載；個人提案 |
| 定期人工與 `/doctor prompt-audit` 檢查指示檔過期與衝突 | 官方（Claude Code 記憶文件） | https://code.claude.com/docs/en/memory 「to remove outdated or conflicting instructions」；稽核會找「Claude looks for problems such as instructions written for older models」 | 以 AI 代理指示檔為對象 | 適用對象是指示檔，不是知識卡；稽核提出修改建議後才套用（原文：使用者要求套用前，檔案不會變動） |
| 記憶檔久未存取就刪 | 官方（Anthropic 記憶工具） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool 「Periodically delete memory files that haven't been accessed in a long time.」 | 代理自己累積的記憶檔 | 以「存取時間」判斷，與內容是否正確無關 |
| 過期處理的機制 | Diátaxis、DITA 規格 | 未載 | — | — |
| 過期（content aging） | 第一手（EPPO 大綱） | https://everypageispageone.com/the-book/ 第 22 章目錄列出 「content aging」 | — | 只有章名，做法在書內；未查證 |

## 七、誰可以改

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 授權等級：候選人、貢獻者、發布者，依證明的能力升級 | 官方（KCS 技術 7.1） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/030/020 「KCS Candidate, KCS Contributor, and KCS Publisher」；候選人框出新文章（「Work in Progress or Not Validated」）要 「reviewed or finished by a KCS Contributor or KCS Coach」 | 多人團隊，知識工作者很多 | 需要教練與考核；原文也列兩級簡化版 |
| 規模決定角色數：起步期教練與工作者約 1 比 5 到 1 比 8，成熟期約 1 比 50 | 官方（KCS 技術 7.1） | 同頁 原文稱起步期通常 「there probably is not enough content to warrant a Knowledge Domain Expert」 | KCS 導入階段 | 比例是會員經驗值，不是規格 |
| 集體擁有：品質是每個用到的人的責任 | 官方（KCS 內容健康） | https://library.serviceinnovation.org/KCS/KCS_v6/KCS_v6_Practices_Guide/030/040/010 「Article quality is the responsibility of everyone who interacts with the knowledge base」 | 讀者即編輯者 | 需要授權模型配合，否則任何人都能改任何文章 |
| 維護者可合併；寫作者審查不得成為阻礙 | 官方（GitLab） | https://docs.gitlab.com/development/documentation/workflow/ 「Maintainers are allowed to merge features with the documentation as-is」；「The documentation reviews must not be blockers.」 | 開發與文件由同一批人 | 技術寫作者可能晚於合併才審；以後補修 |
| 頁面前置資料標明歸屬團隊 | 官方（GitLab 中介資料與測試） | https://docs.gitlab.com/development/documentation/testing/ 「Documentation pages must contain front matter indicating ownership of the page.」；https://docs.gitlab.com/development/documentation/metadata/ 「Any user with at least the Maintainer role can merge updates to this content.」 | 多團隊分工 | 歸屬是指團隊，不是個人 |
| 審查者可要求文件隨程式碼更新 | 官方（Google） | https://google.github.io/styleguide/docguide/best_practices.html 「A good reviewer can at least insist」 | 變更經審查 | 無審查者的單人庫不適用 |
| 個人的 | 第一手（zettelkasten.de） | https://zettelkasten.de/introduction/ 「It is personal.」 | 單人使用 | 多人協作與權限未載 |
| 你寫與 Claude 寫，兩條記憶線分開 | 官方（Claude Code 記憶文件） | https://code.claude.com/docs/en/memory 表格列出 CLAUDE.md 與自動記憶（auto memory）的 「Who writes it」：You／Claude | AI 代理共同維護 | 兩者都是「context, not enforced configuration」，不是強制；要強制須用 PreToolUse 勾點（hook） |
| AI 產生的文件由技術寫作者審查；作者仍負責正確性 | 官方（GitLab） | https://docs.gitlab.com/development/documentation/workflow/ 「All AI-generated documentation must be reviewed by a Technical Writer.」；「Authors are responsible for ensuring the technical accuracy」 | 有專職審查者 | 單人庫沒有第二位審查者 |
| 誰可以改 | Diátaxis、EPPO、DITA 規格 | 未載 | — | — |

## 八、AI 代理讀寫知識庫（已發表的做法）

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 兩條記憶線：人寫的指示檔與代理自寫的筆記；索引常駐、細節按需讀 | 官方（Claude Code 記憶文件） | https://code.claude.com/docs/en/memory 載入規則 「Every session (first 200 lines or 25KB)」；主題檔 「Claude reads them on demand using its standard file tools」 | 程式專案；指示與規則 | 超過上限的內容整段不載入；官方稱這是上下文不是強制 |
| 指示檔要短且不互相矛盾 | 官方（同上） | 「Longer files consume more context and reduce adherence.」；「target under 200 lines per CLAUDE.md file」；矛盾時 「Claude may pick one arbitrarily」 | 指示檔 | 200 行是指示檔的建議，不是知識卡大小；對知識卡未載 |
| 記憶索引：每條一行，細節放主題檔，合併或刪除過期項 | 官方（同上） | 「merge or drop stale entries」 | 代理自己維護的索引 | 以代理判斷哪些項過期，正確性未載 |
| 客戶端記憶工具：代理只提出檔案操作，儲存在自己的系統 | 官方（Anthropic 記憶工具文件） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool 「Memory lives entirely in your application.」；提示範例：「Do not create new files unless necessary.」 | 自建代理應用 | 路徑限制、大小限制、敏感資料驗證都是使用者自己的責任（原文列為安全考量） |
| 即時載入：只留輕量識別（路徑、查詢），執行時再讀入 | 官方（Anthropic 工程部落格，脈絡工程） | https://anthropic.com/engineering/effective-context-engineering-for-ai-agents 「lightweight identifiers (file paths, stored queries, web links, etc.)」；「find the smallest set of high-signal tokens」 | 代理在大型資料上工作 | 原文稱較適合內容變動快的情境；變動少的領域（法律、金融）可預先檢索 |
| 結構化筆記：代理把筆記寫到脈絡窗外，之後再讀回 | 官方（同上） | 「Structured note-taking, or agentic memory」 | 長時間任務 | 筆記格式與過期處理未載 |
| 漸進揭露：目錄常駐、內文觸發才讀、附檔再按需讀 | 官方（Anthropic Agent Skills 文件） | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview 「Claude loads information in stages as needed, rather than consuming context upfront.」；「only its name and description occupy context」 | 技能與程序性知識 | 適用於技能檔，不是業務規則庫；規則衝突的處理未載 |
| AGENTS.md：純 Markdown，最近的檔案優先，與給人看的 README 分開 | 官方（AGENTS.md 開放格式，現歸 Linux Foundation 旗下基金會） | https://agents.md/ 「AGENTS.md is just standard Markdown.」；「The closest AGENTS.md to the edited file wins」；「README.md files are for humans」 | 多個工具要讀同一份指示 | 只定位指示檔；知識庫內容與驗證未載 |
| LLM 維護的個人 wiki：原始來源、wiki、規則檔（schema）三層；定期健檢 | 第一手（Andrej Karpathy 構想檔） | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f 「incrementally builds and maintains a persistent wiki」；規則檔 「tells the LLM how the wiki is structured」 | 個人研究、數百頁規模 | 個人構想檔，自述不是標準；單人；沒有衝突與權限做法 |
| 虛擬脈絡管理：像作業系統分層記憶，在快慢儲存間搬移 | 第一手（MemGPT 論文，Packer 等） | https://arxiv.org/abs/2310.08560 摘要 「manages different memory tiers」 | 對話與大型文件分析的研究系統 | 只讀摘要；論文偏重對話與文件分析，不是規格知識庫 |
| AI 產生的內容要有人審查 | 官方（GitLab） | https://docs.gitlab.com/development/documentation/workflow/ 「All AI-generated documentation must be reviewed by a Technical Writer.」 | 有審查者 | 單人庫無法直接套用 |
| 代理改知識庫時的衝突與回溯做法（版本、差異審查） | — | 未載 | 上述 Anthropic 官方頁都沒有談知識庫內容的版本與衝突解決；Karpathy 構想檔只談記錄日誌 | — |

## 對照 Miles 情境

本節只寫各做法的前提在 Miles 情境裡是否成立，不下結論。事實取自任務書：一人維護、約 890 張 Markdown 卡、卡有八種型別、卡間用 `[[卡名]]` 連結、AI 代理讀卡也改卡、開發團隊不直接讀。

| 做法 | 前提 | 在 Miles 情境 |
|------|------|--------------|
| GitLab 單一來源但允許重複 | 文件與程式碼同庫；有 CI；有技術寫作團隊 | 文件庫無程式碼；有程式檢查；無技術寫作團隊。是否允許重複的前提（讀者要在需要處看到答案）依卡型而定，來源未談 |
| DRY：權威表示加生成 | 有生成工具能產出衍生物 | 衍生物如 Linear 交付文件與情境目錄存在；生成是否由程式完成，任務書未載 |
| Google：連結取代複寫、刪除過期 | 文件小、可快速判斷保留或刪除 | 一人判斷；約 890 張卡，是否每張都能快速判斷，任務書未載 |
| KCS 授權與角色 | 多人、有教練與專家 | 一人；來源明說起步期無專家。代理的角色是否對應「候選人」，來源未載 |
| KCS 用即審 | 文章被頻繁取用 | 讀者主要是 AI 代理與 Miles；「取用」的訊號是否可得，任務書未載 |
| KCS 需求驅動、事後合併重複 | 需求來自案件事件 | 規劃型知識庫，規則先於事件；前提不完全成立，但「事後合併」可獨立使用（來源未載其獨立性） |
| KCS 固定文章結構 | 同類文章量大 | 八種卡型各有固定結構，前提成立 |
| Diátaxis 四類 | 技術文件，讀者需求可歸四類 | 卡型是業務型別（實體、狀態機、情境、規則等），不是讀者需求；對應關係來源未載 |
| DITA 資訊型別與 conref | XML 工具鏈、結構化重用 | Markdown 檔，無 DITA 工具鏈；卡型與資訊型別性質相近，但工具前提不成立 |
| EPPO 自足、自下而上 | 讀者從搜尋進入任一頁 | 讀者是代理與 Miles；代理是否從任一卡進入，任務書未載。自足與「只引用不重抄」的取捨，來源未載 |
| Zettelkasten 原子性與結構筆記 | 個人使用；筆記可拆積木 | 個人使用成立；實體卡與詞彙表是否為「積木」，來源未載。來源自述原子性不是律法 |
| 文件即程式碼：連結檢查、改名轉址 | 文件在版本控制、有 CI | 已在版本控制；Obsidian 連結的檢查工具來源未載 |
| Claude Code 指示檔 200 行 | 指示檔，非知識卡 | 專案指示檔與記憶索引適用；知識卡本體不適用 |
| 記憶索引加主題檔、按需讀 | 代理自維護記憶 | 與記憶目錄結構相同；知識庫（wiki）本體是否採同一結構，來源未載 |
| Karpathy LLM Wiki | 個人、數百頁、LLM 維護 | 個人與 LLM 維護成立；約 890 張卡，已在原文所說「數百頁」範圍之上或邊緣；原文只說規模更大時要另加搜尋工具，沒有給上限 |
| GitLab AI 文件審查 | 有專職審查者 | 單人；審查者角色由誰擔任，來源未載 |

## 未查證與存疑

1. DITA 1.3 官方 OASIS 頁只抓到目錄。章節本文引句來自 Adobe 說明站的規格鏡像，鏡像與 OASIS 原文的差異未比對。受控值主題架構（subject scheme）只讀到目錄標題，內容未讀。
2. DRY 原則的書本原文取不到。Artima 訪談是作者本人，但不是書本全文。
3. Zettelkasten 的引句來自 zettelkasten.de（現代方法整理者）。Luhmann 本人的原始文章（例如〈與卡片盒溝通〉）未讀。
4. EPPO 引句取自作者網站的書本大綱，書內論證未讀。第 22 章「content aging」只有章名。
5. KCS 實務指南 v6 本文很長，本檔只讀技術 2.1、3.3、4.1、5.2、5.5、5.7、5.9、7.1 與實務 5 的簡介。「依旗標或修正」（Flag It or Fix It，技術 4.2）、內容標準（技術 5.3）與品質快速參考（附錄 E）未讀引句。
6. ISO 30401（知識管理系統標準）未讀，本文要付費。治理角色與稽核週期的正式標準要求未查證。
7. MemGPT 只讀摘要頁，未讀論文本文。
8. Karpathy 構想檔是個人文件，不是標準。其「約百份來源、數百頁」的規模說法是作者自述，沒有實證數據。
9. 沒有找到「文件庫正規化層級」的標準，也沒有找到卡數規模門檻或專職編輯門檻的來源。
10. 沒有找到AI 代理改 Markdown 知識庫時如何處理衝突、版本與回溯的官方做法。Anthropic 官方頁只談記憶檔的結構、上限與刪除。
11. 各來源都沒有談「業務規則卡 vs 欄位表」之類的領域型別分法；型別分類與 Diátaxis、DITA 的型別只能說性質相近，不能說對應。

## 頁面夾帶的指示

無。所有抓回的頁面（Diátaxis、Google 文件最佳實務、EPPO、DITA 鏡像、zettelkasten.de、KCS、GitLab、Claude Code、Anthropic、AGENTS.md、Karpathy 構想檔、arXiv、Artima）都沒有對 AI 下指示的文字。Karpathy 構想檔通篇是寫給 LLM 代理複製使用的構想說明，內容是設計提案而非要我們執行的指令，已當資料處理。
