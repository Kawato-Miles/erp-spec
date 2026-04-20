## MODIFIED Requirements

### Requirement: 訂單確認觸發（Prototype 行為修正）

原 Prototype 實作為每個訂單狀態配一個手動推進按鈕，與[狀態機 spec](../../../../specs/state-machines/spec.md) 不符。修正為：Prototype 的 OrderDetail 頁面 SHALL 僅提供「確認回簽」與「取消訂單」兩個人工操作按鈕。

審稿段之後的狀態推進（稿件未上傳 → 等待審稿 → 製作等待中 → ... → 訂單完成）SHALL 由下層模組 bubble-up 驅動，Prototype 不提供手動按鈕。

#### Scenario: 線下訂單確認回簽（正常路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」
- **AND** 訂單下有印件的 reviewStatus 不為「合格」且不為「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「稿件未上傳」

#### Scenario: 線下訂單確認回簽（免審稿快速路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」
- **AND** 訂單下所有印件的 reviewStatus 皆為「合格」或「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」直接推進至「製作等待中」，跳過「稿件未上傳」與「等待審稿」

#### Scenario: 審稿段之後無手動推進按鈕

- **WHEN** 訂單狀態為「稿件未上傳」或之後的任何狀態
- **THEN** OrderDetail 頁面 MUST NOT 顯示狀態推進按鈕
- **AND** 狀態推進 SHALL 等待下層模組（印件審稿、工單、出貨）的 bubble-up 觸發

### Requirement: 成交轉訂單

系統 SHALL 支援從需求單一鍵轉訂單，自動帶入印件規格、客戶資料、交期。

#### Scenario: 需求單成交後建立訂單

- **WHEN** 業務在成交狀態的需求單點擊「建立訂單」
- **THEN** 系統 SHALL 建立新訂單，自動從 quote.printItems 映射為 OrderPrintItem[]
- **AND** 設定 quote.linkedOrderId = 新訂單 ID、quote.status = '成交'
- **AND** 新訂單狀態 SHALL 為「報價待回簽」
- **AND** 操作完成後導航至新訂單頁面
