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

## 三、未完成原因分析（0-N 條，Yu WAM 核心）

> 本週列入計畫但未完成的事項，分析「為什麼沒做完」 — 找系統性瓶頸，不是執行力責備。
> 阻塞點是表層，根因 MUST 多問一層為什麼。

- **未完成項**：<事項>
   - 阻塞點：<具體原因 — 等待 / 缺資料 / 範疇過大 / 優先級被超車 / 系統設計 gap>
   - 根因：<更深一層 — 是制度 / 流程 / 資源 / 知識空缺問題>
   - 下週對策：<改流程 / 改 skill / 加資源 / 拆任務>

## 四、決策品質回顧（1-3 條）

> 本週重要決策的邏輯回顧（不論結果） — 找決策模式，不是列舉所有決策。

- **決策**：<本週重要決策標題>
   - 脈絡 + 選擇 + 理由（簡述）
   - 邏輯完整性：<完整 / 有 gap — 哪個層面缺資料 / 缺視角>
   - 事後檢視：<目前看是否仍合理 / 已有反證 / 待驗證>
   - source：[[<相關卡 / commit>]]

## 五、下週重點（≤ 3 條）

> 1-3 條，每條兩段「現況 / Next action」+ 條列化。
> 排序依「相依性 > 優先度 > 時效性」。

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

## 六、Pre-mortem 預警（0-3 條）

> 想像下週重點都做完但結果不如預期 — 可能是什麼原因踩雷？
> 風險 MUST 具體（「可能因為 X 導致 Y」），焦點是執行踩雷而非策略方向錯誤。

- **下週重點 N**「<標題>」可能踩雷：
   - 風險：<具體場景>
   - 預防：<下週執行時要先檢查什麼 / 哪個前置條件>

## 七、開放議題（可選）

> 本週新冒出但未解決的疑問 / 矛盾 / 邊界情況。
> 若已升級為 OQ，引用 wiki link；若尚未，下週應走 oq-manage mode B 開檔。

- [[<oq-id>]] / 待開檔：<議題>
