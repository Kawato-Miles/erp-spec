## 1. Spec 審查

- [ ] 1.1 OQ 查詢已完成（2026-04-22）：無新發現，新建 [PI-012 印務掉單](https://www.notion.so/34a3886511fa81adb3bed2fd9d70e3e5)
- [ ] 1.2 三視角輕量審查（資料模型不變、UI 層功能加強，風險低）：
  - senior-pm：驗業務動線（主管看總量 / 抓異常、審稿員對帳）覆蓋
  - erp-consultant：驗 aggregate util 邊界情境（跨日、重疊區間、低樣本數）
  - ceo-reviewer：驗投入 vs ROI（Baseline 未知但主管訪談需求明確）
- [ ] 1.3 跑 `openspec validate add-prepress-operational-views --strict` 通過

## 2. Prototype 實作（`sens-erp-prototype` repo）

### 2.1 Utils（資料聚合層）
- [ ] 2.1.1 `src/utils/prepressReview.ts` 新增 `aggregateReviewStatsByReviewer(rounds, timeRange)` — 依 reviewerId 聚合件數 / 退件率 / 平均處理時間
- [ ] 2.1.2 新增 `filterPrintItemsByReviewTimeRange(items, timeRange)` — 依 ReviewRound.reviewedAt 篩印件
- [ ] 2.1.3 新增 `summarizeReviewCountsByStatus(items, timeRange)` — 計算待處理 / 合格 / 不合格筆數
- [ ] 2.1.4 新增 `getTodayOperationalMetrics(orders)` — L1 今日卡片 4 個數字的聚合
- [ ] 2.1.5 單元測試：跨日、重疊區間、低樣本數、同印件多輪的邊界情境

### 2.2 InProgressItems（審稿總覽）擴充
- [ ] 2.2.1 加時間區間篩選 UI：今日 / 本週 / 本月 / 自訂 date picker
- [ ] 2.2.2 預設時間區間為「今日」
- [ ] 2.2.3 狀態篩選擴充：加「合格」選項（原本硬篩只顯示進行中）
- [ ] 2.2.4 Summary bar UI（列表頂部）：`待處理 N｜合格 N｜不合格 N`，跟篩選連動重算
- [ ] 2.2.5 列表篩選邏輯：印件的 ReviewRound 任一 reviewedAt 落區間內
- [ ] 2.2.6 列表粒度維持印件（不改 Round 粒度）
- [ ] 2.2.7 自訂日期範圍選擇器設預設值（今日）與最大範圍提示

### 2.3 SupervisorDashboard（審稿主管工作台）擴充
- [ ] 2.3.1 頁面頂部加 L1 今日卡片（4 格，永久可見不受 Tab 影響）
  - 待派工 / 今日新進稿 / 今日合格 / 今日不合格
- [ ] 2.3.2 「審稿人員」Tab 的現有負擔表擴充為對比表（依 D8 合併而非分 Tab）：
  - 保留：審稿員姓名、派案等級、進行中件數（既有）
  - 新增：時間區間內件數、退件率、平均處理時間
  - 新增時間範圍切換控制項（今日 / 本週 / 本月）
- [ ] 2.3.3 對比表排序：退件率降冪 → 時間區間內件數降冪
- [ ] 2.3.4 處理時間 header 加 tooltip 說明「含排隊時間，僅作參考」
- [ ] 2.3.5 對比表不標示 ⚠️（純展示）

### 2.4 Mock 資料
- [ ] 2.4.1 不變動既有 mock 結構（依前四次 change 已 sync 的 Round 欄位）
- [ ] 2.4.2 視需要補 mock 資料讓對比表示範不同審稿員的表現差異（高退件率 vs 低退件率 vs 少樣本數）

## 3. UI 驗證（Lovable）

- [ ] 3.1 主管進 InProgressItems 預設看今日，Summary bar 顯示三個數字正確
- [ ] 3.2 切換時間範圍（今日 / 本週 / 本月 / 自訂）Summary bar 與列表即時重算
- [ ] 3.3 審稿員用 reviewerId=自己 + 時間區間=本週 + status=合格 列出對帳清單
- [ ] 3.4 主管進 SupervisorDashboard 頁面頂部看 L1 4 格卡片，切 Tab 不影響可見性
- [ ] 3.5 對比表依退件率降冪排序；切換時間範圍重算
- [ ] 3.6 推送 Lovable 後 Miles 手動驗證

## 4. 歸檔前檢查

- [ ] 4.1 `openspec validate add-prepress-operational-views --strict` 通過
- [ ] 4.2 Prototype 驗證通過
- [ ] 4.3 `doc-audit` 跨檔案一致性檢查
- [ ] 4.4 `/opsx:archive`

## 5. 歸檔後

- [ ] 5.1 `CLAUDE.md` § Spec 清單檢視稿件審查 spec 版本是否需更新為 v1.4
- [ ] 5.2 考慮推進 [OQ PI-012 印務工單對帳機制](https://www.notion.so/34a3886511fa81adb3bed2fd9d70e3e5) 後續 change（掉單根源）
- [ ] 5.3 考慮推進 [OQ PI-010 L2 策略檢討指標](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 後續 change（可攔截標記、客戶排行等）
