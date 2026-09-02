## 1. 主 spec 前言與散落措辭對齊

- [x] 1.1 改 `openspec/specs/production-execution/spec.md` § Purpose 的範圍列：「報工（四管道）」改為「報工」。驗證：`grep -n "四管道" openspec/specs/production-execution/spec.md` 無命中。
- [x] 1.2 全庫掃強調句。驗證：`grep -rn "皆同\|一體適用\|不依任務類型\|不依廠商類別" openspec/specs/` 無命中。
- [x] 1.3 全庫掃供應商自助與外部門戶。驗證：`grep -rn "自助報工\|廠商自助\|外部門戶" openspec/specs/` 無命中。
- [x] 1.4 全庫掃超量警示。驗證：`grep -rn "超量\|報工數量上限警示" openspec/specs/` 無命中。
- [x] 1.5 全庫掃依點收結果填報。驗證：`grep -rn "依點收結果報工\|依點收結果填報" openspec/specs/` 無命中。
- [x] 1.6 「留空」逐處判斷。驗證：`grep -rn "留空" openspec/specs/` 的命中皆為承作廠商留空、計畫設備留空或工單來源留空，無任何報工欄位留空的句子。
- [x] 1.7 「材料型」「備料」「領出」逐處判斷。驗證：`grep -rn "材料型\|備料\|領出" openspec/specs/` 的命中皆為成本算式、BOM 結構、配方展開、任務排序或備料清單彙總，無材料型專屬的報工與良品口徑句。
- [x] 1.8 改 `openspec/specs/production-execution/spec.md` § 場內轉交 的外發來源 Scenario：「印務依點收結果報工良品 1,200」改為「印務報工良品 1,200」（該 Requirement 其餘內容不動，故不進 delta）。驗證：`grep -n "依點收結果" openspec/specs/production-execution/spec.md` 無命中。

## 2. delta 併回主 spec

- [x] 2.1 執行併回，把六份 delta 併回主 spec。驗證：`production-execution` 主 spec 的完成判定為單句、無表格，且無「所有生產任務——任務類型」字樣。
- [x] 2.2 確認 REMOVED 生效。驗證：`grep -c "### Requirement: 報工數量上限警示" openspec/specs/production-execution/spec.md` 得 0。
- [x] 2.3 併回後 `openspec validate --specs` 全部通過。
- [x] 2.4 確認被 MODIFIED 的十六個 Requirement 標題與主 spec 逐字相同（併回按標題比對）。驗證：`grep -c "### Requirement: 回廠點收" openspec/specs/dispatch-order/spec.md` 得 1。

## 3. 三方一致性檢查

- [x] 3.1 對照 wiki [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md) § 欄位（業務可見）與併回後的 `production-execution` § 報工，兩邊要填的欄位一致，且兩邊皆無「留空」與「同一組」的措辭。
- [x] 3.2 對照 wiki [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md) 與併回後的 § 報工，管道值域四項一致，且兩邊皆無報工累計上限的規則。
- [x] 3.3 對照 wiki [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md) § 轉換條件與觸發事件 與併回後的完成判定，兩邊皆取生產數量累計、皆無依點收結果報工的措辭。
- [x] 3.4 對照 wiki [外發委外與回廠點收](../../../memory/Sens_wiki/wiki/erp/07-scenarios/外發委外與回廠點收.md) 主流程第 7 至 8 步 與併回後的 `dispatch-order` § 回廠點收：兩邊皆把切終態與報工當兩件事，點收段皆不含報工欄位說明與預帶生產數量。
- [x] 3.5 對照 wiki [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) 料帳平衡三成分取數表 與併回後的 § 拉料備料，spec 只引用該表、不複寫放損側取數。
- [x] 3.6 確認 `work-order` § 生產任務目標數量預設與放損率 的算式段未被本次改動波及（材料型預計生產取乘積、放損取固定開機損原樣保留）。
