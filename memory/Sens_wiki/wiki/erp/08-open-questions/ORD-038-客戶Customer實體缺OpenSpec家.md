---
type: open-question
module:
  - 訂單管理
oq-id: ORD-038
status: open
priority: medium
audience: internal
raised-at: 2026-06-03
raised-by: Claude (data-model.md 棄用刪除揭露)
source-link: docs/data-model.md 棄用刪除（2026-06-03，資料模型回歸 OpenSpec 架構管理）；刪除前孤兒化檢查發現 Customer 無 OpenSpec 家
related-vault:
  - "[[訂單]]"
related-oq:
  - ORD-032
related-change:
expected-resolution-at: CRM 模組規劃時
---

# ORD-038：客戶（Customer）實體缺 OpenSpec 家

## 問題描述

棄用並刪除 `docs/data-model.md`（資料模型統一回歸 OpenSpec spec 架構管理）時，孤兒化檢查發現：訂單集群 17 實體全部已被 OpenSpec spec 覆蓋（order-management / quote-request / work-order / production-task / prototype-data-store 等），唯獨 **客戶（Customer）實體在所有 OpenSpec spec 中只以 `customer_id` FK 被引用，沒有任何實體欄位定義**。

被刪除的 data-model.md 中 Customer 含以下欄位（曾為唯一定義來源）：`member_number`（會員編號）/ `member_type`（會員身份：一般 / VIP / 企業 / 其他）/ `tax_id`（統一編號）/ `invoice_type`（發票類型：電子 / 紙本 / 免開）/ `company_name` / `short_name` / `contact_name` / `contact_phone` / `contact_email` / `address` 等。

此實體是訂單發票邏輯的上游：Order 的 `billing_company_id`（帳務主體）、`invoice_unified_number`（統編）、Invoice 的 `buyer_name` / `buyer_ubn` / `category`（B2B/B2C）等都與客戶稅務 / 發票設定相關。客戶實體無權威定義 → 後端設計訂單 / 發票資料模型時，上游客戶欄位無依據。

**同類孤兒：聯絡人（Contact，廠客模組窗口聯絡人主檔）**。Order 以 `contact_id` FK 指向，但 Contact 實體同樣無 OpenSpec 家。關聯邊界已確認（2026-06-03）：Contact 僅與 Order 關聯，Invoice MUST NOT 關聯 Contact（買受人為發票開立當下去正規化快照，不回指 Contact / Customer）。Contact 完整實體定義（多窗口、公司抬頭兩層結構）應與 Customer 一併於 CRM 模組規劃時建立。

## 涉及範圍

- 模組：CRM（廠客管理）/ order-management（Invoice 上游）
- 影響：OpenSpec 無 Customer 實體權威欄位表；後端設計訂單發票資料模型時客戶稅務 / 發票設定欄位無來源
- 註：BillingCompany（帳務公司，對應藍新 MerchantID）與 Customer 關係亦待釐清（一客戶多帳務公司？）

## 待解答

- [ ] Customer 實體權威定義要放哪個 OpenSpec spec（新建 crm spec / 掛 order-management / prototype-data-store）
- [ ] 欄位來源：從已刪除 data-model.md git 歷史 + Prototype 客戶資訊區彙整為單一權威表
- [ ] Customer 與 BillingCompany 的關係（FK 方向、一對多 / 多對多、發票主體歸屬）
- [ ] `invoice_type`（電子 / 紙本 / 免開）與 Invoice § ezPay 模型（已移除 print_flag）是否一致，是否仍需保留客戶層發票偏好

## 候選方案

### 方案 A：CRM 模組規劃時一併建立 Customer / BillingCompany 完整 spec
- 優點：CRM 為獨立領域，與訂單發票關係一次理清；符合「文件即規格」
- 缺點：需排 CRM 規劃，短期內訂單發票上游仍缺定義

### 方案 B：短期先在 order-management 或 prototype-data-store 補最小 Customer 參照欄位表
- 優點：解後端當前訂單發票資料模型設計的上游缺口
- 缺點：CRM 正本歸屬未定，可能日後搬遷
