---
type: user-story
us-id: US-QR-005
module:
  - quote-request
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: Slack Webhook 通知"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-001-建立需求單]]：業務已完成規格確認並指定評估印務主管"
  - 即時通訊軟體（Slack）整合通道正常
---

# US-QR-005 待評估報價通知

## 業務情境

### 作為
[[業務]]

### 我希望
送印務評估時系統自動通知指定印務主管並集中討論

### 以便
印務主管即時收到評估任務，且討論串連結回寫至需求單便於事後追溯

### 前置條件
- 業務已建立需求單並完成規格確認
- 業務已指定評估印務主管
- 即時通訊軟體（Slack）整合通道正常

### 業務流程

1. 業務執行「送印務評估」（[[US-QR-001-建立需求單]] step 4）
2. 系統自動透過即時通訊整合通道發送通知給指定印務主管（含需求單號 / 案名 / 客戶 / 業務 / 接單公司 / 帳務公司 / 詳情頁連結）
3. 系統將即時通訊討論串連結（permalink）自動回寫至需求單的討論串連結欄位
4. 印務主管於待辦清單看到此需求單，可開啟詳情並進行評估
5. 例外處理：若通知發送失敗，業務可手動補填討論串連結至需求單

### 成功條件

1. 業務執行「送印務評估」後，指定印務主管即時收到通知（含 7 項關鍵資訊：需求單號 / 案名 / 客戶 / 業務 / 接單公司 / 帳務公司 / 連結）
2. 即時通訊討論串連結自動回寫至需求單欄位，便於事後查閱
3. 通知失敗時業務可手動補填討論串連結，不阻擋業務流程
4. 印務主管的待辦清單立即出現此需求單

## 來源（provenance）

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「Slack Webhook 通知」L182-196
- 原 Notion User Story DB `US-QR-005`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L182+ 補通知 7 項關鍵資訊
- 補通知失敗手動補填路徑
- 「Slack」改為「即時通訊軟體 / 整合通道」業務化描述（Slack 屬實作層技術選擇，業務情境段不綁定特定通訊軟體）
- 邊界：通知通道由本卡涵蓋；建單流程由 [[US-QR-001]] 處理
