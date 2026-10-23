---
type: open-question
module:
  - 出貨
tags:
  - 領域/履約與售後
oq-id: SHP-031
status: open
priority: medium
audience: internal
raised-at: 2026-10-23
raised-by: wiki-amend 落卡（change shipment-print-download-center，precheck R6）
source-link: change shipment-print-download-center precheck.md 矛盾 R6
related-vault:
  - "[[EC 物流串接約束]]"
  - "[[物流單]]"
  - "[[出貨單]]"
related-oq:
  - "[[SHP-025-保密代寄在各物流商的支援範圍]]"
---

# SHP-031 EC 物流串接約束卡上各列外部限制，在 ERP 自建的物流串接是否同樣成立

## 問題描述

2026-10-23 已知事實：ERP 的物流串接在 sens-print-core 分支 feat/logistics_carrier_integration#2489 自建，不是沿用 EC（sensation-api）。[[EC 物流串接約束]] 的現況段已改寫，取得物流商狀態的機制與頻率由後端決定（SHP-027 決議）。

但卡上下列各列的證據仍取自 sensation-api：物流單號由物流商回傳、順豐子母單只看主單、新竹物流子母單未串接、7-11 交貨便與全家的寄件人限制、批次拋單一次至多 30 筆且不防重複拋單、重複建單。這些限制在 ERP 自建串接是否同樣成立，沒有查證。

另：卡名「EC 物流串接約束」與現況（ERP 自建串接）不符。

本卡範圍：上列各列在 ERP 串接的事實，以及卡名是否改。保密代寄各物流商支援範圍見 [[SHP-025-保密代寄在各物流商的支援範圍]]。

## 待解答

- [ ] [[EC 物流串接約束]] 各列外部限制，在 ERP 自建串接是否同樣成立？卡名要不要改？

## 候選方案

- **A（向後端查證後逐列改寫）**：請後端（Bill）逐列確認 ERP 串接的行為，wiki 照實改寫 source 與規則；卡名改為「物流串接約束」。代價：需要後端時間。
- **B（維持現狀至串接完成）**：串接完成前保留 EC 證據，串接上線時再查。代價：期間設計可能引用到不成立的限制。

不受影響項：可出貨狀態、作廢不向物流商取消、物流商回傳取得機制由後端決定。

裁決後要同步的位置：[[EC 物流串接約束]] 各列與 source、[[物流單]] 與 [[出貨單]] 引用該卡之處。
