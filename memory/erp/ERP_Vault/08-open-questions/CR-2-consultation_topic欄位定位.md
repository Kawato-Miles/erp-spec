---
type: open-question
module:
  - consultation-request
oq-id: CR-2
status: open
priority: high
audience: internal
raised-at: 2026-05-22
raised-by: erp-consultant-agent
source-link: US-CR-003 諮詢單批 a 雙視角審查
related-vault:
  - "[[13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度]]"
related-oq: []
---

# CR-2 `consultation_topic` 欄位定位：客戶原始填寫 vs 諮詢備註

## 問題

[`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) L26 將 `consultation_topic` 定義為**客戶於 surveycake 表單填寫的諮詢主題**（屬於 14 表單欄位之一，客戶原始填寫）。

但 [[13-user-stories/consultation-request/US-CR-003-編輯諮詢內容與追蹤進度|US-CR-003]] 業務流程描述「諮詢人員可編輯諮詢備註」，若編輯的是 `consultation_topic`：
- **覆寫客戶原始填寫**：客戶原始內容遺失（違反 spec L320「客戶原始填寫內容唯讀」設計）
- **無法保留客戶原話**：跨人交接時無法區分「客戶說的」vs「諮詢人員補充的」

## 影響

- 影響 US-CR-003 業務流程與 acceptance criteria 撰寫
- 影響資料模型：是否需要新增獨立欄位「諮詢備註」（諮詢人員填寫，與客戶原始 `consultation_topic` 分離）
- 影響 US-CR-004 轉需求單時 `requirement_note` mapping（取哪個欄位？）
- 影響活動紀錄稽核軌跡（變更哪個欄位）

## 選項

| 選項 | 規則 | 影響 |
|------|------|------|
| A | 諮詢人員**可覆寫 `consultation_topic`** | 簡單但遺失客戶原話 |
| B | 客戶原始 `consultation_topic` 唯讀，新增獨立欄位 `consultant_note`（諮詢人員填寫）| 雙欄位分離、可追溯；資料模型擴充 |
| C | 客戶原始 `consultation_topic` 唯讀，諮詢人員的補充寫入活動紀錄「諮詢備註」事件 | 不擴 schema 但備註散落於活動紀錄不易彙整 |
| D | `consultation_topic` 採版本化（原始 + 諮詢人員編輯版本各存一份）| 雙版本對照清楚但 schema 複雜 |

## 暫定處理

- US-CR-003 暫採選項 B 業務描述（業務情境內以「諮詢備註」泛指諮詢人員填寫欄位，避免與客戶原始 `consultation_topic` 混淆）
- 引此 OQ wiki link 待 Miles 拍板實體機制

## 待 Miles 確認

實務上諮詢人員是否應該覆寫客戶填寫的主題？或應該另設一個欄位記錄諮詢結論？
