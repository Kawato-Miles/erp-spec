## Why

ERP 既有 specs 已埋下印件審稿骨架（雙維度狀態、`審稿` / `審稿主管` 角色），但**缺失可運作的細節**：審稿人員無自動分配機制、印件檔案無版本歷史、不合格無補件回合、審稿人員與主管皆無工作台 UI。導致審稿流程實際上無法運作，稿件歷史無法追溯，分配效率依賴人工，KPI 無法量化。

本 change 補齊稿件審查模組（Prepress Review），使其成為 Phase 2「訂單流程完整完成率 ≥ 60%」目標的關鍵環節——審稿為訂單進入生產前的必經閘門，未閉環會導致工單流無法自動化。

## What Changes

### 新增

- **稿件審查能力**：獨立 `prepress-review` capability，涵蓋自動分配、審稿作業、補件回合、ReviewRound 檔案版本管理、審稿人員與審稿主管工作台
- **難易度分級（1-10 整數）**：印件層與審稿人員能力層皆引入此量綱
  - 需求單印件 `difficulty_level`（業務填寫，未填不可送出）
  - 訂單印件 `difficulty_level`（自需求單繼承）
  - B2C 商品主檔 `difficulty_level`（EC 商品管理維護）
  - 審稿人員 `max_difficulty_level`（審稿主管維護）
- **ReviewRound 資料模型**：`PrintItem ──1:N──▶ ReviewRound ──1:N──▶ PrintItemFile`，每次送審聚合原稿、加工檔、縮圖與結果
- **系統自動分配機制**：B2C 付款後、B2B 訂單建立付款後自動派件；挑選規則「能力值最接近印件難易度」為主、「進行中審稿數最少」為輔
- **補件流程**：B2C 會員於電商前台自助補件；B2B 業務於訂單詳情頁找到印件補件
- **ActivityLog on PrintItem**：時間、狀態變更、操作人員（對齊需求單樣式）
- **審稿人員工作台**：列表頁（我的待審）+ 詳情頁（單稿件審稿 + 檔案上傳 + 合格/不合格決策）
- **審稿主管工作台**：能力維護面板、審稿人員負擔儀表板、覆寫分配、KPI 追蹤

### 修改

- **印件審稿維度狀態機**：新增「不合格 ↔ 已補件 → 合格」迴圈，既有「稿件未上傳 → 等待審稿 → 合格」保留
- **`審稿` 角色**：補齊自動收件、加工放行、標註不合格的權責
- **`審稿主管` 角色**：補齊能力維護、負擔監看、覆寫分配、KPI 監管；**移除**原 L170「案件分派」人工動作（改為系統自動＋覆寫）
- **業務流程 § 審稿階段**：由骨架描述擴充為完整流程（自動分配觸發 → 審稿人員作業 → 合格建工單 / 不合格補件 loop）
- **業務情境**：新增「補件後再審」loop 情境（與既有「NG 棄用印件建新印件」情境並存，前者為同印件內處理、後者為跨印件處理）

### 不變

- 印製維度狀態機（等待中 → 工單已交付 → ... → 已送達）
- 合格後工單**建立的觸發機制**（沿用既有 state-machines L78 「印件審稿合格後建立工單」規則）；**分流規則為本 change 新增細化**（B2C 自動帶生產任務 / B2B 空草稿）
- 免審稿快速路徑的**業務語意**（order-management L126-128）；**技術實現**改為產生 `source=免審稿` 的 ReviewRound 以讓合格判定單一正本

## Capabilities

### New Capabilities

- `prepress-review`：印件稿件審查模組。包含自動分配規則、ReviewRound 資料模型、審稿作業流程、補件回合、審稿人員工作台、審稿主管工作台

### Modified Capabilities

- `user-roles`：擴充 `審稿`、`審稿主管` 細部職責；調整 L170 主管分派方式
- `state-machines`：印件審稿維度狀態機擴充（加入不合格、已補件狀態與轉移）
- `quote-request`：需求單印件新增 `difficulty_level` 必填欄位與送出驗證
- `order-management`：訂單印件 `difficulty_level` 繼承規則；印件新增 ReviewRound 與 ActivityLog；補件入口
- `business-processes`：審稿階段流程細節（自動分配、補件 loop、合格建工單的觸發時機）
- `business-scenarios`：新增「同印件補件後再審」情境

## Impact

### Specs 異動範圍

7 個 main specs 中 6 個受影響，加新增 1 個 capability：

| Spec | 主要異動 |
|------|---------|
| `prepress-review`（新增） | 完整 capability spec |
| `user-roles` | 審稿、審稿主管權責補齊 |
| `state-machines` | 印件審稿維度擴充 |
| `quote-request` | difficulty_level 欄位 |
| `order-management` | difficulty_level 繼承、ReviewRound、補件入口 |
| `business-processes` | 審稿階段流程 |
| `business-scenarios` | 補件後再審情境 |

### Prototype 異動（`sens-erp-prototype`）

- `RoleSwitcher` 新增「審稿」「審稿主管」兩個角色組
- 新增 `components/prepress-review/`：Reviewer 列表 + 詳情；Supervisor 能力維護 + 儀表板 + 覆寫分配
- 既有 `EditPrintItemPanel` 補 `difficulty_level` 欄位
- 訂單詳情頁新增印件補件入口（業務可見）
- 既有 `PrintItemStatusBadge` / `PrintItemStatusStepper` 加入新狀態

### 資料模型影響

- 新增：`ReviewRound`、印件層 `ActivityLog` 事件型別
- 擴充：`PrintItem.difficulty_level`、`PrintItemFile.round_id / file_role`（原稿 / 加工檔 / 縮圖）、`User.max_difficulty_level`
- 沿用：`PrintItemFile.review_status`（待審稿 / 合格 / 不合格）

### 流程交界影響

- **上游**（需求單 / 訂單）：業務須填 `difficulty_level` 才能送出
- **下游**（工單）：合格觸發自動建工單（既有規則，不動）
- **EC 整合**：B2C 商品主檔須加 `difficulty_level`；會員前台補件需能回寫印件檔案與觸發狀態轉移（跨系統介面，列入 OQ）

### 風險與待決議

本 change 入 Notion Follow-up DB 的 OQ 清單（六項開啟 + 一項已解答 + 一項新增 + 一項跨產品追蹤），不阻塞 proposal 通過，但影響 tasks 排序：

| 狀態 | OQ | 主題 |
|------|----|------|
| 開啟 | PI-003 | ReviewRound 內檔案型別區分（原稿 / 加工檔 / 縮圖）具體欄位 |
| 開啟 | PI-004 | 無審稿人員能力 ≥ 印件難易度時的降級策略 |
| **已解答** | ~~OQ3~~ → PI-005 | 合格後建工單規則：**B2C 自動帶生產任務 / B2B 空工單草稿**（design D11 解答，PI-005 將於歸檔時標為已完成） |
| 開啟 | PI-006 | 審稿人員工作台 UI 細節 |
| 開啟 | PI-007 | 審稿主管工作台 UI 細節 |
| 開啟 | ORD-010 | 業務補件 UI 細節 |
| 開啟 | XM-006 | 不合格通知機制 |
| **新增** | PI-008 | 審稿人員規模成長時 Prepress Operator / Approver 角色拆分檢視（本 change 採小廠合併模型） |
| **跨產品追蹤** | 圖編器 Preflight | 出血 / 解析度 / 色彩模式上游自動檢查（於圖編器另開 change） |

### 本 change 已關閉的技術 P0（審查後於 design / specs 修正）

- **D4 指針方案**：`PrintItem.current_round_id` 取代 `ReviewRound.is_current_display` 旗標，避免並發 race
- **is_final 移除**：廢除 `PrintItemFile.is_final`，由 current_round_id 指針鏈取代，避免雙寫衝突
- **免審路徑產生 Round**：`source=免審稿` Round，讓 ReviewRound 成為合格判定的單一正本
- **合格為終態**：合格後異動走「棄用原印件 + 建立新印件」路徑，不開回退
- **覆寫 reason 必填 Scenario** 與 **技術退件 KPI 排除** 補入 spec
