## 1. 測試影響清單

依 Sens `erp-prototype-tests/docs/scenario-catalog.md` 節號列出：

| 類別 | 項目 |
|------|------|
| 改既有測試 | 無。情境 1.8「流失需求單重新啟動回待評估成本」與 `tests/unit/quote/quote-transitions.test.mjs`、`tests/e2e/01-quote/quote-request.spec.mjs` 已涵蓋重新啟動，僅驗證仍通過 |
| 新增情境 | 第一章新增一節「刪除需求單」：接單業務刪除後列表不再出現；非授權者看不到刪除按鈕 |
| mock 變動 | 無。刪除測試使用既有 mock 需求單，不改 MOCK-DATA-CHAIN 與 mock-data.js |

## 2. 測試先行

- [x] 2.1 情境目錄第一章新增「刪除需求單」一節，寫明前提、操作、系統之後怎麼變、期望值（期望值取自 spec Scenario「刪除需求單」THEN 描述）
- [x] 2.2 新增對應的 Playwright 測試：接單業務刪除一張需求單後，需求單列表不再出現該編號；非接單業務、非建立者、非編輯授權者看不到刪除按鈕

## 3. 驗證

- [x] 3.1 對照 Prototype `quote-prototype` 的刪除權限（`canDeleteQuote`）與 spec「接單業務、建立者或被授權編輯者」是否一致；不一致時記入 findings，不改 Prototype 以外的檔案。結果：一致（`canDeleteQuote` 同 `canManageQuote`，限業務或諮詢且為接單業務、建立者或編輯授權者）
- [x] 3.2 執行 `npm run test:module -- tests/e2e/01-quote` 與 `npx vitest run tests/unit/quote`，確認重新啟動與刪除的測試全部通過
