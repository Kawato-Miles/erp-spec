---
type: raw
status: raw
created-at: 2026-09-22
source: claude-research
captured-by: claude-on-task
module:
  - 出貨
topic-tag:
  - 第三方物流
  - 出貨單
  - 托運單號
  - 物流狀態同步
related-vault:
  - "[[出貨單]]"
  - "[[出貨單狀態]]"
  - "[[出貨人員]]"
  - "[[SHP-020-ERP出貨單承接EC物流串接的狀態對映與拋單失敗處置]]"
raw-source-link: |
  /Users/b-f-03-029/sensation-api/api/models/logistics.py
  /Users/b-f-03-029/sensation-api/logistics/logistics.py
  /Users/b-f-03-029/sensation-api/logistics/tasks/track_logistics_orders.py
  /Users/b-f-03-029/sensation-api/sens_admin/v1/views/logistics_views.py
  /Users/b-f-03-029/sensation-api/sens_admin/v1/serializers/logistics_serializers.py
  /Users/b-f-03-029/sensation-api/api/managers/logistic.py
  /Users/b-f-03-029/sens-print-core/apps/ec/models/waybill.py
---

# sensation-api 物流模組現況（EC 後端第三方物流串接）

## 原始素材

調查方式：2026-09-22 由 sub-agent 唯讀爬 sensation-api 與 sens-print-core 兩個 Django 專案，只記程式碼查得到的事實。

### 正本位置

物流串接正本在 sensation-api 的 logistics 模組。sens-print-core 的 Waybill 是供應商（中國工廠）到台灣的貨運運費與到貨數量人工登打，物流商為自由文字、運單號人工填，無第三方 API、無狀態同步，與本卡主題無關。

### 資料模型（api/models/logistics.py）

一張訂單對多張物流單（外鍵 order）。

| 欄位群 | 內容 |
|--------|------|
| 物流狀態 LogisticsStatus | default／packaging／tallying／pending／transit／pickup／delivered／undelivered／notfound／exception／expired／cancelled |
| 拋單狀態 DispatchStatus | init／pending／processing／succeeded／failed |
| 第三方欄位 | tracking_number（追蹤單號）、logistics_no（物流商訂單編號）、data 與 tracking_data（原始回傳）、extra_data、store_id／name／address（超商門市）、first_printed_at（首次列印標籤）、transited_at（物流出貨時間） |
| 拋單紀錄表 LogisticsDispatches | 每次拋單的 request／response／result／status_code／message／exception |

### 運送方式（13 值）

| 值 | 中文 | 串接 |
|----|------|------|
| ezship | 台灣便利配 | 有，走 api/ezship，付款成功自動建單 |
| mailing | 郵局 | 查無 |
| self_pick | 自取 | 自送 |
| special_car | 專車配送 | 查無串接，推定自送 |
| tcat | 黑貓 | 查無 |
| kerry_tj | 嘉里大榮 | 查無 |
| maple | 宅配便利帶 | 查無 |
| hct | 新竹物流 | 有（SOAP） |
| sf | 順豐 | 有 |
| payuni | 統一超商 | 有 |
| xdelivery | 火箭快遞 | 有 |
| familymart | 全家日翊 | 有（API 加每日 FTP 檔案匯入） |
| stker_self_pick | 建鏵自取 | 自送 |

### 拋單

- 觸發：後台人員手按單筆（LogisticsDispatchView）或批次（LogisticsBatchDispatchView 轉 celery 任務）。無排程自動拋單。
- 前置檢核：該物流商功能啟用；物流單狀態不可為 cancelled。
- 成功：dispatch_status 轉 succeeded，logistics_status 轉 tallying（等待出貨），並觸發訂單狀態機。
- 失敗：dispatch_status 轉 failed，LogisticsDispatches 記失敗與錯誤內容。重拋等於再按一次拋單，會累加一筆拋單紀錄，無防重複拋單。
- 托運單號：五家皆由第三方回傳寫入，程式無人工填寫入口。

### 狀態流轉與出貨時間

| 事件 | 狀態變化 | 寫入欄位 |
|------|---------|---------|
| 拋單成功 | 轉 tallying | 拋單紀錄 |
| 列印標籤成功（狀態為 tallying 時） | 轉 pending | first_printed_at |
| 輪詢查得物流商回報運送中 | 轉 transit | transited_at（物流出貨時間，系統寫入） |
| 輪詢查得配達碼 | 轉 delivered | |
| 輪詢查得異常碼 | 轉 exception 或 undelivered | |

### 狀態同步

- 方式：每日 01:00 celery 排程輪詢（track_logistics_orders），撈 pending／transit／pickup／exception 且 21 天內首次列印的單，逐張呼叫各物流商查詢。
- 全家日翊另有每日 FTP 加密檔案匯入暫存表，輪詢時才比對暫存表更新狀態。
- 無即時回呼更新貨態；ship-map/callback 三支端點只處理超商選店回傳。
- 到店與取件有區分：全家 R28 店舖進貨為 pickup、R29 完成取件才是 delivered；統一 32 待取貨為 pickup、11 已取貨才是 delivered。
- 各物流商代碼對映表在 logistics/<物流商>/status_code.py、op_code.py、ship_status.py、status.py。

### 人工介入端點（sens_admin/v1/views/logistics_views.py）

| 端點 | 動作 | 前置限制 |
|------|------|---------|
| LogisticsDispatchView | 拋單 | 物流商啟用；非 cancelled |
| LogisticsPrintView | 列印標籤與出貨明細 PDF | 同上 |
| LogisticsDuplicateView | 複製為 1 到 30 張新單（重開單，不是重拋） | 無 |
| LogisticsCancelView | 作廢 | 只有 pending 或 tallying |
| LogisticsBatchDispatchView | 批次拋單 | 物流商啟用 |
| LogisticsBatchPrintView | 批次列印 | 拋單成功且物流商啟用 |

### 異常

拒收、退件、未取、配送失敗歸 exception 或 undelivered，由物流商代碼對映。異常狀態擋自動開票（api/logistics_invoice_rules.py），需人工介入。查無額度或庫存回補、自動退款邏輯。

### 查無清單

- 郵局、黑貓、嘉里大榮、宅配便利帶、專車配送的第三方 API 串接
- 物流商即時回呼驅動貨態更新
- 異常配送觸發的自動回補或退款
- 專屬重拋端點
- sens-print-core 內任何第三方物流 API 呼叫

## 與 ERP 出貨單設計的落差

已整理進 [[SHP-020-ERP出貨單承接EC物流串接的狀態對映與拋單失敗處置]] 問題描述的對照表，本卡不重述。
