# 設計說明

## Decisions

- D1 只刪摘要卡的實際利潤率格，預估利潤率格與其副值「預估利潤」維持；可見範圍條文不動。
- D2 「取代任務進度與顏色費用合計兩格」的歷史條文改寫為由預估利潤率一格取代，不保留「兩格」字樣。
- D3 印件層與訂單層實際利潤率的規格（sales-platform、order-management、production-overview）不在本 change 內、一字不動。

## Risks

- 測試情境 14.x 摘要卡斷言含實際利潤率格，需同步改；期望值取自本 change 規格差異檔的 THEN。
