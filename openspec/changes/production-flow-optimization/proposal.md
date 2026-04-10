## Why

生產流程在實務操作中面臨多項結構性問題：(1) 台灣與中國分廠生產缺乏工單層級的區域區分，導致生產任務無法依區域篩選可用工廠；(2) 生管缺乏產線概念，無法依產線分工與篩選任務；(3) 印務填寫生產任務時無法控制執行順序，且缺乏材料/工序/裝訂的分類視角；(4) 印務無法快速查看自己負責的印件全貌；(5) 印件與生產任務詳情缺乏稿件檔案與縮圖顯示；(6) 印件總覽中案名、客戶、訂單混合顯示，多訂單同印件名稱時容易混淆。

## What Changes

- **工單區域化**：WorkOrder 新增 `region`（台灣/中國），factory_type 擴充為四值（自有工廠/加工廠/外包廠/中國廠商），建立 region → factory_type 篩選規則
- **產線管理**：新增 ProductionLine 資料表，ProductionTask 新增 `production_line_id`，生管日程面板新增產線篩選
- **生產任務排序與分類**：Process 新增 `category`（材料/工序/裝訂），ProductionTask 新增 `sort_order`，支援分類內拖曳排序
- **印務印件篩選**：印件總覽新增「只顯示我參與的印件」篩選（判斷條件：印件下有 WorkOrder.assigned_to = 當前印務）
- **稿件與縮圖**：PrintItemFile 新增 `is_final`、`file_type`，PrintItem 新增 `thumbnail_url`（審稿人員獨立上傳），印件/生產任務詳情顯示稿件
- **印件總覽欄位拆分**：Order 新增 `case_name`（從需求單 title 帶入），印件總覽列表拆分為案名、客戶、訂單編號獨立欄位

## Capabilities

### New Capabilities

（無新增獨立模組）

### Modified Capabilities

- `work-order`：新增 region 欄位與區域篩選規則；新增印務印件篩選需求
- `production-task`：factory_type 擴充為四值；新增 ProductionLine 資料表與 production_line_id；新增 sort_order 與 Process.category；生產任務詳情顯示稿件
- `order-management`：Order 新增 case_name；PrintItemFile 新增 is_final/file_type；PrintItem 新增 thumbnail_url；印件總覽欄位拆分
- `state-machines`：確認 factory_type 四值的狀態路徑覆蓋（中國廠商路徑已存在，確認無需調整）
- `business-processes`：需求單轉訂單帶入規則新增 title → case_name
- `user-roles`：確認印務角色權限涵蓋印件總覽篩選

## Impact

- **Data Model**：跨 4 個 spec 的欄位新增與修改（WorkOrder、ProductionTask、Process、PrintItem、PrintItemFile、Order、新增 ProductionLine 資料表）
- **UI**：印件總覽列表欄位調整、生管日程面板產線篩選、生產任務拖曳排序、稿件顯示區塊
- **業務規則**：region → factory_type 篩選約束、sort_order 分類內排序約束
- **齊套性計算**：不受影響，仍以 WorkOrder → PrintItem 的 min() 計算
- **既有 OQ 關聯**：PT-001（工序合併）、XM-003（工廠產能優化合併規則）與本次變更不衝突但未來需協調；「材料計價方式」「裝訂功能」為外部待確認 OQ，不阻塞本次規格變更
