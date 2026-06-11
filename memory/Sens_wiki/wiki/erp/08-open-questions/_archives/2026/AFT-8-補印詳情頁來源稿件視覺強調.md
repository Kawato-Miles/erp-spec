---
type: open-question
module:
  - after-sales-ticket
  - prototype-shared-ui
oq-id: AFT-8
status: answered
priority: low
audience: internal
raised-at: 2026-05-20
raised-by: 設計細節 (refine-supplementary-print-skip-review)
source-link: openspec/changes/archive/2026-05-20-refine-supplementary-print-skip-review/design.md
related-vault:
  - [[../05-entities/印件]]
related-oq:
related-change: refine-supplementary-print-skip-review
expected-resolution-at:
answered-at: 2026-05-20
answered-by: Miles
---

# AFT-8：補印 PrintItem 詳情頁 UI 是否需要視覺強調「來源稿件連結」

## 背景

補印 PrintItem 的 reviewRounds 含「售後補印自動通過輪次」，其中 `sourcePrintItemId` 指向來源印件。實作上既有 ReviewRound 列表 UI 會自然顯示此輪次（含 submittedNote「沿用 PI-XXX 合格稿件」），但沒有特別強調的「點擊跳轉來源印件」UI。

## 問題

補印 PrintItem 詳情頁是否需要在某個顯眼位置加「來源稿件連結」視覺強調？

候選做法：

1. **不額外強調**（目前實作）
   - 業務 / 客服 / 印務透過 ReviewRound 列表的「自動通過輪次」看到 submittedNote
   - 若要跳轉來源印件需從 ticket 詳情頁查
   - 優點：UI 簡潔，不破壞既有印件詳情頁佈局

2. **印件詳情頁 sub-header 加「來源印件」連結**
   - 當補印印件 (type = '補印印件') 時 sub-header 顯示「來源印件：PI-XXX（可點擊）」
   - 業務在補印印件詳情頁一眼可跳轉來源
   - 優點：強化補印與來源的視覺關聯
   - 缺點：需動印件詳情頁 sub-header（既有 spec 已有 Tabs 化版型）

3. **稿件區塊頂部加 banner**
   - 補印印件的稿件區塊上方顯示 banner「本印件稿件沿用 PI-XXX 合格版本」+ 跳轉連結
   - 優點：稿件區塊是業務 / 印務常看位置，強調來源最直接
   - 缺點：需動印件詳情頁稿件區塊 UI

## 影響範圍

- 不影響核心邏輯（補印自動通過 + 沿用原稿已 implement）
- 影響補印追溯體驗（業務 / 客服反查「補印用哪版稿件」的點擊路徑）
- 影響印件詳情頁 UI

## 待釐清

- 實務上業務 / 客服反查補印來源的頻率（高 → 加強調；低 → 維持現狀）
- 印件詳情頁 sub-header 現有設計是否能容納新欄位

## 來源

- change `refine-supplementary-print-skip-review` design.md § OQ-SP-3
- UI 細節 followup，非阻擋本 change 完成

## 答覆（2026-05-20 Miles）

**結論**：**不用特別處理 UI 視覺強調**。

**理由**：補印 PrintItem 詳情頁的「審稿紀錄 / 印件列表」既有區塊已會帶出審稿上傳檔案（reviewFiles 拷貝自來源印件）。業務 / 客服反查「補印用哪版稿件」走既有印件詳情頁就能看到完整檔案歷史。

**現況可用的反查路徑**：
- 補印印件詳情頁 → 審稿紀錄 Tab → 看到 ReviewRound 列表（含「售後補印自動通過輪次」+ 拷貝來源的歷史輪次）
- 補印印件詳情頁 → 印件檔案區 → 看到 reviewFiles 完整列表（拷貝自來源印件的全部稿件）
- 售後服務單詳情頁 → 「補印印件清單區」→ 跳轉至補印印件詳情頁

**影響**：
- 不需要在 sub-header 加「來源印件連結」
- 不需要在稿件區塊加 banner
- 維持既有印件詳情頁設計

**OQ 後續**：本卡 close，反查路徑沿用既有 UI。
