## 1. 規格更新（main specs）

- [x] 1.1 更新 production-task spec Data Model：production_line_id 從選填改為必填（唯讀，BOM 帶入）
- [x] 1.2 更新 production-task spec「產線支援」Requirement：反映 BOM 帶入邏輯、唯讀、外包產線歸屬
- [x] 1.3 更新 production-task spec「生管日程執行面板」Requirement：新增篩選器偏好記憶行為
- [x] 1.4 更新 work-order spec「工單草稿建立」Requirement：BOM 展開時帶入 production_line_id
- [x] 1.5 更新 user-roles spec：印務角色移除產線指定權限，production_line_id 改為唯讀

## 2. Prototype 資料模型調整

- [x] 2.1 確認 ProductionTask 型別定義中 production_line_id 改為必填
- [ ] 2.2 確認 mock data 中所有生產任務均有 production_line_id（覆蓋率 100%）
- [ ] 2.3 新增「外包廠」與「中國廠商」兩條產線至 ProductionLine mock data
- [ ] 2.4 外包廠的 mock 生產任務指向「外包廠」產線，中國廠商指向「中國廠商」產線

## 3. 日程面板 Prototype 調整

- [ ] 3.1 日程面板篩選器：新增 localStorage 偏好記憶（記住上次選擇的產線）
- [ ] 3.2 日程面板開啟時自動套用上次產線篩選
- [ ] 3.3 驗證篩選器套用到所有四個功能區（待分派、進行中、即將到來、異動確認）
- [ ] 3.4 驗證清除篩選後顯示所有產線任務

## 4. 工單詳情頁調整

- [ ] 4.1 生產任務列表中 production_line_id 顯示為唯讀（移除手動選擇下拉選單）
- [ ] 4.2 顯示產線名稱（而非 ID）於生產任務行

## 5. 驗證

- [ ] 5.1 驗證場景：BOM 展開後生產任務自動帶入正確產線
- [ ] 5.2 驗證場景：外包廠任務歸入「外包廠」產線，中國廠商任務歸入「中國廠商」產線
- [ ] 5.3 驗證場景：生管篩選產線後，四個功能區均正確篩選
- [ ] 5.4 驗證場景：關閉再開啟日程面板，篩選偏好正確恢復
- [ ] 5.5 驗證場景：production_line_id 空值率 = 0%（所有 mock 任務均有產線）
