# 資源索引（ERP 資源 / 共用資源 / 工具 / Prototype 實作進度）

> 由 CLAUDE.md 移出（去胖），原處各留一句指標連結。內容一字未改。
> **最後更新**：2026-06-01

---

## ERP 資源
> 完整 Notion URL 索引與引用格式：`memory/shared/notion-index.md`
> **2026-05-19 新增**：商業需求 KM 中樞為 `memory/Sens_wiki/wiki/`（Vault 為內部正本，Notion 降為對外確認版）

| 資源 | 路徑 |
|------|------|
| **ERP wiki（商業需求 KM 中樞）** | 入口 + 載入決策表 + 卡片 registry 正本：[wiki/erp/00-meta/index.md](memory/Sens_wiki/wiki/erp/00-meta/index.md)（章程 / Schema / 邊界 / 同步 / Audit Log 等治理檔見其 § 四，不在此重列）；跨主題總目錄：[wiki/index.md](memory/Sens_wiki/wiki/index.md) |
| **Vault 自審 / Insight** | `vault-audit` skill（10 維度稽核）+ `vault-insight` skill（跨主題模式 + 下一步）；產出至 [audit-log.md](memory/Sens_wiki/wiki/erp/00-meta/audit-log.md) 與 [12-insights/](memory/Sens_wiki/wiki/erp/12-insights/) |
| Spec 迭代工作流（實施細節、檔案清單、驗證標準）| `memory/erp/spec-iteration-workflow.md` |
| 產品目標（商業目標 / KPI / 範疇） | `openspec/config.yaml` § 產品背景與目標（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa81359354e33087d23f23 |
| 成功指標 KPI DB（各模組可量化指標，以 Feature 欄位篩選）| Notion KPI DB：https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f |
| 業務流程（核心規則）| `openspec/specs/business-processes/spec.md`（正本）；Notion 發布版本：https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a |
| 狀態機（上層 + 下層）| `openspec/specs/state-machines/spec.md`（實作規格正本，相對 Notion 發布版）；Notion 發布版本：https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 |
| 數量換算計算規則（Prototype 設計參考）| Notion 數量換算規則：https://www.notion.so/32c3886511fa81e9a77adbd21cfc9d4a |
| 情境驗證（端到端狀態追蹤）| `openspec/specs/business-scenarios/spec.md`（正本）；Notion 發布版本：https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 |
| User Story（業務故事集）| **Vault `memory/Sens_wiki/wiki/erp/13-user-stories/`**（內部正本，2026-05-21 改寫）；Notion 發布版本：https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d；OpenSpec spec § Scenarios 為 requirement-level Acceptance Scenarios（Given/When/Then 工程驗收）非 user story |
| 使用者角色（角色權責定義）| `openspec/specs/user-roles/spec.md`（實作規格正本，相對 Notion 發布版）；Notion 發布版本：https://www.notion.so/32c3886511fa8144b38adc9266395d15 |
| 待確認事項（OQ） | Notion Follow-up DB：https://www.notion.so/32c3886511fa808e9754ea1f18248d92 |
| 術語表（完整）| `memory/erp/glossary.md` |
| 測試案例 | Notion ERP Test Case DB：https://www.notion.so/2b93886511fa817fbd65e7608726f036 |
| 出貨邏輯診斷（邊界情況 / 常見漏洞）| Notion 出貨邏輯診斷：https://www.notion.so/32c3886511fa81cfac16c4720b888ca2 |
| 訂單款項與發票 13 業務情境（產 user story / test case 原始材料）| `memory/Sens_wiki/wiki/erp/04-business-logic/payment-invoice-scenarios.md`（13 情境 475 行，2026-05-28 移入 vault）；索引：`memory/Sens_wiki/wiki/erp/04-business-logic/付款發票邏輯.md`（含 § 五B 七實體連帶矩陣）；外部硬約束：`memory/Sens_wiki/wiki/erp/04-business-logic/發票法規硬約束-ezPay-MIG.md`（ezPay + MIG 法規）；領域分類：`memory/Sens_wiki/wiki/erp/00-meta/business-domain-taxonomy.md` § L1.6 Billing & Cash；**規劃前必跑** `erp-planning-pre-check` skill（雙軸稽核 + 5 步驟含閉環）|

## 共用資源
| 資源 | 路徑 |
|------|------|
| **Notion 資源索引（URL 唯一正本）** | `memory/shared/notion-index.md` |
| 角色層通用原則（Spec 撰寫 / OQ 管理 / PM 視角） | `memory/shared/principles.md` |
| UI 設計系統（業務規範 / 視覺 Token / UX 模式 / 元件清單，唯一權威）| `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`（Spec 撰寫前讀 §0 業務規範；Prototype 製作前完整讀） |
| UI 業務規範細則（框架無關：禁 Emoji / 刪除流程 / Info Banner / Toast / Loading / 頁面模板 / 按鈕優先級 / 狀態標籤）| `memory/shared/ui-business-rules.md` |
| Prototype 工作流程（製作 / 驗證 / 同步規則） | `memory/shared/prototype-guidelines.md` |
| Plan mode 撰寫模板（雙層結構：業務段 PM 看 + 技術段 Agent 看，含 anti-pattern 提示）| `memory/shared/plan-template.md` |
| impeccable 設計稽核 skill 使用指引（ERP 場景指令選擇決策樹）| `memory/shared/impeccable-usage.md` |
| 共用術語（完整） | `memory/shared/glossary.md` |
| 產業背景 | `memory/shared/context/industry.md` |
| 圖編術語（完整） | `memory/graphic-editor/glossary.md` |

## 工具
| 資源 | 路徑 |
|------|------|
| **Notion MCP 操作指引**（防錯清單）| `memory/shared/notion-mcp-guidelines.md` |
| ~~ERP Spec Skill~~（已停用，改用 OpenSpec change 工作流）| `.claude/skills/erp-spec/SKILL.md` |
| ERP Test Case Skill | `.claude/skills/erp-test-case/SKILL.md` |
| **ERP User Story Skill**（兩階段撰寫紀律：業務情境 / UI 操作，含 INVEST 自審、中英夾雜 lint、Notion 推送 mode C）| `.claude/skills/erp-user-story/SKILL.md` |
| OQ 管理 Skill（含去重）| `.claude/skills/oq-manage/SKILL.md` |
| **誤審記錄 Skill**（三視角審查 agent 誤審案例庫，含分類 / 去重 / 四要素提取）| `.claude/skills/misjudgement-record/SKILL.md` |
| 文件稽核 Skill（含自我演化，聚焦 OpenSpec 層）| `.claude/skills/doc-audit/SKILL.md` |
| **Vault 自審 Skill**（10 維度稽核，產 audit-log）| `.claude/skills/vault-audit/SKILL.md` |
| **Vault Insight Skill**（跨主題模式 + 下一步建議，產 12-insights）| `.claude/skills/vault-insight/SKILL.md` |
| **Vault Ingest Skill**（Raw 素材承接與精練，Mode A/B/C + Anti-Model-Collapse 四道防線）| `.claude/skills/vault-ingest/SKILL.md` |
| **Daily Brief Skill**（每日進度回顧 + 今日建議行動，5 道 Anti-Pattern 防護）| `.claude/skills/daily-brief/SKILL.md` |
| **Weekly Review Skill**（本週學到 / 本週完成 / 下週重點，6 道 Anti-Pattern 防護）| `.claude/skills/weekly-review/SKILL.md` |
| Senior PM 規劃驅動 Agent | `.claude/agents/senior-pm.md` |
| CEO 審查 Agent | `.claude/agents/ceo-reviewer.md` |
| ERP 顧問審查 Agent | `.claude/agents/erp-consultant.md` |
| Notion → GitHub Issue Skill | `.claude/skills/notion-to-github/SKILL.md` |
| BRD 模板（Notion） | `.claude/skills/erp-spec/references/brd-template.md` |
| PRD Parent Issue 模板（GitHub，模組層） | `.claude/skills/notion-to-github/references/prd-parent-template.md` |
| PRD Sub-issue 模板（GitHub，子功能層） | `.claude/skills/notion-to-github/references/prd-sub-template.md` |
| ERP 全局資料模型 | 各模組 spec § Data Model（實作規格正本，相對 Notion 發布版）；Notion 資料欄位 DB（查詢用）：https://www.notion.so/32c3886511fa803e9f30edbb020d10ce |

## Prototype 實作進度
> Prototype 統一在 `sens-erp-prototype` Repo（本地：`/Users/b-f-03-029/sens-erp-prototype`）
> GitHub：https://github.com/Kawato-Miles/sens-erp-prototype

| 模組 | 路徑 | 功能 | 狀態 |
|------|------|------|------|
| 需求單 | `src/components/quote/` | 需求單列表 + 編輯頁 + 報價評估 | 建置中（由 Lovable 遷移） |
| 訂單管理 | 尚未建立 | 訂單列表 + 工單與印件合併生產進度二層展開 | 待建置 |
| 材料 / 工序 / 裝訂主檔 | ERP 中台（Figma 稿為準）| 三層結構 + 計價規則；Prototype 不建置 | 已實作（中台）|
