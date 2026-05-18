---
type: product-vision
module:
  - cross-module
related-spec: openspec/config.yaml
related-notion: https://www.notion.so/32c3886511fa81359354e33087d23f23
status: active
last-reviewed: 2026-05-19
---

# ERP 產品願景

## 為什麼自建 ERP

公司目前用兩套系統處理訂單，痛點請見 [[pain-points]]。自建 ERP 的動機如下：

1. **Ragic 要 retire** — 現有線下訂單與工單管理系統將汰換
2. **印刷業特殊製程需求** — 打樣流程、工廠類型路由、分批出貨等無法完全依賴現成方案
3. **EC 整合需求** — 自有電商與線下訂單需要統一資料結構，最終實現同一套流程管理
4. **生產流程優化** — 解決工單分散在 Ragic / EC 兩系統中、且大量印出紙本難以追蹤狀況
5. **Data Governance** — 建立生產任務、QC、出貨的資料追蹤基礎，後續才能做生產效率優化分析

## 核心問題

詳見 [[pain-points]]，三個核心問題：

1. **工單資訊散落，掉單與生產錯誤風險高** — 工單分散 Ragic / EC / 紙本三方，異動無系統留存
2. **產能不透明，管理層無法有效判斷工廠實際狀況** — 工廠生產排程靠口頭回報
3. **角色分工不明確，問題發生時責任模糊** — 工單操作、審核、分派缺乏系統記錄與角色綁定

## 階段範疇

詳見 [[phases]]，三大 Phase：
- **Phase 1**：EC 規格品 BOM 建立（商品資料基礎）
- **Phase 2**：訂單流程完整移轉（取代 Ragic + Slack + 紙本）
- **Phase 3**：生產效率優化分析

## 成功指標

詳見 [[success-metrics]]，北極星指標：
- **Phase 1**：EC 規格品 BOM 覆蓋率 ≥ 80%
- **Phase 2/3**：訂單流程完整完成率（Phase 2 第 1 個月 ≥ 60%，第 3 個月 ≥ 80%）

## 利害關係人

詳見 [[stakeholders]]。

## 功能優先度評估

採 [[impact-score-framework]]（4 維度 1-5 分制）。

## 來源

- Notion 產品目標頁（ground truth）：[產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23)
- OpenSpec：[config.yaml § 產品背景與目標](../../../openspec/config.yaml)（摘要版）
