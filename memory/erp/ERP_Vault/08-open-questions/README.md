---
type: open-question
module:
  - cross-module
related-notion: https://www.notion.so/32c3886511fa808e9754ea1f18248d92
status: active
last-reviewed: 2026-05-19
---

# Open Questions（OQ）總覽

> [[vault-charter#三、Source of Truth 規則|Vault Charter]] 規定：**OQ 操作正本改為 Vault `08-open-questions/`**。
>
> `oq-manage` skill 需於 [[../00-meta/sync-workflow|Phase C Stage 8]] 改寫，從 Notion 寫入改為 Vault 寫入。Notion OQ DB 留作對外確認版。

## 一、目前狀態：Skill 改寫前的過渡期

> [!warning] 過渡期
> Phase A + B 期間，oq-manage skill 仍寫 Notion。Phase C Stage 8 完成 skill 改寫後，新 OQ 改寫 Vault。
>
> 既有 Notion OQ 鏡像至此目錄的工作量大，建議**漸進式**：新 OQ 直接寫 Vault，既有 Notion OQ 在被引用 / 解答時再個別鏡像。

## 二、OQ 命名規約

依 [[editing-conventions]]：

- 檔名格式：`<模組>-<OQ 編號或 slug>.md`
- 範例：`work-order-XM-003-合批派工邏輯.md`、`shipping-SHP-005-分批出貨觸發.md`

## 三、Frontmatter 範例

```yaml
---
type: open-question
module: [work-order]
status: open    # open / answered / cancelled
notion-link: https://www.notion.so/...
raised-at: 2026-05-19
raised-by: Miles
expected-resolution-at: 2026-06-30
---
```

## 四、已識別但尚未建檔的 OQ

Phase A + B 撰寫 Vault 過程中識別的 OQ（待 Phase C skill 改寫後正式寫入）：

| 主題 | 來源卡 | 內容 |
|------|--------|------|
| 角色 / 印務 vs 印務主管邊界 | [[03-roles/_alignment-report]] | 印務（執行）能直接建生產任務嗎？還是需印務主管批准？ |
| 角色 / 會計階段標記 | [[03-roles/會計]] | Notion DB 標記會計「僅審稿階段」是否錯誤？ |
| 角色 / 訂單管理人 vs 業務權責邊界 | [[03-roles/_alignment-report]] | 兩者都有訂單 R/W 權限，工單異動執行責任在誰？ |
| 品管拆分 | [[03-roles/_alignment-report]] | OpenSpec「品管」是否該拆為「審稿」+「QC」？ |
| 難易度分數的業務含義 | [[難易度機制]] | 1-10 分各代表什麼產品類型 / 規格複雜度？ |
| 免審決策準則 | [[免審決策樹]] | 哪些情境算免審？由業務 / 諮詢主觀判斷的標準化問題 |
| 分批出貨觸發節點 | [[出貨單]] | OQ SHP-005 |
| 合批派工合併邏輯 | [[03-roles/訂單管理人]]、[[03-roles/生管]] | OQ XM-003 |

## 五、同步策略

依 [[vault-charter#三、Source of Truth 規則|Vault Charter]]：

- Vault 為內部正本
- Notion OQ DB 為對外確認版
- Phase C Stage 8 完成 skill 改寫後執行

## 來源

- Notion [Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)（OQ + Task 混合）
- `oq-manage` skill（Phase C Stage 8 改寫前仍寫 Notion）
