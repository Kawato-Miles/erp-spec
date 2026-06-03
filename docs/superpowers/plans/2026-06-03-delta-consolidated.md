# 訂單對外發布 — 完整 delta（執行 worklist）

> Phase 0 卡 drift 詳細指示見 `2026-06-03-phase0-delta-worklist.json`（19 張）+ 本檔補檢 5 卡。

## A. Vault 訂單 user story 對齊（Phase 0）— 20 需改 / 9 對齊

**需改（20）**：US-ORD-001,002,003,004,005,006,007,009,011,013,020,021,022,024,026,027,029,030,032,**035**
**對齊（9）**：US-ORD-008,010,012,023,025,028,031,033,034

US-ORD-035 補檢結論：殘留「退款 OA 已執行 = 綁退款 Payment 累計達標推進」（路 C 已移除）→ 前置條件/業務流程5/成功條件4 改為「主管核可即推進已執行、應收即時扣減；退款 Payment 切已完成另核銷應退差額（兩軌解耦）」。

**openIssue（Phase 0 衍生，需開 OQ）**：
- US-ORD-013：退款執行角色歸屬（業務 vs 會計）spec 未明確 → 開 OQ，卡先標另案不臆造。
- US-ORD-026：related-scenarios 錨點「訂單異動流程#旅程A」名稱可能已變 → 確認正確 heading 不臆造。

## B. Notion User Story DB delta

- **toCreate（18）**：US-ORD-009,013,020,021,022,023,024,025,026,027,028,029,030,031,032,033,034,035（Notion 現缺）
- **toUpdate（8，Notion 已有且需改）**：US-ORD-001,002,003,004,005,006,007,011
- 唯一鍵 = `編碼`；推送後回填 Vault frontmatter notion-published-at / notion-page-url。

## C. Notion 資料欄位 DB delta（schema 整併）

**lovToAdd（資料表 select 新增實體，皆經 OpenSpec 查證）**：
OrderAdjustment、OrderAdjustmentItem、OrderExtraCharge、OrderActivityLog、Payment（取代 OrderPaymentRecord）、BillingInstallment、PaymentAllocation、SalesAllowance、Invoice、InvoiceItem、OrderSignedFile、OrderAttachment、SalesAllowanceFile、PaymentFile、PrintItemExpectedLine

**lovToDelete（過時，R2 已授權刪）**：OrderPaymentRecord（被 Payment 取代）、PlannedInvoice（L4223 BREAKING 已廢止，若 LOV 有）

**fieldsToAdd**：OrderAdjustment(13 欄)/OrderAdjustmentItem(5)/OrderExtraCharge(7)/Payment(16)/BillingInstallment(23)/PaymentAllocation(5)/SalesAllowance(7) 核心業務欄位（完整表見對話 schema agent 輸出）

**fieldsToUpdate（Order 既有）**：
- payment_status：清除「待 ORD-002」過時註記（spec 正本無此註記）
- payment_method / payment_detail / paid_at：**保留**（spec Order 仍持有），備註補「線上單摘要欄位；逐筆收款明細以 Payment 實體為正本」
- signed_at：備註補「上傳 OrderSignedFile 首份時自動寫入」

**openIssues（需 Miles 拍板）**：
1. Payment / BillingInstallment 在 OpenSpec § Data Model **無獨立欄位表**（散在 Requirements + prototype-data-store 型別）→ Notion 命名風格用 store 的 camelCase 還是轉 snake_case？是否先在 OpenSpec 補 Data Model 表再推？
2. OrderActivityLog 基礎欄位（id/order_id/actor/created_at）正本未展開；eventType enum 已明確（含路 C 新增 PRE_COMPLETION_AMOUNT_DECREASE）
3. OrderAdjustment audit 子欄位落點（內嵌 vs ActivityLog payload）spec 未明示
4. PrintItemExpectedLine 歸「訂單域」或「生產域」LOV 待認定

## D. Linear 訂單管理 project delta

**issue 代號修正（重要）**：我原以為 FE-259/BE-168，實際 workspace 為：
- **FE-261** 訂單列表與詳情頁、**BE-170** 訂單主流程、**BE-171** 訂單異動流程（受路 C 衝擊最重）、**FE-260** 售後列表、**BE-169** 售後流程、**DE-52** 版型（連帶）

**projectSections 需更新（A–G）**：收款核銷與三方對帳補四向差額分解 + 退款核銷應退差額；訂單異動退款改核可即生效；「補收/退款不對稱」改寫；「編輯時機」改完成/取消終態分界（含調降 pre_completion_amount_decrease 留痕）；新增「審核通過狀態下訂單修改」（不鎖明細金額、只鎖 payment_terms_note）；訂單列表補多維度篩選 + 完整狀態集。

**OrderAdjustment 狀態機 UML 需改**：
- 刪除回退轉換 `已執行 --> 已核可`
- `已核可 --> 已執行` label 改「業務主管核可後系統自動推進（應收調整生效，不綁退款收款）」
- note 改「退款：主管核可即生效；現金完成由退款 Payment 獨立切已完成承載」

**訂單/印件狀態機本批不動**（兩 change 未改）。
