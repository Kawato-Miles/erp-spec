# wiki 落卡任務書：出貨單裝箱資料與物流單拆分

## 〇、開工前 MUST 載入（skill wiki-amend § 〇，不得跳過）

根目錄 R＝`/Users/b-f-03-029/Sens/.claude/worktrees/optimistic-nobel-9c65fb/memory/Sens_wiki/wiki`

1. `R/erp/00-meta/卡片撰寫共用規範.md` 全文（§ 二、§ 二之三跨卡撰寫順序、§ 三停下鐵則、§ 四、§ 四之二 L1 稽核維度）
2. 你負責卡型的 `規範 - <單元名>`（在各卡型目錄）、`R/範本/範本 - <單元名>`（新卡從骨架複製）、`範例 - <單元名>`（通過樣本）
3. `R/erp/00-meta/wiki-schema.md` § 四（frontmatter）、`R/erp/00-meta/scope-boundary.md`
4. 句法：`/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`、`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`
5. skill 流程：`/Users/b-f-03-029/Sens/.claude/skills/wiki-amend/SKILL.md`（照它的 Step 0～3、Step 5 做；Step 4 log 與 Step 6 下游更正由主對話做，你不做）

## 一、內容正本（要寫進 wiki 的設計）

資料夾 `/Users/b-f-03-029/Sens/.claude/worktrees/optimistic-nobel-9c65fb/memory/erp/plans/_archives/2026/shipment-logistics-split-20261020/`：

| 檔 | 用途 |
|---|---|
| design.md | **唯一內容正本**：本體 § 一～§ 十一、總覽差異、必含段。與其他檔衝突時以它為準 |
| grill.md | 拍板理由（G1～G30、D1～D19）；§ 二～§ 四衍生表已過時，不要取用 |
| audit-r1～r4.md | 稽核處置，看設計為什麼這樣寫 |

Miles 2026-10-20 已確認：D1～D19 與 G30 設計者補定照預設值落卡（即 Prototype 現行行為）。

## 二、硬規則

- 只寫 design.md 有的內容，不自創名詞、規則或例外（名詞溯源）。
- 正本卡零迭代史：不寫「原本是 X、改成 Y」「翻案」等字；理由寫在 frontmatter source。
- 單一正本：同一規則只寫在家卡，其他卡用 `[[卡名]]` 引用，不重述。關聯與基數正本在資料結構總覽卡，實體卡「關鍵關聯」只寫視角摘要。
- 依賴未決 OQ 的地方，用 wiki link 引用 OQ 卡：[[SHP-023-第三方物流部分送達與誤報配達的處理路徑]]、[[SHP-024-實際出貨日取最晚離廠後的判定穩定性]]、[[SHP-025-保密代寄在各物流商的支援範圍]]。禁 `[!question]` callout、禁 inline「待確認」措辭。遇到 design.md 沒定、又非寫不可的不確定項：停下，寫進回報，不自行補。
- 遇到既有卡與 design.md 矛盾、而 design.md 沒標要改：停下並排呈報，不自行調和。
- `source` frontmatter 加一條：`"Miles 2026-10-20 拍板（出貨單裝箱資料與物流單拆分 grill，Sens memory/erp/plans/_archives/2026/shipment-logistics-split-20261020/grill.md G?、D?）：一句話"`，禁指 openspec。
- wiki link 一律 `[[完整卡名]]`，不用別名；mermaid erDiagram 中文實體名加雙引號。
- block-level 改寫：只改受影響段落，不整卡重寫（新卡除外）。`last-reviewed` 改為 2026-10-20。
- 不碰 `wiki/log.md`、`wiki/index.md`、`08-open-questions/`（主對話處理）。不 git add、不 commit。
- 用詞：出貨單狀態「已裝箱」「等待出貨」「已出貨」「運送中」「異常」「已送達」「已作廢」；集合詞「未出貨動作」「部分離廠」「全數離廠」；物流單狀態照 design § 六之二；出貨動作＝拋單／出貨確認／標記可自取。

## 三、回報

1. 逐卡：新增或修改＋改了哪些段＋一句話。
2. 新增的活動編號、操作編號、單據代碼對照（後續批次要引用）。
3. L1＋該卡型 L2／L3 自審結果（逐卡型列未過項，無則寫無）。
4. 停下呈報的矛盾或不確定項。
