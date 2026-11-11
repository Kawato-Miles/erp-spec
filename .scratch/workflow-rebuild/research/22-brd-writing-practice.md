# 票 22：商業需求文件撰寫調研（內容與細度、業務規則寫法、欄位狀態權限的歸屬、與產品需求文件及功能規格的分界、活文件或一次性）

主對話抽查（2026-11-12）：用 `curl` 抓回三個來源全文，逐字比對 5 句，全部相符：Wiegers〈需求陷阱〉2 句、Ross〈RuleSpeak〉2 句、Wiegers〈How Detailed Should Requirements Be〉第 1 部 1 句。另核對摘要第 4 條的轉述：RuleSpeak 的兩個規則關鍵字是「must」「only」，原文寫明「may … if …」句型「should always be avoided」，轉述正確。ISO 29148 與 Volere 只讀到目錄，BABOK 本文未讀，見檔尾。其餘未抽查。

調研日期：2026-11-12。範圍：商業需求文件（Business Requirements Document，BRD）該寫什麼與寫到多細；業務規則（business rule）的寫法；欄位、狀態、權限屬於哪一層；BRD 與產品需求文件（Product Requirements Document，PRD）、功能規格的分界；文件是活文件還是一次性。
查證方式：下列來源用 `curl -sL` 抓回原始檔（HTML、PDF、docx），轉成純文字後，以腳本把每句引句正規化（統一引號、空白、軟連字號）再逐字比對，全部比對相符：IIBA 知識中心第 4.4 節、Wiegers 的「需求陷阱」文章、Wiegers 願景與範圍範本（docx）、Wiegers 資料字典指引（docx）、Wiegers《Software Requirements》第三版試讀頁（出版社網站 PDF）、Modern Analyst 轉載的 Wiegers「需求該多細」兩篇、ISO/IEC/IEEE 29148:2018 預覽 PDF（VDE 出版社）、Ross 的 RuleSpeak 句型文章、Ross 的規則手冊管理文章、Business Rules Manifesto PDF、Business Rules Group 的 Q2 解答、Gottesdiener 文章、Volere 範本摘錄頁、OMG 的 SBVR 頁、Atlassian PRD 頁、Modern Analyst 轉載的 Ross 章節摘錄與 Userdoc 創辦人文章。凡標「搜尋摘要」者，只讀到搜尋結果的摘要，未取得原文，可信度低。
標準本文讀到的層級：ISO/IEC/IEEE 29148 只讀到預覽 PDF（目錄、前言、範圍），沒有讀到各條文本文，因此只能說明資訊項目的標題，不能說明內容寫法。BABOK 指南本文要付費或被擋，只讀到 IIBA 公開知識中心頁。Volere 完整範本要付費（單一專案 55 美元，頁面標示），只讀到公開摘錄的章節標題與少數展開段落。
來源類型：官方＝標準組織、知識體系組織或工具官方頁；第一手＝方法原作者或實務者本人的文章與書；社群＝論壇、部落格、第三方轉載；二手＝轉述、行銷、廠商文章。

## 一、摘要

1. 各家都把「商業需求」放在最上層，只談目標、成果、範圍與背景：IIBA 稱之為「為何發起變更」的目標與成果，Wiegers 放進願景與範圍文件（vision and scope document），ISO 29148 稱之為商業需求規格（Business Requirements Specification，BRS）。
2. 細度的判準沒有標準數字。Wiegers 的說法是「誰在何時做決定」：要交由開發者決定的細節越多，文件可以越粗；要指定確切交付物、外包、要靠需求寫測試，就要越細。
3. 業務規則（business rule）在多數方法中是獨立於需求文件的另一類產出：Business Rules Manifesto 主張規則「不放進」流程或用例、各自單一來源；Gottesdiener 稱規則是業務的產物，不是資訊系統的產物。唯一例外是 Wiegers 早期文章，把業務規則歸在軟體需求規格的非功能需求容器內（兩種做法並存，見第三節）。
4. 業務規則的寫法有成熟的句型：RuleSpeak 規定每句只有一個規則關鍵字（「must」或「only」），主詞放句首，「may … if …」要避免，因為容易被誤讀；規則與其執行方式分開寫。
5. 欄位的值域、長度、格式有明確的歸屬：Wiegers 的資料字典範本把「長度」與「可選值」列成欄位，字典可附在軟體需求規格後或獨立成檔，Wiegers 偏好獨立。BABOK 與 Volere 也都有資料字典這個產物。來源沒有把它歸入 BRD。
6. 狀態與權限沒有找到明文歸屬到 BRD 的來源。ISO 29148 的目錄把「作業模式」放在 BRS，把「系統模式與狀態」放在系統需求規格，把「安全需求」放在系統需求規格；Volere 把「存取需求」放在非功能需求（第 15a 節）。以上只讀到目錄標題。
7. BRD 與 PRD 的分界沒有官方標準：BABOK 與 ISO 都沒有 PRD 這個分類。Atlassian 把 PRD 定位為定義「產品的目的、功能與行為」；BRD 與功能規格的分界，最有出處的是 Wiegers 的三層（業務需求、使用者需求、功能需求）與 BABOK 的四類。
8. 活文件或一次性：BABOK 把「維護需求」列為任務，Wiegers 在改版與維護專案中主張把新需求加進既有需求庫、保持更新；Manifesto 稱規則「需要培育、保護與管理」。反方是 Wiegers 自己承認「更新太繁重就會被放棄」。一次性文件的主張只見於廠商文章的反面敘述（需求在專案結束後散在已完成的票內）。
9. 找不到來源直接回答「BRD 在敏捷團隊是否仍是正式交付物」；搜尋結果中的 BRD、PRD、功能需求文件比較文章多為行銷或內容農場，不納入。

## 二、BRD 該寫什麼、寫到多細

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 四類分層：業務、利害關係人、解決方案、轉換需求；業務需求只寫目標、目的與成果 | 官方（IIBA） | https://iiba.org/knowledgehub/the-business-analysis-standard/4-implementing-business-analysis/4-4-understanding-requirements-and-designs/。「Statements of goals, objectives, and outcomes for why a change has been initiated.」；轉換需求：「They are temporary and address areas such as data conversion, training, and business continuity.」 | 一般企業變更與系統導入；轉換需求在切換完成後不再維護 | 該頁只給分類定義，不給 BRD 的章節範本與細度準則 |
| 願景與範圍文件：業務需求章節含背景、機會、目標、成功指標、願景、風險與假設；範圍章節含主要功能、初版範圍、排除項 | 第一手（Wiegers 範本） | https://people.eecs.ku.edu/~saiedian/812/Project/Wiegers-Resources/Chapter%205/Vision%20and%20Scope%20Template.docx。「The business requirements provide the foundation and reference for all detailed requirements development.」；範圍用途：「a reference frame against which proposed features and requirements changes can be evaluated」 | 專案有明確發起人、需要用範圍擋變更 | 範本本身偏專案導向（有「初版」「後續版本」），長期維護的產品知識庫要自行改造；範本頁未談寫到多細 |
| 三層需求：業務需求記在願景與範圍文件，使用者需求用用例，功能需求寫進軟體需求規格 | 第一手（Wiegers） | https://cs.hmc.edu/~markk/SWE_copies/reqtraps.html。「You can record business requirements in a product vision and scope document.」 | 要讓主管、使用者、開發者對「需求」一詞有相同層級的期待 | 此文為 2000 年代文章；把業務規則放在軟體需求規格的非功能需求內，與 Manifesto 的獨立主張不同（見第三節） |
| ISO 29148 以四份規格分層：BRS、StRS、SyRS、SRS；BRS 內容含業務目的、範圍、目標、流程、業務作業政策與規則、限制、高階作業情境 | 官方（ISO/IEC/IEEE） | https://assets.vde-verlag.de/iec-normen/preview-pdf/info_isoiecieee29148%7Bed2.0%7Den.pdf（預覽 PDF）。目錄標題：「Business requirements specification (BRS) content」「Business operational policies and rules」 | 正式的系統與軟體工程專案、需要符合標準的採購或稽核情境 | 只讀到目錄；各項內容怎麼寫、寫多細，本文要付費，未查證。標準文件偏正式，小團隊直接全套套用成本高（推論，來源未載） |
| Volere：專案目的章節要求目標可量測；另有「事實與假設」內的業務規則、業務資料模型與資料字典 | 第一手（Robertson） | https://volere.org/templates/volere-requirements-specification-template/。「Any reasonable goal must be measurable.」；章節標題「Business Data Model and Data Dictionary」「Business Rules」 | 需要完整檢核表的需求規格；可把章節當缺漏檢查表 | 完整範本約 90 頁且付費，只讀到公開摘錄；每項需求另有「適配準則」（fit criterion），工作量大 |
| 細度由「誰做決定」決定：較少細節的條件是客戶深度參與、開發者有領域經驗；較多細節的條件是外包、靠需求寫測試 | 第一手（Wiegers，Modern Analyst 轉載） | https://modernanalyst.com/Resources/Articles/tabid/115/ID/2068/How-Detailed-Should-Requirements-Be--Part-1.aspx。「It costs more to develop requirements in greater detail」；「The requirements might be vague, but the product will be specific.」；較多細節清單含「Development will be outsourced」「Testing will be based on requirements」 | 判斷任何一層文件該寫多細 | 給的是判斷條件，沒有數字；全系列是對軟體需求規格的討論，非專指 BRD |

## 三、業務規則怎麼寫才不被誤讀

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| RuleSpeak 句型：每句只用一個規則關鍵字；主詞放句首；用 if 表示持續成立、用 when 表示只在特定時點成立 | 第一手（Ross） | https://brcommunity.com/articles.php?id=b472。「include exactly one of these two Rule Keywords」；「The word "if" indicates that qualification is continuous over time.」 | 要在大量規則間保持寫法一致，且由多位分析師共同撰寫 | 需要練習與紀律；原文自述句型只適用於日常營運層規則，不適用於法規、契約、政策層級的指導 |
| 避免「may … if …」，改用「may … only if …」或另寫一條規則 | 第一手（Ross） | 同上。「Statements using that Sentence Form are quite tricky and can be easily misunderstood.」 | 規則含「允許」語意時 | 規則要拆成多句，條數變多 |
| 把規則與「建議」分開：規則使用 must、only；建議使用 may、need not，不混用 | 第一手（Ross） | 同上。「A Statement of Advice should never include either of the two Rule Keywords.」 | 要區分「一定要」與「允許」 | 需要先判斷每句屬於哪一類 |
| 嚴格程度另外記，不放進規則句本身（不用 should 表示強制程度） | 第一手（Ross） | 同上。「We prefer to document any sense of how strictly」（原句接著說明是指另行記錄執行強度） | 規則的執行強度（警告、擋下）會因情境不同 | 要多一個欄位或另一處紀錄 |
| 規則基於事實型與術語：規則句直接使用事實模型的措辭，再加上「必須」的語氣 | 第一手（Ross，Modern Analyst 轉載章節） | https://modernanalyst.com/Resources/Articles/tabid/115/ID/1164/What-You-Need-to-Know-About-Business-Rules.aspx。（章節說：規則句建立在事實型措辭上；詞彙是擴大規模的支架，未逐字引用） | 規則數達數百、數千條時要保持一致 | 需要先建立詞彙與事實模型 |
| 規則句同時就是系統給使用者的提示文字 | 第一手（Ross，同上） | 同上。「the business rule statement is the guidance message」 | 規則被違反時系統要告知使用者原因 | 原文自承是誇大說法，可另加客製說明 |
| 規則單一來源、不寫進其他交付物；例外也用規則表達 | 官方式宣言（Business Rules Group） | https://brcommunity.com/brg/BRManifesto.pdf。「Rules are not process and not procedure.」；「Exceptions to rules are expressed by other rules.」（原文換行）；Q&A：https://brcommunity.com/articles.php?id=s003「written once and then applied everywhere」 | 同一條規則會被多個流程、用例使用 | 要有人維護獨立規則庫；團隊若把規則寫在用例內較快，會失去單一來源 |
| 規則是「功能需求背後的知識」，不是系統需求本身；並非所有規則都由軟體實作 | 第一手（Gottesdiener） | https://brcommunity.com/articles.php?id=b051。「Business rules are artifacts of the business and not of IT」；「Business rules operationalize broader business policies.」 | 要分清「系統承諾」與「業務規則」 | 該文是 2000 年代文章，用例範例偏舊 |
| 業務規則歸在軟體需求規格的非功能需求內，作為一類需求 | 第一手（Wiegers） | https://cs.hmc.edu/~markk/SWE_copies/reqtraps.html。原文：「business rules, design and implementation constraints, and external interface requirements」（列在非功能需求之下） | 需求只有軟體需求規格一份時 | 與 Manifesto、Gottesdiener 的獨立主張不同；Wiegers 後續著作另有規則章節與分類，本調研只讀到目錄，未查證 |
| 標準：SBVR 是 OMG 的商業詞彙與規則語意規格，RuleSpeak 是其參考記法之一 | 官方（OMG；Ross） | https://omg.org/spec/SBVR/1.5/About-SBVR。「This specification defines the vocabulary and rules for documenting the semantics of business vocabularies and business rules」；https://brcommunity.com/articles.php?id=b472 註腳稱 RuleSpeak 與 SBVR 相容（未逐字引用） | 需要在組織與工具之間交換詞彙與規則 | SBVR 規格本身是形式語意模型，一般分析師不直接用其本文 |

## 四、欄位、狀態、權限屬於商業需求文件還是功能規格

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 欄位：資料字典定義每個資料元素的意義、組成、可選值，並有「長度」「可選值」欄；字典可附在規格後，或獨立成檔 | 第一手（Wiegers） | https://people.eecs.ku.edu/~saiedian/812/Project/Wiegers-Resources/Chapter%2013/Guidance%20for%20Data%20Dictionaries.docx。「defines the meaning, composition, allows values, and other information」；「avoids redundancy and inconsistencies」（指獨立字典） | 多個功能共用同一批資料元素 | 要另外維護一份；範本屬軟體需求層，未說明放在 BRD 還是規格 |
| 欄位的邊界值要寫出來，否則由開發者自行決定 | 第一手（Wiegers，Modern Analyst 轉載） | 第二節同一頁。範例提問：「What are the minimum and maximum numbers of digits allowed in a passcode?」 | 開發者要在不問人的情況下實作 | 例子是單一功能，未說明這類細節放哪一份文件 |
| 欄位：資料字典是 BABOK 的技術之一，目的是統一資料元素的定義 | 官方（BABOK，搜尋摘要） | 搜尋摘要稱 BABOK v3 第 10.12 節說資料字典用於「標準化資料元素的定義」；取得的頁面是研讀站，未取得 BABOK 原文，無逐字引句 | 要統一資料定義 | 引句未取得，可信度低 |
| 欄位：Volere 把「業務資料模型與資料字典」放在第 7 節，早於產品範圍（第 8 節）與功能需求（第 9 節） | 第一手（Robertson） | volere.org 範本摘錄頁。章節標題「Business Data Model and Data Dictionary」 | 把業務資料定義視為功能需求的前置輸入 | 只讀到標題與章節順序，未讀欄位層級內容 |
| 狀態：ISO 29148 目錄中，BRS 有「作業模式」，StRS 與 SyRS 有「模式與狀態」 | 官方（ISO，預覽 PDF） | 預覽 PDF 目錄：「Business operational modes」（BRS 9.3.13）；「System modes and states」（SyRS 9.5.10） | 要依標準分層的專案 | 只讀到目錄。「作業模式」（如正常、緊急）與實體的生命週期狀態是否同一概念，來源未載 |
| 狀態：業務規則依生命週期階段而成立，如理賠單在「待處理」階段須滿足的條件就是規則 | 第一手（Gottesdiener） | https://brcommunity.com/articles.php?id=b051（段落以「pending」階段為例，已讀；未逐字引句） | 要說明狀態轉換為何成立 | 範例用於說明規則與需求的關係，沒有談狀態機放哪一層 |
| 權限：Volere 把「存取需求」歸在非功能需求的安全需求；ISO 把「系統安全需求」歸在 SyRS | 第一手（Robertson）；官方（ISO） | volere.org 範本摘錄頁：「Access Requirements」（15a）；ISO 預覽 PDF 目錄：「System security requirements」 | 把權限當作系統品質屬性來寫 | 兩者都只讀到標題。「誰可以做什麼」這種角色分權，若屬業務規則，是否也放 BRD，來源未載 |
| 權限與角色：ISO 的 BRS 有「主要利害關係人」「業務結構」 | 官方（ISO，預覽 PDF） | 目錄：9.3.5「Major Stakeholders」；9.3.15「Business structure」 | 要記錄誰參與、誰負責 | 只到組織層級，未到單據層級的操作權限 |
| 來源缺口：沒有找到任何來源明文說「欄位表、狀態列舉、權限屬於 BRD」或「屬於功能規格」 | — | 見「未查證與存疑」第 6 項 | — | 未查證 |

## 五、BRD 與 PRD、功能規格的分界

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 以「需求層級」分：業務需求（為何做）、使用者需求（使用者要完成什麼）、功能需求（軟體要有哪些行為） | 第一手（Wiegers） | https://cs.hmc.edu/~markk/SWE_copies/reqtraps.html（三層描述已讀，同第二節） | 有專案發起人與正式規格流程 | 沒有 PRD 這一層；Wiegers 的軟體需求規格同時承載功能與非功能需求 |
| 以「為何變更／誰的需求／解決方案」分：業務、利害關係人、解決方案、轉換 | 官方（IIBA） | 同第二節 IIBA 頁。「The capabilities and qualities of a solution that meet the stakeholder requirements.」 | 作為分類語言，不規定文件名 | 官方分類是需求類型，不是文件類型，BRD、PRD 不在其中 |
| 以「文件」分：BRS、StRS、SyRS、SRS 四份規格各有大綱 | 官方（ISO） | ISO 29148 預覽 PDF 目錄（8.2 至 8.5）。「Software requirements specification」 | 正式專案 | 同第二節；PRD 不是標準中的文件類型 |
| PRD：定義產品的目的、功能、行為，並作為跨職能團隊的單一資訊來源；細節留給開發團隊 | 官方（Atlassian） | https://atlassian.com/agile/product-management/requirements。「A product requirements document (PRD) defines the purpose, features, and behavior of a product」；「They can focus on higher-level requirements and leave implementation details to the development team」 | 敏捷產品團隊 | 這是 Atlassian 的產品頁，屬廠商定義，不是標準；未談 BRD 的分界 |
| 規格以「問題空間或解決方案空間」分（Wiegers：需求是 what，設計是 how）；BRD 屬業務層的「what」 | 搜尋摘要 | 搜尋摘要稱 EPFL 概念頁認為業務需求與產品需求是不同種類的「what」，非只是細度差異；頁面未取得，無逐字引句 | — | 引句未取得，可信度低 |
| BRD、PRD、FRD 的比較文章多為行銷頁（如專案管理軟體廠商部落格），主張不一致，例如是否有 PRD 這一層因組織而異 | 二手（搜尋摘要） | 搜尋結果列出多篇，未開啟，依規則不採用 | — | 未查證 |

## 六、活文件或一次性

| 做法 | 來源類型 | 出處與引句 | 適用條件 | 缺點 |
|------|---------|-----------|---------|------|
| 把需求當長期產物維護：新需求加進既有需求庫，並讓需求比開工前更完整 | 第一手（Wiegers，《Software Requirements》第三版第 21 章試讀頁） | https://ciscopress.com/content/images/9780735679665/samplepages/9780735679665.pdf（約第 397 頁）。「add those new requirements to an existing requirements repository」；「Try to leave the requirements in better shape than you found them.」 | 改版、維護專案；系統長期存在 | 同頁自承：更新太繁重會被放棄，過時需求對後續改版沒有用（「Obsolete requirements aren't helpful for future enhancements.」） |
| 把業務規則當「需要培育、保護與管理」的資產，並說明規則會變更 | 官方式宣言（Business Rules Group）；第一手（Ross） | https://brcommunity.com/brg/BRManifesto.pdf。「Rules need to be nurtured, protected, and managed.」；https://brcommunity.com/articles.php?id=b500「most business rules do change, sooner or later」 | 規則會跨專案長期存在 | 需要有人負責維護，Ross 自己主張要有專用工具（規則手冊系統） |
| 規則手冊管理：每條規則可回答「是否有舊版」「誰負責」「是否已退場」 | 第一手（Ross） | https://brcommunity.com/articles.php?id=b500。「Are there previous versions of a business rule?」；「Who is responsible for a business rule?」 | 規則達數百條以上 | 提出的是工具與紀錄需求，沒有說小團隊用文字檔怎麼做；原文推薦的是商用工具（Ross 是該領域工具與方法的銷售者，需注意利益關係） |
| 規則與軟體分別演進：規則獨立後可依自己的步調改變，不必等軟體發布週期 | 第一手（Ross，Modern Analyst 轉載） | https://modernanalyst.com/Resources/Articles/tabid/115/ID/1164/What-You-Need-to-Know-About-Business-Rules.aspx。「Rule Independence permits direct management of the business rules」 | 規則變動快於程式發布 | 前提是有實作規則外部化的系統（引擎）；本表只取其「文件與程式分別演進」的部分 |
| 願景與範圍文件有版本歷程，核准後以範圍擋變更 | 第一手（Wiegers 範本） | 同第二節 docx 範本，含「Revision History」與「Version 1.0 approved」標示 | 專案層級的範圍控制 | 範本偏專案核准一次的流程；本身沒說核准後如何持續維護 |
| BABOK：維護需求的目的是保持需求準確、現行，並促進重用 | 官方（IIBA，搜尋摘要） | 搜尋摘要轉述 BABOK v3 第 5.2「Maintain Requirements」；官方任務卡 PDF 被擋，只取得研讀站摘要，無逐字引句 | 要讓需求跨專案重用 | 引句未取得，可信度低 |
| 專案結束後需求散在已完成的票與留言內，是「需求慢慢死亡」的原因；建議把需求放在獨立協作平台持續更新 | 二手（廠商文章；作者是需求管理工具 Userdoc 創辦人） | https://modernanalyst.com/Resources/Articles/tabid/115/ID/6487/Dont-Let-Your-Software-Requirements-Die.aspx。「fragmented across completed Jira tasks and buried in comment threads」；「often zero documentation is worse than out of date documentation」 | 想說明票不是長期正本的理由 | 作者推銷自家工具，主張未經獨立驗證，可信度低 |
| 範圍型一次性文件：PRD 作為單一頁面，連到工作項目，用於特定問題集 | 官方（Atlassian） | https://atlassian.com/agile/product-management/requirements。「Keeping it simple.」（原文接著說 PRD 成為該問題集的入口頁） | 單一次要做的功能 | 頁面稱可隨時調整格式，沒有說做完後是否保留、是否合併回長期文件 |

## 對照 Miles 情境

不下結論，只列前提是否成立。

| 做法 | 前提 | 在 Miles 情境 |
|------|------|--------------|
| 四類分層（BABOK）、三層（Wiegers）、四份規格（ISO） | 有「商業目標與成果」與「解決方案需求」兩層可分 | 成立：知識庫有商業目標、痛點，規劃單與 Linear 票在解決方案層。三套分法都沒有 PRD 這一層，Miles 的規劃單對應哪一層，來源未載 |
| 願景與範圍文件含目標、成功指標、範圍、排除項 | 以專案為單位、核准一次 | 部分成立：知識庫有目標與痛點；但知識庫長期維護，而非每個專案核准一次；範圍與排除項在規劃單，不在知識庫 |
| RuleSpeak 句型 | 規則數量多、多人撰寫、要避免誤讀 | 成立：規則句要被開發與業務讀同一份；單人加代理撰寫時，一致性靠句型約束的效益，來源未載 |
| 規則獨立成庫、不寫進流程或用例（Manifesto） | 同一規則被多個流程使用、有人維護 | 成立：Miles 的規則放在知識庫，規劃單只引用；Manifesto 的「單一來源」與 Miles 的「同一內容只有一個家」一致 |
| 業務規則歸在軟體需求規格內（Wiegers 早期） | 只有一份需求文件 | 不成立：Miles 有獨立的知識庫 |
| 資料字典帶長度、可選值欄（Wiegers）；邊界值要寫出（Wiegers 的密碼範例） | 開發者不問人就要實作欄位 | 成立：開發最常問欄位防呆與資料不一致，正是這個情境；來源沒有說這些欄位屬於 BRD 還是功能層，票 06 的「實體卡欄位表要不要補防呆內容」需另行裁決 |
| 狀態與權限 | 來源的歸屬各異（ISO 的 SyRS、Volere 的非功能需求） | 來源沒有直接答案：Miles 的狀態轉換與角色分權放在知識庫，標準目錄把它們放在系統層，兩者相反 |
| 細度由「誰做決定」決定（Wiegers） | 可判斷開發者是否有領域經驗、是否外包、是否靠需求寫測試 | 部分成立：Miles 的開發者領域經驗、交付後的測試方式，本調研未涉及 |
| 活文件（Wiegers 試讀頁、Manifesto、Ross） | 有人持續維護；更新成本可控 | 成立：知識庫長期維護。Wiegers 的警告（更新太繁重會被放棄）是否在 Miles 的流程成立，來源未載 |
| 規格每次一份、做完不合併 | 見第六節的 Atlassian PRD | 來源未載「做完是否合併回長期文件」；Userdoc 文章的反面描述（需求散在已完成的票）與 Miles「Linear 票自包含、不當正本」的取捨相關，但該文是廠商文章，可信度低 |

## 未查證與存疑

1. ISO/IEC/IEEE 29148:2018 只讀到預覽 PDF（目錄、前言、範圍）。BRS、StRS、SyRS、SRS 各項目的內容寫法與「寫到多細」未查證，缺標準本文（付費）。
2. BABOK 指南本文未讀到。資料字典（第 10.12 節）、業務規則分析（第 10.9 節）、維護需求（第 5.2 節）只有搜尋摘要或目錄，缺 BABOK 原文（IIBA 任務卡 PDF 被擋）。
3. Volere 完整範本未讀（付費），只讀到摘錄頁；業務規則（5b）與資料字典（7b）下的內容寫法未查證。
4. Wiegers 的業務規則章節與規則目錄範例（原擬取自 katie.cs.mtech.edu 的 PDF，伺服器連不上）只讀到書的目錄，未讀章節本文。「業務規則不是軟體需求」的主張只見於搜尋摘要引述的閃卡網站，未取得書原文。
5. Wiegers 願景與範圍範本只讀到範本本文，沒有讀到他談「這份文件要不要在核准後持續維護」的說明；「版本 1.0 核准」是範本標頭的標示，不是他的維護主張。
6. 「狀態列舉」「權限」是否屬於 BRD：沒有找到明文來源，上述歸屬只能由目錄標題推論。
7. BRD 與 PRD 與功能規格的分界：BABOK、ISO 都沒有 PRD，Atlassian 頁是廠商定義。專業協會層級的明文分界未找到。
8. 多篇 BRD 與 PRD 比較文章（專案管理軟體廠商、內容站）依規則不採用，沒有讀。
9. BA Times「BRD vs FRD」被擋（HTTP 403），未讀。
10. Ross 是 RuleSpeak 與規則管理工具、書籍的作者與銷售者；其主張的「獨立規則庫要用專用工具」有利益關係，採用時要與無工具的做法分開評估。
11. Userdoc 創辦人文章是廠商文章，只作為「票不是長期正本」這種反面敘述的來源，可信度低。
12. 本調研沒有找到針對「小團隊、單人加代理」撰寫 BRD 的來源，各方法的前提都是多人團隊（依任務書規則，Miles 情境只用於對照一節）。

## 頁面夾帶的指示

無。
