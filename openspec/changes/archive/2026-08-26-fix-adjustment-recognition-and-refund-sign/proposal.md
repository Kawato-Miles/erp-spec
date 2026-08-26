# fix-adjustment-recognition-and-refund-sign

## Why

### Background

change sync-amount-rules-to-specs 撰寫時發現兩處既有 spec 與 wiki 正本矛盾，開 OQ 待裁；Miles 於 2026-08-26 裁決兩張都以 wiki 為準修 spec：

- ORD-045（訂單異動認列時點與補收草稿）：商業層已由 BI-25（2026-08-03 拍板，已封存）定案兩段式，狀態機正本見 [訂單異動狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單異動狀態.md)——退款經核可停「已核可」、業務執行「確認生效」才認列；補收先落「草稿」、確認生效直達「確認可執行」。既有 spec 多處寫「核可即認列」「跳過中間態直達」，屬條文殘留。
- CR-009（諮詢退費款項負值）：款項金額 sign 鐵則見 [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md) § 4.6 與 [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md)——款項紀錄一律正值、方向由款項類型表示。後端 sens-print-core 款項模型已如此實作（金額一律正值儲存、退款方向由款項類型承載），僅 consultation-request spec 退費段仍以負值表示。

### Problem Statement

spec 條文與 BRD 正本及後端實作不一致：照 spec 實作會做出「核可即入帳」「補收無覆核窗口」「退款款項存負值」三種與拍板相反的行為。

## What Changes

- 訂單異動認列時點：spec 條文改為狀態機定義——認列點統一在「確認生效 → 確認可執行」；退款核可後停「已核可」（可調金額不重審、留紀錄）；補收先落「草稿」再確認生效（免審）。
- 諮詢退費款項：金額改正值、方向由款項類型＝退款表示（訂單異動金額維持可負，不在此列）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- order-adjustment：認列時點與補收草稿條文照狀態機改寫
- order-billing：補收與退款相關段落的認列時點條文同步
- consultation-request：取消退費段款項金額改正值＋款項類型口徑
- after-sales-ticket：售後退款與補收的認列時點條文同缺陷一併改（同一裁決覆蓋）
- order-management：訂單取消退款與待諮詢取消的認列與款項口徑同上

## Impact

- 只動五份 spec 的既有 Requirement 條文，無新行為、無欄位與狀態變更（狀態機正本本來就是兩段式）。
- 後端零工作量（款項正值已實作）；Dev 的異動認列實作差距由開發對照修正後的 spec 收斂。
- 相關 OQ：本 change 併回後 ORD-045 依 BI-25、CR-009 依 § 4.6 結案封存。
