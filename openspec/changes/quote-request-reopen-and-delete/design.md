## Context

wiki 需求單狀態機卡已定案「重新啟動」與「刪除需求單」兩組轉換；Prototype（erp repo `quote-prototype`）已實作。`quote-request` spec 落後，且流失歸因的「流失後不可再變更」與重新啟動衝突。本變更只同步行為規格，不改商業規則、不改 Prototype。

## Goals / Non-Goals

### Goals

- 狀態轉換 Requirement 補上重新啟動與刪除，條件與 wiki 狀態機卡轉換表一致。
- 流失歸因移除「流失後不可再變更」。
- 補刪除需求單的情境目錄節與測試。

### Non-Goals

- 諮詢來源需求單流失後重新啟動與諮詢訂單的關係：另案處理，見 QR-006。
- Linear 交付：本變更不同步。
- 刪除後資料如何在後端保存與查詢：屬實作，spec 只描述外部可觀察行為（清單不再出現）。

## Decisions

- 刪除寫成「離開生命週期」的轉換，不新增「已刪除」狀態：wiki 狀態機卡以群組型轉換表達刪除、不列為狀態值。替代方案是新增狀態值，否決，理由是會和 wiki 狀態列舉不一致。
- 重新啟動目標為「待評估成本」，不是「需求確認中」：依 wiki 轉換表。

## Risks / Trade-offs

- [成交且已轉訂單的需求單被刪除] → 依 wiki：訂單保留、失去需求單來源連結；spec 以 Scenario 明寫。

## Migration Plan

無資料遷移。規格合併後，Prototype 與既有測試不需調整；新增刪除情境測試。

## Open Questions

- 諮詢來源需求單的重新啟動：見 QR-006。
