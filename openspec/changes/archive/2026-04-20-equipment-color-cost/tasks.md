## 1. Main Spec 更新

- [x] 1.1 production-task spec：移除 A/B/C 群組欄位定義（L743-772）及 L379 的 A/B/C 引用
- [x] 1.2 production-task spec：ProductionTask Data Model 新增 6 個顏色/成本欄位
- [x] 1.3 production-task spec：新增 Requirement「設備預計成本計算」（含公式 + 7 個 Scenarios）
- [x] 1.4 production-task spec：新增 Requirement「顏色倍率自動帶入」（含 2 個 Scenarios）
- [x] 1.5 work-order spec：新增 Requirement「設備預計成本彙總」（含 3 個 Scenarios）

## 2. 驗證

- [x] 2.1 驗算公式：CMYK 800/令 x 10 令 + Pantone 倍率 2 = 8,000 + 16,000 = 24,000
- [x] 2.2 確認 A/B/C 群組所有引用已清除（grep 搜尋 material_type_a / cost_a / A 群組等關鍵字）
- [x] 2.3 確認新增欄位與既有 ProductionTask 欄位無命名衝突
- [x] 2.4 確認數量換算（張 / 500 = 令）與 Notion 數量換算規則一致

## 3. Prototype 實作

- [x] 3.1 更新 ProductionTask 型別定義，新增顏色選項與成本欄位
- [x] 3.2 更新工單詳情頁的生產任務新增/編輯表單，加入顏色選項 UI
- [x] 3.3 實作設備預計成本計算邏輯
- [x] 3.4 工單詳情頁新增「設備預計成本」彙總 Section
