---
type: open-question
module:
  - prepress-review
oq-id: AR-1
status: answered
priority: medium
audience: internal
raised-at: 2026-05-21
raised-by: claude-on-task
answered-at: 2026-05-21
answered-by: Miles
source-link: pilot 遷移審稿模組 user story 時識別
related-vault:
  - "[[US-AR-010-B2C會員補件流程]]"
  - "[[_alignment-report]]"
related-oq: []
---

## 決策（2026-05-21 Miles 拍板）

**選 C**：B2C 會員視為 EC 系統範疇，**不入** ERP role 體系。

實作落實：
- US-AR-010 `role` frontmatter 標純文字「B2C 會員（外部使用者）」，**不 wiki link 至 03-roles/**
- vault-audit 維度 13 lint 對「role 為純文字（非 wiki link）」的卡放行；新增例外條件「外部使用者角色（如 B2C 會員）允許純文字 role」
- 03-roles/ 結構不改，保持為「公司內部員工角色」單一定位
- 未來其他涉及外部使用者（B2C 客戶 / EC 註冊會員 / 廠商客戶）的 user story 統一採此模式

---


# AR-1 B2C 會員是否納入正式角色

## 問題

撰寫 [[US-AR-010-B2C會員補件流程|US-AR-010 B2C 會員補件流程]] 時發現：「B2C 會員」作為「作為（角色）」，但 [[_alignment-report|03-roles/]] 列表內無「會員」/「EC 會員」/「B2C 客戶」對應角色卡。

## 影響

- user-story `role` frontmatter 需 wiki link 至 `03-roles/`，但對應卡不存在 → dangling link
- 未來 B2C 補件 / 自助下單 / 自助修改流程相關 user story 都會面臨同樣問題
- 既有 16 角色（業務 / 諮詢 / 印務 / 印務主管 / 審稿 / 審稿主管 / 生管 / 師傅 / QC / 出貨 / 會計 / 訂單管理人 / Supervisor / EC 商品管理 / 中國廠商 / 外包廠商）皆為**內部員工**，B2C 會員是**外部使用者**，角色定位本質不同

## 選項

| 選項 | 說明 | 利弊 |
|------|------|------|
| A | 新增「B2C 會員」role 卡至 `03-roles/`（標記為 audience=external）| 與既有 16 個內部員工角色並列，需設定欄位區分內 / 外部使用者 |
| B | 新建 `03-roles/_external/` 或 `03-roles/customer/` 子目錄專收外部使用者角色 | 結構清楚但 03-roles 須改造，影響範圍大 |
| C | 視為「業務代理操作」（業務代會員操作 ERP），US-AR-010 改為業務視角 | 不符實際（B2C 會員自助補件就是會員親自操作，業務只追蹤狀態）|
| D | 跨 ERP / EC 兩系統視角，B2C 會員屬 EC 範疇，不入 ERP role 系統，US-AR-010 標 role 為「外部使用者」純文字而非 wiki link | 維持 03-roles/ 純度，但 user-story lint 規則要例外處理 |

## 暫定處理

pilot 階段先用選項 D：US-AR-010 的 role frontmatter 標純文字「B2C 會員（外部使用者）」，待本 OQ 解答後統一處理。
