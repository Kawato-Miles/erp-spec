---
type: open-question
module:
  - 訂單管理
oq-id: ORD-034
status: open
priority: medium
audience: internal
raised-at: 2026-06-03
raised-by: Miles（退款角色拍板：業務執行/主管把關）
source-link: 2026-06-03 訂單發布迭代討論（退款執行角色決策）
related-vault:
  - "[[訂單]]"
related-oq:
  - ORD-031
  - ORD-033
---

# ORD-034：退款執行改業務後，US-ORD-013 卡結構（retitle / 合併 / 折讓歸屬）

## 問題描述

退款執行角色經拍板為「業務執行、業務主管把關」（會計不專屬執行退款）。但 US-ORD-013 當初（2026-05-22）為了分離「會計執行退款」動作，從 US-ORD-011 拆出，檔名為「US-ORD-013-會計執行退款處理」。

退款執行改業務後：
- US-ORD-013 的核心動作（建退款付款紀錄、上傳匯款證明切已完成核銷應退差額）已歸業務，與 US-ORD-011 重疊。
- 檔名仍為「會計執行退款處理」，與 role=業務 不一致（已暫改 role，檔名未動以免斷連）。
- 折讓單建立 / 跨月發票沖減 / 對帳核銷部分是否仍歸會計，待確認。

## 涉及範圍

- 模組：order-management
- 相關卡：US-ORD-011、US-ORD-013
- 影響：user story 卡結構（是否 retitle 檔名 / 與 US-ORD-011 合併）；退款流程角色分工

## 待解答

- [ ] US-ORD-013 是否 retitle 檔名（去除「會計」）或與 US-ORD-011 合併？
- [ ] 折讓單建立 / 對帳核銷是否仍歸會計，或一併歸業務？
- [ ] 若 retitle：依連結穩定性原則用官方 rename 維護反向連結，不 git mv。
