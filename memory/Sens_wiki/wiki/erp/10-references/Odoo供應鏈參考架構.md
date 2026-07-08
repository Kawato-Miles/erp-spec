---
type: reference
module:
  - 跨模組
status: active
last-reviewed: 2026-07-08
---

# Odoo 供應鏈參考架構（生產 → 報工 → 廠間移轉 → 品檢 → 揀貨 → 出貨）

> 外部系統參考卡（非公司商業記憶正本）：Odoo 18.0 供應鏈實作方式的圖解精練版，供生產關規劃與後續 insight 對照。事實出處與逐段官方文件 URL 見文末參考資料的兩張 raw 卡；本卡只呈現架構，不重複敘述。

## 概述

Odoo 供應鏈的所有流程共用三個原語：**位置**（供應商、客戶、生產區、報廢區、在途全部建模為位置，狀態即位置）、**作業類型**（每張移轉單的類別與行為設定）、**路線規則**（push／pull rule 自動生成鏈式單據，前段驗證完成、後段才變 Ready）。六段流程（生產、報工、廠間移轉、品檢、揀貨、出貨）都是這三者的組合。

## 一、資料結構（ER-Model）

### 1. 庫存核心與路線

```mermaid
erDiagram
    "倉庫" ||--|{ "位置" : "細分為"
    "位置" ||--o{ "庫存量子" : "存放"
    "產品" ||--o{ "庫存量子" : "計數為"
    "批號序號" |o..o{ "庫存量子" : "追蹤（追蹤品才有）"
    "作業類型" ||--o{ "移轉單" : "歸類"
    "移轉單" ||--|{ "庫存移動" : "內含"
    "庫存移動" }o--|| "位置" : "來源"
    "庫存移動" }o--|| "位置" : "目的"
    "路線" ||--|{ "規則" : "由多條組成"
    "規則" }o--|| "作業類型" : "產單時套用"
    "產品" }o--o{ "路線" : "掛載（另可掛分類/倉庫/訂單行/包裝）"

    "庫存量子" {
        float quantity "實際在手"
        float reserved_quantity "已保留"
        float available_quantity "可用＝在手－保留"
    }
    "庫存移動" {
        string location_id "來源位置"
        string location_dest_id "目的位置"
        string state "draft/confirmed/assigned/done"
    }
    "規則" {
        string action "Pull From / Push To / Pull&Push / Buy / Manufacture"
        string supply_method "取庫存 / 觸發另一規則 / 先取不足再觸發"
    }
```

位置類型七種：供應商、View（純組織）、內部儲位、客戶、盤損、生產區、在途。

### 2. 製造與報工

```mermaid
erDiagram
    "物料清單" ||--|{ "元件行" : "內含"
    "物料清單" ||--o{ "工序" : "定義（一道工序專屬一張BOM）"
    "物料清單" ||--o{ "副產品行" : "內含"
    "物料清單" |o..o| "物料清單" : "半成品巢狀（多層BOM）"
    "元件行" }o..o| "工序" : "指定消耗於"
    "工序" }o--|| "工作中心" : "指派"
    "工序" }o--o{ "工序" : "相依（blocked_by）"
    "製造訂單" }o--|| "物料清單" : "依據"
    "製造訂單" ||--o{ "工單" : "展開為（每工序一張）"
    "製造訂單" ||--o{ "庫存移動" : "元件消耗＋成品產出"
    "工單" }o--|| "工作中心" : "執行於"
    "工單" ||--o{ "工時稼動紀錄" : "計時事實"
    "工單" ||--o{ "品檢單" : "內嵌品檢步驟"
    "製造訂單" ||--o{ "報廢單" : "折損掛回"
    "工時稼動紀錄" }o--|| "損失類別" : "歸類（生產/降速/缺料/故障）"

    "製造訂單" {
        string state "draft/confirmed/progress/to_close/done/cancel"
        float product_qty "計畫產量"
        float qty_produced "已產出"
        string lot_producing_id "產出批號"
    }
    "工單" {
        string state "pending/waiting/ready/progress/done/cancel"
        float duration_expected "計畫工時"
        float duration "實際工時（稼動紀錄加總）"
    }
    "工作中心" {
        float default_capacity "可並行件數"
        float time_efficiency "時間效率％"
        float costs_hour "時薪成本"
        float oee "生產時間占比（衍生）"
    }
```

### 3. 品質

```mermaid
erDiagram
    "品檢點" ||--o{ "品檢單" : "依粒度×頻率自動產生"
    "品檢點" }o--|| "作業類型" : "掛載（製造/收貨/出貨/內部調撥）"
    "品檢點" }o..o| "工序" : "製造時可鎖定"
    "品檢單" }o..o| "移轉單" : "掛庫存單據"
    "品檢單" }o..o| "工單" : "掛工單步驟"
    "品檢單" |o..o| "品質警報" : "Fail 時可開"
    "品檢點" }o..o| "位置" : "不良品分流去向（failure location）"

    "品檢點" {
        string control_per "整單 / 每產品 / 抽驗數量％"
        string control_frequency "每次 / 隨機％ / 週期"
        string type "指示/是非/量測/拍照/登記產出/表單"
    }
    "品檢單" {
        string result "Pass / Fail（文件僅載兩值）"
        float measure "量測值（Norm＋容差自動判定）"
    }
    "品質警報" {
        string root_cause "根因"
        string stage "看板階段（可自訂）"
    }
```

### 4. 揀貨與出貨

```mermaid
erDiagram
    "批次移轉" ||--o{ "移轉單" : "合併多張揀貨（batch/wave/cluster 共用）"
    "移轉單" }o..o| "運送方式" : "指定承運"
    "移轉單" ||--o{ "包裝" : "Put in Pack 分裝"
    "包裝" }o--|| "包裝類型" : "規格範本（尺寸/載重，供運費）"
    "產品分類" ||--o{ "產品" : "歸類"
    "產品分類" {
        string force_removal_strategy "FIFO/LIFO/FEFO/最近儲位/最少包裝"
    }
    "作業類型" ||--o{ "移轉單" : "歸類"
    "作業類型" {
        string reservation_method "確認即保留 / 手動 / 排定日前N天"
        string create_backorder "詢問 / 總是 / 從不"
    }
    "運送方式" {
        string type "固定價 / 規則計價 / 第三方即時費率"
    }
```

## 二、端到端角色分工（泳道圖）

概覽層級；各段細節見 § 三。

```mermaid
flowchart LR
    subgraph 生管排程
        A1["確認製造訂單（MO）"]
    end
    subgraph 系統自動
        S1["依 BOM 展開：領料單＋工單＋品檢單"]
        S2["補貨規則觸發廠間移轉：自動建供應廠出貨單＋接收廠收貨單"]
        S3["銷售訂單確認：依路線生成揀貨→包裝→出貨單據鏈＋保留庫存"]
    end
    subgraph 倉庫人員
        W1["驗證領料單（儲位→製造區）"]
        W2["驗證成品入庫單（3步制）"]
        W3["驗證廠間出貨／收貨（經在途位置）"]
        W4["批次揀貨（batch／wave／cluster）"]
    end
    subgraph 現場作業員
        P1["Shop Floor 開工計時"]
        P2["逐步完成工單步驟（含內嵌品檢）"]
        P3["登記產出＋批序號（不足→拆欠產單）"]
    end
    subgraph 品檢員
        Q1["執行品檢單 Pass／Fail"]
        Q2["Fail：分流不良品位置＋開品質警報"]
    end
    subgraph 出貨人員
        D1["包裝 Put in Pack"]
        D2["驗證出貨單（自動產標籤＋追蹤號）"]
    end

    A1 --> S1
    S1 --> W1 --> P1 --> P2 --> P3 --> W2
    P2 -.品檢步驟.-> Q1
    W2 --> S2 --> W3
    W3 -.收貨可掛品檢.-> Q1
    Q1 --> Q2
    S3 --> W4 --> D1 --> D2
    W3 --> S3
```

## 三、各段流程

### 1. 生產單據鏈（1／2／3 步製造，倉庫層設定）

```mermaid
flowchart LR
    subgraph 一步
        A["儲位"] -->|"MO 關單時直接扣料＋入庫（無獨立移轉單）"| B["成品儲位"]
    end
    subgraph 二步
        C["儲位"] -->|"領料單 WH/PC"| D["製造區"] -->|"MO 完工登記（入庫不另開單）"| E["成品儲位"]
    end
    subgraph 三步
        F["儲位"] -->|"領料單 WH/PC"| G["製造區"] -->|"MO 完工"| H["產出暫存"] -->|"成品入庫單 WH/SFP（獨立驗證）"| I["成品儲位"]
    end
```

三步制下半成品／成品入庫是顯式單據，停留在中間位置的數量即在製品。半成品走多層 BOM：子層各開 MO、子層完工才能開上層。

### 2. 報工（Shop Floor，循序圖）

```mermaid
sequenceDiagram
    actor OP as 作業員
    participant SF as Shop Floor 介面
    participant WO as 工單
    participant TR as 工時稼動紀錄
    participant MO as 製造訂單

    OP->>SF: operator panel 登入（多員工可同做一張工單）
    OP->>SF: 點工單開始
    SF->>TR: 開始計時（工單累計＋個人 session 雙層）
    OP->>SF: 逐步完成步驟（含內嵌品檢步驟）
    OP->>SF: Register Production（產出數量＋批序號）
    SF->>MO: 產出累計（實產＜訂產 → 拆欠產單 -001/-002）
    OP->>SF: Mark as Done ／ Close Production
    SF->>TR: 寫入迄時與損失類別
    TR->>WO: Real Duration＝各段計時加總
    WO->>MO: 實際成本＝工作中心時薪×實際工時（與 BOM 預估成本雙欄對照）
    Note over TR,MO: OEE 與生產分析報表全由工時事實衍生計算
```

### 3. 廠間移轉（泳道圖）

```mermaid
flowchart LR
    subgraph 接收廠系統
        T1["補貨規則（庫存低於 min）或 MTO 觸發路線『X: Supply Product from Y』"]
        T2["自動建立兩張單"]
    end
    subgraph 供應廠倉庫
        T3["出貨單：供應廠儲位 → 在途位置"]
    end
    subgraph 在途
        T4["Inter-warehouse transit 位置（帳上可見在途量）"]
    end
    subgraph 接收廠倉庫
        T5["收貨單：在途位置 → 接收廠儲位（前單 Done 才 Ready；可掛收貨品檢）"]
    end
    T1 --> T2 --> T3 --> T4 --> T5
```

兩張單各自驗證＝兩端各自確認交接；設定面為接收倉勾「Resupply From」供應倉即自動生成路線。

### 4. 品檢分流（活動圖）

```mermaid
flowchart TD
    C0["品檢單產生（依品檢點：粒度×頻率）"] --> C1["執行品檢（指示/是非/量測/拍照…）"]
    C1 --> C2{"結果"}
    C2 -->|Pass| C3["合格品入正常儲位／工單繼續"]
    C2 -->|Fail| C4["輸入失敗數量＋選不良品位置"]
    C4 --> C5["單據照樣驗證過帳（分流不卡關）"]
    C5 --> C6["不良品入 failure location（庫存可查）"]
    C5 --> C3
    C4 --> C7["開品質警報：根因／矯正／預防措施（看板）"]
    C6 --> C8["後續人工裁決：退貨或報廢（文件無自動串接）"]
```

### 5. 揀貨與出貨單據鏈（3 步出貨）

```mermaid
flowchart LR
    ST["儲位"] -->|"揀貨單 WH/PICK：removal strategy 給建議＋批次揀貨 batch/wave/cluster"| PZ["包裝區 WH/Packing Zone"]
    PZ -->|"包裝單 WH/PACK：Put in Pack 分裝"| OUT["出貨區 WH/Output"]
    OUT -->|"出貨單 WH/OUT：驗證即產標籤＋追蹤號（一包一標籤）"| CU["客戶位置"]
```

批次揀貨三模式：batch（合併揀、事後分）、wave（先拆單再組波次）、cluster（揀時即分入各單容器）。庫存保留時機設在作業類型層（確認即保留／手動／排定日前 N 天）。

## 四、狀態機（UML）

狀態列舉出自 17.0 原始碼查證（見 [[2026-06-14-claude-research-Odoo製造與庫存模組]]）；18.0 使用者文件僅呈現部分狀態。

```mermaid
stateDiagram-v2
    direction LR
    state "製造訂單" as MO {
        [*] --> draft : 建立
        draft --> confirmed : 確認（展開元件移動/成品移動/工單）
        confirmed --> progress : 首張工單開工
        progress --> to_close : 產出登記完畢
        to_close --> done : Close Production（庫存過帳）
        draft --> cancel
        confirmed --> cancel
        done --> [*]
        cancel --> [*]
    }
```

```mermaid
stateDiagram-v2
    direction LR
    state "工單" as WO {
        [*] --> pending : MO 確認展開
        pending --> waiting : 有前置工序未完（blocked_by）
        waiting --> ready : 前置完成＋備料齊
        pending --> ready : 無前置阻擋
        ready --> progress : 作業員開工（計時開始）
        progress --> done : Mark as Done
        pending --> cancel
        ready --> cancel
        done --> [*]
        cancel --> [*]
    }
```

## 五、設計原則對照（對感官生產關規劃）

| Odoo 選擇 | 對照議題 |
|-----------|---------|
| 揀貨＝出貨鏈的一段移轉單，多一張單而非多一個狀態 | 揀貨階段已確立（[[出貨單狀態]] 出貨單即揀貨指令）；載體與狀態顆粒度設計時對照本行（[[SHP-007-揀貨裝箱回報載體與出貨單狀態顆粒度|SHP-007]]） |
| 品檢分流不卡關（位置隔離），品質問題走警報軌道 | 工序間品檢已取消、品檢收斂為入庫前最終品檢（[[工序相依性規則]]），方向同構 |
| 報工無獨立單據，內建工單；事實表先行、KPI 全衍生 | [[報工規則]]、[[報工紀錄]] 的現場回報體系設計 |
| 廠間移轉＝兩張單＋在途位置，兩端各自確認 | [[派單狀態]] 中國線三實體分離（方向同構） |
| 欠產與欠交同構：拆單保留原單號脈絡（-001/-002） | 分批生產／分批出貨的單據設計 |

## 參考資料

- [[2026-07-08-claude-research-Odoo供應鏈生產到出貨流程]] — 18.0 官方使用文件端到端調研（六段流程細節、逐段 URL 總表、查無清單 11 項）
- [[2026-06-14-claude-research-Odoo製造與庫存模組]] — 17.0 原始碼級資料結構（逐欄位、計算式、WIP 建模、OEE 公式、對抗式驗證標記）
- 官方文件入口：[Odoo 18.0 Inventory & MRP](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp.html)

## 關聯區域

- 狀態機對照：[[工單狀態]]、[[生產任務狀態]]、[[QC 狀態]]、[[出貨單狀態]]、[[派單狀態]]
- 商業邏輯對照：[[工序相依性規則]]、[[報工規則]]、[[齊套邏輯]]、[[生產流程]]
- 實體對照：[[報工紀錄]]、[[成品庫存]]、[[轉交單]]
