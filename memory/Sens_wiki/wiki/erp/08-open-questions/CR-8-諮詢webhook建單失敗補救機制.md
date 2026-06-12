---
type: open-question
module:
  - 諮詢單
oq-id: CR-8
status: open
priority: medium
audience: external
raised-at: 2026-06-12
raised-by: Phase B 諮詢批次遷移
source-link: openspec/specs/consultation-request/spec.md § 諮詢費付款成功觸發自動建單（不建訂單）
related-vault:
  - "[[諮詢表單webhook串接約束]]"
expected-resolution-at: 2026-07-15
---

# 問題描述

金流平台已向客戶扣款成功，但 ERP 自動建立諮詢單失敗（必填欄位缺失、表單 payload 異動被系統拒絕建單、或系統暫時無法處理）時，公司如何補救？此情形下客戶的錢已收，但 ERP 內無對應的諮詢單與付款紀錄可供諮詢人員認領與服務，存在「收了錢卻無人接住」的缺口。

補救流程與對客時限承諾屬執行層服務水準（SLA），目前未定義。

# 待解答

- [ ] 建單失敗時誰負責補救（值班業務 / 工程值班 / 兩者分工）？
- [ ] 對客戶的補救時限承諾為何（多久內必須完成手動建單或主動聯繫客戶）？
- [ ] 補救時諮詢單與付款紀錄的手動補建方式（人工補入 ERP 或請客戶重填表單）？
