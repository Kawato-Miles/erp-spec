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
- **「我希望」單句 ≤ 30 字 + 單一動作**（2026-05-21 新增）：超過則違反 INVEST Small，**MUST** 拆 user story。多動作覆蓋的需求改寫為 anchor 故事 + 各動作獨立子故事（如 US-AR-001 串接 US-AR-002~011 模式）
- **「以便」聚焦業務價值**，**MUST NOT** 寫「因為系統需要」
- **「以便」量化優於定性**（2026-05-21 新增）：能量化的業務價值優先量化（如「不合格率 KPI 排除技術退件後反映真實品質」優於「KPI 統計準確」）
- **「成功條件」必須可測試**，避免「使用者感到滿意」等模糊描述
- **「成功條件」每條單一可驗證行為**（2026-05-21 新增）：若一條塞多個業務規則（如「合格須上傳檔案 + 推進製程 + 終態不可變」），**MUST** 拆為多條；超過 5 條時反向觸發拆 user story
- **一條 User Story 只描述一個角色的一個需求**；若跨角色，**MUST** 拆成多條
- **下游連鎖反應不入本 US**（2026-05-21 新增）：如「合格 → 自動建工單」「終態 → 棄用 + 建新印件」屬下游模組或跨模組情境的職責，本 US 以 wiki link 引用 [[07-scenarios]] 或對應 spec 處理，不在本 US 重複描述實作邏輯

### Anchor 故事例外條款（2026-05-21 新增）

當模組功能由多個獨立 user story 構成完整循環時（如 prepress-review 的 US-AR-001 串接 US-AR-002 ~ US-AR-010），可建立 **anchor 故事**作為總分結構入口。anchor 故事適用以下例外：

- **Independent**：不適用，本質是「整合 N 張子故事」；不應視為違反 INVEST
- **Small（≤ 30 字 + 單一動作紀律）**：例外允許違反，但 MUST 滿足：
  - 業務流程以「步驟 + wiki link 引子故事」結構撰寫，避免 anchor 重複實作邏輯
  - 「我希望」雖跨多動作，MUST 用「整體結構化流程」抽象描述（如「完整走完結構化審稿流程直到合格終態」），MUST NOT 列舉個別動作
- **下游連鎖反應**：anchor 故事仍 MUST 以 wiki link 引用而非實作描述（與單一 user story 同紀律）
- **成功條件**：MUST 包含「主骨幹 + 子故事整合無斷點」驗證，不只覆蓋主流程
- **跨子故事引用**：anchor 故事內文引用的子故事 MUST 在 frontmatter `related-oq` 反向追溯子故事衍生的 priority high/medium OQ（讓讀者透過 anchor 可看到模組級未解項）
- **適用場景**：模組存在「總分」結構（anchor 描述整體循環，子故事描述個別動作）；單一 user story 拆出 anchor 屬過度設計

PM 規劃模組時看 anchor 理解全貌，工程實作時拆解到子故事；anchor 不是工程驗收單元，子故事才是。

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
