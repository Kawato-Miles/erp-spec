# erp-planning-pre-check 版本歷史

只追加層。SKILL.md 本體只寫現行規則，不載入本檔。


| 版本 | 日期 | 變動 |
|------|------|------|
| v1.0 | 2026-05-28 | 初版建立（6 領域 × 7 卡類型雙軸 + 5 SOP 含閉環 + 執行者稽核者分離 + 五大反模式追蹤）|
| v1.1 | 2026-05-30 | Step 4 + ack 模板 + changelog 模板新增「wiki 商業邏輯卡清單 + 定案後回補清單」產出（pre-check 不修卡、交棒 archive 階段回補）。原因：converge change 漏對齊 wiki 6 卡 — 規劃時沒列受影響 wiki 卡，archive 後也就漏回補；補「pre-check 不修卡 → 定案後回補」配對步驟 |
| v1.2 | 2026-06-10 | 稽核操作史輸出由 `00-meta/changelog.md` 改為 wiki/log.md 一筆（動作=健檢、標籤=pre-check，只記摘要：量化矩陣結論 + 修補卡清單），長敘事與決策軌跡留對話與 OQ 卡。原因：`00-meta/changelog.md` 凍結封存，wiki/log.md 成全知識庫唯一只追加操作史 |
| v1.3 | 2026-06-13 | 卡類型由 7 類收斂為 6 類（原「情境」與「User Story」合併為「業務情境」），跨層追溯由四層（含 Test Case）改三層（商業需求 ↔ 業務情境 ↔ spec），移除 related-test-cases 必檢；SKILL 本體、references/audit-framework.md、`.claude/workflows/erp-precheck-audit.js` 三方同步。原因：使用者故事與 test-case 單元溶解、業務情境單元取代（Phase B / C）|
| v1.4 | 2026-07-28 | 載入層改版：Step 1 觸發詞複本表刪除（正本只在 taxonomy，含「語意不確定先與 Miles 確認」）；Step 2 改依 taxonomy 檢索規約（tag 查卡名清單 → 呈現 → 載入），共用層固定全載清單刪除（改 `領域/全域` 哨兵卡必載）。原因：wiki 領域 tag 化 P3 切讀取端（plan wiki-tag-migration）|
