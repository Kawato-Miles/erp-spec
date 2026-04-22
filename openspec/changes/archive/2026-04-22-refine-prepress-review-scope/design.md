## Context

上一輪 [`add-prepress-review`](../archive/2026-04-20-add-prepress-review/proposal.md) change 於 2026-04-20 歸檔，將審稿模組的資料模型（`ReviewRound` / `PrintItem.current_round_id` / `PrintItemFile.file_role`）、自動分配演算法、雙工作台骨架與 ActivityLog 落地，`prepress-review` capability 合併回 main specs（`openspec/specs/prepress-review/spec.md`），但 Purpose 仍為 `TBD`。

歸檔後與 Miles 對齊現況時發現前期 BRD 的 Why 與商業問題敘述與印刷廠實際營運有三處落差（見 proposal § Why 對照表）。**功能骨架本身正確**（ERP 要涵蓋過往已運作流程，自動分配 / 能力維護 / 覆寫 / 工作台 / ReviewRound / 補件 loop / LOV 皆保留），但 BRD 把問題框成「流程不可運作、需補齊骨架」是錯的——真正需要系統化的是把**既有雙向溝通介面**（客戶/業務→審稿的稿件說明、審稿→下游的備註）落地為欄位。

本 change 的本質是**敘述 / 定位修正 + 兩個備註欄位補缺 + UI 曝光 + 三視角審查後採納的技術細節修正**，不動任何既有 Functional Requirement。KPI / Metrics / 儀表板相關需求由審稿主管自行討論後另行提案，不在本 change 範疇。

## Goals / Non-Goals

**Goals:**

1. 記錄本次 BRD Why 重寫的認知對齊脈絡（分配 / 定位 / 商業問題重心三處落差）與 Miles 決策理由
2. 確定兩個備註欄位（`PrintItem.client_note` / `ReviewRound.review_note`）的語意切分、生命週期、編輯權限
3. 確定「印件層最新一筆審稿備註」的實作路徑（UI 層計算，不加衍生欄位）
4. 吸收三視角審查採納項（`review_note` 修改稽核、`client_note` 覆寫稽核、business-processes delta 補充）

**Non-Goals:**

1. 不重新設計自動分配演算法（既有 add-prepress-review 設計保留）
2. 不設計 KPI 儀表板 / Metrics 清單 / L1 L2 分層框架（由審稿主管自行討論後另行提案）
3. 不新增審稿人員個人視角 KPI
4. 不設計補件方 → 審稿的回話通道（Miles 現場確認無此痛點）
5. 不處理跨系統通知管道（[XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 合併至後續跨系統通知 change）
6. 不涉及圖編器 Preflight（[XM-007](https://www.notion.so/3473886511fa81738471f2f2753e0f97) 圖編器產品範疇）
7. 不新增審稿延誤 → 訂單準交連結指標（屬 KPI 範疇，同 Non-Goal 2）

## Decisions

### D1：為什麼 Why 要重寫而非補充

**決定**：將 `prepress-review` spec Purpose 與既有 Requirement narrative 重寫，不保留前期 BRD 的「流程不可運作」敘述。

**理由**：
- 前期 BRD 把「ERP 化 = 補齊不可運作的骨架」當商業問題，框架錯誤會讓後續 Notion BRD、跨部門溝通（Preflight ROI 討論、CEO 投入決策）都朝錯方向
- 若只補充不重寫，讀者讀到兩套並存敘述會更困惑：「過往到底是運作正常還是不可運作？」
- 功能範疇不動的前提下，成本只是文字修辭，收益是**後續所有 stakeholder 讀到的問題框架都正確**

**替代方案（已棄）**：
- 保留前期 Why 並加註「已修正」：讀者負擔增加，框架錯誤訊息仍存在
- 只改 Purpose、不動既有 Requirement narrative：既有 Requirement 前言仍帶「補齊骨架」語境，讀者仍會誤判

### D2：兩個備註欄位的語意切分（不合併為統一 notes 模型）

**決定**：

| 欄位 | 語意 | 層級 | 方向 | 生命週期 | 編輯權限 |
|------|------|------|------|---------|---------|
| `PrintItem.client_note`（新）| 稿件備註 | 印件 1:1 | 會員 / 業務 → 審稿 | 印件首次建立時填；補件**不再填**（Miles 確認無痛點）| 若後續需修改，SHALL 寫 ActivityLog「稿件備註修改」事件（from / to）|
| `ReviewRound.review_note`（既有擴充）| 審稿備註 | ReviewRound 1:1 | 審稿 → 補件方 / 後續角色 | 每輪皆可填（合格 / 不合格皆可）；印件層 UI 帶出最新一筆 | **送出後允許原審稿人員修改**；每次修改 MUST 寫 ActivityLog「審稿備註修改」事件；補件方在線時 Toast 通知 |

**理由**：
- 兩者**發送方向相反**（上游→審稿 vs 審稿→下游），合併為單一 `notes` 陣列會讓讀取端要額外判斷「這則是誰寫給誰的」
- 兩者**生命週期相反**（`client_note` 跟印件走、`review_note` 跟輪次走），合併會強制決定「是跟印件還是跟輪次」，兩邊都不對
- 兩者**可寫入次數相反**（`client_note` 只在印件首次建立、`review_note` 每輪都可填），合併會讓「只能寫一次」變成模型層強制規則
- 切分後 UI 明確：審稿工作台看 `client_note`（來源說明）、補件頁看 `review_note` 歷史清單（審稿意見）、印件詳情看 `last_review_note`（最新狀態）
- **業界對齊**（erp-consultant 三視角審查）：Esko WebCenter Approval Manager 明確區分 job ticket briefing（客戶提供）與 annotation / comment（審稿回覆，綁 version），本 change 切分與業界標準一致

**替代方案（已棄）**：
- 統一 `PrintItemNote` 實體（attached_to / direction / author_role 欄位）：資料模型看似 DRY，UI / 查詢層複雜度上升
- 只新增 `client_note`、`review_note` 維持 spec 原樣：`review_note` 語意（原限不合格才填）不擴充的話，合格通過的輪次無法留備註給後續角色看

### D3：`ReviewRound.review_note` 送出後允許修改 + ActivityLog 稽核（Miles 2026-04-21 決策）

**決定**：`ReviewRound.review_note` 於該輪 Round submit 後 **允許原審稿人員回頭修改**（供糾正打錯字 / 補充內容）。每次修改 MUST 寫入印件 ActivityLog「審稿備註修改」事件；修改發生於補件方在線時觸發 Toast 通知。**工單只鎖檔案、不鎖備註**，review_note 修改即時反映於印件層與工單單據的最新內容。

**理由**：
- **erp-consultant 原建議鎖版**（對齊 Esko WebCenter + ISO 9001），但 Miles 現場判斷印刷廠實務需求：審稿人員手快打錯字是常見情境，硬性鎖死等於逼審稿「打錯字只能建新一輪或走外部管道」，增加無謂操作成本
- **審稿備註本質是溝通語言而非稽核簽章**：審稿意見的目的是讓補件方 / 下游明白怎麼改，不是合規文件；真正的稽核需求由 ActivityLog 歷次修改紀錄滿足（ISO 9001 合規關鍵在「可追溯」而非「不可變」）
- **工單鎖檔不鎖備註的決策**：工單鎖定核心價值是保證生產用的「檔案」不被後續動作污染；備註是說明文字，糾正錯字應能傳到下游印務，否則工單永遠看到錯字版沒意義
- **通知補件方**：審稿改備註時若補件方正在補件頁停留，Toast 通知確保補件方不會依舊版備註白做工

**修改權限**：僅限該輪次原審稿人員（`reviewer_id`）；主管 / 其他審稿人員 SHALL 不可直接修改他人輪次的 review_note（若需介入，走既有「主管覆寫分配」流程接手後由新審稿人員建立新 Round）

**替代方案（已棄）**：
- 鎖版不可編輯（erp-consultant 原建議）：實務上逼審稿打錯字建新一輪，操作成本高；Miles 判斷不採納
- 允許編輯但不記 ActivityLog：不合規，無法還原糾紛時的原始審稿意見

### D4：`PrintItem.client_note` 覆寫稽核升 Requirement MUST（erp-consultant 三視角審查採納）

**決定**：若後續業務 / 主管需修改已存在的 `client_note`（非補件動作、為修正既有敘述），系統 MUST 寫 ActivityLog「稿件備註修改」事件，記錄 actor / from / to / timestamp。本 change 將此從 design.md Risks 表升為 spec 層 Requirement。

**理由**：
- **ISO 9001 稽核**：ISO 9001 要求「客戶指示變更可追溯」，若 `client_note` 可覆寫但未落 ActivityLog，糾紛時無法還原客戶原指示，不合規
- **業界參考**：Esko WebCenter job ticket comment 採 append-only 設計；本 change 採輕量覆寫 + ActivityLog，在合規與實作成本間取平衡
- **補件階段不開放覆寫**：Miles 確認補件階段無補充稿件備註的痛點，故覆寫限定於「印件建立後主管 / 業務修正既有敘述」情境，不走補件流程

### D5：「印件層最新一筆審稿備註」的實作——UI 層計算為主、快取欄位為後備

**決定**：Prototype 採 **UI 層讀 `PrintItem.current_round_id → ReviewRound.review_note`** 計算出顯示值；不在本 change 新增 `PrintItem.last_review_note` 欄位。若未來 Prototype 列表頁效能出問題或需在匯出報表中直接取得，再評估加衍生欄位快取。

**理由**：
- `current_round_id` 已經是 add-prepress-review D4 指針方案的產物，UI 讀取路徑成本極低
- 本 change 定位是「敘述 + UI 曝光」，若又引入新衍生欄位會讓「跟 ReviewRound / current_round_id 同步更新」的 race condition 再度出現（add-prepress-review D4 剛把這類雙寫衝突收斂）
- Prototype 階段資料規模小，UI 層計算效能無壓力
- 配合 D3（review_note 送出後可修改），UI 層計算天然即時反映最新修改；若改採衍生欄位快取，每次修改都要同步 `PrintItem.last_review_note`，引入新雙寫點

**替代方案（已棄）**：
- 一開始就加 `PrintItem.last_review_note` 欄位：引入新雙寫同步點，違反 add-prepress-review 已關閉的 D4 原則

### D6：`client_note` 帶入訂單後脫鉤（erp-consultant 三視角審查採納）

**決定**：需求單 `client_note` 於成交轉訂單時帶入對應 PrintItem.client_note，帶入後**各自獨立編輯、不回寫同步**（與 business-processes L72「帶入後印件的預計產線 SHALL 可繼續編輯」語意對齊）。此欄位**不**加入 data-consistency-audit 的 TRACKED_PARITY_FIELDS（脫鉤型欄位，跨層同步斷裂屬預期行為）。

**理由**：
- 訂單成立後，需求單回頭修改 `client_note` 不應反向影響已派審的印件（避免已讀內容被改動造成審稿混亂）
- 與既有 `expected_production_lines` 帶入後脫鉤的設計模式一致

### D7：什麼留給後續 change 處理

**決定**：以下明確列入「本次不做」：

| 項目 | 延後理由 |
|------|---------|
| KPI 相關所有功能（Metrics 清單 / L1 L2 框架 / 儀表板 UI / 準交連結指標）| Miles 指示由審稿主管自行討論需求後另行提案 |
| 審稿人員個人視角 KPI | 同上，屬 KPI 範疇 |
| 補件方 → 審稿回話通道 | Miles 現場確認無此痛點 |
| 跨系統通知管道 | 合併至後續跨系統通知 change（[XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473)）|
| 圖編器 Preflight | 圖編器產品範疇 |

**理由**：本 change 本質是「敘述修正 + 補兩個欄位 + 三視角技術細節」，若把所有可做的都塞入會模糊問題定位；KPI 相關更是 Miles 明確指示不做。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `review_note` 允許修改後，補件方可能已依舊版開始修稿，審稿改了備註造成白做工 | 補件方在線時 Toast 即時通知（Prototype 層級）；真跨系統通知管道（Email / Slack / APP push）待 XM-006 處理 |
| `review_note` 修改後工單單據顯示最新版，但工單已鎖定的檔案是建單時版本 → 單據與檔案語意可能讓印務誤解 | 工單單據 UI 明確區分「鎖定檔案」與「最新備註」；ActivityLog 保留歷次版本供還原 |
| 非原審稿人員誤改他人輪次的備註 | Spec 明訂僅原審稿人員可改；實作須在修改入口做 reviewer_id 權限檢查 |
| `client_note` 覆寫 ActivityLog 機制若未於 Prototype 完整實作，正式系統遷移時才補會有歷史缺口 | 本 change tasks 將覆寫 ActivityLog 列為 Prototype 必做項；spec Requirement MUST 強制 |
| 「印件層最新一筆審稿備註」採 UI 層計算，Prototype 列表頁若在審稿大量數據下會慢 | Prototype 資料規模小（mock），不會發生；正式系統改採後端快取或 DB 層衍生欄位處理 |
| 本 change 僅做 BRD 修正 + 兩欄位，CEO 視角可能質疑投入產出不對稱 | Miles 定位明確：本 change 目的是確保後續跨部門溝通（Preflight ROI、KPI 提案）以正確 BRD 為基礎；KPI 功能由主管自行討論另提，不綁本 change |
| `PrintItem.client_note` 在 EC 整合介面尚未補（依賴 EC 團隊回寫路徑），Prototype 先以 mock 資料呈現 | 列為 Prototype-only scope；正式整合的 EC → ERP 介面欄位擴充由 EC 整合 change 處理（與 `difficulty_level` 同路徑）|

## Migration Plan

本 change 本質為敘述 / UI 修正，無資料遷移需求。

1. **Spec 異動**：
   - `prepress-review/spec.md`：Purpose 補寫、既有 Requirement narrative 重寫、新增 client_note / review_note 鎖版 / ActivityLog 稽核相關 Requirement
   - `quote-request/spec.md`（delta）：新增 `client_note` 欄位於需求單印件建立階段 + 帶入訂單後脫鉤
   - `order-management/spec.md`（delta）：新增 `client_note` 欄位於 B2C 會員上傳印件階段 + 補件頁歷史 review_note 清單
   - `business-processes/spec.md`（delta）：§ 稿件管理規則 narrative 補 client_note / review_note 切分
2. **Prototype 異動**：見 tasks.md § 3
3. **回滾**：若 Prototype 上線後發現備註欄位干擾現有業務流程，關閉 UI 顯示即可（`client_note` nullable，無資料則不顯示；`review_note` UI 回退為僅不合格可填）；spec 敘述可保留，UI 關閉不影響資料

## Open Questions

本 change 內部 OQ：

| ID | 問題 | 處理方式 |
|----|------|---------|
| D-01 | `review_note` 字數上限（既有 spec 未明訂）| 本 change 建議 1000 字；若印刷業有長文備註需求可調整 |
| D-02 | 「印件層最新一筆審稿備註」是否永遠採 UI 層計算，還是未來加快取欄位 | 本 change 採 UI 層計算；觀察 Prototype 效能與正式系統需求再決定 |

D-01 / D-02 為本 change 內部設計 OQ，**不上 Notion Follow-up DB**。

**三視角審查提出、本 change 已決策的項目（不另立 OQ）**：

| 議題 | 決策 |
|------|------|
| `ReviewRound.review_note` submit 後編輯權限 | Miles 2026-04-21 決策：允許原審稿人員修改 + ActivityLog 稽核 + 補件方在線 Toast 通知（見 D3）|
| 工單鎖定範圍（是否連同備註一起鎖）| 只鎖檔案不鎖備註；review_note 修改即時反映於工單單據最新內容（見 D3）|
| 補件方看到的歷史清單版本 | 顯示現況（改過後的最新版）+ 補件方在線時 Toast 通知（避免白做工）|
