---
type: open-question
module:
  - cross-module
related-notion: https://www.notion.so/32c3886511fa808e9754ea1f18248d92
status: active
last-reviewed: 2026-05-19
---

# Open Questions（OQ）總覽

> [[erp_index]] 規定：**OQ 操作正本為 Vault `08-open-questions/`**。
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
| [[PT-002-QC 分批驗收派工數量機制]] | QC 分批驗收派工數量機制 | open | medium | production-task、qc |
| [[PT-003-NCR Rework 具體實現]] | NCR Rework 具體實現 | open | medium | production-task |
| [[PT-004-QCRecord 資料遷移]] | QCRecord 資料遷移 | open | low | production-task |
| [[PT-005-QC 心智模型驗證]] | QC 心智模型驗證 | open | medium | production-task、qc |
| [[QC-001-OpenSpec 品管是否拆審稿與 QC]] | OpenSpec 品管是否拆審稿與 QC | open | medium | qc、prepress-review |
| [[SHP-005-分批出貨觸發節點]] | 分批出貨觸發節點 | open | high | order-management、work-order |
| [[XM-001-款項管理頁面業務最重要決策]] | 款項管理頁面業務最重要決策 | open | — | cross-module |
| [[XM-002-印務 vs 印務主管權責邊界]] | 印務 vs 印務主管權責邊界 | open | medium | cross-module、work-order、production-task |
| [[XM-003-訂單管理人 vs 業務權責邊界]] | 訂單管理人 vs 業務權責邊界 | open | medium | cross-module、order-management、work-order |
| [[AFT-1-業務離職轉派]] | 業務離職時 ticket 接手 | open | — | after-sales-ticket |
| [[AFT-2-逾期分級]] | 售後 ticket 逾期分級 | open | — | after-sales-ticket |
| [[AFT-3-OA已核可改金額是否通知主管]] | OA 已核可改金額是否通知主管 | open | low | after-sales-ticket、order-management |
| [[AFT-4-補印優先度規則]] | 補印印件視覺識別 vs 強制高優先度 | open | medium | after-sales-ticket、work-order、task-dispatch-board |
| [[AFT-5-補費OA由誰建立]] | 補費 OA 業務手動 vs 系統自動帶建 | open | medium | after-sales-ticket、order-management |
| [[ORD-002-OA核可金額閾值閘門]] | OA 已核可金額 ×% 閾值閘門 | open | low | order-management |
| [[ORD-003-取消退款Payment是否回退OA]] | 取消退款 Payment 是否回退 OA | open | medium | order-management |
| [[ORD-004-跨期退款SalesAllowance自動建立]] | 跨期退款折讓單自動 vs 手動 | open | medium | order-management |
| [[XM-004-售後流程端到端推演]] | 售後 ticket 流程端到端推演 | open | medium | cross-module、after-sales-ticket |
| [[ORD-005-訂單階段備註欄位編輯權限]] | 新 3 欄位編輯權限 | open | high | order-management |
| [[ORD-006-訂單階段備註欄位編輯時機]] | 新 3 欄位編輯時機（field lock） | open | high | order-management |
| [[ORD-007-新備註欄位與paymentTermsNote共存策略]] | paymentNote vs paymentTermsNote UI 共存 | open | high | order-management |
| [[ORD-008-訂單備註欄位異動追蹤]] | 新 3 欄位 audit trail 需求 | open | medium | order-management |
| [[ORD-009-訂單備註欄位業務平台可見性]] | 新欄位在業務平台列表可見性 | open | medium | order-management、sales-platform |
| [[ORD-010-備註模板重複插入防呆]] | 備註模板重複插入防呆（Phase 2） | open | low | order-management、prototype-shared-ui |
| [[ORD-011-備註模板變數佔位符處理]] | 變數佔位符 [日期] [金額] 處理（Phase 2） | open | medium | order-management、prototype-shared-ui |
| [[XM-005-Use-As-Is 退款流程串接]] | Use-As-Is 退款流程串接 | open | high | cross-module、after-sales-ticket、order-management |
| [[XM-006-備註模板維護路徑]] | 備註模板維護路徑（Phase 2） | open | medium | cross-module、order-management |
| [[XM-007-降級為次級品出貨]] | 降級為次級品出貨給其他客戶（QC 重編 from XM-006）| open | low | cross-module、production-task、order-management |
| [[ORD-012-訂單備註匯出至客戶文件路徑]] | 訂單備註匯出至客戶文件路徑（下游 epic） | open | medium | order-management |
| [[ORD-013-新三類與既有production_note職責分工]] | 新三類與既有 production_note 職責分工 | open | high | order-management |
| [[AFT-6-補印改稿情境入口設計]] | 補印改稿情境入口設計（規格變更 vs 補印路徑） | answered | medium | after-sales-ticket、order-management |
| [[AFT-7-補印自動通過後稿件問題處理]] | 補印自動通過後印務發現稿件問題的標準動作 | answered | medium | after-sales-ticket、prepress-review |
| [[AFT-8-補印詳情頁來源稿件視覺強調]] | 補印詳情頁來源稿件視覺強調（UI 細節） | answered | low | after-sales-ticket、prototype-shared-ui |
| [[ORD-014-訂單備註與訂單資訊編輯dialog分開]] | OrderNotesEditDialog 為何不沿用 OrderInfoEditDialog | answered | medium | order-management |

→ 共 **38 個 OQ**（32 既有 + 2026-05-20 vault-audit 補測識別 6 個 QC 重構期孤兒 OQ：PT-002/003/004/005 + XM-005 + XM-007 = 38）

> [!info] 2026-05-20 OQ 治理整理（vault-insight 2026-05-20-change-archive-OQ收尾流程缺口）
> - XM-006 撞號：QC 重構期「降級為次級品出貨」重編為 XM-007（避免與備註模板維護路徑衝突）
> - 命名規約統一：`after-sales-ticket-AFT-1/2` 重命名為 `AFT-1/2`（去前綴，對齊新 schema）
> - 9 個缺 `expected-resolution-at` 的 OQ 補預設 2026-Q3（標 needs-Miles-confirmation）
> - 13 個 OQ 加 `related-insight` backlink（12 個指向 Insight 1 售後 / Insight 2 archive 治理 + XM-005 跨兩 insight）

### 三-B、孤兒 OQ 補登（2026-05-31，恢復檢索可達）

> 以下 OQ 卡於 2026-05-31 obsidian-cli `orphans` 稽核中無任何入鏈（從主 index → 本 README 的檢索鏈無法到達），補登恢復可達。
> 待辦（`oq-manage` 全表策展）：本目錄現有 **88 張 OQ**，上方主表僅策展至 ORD-014（38 張）；其餘約 37 張雖已有他處入鏈、暫未列主表，下次 `oq-manage` 全表整理時連同狀態 / 優先度 / 模組一併併入主表。

- [[AFT-9-最後活動時間derived欄位]] — 售後最後活動時間 derived 欄位升級條件
- [[BI-6-CSV收款日最近或結清]] — 對帳 CSV 收款日取「最近」或「結清」
- [[BI-7-合期開一張發票是否支援]] — 合期開一張發票是否支援
- [[BI-10-作廢發票CSV篩選]] — 作廢發票於對帳 CSV 的篩選
- [[BI-14-款項UserStory業務情境段含UI措辭違反紀律]] — 款項 US 業務情境段含 UI 措辭
- [[BI-17-BillingInstallment缺完整DataModel實體表]] — BillingInstallment 缺完整資料模型實體表
- [[BI-18-手動開票是否一律需關聯期次]] — 手動開票是否一律需關聯期次
- [[ORD-015-印件清單120px縮圖體感驗證]] — 印件清單 120px 縮圖體感驗證
- [[ORD-017-金額組成混合稅率UI呈現]] — 金額組成混合稅率 UI 呈現
- [[ORD-019-會計處理中Payment應收應付處理]] — 會計處理中 Payment 應收應付處理
- [[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]] — 取消已完成 Payment 邏輯刪除 vs 物理刪除
- [[ORD-025-完成後非售後補收入口歸屬]] — 完成後非售後補收入口歸屬
- [[ORD-026-附件用途欄位是否轉LOV]] — 附件用途欄位是否轉 LOV
- [[QC-002-QC兩張wiki卡退役或保留]] — QC 兩張 wiki 卡退役並重導向生產任務或保留
- [[SHP-006-出貨模組spec待建立]] — 何時建立出貨模組 spec（補 Data Model + 狀態機）

## 四、同步策略

依 [[erp_index]] + （已移除，見各 skill）：

- **Notion OQ DB 為對外確認版**（彙整推送時更新）
- 推送依 Miles 觸發，oq-manage skill 不主動推 Notion
- 推送後更新 `memory/erp/notion-publish-manifest.md` 對應列（不回寫 OQ 卡 frontmatter）

## 五、相關文件

- [[erp_index]] — 三邊分工原則
- （已移除，見各 skill） — 同步流程
- `.claude/skills/oq-manage/SKILL.md` — OQ 操作 skill（含 mode A 查詢 / B 新增 / C 更新 / D 遷出）

## 六、來源

- Notion [Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)（OQ + Task 混合，對外確認版）
- `oq-manage` skill v2.1（2026-05-19 改寫）
