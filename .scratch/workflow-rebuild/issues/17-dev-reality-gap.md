# 17：開發實作、Prototype、wiki 的資料落差實測

Type: research
Status: resolved

## Question

現行後端是哪一個程式庫？資料格式、列舉值、驗證規則各定義在哪裡？
以需求單為樣本，wiki、Prototype、正式前端、後端在狀態、欄位、驗證上實際差在哪？
開發的提交能不能對回 Linear 議題？
只讀，不改任何程式庫。

## Answer

全文在 `research/17-dev-reality-gap.md`，檔頭有主對話的抽查與補查。

- 現行後端是 sens-print-core（Django）。sensation-api 是電商後端，沒有需求單。
- 後端的介面契約由程式碼自動產生，經 CI 推到 `sensationsprint/api-docs`：每個環境一份、每個未合併的 PR 一份草稿、另有端點層級的變更紀錄。該程式庫的協作說明已寫明 PM 的用法。Sens 的代理環境完全沒有用到它。
- 正式前端是手寫的常數檔與 zod 驗證檔（`packages/shared/services/<模組>/`），不是由契約產生。
- 以需求單為樣本：狀態 5 處不一致、欄位 29 列有差異、驗證 25 列中 19 列不一致。類型有值域不同、數值範圍不同、欄位只存在一方、欄位名不同、識別碼型別不同。
- 開發的提交對得回 Linear 的比例低：前端非原型提交 6%，後端 23%。
- 原型到正式頁是重寫，不是搬移。需求單是正式頁先做、原型後做並複製其常數。
- 未查證 13 項。
