---
type: open-question
module:
  - consultation-request
oq-id: CR-3
status: open
priority: low
audience: internal
raised-at: 2026-05-22
raised-by: senior-pm-agent
source-link: US-CR-006 諮詢單批 b senior-pm 審查
related-vault:
  - "[[13-user-stories/consultation-request/US-CR-006-諮詢取消預約退費]]"
related-oq: []
---

# CR-3 諮詢取消三項擴充議題：部分退費 / 取消理由 / 退款 SLA

## 問題

[[13-user-stories/consultation-request/US-CR-006-諮詢取消預約退費|US-CR-006]] 涵蓋全額退費場景，但 spec 與 user story 均未涵蓋以下三項業務擴充：

### 議題 1：部分退費（保留手續費）

- 客戶取消預約但已預備一些前置成本（如：已準備好諮詢資料 / 業務已花時間溝通）
- 是否支援保留 X% 諮詢費作為手續費？
- 影響：金流計算邏輯、SalesAllowance 金額不再等於原 Payment 金額

### 議題 2：取消理由 enum

- 目前 user story 未要求業務記錄客戶取消原因
- 後續無法分析流失原因（客戶找到其他廠商 / 預算問題 / 時間衝突 等）
- 是否需要結構化 LOV（reject_reason_category 模式類似 PI-009）？

### 議題 3：退款撥付 SLA 與通知機制

- 系統建立負值 Payment 後實際銀行退款處理時間未定
- 客戶何時收到退款？由誰通知？
- 影響：客戶體驗（不知何時退款）+ 業務追蹤負擔

## 影響

- 影響 US-CR-006 acceptance criteria 是否補入相關條件
- 議題 1 影響資料模型（OrderExtraCharge / SalesAllowance 金額計算）
- 議題 2 影響統計分析能力
- 議題 3 影響 SLA 設計

## 暫定處理

- US-CR-006 暫採全額退費 + 無理由欄位 + 無 SLA 描述
- 引此 OQ wiki link 待 Miles 解答後評估是否補入

## 待 Miles 確認

實務上有部分退費需求嗎？是否需記錄取消理由？退款 SLA 怎麼設定？
