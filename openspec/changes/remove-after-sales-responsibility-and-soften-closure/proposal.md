# Proposal: remove-after-sales-responsibility-and-soften-closure

## Why

### Background

售後服務單（AfterSalesTicket）的「責任歸屬」欄位（公司認賠／客戶承擔／共同分擔）原定位為「補印是否收費、退款是否由公司吸收」的操作依據，但 spec 早已明定系統不依此欄位自動帶建補收異動單（與 responsibility 解耦）——欄位實際上不驅動任何系統行為，形成「宣稱（欄位值）與事實（有無補收異動單）」雙寫打架的設計債。Miles 於 2026-07-20 拍板移除此欄位，收費事實回歸單一真相：**有無掛補收異動單**。

同批拍板：售後單結案由「退款三組件硬阻擋」改為「軟提示＋允許強制結案」（提醒範圍含未完結異動單與未出貨完成的補印印件），並回寫 AFT-10 已拍板的文字欄位修改留痕規則。

wiki 商業正本已先行更新（BRD 先行，commit c731696）：

- [售後服務（實體卡）](../../../memory/Sens_wiki/wiki/erp/05-entities/售後服務.md)——欄位正本，責任歸屬列已移除
- [售後服務規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則.md)——免費／付費補印改收費事實表述、收費不設欄位判斷
- [售後服務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/售後服務狀態.md)——結案 guard 擴為「未完結異動單或未出貨完成補印印件提示但允許強制結案」
- [付款發票邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯.md)——售後情境列與連帶矩陣去 responsibility 條件

相關 OQ 拍板：[AFT-5（已結案封存）](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/AFT-5-補費OA由誰建立.md)——補印收費由業務手動建補收異動單、金額為協商價；[AFT-10（已結案封存）](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/AFT-10-售後單文字欄位修改鎖定規則.md)——客訴內容與結案後客戶回饋可改＋修改寫入活動紀錄（拍板時標記「spec 回寫待後續 change」，即本 change）。

### Problem Statement

1. spec 存在「責任歸屬」Requirement 與遍布全篇的欄位引用（建單必填、列表欄、篩選器、活動紀錄事件、情境 GIVEN 條件），與 wiki 欄位正本（已移除）矛盾。
2. spec 存在兩套互斥的結案模型：「退款三組件未完成 MUST NOT 結案（按鈕 disabled）」硬阻擋 vs wiki 狀態機卡「提示但允許強制結案」軟提示；Miles 已拍板軟提示側，硬阻擋 Requirement 須以 MODIFIED 改寫，否則主 spec 矛盾並存。
3. AFT-10 拍板的修改留痕規則（客訴內容、結案後客戶回饋可改＋活動紀錄）尚未回寫 spec；「結案後客戶回饋」的修改行為 spec 全無著墨。
4. 逾期 7 天預設值的出處連結指向已封存 change 路徑（斷鏈）。

## What Changes

- **BREAKING**：移除售後服務單「責任歸屬」欄位的全部行為規格（Requirement、建單必填、列表欄、篩選器、活動紀錄事件、情境條件）；補印收費判斷改為行為驅動（有無補收異動單）
- **BREAKING**：售後退款三組件「未完成不可結案」硬阻擋改為「列出未完結項目提示、允許強制結案」；三組件進度展示保留、結案按鈕不再鎖定
- 售後單狀態機結案轉換補軟提示 guard（未完結異動單或未出貨完成補印印件）
- 新增「客訴內容與結案後客戶回饋修改留痕」Requirement（AFT-10 回寫）
- Purpose 管理切片改述：售後退款金額由退款異動單總額推導、分類切片用售後類型（case_category）
- 修復逾期預設值出處斷鏈（改指 AFT-2 OQ 卡）

## Capabilities

### New Capabilities

（無——全部為既有 spec 行為修改）

### Modified Capabilities

- `after-sales-ticket`：移除責任歸屬 Requirement 與全部引用；結案硬阻擋改軟提示（MODIFIED 三組件組合＋三組件進度展示＋狀態機 Requirement）；新增修改留痕 Requirement；Purpose 改述；斷鏈修復
- `business-scenarios`：售後四情境的 GIVEN／步驟去 responsibility 條件，補印免費／收費分流改行為表述
- `prototype-data-store`：AfterSalesTicket entity 與 factory 移除 responsibility 欄位

## Impact

- OpenSpec：`openspec/specs/after-sales-ticket/spec.md`（主要）、`openspec/specs/business-scenarios/spec.md`、`openspec/specs/prototype-data-store/spec.md`
- Prototype（sens-erp-prototype）：`src/types/afterSalesTicket.ts`、`AfterSalesTicketDetail.tsx`、`AfterSalesSection.tsx`、`mockAfterSalesTickets.ts`、`MyAfterSales.tsx`、`SalesManagerAfterSales.tsx`、`useErpStore.ts`、售後測試——移除欄位、篩選器、表格欄與相關斷言
- Linear 交付：BE-169／FE-260／中台 project 售後段（spec 定案後經 linear-delivery 同步，不在本 change 範圍）
- 相關未解 OQ（不阻擋本 change）：AFT-2（逾期分級）、AFT-4（補印優先度）、AFT-12（揀貨裝箱錯誤分類）、XM-004（售後端到端推演）
