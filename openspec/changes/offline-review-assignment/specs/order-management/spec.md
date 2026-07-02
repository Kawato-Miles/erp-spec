# order-management Delta：訂單回簽開放線下單審稿分派

> 商業邏輯正本：[審稿分配規則](../../../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/審稿分配規則.md)、[印件](../../../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)（「負責審稿人員」欄位正本）、[訂單管理人](../../../../../memory/Sens_wiki/wiki/erp/03-roles/訂單管理人.md)

## ADDED Requirements

### Requirement: 訂單回簽開放審稿分派與討論

線下訂單狀態轉入「已回簽」時，系統 SHALL 開放該訂單印件的審稿分派相關操作：

- 訂單管理人 SHALL 可對該訂單的印件執行審稿人員分派（分派行為規格見 prepress-review § 線下單審稿人員分派）。
- 業務 SHALL 可於該訂單勾選印件開啟 Slack 審稿討論串（行為規格見 prepress-review § Slack 審稿討論串）。
- 訂單回簽前（草稿 / 待業務主管審核 / 審核通過 / 報價待回簽），上述分派與開啟討論操作 MUST NOT 開放。
- 討論串連結 SHALL 留存於訂單、於訂單詳情可查。

**Priority**: P0

**Rationale**: 回簽是客戶正式同意成交條件的承諾點，回簽前分派審稿等於對未確認的訂單投入審稿人力；以回簽為閘門對齊「稿沒定不投產」的同一營運邏輯。

#### Scenario: 回簽後開放分派

- **GIVEN** 線下訂單狀態為「報價待回簽」
- **WHEN** 業務上傳客戶回簽檔、訂單轉入「已回簽」
- **THEN** 訂單管理人 SHALL 可對該訂單印件執行審稿人員分派
- **AND** 業務 SHALL 可勾選印件開啟審稿討論串

#### Scenario: 回簽前不開放分派

- **GIVEN** 線下訂單狀態為「審核通過」（尚未回簽）
- **WHEN** 檢視該訂單印件的分派操作
- **THEN** 分派與開啟討論操作 MUST NOT 可用
