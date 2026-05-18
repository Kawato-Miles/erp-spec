---
type: phase
module:
  - cross-module
related-notion: https://www.notion.so/32c3886511fa81359354e33087d23f23
status: active
last-reviewed: 2026-05-19
---

# ERP 三大 Phase

## Phase 1：商品資料基礎

**核心任務**：建立可驗證的商品資料基礎，非流程替換。

**範疇**：
- EC 規格品 BOM 建立（含工序 + 材料 + 機台設備）
- 商品成本試算
- 業務情境驗證

**北極星指標**：EC 規格品 BOM 覆蓋率 ≥ 80%（已完成 BOM 建立的 EC 現行規格品數 ÷ EC 現行販售規格品總數）

**Phase 1 結束標準**：
- BOM 覆蓋率達標
- 設定方式無預期外障礙
- 商品管理可完整移轉至 ERP

## Phase 2：訂單流程完整移轉

**核心使命**：取代 Ragic + Slack + 紙本組合。

**範疇**：
- 訂單建立到出貨完成全流程系統化
- 工單異動全部進系統
- 派工看板上線
- 報工系統上線

**北極星指標**：訂單流程完整完成率
- Phase 2 上線後第 1 個月：≥ 60%
- Phase 2 上線後第 3 個月：≥ 80%

**定義**：訂單從起點（線下訂單：「訂單確認」；EC 訂單：「付款完成」）到「出貨完成」的完整流程均在系統內完成的訂單比率。

**為什麼選這個指標**：
1. 走完完整流程會強制讓所有環節角色真正進入 ERP 完成業務
2. 出貨完成是公司服務流程兌現的時刻，若未達到此節點代表無法滿足服務流程

## Phase 3：生產效率優化分析

**核心任務**：基於 Phase 2 累積的資料，做生產效率優化。

**範疇**：
- 產能可見度分析
- 工序瓶頸識別
- 交期準確度提升
- 成本結構優化

**Phase 3 KPI**：見 `kpi/` 子目錄與 [[success-metrics]]

## 各 Phase 對應的關鍵 spec / 模組

| Phase | 主要影響的 spec / 模組 |
|-------|--------------------|
| Phase 1 | [[BOM]]、`material-master`、`process-master`、`binding-master` |
| Phase 2 | `quote-request`、`order-management`、`work-order`、`production-task`、`prepress-review`、`qc`、出貨單、`after-sales-ticket` |
| Phase 3 | 派工看板、產能分析、KPI dashboard（**註**：見 [[..\..\..\..\projects\-Users-b-f-03-029-Sens\memory\project_erp_dashboard_deferred]]，dashboard 類功能列為後驗 epic）|

## 來源

- Notion 產品目標頁 § 三、階段範疇 + § 五、成功指標：[產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23)
