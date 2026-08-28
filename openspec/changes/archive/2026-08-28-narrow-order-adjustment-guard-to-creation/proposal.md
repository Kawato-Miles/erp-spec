## Why

### Background

訂單異動的終態守衛範圍於 2026-08-29 由 Miles 拍板收斂。商業正本已落卡：

- [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md)（§ 狀態推進不依訂單狀態、§ 訂單完成後金額異動路徑分流的四條建立分支）
- [訂單異動狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單異動狀態.md)（轉換表明文不檢查訂單狀態）
- [訂單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md)（取消連鎖不含在途異動、諮詢取消的建單排序）
- [訂單異動](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單異動.md)（關聯售後服務單在終態時必填）
- [訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)（新增「訂單完成時間」欄）
- [對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/對帳一致性.md)（完成後才認列的重核提示）
- [諮詢收尾規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/售前/諮詢收尾規則.md)（刪除系統代建退款款項、補建單排序）
- [售後服務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/售後服務狀態.md)（結案不影響底下異動推進）

相關 OQ：[ORD-049](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/ORD-049-諮詢取消退費撞上訂單異動終態守門.md) 已拍板封存；[BI-029](../../../memory/Sens_wiki/wiki/erp/08-open-questions/BI-029-完成後才認列的重核提示要不要覆蓋已取消訂單.md) 未解（重核提示的覆蓋範圍，不擋本 change）。

### Problem Statement

`order-adjustment` spec 有兩處與拍板後的商業正本相反：

1. Scenario「訂單完成後仍可於訂單詳情頁建立訂單異動」寫「系統 SHALL NOT 以訂單狀態 disabled 該按鈕」「掛售後服務單只是建議，系統 SHALL NOT 強制」。正本與後端都強制。
2. 狀態機把「確認可執行」寫成終態不可逆。wiki 狀態列舉寫「不是終態：業務主管仍可取消」。

另有兩處缺漏：狀態推進不檢查訂單狀態這條規則在 spec 內沒有明文；諮詢取消退費的建單排序（早於訂單轉終態）沒有寫進 `consultation-request` spec，且該 spec 仍讓系統代建退款款項，那一步會被防超退上限擋下。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `order-adjustment`：建立改為四條分支（依訂單狀態與訂單類型）；狀態推進明文不檢查訂單狀態；「確認可執行」的終態與否正名；訂單取消連鎖不含在途異動。
- `consultation-request`：諮詢取消退費不再由系統代建退款款項；訂單轉終態的步驟明訂晚於建立訂單異動。

**BREAKING**：`order-adjustment` 終態訂單於訂單詳情頁的建立入口由放行改為擋下。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `order-adjustment`：Requirement「訂單異動（OrderAdjustment）建立與審核」與「訂單異動（OrderAdjustment）狀態機」。
- `consultation-request`：Requirement「諮詢取消觸發建諮詢訂單與退費」。

## Impact

- 後端 `sens-print-core`：終態守門的引用範圍由四個動作縮為建立一個；建立守門加訂單類型與系統內生類型的分流；諮詢取消退費的建單排序與退款款項改由人建（該情境後端尚未實作）。
- 前端：訂單詳情頁訂單異動分頁的新增入口在終態訂單停用並附引導。
- Prototype：訂單異動分頁與售後服務側板的按鈕可用性同步。
- Linear：訂單異動與售後服務兩個 Feature 票及其 Task 票同步。
