---
name: Notion 資源索引
description: 所有 ERP 相關 Notion 頁面的統一 URL 索引與 BRD 引用格式，為唯一正本
type: reference
---

# Notion 資源索引

> **引用規則**：BRD / Spec 內所有跨頁面引用，一律使用 `[可讀名稱](URL)` 格式。規則全文見 CLAUDE.md § 跨頁面引用規則。
>
> **維護原則**：Notion URL 異動時以本檔案為正本，同步更新所有引用此 URL 的 skill / agent 檔案。

---

## 核心業務文件

| 資源名稱 | 說明 | URL | BRD 引用格式範例 |
|---------|------|-----|----------------|
| 商業流程 | 核心業務規則、計算邏輯、決策規則 | https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a | `詳見 [商業流程](https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a) § X.X` |
| 狀態機（上層+下層）| 需求單 / 訂單 / 工單 / 印件 / 任務 / 生產任務 / QC / 出貨單狀態轉換 | https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 | `詳見 [狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0) § 工單` |
| 數量換算規則 | 數量換算計算邏輯（Prototype 設計參考）| https://www.notion.so/32c3886511fa81e9a77adbd21cfc9d4a | `詳見 [數量換算規則](https://www.notion.so/32c3886511fa81e9a77adbd21cfc9d4a)` |
| 出貨邏輯診斷 | 出貨邊界情況與常見漏洞 | https://www.notion.so/32c3886511fa81cfac16c4720b888ca2 | `詳見 [出貨邏輯診斷](https://www.notion.so/32c3886511fa81cfac16c4720b888ca2)` |

---

## 業務資料庫

| 資源名稱 | 說明 | URL | BRD 引用格式範例 |
|---------|------|-----|----------------|
| 業務情境 DB | PM 視角情境驗證與邊界案例 | https://www.notion.so/3163886511fa808a9d9bda01dc812206 | `詳見 [業務情境](https://www.notion.so/3163886511fa808a9d9bda01dc812206) 的情境 XX` |
| 使用者情境 | 各角色日常工作、職責、痛點 | https://www.notion.so/32c3886511fa8144b38adc9266395d15 | `詳見 [使用者情境](https://www.notion.so/32c3886511fa8144b38adc9266395d15)` |
| User Story DB | 業務故事集（US-001 起）| https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d | `詳見 [User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d) 的 US-XXX` |
| 資料欄位 DB | 全局資料模型與欄位定義（唯一正本）| https://www.notion.so/32c3886511fa803e9f30edbb020d10ce | `詳見 [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 的 [欄位名]` |

---

## 產品規劃

| 資源名稱 | 說明 | URL | BRD 引用格式範例 |
|---------|------|-----|----------------|
| 產品目標 | 商業目標 / KPI / 三大商業 Phase | https://www.notion.so/32c3886511fa81359354e33087d23f23 | `詳見 [產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23)` |
| KPI DB | 各模組可量化成功指標（以 Feature 欄位篩選）| https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f | `詳見 [KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)` |
| Follow-up DB（OQ）| Open Question + Task 管理 | https://www.notion.so/32c3886511fa808e9754ea1f18248d92 | `詳見 [Open Question](https://www.notion.so/32c3886511fa808e9754ea1f18248d92) 的 ORD-008` |
| Follow-up DB OQ View | 僅顯示 OQ 類型的篩選 View（oq-manage 使用）| https://www.notion.so/32c3886511fa808e9754ea1f18248d92?v=32c3886511fa8081878c000cab1b455b | — |

---

## 模組 BRD

| 資源名稱 | 說明 | URL | BRD 引用格式範例 |
|---------|------|-----|----------------|
| Feature Database | 所有模組 BRD 的父層資料庫 | https://www.notion.so/2823886511fa83d08c16815824afd2b7 | — |
| 需求單 BRD | 需求單模組功能規格（v1.9）| https://www.notion.so/3293886511fa80998ac0e8cdf555da68 | `詳見 [需求單 BRD](https://www.notion.so/3293886511fa80998ac0e8cdf555da68)` |
| 訂單 BRD | 訂單管理模組功能規格（v0.5）| https://www.notion.so/32c3886511fa806bad41d755349b0567 | `詳見 [訂單 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567)` |
| 工單 BRD | 工單管理模組功能規格（v1.1）| https://www.notion.so/32c3886511fa80f98a43def401d1edce | `詳見 [工單 BRD](https://www.notion.so/32c3886511fa80f98a43def401d1edce)` |

---

## 測試

| 資源名稱 | 說明 | URL | BRD 引用格式範例 |
|---------|------|-----|----------------|
| ERP Test Case DB | UAT 測試案例（含 View）| https://www.notion.so/2b93886511fa817fbd65e7608726f036 | `詳見 [ERP Test Case DB](https://www.notion.so/2b93886511fa817fbd65e7608726f036)` |
| ERP Scenario DB（測試用）| 測試情境資料庫 | https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05 | — |

---

## 專案架構

| 資源名稱 | 說明 | URL |
|---------|------|-----|
| Roadmap | 產品路線圖（父層頁面）| https://www.notion.so/8ba3886511fa83f8a5ce8173a6de3eca |
