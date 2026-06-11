---
type: open-question
module:
  - 訂單管理
  - cross-module
oq-id: SHP-006
status: open
priority: medium
audience: internal
raised-at: 2026-06-01
raised-by: Miles
source-link: openspec/specs/order-management/spec.md（「出貨模組待建立」佔位）+ sens-erp-prototype/src/types/order.ts（ShipmentRecord / ShipmentItem）
related-vault:
  - "[[出貨單]]"
  - "[[出貨單狀態]]"
  - "[[出貨人員]]"
related-oq:
  - SHP-005
expected-resolution-at: 2026-Q3
---

# SHP-006：何時建立出貨模組 spec（補 Data Model + 狀態機）

## 問題描述

出貨單的欄位真相目前只存在於 Prototype 程式碼（`sens-erp-prototype/src/types/order.ts` 的 `ShipmentRecord` / `ShipmentItem`），OpenSpec 層**沒有出貨模組的正式規格**：

- 無出貨單 Data Model（order-management spec 僅一句「出貨模組待建立」佔位）
- 無出貨單狀態機的正式 Requirement

導致 wiki 商業邏輯卡（[[出貨單]] / [[出貨單狀態]]）失去可引用的 OpenSpec 正本，只能自行描述欄位與狀態，與「wiki 引商業邏輯、OpenSpec 為實作規格」的分層原則相違，且與 Prototype 真相易漂移。

需決定：**何時開 OpenSpec change 補建出貨模組 spec。** 補齊後才能把 [[出貨單]] / [[出貨單狀態]] 的重複欄位 / 狀態描述砍掉、改為引用 OpenSpec spec。

## 涉及範圍

- 模組：order-management（出貨單）、cross-module
- 相關卡：[[出貨單]]、[[出貨單狀態]]、[[出貨人員]]、[[齊套邏輯]]
- 影響範圍：
  - OpenSpec 出貨模組 spec（Data Model + 狀態機 Requirement）新建
  - wiki [[出貨單]] / [[出貨單狀態]] 去重（改引 OpenSpec 正本）
  - 與 SHP-005（分批出貨觸發節點）等出貨業務邏輯 OQ 的承接時序

## 討論記錄

出貨相關業務邏輯議題（如 SHP-005 分批出貨觸發節點）已累積，但缺少正式 spec 作為載體。本 OQ 聚焦的是 **spec 建立時程的排序決策**：是先把分批出貨等業務邏輯議題收斂，再一次補完整出貨模組 spec；還是先補基礎 Data Model + 狀態機 spec，再迭代補業務規則。

原處（[[出貨單]] / [[出貨單狀態]]）的引用調整由其他流程處理，本卡僅記錄待 Miles 拍板的 spec 建立時程決策。

## 待解答

- [ ] 何時開出貨模組 OpenSpec change（與其他模組 roadmap 的優先排序）？
- [ ] 出貨模組獨立成 spec，還是併入 order-management spec 的一個 section？
- [ ] 補齊後 [[出貨單]] / [[出貨單狀態]] 改引 OpenSpec 的去重時點？

## 候選方案

### 方案 A：先補基礎 spec（Data Model + 狀態機），業務規則後續迭代

- 先把 Prototype 的 `ShipmentRecord` / `ShipmentItem` 欄位真相固化為 OpenSpec Data Model + 出貨單狀態機 Requirement
- 後續再以獨立 change 補分批出貨（SHP-005）等業務規則
- 優點：盡早建立可引用正本、止住 wiki 與程式碼漂移；缺點：分批出貨等議題仍待後補

### 方案 B：等出貨業務邏輯議題收斂後一次補完整 spec

- 先收斂 SHP-005 等出貨業務 OQ，再一次補完整出貨模組 spec
- 優點：spec 一次到位；缺點：wiki / 程式碼漂移期拉長

### 方案 C：併入 order-management spec 作為一個 section

- 不獨立 spec，於 order-management spec 內補出貨 Data Model + 狀態機 section
- 優點：避免新增 spec 檔；缺點：出貨議題量若大，後續可能仍需拆出
