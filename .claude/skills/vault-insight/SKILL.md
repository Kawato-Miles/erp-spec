---
name: vault-insight
description: >
  ERP_Vault 跨主題模式識別與下一步提煉 skill，產出 `12-insights/` 卡。
  觸發：Miles 說「跑 insight」「精練 insight」「找下一步」「找系統性議題」；建議時機——open OQ 達 15 個、Phase 切換 / change archive 後、vault-audit 發現 ≥ 5 個 Error。
  不適用：Vault 健康 lint（用 vault-audit）、日／週回顧（用 daily-brief / weekly-review）、單一卡片問題（直接編該卡）、OQ 解答（裁決權在 Miles）。
  範圍鐵則（只讀 wiki/＋raw/ 的 ingested / reviewed，禁讀 status=raw）與步驟見本文。
---

# vault-insight

## 〇、定位（每條規則從這裡推導）

**insight＝「從觀察到推論到下一步」的提煉**：把散在多張卡的訊號聚成系統性議題，產出帶具體行動的 insight 卡（`12-insights/`）。對標 Karpathy LLM Wiki 的 Query 操作——有價值的合成不留在對話，回存為新頁面。

**insight 不是什麼**：不是 lint（矛盾／死鏈／缺欄位歸 vault-audit）；不是進度報告（完成統計歸 weekly-review）；不是 OQ 解答（裁決權在 Miles，insight 只聚類與建議處理順序）。

**會過時的不寫進 skill**：本 skill 的輸入素材一律用「目錄＋frontmatter 條件」定義，禁止錨定具體卡名或當下的議題實例——卡會演進、議題會關閉，實例錨定是 skill 過時的根因。

## 一、輸入（依觸發情境取素材，條件式定義）

| 觸發 | 素材集合 |
|------|---------|
| 手動／通用 | `08-open-questions/` 全部 status=open 卡＋`wiki/log.md` 最近 10 筆＋`12-insights/` 現有 status=open／in-progress 卡 |
| OQ 累積 | 同上，聚焦 OQ 聚類 |
| Phase 切換 | `01-products/` 的階段與指標卡＋其 wiki 內支撐卡（04／05／06／07 各層） |
| change archive 後 | 本輪 git 異動的 wiki 卡（`git diff --name-only`）＋其相關卡 |
| audit 接續 | audit 報告中 Error／Warning 項對應的卡 |
| raw 同主題累積 | 該主題 raw 卡，**MUST 過濾只取 status=ingested／reviewed** |

## 二、步驟

1. **防重複**：讀 `wiki/log.md` 最近條目與 `12-insights/` 現有 open／in-progress 卡。同主題已有 open insight → 補強既有卡、不新建。
2. **讀素材**：依 § 一取素材集合。
3. **模式識別**（找 pattern、不逐筆列舉）：
   - **OQ 聚類**：對 open OQ 萃取核心問題類型（角色／流程／欄位／計算／…），同類 ≥ 3 個＝系統性議題候選
   - **可批次關閉群**：已被後續拍板實質解消、只差收割的 OQ
   - **卡間冗餘或矛盾訊號**：同一規則在多卡重述、措辭分歧（深度比對歸 audit 維度 1，這裡只收聚類級訊號）
   - **變動熱點**：`git log --since="30 days ago"` 統計近期高頻異動卡——設計仍在收斂的訊號
   - **KPI 支撐缺口**：階段指標卡宣告的目標，在 wiki 內找不到支撐卡（04 規則／05 實體／07 情境）或被 OQ 堵住——只以 wiki 內證據判斷，實作側落實進度不在本 skill 範圍（標注「需 Miles 補充實作側狀態」）
   - **raw 累積**：同主題 raw（status≠raw）≥ 3 張浮現的共通議題
4. **產出前自查（稽核閘門，任一不過＝不產卡並回報跳過原因）**：
   - [ ] 已防重複（§ 二步 1）
   - [ ] 觀察 ≥ 3 條，每條都指向具體卡／OQ／commit
   - [ ] 推論明確指出「同一根因」或「現象命名」，不是觀察的複述
   - [ ] 每條下一步含：誰＋何時＋做什麼＋預期結果
   - [ ] 範圍未越界（未引用 OpenSpec／Prototype 內容）
5. **產 insight 卡**（§ 三範本）＋**追加 log**（§ 三格式）＋對話報告（識別出的 insight 清單＋優先序建議）。

## 三、輸出

**insight 卡**：`12-insights/<YYYY-MM-DD>-<主題>.md`

```markdown
---
type: insight
module:
  - <中文 module，見 wiki-schema>
business-domain:
  - <六領域或跨領域>
status: open          # open / in-progress / resolved / cancelled
priority: <high|medium|low>
raised-at: YYYY-MM-DD
raised-by: vault-insight skill
triggered-by: <manual / oq-accumulation / phase / change-archive / audit / raw>
related-vault:
  - "[[<相關卡>]]"
related-oq:
  - <OQ 全檔名 wiki link（帶別名），禁短名>
related-raw:
  - "[[raw/<檔名>]]"   # 若素材含 raw；MUST status=ingested / reviewed
expected-action-at: YYYY-MM-DD
---

## 背景
<觸發情境，一段>

## 觀察
1. <事實>（[[來源卡]]）
2. …（≥ 3 條，每條有來源）

## 推論
<觀察聚成什麼系統性議題／根因，1-3 段>

## 下一步建議
1. [誰] [何時] [做什麼] → [預期結果]
2. …

## 後續更新
（status 變化時追加；resolved 後移 `12-insights/_archives/<YYYY>/` 並記 log）
```

**log 條目**（動作=健檢、標籤=insight，最新在上）：

```markdown
## [YYYY-MM-DD HH:MM] 健檢(insight) | <觸發來源>
- 變更：產出 [[<insight 卡>]]；關鍵推論一句；下一步 N 條
- 動機：免（健檢類）
- 衝突：無（或：識別到矛盾已開 [[OQ]]）
```

## 四、紅旗清單（出現任一＝停下重做）

| 紅旗 | 為什麼錯 |
|------|---------|
| 「Vault 結構良好、資料完整」式總結 | 空洞讚美零行動價值；沒有 insight 就不產卡 |
| 推論只是觀察複述（「有 4 個角色 OQ，這是趨勢」） | 缺「所以呢」——要嘛指根因要嘛給處理順序 |
| 下一步缺誰／何時／預期結果 | 不可執行的建議等於沒建議 |
| 結論無來源卡可追溯 | Miles 無從查證 |
| 引用了 OpenSpec／Prototype 內容當證據 | 範圍越界；實作側狀態標注請 Miles 補充 |
| 同主題重複開卡 | 補強既有卡，脈絡才連續 |
| 讀了 status=raw 的 raw 卡 | 未確認素材會自我放大（model collapse） |

**正例形態**（示意，非實名）：N 個 open OQ 中 K 個同屬「某類邊界」→ 推論「該邊界缺單一正本」→ 下一步「Miles 於某日前拍板正本歸屬＋Claude 同輪收割 K 個 OQ」。

## 五、與其他 skill 的協作

| 情境 | 協作 |
|------|------|
| audit 發現 ≥ 5 Error | vault-audit 自動建議跑本 skill |
| insight 識別出可關閉 OQ 群 | 收割走 `oq-manage` mode C |
| insight 識別出矛盾 | 開 OQ（`oq-manage` mode B），不自行調和 |
| insight resolved | 移 `_archives/<YYYY>/`＋log 一筆 |
| raw 同主題累積 | 與 `vault-ingest` mode B 協同（精練先行、insight 聚類） |
