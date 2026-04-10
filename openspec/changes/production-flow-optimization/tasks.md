## 1. Data Model 更新（OpenSpec main specs）

- [x] 1.1 work-order spec: WorkOrder 資料表新增 region 欄位（單選：台灣/中國，必填，唯讀）
- [x] 1.2 production-task spec: Task 與 ProductionTask 的 factory_type 擴充為四值（新增「中國廠商」）
- [x] 1.3 production-task spec: 新增 ProductionLine 資料表（id, name）
- [x] 1.4 production-task spec: ProductionTask 新增 production_line_id（FK, 選填）與 sort_order（整數，必填）
- [x] 1.5 production-task spec: 新增 Process 資料表定義（id, name, category）
- [x] 1.6 order-management spec: Order 新增 case_name 欄位
- [x] 1.7 order-management spec: PrintItem 新增 thumbnail_url 欄位
- [x] 1.8 order-management spec: PrintItemFile 新增 file_type 與 is_final 欄位

## 2. 業務規則更新（OpenSpec main specs）

- [x] 2.1 work-order spec: 新增「工單區域設定」Requirement（region 篩選 factory_type 規則）
- [x] 2.2 work-order spec: 修改「印務主管印件總覽」Requirement（案名/客戶/訂單獨立欄位、分配時設定 region）
- [x] 2.3 work-order spec: 新增「印務印件篩選」Requirement
- [x] 2.4 production-task spec: 修改「設備選擇與工廠指定」Requirement（加入 region 篩選規則）
- [x] 2.5 production-task spec: 修改「生管日程執行面板」Requirement（加入產線篩選器）
- [x] 2.6 production-task spec: 新增「產線管理」Requirement
- [x] 2.7 production-task spec: 新增「生產任務分類排序」Requirement
- [x] 2.8 production-task spec: 新增「生產任務詳情顯示稿件」Requirement
- [x] 2.9 order-management spec: 新增「印件成品縮圖上傳」Requirement
- [x] 2.10 business-processes spec: 修改「需求單轉訂單欄位帶入規則」（新增 title → case_name）
- [x] 2.11 state-machines spec: 修改「生產任務狀態機」（確認四值 factory_type 路徑覆蓋）
- [x] 2.12 user-roles spec: 修改「印務角色權限」（新增印件總覽篩選、產線指定、排序權限）

## 3. Prototype 驗證（sens-erp-prototype）

- [x] 3.1 工單建立表單：新增 region 選擇欄位，驗證 region 設定後 factory_type 篩選邏輯
- [x] 3.2 工單詳情頁：生產任務依 category（材料/工序/裝訂）分組顯示，支援分類內拖曳排序
- [x] 3.3 生管日程面板：新增產線篩選器下拉選單，驗證篩選後任務列表正確過濾
- [x] 3.4 印件總覽：拆分案名/客戶/訂單欄位為獨立顯示；新增「只顯示我參與的印件」篩選
- [x] 3.5 印件詳情頁：新增稿件檔案列表區塊與成品縮圖顯示
- [x] 3.6 生產任務詳情頁：新增稿件檔案與成品縮圖引用顯示
- [x] 3.7 Demo 假資料：建立跨區域（台灣+中國）工單情境、跨印務印件情境

## 4. 跨檔案一致性驗證

- [x] 4.1 確認 factory_type 四值在 state-machines、production-task、work-order spec 一致
- [x] 4.2 確認 region 篩選規則在 work-order 與 production-task spec 一致
- [x] 4.3 確認 case_name 帶入規則在 business-processes 與 order-management spec 一致
- [x] 4.4 確認 PrintItemFile 新增欄位在 order-management spec 與 production-task（稿件顯示）一致
- [x] 4.5 執行 doc-audit 檢查
