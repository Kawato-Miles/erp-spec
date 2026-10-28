## 1. 測試影響清單

依 erp-prototype-tests/docs/scenario-catalog.md 節號整理。改動順序固定：先改 MOCK-DATA-CHAIN，再改各模組 mock-data.js，最後改測試。

| 節號 | 現況 | 本案改成 | 測試檔 |
|---|---|---|---|
| 2.28 複製訂單 | 購買的急件選項不帶入；印件審稿回待分派 | 已棄用印件不帶；購買的急件選項為空（新訂單是線下單）；免審稿照帶原值，免審者直通合格 | tests/unit/orders/order-copy.test.mjs |
| 4.3 製作段改購買數量與加開 | 加開時購買數量必填、印件預計交期不預填 | 加開帶入原印件的購買數量與印件預計交期 | tests/e2e/04-order-print-item/order-print-item.spec.mjs |
| 4.8 複製加開 | 印件名稱加「（加開）」；購買數量與印件預計交期留空；購買的急件選項不帶入 | 帶入印件名稱、購買數量、印件預計交期、出貨方式、客戶指定收件日、製程說明、品檢需求、購買的急件選項；建立當下可改，含印件屬性；清空印件預計交期後存檔被擋下 | tests/unit/orders/expected-delivery-stage-guard.test.mjs、tests/e2e/04-order-print-item/order-print-item.spec.mjs |
| 4.10 三條複製路徑 | 三條都不帶購買的急件選項 | 打樣 NG 重建與複製加開帶入原值；複製訂單為空 | tests/unit/orders/order-copy.test.mjs、tests/unit/orders/print-item-date-change.test.mjs、tests/e2e/04-order-print-item/order-print-item.spec.mjs |
| 4.25 離開草稿後新增印件必填交期 | 複製加開未填交期擋下 | 複製加開改為帶入後清空才擋下；空白新增不變 | tests/unit/orders/expected-delivery-stage-guard.test.mjs |
| 5.17 打樣重建不帶印務印件檔案 | 不帶印務印件檔案與檔案備註 | 維持；補打樣結果為待確認、稿件上傳開放為是、免審稿為否、原印件與新印件備註不加註 | tests/unit/orders/print-item-officer-files-new-item.test.mjs |
| 新增 | — | 複製訂單不帶已棄用印件 | tests/unit/orders/order-copy.test.mjs |

mock 異動：MOCK-DATA-CHAIN 補一張含已棄用印件的來源訂單（或沿用既有鏈中已棄用印件），再同步到訂單模組 mock-data.js；改 mock 不動既有編號。

## 2. 情境目錄與測試（先寫失敗測試）

- [ ] 2.1 改 scenario-catalog.md 的 2.28、4.3、4.8、4.10、4.25、5.17 節，新增「複製訂單不帶已棄用印件」一節；期望值取自 delta Scenario 的 THEN
- [ ] 2.2 改 MOCK-DATA-CHAIN 與訂單模組 mock-data.js，加入複製訂單要用的已棄用印件資料
- [ ] 2.3 改 order-copy.test.mjs：已棄用印件不帶、購買的急件選項為空、免審稿照帶原值；執行後新案例失敗
- [ ] 2.4 改 print-item-date-change.test.mjs 與 print-item-officer-files-new-item.test.mjs：打樣 NG 重建帶入購買的急件選項、免審稿為否、打樣結果為待確認、稿件上傳開放為是、兩處備註不加註；執行後新案例失敗
- [ ] 2.5 改 expected-delivery-stage-guard.test.mjs：複製加開帶入購買數量與印件預計交期，清空印件預計交期才擋下；執行後新案例失敗
- [ ] 2.6 改 order-print-item.spec.mjs 的加開與複製路徑畫面測試，期望值同 2.5 與 4.8 節

## 3. Prototype 實作（erp repo，待主對話轉達 Miles 同意 erp PR 後開工）

- [ ] 3.1 開工前讀 erp repo 的 prototype-from-prompt skill；以 prototype/production-stage 為基底開分支
- [ ] 3.2 改訂單模組的複製加開：依印件複製規則帶入內容類欄位，建立當下可改含印件屬性；2.5 的單元測試通過
- [ ] 3.3 改複製訂單：略過已棄用印件；購買的急件選項為空；2.3 的單元測試通過
- [ ] 3.4 改打樣 NG-稿件問題重建：帶入購買的急件選項；免審稿為否；打樣結果為待確認；稿件上傳開放為是；出貨方式取原印件的值；不在原印件與新印件備註加註；2.4 的單元測試通過
- [ ] 3.5 改加開對話框畫面：帶入值預填、可改印件屬性；2.6 的畫面測試通過

## 4. 驗收

- [ ] 4.1 執行 npm run impact，確認影響範圍與第 1 段清單一致
- [ ] 4.2 背景執行 npm run test:smoke，主流程通過
- [ ] 4.3 背景執行第 2 段改到的章節（訂單複製、印件、打樣），全部通過
- [ ] 4.4 erp 分支開 PR，PR 不關聯 Linear issue；提交訊息附測試結果
