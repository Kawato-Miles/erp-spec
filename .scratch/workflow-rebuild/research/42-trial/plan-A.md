# 票 42 實測 A：照 interface-design 方法整理轉交單管理的需求描述

- 受測方法：interface-design（`/tmp/workflow-rebuild-ticket42-src-20261113/src/Dammyjay93_interface-design/`）
- 商業內容依據：wiki 卡 [[轉交單]]、[[轉交單狀態]]、[[場內轉交與修正]]、[[場內外流轉活動清單]]、[[生產單據檢視活動清單]]、[[廠務]]、[[生管]]、[[生產任務]]
- 下游輸入格式：erp `.claude/skills/prototype-from-prompt/SKILL.md` 第 1 步
- 方法的中間產出：`plan-A-files/design-brief.md`（意圖、領域探索、焦點、檢查點）、`plan-A-files/system.md`（設計系統檔）
- 未讀 erp 既有轉交單畫面目錄

---

## 一、需求描述正文（可整段貼給 prototype-from-prompt）

<!-- 正文開始 -->

### 需求：轉交單管理（清單、明細、建立、作廢）

**角色先說明**：需求原文寫「廠務建立與作廢轉交單」。wiki 規定建立與作廢由生管執行，印務與印務主管可代行；廠務只看自己負責的單，搬運回報走 Slack 表單。本描述依 wiki 寫，待 PM 確認（見未定事項第 1 項）。

#### 1. 頁型

| 畫面 | 頁型 | 參照配方 |
|------|------|---------|
| 轉交單清單 | 資源列表頁（篩選加列表），不放「新增」 | `docs/recipes/resource-page.recipe.md` |
| 轉交單明細 | 獨立詳情頁，從清單點一列進入 | `docs/recipes/detail-page.recipe.md` |
| 待轉交任務清單 | 資源列表頁，可批次勾選；這是建立轉交單的入口 | `docs/recipes/resource-page.recipe.md` |
| 建立轉交單 | 在待轉交任務清單勾選後開啟的表單 | 由製作者依元件目錄決定 |
| 作廢轉交單 | 明細頁上的操作，填原因後確認 | 由製作者依元件目錄決定 |

辦公角色只支援桌機瀏覽器，不做手機寬度。

#### 2. 角色、可見範圍與操作

| 角色 | 看得到哪些轉交單 | 本次範圍內可做的操作 |
|------|----------------|-------------------|
| 生管 | 來源生產任務的產線在所屬產線內的單，以及目的產線在所屬產線內的單 | 建立轉交單、作廢轉交單 |
| 印務、印務主管（代行生管） | 同生管 | 建立轉交單、作廢轉交單 |
| 廠務 | 負責廠務是自己的單 | 只能檢視轉交單 |

- 角色不能做的操作，按鈕直接隱藏。
- 轉交單狀態不在可作廢的狀態時，作廢按鈕直接隱藏。
- 角色切換沿用 Prototype 既有的模擬角色機制。

#### 3. 轉交單清單

使用者第一眼要看到：每張單停在哪個狀態、建單後擱了多久。

| 項目 | 內容 |
|------|------|
| 列單位 | 一張轉交單 |
| 欄位 | 轉交單編號、狀態、目的產線、所屬印件（可多筆）、負責廠務、預計轉交日、實際轉交日、建單人、建單時間 |
| 狀態值 | 待搬運、搬運中、已送達、已點收、已作廢 |
| 篩選 | 依狀態篩選；一個搜尋框搜轉交單編號與所屬印件 |
| 預設 | 只列「在途」的單（待搬運、搬運中、已送達），依建單時間由舊到新排，擱最久的在上（假設，待 PM 確認） |
| 點擊 | 點一列進轉交單明細 |
| 空狀態 | 沒有任何轉交單時顯示「目前沒有轉交單」；篩選後沒有結果時顯示「沒有符合條件的轉交單」 |

#### 4. 轉交單明細

使用者第一眼要看到：每條明細的搬運數量與點收量，對不上時差額看得見。

| 區段 | 欄位 |
|------|------|
| 基本資料 | 轉交單編號、狀態、目的產線、所屬印件、負責廠務、預計轉交日、實際轉交日、備註、建單人、建單時間 |
| 作廢資訊（只在已作廢時顯示） | 作廢時間、作廢人、作廢原因 |
| 轉交明細（每條一列） | 生產任務、急件標注、目的站點、搬運數量、點收量、簽收照片 |
| 點收紀錄（每條明細底下可有多筆） | 點收數量、備註、點收人、點收時間；已作廢的那筆仍顯示作廢人、作廢時間、作廢原因，且不計入點收量 |
| 點收修正紀錄（每筆點收紀錄底下可有多筆） | 修正欄位、修正前、修正後、修正人、修正時間、修正原因 |
| 搬運數量修正紀錄（每條明細底下可有多筆） | 修正前、修正後、修正人、修正時間、修正原因 |
| 歷程紀錄 | 每行記時間、操作人、發生什麼、關聯單據連結 |

- 點收量＝這條明細未作廢點收紀錄的點收數量合計，可大於搬運數量，系統不擋。
- 來源生產任務已轉「報廢」或「已作廢」、單還沒點收時，明細頁顯示警示。
- 操作：作廢轉交單（見第 6 節）。

#### 5. 建立轉交單

入口：待轉交任務清單。清單列出生產任務轉交狀態為「待轉交」的生產任務，各廠商類別都列。每列至少顯示生產任務、目的站點、轉交可申請上限。

| 步驟 | 使用者做什麼 | 系統做什麼 |
|------|------------|-----------|
| 1 | 勾選一筆或多筆生產任務，按「建立轉交單」 | 開啟建單表單 |
| 2 | 逐筆填搬運數量 | 每筆帶出目的站點（唯讀）與轉交可申請上限 |
| 3 | 系統依目的產線分組後，逐張填負責廠務、預計轉交日，備註選填 | 同一條目的產線的勾選併成一張單的多條明細；不同目的產線各成一張單。負責廠務的候選限具廠務角色的人員 |
| 4 | 按送出 | 以送出當下的最新額度檢核每一筆 |
| 5 | — | 全部通過：每張單進「待搬運」，產生轉交單編號（格式 TT-YYYYMMDD-NNN），寫入建單人與建單時間，通知該單的負責廠務；來源任務的轉交可申請上限扣掉這次的搬運數量 |

錯誤與擋下：

| 情況 | 處理 |
|------|------|
| 任一筆搬運數量超過轉交可申請上限 | 整批擋下，一張單都不建立，標出超額的那幾筆；使用者改完重送 |
| 搬運數量空白、0 或負數 | 擋下，提示搬運數量要大於 0 |
| 負責廠務或預計轉交日沒填 | 擋下，提示必填 |

#### 6. 作廢轉交單

| 項目 | 內容 |
|------|------|
| 誰可做 | 生管；印務、印務主管代行 |
| 何時可做 | 狀態為待搬運、搬運中、已送達；已點收與已作廢的單不顯示作廢按鈕 |
| 使用者做什麼 | 按「作廢轉交單」，填作廢原因（文字、必填、原因不限），確認 |
| 系統做什麼 | 狀態轉「已作廢」；寫入作廢時間、作廢人、作廢原因；歷程記一筆；各明細的搬運數量退回來源任務，來源任務的轉交可申請上限當下回升 |
| 擋下 | 作廢原因空白時擋下；送出前這張單已被點收時擋下，提示這張單已點收、不能作廢 |
| 作廢後 | 單留著可查，不刪除 |

#### 7. 本次不做

編輯轉交單、開始搬運、抵達站點、點收、修正點收、作廢點收紀錄、重開轉交單。明細頁仍要顯示這些操作留下的資料（mock 預先填好）。

#### 8. mock 資料

- 先照 `(prototype)/MOCK-DATA-CHAIN.md` 補 mock，再改模組的 mock 檔。
- 編號用業務格式（轉交單 TT-20260904-001），人名、產線、站點、印件用貼近真實的值。
- 要涵蓋的情況：五種狀態各至少一張；一張單含兩張印件的貨；一條明細搬運 500、點收 480 的短少；一筆已作廢的點收紀錄；一筆點收修正；一筆搬運數量修正；一張已作廢的單附原因；一張來源任務已報廢、還沒點收的在途單；一條急件明細。
- 建單與作廢要連動待轉交任務清單的轉交可申請上限。

#### 9. 視覺

不指定。照 `Designs.md` 與配方。狀態標籤的顏色對照尚未定案，先用慣例並加待確認註解。

#### 10. 本描述的假設

- 清單預設只列在途、建單時間由舊到新。
- 一次勾多筆產生多張單時，負責廠務與預計轉交日逐張填。
- 「通知負責廠務」在 Prototype 只以成功提示訊息表示。

<!-- 正文結束 -->

---

## 二、過程紀錄

| 步驟 | 來源檔與原文句 | 產出 |
|------|--------------|------|
| 1. 範圍判定 | SKILL.md § Scope："Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces." | 判定 ERP 後台的轉交單管理屬適用範圍 |
| 2. 檢查既有專案 | SKILL.md § Execution discipline 第 1 點："Inspect the existing app, design tokens, component patterns, and `.interface-design/system.md` if present." | 讀 erp `Designs.md`、兩份配方、prototype-from-prompt；erp 沒有 `.interface-design/system.md`。依任務限制未讀既有轉交單畫面 |
| 3. 意圖先行 | SKILL.md § Intent First："Before touching code, answer these."；三問："Who is this human?"、"What must they accomplish?"、"What should this feel like?" | `plan-A-files/design-brief.md` 第一節：使用者、要做的動詞、感覺 |
| 4. 角色衝突先假設再進行 | SKILL.md § Intent First："If context allows a responsible assumption, state it briefly and proceed." | 需求原文的廠務與 wiki 的生管不符；正文依 wiki，並列為未定事項第 1 項 |
| 5. 產品領域探索 | SKILL.md § Product Domain Exploration："Produce all four before proposing any direction:" | design-brief 第二節：領域概念 7 項、色彩世界 6 項、特徵 1 項、要避開的預設 3 項 |
| 6. 拿掉產品名檢驗 | SKILL.md § Product Domain Exploration："Read your proposal with the product name removed." | 檢驗通過，紀錄於 design-brief 第二節 |
| 7. 呈現樣本 | SKILL.md § Render It When You Can："Never assume the tool exists; check, then use it." | 工作階段有畫面呈現工具，但未執行：子代理的呈現 PM 看不到，且樣本內容（配色、字體）在 erp 不由本需求決定 |
| 8. 每個畫面一個焦點 | SKILL.md § One focal point per view："Before building, name the focal element out loud." | design-brief 第三節；轉成正文第 3、4 節的「第一眼要看到」與清單預設 |
| 9. 字級比例、密度、配色、字體 | SKILL.md："Pick a ratio and step it"、"Decide the density up front and name the values"、"Your palette should feel like it came FROM somewhere, not applied TO something."、"Reaching for your usual font means you're not designing." | 未轉成需求；與 erp 規範不相容，記入不相容紀錄第 2 至 5 項 |
| 10. 每個元件前的檢查點 | SKILL.md § Before Writing Each Component："This checkpoint is mandatory." | design-brief 第五節：七項全部填 erp 既定值，為什麼欄註明出處 |
| 11. 沿用既有元件 | SKILL.md § Use What Exists："Before you build a control or style an element, look at what the project already gives you." | 與 erp §6.5 鐵則一致；正文不指定元件，交製作者照元件目錄選 |
| 12. 狀態不可省 | SKILL.md § Static polish："Data needs loading, empty, error." | 正文第 3 節空狀態、第 5 節與第 6 節的錯誤與擋下表 |
| 13. 建議與提問 | SKILL.md § Suggest + Ask："Does that direction feel right?" | design-brief 第四節寫出區塊；未提問：子代理受測無法問 PM，且 erp 的 PM 不決定視覺方向（不相容紀錄第 8 項） |
| 14. 建置流程停止點 | SKILL.md § Build flow："confirm when the direction is ambiguous or costly to change" | 停在建置之前；建置與「Patch the implementation, then run the relevant build/typecheck/tests when available.」屬 prototype-from-prompt 的工作 |
| 15. 視覺參考圖 | SKILL.md § Execution discipline 第 3 點："if an image-generation tool is available" | 略過：工作階段沒有產圖工具 |
| 16. 交付前檢查 | SKILL.md § The checks："Run these against your output; if any fails, iterate before presenting." | design-brief 第六節：換掉檢驗與變數檢驗依方法判定不通過，原因是 erp 規範；瞇眼檢驗無畫面可做；特徵檢驗列出五處 |
| 17. 存設計系統檔 | SKILL.md § After Completing a Task："Want me to save these patterns for future sessions?"；範本 reference/system-template.md："Scale: 12, 13, 14 (base), 16, 18, 24, 32"；範例 reference/examples/system-precision.md："Example system for dashboard/admin interfaces" | `plan-A-files/system.md`，照範本段落，數值全部轉錄 erp `Designs.md`；字級列換成 erp 字級 |
| 18. 設計審查與去除生成痕跡 | design-review.md："Report findings and a verdict; only rebuild when the user asks."；design-deslop.md："Stay in the diff" | 讀完未執行：兩者都要有已建好的畫面或差異；可在 Prototype 做完後作為驗收用 |
| 19. 安裝指示 | README.md："npx skills add https://github.com/dammyjay93/interface-design --skill interface-design --agent claude-code -g" | 略過：與本任務無關，未安裝、未連線 |

---

## 三、不相容紀錄

| # | interface-design 原文句與位置 | erp 原文句與位置 | 怎麼處理 |
|---|----------------------------|----------------|---------|
| 1 | SKILL.md § The Problem："If another AI, given a similar prompt, would produce substantially the same output, you have failed." | prototype-from-prompt SKILL.md § Overview："套既有「整頁配方 + 真元件目錄」,不自由發揮、不自創 UI。"；同段："產出長相 100% 等於正式環境、結構與正式頁一致" | 以 erp 為準：不追求與其他畫面不同，要求與正式頁一致 |
| 2 | SKILL.md § Color Lives Somewhere："Your palette should feel like it came FROM somewhere, not applied TO something." | Designs.md §8："介面以白 + 中性灰 + 單一藍主色" | 以 erp 為準：色彩世界只用來理解情境，不轉成配色 |
| 3 | SKILL.md § Where Defaults Hide："Reaching for your usual font means you're not designing." | Designs.md §4 字族："'Noto Sans TC', -apple-system, BlinkMacSystemFont" | 以 erp 為準：不選字體 |
| 4 | SKILL.md § Type scale："Pick a ratio and step it" | Designs.md §4："需要排版時直接套 mixin，不要自訂 font-size。" | 以 erp 為準：字級照 erp 字級表 |
| 5 | SKILL.md § Density："Decide the density up front and name the values" | Designs.md §5 spacing："xs 8 · sm 12 · md 16 · lg 24 · xl 32 · xxl 48 (px)" | 以 erp 為準：密度與間距不由本需求決定 |
| 6 | SKILL.md § Where Defaults Hide："`--ink` and `--parchment` evoke a world; `--gray-700` and `--surface-2` evoke a template."；§ The checks："read your CSS variables aloud: do they belong to this product's world, or any project?" | Designs.md §3："引用時請用 token 路徑而非 hex"；§2："改色 / 改字體一律回 Figma 改 token 再跑 transform。" | 以 erp 為準：不命名變數，變數由 Figma 產出 |
| 7 | SKILL.md § Distribution and restraint："Reach for whitespace and tonal shift before borders and dividers." | Designs.md §6.2 TableBlock："表格外框：白底 + `neutral[200]` 1px 邊 + 圓角 12 + padding 12 + 橫向捲動" | 以 erp 為準：表格沿用外框 |
| 8 | SKILL.md § Suggest + Ask："Does that direction feel right?" | prototype-from-prompt SKILL.md 第 1 步："PM 決定頁型與行為,Agent 決定元件與拼法" | 以 erp 為準：不向 PM 問視覺方向，只給頁型與行為 |
| 9 | SKILL.md § The checks："swap your typeface for the usual one, your layout for a standard template: would anything feel different?" | prototype-from-prompt SKILL.md 第 3 步："把 recipe 骨架套上這個需求的欄位 / 操作 / 狀態。" | 以 erp 為準：套標準配方是要求，不是缺陷 |
| 10 | SKILL.md § After Completing a Task："Want me to save these patterns for future sessions?"（存到專案的 `.interface-design/system.md`） | Designs.md 開頭："任何新需求都應**延伸**本文件描述的既有風格，而不是另立一套。" | 只存在 `plan-A-files/system.md`，內容轉錄 Designs.md，不寫進 erp |

---

## 四、方法沒涵蓋、自己補判斷的地方

| # | 判斷 | 方法有沒有給依據 |
|---|------|----------------|
| 1 | 轉交單清單用資源列表頁配方 | 沒有。方法不給頁型選擇規則；依據是 erp 配方 |
| 2 | 明細用獨立詳情頁，不用抽屜 | 沒有。依據是 erp 詳情頁配方 |
| 3 | 建立入口放在待轉交任務清單，轉交單清單不放「新增」 | 部分。方法的「列出要避開的預設」步驟讓我把空白新增表單列為預設；結論來自 wiki「單據在待轉交任務建立」 |
| 4 | 作廢操作放在明細頁，不放在清單列 | 沒有 |
| 5 | 不可操作時直接隱藏按鈕 | 沒有。方法反而要求按鈕有停用狀態；依據是 Sens 規範陷阱表 |
| 6 | 清單預設只列在途 | 有。意圖步驟：使用者要做的動詞決定什麼先出現、什麼隱藏 |
| 7 | 清單預設依建單時間由舊到新 | 部分。同第 6 項的意圖；排序方向本身是我選的 |
| 8 | 每個畫面第一眼要看到的資訊 | 有。每個畫面一個焦點 |
| 9 | 清單欄位取哪幾個單頭欄位 | 部分。焦點決定優先序；欄位集合取自 wiki 單頭 |
| 10 | 列出空狀態與錯誤擋下的情況 | 有。狀態不可省 |
| 11 | 一次產生多張單時，負責廠務與預計轉交日逐張填 | 沒有 |
| 12 | 作廢的系統效果寫出額度回升 | 沒有。依據是 wiki 轉換條件 |
| 13 | 來源任務報廢的警示放在明細頁 | 沒有。警示本身來自 wiki，位置是我選的 |
| 14 | 角色衝突時正文依 wiki 並列未定 | 有。方法允許先陳述合理假設再進行 |
| 15 | 點收紀錄、修正紀錄、歷程都放在明細頁 | 沒有 |
| 16 | mock 要涵蓋的情況清單 | 沒有。依據是 erp skill 的 mock 貼近後端資料結構、Sens 的 mock 正本規則 |

---

## 五、未定事項（wiki 沒寫或與需求不符，要 PM 決定）

| # | 事項 | 來源 |
|---|------|------|
| 1 | 需求原文寫廠務建立、作廢轉交單；wiki 寫生管建立與作廢（印務、印務主管代行），廠務只看自己負責的單，搬運回報走 Slack。Sens 規範也把廠務列為 Slack 回報通道，不是辦公桌機角色。以哪邊為準 | 需求原文；[[廠務]] 分工理由；[[場內外流轉活動清單]] ACT-FLW-001、ACT-FLW-011、ACT-FLW-015；[[生產單據檢視活動清單]] ACT-VPRD-064 |
| 2 | 一次勾多筆產生多張單時，負責廠務與預計轉交日要逐張填，還是共用一組 | [[轉交單]] 只定義每張單各有一個值 |
| 3 | 待轉交任務清單要顯示哪些欄位 | [[生產任務]] 具名清單只定義進入條件 |
| 4 | 清單要不要顯示急件；急件標注在明細層，單層怎麼判 | [[轉交單]] 急件標注欄 |
| 5 | 狀態標籤的顏色對照 | 業務狀態對顏色的對照表在 Sens 尚未定案 |
| 6 | 「通知負責廠務」在 Prototype 要不要呈現、怎麼呈現 | [[轉交單狀態]] 留痕與通知 |
| 7 | 作廢確認與擋下的提示文字 | wiki 只定擋下條件，不定文字 |
| 8 | 明細頁要不要一併放本次範圍外的操作（編輯、點收、重開） | 需求原文只列四項 |
| 9 | erp 已有轉交單畫面目錄。這次要新建還是修改既有頁；修改時 prototype-from-prompt 會沿用既有結構，正文的頁型可能不適用 | prototype-from-prompt「修改既有 prototype 時的差異」 |
| 10 | Supervisor（全公司只看）、師傅與品檢人員（點收端）要不要放進角色切換 | [[生產單據檢視活動清單]] ACT-VPRD-059、ACT-VPRD-065 |
