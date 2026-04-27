## Why

需求單流程「已評估成本 → 議價中」目前由業務單方推進（[quote-request spec](../../specs/quote-request/spec.md) US-QR-002），缺少業務側的收款條件審核機制。報價提供給客戶前，業務與業務主管之間的收款條件討論未走系統流程，造成業務可能在收款條件未對齊下對外報價、決策無稽核軌跡，且「業務主管」這個角色目前不存在於 [user-roles spec](../../specs/user-roles/spec.md)，部門治理無法落地至 ERP。

## What Changes

**角色與權限**：
- **新增「業務主管」角色**：歸屬中台平台（與印務主管對稱），需求單模組 R/W、其他模組 X，僅參與評估階段；工作模式為每日進系統處理待辦，含 Slack Webhook 通知對齊印務主管。
- **補強 user-roles 權限模型語意**：「R/W」標示為粗粒度，細粒度權限由各模組 Requirement 規範。
- **新增資料可見範圍規則**：業務看 `created_by = self`、業務主管看 `approved_by_sales_manager_id = self AND status ∈ {已評估成本, 議價中, 成交, 流失}`、兼角色取聯集。

**需求單欄位**：
- **新增 `approved_by_sales_manager_id`**（FK 必填，建立時指定，進入「待評估成本」後鎖定，與印務主管 `estimated_by_manager_id` 對稱）。
- **新增 `payment_terms_note`**（QuoteRequest 級 free text，最長 500 字，選填，業務任何狀態可編輯，終態鎖定）。
- **新增 `approval_required`**（boolean，Phase 1 預設 true，Phase 2 條件化 gate 升級預留）。
- **補齊 `estimated_by_manager_id` lifecycle 規則**：對齊兩個指定類欄位的對稱性。

**狀態機與流程**：
- **新增「業務主管核可進議價」強制 gate**：「已評估成本 → 議價中」轉換僅指定業務主管可推進，業務看不到「進入議價」按鈕。
- **新增「退回討論」非狀態轉換動作**：業務主管可寫入 ActivityLog 表達不同意 + 理由，需求單仍維持「已評估成本」，由業務決定是否走 US-QR-006 重新評估。
- **業務主管核可動作三類 ActivityLog 埋點**：首次查看時間、退回討論、核可推進（為 Phase 2 lead time / 核可率 KPI 預留）。
- **空收款備註 Confirm Dialog**：業務主管核可時 `payment_terms_note` 為空，需二次確認「已與業務口頭對齊」。
- **重新評估快速 confirm UI**：US-QR-006 後若 `payment_terms_note` 與上次核可時相同，業務主管可一鍵確認推進。
- **業務側等待可見性**：業務於需求單詳情頁可見「等待 [業務主管姓名] 核可中（已等待 X 天）」。

**通知**：
- **業務主管 Slack Webhook 通知對齊印務主管**：需求單進入「已評估成本」時通知指定業務主管，permalink 寫回 `slack_thread_url`。
- **業務主管退回討論觸發 Slack 通知業務**。

**User Story**：
- **修訂 US-QR-001**：建立需求單時須同時指定評估印務主管與審核業務主管。
- **修訂 US-QR-002**：聚焦業務管理進度（填收款備註、看待辦狀態、執行成交 / 流失），不再混入業務主管動作。
- **新增 US-QR-014**：設定審核業務主管（對稱 US-QR-012）。
- **新增 US-QR-015**：業務主管核可需求單進入議價（從 US-QR-002 拆出獨立 user story）。
- **新增 US-QR-016**：已評估成本通知業務主管（Slack Webhook）。

**異常 / 邊界處理**：
- **Supervisor 解鎖機制**：Supervisor 可重新指定 `approved_by_sales_manager_id` / `estimated_by_manager_id`，處理業務主管 / 印務主管離職、請假、異動等情境，避免 Phase 1 上線後卡單。
- **業務主管不可跨自己被指定範圍核可他人需求單**：避免責任歸屬模糊。

**Prototype 平台模擬**：
- 業務從業務平台進入只看「需求單 + 訂單」；業務主管從中台進入只看「需求單」；新增業務主管 mock user 切換選項。
- 業務主管預設待辦清單 = 需求單列表預設篩選 `approved_by_sales_manager_id = self AND status = 已評估成本`，按進入時間 ASC 排序。

**非目標（範疇 A 限制 + 三視角審查確認）**：
- 不擴散到訂單模組、KPI Dashboard（後續 Phase 2 規劃，但 ActivityLog 已埋點）
- 不結構化收款備註（保持 free text）
- 不做 Phase 1 條件化 gate（金額閾值 / 客戶類型）— 但預留 `approval_required` schema
- 不支援小型印刷廠（業務主管 = owner）情境（決策 10 限定組織規模假設）
- 不提供業務主管「退回至待評估成本」的狀態轉換（保留「退回討論」comment 作為溝通管道）

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

- `user-roles`：新增「業務主管」角色（含資料可見範圍）；補強權限模型語意（R/W 為粗粒度）；現行平台對照表、權限對照表、參與階段對照表均需新增一列。
- `quote-request`：新增 `approved_by_sales_manager_id`、`payment_terms_note`、`approval_required` 三個 Data Model 欄位；補齊 `estimated_by_manager_id` lifecycle；新增「業務主管核可議價推進」、「業務主管核可待辦清單」、「資料可見範圍」、「Supervisor 重新指定業務主管」、「核可條件預留欄位」、「審核業務主管指定」、「收款備註欄位」、「評估印務主管欄位 lifecycle 補齊」八個 Requirement；修訂「需求單建立與編輯」、「需求單狀態轉換」、「Slack Webhook 通知」既有 Requirement。
- `state-machines`：需求單狀態機 § 角色權責補充業務主管；新增 Slack 通知 / 業務主管核可 / 業務不可直接推進 / 退回討論 / 重新評估快速 confirm / Phase 2 條件化等六個 Scenario。

## Impact

**Spec 影響**：
- `openspec/specs/user-roles/spec.md`：新增 1 Requirement、修訂 3 Requirement
- `openspec/specs/quote-request/spec.md`：新增 8 Requirement、修訂 3 Requirement、新增 3 個 Data Model 欄位
- `openspec/specs/state-machines/spec.md`：需求單狀態機修訂、新增多個 Scenario

**Prototype 影響**（後續 `/opsx:apply` 階段執行）：
- `sens-erp-prototype/src/components/quote/`：需求單建立 / 編輯頁新增「指定審核業務主管」與「收款備註」欄位；「已評估成本」狀態下業務 / 業務主管視角的按鈕分流；ActivityLog 寫入業務主管核可、退回討論、首次查看三類事件；空備註 Confirm Dialog；重新評估快速 confirm UI；業務側等待可見性；Supervisor 解鎖入口。
- 角色切換選單：新增業務主管選項；業務角色登入後側選單瘦身為「需求單 + 訂單」；業務主管角色登入後側選單僅顯示「需求單」。
- 業務主管列表頁預設篩選：`approved_by_sales_manager_id = self` + `status = 已評估成本`，按進入「已評估成本」時間 ASC 排序。
- Slack Webhook 模擬：新增業務主管核可通知與業務退回討論通知（沿用既有 Webhook 機制）。

**相關 OQ**：
- [需求單檢視權限設計](https://www.notion.so/32c3886511fa81938415ed25260db279)：本 change 透過新增業務主管角色 + 資料可見範圍規則部分回應「業務助理或主管的協作需求」，但「主管完整檢視部門所有業務的需求單」（跨指定範圍部門級檢視）仍是 Phase 2 範疇。

**不影響**：
- 訂單模組、工單模組、生產任務模組、QC 模組、出貨模組
- 印務主管既有審核流程（與業務主管平行運作；本 change 順帶補齊既有 `estimated_by_manager_id` 的 lifecycle 規則）
- 訂單建立後的收款 / 發票流程（仍走訂單模組既有設計）
