## Context

order-billing spec 退款 / 折讓金額模型新舊並陳（2026-06-12 align 遷移只改核心 9 條、漏改其餘），且部分 Requirement 內嵌 Data Model 欄位表複寫 wiki 實體卡，違反單一正本鐵則。三實體金額 sign 慣例正本已於 wiki [發票法規硬約束-ezPay-MIG](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/發票法規硬約束-ezPay-MIG.md) §4.6 定錨（2026-06-14 依 ezPay PDF §5-8 補齊）。本 change 為一致性重構，不改任何實際行為。

## Goals / Non-Goals

### Goals

- order-billing spec 退款 / 折讓金額全面對齊「Payment 退款＝款項類型＋正值；折讓＝正值；訂單異動＝可正可負」三實體慣例。
- 移除 spec 內 Data Model 欄位表（改引用 wiki 實體卡），移除已失效的一次性資料 Migration Requirement。

### Non-Goals

- 不改任何系統行為（退款建立、折讓開立、對帳計算實質規則不變）。
- 不動 Prototype（types 早已是新模型）。
- 不遷折讓單 / 發票狀態列舉至 wiki 狀態機卡（狀態列舉單一正本是另一類議題，本次只清欄位表 Data Model 與 sign）。
- 不動訂單異動 sign（負數正確）。

## Decisions

### 決策 1：sign 慣例正本錨定 wiki MIG §4.6，spec 全部對齊

三實體 sign 由「是否送 ezPay」決定：訂單異動（不送、可正可負）、收款紀錄（不送、正值＋款項類型）、折讓單（送 `allowance_issue`、正值；ezPay 不收負額）。spec 所有退款 / 折讓金額描述對齊此錨點。

替代方案（否決）：保留 spec 內舊負數寫法——與 ezPay 契約 + wiki 正本直接抵觸，且正是本次要消除的矛盾來源。

### 決策 2：用 MODIFIED / REMOVED，不用 ADDED

對既有 Requirement 的 sign 修正與去 Data Model 殼一律 MODIFIED（完整複製改寫，標題精確匹配）；失效 / 重複 Requirement 用 REMOVED（附 Reason / Migration）。

替代方案（否決）：ADDED 新 Requirement——archive sync 按 exact-title 比對，ADDED 只增不刪，會與被取代的舊 Requirement 物理並存，重蹈 2026-06-12 align 漏改的同類矛盾。

### 決策 3：Data Model 欄位表移除而非搬移

欄位正本早已在 wiki 實體卡（訂單卡金額組成、帳務卡折讓 / 發票品項 / 收款紀錄、訂單異動卡）；附件子實體技術欄位（檔名 / 連結 / 大小 / 時間戳）屬實作細節在 Prototype types。故 spec 直接移除欄位表 + 引用 wiki，不需搬任何欄位進 wiki（Phase 1 已確認 wiki 覆蓋完整）。

## Risks / Trade-offs

- 與 `add-pending-refund-payout-list` 同碰 order-billing spec → 無同條 Requirement 衝突（本 change MODIFIED / REMOVED 既有條、該 change ADDED 新條）；archive 先後皆可，sync 分別併入。
- MODIFIED 完整複製既有 Requirement 文字 → 已逐條對照主 spec 原文，僅改 sign 相關字句與移除欄位表，行為描述不動。

## Migration Plan

- 純 spec 文字重構，無資料遷移、無 Prototype 改動。
- 回滾：archive 前可直接棄置本 change（main spec 不受影響）。

## Open Questions

- 無。折讓 sign 已由 ezPay PDF §5-8 + wiki MIG §4.6 定論（正值）。
