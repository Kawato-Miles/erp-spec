## 1. 主 spec 前言與散落措辭對齊

- [x] 1.1 改 `openspec/specs/production-execution/spec.md` § Purpose 的範圍列：「報工（五管道）」改為「報工（四管道）」。驗證：`grep -n "五管道" openspec/specs/production-execution/spec.md` 無命中。
- [x] 1.2 全庫掃報工變體措辭。驗證：`grep -rn "報工變體\|兩個變體\|外發回廠變體\|場內變體" openspec/specs/` 無命中。
- [x] 1.3 全庫掃完成判定的分工措辭。驗證：`grep -rn "依廠商類別分工\|依廠商類別取\|外發任務取產出累計" openspec/specs/` 無命中。
- [x] 1.4 全庫掃供應商自助管道。驗證：`grep -rn "供應商自助" openspec/specs/` 無命中。
- [x] 1.5 「產出累計」逐處判斷。驗證：`grep -rn "產出累計" openspec/specs/` 的命中皆為印件層齊套或產出數量語意，無任何以它作生產任務完成判定的句子。

## 2. delta 併回主 spec

- [x] 2.1 執行併回，把 `production-execution`、`work-order`、`dispatch-order` 三份 delta 併回主 spec。驗證：`production-execution` 主 spec 的完成判定表只有一列，且出現「所有生產任務——任務類型（材料型／工序型／裝訂型）與承作單位（場內／場外）皆同」。
- [x] 2.2 併回後 `openspec validate --specs` 全部通過。
- [x] 2.3 確認被 MODIFIED 的十二個 Requirement 標題與主 spec 逐字相同（併回按標題比對）。驗證：`grep -c "### Requirement: 回廠點收" openspec/specs/dispatch-order/spec.md` 得 1。

## 3. 三方一致性檢查

- [x] 3.1 對照 wiki [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md) § 欄位（業務可見）的「所有生產任務同一組欄位、同一流程」段與併回後的 `production-execution` § 報工，兩邊欄位清單與留空欄位一致。
- [x] 3.2 對照 wiki [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md) § 轉換條件與觸發事件 與併回後的完成判定表，兩邊皆為單一條、皆取生產數量累計。
- [x] 3.3 對照 wiki [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md) § 報工的四個管道 與併回後的 `production-execution` § 報工，管道數與值域一致。
- [x] 3.4 對照 wiki [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) 料帳平衡三成分取數表 與併回後的 § 拉料備料 材料型良品口徑段，放損側取下游工序任務兩邊一致。
- [x] 3.5 確認 `production-overview` § 六指標的外發排除句未被本次改動波及（排除理由仍為 wiki 現行口徑）。驗證：`grep -n "外發批次 SHALL NOT 計入" openspec/specs/production-overview/spec.md` 讀過無矛盾項。
- [x] 3.6 確認 `work-order` § 短出結案與 § 預估成本凍結未被本次改動波及（數量算式與計價分項歸屬原樣保留）。
