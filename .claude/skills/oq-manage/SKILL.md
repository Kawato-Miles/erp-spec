---
name: oq-manage
description: >
  OQ（Open Question）管理 skill。正本：Vault `memory/Sens_wiki/wiki/erp/08-open-questions/`（平層＝未結案佇列；`_archives/<YYYY>/`＝已結案封存）。
  觸發：識別到設計不確定項 MUST 立即開檔（禁 inline 標注）；mode A——討論前查模組未解 OQ；mode B——「新增 OQ」「這個要記下來」「有個問題要確認」；mode C——OQ 已拍板（解答與封存）；mode D——「遷出 [檔案] 的 OQ」或掃到 inline OQ 措辭；mode E——「整理 OQ」「掃 OQ」「OQ 健康」。
  不適用：已確認的決策記錄（直接寫正本卡）、術語定義更新、一般討論備忘、未消化的觀察素材（走 vault-ingest）。
  撰寫規範（一卡一議題／範圍宣告／段落紀律）見 wiki「規範 - OQ」；本 skill 管流程。
---

# oq-manage

OQ 是**待裁決佇列**：每張卡一個待確認的問題，拍板後決議寫回卡、封存出平層。平層只放未結案——平層數量＝真實的待辦壓力，一眼可信。

**分工（單一正本）**：本 skill 管「OQ 怎麼流動」（五 mode 操作、去重、封存移檔、audience 判定、Notion 推送）。「一張 OQ 卡長什麼樣」——判斷表、一卡一議題鐵則、範圍宣告、互引規則、檔名與序號、段落紀律、稽核維度——正本在 wiki `08-open-questions/規範 - OQ`；frontmatter 欄位值域正本在 wiki-schema § 四。三層結構：骨架 `wiki/範本/範本 - OQ`（開卡 MUST 從骨架複製起手）、規範 `規範 - OQ`、範例 `08-open-questions/範例 - OQ`。

## 〇、兩條流程軸線

**1. 狀態流轉**：status 嚴格三值（open／answered／cancelled，值域正本 wiki-schema § 四）。open 在平層；轉 answered／cancelled 即封存。

**2. 內外部（audience，開卡時必判）**——判斷問句：「**誰能回答這個問題？**」

| 值 | 語意 | 解答來源 | 下游 |
|----|------|---------|------|
| `internal` | 開發迭代待確認的議題（設計選擇、欄位歸屬、機制取捨） | Miles 或內部討論可拍板 | 留 Vault，拍板即結案 |
| `external` | 要與業務單位確認的未知內容（商業層面：現場實務怎麼跑、客戶慣例、計價規則的為什麼） | 業務單位／工廠現場／客戶（訪談、開會） | 彙整推送 Notion Follow-up DB（對外確認版，推送由 Miles 觸發）；frontmatter `notion-url` 推送後回填 |

**封存**：status 轉 answered／cancelled 時，檔案移 `08-open-questions/_archives/<拍板年份>/`。wiki link 按檔名解析，移目錄不斷鏈。封存卡只增不改（修改原則見規範 - OQ § 四）。

## 一、五個 mode（輸入 → 步驟 → 輸出）

### Mode A：查詢（討論前帶入）

輸入：領域或主題。步驟：依 [[business-domain-taxonomy]] 檢索規約判定領域（語意不確定先與 Miles 確認）→ 查平層 `status: open` 且領域 tag（`領域/<領域名>`）命中的卡，先出卡名清單再讀內容。輸出：`<oq-id>：<簡述>（priority, audience, raised-at）` 清單，external 另列（提醒待外部確認項）。

### Mode B：新增（強制去重，禁跳步）

> 「識別到不確定項 MUST 立即開檔」＝立即啟動本 mode（描述＋去重＋提案），實際開卡在步 4 經 Miles 確認；Miles 已明示要記錄（「記下來」「列 OQ」）即視為已確認，直接開卡。

1. **描述問題**：問題是什麼、影響哪些卡／spec、誰能回答（→ audience 判定）；含多個可獨立拍板子題時先拆（規範 - OQ § 3.1）。
2. **去重搜尋**：以 obsidian-cli（`obsidian search`）搜平層＋`_archives/` 全部 OQ 的標題與內文關鍵詞（CLI 不可用時退 grep）；封存卡也搜——已拍板過的問題不重開，引用舊決議。
3. **分析建議**：無相似 → 新增；有相似 open → 依「同一決議段能否結案」判擴充或開新卡互引（規範 - OQ § 四）；已拍板過 → 引舊決議給 Miles 確認是否真是新問題。
4. **Miles 確認後開卡**：從骨架複製起手，依規範 - OQ 撰寫（檔名、序號、範圍宣告、段落紀律）；原識別處改 wiki link 引用。
5. **log 一筆**（同步(oq)）。

### Mode C：解答與封存

1. Miles 拍板 → 卡內補「決議」段（格式見規範 - OQ § 3.6：結論＋理由＋落地去處逐卡）。
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
另列：open 超過 30 天無進度、priority high 長期擱置、缺 expected-resolution-at 的 external 卡、違反規範 - OQ 稽核維度的卡（一卡多議題、互引複述）。

## 二、紅旗清單（操作面；撰寫面違規由規範 - OQ § 九稽核維度抓）

| 紅旗 | 為什麼錯 |
|------|---------|
| 在 Vault 卡用 `[!question]` callout 或「待確認」inline 標注卻不開檔 | OQ 必須是獨立卡才進得了佇列管理 |
| 口頭說「列為 OQ」卻沒觸發本 skill | 口頭承諾不會出現在平層 |
| 跳過去重直接開卡 | 重複 OQ 讓佇列失真、決議分裂兩處 |
| answered 卡長期留平層 | 平層數字失去「待辦壓力」意義 |
| 改寫封存卡的決議 | 決議是歷史；要翻案開新 OQ 引舊卡 |

## 三、與其他機制的協作

| 情境 | 協作 |
|------|------|
| vault-ingest mode A 識別「明確未解問題」 | 轉入本 skill mode B（素材觀察留 raw、問題進 OQ） |
| vault-audit 識別可批次結案的 OQ 群 | 走 mode C 逐張封存 |
| vault-audit 維度 8（OQ 健康度）／維度 12（依 type 載入規範 - OQ 稽核） | 巡檢平層超期／缺欄位／狀態違規，建議跑 mode E |
| Notion Follow-up DB | 對外確認版（external 專用），推送由 Miles 觸發；Vault 永遠是正本 |
| wiki/log.md | 每次 B／C／D／E 操作記一筆（同步(oq)） |
