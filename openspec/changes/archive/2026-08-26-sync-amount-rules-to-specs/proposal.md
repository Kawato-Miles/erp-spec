# sync-amount-rules-to-specs

## Why

### Background

2026-08-20 Dev 實測（測試鏈 Q-20260820-01 → SO-26080013）重現一組金額缺陷：需求單轉訂單以單價回算造成角分差、發票單價欄口徑未標導致多開一層稅、稅額正算進位使發票加總大於應收。Miles 於 2026-08-21 至 2026-08-25 分批拍板整組金額規則並完成 wiki 落卡，商業正本見：

- [報價邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/售前/報價邏輯.md)（數量 × 單價、小計一次定案、議價調單價）
- [付款發票邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯.md) § 五G（發票含稅與未稅兩個目標值、收斂張、品項驗證）
- [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md) § 訂單完成前金額異動兩路並行
- [明細時點分界](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/明細時點分界.md)（訂單完成鎖明細）
- [訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md) § 金額組成（稅額取整、金額介面口徑通則）
- [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md)（發票反推算式、折讓限整數）
- [工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) § 建立來源（明細加量不回寫工單、缺口原工單異動承接）
- [對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/對帳一致性.md) 例子 4（12,501 驗算錨）

Linear 交付票（PM-1082 主票與 PM-1100／1101／1102／1104）與 Prototype（erp repo `prototype/production-stage`）已同步；OpenSpec 各 spec 的 Requirement 仍是舊規則。

### Problem Statement

PRD 層與 BRD 層不一致：七份 spec 的金額相關 Requirement 仍描述已被翻案的行為（報價總額為輸入、發票由品項加總正算、訂單未終態不開放退款補收、加量＝加開新印件且數量鎖定等）。開發若照 spec 實作會與 Linear 驗收條件相互矛盾。

相關未解 OQ：查 `memory/Sens_wiki/wiki/erp/08-open-questions/` 平層，無與本次金額規則直接相關的 open OQ（BI-027 已結案封存、PT-009 已具名翻案）。

## What Changes

- 報價與轉單：單價（未稅、限小數 2 位）為輸入，小計＝數量 × 單價四捨五入至整數元一次定案；轉單原值繼承不回算；需求單與訂單稅額同規則取整、含稅恆整數；需求單不設折扣欄，報價階段議價調單價。
- 訂單金額：完成前兩路並行（改明細 vs 訂單異動，業務判斷、同一筆錢一條路）；訂單完成鎖明細；數量異動自動重算小計並提示確認單價；議價用訂單折扣欄。
- 發票：以期次含稅為目標值反推（未稅＝含稅 ÷ 1.05 取整、稅額減法導出）；收斂張（開滿的那張未稅用減法，雙口徑三方恆等）；品項預設一式、開放自由編輯、系統驗小計與加總；開票一律從收款項目進入、期次唯讀顯示。**BREAKING**：廢除「發票金額由品項加總正算」。
- 折讓：金額限整數元（含稅未稅皆整數）。
- 金額介面口徑通則：欄名標示含稅未稅並顯示；計價類編輯未稅、對客戶收付類編輯含稅。
- 訂單異動：補收免審與退款送審不依訂單狀態擋。**BREAKING**：廢除「訂單未終態不開放退款與補收」。
- 工單：訂單明細加量不回寫工單，缺口由印務在原工單發起工單異動承接。**BREAKING**：廢除「加量＝加開新印件、原件數量鎖定」（PT-009 翻案）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- quote-request：報價欄位行為改數量 × 單價、小計定案、稅額取整、議價調單價
- order-management：明細可改至訂單完成、金額導出與口徑通則、數量異動重算提示
- order-billing：發票反推＋收斂張＋品項驗證＋口徑標示＋折讓整數＋開票入口
- order-adjustment：兩路並行、補收退款不依訂單狀態擋、同一筆錢一條路
- work-order：加量缺口原工單異動承接、目標數量鎖定語意
- after-sales-ticket：決議選項把關只留補做的事實判定
- consultation-request：引用「報價總額」的措辭同步為新欄位語意

## Impact

- 影響 spec：上列七份的金額相關 Requirement 與 Scenario；不動欄位表與狀態列舉（正本在 wiki）。
- 程式面：Dev 修復由 Linear PM-1100～1104 驅動，本 change 不含實作任務；Prototype 已完成不需再動。
- 相依：發票品項規則受 ezPay 外部硬約束（正本 [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md)），spec 以引用為準不複寫。
