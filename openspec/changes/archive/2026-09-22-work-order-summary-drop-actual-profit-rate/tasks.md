# 任務清單

> 實作範圍：erp repo `/Users/b-f-03-029/erp` 的 `apps/erp/src/app/(prototype)/`，MUST 經 skill `prototype-from-prompt`；只動 `(prototype)/` 目錄。測試在 Sens repo `erp-prototype-tests/`。

## 1. 規格

- [x] 1.1 wiki [[工單]] 卡落卡（log.md 2026-09-21 16:30 條目）。
- [x] 1.2 `openspec validate work-order-summary-drop-actual-profit-rate` 通過。

## 2. Prototype 與測試（與同批純介面調整合併施工）

- [ ] 2.1 摘要卡刪「實際利潤率」格，預估利潤率格與副值維持；不可見角色行為不變。
- [ ] 2.2 測試：第十四章摘要卡斷言改為只有預估利潤率一格、不出現實際利潤率；期望值取本 change 規格差異檔。
- [ ] 2.3 `npm run impact` 對映後跑 smoke 與影響章；PR 前跑全套。

## 3. 收尾

- [ ] 3.1 Miles 確認後 `openspec archive`。
