## Why

### Background

order-billing spec 的退款 / 折讓金額模型曾分兩次遷移：訂單收退款模型重構（2026-06-02，未動 order-billing）+ 帳務實體對齊 BRD（2026-06-12，MODIFIED 9 條 order-billing Requirement 到新模型）。第二次遷移只枚舉並改了「核心 9 條」，漏掉其他同樣帶舊模型文字的 Requirement，導致 spec 內同一實體被新舊兩種寫法並陳、互相矛盾。

新舊模型對照（正本依據）：

- 三實體金額 sign 慣例正本：wiki [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md) §4.6（ezPay 全 API 正值、不收負額；退款方向靠作廢/折讓動作）
- 欄位正本：wiki [帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) § 收款紀錄 / 折讓單 / 發票品項、[訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md) § 金額組成、[訂單異動](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單異動.md)
- 退款款項模型：款項類型（收款/退款）+ 金額一律正值

### Problem Statement

兩類既有缺陷需一次清乾淨（避免再漏看而復發）：

1. **退款 / 折讓 sign 新舊並陳**：部分 Requirement 仍寫「收款方式＝退款、金額負數」（Payment 舊模型）與「折讓金額 MUST 為負數 / 折讓限負數防呆」（折讓舊模型），與現行「款項類型＋正值」「折讓正值」及 ezPay 契約（折讓金額正值、不收負額）直接抵觸。
2. **Data Model 欄位表複寫 wiki（違反單一正本鐵則）**：部分 Requirement 內嵌欄位表，與 wiki 實體卡（欄位正本）重複維護；另有一次性資料 Migration Requirement 已失效（Prototype 為 Mockup，mock 資料以新模型重生）。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `order-billing`：
  1. 退款 / 折讓 sign 全面對齊新模型（Payment 退款＝款項類型＋正值；折讓＝正值；訂單異動維持可正可負不動）。
  2. Data Model 欄位表移除，改引用 wiki 實體卡（單一正本）；移除已失效的一次性資料 Migration Requirement。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `order-billing`：(1) 9 條 Requirement sign 對齊與去 Data Model 欄位表殼；(2) 移除 2 條失效 / 重複 Requirement（訂單金額 Data Model 雙欄擴充、既有資料 Migration）。

## Impact

- **行為不變**：本 change 為一致性重構，不改任何系統實際行為——退款款項建立、折讓開立、對帳計算的實質規則不變，只是把 spec 文字對齊到既有正本（wiki + prototype 早已是新模型）。
- **單一正本對齊**：order-billing spec 不再複寫欄位表 / sign 慣例，欄位正本回歸 wiki 實體卡、sign 鐵則回歸 wiki MIG §4.6。
- **與 `add-pending-refund-payout-list` 關係**：兩 change 同碰 order-billing spec 但無同條 Requirement 衝突（本 change MODIFIED / REMOVED 既有條；待出金退款 ADDED 新條），archive sync 可分別併入。待出金退款清單建在本 change 清乾淨的 spec 上。
- **Prototype 層**：無需改動（types/payment.ts、salesAllowance.ts、orderAdjustment.ts 早已是新模型正值 + 款項類型）。本 change 是 spec 追上 prototype，非 prototype 追 spec。
- **範疇外**：折讓單狀態列舉是否遷 wiki 狀態機卡（06-state-machines）為另一類單一正本議題，不在本次（本次只清欄位表 Data Model 與 sign）。
