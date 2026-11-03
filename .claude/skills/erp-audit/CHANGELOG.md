# erp-audit 版本紀錄

只追加層：記每次改動與理由。最新在下。

## 2026-11-02 初版

- 併入 plan-audit 與 misjudgement-record 兩個 skill，依 skill、CLAUDE.md、派工範本重構計畫批次 3（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.5、§ 2.6、§ 9-3）。
- 新增：收件檢查腳本、稽核者派工單、推演者派工單、誤判要素、評測集指引；稽核者定義檔 `.claude/agents/plan-auditor.md`。
- 判定值改三值（通過、未通過、待裁決），輪數上限與回源門檻引評分準則卡 § 九（D2 拍板）。
- 新增懷疑者過濾步驟；主對話抽驗改為每輪必做，不限高嚴重度。
- 舊 plan-audit 與 misjudgement-record 留轉介檔，批次 6 移除。
