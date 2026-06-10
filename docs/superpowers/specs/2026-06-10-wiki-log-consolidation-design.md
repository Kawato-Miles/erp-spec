# 設計：wiki 單一操作史收斂 + 發布狀態撤離

日期：2026-06-10
狀態：Miles 已核准
範疇：Sens_wiki 治理層（log 機制）+ Notion 發布管線狀態選址

## 一、問題

1. wiki 存在兩層只追加日誌：`wiki/log.md`（操作史，session 粒度）與 `wiki/erp/00-meta/changelog.md`（事件流 + 卡片索引 + 決策敘事混雜，1459 行）。同一異動記兩筆；卡片索引覆蓋率 < 10%（32 張卡聲稱「迭代脈絡見 [[changelog]]」，實際有 section 者至多 4 張），承諾已破產。
2. 34 張卡 frontmatter 帶 `notion-published-at` / `notion-page-url`——對外發布管線的執行狀態被寫進商業知識正本（BRD），wiki 與 Notion 耦合，且依賴人工回填紀律（已失守過一次：35 張卡全空致 delta 偵測失準）。

## 二、核心決策

1. **wiki/log.md 為全知識庫唯一只追加層**。changelog.md 原地凍結封存（status: archived、停更宣告、不改名不搬家，45 處既有連結零斷鏈）。
2. **卡 → 議題反查**由「搜 `[[卡名]]` 命中 log.md 條目」+ git 歷史取代手工索引。
3. **三層檢索模型**：卡本身（是什麼）→ log.md（何時改、改什麼、動機一句話）→ 決策層 = OQ 卡拍板紀錄 + explore 定案（皆 BRD 層自足）。OpenSpec 是下游 PRD，**不得作為 wiki 變更的動機來源**（BRD 先行，記條目時 change 尚不存在）。
4. **log 第一原則：寫入當下自足**（time-frozen completeness）——條目所有欄位資訊在寫入那一刻必須已存在，自動排除一切「未來資訊」欄位。
5. **log 第二原則：log 的世界裡只有 wiki**——觸發寫入的充要條件 = 本次操作動到 `wiki/`。
6. **log 第三原則：動機不外包**——實質異動條目動機行必填、業務語言、得連 [[OQ 卡]]；寫不出動機 = 決策未定案 = 不該改卡。
7. **發布狀態全部撤出 wiki（方案 A）**：`notion-published-at` / `notion-page-url` 兩欄位移除，狀態移入管線自持清單 `memory/erp/notion-publish-manifest.md`；發布行為全程不碰 wiki/，故 log 無「notion-publish」標籤——該情境被消滅而非被記錄。
8. **wiki-schema 加反向鐵則**：卡片 frontmatter 禁含外部系統狀態欄位（與「source 禁指 openspec」同性質的 schema 層防線）。

## 三、log.md 條目格式（定案）

```
## [YYYY-MM-DD HH:MM] 動作(標籤) | 一句話簡述
- 變更：[[卡A]] 一句話、[[卡B]] 一句話
- 動機：<業務理由，當下自足；得連 [[OQ卡]]>      ← 實質異動必填；健檢/納入類免
- 衝突：無（或：與 [[C]] 衝突，已開 [[OQ]]）
```

動作 enum（不變）+ 次級標籤（定案）：

| 動作 | 標籤 |
|---|---|
| 納入 | ingest-A / ingest-B / ingest-C / amend |
| 健檢 | audit / pre-check / insight / daily / weekly |
| 同步 | oq / misjudgement |
| 查詢 | （無標籤；高價值查詢固化成 insight 卡時記） |

已除名：`change-archive`（PRD 層事件不動 wiki）、`sync` / `notion-publish`（發布不再碰 wiki）。
變更行 MUST 逐卡 `[[卡名]]` + 一句話；禁「更新多張卡」粗寫。
超過約 2000 行時按年切檔（屆時再做）。

## 四、發布管線清單（新檔）

- 位置：`memory/erp/notion-publish-manifest.md`（與 spec-registry 同級：管線資料，非知識、非 skill 文件）
- 格式：表格——`卡 id | 卡路徑 | Notion URL | 最後推送日`
- 擁有者：`erp-user-story` mode B / `erp-test-case` / `oq-manage` 推送模式；推送成功後更新清單
- delta 判定：清單「最後推送日」對比卡 `last-reviewed` 與 git 異動；不在清單 = 從未推送
- 遷移：34 張卡現值先遷入清單再刪欄位（零資料損失）

## 五、執行批次

1. 規約先行：`.claude/rules/sens-wiki.md` § 四 + `wiki/log.md` 檔首格式說明
2. 凍結 `changelog.md`（frontmatter archived + 停更宣告，內容原樣）
3. 7 skill 改寫：vault-audit（+新檢查維度：異動卡有逐卡條目、動機行非空）/ vault-insight / vault-ingest / daily-brief / weekly-review / erp-planning-pre-check / wiki-amend（Step 4 刪卡為主鍵追加，改 log 品質要求）
4. 卡片批次：32 卡刪尾行「迭代脈絡見 [[changelog]]」+ 範本 5-6 張改措辭
5. 索引與路由：`wiki/index.md` + 根 `CLAUDE.md`
6. 發布狀態撤離：建 manifest（含遷移）→ 34 卡刪兩欄位 → wiki-schema 改條文 + 加禁令 → 3 skill 改讀寫清單
7. 驗證 + log.md 自記一筆（新格式首筆示範）+ commit

## 六、驗證（成功條件）

1. `grep -rn "00-meta/changelog" .claude CLAUDE.md` → 0 筆
2. `grep -rl "迭代脈絡見 \[\[changelog\]\]" memory/Sens_wiki/wiki` → 0 檔
3. `grep -rl "notion-published-at" memory/Sens_wiki/wiki` → 0 檔
4. manifest 筆數 ≥ 34 且抽查 URL 與卡對應正確
5. obsidian unresolvedLinks 不增加
6. 模擬 daily-brief § 5.2 grep 對 log.md 可取出當日條目

## 七、root cause 紀錄（防重蹈）

- changelog 索引與 notion 回填同屬一個反模式家族：**手工重複狀態 + 依賴回填紀律 → 必然漂移**。兩案的失敗證據都先於本次重構出現（索引覆蓋 < 10%；回填整批漏失）。
- 決策準則固化：狀態存放跟著「誰產生、誰消費」走——管線狀態歸管線，知識正本零外部欄位；歷史歸 log 與 git，卡本體零迭代史。
