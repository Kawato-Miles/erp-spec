---
type: user-story
us-id: US-AR-006
module:
  - prepress-review
role:
  - "[[03-roles/審稿主管]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿人員對比表"
  - "openspec/specs/prepress-review/spec.md#Requirement: 對帳場景場景的資料可得性"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
related-oq:
  - "[[AR-6-退件率分母是否排除技術退件]]"
  - "[[AR-7-審稿主管監控異常閾值定義]]"
related-test-cases: []
prerequisites:
  - "審稿主管已登入系統"
  - "指定時間區間內部門已有審稿輪次紀錄"
---

# US-AR-006 比對審稿人員績效

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能看各審稿員於指定區間的件數、退件率、平均處理時間

### 以便
辨識退件率明顯高於部門其他人的審稿員，作為調整分派策略或安排個別培訓的依據

### 前置條件
- 審稿主管已登入系統

### 業務流程

1. 審稿主管選擇要比對的時間範圍（今日 / 本週 / 本月）
2. 系統呈現部門所有審稿員的 3 項績效指標：
   - **審稿件數**：時間區間內審稿時間落在區間內的審稿輪次數
   - **退件率**：時間區間內結果為「不合格」的輪次數 / 已審輪次數（**分母是否含技術退件待 [[AR-6-退件率分母是否排除技術退件]] 解答**）
   - **平均處理時間**：時間區間內（審稿時間 − 送審時間）的平均；**含排隊時間**，**僅作參考**不作異常判定依據
3. 系統依退件率降冪排序；退件率相同時依時間區間內件數降冪（避免低件數樣本被捧高）
4. 審稿主管肉眼判斷異常（**系統不自動標示異常徽章**；異常閾值定義待 [[AR-7-審稿主管監控異常閾值定義]] 解答）
5. 異常判斷後續處理：
   - 調整分派：由 [[US-AR-004-覆寫印件分派]] 承接
   - 安排培訓：屬人員培訓 SOP，不在 ERP 系統範疇
6. 部門僅 1 位審稿員時，對比表仍顯示該員指標，但無比較對象意義；不阻擋功能使用

### 成功條件

1. 審稿主管可比對部門所有審稿員的審稿件數（時間區間內審稿輪次數）
2. 審稿主管可比對部門所有審稿員的退件率（不合格輪次 / 已審輪次，分母範圍待 [[AR-6-退件率分母是否排除技術退件]] 解答）
3. 審稿主管可比對部門所有審稿員的平均處理時間（含排隊時間，僅作參考不作異常判定）
4. 比對資料可依「今日 / 本週 / 本月」三種時間範圍切換
5. 系統依退件率降冪排序、件數降冪次序；**系統不自動標示異常徽章**（依 spec L632 設計決策由主管肉眼判斷）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/prepress/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5：
  - § Requirement「審稿人員對比表」L600-636（主要 spec；3 指標 + 排序 + 不自動標異常設計）
  - § Requirement「對帳場景場景的資料可得性」L638-655
  - § Requirement「審稿主管工作台」L394-431（背景）
- [[04-business-logic/稿件管理規則]]：審稿輪次資料模型 + ReviewRound 計算基礎
- 原 Notion User Story DB `US-AR-006`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 7.5/10，識別 8 gap；senior-pm INVEST 4 PASS / 2 WARN，4 問題。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「我希望」32 字違反 ≤ 30 字 | senior-pm 問題 1（high）| 已採納：縮為 28 字「能看各審稿員於指定區間（今日 / 週 / 月）的件數、退件率、平均處理時間」|
| 前置條件「≥ 2 位審稿員」屬系統限制誤植 | senior-pm 問題 4（high）| 已採納：移除前置條件，業務流程 step 6 補「單人時不阻擋功能使用」 |
| 成功條件 1 塞三規則違反單一可驗證 | senior-pm 問題 3（high）+ erp-consultant G1（medium）| 已採納：拆三條（件數 / 退件率 / 平均處理時間） |
| 補「低樣本數不標異常」（spec L632 核心設計）| erp-consultant G3（high）| 已採納：業務流程 step 4 + 成功條件 5 明示「系統不自動標示異常徽章，主管肉眼判斷」 |
| 補次排序規則「退件率相同時依件數降冪」（spec L614）| erp-consultant G4（low）| 已採納：業務流程 step 3 + 成功條件 5 |
| 補退件率分母範圍（含 / 不含技術退件）| erp-consultant G5（low）+ senior-pm 未捕捉痛點 1（high）| 已採納：開 OQ [[AR-6-退件率分母是否排除技術退件]]，業務流程 step 2 + 成功條件 2 引 OQ |
| 補平均處理時間「含排隊時間 + 僅作參考」（spec L412-414）| erp-consultant G1（medium）| 已採納：業務流程 step 2 + 成功條件 3 |
| frontmatter relation 空陣列 | erp-consultant G7 / G8（low）| 已採納：補 related-business-logic（稿件管理規則）+ related-entities（印件） |
| 「以便」量化（spec 五新紀律）| senior-pm 問題 2（medium）| **部分採納**：以便改為「辨識退件率明顯高於部門其他人的審稿員」較具體，但量化基準（如「異常準確率 ≥ 80%」）待 [[AR-7]] 解答 |
| 「異常退件率」閾值定義 | senior-pm 未捕捉痛點 | 已採納：開 OQ [[AR-7-審稿主管監控異常閾值定義]]，業務流程 step 4 + 成功條件 5 引 OQ |
| 「異常判斷後續處理」拆下游 | senior-pm 未捕捉痛點 3 | 已採納：業務流程 step 5 引 [[US-AR-004]] + 註明培訓 SOP 屬非 ERP 範疇 |

### 第二輪審查衍生 OQ

- [[AR-6-退件率分母是否排除技術退件]]（priority medium，跨 US-AR-005 / 006 / 007，本次新開）
- [[AR-7-審稿主管監控異常閾值定義]]（priority low，跨 US-AR-005 / 006，本次新開）

### 暫不處理（Miles 拍板）

- 與 US-AR-005 / 008 合一張 user story：依 senior-pm 段 4「邊界清楚不合併」結論，保持三張
- 業務培訓 SOP：不在 ERP 系統範疇，user story 不涵蓋
