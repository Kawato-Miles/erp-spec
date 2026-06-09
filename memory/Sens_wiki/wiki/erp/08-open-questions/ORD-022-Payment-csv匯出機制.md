---
type: open-question
module:
  - 訂單管理
oq-id: ORD-022
status: open
priority: medium
audience: internal
raised-at: 2026-05-26
raised-by: Miles + remove-aging-payment-supervisor-dashboard change
source-link: openspec/changes/archive/2026-05-26-remove-aging-payment-supervisor-dashboard/proposal.md
related-vault:
  - [[../05-entities/訂單]]
  - [[../04-business-logic/付款發票邏輯]]
related-oq:
  - [[ORD-021-處理中Payment老化追蹤機制]]
related-change: remove-aging-payment-supervisor-dashboard
expected-resolution-at: 2026-Q3
---

# ORD-022：Payment csv 匯出機制

## 背景

`remove-aging-payment-supervisor-dashboard` change（2026-05-26 歸檔）拆除「業務主管老化處理中 Payment 清單頁」後，主管追蹤跨訂單老化 Payment 改採「匯出 csv row data 後 Excel 自行篩選」方式進行。但 csv 匯出機制本身（**觸發位置 / 欄位範圍 / 權限**三項）本次 change 不定義、留 OQ 後續決定。

Miles 評估後選擇 csv 匯出替代系統內聚合視圖的理由：

- 業務主管更習慣用 Excel 對 Payment row data 做臨機篩選、排序、樞紐分析
- 系統內固定欄位的清單頁反而限制彈性
- ERP 系統內維護「跨訂單聚合視圖」的成本與 Excel 匯出後篩選的價值不對等

## 問題

Payment csv 匯出機制如何設計？分為三條子問題：

### 子問題 1：觸發位置（在哪個頁面提供匯出按鈕？）

候選做法：

1. **款項管理列表頁**（新建 / 既有頁面內加按鈕）— 業務 / 主管登入後可從 sidebar 進入、篩選 + 匯出
2. **訂單詳情頁** — 限該訂單內 Payment 匯出（單訂單範疇、用於對帳檢查）
3. **業務主管專屬入口**（新 sidebar 條目，例：「報表中心」/「款項匯出」）— 限主管角色可見
4. **以上組合** — 列表頁 + 主管入口並存（業務 / 主管自由選擇）

### 子問題 2：欄位範圍（匯出哪些欄位？）

基礎欄位候選：

- 訂單編號 / 訂單案名 / 客戶名稱 / 業務負責人
- Payment id / amount / paymentMethod / paymentStatus / cancelled
- createdAt / paidAt / completedAt / cancelledAt
- 對應 OA id（若有）/ 對應 PaymentPlan id（若有）
- notes / recordedBy

待釐清：

- 是否含 paymentRef（金流系統參考號）
- 是否含 attachments 連結（對帳附件 URL）
- 是否含關聯 Invoice id（與 paymentPlanId 不同層級）

### 子問題 3：權限（誰能匯出？）

候選做法：

1. **業務 / 諮詢自己負責的訂單**（owner 範疇）+ **業務主管 / 諮詢主管 / supervisor 全公司範疇**
2. **僅業務主管以上角色可匯出**（業務不可、避免資料外流）
3. **依篩選器決定**（業務只能匯出自己 owner 的 row、主管自動全公司）

待釐清：

- 匯出檔案是否含 watermark / 浮水印 / 業務名稱戳記（用於外洩追蹤）
- 是否需要 audit log（誰於何時匯出哪批資料）

## 待釐清

- 觸發位置（子問題 1）
- 欄位範圍（子問題 2）
- 權限 + audit（子問題 3）
- 是否需要支援「篩選後匯出」（如：只匯出 paymentStatus = '處理中' 且 createdAt > 7 天的 row）
- csv 格式細節（編碼 UTF-8 with BOM 對 Excel 開啟、欄位分隔符、日期格式）

## 影響範圍

- 影響業務主管日常追蹤老化 Payment 的工作流
- 影響資料外流風險評估（外發 Excel 與系統內檢視的差異）
- 影響後續其他模組 csv 匯出機制的範本選擇（若有則 reuse 此設計）

## 來源

- `remove-aging-payment-supervisor-dashboard` change（2026-05-26）拆主管看板後留下的後續課題
- 對應 [[ORD-021-處理中Payment老化追蹤機制]] § 答覆 § 第二階段決策
