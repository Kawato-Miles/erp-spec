# Sens

## 專案是什麼

Miles 是印刷業 PM，負責 **ERP 系統**（生產排程、採購、倉儲、客戶訂單）與 **線上編輯器**（B2B SaaS 印刷稿件生成平台）。
本 repo 是這兩個產品的規劃知識庫：商業需求正本在 `memory/Sens_wiki/wiki/`（BRD），系統行為規格在 `openspec/`（PRD）。
非目標：本 repo 不寫實作程式碼、不放介面原型。原型在 erp repo，見 § Prototype 與測試。
回覆風格正本是 `~/.claude/output-styles/ste100-pm.md`：主對話經輸出風格載入，子代理經使用者層 SubagentStart hook 收到全文。全域偏好（語言、文件迭代分層）正本在 `~/.claude/CLAUDE.md`，本檔不重述；子代理會載入該檔（內建 Explore、Plan 例外）。

## 正本分層（唯一正本，勿在他處重述）

| 層 | 放什麼 | 不放什麼 |
|----|--------|---------|
| wiki（`memory/Sens_wiki/wiki/`，BRD） | 商業目標、痛點、營運原則、業務規則與恆定約束、角色分權、領域知識、KPI、OQ、業務可見欄位表（`05-entities/`）、狀態列舉與轉換條件（`06-state-machines/`）、情境骨架（`07-scenarios/`）、審查知識與參考模型（`11-review-knowledge/`） | 與實作文件的對應；`source` 禁指 openspec |
| OpenSpec（`openspec/`，PRD） | Requirement 只寫系統承諾；Scenario 是驗收條目，標所屬情境卡步驟；change 工作流 | 欄位表、狀態列舉、業務規則句（改一句引用 wiki 卡） |
| Prototype（`/Users/b-f-03-029/erp`） | 頁面結構、操作動線、元件呈現 | mock 資料的值、API 形狀、權限的後端強制 |
| Linear | 對開發的唯一交付正本，內容自包含 | 不取材 OpenSpec；取材 wiki 與 Prototype |

- 同一內容只有一個家：欄位、狀態、轉換條件、業務規則、情境骨架、角色 R&R 都歸 wiki；spec 不複寫，wiki 不複寫驗收條目。
- 欄位與狀態的新增修改是商業決策，先改 wiki 卡，再視需要補 spec。
- 引用方向：change 的 Why 段引 wiki 卡。wiki 不承載實作對應。收／不收邊界見 `memory/Sens_wiki/wiki/erp/00-meta/scope-boundary.md`。
- 跨頁面引用一律 `[可讀名稱](URL)`；Notion URL 正本 `memory/shared/notion-index.md`。

## 工作入口

| 情境 | 去哪裡 |
|------|--------|
| 要動 ERP 的流程、規則、欄位、狀態、權限、單據行為（句中沒寫「規劃」也算） | `/opsx:new` 建 change，再跑 `erp-plan`。規劃流正本 wiki [審查知識路由](memory/Sens_wiki/wiki/erp/11-review-knowledge/審查知識路由.md) § 三，分級與豁免同卡 |
| 需求對齊 | Miles 下 `/grill`；grill.md 記逐題拍板 |
| 設計撰寫 | `/opsx:continue` 產 proposal 與 design；收件模板 `erp-plan` references/設計收件 |
| 稽核設計、Miles 說審錯了 | `erp-audit` |
| 識別到不確定項、待裁決項 | `oq-manage`，立即開卡，禁 inline 標注 |
| 把定案內容寫進 wiki 卡、11 層卡 | `wiki-amend`（唯一寫入入口） |
| 存 raw、調研、精練 raw | `vault-ingest` |
| 知識庫健檢 | `vault-audit` |
| 交付到 Linear | `linear-delivery` |
| 重構既有正本（換結構、換規範、清矛盾） | 正本重構流，審查知識路由 § 三 |
| 商業層查詢 | [wiki/index.md](memory/Sens_wiki/wiki/index.md)，依 `business-domain-taxonomy` 檢索規約先列卡名再載入 |
| 術語 | `memory/Sens_wiki/wiki/跨產品/印刷業共用術語表.md`、`memory/Sens_wiki/wiki/編輯器/線上編輯器術語表.md`；非商業術語 `memory/shared/non-business-terms.md` |
| Plan mode | 雙層 plan 模板 `memory/shared/plan-template.md` |
| 派子代理或子工作階段 | 任務書照 `memory/shared/派工任務書範本.md`；正文指名讀 `memory/shared/non-business-terms.md` |
| 寫或改程式碼 | 載入 `andrej-karpathy-skills:karpathy-guidelines`；實作前先 `grilling` 對齊 |

ERP 流程不用 `/opsx:propose`。寫 specs 的前置條件在 `openspec/config.yaml`，不在本檔。

## 模型分工

| 工作 | 模型 |
|------|------|
| 主對話：規劃、grill、設計方向、裁決 | Fable，工作階段起手時選 |
| 主對話：落卡、交付、機械整理 | Opus 5.5 |
| 子代理：實作、wiki 與 openspec 修正、稽核 | Opus high |
| 子代理：查找、摘錄、規格明確的重複任務（調研、盲測受測） | Sonnet |

稽核者不給設計意見，只判定附證據。子代理回報先查證據再採用，數字對照原始檔。

## 停下與繼續

- 一步不需要 Miles 決策就繼續做，做完再回報。
- 停下只在下列情況：缺 Miles 的決策（分級判不準、落點判不了、拍板互相矛盾）；破壞性動作前（刪檔、強制推送、動主檢出、合併 master 以外的分支、對外發布）；正本矛盾（並排呈報，不自行調和）。
- 已拍板的事不重問；記憶卡標「勿重問」者直接沿用。

## 收尾回報

每輪收尾分三段：卡在 Miles 的事、改了什麼、發現什麼。發現段逐項檢查下列事項：

| 項目 | 做法 |
|------|------|
| 新不確定項 | 已開 OQ 卡。提交前掃本次改動的 Vault 與 spec 檔，有 `[!question]` 或「待確認」類措辭就先遷出（`oq-manage`） |
| 值得存 raw 的素材 | 先問 Miles，再走 `vault-ingest` |
| wiki 卡異動或 raw 累積達門檻 | 建議跑 `vault-audit`；門檻值在該 skill 的 references |
| 設計拍板 | 先 `wiki-amend` 落卡，再寫 specs |

## 陷阱

| 陷阱 | 出處 |
|------|------|
| 回覆改用英文，尤其代理回報後的狀態更新 | 2026-10-06 |
| 輸出簡體中文字元 | 記憶卡 feedback_always_traditional_chinese |
| 寫「as-is」；一律寫「現況」 | 2026-09-20 |
| 規則名稱帶數量；門檻值寫兩處以上；範本放規則 | 2026-09-23 |
| 操作名稱不照實體卡操作段，改用同義詞 | 2026-10-23 |
| 有狀態機卻用抽象描述判條件；要用狀態名 | 2026-10-22 |
| 分級與影響範圍數模組；要看實體間關聯 | 2026-10-29 |
| 為單一情境設特別規則；先設計通用工具再用情境驗證 | 2026-10-06 |
| 規劃時主動加介面呈現；只確保流程與資料正確 | 2026-10-20 |
| OQ 裁決加閾值分級、疊提醒、新欄位；預設先不做，人工可行先人工 | 記憶卡 feedback_no_over_design_on_oq |
| 設狀態把關前沒找既存額度、數量、事實條件 | 記憶卡 feedback_meaningful_guards |
| 異常用事後沖帳補救；要停止並排除 | 記憶卡 feedback_jidoka_stop_first_design |
| 文件矛盾自行調和；要停下並排呈報 | 記憶卡 feedback_contradiction_must_stop |
| 宣告缺口前只讀一張卡或套通用 ERP 預設；要追完事實來源鏈 | 記憶卡 feedback_trace_fact_source_chain |
| 設計前漏讀架構正本卡 | 記憶卡 feedback_read_architecture_card_first |
| wiki 引用用文字路徑或相對引用；一律 `[[卡名]]`，來源端不寫誰用它 | 2026-10-27 |
| 不同卡資料重疊，連摘要都留；一個事實一張卡 | 2026-10-13 |
| 改卡名用 git mv，Obsidian 反向連結全斷；用 obsidian-cli | 記憶卡 project_obsidian_link_stability |
| 還不要提交的改動先暫存；並行工作階段會一起提交 | 2026-09-23 |
| 派單、貨運、運費類規劃沒先爬 sensation-api 現況 | 記憶卡 feedback_check_sensation_api_asis |
| 採信子代理「已遵循 skill」自述；要自己對照原始檔 | 2026-09-04；2026-10-29 重構盤點多次更正子代理數字 |
| 規劃句沒有「規劃」字眼就不跑 erp-plan；舊版只觸發 25% | 2026-11-04 觸發評測 |
| Prototype 動到 (prototype)/ 以外的共用元件或 app 層檔 | 2026-09-03 |
| 直接改 Prototype 前沒讀 prototype-from-prompt skill | 2026-09-23 |
| 比對 Prototype 現況只搜模組目錄，漏共用元件 | 2026-09-21 |
| Prototype 的 PR 關聯 Linear issue | 2026-09-22 |
| 發布時把等 CI 與合併接成一條管線 | 2026-09-22 |
| Linear 修正用補充；要刪除或重構 | 2026-10-07 |
| Linear 留言不用原本／現行對照表，或用 Markdown 連結引 issue | 2026-09-04 |
| Linear 開票不先在 PM team 建再轉隊 | 記憶卡 feedback_linear_issue_via_pm_team |
| 當前狀態用不到的操作鈕做成停用加提示；要直接隱藏 | 2026-09-08 |
| 沒被指示就跑全套測試 | 2026-10-23 |

## 版本控管

Commit 格式：`{prefix}: {繁體中文描述}`，prefix 用 feat、fix、refactor、docs。結尾署名 `Co-Authored-By: {現行模型名} <noreply@anthropic.com>`，依系統提示的實際模型填。改 `memory/` 連同 CLAUDE.md 一起提交，提交後 hook 自動推送。

| 規則 | 內容 |
|------|------|
| 代理一律用工作樹 | 任何代理改本 repo 的檔一律在自己的工作樹與分支作業。派工用 `memory/shared/派工任務書範本.md`，基線的規範版本必須已在 master |
| 主檢出不切分支 | 主檢出（`/Users/b-f-03-029/Sens`）是 Miles 的 Obsidian 視窗，永遠停在 master，只做 `git pull --ff-only` |
| 分支完成直接快轉合併 master、不開 PR | 完成＝改動依當次拍板的規範做完，且分支沒有自己改規範、範本、範例卡（規範只由主對話依 Miles 拍板改）。步驟：`git fetch origin` 比對；能快轉就 `git push origin <分支>:master`；不能就先 rebase 再推，不用合併提交；推完在主檢出 `git pull --ff-only`。erp repo 不適用，仍走 PR |

## Prototype 與測試

- Prototype 一律在 erp repo（`/Users/b-f-03-029/erp`），實作 MUST 經 repo 內 skill `prototype-from-prompt`；開分支加前端主管 PR 合併。
- 平台限制：辦公角色只支援桌機瀏覽器；現場回報介面（師傅報工、品檢記錄、貨運單點收秤重、揀貨裝箱回報、出貨與送達確認）開放手機寬度；廠務轉交回報走 Slack 表單通道。
- mock 與測試同步：`(prototype)/MOCK-DATA-CHAIN.md` 是 mock 唯一正本；改 mock 先改它、再改各模組 `mock-data.js`、最後跑 Sens `erp-prototype-tests/` 並更新測試。
- 測試：改動後先 `npm run impact` 對映影響，跑 `npm run test:smoke`，改哪章跑哪章；全套 `npm test` 只在 Miles 指示時跑；提交訊息附測試結果。畫面測試同時只允許一個代理跑、背景執行。
- change 封存前：引入新業務流程要先補情境目錄與測試；fixme 條目要在 `docs/findings-*.md` 有紀錄。
- erp repo 不放測試檔、不動 erp skill 與 `(prototype)/README.md`。檢核表見 `erp-prototype-tests/README.md`。

## 生產主檔用詞（2026-10-29 拍板，對齊標準 ERP／MES）

| 標準概念 | wiki 用詞 | 說明 |
|---------|----------|------|
| 品項主檔 | 品項主檔 | 標準範圍含成品、半成品、原物料；現階段只收原物料 |
| 製程 | 工序主檔、裝訂主檔，同屬製程類主檔 | 「工序」不改成「製程」 |
| 物料清單與製程路線 | 部件配方、印件配方 | 兩卡暫合併承載，待品項層定案後拆開；拆開前不交付 Linear |
| 工作中心 | 設備、產線 | 維持現行 |

品項主檔與製程類主檔不設統稱；禁用「料號主檔」「BOM 主檔」「BOM 三類」。「BOM」只指物料清單。其他 ERP 術語對照在 `memory/shared/non-business-terms.md`；實體、狀態、規則的定義讀正本卡的一句話定位段。
