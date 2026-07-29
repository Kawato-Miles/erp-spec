---
type: open-question
module:
  - 工單
  - 生產任務
oq-id: PT-031
status: answered
priority: medium
audience: internal
raised-at: 2026-07-27
raised-by: 序列協作 Phase 1（工單管理 change，senior-pm 隱含假設 6）
source-link: openspec/changes/work-order-management（序列協作 Phase 4 匯報，2026-07-27）
related-vault:
  - "[[BOM配方]]"
  - "[[計價快照]]"
  - "[[數量換算規則]]"
related-oq:
  - "[[PT-030-數量換算下行取整方向表述缺口|PT-030]]"
expected-resolution-at: 工單管理 change verify 前（範疇級）
answered-at: 2026-07-28
---

# PT-031 BOM 配方層是否納入工單管理 change

## 問題描述

生產階段四個 change（工單管理／派工追蹤／品檢出貨／派單）的清單中沒有配方層（[[BOM配方]] 配方主檔、配方工序段）的位置，但架構卡分階段表把「EC 引用配方展開＋線下手動」列在 P1。此題不是否定「四個 change 依序」拍板，而是該拍板的 change 清單未涵蓋此項，需指定落點。

顧問已用兩個設計把此題從阻斷降為非阻斷：計價快照改「逐筆生產任務建立當下凍結」（EC 一次展開一次凍、客製逐筆凍共用同一規則）；生產任務「系統建議每份工單需生產數量」欄位無配方時留空即掛點。裁決任一方向，本 change 資料結構與凍結語意皆不用改。

## 待解答

- [ ] 配方層納入本 change、另立第五個 change、或確認本階段不做配方層？

## 候選方案

- **A（納入本 change）**：線下單引用配方展開、工單沉澱為配方一次到位；但需新增配方主檔與配方工序段兩實體與展開規則，體積顯著超出「每個 change 體積小好驗收」拍板。
- **B（不納入、另立落點）**：體積可控、四 change 節奏不變；「加放比例」生產任務層量測（覆寫倍數 vs 系統建議倍數差額）維持掛點不啟用，openspec BOM 行項目管理與配方層的關係維持未定。

## 決議

前提變更解題：2026-07-28 生產階段 high-level 重構設計拍板——「四個 change 依序」路線取消，改為 high-level 設計定案後 openspec 一次完整清整與對齊；work-order-management change 作廢。BOM 配方層納入清整範圍：工單管理模組（M1）「依 BOM 配方展開生產任務」為既定功能，配方主檔屬沿用主檔線（material／process／binding-master 沿用微調），不再有「落哪個 change」的分配問題。正本見 production-stage-high-level-design.md § 1。
