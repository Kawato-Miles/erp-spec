# Prototype 任務書：出貨單批次拋單、箱規共用與裝箱長寬高（2026-10-22）

你是 Prototype 實作者。回報用台灣繁體中文，禁中英夾雜、禁 emoji。

## 一、位置

| 項目 | 路徑 |
|---|---|
| erp 工作副本（只在這裡改） | /Users/b-f-03-029/erp-shipment-logistics，分支 `prototype/shipment-batch-dispatch`（已建，基於 04b5c8ba） |
| 只能動的目錄 | `apps/erp/src/app/(prototype)/`；共用元件、app 層、`packages/shared`、erp 的 skill 與 `(prototype)/README.md` 一律不碰；erp repo 不加任何測試檔 |
| 測試專案 | /Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/erp-prototype-tests（node_modules 已連結） |
| 測試指向 erp 工作副本 | 每個測試指令前加 `ERP_ROOT=/Users/b-f-03-029/erp-shipment-logistics DEV_PORT=3031` |

不要動 /Users/b-f-03-029/erp 主工作副本。

## 二、開工前 MUST 讀

1. `/Users/b-f-03-029/erp-shipment-logistics/.claude/skills/prototype-from-prompt/SKILL.md`（設計規範唯一入口，含它指定要讀的檔）。小改也要照它。
2. 載入 skill `andrej-karpathy-skills:karpathy-guidelines` 的原則：只改需要改的、不加未要求的東西。
3. change 正本：/Users/b-f-03-029/Sens/.claude/worktrees/shipping-logistics-features-dd104a/openspec/changes/shipment-batch-dispatch-box-size/（proposal、design、specs/shipment/spec.md、tasks.md）。**tasks.md 第 2～5 節就是你的工作清單，含測試影響清單**。
4. 設計與拍板：同 Sens 目錄 memory/erp/plans/shipment-batch-dispatch-box-size-20261022/design.md、grill.md（§ 八介面內容、§ 二箱規十筆初始資料）。
5. wiki 正本（業務規則以此為準）：memory/Sens_wiki/wiki/erp/05-entities/出貨單.md、物流單.md、06-state-machines/出貨單狀態.md、物流單狀態.md、07-scenarios/出貨與送達.md。
6. 測試專案：erp-prototype-tests/README.md（§ 迭代檢核表）、docs/scenario-catalog.md 第十二章與 14.37、14.38。

## 三、工作順序（照 tasks.md）

1. 第 2 節：補情境目錄（scenario-catalog.md）。
2. 第 3 節：測試先行，寫完跑一次確認新增與改寫的條目為紅。
3. 第 4 節：mock 異動順序固定為 MOCK-DATA-CHAIN.md → `qc-shipping/_lib/mock-data.js` → 引用的測試。
4. 第 5 節：實作，逐項轉綠。
5. 勾選 tasks.md 已完成項目（Sens 檔，可改）。

## 四、介面要點（Prototype 是介面正本，以下為拍板內容）

- 出貨單模組列表與訂單詳情出貨單頁籤：改子母表，主層出貨單，展開後是物流單子表，有自己的表頭；比照訂單列表展開印件（`orders/page.js` 的 expandedRowRender）。每列都可展開，沒有物流單時顯示沒有資料；預設收合；作廢的物流單照列。子表欄位：物流單編號、物流單號、箱數、狀態、離廠時間、送達時間、例外理由、操作（操作沿用既有物流單動作）。
- 出貨單視窗內的物流單表格保留，含操作欄。
- 批次拋單入口：列表主層列操作欄、出貨單視窗物流單表格旁、訂單出貨單頁籤（依權限，只有能拋單的人看得到）。只限拋單方式（順豐、新竹物流、7-11 交貨便、全家）。依出貨單狀態：已裝箱、異常顯示，其他隱藏；揀貨不符、或異常且沒有已裝箱物流單時停用，滑鼠移上顯示理由。
- 拋單（單筆與批次）送出後顯示處理中，期間操作者不能做其他操作；樣式參考其他模組既有做法；結束時逐筆列出成功與失敗及錯誤訊息，不存。逾時視為失敗。拒收與逾時的示意方式不得加示意箱規、不得呈現為依尺寸把關（例如用 mock 設定某物流單編號固定回傳錯誤）。
- 兩處列表刪「裝箱照片」欄。
- 裝箱明細表加長、寬、高三欄；箱規下拉列十筆共用箱規加「自訂」；帶入、鎖住、選填、清空、保留規則依出貨單卡「長、寬、高的帶入」表。
- 裝箱回報修正依出貨單狀態卡四項條件開放；部分離廠時新增箱產生新的已裝箱物流單。
- 當前狀態用不到的操作鈕直接隱藏；只有個別資料條件不符才停用加理由。

## 五、測試與提交紀律

- 每項完成後依序：`npm run impact` → `npm run test:smoke` → 受影響章 `npm run test:module -- tests/e2e/12-shipping`、`tests/e2e/14-query-ui` 與對應單元測試。動到 `_lib` 判「影響全站」時，最後跑一次 `npm test` 全套（分章節批次）。所有指令都加第一節的環境變數。
- 測試期望值取自 delta spec 的 THEN，不由實作重算。
- 自我稽核：交回前 grep 改動檔有無寫死色碼、px、`!important`、createGlobalStyle，先查 `packages/shared/styles` 有無現成樣式。
- 不 git add、不 commit（erp 與 Sens 都不要）。還不提交的改動不要暫存。

## 六、回報

- tasks.md 第 2～5 節完成狀況（逐項）。
- erp 改動檔清單、Sens 測試與目錄改動檔清單。
- 測試結果：smoke、受影響章、單元、全套（若有跑）各自的通過／失敗／略過數字；失敗項逐條列並判斷是否本次造成。
- 自我稽核 grep 結果。
- 不確定或偏離任務書之處。
