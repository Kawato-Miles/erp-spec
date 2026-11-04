---
name: oq-manage
description: >
  用：對話任何時點識別到設計不確定項，要開 OQ（待裁決問題卡）。常見說法：這個要記下來、這個需確認、先列 OQ、先開一張 OQ、之後再問業務、待釐清、待補、有個問題要確認、新增 OQ。某張 OQ 已拍板、要解答或封存。整理 OQ、掃 OQ、OQ 健康、看哪些 OQ 放太久。討論某模組前要查未解 OQ。卡上掃到 `[!question]` 或「待確認」類措辭要遷出。erp-audit 評分表有待裁決項，要依 OQ 列給 Miles。
  不用：已定案的決策（直接寫正本卡，用 wiki-amend）；術語定義更新；一般討論備忘、未消化素材（用 vault-ingest）；稽核誤判（用 erp-audit）。
---

# oq-manage

## 目標

每個不確定項都在 `08-open-questions/` 平層有一張卡。平層張數就是待裁決的壓力。
拍板後，卡只留在 `_archives/<年>/`，決議落地到正本卡。

## 產出

| 產出 | 落點 | 誰寫 |
|------|------|------|
| OQ 卡 | `memory/Sens_wiki/wiki/erp/08-open-questions/<前綴>-<NNN>-<簡述>.md` | 主對話 |
| 封存卡 | `08-open-questions/_archives/<拍板年份>/`，檔名不改 | 主對話 |
| 待裁決清單 | 對話；裁決結果在 grill 中由 Miles 確認，要改正本卡的轉 `wiki-amend` | 主對話 |
| 查詢清單、整理報告 | 對話 | 主對話 |
| log 條目 | `memory/Sens_wiki/wiki/log.md`，動作＝同步、標籤＝oq；只在動到 wiki 時記；格式見 `memory/Sens_wiki/CLAUDE.md` § 四 | 主對話 |

## 限制

- 不確定項一律開獨立卡，原處改連結。禁 inline 標注，禁 `[!question]` callout，禁只在回覆裡說「列為 OQ」。
- 開卡前先去重，範圍含 `_archives/`。已拍板的題不重開，引舊決議問 Miles。
- Miles 說「記下來」「列 OQ」就直接開卡。主對話自己識別到的，先提案，Miles 確認後開。
- `grill-with-docs` 進行中識別到不確定項，當下就開卡，不等 grill 結束；規劃單只寫已拍板的內容。
- 卡的長相只看 [[規範 - OQ]]（`../../../memory/Sens_wiki/wiki/erp/08-open-questions/規範 - OQ.md`），起手複製 [[範本 - OQ]]。本 skill 不複寫。
- `audience` 一律填 internal。Notion Follow-up DB 推送暫停，恢復由 Miles 另行指示。
- 決議落地到 03～07 正本卡，寫入轉 `wiki-amend`。本 skill 只動 OQ 卡。
- 查詢撈出的 OQ 是未決選項。帶入討論時明說：不得當現況依據，不得拿來與 wiki 或 spec 比對矛盾。
- 封存卡只增不改。翻案開新卡，舊卡只追加取代註記（[[規範 - OQ]] § 四）。
- OQ 的門檻值只寫在 `references/整理報告格式.md`。
- vault 搜尋與搬檔用 obsidian-cli，指令語法以該 skill 為準。

## 順序

| 步 | 動作 | 段內標籤 |
|----|------|---------|
| 1 | 去重 | mode B、mode D |
| 2 | 開卡，或指到既有卡；原處改連結；記 log | mode B、mode D |
| 3 | 討論時帶入未解 OQ | mode A |
| 4 | Miles 拍板或延後 | — |
| 5 | 拍板：補決議段，改 status，移封存，記 log | mode C |
| 6 | 決議要改正本卡：轉 `wiki-amend` | mode C |

拍板後的欄位：status 改 answered，補 answered-at、answered-by；取消改 cancelled 並附原因。決議段寫法見 [[規範 - OQ]] § 3.6。

## 情況對應檔案

| 情況 | 讀哪個檔 |
|------|---------|
| 開卡前去重（mode B），或遷出卡上的 inline 不確定項（mode D） | `references/去重方法.md` |
| erp-audit 評分表有待裁決項；拍板前要列影響行為的未決 OQ | `references/待裁決清單格式.md` |
| 整理 OQ、掃 OQ（mode E） | `references/整理報告格式.md` |
| 卡的長相、決議段、修改既有卡 | [[規範 - OQ]] |
| 討論前查某領域未解 OQ（mode A） | 依 [[business-domain-taxonomy]] § 檢索規約判領域；查平層 status＝open 且領域 tag 命中的卡，先列卡名再讀 |

## 陷阱

| 陷阱 | 出處 |
|------|------|
| 卡上用 callout 或 inline 措辭標不確定項，沒開卡，佇列看不到 | 2026-05-19 提交 1821b31 inline OQ 遷移 |
| Miles 說「先開一張 OQ」，本 skill 沒觸發，OQ 只留在回覆裡 | 2026-11-04 觸發評測 K01，舊新兩版都沒觸發 |
| 已拍板的卡留在平層，平層張數不再等於待裁決壓力 | 2026-06-11 提交 43bfc9c 封存制 |
| 把未決 OQ 當事實寫進設計，三張未決 OQ 決定了已寫入 spec 的行為 | 2026-05-28 帳務 change（[[規劃品質評分準則]] § 三） |
| 依賴未決 OQ 的稽核項判「部分通過」退回設計者，設計者修不動，輪數空轉 | 2026-10-26 封存的 shipment-print-download-center 第 2～5 輪 |
| obsidian-cli 省略參數，靜默改查目前開啟的檔，回錯答案；CLI 不可用才退 grep | 2026-08-01 實測（`memory/Sens_wiki/CLAUDE.md` § 五） |
