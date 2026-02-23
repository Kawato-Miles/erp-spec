# 數量換算計算規則

> **用途**：Prototype 設計與測試時的參考標準
> **根據**：business-process.md §4、data-model.md v0.7 修訂
> **狀態**：✅ 初版完成
> **最後更新**：2026-02-23

---

## 一、核心概念

### 1.1 層級關係

```
PrintItem（印件）
  ├─ 代表：單一商品的邏輯單位
  ├─ 例：1 本書、1 套明信片
  └─ 倍數關係：quantity_per_print_item

      ↓

WorkOrder（工單）
  ├─ 代表：一次生產流程
  ├─ 例：1 次印刷製程
  └─ 倍數關係：各 ProductionTask 自定

      ↓

Task（任務）
  ├─ 代表：按工廠分組的工序組合
  ├─ 例：自有廠的正背面印刷任務
  └─ 職責：組織生產任務（不涉及倍數）

      ↓

ProductionTask（生產任務）
  ├─ 代表：最小生產單位（含工序）
  ├─ 例：正面印刷、背面印刷、上光
  ├─ 倍數關係：quantity_per_work_order
  └─ 過濾條件：affects_product
```

### 1.2 關鍵欄位

| 欄位 | 層級 | 定義 | 範例 |
|------|------|------|------|
| `quantity_per_print_item` | WorkOrder | 完成 1 份印件需要多少份此工單 | 1000、0.5 |
| `quantity_per_work_order` | ProductionTask | 完成 1 份工單需要多少份此生產任務 | 1、2、0.5 |
| `affects_product` | ProductionTask | 該生產任務的 QC 通過數是否計入工單完成度 | TRUE / FALSE |

---

## 二、計算流程（精確定義）

### 2.1 層級 1：生產任務層（ProductionTask）

**輸入**：
- `ProductionTask.completed_quantity`（報工累計）

**計算**：
- 無聚合，直接使用

**輸出**：
```
pt_completed = ProductionTask.completed_quantity
```

---

### 2.2 層級 2：任務層聚合（Task）

**輸入**：
- 該任務下所有 ProductionTask 的 completed_quantity
- 各 ProductionTask 的 affects_product、quantity_per_work_order

**計算**：
```
1. 篩選：取「affects_product = TRUE」的生產任務
   affected_pts = filter(task.production_tasks where affects_product = TRUE)

2. 若篩選後無結果：
   ERROR("該任務未勾選任何生產任務為影響成品")
   return NULL

3. 按各生產任務計算倍數：
   for each pt in affected_pts:
     pt_completion_ratio = floor(pt.completed_quantity ÷ pt.quantity_per_work_order)

   completion_ratios = [pt_completion_ratio, pt_completion_ratio, ...]

4. 取最小值（木桶理論）：
   task_completion = min(completion_ratios)
```

**輸出**：
```
task_completion = min( floor(PT-A完成 ÷ PT-A倍數), floor(PT-B完成 ÷ PT-B倍數), ... )
```

**例**：
```
Task-1 內有 PT-A（倍數 2）、PT-B（倍數 1）
PT-A 完成 2000 → floor(2000 ÷ 2) = 1000
PT-B 完成 2000 → floor(2000 ÷ 1) = 2000
task_completion = min(1000, 2000) = 1000
```

---

### 2.3 層級 3：工單層聚合（WorkOrder）

**輸入**：
- 該工單下所有 Task 的 completion（來自層級 2）

**計算**：
```
1. 聚合該工單內所有任務的完成倍數：
   for each task in workorder.tasks:
     task_completions = [task_completion, task_completion, ...]

2. 取最小值（木桶理論）：
   wo_completion = min(task_completions)
```

**輸出**：
```
wo_completion = min(task-1完成, task-2完成, ...)
```

**例**：
```
WO-001 內有 Task-1、Task-2
Task-1 完成 1000
Task-2 完成 500
wo_completion = min(1000, 500) = 500
```

---

### 2.4 層級 4：印件層聚合（PrintItem）

**輸入**：
- 該印件下所有 WorkOrder 的 completion（來自層級 3）
- 各 WorkOrder 的 quantity_per_print_item

**計算**：
```
1. 按各工單計算倍數：
   for each wo in print_item.work_orders:
     wo_completion_ratio = floor(wo_completion ÷ wo.quantity_per_print_item)

   pi_ratios = [wo_completion_ratio, wo_completion_ratio, ...]

2. 取最小值（木桶理論）：
   pi_completion = min(pi_ratios)

3. 判定成品完成：
   if pi_completion >= print_item.target_quantity:
     print_item.status = '製作完成'
     trigger bubble-up to Order
```

**輸出**：
```
pi_completion = min( floor(WO-1完成 ÷ WO-1倍數), floor(WO-2完成 ÷ WO-2倍數), ... )
```

**例**：
```
PI-001 內有 WO-001、WO-002
WO-001 完成 1000，倍數 500 → floor(1000 ÷ 500) = 2
WO-002 完成 500，倍數 500 → floor(500 ÷ 500) = 1
pi_completion = min(2, 1) = 1
→ 完成 1 份印件
```

---

## 三、應用場景與驗算

### 3.1 場景 A：簡單 1:1:1（單一路徑）

```
訂單
└─ 印件 PI-001（target: 100）
    └─ 工單 WO-001
        ├─ quantity_per_print_item = 100
        └─ 任務 Task-1
            └─ PT-A
                ├─ quantity_per_work_order = 1
                ├─ affects_product = TRUE
                └─ completed_quantity = 100
```

**計算**：
```
層級 1：pt_completed = 100
層級 2：task_completion = floor(100 ÷ 1) = 100
層級 3：wo_completion = 100
層級 4：pi_completion = floor(100 ÷ 100) = 1

結果：✅ 完成 1 份印件
```

---

### 3.2 場景 B：複合任務（多生產任務，各自倍數）

```
訂單
└─ 印件 PI-002（target: 1）
    └─ 工單 WO-002
        ├─ quantity_per_print_item = 2000
        └─ 任務 Task-1
            ├─ PT-A（正面印刷）
            │   ├─ quantity_per_work_order = 2 ← 各自定義
            │   └─ completed_quantity = 4000
            └─ PT-B（背面印刷）
                ├─ quantity_per_work_order = 1 ← 各自定義
                └─ completed_quantity = 2000
```

**計算**：
```
層級 1：無聚合
層級 2：
  PT-A 完成倍數 = floor(4000 ÷ 2) = 2000
  PT-B 完成倍數 = floor(2000 ÷ 1) = 2000
  task_completion = min(2000, 2000) = 2000

層級 3：wo_completion = 2000
層級 4：pi_completion = floor(2000 ÷ 2000) = 1

結果：✅ 完成 1 份印件
```

---

### 3.3 場景 C：多工單（一印件多製程）

```
訂單
└─ 印件 PI-003（target: 1）
    ├─ 工單 WO-A（印刷製程）
    │   ├─ quantity_per_print_item = 200
    │   └─ 任務 Task-A1
    │       ├─ PT-A1a（正面印刷）
    │       │   ├─ quantity_per_work_order = 1
    │       │   └─ completed_quantity = 200
    │       └─ PT-A1b（背面印刷）
    │           ├─ quantity_per_work_order = 1
    │           └─ completed_quantity = 200
    │
    └─ 工單 WO-B（後加工製程）
        ├─ quantity_per_print_item = 200
        ├─ 任務 Task-B1（上光）
        │   └─ PT-B1
        │       ├─ quantity_per_work_order = 1
        │       └─ completed_quantity = 200
        └─ 任務 Task-B2（裁切）
            └─ PT-B2
                ├─ quantity_per_work_order = 1
                └─ completed_quantity = 200
```

**計算**：
```
【工單 WO-A】
層級 2：
  Task-A1 = min(floor(200÷1), floor(200÷1)) = 200
層級 3：
  wo_A_completion = 200

【工單 WO-B】
層級 2：
  Task-B1 = 200
  Task-B2 = 200
層級 3：
  wo_B_completion = min(200, 200) = 200

【印件 PI-003】
層級 4：
  WO-A 倍數 = floor(200 ÷ 200) = 1
  WO-B 倍數 = floor(200 ÷ 200) = 1
  pi_completion = min(1, 1) = 1

結果：✅ 完成 1 份印件
```

---

## 四、邊界情況與防呆規則

### 4.1 missing affects_product

**情況**：任務中所有生產任務的 `affects_product = FALSE`

**防呆**：
```
if affected_pts.length == 0:
  系統訊息："該任務未勾選任何生產任務為影響成品，工單完成數將無法計算"
  return ERROR
```

**建議的 UI**：
- 工單建立時強制檢查
- 至少 1 個生產任務的 affects_product 須為 TRUE

---

### 4.2 quantity_per_work_order 範圍

**合理範圍**：
- 最小：0.001（支持極小倍數，如 1000 份產品才完成 1 份工單）
- 最大：無上限（但應有業務合理性檢查）

**防呆驗證**：
```
if quantity_per_work_order <= 0:
  ERROR("倍數必須 > 0")

if quantity_per_work_order > 10000:  // 業務警告閾值（可調整）
  WARN("倍數超過 10000，請確認設定正確")
```

---

### 4.3 計算結果為 0 或 floor 損失

**情況**：layer 4 的 pi_completion = 0

**原因**：某工單的完成數小於倍數，無法湊成 1 份印件

**示例**：
```
WO-001 完成 500，倍數 1000
→ floor(500 ÷ 1000) = floor(0.5) = 0
→ 該工單尚未完成 1 份印件，需補充 500 份
```

**UI 設計建議**：
- 顯示「缺口」而非隱藏小數部分
- 例：「已完成 500 / 1000（缺口 500）」

---

### 4.4 異動流程：新增生產任務

**場景**：QC 不通過，需補建生產任務（情境 5）

**重算流程**：
```
1. 原生產任務：PT-X（quantity_per_work_order = 2，完成 1800）
2. 新補生產任務：PT-X-new（quantity_per_work_order = ?, 目標 200）

3. 決定 PT-X-new 的倍數：
   選項 A：繼承原值（quantity_per_work_order = 2）
   → 假設該補生產任務的組成與原任務相同

   選項 B：單獨定義（quantity_per_work_order = 1）
   → 假設該補生產任務的製程有所調整

4. 建議：由印務主管確認後設定
```

**防呆提示**：
```
新增生產任務時，系統建議值 = 原任務的平均倍數
但印務主管可手動覆寫，確認調整後的製程邏輯
```

---

### 4.5 異動流程：修改 affects_product

**場景**：發現某工序不影響成品（例：採購紙張被誤標為影響成品）

**重算流程**：
```
1. 修改前：PT-X（affects_product = TRUE）計入
2. 修改後：PT-X（affects_product = FALSE）不計入

3. 工單完成數重新計算：
   修改前：min(PT-X 完成, 其他 PT 完成) = A
   修改後：min(其他 PT 完成) = B（可能 ≥ A）

4. 可能影響：工單完成度提升，印件完成數也提升
```

**防呆提示**：
```
修改 affects_product 前，系統提示：
「該修改將重新計算工單完成數，可能影響出貨進度。請確認業務邏輯。」
```

---

## 五、與測試案例的對應

| TC 編號 | 情境 | 參考章節 |
|---------|------|---------|
| TC-Q-001 | 單一工單完成度計算 | §2.1-2.4、§3.1 |
| TC-Q-002 | 複合任務（多生產任務）的 min 聚合 | §2.2、§3.2 |
| TC-Q-003 | 多工單印件的聚合邏輯 | §2.3-2.4、§3.3 |
| TC-Q-004 | affects_product 篩選機制 | §2.2、§4.1 |
| TC-Q-005 | 異動流程中的倍數調整 | §4.4-4.5 |

---

## 六、設計檢查清單

**Prototype UI 設計時**：
- [ ] 工單建立時，印務主管可為每個 ProductionTask 設定 `quantity_per_work_order`
- [ ] 新增生產任務時，系統建議值來自原任務平均倍數（可覆寫）
- [ ] 異動流程提醒「修改倍數將重新計算工單完成度」
- [ ] 工單完成度頁面顯示「缺口」而非隱藏小數（UX 清晰度）
- [ ] 異動時強制檢查「至少 1 個生產任務 affects_product = TRUE」

**測試時**：
- [ ] 驗證層級聚合邏輯（木桶理論）
- [ ] 驗證 floor 無條件捨去後的數字精度
- [ ] 驗證 affects_product 篩選的正確性
- [ ] 驗證異動流程的重算邏輯

---

## 結論

此文件定義了完整的數量換算規則，支持：
- ✅ 四層層級的聚合計算（層級清晰，職責分明）
- ✅ 複雜場景（一任務多生產任務，各自倍數不同）
- ✅ 邊界情況與防呆檢查
- ✅ 異動流程的重算邏輯

開發與 Prototype 設計可直接參考本文件實現。

