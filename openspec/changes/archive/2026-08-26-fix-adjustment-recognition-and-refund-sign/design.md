# design：fix-adjustment-recognition-and-refund-sign

## Context

兩張 OQ（ORD-045、CR-009）的裁決都是「spec 照 wiki 修」，屬條文對齊，無新設計。認列時點的行為正本是 [訂單異動狀態] 狀態機卡；款項 sign 正本是 ezPay 卡 § 4.6 與帳務卡。

## Goals / Non-Goals

### Goals

- 三份 spec 的認列時點、補收草稿、退費款項口徑與 wiki 正本一致。

### Non-Goals

- 不改狀態機（正本本來就對）、不動欄位表、不改後端、不動其他模組。
- 訂單異動金額的正負慣例不動（異動本來就可負，見 ezPay 卡 § 4.6 三實體表）。

## Decisions

- **條文以狀態機六站語彙改寫**：草稿／待主管審核／已核可／已退回／確認可執行／已取消，認列點寫「進入確認可執行時」，不自創新詞。
- **delta 全用 MODIFIED**：全是既有 Requirement 的條文修正，無新增無移除。

## Risks / Trade-offs

- [Dev 實作若為一段式，spec 修正後出現實作差距] → 屬開發待辦，由 Linear 票承接，不阻擋本 change。

## Migration Plan

- delta 併回 → validate → grep 驗證「核可即」「跳過中間態」「負值退款款項」零殘留 → archive → OQ 結案。
- 回滾：git revert。

## Open Questions

（無）
