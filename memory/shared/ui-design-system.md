# UI 設計系統規範

> **框架**：Ant Design 5.x
> **適用範圍**：ERP 系統所有模組介面（Prototype / Mockup / 實作規格）
> **資料來源**：尺寸管理頁面截圖（列表頁 + 編輯 Modal），2025/02

---

## 0. 介面設計通用原則

| 原則 | 說明 |
|------|------|
| **禁用 Emoji** | 介面中任何位置均不得使用 Emoji，包含按鈕文字、說明文字、提示訊息（Banner / Alert / Toast）、側欄選單、表單 Label、表格內容。圖示一律使用 Ant Design Icon 元件或 SVG，不以 Emoji 替代。 |
| **側欄模組以實際規劃為準** | 側欄僅呈現已確認開發的模組。未定模組不得以佔位名稱或 Emoji 填充。 |
| **ERP 為管理階層中台** | ERP 系統定位為 Golden Source 中台，使用者為管理層；其他角色（審稿人員、工廠師傅等）透過獨立入口（單獨 portal）登入，帶出各自所需作業，不直接進入 ERP 後台，以降低 RBAC 複雜度。 |
| **表頭已說明的語意不得在 cell 內重複** | 表頭欄名已標示語意時，cell 內容只寫資料本身，不加前綴 / 後綴重複欄名。範例：「輪次」欄 cell 只寫 `1 / 2 / 3`，不寫「第 1 輪」；「數量」欄只寫 `500`，不寫「500 張」（單位由相鄰「單位」欄承擔）；「狀態」欄只寫狀態值，不寫「狀態：合格」。目的：降低視覺噪音、提升表格密度與掃描速度。 |
| **同類 Table 視覺須全局一致** | 同一頁面 / 模組內所有資料表格共用同一套視覺（`ErpTableCard` + `.erp-table` class），不得個別加列底色、結果欄 icon、輪次徽章等裝飾。狀態差異以文字色（`text-destructive` / `text-muted-foreground`）+ 純文字 Tag 呈現即可，避免單一 Table 成為視覺異類。 |
| **檔案欄位按角色分欄 + 支援下載** | 若資料含多種角色檔案（如「印件檔」「縮圖」），Table 應按角色各自設欄，不合併為單一檔案欄。每欄內：印件檔類顯示 FileText icon + 檔名 link；圖片類顯示 thumbnail img + 下載 icon。下載以原生 `<a href={fileUrl} download>` 實作，`e.stopPropagation()` 防止觸發列點擊。對齊訂單詳情頁印件欄的既有實作。 |
| **詳情頁 title 跟著來源清單頁走** | AppLayout 的 `title`（頁面大標題）應使用「**使用者點進來的來源清單頁名稱**」，而非 sidebar 群組名稱。範例：`/print-items/:id` 來自「工單管理 > 印件總覽」，title 應為「印件總覽」；`/orders/:id` 來自「訂單管理 > 訂單列表」，title 應為「訂單列表」。breadcrumb 則完整呈現群組 > 清單 > 本頁。目的：大標題準確標示使用者當前處於哪個功能區塊，而非籠統的模組類別。 |
| **詳情頁 Tab 順序依業務流先後** | 印件 / 訂單 / 工單等詳情頁的 Tab 順序應按業務實際發生的時間先後排列，活動紀錄（ActivityLog 類全局事件彙整）永遠置於最末位作為「總覽」Tab。範例：印件詳情 Tab 序 = 審稿 → 工單 → QC → 出貨 → 活動紀錄。目的：使用者按視線由左至右掃描即可理解印件生命週期推進。 |
| **詳情頁 Header 只承載「實體名稱 + 主動作」** | `ErpPageHeader` 只放返回按鈕 + 實體名稱（印件名 / 訂單案名 / 工單名）+ 主要 Action 按鈕。**不得**在 header 放狀態 badge、難易度、客戶名、交期、關聯訂單等描述性資訊；這些一律統整於下方獨立的「基本資訊」info 區塊（`ErpDetailCard` + `ErpInfoTable`）。目的：header 留出必要呼吸空間、視覺層級明確（名稱 + 動作 vs 屬性資訊），使用者掃描時不需要在擁擠的 header 區挑資訊。 |
| **列表頁不得按狀態拆多張表** | 列表頁一律為「搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁」模式（對齊 `QuoteListPage` 需求單列表頁）。狀態差異由篩選器（`status === '首審' / '補件重審'`）與統計卡（顯示各狀態計數）表達，不得用「每個狀態一張表」的視覺切分。目的：單一表格讓排序 / 搜尋 / 跨狀態比對更直覺；多表破壞資料模型的統一性。 |
| **「當前狀態」資料 vs「歷史紀錄」資料應明確區隔** | 同一實體的「當前最新資料」（如印件目前的稿件檔案 / 縮圖）與「歷史紀錄」（如所有審稿輪次、所有異動 log）**必須用不同區塊承載**。當前資料用獨立 info 區塊（`ErpDetailCard`）放在基本資訊附近，讓使用者一眼看到「現在的狀態」；歷史紀錄放在 Tab 內以表格 / 時間軸呈現，使用者需要時再展開。目的：避免「當前」與「歷史」混雜導致誤讀，符合資料 lifecycle 的層級。範例：印件詳情頁 — 稿件檔案卡（當前最新印件檔/縮圖）+ 審稿紀錄 Tab（歷史輪次 Table）分離。 |

---

## 1. Design Tokens

### 1.1 色彩

| Token | 值 | 使用場景 |
|-------|----|---------|
| `primary` | `#1677FF` | 主要按鈕、連結、選中狀態、側欄 active 背景 |
| `primary-hover` | `#4096FF` | 主要按鈕 hover |
| `primary-text-on-dark` | `#FFFFFF` | primary 背景上的文字 |
| `danger` | `#FF4D4F` | 刪除按鈕邊框 / 文字、錯誤提示 |
| `warning` | `#FAAD14` | 警告狀態 |
| `success` | `#52C41A` | 完成狀態 |
| `text-primary` | `#000000E0`（rgba 87%）| 主要文字 |
| `text-secondary` | `#000000A6`（rgba 65%）| 次要文字、表頭、Label |
| `text-disabled` | `#00000040`（rgba 25%）| 停用文字 |
| `border` | `#D9D9D9` | 輸入框、表格、卡片邊框 |
| `bg-layout` | `#F2F2F2` | 頁面底層背景 |
| `bg-container` | `#FFFFFF` | 內容區塊背景（側欄、主區域、Modal） |
| `bg-info-banner` | `#E6F4FF` | Info 提示橫幅背景 |
| `info-icon` | `#1677FF` | Info icon 顏色 |
| `sidebar-active-bg` | `#000000` | 側欄選中項背景 |
| `sidebar-active-text` | `#FFFFFF` | 側欄選中項文字 |
| `sidebar-text` | `#636466` | 側欄未選中項文字 |

### 1.2 字型

| Token | 值 | 使用場景 |
|-------|----|---------|
| `font-family-base` | `"Noto Sans TC", -apple-system, "Segoe UI", sans-serif` | 全域預設字體（Google Noto Sans TC） |
| `font-size-base` | `14px` | 主要內文、表格內容、輸入框 |
| `font-size-sm` | `12px` | 輔助說明、badge、breadcrumb |
| `font-size-lg` | `16px` | 頁面標題（H1） |
| `font-size-xl` | `20px` | Modal 標題 |
| `font-weight-regular` | `400` | 一般內文、表格內容 |
| `font-weight-medium` | `500` | 表格欄位標頭、Label |
| `font-weight-semibold` | `600` | 頁面標題 |
| `font-weight-bold` | `700` | 表格標題 |
| `line-height-base` | `22px` | 搭配 14px 使用 |

**表格特定規範**：
- **表格標題（`<thead>`）**：14px / weight 700 / color #232324
- **表格內容（`<tbody>`）**：14px / weight 400 / color #232324

### 1.3 間距（Spacing）

| Token | 值 | 使用場景 |
|-------|----|---------|
| `space-xs` | `4px` | 元素內部緊湊間距 |
| `space-sm` | `8px` | 表單欄位間、按鈕群組間距 |
| `space-md` | `16px` | Section 內部 padding、表單行間距 |
| `space-lg` | `24px` | 頁面 padding、Section 間距 |
| `space-xl` | `32px` | 大區塊間距 |

### 1.4 圓角（Border Radius）

| Token | 值 | 使用場景 |
|-------|----|---------|
| `radius-sm` | `4px` | Tag、Badge |
| `radius-base` | `6px` | 輸入框、按鈕 |
| `radius-lg` | `8px` | Modal、Card、Dropdown |
| `radius-full` | `100px` | Pill 形狀元件 |

### 1.5 陰影（Shadow）

| Token | 值 | 使用場景 |
|-------|----|---------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | 卡片 |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.15)` | Dropdown、Popover |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modal、Drawer |

---

## 2. 版面結構（Layout）

### 2.1 整體佈局

```
┌─────────────────────────────────────────────┐
│  TopBar（選填，目前截圖無頂部 bar）             │
├──────────┬──────────────────────────────────┤
│          │  Breadcrumb（麵包屑）              │
│  Sidebar │  Page Title                       │
│  200px   │  ─────────────────────────────── │
│          │  Content Area（工具列 + 主內容）    │
└──────────┴──────────────────────────────────┘
```

### 2.2 Sidebar

| 屬性 | 規格 |
|------|------|
| 寬度 | `200px`（展開），`80px`（收合） |
| 背景 | `#FFFFFF` |
| 分組標題 | `12px`，`text-secondary`，全大寫 |
| 選單項高度 | `40px` |
| 選中狀態 | 背景 `#000000`，文字 `#FFFFFF`，圓角 `6px`（左右各縮 4px） |
| Hover 狀態 | 背景 `rgba(0,0,0,0.04)` |
| Icon 尺寸 | `16px`，與文字間距 `10px` |

### 2.3 內容區

| 屬性 | 規格 |
|------|------|
| 頂部 padding | `24px` |
| 左右 padding | `24px` |
| Breadcrumb 到 Title 間距 | `4px` |
| Title 到內容間距 | `16px` |
| 背景 | `#FFFFFF`（內容 Card）或 `#F5F5F5`（頁面底層） |

---

## 3. 元件規格

### 3.1 Page Header（頁面標題區）

```
[Breadcrumb]：訂單管理 > 尺寸管理       字級 12px，text-secondary
[Page Title]：尺寸管理                  字級 20px，font-weight 600，text-primary
```

- Breadcrumb 分隔符：`>`，間距 `8px`
- 頁面標題與操作區工具列使用 `space-lg (24px)` 分隔

### 3.2 Info Banner（說明橫幅）

| 屬性 | 規格 |
|------|------|
| 背景 | `#E6F4FF` |
| 左側 border | `3px solid #1677FF` |
| Icon | `ℹ️`（AntD `InfoCircleOutlined`），`14px`，`#1677FF` |
| 文字 | `14px`，`text-primary` |
| 內距 | `12px 16px` |
| 圓角 | `6px` |
| 與下方工具列間距 | `16px` |

### 3.3 工具列（Toolbar）

佈局：左側篩選區 ＋ 右側操作按鈕

```
[篩選] [Select...] [Select...]            [刷新] [+ 新增 XX]
 ← 左對齊                                  右對齊 →
```

| 元件 | 規格 |
|------|------|
| 篩選 Label | `「篩選」` + `FilterOutlined` icon，`14px`，`text-secondary` |
| Select 下拉 | 寬度 `160px`，預設顯示 placeholder（灰色） |
| 刷新按鈕 | Default 樣式（白底灰框），`ReloadOutlined` icon + 文字「刷新」 |
| 新增按鈕 | Primary 樣式（`#1677FF`），`PlusOutlined` icon + `+ 新增 XX` |
| 按鈕間距 | `8px` |
| 工具列與表格間距 | `16px` |

### 3.4 Table（資料表格）

遵循 Ant Design Table 預設規格，以下為客製點：

| 屬性 | 規格 |
|------|------|
| 表頭背景 | `#FAFAFA` |
| 表頭字體 | `14px`，`font-weight 500`，`text-primary` |
| 列高 | `54px` |
| 分隔線顏色 | `#F0F0F0` |
| Hover 列 | 背景 `#FAFAFA` |
| 操作欄對齊 | 右對齊（`align: 'right'`）|
| 操作欄按鈕間距 | `8px` |

**操作按鈕（行內）**：

| 按鈕 | 樣式 | 規格 |
|------|------|------|
| 編輯 | `default` outline | `EditOutlined` icon，灰色邊框 |
| 刪除 | `danger` outline | `DeleteOutlined` icon，紅色邊框 / 文字（`#FF4D4F`） |

> 若有更多操作（3個以上），最後一項改用 `⋯` Dropdown，避免溢出。

**空資料狀態**：
- Icon：`InboxOutlined`，`48px`，`#00000040`
- 文字：`暫無資料`，`14px`，`text-secondary`

**分頁（Pagination）**：
- 位置：表格右下，`margin-top: 16px`
- 每頁顯示：預設 20 筆，可選 10 / 20 / 50
- 規格：`showSizeChanger: true`，`showTotal: true`（顯示「共 XX 筆」）

### 3.5 Modal / Drawer（表單彈窗）

**版型選擇原則**：
- 欄位 ≤ 8 個、操作簡單 → **Modal**（居中）
- 欄位 > 8 個、需展示詳情 → **Drawer**（右側滑出，寬 `520px`）

**Modal 規格**：

| 屬性 | 規格 |
|------|------|
| 寬度 | `480px`（小）/ `600px`（標準）/ `800px`（大） |
| 標題 | `18px`，`font-weight 600`，左對齊 |
| 關閉按鈕 | 右上角 `×`（`CloseOutlined`） |
| Header 底邊 | `1px solid #F0F0F0` |
| Footer | 右對齊：`取消`（default）+ `確認`（primary）|
| Footer 按鈕間距 | `8px` |
| 內距 | `24px` |
| 遮罩 | `rgba(0,0,0,0.45)` |

**Drawer 規格**：

| 屬性 | 規格 |
|------|------|
| 寬度 | `520px` |
| 位置 | 右側滑出 |
| 標題 | 同 Modal |
| Footer | 固定在底部，右對齊：`取消` + `確認` |

### 3.6 Form（表單）

| 屬性 | 規格 |
|------|------|
| 佈局 | `layout="vertical"`（Label 在上）|
| Label 字體 | `14px`，`font-weight 500`，`text-primary` |
| 必填標記 | 紅色 `*`，顯示在 Label 前方 |
| Input 高度 | `32px` |
| Textarea 高度 | `80px`（預設，可調整 `autoSize`） |
| Label 與 Input 間距 | `8px`（`gap: 8px`）|
| Form Item 之間間距 | `16px`（`Form.Item` margin-bottom）|
| 多欄位表單 | `grid: 2 columns`，欄位間距 `16px` |
| 錯誤文字 | `12px`，`#FF4D4F`，顯示在欄位下方 |
| 說明文字 | `12px`，`text-secondary`，顯示在欄位下方 |

**多維度輸入（如尺寸 長×寬×高）**：

```
[長度 Input] × [寬度 Input] × [高度 Input]  單位（mm）
```

- Input 寬度等分（`flex: 1`）
- `×` 分隔符：`12px`，`text-secondary`，水平居中對齊
- 單位 Label：`14px`，`text-secondary`，左邊距 `8px`

**Segmented Control（切換類型，如 一維/二維/三維）**：

| 屬性 | 規格 |
|------|------|
| 元件 | AntD `Segmented` |
| 選中 | 白色背景 + `#1677FF` 文字 + subtle shadow |
| 未選中 | 透明背景，`text-secondary` |
| 圓角 | `6px` |

### 3.7 Button（按鈕）

| 類型 | 使用場景 | 樣式 |
|------|---------|------|
| `primary` | 主要 CTA（新增、確認、儲存）| 藍底白字 `#1677FF` |
| `default` | 次要操作（刷新、取消、搜尋）| 白底灰框 |
| `danger` | 危險操作（刪除）| 紅框紅字（outline）或紅底白字（filled，二次確認用）|
| `text` | 低優先操作（快速連結）| 無背景無框 |
| `link` | 跳頁連結 | 藍色文字，無框 |

| 屬性 | 規格 |
|------|------|
| 高度（預設） | `32px` |
| 高度（small） | `24px`（表格行內操作） |
| 高度（large） | `40px`（頁面主要 CTA） |
| 圓角 | `6px` |
| Icon 與文字間距 | `8px` |

### 3.8 Tag / Badge（狀態標籤）

用於顯示狀態（如需求單狀態、工單狀態）：

| 狀態類型 | 顏色 | AntD preset |
|---------|------|------------|
| 草稿 / 待處理 | 灰色 `#D9D9D9` + 深字 | `default` |
| 進行中 / 審核中 | 藍色 `#1677FF` | `processing` |
| 完成 / 通過 | 綠色 `#52C41A` | `success` |
| 警告 / 待確認 | 橘色 `#FAAD14` | `warning` |
| 失敗 / 拒絕 / 取消 | 紅色 `#FF4D4F` | `error` |

> 狀態文字保持一致：每個狀態機的中文標籤對照詳見 `memory/erp/glossary.md`

---

## 4. 互動規範

### 4.1 表單提交流程

```
填寫表單 → 點「確認」→ 前端驗證
  ├─ 驗證失敗 → 欄位下方顯示紅色錯誤訊息，不關閉 Modal
  └─ 驗證通過 → API 呼叫
       ├─ 成功 → 關閉 Modal → 表格重新整理 → 顯示 success Message（頂部）
       └─ 失敗 → 保持 Modal 開啟 → 顯示 error Message（頂部）或 Modal 內行內錯誤
```

### 4.2 刪除確認流程

```
點「刪除」→ AntD Popconfirm 彈出確認（「確定刪除？」）
  ├─ 確認 → API 呼叫 → 成功顯示 Message → 重整列表
  └─ 取消 → 關閉 Popconfirm，不執行操作
```

> ⚠️ **禁止直接刪除**，所有刪除操作必須有 Popconfirm 二次確認。

### 4.3 全域 Message 規格

使用 AntD `message` API（頂部 Toast）：

| 類型 | 使用場景 | 持續時間 |
|------|---------|---------|
| `message.success` | 新增 / 編輯 / 刪除成功 | 2 秒 |
| `message.error` | API 失敗、系統錯誤 | 3 秒 |
| `message.warning` | 操作提醒（非錯誤）| 2.5 秒 |
| `message.loading` | 提交中、載入中（搭配 async）| 持續到操作結束 |

### 4.4 Loading 狀態

| 場景 | 處理方式 |
|------|---------|
| 表格初次載入 | `Table` 的 `loading` prop = true |
| 表格重整 | 同上 |
| 按鈕提交中 | Button `loading` prop = true，禁止重複點擊 |
| 全頁載入 | AntD `Spin`，使用 `tip="載入中..."` |

---

## 5. 頁面模板

### 5.1 標準列表頁（List Page）

適用：所有管理列表（尺寸管理、客戶管理、材料管理等）

```
Page Header
  ├─ Breadcrumb
  └─ Title

[Info Banner]（選填）

Toolbar
  ├─ 左側：篩選 + Select 篩選器
  └─ 右側：刷新按鈕 + 新增按鈕

Table
  ├─ 欄位（依模組定義）
  ├─ 最右欄：操作（編輯 + 刪除）
  └─ 底部：Pagination
```

### 5.2 表單 Modal（Form Modal）

適用：新增 / 編輯資料（欄位 ≤ 8 個）

```
Modal Header：[標題]                    [×]

Form Body：
  欄位 1 Label *
  [Input]

  欄位 2 Label
  [Select]

  ...

Modal Footer：                 [取消] [確認]
```

### 5.3 詳情 Drawer（Detail Drawer）

適用：需求單、工單等需查看大量資訊的詳情頁

```
Drawer（從右側滑出，寬 520px）
  Header：[標題]                         [×]

  Descriptions（描述列表）：
    欄位 1：值
    欄位 2：值
    ...

  Divider

  子資料 Table（若有關聯資料）

  Footer：                      [關閉] [編輯]
```

---

## 6. 版本記錄

| 日期 | 變更 | 來源 |
|------|------|------|
| 2026/03/02 | 統一字體為 Google Noto Sans TC；補充表格字體規範（標題 14px/700、內容 14px/400，顏色均 #232324）| Prototype v4.3 標準化 |
| 2026/03/02 | 更新佈局色系：頁面背景 `#F5F5F5` → `#F2F2F2`；側欄選中 `#1677FF` → `#000000`；新增側欄文字色 `#636466` | 中台基本頁面設計參考 |
| 2026/03/02 | 補充 Form Item 細節規範：Label 與 Input 間距 `8px`；多欄位表單 grid 間距 `16px` | Prototype 優化驗證（prototype-quote-request.html v1.1） |
| 2025/02 | 初版建立，基於尺寸管理截圖萃取 | Miles 提供截圖 |
