---
type: open-question
module:
  - cross-module
related-notion: https://www.notion.so/32c3886511fa808e9754ea1f18248d92
status: active
last-reviewed: 2026-05-19
---

# Open Questions（OQ）總覽

> [[vault-charter#三、Source of Truth 規則|Vault Charter]] 規定：**OQ 操作正本為 Vault `08-open-questions/`**。
>
> `oq-manage` skill v2.1（2026-05-19）已強制獨立檔規則 — 禁止 inline `[!question]` callout / 「待釐清」措辭 / 口頭「列為 OQ」。所有 OQ 操作（查詢 / 新增 / 更新 / 遷出）統一觸發 `oq-manage` skill 執行。

## 一、命名規約

依 [[../.claude/skills/oq-manage/SKILL.md|oq-manage skill]] § Vault 位置與檔名規約：

- 檔名格式：`<MODULE>-<NNN>-<簡述 slug>.md`
- 範例：`ORD-008-訂單審核權限是否分層.md`、`XM-003-合批派工合併邏輯.md`、`SHP-005-分批出貨觸發節點.md`
- 模組前綴對照（見 oq-manage skill）：QR / ORD / WO / PI / PT / QC / SHP / CR / AS / XM

## 二、Frontmatter Schema

```yaml
---
type: open-question
module:
  - <模組>
oq-id: <MODULE>-<NNN>
status: open               # open / answered / cancelled
priority: <high|medium|low>
audience: internal         # 預設，除非 Miles 明確改 external
raised-at: YYYY-MM-DD
raised-by: <角色或姓名>
source-link: <討論連結 / Notion 頁面 / Slack URL>
related-vault:
  - <wiki link 至相關 vault 卡>
related-oq:
  - <其他相關 OQ 的 oq-id>
expected-resolution-at: YYYY-MM-DD   # 可選
answered-at: YYYY-MM-DD              # status=answered 時填
answered-by: <角色或姓名>             # status=answered 時填
notion-published-at: YYYY-MM-DD      # 若已推送 Notion 對外確認時填
notion-page-url: <URL>               # 若已推送則記錄頁面
---
```

## 三、OQ 清單

依 oq-id 排序。Phase D 一次性遷移後（2026-05-19）的清單：

| OQ ID | 標題 | 狀態 | 優先 | 對應模組 |
|-------|------|------|------|---------|
| [[ORD-001-會計階段標記是否錯誤]] | 會計階段標記是否錯誤 | open | low | order-management、prepress-review |
| [[PI-001-難易度分數業務含義]] | 難易度分數 1-10 業務含義 | open | medium | prepress-review、quote-request |
| [[PI-002-免審決策準則]] | 免審決策準則 | open | medium | prepress-review、quote-request |
| [[PT-001-師傅報工行動裝置例外]] | 師傅報工是否可行動裝置例外 | open | high | production-task |
| [[QC-001-OpenSpec 品管是否拆審稿與 QC]] | OpenSpec 品管是否拆審稿與 QC | open | medium | qc、prepress-review |
| [[SHP-005-分批出貨觸發節點]] | 分批出貨觸發節點 | open | high | order-management、work-order |
| [[XM-001-款項管理頁面業務最重要決策]] | 款項管理頁面業務最重要決策 | open | — | cross-module |
| [[XM-002-印務 vs 印務主管權責邊界]] | 印務 vs 印務主管權責邊界 | open | medium | cross-module、work-order、production-task |
| [[XM-003-訂單管理人 vs 業務權責邊界]] | 訂單管理人 vs 業務權責邊界 | open | medium | cross-module、order-management、work-order |
| [[after-sales-ticket-AFT-1-業務離職轉派]] | 業務離職時 ticket 接手 | open | — | after-sales-ticket |
| [[after-sales-ticket-AFT-2-逾期分級]] | 售後 ticket 逾期分級 | open | — | after-sales-ticket |

→ 共 **11 個 OQ**（Miles 既有 3 個 + Phase D 遷移 8 個）

## 四、同步策略

依 [[vault-charter#三、Source of Truth 規則|Vault Charter]] + [[../00-meta/sync-workflow|Sync Workflow]]：

- **Vault 為內部正本**（本目錄）
- **Notion OQ DB 為對外確認版**（彙整推送時更新）
- 推送依 Miles 觸發，oq-manage skill 不主動推 Notion
- 推送後 OQ 卡 frontmatter 補 `notion-published-at` 與 `notion-page-url`

## 五、相關文件

- [[../00-meta/vault-charter|Vault Charter]] — 三邊分工原則
- [[../00-meta/sync-workflow|Sync Workflow]] — 同步流程
- `.claude/skills/oq-manage/SKILL.md` — OQ 操作 skill（含 mode A 查詢 / B 新增 / C 更新 / D 遷出）

## 六、來源

- Notion [Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)（OQ + Task 混合，對外確認版）
- `oq-manage` skill v2.1（2026-05-19 改寫）
