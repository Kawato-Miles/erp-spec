# Demo 假資料：大方文創週年慶禮盒組

> **用途**：Prototype Demo，展示需求單到生產完成（入庫）的完整流程
> **時間切面**：2026-04-03 下午（各印件進度不同，反映真實場景）
> **範圍**：需求單 → 訂單 → 印件 → 工單 → 任務 → 生產任務 → QC → 入庫。不含出貨。

---

## 1. 故事線總覽

```
需求單 RQ-20260325-01（大方文創 / 週年慶禮盒組 2000 組）
  │
  ▼
訂單 ORD-20260328-01（客製單 / EC 同步，已付款 50%）
  │
  │  ┌─ 打樣階段 ────────────────────────────────────────┐
  │  │                                                    │
  ├──┤  印件 A1：盒身打樣 → NG-製程問題（色差）            │
  │  │    └─ 同印件建第二輪工單 → 調色重打 → OK            │
  │  │                                                    │
  ├──┤  印件 D1：腰封打樣 → NG-稿件問題（出血不足）        │
  │  │    └─ 棄用 → 新建印件 D2 → 重新上稿打樣 → OK       │
  │  │                                                    │
  │  └────────────────────────────────────────────────────┘
  │
  │  ┌─ 大貨生產階段 ────────────────────────────────────┐
  │  │                                                    │
  ├──┤  印件 B：盒身大貨 ×2000 → 製作中（核心展示）        │
  │  │    ├─ W-01 印刷+上光（自有）→ 製作中                │
  │  │    ├─ W-02 模切（外包）→ 工單已交付                  │
  │  │    └─ W-03 燙金（外包）→ 工單已交付                  │
  │  │                                                    │
  ├──┤  印件 C：盒蓋大貨 ×2000 → 製作中                    │
  │  │    └─ W-04 印刷+壓紋（自有）→ 製作中                │
  │  │                                                    │
  ├──┤  印件 D3：腰封大貨 ×2000 → 工單已交付                │
  │  │    └─ W-05（自有）→ 待排程                          │
  │  │                                                    │
  └──┤  印件 E：小卡大貨 ×2000 → 工單已交付                 │
     │    └─ W-06（自有）→ 待排程                          │
     │                                                    │
     └────────────────────────────────────────────────────┘
```

---

## 2. 需求單

| 欄位 | 值 |
|------|-----|
| 編號 | RQ-20260325-01 |
| 客戶 | 大方文創有限公司 |
| 聯絡人 | 林小姐 |
| 需求描述 | 週年慶禮盒組 2000 組（盒身+盒蓋+腰封+小卡），盒身與腰封需打樣確認 |
| 急件 | 否 |
| 客戶交期 | 2026-04-30 |
| 狀態 | 成交 |
| 評估日期 | 2026-03-26 |
| 成本評估 | 紙材 $45,000 + 印刷 $38,000 + 後加工 $22,000 + 外包 $15,000 = **$120,000** |
| 報價金額 | **$168,000**（含稅）|
| 評估人 | 周經理（印務主管）|

---

## 3. 訂單

| 欄位 | 值 |
|------|-----|
| 編號 | ORD-20260328-01 |
| 類型 | 客製單 |
| 客戶 | 大方文創有限公司 |
| 業務 | 王大明 |
| 付款狀態 | 已付款（訂金 50%，$84,000）|
| 客戶交期 | 2026-04-30 |
| 內部完成時間 | 2026-04-25 |
| 預計出貨日 | 2026-04-28 |
| 訂單狀態 | 製作中 |
| 備註 | 盒身五色特殊色需打樣確認；腰封需確認出血 |

---

## 4. 印件總覽

| 印件 | 名稱 | type | qty | review_status | production_status | sample_result | 說明 |
|------|------|------|-----|---------------|-------------------|---------------|------|
| A1 | 禮盒盒身（打樣）| 打樣 | 1 | 合格 | 製作完成 | OK | 第一輪 NG-製程（色差），第二輪 OK |
| B | 禮盒盒身（大貨）| 大貨 | 2000 | 合格 | 製作中 | — | A1 打樣 OK 後開放 |
| C | 禮盒盒蓋（大貨）| 大貨 | 2000 | 合格 | 製作中 | — | 免打樣 |
| D1 | 腰封（打樣）| 打樣 | 1 | 合格 | 已棄用 | NG-稿件問題 | 出血不足，棄用 |
| D2 | 腰封（打樣）| ���樣 | 1 | 合格 | 製作完成 | OK | D1 棄用後新建，重新上稿 |
| D3 | 腰封（大貨）| 大貨 | 2000 | 合格 | 工單已交付 | — | D2 OK 後開放 |
| E | 小卡（大貨）| 大貨 | 2000 | 合格 | 工單已交付 | — | 免打樣 |

---

## 5. 打樣情境一：NG-製程問題（印件 A1 盒身打樣）

### 故事

盒身使用五色印刷（CMYK + 特殊金色），第一輪打樣金色色差明顯，客戶判定 NG。印務調整色彩參數後重打第二輪，客戶確認 OK。

### 資料結構

```
印件 A1：禮盒盒身（打樣）×1
  review_status: 合格
  production_status: 製作完成
  sample_result: OK（最終值，歷程含一次 NG-製程問題）
  │
  ├─ 工單 W-S01（第一輪打樣）
  │   work_order_no: W-20260329-01
  │   type: 打樣
  │   target_quantity: 5（打樣通常印少量）
  │   status: 已完成
  │   assigned_to: 陳志明
  │   │
  │   └─ 任務 TS1（自有工廠）
  │       factory_type: 自有
  │       status: 已完成
  │       │
  │       └─ PT-S01 五色打樣印刷
  │           affects_product: TRUE
  │           quantity_per_work_order: 5
  │           assigned_operator: 張師傅
  │           planned_equipment: 海德堡 XL106 (#1)
  │           scheduled_date: 2026-03-29
  │           estimated_duration_days: 1
  │           status: 已完成
  │           completed_quantity: 5
  │           qc_passed_qty: 5
  │           qc_failed_qty: 0
  │
  │   → QC 通過（生產品質 OK，但色彩不符客戶預期）
  │   → 樣品寄送客戶
  │   → 03/31 客戶反饋：金色色差太大
  │   → 業務填 sample_result = NG-製程問題
  │
  └─ 工單 W-S02（第二輪打樣，調整金色參數）
      work_order_no: W-20260401-07
      type: 打樣
      target_quantity: 5
      status: 已完成
      assigned_to: 陳志明
      │
      └─ 任務 TS2（自有工廠）
          factory_type: 自有
          status: 已完成
          │
          └─ PT-S02 五色打樣印刷（調色後）
              affects_product: TRUE
              quantity_per_work_order: 5
              assigned_operator: 張師傅
              planned_equipment: 海德堡 XL106 (#1)
              scheduled_date: 2026-04-01
              estimated_duration_days: 1
              status: 已完成
              completed_quantity: 5
              qc_passed_qty: 5
              qc_failed_qty: 0

      → QC 通過
      → 樣品寄送客戶
      → 04/02 客戶確認 OK
      → 業務改填 sample_result = OK
      → 系統開放大貨印件 B 生產
```

### Demo 展示重點

- 同一打樣印件下有兩張工單（W-S01、W-S02），呈現重打樣歷程
- `sample_result` 欄位在介面上可見且可操作（業務角色）
- 歷程記錄可追溯：先 NG-製程問題 → 後改為 OK
- 打樣 OK 後系統自動開放大貨印件 B 的生產流程

---

## 6. 打樣情境二：NG-稿件問題（印件 D1 腰封打樣）

### 故事

腰封稿件出血區域不足（僅 1mm，規範為 3mm），打樣裁切後邊緣出現白邊。因稿件本身有問題，原印件需棄用，客戶重新提供稿件後建新印件重走流程。

### 資料結構

```
印件 D1：腰封（打樣）×1  ← 已棄用
  review_status: 合格（稿件審稿時未察覺出血不足）
  production_status: 已棄用
  sample_result: NG-稿件問題
  │
  └─ 工單 W-S03（打樣）
      work_order_no: W-20260329-02
      type: 打樣
      target_quantity: 5
      status: 已完成
      assigned_to: 陳志明
      │
      └─ 任務 TS3（自有工廠）
          factory_type: 自有
          status: 已完成
          │
          └─ PT-S03 雙色打樣印刷
              affects_product: TRUE
              quantity_per_work_order: 5
              assigned_operator: 王師傅
              planned_equipment: 小森 GL40 (#2)
              scheduled_date: 2026-03-29
              estimated_duration_days: 1
              status: 已完成
              completed_quantity: 5
              qc_passed_qty: 5
              qc_failed_qty: 0

      → QC 通過（印刷品質 OK）
      → 樣品寄送客戶
      → 03/31 客戶反饋：裁切後邊緣白邊
      → 業務填 sample_result = NG-稿件問題
      → 印件 D1 標記「已棄用」（終態）

---

印件 D2：腰封（打樣）×1  ← 新建印件
  review_status: 合格
  production_status: 製作完成
  sample_result: OK
  │
  └─ 工單 W-S04（打樣）
      work_order_no: W-20260401-08
      type: 打樣
      target_quantity: 5
      status: 已完成
      assigned_to: 陳志明
      │
      └─ 任務 TS4（自有工廠）
          factory_type: 自有
          status: 已完成
          │
          └─ PT-S04 雙色打樣印刷
              affects_product: TRUE
              quantity_per_work_order: 5
              assigned_operator: 王師傅
              planned_equipment: 小森 GL40 (#2)
              scheduled_date: 2026-04-01
              estimated_duration_days: 1
              status: 已完成
              completed_quantity: 5
              qc_passed_qty: 5
              qc_failed_qty: 0

      → QC 通過
      → 樣品寄送客戶
      → 04/02 客戶確認 OK
      → 業務填 sample_result = OK
      → 系統開放大貨印件 D3 生產
```

### Demo 展示重點

- NG-稿件問題 → 原印件 D1 進入「已棄用」終態（介面灰底或刪除線）
- 必須新建打樣印件 D2，重新走稿件上傳 → 審稿 → 打樣完整流程
- D1 在列表中仍可見，保留歷史軌跡
- 與情境一的差異：製程問題可在同印件重打，稿件問題必須棄用重建

---

## 7. 印件 B — 禮盒盒身（大貨）：核心 Demo 焦點

### 結構總覽

```
印件 B：禮盒盒身（大貨）×2000
  review_status: 合格
  production_status: 製作中
  pi_target_qty: 2000（跨工單加總的目標）
  │
  ├─ 工單 W-01 印刷 + 上光（自有）   → 製作中
  ├─ 工單 W-02 模切（外包）           → 工單已交付
  └─ 工單 W-03 燙金（外包）           → 工單已交付
```

### 工單 W-01：印刷 + 上光（自有工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-01 |
| type | 大貨 |
| target_quantity | 2100（含 5% 耗損） |
| quantity_per_print_item | 1 |
| status | 製作中 |
| assigned_to | 陳志明（印務甲）|

```
任務 T1（自有工廠）
  factory_type: 自有
  status: 製作中
  │
  ├─ PT-01 正面五色印刷
  │   affects_product: TRUE
  │   quantity_per_work_order: 2100
  │   assigned_operator: 張師傅
  │   planned_equipment: 海德堡 XL106 (#1)
  │   actual_equipment: 海德堡 XL106 (#1)
  │   scheduled_date: 2026-04-01
  │   estimated_duration_days: 2
  │   planned_end_date: 2026-04-02
  │   status: 已完成
  │   completed_quantity: 2150
  │   qc_passed_qty: 2100
  │   qc_failed_qty: 50
  │
  ├─ PT-02 背面單色印刷
  │   affects_product: TRUE
  │   quantity_per_work_order: 2100
  │   assigned_operator: 張師傅
  │   planned_equipment: 海德堡 XL106 (#1)
  │   actual_equipment: 海德堡 XL106 (#1)
  │   scheduled_date: 2026-04-03
  │   estimated_duration_days: 1
  │   planned_end_date: 2026-04-03
  │   status: 製作中                ← Demo 當下正在做
  │   completed_quantity: 1200      ← 師傅已報工 1200 張
  │   qc_passed_qty: 0             （尚未送 QC）
  │   qc_failed_qty: 0
  │
  └─ PT-03 UV 上光
      affects_product: TRUE
      quantity_per_work_order: 2100
      assigned_operator: 李師傅
      planned_equipment: UV 上光機 (#3)
      scheduled_date: 2026-04-05
      estimated_duration_days: 1
      planned_end_date: 2026-04-05
      status: 待處理                ← 等背面印刷完成
      completed_quantity: 0
      qc_passed_qty: 0
```

### 工單 W-02：模切（外包工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-02 |
| type | 大貨 |
| target_quantity | 2050 |
| quantity_per_print_item | 1 |
| status | 工單已交付 |
| assigned_to | 林建宏（印務乙）|

```
任務 T2（外包：精裁模切有限公司）
  factory_type: 外包
  status: 已交付
  │
  └─ PT-04 盒身模切
      affects_product: TRUE
      quantity_per_work_order: 2050
      assigned_factory: 精裁模切有限公司
      scheduled_date: 2026-04-07
      estimated_duration_days: 3
      planned_end_date: 2026-04-09
      status: 待處理              ← 等印刷+上光完成才外發
      completed_quantity: 0
      qc_passed_qty: 0
```

### 工單 W-03：燙金（外包工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-03 |
| type | 大貨 |
| target_quantity | 2050 |
| quantity_per_print_item | 1 |
| status | 工單已交付 |
| assigned_to | 陳志明（印務甲）|

```
任務 T3（外包：金輝燙金加工廠）
  factory_type: 外包
  status: 已交付
  │
  └─ PT-05 Logo 燙金
      affects_product: TRUE
      quantity_per_work_order: 2050
      assigned_factory: 金輝燙金加工廠
      scheduled_date: 2026-04-10
      estimated_duration_days: 2
      planned_end_date: 2026-04-11
      status: 待處理              ← 等模切完成才外發
      completed_quantity: 0
      qc_passed_qty: 0
```

### 完成度計算（04/03 時間切面）

```
工單 W-01（印刷+上光）：
  PT-01: floor(2100 / 2100) = 1
  PT-02: floor(0 / 2100)    = 0  ← 尚未 QC
  PT-03: floor(0 / 2100)    = 0  ← 尚未開工
  任務 T1 = min(1, 0, 0)    = 0  ← 齊套性：三道工序都要完成
  工單完成數 = 0

工單 W-02（模切）：
  PT-04: floor(0 / 2050)    = 0
  工單完成數 = 0

工單 W-03（燙金）：
  PT-05: floor(0 / 2050)    = 0
  工單完成數 = 0

印件 B 完成數：
  min(W-01=0/1, W-02=0/1, W-03=0/1) = 0
  → 0 / 2000（0%）
```

---

## 8. 印件 C — 禮盒盒蓋（大貨）

| 欄位 | 值 |
|------|-----|
| type | 大貨 |
| qty | 2000 |
| review_status | 合格 |
| production_status | 製作中 |

### 工單 W-04：印刷 + 壓紋（自有工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-04 |
| type | 大貨 |
| target_quantity | 2100 |
| quantity_per_print_item | 1 |
| status | 製作中 |
| assigned_to | 陳志明 |

```
任務 T4（自有工廠）
  factory_type: 自有
  status: 製作中
  │
  ├─ PT-06 四色印刷
  │   affects_product: TRUE
  │   quantity_per_work_order: 2100
  │   assigned_operator: 王師傅
  │   planned_equipment: 小森 GL40 (#2)
  │   actual_equipment: 小森 GL40 (#2)
  │   scheduled_date: 2026-04-01
  │   estimated_duration_days: 2
  │   planned_end_date: 2026-04-02
  │   status: 已完成
  │   completed_quantity: 2200
  │   qc_passed_qty: 2100
  │   qc_failed_qty: 100
  │
  └─ PT-07 壓紋加工
      affects_product: TRUE
      quantity_per_work_order: 2100
      assigned_operator: 李師傅
      planned_equipment: 壓紋機 (#5)
      actual_equipment: 壓紋機 (#5)
      scheduled_date: 2026-04-03
      estimated_duration_days: 2
      planned_end_date: 2026-04-04
      status: 製作中              ← Demo 當下正在做
      completed_quantity: 800
      qc_passed_qty: 0           （尚未送 QC）
```

### 完成度計算（04/03）

```
PT-06: floor(2100 / 2100) = 1
PT-07: floor(0 / 2100)    = 0
任務 T4 = min(1, 0)       = 0
印件 C 完成數 = 0 / 2000（0%）
```

---

## 9. 印件 D3 — 腰封（大貨）

| 欄位 | 值 |
|------|-----|
| type | 大貨 |
| qty | 2000 |
| review_status | 合格 |
| production_status | 工單已交付 |

### 工單 W-05：印刷 + 裁切（自有工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-05 |
| type | 大貨 |
| target_quantity | 2100 |
| quantity_per_print_item | 1 |
| status | 工單已交付 |
| assigned_to | 林建宏 |

```
任務 T5（自有工廠）
  factory_type: 自有
  status: 已交付                 ← 生管尚未排入日程
  │
  ├─ PT-08 雙色印刷
  │   affects_product: TRUE
  │   quantity_per_work_order: 2100
  │   assigned_operator: （待指派）
  │   planned_equipment: （待排程）
  │   status: 待處理
  │   completed_quantity: 0
  │
  └─ PT-09 裁切
      affects_product: TRUE
      quantity_per_work_order: 2050
      assigned_operator: （待指派）
      planned_equipment: （待排程）
      status: 待處理
      completed_quantity: 0
```

---

## 10. 印件 E — 小卡（大貨）

| 欄位 | 值 |
|------|-----|
| type | 大貨 |
| qty | 2000 |
| review_status | 合格 |
| production_status | 工單已交付 |

### 工單 W-06：數位印刷（自有工廠）

| 欄位 | 值 |
|------|-----|
| work_order_no | W-20260401-06 |
| type | 大貨 |
| target_quantity | 2100 |
| quantity_per_print_item | 1 |
| status | 工單已交付 |
| assigned_to | 林建宏 |

```
任務 T6（自有工廠）
  factory_type: 自有
  status: 已交付                 ← 生管尚未排入日程
  │
  └─ PT-10 彩色數位印刷
      affects_product: TRUE
      quantity_per_work_order: 2100
      assigned_operator: （待指派）
      planned_equipment: （待排程）
      status: 待處理
      completed_quantity: 0
```

---

## 11. 補生產情境（時間推進到 04/04）

### 場景

PT-02 背面印刷完成後 QC 發現 300 張套色偏移，需補印。
PT-02 維持「製作中」，師傅繼續報工，QC 建新紀錄累計。

### 時間軸

| 日期 | 事件 | completed_qty | qc_passed | qc_failed |
|------|------|---------------|-----------|-----------|
| 04/03 | 張師傅報工 2100 張 | 2100 | 0 | 0 |
| 04/04 AM | QC-01 檢驗 2100 張 | 2100 | 1800 | 300 |
| 04/04 PM | 張師傅補印報工 300 張 | **2400** | 1800 | 300 |
| 04/05 | QC-02 檢驗 300 張 | 2400 | **2100** | 300 |

### PT-02 最終數據

| 欄位 | 值 | 說明 |
|------|-----|------|
| completed_quantity | 2400 | 總製作數（含補印），追蹤實際產量 |
| qc_passed_qty | 2100 | QC 通過累計（1800 + 300） |
| qc_failed_qty | 300 | QC 不良累計 |
| 良率 | 87.5% | = 2100 / 2400 |
| 齊套性 ratio | 1 | = floor(2100 / 2100) |

### QC 紀錄

| QC 單 | 檢驗日期 | 檢驗數 | 通過 | 不良 | 不良原因 |
|--------|---------|--------|------|------|---------|
| QC-01 | 04/04 | 2100 | 1800 | 300 | 套色偏移 |
| QC-02 | 04/05 | 300 | 300 | 0 | — |

### 設計要點

- PT 不關閉，師傅繼續在原 PT 報工
- `completed_quantity`（報工累計）與 `qc_passed_qty`（QC 通過累計）分開追蹤
- 良率 = qc_passed / completed_quantity，可追蹤每個 PT 的品質表現
- 不走異動流程、不新建 PT
- QC 紀錄保留多筆，可追溯每批檢驗結果

---

## 12. 角色 Demo 視角

### 印務主管（周經理）

| 場景 | 操作 | 展示重點 |
|------|------|---------|
| 需求單評估 | 查看 RQ-20260325-01 → 填寫成本評估 | 紙材+工序+外包分項報價 |
| 工單審核 | 審核 W-01 製程（盒身五色，含特殊金色） | 確認色數、用紙、後加工合理性 |
| 打樣 NG 處理 | 審查第二輪打樣工單 W-S02 的調色方案 | 製程調整是否合理 |
| 全局進度 | 查看訂單下所有印件的 production_status + sample_result | 一眼掌握進度全貌 |

### 印務（陳志明、林建宏）

| 場景 | 操作 | 展示重點 |
|------|------|---------|
| 建工單 | 拆解印件 B 為 W-01/W-02/W-03 | 依工序 + 工廠類型拆分 |
| 建生產任務 | W-01 下建 PT-01/02/03 | 設定 qty_per_wo、affects_product |
| 填製程 | W-01 填用紙規格、色數、上光方式 | 製程細節完整性 |
| 交付任務 | W-01 狀態推進至「工單已交付」 | 通知生管可開始排程 |
| 打樣重打 | 在印件 A1 下建第二輪工單 W-S02 | 同印件多工單機制 |

### 生管（蔡小涵）

**日程面板（設備 x 日期甘特圖）**：

```
          04/01    04/02    04/03    04/04    04/05    04/06    04/07~09  04/10~11
海德堡    ████████████████ ████████                            
XL106 #1  PT-01 正面印刷   PT-02 背面                         
          張師傅            張師傅                              

小森      ████████████████                                     
GL40 #2   PT-06 盒蓋印刷                                      
          王師傅                                               

UV上光機                             ████████                  
#3                                   PT-03 上光                
                                     李師傅                    

壓紋機                      ████████████████                   
#5                          PT-07 盒蓋壓紋                     
                            李師傅                             

外包                                                  ████████████████  ████████████
                                                      PT-04 模切         PT-05 燙金
                                                      精裁模切           金輝燙金

[待排入] PT-08 腰封印刷、PT-09 腰封裁切、PT-10 小卡印刷 → 等設備空出
```

| 場景 | 操作 | 展示重點 |
|------|------|---------|
| 排程 | 收到已交付任務 → 排入日程面板 | 設備 x 日期視覺化 |
| 派工 | 指派師傅 + 設備 | 師傅技能 x 設備配對 |
| 外包追蹤 | 追蹤模切（04/07）、燙金（04/10）| 外包進度可視化 |
| 待排入管理 | 腰封、小卡等待設備空出 | 排程佇列管理 |

### 師傅

**張師傅 — 海德堡 XL106（04/03 視角）**：

| 區塊 | 內容 |
|------|------|
| 今日任務 | PT-02 背面單色印刷（禮盒盒身）/ 目標 2100 / 已報工 1200 / [報工] |
| 明日預覽 | （無排定任務）|
| 近期完成 | PT-01 正面五色印刷 — 已完成 / 報工 2150 / QC 通過 2100、不良 50 |

**王師傅 — 小森 GL40（04/03 視角）**：

| 區塊 | 內容 |
|------|------|
| 今日任務 | （無，盒蓋印刷已於 04/02 完成）|
| 明日預覽 | （無排定任務）|
| 近期完成 | PT-06 四色印刷（禮盒盒蓋）— 已完成 / 報工 2200 / QC 通過 2100、不良 100 |

**李師傅 — UV 上光機 / 壓紋機（04/03 視角）**：

| 區塊 | 內容 |
|------|------|
| 今日任務 | PT-07 壓紋加工（禮盒盒蓋）/ 目標 2100 / 已報工 800 / [報工] |
| 明日預覽 | PT-07 壓紋加工（續）|
| 近期完成 | （無）|

---

## 13. 設備清單

| 設備 | 編號 | 類型 | 用途 | 每日可用時數 |
|------|------|------|------|------------|
| 海德堡 XL106 | #1 | 平版印刷機 | 大幅面多色印刷 | 8h |
| 小森 GL40 | #2 | 平版印刷機 | 中幅面印刷 | 8h |
| UV 上光機 | #3 | 後加工設備 | UV / 水性上光 | 8h |
| 壓紋機 | #5 | 後加工設備 | 紋理壓印 | 8h |

---

## 14. 人員清單

| 角色 | 姓名 | 負責範圍 |
|------|------|---------|
| 業務 | 王大明 | 接單、客戶溝通、打樣結果確認（sample_result）|
| 印務主管 | 周經理 | 需求單成本評估、工單製程審核 |
| 印務 | 陳志明（甲）| 印件 B 工單 W-01/W-03、打樣工單 W-S01/S02/S04 |
| 印務 | 林建宏（乙）| 印件 B 工單 W-02、印件 D3 工單 W-05、印件 E 工單 W-06 |
| 生管 | 蔡小涵 | 排程、派工、外包追蹤 |
| 師傅 | 張師傅 | 海德堡 XL106 操機（PT-01, PT-02, PT-S01, PT-S02）|
| 師傅 | 王師傅 | 小森 GL40 操機（PT-06, PT-S03, PT-S04）|
| 師傅 | 李師傅 | UV 上光機 / 壓紋機（PT-03, PT-07）|
| QC | 黃品管 | QC 檢驗（全部 QC 單）|

---

## 15. 全訂單狀態快照（04/03 時間切面）

```
ORD-20260328-01（製作中）
├─ A1 盒身打樣    : 製作完成  sample_result=OK     [2 工單，第一輪 NG 第二輪 OK]
├─ B  盒身大貨    : 製作中    完成度 0/2000        [W-01 製作中, W-02/03 已交付]
├─ C  盒蓋大貨    : 製作中    完成度 0/2000        [W-04 製作中]
├─ D1 腰封打樣    : 已棄用    sample_result=NG-稿件 [1 工單，棄用]
├─ D2 腰封打樣    : 製作完成  sample_result=OK     [1 工單，OK]
├─ D3 腰封大貨    : 工單已交付 完成度 0/2000       [W-05 待排程]
└─ E  小卡大貨    : 工單已交付 完成度 0/2000       [W-06 待排程]
```
