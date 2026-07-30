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

- **A（廢止 BOM 行項目層）**：印件不再持有 BOM 行清單，工單一律由款式與部件配方展開；無款式的全客製品由印務手動建生產任務（現行 Prototype 即此行為）。代價：印件層失去「這件印刷品用了哪些料工」的獨立清單，該資訊只能從旗下工單的生產任務反推；`work-order` spec 需刪兩個 Requirement，並確認沒有其他模組依賴 BOM 行項目（報價、EC 商品設定可能有）。
- **B（兩層並存、職責分工）**：配方層是「款式的可重用製法」，BOM 行項目是「這一件印件實際定案的料工清單」——展開時由配方寫入印件的 BOM 行項目，生產任務再由 BOM 行項目產生（配方 → BOM 行項目 → 生產任務三段）。代價：多一層資料要維護與同步，且目前 Prototype 是配方直接展開成生產任務、沒有中間層，實作與 spec 會再分歧一次。
- **C（BOM 行項目退化為展開快照）**：保留資料表但語意改為「展開當下的凍結快照」（類似 [[計價快照]] 的角色），只供事後查閱與成本追溯，不作為生產任務的產生來源。代價：需定義快照的凍結時機與是否隨工單異動更新。

不受影響項：[[印件款式]] 與 [[BOM配方]] 的欄位定義、[[配方展開規則]] 的九條規則、Prototype 的 M6 四頁與展開行為（三案皆不動）。

裁決後要同步的位置：`openspec/specs/work-order/spec.md`（兩個 BOM 行項目 Requirement 的去留）、[[工單]] 卡（若採 B 或 C 需補該層的欄位與關聯）、[[生產任務]] 卡（展開來源敘述）、[[配方展開規則]]（若採 B 需補中間層的寫入規則）。
