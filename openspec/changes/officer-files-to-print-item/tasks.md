## 1. 規格

- [x] 1.1 改未歸檔 change `work-order-visibility-and-sharing` 的 `specs/work-order/spec.md`：負責人動作清單刪除「印務印件檔案上傳」，並補一句「所屬印件的印務印件檔案與檔案備註，可維護範圍見 order-management spec § 印件印務印件檔案與檔案備註」；`openspec validate work-order-visibility-and-sharing --strict` 通過

## 2. 測試先行（Sens `erp-prototype-tests/`，先紅後綠）

- [ ] 2.1 新增純函式測試 `tests/unit/work-orders/rules-print-item-officer-files-guard.test.mjs`，涵蓋：任一張工單負責人放行、另一張工單的編輯（代理）成員放行、印務主管放行、已取消工單的負責人放行、工單與印件都在終態仍放行、非負責非分享的印務擋下、業務與生管擋下；先跑確認失敗
- [ ] 2.2 新增畫面測試（情境 7.36）：同一印件兩張工單，在工單甲詳情上傳檔案並改檔案備註，工單乙詳情顯示同一份；印件詳情頁不顯示這兩欄；先跑確認失敗
- [ ] 2.3 新增畫面測試（情境 7.37）：已送達印件的工單詳情仍可上傳；非負責的印務開同一張工單，上傳與編輯入口停用
- [ ] 2.4 新增純函式或畫面測試（情境 4.17）：加開印件的新印件，印務印件檔案與檔案備註為空
- [ ] 2.5 新增純函式或畫面測試（情境 5.17）：打樣結果判 NG-稿件問題後，新印件的這兩欄為空，原印件的值保留在原印件
- [ ] 2.6 改寫既有情境 7.3 的畫面測試與目錄說明：「上傳檔案存的是印務自己的工單附件」改為「存的是所屬印件的印務印件檔案，同印件其他工單共用」

## 3. Mock 資料

- [ ] 3.1 改 `(prototype)/MOCK-DATA-CHAIN.md`：印務印件檔案與檔案備註記在印件；補一條鏈上多工單的印件（例如 PI-2026-0904 旗下 WO-2026-0904 與 WO-2026-0905）帶兩份檔案與一則備註
- [ ] 3.2 改各模組 `mock-data.js`：工單資料移除檔案與備註兩欄，改放在對應印件；舊工單層資料不保留

## 4. Prototype 實作（erp repo，經 `prototype-from-prompt` skill）

- [ ] 4.1 資料寫入改為所屬印件：工單詳情的上傳、移除、編輯備註動作寫入印件，工單詳情讀所屬印件的值
- [ ] 4.2 權限判定改為該印件旗下全部工單（含已取消）的負責人與編輯（代理）成員，加印務主管；不看工單與印件狀態
- [ ] 4.3 印件詳情頁不顯示這兩欄（確認現況即可）
- [ ] 4.4 加開印件與打樣後棄用重建建立新印件時，這兩欄為空
- [ ] 4.5 工單列印單據不附這兩欄（確認現況即可）

## 5. 驗證與提交

- [ ] 5.1 Sens 測試專案跑 `npm run impact` 判影響範圍，再跑 `npm run test:smoke` 與受影響章節，全部通過
- [ ] 5.2 主對話對照 `prototype-from-prompt` skill 稽核交回的改動（檢查寫死色碼、像素值、強制覆寫樣式、全域樣式元件）
- [ ] 5.3 erp repo 與 Sens 各自提交，commit 訊息附測試結果

## 6. 交付

- [ ] 6.1 列出 Linear PM-1074 § 印務印件檔案上傳的修改內容（原本／現行對照表），Miles 同意後才寫入

## 測試影響清單

| 情境目錄節號 | 動作 | 測試檔 | 說明 |
|------------|------|-------|------|
| 7.3 | 改寫 | `tests/e2e/07-process-planning/process-tab.spec.mjs` | 上傳檔案改為存到所屬印件 |
| 7.36（新增） | 新增 | `tests/e2e/07-process-planning/` 下新檔 | 同印件兩張工單看到同一份；印件詳情不顯示 |
| 7.37（新增） | 新增 | 同上 | 已送達仍可上傳；非負責印務入口停用 |
| 4.17（新增） | 新增 | `tests/unit/` 或 `tests/e2e/04-order-print-item/` | 加開印件不帶入 |
| 5.17（新增） | 新增 | `tests/unit/` 或 `tests/e2e/05-prepress-review/` | 棄用重建不帶入 |
| 不列節號（純函式） | 新增 | `tests/unit/work-orders/rules-print-item-officer-files-guard.test.mjs` | 可維護者判定 |
| 8.6 | 不動 | `tests/e2e/08-process-review-deliver/print-sheet.spec.mjs` | 單據附圖只有完稿縮圖，現況已符合；跑一次確認 |

Mock 異動順序：先改 MOCK-DATA-CHAIN，再改 mock 資料，最後改測試。
