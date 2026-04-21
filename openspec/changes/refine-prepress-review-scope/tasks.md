## 1. Spec 敘述修正（main spec）

- [ ] 1.1 `openspec/specs/prepress-review/spec.md` Purpose 從 `TBD` 改寫為：承認過往流程運作正常、定位為「既有審稿流程 ERP 化 + 承載客戶 / 業務與審稿的雙向溝通介面」、審稿本質為溝通介面而非訂單閘門（歸檔時由 sync 合併完成；本任務為提醒與覆核）
- [ ] 1.2 既有 Requirement narrative 由 sync 合併完成後，**人工覆核三處 narrative** 是否仍留有「補齊不可運作骨架」語境殘留：
   - `印件自動分配機制`
   - `審稿人員工作台`
   - `審稿主管工作台`
- [ ] 1.3 完成 Spec 敘述修正後，跑 `openspec validate prepress-review` 確認格式與引用正確

## 2. Prototype UI 實作（`sens-erp-prototype` repo）

### 2.1 稿件備註欄位輸入（`PrintItem.client_note`）

- [ ] 2.1.1 `src/components/quote/` 需求單印件建立 / 編輯 UI 新增 `client_note` textarea（500 字上限、非必填、字數計數）
- [ ] 2.1.2 需求單成交轉訂單 flow 帶入 `client_note` 至對應 PrintItem（seed / mock 資料層同步）
- [ ] 2.1.3 成交後需求單與訂單 client_note 脫鉤（修改需求單 client_note 不同步訂單 PrintItem）
- [ ] 2.1.4 B2C 會員下單頁（EC demo）上傳印件時新增 `client_note` textarea，模擬 EC → ERP 回寫路徑

### 2.2 稿件備註顯示（審稿工作台）

- [ ] 2.2.1 `src/components/prepress-review/reviewer/` 列表頁每筆印件列加 `client_note` 前 50 字摘要，滑鼠滑過顯示完整 tooltip
- [ ] 2.2.2 `src/components/prepress-review/reviewer/` 詳情頁顯眼處加 `client_note` 完整顯示區（空值顯示「無稿件備註」佔位）

### 2.3 稿件備註覆寫 ActivityLog 稽核

- [ ] 2.3.1 印件編輯介面（訂單詳情 / 需求單印件編輯）若允許業務 / 主管修改 `client_note`，修改 SHALL 寫入 ActivityLog 事件（`event_type=稿件備註修改`、from / to / actor / timestamp）
- [ ] 2.3.2 ActivityLog 顯示區（印件詳情頁側欄）能呈現「稿件備註修改」事件

### 2.4 審稿備註 UI 放寬（合格 / 不合格皆可填 + 送出後可修改）

- [ ] 2.4.1 審稿人員送審元件（詳情頁）調整：`review_note` textarea 在合格模式也顯示
- [ ] 2.4.2 `review_note` 字數上限設為 1000 字、非必填；合格 / 不合格送審皆可儲存
- [ ] 2.4.3 不合格時 `reject_reason_category` LOV 選單行為維持（仍必選）
- [ ] 2.4.4 **送出後可修改**：歷史輪次 UI 對原審稿人員開放「編輯備註」動作；修改儲存時觸發 ActivityLog「審稿備註修改」事件（actor / round_no / from / to / timestamp）
- [ ] 2.4.5 **修改權限檢查**：非原審稿人員（不同 reviewer_id）嘗試修改 SHALL 被拒並提示「僅該輪原審稿人員可修改」
- [ ] 2.4.6 **補件方在線 Toast 通知**：若修改發生時補件方正停留於該印件補件頁，觸發 Toast「第 N 輪審稿備註已更新」並刷新歷史清單

### 2.5 補件頁歷史審稿備註清單

- [ ] 2.5.1 B2C 會員補件頁（EC demo）：上傳元件同頁新增「歷史審稿備註清單」區塊（最新在上；每輪顯示 round_no / result / reject_reason_category / review_note / 時間）
- [ ] 2.5.2 B2C 會員補件頁**不提供** `client_note` 編輯入口（驗證 spec 設計）
- [ ] 2.5.3 B2B 業務補件入口（`src/components/order/` 訂單詳情頁印件補件）：上傳元件同頁新增「歷史審稿備註清單」區塊
- [ ] 2.5.4 B2B 業務補件入口**不提供** `client_note` 編輯入口；若業務需修改 `client_note` 須至印件編輯介面（觸發 ActivityLog 稽核）
- [ ] 2.5.5 補件完成後，歷史清單 SHALL 繼續保留供下一輪審稿參考

### 2.6 印件層最新一筆審稿備註顯示（印件詳情頁）

- [ ] 2.6.1 印件詳情頁（印務 / 跨角色可見）新增「最新一筆審稿備註」顯示區，實作為 UI 層計算（讀 `current_round_id → review_note`）
- [ ] 2.6.2 若 `current_round_id` 為 NULL 但有不合格輪次，顯示最新一筆（按 round_no 最大）並標註結果（合格 / 不合格）
- [ ] 2.6.3 若從未建立 ReviewRound 或為免審稿且 review_note 為 NULL，顯示對應佔位文字

### 2.7 資料層同步（mock / seed / audit）

- [ ] 2.7.1 `src/types/` 與相關 factory / seed 補 `PrintItem.client_note` 欄位
- [ ] 2.7.2 `scenarioCoverage.test.ts` 或對應斷言檔案補斷言：`client_note` 於需求單建立時填入、成交轉訂單時帶入、審稿工作台可讀、補件時不可再編輯
- [ ] 2.7.3 **`client_note` 不加入 `crossLayerAssertions.ts` 的 TRACKED_PARITY_FIELDS**（erp-consultant 三視角審查結論）：因成交後為脫鉤型欄位（需求單改動不同步訂單），加入會誤報漂移
- [ ] 2.7.4 `review_note` 鎖版語意於測試補斷言：嘗試編輯既有 ReviewRound.review_note 應被拒

## 4. 驗證

- [ ] 4.1 **情境驗證 A（B2B）**：需求單建立（填 client_note）→ 成交轉訂單 → 審稿人員列表見摘要 → 詳情頁見完整 client_note → 送審不合格（填 review_note + 退件原因）→ 業務補件頁見歷史備註清單（無 client_note 編輯入口）→ 業務補件 → 審稿人員再次審稿合格（填合格 review_note）→ 印件詳情頁顯示最新一筆合格 review_note
- [ ] 4.2 **情境驗證 B（B2C）**：會員於 EC demo 上傳印件（附 client_note）→ 審稿人員列表見摘要 → 詳情頁見完整 client_note → 送審不合格 → 會員補件頁見歷史審稿備註清單（無 client_note 編輯入口）→ 會員補件 → 審稿人員合格 → 印件詳情頁顯示最新一筆
- [ ] 4.3 **邊界驗證**：
   - client_note 超過 500 字被拒、留空允許
   - review_note 超過 1000 字被拒；合格送審可填可留空
   - 不合格未選 reject_reason_category 被拒
   - 原審稿人員修改既存 review_note 觸發 ActivityLog 寫入（actor / round_no / from / to / timestamp）
   - 非原審稿人員嘗試修改 review_note 被拒
   - 修改已存在 client_note 觸發 ActivityLog 寫入
- [ ] 4.4 **Edge case 驗證**（三視角審查採納）：
   - 全不合格（current_round_id=NULL）時印件詳情頁顯示最新一筆不合格輪 review_note 並標註結果
   - 免審稿印件：client_note 可見、最新審稿備註區顯示「免審稿路徑，無審稿備註」
   - B2B 補件頁 / B2C 補件頁驗證無 client_note 編輯入口
   - 成交後修改需求單 client_note，訂單 PrintItem.client_note 不同步
   - **補件方在線 Toast 通知**：會員 / 業務停留於補件頁時，審稿人員修改最近一輪 review_note，補件頁觸發 Toast 並歷史清單刷新
   - **工單鎖檔不鎖備註**：工單已建立後，審稿修改備註，印件層顯示新版、工單檔案鎖定版本不變、工單單據備註顯示新版
- [ ] 4.5 推送 Lovable 後由 Miles 手動驗證 UI 體感是否達到 spec 要求（根據 feedback 記憶規則，本地不跑）

## 5. 歸檔前檢查

- [ ] 5.1 `openspec validate refine-prepress-review-scope` 通過
- [ ] 5.2 Prototype 推送並 Miles 驗證通過
- [ ] 5.3 `/opsx:archive` 歸檔

## 6. 歸檔後

- [ ] 6.1 `doc-audit` skill 跑跨檔案一致性檢查
- [ ] 6.2 `CLAUDE.md` § Spec 規格檔清單若需調整 prepress-review 版本號，同步更新
- [ ] 6.3 Miles 判斷是否推 Notion Spec 發布版本（依批次推送規則）
