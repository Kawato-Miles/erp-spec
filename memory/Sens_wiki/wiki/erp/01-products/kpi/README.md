---
type: metric
module:
  - cross-module
related-notion: https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f
status: draft
last-reviewed: 2026-05-19
---

# KPI 子目錄（總覽）

> Notion KPI DB 鏡像入口。Phase B Stage 5 為**骨架版**，僅含 schema + 北極星指標。詳細各模組 KPI 條目於後續手動補建。

## DB Schema

| 欄位 | 類型 | 說明 |
|------|------|------|
| `商業目標` | title | KPI 對應的商業目標 |
| `成功指標` | text | 具體指標定義 |
| `目標值` | text | 量化目標 |
| `衡量方式` | text | 如何計算 / 衡量 |
| `Baseline` | text | 起始基準 |
| `Phase` | relation | Phase 1 / 2 / 3 |
| `Feature` | relation | 對應功能 |

## 北極星指標（已在 [[success-metrics]] 詳述）

### Phase 1：EC 規格品 BOM 覆蓋率

- 目標：≥ 80%
- 衡量：已完成 BOM 建立的品項數 ÷ EC 現行規格品總數
- 策略邏輯：覆蓋率達標代表 EC 商品管理可完整移轉至 ERP

### Phase 2/3：訂單流程完整完成率

- 目標：Phase 2 第 1 個月 ≥ 60%、第 3 個月 ≥ 80%
- 衡量：狀態機完整走完的訂單數 ÷ 當月進入系統的訂單總數
- 策略邏輯：取代 Ragic + Slack + 紙本

## 各模組 KPI（Phase B / C 補建）

> [!warning] 待補
> 各模組可量化 KPI（如審稿命中率、工單交期準確度、QC 通過率等）需從 Notion KPI DB 抓取 rows 後寫入此目錄。
>
> 建議命名格式：`<模組>-<KPI 名稱>.md`，例：`prepress-review-命中率.md`、`work-order-交期準確度.md`

## 同步策略

依 [[vault-charter#三、Source of Truth 規則|Vault Charter]]：

- Notion KPI DB 為發布版本
- 重要里程碑後由 Miles 觸發「Vault → Notion 彙整推送」

## 來源

- Notion [KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f)（`collection://32e38865-11fa-8011-b3d2-000bc2ff77fb`）
- Notion 產品目標頁 § 五、成功指標：[產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23)
