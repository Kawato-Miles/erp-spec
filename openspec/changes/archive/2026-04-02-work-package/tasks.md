## 1. 資料層準備

- [x] 1.1 新增 WorkPackage 型別定義：在 `src/types/dispatch.ts` 新增 WorkPackage 介面
- [x] 1.2 擴展 DispatchProductionTask 型別：新增 workPackageId 欄位
- [x] 1.3 建立工作包 mock data（整合至 `src/data/mockDispatch.ts`）：4 個工作包，涵蓋不同工序與師傅
- [x] 1.4 實作工作包 Key 產生邏輯：格式 WP-{工序}-{MMDD}-{流水號三碼}，確保唯一性

## 2. 日程面板建立工作包

- [x] 2.1 日程面板「分派」按鈕改為「建立工作包」
- [x] 2.2 建立工作包對話框：師傅選擇、備註、確樣需求（工作包層級）、任務清單
- [x] 2.3 實作確認邏輯：一次完成建立 WorkPackage + 設定各任務 workPackageId / assignedOperator / actualStartDate
- [x] 2.4 表單元件使用共用 ErpFormField

## 3. 生產任務列表（工作包視角）

- [x] 3.1 改用 ErpExpandableRow 兩層展開：父列=工作包，子列=生產任務
- [x] 3.2 父列顯示：Key、師傅、備註、確樣需求、任務數、進度、操作按鈕
- [x] 3.3 子列顯示：編號、製程、製作內容、製作細節、狀態、數量、進度、工單、操作
- [x] 3.4 搜尋同時比對工作包 Key / 師傅名 / 任務欄位
- [x] 3.5 未派工任務不在此頁顯示

## 4. 工作包操作

- [x] 4.1 實作「移出任務」：清除 workPackageId / assignedOperator / actualStartDate，製作中任務阻擋
- [x] 4.2 實作「移轉師傅」：對話框選擇新師傅，更新 WorkPackage + 包內所有任務
- [x] 4.3 實作「刪除工作包」：包內有製作中任務時阻擋並提示

## 5. 工作單列印

- [x] 5.1 工作包卡片新增「列印工作單」按鈕（版面細節後續定義）

## 6. 師傅頁面（我的任務）

- [x] 6.1 改用 ErpExpandableRow 工作包兩層展開（同生產任務列表風格）
- [x] 6.2 篩選改用下拉選單（未完成/已完成/全部），預設未完成

## 7. 共用元件

- [x] 7.1 建立 ErpFormField / ErpInput / ErpTextarea 共用元件，對齊 Figma 表單規格
- [x] 7.2 建立共用 WorkReportDialog（單筆+批次），生管與師傅共用
- [x] 7.3 確樣需求（sampleNotes）為工作包層級欄位

## 實作中調整紀錄

- 確樣需求從 ProductionTask 層級移至 WorkPackage 層級
- 工作包查看/管理從獨立 TaskDispatch 頁移至生產任務列表（ErpExpandableRow）
- 日程面板僅負責建立工作包，保留原有篩選/分組功能
- 日程面板移除列印功能（列印從工作包卡片觸發）
- 師傅「我的任務」頁同步改為工作包視角
- 報工對話框統一為共用元件（WorkReportDialog），支援單筆+批次
