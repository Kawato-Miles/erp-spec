# 審稿模組搬移 erp repo prototype 設計文件

- 日期：2026-07-06
- 狀態：已核可（Miles 2026-07-06 拍板）
- 來源側：`/Users/b-f-03-029/sens-erp-prototype`（React + TypeScript + shadcn/ui）
- 目標側：`/Users/b-f-03-029/erp`（Next.js 15 + antd 5 + JavaScript）`apps/erp/src/app/(prototype)/`
- 依據規範：erp repo `.claude/skills/prototype-from-prompt/SKILL.md`（前端主管撰寫）、`docs/recipes/`、`docs/component-catalog.md`、`Designs.md` §6.5／§6.6、`apps/erp/src/app/(prototype)/README.md`

## 一、背景與目的

prototype 陸續從 sens-erp-prototype 搬移到 erp repo，目的：

1. PM 後續用統一的 design system 建置 prototype
2. prototype 完成後前端可直接串接，不需重做畫面切版
3. 取代 Lovable prototype（框架不同、前端無法直接串接）

兩側框架完全不同，程式碼無法直接搬移；本次工作性質是「以 sens-erp-prototype 既有審稿商業邏輯為需求正本，在 erp repo 依 skill 規範重做」。

## 二、範圍（Miles 拍板）

### 納入

| 項目 | 來源側對應 |
|------|-----------|
| 待審訂單列表 | `/prepress/by-order`（`OrderReviewView` mode="all"） |
| 待分派審稿列表 | `/prepress/pending-assign`（`OrderReviewView` mode="pendingAssign"） |
| 審稿詳情頁 | `/prepress/inbox/:id`（`ReviewerDetail`） |
| 訂單端掛載點 | 訂單詳情頁的上傳稿件、補件、審稿討論串、印件審稿狀態欄 |

### 不納入

- **審稿總覽（主管儀表板）**：含 KPI 七項指標，依既有決策「ERP 核心流程完成前不做 dashboard 類功能」排除
- **合格後建工單**：狀態只推進到「已確認可製作」（終態）為止，不建工單（erp repo 無工單 prototype）
- **免審稿、售後補印的觸發流程**：只以 mock 資料呈現既成結果（輪次時間軸上看得到來源標記），不做觸發互動

### 邏輯忠實度

範圍內 1:1 重現：狀態機、自動分派演算法、審稿輪次模型、批次審稿、分派／改派。跨出範圍的流程斷在邊界。

## 三、模組結構（方案 A：獨立模組，單向依賴 orders）

```
(prototype)/prepress-review/
  page.js                    待審訂單列表
  pending-assign/page.js     待分派審稿列表
  detail/page.js             審稿詳情（?id=印件編號，比照 orders/detail 模式）
  _components/               兩列表共用的列表元件、各對話框
  _lib/
    review-logic.js          純函式：狀態機轉換、自動分派演算法、輪次編號
    permissions.js           純函式：角色權限判斷
    store.js                 zustand store：審稿互動 action
    mock-reviewers.js        審稿人員名冊、退件原因 LOV
```

- 訂單／印件資料正本留在 `(prototype)/orders/`（mock-data.js 與 orders store），審稿模組單向依賴 orders 模組。
- 依賴理由：審稿資料掛在印件上，單一資料真相才能驗證「訂單頁上傳稿件 → 審稿列表看到自動分派結果」的跨頁互動；且依賴方向與正式系統一致（審稿 API 依附訂單資料）。
- 被否決方案：B（審稿併入 orders 當子路由）— orders 模組過度膨脹、審稿是獨立選單模組難拆分交付；C（審稿自帶資料複本）— 兩份 mock 互不同步，掛載點互動驗證失真。
- **skill 規範空白**：`prototype-from-prompt` skill 只規範「模組 → 腳手架」單向依賴，未規範「模組 → 模組」。本次建立 prepress-review → orders 依賴屬規範外先例，待回饋前端主管補規範（見第九節）。

## 四、角色模擬擴充（腳手架層改動）

腳手架 `(prototype)/_lib/sessionStore.js` 現有五角色（業務、業務主管、諮詢、會計、主管），新增三個審稿相關角色（中文標籤與 sens-erp-prototype 一致）：

| 角色代號 | 中文標籤 | 權責 |
|---------|---------|------|
| `reviewer` | 審稿人員 | 看自己負責的待審印件、完成審核、批次審稿 |
| `order_manager` | 訂單管理人 | 看全部、分派／改派審稿人員；不能代替完成審核 |
| `reviewer_supervisor` | 審稿主管 | 同訂單管理人 |

側邊選單（腳手架 `layout.js` 的 mock 選單）加「審稿管理」群組：待審訂單、待分派審稿兩項。選單可見性比照來源側：待審訂單三個角色皆可見；待分派審稿僅訂單管理人可見（審稿主管的分派入口在列表與詳情頁的操作按鈕，非獨立選單項）。

## 五、資料層

### mock 欄位命名慣例（Miles 拍板）

跟隨 orders 模組既有慣例：**狀態枚舉與中文標籤逐字取自 sens-erp-prototype（需求唯一事實來源）；欄位命名用 snake_case（貼近後端 schema）**。例：`reviewDimensionStatus` → `review_dimension_status`、`assignedReviewerId` → `assigned_reviewer_id`。

### orders/mock-data.js 擴充（動既有檔）

印件擴充審稿欄位：`difficulty_level`（難易度 1-10）、`assigned_reviewer_id`、`review_dimension_status`、`review_rounds[]`（審稿輪次）、`review_activity_logs[]`（活動紀錄）、`skip_review`（免審稿）、`review_files[]`（稿件檔案，含檔案角色：印件檔／審稿後檔案／縮圖）、`client_note`。

審稿狀態枚舉由現有 5 態補齊為完整狀態機 8 態（逐字沿用來源側）：

- 主線：待分派 → 稿件未上傳 → 等待審稿 → 合格 → 已確認可製作（終態）
- 分支：不合格 ↔ 已補件、待改稿

### 審稿輪次（review_round）欄位

沿用來源側 `ReviewRound` 型別轉 snake_case：`id`、`print_item_id`、`round_no`（遞增）、`source`（審稿／免審稿／售後補印）、`source_print_item_id`、`submitted_at`／`submitted_by`／`submitted_note`（送審端，備註上限 500 字）、`reviewer_id`、`reviewed_at`、`result`（合格／不合格／null）、`reject_reason_category`（退件原因 LOV 10 項）、`review_note`（上限 1000 字）。

### 審稿專屬 mock（`prepress-review/_lib/mock-reviewers.js`）

審稿人員名冊：`id`、`name`、`max_difficulty_level`（能力等級 1-10）、`available_status`（在崗／不在崗）、`active`。退件原因 LOV 10 項逐字沿用來源側 `REJECT_REASON_CATEGORIES`。

mock 資料一律用真實業務格式（訂單編號、人名、日期），不用 placeholder（既有偏好）。

## 六、商業邏輯層（`prepress-review/_lib/`）

### review-logic.js（純函式，handoff 原樣保留）

- 狀態機轉換規則：對應來源側 `canTransitionReviewStatus`／`nextReviewStatuses`／`isReviewTerminalStatus`
- 自動分派演算法：對應來源側 `runAutoAssign`——能力最接近（難易度 ≤ 能力上限中取最接近者）→ 負載最少 → 平手裁決；無人能力足夠時破例派工（活動紀錄標記）
- 輪次編號：`nextRoundNo`（同印件遞增）
- 免審稿輪次資料建構：對應 `buildSkipReviewRound`（僅供 mock seed 使用，不做觸發流程）

實作時逐函式對照來源側 `src/utils/prepressReview.ts`（1347 行）中屬於本次範圍的部分，不重新發明；範圍外函式（KPI 計算、建工單規劃）不搬。

### permissions.js（純函式）

比照 orders 模組 permissions.js 寫法：審稿人員本人才可完成審核／批次審稿（限自己負責且等待審稿的印件）；訂單管理人與審稿主管可分派／改派、不可完成審核。

### store.js（zustand，action 對齊未來 API 動詞）

`submitReview`（完成審核）、`submitBatchReview`（批次審稿）、`assignReviewer`／`overrideAssignment`（分派／改派）、`uploadArtwork`（上傳稿件並觸發自動分派）、`startResupply`（補件重審）、`confirmProducible`（確認可製作）。訂單／印件資料異動透過 orders store 進行；審稿專屬狀態（審稿人員名冊）在本 store。handoff 時 action 逐顆換 React Query mutation。

## 七、頁面設計（套 recipe、只用真元件）

### 待審訂單／待分派審稿列表（套 resource-page recipe）

- 篩選卡（`FilterBlock`）＋表格（`TableBlock`）＋分頁；antd Table 原生 expandable 做「訂單母列 → 印件子列」兩層
- 母集合：審稿段未完結的訂單（任一非棄用印件未達「已確認可製作」）；待分派模式再過濾「任一非棄用印件為待分派（非免審）」
- 欄位：訂單編號（連往訂單詳情）、案名、客戶、訂單狀態、印件名稱與類型、難易度、審稿狀態（`StyledTag`）、距交期天數；逾期篩選＋關鍵字搜尋（單一搜尋框，placeholder 列條件）
- 操作：勾選印件後「批次審稿」（審稿人員，`PanelDialog`）／「分派審稿人員」（管理角色）；單件「去審」進詳情

### 審稿詳情頁（套 detail-page recipe）

- `SectionHeader` 分段＋`BorderBlock`＋`ReadOnlyField`：基本資訊、規格、稿件檔案、審稿狀態進度（antd Steps）、審稿輪次時間軸（antd Timeline：每輪送審備註、審核結果、退件原因）、活動紀錄
- 操作：「完成審核」對話框（合格／不合格＋退件原因下拉＋備註）、「分派審稿人員」對話框（`PrimaryActionButton` 置於頁首 extra）

### orders 詳情頁掛載點（動既有檔）

- 各印件顯示審稿狀態欄
- 上傳稿件：真實檔案選擇器（`input type=file` + `createObjectURL`，既有偏好），上傳後觸發自動分派、畫面可見分派結果
- 待補件時可補件（開新輪次）
- 開啟審稿討論串（mock 連結）

### 元件紀律

一律 import `docs/component-catalog.md` 目錄內真元件（`PanelDialog`、`StyledTag`、`SectionHeader`、`BorderBlock`、`ReadOnlyField`、`GenericFormDrawer`、`PrimaryActionButton` 等），目錄沒有的用 antd 原生＋token；禁自創 UI、禁手寫色碼與像素值。頁面只寫內容，不自加外框與內距（`DashboardShell` 腳手架提供）。

## 八、驗證方式

`pnpm dev:erp` 起本地伺服器，用瀏覽器工具走完主流程並截圖存證：

1. 業務角色在訂單詳情上傳稿件 → 印件審稿狀態變「等待審稿」、活動紀錄出現自動分派結果（分派給能力相符且負載最少者）
2. 切角色到審稿人員 → 待審訂單列表看到該印件 → 進詳情完成審核（不合格＋退件原因）→ 狀態變「不合格」
3. 切回業務補件 → 狀態變「已補件」、開新輪次（輪次編號遞增）
4. 審稿人員再審合格 → 確認可製作 → 狀態達「已確認可製作」終態
5. 批次審稿：勾選多件一次合格
6. 管理角色（訂單管理人）：待分派清單過濾正確、改派後負責人變更且活動紀錄留痕
7. 逾期篩選、關鍵字搜尋

實作計畫階段展開為逐項檢核表（含具體操作與成功條件）。

## 九、分支與交付

- erp repo 開新分支（`prototype/prepress-review`）作業，完成後依 `.github/PULL_REQUEST_TEMPLATE.md` 發 PR，由前端主管 review 合併 main
- PR 備註附：(1) 模組間依賴說明（prepress-review → orders；handoff 時 orders 需先行或一起搬）；(2) 腳手架層改動清單（sessionStore 加三角色、layout 選單加審稿群組）
- 本設計文件放 Sens repo（PM 工作區），不進 erp repo 的 PR

### 待回饋前端主管

1. skill 未規範「模組 → 模組」依賴；本次建立 prepress-review → orders 先例，建議在 skill／`(prototype)/README.md` 補規範
2. 腳手架 sessionStore 為跨模組共用檔，多模組並行開發時的角色新增慣例（本次直接加三角色）

## 十、來源側參照清單（實作時對照）

| 內容 | 來源檔 |
|------|-------|
| 型別與狀態機 | `src/types/prepressReview.ts`、`src/types/order.ts`（印件審稿欄位） |
| 純函式邏輯 | `src/utils/prepressReview.ts`（含單元測試 `prepressReview.test.ts`） |
| store action | `src/store/useErpStore.ts`（審稿相關 action） |
| 列表頁 | `src/pages/prepress/OrderReviewView.tsx` |
| 詳情頁 | `src/pages/prepress/ReviewerDetail.tsx` |
| 訂單端掛載點 | `src/pages/OrderDetail.tsx`（UploadArtworkDialog、ResupplyDialog、openReviewDiscussion） |
| 審稿元件 | `src/components/prepress-review/`（對話框與展示元件，UI 重做、互動語意沿用） |
| 審稿人員 mock | `src/data/mockPrepressReview.ts`、seed：`src/store/seedData.ts` |
| e2e 情境參考 | `e2e/prepress-review.spec.ts`、`prepress-order-review-view.spec.ts` 等 |
