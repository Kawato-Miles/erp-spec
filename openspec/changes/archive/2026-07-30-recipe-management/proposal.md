## Why

### Background

配方層的商業邏輯正本已於 2026-07-30 落卡，本 change 承接其行為規格：

- [印件款式](../../../memory/Sens_wiki/wiki/erp/05-entities/印件款式.md)：款式主表＋部件清單（部件配方／每組數量／是否獨立開工單）＋款式層工序段的欄位正本
- [BOM配方](../../../memory/Sens_wiki/wiki/erp/05-entities/BOM配方.md)：粒度由「商品款式」重構為「部件」、可跨款式重用；工序段補回裝訂欄
- [配方展開規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/配方展開規則.md)：引用可調、部件對工單映射、一段拆材料與工序兩任務、機台留空、數量與放損來源、款式指向生效版、沉澱骨幹、重複沉澱改版共九條規則
- [BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)：三主檔組成與計價引擎（成本計算沿用現行 EC 引擎、本 change 不重造）
- [印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)：款式與配方的維護者、引用展開與沉澱的執行者
- 設計正本：`production-stage-high-level-design.md` § 1.1 M6、§ 1.2 M6 功能表、§ 2.1 實體總圖、§ 5 Prototype 頁面組

相關未解 OQ（一項，不阻斷本 change）：[PT-023 材料用量帳與放損換算鏈正本歸屬](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-023-材料用量帳與放損換算鏈正本歸屬.md)——本 change 依既有拍板以配方段用量倍率推算材料任務數量（拼版模數自動換算為掛點），該 OQ 拍板後再對齊。

### Problem Statement

線下客製單的工單現況全靠印務手動規劃：料、工序、順序、倍數逐項填，回頭單重複下單也要從頭再填一次，是實際痛點。而一組商品常由多件各自完整的印刷品組成（壓克力吊牌、金屬鑰匙圈、外盒），同一部件又會跨商品共用——現況沒有任何可重用的製法載體，同款式重複下單只能重複勞動，改作法時也無法一次生效。

## What Changes

- 新增印件款式的維護行為：款式主表、部件清單（每行指定部件配方、每組數量、是否獨立開工單）、款式層工序段
- 重構 BOM 配方的維護行為：粒度改為部件、工序段可引用材料／工序／裝訂三主檔、配方改版與生效版切換
- 新增印件層「引用款式展開工單草稿」：帶出部件組合 → 可增刪部件與改數量 → 確認後一次建立多張工單草稿
- 新增工單「沉澱為部件配方」：指定所屬款式與部件（款式可順手建）、只存可重用骨幹、同部件已有生效配方則改版
- **BREAKING**（`work-order`）：工單草稿建立的路徑由兩條改三條，原 spec 依 BOMLineItem 逐筆展開生產任務的敘述廢止（BOMLineItem 概念已被款式與部件配方兩層取代）
- 工單新增「展開來源」三欄、印件新增「印件款式」欄——欄位正本在 wiki 實體卡，本 change 只規範其寫入與唯讀行為

## Capabilities

### New Capabilities

- `print-item-style`：印件款式主檔的維護與生效狀態管理（部件組成、每組數量、獨立開單旗標、款式層工序段）
- `bom-recipe`：部件配方主檔的維護、工序段序列、版本管理與生效版切換
- `recipe-expansion`：引用款式展開工單草稿（組合可調）、以及工單沉澱回部件配方（含重複沉澱改版）

### Modified Capabilities

- `work-order`：工單草稿建立由兩路徑改為三路徑（款式展開／線上單自動／線下手動），並移除已被三層配方取代的 BOMLineItem 展開敘述

## Impact

- Prototype：新增 M6 四頁（印件款式清單＋詳情、部件配方清單＋詳情、印件頁引用展開、工單詳情沉澱），落在 `erp` repo 的 `(prototype)/` 區
- 既有 spec：`work-order` 的工單草稿建立需改寫（BOMLineItem 展開敘述廢止）
- `material-master` / `process-master` / `binding-master`：被配方工序段引用，主檔本身行為不變、無 delta
- `order-management`：印件款式欄的欄位定義歸 wiki 印件卡，行為（未指定款式時不提供展開）已在 `recipe-expansion` 規範，無 delta
- 不影響：成本計算沿用現行 EC 計價引擎（`sensation-api product/pricing`），本 change 不動計價公式；拼版模數自動換算維持掛點
- 相依模組：工單製程規劃（M1）的手動 CRUD 已於 2026-07-30 落地，本 change 的展開結果進入同一個製程規劃 Tab
