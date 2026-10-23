# grill 後流程改版：change 資料夾作為設計載體（2026-10-22 拍板）

起因：出貨單批次拋單案（change 2026-10-22-shipment-batch-dispatch-box-size）的重工。
- 同一份設計寫兩次：plans/design.md 與 change 的 proposal＋design 內容重疊。
- 帶著未決 OQ 進 propose：SHP-026 在 propose 後才拍板，只好回頭改 change。
- pre-check 晚跑：grill 第一輪後才補跑，多了一輪 grill（執行跳步，非流程缺陷）。

## 拍板

| 序 | 拍板 |
|---|---|
| W1 | change 資料夾取代 plans 資料夾當設計載體；plan-audit 改審 change（proposal＋design）；delta specs 在 wiki 落卡後才寫。另加 OQ 閘門（見 W3） |
| W2 | grill.md、precheck.md、audit-rN.md 全放 change 資料夾；plans 資料夾廢止；wiki-schema 寫明 source 可指 change 資料夾內的 grill.md（仍禁指 openspec/specs/） |
| W3 | 設計拍板時，一併列出本次涉及且影響行為的未決 OQ，逐題請 Miles 裁決或延後；延後者不寫進 specs，也不在 proposal 寫排除段 |
| W4 | 流程第 1 步就 `/opsx:new` 建 change；grill 開始前 change 資料夾沒有 precheck.md 就停下補跑 |
| W5 | change 的 design.md 改為 plan-design 結構（本體＋必含段）；寫 specs 時在檔尾追加「規格與驗收對應」。只改本專案 schema（openspec/schemas/sens-spec-driven）與模板，移除部署與回滾段；OpenSpec 外部 skill 不動。查證：design 在相依鏈上為選填，apply、verify、archive 用 design 的方式與商業設計相容 |
| W6 | 只用在新主題；進行中的 plans 資料夾（document-access-scope-20261013、linear-format-20261012、production-ui-correction-20261012、shipment-batch-dispatch-box-size-20261022）照舊流程收尾後搬 plans/_archives |
| W7 | ERP 流程不用 `/opsx:propose`，改用 `/opsx:new` 加 `/opsx:continue` 分段產出；config 加規則：change 內沒有 Miles 拍板紀錄與 wiki 落卡紀錄時不寫 specs |
| W8 | design 必含段④改為「拍板引用與隱含假設段」：首行寫拍板見同資料夾 grill.md，不謄錄，只列隱含假設清單；收件條件為 change 內有 grill.md 且④有隱含假設清單；稽核者仍讀 grill.md 驗 5-1 |

## 新流程

| 序 | 步驟 | change 內產出 |
|---|---|---|
| 1 | `/opsx:new` | — |
| 2 | erp-planning-pre-check | precheck.md |
| 3 | grill（含 pre-check 找出的未答題） | grill.md |
| 4 | `/opsx:continue` 產 proposal 與 design（plan-design 結構） | proposal.md、design.md |
| 5 | plan-audit | audit-rN.md |
| 6 | Miles 拍板，並裁決未決 OQ | grill.md 追加 |
| 7 | wiki-amend | （wiki） |
| 8 | `/opsx:continue` 產 specs 與 tasks；design 檔尾追加規格與驗收對應 | specs、tasks.md |
| 9 | Prototype、測試、發布 | （erp） |
| 10 | archive | 整個資料夾搬進 archive |

## 被否決的方案

- 保留 plans 與 change 兩份，propose 只引用不重寫：仍是兩個資料夾、兩邊搬、archive 後路徑要維護。
- 只加未決 OQ 閘門、流程不變：解不了設計寫兩次。
- 另開 brd-design.md 放商業設計、design.md 維持技術設計：同資料夾又有兩份設計。
- 保留 `/opsx:propose` 只在 wiki 落卡後使用：proposal 與 design 已存在，propose 會重寫；例外規則過多。

## 實作補定（2026-10-22，依拍板推得）

- schema 產出順序改為 proposal → design → specs → tasks（相依不變），讓 `/opsx:continue` 先產 design。
- wiki-amend 完成後在 grill.md 檔尾追加「wiki 落卡紀錄」段（卡名＋提交碼），作為寫 specs 的前置證據。
- 「規格與驗收對應」段為三欄表：驗收條目｜情境卡步驟｜情境目錄節號。
- 延後的 OQ 只留在 Vault OQ 卡；change 內只在 grill.md 記「延後：OQ 編號」。
- wiki source 引用 change 時寫「change <名稱> grill.md G編號」，不寫路徑（archive 後路徑會變）。
- 規劃結果會進 change 時先 `/opsx:new` 再跑 pre-check；純探索討論只跑 pre-check。
