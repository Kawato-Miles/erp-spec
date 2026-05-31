---
type: meta
module:
  - cross-module
related-spec: openspec/specs/user-roles/spec.md
related-notion: https://www.notion.so/32c3886511fa8144b38adc9266395d15
status: active
last-reviewed: 2026-05-19
---

# 角色清單對齊報告

> [!warning] 重大缺漏發現
> Vault 從 Notion「核心角色權責表」抓出 16 個完整角色，但 OpenSpec `user-roles/spec.md` 僅定義 5 個角色，缺漏 **11 個角色 + 拆分問題**。本報告供 Miles 後續評估是否開 OpenSpec change 補建。

## 一、對齊總覽

| 狀態 | 數量 | 角色 |
|------|------|------|
| **OpenSpec 已有** | 4 | [[業務]]、[[諮詢]]（spec 稱「諮詢人員」）、[[印務主管]]、[[出貨]] |
| **OpenSpec 部分對應** | 1 | OpenSpec 的「品管」涵蓋 Notion 的 [[審稿]] + [[wiki/erp/03-roles/QC]] 兩個角色 |
| **OpenSpec 缺漏** | 11 | [[Supervisor]]、[[訂單管理人]]、[[會計]]、[[審稿主管]]、[[印務]]、[[生管]]、[[師傅]]、[[wiki/erp/03-roles/QC]]（拆分後）、[[中國廠商]]、[[外包廠商]]、[[EC 商品管理]] |

## 二、各角色對齊細節

### OpenSpec 已有（4）

| Vault 角色 | OpenSpec 名稱 | 一致性 |
|-----------|--------------|--------|
| [[業務]] | 業務 | 完全一致 |
| [[諮詢]] | 諮詢人員 | 命名不同（「諮詢」vs「諮詢人員」），職責一致 |
| [[印務主管]] | 印務主管 | 完全一致 |
| [[出貨]] | 出貨 | 完全一致 |

### OpenSpec 部分對應（1）：品管 → 審稿 + QC

OpenSpec 將「品管」定義為單一角色，但 Notion DB 拆分為兩個獨立角色：

| Vault 角色 | Notion 平台 | 階段 | 職責 |
|-----------|-----------|------|------|
| [[審稿]] | 審稿平台 | 製前（審稿階段） | 確認稿件合規、製作稿件 |
| [[wiki/erp/03-roles/QC]] | 工廠平台 | 製後（打樣印製階段） | 依訂單進行 QC，記錄檢驗結果 |

**OpenSpec 影響**：使用「品管」角色的權限設計、流程描述可能未區分製前 / 製後職責，需檢視是否需拆分。

### OpenSpec 缺漏（11）

#### 中台層（4）

| 角色 | 主要影響 |
|------|---------|
| [[Supervisor]] | 跨全模組（Dashboard / KPI 追蹤）|
| [[訂單管理人]] | order-management、work-order |
| [[審稿主管]] | prepress-review |
| [[EC 商品管理]] | material-master、process-master、binding-master（Phase 1 BOM）|

#### 業務平台（1）

| 角色 | 主要影響 |
|------|---------|
| [[會計]] | order-management、prepress-review（**注意**：Notion 標記「僅審稿階段」需確認）|

#### 印務平台（1）

| 角色 | 主要影響 |
|------|---------|
| [[印務]] | work-order、production-task（非主管，執行層）|

#### 工廠平台（2）

| 角色 | 主要影響 |
|------|---------|
| [[生管]] | production-task、work-order |
| [[師傅]] | production-task（**Phase 2 北極星指標關鍵**）|

#### 外部夥伴（2）

| 角色 | 主要影響 |
|------|---------|
| [[中國廠商]] | production-task（中國供應商平台）|
| [[外包廠商]] | production-task、work-order（工廠平台，外部夥伴）|

## 三、影響評估

### 對 OpenSpec spec 的影響

缺漏 11 個角色 + 1 個拆分問題意味著：

1. **權限設計可能不完整**：當前模組 spec 撰寫時若假設「只有 5 個角色」，可能漏寫師傅報工、生管派工、訂單管理人合批派工等關鍵流程的角色描述
2. **流程責任歸屬不明**：例如「工單異動」的執行責任在訂單管理人還是業務？OpenSpec 無從區分
3. **與商業情境不對齊**：Notion 業務情境 DB 中可能引用「師傅」「生管」等角色，OpenSpec spec 無對應描述

### 對 Vault 的影響（已處理）

- ✅ Vault `03-roles/` 已建立 16 個完整角色卡
- ✅ [[stakeholders]] 已引用所有 16 個角色
- ✅ Phase A Stage 7 將建立「角色 × 流程」Canvas，使用完整 16 角色 swimlane

## 四、建議後續行動（Miles 決策）

依 plan 中既定，「**本計畫不動 OpenSpec spec**」。後續行動建議：

| 行動 | 觸發時機 | 影響範圍 |
|------|----------|----------|
| **Miles 回歸需求面驗證** | Phase A 完成後 | 確認 11 個缺漏角色是否真的有業務需求，或只是 Notion DB 列得太細 |
| **若確認缺漏 → 開 OpenSpec change** | 後續週期 | 補 user-roles spec、影響相關模組 spec |
| **若拆分「品管」** | 同上 | 影響 user-roles spec + qc spec + prepress-review spec |
| **若不缺漏（Notion 列得太細）** | Phase A 後 | 維持 Vault 為完整版，OpenSpec 維持 5 角色精簡版，註解兩者差異 |

## 五、相關 OQ

依 oq-manage skill v2.1（已強制獨立檔），對應 OQ 卡見：

1. [[XM-002-印務 vs 印務主管權責邊界]] — 印務（執行）能直接建生產任務嗎？還是需印務主管批准？
2. [[ORD-001-會計階段標記是否錯誤]] — Notion DB 標記會計「僅審稿階段」是否錯誤？
3. [[XM-003-訂單管理人 vs 業務權責邊界]] — 兩者都有訂單 R/W 權限，工單異動執行責任在誰？
4. [[QC-001-OpenSpec 品管是否拆審稿與 QC]] — OpenSpec「品管」是否該拆為「審稿」+「QC」？

## 來源

- Notion 核心角色權責表（16 角色 ground truth）：[使用者權責](https://www.notion.so/32c3886511fa8144b38adc9266395d15)
- OpenSpec user-roles spec：[user-roles/spec.md](../../../../openspec/specs/user-roles/spec.md)
