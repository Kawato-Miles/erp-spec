---
type: insight
module:
  - prototype-shared-ui
  - 訂單管理
status: open
priority: medium
raised-at: 2026-05-25
raised-by: vault-insight skill
triggered-by: change-archive（add-review-rounds-to-print-item-side-panel + add-side-panel-shared-components 連續 2 次 archive）
related-vault:
  - "[[ceo-review-framework]]"
  - "[[../11-review-knowledge/_shared/lightweight-review-mode]]"
related-oq:
  - ORD-018
related-spec: openspec/specs/prototype-shared-ui/spec.md
expected-action-at: 2026-06-30
---

# 2026-05-25：SidePanel 視覺對齊迭代成本與元件抽象時機判準

## 背景

2026-05-25 連續歸檔兩個 SidePanel 相關 change：
- `add-review-rounds-to-print-item-side-panel`（v1.8、加審稿紀錄 + apply 階段重做 Figma 對齊）
- `add-side-panel-shared-components`（v1.9、抽 5 個共用元件 + DESIGN.md §1.5 規範）

第二個 change 是因第一個 change apply 階段「Miles 視覺對比 Figma 後仍 7 處差異」觸發。三視角審查 ceo-reviewer 提出 Rule of Three challenge（實際 consumer = 1、Martin Fowler 建議第 3 個 consumer 才抽元件），Miles 拍板「維持元件化路線」並承諾 API 重構彈性。

本 insight 提煉這個「視覺對齊迭代 → 規範與元件化」的工作流痛點與設計原則。

## 觀察

1. **PrintItemDetailSidePanel apply 階段迭代 ≥ 3 次仍不齊**：第一次 apply 用既有 PrintItemSpecCard / PrintItemArtworkCard、發現外框過多 → 第二次 apply 改 inline ErpInfoTable、仍有寬度 / 分隔線 / 縮圖大小 7 處差異 → 第三次 apply（add-side-panel-shared-components）才完整對齊（[[changelog#2026-05-25 19:00 audit]]）

2. **三視角 ceo-reviewer 提 Rule of Three challenge**：實際 consumer = 1（PrintItemDetailSidePanel）、其餘 7 個 SidePanel 全為編輯型豁免（[add-side-panel-shared-components/design.md § D6](../../../openspec/changes/archive/2026-05-25-add-side-panel-shared-components/design.md)）— 從元件抽象 ROI 角度屬於 premature abstraction。Miles 拍板維持元件化路線、承諾若第 2-3 個真實 consumer 出現時 API 不符實際需求將重構（不視為 breaking change）

3. **erp-consultant 發現 DESIGN.md §0.1 line 52 與 §1.5 直接衝突**：§0.1 既有「Side Panel 內容結構：沿用 PrintItemSpecCard / PrintItemArtworkCard」與新 §1.5「SHALL NOT 使用」直接矛盾。屬 high 必修發現、修訂 tasks § 4.0 補同步修訂子任務

4. **CEO insight 真正痛點 = Miles 個人視覺驗收時間**：CEO 視角報告明示「真正要解決的問題不是業務 / 印務需求、而是 Miles 自己作為 PM + 視覺驗收者每次都要逐項比 Figma 找差異」（[add-side-panel-shared-components/design.md § D6](../../../openspec/changes/archive/2026-05-25-add-side-panel-shared-components/design.md)）

5. **既有 7 個 SidePanel 全為編輯型豁免**：EditOrderPrintItem / EditPrintItem / EditQuote / CreateQuote / AddProductionTask / PermissionManagement / WorkOrderDetail SidePanel 全部為 form-based、新規範明示豁免、漸進遷移實際對象趨近 0

## 推論

**核心 pattern**：當「設計與既有實作不一致」+「Miles 視覺驗收作為唯一守門人」+「無自動驗證機制」三條件同時成立，視覺對齊會出現 N 次 apply 迭代仍不齊的循環。

**根因**：
- plan 階段沒有強制 visual diff（Figma vs Prototype 既有實作）的驗證步驟
- 既有「對齊既有共用元件」的設計傾向（DESIGN.md §0.1 默認沿用詳情頁卡）與「對齊 Figma」的需求有時衝突
- e2e 測試只能斷言結構正確、無法斷言「視覺像素級對齊 Figma」

**Rule of Three trade-off**：
- 嚴格遵守 Rule of Three（等第 3 個 consumer 出現再抽）：低過度抽象風險，但每個新 SidePanel 都要逐項對齊 Figma、迭代成本累積
- 提前抽象 + 規範化（本變更選擇）：規範與元件雙軌讓「下次新增 SidePanel 不再從零」，但 API 在第 2-3 consumer 出現時可能需重構
- Miles 選擇後者並承諾「重構非 breaking change」是合理 trade-off（prototype 階段、實際成本來自 Miles 個人時間）

## 下一步建議

1. **將 Rule of Three trade-off 寫入 [[ceo-review-framework]]**（時程：本週、Miles 或下次 ceo-reviewer 自審時觸發）→ 預期結果：未來三視角審查 CEO 視角提 Rule of Three 時，agent 直接引用此原則、避免每次重複辯論

2. **plan 階段加 Figma visual diff 必做項**（時程：下次 SidePanel / 卡片 / 列表頁 plan 時試行）→ Phase 1 探索清單加「figma_get_metadata + dom inspect 既有實作 + 列出 N 處 visual diff 給 Miles 核對」步驟 → 預期結果：apply 階段大改寫降至 ≤ 1 次

3. **第 2 個詳情預覽型 SidePanel 出現時主動 review 元件 API**（時程：[[ORD-018-混合型SidePanel規範時機|ORD-018]] resolved 時或下次新 SidePanel 觸發）→ 對照 SidePanelBody / SidePanelSection / SidePanelFileList 等元件實際 API 是否符合新 consumer 需求、不符則重構 → 預期結果：避免 API 在第 3 / 4 consumer 出現時才一次大重構

4. **無需 action（已內化）**：DESIGN.md §0.1 line 52 與 §1.5 衝突已修、tasks § 4.0 子任務形成「跨章節衝突檢查」工作習慣

## 涉及

- [[ceo-review-framework]]（trade-off 記錄目標位置）
- [[../11-review-knowledge/_shared/lightweight-review-mode]]
- [[ORD-018-混合型SidePanel規範時機|ORD-018-混合型SidePanel規範時機（已封存）]]（混合型 SidePanel 需求出現時 trigger 重構 review）
- [add-side-panel-shared-components/design.md](../../../openspec/changes/archive/2026-05-25-add-side-panel-shared-components/design.md) § D6（trade-off 紀錄）
- [add-review-rounds-to-print-item-side-panel/design.md](../../../openspec/changes/archive/2026-05-25-add-review-rounds-to-print-item-side-panel/design.md) § D1（apply 階段重做紀錄）
- `openspec/specs/prototype-shared-ui/spec.md` § SidePanel 共用元件組

## 後續更新

（status 變化時追加）
