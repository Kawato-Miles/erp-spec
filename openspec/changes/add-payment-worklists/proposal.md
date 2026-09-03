## Why

### Background

業務、業務主管、會計目前用試算表跨訂單追蹤待收款項、待開發票、待出金退款、對不上帳的訂單，四件事各自維護、容易漏看。wiki 已定案四張唯讀跨訂單清單取代試算表，正本見 [帳務流程 § 跨訂單作業清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/帳務流程.md)、[對帳一致性 § 差額怎麼分型](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/對帳一致性.md)、[待出金退款清單組成](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/待出金退款清單組成.md)，角色動機見 [業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md) 角色卡，情境骨架見 [對帳與催收](../../../memory/Sens_wiki/wiki/erp/07-scenarios/對帳與催收.md)、[退款執行](../../../memory/Sens_wiki/wiki/erp/07-scenarios/退款執行.md)，欄位取值見 [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md)、[訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md) 兩張實體卡。設計已過 plan-design 五必含段與 plan-audit 稽核、Miles 已拍板（grill 拍板紀錄見設計文件），本 change 承接拍板後的設計方案，不重跑釐清。

### Problem Statement

四張清單目前沒有系統行為規格：應收款項與待退款雖有後端實作，但規格從未寫下進入 / 移出條件、可見範圍、匯出行為；待開發票與帳務異常兩張完全沒有規格與實作。缺規格會讓開發各自猜測進出清單的判準，也讓帳務異常清單的兩型判定（發票待折讓或作廢 / 超收）無所依循。

過期的 `add-pending-receivables-and-invoicing-pages` change 命名舊、指向已棄用的 `sens-erp-prototype` repo，且與本次多處拍板結論相反，已依 Miles 裁定刪除；本 change 是重新開立的取代版本。

## What Changes

### New Capabilities

- `payment-worklists`：跨訂單款項作業清單，四張唯讀清單——應收款項、待開發票、待退款、帳務異常。

### Modified Capabilities

無。單張訂單層的金額、期次、發票、折讓、核銷規則不動，仍歸 `order-billing`；`order-billing` 既有「應收帳款帳齡底層欄位與訂單列表帳齡篩選」Requirement 本次不動（逾期天數這輪另案處理），「諮詢訂單帳務處理」Requirement 內「自動建立的 BillingInstallment 出現在待開票期次待辦列表」Scenario 所述的待辦列表，即本 change 的待開發票清單，新 spec 以引用銜接、不對 `order-billing` 做 MODIFIED。

## Capabilities

### New Capabilities

- `payment-worklists`：四張唯讀跨訂單清單（應收款項、待開發票、待退款、帳務異常）的進入 / 移出條件、欄位、排序、搜尋、可見範圍、匯出行為。

### Modified Capabilities

無。

## Impact

- 新增 `openspec/specs/payment-worklists/spec.md`，不影響其他既有 spec 檔案。
- Prototype：`erp` repo `(prototype)/payment/` 四頁，由另一 agent 平行製作中，本 change 的 tasks 以核對 Prototype 與 spec 一致為主。
- 後端 `sens-print-core`：應收款項與待退款清單已有實作；待開發票與帳務異常清單尚無實作，屬本 change 定義行為、後續另開發票工單。
- 相關未解 Open Question（本次沿用不重覆開卡）：[BI-005-CSV14欄會計實務驗證](../../../memory/Sens_wiki/wiki/erp/08-open-questions/BI-005-CSV14欄會計實務驗證.md)。
- 另案處理清單（設計產出時識別、Miles 已於拍板紀錄中裁定延後，不在本 change 範圍）：逾期天數與分級、帳務異常清單依帳務公司分批、逾期款項清單、待開發票清單內開票、建議動作欄、差額原因欄。
