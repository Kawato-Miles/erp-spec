# 任務清單

> 實作範圍：erp repo `/Users/b-f-03-029/erp` 的 `apps/erp/src/app/(prototype)/`，MUST 經 skill `prototype-from-prompt`；只動 `(prototype)/` 目錄。測試在 Sens repo `erp-prototype-tests/`。mock 異動順序固定：先改 `(prototype)/MOCK-DATA-CHAIN.md` → 再改各模組 `mock-data.js` → 最後改測試。

## 1. 規格

- [x] 1.1 wiki 十一卡落卡（log.md 2026-09-21 17:10 條目）。
- [x] 1.2 `openspec validate customer-requested-date-to-print-item --strict` 通過。

## 2. Prototype 與測試（與同批純介面調整合併施工）

- [ ] 2.1 mock：客戶指定收件日欄由訂單物件搬到印件物件，MOCK-DATA-CHAIN.md 同步。
- [ ] 2.2 訂單印件新增與編輯側板加「客戶指定收件日」（選填、日期），存檔時依同一件印件的印件預計交期做黃色提醒、不擋。
- [ ] 2.3 訂單資訊編輯側板刪該欄；訂單詳情不再出現訂單層客戶指定收件日。
- [ ] 2.4 印件基本資訊面板（兩頁共用）於日期組加「訂單預計交貨日期｜客戶指定收件日」兩欄唯讀。
- [ ] 2.5 測試：第四章相關情境（4.x 客戶指定收件日）改為印件層；14.22 欄位清單加兩欄；期望值取本 change 規格差異檔。
- [ ] 2.6 `npm run impact` 對映後跑 smoke 與影響章；PR 前跑全套。

## 3. 收尾

- [ ] 3.1 Miles 確認後 `openspec archive`。
