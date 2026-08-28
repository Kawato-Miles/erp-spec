## 1. 主 spec 前言與交叉引用對齊

- [ ] 1.1 改 `openspec/specs/after-sales-ticket/spec.md` § Purpose 第 3 行：「訂單成立後任何時間可建（建單零前提，把關下沉到單內決議選項）」改為「限訂單進終態（訂單完成、已取消）後可建」。驗證：該檔搜「零前提」與「任何時間可建」皆無命中。
- [ ] 1.2 改同檔 § Purpose 的「**建單 SHALL 為零前提**」段（原第 24 行），改為指向 § 售後服務單限終態訂單建立。驗證：該段不再出現「零前提」字樣，且引用的 Requirement 名存在。
- [ ] 1.3 全 `openspec/specs/` 搜「建單零前提」「訂單成立後任何時間」，逐處確認已無殘留或已改寫。驗證：搜尋結果為空。

## 2. delta 併回主 spec

- [ ] 2.1 執行 `/opsx:sync` 或 `/opsx:archive`，把 `specs/after-sales-ticket/spec.md` 與 `specs/business-scenarios/spec.md` 兩份 delta 併回主 spec。驗證：主 spec 內出現 Requirement「售後服務單限終態訂單建立」，且「售後服務單建單零前提」已不存在。
- [ ] 2.2 併回後確認 `after-sales-ticket` 主 spec 的 Requirement 標題無重複、Scenario 層級皆為四個井號。驗證：`openspec validate` 通過。

## 3. 三方一致性檢查

- [ ] 3.1 對照 wiki [售後服務規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/售後服務規則.md) 的建單前提與併回後的 spec，確認兩邊說法一致。驗證：兩處皆為「限訂單進終態（訂單完成、已取消）」。
- [ ] 3.2 對照 Linear PM-1084 受理段規則 1 與 BE-169 建單規則 1，確認與 spec 一致。驗證：三處的建單前提措辭同義。
- [ ] 3.3 確認訂單異動的終態守門在 `openspec/specs/order-adjustment/spec.md` 未被本次變更影響。驗證：該檔無 diff。

## 4. 另案項目登記

- [ ] 4.1 確認 [ORD-049](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-049-諮詢取消退費撞上訂單異動終態守門.md) 已在平層且 status 為 open。驗證：檔案存在於 `08-open-questions/` 平層。
- [ ] 4.2 「售後服務單內新增請款期次」與 BE-169「售後服務單內不建請款期次」相反，屬本 change 之外的既有落差；確認已記錄為另案，不在本次修正。驗證：本 change 的 design.md § Risks 已載明。
