## Why

訂單詳情頁印件 Tab 第一層已能看到印件主資訊（縮圖 / 印件名稱 / 印件狀態 / 審稿狀態 / 數量 / 交期等 14 欄；2026-05-21 [refine-order-detail-tabs](../archive/2026-05-21-refine-order-detail-tabs/) 歸檔）。印件詳情 Side Panel（`PrintItemDetailSidePanel`）重新定位為「印件補充資訊」載體，承載印件歷史足跡。

現況 SidePanel 僅承載「印件資訊 / 印件檔案 / 相關工單」三區塊，**缺少審稿紀錄歷史**。業務 / 印務角色查印件時，需要切換到完整詳情頁才能看「印件經歷哪幾輪審稿、退件原因為何、最終誰判合格」這類補充歷史；這在 SidePanel 設計初衷（「輕量摘要、避免跳頁」）下屬於資訊缺漏。

業務情境：依 [[memory/erp/ERP_Vault/04-business-logic/稿件管理規則]] § 五，多輪送審歷史完整保留為印件層業務常態（情境 2「印件經歷 3 輪審稿」）；補印印件依 [[memory/erp/ERP_Vault/05-entities/印件]]「補印印件特殊規則」會自動產生「售後補印自動通過審稿輪次」，本次 SidePanel 需正確區分 `審稿` / `免審稿` / `售後補印` 三種 source 文案。

## Background

- 設計來源：Figma node-id `8977:269607`（已對齊現有三區塊但**未繪製審稿紀錄區塊**），本變更為「Figma 三區塊保留 + 末尾補加審稿紀錄」
- 變動性質分級：**局部欄位調整（單模組內）**，依 [[memory/erp/ERP_Vault/11-review-knowledge/_shared/lightweight-review-mode]]，specs / design 完成後僅觸發單 agent 輕量審查（`erp-consultant`）；不觸發 senior-pm 前期介入（問題框架已於 plan 階段收斂、Miles 批准）
- 相關 OQ：[[../../memory/erp/ERP_Vault/08-open-questions/ORD-016-印件SidePanel與編輯Panel並行邊界]]（與本變更**正交** — ORD-016 處理 view/edit Panel 並行衝突，本變更只增 SidePanel 內檢視內容，不動兩 Panel 互斥邏輯）
- 完整輪次明細（含每輪檔案、ActivityLog 事件層）仍由「開啟完整詳情頁」按鈕導至印件詳情頁 § 審稿紀錄 Tab；SidePanel 內僅承載 7 欄摘要表格，避免過載

## What Changes

- **MODIFIED**：`order-management` capability § 「印件詳情 Side Panel（PrintItemDetailSidePanel）」Requirement
  - Body 由三區塊改為**四區塊**（新增第四「審稿紀錄」區塊）
  - 第四區塊：7 欄 `.erp-table`（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註），沿用第三「相關工單」表格樣式
  - 排序：`roundNo` desc（最新在最上）
  - 結果欄：文字加色（合格 default、不合格 destructive 紅、待審 橘 `#C97A00`），不新增 ReviewResultBadge 共用元件
  - 審稿人員欄文案：`審稿` 顯示審稿人員姓名（未分派時「待分派」）；`免審稿` 顯示「系統免審」；`售後補印` 顯示「系統沿用」
  - 退件分類欄：合格 / 待審時顯示「—」
  - 備註欄（`reviewNote`）：`line-clamp-2` + hover tooltip 顯示完整 1000 字
  - 空狀態：「此印件尚未送審」（與既有「尚無工單」灰字 + 置中視覺一致）
  - 新增 3 個 Scenario（兩輪審稿混合 / 免審稿 / 尚未送審）

- **不動**：
  - `prepress-review` capability（ReviewRound 模型零修改、僅消費既有欄位）
  - `prototype-shared-ui` capability（不抽 ReviewRoundTable / ReviewResultBadge 共用元件）
  - 訂單詳情頁印件 Tab 第一層 14 欄主表
  - 印件完整詳情頁 § 審稿紀錄 Tab 既有 12 欄完整版

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `order-management`：印件詳情 Side Panel Body 從三區塊擴為四區塊（新增「審稿紀錄」7 欄表格），純檢視內容增量、不動既有三區塊、不動實體模型

## Impact

- **Affected Specs**：
  - `openspec/specs/order-management/spec.md` § 「印件詳情 Side Panel（PrintItemDetailSidePanel）」Requirement（MODIFIED Body + ADDED 3 Scenarios）
- **Affected Code**（Prototype repo `sens-erp-prototype`）：
  - `src/components/order/PrintItemDetailSidePanel.tsx`（既有三區塊末尾新增第四 ErpDetailCard，約 60-80 行）
  - `src/pages/OrderDetail.tsx`（檢查 `reviewerNames` prop 傳入邏輯：當前型別 `string[]`、依 `reviewerId` 順序展開；新增「審稿人員」欄需 by-id lookup，必要時改為 `Record<string, string>` 或在 SidePanel 內加 helper —— 詳見 design.md）
- **不影響**：
  - useErpStore（無需新增 selector）
  - ReviewRound 資料模型
  - 印件詳情頁 § 審稿紀錄 Tab（既有 12 欄完整版維持）
- **e2e Tests**：
  - `sens-erp-prototype/e2e/refine-order-detail-tabs.spec.ts:101-133` 既有 test 擴充為四區塊斷言；新增 3 個 test（兩輪審稿混合 / 空狀態 / 免審稿與售後補印文案）
- **Notion 發布**：累積至下次手動推送訂單管理 BRD 更新時一併同步至 [訂單管理發布版本](https://www.notion.so/32c3886511fa806bad41d755349b0567)
