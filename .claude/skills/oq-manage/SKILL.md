---
name: oq-manage
description: >
  OQ（Open Question）管理 skill。正本：Vault `memory/Sens_wiki/wiki/erp/08-open-questions/`（平層＝未結案佇列；`_archives/<YYYY>/`＝已結案封存）。
  觸發時機：
    1. 任何討論／撰寫中識別到設計不確定項（MUST 立即開檔，禁 inline 標注）
    2. Miles 說「新增 OQ」「這個要記下來」「有個問題要確認」（mode B）
    3. 討論開始前查特定模組未解 OQ（mode A）
    4. OQ 已拍板（mode C 解答與封存）
    5. Miles 說「遷出 [檔案] 的 OQ」或掃描發現 inline OQ 措辭（mode D）
    6. Miles 說「整理 OQ」「掃 OQ」「OQ 健康」（mode E 批次整理）
  不適用：已確認的決策記錄（直接寫正本卡）、術語定義更新、一般討論備忘、未消化的觀察素材（走 vault-ingest）。
---

# oq-manage

OQ 是**待裁決佇列**：每張卡一個待確認的問題，拍板後決議寫回卡、封存出平層。平層只放未結案——平層數量＝真實的待辦壓力，一眼可信。

## 〇、三條軸線（每個動作從這裡推導）

**1. 狀態（status，嚴格三值）**：

| 值 | 語意 | 位置 |
|----|------|------|
| `open` | 待解（含部分拍板，進度記內文「部分拍板」段） | 平層 |
| `answered` | 已拍板，「決議」段記結論與落地去處 | 封存（mode C 標 answered 即移檔） |
| `cancelled` | 不再相關／被其他拍板實質取代（內文附原因） | 封存 |

`resolved`／`closed`／`active` 等其他寫法一律禁止（mode E 抓殘留）；status 行禁止行內註解。

**2. 內外部（audience，開卡時必判）**——判斷問句：「**誰能回答這個問題？**」

| 值 | 語意 | 解答來源 | 下游 |
|----|------|---------|------|
| `internal` | 開發迭代待確認的議題（設計選擇、欄位歸屬、機制取捨） | Miles 或內部討論可拍板 | 留 Vault，拍板即結案 |
| `external` | 要與業務單位確認的未知內容（商業層面：現場實務怎麼跑、客戶慣例、計價規則的為什麼） | 業務單位／工廠現場／客戶（訪談、開會） | 彙整推送 Notion Follow-up DB（對外確認版，推送由 Miles 觸發）；frontmatter `notion-url` 推送後回填 |

**3. 封存（archive）**：status 轉 answered／cancelled 時，檔案移 `08-open-questions/_archives/<拍板年份>/`。wiki link 按檔名解析，移目錄不斷鏈。封存卡只增不改（決議是歷史紀錄）；發現決議錯了不改舊卡，開新 OQ 引用舊卡。

## 一、檔名與 frontmatter

檔名：`<前綴>-<NNN>-<問題簡述>.md`（簡述繁中名詞、不含序號重複、不用問號）。

```yaml
---
type: open-question
module:
  - <中文 module，見 wiki-schema § 二>
oq-id: <前綴>-<NNN>
status: open
priority: high | medium | low
audience: internal | external
raised-at: YYYY-MM-DD
raised-by: <誰提出>
source-link: <識別到此問題的出處：對話／卡／spec 路徑>
related-vault:
  - "[[<相關卡>]]"
related-oq:
  - <相關 OQ 全檔名 wiki link（帶別名），禁短名>
expected-resolution-at: YYYY-MM-DD   # external 必填（預期確認時點）；internal 建議填
answered-at: YYYY-MM-DD              # 拍板時填
answered-by: <拍板者>
notion-url: <推送後回填>             # external 推送 Notion 後填
---
```

正文骨架：問題描述／待解答（checkbox）／（候選方案）／（部分拍板）／（決議——拍板時補，含結論＋落地去處 `[[卡名]]`）。

## 二、五個 mode（輸入 → 步驟 → 輸出）

### Mode A：查詢（討論前帶入）

輸入：模組或主題。步驟：grep 平層 `status: open`（依 module 過濾）。輸出：`<oq-id>：<簡述>（priority, audience, raised-at）` 清單，external 另列（提醒待外部確認項）。

### Mode B：新增（強制去重，禁跳步）

1. **描述問題**：問題是什麼、影響哪些卡／spec、誰能回答（→ audience 判定）。
2. **去重搜尋**：grep 平層＋`_archives/` 全部 OQ 的標題與內文關鍵詞（封存卡也搜——已拍板過的問題不重開，引用舊決議）。
3. **分析建議**：無相似 → 新增；有相似 open → 建議擴充既有卡；已拍板過 → 引舊決議給 Miles 確認是否真是新問題。
4. **Miles 確認後開卡**：序號取該前綴現有最大值＋1（**平層與 `_archives/` 一起算**，序號永不重用）；原識別處改 wiki link 引用。
5. **log 一筆**（同步(oq)）。

### Mode C：解答與封存

1. Miles 拍板 → 卡內補「決議」段：結論＋落地去處（決議改了哪些正本卡，逐卡 `[[卡名]]`；無需落地則寫明）。
2. frontmatter：status=answered＋answered-at＋answered-by（cancelled 同理附原因）。
3. **移檔封存**：`git mv` 至 `_archives/<拍板年份>/`。
4. log 一筆（同步(oq)，含決議一句話摘要）。

### Mode D：遷出（inline OQ → 獨立卡）

掃描指定檔案（或本輪變動卡）的 `[!question]` callout 與「待確認／待釐清／需確認／尚未確認／待補」inline 措辭（引用既有 OQ 卡的 wiki link 不算）→ 逐項走 mode B（含去重）→ 原處改 wiki link 引用。

### Mode E：批次整理（純報告＋Miles 確認後操作）

掃平層全部卡，產三張清單：
1. **狀態違規**：status 非三值、行內註解污染 → 列映射提案（resolved→answered 等），確認後修
2. **可封存**：平層上 status=answered／cancelled 的卡 → 確認後批次移檔
3. **external 待推送**：audience=external 且未填 notion-url → 提醒 Miles 是否觸發推送
另列：open 超過 30 天無進度、priority high 長期擱置、缺 expected-resolution-at 的 external 卡。

## 三、紅旗清單（出現任一＝停下）

| 紅旗 | 為什麼錯 |
|------|---------|
| 在 Vault 卡用 `[!question]` callout 或「待確認」inline 標注卻不開檔 | OQ 必須是獨立卡才進得了佇列管理 |
| 口頭說「列為 OQ」卻沒觸發本 skill | 口頭承諾不會出現在平層 |
| 跳過去重直接開卡 | 重複 OQ 讓佇列失真、決議分裂兩處 |
| status 用 resolved／closed／active 等自創值 | 三值以外查詢全部漏抓 |
| answered 卡長期留平層 | 平層數字失去「待辦壓力」意義 |
| 改寫封存卡的決議 | 決議是歷史；要翻案開新 OQ 引舊卡 |
| audience 不判就預設 internal | 商業層問題漏出「待業務確認」佇列，訪談時帶不到 |

## 四、與其他機制的協作

| 情境 | 協作 |
|------|------|
| vault-ingest mode A 識別「明確未解問題」 | 轉入本 skill mode B（素材觀察留 raw、問題進 OQ） |
| vault-insight 識別可批次結案的 OQ 群 | 走 mode C 逐張封存 |
| vault-audit 維度 8（OQ 健康度） | 巡檢平層超期／缺欄位／狀態違規，建議跑 mode E |
| Notion Follow-up DB | 對外確認版（external 專用），推送由 Miles 觸發；Vault 永遠是正本 |
| wiki/log.md | 每次 B／C／D／E 操作記一筆（同步(oq)） |
