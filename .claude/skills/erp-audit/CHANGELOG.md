# erp-audit 版本紀錄

只追加層：記每次改動與理由。最新在下。

## 2026-11-02 初版

- 併入 plan-audit 與 misjudgement-record 兩個 skill，依 skill、CLAUDE.md、派工範本重構計畫批次 3（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.5、§ 2.6、§ 9-3）。
- 新增：收件檢查腳本、稽核者派工單、推演者派工單、誤判要素、評測集指引；稽核者定義檔 `.claude/agents/plan-auditor.md`。
- 判定值改三值（通過、未通過、待裁決），輪數上限與回源門檻引評分準則卡 § 九（D2 拍板）。
- 新增懷疑者過濾步驟；主對話抽驗改為每輪必做，不限高嚴重度。
- 舊 plan-audit 與 misjudgement-record 留轉介檔，批次 6 移除。

## 2026-11-04 驗證

- 注入版 1 召回 6／6（兩次）；注入版 2 召回 5／8、4／8，兩次都漏 J1、J3、J6；判定噪音 6 項含歸屬差異；D8 Fable 不高於 Opus，plan-auditor 維持 opus。詳見 `memory/erp/skill-rewrite-20261029/評測集/基線結果.md` § 八。

## 2026-11-04 批次 6

- 刪除轉介檔 `.claude/skills/plan-audit/` 與 `.claude/skills/misjudgement-record/`；`openspec/config.yaml`、`openspec/schemas/` 與 11 層卡的舊名引用改指本 skill。

## 2026-11-04 OpenSpec 退場，改接 matt 流程

起因：Miles 拍板 Q3、Q10、Q12，並指示稽核方式配合 matt（必含條件不變）。稽核對象由 design.md 改為 `.scratch/<主題>/spec.md`；`收件檢查.py` 改為檢查 matt `to-spec` 七節，不再比對必含段標題與 grill.md；必含內容是否齊備改由稽核者在 spec.md 全文逐條判定；audit-rN.md 落點改為 `.scratch/<主題>/`。
