## Why

### Background

售後服務單的受理範圍在 2026-08-28 由 Miles 拍板收緊：**限訂單已進終態（訂單完成、已取消）才能建單**。商業正本已落卡：

- [售後服務規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則.md)（建單前提與其動機的規則正本）
- [售後服務](../../../memory/Sens_wiki/wiki/erp/05-entities/售後服務.md)（所屬訂單欄與關鍵關聯）
- [售後服務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/售後服務狀態.md)（建立轉換的條件）
- [售後受理與決議](../../../memory/Sens_wiki/wiki/erp/07-scenarios/售後受理與決議.md)（受理段的完成過程）
- [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md)（終態後建立入口只有售後服務單的協調條文）
- [明細時點分界](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/明細時點分界.md)（售後單建單前提的引用處）
- [業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md)（售後受理職責）

相關未解 OQ：[ORD-049](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-049-諮詢取消退費撞上訂單異動終態守門.md)（諮詢取消退費撞上訂單異動終態守門，另案處理，不在本 change 範圍）；[AFT-14](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AFT-14-售後補做與品檢缺口補做的分流.md)（品質成本歸戶，另案處理）。

### Problem Statement

`after-sales-ticket` spec 現行寫「建單零前提、訂單成立後任何時間可建」，與拍板後的商業正本相反。差異來源是拍板理由改變：終態之前客戶反映的問題各有既有處理路徑（改印件明細、建訂單異動、退回審稿、品檢補做），再開一張售後服務單會讓同一件事在兩處留紀錄；訂單進終態後明細鎖定或整張訂單作廢，原路徑關上，才需要獨立容器承接客訴。

spec 不同步的後果：開發依 spec 施作會放行草稿訂單建單，與 wiki 正本、Linear 交付票三方不一致。

## What Changes

### New Capabilities

無。

### Modified Capabilities

- `after-sales-ticket`：建單前提由零前提改為限終態訂單；受理段把關描述、金額動作段落的「不依訂單是否達終態開關」與「訂單完成前兩路並行」相關條文一併同步。
- `business-scenarios`：售後服務情境敘述中「零前提——訂單成立後任何時間可建」的措辭同步。

**BREAKING**：`after-sales-ticket` 的建單前提反向收緊。既有 Scenario「訂單生產中即可建立售後服務單」的期望行為由允許改為擋下。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `after-sales-ticket`：Requirement「售後服務單建單零前提」改寫為「售後服務單限終態訂單建立」，含 Purpose 段、受理段把關敘述、清單頁說明文、金額動作的訂單狀態相關前提。
- `business-scenarios`：售後服務相關情境步驟的建單前提措辭。

## Impact

- 後端 `sens-print-core`：售後服務單建單驗證的狀態集合與錯誤訊息、鎖住舊行為的測試（已於 Linear BE-169 留言交付開發）。
- 前端：訂單詳情頁售後服務分頁的建立入口停用條件（已於 Linear FE-378 交付）。
- 訂單異動的終態守門**不動**：終態訂單的金額動作仍須掛在售後服務單底下，退款仍送業務主管核可，應收仍於確認生效才認列。
- Linear PM-1084、BE-169、FE-378 已同步完成，本 change 只補 spec 這一面。
