## 1. 規格

- [x] 1.1 shipment、order-management、work-order、business-scenarios 四份 delta spec 寫成；`openspec validate shipment-logistics-split --strict` 通過
- [x] 1.2 business-scenarios § 全流程驗證第 17 步改為新口徑（MODIFIED，見 design D-4），情境標註缺口併入 XM-018

## 2. 測試先行（Sens `erp-prototype-tests/`，先紅後綠）

已於 Prototype 實作前改寫並確認失敗，再實作至通過。Sens 提交：20501d5（第十二章改寫、12.32～12.38 新增、單元與畫面測試改為物流單結構）、578aa64（保密代寄 12.39、刪每箱幾個與一次新增多箱）、a6b4de3（出貨動作逐筆、拿掉批次拋單與單筆重試）、41804df（12.14、14.37 對齊物流單結構）。

- [x] 2.1 拆單與裝箱資料：`tests/unit/qc-shipping/shipment-logistics.test.mjs`（12.32）、`tests/unit/qc-shipping/shipping-rules.test.mjs`（箱規分組、裝箱明細檢核 12.4、12.37）、`tests/e2e/12-shipping/shipping.spec.mjs`（12.32、12.37）
- [x] 2.2 出貨單依物流單計算、例外與重新同步：`shipment-logistics.test.mjs`（12.33）、`shipping.spec.mjs`（12.33）
- [x] 2.3 作廢物流單與未送達數量、交付確認填未送達：`shipment-logistics.test.mjs`（12.34、12.35）、`shipping.spec.mjs`（12.34、12.35）
- [x] 2.4 出貨動作逐筆在物流單、拋單失敗不推進、不設重試：`shipment-logistics.test.mjs`（12.36）、`shipping.spec.mjs`（12.36）、`tests/unit/qc-shipping/next-status-options.test.mjs`（12.15）
- [x] 2.5 訂單取消連鎖與三個集合詞：`shipment-logistics.test.mjs`（12.38）
- [x] 2.6 異常不回補、作廢出貨單、收尾補跑、補附送達憑證：`tests/unit/qc-shipping/shipment-terminal.test.mjs`（12.22～12.25）、`shipping.spec.mjs`（12.22、12.23、12.25、12.26）、`tests/unit/qc-shipping/shipment-proof-access.test.mjs` 與 `tests/e2e/12-shipping/access-scope.spec.mjs`（12.31）
- [x] 2.7 收尾判定異常視為未收尾：`tests/unit/orders/shipment-advance.test.mjs`（12.8）
- [x] 2.8 實際出貨日取最晚離廠、轉異常不影響首張：`tests/unit/delivery-chain/shipment-on-time.test.mjs`（12.14）
- [x] 2.9 保密代寄：`tests/unit/qc-shipping/shipment-sender.test.mjs`、`shipping.spec.mjs`（12.39 兩條）
- [x] 2.10 三種出貨方式的憑證與後到者提示：`tests/unit/qc-shipping/shipment-draft.test.mjs`（12.6、12.7）
- [x] 2.11 出貨單對話框刪每箱幾個欄：`tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs`（14.37）

## 3. Mock 資料

- [x] 3.1 改 `(prototype)/MOCK-DATA-CHAIN.md`：鏈一新增物流單拆分樣本（SH-2026-0601 順豐 5 箱一筆物流單、SH-2026-0602 自取 2 箱一筆物流單）；鏈四草稿 SH-2026-0820 加保密代寄樣本（erp 提交 426b0627、faa76db7、c7c4388c）
- [x] 3.2 改 `qc-shipping/_lib/mock-data.js`：裝箱資料、物流單、出貨方式屬性與箱規（同上提交）

## 4. Prototype 實作（erp repo 分支 `prototype/production-stage`，經 `prototype-from-prompt` skill）

- [x] 4.1 出貨單拆成出貨單、裝箱資料、物流單三層；出貨方式帶兩屬性；出貨單狀態由物流單計算；未送達數量回補額度（erp 提交 426b0627）
- [x] 4.2 保密代寄；刪出貨明細每箱幾個與裝箱一次新增多箱（erp 提交 faa76db7）
- [x] 4.3 出貨動作改在物流單列上逐筆執行，拿掉批次出貨與單筆重試，集合詞改依離廠時間判定；訂單取消連鎖改依集合詞（erp 提交 c7c4388c）

## 5. archive 前驗證

- [ ] 5.1 Sens 測試專案跑 `npm test`（Vitest 加全部 Playwright），全部通過；fixme 條目在 `docs/findings-*.md` 有對應紀錄
- [ ] 5.2 逐條比對本 change delta 的每條 Scenario 對到情境目錄節與測試（對照表見 design.md D-6）
- [ ] 5.3 掃 design.md、proposal.md 的 Open Questions：第 1 項依 Miles 裁決處理；其餘已有 Vault OQ，原處已寫雙向引用
- [ ] 5.4 檢查 delta 每個 Requirement 描述段無業務規則句重述、每條動到的 Scenario 有情境標註且指到存在的情境卡與步驟
- [ ] 5.5 archive 後：shipment spec Purpose 段的範圍描述（「異常與作廢的額度回補」）改寫為新口徑；確認 ADDED 六條沒有與 main spec 舊描述並存

## 測試影響清單

| 情境目錄節號 | 動作 | 測試檔 | 說明 |
|------------|------|-------|------|
| 12.3、12.4、12.5 | 改寫 | `tests/unit/qc-shipping/shipping-rules.test.mjs`、`tests/e2e/12-shipping/shipping.spec.mjs` | 單頭箱數箱規改逐箱裝箱資料；轉已裝箱並產生物流單 |
| 12.6、12.7 | 改寫 | `tests/unit/qc-shipping/shipment-draft.test.mjs` | 出貨動作只在物流單列上，依出貨方式分流 |
| 12.8 | 改寫 | `tests/unit/orders/shipment-advance.test.mjs` | 累計送達數取送達數量；異常視為未收尾 |
| 12.10 | 改寫 | `tests/unit/qc-shipping/shipment-logistics.test.mjs`（隨 12.38） | 未離廠改未出貨動作；部分離廠擋出貨動作 |
| 12.14 | 改寫 | `tests/unit/delivery-chain/shipment-on-time.test.mjs` | 實際出貨日取最晚離廠；轉異常不影響首張 |
| 12.15 | 改寫 | `tests/unit/qc-shipping/next-status-options.test.mjs`、`shipping.spec.mjs` | 出貨單列上沒有出貨動作；物流單層動作依狀態與出貨方式 |
| 12.19、12.20 | 改寫 | `shipping-rules.test.mjs` | 擋物流單出貨動作；修正依離廠時間判定、箱序與物流單序號不重用 |
| 12.21 | 改寫 | `shipping-rules.test.mjs`、`shipment-logistics.test.mjs` | 物流單號與子單號格式；拋單寫入 |
| 12.22～12.25 | 改寫 | `tests/unit/qc-shipping/shipment-terminal.test.mjs`、`shipping.spec.mjs` | 異常不回補；作廢出貨單連帶物流單；收尾補跑；補附掛物流單 |
| 12.26 | 改寫 | `shipping.spec.mjs` | 鏈一物流單拆分樣本 |
| 12.31 | 改寫 | `tests/unit/qc-shipping/shipment-proof-access.test.mjs`、`tests/e2e/12-shipping/access-scope.spec.mjs` | 補附入口改在物流單列 |
| 12.32～12.37 | 新增 | `shipment-logistics.test.mjs`、`shipping-rules.test.mjs`、`shipping.spec.mjs` | 拆單、依物流單計算、作廢物流單、部分交付、拋單失敗、逐箱新增 |
| 12.38 | 新增 | `shipment-logistics.test.mjs` | 訂單取消連鎖與三個集合詞 |
| 12.39 | 新增 | `tests/unit/qc-shipping/shipment-sender.test.mjs`、`shipping.spec.mjs` | 保密代寄 |
| 14.37 | 改寫 | `tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs` | 出貨明細刪每箱幾個欄 |

Mock 異動順序：先改 MOCK-DATA-CHAIN，再改 `qc-shipping/_lib/mock-data.js`，最後改引用鏈編號的測試（已依此順序完成）。
