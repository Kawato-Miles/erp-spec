# design：sync-amount-rules-to-specs

## Context

金額規則已在 wiki（BRD 正本）落卡、Linear（PM-1082 主票與四張 sub-issue）交付、Prototype 實作驗證。本 change 只做 PRD 層同步：把七份 spec 的金額相關 Requirement 改寫為拍板後行為。沒有程式實作——Dev 修復由 Linear 票驅動、Prototype 已完成。

## Goals / Non-Goals

### Goals

- 七份 spec（quote-request、order-management、order-billing、order-adjustment、work-order、after-sales-ticket、consultation-request）的金額行為規格與 wiki 一致。
- 廢止已翻案行為的 Requirement 留下 Reason 與 Migration。

### Non-Goals

- 不動欄位表與狀態列舉（正本在 wiki）。
- 不含程式實作與 Prototype 修改。
- 不處理 delta 撰寫時發現的三處既有 spec 與 wiki 不一致（退款認列時點、補收草稿、諮詢退費負值口徑）——另列 Open Questions。

## Decisions

- **delta 全用 MODIFIED／REMOVED、少用 ADDED**：新語意取代舊行為，exact-title 併回才不會新舊並存（schema 既定紀律）。
- **規則本體不複寫**：計算式與口徑引用 wiki 卡，spec 只寫外部可觀察行為與 Scenario；驗收數字統一用 12,501 驗算錨，與 wiki 例子 4、Linear 驗收條件同一組，三處可互相對數。
- **順帶修正僅限對齊 wiki**（如折讓不建逐筆關聯款項），不擴大範圍。

## Risks / Trade-offs

- [七份 spec 一次併回，diff 大] → delta 已通過 openspec validate；archive 後以 grep 驗證舊語句零殘留。
- [三處既有不一致未處理] → 已列 Open Questions，避免本 change 範圍蔓延；不一致處 MODIFIED 時照原文保留。

## Migration Plan

- `/opsx:sync` 將 delta 併回 main specs → grep 驗證 → `/opsx:archive` 歸檔。
- 回滾：git revert 該次 sync commit 即可，無資料遷移。

## Open Questions

- 退款認列時點：spec 寫核可即認列、wiki 寫確認生效才認列（待 OQ 裁決後另 change 修正，見 wiki OQ `ORD-045-訂單異動認列時點與補收草稿的規格條文殘留`）。
- 補收是否先落草稿：spec 寫直達、wiki 寫先草稿再確認生效（同上，見 `ORD-045-訂單異動認列時點與補收草稿的規格條文殘留`）。
- 諮詢取消退費流程的款項金額正負口徑與 wiki 帳務卡不一致（同上，見 `CR-009-諮詢取消退費款項金額正負口徑不一致`）。
