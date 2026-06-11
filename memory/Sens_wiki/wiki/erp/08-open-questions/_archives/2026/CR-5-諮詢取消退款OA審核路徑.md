---
type: open-question
module:
  - 諮詢單
  - 訂單管理
  - state-machines
oq-id: CR-5
status: answered
priority: medium
audience: internal
raised-at: 2026-05-29
raised-by: Claude (opsx:explore 諮詢取消收斂)
source-link: opsx:explore「諮詢取消收斂到一般訂單取消流程」討論（2026-05-29，plan：~/.claude/plans/stateful-chasing-hennessy.md）
related-vault:
  - [[../05-entities/訂單]]
  - [[../05-entities/諮詢單]]
related-oq:
  - BI-9
related-change: converge-consultation-cancel-to-order-cancel-flow
expected-resolution-at: propose 階段
answered-at: 2026-05-30
answered-by: Miles
---

# CR-5：諮詢取消自動建退款 OA(-1000) 的狀態流轉路徑

## 問題描述

諮詢取消收斂到一般訂單取消流程後，系統自動建的退款訂單異動 OA(-1000)，狀態流轉要維持「系統自動已執行」（現況 `approved_by=system`、建立即「已執行」），還是改走一般退款負項 OA 的「業務主管核可」路徑？

兩者對諮詢取消的權責歸屬與稽核留痕不同。

## 涉及範圍

- 模組：consultation-request（諮詢取消觸發）、order-management（OA 流程）、state-machines（OA 狀態機）
- 相關卡：[[訂單]]（OrderAdjustment 行為摘要 + 狀態機段嵌於此，OrderAdjustment 無獨立卡）
- 影響範圍：諮詢取消自動建單流程、OA 已執行 invariant、業務主管審核負擔

## 討論記錄

- 現況（refine-consultation-cancellation 2026-05-26）：諮詢取消系統自動建 OA(-1000, approved_by=system, status=已執行)，無兩階段審批。
- unify-billing（2026-05-28）：定「退款負項 OA 沿用主管核可路徑」（針對業務手動建的退款 OA）。
- 衝突點：諮詢取消是「系統自動半額退費」（政策性、無需人工決策），與「業務手動退款走核可」性質不同。收斂後是否要對齊？

## 待解答

- [ ] 諮詢取消退款 OA 維持系統自動「已執行」，還是改走業務主管核可
- [ ] 若改核可，半額退費是政策性、主管逐筆核可是否為無謂負擔
- [ ] 「已執行」是否綁退款 Payment 切已完成（對齊 BI-9 退款 invariant）

## 候選方案

### 方案 A：維持系統自動「已執行」
- 優點：諮詢取消是政策性半額退費、無需人工決策，自動執行減業務負擔
- 缺點：與一般退款 OA「主管核可」路徑不一致（[[BI-9-補收OA立即執行對稱破壞表述|BI-9]] 定退款負項走核可），收斂不徹底

### 方案 B：改走業務主管核可路徑
- 優點：與一般訂單退款 OA 完全一致（收斂徹底）、留主管審核軌跡
- 缺點：諮詢取消是系統自動半額，逐筆核可增加無謂負擔

### 方案 C：系統自動建「已核可」+ 綁退款 Payment 切已完成才「已執行」
- 優點：對齊 BI-9 退款 invariant（已執行必有已完成退款 Payment 累計達 OA.amount）
- 缺點：流程多一步，與現況「即時認列應收」體驗不同

## 決議與理由

**決議**：採方案 C（系統自動建「已核可」approved_by=system + 綁退款 Payment 切已完成累計達 -1000 才推進「已執行」）。

**理由**：序列協作 Phase 3 顧問（C-1）揭露 as-built 現況「一建即已執行」是 bug——「已執行」鎖死金額（order-management L1230）使業務無法調退款金額（違反 Phase 1「可調」），且配「處理中」退款 Payment 破壞 invariant（已執行 → 必有已完成 Payment 累計達 OA.amount）。方案 C 的「已核可」同時滿足：系統審核通過（approved_by=system 免人工核可，達成方案 A 的「無需人工決策」）+ 可調（已核可後修改不需重審 L1184）+ 善後歸一（沿用一般退款推進）+ 修 invariant bug。方案 A 鎖金額不可調、方案 B 逐筆人工核可增無謂負擔，皆不採。

**決策者**：Miles（2026-05-29，C-1 拍板）

**參考**：converge-consultation-cancel-to-order-cancel-flow design D1 + state-machines delta「諮詢取消退費 OA 系統建已核可」
