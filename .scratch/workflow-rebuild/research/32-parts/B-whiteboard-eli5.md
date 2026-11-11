# B：eli5 加 Whiteboard 的評估與試做

日期：2026-11-12。本檔只記查到的事。標「原文」是有出處的句子；標「推論」是我依原文判斷，沒有原文直接說。

## 試做結果

- Artifact 網址（私有，未分享、未釘選）：https://claude.ai/artifact/Lz3hqX2Vd1KSivzrb2mA2P
- 標題：票 29 做了什麼（eli5 試做）
- 步驟：
  1. 讀 `eli5` 的 `SKILL.md` 與 `README.md`（資料夾只有這兩檔）。
  2. 用 `Artifact`（`action: "read"`、`type_url`）讀「Whiteboard」類型說明。
  3. 讀票 29 `## Answer` 段（`29-memory-reinit.md` 第 199 至 234 行）。
  4. 呼叫 Skill 工具 `eli5:eli5`。它只回傳一段任務句（見下），沒有自己產出內容。
  5. 手動做 eli5：只取 Answer 段的記憶卡數字與三項後續，寫成 17 個元素（區塊、箭頭、文字）。
  6. 用 `Artifact` 以 `type_url` 建空白白板（`icon: whiteboard`）。
  7. 用 `ArtifactData` 的 `batch` 一次寫入 1 份 `board/meta` 加 17 個元素。結果「committed atomically — 18 writes」。
  8. 沒有開瀏覽器看畫面。類型說明要求不做渲染檢查，所以我不知道實際版面有沒有重疊（未查證）。
- 試做花了 8 次工具呼叫：Bash 1（讀檔）、Artifact 讀類型 1、Read 2、Skill 1、Artifact 建立 1、ToolSearch 1（載入 `ArtifactData`）、`ArtifactData` 寫入 1。寫本檔另計。
- 遇到的限制：
  - Skill 只展開成一句任務句，「做什麼」全靠我自己。
  - 白板類型不接受 HTML，所以 `eli5` 說的 HTML 成品不能直接放進去，我只能重畫成區塊。
  - 沒有「claim」代號可用（工作階段沒有 `context`），依說明略過 claim 步驟。
  - `Artifact` 建立結果說本工作階段不訂閱此 Artifact（子代理工作階段的正常情況）。
  - 沒有錯誤訊息。

### eli5 產出的文字全文（白板上的全部字）

| 元素 | 文字 |
|---|---|
| 標題 | 記憶抽屜整理：112 張變 55 張 |
| 一句話 | 卡太多，就先封存舊的，只留還有用的。 |
| 黃底（原本） | 原本的記憶抽屜 / 共 112 張卡 |
| 橘底（備份） | 動手前先整個複製一份 / 備份 113 個檔 |
| 橘底（封存） | 封存 57 張 / 放進封存資料夾 |
| 綠底（留下） | 留下 55 張 / 還要用的卡 |
| 藍底（新規則） | 新規則寫進 AGENTS.md / 記憶只放 Miles 新給的做事指示，和外部資源的位置 |
| 白底 | 沒放進 wiki 的決策 / 另開兩張票接手 |
| 白底 | 14 條商業規則缺口 / 票 33 |
| 白底 | 48 列舊待辦 / 票 34 |
| 小字 | 事實出處：票 29 的 Answer 段，2026-11-12 完成。 |

註：顏色只用四種：黃（原本）、橘（備份與封存）、綠（留下）、藍（新規則）；票是白底無色。

自我檢查：數字都來自 Answer 段第 205 至 210 行的表（112、57、55、113 檔）與第 228、229 行（14 條、48 列、票 33、票 34）。「還要用的卡」是我對「留下」的白話改寫，Answer 段原文是 feedback 留下的 50 張「38 張待搬到規範檔，12 張與現行規則相反」，所以「還要用」不精確，這是我的措辭風險，不是來源事實。

## 結論表

| 問題 | 結論 | 出處 | 原文句 |
|---|---|---|---|
| eli5 的產出形式與載體 | 指定載體是 HTML Artifact，內容是大圖加少字。沒有指定其他格式，也沒有寫圖怎麼畫 | `eli5` 的 `skills/eli5/SKILL.md` 第 8 行 | Explain like I'm someone who knows nothing about this topic, using a HTML artifact with big pictures and few words. |
| eli5 的說明有多少內容 | 整個 skill 只有這一句加主題。步驟、格式、檢查都沒有。所以品質靠當次模型自己發揮 | 同檔第 6 至 10 行；`README.md` 第 9 行 | Produces a HTML artifact with big pictures and very few words that explains the topic to someone who knows nothing about it. |
| eli5 與 Whiteboard 相容嗎 | 不能直接放。Whiteboard 內容寫進它自己的資料庫，不收檔案與頁面。HTML 只能放在「嵌入元素」裡，限約 16000 字、無網路。要轉成區塊、箭頭、圖。轉換是重畫，不是貼上 | 類型說明「Writing to a board」與「The element format」段 | Its content lives in the board's own live store, written with the ArtifactData tool, never in files. |
| 嵌入 HTML 的限制 | 嵌入只適合「要能操作」的東西，只讀的說明應該用形狀與文字 | 類型說明「A good board」段 | a wireframe, like anything only read, is shapes and text. |
| 放進 Whiteboard 要做什麼轉換 | 推論：把 eli5 的結論拆成短標籤的區塊，用箭頭接成流程，圖要用 SVG。類型說明另外規定「軟體運作沒有東西可看，就不畫圖」，與 eli5 的「大圖」衝突，所以我的試做沒有畫圖 | 類型說明「A good board」段 | What has nothing to see gets no pictures unless the person asks to draw or illustrate it: a list, a schedule, a brainstorm, a comparison of ideas, the workings of software, a network or an organisation. |
| 內容怎麼寫入 | 用 `ArtifactData` 工具寫白板自己的資料庫：先 `board/meta`，再 `elements/<id>`，一次最多 50 筆、1 MB | 類型說明「Writing to a board」段 | Fill a new board with `batch` through `ArtifactData` (`url` = the board's; load the tool with ToolSearch if needed, or use an Artifact tool's `read_db`/`write_db` with `db_op`): `board/meta` first, then the elements back to front, 50 writes and 1 MB a call (larger: more calls), no script. |
| 怎麼更新 | 先讀、只改有變的欄位，不整張重建 | 同段 | Never rebuild a board, because people may be working on it as you write and a rewrite would lose what they did. |
| Claude 能依檔案內容重畫嗎 | 能寫，但沒有「從檔案同步」的功能。推論：要自己讀 Markdown、對照白板元素、只送差異。元素編號限 `e1`、`e2` 這種數字編號，不能用票號當編號，所以票號與元素的對照要另存（白板不存） | 類型說明「The element format」段 | New ids are `e1`, `e2`, …, above the board's highest `e` number (`e10` above `e9`), after any prefix you were given: never words. |
| 重畫會蓋掉手動移動嗎 | 不會，只要只送變動欄位。但類型說明自己承認：重新排版可能動到人手放的位置，所以只在被要求時才大改 | 類型說明「Writing to a board」段 | update a changed element with just its changed fields, keeping ids, `by`, `state` and `groups` (ids of people's groups: move a group together unless asked to part it) |
| 同上，重排的風險 | 原文說人手放的位置帶有看不見的想法，不確定就不動 | 同段 | because hand-placed things carry thinking you can't see. |
| 看的人能改內容嗎 | 能。類型說明以「人們一起重新排列、有即時游標」為前提，並提到看的人正在輸入文字（`editing`）、移動（`moving`）。能改文字到什麼程度，沒有明說，但說明裡的「他們的字與顏色歸他們」暗示可改 | 類型描述；類型說明「Writing to a board」段 | Whiteboards: shared infinite canvases that show ideas as blocks, arrows, sections and marker sketches, which people rearrange together, with live cursors. |
| 同上，改的字會被保護嗎 | 推論可改；改後 Claude 重畫時，說明要求保留 | 類型說明「A good board」段 | their words and colours stay theirs unless the ask concerns them. |
| 改動存在哪裡 | 存在白板自己的資料庫（集合 `elements`、文件 `board/meta`），不是 repo。類型宣告的能力含 `db`、`room`、`comments` | 類型說明開頭 Capabilities 行；「Writing to a board」段 | Capabilities an Artifact made from it uses: artifact, assets, comments, db, dictation, downloads, room, sample, tts, user. |
| 會不會與 repo 的票不一致 | 會。白板上的改動不會寫回 Markdown，我沒查到任何回寫機制。推論：只要有人在白板上改字或移動箭頭，白板就成了第二份可能不同的版本，要靠 Claude 下次比對 | 同上（類型說明全文沒有「寫回檔案」的描述） | 未查證：全文找不到同步回檔案的說明 |
| 畫多張票加阻擋箭頭，元素夠嗎 | 有原文支援：區塊（12 種形狀）、箭頭（可標籤、可虛線）、分區、表格。票的狀態可用顏色表示。推論：夠表達「票、狀態、阻擋關係」，但顏色上限四種，狀態種類多就不夠 | 類型說明「The element format」與「A good board」段 | Never more than four marks on a board unless asked: with five kinds or more, plain under titles. |
| 阻擋箭頭的畫法 | 箭頭用 `from`、`to` 接兩個元素，支援方向與虛線 | 類型說明「The element format」段 | joins e1 to e2 in right-angle legs, or one straight line when facing sides are under 44 apart |
| 30 多張票版面要自己排還是自動排 | 要自己排。說明要求自己算座標、留間距，箭頭路徑也不會自動避開方塊，要自己給轉折點。我沒有查到自動排版功能（未查證；只讀了類型說明，未讀 `app.js`） | 類型說明「An arrow's route」段與「A good board」段 | The route the page picks for an arrow won't steer around anything, so where it would cross a block or run along another arrow, give it `bends`, worked out as you write it. |
| 尺寸與數量上限 | 新白板約 1500 乘 750；元素最多 800 個；一排超過 6 步要換行。推論：30 多張票加箭頭可放進元素上限，但 1500 乘 750 放不下，要擴大；說明允許「必要時往下或往右延伸」 | 類型說明「A good board」段與「The element format」段 | Keep a new board within about 1,500 × 750. |
| 元素上限 | 800 個元素，總共 2 MB | 同上 | At most 800 elements, 200 KB each, 2 MB in all. |
| 試做花幾次工具呼叫、遇到什麼 | 8 次，無錯誤；限制見上節 | 本次工具記錄 | 無原文（我自己的記錄） |

## 限制與沒查到的事

- Skill 工具對 `eli5:eli5` 只回傳任務句，沒有可執行的步驟。「用 eli5 處理」實際上等於「請模型自己寫一份大圖少字的說明」。
- 沒有開瀏覽器看白板畫面，也沒有用 `read` 讀回，所以版面有沒有重疊、箭頭有沒有穿過方塊，未查證。類型說明要求不做渲染檢查。
- 沒有讀類型的 `artifact-type/reference/pictures.md`、`ideas.md`、`app.js`，所以「是否有自動排版」「看的人能編輯文字到什麼程度」「分享後的權限分級」只依 `SKILL.md` 判斷。
- 沒有試做票地圖（多張票加阻擋箭頭），這一題只用說明判斷，結論都標了推論。
- 白板的「分享」「釘選」我沒動，Artifact 維持私有。
- 白板資料庫一份文件的更新需要 `if_version`；這代表有人在白板上改過時，Claude 的寫入會被擋，需重讀。這是 `ArtifactData` 工具說明，不是白板類型說明。
- 類型說明或 skill 檔裡沒有要我做與本任務無關事項的文字。
