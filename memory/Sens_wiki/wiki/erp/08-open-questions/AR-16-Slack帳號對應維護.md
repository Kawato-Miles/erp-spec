---
type: open-question
module:
  - 印前審稿
oq-id: AR-16
status: open
priority: low
audience: internal
raised-at: 2026-07-02
raised-by: Miles + Claude（線下單審稿分派機制變更討論）
source-link: memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/審稿討論Slack串接約束.md
related-vault:
  - "[[審稿討論Slack串接約束]]"
  - "[[訂單管理人]]"
related-oq: []
expected-resolution-at: OpenSpec change 實作階段
---

# AR-16 Slack 帳號對應維護

## 問題

審稿討論串建立時要 mention 訂單管理人，ERP 使用者與 Slack 帳號的**對應關係由誰維護、存在哪裡？成員異動（換人、離職、身兼解除）時如何更新？**

## 影響

- 對應失效時 mention 不到人，討論串建立成功但沒人被通知，優先順序資訊延誤
- 訂單管理人現階段由同一人身兼審稿主管，未來人事拆分時 mention 對象需可調整

## 選項

| 選項 | 做法 |
|------|------|
| A | ERP 使用者資料加 Slack 帳號欄位，由管理者維護 |
| B | 固定 mention 一個 Slack 使用者群組（如「訂單管理」群組），成員異動在 Slack 端維護、ERP 不管對應 |

## 拍板紀錄

（待 OpenSpec change 實作階段裁決）
