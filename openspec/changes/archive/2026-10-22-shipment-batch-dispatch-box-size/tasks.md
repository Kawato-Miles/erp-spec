## 1. 規格

- [x] 1.1 shipment delta spec 寫成（ADDED 兩條、MODIFIED 四條）；`openspec validate shipment-batch-dispatch-box-size --strict` 通過
- [x] 1.2 grep `openspec/specs/` 其他模組的衝突句（出貨單上沒有出貨動作、箱規只列本出貨方式、離廠後裝箱資料全部鎖住），確認 order-management、business-scenarios 無須改

## 2. 情境目錄（Sens `erp-prototype-tests/docs/scenario-catalog.md`）

依據 wiki〈出貨與送達〉主流程第 4、5 步與副流程「批次拋單部分失敗」「部分離廠後一箱被物流商拒收」「拋單逾時」，先補目錄節再寫測試。

- [x] 2.1 第十二章章首說明補一句：拋單方式可從出貨單批次拋單、箱規共用並記長寬高（設計依據 `memory/erp/plans/_archives/2026/shipment-batch-dispatch-box-size-20261022/design.md`）
- [x] 2.2 改寫 12.3、12.6、12.15、12.16、12.20、12.21、12.32、12.36、12.37（內容見下方測試影響清單）；各節「依據」行補 wiki 卡名與 grill 序號
- [x] 2.3 新增 12.41 批次拋單結果、12.42 批次拋單顯示與停用、12.43 拋單處理中與逾時、12.44 箱規共用與長寬高帶入、12.45 部分離廠後的裝箱回報修正與新增箱
- [x] 2.4 改寫 14.37（裝箱明細表加長、寬、高欄）、14.38（兩處列表改子母表、刪裝箱照片欄）

## 3. 測試先行（Sens `erp-prototype-tests/`，先紅後綠）

每條 delta 驗收條目至少對應一項測試；期望值取自 delta spec 的 THEN，不由實作重算。本節全部寫完後跑一次，確認新增與改寫的測試為紅。

- [x] 3.1 批次拋單結果：`tests/unit/qc-shipping/shipment-logistics.test.mjs` 加 12.41（驗收條目：批次拋單全部成功、批次拋單部分失敗、支援子母單的出貨單批次拋單只送一筆、出貨單異常時只送已裝箱的物流單、訂單已取消時部分離廠出貨單的批次拋單逐筆失敗）；`tests/e2e/12-shipping/shipping.spec.mjs` 加 12.41 畫面（全部成功、部分失敗）
- [x] 3.2 批次拋單顯示與停用：`tests/unit/qc-shipping/next-status-options.test.mjs` 加 12.42（驗收條目：批次拋單依出貨單狀態與出貨方式渲染、揀貨不符時批次拋單停用；另含異常且沒有已裝箱物流單時停用，取自「出貨單異常時只送已裝箱的物流單」末句）；`shipping.spec.mjs` 加 12.42（停用理由顯示）；改寫 12.15、12.16 的既有斷言（新竹物流出貨單列上有批次拋單、自取沒有）
- [x] 3.3 拋單處理中與逾時：`shipment-logistics.test.mjs` 與 `shipping.spec.mjs` 加 12.43（驗收條目：第三方拋單後物流單號與子單號由物流商回傳、拋單逾時視為失敗）；改寫 12.21、12.36 的錯誤訊息斷言為「處理中結束時顯示」（驗收條目：拋單失敗時物流單不推進、不設重試）
- [x] 3.4 箱規共用與長寬高：`tests/unit/qc-shipping/shipping-rules.test.mjs` 改寫箱規分組為共用十筆加自訂，加 12.44（驗收條目：箱規選單列全部箱規加自訂、選有尺寸的箱規時帶入並鎖住、選沒有尺寸的箱規時長寬高空白選填、選自訂時長寬高選填、修正時改箱規依帶入表重新帶入清空或保留）；`shipping.spec.mjs` 改寫 12.32、加 12.44
- [x] 3.5 部分離廠後修正與新增箱：`shipping-rules.test.mjs` 改寫 12.20「只限未出貨動作」為依項目判斷，加 12.45（驗收條目：未出貨動作期間裝箱回報修正留紀錄部分離廠後只開放部分項目、部分離廠後改被拒收那一箱的箱規再拋單、全數離廠後沒有裝箱回報修正、一筆成功一筆失敗即部分離廠、拋單先成功後裝箱回報修正以當下的可執行條件重新檢核）；`shipment-logistics.test.mjs` 加 12.45（驗收條目：部分離廠後把被拒收的一箱拆成兩箱）；`shipping.spec.mjs` 加 12.45 畫面
- [x] 3.6 出貨動作分流：`tests/unit/qc-shipping/shipment-draft.test.mjs` 改寫 12.6（驗收條目：出貨動作依出貨方式分流，只有拋單方式的出貨單有批次拋單）
- [x] 3.7 介面：`tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs` 改寫 14.37（裝箱明細表長、寬、高欄）、14.38（子母表展開物流單子表、兩處沒有裝箱照片欄）；12.3 的裝箱明細欄位斷言補長、寬、高（驗收條目：揀貨兩步推進並逐條、逐箱回報）
- [x] 3.8 跑 `npm run test:module -- tests/e2e/12-shipping` 與對應單元測試，確認 3.1～3.7 新增與改寫的條目為紅、其餘既有條目維持綠（紅燈確認只跑新增與改寫的 18 條畫面測試加全部單元測試；其餘既有條目的綠燈於第 5 節以整章驗證）

## 4. Mock 資料

- [x] 4.1 改 `(prototype)/MOCK-DATA-CHAIN.md`：箱規主檔改為 grill.md § 二的十筆共用資料（K1 箱長寬高留空），刪所屬出貨方式；鏈一 SH-2026-0601、SH-2026-0602 等樣本的裝箱資料改指向新箱規並補長寬高；補一張部分離廠樣本（7-11 交貨便 4 箱，第 3 筆被拒收）——部分離廠樣本不另造靜態資料（鏈一額度已歸零、鏈四尚未品檢），改由鏈四品檢通過後的動線產生，寫法見 MOCK-DATA-CHAIN「物流單拆分樣本」段
- [x] 4.2 改 `qc-shipping/_lib/mock-data.js` 對齊 4.1
- [x] 4.3 更新引用鏈編號與箱規名稱的既有測試（14.37 的「順豐標準箱 B」等）

## 5. Prototype 實作（erp repo 分支 `prototype/production-stage`，經 `prototype-from-prompt` skill）

- [x] 5.1 批次拋單：出貨單上的批次拋單入口（列表主層列、出貨單對話框物流單表格旁、訂單出貨單頁籤），依出貨單狀態顯示、揀貨不符與異常無已裝箱時停用並顯示理由，逐筆執行拋單並於結束時逐筆列結果；對應 3.1、3.2 轉綠
- [x] 5.2 拋單處理中與逾時：單筆與批次送出後顯示處理中、期間不能操作，逾時視為失敗；拒收與逾時的示意方式不得加示意箱規、不得呈現為依尺寸把關；對應 3.3 轉綠
- [x] 5.3 箱規共用加自訂、裝箱資料長寬高帶入與選填、修正紀錄記長寬高；對應 3.4 轉綠
- [x] 5.4 裝箱回報修正依項目開放、部分離廠時新增箱產生新物流單；對應 3.5 轉綠
- [x] 5.5 出貨單模組列表與訂單出貨單頁籤改子母表（子表為物流單），兩處刪裝箱照片欄；對應 3.6、3.7 轉綠
- [x] 5.6 每項完成後依序跑 `npm run impact`、`npm run test:smoke`、受影響章 `npm run test:module -- tests/e2e/12-shipping`、`tests/e2e/14-query-ui`；動到 `_lib` 判「影響全站」時提交前跑 `npm test` 全套；erp 提交訊息附測試結果

## 6. archive 前驗證

- [x] 6.1 Sens 測試專案跑 `npm test`（Vitest 加全部 Playwright），全部通過；fixme 條目在 `docs/findings-*.md` 有對應紀錄（Miles 2026-10-22 拍板不跑全套；已跑單元 1304、smoke、第十一、十二、十四章，見 erp 提交 02077dd4）
- [x] 6.2 逐條比對 delta 的每條驗收條目對到情境目錄節與測試（對照 design.md D-6）
- [x] 6.3 掃 design.md、proposal.md 的 Open Questions：SHP-026 已拍板封存（系統外處理），SHP-024 已有 Vault OQ，原處已寫引用
- [x] 6.4 檢查 delta 每個 Requirement 描述段無業務規則句重述、每條驗收條目有情境標註且指到存在的情境卡與步驟
- [x] 6.5 archive 後：shipment spec Purpose 段「逐筆物流單的出貨動作」改寫為含批次拋單；確認 ADDED 兩條沒有與 main spec 舊描述並存

## 測試影響清單

| 情境目錄節號 | 動作 | 測試檔 | 說明 |
|------------|------|-------|------|
| 12.3 | 改寫 | `tests/e2e/12-shipping/shipping.spec.mjs` | 裝箱明細欄位加長、寬、高 |
| 12.6 | 改寫 | `tests/unit/qc-shipping/shipment-draft.test.mjs` | 拋單方式的出貨單有批次拋單；自取、專車、其他沒有 |
| 12.15、12.16 | 改寫 | `tests/unit/qc-shipping/next-status-options.test.mjs`、`shipping.spec.mjs` | 列上動作鈕加批次拋單；出貨單模組與訂單出貨單頁籤共用 |
| 12.20 | 改寫 | `tests/unit/qc-shipping/shipping-rules.test.mjs` | 修正改依項目判斷；部分離廠後仍有修正；併發時依項目重新檢核 |
| 12.21 | 改寫 | `shipping-rules.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` | 拋單送出後顯示處理中 |
| 12.32 | 改寫 | `shipment-logistics.test.mjs`、`shipping-rules.test.mjs`、`shipping.spec.mjs` | 箱規不再依出貨方式分組，改共用十筆加自訂 |
| 12.36 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 錯誤訊息在處理中結束時顯示；拒收示意改用非箱規的方式；部分離廠時只鎖已離廠物流單的箱 |
| 12.37 | 改寫 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 逐箱新增時每箱可填長、寬、高 |
| 12.41 | 新增 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 批次拋單結果：全部成功、部分失敗、順豐一筆、異常只送已裝箱、訂單已取消逐筆失敗 |
| 12.42 | 新增 | `next-status-options.test.mjs`、`shipping.spec.mjs` | 批次拋單顯示與停用：依出貨單狀態、出貨方式、角色；揀貨不符與異常無已裝箱停用 |
| 12.43 | 新增 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 拋單處理中與逾時視為失敗 |
| 12.44 | 新增 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 箱規共用加自訂；帶入鎖住、空白選填、自訂、修正時重新帶入清空或保留；修正紀錄記長寬高 |
| 12.45 | 新增 | `shipping-rules.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` | 部分離廠後改箱規重拋、拆箱新增產生新物流單；全數離廠後沒有修正 |
| 14.37 | 改寫 | `tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs` | 裝箱明細表加長、寬、高欄；箱規名稱改新主檔 |
| 14.38 | 改寫 | `shipment-dialog-and-thumbnail.spec.mjs` | 兩處列表改子母表，展開為物流單子表；刪裝箱照片欄 |

Mock 異動順序：先改 MOCK-DATA-CHAIN，再改 `qc-shipping/_lib/mock-data.js`，最後改引用鏈編號與箱規名稱的測試。
