---
type: open-question
module:
  - 訂單管理
  - 諮詢單
  - state-machines
oq-id: ORD-037
status: answered
priority: high
audience: internal
raised-at: 2026-06-03
raised-by: Claude（Phase 4 Linear 交付 + doc-audit 對齊訂單收退款模型重構 發現跨 change 衝突）
source-link: openspec/specs/order-adjustment/spec.md + order-management/spec.md + consultation-request/spec.md（諮詢取消退費 OA 累計推進殘留；原 state-machines/spec.md 已廢除 2026-06-09 拆分至各模組）
related-vault:
  - "[[訂單異動規則]]"
  - "[[對帳一致性]]"
answered-at: 2026-06-10
answered-by: Miles
related-oq:
  - ORD-003
  - ORD-033
  - CR-5
---

# ORD-037：諮詢取消退費 OA 的累計推進機制是否被訂單收退款模型重構「核可即生效」取代

## 問題描述

兩個已 archive 的 change 對「退款 OA 如何推進到已執行」描述不一致：

1. **converge-consultation-cancel-to-order-cancel-flow（5/30 archived，CR-5 拍板）**：諮詢取消退費 OA（系統內生 amount=-1000、status=已核可、approved_by=system、executed_at=NULL）SHALL「退款 Payment 切已完成累計達 -1000 才推進已執行」，以維持 invariant「OA 已執行 → 必有已完成 Payment 累計達 amount」。
2. **refactor-order-receivable-refund-model（訂單收退款模型重構，6/02 archived）**：一般退款負項 OA「已執行」改為「核可後應收調整即生效、不綁退款 Payment 累計達標推進」，並移除回退機制（取代 ORD-003、移除 invariant「OA 已執行 → Payment 累計達標」）。

衝突：諮詢取消退費 OA 屬退款負項（amount<0），訂單收退款模型重構 的「核可即生效、不綁累計」按理應一體適用；但諮詢取消的描述（5/30，早於訂單收退款模型重構）仍停留「累計推進」舊機制。main spec 目前兩套並存。

## 涉及範圍

- 模組：order-management（OA 狀態機）、consultation-request（諮詢取消自動建單）、state-machines
- 殘留位置：state-machines L213/L229/L1221/L1297、order-management L102/L1315、consultation-request L407、business-processes L895
- 相關卡：[[訂單異動規則]]、[[對帳一致性]]
- 影響：諮詢取消半額退費的 OA 推進時點、invariant 是否仍成立、對帳應退差額兜底是否一致涵蓋諮詢取消情境

## 待解答

- [ ] 諮詢取消退費 OA 是否比照訂單收退款模型重構「核可即生效、不綁退款 Payment 累計」（即系統建立即已執行，不等退款 Payment 累計達 -1000）？
- [ ] 若是，CR-5 拍板的「建已核可 + 累計推進」是否整段改寫為「核可即生效」？invariant「OA 已執行 → 必有已完成 Payment」於諮詢取消情境是否放棄（改由對帳應退差額兜底）？
- [ ] 若否（諮詢取消刻意保留累計推進為特例），main spec 須明示「諮詢取消退費 OA 為訂單收退款模型重構 核可即生效的例外」並說明理由。

## 候選方案

### 方案 A：諮詢取消退費 OA 一體適用訂單收退款模型重構（核可即生效、不綁累計）
- 優點：退款 OA 推進語意全模組統一、消除 main spec 並存矛盾；對帳應退差額兜底機制一致涵蓋諮詢取消
- 缺點：放棄諮詢取消情境的「OA 已執行 → 必有已完成 Payment」invariant（converge 當時刻意維持），需確認半額退費留痕足夠

### 方案 B：諮詢取消退費 OA 保留累計推進為訂單收退款模型重構 例外
- 優點：維持 converge 當時 invariant 設計（半額退費留痕）
- 缺點：同類退款 OA 兩套推進語意、main spec 須額外標例外、增認知負擔

## 決議與理由

**決議**：兩個 change 的機制皆被 2026-06-10 Miles 實務拍板的「確認可執行」模型取代，三路徑統一：

1. 全狀態機「已執行」改名「**確認可執行**」（終態、不可逆），避免「聽起來像錢已退出去」的誤解。
2. 「負向異動須審核」零例外——諮詢取消退費因金額固定改由**系統代審**（建單即自動推進「已核可」，主管退款審核佇列只留線下單），不是免審破例。
3. 認列時點統一在進入「確認可執行」那一刻：補收＝建單生效時、一般退款＝主管核可時、諮詢取消＝**諮詢人員確認金額時**（確認前可調金額不重審、亦可取消不退）。
4. 退款 Payment 完成**不回寫**單據狀態（converge change 的「累計達標推進」廢止；收退款重構的「核可即生效」對諮詢取消修正為「確認即生效」），金流完結由對帳應退差額核銷歸零盯住。

**理由**：狀態承載「金額確認與認列」、金流完結由對帳層盯住——兩層分離，分次退款與建錯重退不再拉扯單據狀態；同時保留諮詢人員在認列前的金額把關窗口。

**決策者**：Miles（2026-06-10，實務四點拍板＋四問確認）

**落地**：[[訂單異動狀態]]、[[訂單異動規則]]、[[諮詢收尾規則]]、[[諮詢單狀態]]、order-adjustment / consultation-request / order-management 三份實作規格同步（2026-06-10）。
