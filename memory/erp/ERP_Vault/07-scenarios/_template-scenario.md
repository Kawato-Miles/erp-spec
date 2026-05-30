---
type: meta
status: active
last-reviewed: 2026-05-31
---

# 情境卡（scenario）撰寫範本

> 給撰寫 `07-scenarios/` 情境卡（type=scenario）的人 / agent 複製套用。這份範本同時是「寫的時候照著填」和「事後照著檢查」（doc-audit / vault-audit 依底部自審清單勾稽）。
> 上位約束：[[business-logic-writing-guide#4.0 各類卡的單一職責|writing-guide § 4.0]]（scenario 職責）+ [[business-logic-writing-guide#4.4 scenario 卡（跨模組端到端，營運動機貫穿角色傳遞）|§ 4.4]]（scenario 骨架）+ [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）|wiki-architecture § 分層體系]]（scenario = 流程層）+ [[wiki-schema#十一、卡類型內容職責邊界（2026-05-28 新增）|wiki-schema § 十一]]（職責邊界）。
> 範例正本：[[訂單異動流程]]（補收 / 退款四旅程端到端，已落實本範本結構）。

## 這類卡一句話定義

scenario 卡回答「**一件事從頭到尾怎麼走完**」——跨多 user story、跨模組、跨角色的端到端旅程。判斷口訣：「**這是一段有先後順序、跨角色傳遞的旅程嗎？**」是 → scenario。對照 business-logic（回答「什麼情況套什麼規則」，單一 if-then 決策點）。同一主題會同時有兩種卡：規則卡管「每條規則對不對」，情境卡管「整段流程串得對不對」（[[business-logic-writing-guide#4.0.1 規則卡 vs 流程卡怎麼分|§ 4.0.1 切分界線]]）。

## 不可違反的硬規則 vs 可視情況調整的彈性

**不可違反（硬規則，極少且硬）**：
- 禁中英文夾雜（英文欄位名 / 實體名一律用介面中文，技術詞括號附註）。
- 每一步「依某規則」MUST wiki link 指向 [[../04-business-logic|business-logic]] 正本卡，**不重述規則本體、不寫計算公式**（規則被流程引用、不被流程複製）。
- 識別到不確定項 MUST 立即觸發 [[oq-manage]] mode B 開獨立 OQ 卡，正文不留 inline OQ 措辭（「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」）。
- `source` 禁指同層 / 下層 / OpenSpec（OpenSpec 進 `implemented-by` / `related-spec`）。
- 正文零迭代史（迭代史進 [[business-logic-changelog]]）。

**可視情況調整（明示在範本、禁私自偏離）**：
- `## 這張卡要回答的問題` 段：流程無爭議、步驟自明時，可用敘述句陳述「本卡要驗證哪段旅程串得通」代替問句清單（無爭議事實用敘述）。
- 單一情境（無分支變體）的卡：`## 情境清單` 可只列一條旅程，不強行湊多旅程。
- 過渡期既有卡：暫時補不出 `source`（往上指的依據）時標 `source-gap` 待之後補，`related-spec` 過渡期等同 `implemented-by` 弱版（增修與過渡處理見 `wiki-amend` skill）。

---

--- 模板開始 ---

```markdown
---
type: scenario
module:
  - cross-module                          # 對齊 wiki-schema § 二；scenario 多為 cross-module，單模組跨多角色亦可（如審稿端到端）
business-domain:
  - <6 領域之一或 cross-domain>           # 必填；對齊 wiki-schema § 二B（pre-sales / order-management / prepress / production / fulfillment-after-sales / billing-cash / cross-domain）
status: draft                             # draft | active | deprecated
last-reviewed: 2026-MM-DD
source:                                   # 往上指依據（這張卡為什麼對）；只准指更上層的卡 / 真實外部素材（business-logic 規則卡 / 拍板 OQ / 業務情境 / 法規）。禁指同層 / 下層 / OpenSpec
  - "[[<更上層的卡>]] 或 <最上層依據：Miles 拍板 / 印刷業實務 / 拍板 OQ>"
implemented-by:                           # 往下指被誰實作；指 OpenSpec Requirement 標題層 / prototype / test-case。不承載正確性（可選；過渡期用下方 related-spec 亦可）
  - "openspec/specs/<模組>/spec.md#Requirement: <標題>"
related-spec: openspec/specs/<模組>/spec.md   # 過渡期保留，語意等同 implemented-by 弱版
provenance-commit: <SHA>                  # 可選；記上次對齊 commit，供 doc-audit stale 偵測
---

# <情境名：名詞片語，描述這段端到端旅程，如「訂單異動流程（補收 / 退款端到端）」>

> 一句話定位：這串情境覆蓋哪段端到端流程、屬哪個業務領域 + 正本歸屬聲明（如「本卡只描述角色傳遞與狀態鏈；每一步『依某規則』回引 [[../04-business-logic/XX規則]] 正本，不重述規則本體——規則對不對由規則卡驗證，本卡只驗證整段流程串得對不對」）。

## 這張卡要回答的問題

> 先列這張卡要回答的「流程完整性問句」（不是規則問句——規則 if-then 屬 business-logic），每個問句正文有對應結論，據此判斷「這段旅程驗證完整了沒」。流程自明時可用敘述句陳述「本卡驗證哪段旅程」代替問句。
> 問句聚焦「串接」：哪一步觸發下一步？哪一步漏掉流程就斷？跨角色交接點對不對？分支在哪裡岔開、各自走哪張卡？

- <問句 1，如「客戶取消已收款訂單，從業務取消到會計對帳收斂，中間經過哪幾個角色、哪一步漏掉流程就斷？」>
- <問句 2，如「退款牽動的已開發票，何時走折讓、何時走作廢重開？分支條件是什麼？」>
- <問句 3，如「售後階段的退款與訂單期間的退款，是否沿用同一條狀態鏈、還是另開例外路徑？」>

## 營運背景

> 這些情境合起來對應公司營運上的什麼真實業務場景、為什麼需要把它端到端串起來驗證。2-4 句，業務語言，無實作術語當主詞、無中英夾雜。
> 這段是主管 / PM 的入口——讀完應能判斷「我們對這段跨部門流程的理解對不對」。

<公司營運上遇到什麼狀況，所以有這段跨模組旅程；串起來驗證的價值（如「讓主管驗證整段跨部門流程是否走得通」）。>

## 情境清單

> 逐情境（或逐旅程）：情境名 → 營運上什麼狀況觸發 → 角色傳遞 / 狀態鏈（逐步，每步標明執行角色 + 依哪條規則 wiki link）→ 1 個具體例子（真實編號 / 金額 / 角色，禁占位符 demo-*）。
> 每一步「依某規則」MUST wiki link 指 business-logic 正本，禁重述規則本體 / 計算公式 / UI 措辭。

### 旅程 A：<旅程名（觸發狀況一句話）>

- **觸發狀況**：<營運上什麼情況觸發這條旅程，業務語言>。
- **角色傳遞 / 狀態鏈**：
  1. **<角色>**（[[../03-roles/<角色卡>]]）<做什麼業務動作>，依 [[../04-business-logic/<規則卡>#<規則定位點>|<規則別名>]]（<狀態變化引 [[../06-state-machines/<狀態卡>]]>）。
  2. **<下一角色>**（[[../03-roles/<角色卡>]]）<接手做什麼>，依 [[../04-business-logic/<規則卡>#<規則定位點>|<規則別名>]]。
  3. ...（逐步串到終態 / 收斂點）
- **具體例子**：<真實編號（#ORD-2026-NNNN）+ 具體金額 + 角色 + 狀態，把抽象旅程攤成一個可驗算的實例>。

### 旅程 B：<旅程名>（若有分支變體）

- **觸發狀況**：<...>。
- **角色傳遞 / 狀態鏈**：
  1. ...
- **系統連鎖（no-op 邊界）**：<若有 top-down / 自動連鎖，說明何時為 no-op，引 [[../06-state-machines/<狀態卡>]]>。
- **具體例子**：<...>。

## <跨旅程收斂段（可選，如「跨旅程對帳收斂」）>

> 多條旅程若最終收斂到同一驗收點（如三方對帳等式），集中描述「會計 / 某角色的查核流程」，規則本體仍引規則卡，本段只描述流程。無收斂點則刪此段。

- **<角色>**<查核 / 收斂動作>，依 [[../04-business-logic/<規則卡>#<規則定位點>|<規則別名>]]（規則本體在規則卡，本段只描述流程）。

## 範疇外

> 明確列出本卡不涵蓋什麼、什麼情況走哪張卡。讓讀者知道「這條我不負責，去那張卡找」。

- <某狀態的轉換條件 / 一定要成立的規則（invariant）> → [[../06-state-machines/<狀態卡>]]（狀態正本）。
- <某規則本體與計算公式> → [[../04-business-logic/<規則卡>]]（規則正本，本卡僅引用）。
- <某實體的欄位 / 生命週期> → [[../05-entities/<實體卡>]]。
- <不屬本旅程的情境> → 走 [[<對應卡>]] / 不在本卡。

## 相關連結

> 依語意分類（writing-guide 原則 7），雙向可達；連結 MUST 標明關聯方向，不只丟一串連結。

### 上層情境
- [[README]]（本卡承接 README 索引的情境 N / 對應哪幾條）

### 下層步驟
- [[../13-user-stories/<module>/US-XX-NNN-<簡述>]]（旅程 A 的 <某步驟>）
- [[../13-user-stories/<module>/US-XX-NNN-<簡述>]]（旅程 B 的 <某步驟>）

### 相關角色
- [[../03-roles/<角色卡>]]（在本流程中的職責定位）

### 相關規則
- [[../04-business-logic/<規則卡>]]（情境每步引用的規則正本，不複製規則本體）

### 相關狀態
- [[../06-state-machines/<狀態卡>]]（流程中的狀態鏈）

### 相關實體
- [[../05-entities/<實體卡>]]（流程作用的資料實體）

## 來源

> 連回可獨立驗證的外部出處（OpenSpec spec / 業務情境 / 訪談 / 法規 / 拍板 OQ）。禁指向其他同類 scenario 卡（會變成自己引自己、繞回原點）。末行加迭代脈絡指向 changelog（正文零迭代史）。

- OpenSpec [<模組>/spec.md](../../../../openspec/specs/<模組>/spec.md)（<這段流程對齊 spec 的哪些 Requirement>）
- 拍板 OQ：[[../08-open-questions/<OQ-id>]]（<該情境分支的拍板來源>）
- 迭代脈絡見 [[business-logic-changelog#<本卡名 或 引用的規則卡名>]]（本流程串起的規則正本演進史）
```

--- 模板結束 ---

## 極簡填寫示意（佔位符，非真實內容）

> 只示意「角色傳遞 / 狀態鏈 + 每步引規則」的填法骨架，真實內容（真實編號 / 金額 / 規則卡名）留帶實例階段補。

```markdown
### 旅程 A：<某旅程>（<觸發一句話>）

- **觸發狀況**：<營運上 X 情況發生>。
- **角色傳遞 / 狀態鏈**：
  1. **<角色甲>**於 <某實體> <做動作>，依 [[../04-business-logic/<規則卡>#<規則定位點>|<規則別名>]]，狀態由「<態1>」推進「<態2>」（[[../06-state-machines/<狀態卡>]]）。
  2. **<角色乙>** <接手動作>，依 [[../04-business-logic/<規則卡>#<規則定位點>|<規則別名>]]。
- **具體例子**：<#ORD-2026-XXXX，金額 NNN，角色甲做了 Y，狀態變 Z>。
```

## 自審清單（這份清單同時是撰寫檢查表，也是 doc-audit / vault-audit 稽核基準）

> 同一份既是撰寫檢查表也是稽核維度，對齊 [[wiki-schema#維度 14：卡類型內容職責邊界（2026-05-28 新增）|wiki-schema 維度 14]]。

### 共同骨架（所有卡共用）
- [ ] frontmatter 共同欄全填（type=scenario / module / business-domain / status / last-reviewed）；`source` 不指同層 / 下層 / OpenSpec（OpenSpec 進 implemented-by / related-spec）。
- [ ] 一句話定位含正本歸屬聲明（「本卡只描述角色傳遞與狀態鏈、不重述規則本體」）。
- [ ] `## 這張卡要回答的問題` 段每個問句正文有對應結論（或自明時以敘述句陳述驗證範圍）。
- [ ] `## 營運背景` 段無實作術語當主詞、無中英夾雜（技術詞括號附註）。
- [ ] 正文零迭代史（迭代史在 [[business-logic-changelog]]）；正文零 inline OQ 措辭（→ [[oq-manage]] mode B）。
- [ ] `## 相關連結` 雙向可達、語意分類（上層情境 / 下層步驟 / 相關角色 / 相關規則 / 相關狀態 / 相關實體）；沒有連到不存在的卡，本卡也不是沒有任何卡連進來的孤島卡。
- [ ] 最後驗收：營運背景抽一句問「主管 / PM 不看程式碼能否懂這段流程」。

### scenario 卡特有（職責邊界，越界即 Error）
- [ ] 每一步「依某規則」皆 wiki link 指 [[../04-business-logic|business-logic]] 正本，**未在本卡重述規則本體 / 計算公式**（規則被流程引用、不被流程複製）。
- [ ] 正文**未含** user-story 格式模板（作為 / 我希望 / 以便）→ 屬 user-story 卡。
- [ ] 正文**未含** test-case 範本（前置條件 / 測試步驟 / 預期結果）→ 屬 Notion test-case。
- [ ] 正文**未含**單一步驟的 UI 操作細節（按鈕 / 下拉 / 彈窗 / Tab / 點擊 / Side Panel / Toast）→ 屬 user-story UI 段或 Prototype。
- [ ] 內容是「跨角色傳遞的旅程」而非「單一 if-then 決策點」（口訣：有先後順序、跨角色交接 → scenario；單一條件 → 動作 → business-logic）。
- [ ] `## 情境清單` 每條旅程含「觸發狀況 + 角色傳遞 / 狀態鏈（逐步標角色）+ 1 個真實格式具體例子」三件套；例子用真實編號 / 金額 / 角色，無占位符（demo-*）、無抽象等價類（「金額為負時」）。
- [ ] `## 範疇外` 列出不涵蓋的情境 + 指向承接卡。

## 參考

- [[business-logic-writing-guide]] — § 4.0 各類卡的單一職責 + § 4.0.1 規則卡 vs 流程卡怎麼分 + § 4.4 scenario 骨架（上位約束）
- [[wiki-architecture]] — § 分層體系（scenario = 流程層）+ § 依據往上、實作往下，連結不繞回自己（source / implemented-by）+ § 各層怎麼寫
- [[wiki-schema#type=scenario]] — frontmatter 正式規格
- [[wiki-schema#十一、卡類型內容職責邊界（2026-05-28 新增）]] — 職責邊界 lint（維度 14）
- [[訂單異動流程]] — 已落實本範本的範例正本卡
- [[README]] — 07-scenarios 入口與情境索引
