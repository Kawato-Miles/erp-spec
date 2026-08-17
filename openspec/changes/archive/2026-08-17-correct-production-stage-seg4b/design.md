# Design: correct-production-stage-seg4b

## Context

生產階段校正段 4B：審稿段。商業層設計正本 `production-stage-seg4b-design.md`（v2，plan-audit 單輪收斂），wiki 落卡八項已先行（2026-08-17）。prepress-review spec 以 delta 表達整檔重寫（17 MODIFIED／7 REMOVED／3 ADDED）。實作約束沿 handover：只動 erp repo `apps/erp/src/app/(prototype)/`、分支 `prototype/production-stage`、經 `prototype-from-prompt` skill、dev server `erp-verify`（3020）。舊 repo 已棄用，不參照不搬移。

## Goals / Non-Goals

### Goals

- prepress-review main spec 合併後為線下單必要流程的乾淨規格（零內部相斥、零死引用、AR／PI 拍板全回寫）
- order-management 訂單層派生涵蓋審稿全八態；business-scenarios 審稿情境對齊現行口徑
- prototype 修正 P1-P13（設計文本體四清單）

### Non-Goals

- 主管工作台／KPI／能力等級維護介面（延後，handover 另案清單承載）
- 英文實體名標題正名（ReviewRound 等）與 submittedNote UI 元件名條目（段 4 收尾另案，與英文識別全庫掃描同批）
- 金額側（A 類另案）；舊 repo（已棄用）

## Decisions

1. **重寫以 delta 表達而非新檔取代**：維持 archive 合併機制的可驗證性（MODIFIED 標題逐字匹配、REMOVED 留 Reason＋Migration），重寫的完整性由 delta 覆蓋率承載（既有無衝突的 Requirement 維持原樣不入 delta）。
2. **標題正名用 REMOVED＋ADDED 不用 RENAMED**：schema 定義 RENAMED 僅改名，本次標題變更皆伴隨內容改寫；repo 無 RENAMED 先例，避免 archive 同步失準。
3. **訂單層派生實作為純函式**（prototype P3）：`deriveOrderReviewStatus` 六條規則（含待分派依稿件有無分流），掛審稿事件後重算——不做輪詢不做快取。
4. **免審輪次建立掛印件建立動作**（P2）：`addPrintItem`／加開／clone 各入口統一走同一支（4A 的 `autoAdvanceOnlineItems` 已有骨架，擴充免審輪次建立）。

## Risks / Trade-offs

- [重寫 delta 的 REMOVED 涉 7 個 Requirement，archive 合併時若 main 已被他批動過會標題失配] → 4B 期間凍結 prepress-review main 的其他修改；archive 前重跑 validate。
- [P3 訂單層歸納會重算既有 mock 訂單的審稿段落點] → mock 訂單若有與派生規則不符的手種狀態，實作批修 mock 對齊。

## Migration Plan

`/opsx:apply` 分批（Sonnet）→ 每批 Opus 稽核 → Fable 裁決 → commit → `/opsx:verify` → `/opsx:archive`。回滾＝git revert。

## Open Questions

無阻擋實作項。
