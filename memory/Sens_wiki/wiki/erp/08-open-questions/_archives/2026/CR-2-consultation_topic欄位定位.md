---
type: open-question
module:
  - 諮詢單
oq-id: CR-2
status: answered
priority: high
audience: internal
raised-at: 2026-05-22
raised-by: erp-consultant-agent
resolved-at: 2026-05-22
resolved-by: Miles
source-link: US-CR-003 諮詢單批 a 雙視角審查
resolution-change: resolve-consultation-request-gaps-cr-1-cr-2
related-vault:
  - "[[US-CR-003-編輯諮詢內容與追蹤進度]]"
related-oq: []
expected-resolution-at: 2026-Q2
---

# CR-2 `consultation_topic` 欄位定位：客戶原始填寫 vs 諮詢備註

## 問題

[`openspec/specs/consultation-request/spec.md`](../../../../openspec/specs/consultation-request/spec.md) L26 將 `consultation_topic` 定義為**客戶於 surveycake 表單填寫的諮詢主題**（屬於 14 表單欄位之一，客戶原始填寫）。

但 [[US-CR-003-編輯諮詢內容與追蹤進度|US-CR-003]] 業務流程描述「諮詢人員可編輯諮詢備註」，若編輯的是 `consultation_topic`：
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

## 決議（2026-05-22）

**拍板選項 B：雙欄位 `consultant_note`**

ConsultationRequest 實體新增 `consultant_note` 欄位，客戶原話 `consultation_topic` 保留唯讀。

**設計理由**：
- 覆寫方案違反 ISO 9001 客戶原話可追溯不可竄改原則
- ActivityLog 方案備註散落於活動紀錄，違反 US-CR-003 step 6「跨人交接接手者可看到歷次備註」要求
- 版本化方案 schema 複雜，過度設計
- 雙欄位對齊印刷 MIS / CRM 業界主流（客戶原話唯讀 + 業務筆記可編輯）

**欄位定義**：
- `consultant_note`：text（最長 2000 字，非必填）— 諮詢人員與客戶溝通記錄
- 編輯權限：當前 `consultant_id` 對應的諮詢人員 + 主管
- 編輯時機：諮詢單狀態為「待諮詢」（已認領後）；終態後 SHALL 鎖定
- 編輯規則：可多次儲存，每次寫入 ActivityLog（from / to / actor / timestamp）
- 跨人交接：同模組諮詢人員可互相查閱 `consultant_note` + ActivityLog 歷次變更

**轉需求單時 mapping 規則**：`consultation_topic` + `consultant_note` 合併雙區塊格式寫入需求單 `requirement_note`：

```
[客戶原話]
<consultation_topic>

[諮詢人員筆記]
<consultant_note>
```

`consultant_note` 為空時省略「[諮詢人員筆記]」區塊。

**實作範圍**：
- consultation-request spec：MODIFIED「諮詢單實體與表單欄位」新增 `consultant_note` 系統內生欄位 + `consultation_topic` 加註唯讀
- consultation-request spec：ADDED「諮詢人員筆記欄位」Requirement（含 5 個 Scenarios）
- consultation-request spec：MODIFIED「諮詢單轉需求單欄位帶入」mapping 規則改雙區塊
- quote-request spec：MODIFIED「從諮詢單轉建需求單」+「諮詢來源需求備註欄位」對齊雙區塊 mapping
- business-processes spec：MODIFIED「諮詢前置流程端到端規則」補 consultant_note 編輯說明 + 需求單 requirement_note 雙區塊合併帶入

**未涵蓋**：
- quote-request spec § Data Model QuoteRequest 表格 L515「需求備註」說明（Data Model 不在 OpenSpec delta 範圍內，須人工同步）

**resolution change**：[resolve-consultation-request-gaps-cr-1-cr-2](../../../../openspec/changes/archive/2026-05-22-resolve-consultation-request-gaps-cr-1-cr-2/)（2026-05-22 archive）
