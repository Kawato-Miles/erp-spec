# 42：做 Prototype 時把關畫面組合的 UX skill

Type: research
Status: closed
Blocked by: —

## Question

代理用 erp 的 `prototype-from-prompt` 做畫面時，常見的問題不是缺元件，是元件的組合方式錯。
有哪些既有的 skill 能把關後台管理介面（Dashboard）的畫面組合？

- Miles 點名的兩個：`https://github.com/pbakaus/impeccable`、`https://github.com/ibelick/ui-skills`。
- 其他熱門的同類 skill。
- 每一個的內容是什麼、技術前提是什麼（erp 用 Next.js、Ant Design 5.22、styled-components）、有沒有談頁面層級的組合（列表頁、詳情頁、表單、資料表）。
- 哪些可以直接用，哪些與 erp 的元件庫或既有規範衝突。

## 緣由

Miles 2026-11-13：「我認為需要 Dashboard UX 的 Skill 納入考量，這樣用 erp skill 時，才能組合出正確的畫面，很多時候不是缺少元件，是元件的組合方式錯。」

## 限制

- erp 程式庫與 erp 的 skill 不動。新 skill 只能加在 Sens 這一側，在 erp skill 之前（選版型）與之後（檢查畫面）使用。
- 調研階段不安裝、不執行來源裡的任何檔案。

## 完成的樣子

- `research/42-dashboard-ux-skills.md`：每個 skill 附網址、檔案清單、原文句、技術前提、熱門程度、授權。
- 主對話讀完要採用的 skill 檔全文，再向 Miles 說明採用哪些、用在流程的哪一步。結論交票 09 與票 11。

## Answer

全文：[research/42-dashboard-ux-skills.md](../research/42-dashboard-ux-skills.md)。主對話於 2026-11-13 查證，查證範圍見該檔檔頭。

### erp 既有規範管到哪裡

主對話讀完 erp 的 `prototype-from-prompt` skill、`docs/recipes/` 兩份整頁配方、`Designs.md` 第 6 至 8 節。

| 項目 | erp 現況 |
|------|---------|
| 用哪顆元件、顏色、間距 | 有。元件目錄加「禁止自創介面」的規則 |
| 資源列表頁（篩選、表格、新增與編輯抽屜） | 有配方 |
| 詳情頁（分段加唯讀欄位，操作鈕在段標題右側） | 有配方，只有單一版型 |
| 表單頁、分頁式詳情、母子雙層、步驟流程 | 沒有配方。skill 寫「不要即興組版」，但這些頁型沒有可套的骨架 |
| 版型怎麼選（資訊多到什麼程度要分頁、詳情用展開、抽屜或獨立頁） | 沒有 |
| 操作鈕放哪、一區幾個主按鈕、回饋用訊息或對話框、空白與錯誤狀態 | 沒有 |
| 做完後檢查畫面 | 只有對照 Figma 設計稿的 `design-qa`；Prototype 沒有設計稿，用不上 |

Miles 說的「元件的組合方式錯」，對應到後四列。

### 採用的來源與用在哪一步

兩個來源都不安裝。做法是把規則摘成 Sens 這一側的兩份檔，由票 11 落實。

| 步驟 | 來源 | 取用的內容 |
|------|------|-----------|
| 叫用 erp skill 之前：選版型 | Ant Design 官方設計規範頁（`docs/spec/` 的 `detail-page`、`research-list`、`data-list`、`research-form`、`data-entry`、`buttons`、`feedback`；主對話讀完這七頁的文字全文） | 詳情頁依資訊複雜度與關聯度選基本版、分頁版、步驟版；列表依用途選表格、清單、卡片；開啟詳情的四種方式與各自的條件；表單的四級分組與可編輯清單的筆數門檻；一組至多一個主按鈕與按鈕放頁尾的條件；回饋方式的選擇 |
| erp skill 做完之後：檢查畫面 | `office-web-ui-system`（主對話讀完 `SKILL.md` 與 `page-type-playbook`、`component-recipes`、`framework-adaptation`、`navigation-and-panels` 四份參考檔） | 四種頁型的主要操作位置與反模式清單；篩選與列操作不混放；每個表格與非同步區塊都要有空白、載入、錯誤狀態；檢查要看實際渲染的頁面 |

- 選 Ant Design 官方規範的理由：erp 的元件庫就是 Ant Design，規範講的是版型判斷，不涉及元件的程式介面，版本差異不影響。
- `office-web-ui-system` 只取結構規則。不取它的視覺風格（玻璃質感、藥丸頂欄），不加它的語意類別，不執行它的掃描腳本。`visual-language.md`、`locator-class-contract.md` 與掃描腳本主對話沒讀，不取用。
- 選版型的結果寫進交給 erp skill 的需求描述。erp skill 的第 1 步本來就由 PM 決定頁型，這一步等於替 Miles 先備好選項。

### 不採用的來源

| 來源 | 理由 | 查證程度 |
|------|------|---------|
| Impeccable | 沒有列表、詳情、表單的版型規則；啟動腳本會下載執行檔 | 下載行為已比對腳本原文；其餘只讀初稿 |
| ui-skills | `baseline-ui` 硬性要求 Tailwind，與 erp 的 styled-components 衝突；其餘 skill 不談頁面組合 | Tailwind 要求已比對原文 |
| ui-craft | 有儀表板與表單規則，但與 erp 既有元件有衝突句（工具列禁用實心主按鈕）；安裝方式是從網址下載腳本直接執行 | 這兩點已比對原文；全檔 30 萬字元未讀完 |
| frontend-design、interface-design | 沒有後台頁面的版型規則 | 只讀初稿 |
| ui-ux-pro-max、taste-skill、open-design | 初稿沒讀內容 | 未查證 |

### 更正初稿的說法

- 初稿寫「Ant Design 官方給代理的資源以第 6 版為目標，第 5 版專用檔未查到」。原文不完整：官方命令列工具的 skill 寫明內建第 4、5、6 版的資料，可以指定版本查詢（原文：`antd info Select --version 5.12.0`）。這個工具管「元件屬性有沒有用對」，不管畫面組合，本票不採用；要不要裝交票 11 判斷。
- 初稿寫 Impeccable 的即時模式會繞過權限檢查。主對話比對不到這句原文，標為未查證。
- 初稿寫 ui-craft「禁用徽章」「資料表要求自建」。主對話用關鍵字沒查到，標為未查證。

### 交接

- 票 09：流程在「叫用 erp skill 之前」加選版型，在「做完之後、Miles 點畫面之前」加畫面檢查。
- 票 11：寫兩份檔，版型選擇表與畫面檢查清單。內容只收 erp 元件目錄做得出的版型；選到 erp 沒有共用元件的版型時，照 erp skill 的「元件先行」規則停下並通知前端。Ant Design 規範頁的版型示意圖是圖片，本次沒讀到；寫選擇表時要補看圖。
- Ant Design 程式庫的授權與各來源的星數，主對話沒有重新查證，沿用初稿的數字時要標明。

