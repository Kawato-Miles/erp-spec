# Design: correct-production-stage-seg4a

## Context

生產階段校正段 4A。商業層設計正本 `production-stage-seg4a-design.md`（v3，三輪 plan-audit 收斂、Miles 拍板），wiki 已於 2026-08-12 落卡三批次（25 卡）。本 change 把 openspec main specs（8 個 capability）與 erp repo prototype 對齊到 wiki 現行正本。實作約束沿 handover：只動 erp repo `apps/erp/src/app/(prototype)/`、分支 `prototype/production-stage`、不開 PR、實作經 repo 內 `prototype-from-prompt` skill、dev server 用 launch.json `erp-verify`（port 3020，3000 可能被占用）。

## Goals / Non-Goals

### Goals

- openspec 8 個 capability 的 delta specs 合併後與 wiki 段 4A 落卡內容一致（取消連鎖五層、售後與補做統一、額度單軌、派單作廢、工單異動守衛、打樣路徑）
- prototype 實作全部 delta Requirement（feedback：change 中所有 Requirement 都必須實作 Prototype，不允許列 OQ 延後）
- mock 修正：打樣與大貨分屬不同印件（ACCEPTANCE 兩驗收項基準同步）

### Non-Goals

- prepress-review spec 整檔（歸段 4B 審稿重寫，含 clone reset 錯值、warehouseQty、bubble-up L700）
- 金額側（A 類訂單異動 15 項＋BI-25 同步債，另案）
- A1 設備停機資料來源（另案 MES）
- 「補印」與英文識別（AfterSalesTicket 等）的全庫用詞掃描（段 4 收尾另案）
- 售後單內退款／補收的實作細節（金額動作只做「依訂單雙終態開關」的可用性切換，動作本體屬 A 類）

## Decisions

1. **售後補做不建新印件（重工單模式）**：統一補做機制、售後單為觸發來源——對照製造業重工單（rework order 掛原單據、品質成本歸戶原工件）。否決方案：售後補印建新印件（wiki 原設計，審稿輪次複製、印件數膨脹、0 元新印件成本失真）、B3 加開印件承接（與加購同形無留痕）。prototype 實作面：售後單決議「補做」→ 導向印件詳情的既有補做發起動線（`startRemakeProduction` 擴充售後來源與終態例外），不新建售後專屬流程。
2. **出貨建單額度單軌**：唯一前提＝額度檢核（SAP ATP 範式）。prototype 實作面：建單入口的 `readOnly` 判斷改為額度判斷（終態頁保持可用）、已棄用印件自明細可選清單排除、修改明細檢核改增量式（當下額度＋本單原佔用）。
3. **取消連鎖在 store 層一次交易完成五層**：`cancelOrder` 擴充為印件（棄用）→ 工單（非終態轉已取消、進行中異動終止）→ 生產任務（場內看報工、外發看發稿分流）→ 派單（標提示不轉態）→ 未離廠出貨單（作廢＋回補）。分流判準以任務資料上既有的報工紀錄與派單發稿狀態推導，不新增欄位。
4. **派單作廢為存在性欄位**：與 13 值鏈平行（`is_voided` 類布林＋原因＋時間），非新增狀態值——13 值鏈凍結原地的語意由顯示層並存呈現（凍結值＋已作廢標記）。上游狀態目視化：派單列表加印件狀態、訂單狀態兩個唯讀顯示欄（資料自關聯讀取，不複製儲存）。
5. **手動推進的防呆在操作層**：逐格推進＋確認對話（終態格另寫文案），不加狀態機守衛——符合「防呆須有意義」拍板（操作確認 vs 狀態禁令）。

## Risks / Trade-offs

- [售後統一案觸及 after-sales-ticket 既有 9 個 Requirement] → delta 以 MODIFIED 全量取代、標題逐字匹配已由撰寫 agent 腳本驗證；archive 合併後跑 validate --strict 把關。
- [取消連鎖五層的跨模組寫入容易「畫面正常、資料流斷」（段 1 教訓）] → 每批實作後稽核逐條追跨模組寫入；tasks 為每層連鎖設獨立驗證項。
- [額度單軌拿掉終態把關後，若「已棄用排除明細」漏實作會讓已取消訂單出貨] → tasks 將配套一列為與前提移除同批的原子任務，不可分批。
- [erp repo 工作區有其他對話的平行變更] → commit 前確認範圍（handover 既有紀律）。

## Migration Plan

依 handover 既定流程：`/opsx:apply` 分批實作（Sonnet，經 prototype-from-prompt skill）→ 每批 Opus 稽核 → Fable 裁決 → commit → `/opsx:verify` → `/opsx:archive`（delta 合併回 main specs）。prototype 為 mock 層無資料遷移；回滾＝git revert 分支 commit。

## Open Questions

無阻擋實作的未決項。相關 open OQ（PT-027／ORD-043／PI-007）與本 change 行為語意無依賴。
