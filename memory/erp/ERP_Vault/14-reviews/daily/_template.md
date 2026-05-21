---
type: review
review-kind: daily
status: active
created-at: YYYY-MM-DD
period:
  start: YYYY-MM-DD
  end: YYYY-MM-DD
module:
  - cross-module
related-vault: []
related-commits: []
related-changes: []
---

# Daily Brief — <YYYY-MM-DD>

## 一、今日建議行動

> 1-3 條，每條兩段「現況 / Next action」+ 條列化（類似會議紀錄）。
> 排序依「相依性 > 優先度 > 時效性」。禁無 source、禁無 Next action、禁附產出位置 / 預估時間、禁混淆現況與動作。

### 1. <具體 action 標題>

- **現況**：
   - <事實 1：當前狀態 / 觸發背景 / 影響範圍>
   - <事實 2：附 source wiki link / commit / change-id>
   - 相依性：
      - 阻擋：<本 action 完成才能輪到的下游 action / 卡 / change>
      - 被阻擋：<必須先完成才能輪到本 action 的上游 action / 卡 / change>
- **Next action**：
   - <具體執行動作 1：明確可開始的第一步>
   - <具體執行動作 2：後續延伸動作（可選）>

### 2. ...

### 3. ...

## 二、昨日進度摘要

### Commits（過去 24 小時）
- `<hash 短碼>` <commit 標題> — <wiki link 影響卡>
- ...

### Vault 異動事件（audit-log）
- [<HH:MM>] <event-tag> | <主題簡述> → [[<wiki link>]]
- ...

### OQ 異動
- 新增：[[<oq-id>]] — <一句話>
- 解答：[[<oq-id>]] — <解答摘要>
- 取消：[[<oq-id>]] — <取消理由>

### Change 進度
- <change-id>：<狀態變化>（如 propose → design / design → tasks / 進入 implementation / archive）

## 三、警示與提醒（可選）

- vault-audit 觸發條件達標：<具體閾值>
- raw 累積：<status=raw 總數 / 同主題累積警示>
- 未推 Notion 變動：<列出>
