## 1. 規格

- [x] 1.1 shipment delta：MODIFIED「箱規選擇與長寬高帶入」；`openspec validate box-spec-dimensions-from-master --strict` 通過

## 2. 情境目錄與測試（Sens `erp-prototype-tests/`，先紅後綠）

- [x] 2.1 改寫 12.44：選沒有記尺寸的箱規（K1 箱）長寬高照實空白、不開放填寫；修正時改成 K1 箱帶入空白並鎖住；用詞照實體卡操作名稱
- [x] 2.2 改寫對應單元測試（`tests/unit/qc-shipping/shipping-rules.test.mjs` 12.44）與畫面測試（`tests/e2e/12-shipping/shipping.spec.mjs` 12.44），確認先紅

## 3. Prototype（erp，經 `prototype-from-prompt`）

- [x] 3.1 qc-shipping：選一筆箱規時長寬高照箱規帶入並鎖住（含空白）；只有自訂可填；3.x 轉綠
- [x] 3.2 `npm run impact`、`npm run test:smoke`、`npm run test:module -- tests/e2e/12-shipping`、單元測試；提交訊息附結果

## 4. 歸檔

- [x] 4.1 archive；確認主規格只有一版帶入規則
