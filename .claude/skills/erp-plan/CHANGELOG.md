# erp-plan 版本紀錄

只追加層：記每次改動與理由。最新在下。SKILL.md 本體只寫現行規則，不載入本檔。

## 舊版歷史（erp-planning-pre-check，原檔搬入）

| 版本 | 日期 | 變動 |
|------|------|------|
| v1.0 | 2026-05-28 | 初版建立（6 領域 × 7 卡類型雙軸 + 5 SOP 含閉環 + 執行者稽核者分離 + 五大反模式追蹤）|
| v1.1 | 2026-05-30 | Step 4 + ack 模板 + changelog 模板新增「wiki 商業邏輯卡清單 + 定案後回補清單」產出（pre-check 不修卡、交棒 archive 階段回補）。原因：converge change 漏對齊 wiki 6 卡 — 規劃時沒列受影響 wiki 卡，archive 後也就漏回補；補「pre-check 不修卡 → 定案後回補」配對步驟 |
| v1.2 | 2026-06-10 | 稽核操作史輸出由 `00-meta/changelog.md` 改為 wiki/log.md 一筆（動作=健檢、標籤=pre-check，只記摘要：量化矩陣結論 + 修補卡清單），長敘事與決策軌跡留對話與 OQ 卡。原因：`00-meta/changelog.md` 凍結封存，wiki/log.md 成全知識庫唯一只追加操作史 |
| v1.3 | 2026-06-13 | 卡類型由 7 類收斂為 6 類（原「情境」與「User Story」合併為「業務情境」），跨層追溯由四層（含 Test Case）改三層（商業需求 ↔ 業務情境 ↔ spec），移除 related-test-cases 必檢；SKILL 本體、references/audit-framework.md、`.claude/workflows/erp-precheck-audit.js` 三方同步。原因：使用者故事與 test-case 單元溶解、業務情境單元取代（Phase B / C）|
| v1.4 | 2026-07-28 | 載入層改版：Step 1 觸發詞複本表刪除（正本只在 taxonomy，含「語意不確定先與 Miles 確認」）；Step 2 改依 taxonomy 檢索規約（tag 查卡名清單 → 呈現 → 載入），共用層固定全載清單刪除（改 `領域/全域` 哨兵卡必載）。原因：wiki 領域 tag 化 P3 切讀取端（plan wiki-tag-migration）|

plan-design 舊版沒有版本紀錄；其改動見 git 歷史。

## 2026-11-04 初版

- 併入 erp-planning-pre-check、plan-design 與 `.claude/workflows/erp-precheck-audit.js`，依 skill、CLAUDE.md、派工範本重構計畫批次 4（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.3、§ 2.4、§ 2.12、§ 9-3；D16 採乙）。
- 新增調研判斷：precheck.md 每次都有調研建議段，Miles 同意後轉 vault-ingest 派 erp-researcher（M1）。
- 探索時的衝突檢查與訪談紀律，自 `openspec/config.yaml` 舊 rules.explore 三條歸位到 `references/衝突檢查.md`（§ 7-4）。
- 刪五步作業程序、閉環驗證步、反模式清單、回合預算與單次領域數上限；門檻只留評分準則卡 § 九。理由：只寫目標、限制、陷阱（P2）；門檻只寫一處（P6）。
- 帳務專屬寫法（七實體影響清單、BI-／ORD- 雙系列）改為依領域查；沒有連帶矩陣的領域寫「沒有」。
- 必含段內容標準不再複寫，改引評分準則卡 § 二；新增設計陷阱段，取自 rush-order-definition audit-r1。
- 平行盤點搬進 `references/平行盤點.workflow.js`：提示改為讀 SKILL.md 與盤點方法.md；schema 加調研建議、缺口分類、連帶矩陣來源；模型與 effort 改由參數傳入，預設值寫在 SKILL.md。
- [[audit-failure-patterns]] 有案例的條目（Over-report、角色卡參與階段）移入 SKILL.md 陷阱段；該卡本身未動，去留另案處理。
- 舊兩個 skill 留轉介檔，批次 6 移除。

## 2026-11-04 驗證

- 觸發評測規劃類 105 句：舊版 26、32 句，新版 83、83 句；噪音 18 → 8；反例零誤觸發。pre-check 回放三案涵蓋 96%、74%、100%。詳見 `memory/erp/skill-rewrite-20261029/評測集/基線結果.md` § 九。

## 2026-11-04 批次 6

- 刪除轉介檔 `.claude/skills/erp-planning-pre-check/`（含 references/audit-framework.md；CHANGELOG 已於初版併入上方舊版歷史）與 `.claude/skills/plan-design/`；`openspec/config.yaml`、`openspec/schemas/` 與 11 層卡的舊名引用改指本 skill。
