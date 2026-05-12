## ADDED Requirements

### Requirement: 售後服務單角色操作權責

售後服務單（adjustment_phase = after_completion 的 OrderAdjustment）操作權責 SHALL 與訂單異動單一致：

- 業務 / 諮詢：建立、提交審核、執行
- 業務主管：審核（核可 / 退回）
- 會計：僅可讀取（不可建立、審核、執行）

售後服務單執行後的發票處理（作廢 / 折讓）由業務 / 諮詢於訂單詳情頁的發票區操作，會計不直接執行。

#### Scenario: 業務於已完成訂單建立售後服務單

- **GIVEN** 訂單狀態 = 已完成
- **WHEN** 業務於訂單詳情頁點擊「建立售後服務單」
- **THEN** 系統 SHALL 允許並推算 adjustment_phase = after_completion
- **AND** 業務 SHALL 可填入 adjustment_type / 明細項並提交審核

#### Scenario: 業務主管審核售後服務單

- **GIVEN** 售後服務單.status = 待主管審核
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** 售後服務單.status SHALL → 已核可

#### Scenario: 會計不可執行售後服務單

- **GIVEN** 會計於訂單詳情頁開啟售後服務單清單
- **WHEN** 會計嘗試點擊「執行」按鈕
- **THEN** 系統 SHALL 隱藏該按鈕（會計無此權限）
