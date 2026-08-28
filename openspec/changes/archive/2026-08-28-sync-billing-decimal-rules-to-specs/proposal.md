## Why

### Background

2026-08-28 拍板三件與金額和發票有關的規則，wiki 正本已更新並提交：

- 發票品項的商品單價可帶到小數點後兩位。電子發票平台的文件把單價寫成整數型別，但業務實測以字串送出即接受小數（見 [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md)）。商品小計跟著照實帶小數不取整（見 [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) § 發票品項）。
- 品項各列加總與未稅目標值的差在一元以內即可開立。單價帶小數之後各列小計會帶角分，而銷售額一律是整數元，這一元以內的差只出現在發票這張紙上、不進任何對帳等式（見 [付款發票邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯.md) § 五G，驗算見 [對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/對帳一致性.md) 例子 10）。
- 一期改收多期走哪條路由業務決定：改原期次金額再新增幾筆補足，或取消原期次整組重建。系統不提供專屬的拆期操作，也不限制走哪一條（見 [付款發票邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯.md) § 五F、[收款項目狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/收款項目狀態.md)）。

另外核對時發現收斂張的減法基數在 spec 寫成「訂單未稅總額」，wiki 正本是「未稅基準」（未稅總額加已認列訂單異動的未稅合計）。訂單有已認列異動時兩者不同值。

### Problem Statement

order-billing spec 有六處與上述定案不一致。開發依 spec 實作會做出擋掉小數單價、要求品項加總逐元相等、以及把拆期寫成唯一路徑的行為，與 wiki 正本相反。收斂張基數的那一處更會在訂單有已認列異動時算出錯的銷售額。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- order-billing

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- order-billing：發票品項的單價與小計改為可帶兩位小數、品項加總與目標值的差容許一元以內、收斂張減法基數改取未稅基準、期次重分配改為兩條路並陳，並清掉拆期取消後殘留的稽核事件與 KPI 分子。

## Impact

- 影響 openspec/specs/order-billing/spec.md 的五個 Requirement：發票開立、ezPay 品項硬約束、請款期次行為規則、營運管理 KPI 定義、活動紀錄事件型別。
- 後端 sens-print-core 的發票品項單價目前是整數型別、銷售額由品項加總正算、沒有收斂張，這三項的修正需求已於 2026-08-28 留言交付 BE-310，不在本 change 的範圍。
- 前端 erp 的發票開立視窗品項單價目前不收小數，修正需求已留言交付 FE-376，不在本 change 的範圍。
- 不影響其他 spec：訂單稅額四捨五入、期次取消門檻、收款核銷分配三處經核對後與 wiki 一致，不需異動。
