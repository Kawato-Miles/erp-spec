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

> 基於未完 change / 高優 OQ / Phase 進度 / 未踐 insight action 推出。
> 禁無 source、禁無下一步。

1. **<重點標題>**
   - 為何下週做：<指向具體 [[相關卡 / change / OQ / insight]]；說明相依性 / 優先度 / 時效性其中一個或多個>
   - 下一步：<具體可開始的第一步>
   - 相依性：<上游：X / 下游：Y / 平行：Z；無相依時寫「獨立」>

2. ...

3. ...

## 四、開放議題（可選）

> 本週新冒出但未解決的疑問 / 矛盾 / 邊界情況。
> 若已升級為 OQ，引用 wiki link；若尚未，下週應走 oq-manage mode B 開檔。

- [[<oq-id>]] / 待開檔：<議題>
