---
type: metric
module:
  - cross-module
related-notion: https://www.notion.so/d8ae867eb00947439a9c0fc47de52e84
status: active
last-reviewed: 2026-05-19
---

# 功能 Impact Score 評估框架

## 用途

開發優先排序參考。決定「該優先做哪些功能」（與 [[success-metrics]] 的 KPI 不同：KPI 衡量「做到了沒」）。

## 評分維度（4 維度，各 1-5 分）

| 評分維度 | 說明 |
|---------|------|
| **解決核心痛點強度** | 功能是否解決真實、高頻的操作痛點 |
| **使用者仰賴頻率** | 使用後是否持續仰賴此功能完成日常業務 |
| **跨角色影響範圍** | 觸及角色越多，採用阻力越難控制但整體效益越大 |
| **缺失風險程度** | 失敗後是否直接影響[[success-metrics|北極星指標]]的達成 |

## 總分計算

**總分**：四維度平均（公式於 Notion DB 自動計算）

## 優先級分級

| 分級 | 總分範圍 | 處理 |
|------|----------|------|
| **High** | ≥ 4.0 | 優先排入 roadmap |
| **Medium** | 2.5 ~ 3.9 | 視 Phase 與容量決定 |
| **Low** | ≤ 2.4 | 進入 backlog 等候 |

## 與 G.U.N. 框架的關係

> [!info]
> Claude Memory feedback 中有「Impact Score 必須嚴格使用 G.U.N. 框架」的記錄（[feedback_impact_score_gun_framework](../../../../projects/-Users-b-f-03-029-Sens/memory/feedback_impact_score_gun_framework.md)）。
>
> **本框架（Notion 公開版 4 維度）**：用於對外與功能優先度評估的主要工具
> **G.U.N. 三維度**：Claude 內部 memory 評分用
>
> 兩者用途不同，不互相覆蓋。

## 用法

新功能提案時，於 OpenSpec change proposal 的 `## Why` 段或 BRD 文件中：

1. 引用本框架：`評估參考 [[impact-score-framework]]`
2. 列出 4 維度評分
3. 計算總分
4. 對應優先級

範例：

```markdown
## 功能優先度評估

| 維度 | 分數 | 理由 |
|------|------|------|
| 解決核心痛點強度 | 5 | 直接解決「工單散落」核心問題 |
| 使用者仰賴頻率 | 4 | 業務每日使用 |
| 跨角色影響範圍 | 4 | 業務 / 印務 / 出貨三角色 |
| 缺失風險程度 | 5 | 影響訂單流程完整完成率 |
| **總分** | **4.5** | **High** |
```

## DB Schema

來源 [Notion Impact Score DB](https://www.notion.so/d8ae867eb00947439a9c0fc47de52e84)（`collection://32e38865-11fa-8080-aed6-000b7646c008`）：

- 功能（title）
- 解決痛點（number 1-5）
- 使用頻率（number 1-5）
- 跨角色（number 1-5）
- 缺失風險（number 1-5）
- 總分（formula，4 維度平均）
- 優先級（formula，依總分分級）
- Feature（relation → Feature DB）

## 來源

- Notion 產品目標頁 § 五、成功指標 § 功能 Impact Score：[產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23)
- Notion Impact Score DB：[Impact Score](https://www.notion.so/d8ae867eb00947439a9c0fc47de52e84)
