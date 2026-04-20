# Design

## 背景

`production-task-bom-references` change 封存後，production-task 的 Data Model 新增了 `bom_type` 多形引用（material / process / binding）。色數加價的呈現需要對齊此分類。

## Decision 1：色數費歸工序、設備只計開機費

### 背景
`estimated_equipment_cost` 原本同時包含 `setup_fee`（設備固定成本）與色數加價（依印量、色數、特殊色倍率算出的變動成本）。

### 決策
拆為兩項：
- `estimated_equipment_cost` 只含 `setup_fee`（固定成本，開機 1 次 = 1 個 fee）
- 新增 `estimated_color_cost`（變動成本，歸屬工序）

### 理由
1. **會計語意**：固定成本與變動成本分列是 ERP 報價的基本要求；上層 roll-up 才能對帳
2. **心智模型**：色數費在印刷業跟「工序」綁定（每多印一色要多上機一次），不是設備的靜態屬性
3. **pricing rule 來源**：色數費的公式查的是設備的 `pricing_tiers`（印量區間 → 單色單價），這個 tier 是「變動成本公式」的表達，本質屬於工序計費
4. 三視角審查（senior-pm）一致同意此拆分

### 替代方案比較
| 方案 | 取捨 |
|------|------|
| A. 維持合併（現狀）| 簡單但對不上帳；未來 roll-up 會痛 |
| B. 拆為兩個欄位（本決策）| 帳清楚，計算邏輯明確分離；改動小 |
| C. 把 setup_fee 也歸工序 | 語意錯（開機費是設備固定成本，不隨印量變化）|

## Decision 2：只對 bom_type = process 計色數加價

### 背景
材料（bom_type = material）與裝訂（bom_type = binding）綁設備時（少數情境）不計色數費。

### 決策
`estimated_color_cost` 僅對 `bom_type = process` 的生產任務計算；其餘 bom_type 此欄位 MUST 為 null。UI 上，色數輸入子行僅在工序 tab 顯示。

### 理由
- 材料與裝訂不涉及「印刷色數」概念；即使綁設備也只計 setup_fee
- UI 限縮避免使用者誤填

## Decision 3：未選設備 / 設備不支援色數時 UI disabled 但保留 state

### 背景
印務在比較不同機台報價時，會反覆切換設備。若切到 `supports_colors = false` 就清空色數 state，會造成比價時反覆重填。

### 決策
- 未選設備：色數欄位顯示但 disabled，placeholder「請先選擇設備」
- 設備 `supports_colors = false`：色數欄位 disabled，顯示「此設備（XXX）僅計開機費，不計色數加價」
- 切換設備時 **保留** 色數 state（不清空）；換回支援色數的設備，原值自動恢復可編輯

### 理由
1. 印務常見情境：同一工序切不同機台比價
2. 清空 state 會造成重工與誤操作
3. Disabled + 說明字串比完全隱藏更易讀（避免「剛剛填的去哪了」認知斷裂）

## Decision 4：ProductionTask ↔ Equipment 維持 1:1

### 背景
色數費歸工序後，會出現兩個邊界情境：
1. **同工序多設備**：例 100 萬張分兩台機；瑕疵補印走另一台
2. **同設備多工序**：例精裝書 CMYK + Pantone 共用同台機、多合一設備跑多道工序

### 決策
維持 1:1 關係不變：
- 情境 1：ERP 計費以主設備（最優解）為準；工廠內部分台屬生產排程，不在 ERP 表達
- 情境 2：每筆工序綁設備就算一次 setup_fee；若需共用，建議建立為一個工序 + 色數組合（frontColorCount + specialColors）而非拆兩筆

### 理由
- 80% 正常情境（單一最優設備）能完整表達
- 色數組合欄位（frontColorCount / backColorCount / specialColors）已能表達精裝書的 CMYK + Pantone 場景
- 資料模型簡潔，不引入 `equipment_session` 或多對多關聯

## Decision 5：舊 calculateEquipmentCost 函數保留為彙總呼叫點

### 背景
WorkOrderDetail 的「設備預計成本 panel」使用 `calculateEquipmentCost`，想呈現設備相關的「總成本」。

### 決策
`calculateEquipmentCost` 保留，改為內部呼叫 `calculateSetupFee + calculateColorCost` 並加總；新程式碼應直接呼叫 `calculateSetupFee` / `calculateColorCost` 取得分項。

### 理由
- 避免既有呼叫點大規模改動
- 語意明確：該函數回的是「設備相關總成本彙總」，仍有用武之地
