# 工單詳情摘要卡只留預估利潤率

## Why

### Background

Miles 於 2026-09-21 比對公司 2026-09-18 三份參考文件時追加拍板：工單詳情摘要卡不再呈現「實際利潤率」，只留「預估利潤率」；實際利潤率只在印件層與訂單層呈現。wiki 已落卡（[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) 欄位段成本條、相關領域知識條）。本 change 只把已定案內容同步進工單規格。

### Problem Statement

工單是製作單位，實際成本在製作期間持續變動，工單頭上的實際利潤率在單子做完前一直是半成品數字，印務排製程用不到它。實際獲利要看的人（業務、主管）在印件詳情頁「報價與利潤」頁籤與訂單層已看得到。工單規格目前仍寫摘要卡兩格，與 wiki 不一致。

## What Changes

| 模組 | 變動 |
|---|---|
| work-order | MODIFIED「工單詳情摘要卡利潤率」：兩格改一格；四個 Scenario 同步；「任務進度」與「顏色費用合計」兩格被取代的條文改為被「預估利潤率」一格取代 |

不動：利潤率算式與三段門檻（正本 [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)）、可見範圍、印件詳情頁「報價與利潤」頁籤、訂單層利潤率、生產績效指標頁。

## Impact

- OpenSpec：work-order 一條 Requirement。
- Prototype：`work-orders/_components/detail/WorkOrderSummary.js` 刪一格；同批施工尚有純介面調整（印件基本資訊欄序、訂單層兩日期、任務實際完成日移展開列、任務表不橫向捲動），不在規格範圍、由任務書承載。
- 測試：Sens `erp-prototype-tests` 情境 14.x 摘要卡斷言改一格。

## Out of Scope

- 印件層、訂單層、生產績效指標頁的實際利潤率。
- 稽核：純刪顯示欄、不改算式與權限，Miles 拍板跳過 plan-audit。
