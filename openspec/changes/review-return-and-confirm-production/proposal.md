## Why

### Background

線下單（B2B）場景中，客戶在印件通過審稿合格後仍可能要求改稿（換 Logo、改文字等）。現行設計中，審稿維度「合格」為終態、不可逆（見 [印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md) § 關鍵狀態 / 轉換的營運動機），改稿只能走「棄用原印件 + clone 新印件」路徑（見 [稿件管理規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/稿件管理規則.md) § 三）。

相關角色權責：[業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md) / [諮詢](../../../memory/Sens_wiki/wiki/erp/03-roles/諮詢.md)（觸發退回與確認）、[審稿人員](../../../memory/Sens_wiki/wiki/erp/03-roles/審稿人員.md)（執行重審）、[審稿主管](../../../memory/Sens_wiki/wiki/erp/03-roles/審稿主管.md)（覆寫重審指派）。

工單建立時機與檔案鎖定：[印件生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/印件生產流程.md)、[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)。

審稿分派機制：[審稿分配規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/審稿分配規則.md)、[免審決策樹](../../../memory/Sens_wiki/wiki/erp/04-business-logic/免審決策樹.md)。

### Problem Statement

1. **操作繁瑣**：棄用 + clone 需業務手動建新印件、重新上傳稿件、重新走一輪審稿，客戶改稿頻率高時流程成本過重
2. **語意不對**：同一印件的改稿不應產生多筆印件紀錄，clone 造成訂單內印件數量膨脹、管理混亂
3. **缺乏業務確認閘門**：現行設計審稿合格後直接觸發工單建立，業務無法在「品質通過」與「投入生產」之間做最終確認

## What Changes

### 破壞性變更

- **BREAKING**：印件審稿維度「合格」從終態改為中間態，新增「已確認可製作」為新終態
- **BREAKING**：工單建立觸發點從「印件合格」後移至「印件已確認可製作」
- **BREAKING**：訂單 Bubble-up 派生規則調整（「所有印件合格」不再直接進入製作等待中）

### 非破壞性變更

- 新增「待改稿」狀態（合格後業務可退回，等客戶重新上傳）
- 新增「退回重審」操作（業務 / 諮詢觸發，必填退回原因）
- 新增「確認可製作」操作（B2B 業務手動、B2C 系統自動）
- 訂單製作段新增警示標記（有印件處於合格或待改稿時提示）
- 重審預設指派原審稿人員（審稿主管可覆寫）

## Capabilities

### New Capabilities

（無新增獨立 spec）

### Modified Capabilities

- **state-machines**：印件審稿維度新增「已確認可製作」「待改稿」兩狀態 + 3 條新轉換規則；訂單 Bubble-up 派生規則調整
- **business-processes**：審稿段流程新增「業務確認可製作」節點與「退回重審」分支；工單建立觸發條件修改
- **user-roles**：業務 / 諮詢角色新增「確認可製作」「退回重審」權限；審稿主管新增「覆寫重審指派」權限
- **prepress-review**：審稿分配規則新增「重審預設原審稿人員」邏輯；審稿人員待審清單新增「重審」標示
- **order-management**：訂單列表新增警示標記（印件待改稿提示）

## Impact

- **Prototype 影響**：印件狀態 enum 新增 2 值、訂單詳情頁印件卡片新增 2 個操作按鈕、訂單列表新增警示標記、審稿待辦清單新增重審標示、工單建立邏輯觸發條件修改
- **相依模組**：工單（建立時機）、任務 / 生產任務（連帶後移）、出貨單（不直接影響）
- **與既有路徑並存**：棄用 + clone 路徑保留（用於印件規格全換），退回重審用於同一印件改稿
