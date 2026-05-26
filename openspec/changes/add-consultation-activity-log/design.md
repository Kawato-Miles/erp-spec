## Context

consultation-request spec L479-505（v0.2，2026-05-22 `resolve-consultation-request-gaps-cr-1-cr-2` 歸檔時新增）詳列「諮詢單活動紀錄」Requirement，含 8 個事件型別表格與 2 個 Scenarios。但 prototype 對應實作完全空白：

- 既有 `add-consultation-request-and-revise-approval-gate`（2026-05-07 歸檔）落地時未實作活動紀錄
- 既有 `補齊諮詢單訂單連動`（2026-05-12 歸檔）補了 Payment 跨實體轉移，但活動紀錄不在範圍內

同 spec L205-210 的 quote-request 等價 Requirement 在 prototype 已用 `types/quote.ts` 的 `ActivityLog` 型別 + `useErpStore.ts` 的 `createActivityLog` helper + `shared/ActivityTimeline` 元件完整實作覆蓋 6 個事件。本 change 把諮詢單對齊既有 quote 模式，先處理 5 個現有可觸發事件 + 1 個 mock-only 起點事件，剩下 2 個事件（主管代為認領、諮詢備註修改）等對應 prototype 功能補上時再隨案實作。

設計參照：
- [consultation-request spec § 諮詢單活動紀錄](../../specs/consultation-request/spec.md)（L479-505）：8 個事件型別表格
- [quote-request spec § 活動紀錄](../../specs/quote-request/spec.md)（L205-210）：等價 Requirement 範本
- Prototype `types/quote.ts:72` `ActivityLog` 型別、`useErpStore.ts:681` `createActivityLog` helper
- Prototype `components/shared/ActivityTimeline.tsx`：簡版 timeline 元件

## Goals / Non-Goals

**Goals**：
- 5 個現有可觸發事件全部寫入 `cr.activityLogs`：諮詢人員認領 / 結束-不做大貨 / 結束-轉需求單 / 需求單流失觸發 / 待諮詢取消
- 既有 5 張 mock CR 回溯歷史 activityLog（含 webhook 建單事件作為起點）
- `ConsultationRequestDetail` 改用 `ErpDetailTabs` 3-tab 結構顯示（資訊 / 付款紀錄（n）/ 活動紀錄），活動紀錄獨立 Tab 沿用 `ActivityTimeline` 元件

**Non-Goals**：
- 不實作主管代為認領對應寫入（CR-1 UI / `assignConsultantByManager` action 未實作）
- 不實作諮詢備註修改對應寫入（CR-2 `consultant_note` 欄位 type 未加）
- 不改 `ActivityLog` 型別或建立諮詢單專屬結構化型別（如 `ConsultationActivityLog`）
- 不改 spec（v0.2 已寫好，方向不變）

## Decisions

### D1：資料結構完全對齊 quote 簡版

`ConsultationRequest` 直接 `import type { ActivityLog } from '@/types/quote'`，不另開型別。spec L483-494 表格列的結構化欄位（actor / from / to / assigned_to）by-case 拼進 `ActivityLog.action` + `ActivityLog.detail` 純文字。

**理由**：
- 與既有 quote 模式對齊；`shared/ActivityTimeline` 元件不需任何修改即可重用
- spec 8 個事件本質是 audit log，prototype 階段純文字呈現足夠；未來如需事件型別過濾或 diff 顯示再升級結構化（升級時可全面替換）
- 避免再開一套 `ConsultationActivityLog`，導致 prototype 多套 ActivityLog 並存

**替代方案否決**：
- B 諮詢單專屬結構化型別：超出本次「對齊 quote 模式」的請求；探索階段 trade-off 1 Miles 已選 A
- C `shared/ActivityTimeline` 升級成結構化：範圍最大，quote 既有 mock / 寫入路徑也要遷移

### D2：詳情頁改用 `ErpDetailTabs` 3-tab 結構（探索階段 → 實作階段修訂）

**最終決定**：版型對齊需求單 `QuoteDetailPage` 採用 `ErpDetailTabs`。

| Tab | label | 內容 |
|-----|-------|------|
| 資訊 | `資訊` | 兩段 `ErpDetailCard` 並列：「諮詢單資訊」（系統欄位）+「諮詢單內容」（14 表單欄位）|
| 付款紀錄 | `付款紀錄（${payments.length}）` | 既有付款表格（沿用訂單付款結構） |
| 活動紀錄 | `活動紀錄` | `ActivityTimeline` 元件 |

**Tab 容器外**保留兩個元素，讓 Tab 切換時仍可見：
- 諮詢進度 stepper（`ConsultationStatusStepper` 包在 `ErpDetailCard title="諮詢進度"` 內）
- 狀態說明 banner（4 種狀態各一段說明文字）

```tsx
<ErpDetailTabs
  defaultValue="info"
  items={[
    { value: 'info', label: '資訊' },
    { value: 'payments', label: `付款紀錄（${payments.length}）` },
    { value: 'logs', label: '活動紀錄' },
  ]}
>
  <ErpDetailTabs.Content value="info">
    <div className="space-y-5">
      <ErpDetailCard title="諮詢單資訊">...</ErpDetailCard>
      <ErpDetailCard title="諮詢單內容">...</ErpDetailCard>
    </div>
  </ErpDetailTabs.Content>
  <ErpDetailTabs.Content value="payments">...</ErpDetailTabs.Content>
  <ErpDetailTabs.Content value="logs">...</ErpDetailTabs.Content>
</ErpDetailTabs>
```

**理由**：
- 對齊需求單 `QuoteDetailPage` 既有 Tab 模式，UI 系統一致性
- 諮詢單未來會擴增（CR-1 主管代為認領 dialog、CR-2 諮詢備註編輯區），Tab 結構為後續擴增提供空間
- Tab label 計數規則對齊需求單：表格 / 列表類顯示計數（付款紀錄）、資訊 / timeline 類不顯示（資訊、活動紀錄）

**為何探索階段選 A 但實作階段改 Tab**：
- 探索階段（trade-off 2 選項 A）的理由是「諮詢單欄位較少，Tab 化反而增加操作負擔」
- 實作後 Miles 看到 vertical card stack 確認，提出對齊需求單模式的需求；理由優先級調整為「UI 系統一致性 > 單頁操作負擔」
- 諮詢進度 stepper + 狀態說明 banner 留 Tab 外的設計，平衡了「Tab 切換時仍可見關鍵狀態」與「Tab 內容聚焦」的雙重需求

### D3：5 個可觸發事件的 action / detail 模板

| # | 事件描述（spec） | action（store） | detail 模板 | 觸發位置 |
|---|----------------|-----------------|-------------|---------|
| 0 | 諮詢單與付款記錄自動建立（webhook） | `webhook 建單` | `surveycake 表單付款 webhook：${paymentMethod} NT$${fee.toLocaleString()}` | mock seed only |
| 1 | 諮詢人員認領 | `諮詢人員認領` | （空 detail，user 欄位已標明操作者） | `assignConsultant` |
| 2 | 結束諮詢 - 不做大貨 | `結束諮詢 - 不做大貨` | `建立諮詢訂單 ${order.orderNo}（Payment 已轉移）` | `endConsultationNoProduction` |
| 3 | 結束諮詢 - 轉需求單 | `結束諮詢 - 轉需求單` | `建立需求單 ${newQuote.quoteNo}，Payment 暫綁諮詢單等需求單流程結局` | `endConsultationWithQuote` |
| 4 | 需求單流失觸發建諮詢訂單 | `需求單流失觸發建諮詢訂單` | `需求單 ${quote.quoteNo} 流失，系統自動建諮詢訂單 ${order.orderNo}（Payment 已轉移）` | `updateQuoteStatus` 流失分支 |
| 5 | 待諮詢取消 | `待諮詢取消` | `建立諮詢訂單 ${order.orderNo} + 退款 Payment（-NT$${fee.toLocaleString()}）` | `cancelConsultation` |

**actor 規則**：事件 0 / 4 actor 為「系統」；事件 1 / 2 / 3 / 5 actor 為 `currentUser.name`。

### D4：mock 回溯邏輯

依各 mock CR 當前狀態反推應有事件序列：

| Mock CR ID | 當前狀態 | 回溯事件序列 |
|-----------|---------|------------|
| CR-202605-0001 | 待諮詢、無 consultantId | 事件 0 |
| CR-202605-0002 | 待諮詢、consultantId='侯奕安' | 事件 0 → 事件 1 |
| CR-202604-0008 | 已轉需求單、consultantId='莊碩晨'、linkedQuoteRequestId='BRO-20260428-CR01' | 事件 0 → 事件 1 → 事件 3 |
| CR-202604-0005 | 完成諮詢、consultantId='侯奕安'、linkedConsultationOrderId='SSP-20260420-CR01' | 事件 0 → 事件 1 → 事件 2 |
| CR-202604-0002 | 已取消（無 consultantId）、linkedConsultationOrderId='SSP-20260417-CR01' | 事件 0 → 事件 5 |

**timestamp 推導**：
- 事件 0：用 `createdAt`（webhook 建單即付款）
- 事件 1（認領）：`createdAt` + 1-3 小時
- 事件 2 / 3 / 5（諮詢人員 / 業務動作）：reservedDate + reservedTime 後合理時段，或現在時間區段

格式採用 `new Date(...).toLocaleString('zh-TW')` 與既有 `createActivityLog` 一致。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 純文字 detail 未來如需事件過濾要字串解析 | 留待未來需求出現時統一升級三套 ActivityLog 結構化（單獨 change） |
| Mock 回溯時間戳記無法 100% 還原真實時序 | 用 createdAt + 合理偏移即可，prototype 不追求精確時序 |
| spec 列的「諮詢備註修改」事件本次不做 | Non-Goal 標明 CR-2 prototype 補時隨案實作 |
| spec L504-505「ActivityLog MUST 不再使用『指派諮詢人員』舊措辭」 | 本次直接用「諮詢人員認領」措辭，無舊資料需遷移 |

## Migration Plan

**Phase 1（本 change）**
1. type 加 `activityLogs` 欄位（複用 quote.ts `ActivityLog`）
2. 4 個 actions + `updateQuoteStatus` 流失分支補寫入
3. UI 加區塊
4. mock 回溯
5. `tsc --noEmit` + dev server visual 驗證

**Phase 2（隨後續 prototype change）**
- 主管代為認領 UI 實作時：補事件 6（「主管代為認領」、actor + assigned_to）
- `consultant_note` 雙欄位 + 編輯介面實作時：補事件 7（「諮詢備註修改」、from + to 全文）

## Open Questions

無未決 OQ。探索階段（2026-05-26）的三個 trade-off 已收斂於 D1 / D2 / D4。
