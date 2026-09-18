# 任務清單

> 實作範圍：erp repo `/Users/b-f-03-029/erp` apps/erp/src/app/(prototype)/，MUST 經 skill `prototype-from-prompt`；只動 (prototype)/ 目錄。Prototype 已於分支 `prototype/production-stage` 提交 0cff790f、測試已於 Sens 提交 dbe8bb5；下列已完成項照實勾選，餘為本 change 收尾。

## 測試影響清單（依 erp-prototype-tests/docs/scenario-catalog.md 節號）

| Delta Scenario | 情境目錄節 | 測試檔 | 狀態 |
|---|---|---|---|
| shipment § 草稿：只填預計出貨日、不佔額度、預設帶入可移除加回、不推進印件與訂單 | 12.2 | e2e/12-shipping、unit/qc-shipping/shipment-draft、shippable-quota | 已覆蓋 |
| shipment § 草稿：不進揀貨與出貨人員清單 | 12.1 | e2e/12-shipping | 已覆蓋 |
| shipment § 草稿：刪除不填理由 | 12.9 | e2e/12-shipping | 已覆蓋 |
| shipment § 寄件與收件：帳務公司帶出、收件三欄預設可改、換訂單重帶 | 12.11、12.12 | e2e/12-shipping、unit/qc-shipping/shipment-draft | 已覆蓋 |
| shipment § 建立與額度檢核：必填先擋、超額一句擋下、成立轉未處理、首張觸發出貨中 | 12.2 | e2e/12-shipping | 已覆蓋 |
| shipment § 建立與額度檢核：建單當下額度被吃掉、增量檢核、合箱、跨訂單、終態建單、短出後建單、已棄用排除 | 既有 Scenario 未變更 | 沿用既有覆蓋狀態 | 不動 |
| shipment § 出貨與送達確認：托運單號與重量、自動推進、人工備援、專車無自動、自取一次完成 | 12.6、12.7 | e2e/12-shipping、unit/qc-shipping/shipment-draft（isThirdPartyMethod） | 已覆蓋 |
| shipment § 出貨與送達確認：重量選填不擋 | 12.6 | e2e/12-shipping | 已覆蓋 |
| shipment § 異常與作廢：訂單取消刪草稿並作廢未離廠單 | 12.10 | e2e/12-shipping | 已覆蓋 |
| shipment § 狀態機：建立即草稿、第三方兩條觸發 | 12.2、12.6、12.8 | e2e/12-shipping | 已覆蓋 |
| shipment § 狀態機：草稿不走作廢弧 | 無 | 無 | 未覆蓋（Prototype 草稿列無作廢鈕，屬隱藏而非擋下） |
| qc § 待驗清單：報工即出現、轉交點收不改變、多部件最小值、末道不需轉交、已驗完留列、齊套 0 不列、非品檢人員唯讀 | 11.1、11.7、11.8、11.9、11.14、11.15 | e2e/11-qc、unit/qc-shipping/pending-inspections | 已覆蓋 |
| qc § 待驗清單：外發生產任務報工後即進清單 | 無 | 無 | 未覆蓋 |
| qc § 分次驗收：分次累計、原因必填、超過待驗量不夾值、更正回升、品檢需求三例 | 11.2、11.3、11.9、11.11 至 11.13、11.16 | e2e/11-qc、unit/qc-shipping/pending-inspections | 已覆蓋 |
| qc § 分次驗收：上限取送出那一刻（併發） | 無 | 無 | 未覆蓋（單機 Prototype 無法模擬第二位品檢人員併發） |
| production-execution § 場內轉交：點收佇列依所屬產線、品檢站點收不改變待驗量 | 10.8、11.8 | e2e/10-report-transfer/receiving-queue、unit/production-floor/receiving-permission、e2e/11-qc | 已覆蓋 |
| order-management § 訂單取消流程：草稿刪除段 | 12.10 | e2e/12-shipping | 已覆蓋 |
| dispatch-order § 回廠點收：外發報工後即進待驗清單 | 無 | 無 | 未覆蓋（同 qc 外發案例） |

mock 異動順序：`MOCK-DATA-CHAIN.md` 引言補「出貨單」「品檢」兩段、鏈四 SH-2026-0820 改草稿 → `qc-shipping/_lib/mock-data.js`（六值出貨方式、寄件資訊對照、sh-0820 草稿含預計出貨印件）→ 測試。已於 0cff790f 完成。

## 1. 測試先行（Sens erp-prototype-tests，dbe8bb5）

- [x] 1.1 情境目錄第十章 10.8 改寫；第十一章章首與 11.1 至 11.9 改寫、新增 11.14 至 11.16；第十二章章首與 12.1、12.2、12.6 至 12.8 改寫、新增 12.9 至 12.12
- [x] 1.2 純函式：`pending-inspections.test.mjs` 依新簽章重寫、`shipment-draft.test.mjs` 新增、`shippable-quota.test.mjs` 補草稿不佔額度、`receiving-permission.test.mjs` 新增、`rules-shipment-stats.test.mjs` 補草稿不計入
- [x] 1.3 畫面：`11-qc/qc.spec.mjs`、`12-shipping/shipping.spec.mjs`、`10-report-transfer/receiving-queue.spec.mjs` 依新口徑重寫；`_setup.mjs` 補強側欄群組收合時序
- [x] 1.4 執行結果：unit 206 全過、smoke 過、三章 48 全過；全套殘 4 紅（6.1、6.13、7.10、7.16）屬工單成本收斂 change 既有紅項
- [ ] 1.5 補純函式案例：外發生產任務（完全外發、印務報工 1,200）在無轉交單時待驗量 1,200（對應 qc 與 dispatch-order 兩條 Scenario）；情境目錄第十一章補一節、依據寫「品檢通過入庫、外發委外與回廠點收」

## 2. 出貨單草稿（erp 0cff790f）

- [x] 2.1 `mock-data.js`：出貨單狀態加草稿、出貨方式六值與第三方判定、寄件資訊依帳務公司對照、sh-0820 改草稿含預計出貨印件
- [x] 2.2 `store.js`：建草稿、改草稿、刪草稿、建立出貨單（必填檢核 → 逐印件額度檢核 → 預計出貨印件轉出貨明細 → 首張觸發出貨中）、剩餘應出量、草稿不進額度與收尾算式、訂單取消連鎖刪草稿
- [x] 2.3 `ShipmentFormDialog.js`：一顆對話框兩頁籤（基本資料、出貨印件）三按鈕（取消、儲存草稿、建立出貨單）；頁籤缺項標「缺 N」；擋下訊息一句；編輯模式沿用
- [x] 2.4 列表與側板：預計出貨日欄、草稿數量標預計、側板五段、揀貨與出貨人員列表隱藏草稿；訂單詳情出貨單頁籤同步
- [x] 2.5 出貨確認補重量（選填）；運送中第三方單提供「模擬物流商回報配達」（主）與「送達確認」（備援），專車只有送達確認

## 3. 品檢待驗清單（erp 0cff790f）

- [x] 3.1 `pending-inspections.js` 重寫：待驗量＝齊套完成數 − 已驗量，只看製作事實；已棄用排除；檔頭註解寫現行規則
- [x] 3.2 `inspection/page.js`：桌機表格（印件、品檢需求、齊套完成數、已驗、待驗量、操作）、列可展開歷次紀錄、手機寬度橫向捲動；頁首提示句改新口徑；驗收對話框顯示待驗量組成、送出以當下待驗量整筆檢核、移除輸入框上限；待驗量 0 時驗收停用
- [x] 3.3 `layout.js`：生管、印務主管側欄加「品檢與出貨」，進頁唯讀

## 4. 點收依所屬產線（erp 0cff790f）

- [x] 4.1 `transfer-rules.js` `canReceiveTransfer` 改三段（管理角色代點收 → 所屬產線含目的站 → 否則不可），刪角色特判
- [x] 4.2 `receiving/page.js` 提示句改「點收依所屬產線過濾…站上無人時生管、印務、印務主管可代點收」

## 5. 稽核與收尾

- [x] 5.1 主對話對照 skill 稽核（hex／px／important／createGlobalStyle；未動共用元件；無簡體字）並瀏覽器核對十一步與六步
- [x] 5.2 wiki 22 卡落卡、OQ 三張（SHP-018 與 QC-007 封存、QC-008 開放）、log 兩筆
- [ ] 5.3 plan-audit 回補稽核：結構性變更（新增狀態、跨模組）→ rubric 加雙盲對抗推演，稽核對象為 wiki 已落卡的設計；缺項回修 wiki 後同步本 change 的 delta
- [x] 5.4 `openspec validate shipment-draft-and-qc-queue` 通過；五份 delta 的 MODIFIED 標題已逐一比對與 main spec 一致、每條 Requirement 含 Priority 與 Rationale、相對連結全部可解析
- [ ] 5.5 vault-audit（22 卡異動達門檻，建議 Miles 觸發）
