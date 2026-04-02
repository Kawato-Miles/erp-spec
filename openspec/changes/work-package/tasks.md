## 1. 資料層準備

- [x] 1.1 新增 WorkPackage 型別定義：在 `src/types/dispatch.ts` 新增 WorkPackage 介面
- [x] 1.2 擴展 DispatchProductionTask 型別：新增 workPackageId、sampleNotes 欄位
- [x] 1.3 建立工作包 mock data（整合至 `src/data/mockDispatch.ts`）：4 個工作包，涵蓋不同工序與師傅
- [x] 1.4 實作工作包 Key 產生邏輯：格式 WP-{工序}-{MMDD}-{流水號三碼}，確保唯一性

## 2. 建立工作包對話框

- [x] 2.1 建立 `src/components/task-dispatch/CreateWorkPackageDialog.tsx`：取代現有 DispatchDialog，包含師傅選擇、備註輸入、任務清單、各任務確樣需求輸入
- [x] 2.2 實作表單驗證：師傅必填、確樣需求選填
- [x] 2.3 實作確認邏輯：一次完成建立 WorkPackage + 設定各任務 workPackageId / assignedOperator / sampleNotes / actualStartDate
- [x] 2.4 工序卡片「派工」按鈕改為「建立工作包」，連接新對話框

## 3. 進行中區改版

- [x] 3.1 建立 `src/components/task-dispatch/WorkPackageCard.tsx`：工作包卡片元件，顯示 Key、師傅、備註、進度摘要，支援展開/收合
- [x] 3.2 實作卡片展開後的任務明細表格：工單號、印件名稱、目標數量、確樣需求、狀態、操作按鈕
- [x] 3.3 移除原有的「依師傅分組」邏輯，進行中區改為工作包卡片平鋪
- [x] 3.4 新增進行中區搜尋欄位：支援工作包 Key、師傅名稱即時篩選

## 4. 工作包操作

- [x] 4.1 實作「移出任務」：清除 workPackageId / assignedOperator / sampleNotes / actualStartDate，任務退回待分派區；製作中任務阻擋移出
- [x] 4.2 實作「移轉師傅」：TransferOperatorDialog 對話框選擇新師傅，更新 WorkPackage + 包內所有任務
- [x] 4.3 實作「刪除工作包」：檢查包內無製作中任務後刪除，所有任務退回待分派；有製作中任務時阻擋並提示

## 5. 工作單列印

- [x] 5.1 在工作包卡片新增「列印工作單」按鈕（版面細節後續定義，本次僅建立入口）

## 6. 統計與整合

- [x] 6.1 統計摘要新增「今日工作包數」
- [ ] 6.2 端到端驗證：待分派區勾選任務 -> 建立工作包 -> 進行中區顯示卡片 -> 搜尋 -> 展開查看 -> 報工 -> 移轉 -> 刪除，全流程可操作
