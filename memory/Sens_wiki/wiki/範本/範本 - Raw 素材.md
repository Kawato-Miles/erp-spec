---
type: raw
status: raw
created-at: {{date}}   # Obsidian 插入自動帶入；AI 複製起手時手填今日日期
source: miles-dialogue | claude-research | claude-self-capture | prototype-dogfood | mes-study | miles-upload
captured-by: miles | claude-on-task | claude-self
module:
  - 跨模組
topic-tag:
  - <自由標籤>
related-vault:
  - "[[候選相關卡]]"
raw-source-link: <對話片段 / WebFetch URL / Slack URL / 原始檔出處>
attached-files:  # source=miles-upload 必填；其他可選；不需要時刪除整個欄位
  - "_attachments/<檔名>"
ingested-at: YYYY-MM-DD    # status=ingested 時填（mode B 完成）
ingested-to:               # status=ingested 時填，列寫入的既有卡
  - "[[<寫入的既有卡>]]"
---

# <主題標題>

## 原始素材

<一字不漏的 raw 內容 ── 對話片段 / WebFetch 摘要 + URL / Prototype 試用紀錄 / Miles 觀察原話 ── 不要在這層加自己的解釋>

## 第一輪初步分析（Claude 寫）

- 觀察：<1-3 條與既有 vault 的關聯>
- 候選相關卡：[[X]] / [[Y]]
- 候選 OQ 候補：<若有，或標「無」>
- 候選升級路徑：business-logic / scenario / OQ / insight / 不升級

## 待精練（Mode B 處理）

- [ ] 是否更新既有 vault 卡
- [ ] 是否升級為 OQ（觸發 oq-manage mode B）
- [ ] 是否累積成 insight（≥ 3 張同主題後觸發 vault-insight）

## 精練去處（Mode B 完成後填）

<!-- Mode A 寫入時保留下方註解樣板不填；Mode B 完成後以實際 wiki link 清單取代整段註解 -->

<!-- Mode B step 6 寫入後在此列出 wiki link：
- [[../04-business-logic/X]] — 新增 § A
- [[../08-open-questions/Y-001-Z]] — 升級為 OQ
- 取消（理由：...）
-->

<!-- 起手提醒（填完刪除本註解）：命名規約、各 mode 流程、Anti-Model-Collapse 四道防線見 .claude/skills/vault-ingest/SKILL.md 與 raw/README.md；共用治理（流程／停下鐵則／紀律）見 00-meta/卡片撰寫共用規範 -->
