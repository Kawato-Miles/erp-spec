---
type: open-question
module:
  - 工單
  - 生產任務
tags:
  - 領域/生產執行
oq-id: PT-037
status: open
priority: high
audience: internal
raised-at: 2026-07-30
raised-by: recipe-management change archive 的 delta sync（Claude 識別）
source-link: openspec/specs/work-order/spec.md（同一份 spec 內兩套展開來源）
related-vault:
  - "[[BOM配方]]"
  - "[[印件款式]]"
  - "[[配方展開規則]]"
  - "[[工單]]"
  - "[[生產任務]]"
related-oq:
  - "[[PT-031-BOM配方層是否納入工單管理change]]"
expected-resolution-at: 2026-08-08
---

# PT-037 BOM 行項目與配方層兩套展開來源並存

## 問題描述

`openspec/specs/work-order/spec.md` 同時存在兩套「工單怎麼展開生產任務」的敘述，兩者的資料來源不同層：

- **既有（BOMLineItem 路線）**：Requirement「BOM 行項目管理」定義印件以 BOM 行項目資料表記錄每一項 BOM（材料／工序／裝訂三類互斥），Requirement「BOM 展開為生產任務」定義為每筆 BOM 行項目產生一筆生產任務並帶入產線與工廠類別。這兩條的粒度是**印件實例層**。
- **新增（配方路線）**：2026-07-30 同步進 main spec 的 Requirement「工單草稿建立」定義三路徑，其中兩條依 [[印件款式]] 的部件清單與各部件的 [[BOM配方]] 展開，粒度是**款式層可重用主檔**（規則正本 [[配方展開規則]]）。

矛盾性質：本次討論產生。recipe-management 的 proposal 曾寫「BOMLineItem 概念已被款式與部件配方兩層取代」，但該判斷未經拍板，delta specs 也沒有對應的 REMOVED Requirement，因此 sync 後兩套敘述並存於同一份 spec。不裁決的話，開發讀 spec 會不知道印件的 BOM 行項目資料表要不要留、生產任務的展開究竟從哪一層取數。

wiki 側目前只承認配方路線：[[工單]] 卡的關聯段寫「依 [[BOM配方]] 展開（一張工單對應款式底下一個部件的配方）」，未提 BOM 行項目層；[[生產任務]] 卡寫「引用 BOM 一類（材料／工序／裝訂三類互斥）……工單依 [[BOM配方]] 工序段展開生產任務時帶入」。

## 待解答

- [ ] BOM 行項目（印件實例層的 BOM 清單）是被配方層取代而應廢止，或兩層並存各有職責？

## 候選方案

- **A（廢止 BOM 行項目層）**：印件不再持有 BOM 行清單。有款式者由款式與部件配方展開；無款式的全客製品由印務手動建生產任務、**直接對三主檔挑項目**（料工資訊落在生產任務本身，不經中間層），此即現行 Prototype 的 M1 製程規劃行為。代價：印件層失去「這件印刷品用了哪些料工」的彙總清單，要看得跨旗下工單的生產任務彙總（資訊沒少、但呈現位置變了）——此代價與「有沒有配方」無關，是獨立的呈現需求。
- **B（兩層並存、職責分工）**：配方層是「款式的可重用製法」，BOM 行項目是「這一件印件實際定案的料工清單」——展開時由配方寫入印件的 BOM 行項目，生產任務再由 BOM 行項目產生（配方 → BOM 行項目 → 生產任務三段）。代價：多一層資料要維護與同步，且目前 Prototype 是配方直接展開成生產任務、沒有中間層，實作與 spec 會再分歧一次。
- **C（BOM 行項目退化為展開快照）**：保留資料表但語意改為「展開當下的凍結快照」（類似 [[計價快照]] 的角色），只供事後查閱與成本追溯，不作為生產任務的產生來源。代價：需定義快照的凍結時機與是否隨工單異動更新。

## 被依賴範圍（2026-07-30 查證 openspec/specs/ 全庫）

BOM 行項目只被兩份 spec 提及，波及面比預期小：

| spec | 角色 | 提及處 |
|------|------|--------|
| work-order | 定義處（唯一正式定義）＋工單展開生產任務的來源 | Requirement「BOM 行項目管理」、「工單展開生產任務」 |
| production-task | 消費者（只讀）：生產任務的產線由它帶入且帶入後唯讀；依它的工廠類別決定外包與中國廠商的分支 | 產線與工廠類別兩處條文 |

**報價（quote-request）、訂單（order-management）、EC（sales-platform）、材料／工序／裝訂三主檔皆零引用**——報價成本與 EC 商品設定在 spec 層面從未接上 BOM 行項目（三主檔的 Purpose 自稱供報價引用，但報價側無對應條文，屬單向宣告）。

附帶發現（不屬本題）：production-task spec 「依 BOM 行項目的工廠類別決定分支」一條，已被 2026-07-30 拍板取代——生產單位類別改由三主檔各自的承作廠商決定（見 [[生產任務]] 欄位表與 [[BOM結構]]），spec 尚未同步。此不同步先於本題存在，非本題造成；**Miles 2026-07-30 裁示：不另開 OQ，等生產階段 openspec 完整清整時一併處理**（清整範圍見 production-stage-high-level-design.md § 1.3）。

不受影響項：[[印件款式]] 與 [[BOM配方]] 的欄位定義、[[配方展開規則]] 的九條規則、Prototype 的 M6 四頁與展開行為（三案皆不動）；報價與 EC 兩側（零引用，任一案皆不波及）。

裁決後要同步的位置：`openspec/specs/work-order/spec.md`（兩個 BOM 行項目 Requirement 的去留）、`openspec/specs/production-task/spec.md`（產線的帶入來源改為配方工序段或印務手選）、[[工單]] 卡（若採 B 或 C 需補該層的欄位與關聯）、[[生產任務]] 卡（展開來源敘述）、[[配方展開規則]]（若採 B 需補中間層的寫入規則）。
