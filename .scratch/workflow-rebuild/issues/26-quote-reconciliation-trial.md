# 26：需求單對帳試做

Type: task
Status: open
Blocked by: 25

## Question

用需求單跑一次「現況同步」，驗證票 25 做出的東西可用。
基準是票 17 的實測：狀態 5 處不一致、欄位 29 列有差異、驗證 25 列中 19 列不一致。
產出三類差異；第三類由 Miles 裁決後更新 wiki；第二類依票 05 的改票規則開票給開發。
記錄 Miles 投入的時間，以及代理判讀規則邏輯的對錯。
同時評估讀後端程式碼時要不要採用程式碼圖譜類外掛（Anthropic 外掛目錄有 `code-graph`、`graph-indexer`、`cartographer`、`Sourcegraph`，都未安裝、未讀過原始檔）；要讀完原始檔才決定。

## Notes

- 開票給開發是對外動作，開票前把清單給 Miles 確認。
