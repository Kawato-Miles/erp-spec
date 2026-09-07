# 任務清單

> 實作範圍：erp repo `/Users/b-f-03-029/erp`（apps/erp/src/app/(prototype)/work-orders/），MUST 經 repo 內 skill `prototype-from-prompt`；只動 (prototype)/ 目錄。

## 1. mock 主檔補備料層

- [ ] 1.1 `_lib/bom-master-mock.js`：新增 `MATERIAL_PREP_ENTRIES`（以 spec_id 索引；id／name／width_mm／height_mm／cutting_count／weight_entry_id）與 `getPrepEntriesBySpec`、`findPrepEntry`
- [ ] 1.2 每個按重量材料規格至少一筆與供應商原料同尺寸、開料數 1 的備料；一級卡 300g 另建「名片八開」393×272、開料數 8、指向四六全 787×1091
- [ ] 1.3 註解與命名：重量計價尺寸表列改稱「供應商原料」，「母版」字樣清零
- [ ] 1.4 材料規格名去尺寸（「300g 四六全」→「300g」），同步所有引用；撞名者列清單

## 2. BOM 面板與任務表單

- [ ] 2.1 `_lib/bom-picker-rows.js`：按重量材料一備料一列；欄位＝群組、材料、品牌、規格、備料、備料尺寸、開料數、供應商原料、牌價（主檔原字）、放損率；沒建備料的規格不出列；按面積、按數量維持現況
- [ ] 2.2 列 patch：`bom_ref` 補 `prep_entry_id`、保留 `weight_entry_id`（取備料所指供應商原料）；任務名稱＝材料名＋規格名＋備料名稱（不加「備料」）；委外成品維持品項名
- [ ] 2.3 `TaskFormDialog` 與任務詳情顯示欄名改「備料」「供應商原料」

## 3. 成本

- [ ] 3.1 `_lib/estimate-cost.js`：重量類材料費＝round(供應商原料單張價 × ceil(目標數量 ÷ 開料數))；缺 prep_entry_id 回 0
- [ ] 3.2 工序費、設備費不改；檔頭註解更新兩層命名與算式

## 4. 錨例 mock

- [ ] 4.1 `_lib/mock-data.js`：所有材料型任務 bom_ref 補 prep_entry_id、任務名改新公式、est_cost.material 重算
- [ ] 4.2 WO-2026-0908 名片：材料任務選「名片八開」、名稱「一級卡 300g 名片八開」、615／13／628、材料費 549；印刷任務 615／19／634 並重算成本；裁切 123／2／125 不變
- [ ] 4.3 `MOCK-DATA-CHAIN.md` 錨例訂單段同步數量、任務名、費用與換算句

## 5. 檢查

- [ ] 5.1 `__checks__/mock-consistency.check.mjs` 補：每筆材料型任務 prep_entry_id 存在、其 weight_entry_id 與 bom_ref.weight_entry_id 一致、同屬 material_spec_id
- [ ] 5.2 既有 `__checks__/*.mjs` 全通過；lint 通過；(prototype)/ 下 grep「母版」為零

## 6. 主對話稽核

- [ ] 6.1 對照 prototype-from-prompt skill 稽核 sub-agent 產出（grep hex／px／!important／createGlobalStyle；確認未動共用元件）
- [ ] 6.2 名片錨例算式核對：ceil(628 ÷ 8)＝79、79 × 6.95＝549
