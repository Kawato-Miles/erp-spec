---
type: user-story
us-id: US-ORD-024
module:
  - 訂單管理
business-domain:
  - 款項與發票
role:
  - "[[會計]]"
priority: high
status: draft
created-at: 2026-05-28
last-reviewed: 2026-06-03
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
notion-published-at: 2026-06-03
notion-page-url: https://www.notion.so/3743886511fa81478643eda9a14756da
---

# US-ORD-024 會計匯出 14 欄對帳 CSV

## 業務情境

### 作為
[[會計]]

### 我希望
依日期範圍（含帳務公司 / 業務篩選）匯出對帳 CSV，每張已開立發票一列、含 14 欄資訊（含應收日、收款日、收款狀態、月結基準、帳期天數）

### 以便
月結對帳時不再依賴 Excel 人工拼湊各表資料；CSV 一鍵下載 Excel 開啟，所有對帳所需欄位已對齊（編碼 UTF-8 with BOM 中文不亂碼）

### 前置條件
- 會計可進入財務 / 應收款項頁面
- 訂單下存在「已開立」狀態的發票（作廢發票預設不列入）

### 業務流程
1. 會計於財務 / 應收款項頁點「匯出對帳 CSV」
2. 會計選擇日期範圍（預設本月 1 日至今日）+ 帳務公司 / 業務篩選（選填）
3. 會計可選擇是否含作廢發票（預設不含）
4. 系統預覽前 5 列 14 欄資料 + 顯示符合條件的總筆數
5. 會計確認後點「匯出 CSV」下載
6. CSV 自動含 UTF-8 BOM；Excel 直接開啟中文不亂碼

### 成功條件（acceptance criteria）

1. CSV 14 欄齊全：帳務公司 / 發票號碼 / 訂單編號 / 案名 / 開立日期 / 應收日期（繼承來源期次）/ 客戶名稱 / 總金額(含稅) / 備註（繼承來源期次）/ 收款日期（最近一筆已完成收款）/ 收款狀態 / 業務名稱 / 開立日期月底（月結基準）/ 天數（帳期）
2. 應收日期與備註從發票來源請款期次繼承（透過反向指針或 backfill helper 反查）
3. 收款狀態 derived，繼承來源期次的收款維度狀態（BillingInstallment.payment_status）；該狀態依未取消已完成核銷分配累計金額 vs 期次面額（scheduled_amount）三態判定：未收（累計 = 0）/ 部分收款（0 < 累計 < 期次面額）/ 已收訖（累計 ≥ 期次面額）
4. 帳期天數 = 應收日 − 開立日（給客戶的付款期 Net N，正值代表寬限天數）
5. 月結基準（開立日期月底）= 開立日該月的最後一天（EOM 計算）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 對帳 CSV 匯出（14 欄定稿）
- design.md § Decisions D9
