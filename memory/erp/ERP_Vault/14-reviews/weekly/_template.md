---
type: review
review-kind: weekly
status: active
created-at: YYYY-MM-DD              # 該週週日（週末整理日）
period:
  start: YYYY-MM-DD                 # 該週週一
  end: YYYY-MM-DD                   # 該週週日
module:
  - cross-module
related-vault: []
related-commits: []
related-changes: []
---

# Weekly Review — <YYYY-WNN>

## 一、本週學到什麼（3-5 條）

> 從本週 raw / insight / 誤審記錄 / change archive 提煉。重點是**提煉**不是**複述**。
> 把「做了 X」轉成「學到 Y」：「我們做了 X，學到的是 Y（具體原則 / 模式 / 反例）」。
> 禁空洞讚美（「本週學到很多」）、禁無 source。

1. **<學到的具體原則 / 模式 / 反例>**
   - 來源：[[<raw / insight / 誤審 / change 卡>]]
   - 應用：未來在 X 場景應 Y / 已寫入 Z 卡

2. ...

## 二、本週完成什麼

### Commit 統計
- 本週 commit 數：<N>
- 主題分布：<feat: M / fix: K / docs: J / refactor: L>
- 重點 commit：
  - `<hash>` <標題>

### Change 進度
- 已 archive：<列表>
- 進入 implementation：<列表>
- 新 propose：<列表>

### OQ 統計
- 新增：<N> 個
- 解答：<N> 個（[[<列表>]]）
- 取消：<N> 個

### Raw 統計
- 新增：<N> 張（按 source 分組）
- 拆解（status=ingested）：<N> 張
- 同主題累積 ≥ 3 警示：<列表>

### Spec 異動
- <spec name>：<版本變化 + 主要 MODIFIED / ADDED / REMOVED>

## 三、下週重點（≤ 3 條）

> 1-3 條，每條兩段「現況 / Next action」+ 條列化。
> 排序依「相依性 > 優先度 > 時效性」。禁無 source、禁無 Next action、禁附產出位置 / 預估時間、禁混淆現況與動作。

### 1. <具體重點標題>

- **現況**：
   - <事實 1：本週狀態 / 觸發背景 / 影響範圍>
   - <事實 2：附 source wiki link / commit / change-id / insight>
   - 相依性：
      - 阻擋：<本重點完成才能輪到的下游 action / 卡 / change>
      - 被阻擋：<必須先完成才能輪到本重點的上游 action / 卡 / change>
- **Next action**：
   - <具體執行動作 1：明確可開始的第一步>
   - <具體執行動作 2：後續延伸動作（可選）>

### 2. ...

### 3. ...

## 四、開放議題（可選）

> 本週新冒出但未解決的疑問 / 矛盾 / 邊界情況。
> 若已升級為 OQ，引用 wiki link；若尚未，下週應走 oq-manage mode B 開檔。

- [[<oq-id>]] / 待開檔：<議題>
