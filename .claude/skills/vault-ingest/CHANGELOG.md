# vault-ingest 版本紀錄

只追加層：記每次改動與理由。最新在下。SKILL.md 本體只寫現行規則，不載入本檔。

## 2026-11-04 完整重寫

- 依 skill、CLAUDE.md、派工範本重構計畫批次 4（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.9、§ 9-3）改成共用骨架：目標、產出、限制、順序、情況對應檔案、陷阱。
- 新增調研路徑：erp-plan 調研建議經 Miles 同意後，派 `erp-researcher`（`.claude/agents/erp-researcher.md`）；派工單見 `references/調研派工單.md`（M1）。
- claude-research 卡新增查證紀錄段，主對話抽查後才寫入；格式見 `references/查證紀錄格式.md`。起因：2026-10-29 claude.dev 調研卡靠主對話抽查才更正一處摘錄錯誤。
- 精練去處加參考模型卡，寫明業務正本卡不收業界做法（M1、M2）；去處表移到 `references/去處表.md`。
- 門檻值（10 張、同主題 3 張、30 天、5 天）集中到 `references/掃描報告格式.md`（P6）。
- 防線四條與自我迭代拒絕場景保留原文；紅旗清單併入限制段與陷阱段。
- 修正舊版 mode B 步驟跳號（步驟 4 後接 6）。
