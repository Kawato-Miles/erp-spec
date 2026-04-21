# 7 筆情境驅動需求單標準設定（demo-intent.md）

**狀態**：草擬版 v2.0（依 Miles 2026-04-20 第二輪決策調整）
**草擬者**：Claude
**審核者**：Miles（待確認）
**用途**：本 change 新 `mockQuotes.ts` 及對應 Order / 印件 / ReviewRound mock 的資料來源規格。一次性文件。

---

## 設計原則（v2.0）

1. **資料鏈必須連續**（Miles 2026-04-20 澄清）：
   - 不能有「訂單但沒需求單」、「印件但沒訂單」這種斷鏈
   - 允許 mock 預載到情境中間階段（例：審稿不合格、待 QC），前提是從 Quote 到該階段的所有 FK 完整
2. **需求單為資料鏈源頭**：每筆 mock 必從一筆 Quote 開始；若該情境需要更後的起點，Quote 之後的衍生實體同步 mock
3. **難易度 `difficultyLevel` 統一填 1 或 5**（Miles 指示）
4. **`assignedSales: '王大明'` / `assignedProductionManager: '周經理'`**（簡化命名）
5. **時間統一設定 `createdAt: '2026-04-15'`，`expectedDeliveryDate: '2026-05-15'`**
6. **每筆 Quote 只含情境驗證所需的最小印件數**
7. **類型 F（審稿員離職情境）已移除**（Miles 2026-04-20 決策：情境 14 不做）
8. **EC 檔案上傳限制**（Miles 澄清）：B2C 客戶上傳稿件無 EC Demo 可模擬，必須依賴假檔案資料跳過上傳驗證

---

## 七筆需求單標準

### Q1：典光生醫 產品宣傳摺頁（類型 A — 基礎打樣+大貨，Quote 起點）

**涵蓋情境**：1（線下全流程，P0）

**預載狀態**：無（從 Quote 開始走）

**Quote 設定**：
- `quoteNo: 'Q-20260415-01'`
- `caseName: '典光生醫 產品宣傳摺頁'`
- `client: '典光生醫股份有限公司'`
- `status: '成交'`, `linkedOrderId: null`

**印件**（1）：
```
itemName: '產品宣傳摺頁'
specNotes: 'A4 對摺 / 銅版 150g / 雙面四色 / 需打樣'
orderedQty: 300, unit: '份'
expectedProductionLines: ['印刷線']
difficultyLevel: 5, skipReview: false
pricePerUnit: 50, costEstimate: 12000
```

---

### Q2：晶華禮品 中秋禮盒（類型 B — 複雜多工單，Quote 起點）

**涵蓋情境**：2（一印件多工單，P0）

**預載狀態**：無

**Quote 設定**：
- `quoteNo: 'Q-20260415-02'`
- `caseName: '晶華禮品 中秋禮盒盒身'`
- `client: '晶華禮品有限公司'`
- `status: '成交'`, `linkedOrderId: null`

**印件**（1，需多工單）：
```
itemName: '中秋禮盒盒身'
specNotes: '30×20×8cm / 灰銅卡 350g / 雙面霧膜 + 五色 / 燙金 + 壓紋 + 模切 + 外包裱褙'
orderedQty: 500, unit: '組'
expectedProductionLines: ['印刷線', '後加工線', '裝訂線', '外包']
difficultyLevel: 5, skipReview: false
pricePerUnit: 300, costEstimate: 85000
```

---

### Q3：台達電子 年度型錄（類型 C — 高量，預載至待 QC 階段）

**涵蓋情境**：10（QC 不通過 → 補 PT，P0）、11（分批出貨，P1）

**預載狀態**：資料鏈已建立到「製作中待 QC」
- Quote → Order（狀態：製作中）→ 1 個大貨印件 → 1 張大貨工單 → 1 個任務 → 1 個生產任務（狀態：製作中）→ 多筆 WorkReport（已報工達標 2000 本）
- 尚未建立 QCRecord（由 UAT 者手動建 QC 並選通過 / 不通過）

**預載目的**：
- 情境 10 (P0)：UAT 者建 QC → 填不通過 → 觸發補生產任務 + 任務異動
- 情境 11 (P1)：UAT 者建多筆 QC 批次 → 分批出貨

**Quote 設定**：
- `quoteNo: 'Q-20260415-03'`
- `caseName: '台達電子 2026 年度產品型錄'`
- `client: '台達電子工業股份有限公司'`
- `status: '成交'`, `linkedOrderId: 'ORD-20260415-01'`

**印件**（1 大貨，跳過打樣）：
```
itemName: '2026 年度產品型錄'
specNotes: 'A4 / 封面 250g 銅版 + 霧膜 / 內頁 100g 道林 40P / 雙面四色 + 騎馬釘 / 直接大貨'
orderedQty: 2000, unit: '本'
expectedProductionLines: ['印刷線', '裝訂線']
difficultyLevel: 5, skipReview: false
pricePerUnit: 95, costEstimate: 140000
```

**對應 Order mock**：
- `orderNo: 'ORD-20260415-01'`, `linkedQuoteId: 'Q-20260415-03'`, `status: '製作中'`
- 1 筆 `OrderPrintItem` 從 Quote 繼承（`sourceItemNo: 1`）
- 1 筆 `WorkOrder`（大貨，status: '製作中'）
- 報工紀錄：`reportedQuantity` 加總 = 2000（已達標）
- PT status: '製作中'（未設 qcPassedQty，留待 UAT 操作）

---

### Q4：奈米新創 品牌識別套組（類型 D — B2B 補件，預載至首審不合格）

**涵蓋情境**：12（B2B 印件一次補件後通過，P0）

**預載狀態**：資料鏈已建立到「首審不合格」
- Quote → Order（狀態：等待審稿）→ 1 個印件（reviewStatus: '不合格', currentRoundId 指向 round 1）
- ReviewRound 1：不合格，含拒絕理由「完稿出血不足」

**預載目的**：UAT 者看到印件「不合格」→ 觸發補件 flow（上傳新檔案 → round 2 審稿合格）

**Quote 設定**：
- `quoteNo: 'Q-20260415-04'`
- `caseName: '奈米新創 品牌識別名片＋信封'`
- `client: '奈米新創股份有限公司'`
- `status: '成交'`, `linkedOrderId: 'ORD-20260415-02'`

**印件**（1）：
```
itemName: '名片＋信封套組'
specNotes: '名片 9×5.4cm / 300g 象牙卡 / 四色雙面 + 霧膜 / 信封 11×22cm / 100g 米色牛皮 / 單色'
orderedQty: 500, unit: '套'
expectedProductionLines: ['印刷線']
difficultyLevel: 5, skipReview: false
pricePerUnit: 30, costEstimate: 6000
```

**對應 Order mock**：
- `orderNo: 'ORD-20260415-02'`, `orderType: '線下單'`, `status: '等待審稿'`
- 1 筆 OrderPrintItem：`reviewStatus: '不合格'`, `currentRoundId: '...r1'`
- `reviewRounds[0]`：`round_no: 1`, `status: 不合格`, `rejectReason: '完稿出血不足'`, 含上傳檔案假資料
- `reviewFiles` 對應 round 1 檔案

---

### Q5：客製婚禮邀請卡（類型 E — B2C 補件，預載至首審不合格）

**涵蓋情境**：13（B2C 印件多次補件後通過，P0）

**預載狀態**：資料鏈已建立到「首審不合格」+ 客戶已補一次件尚待審（round 2 審稿中）
- Quote → Order（線上單EC，狀態：等待審稿）→ 1 個印件（currentRoundId 指向 round 2）
- ReviewRound 1：不合格（出血不足）
- ReviewRound 2：審稿中（客戶已補件）

**預載目的**：
- UAT 者在 round 2 選合格或再次不合格
- 若再次不合格，可觸發 round 3 補件 flow（多輪驗證）
- 依賴假檔案資料跳過「客戶 EC 上傳」（Miles 澄清：無 EC Demo 可模擬）

**Quote 設定**：
- `quoteNo: 'Q-20260415-05'`
- `caseName: '客製婚禮邀請卡（EC 訂單）'`
- `client: '個人客戶-陳小姐'`
- `status: '成交'`, `linkedOrderId: 'ORD-20260415-03'`

**印件**（1，B2C）：
```
itemName: '婚禮邀請卡'
specNotes: '10×15cm / 250g 珠光卡 + 燙金 / 四色 + 單面霧膜 / 客戶自助設計'
orderedQty: 200, unit: '張'
expectedProductionLines: ['數位印刷線']
difficultyLevel: 1, skipReview: false
pricePerUnit: 20, costEstimate: 2400
```

**對應 Order mock**：
- `orderNo: 'ORD-20260415-03'`, `orderType: '線上單EC'`, `status: '等待審稿'`
- 1 筆 OrderPrintItem：`orderSource: 'B2C'`, `currentRoundId: '...r2'`
- `reviewRounds[0]`：round 1 不合格（出血不足）
- `reviewRounds[1]`：round 2 審稿中（客戶補件檔案假資料）
- 2 組 `reviewFiles`（round 1 + round 2）

---

### Q6：常青醫材 快速補單-產品標籤（類型 G — 免審稿，Quote 起點）

**涵蓋情境**：15（免審稿印件不進入審稿，P0）

**預載狀態**：無（從 Quote 開始走）

**Quote 設定**：
- `quoteNo: 'Q-20260415-06'`
- `caseName: '常青醫材 產品標籤快速補單'`
- `client: '常青醫材股份有限公司'`
- `status: '成交'`, `linkedOrderId: null`

**印件**（1，免審稿）：
```
itemName: '產品警示標籤'
specNotes: '5×3cm / 白色合成紙 / 單色 / 規格與上次訂單相同 / 客戶已提供完稿'
orderedQty: 5000, unit: '張'
expectedProductionLines: ['數位印刷線']
difficultyLevel: 1, skipReview: true
pricePerUnit: 1.5, costEstimate: 3000
```

**特殊**：`skipReview: true` 觸發免審稿快速路徑（狀態機 spec § 免審稿快速路徑）

---

### Q7：漢城屋 春季海報（類型 H — 預載至打樣工單完成階段）

**涵蓋情境**：3（打樣 NG 製程，P1）、4（打樣 NG 稿件，P1）、5（製程審核通過退回，P1）、6（工單收回，P1）

**預載狀態**：資料鏈已建立到「打樣工單已完成，待業務填打樣結果」
- Quote → Order（狀態：製作中）→ 1 個印件（審稿合格）→ 1 張打樣工單（status: '已完成'）→ 1 個任務 → 1 個生產任務（'已完成'）→ 完整報工 + QC
- 尚未填打樣結果（`sampleResult: '待確認'`）

**預載目的**：
- 情境 3：UAT 者填 `sampleResult: 'NG-製程問題'` → 同印件建新打樣工單
- 情境 4：UAT 者填 `sampleResult: 'NG-稿件問題'` → 系統建新打樣印件
- 情境 5：從 Q1 出發建新打樣工單的過程中驗證（本 mock 的重建工單動作會觸發製程審核）
- 情境 6：類似情境 5 路徑中驗證工單收回

**Quote 設定**：
- `quoteNo: 'Q-20260415-07'`
- `caseName: '漢城屋 春季海報'`
- `client: '漢城屋餐飲集團'`
- `status: '成交'`, `linkedOrderId: 'ORD-20260415-04'`

**印件**（1）：
```
itemName: '春季活動海報'
specNotes: 'B2（51.5×72.8cm） / 銅版紙 150g / 單面四色 / 需打樣'
orderedQty: 800, unit: '張'
expectedProductionLines: ['印刷線']
difficultyLevel: 5, skipReview: false
pricePerUnit: 35, costEstimate: 28000
```

**對應 Order / WO / 報工 mock**：
- Order `ORD-20260415-04`, status: '製作中', 1 印件（reviewStatus: '合格'）
- 打樣工單 `W-...-01`, type: '打樣', status: '已完成'
- 1 個 Task + 1 個 PT, status: '已完成'
- WorkReport 達標 + QC 通過
- `sampleResult: '待確認'`（UAT 者會填此欄位觸發不同路徑）

---

## 情境覆蓋矩陣（v2.0）

| 情境 | 對應 Q | 預載狀態 | 分級 |
|------|-------|---------|------|
| 1 線下訂單全流程 | Q1 | 無（Quote 起點）| P0 |
| 2 一印件多工單 | Q2 | 無（Quote 起點）| P0 |
| 3 打樣 NG 製程 | Q7 | 打樣工單已完成待填結果 | P1 |
| 4 打樣 NG 稿件 | Q7 | 同上 | P1 |
| 5 製程審核通過退回 | Q7 | 同上（重建工單過程中）| P1 |
| 6 工單收回 | Q7 | 同上 | P1 |
| 7 工單異動跨廠 | — | P2（另立 change）| P2 |
| 8 任務層級作廢無 QC | — | P2 | P2 |
| 9 任務層級作廢有 QC | — | P2 | P2 |
| 10 QC 不通過補 PT | Q3 | 製作中待 QC | **P0**（Miles 升級）|
| 11 分批出貨 | Q3 | 製作中待 QC | P1 |
| 12 B2B 補件 | Q4 | 首審不合格 | P0 |
| 13 B2C 多輪補件 | Q5 | 首審不合格 + round 2 審稿中 | P0 |
| 14 審稿員離職 | — | 不做（Miles 決策）| **移除** |
| 15 免審稿 | Q6 | 無（Quote 起點）| P0 |

**P0 共 6 項**：1, 2, 10, 12, 13, 15（本 change 必完成）
**P1 共 5 項**：3, 4, 5, 6, 11（本 change 能做就做，但不列為 spec 契約）
**P2 共 3 項**：7, 8, 9（另立 change）
**移除**：14（Miles 指示不做）

---

## Master Data 依賴盤點

| 需求資料 | 來源 | 本 change 是否需補 |
|---------|------|-----------------|
| 審稿員（`PREPRESS_REVIEWERS`）| `mockPrepressReview.ts` | 確認至少 1 位 active 審稿員可接 Q4/Q5/Q7 |
| 師傅（`mockWorkers`）| `mockDispatch.ts` | 確認至少 1 位師傅 |
| 設備（`mockEquipmentList`）| `mockDispatch.ts` | 確認至少 1 台設備 |
| 產線清單 | 若有配置 | 確認 `印刷線` / `後加工線` / `裝訂線` / `外包` / `數位印刷線` 支援 |
| 客戶（customer master）| 目前為 Quote 字串欄位 | 本 change 維持字串，OQ 記錄 |
| 紙材 / 工序 / 裝訂 BOM | `bomMasterMock.ts` | 不影響 mock 建立 |

---

## 待 Miles 確認事項

1. 7 筆需求單的 caseName / client 是否符合印刷業語感？可自行調整
2. 產線用語「印刷線 / 後加工線 / 裝訂線 / 外包 / 數位印刷線」是否為現有系統使用的一致用語？
3. Q3 / Q4 / Q5 / Q7 的預載資料範圍（Order / WO / 印件 / ReviewRound / Report / QC）是否同意如此構造？
4. `PREPRESS_REVIEWERS` 既有清單是否有至少 1 位 active 審稿員可接情境 12/13/7？若無需補
5. Customer master 目前以字串處理是否接受？若未來要關聯到 customer 資料表，另立 change
