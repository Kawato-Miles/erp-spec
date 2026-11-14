# 票 42 第二回實測：兩份規劃的比對（判定與證據）

判定者只核對事實，不判斷哪個方案較好。甲＝`plan-A.md`（interface-design，附檔 `plan-A-files/`），乙＝`plan-B.md`（版型選擇規則，Ant Design 官方設計規範頁）。行號指各檔原始行號。程式行號以 `git show <提交碼>:<路徑>` 輸出為準，路徑前綴 `apps/erp/src/app/(prototype)/consultations/` 省略。甲畫面＝`ticket42-a2` 的 `a09f2aec`，乙畫面＝`ticket42-r2-b` 的 `8af55053`。erp 規範一律取兩邊共同基底 `6e75fa07` 的版本（兩工作樹該版 SKILL.md 經 `diff` 相同）。

## 一、摘要

| 項目 | 甲 | 乙 |
|------|----|----|
| erp skill 第 1 步輸入（共 9 項） | 給了 7、部分 1、沒給 1 | 給了 8、部分 1、沒給 0 |
| 版型決定總數 | 28 | 42 |
| 依據含方法本身（單獨＋混合） | 7（單獨 4、混合 3） | 25（單獨 22、混合 3） |
| 規劃附方法原文句 | 0 句（只寫步驟名） | 34 句，33 句逐字存在，1 句原文帶粗體記號 |
| 正文照做會違反 erp 規範的句子 | 0 | 0 |
| 規劃自記與 erp 不相容／衝突 | 15 項 | 2 項（另 3 項為方法門檻不合，見 3.4） |
| 與 wiki 不符：有標註 | 3 | 3 |
| 與 wiki 不符：沒標註 | 0 | 1 |
| wiki 沒寫而自己假設：有標註／沒標註 | 11／2 | 10／1 |
| 規劃決定在畫面上沒照做 | 0 | 0 |
| 畫面做了規劃沒寫的 | 7 | 6 |
| 操作名稱與實體卡不一致的操作數 | 4（認領、代派、改派、撰寫筆記） | 0 |

## 二、第 1 項：erp skill 第 1 步要的輸入

來源：`.claude/skills/prototype-from-prompt/SKILL.md`（基底 `6e75fa07`）。決策層次表 L37（頁型）、L38（欄位、操作、狀態、批次勾選、行內編輯、角色權限差異），L41 商業規則漏洞（例：二次確認、狀態有哪幾種），L43 狀態顏色例外（可先標待辦）。項目切法沿用第一回比對。

| # | 項目（SKILL.md 位置） | 甲 | 乙 |
|---|---------------------|----|----|
| 1 | 頁型／情境（L37） | 給了：L18–L26，附配方檔名 | 給了：L48–L59 |
| 2 | 欄位（L38） | 給了：清單 L69、明細 L80–L87、抽屜 L91–L102 | 給了：清單 L65、明細 L76–L81、抽屜 L93、L85 |
| 3 | 操作（L38） | 給了：L48–L58 | 給了：L34–L43、L91–L99 |
| 4 | 狀態（L38、L41） | 給了：L46 | 給了：L21 |
| 5 | 批次勾選（L38） | 沒給：全檔無「批次」「勾選」字樣 | 給了：L68「不設批次勾選」 |
| 6 | 行內編輯（L38） | 給了：L54 筆記「就地切成輸入框」；編輯走抽屜 L24 | 部分：沒有明寫要不要行內編輯；每個編輯操作都指定了容器（L54–L59），清單不放列操作鈕（L68） |
| 7 | 角色權限差異（L38） | 給了：L34–L42 | 給了：L34–L46 |
| 8 | 商業規則漏洞：二次確認（L41） | 給了：L25–L26、L56–L57；認領不確認 L154 | 給了：L58–L59、L96–L99；認領不確認 L163 |
| 9 | 狀態顏色（L43） | 部分：正文沒寫；附檔 `design-brief.md` L93、`system.md` L27 有 | 給了：L162，附待確認註解 |

## 三、第 2 項：版型決定清單與依據

依據分類：方法、erp 規範、wiki、Sens 規範、自己判斷（規劃有寫明）、未標依據（規劃沒寫依據，本檔歸入自己判斷）。

### 3.1 甲（28 項）

甲的依據表在 L119–L135。甲沒有附方法原文句，只寫步驟名；下表「方法原文」欄是本檔依甲所寫步驟名去 interface-design `SKILL.md`（`/tmp/workflow-rebuild-ticket42-src-20261113/src/Dammyjay93_interface-design/.claude/skills/interface-design/SKILL.md`）找到的對應句，已核對存在。方法原文只要求「列出預設做法並改掉」「指定一個識別元素」「一個畫面一個焦點」，沒有指定甲選的具體答案。

| # | 決定 | 規劃位置 | 依據 | 方法原文（SKILL.md 行號） |
|---|------|---------|------|------------------------|
| 甲1 | 清單用資源列表頁（篩選、統計卡、表格） | L22、L121 | erp 規範 | — |
| 甲2 | 清單不放「新增」 | L22、L122 | wiki | — |
| 甲3 | 明細為獨立詳情頁，點單號進入 | L23、L121 | erp 規範 | — |
| 甲4 | 編輯諮詢單用明細頁右側抽屜 | L24 | 未標依據 | — |
| 甲5 | 取消諮詢用必選理由的置中對話框 | L25、L57、L131 | wiki＋方法 | L66「Defaults — 3 obvious choices…」（甲寫「拒絕紅色刪除確認」） |
| 甲6 | 代派、改派用置中對話框 | L25 | 未標依據 | — |
| 甲7 | 完成諮詢、轉需求單用確認框並寫明錢的去處 | L26、L132 | 自己判斷 | — |
| 甲8 | 認領直接生效，不跳確認框 | L154 | 自己判斷 | — |
| 甲9 | 筆記就地切成輸入框 | L54 | 未標依據 | — |
| 甲10 | 編輯諮詢單只在待諮詢出現 | L53、L153 | 自己判斷 | — |
| 甲11 | 不符條件的按鈕隱藏 | L41、L130 | Sens 規範 | — |
| 甲12 | 操作鈕放標頭右側 | L82、L128 | erp 規範 | — |
| 甲13 | 主色鈕同時只有一顆 | L82、L129 | 方法 | L99「Every screen has one thing the user came to do.」 |
| 甲14 | 取消諮詢用危險樣式 | 附檔 `design-brief.md` L104（正文沒寫） | 方法 | L162 檢查點「Hierarchy:」（原文沒有指定危險樣式） |
| 甲15 | 四狀態統計卡 | L71、L125 | wiki＋erp 規範 | — |
| 甲16 | 篩選：一個搜尋框＋狀態下拉＋諮詢人員下拉（含未認領） | L72 | 未標依據 | — |
| 甲17 | 預設排序：待諮詢依預約時段在前 | L73、L123、L155 | 方法 | L66 Defaults；L281「Rejecting: [default 1] → [alternative]…」 |
| 甲18 | 空狀態分兩種文字 | L74 | 未標依據 | — |
| 甲19 | 清單操作欄在未認領列放「認領」 | L70 | 未標依據 | — |
| 甲20 | 未認領標籤 | L69、L124 | 方法＋wiki | L65「Signature — one element…that could only exist for THIS product.」 |
| 甲21 | 明細分四區 | L80–L87、L126 | 方法 | L66 Defaults（甲寫「拒絕欄位平鋪」） |
| 甲22 | 客戶原話與筆記左右並排 | L85、L127 | 方法＋wiki | L65 Signature |
| 甲23 | 終態結果提示 | L83 | 未標依據 | — |
| 甲24 | 代派、改派放諮詢人員欄旁的文字鈕 | L86 | 未標依據（寫「比照需求單詳情」） | — |
| 甲25 | 活動紀錄區 | L87、L135 | wiki | — |
| 甲26 | 編輯抽屜只開放可修改欄位、頂端提示並唯讀列兩欄 | L104、L133 | wiki | — |
| 甲27 | 顏色、字級、圓角、間距照 erp | L134 | erp 規範 | — |
| 甲28 | 無檢視權：清單顯示提示、明細導頁 | L39、L161 | 自己判斷 | — |

小計：方法 4（甲13、甲14、甲17、甲21）；方法混合 3（甲5、甲20、甲22）；erp 規範 4（甲1、甲3、甲12、甲27）；wiki 3（甲2、甲25、甲26）；wiki＋erp 1（甲15）；Sens 規範 1（甲11）；自己判斷 4（甲7、甲8、甲10、甲28）；未標依據 8（甲4、甲6、甲9、甲16、甲18、甲19、甲23、甲24）。合計 28。

### 3.2 乙（42 項）

乙的依據表 L117–L143（#1–#27），自己判斷表 L151–L163（三 #1–#13），wiki 假設表 L171–L182（四 #1–#12）。方法原文路徑前綴 `/tmp/workflow-rebuild-ticket42-src-20261113/src/ant/spec/`。

| # | 決定 | 規劃位置 | 依據 | 方法原文核對（檔:行） |
|---|------|---------|------|-------------------|
| 乙1 | 清單用表格 | #1 L117 | 方法 | research-list.md:64、data-list.md:26 存在 |
| 乙2 | 篩選放清單上方 | #2 L118 | 方法 | research-list.md:46 存在 |
| 乙3 | 一個搜尋框查多欄 | #3 L119 | 方法 | data-list.md:85 存在 |
| 乙4 | 狀態篩選用按鈕式單選 | #4 L120 | 方法 | data-entry.md:77 存在 |
| 乙5 | 諮詢人員篩選用下拉 | #5 L121、三#2 L152 | 自己判斷（乙自記：照方法門檻應用單選按鈕） | data-entry.md:119 存在 |
| 乙6 | 明細開成獨立頁 | #6 L122 | 方法＋erp 規範 | data-list.md:124 存在；「complex immersive tasks, jump to independent page」在 data-list.md:125，原文為 `**jump to independent page**`（帶粗體記號）。L124 同段原文建議超過一屏用抽屜 |
| 乙7 | 分段平鋪、不分頁籤 | #7 L123 | 方法 | detail-page.md:60、:21 存在 |
| 乙8 | 每段一個外框 | #8 L124 | 方法 | detail-page.md:132 存在 |
| 乙9 | 操作鈕放段標題右側 | #9 L125、三#1 L151 | erp 規範（乙自記與方法衝突） | buttons.md:134 存在 |
| 乙10 | 一組至多一顆主按鈕 | #10 L126 | 方法 | buttons.md:27 存在 |
| 乙11 | 取消諮詢為危險按鈕、排最右 | #11 L127 | 方法 | buttons.md:88、:151 存在 |
| 乙12 | 按鈕文字用動詞並寫出結果 | #12 L128 | 方法 | buttons.md:199、:203 存在 |
| 乙13 | 編輯用抽屜 | #13 L129 | 方法 | research-form.md:150 存在 |
| 乙14 | 抽屜內分三組加組標題 | #14 L130 | 方法 | research-form.md:240、:184 存在 |
| 乙15 | 市話與分機同一列 | #15 L131 | 方法 | research-form.md:232 存在 |
| 乙16 | 預約時間用下拉 | #16 L132 | 方法 | data-entry.md:119 存在 |
| 乙17 | 來訪人數、客戶類型、數量級距用按鈕式單選 | #17 L133、三#3–#4 L153–L154 | 方法＋erp 規範（客戶類型 2 項、數量級距 5 項依 erp 2–5 範圍） | data-entry.md:77 存在 |
| 乙18 | 筆記用多行文字框 | #18 L134 | 方法 | data-entry.md:35 存在 |
| 乙19 | 錯誤訊息在欄位下方 | #19 L135 | 方法 | feedback.md:102 存在 |
| 乙20 | 完成諮詢、轉需求單用置中確認框 | #20 L136 | 方法 | feedback.md:143、data-list.md:164 存在 |
| 乙21 | 取消、代派、改派、筆記用置中對話框 | #21 L137 | 方法 | feedback.md:143 存在 |
| 乙22 | 認領不開框，直接生效 | #22 L138、三#13 L163 | 方法 | feedback.md:12、:124 存在 |
| 乙23 | 操作成功用頂部訊息 | #23 L139 | 方法 | feedback.md:124 存在 |
| 乙24 | 終態頁頂提示 | #24 L140、L86 | 方法 | feedback.md:28 存在 |
| 乙25 | 清單空狀態 | #25 L141、L69 | 方法 | data-list.md:202 存在 |
| 乙26 | 不滿一頁不顯示分頁器 | #26 L142 | 方法 | data-list.md:97 存在 |
| 乙27 | 不放新增鈕 | #27 L143、L23 | 方法＋wiki | data-list.md:144 存在（原文只描述有新增時的情境） |
| 乙28 | 抽屜確認鈕在右上 | 三#5 L155 | erp 規範（乙自記與方法衝突） | — |
| 乙29 | 完成諮詢當主按鈕 | 三#6 L156 | 自己判斷 | — |
| 乙30 | 清單不放「認領」列操作 | 三#7 L157 | 自己判斷 | — |
| 乙31 | 清單不放統計卡 | 三#8 L158 | 自己判斷 | — |
| 乙32 | 預設排序：編號由新到舊 | 三#9 L159、L67 | 自己判斷 | — |
| 乙33 | 受理與結果放第一段 | 三#10 L160 | 自己判斷 | — |
| 乙34 | 對話框離開鈕寫「返回」 | 三#11 L161、L101 | 自己判斷 | — |
| 乙35 | 狀態標籤顏色並加待確認註解 | 三#12 L162 | 自己判斷 | — |
| 乙36 | 狀態篩選不設「全部」 | 四#12 L182 | 自己判斷 | — |
| 乙37 | 不能做的操作直接不出現 | L45 | 未標依據 | — |
| 乙38 | 找不到時顯示「找不到諮詢單」與「返回清單」 | L87 | 未標依據 | — |
| 乙39 | 每頁 10 筆 | L70 | 未標依據 | — |
| 乙40 | 無檢視權顯示無權限 | L36 | 未標依據 | — |
| 乙41 | 篩選區有「清空」鈕 | L64 | 未標依據 | — |
| 乙42 | 終態仍顯示「編輯諮詢單」 | 四#2 L172 | wiki（乙寫「照字面」） | — |

小計：方法 22（乙1–4、乙7、乙8、乙10–16、乙18–26）；方法混合 3（乙6、乙17、乙27）；erp 規範 2（乙9、乙28）；wiki 1（乙42）；自己判斷 9（乙5、乙29–36）；未標依據 5（乙37–41）。合計 42。

乙的方法引文共 34 句（含同一句跨列重複引用），33 句以固定字串比對逐字存在，1 句（#6 第二句）原文帶粗體記號。

## 四、第 3 項：與 wiki 的差異

wiki 根目錄：`memory/Sens_wiki/wiki/erp/`。卡名簡寫：實體卡＝`05-entities/售前/諮詢單.md`；狀態機卡＝`06-state-machines/售前/諮詢單狀態.md`；情境卡＝`07-scenarios/售前/諮詢受理與出口分流.md`；認領清單＝`04-business-logic/服務藍圖/諮詢服務流程群組/諮詢人員認領活動清單.md`。

### 4.1 與 wiki 不符

| 方案 | 規劃句 | wiki 原文位置 | 標註 |
|------|--------|-------------|------|
| 甲 | 業務主管不能編輯諮詢單（L42、L145），需求原文寫可以 | 認領清單 L31 ACT-CLM-003 只列諮詢；L35 未列即不可做 | 有標註（三 #1） |
| 甲 | 用實體卡範例編號格式（L146） | 實體卡 L57 範例 `CR-2026-0604`；CR-007 卡 L25 寫「CR 接年月再接四碼」，狀態 open（L6） | 有標註（三 #2） |
| 甲 | 用名冊人名張惠雯、蘇怡君（L147） | 實體卡 L59 範例「吳佳蓉」；情境卡 L26「小林」 | 有標註（三 #3） |
| 乙 | 業務主管不出現「編輯諮詢單」（L46、L171） | 認領清單 L31、L35 | 有標註（四 #1） |
| 乙 | 用實體卡範例編號格式（L178） | 實體卡 L57；CR-007 卡 L25 | 有標註（四 #8） |
| 乙 | 不做被指派者的通知（L30） | 情境卡 L41「被指派者收到通知」 | 有標註（範圍「不做」） |
| 乙 | 業務主管可對「全公司的待諮詢單」撰寫筆記（L41），不限已認領；畫面 `_lib/permissions.js` L27 同此 | 實體卡 L61 諮詢人員筆記填入時點「由 OP-CR-005 撰寫諮詢人員筆記填（認領後）」 | 沒標註 |

甲的筆記條件是「待諮詢且已有諮詢人員」（L54），與實體卡 L61 一致。甲沒有提被指派者通知，屬未提及，不是相反的句子，本檔不計入不符。

### 4.2 wiki 沒寫而自己假設

| 方案 | 有標註 | 沒標註 |
|------|-------|-------|
| 甲 | 11 項：三 L153–L163 | 2 項：認領限「沒有諮詢人員」（L50）；代派限「沒有諮詢人員」（L51）。乙把這兩項列為假設（四 #3 L173、#4 L174） |
| 乙 | 10 項：四 #2–#7、#9–#12（L172–L182） | 1 項：改派時不可選原本的人（L95）。甲列為假設（三 #11 L163） |

wiki 依據：認領清單 L29 認領活動沒寫「限未認領」；情境卡 L41 代派條件為「諮詢人員未及時自我認領」；實體卡 L59 諮詢人員欄只寫「限待諮詢」，沒寫改派候選人排除規則。

### 4.3 兩方案相反、且都引 wiki 的假設

終態能不能編輯諮詢單：甲假設不能（三 #1 L153，寫「wiki 沒寫」）；乙假設能（四 #2 L172，寫「照字面」）。相關 wiki 原文：實體卡 L44–L50 外部表單欄位「一般欄位；修改寫入活動紀錄」，沒寫狀態限制；狀態機卡 L37「『終態』＝諮詢已選定出口、單據就此定格的處境」。兩份規劃都沒有引用狀態機卡 L37。

## 五、第 4 項：與 erp 規範的衝突

### 5.1 正文照做會違反 erp 規範的句子

甲 0 句，乙 0 句。核對的 erp 規範：`Designs.md` §4 L130、§5 L141–L146、§6.5 L183–L190、§8 L238–L247；`docs/recipes/detail-page.recipe.md` L8、L79；`docs/recipes/resource-page.recipe.md` L13、L92、L111；`docs/component-catalog.md` PanelDrawer、PanelDialog、RadioButtonGroup、SectionHeader 條目。

正文以外的附檔：甲 `plan-A-files/specimen.html` L4、L7 寫死 `font-size:18px`、`13px`，照做會違反 `Designs.md` L130「不要自訂 font-size」與 L240。該檔 L80（design-brief）標明「樣本用宿主介面的變數，不代表 erp 實際長相」，`build-A.md` L6 寫明建置依據是正文，所以不計入。

### 5.2 規劃自記的不相容項與處理

| 方案 | 自記項數 | 處理 |
|------|---------|------|
| 甲 | 15 項（四 L171–L187） | 照 erp 10 項（#1–#10）；未做 2 項（#11 根層樣式、#14 瀏覽器實看）；識別元素改用版面結構 1 項（#12）；兩邊都沒問 PM 1 項（#13）；改存 `plan-A-files/system.md` 1 項（#15） |
| 乙 | 明確寫「衝突」2 項：三 #1 L151（頁層級操作鈕位置）、#5 L155（抽屜確認鈕位置） | 兩項都照 erp |
| 乙 | 方法門檻不合 3 項：三 #2 L152（諮詢人員只 3 個選項，方法應用單選按鈕）、#3 L153（客戶類型 2 項）、#4 L154（數量級距 5 項） | #2 不照方法、改用下拉；#3、#4 照 erp RadioButtonGroup 2–5 範圍 |

甲自記的 erp 規範描述有一處與原文不同：四 #10 L182 寫「圓角固定 6 與 12」，`Designs.md` L141 為「sm 2 · md 6 · lg 8 · round 50%」，L146 另寫容器用 12。

## 六、第 5 項：規劃到畫面的落實

### 6.1 甲（28 項，全部照做）

| # | 畫面位置（a09f2aec） |
|---|------------------|
| 甲1 | `page.js` L179–L237 |
| 甲2 | `page.js` L179–L186（GenericFilter 沒傳新增） |
| 甲3 | `page.js` L122；`detail/page.js` |
| 甲4 | `_components/EditConsultationDrawer.js` L64–L71（PanelDrawer） |
| 甲5 | `_components/CancelConsultationDialog.js` L23–L54，L28 未選理由停用確認 |
| 甲6 | `_components/AssignConsultantDialog.js` L27–L45 |
| 甲7 | `detail/page.js` L108–L145（modal.confirm＋getConfirmModalConfig） |
| 甲8 | `detail/page.js` L147–L150；`page.js` L112–L115 |
| 甲9 | `detail/page.js` L311–L329 |
| 甲10 | `_lib/permissions.js` L22 |
| 甲11 | `detail/page.js` L171–L199、L208–L217 條件渲染 |
| 甲12 | `detail/page.js` L231–L247 |
| 甲13 | `detail/page.js` L188–L197；兩顆互斥見 `_lib/permissions.js` L19、L25 |
| 甲14 | `detail/page.js` L178–L182（secondary＋danger） |
| 甲15 | `page.js` L216–L223 |
| 甲16 | `page.js` L179–L215 |
| 甲17 | `page.js` L55–L63、L107 |
| 甲18 | `page.js` L235 |
| 甲19 | `page.js` L152–L162 |
| 甲20 | `page.js` L150；`detail/page.js` L206 |
| 甲21 | `detail/page.js` L252–L374 |
| 甲22 | `detail/page.js` L279–L342 |
| 甲23 | `detail/page.js` L45–L78、L250 |
| 甲24 | `detail/page.js` L208–L217 |
| 甲25 | `detail/page.js` L370–L374 |
| 甲26 | `_components/EditConsultationDrawer.js` L72–L100 |
| 甲27 | 各檔取 `theme` 值；`detail/page.js` L279 `gutter={[16, 16]}`、抽屜 L79 `gutter={24}` 為數字字面值（配方 `detail-page.recipe.md` L52 亦用 `gutter={24}`） |
| 甲28 | `page.js` L165–L175；`detail/page.js` L96–L102 |

做了規劃沒寫的（7）：操作成功訊息（`detail/page.js` L124、L142、L149、L160、L384、L395、L408；`page.js` L114）；找不到諮詢單提示（`detail/page.js` L99–L101）；清單不分頁（`page.js` L233）；取消對話框「補充說明請寫在諮詢人員筆記」（`CancelConsultationDialog.js` L51–L53）；統編 8 碼檢查（`EditConsultationDrawer.js` L118）；抽屜唯讀列多列諮詢單編號（L81–L84，正文 L104 只寫兩欄）；確認鈕文字「確認完成」「確認轉需求單」「確認取消」「儲存」（`detail/page.js` L121、L139；`CancelConsultationDialog.js` L27；`EditConsultationDrawer.js` L70）。

### 6.2 乙（42 項，全部照做）

| # | 畫面位置（8af55053） |
|---|------------------|
| 乙1 | `page.js` L143–L155 |
| 乙2 | `page.js` L103–L141 |
| 乙3 | `page.js` L104–L109 |
| 乙4 | `page.js` L118–L124 |
| 乙5 | `page.js` L130–L138 |
| 乙6 | `page.js` L56；`detail/page.js` |
| 乙7 | `detail/page.js` L183–L272 |
| 乙8 | `detail/page.js` L41–L45 |
| 乙9 | `detail/page.js` L186–L190、L208–L218、L246–L256 |
| 乙10 | `detail/page.js` L141、L161；互斥見 `_lib/permissions.js` L20、L29 |
| 乙11 | `detail/page.js` L165–L169（陣列最後一顆） |
| 乙12 | `detail/page.js` L141–L168、L111、L129 |
| 乙13 | `detail/page.js` L275–L287；`_components/EditConsultationDrawer.js` L59–L66 |
| 乙14 | `EditConsultationDrawer.js` L68、L93、L126 |
| 乙15 | `EditConsultationDrawer.js` L97–L108 |
| 乙16 | `EditConsultationDrawer.js` L134–L136 |
| 乙17 | `EditConsultationDrawer.js` L69–L71、L139–L144 |
| 乙18 | `_components/ConsultationDialogs.js` L32–L38 |
| 乙19 | `EditConsultationDrawer.js` L77、L86、L119 |
| 乙20 | `detail/page.js` L102–L136 |
| 乙21 | `ConsultationDialogs.js` L21、L55、L86 |
| 乙22 | `detail/page.js` L97–L100 |
| 乙23 | `detail/page.js` L99、L115、L133、L283、L296、L313、L324 |
| 乙24 | `detail/page.js` L175–L181 |
| 乙25 | `page.js` L149–L153 |
| 乙26 | `page.js` L148 |
| 乙27 | `page.js` L103–L111（沒傳新增） |
| 乙28 | `EditConsultationDrawer.js` L59–L66（PanelDrawer 預設 edit 模式） |
| 乙29 | `detail/page.js` L160–L164 |
| 乙30 | `page.js` L50–L87 沒有操作欄 |
| 乙31 | `page.js` L3–L16 沒有匯入 StatCards |
| 乙32 | `page.js` L47 |
| 乙33 | `detail/page.js` L183–L203 |
| 乙34 | `ConsultationDialogs.js` L24、L59、L93–L95；`detail/page.js` L112、L130 |
| 乙35 | `_components/ConsultationStatusTag.js` L4–L10 |
| 乙36 | `page.js` L119–L123（無「全部」選項） |
| 乙37 | `_lib/permissions.js` L18–L31；`detail/page.js` L140–L169 |
| 乙38 | `detail/page.js` L80–L92 |
| 乙39 | `page.js` L148 |
| 乙40 | `page.js` L89–L97；`detail/page.js` L70–L78 |
| 乙41 | `page.js` L110 |
| 乙42 | `_lib/permissions.js` L25 |

做了規劃沒寫的（6）：編輯後「沒有變更」訊息（`detail/page.js` L284）；抽屜標題旁編號標籤（`EditConsultationDrawer.js` L63）；未認領顯示文字（`page.js` L83；`detail/page.js` L196）；改派對話框列出目前諮詢人員與「狀態維持待諮詢」說明（`ConsultationDialogs.js` L66、L76）；筆記對話框說明文字（L29–L31）；空狀態加圖示（`page.js` L151）。

## 七、第 6 項：同一決定點、兩方案答案不同

| 決定點 | 甲（依據） | 乙（依據） |
|-------|----------|----------|
| 終態是否顯示「編輯諮詢單」 | 不顯示（自己判斷，L153） | 顯示（wiki 字面，L172） |
| 撰寫諮詢人員筆記的容器 | 筆記區就地切輸入框（未標依據，L54） | 置中對話框（方法，L137） |
| 操作鈕位置 | 全部放頁首標頭右側（erp detail 配方 L8，甲 L128） | 分放段 1、段 2、段 3 標題右側（erp 配方，乙 L151） |
| 代派、改派入口 | 諮詢人員欄旁文字鈕「代派」「改派」（未標依據，L86） | 段 1 標題右側一般按鈕「代派諮詢人員」「改派諮詢人員」（L78） |
| 清單統計卡 | 有，四狀態（wiki＋erp，L125） | 無（自己判斷，L158） |
| 清單列操作「認領」 | 有（未標依據，L70） | 無（自己判斷，L157） |
| 預設排序 | 待諮詢依預約時段在前（方法，L123） | 編號由新到舊（自己判斷，L159） |
| 狀態篩選控制項 | 下拉（未標依據，L72） | 按鈕式單選（方法，L120） |
| 明細分段 | 標頭＋預約與客戶資料＋原話與筆記並排＋受理與結果＋活動紀錄，用 PanelBlock（方法，L126–L127） | 受理與結果＋客戶填寫資料（含客戶原話）＋筆記＋活動紀錄，用 BorderBlock＋SectionHeader（方法＋erp，L123–L124） |
| 空狀態文字 | 有篩選與無資料分兩種（未標依據，L74） | 一種（方法，L141） |
| 分頁 | 規劃沒寫；畫面不分頁 | 每頁 10 筆、不滿一頁隱藏（L70、L142） |
| 編輯欄位必填 | 聯絡人、手機、Email、預約、人數、級距等必填（自己判斷，L156–L157） | 只有公司戶的統編與抬頭必填（自己判斷，L176） |
| 來訪人數、數量級距控制項 | 「單選」（L101–L102）；畫面用下拉 | 按鈕式單選（方法＋erp，L133） |
| 對話框離開鈕 | 規劃沒寫；畫面「取消」 | 「返回」（自己判斷，L161） |
| 終態提示 | 依狀態分三種內容與型別（未標依據，L83） | 一行固定句（方法，L86、L140） |

## 八、第 7 項：操作用字

實體卡操作段：實體卡 L72–L80。

| 操作（實體卡） | 甲的叫法（行號） | 甲叫法數 | 乙的叫法（行號） | 乙叫法數 |
|-------------|---------------|--------|---------------|--------|
| 認領諮詢單 | 認領諮詢單（L36、L50、L82）；按鈕「認領」（L70） | 2 | 認領諮詢單（L22、L37、L59、L78、L83、L96） | 1 |
| 代派諮詢人員 | 代派諮詢人員（L37、L51）；「代派」（L25、L86） | 2 | 代派諮詢人員（L22、L38、L78、L95）；表格內縮寫「代派、改派諮詢人員」（L56） | 1（另 1 處縮寫） |
| 改派諮詢人員 | 改派諮詢人員（L37、L38、L52）；「改派」（L25、L86） | 2 | 改派諮詢人員（L22、L39、L56、L78、L95） | 1 |
| 編輯諮詢單 | 一致 | 1 | 一致 | 1 |
| 撰寫諮詢人員筆記 | 撰寫諮詢人員筆記（L36、L37、L54）；按鈕「撰寫筆記」（L85） | 2 | 一致（L22、L41、L55、L80、L94） | 1 |
| 轉需求單 | 一致 | 1 | 一致 | 1 |
| 完成諮詢 | 一致 | 1 | 一致 | 1 |
| 取消諮詢 | 一致 | 1 | 一致 | 1 |
| 檢視諮詢單 | 一致（L39、L58） | 1 | 一致（L22、L27、L36） | 1 |

規劃內按鈕文字與實體卡不一致的操作數：甲 4，乙 0。乙 L157 的「認領」是被否決的清單列操作，不是採用的按鈕文字。乙 L102 規定確認鈕文字與操作名相同。

畫面按鈕文字（參考）：甲畫面另有確認鈕「確認完成」「確認轉需求單」「確認取消」，規劃沒寫（見 6.1）；乙畫面確認鈕為「轉需求單」「完成諮詢」「取消諮詢」「代派諮詢人員」「改派諮詢人員」（`detail/page.js` L111、L129；`ConsultationDialogs.js` L60、L103）。

## 九、無法判定或沒查的項目

| 項目 | 原因 |
|------|------|
| PanelDialog 用於取消、代派、改派（兩方）與筆記（乙）是否合 erp 規範 | 元件目錄 PanelDialog 條目寫「訂單頁等『新增』情境的置中彈窗；只針對頁面部分 section 編輯／新增時」，取消與指派是否屬「部分 section 編輯」有兩種讀法，本檔不判 |
| 兩方清單都不放「新增」，與配方骨架「篩選列＋新增按鈕」（`resource-page.recipe.md` L13）不同 | 配方是描述骨架、沒有禁止句；不放的依據是 wiki（實體卡 L84），本檔不計為違反 |
| 來訪人數「單選」或「按鈕式單選」與實體卡欄位形態「整數」（L48）是否算不符 | 屬輸入控制項選擇，實體卡沒有規定控制項，本檔不計 |
| 甲四 #8 「共用 Button 預設 small 尺寸」等 erp 規範描述 | 沒逐條核對甲自記 15 項中對 erp 現況的描述，只抽查 #10（見 5.2） |
| 畫面實際渲染結果 | 不准啟動伺服器，只讀程式碼 |
| access-activities.js 的諮詢單列是否逐列等於 wiki | 只核對了 13 列的角色與範圍（`access-activities.js` L98–L106、L5075–L5160），與活動清單一致；檢視列 L4224–L4251 沒細看 |
| 甲的方法依據 | 甲沒附原文句；3.1 的對應句是本檔依甲寫的步驟名找出，非甲自附 |

### 可重現指令

```bash
# 變數
OUT=/Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/.scratch/workflow-rebuild/research/42-trial2
ANT=/tmp/workflow-rebuild-ticket42-src-20261113/src/ant/spec
IDS=/tmp/workflow-rebuild-ticket42-src-20261113/src/Dammyjay93_interface-design/.claude/skills/interface-design/SKILL.md
A=/Users/b-f-03-029/erp/.claude/worktrees/ticket42-a2
B=/Users/b-f-03-029/erp/.claude/worktrees/ticket42-r2-b
P='apps/erp/src/app/(prototype)/consultations'

# erp skill 第 1 步（基底版、兩邊相同）
git -C $A show '6e75fa07:.claude/skills/prototype-from-prompt/SKILL.md' | sed -n '29,43p'
diff <(git -C $A show '6e75fa07:.claude/skills/prototype-from-prompt/SKILL.md') <(git -C $B show '6e75fa07:.claude/skills/prototype-from-prompt/SKILL.md') && echo same

# 第 1 項：批次、行內
grep -n '批次\|勾選\|就地\|行內' $OUT/plan-A.md $OUT/plan-B.md

# 第 2 項：乙引文逐句核對（例；34 句同法）
grep -nF 'When each entry needs to expose many fields' $ANT/research-list.md
grep -nF 'complex immersive tasks' $ANT/data-list.md   # 第 125 行，帶 ** 記號
# 甲方法對應句
grep -nF -e '**Defaults** — 3 obvious choices' -e '**Signature** — one element' -e 'Every screen has one thing the user came to do' -e 'Rejecting:' -e 'Hierarchy:' $IDS

# 第 3 項：wiki 原文
W=/Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/memory/Sens_wiki/wiki/erp
sed -n '61p;72,80p' "$W/05-entities/售前/諮詢單.md"
sed -n '37p' "$W/06-state-machines/售前/諮詢單狀態.md"
sed -n '41p' "$W/07-scenarios/售前/諮詢受理與出口分流.md"
sed -n '29,35p' "$W/04-business-logic/服務藍圖/諮詢服務流程群組/諮詢人員認領活動清單.md"

# 第 5 項：程式
git -C $A show "a09f2aec:$P/detail/page.js" | cat -n
git -C $B show "8af55053:$P/detail/page.js" | cat -n
git -C $B show "8af55053:$P/_lib/permissions.js" | cat -n   # L25 編輯不限狀態、L27 主管筆記不限已認領

# 第 7 項：操作名稱次數與行號
for f in plan-A.md plan-B.md; do for t in 認領諮詢單 「認領」 代派諮詢人員 「代派」 改派諮詢人員 「改派」 撰寫諮詢人員筆記 撰寫筆記; do echo "$f $t: $(grep -n -- "$t" $OUT/$f | cut -d: -f1 | tr '\n' ',')"; done; done
```
