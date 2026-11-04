---
name: erp-plan
description: >
  用：Miles 要動 ERP 的流程、規則、欄位、狀態、權限或單據行為時，句中沒寫「規劃」也算。常見說法：規劃、設計、修改某邏輯、我想做、想做、要怎麼處理、要加、要拿掉、要改、要放寬、要重構、要重寫、要校正、要統一、要對齊、要補齊、要搬到、要拆開、要標準化、要重新定義。常見領域詞：諮詢、需求單、報價、訂單、印件、工單、生產任務、派工、報工、轉交、審稿、品檢、出貨、物流、售後、補做、款項、發票、收款、對帳、退款、折讓、分期、交期、急件、配方、BOM、設備、產線、排程。流程時點：`/opsx:new` 建 change 之後、grill 之前；grill 完成、進入設計撰寫（「開始設計」「照新流程做設計」）；規劃中遇到不知道的事；`/opsx:explore` 探索新需求時的衝突檢查。
  不用：純查詢（某狀態在哪、某詞的定義）；只改版型、元件、排版；已定案規則只同步到 spec（用 `/opsx:new`）；正本重構流；整庫健檢（用 vault-audit）；稽核設計（用 erp-audit）；落卡（用 wiki-amend）；交付（用 linear-delivery）。
---

# erp-plan

## 目標

設計動筆前，看清本議題碰到哪些正本卡、現況缺口在哪、要不要調研。
設計寫完時，design.md 一次通過 erp-audit 收件。[[規劃品質評分準則]]（`../../../memory/Sens_wiki/wiki/erp/11-review-knowledge/規劃品質評分準則.md`）每條檢核陳述都找得到證據。
探索新需求時，及早指出與既有商業規則的衝突。

## 產出

| 產出 | 落點 | 誰寫 |
|------|------|------|
| 盤點報告：涉及領域與載入卡、卡類型矩陣、現況缺口、待確認 OQ、連帶影響、寫 specs 前須更新的卡、調研建議 | `openspec/changes/<名稱>/precheck.md` | 盤點子代理回傳，主對話存檔 |
| 衝突筆記 | 探索時留在對話；建 change 後併入 precheck.md 衝突筆記段 | 主對話 |
| design.md 收件自檢結果 | 對話；送 erp-audit 前回報 | 主對話 |
| 盤點摘要一筆 | `memory/Sens_wiki/wiki/log.md`，動作＝健檢、標籤＝pre-check | 主對話 |

## 限制

- 不修卡。現況缺口的修補轉 `wiki-amend`；本 skill 只列哪張卡缺什麼。
- 不新建 03～07 的抽象卡。法規與外部硬約束可新建，落卡仍走 `wiki-amend`。
- 讀卡依 [[business-domain-taxonomy]] § 檢索規約：先列卡名、攤給 Miles、再載入。語意不確定時，先問 Miles 要找哪個領域。
- 盤點交子代理；修補、存檔、開 OQ 在主對話。
- 子代理任務書 MUST 指名先讀非商業術語對照：`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`。句法規則由 SubagentStart hook 送達子代理，不另指名。
- 設計者只讀 wiki 業務正本卡（01～07）與 change 內檔。設計者不讀 raw，也不讀參考模型卡。
- change 內缺 precheck.md，或 grill.md 沒有拍板紀錄，不進設計。先補，不憑印象代填。
- 設計骨幹見準則卡 § 一；必含段見 § 二；名詞溯源見 § 四 5-2；範圍紀律見 § 八。本 skill 不複寫。
- 調研跑不跑由 Miles 決定；要跑時轉 `vault-ingest`。
- 平行盤點的預設值只寫在這裡：模型 `opus`、推理強度（effort）`high`。

## 順序

| 步 | 動作 | 誰做 |
|----|------|------|
| 1 | 判領域 | 主對話 |
| 2 | 列卡名清單，攤給 Miles | 主對話 |
| 3 | 載入卡，含該領域資料結構總覽卡 | 盤點子代理 |
| 4 | 盤點卡類型矩陣與現況缺口 | 盤點子代理 |
| 5 | 寫調研建議 | 盤點子代理 |
| 6 | 存 precheck.md，log 記一筆 | 主對話 |
| 7 | grill，第一題確認調研建議 | Miles 主持 |
| 8 | 設計：`/opsx:continue` 產 proposal 與 design | 主對話 |
| 9 | 收件自檢 | 主對話 |
| 10 | 送 `erp-audit` | 主對話 |

規劃中遇到不知道的事，回第 1 步，只盤那件事。

## 情況對應檔案

| 情況 | 讀哪個檔 |
|------|---------|
| 開始盤點 | `references/盤點方法.md` |
| 探索新需求，還沒建 change | `references/衝突檢查.md` |
| 涉及兩個領域以上 | `references/平行盤點.workflow.js`：以工作流程工具（Workflow）帶 `scriptPath` 執行，參數 `topic`、`domains`、`model`、`effort` |
| 結構性變更，且該領域參考模型卡沒有對應段 | `references/調研判斷.md` |
| 進入設計 | `references/設計收件.md` |

## 陷阱

| 陷阱 | 出處 |
|------|------|
| 只列現況缺口，漏列設計定案後要改的卡；寫 specs 前沒對齊，封存後也漏回補 | 2026-05-30 pre-check v1.1：converge change 漏對齊 6 卡 |
| 漏列下游連動卡：狀態機卡、活動清單卡、流程群組卡 | 2026-10-27 rush-order-definition 第二輪漏 10 張；2026-10-23 shipment-print-download-center 漏單據存取流程群組（評測集 `pre-check回放集.md` § 三） |
| 帳務領域的寫法套到其他領域：非帳務議題也照 BI-／ORD- 雙系列列 OQ | 2026-10-27 rush-order-definition precheck.md § 四 |
| 該領域沒有資料結構總覽卡，卻寫成有；結構性變更沒有總覽卡就進設計 | 2026-10-29 分級重現：印前審稿沒有總覽卡（wiki/log.md 2026-10-29 17:10） |
| 沒讀完既有卡就判缺漏：跨期作廢折讓、拆票、合期其實已在情境卡 | 2026-05-28 [[audit-failure-patterns]] Over-report |
| 照角色卡頭部欄位判職責：會計卡參與階段只寫審稿，實際涵蓋全程 | 2026-05-28 [[audit-failure-patterns]] Scope creep |
| Miles 的規劃句多半沒有「規劃」「設計」字眼，舊版只觸發 25%～30%；句子要改流程、規則、欄位、狀態就跑本 skill | 2026-11-04 評測集 `基線結果.md` § 8-1 |
