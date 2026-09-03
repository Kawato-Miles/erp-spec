## 1. 主 spec 前言與散落引用對齊（不進 delta 的直接修改）

- [x] 1.1 改 `openspec/specs/production-execution/spec.md` § Purpose 範圍列：移除「開機費歸集與分攤」與「（含外發段依派單自動映射）」。驗證：`grep -n "開機費歸集\|自動映射" openspec/specs/production-execution/spec.md` 無命中。
- [x] 1.2 改 `openspec/specs/production-overview/spec.md` § Purpose 範圍列：「六指標（時間稼動率／…）」改為「五指標（折損率／良率／毛利率／成本達成率／漏單率）」，「交期倒推（`work-order`）」改為「工單排程日期（`work-order`）」。驗證：`grep -n "六指標\|稼動\|交期倒推" openspec/specs/production-overview/spec.md` 無命中。
- [x] 1.3 改 `openspec/specs/order-management/spec.md` § 印件訂單交期（扣除急件）推導 的下游取用句：引用改指 `work-order` § 工單排程日期。驗證：`grep -n "交期倒推建議日期" openspec/specs/order-management/spec.md` 無命中。
- [x] 1.4 改 `openspec/specs/order-management/spec.md` § 內部製作截止日定義 的銜接段：「推算完工日（依旗下生產任務的預計開工日與主檔工期順推）」改為「預計完工日（取旗下生產任務預計完成日的最大值後預填、印務可改）」。驗證：`grep -n "推算完工日\|預計開工" openspec/specs/order-management/spec.md` 無命中。
- [x] 1.5 全庫掃工時與稼動。驗證：`grep -rn "實際工時\|時費率\|班內\|稼動" openspec/specs/` 無命中。
- [x] 1.6 全庫掃折舊與開機費分攤。驗證：`grep -rn "折舊\|開機費依\|分攤基礎" openspec/specs/` 無命中。
- [x] 1.7 全庫掃生產任務在途兩值與映射。驗證：`grep -rn "已送集運商\|映射" openspec/specs/` 的命中皆為派單自身的狀態值（`dispatch-order` § 派單狀態轉換、`order-management` 取消連鎖情境），無任何生產任務的在途狀態或狀態映射句。
- [x] 1.8 全庫掃倒推與預填。驗證：`grep -rn "倒推\|用量倍率\|開機損\|建議日期\|預計開工" openspec/specs/` 的命中皆為「不倒推」「只作估算參考」一類的否定句或主檔／配方的參數定義，無任何系統預填算式。
- [x] 1.9 全庫掃外包分項與攤回口徑。驗證：`grep -rn "外包分項" openspec/specs/` 的命中皆為 SHALL NOT 句；`grep -rn "運費\|關稅" openspec/specs/dispatch-order/spec.md` 的命中不含「實際成本四分項」的歸戶句。
- [x] 1.10 全庫掃線性鏈與自動前置。驗證：`grep -rn "線性鏈\|自動成為\|自動連" openspec/specs/` 無命中。
- [x] 1.11 「累計良品數」逐處判斷。驗證：`grep -rn "累計良品數\|良品數" openspec/specs/production-execution/spec.md` 的命中皆為可轉交上限、報工作廢檢核或報工欄位，無任何以它當到料量的句子。

## 2. delta 併回主 spec

- [x] 2.1 執行併回，把七份 delta 併回主 spec。驗證：`production-execution` 主 spec 的 § 生產任務狀態轉換 無「自動映射」字樣，且 § 開機費歸集與分攤 不存在。
- [x] 2.2 確認四項 REMOVED 生效。驗證：`grep -c "### Requirement: 開機費歸集與分攤" openspec/specs/production-execution/spec.md`、`交期倒推建議日期`／`存量生產任務的數量拆欄遷移` 於 `work-order`、`外發在途段自動映射回生產任務` 於 `dispatch-order`、`展開時的數量與放損來源` 於 `recipe-expansion`、`六指標` 於 `production-overview` 皆得 0。
- [x] 2.3 確認三項 ADDED 生效。驗證：`grep -c "### Requirement: 工單排程日期" openspec/specs/work-order/spec.md`、`展開不帶數量、日期與前置` 於 `recipe-expansion`、`五指標` 於 `production-overview` 皆得 1。
- [x] 2.4 併回後 `openspec validate --specs` 全部通過。
- [x] 2.5 確認被 MODIFIED 的 Requirement 標題與主 spec 逐字相同（併回按標題比對）。驗證：`grep -c "### Requirement: 生產任務目標數量預設與放損率" openspec/specs/work-order/spec.md` 得 1。

## 3. 三方一致性檢查

- [x] 3.1 對照 wiki [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md) § 報工內容與併回後的 `production-execution` § 報工：兩邊要填的欄位皆為生產數量、良品數、不良品數、不良原因、現場照片，且兩邊皆無實際工時欄與放損欄；運轉設備兩邊皆取任務的計畫設備。
- [x] 3.2 對照 wiki [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md) § 狀態列舉與 § 轉換條件與觸發事件，與併回後的 § 生產任務狀態轉換：兩邊皆五值、皆四類廠商同一條路徑、皆無派單映射、手動完成皆不限廠商類別。
- [x] 3.3 對照 wiki [數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) § 二與併回後的 `work-order` § 生產任務目標數量預設與放損率：兩邊皆寫兩欄由印務手填、系統不預填不倒推不重算，且兩邊皆無沿鏈倒推與用量倍率代入的算式。
- [x] 3.4 對照 wiki [工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md) 與併回後的 `production-execution` § 派工前置檢查：兩邊的到料量皆只有轉交單已點收量一個來源，且兩邊皆寫不需轉交的前置不檢查也不擋派工。
- [x] 3.5 對照 wiki [配方展開規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/配方展開規則.md)「展開只帶任務清單與 BOM 引用」與併回後的 `recipe-expansion` § 展開不帶數量、日期與前置：兩邊皆寫數量、日期與前置留空。
- [x] 3.6 對照 wiki [生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md) 五項與併回後的 `production-overview` § 五指標：指標名稱、折損率算式、漏單率的日期基準與「不排除任何廠商類別」四項皆一致。
- [x] 3.7 對照 wiki [計價快照](../../../memory/Sens_wiki/wiki/erp/05-entities/計價快照.md) 與併回後的 `work-order` § 工單成本對照：實際成本皆為四分項同算式、數量取有效報工的生產數量累計，設備費實際皆只取階梯價。
- [x] 3.8 對照 wiki [工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) 預計完工日欄與併回後的 `work-order` § 工單排程日期：兩邊皆為取旗下任務預計完成日最大值後預填、印務可改。
- [x] 3.9 對照 wiki [設備](../../../memory/Sens_wiki/wiki/erp/05-entities/設備.md) 與併回後的 `equipment` § 設備主檔管理：主檔皆無時費率、每印費率、折舊、固定班內工時、準備時間與換料校機時間，皆保留開機費、階梯價、色彩倍率與固定開機損。
- [x] 3.10 對照 wiki [生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md) 派工範圍與併回後的 § 待派任務接收：兩邊皆寫待派清單只收自有工廠任務。
