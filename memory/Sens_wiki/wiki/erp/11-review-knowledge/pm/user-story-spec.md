---
type: meta
status: active
last-reviewed: 2026-05-19
---

# User Story 撰寫規格

> [senior-pm](../../../../../.claude/agents/senior-pm.md) 偵測到功能缺少對應 User Story 時，依此規格起草草稿，放入 [[senior-pm-write-mode]] Mode B 寫入計畫。

## 一、適用時機

| 觸發 | 動作 |
|------|------|
| 前期介入 / BRD 審查發現新功能無對應 User Story | 起草新 US 草稿，放入 Mode B Phase 1 寫入計畫 |
| Miles 直接指定撰寫 US | 同上 |

**MUST NOT** 只說「建議補充 User Story」而不提供草稿。

## 二、資料正本與發布版本

| 層 | 位置 |
|---|------|
| 正本（工作版本）| 各模組 [OpenSpec spec § Scenarios](../../../../openspec/specs/) 嵌入 |
| 發布版本（對外確認）| [Notion User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d) |

## 三、起草前必須執行

查詢 Notion DB 現有最大編碼序號：

```
mcp__notion__notion-query-database-view
- database: 32c3886511fa808d8cb7db5c7af8ce6d
- sort: 編碼 desc
- limit: 1
```

新 US 編碼 = 現有最大序號 + 1（格式 `US-XXX`）。

## 四、欄位規範

| 欄位 | 類型 | 填寫規則 |
|------|------|---------|
| 編碼 | text | `US-XXX`，依查詢結果遞增 |
| 名稱 | title | 簡短描述，格式：`[角色] [動作] [目的]`，例：「業務建立需求單」 |
| 作為 | relation | 對應執行此故事的角色（業務 / 印務主管 / 生管…）|
| 我希望 | text | 使用者想完成的具體動作 |
| 以便 | text | 完成此動作帶來的業務價值 |
| 前置條件 | text | 故事成立的前提；若無則填「無」 |
| 流程說明 | text | 操作步驟，編號條列 |
| 成功條件 | text | 可測試的驗收標準 |
| 優先度 | select | 高 / 中 / 低（對應 BRD P0/P1/P2）|
| 流程 | select | 主要流程 / 優化流程 |
| 涉及模組 | multi-select | 依涵蓋模組勾選 |
| Feature | relation | 關聯至 Feature DB 對應模組頁面 |

## 五、撰寫原則

- **「我希望」聚焦動作**，**MUST NOT** 寫技術實作細節
- **「我希望」單句 ≤ 30 字 + 單一動作**（2026-05-21 新增）：超過則違反 INVEST Small，**MUST** 拆 user story
- **「以便」聚焦業務價值**，**MUST NOT** 寫「因為系統需要」
- **「以便」量化優於定性**（2026-05-21 新增）：能量化的業務價值優先量化（如「不合格率 KPI 排除技術退件後反映真實品質」優於「KPI 統計準確」）
- **「成功條件」必須可測試**，避免「使用者感到滿意」等模糊描述
- **「成功條件」每條單一可驗證行為**（2026-05-21 新增）：若一條塞多個業務規則（如「合格須上傳檔案 + 推進製程 + 終態不可變」），**MUST** 拆為多條；超過 5 條時反向觸發拆 user story
- **一條 User Story 只描述一個角色的一個需求**；若跨角色，**MUST** 拆成多條
- **下游連鎖反應不入本 US**（2026-05-21 新增）：如「合格 → 自動建工單」「終態 → 棄用 + 建新印件」屬下游模組或跨模組情境的職責，本 US 以 wiki link 引用 [[07-scenarios]] 或對應 spec 處理，不在本 US 重複描述實作邏輯
- **禁 anchor 故事**（2026-05-22 新增）：**MUST NOT** 建立「統合多角色 / 多動作的 user story」作為總分結構入口。理由：違反 INVEST Independent（每張 user story MUST 描述單一角色的單一情境）；統合卡造成維護困難（改一處要回溯統合卡）+ 隱藏相依性。**跨多角色 / 多動作的端到端流程 MUST 由 [[07-scenarios]] 處理**（07-scenarios 既有定義為「跨模組業務情境」，2026-05-22 擴展涵蓋「跨模組或跨角色的端到端流程」）
- **相依性以 prerequisites 欄位記錄**（2026-05-22 新增）：user story 之間若有「A 完成才能 B」相依性，**MUST** 在 frontmatter `prerequisites` 欄位列具體相依項，**MUST NOT** 用 anchor 故事代替相依性表達。`prerequisites` 接受三類值：(a) 其他 user story `[[US-XX-NNN]]`、(b) 系統行為描述（如「系統自動分派完成」純文字）、(c) 角色準備動作（如「審稿主管已維護能力等級」）

## 六、寫入計畫格式

放入 [[senior-pm-write-mode]] Mode B Phase 1 的 `[寫入計畫]` 區塊：

```
操作 N：
  目標頁面：對應模組 OpenSpec spec（正本）+ Notion User Story DB（發布版本：https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d）
  操作類型：新增頁面
  變更理由：本次功能「[功能名稱]」缺少對應 User Story
  變更後（預計寫入內容）：
    編碼：US-XXX
    名稱：[角色] [動作] [目的]
    作為：[角色]
    我希望：[具體動作]
    以便：[業務價值]
    前置條件：[前提] / 無
    流程說明：1. [步驟一] → 2. [步驟二] → ...
    成功條件：[可測試的驗收標準]
    優先度：高 / 中 / 低
    流程：主要流程 / 優化流程
    涉及模組：[模組清單]
```

## 七、相關卡

- [[senior-pm-write-mode]] — Senior PM 寫入流程（Mode B Phase 1/2）
- [[pm-review-framework]] — BRD 審查時識別 US 缺漏
- [[early-intervention-framework]] — 前期介入時識別 US 缺漏
