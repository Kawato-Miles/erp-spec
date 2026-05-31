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

## 一、今日

### 1.1 建議行動（≤ 3 條）

> 每條兩段「現況 / Next action」+ 條列化。排序依「相依性 > 優先度 > 時效性」。

#### 1. <具體 action 標題>

- **現況**：
   - <事實 1：當前狀態 / 觸發背景 / 影響範圍>
   - <事實 2：附 source wiki link / commit / change-id>
   - 相依性：
      - 阻擋：<本 action 完成才能輪到的下游 action / 卡 / change>
      - 被阻擋：<必須先完成才能輪到本 action 的上游 action / 卡 / change>
- **Next action**：
   - <具體執行動作 1：明確可開始的第一步>
   - <具體執行動作 2：後續延伸動作（可選）>

#### 2. ...

#### 3. ...

### 1.2 反目標（Anti-goals，0-3 條，可選）

> 「今日要避免做的事」— 防 scope creep / 守紀律。對應本日具體誘惑或慣性弱點，禁空洞。

- 不<動詞>：<簡述 + 防什麼>

## 二、昨日

### 2.1 進度摘要

#### Commits（過去 24 小時）
- `<hash 短碼>` <commit 標題> — <wiki link 影響卡>

#### Vault 異動事件（audit-log）
- [<HH:MM>] <event-tag> | <主題簡述> → [[<wiki link>]]

#### OQ 異動
- 新增：[[<oq-id>]] — <一句話>
- 解答：[[<oq-id>]] — <解答摘要>

#### Change 進度
- <change-id>：<狀態變化>

### 2.2 決策紀錄（0-N 條）

> 昨日做了哪些設計 / 範疇 / 取捨決策？只記設計層決策，禁記執行細節。

- **決策**：<決策標題>
   - 脈絡：<為何要做這決策 / 觸發背景>
   - 選擇：<最終選了什麼>
   - 理由：<為何這選擇 / 排除了什麼選項>
   - source：[[<相關卡 / commit / change>]]

### 2.3 學到 1-2 條

> 昨日即時抓的觀察（與 Weekly「本週學到」差異：daily 是當下抓、weekly 是跨日累積提煉）。1-2 條為限，禁空洞。

- **觀察**：<簡述>
   - 來源：[[<相關卡 / commit / 事件>]]
   - 暫存提示：未來 weekly review 時可重看是否累積成系統性議題

## 三、警示與提醒（可選）

- vault-audit 觸發條件達標：<具體閾值>
- raw 累積：<status=raw 總數 / 同主題累積警示>
- 未推 Notion 變動：<列出>
