---
type: user-story
us-id: US-AR-001
module:
  - prepress-review
role:
  - "[[03-roles/審稿]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - openspec/specs/prepress-review/spec.md
  - "[[04-business-logic/稿件管理規則]]"
  - "[[04-business-logic/審稿分配規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
  - "[[04-business-logic/審稿分配規則]]"
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
related-entities:
  - "[[05-entities/印件]]"
related-oq:
  - "[[AR-8-免審稿適用條件與核可機制]]"
  - "[[AR-10-主管覆寫分派是否允許破例派工]]"
  - "[[AR-11-補件停滯處理機制與輪次上限]]"
related-test-cases: []
---

# US-AR-001 審核稿件（anchor 故事）

> **Anchor 故事**：本卡為審稿模組總分結構入口，串接 US-AR-002 ~ US-AR-010 共 9 張子故事構成完整循環。anchor 故事適用 [[user-story-spec#五、撰寫原則|user-story-spec § 五 Anchor 例外條款]]，不嚴格適用「我希望 ≤ 30 字 / 單一動作」紀律。

## 業務情境（穩定層）

### 作為
[[03-roles/審稿]]

### 我希望
印件能完整走完結構化審稿流程直到合格終態

### 以便
客戶 / 業務與審稿員間的雙向溝通有系統化紀錄可追溯；審稿部門工作量有 KPI 量化基礎；退件原因可累積分析供公司改善服務

### 前置條件
- 訂單中的印件進入審稿階段、稿件檔案已上傳
- 系統已完成自動分派（一般印件）**或**印件已於需求單階段標記為免審稿（[[US-AR-002-設定印件難易度與免審稿]]）

### 業務流程

本流程為審稿模組的主要骨幹，串接以下個別 user story 為完整循環：

1. **前置設定**（[[US-AR-002-設定印件難易度與免審稿]]）：業務於需求單標註印件難易度與是否免審稿；免審稿印件由系統判定後直接進入步驟 6（跳過分派與審稿）
2. **人員調度**：
   - 主流程：[[US-AR-003-維護審稿人員能力等級]] 由審稿主管維護等級
   - 異常路徑：人員不在崗 / 負擔不均 → 由 [[US-AR-004-覆寫印件分派]] 處理（與步驟 3 / 步驟 5 平行）
3. **自動分派**：稿件上傳後，系統依「能力最接近難易度 → 進行中負擔最少」原則挑選審稿員；若候選集為空（無人能力足夠），系統破例派給能力最高者並記錄活動紀錄（待 [[AR-10-主管覆寫分派是否允許破例派工]] 解答後決定主管覆寫的對應策略）
4. **執行審稿**（[[US-AR-007-執行印件審稿]]）：審稿員提交合格 / 不合格判定，含退件原因 10 項分類與審稿備註；提交後可修改本輪審稿備註並留稽核紀錄
5. **補件迴圈**：判定不合格 → 補件方補件 → 系統將印件回送原審稿員重審 → 重新進入步驟 4，直到合格
   - B2B 通道：[[US-AR-009-B2B業務代客戶補件]]（業務於 ERP 訂單詳情補件）
   - B2C 通道：[[US-AR-010-B2C會員補件流程]]（會員於 EC 會員中心補件）
   - 原審稿員不在崗時：改由審稿主管覆寫指派（[[US-AR-004]]）
   - 補件停滯處理 / 輪次上限：待 [[AR-11-補件停滯處理機制與輪次上限]] 解答
6. **終態**：合格 → 印件審稿終止，進入製程審核階段；合格為不可變終態，後續若需變更印件內容由跨模組情境流程處理（詳見 [[07-scenarios/README#情境 6：同印件補件後再審]] 與業務流程 spec），不在本 anchor 範疇
7. **並行監控**（**貫穿步驟 3-6 全程**，非順序步驟）：審稿主管隨時掌握部門運作
   - [[US-AR-005-監控當日審稿工作量]]：即時當日 3 指標
   - [[US-AR-006-比對審稿人員績效]]：時間區間人員績效對比
   - [[US-AR-008-追蹤部門審稿完成紀錄]]：對帳查詢

### 成功條件

1. 印件可從稿件上傳走到合格進入製程審核階段，多輪審稿之間狀態正確轉移
2. 每一輪審稿留結構化紀錄（審稿檔案、送審備註、結果、退件原因、審稿備註）；跨輪次稽核事件（自動分配 / 破例派工 / 主管覆寫 / 審稿備註修改 / 稿件備註修改 / 狀態轉移）由印件活動紀錄統一記錄
3. 免審稿印件可直接跳過審稿環節進入製程審核階段，但仍產生對應的審稿輪次紀錄（來源標記為「免審稿」）
4. 退件原因依 10 項分類記錄於審稿輪次，可透過下游 KPI 工具（不合格率排除技術退件）統計分析；本 anchor 僅保證資料完整性，KPI 視覺化由下游模組承接
5. 子流程與本主骨幹整合無斷點：審稿主管可全程進行人員調度（[[US-AR-003]] / [[US-AR-004]]）與部門監控（[[US-AR-005]] / [[US-AR-006]] / [[US-AR-008]]），補件方可於不合格後啟動補件迴圈（[[US-AR-009]] / [[US-AR-010]]）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/prepress/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 相關業務情境

- **打樣後識別稿件問題重新審稿**：印件審稿合格後若打樣不合格且根因為稿件問題，業務取得新稿件走 [[US-AR-011-打樣後重新處理稿件]] 流程；該流程是「跨階段重新進入審稿」（與本 anchor 補件迴圈的「同週期內補件」業務本質不同）

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5 全文（含 § 自動分配 L28-86 / § 主管覆寫 L88-115 / § 審稿作業 L223-266 / § B2C / B2B 補件 L270-324 / § 補件回原審稿人員 L326-345 / § 印件 ActivityLog L347-393）
- [[04-business-logic/稿件管理規則]]、[[04-business-logic/審稿分配規則]]、[[04-business-logic/難易度機制]]、[[04-business-logic/免審決策樹]]
- 原 Notion User Story DB `US-AR-001`（2026-05-21 遷入並依 spec v1.5 + 子故事 v2 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜；anchor 故事串接 9 張子故事。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 B（85/100），識別 9 gap；senior-pm INVEST「Anchor 例外」評估，5 問題。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| frontmatter `related-oq` 缺失（high）| erp-consultant G7 | 已採納：補 AR-8 / AR-10 / AR-11（priority high/medium，跨多個子故事關聯本 anchor）|
| 步驟 3 補破例派工降級路徑（spec L77-86）| erp-consultant G1（high）| 已採納：補「候選集為空時破例派給能力最高者」+ 引 [[AR-10]] |
| 步驟 5 補原審稿員不在崗主管覆寫（spec L326-345）| erp-consultant G3（high）| 已採納：補「改由審稿主管覆寫指派」+ 引 [[US-AR-004]] |
| 步驟 6「合格 → 自動建工單」屬下游連鎖反應 | erp-consultant G8 + senior-pm P1（high）| 已採納：改寫為「合格 → 印件審稿終止 + 引 [[07-scenarios#情境 6]]」，移除實作描述 |
| 步驟 7 與步驟 1-6 同層編號誤讀為「合格後才監控」| erp-consultant G5（medium）| 已採納：步驟 7 標明「並行監控（貫穿步驟 3-6 全程，非順序步驟）」 |
| 步驟 2「人員調度」段一句帶過 | erp-consultant G2（medium）| 已採納：拆「主流程 vs 異常路徑」兩層描述 |
| 補 ActivityLog 跨輪次稽核載體（spec L347-393）| erp-consultant G4（medium）| 已採納：成功條件 2 補「跨輪次稽核事件由印件活動紀錄統一記錄」 |
| 成功條件 4「累積為統計分析資料」不可測試 | senior-pm P2（medium）| 已採納：改寫為「依 10 項分類記錄於審稿輪次 + KPI 視覺化由下游承接，本 anchor 僅保證資料完整性」 |
| 成功條件覆蓋面不對等於子故事 | senior-pm P3（medium）| 已採納：新增成功條件 5「子流程與本主骨幹整合無斷點」涵蓋人員調度 / 監控 / 補件 |
| 「免審稿快速路徑」段落游離 | senior-pm P4（low）| 已採納：併入步驟 1 描述「免審稿印件由系統判定後直接進入步驟 6」 |
| 前置條件第 3 條混淆兩個前置狀態 | senior-pm P5（low）| 已採納：拆兩條（已分派 vs 已標記免審稿）|
| 「我希望」38 字超 30 字 | erp-consultant G6（low，anchor 例外）+ senior-pm Small FAIL（接受例外）| 已採納改寫：縮為「印件能完整走完結構化審稿流程直到合格終態」22 字；同步建議補 user-story-spec § 五 Anchor 例外條款（已採納，獨立 commit）|
| US-AR-011 是否屬本 anchor 範疇 | erp-consultant G9 + senior-pm 段 4 漂移風險 | 已採納澄清：US-AR-011「打樣後重新處理稿件」是跨階段重新進入審稿，與 anchor「同週期審稿」不同範疇；新增「相關業務情境」段引 wiki link，但不入主業務流程 |

### Anchor 故事撰寫紀律（建議補入 [[user-story-spec]] § 五）

senior-pm 段 3 建議補入「Anchor 故事例外條款」：
- Anchor 故事 Independent 不適用（本質是整合 N 張子故事）
- Anchor 故事 ≤ 30 字 + 單一動作紀律例外允許，但 MUST 用「整體結構化流程」抽象描述
- Anchor 故事 MUST 用 wiki link 引用子故事，不重複實作邏輯
- Anchor 故事成功條件 MUST 含「主骨幹 + 子故事整合無斷點」驗證

→ 本 anchor 校對通過後同步補入 user-story-spec § 五。
