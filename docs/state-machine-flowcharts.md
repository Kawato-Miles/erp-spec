# ERP 狀態機流程圖（工單 / 任務 / 生產任務）

> 顏色說明（全部圖表通用）
>
> | 顏色 | 意義 |
> |------|------|
> | 紫色 | 印務操作 |
> | 紅色 | 印務主管審核 |
> | 藍色 | 生管操作 |
> | 黃色 | 系統自動 |
> | 綠色 | 終態（已完成）/ 並行運作 |
> | 灰色 | 例外路徑 |

---

## 一、工單（Work Order）正常流程

```mermaid
flowchart TD
    A["<b>1. 印務建立工單</b><br/>工單：草稿"]
    ↓1[" "]:::invisible
    B["<b>2. 印務填寫製程資訊並提交</b><br/>工單 → 製程確認中"]
    ↓2[" "]:::invisible
    C{"印務主管審核"}
    ↓3[" "]:::invisible
    D["<b>3a. 審核通過</b><br/>工單 → 製程審核完成"]
    E["<b>3b. 要求修改</b><br/>工單 → 重新確認製程<br/>印務修改後重新提交<br/>回到審核"]
    ↓4[" "]:::invisible
    F["<b>4. 印務交付任務</b><br/>工單 → 工單已交付"]
    ↓5[" "]:::invisible
    G["<b>5. 首個生產任務首次報工</b><br/>工單 → 製作中（向上傳遞）"]
    ↓6[" "]:::invisible
    H["<b>6. 所有生產任務完成</b><br/>工單 → 已完成"]

    A --- ↓1 --- B --- ↓2 --- C
    C -->|通過| D
    C -->|退回| E
    E -->|重新提交| C
    D --- ↓4 --- F --- ↓5 --- G --- ↓6 --- H

    classDef invisible fill:none,stroke:none,color:none;
    style A fill:#f0e0ff,stroke:#936
    style B fill:#f0e0ff,stroke:#936
    style C fill:#ffe0e0,stroke:#a33
    style D fill:#ffe0e0,stroke:#a33
    style E fill:#f0e0ff,stroke:#936
    style F fill:#f0e0ff,stroke:#936
    style G fill:#fff3cd,stroke:#a80
    style H fill:#fff3cd,stroke:#a80
```

---

## 二、任務（Task）正常流程

```mermaid
flowchart TD
    A["<b>1. 工單交付</b><br/>任務 → 待交付 同步變為 已交付"]
    ↓1[" "]:::invisible
    B["<b>2. 首個生產任務首次報工</b><br/>任務 → 製作中（向上傳遞）"]
    ↓2[" "]:::invisible
    C["<b>3. 所有生產任務完成</b><br/>任務 → 已完成"]

    A --- ↓1 --- B --- ↓2 --- C

    D["例外：所有生產任務皆作廢<br/>→ 任務自動作廢（bottom-up）"]

    classDef invisible fill:none,stroke:none,color:none;
    classDef exception fill:#f5f5f5,stroke:#999,color:#666;
    class D exception

    style A fill:#f0e0ff,stroke:#936
    style B fill:#fff3cd,stroke:#a80
    style C fill:#fff3cd,stroke:#a80
```

---

## 三、生產任務（Production Task）正常流程

依工廠類型分三條路徑：

```mermaid
flowchart TD
    A["<b>1. 工單交付後建立</b><br/>生產任務：待處理<br/>（指派師傅不改變狀態）"]
    ↓1[" "]:::invisible
    B["<b>2. 首次報工</b><br/>生產任務 → 製作中<br/>（觸發向上傳遞：任務 → 工單 → 印件 → 訂單）"]
    ↓2[" "]:::invisible
    C{工廠類型}

    C -->|自有工廠| D["<b>3. 製作完畢</b><br/>→ 已完成"]
    C -->|外包工廠| E["<b>3. 製作完畢出貨</b><br/>→ 運送中"]
    C -->|中國工廠| F["<b>3. 製作完畢送集運</b><br/>→ 已送集運商"]

    E --> G["<b>4. 貨物到達</b><br/>→ 已完成"]
    F --> H["<b>4. 集運商出貨</b><br/>→ 運送中"]
    H --> I["<b>5. 貨物到達</b><br/>→ 已完成"]

    A --- ↓1 --- B --- ↓2 --- C

    J["例外：待處理狀態直接作廢<br/>（無成本，因尚未生產）"]

    classDef invisible fill:none,stroke:none,color:none;
    classDef exception fill:#f5f5f5,stroke:#999,color:#666;
    class J exception

    style A fill:#d1ecf1,stroke:#0c5
    style B fill:#fff3cd,stroke:#a80
    style C fill:#f5f5f5,stroke:#999
    style D fill:#e8f4e8,stroke:#4a4
    style E fill:#fff3cd,stroke:#a80
    style F fill:#fff3cd,stroke:#a80
    style G fill:#e8f4e8,stroke:#4a4
    style H fill:#fff3cd,stroke:#a80
    style I fill:#e8f4e8,stroke:#4a4
```

---

## 四、異動流程（不需重新審核）

```mermaid
flowchart TD
    A["<b>1. 印務發起異動</b><br/>選擇：不需重新審核<br/>指定受影響的任務"]
    ↓1[" "]:::invisible
    B["<b>2. 系統自動處理</b><br/>受影響任務 → 異動<br/>工單 bubble-up → 異動<br/>通知生管"]
    ↓2[" "]:::invisible
    C["<b>3. 生管確認收到</b><br/>任務 → 已確認異動內容"]
    ↓3[" "]:::invisible
    D["<b>4. 生管分配生產任務</b><br/>新增 / 修改 / 作廢生產任務<br/>安排師傅 / 通知外包廠"]
    ↓4[" "]:::invisible
    E["<b>5. 生管完成安排</b><br/>任務 → 製作中"]
    ↓5[" "]:::invisible
    F["<b>6. 系統自動恢復</b><br/>所有任務離開異動狀態<br/>工單 bubble-up → 回到正常狀態"]

    A --- ↓1 --- B --- ↓2 --- C --- ↓3 --- D --- ↓4 --- E --- ↓5 --- F

    G["未受影響的生產任務<br/>持續製作、報工不中斷<br/>完成度計算持續運作"]

    classDef invisible fill:none,stroke:none,color:none;
    classDef parallel fill:#e8f4e8,stroke:#4a4,color:#333;
    class G parallel

    style A fill:#f0e0ff,stroke:#936
    style B fill:#fff3cd,stroke:#a80
    style C fill:#d1ecf1,stroke:#0c5
    style D fill:#d1ecf1,stroke:#0c5
    style E fill:#d1ecf1,stroke:#0c5
    style F fill:#fff3cd,stroke:#a80
```

---

## 五、異動流程（需重新審核）

```mermaid
flowchart TD
    A["<b>1. 印務發起異動</b><br/>選擇：需重新審核"]
    ↓1[" "]:::invisible
    B["<b>2. 工單回到重新確認製程</b><br/>已交付的任務繼續執行，不收回"]
    ↓2[" "]:::invisible
    C["<b>3. 印務修改製程</b><br/>工單 → 製程確認中"]
    ↓3[" "]:::invisible
    D["<b>4. 印務主管審核</b><br/>工單 → 製程審核完成"]
    ↓4[" "]:::invisible
    E["<b>5. 印務交付新任務</b><br/>新任務標記為「異動」<br/>工單 bubble-up → 異動<br/>通知生管"]
    ↓5[" "]:::invisible
    F["<b>6. 生管確認收到</b><br/>任務 → 已確認異動內容"]
    ↓6[" "]:::invisible
    G["<b>7. 生管分配生產任務</b><br/>新增 / 修改 / 作廢生產任務<br/>安排師傅 / 通知外包廠"]
    ↓7[" "]:::invisible
    H["<b>8. 生管完成安排</b><br/>任務 → 製作中"]
    ↓8[" "]:::invisible
    I["<b>9. 系統自動恢復</b><br/>所有任務離開異動狀態<br/>工單 bubble-up → 回到正常狀態"]

    A --- ↓1 --- B --- ↓2 --- C --- ↓3 --- D --- ↓4 --- E --- ↓5 --- F --- ↓6 --- G --- ↓7 --- H --- ↓8 --- I

    J["未受影響的生產任務<br/>持續製作、報工不中斷<br/>完成度計算持續運作"]

    classDef invisible fill:none,stroke:none,color:none;
    classDef parallel fill:#e8f4e8,stroke:#4a4,color:#333;
    class J parallel

    style A fill:#f0e0ff,stroke:#936
    style B fill:#f0e0ff,stroke:#936
    style C fill:#f0e0ff,stroke:#936
    style D fill:#ffe0e0,stroke:#a33
    style E fill:#f0e0ff,stroke:#936
    style F fill:#d1ecf1,stroke:#0c5
    style G fill:#d1ecf1,stroke:#0c5
    style H fill:#d1ecf1,stroke:#0c5
    style I fill:#fff3cd,stroke:#a80
```

---

## 附錄：狀態轉換總表

### 工單狀態轉換

| 從 | 到 | 觸發條件 | 角色 |
|---|---|---------|------|
| 草稿 | 製程確認中 | 印務填寫製程資訊 | 印務 |
| 製程確認中 | 製程審核完成 | 印務主管審核通過 | 印務主管 |
| 製程確認中 | 重新確認製程 | 印務主管要求修改 | 印務主管 |
| 重新確認製程 | 製程確認中 | 印務修改後重新提交 | 印務 |
| 製程審核完成 | 工單已交付 | 首個任務交付 | 印務 |
| 工單已交付 | 製作中 | 首個生產任務進入「製作中」 | 系統 |
| 製作中 | 已完成 | 所有生產任務完成 | 系統 |
| 工單已交付 | 製程確認中 / 重新確認製程 | 收回（Withdraw） | 印務 |
| 工單已交付 / 製作中 | 重新確認製程 | 異動（需重新審核） | 印務 |
| 工單已交付 / 製作中 | 異動 | 任務 bubble-up（不需重新審核） | 系統 |
| 異動 | 正常狀態 | 所有任務離開異動相關狀態 | 系統 |

### 任務狀態轉換

| 從 | 到 | 觸發條件 | 角色 |
|---|---|---------|------|
| 待交付 | 已交付 | 工單交付時同步 | 印務 |
| 已交付 | 製作中 | 首個生產任務進入「製作中」 | 系統 |
| 製作中 | 已完成 | 所有生產任務完成 | 系統 |
| 已交付 / 製作中 | 異動 | 印務發起異動，系統自動設定 | 印務 / 系統 |
| 異動 | 已確認異動內容 | 生管點擊「確認收到」 | 生管 |
| 已確認異動內容 | 製作中 | 生管完成安排，手動恢復 | 生管 |
| 任意狀態 | 已作廢 | 所有生產任務皆已作廢（bottom-up） | 系統 |

### 生產任務狀態轉換

| 從 | 到 | 觸發條件 | 工廠類型 |
|---|---|---------|---------|
| 待處理 | 製作中 | 首次報工 | 全部 |
| 製作中 | 已完成 | 製作完畢 | 自有 |
| 製作中 | 運送中 | 製作完畢，出貨 | 外包 |
| 製作中 | 已送集運商 | 製作完畢，送集運 | 中國 |
| 已送集運商 | 運送中 | 集運商出貨 | 中國 |
| 運送中 | 已完成 | 貨物到達 | 外包 / 中國 |
| 待處理 | 已作廢 | 異動需作廢（無成本） | 全部 |
