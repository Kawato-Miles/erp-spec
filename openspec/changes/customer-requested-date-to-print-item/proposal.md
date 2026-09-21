# 客戶指定收件日移到印件層

## Why

### Background

Miles 於 2026-09-21 比對公司參考文件後拍板：客戶指定收件日由訂單層改為印件層，逐印件填寫；需求單不設此欄，成交轉訂單後才填；黃色提醒改比同一件印件的印件預計交期。本拍板推翻同日交期鏈改版第 9 題的訂單層落點。wiki 已落卡（[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) 新增欄、[訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md) 刪欄、[訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md) 第三條、[訂單印件規格維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單印件規格維護.md)、[訂單客戶與聯絡資料維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單客戶與聯絡資料維護.md)）。本 change 只把已定案內容同步進訂單規格。

### Problem Statement

同一張訂單的印件可各自分批出貨，客戶對每一件的收件期待也各自不同。收件日記在訂單層時，業務只能填一個日期，對不上分批的印件，黃色提醒也只能比旗下最晚那一筆，早出的那幾件完全沒被檢核。

## What Changes

| 模組 | 變動 |
|---|---|
| order-management | MODIFIED「客戶指定收件日」：層級改印件、維護入口改印件編輯側板、呈現處三處、提醒基準改同一件印件；新增兩件印件各填一值的 Scenario。MODIFIED「訂單詳情頁編輯型 Section 統一編輯時機與角色」：訂單資訊 Section 不再提供該欄編輯入口 |

不動：印件內部完成日、印件預計交期、訂單層三個衍生日期的規則；運送天數來源（ORD-057）。

## Impact

- OpenSpec：order-management 兩條 Requirement。
- Prototype：訂單印件編輯側板加欄、訂單資訊編輯側板刪欄、印件基本資訊面板（印件詳情頁與工單詳情頁共用）加兩欄唯讀（訂單預計交貨日期、客戶指定收件日）、mock 鏈欄位由訂單搬到印件。
- 測試：第四章訂單與印件相關情境更新，第十四章 14.22 欄位清單更新。

## Out of Scope

- 稽核：欄位移層、規則不變，Miles 拍板跳過 plan-audit。
