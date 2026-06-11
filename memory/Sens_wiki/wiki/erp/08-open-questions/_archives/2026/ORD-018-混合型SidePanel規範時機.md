---
type: open-question
module:
  - prototype-shared-ui
  - 訂單管理
  - 售後服務
oq-id: ORD-018
status: answered
priority: medium
audience: internal
raised-at: 2026-05-25
raised-by: senior-pm / erp-consultant（三視角審查 add-side-panel-shared-components change）
source-link: openspec/changes/add-side-panel-shared-components/design.md § D4
related-vault:
  - "[[ORD-016-印件SidePanel與編輯Panel並行邊界]]"
related-oq: []
expected-resolution-at: 2026-06-30
answered-at: 2026-06-11
answered-by: Miles
---

# ORD-018：混合型 SidePanel 規範時機

## 問題描述

`add-side-panel-shared-components` change 引入 SidePanel 共用元件組 + DESIGN.md §1.5 規範，明示區分「詳情預覽型 SidePanel」（用 SidePanelBody + SidePanelSection）與「編輯型 SidePanel」（豁免，繼續用 ErpEditFormCard form layout），但**「混合型 SidePanel」（資訊預覽 + 內嵌 form 編輯）尚未規範**。

三視角審查發現：
- **senior-pm**：售後補印 PrintItem dialog（既有 refine-after-sales-refund-and-add-supplementary-print change）已是混合型場景；refine-order-detail-tabs 描述也暗示「OrderAdjustment Tab 上半預覽 / 下半填寫」可能出現
- **erp-consultant**：印刷業 ERP 常見「左半呈現訂單摘要 / 右半有主管核可備註 textarea」混合模式為業務常態而非邊緣案例；spec 留下「自由發揮空隙」會在 prototype 累積樣式分歧、踩到本變更要解的「自寫樣式」根因

## 涉及範圍

- 模組：prototype-shared-ui（規範層）+ order-management / after-sales-ticket（既有混合型 SidePanel 消費點）
- 相關 spec：openspec/specs/prototype-shared-ui/spec.md § SidePanel 共用元件組
- 影響範圍：未來 SidePanel 開發判準（詳情預覽型 / 編輯型 / 混合型）

## 討論記錄

- 2026-05-25：add-side-panel-shared-components change apply 階段三視角審查由 senior-pm（medium）+ erp-consultant（medium）提出。Miles 決策：本變更不規範混合型、加 OQ 列管、等實際需求出現時再決
- 2026-05-25：相關案例（既有混合型 SidePanel 可能存在點）：
  - 售後 ticket 補印 PrintItem dialog（resupplementary print 場景）
  - 訂單異動 Tab（refine-order-detail-tabs change）
  - 訂單主管核可備註 textarea（hypothetical）

## 待解答

- [ ] 混合型 SidePanel 應採哪種規範？
  - A. 外層 SidePanelBody，唯讀區用 SidePanelSection、編輯區用獨立 SidePanelSection 包 ErpEditFormCard.Field
  - B. 直接豁免（與編輯型同等），繼續用 ErpEditFormCard 包整個 SidePanel
  - C. 新增混合型專用容器（如 SidePanelMixedBody），自動處理唯讀 / 編輯區段視覺切換
- [ ] 判準如何寫入 DESIGN.md §1.5.2？什麼比例為「混合型」？（如：≥ 80% 唯讀資訊 + 少量 inline 編輯 = 混合 / ≥ 50% form = 編輯型）
- [ ] 既有混合型 SidePanel 消費點清單盤點（補印 dialog / 訂單異動 / 其他？）

## 候選方案

### 方案 A：唯讀區 + 編輯區分 section（推薦預設）

外層 `<SidePanelBody>`，唯讀區用 `<SidePanelSection title="...">` 包 `<SidePanelInfoTable>`，編輯區用獨立 `<SidePanelSection title="編輯區">` 包 `<ErpEditFormCard.Field>` 或 `<ErpFormField>`。Section 之間沿用 SidePanelBody 自動 hr 分隔。

- 優點：視覺結構清楚（資訊 vs 操作分區）；沿用既有元件組合、不引入新元件
- 缺點：使用者要在同一 SidePanel 內切換「閱讀模式」「編輯模式」心智成本；form validation / Save / Cancel 動作放哪需另定

### 方案 B：豁免（與編輯型同等）

整個 SidePanel 用 ErpEditFormCard 包裝、唯讀資訊以 `<ErpEditFormCard.Display>` 呈現（如果存在）或 readonly form field 呈現。

- 優點：form validation / Save / Cancel 動作自然
- 缺點：唯讀資訊用 form field 渲染、視覺與「資訊呈現」語意脫節；違反 SidePanelInfoTable / SidePanelFileList 的視覺一致性

### 方案 C：新增 SidePanelMixedBody 容器

提供 `<SidePanelMixedBody>` 內含 `readOnlySections` 與 `editSection` 兩個 slot，自動處理視覺切換。

- 優點：明確區分唯讀 / 編輯區、未來擴充彈性
- 缺點：增加 API surface（YAGNI）；現階段沒有實際 mixed SidePanel consumer 數量支撐

## 決議（2026-06-11）

定案「實際需求出現時再決」（沿 2026-05-25 Miles 原拍板，本卡結案不再掛佇列）。落地去處：Prototype `DESIGN.md` § 1.5 混合型段已改寫為自包含描述（移除對本卡的跨庫連結，2026-06-11）。實際混合型需求出現時另開新 OQ 或於對應 change 內規範。
