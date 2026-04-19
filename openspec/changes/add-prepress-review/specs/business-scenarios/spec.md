## ADDED Requirements

### Requirement: 同印件補件後再審情境

業務情境 SHALL 包含「同印件不合格 → 補件 → 重審」的完整 loop 情境，以驗證狀態機與資料模型在多輪審稿下的正確性。

**與既有情境的適用階段區分**（不衝突，依審稿狀態決定走哪條路徑）：

| 情境 | 適用階段 | 審稿維度狀態 | 處理方式 |
|------|---------|------------|---------|
| **本 change 新增：同印件補件後再審** | **審稿階段內**（合格前） | 等待審稿 / 不合格 / 已補件 | 同印件多輪 ReviewRound，補件後由原審稿人員再審 |
| 既有：打樣 NG-稿件問題（business-scenarios L102-122）| **打樣階段**（審稿合格後）| 合格（不變） | 棄用原印件，建立新印件 B 重走審稿流程 |
| 既有：打樣 NG-製程問題（business-scenarios L83-98）| **打樣階段**（審稿合格後）| 合格（不變） | 同印件建新打樣工單，不動審稿狀態 |

核心原則：**審稿維度合格為終態**。合格後發現問題一律走「棄用建新」（稿件問題）或「同印件新工單」（製程問題），不回退審稿狀態。

#### Scenario: B2B 印件一次補件後通過

- **GIVEN** B2B 訂單中印件 X 已建立，`difficulty_level = 6`
- **AND** 訂單已付款並完成自動分配給審稿人員 A（A 的 `max_difficulty_level = 7`）
- **WHEN** A 首審判定為「不合格」，自 `reject_reason_category` LOV 選取「出血不足」，review_note 補充「左側裁切線內 2mm 有關鍵文字」
- **THEN** 印件 X 狀態轉為「不合格」
- **AND** 系統通知業務 B（通知管道待 XM-006 定案）
- **WHEN** 業務 B 於訂單詳情頁點選印件 X 的「補件」並上傳修正稿
- **THEN** 印件 X 狀態轉為「已補件」
- **AND** 印件 X 出現在 A 的待審列表（補件重審分類）
- **WHEN** A 再審並判定為「合格」
- **THEN** 印件 X 狀態轉為「合格」
- **AND** 印件 X 產生 `round_no = 2` 的 ReviewRound，且 `PrintItem.current_round_id` 指向此 Round
- **AND** 系統觸發自動建工單流程（若製程 / 材料已設定）

#### Scenario: B2C 印件多次補件後通過

- **GIVEN** B2C 訂單中印件 Y 已建立，`difficulty_level = 3`
- **AND** 訂單已付款並完成自動分配給審稿人員 C（C 的 `max_difficulty_level = 3`）
- **WHEN** C 首審不合格、會員補件、C 重審仍不合格、會員再補件、C 第三次審稿合格
- **THEN** 印件 Y 產生 3 筆 ReviewRound（round_no = 1、2、3），且 `PrintItem.current_round_id` 最終指向 round_no = 3
- **AND** 印件 Y 狀態由「等待審稿 → 不合格 → 已補件 → 不合格 → 已補件 → 合格」依序轉移
- **AND** 每次狀態轉移 SHALL 記錄於 ActivityLog

#### Scenario: 補件後原審稿人員已離職

- **GIVEN** 印件 Z 由審稿人員 D 首審不合格，業務補件完成
- **AND** D 已離職，系統標註 D 為「不在崗」
- **WHEN** 印件 Z 進入「已補件」狀態
- **THEN** 印件 Z SHALL 於審稿主管的覆寫待辦清單中顯示
- **AND** 主管轉指派給審稿人員 E 後，印件 Z 出現在 E 的待審列表
- **AND** round_no = 2 的 ReviewRound 建立時，`reviewer_id` 為 E（非 D）

#### Scenario: 免審稿印件不進入審稿情境

- **GIVEN** B2B 訂單中印件 W 走免審稿快速路徑
- **WHEN** 訂單付款成功
- **THEN** 印件 W 狀態 SHALL 直接為「合格」
- **AND** 印件 W SHALL **不**出現在任何審稿人員的待審列表
- **AND** 印件 W SHALL **不**產生 ReviewRound 紀錄
- **AND** 系統 SHALL 依既有流程自動建工單（若製程 / 材料已設定）
