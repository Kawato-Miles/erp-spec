## 1. 前置決議（標示 blocker 的為 2.x 資料模型任務前置）

- [x] 1.1 將 7 項 OQ 入 Notion Follow-up DB（已完成，見 oq-drafts.md）
- [x] 1.2 審稿難易度（1-10）分級指引文件草稿（非系統機制，為業務填寫時的參考）
- [x] 1.3 ~~PI-003 定案~~：已於 design.md D4 / PI-003 Notion 解答（file_role 僅兩值：印件檔 / 縮圖），歸檔時標為已完成
- [x] 1.4 ~~PI-004 定案~~：已於 design.md D13 解答（破例派給能力最高者 + ActivityLog 記錄），歸檔時標為已完成
- [x] 1.5 ~~OQ3 定案~~：已於 design.md D11 解答（B2C 自動帶生產任務 / B2B 空工單草稿），PI-005 於歸檔時標為已完成
- [x] 1.6 建立 PI-008（角色拆分未來檢視）入 Notion — 已完成
- [x] 1.7 建立 XM-007（圖編器 Preflight 追蹤）入 Notion — 已完成
- [x] 1.8 ~~PI-009 定案~~：已於 design.md D14 解答（10 項 LOV 選單），歸檔時標為已完成

## 2. 資料模型（Prototype schema 定義；1.3 完成後啟動 2.2）

- [x] 2.1 於 Prototype `types/` 新增 `ReviewRound` interface（round_no、reviewer_id、source、submitted_at、result、`reject_reason_category`、review_note）；`reject_reason_category` enum LOV 10 項（依 D14 定案）
- [x] 2.2 `PrintItemFile` interface 擴充 `round_id`、`file_role`（**兩值**：印件檔 / 縮圖）；**移除** `is_final` 引用
- [x] 2.3 `PrintItem` interface 新增 `difficulty_level`（1-10）、`current_round_id`（FK ReviewRound，unique）、`audit_log` 陣列
- [x] 2.4 `User`（審稿人員）interface 新增 `max_difficulty_level`（1-10）與 `available_status`（在崗 / 不在崗）
- [x] 2.5 EC 商品主檔 interface 新增 `difficulty_level`
- [x] 2.6 Mock 資料：至少 6 位審稿人員（能力值 3、5、5、7、8、10）、審稿主管 1 位、涵蓋 difficulty 1-10 的印件
- [x] 2.7 Mock 資料：至少含 2 筆進行中不合格印件（B2C 1 筆、B2B 1 筆）、1 筆多輪審稿完成印件、1 筆免審稿印件（驗證 source=免審稿 Round 建立）

## 3. 狀態機與自動分配邏輯

- [x] 3.1 實作審稿維度狀態轉移函式（`稿件未上傳 → 等待審稿 → 合格 / 不合格 ↔ 已補件 → 合格`，合格為終態）
- [x] 3.2 實作自動分配演算法（能力最接近優先、負載最少次之、user_id tie-break；候選集為空時破例派給能力最高者並記錄 ActivityLog「破例派工」）
- [x] 3.3 分配觸發點：訂單付款（B2C / B2B）hook
- [x] 3.4 ReviewRound 建立函式：
  - 送審產生新 round
  - 合格時同步更新 PrintItem.current_round_id 指針（unique constraint 保證）
  - 免審路徑產生 `source=免審稿` 的 round
- [x] 3.5 合格後分流建工單：
  - B2C：自動建工單 + 依商品主檔工序定義建生產任務
  - B2B：建空工單草稿（生產任務由印務主管後續處理）
- [x] 3.6 狀態轉移同步寫入印件 ActivityLog
- [x] 3.7 技術性退件以 `reject_reason_category = 技術性退件` 判定，KPI 計算時排除於「不合格率」分母，計入「技術退件比率」單獨指標
- [x] 3.8 退件原因 Top N 統計：依 reject_reason_category 分組計數，呈現於審稿主管 KPI 儀表板
- [x] 3.8 驗證：Prototype 測試情境涵蓋自動分配 happy path（能力比對、並列挑選）

## 4. 共用元件

- [ ] 4.1 `DifficultyLevelInput`：1-10 數值輸入元件（含範圍驗證、必填提示）
- [ ] 4.2 `DifficultyLevelBadge`：顯示難易度的 Badge（含顏色分層）
- [ ] 4.3 `ReviewStatusBadge`：新增「不合格」「已補件」兩個狀態樣式（延伸既有 PrintItemStatusBadge）
- [ ] 4.4 `ReviewRoundTimeline`：印件詳情頁歷史輪次時間軸元件
- [ ] 4.5 `FileUploadPanel`：加工檔 + 縮圖上傳元件（多檔、拖放）
- [ ] 4.6 `ActivityLogTimeline`：印件層活動紀錄元件（對齊需求單樣式）

## 5. RoleSwitcher 與角色組

- [ ] 5.1 RoleSwitcher 新增「審稿」「審稿主管」兩個角色組
- [ ] 5.2 審稿角色對應的路由與側邊欄項目（Reviewer 工作台）
- [ ] 5.3 審稿主管角色對應的路由與側邊欄項目（Supervisor 工作台）
- [ ] 5.4 角色切換後的 Mock 登入狀態 persist

## 6. 需求單與訂單整合（quote-request / order-management）

- [ ] 6.1 需求單印件編輯面板加入 `DifficultyLevelInput` 欄位（必填驗證）
- [ ] 6.2 需求單送出前端驗證：所有印件 `difficulty_level` 必填
- [ ] 6.3 需求單成交轉訂單時，訂單印件自動繼承 `difficulty_level`
- [ ] 6.4 EC 商品主檔編輯頁新增 `difficulty_level` 欄位（若 Prototype 有 EC 商品主檔頁面，否則以 Mock 資料呈現）
- [ ] 6.5 B2C 訂單建立時印件自動繼承商品主檔 `difficulty_level`
- [ ] 6.6 訂單詳情頁印件列表顯示 `DifficultyLevelBadge`
- [ ] 6.7 訂單詳情頁：當印件為「不合格」狀態時，顯示業務可見的「補件」入口
- [ ] 6.8 業務點選補件入口觸發檔案上傳 → 新增補件 PrintItemFile → 狀態轉「已補件」
- [ ] 6.9 訂單詳情頁印件摘要縮圖僅呈現 `PrintItem.current_round_id` 指向的輪次檔案
- [ ] 6.10 印件詳情抽屜新增「歷史輪次」區塊（ReviewRoundTimeline）

## 7. 審稿人員工作台（Reviewer）

- [ ] 7.1 工作台列表頁：分類「首審」與「補件重審」，各自計數
- [ ] 7.2 列表預設排序（PI-006 未定案前用「分配時間」）
- [ ] 7.3 列表每列呈現：印件名稱、訂單編號、難易度、分配時間、狀態
- [ ] 7.4 工作台詳情頁：左側印件需求規格、原稿檢視
- [ ] 7.5 詳情頁：下載原稿按鈕
- [ ] 7.6 詳情頁：上傳加工檔 + 縮圖元件（`FileUploadPanel`）
- [ ] 7.7 詳情頁：送審操作（合格 / 不合格單選；不合格時 reject_reason_category LOV 下拉必選、review_note 選填補充）
- [ ] 7.8 詳情頁右側：ReviewRoundTimeline（歷史輪次）
- [ ] 7.9 詳情頁底部：ActivityLogTimeline
- [ ] 7.10 送審後返回列表頁，該筆印件從待審列表移除

## 8. 審稿主管工作台（Supervisor）

- [ ] 8.1 能力維護面板：表格列出所有審稿人員 + `max_difficulty_level` 欄位可編輯
- [ ] 8.2 能力維護：新增 / 停用審稿人員操作
- [ ] 8.3 能力變更記錄：呈現近 N 筆變更（時間、操作者、from、to）
- [ ] 8.4 負擔儀表板：每位審稿人員進行中審稿數 / 完成數 / 待審數（進行中 = 等待審稿 + 已補件且被分配者）
- [ ] 8.5 負擔儀表板：支援依能力值、負擔數排序
- [ ] 8.6 覆寫分配入口：選取進行中印件 → 選取目標審稿人員 → 驗證能力 → **必填 reason** → 確認轉指派
- [ ] 8.7 覆寫分配：拒絕能力不足者、拒絕未填 reason，並顯示提示
- [ ] 8.8 KPI 儀表板（design § Success Metrics）：
  - 自動分配命中率（非覆寫比例）
  - 首審通過率
  - 付款到合格平均時長
  - 補件 loop 平均輪數
  - 不合格率（排除 reject_reason_category = 技術性退件）
  - 退件原因 Top N（依 reject_reason_category 分組統計）
  - **破例派工頻率**（候選集為空時發生的比例，作為人力補充業務訊號）
- [ ] 8.9 覆寫待辦清單：列出「原審稿人員不在崗且處於已補件」的印件

## 9. B2C 補件 Mock 介面（非 ERP 範疇，但需 Mock 展示）

- [ ] 9.1 Mock 電商前台會員訂單詳情頁（簡化版）
- [ ] 9.2 會員上傳補件動作觸發 Mock ERP 介面回寫補件檔案
- [ ] 9.3 印件狀態轉「已補件」並驗證待審列表重新出現於原審稿人員

## 10. 情境驗證（End-to-End）

- [ ] 10.1 情境 A：B2C 難易度 5 商品 → 付款 → 自動分配（驗證命中規則）
- [ ] 10.2 情境 B：B2B 補件 loop 一輪後通過 → 驗證 round_no=2 的 ReviewRound 正確建立、`PrintItem.current_round_id` 正確切換至 round_no=2
- [ ] 10.3 情境 C：B2C 多輪補件（3 輪）最終通過 → 驗證 ActivityLog 完整性
- [ ] 10.4 情境 D：免審稿印件 → 驗證不入待審列表、不產生 ReviewRound、直接合格
- [ ] 10.5 情境 E：主管覆寫分配 → 驗證 ActivityLog 記錄完整（from_user、to_user、reason）
- [ ] 10.6 情境 F：原審稿人員不在崗 + 已補件 → 驗證進入主管覆寫清單
- [ ] 10.7 情境 G：能力不足邊界 → 依 PI-004 定案行為驗證

## 11. 三視角審查與稽核

- [ ] 11.1 specs + design 完成後，平行呼叫 senior-pm、ceo-reviewer、erp-consultant 三視角審查
- [ ] 11.2 依三視角回饋更新 proposal / design / specs
- [ ] 11.3 執行 doc-audit 檢查跨檔案一致性
- [ ] 11.4 針對 doc-audit 回饋修正

## 12. 歸檔前準備

- [ ] 12.1 驗證所有 scenarios 可於 Prototype 重現
- [ ] 12.2 更新既有 OQ 狀態並同步 Notion：
  - PI-002（打樣 NG 檔案版次 vs 重建印件）→ 已完成，決議：採「審稿階段內同印件補件（檔案版次方案）+ 合格後改開新印件」混合路徑。理由：補件 loop 適用稿件內容微調；合格後代表業務內容變更，應走新印件
  - PI-003（file_role 枚舉）→ 已完成，決議：僅兩值（印件檔 / 縮圖）。理由：審稿人員將客戶提供的多類內容合併為單一印件檔，參考圖由縮圖承擔
  - PI-004（能力不足降級）→ 已完成，決議：破例派給當前能力最高者 + ActivityLog 標註。理由：不卡流程維持 SLA；破例頻率成為人力補充訊號
  - PI-005（合格後建工單前置條件）→ 已完成，決議：B2C 自動帶生產任務 / B2B 建空工單草稿。理由：B2C 商品主檔已規格化、B2B 印件客製化需印務主管拆分
  - PI-009（退件原因 LOV 清單）→ 已完成，決議：10 項（出血不足 / 解析度過低 / 色彩模式錯誤 / 缺少必要元素 / 版面超出安全區 / 尺寸不符 / 特殊工藝圖層異常 / 字型未外框 / 技術性退件 / 其他）。理由：涵蓋業界最常見問題 + 與圖編器 Preflight 規則對映 + 其他兜底強制備註
- [ ] 12.3 `openspec validate add-prepress-review --strict` 通過
- [ ] 12.4 Archive 時同步更新 `openspec/specs/order-management/spec.md` L325-340 的 PrintItemFile Data Model 表格：
  - 移除 `is_final` 欄位
  - 新增 `round_id`、`file_role` 欄位
  - `review_status` 欄位說明標為衍生值
- [ ] 12.5 Archive 時同步 PrintItem Data Model 新增 `current_round_id` 欄位
- [ ] 12.6 準備 PR / commit 訊息，等待 Miles 決定歸檔時機（`/opsx:archive add-prepress-review`）
