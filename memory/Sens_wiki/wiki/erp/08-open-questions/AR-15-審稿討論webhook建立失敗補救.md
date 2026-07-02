---
type: open-question
module:
  - 印前審稿
oq-id: AR-15
status: open
priority: medium
audience: internal
raised-at: 2026-07-02
raised-by: Miles + Claude（線下單審稿分派機制變更討論）
source-link: memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/審稿討論Slack串接約束.md
related-vault:
  - "[[審稿討論Slack串接約束]]"
  - "[[審稿分配規則]]"
related-oq:
  - "[[CR-8-諮詢webhook建單失敗補救機制]]"
expected-resolution-at: OpenSpec change 實作階段
---

# AR-15 審稿討論 webhook 建立失敗補救

## 問題

業務點「開啟討論」後，ERP 透過 Slack Webhook 建立討論串失敗（Slack 服務異常、webhook 設定失效、頻道被封存等）時，**系統如何補救？業務看到什麼？**

## 影響

- 討論串是可選輔助，失敗不阻斷分派主流程，但業務若以為討論已建立而實際沒有，優先順序資訊會漏傳
- 與 [[CR-8-諮詢webhook建單失敗補救機制]] 同屬 webhook 失敗補救，方向相反（CR-8 為入向、本卡為出向），裁決時可一併考量統一的失敗處置模式

## 選項

| 選項 | 做法 |
|------|------|
| A | 失敗即時顯示錯誤，業務改以既有 Slack 手動開串（系統不重試） |
| B | 系統自動重試 N 次，仍失敗才顯示錯誤並通知工程值班 |
| C | 失敗進待送佇列背景重送，成功後回填討論串連結 |

## 拍板紀錄

（待 OpenSpec change 實作階段裁決）
