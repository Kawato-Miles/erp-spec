## 1. 規格產出物

- [x] 1.1 proposal 補完：What Changes 補工單詳情「檢視」、出貨單歷程、前置未到料標籤與可做量呈現範圍；Capabilities 各列同步
- [x] 1.2 規格差異檔補完：production-execution、qc、shipment 補上實質改寫與 ADDED；新增 business-scenarios 規格差異檔；RENAMED 的 FROM 改為收斂 change 原名；動到的 Scenario 補標情境卡步驟
- [x] 1.3 design.md：修正機制、入口範圍、併發重新檢核、整批寫入、揀貨不符做轉換條件、品檢通過下限、物流單號模擬、歸檔順序
- [x] 1.4 `openspec validate unify-production-shipping-correction --strict` 通過

## 2. 生產執行（production-execution）核對 Prototype 與測試

- [x] 2.1 一次報多筆整批成立或整批不寫入：情境目錄 10.61（`tests/e2e/10-report-transfer/batch-report-all-or-nothing.spec.mjs`）
- [x] 2.2 報工修正範圍依入口——我的單元只限自己提交、所有單元範圍內全部、工單詳情依工單詳情報工範圍：10.44、14.32、14.35（`tests/unit/production-floor/correction-entry-scope.test.mjs`、`tests/e2e/14-query-ui/correction-entries.spec.mjs`、`tests/e2e/10-report-transfer/report-owner-only.spec.mjs`）
- [x] 2.3 師傅改派後我的單元看不到原報工、所有生產任務仍可修正：`correction-entry-scope.test.mjs`（14.35 改派與「所有生產任務仍是範圍內全部報工」兩例）
- [x] 2.4 報工修正逐欄位留修正紀錄、擋下時指出卡住的單與已驗量、提示先請品檢人員修正品檢紀錄：10.34、10.35、11.19（`report-edit-and-void.test.mjs`、`tests/unit/qc-shipping/report-edit-void-pending-guard.test.mjs`）
- [x] 2.5 點收修正逐欄位留紀錄，點收數量（單筆）與點收量（合計）用詞：10.30、10.31（`transfer-receipts.test.mjs`）
- [x] 2.6 轉交進度兩數「搬運量／點收量」：10.32、10.39、14.29（`transfer-status-derivation.test.mjs`、`tests/e2e/14-query-ui/task-drawer-and-thumbnail.spec.mjs`）
- [x] 2.7 生產任務側板不顯示可做量；清單以「前置未到料」標籤呈現、等貨說明在側板；工作包任務清單的可做量照舊：14.29、14.39、9.4（`task-drawer-and-thumbnail.spec.mjs`、`production-list-name-link.spec.mjs`、`work-packages-view.spec.mjs`）
- [x] 2.8 逐層修正含「錯的數字已流到品檢且已有出貨明細佔用」一層：10.56、10.57、11.26（`layered-correction.test.mjs`、`tests/e2e/11-qc/qc.spec.mjs`）
- [x] 2.9 歷程統合報工修正、點收修正、點收紀錄作廢：10.43（`report-remark-and-history.test.mjs`）
- [x] 2.10 報工照片用詞與照片必填：10.49、14.33（`report-precondition-and-entries.test.mjs`、`correction-entries.spec.mjs`）
- [ ] 2.11 併發寫入的重新檢核（報工類與點收類）：Prototype 的資料存在單一瀏覽器記憶體，構造不出兩筆同時寫入；檢核函式已以當下狀態判定，同時寫入的行為留待後端交付時驗證

## 3. 品檢（qc）核對 Prototype 與測試

- [x] 3.1 品檢修正原紀錄、逐欄位留品檢修正紀錄、待驗量回升：11.16、11.24（`tests/unit/qc-shipping/pending-inspections.test.mjs`、`inspection-lower-bound.test.mjs`、`qc.spec.mjs`）
- [x] 3.2 三條品檢修正界線與擋下訊息（總數上限、通過下限、不通過下限）、不通過為 0 清空原因：11.18、11.25、11.26、11.27（`inspection-lower-bound.test.mjs`、`qc.spec.mjs`）
- [x] 3.3 品檢照片必填、修正後至少留一張、換掉的照片留修正前照片：11.23
- [x] 3.4 缺口處置修正與處置修正界線、照收改走品檢修正：11.27（`disposition-correction.test.mjs`）
- [x] 3.5 完成數用詞與待驗清單：11.17（提交 96ba2e8 測試同步）
- [ ] 3.6 併發寫入的重新檢核（品檢驗收、品檢修正、處置修正）：同 2.11，留待後端交付時驗證

## 4. 出貨（shipment）核對 Prototype 與測試

- [x] 4.1 揀貨數量與每箱幾個逐條填、不預填、漏填不推進：12.3、12.4（`shipping-rules.test.mjs`、`tests/e2e/12-shipping/shipping.spec.mjs`）
- [x] 4.2 揀貨不符列表標示、擋下拋單／出貨確認／交付確認、兩數相符即放行：12.5、12.19
- [x] 4.3 裝箱回報修正只限待出貨、原因必填、逐欄位留紀錄並寫歷程：12.20
- [x] 4.4 拋單、物流單號由系統生成示意回傳、下載物流單、拋單畫面與出貨單無重量：12.6、12.21
- [x] 4.5 出貨單歷程頁籤：12.3、12.20、12.21、14.37（`shipment-dialog-and-thumbnail.spec.mjs`）
- [x] 4.6 品檢修正不使完工良品數低於出貨明細佔用（守恆鏈）：11.26
- [ ] 4.7 併發寫入的重新檢核（建單、明細增減、作廢、裝箱回報與修正、拋單與出貨確認）：同 2.11，留待後端交付時驗證
- [x] 4.8 情境目錄 12.3「系統之後怎麼變」仍寫包裝區顯示「重量」，與 grill 第 49 題及 12.6 測試不一致；改寫該句

## 5. 工單、訂單、派單、業務情境核對

- [x] 5.1 工單詳情轉交進度只呈現搬運量與點收量、不適用顯示「－」：14.31（`correction-entry-scope.test.mjs`、`correction-entries.spec.mjs`）
- [x] 5.2 工單詳情按檢視開生產任務側板、依工單詳情範圍修正報工：14.32
- [x] 5.3 order-management、dispatch-order、work-order 的「完成數」用詞：提交 96ba2e8（wiki 與測試同步）
- [x] 5.4 business-scenarios 品檢與出貨情境改為品檢修正、逐條揀貨與拋單：情境由 11.24、12.3、12.21 分段涵蓋

## 6. 規格缺口與歸檔前置

- [ ] 6.1 經 wiki-amend 在報工與修正情境卡補「一次報多筆」分支、在對應情境卡補「併發寫入」分支，補完後回改本 change 相關 Scenario 的情境標註
- [ ] 6.2 order-management § 印件詳情頁工單與生產任務區塊有四條 Scenario（開啟區塊、日期欄無值、實際成本段、跨印務可見）找不到情境卡步驟，補情境卡後再標
- [x] 6.3 處置修正執行角色：Prototype 開放印務與印務主管、wiki 印件卡只寫印務，經 oq-manage 判斷是否開 OQ
- [ ] 6.4 收斂 change（production-dispatch-report-transfer-convergence）先歸檔；之後以歸檔後的主規格重新比對本 change 的 MODIFIED 與 RENAMED 區塊
- [ ] 6.5 歸檔前跑 `npm run test:smoke` 與第十、十一、十二、十四章測試，記錄結果
- [ ] 6.6 本 change 歸檔後，清理 qc 主規格 Purpose 與正本邊界段的「品檢紀錄為只增紀錄」用詞
- [ ] 6.7 shipment 主規格正本邊界段與「唯一的明細可選性排除」理由句的可出貨額度算式改引 wiki 印件卡可出貨額度欄，拿掉「＋ 出貨單回補」（wiki 2026-10-14 已修，Prototype 本來就沒有重複計算）
- [ ] 6.8 prepress-review 主規格「打樣週期數量歸零」改照 wiki 齊套邏輯新清單（補已驗量、不通過累計、報廢數、未處置缺口）；本 change qc 規格差異檔「併發寫入的重新檢核」補記錄缺口處置（wiki 2026-10-14 第 79、80 題）
- [ ] 6.9 production-execution 主規格「印務主管核可前 SHALL NOT 改目的站點與產線」與對應 Scenario 改照第 64 題（印務主管任何時候可協助改）；work-order 主規格刪除生產任務補前提（第 63 題）

## 測試影響清單

本 change 的 Prototype 與測試已在 erp 分支 `prototype/production-stage`（提交 0c7168a3、ea4ed9c4、adf5461f、0a7b33c9、9602a825）與 Sens 提交 79b4d61、7995c14、91bc28d、96ba2e8、368d998、c66fab4 完成。以下依 `erp-prototype-tests/docs/scenario-catalog.md` 節號列出。

| 類別 | 節號 | 狀態 |
|------|------|------|
| 改寫的既有測試 | 9.21、10.30、10.32、10.34、10.35、10.39、10.43、10.44、10.49、10.56、10.57、11.16、11.19、12.1～12.7、12.15、12.16 | 已改寫 |
| 新增的情境 | 10.61、11.18、11.23～11.27、12.19～12.21、14.29、14.31～14.40 | 已新增 |
| 待改的目錄文字 | 12.3（包裝區仍寫重量） | 見 4.8 |
| 未覆蓋（另案） | 外包廠與中國廠商任務經工單詳情報工與修正（grill 第 42 題） | 不列入本 change |
| 未覆蓋（Prototype 構造不出） | 三個 capability 的併發寫入 | 見 2.11、3.6、4.7 |
| mock 變動 | 品檢既有負數更正紀錄轉為修正紀錄；出貨單明細加揀貨數量與每箱幾個、單頭拿掉實際裝箱數量與重量；第三方單加物流單號（先改 MOCK-DATA-CHAIN、再改各模組 mock-data.js、再改測試，已完成） | 已完成 |
