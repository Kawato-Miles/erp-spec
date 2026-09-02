## 1. 主 spec 前言與散落措辭對齊

- [x] 1.1 改 `openspec/specs/production-execution/spec.md` § Purpose 的範圍列：「拉料備料」保留，「報工（五管道）」不動；確認 § 範圍未把材料型寫成獨立流程。驗證：該檔 Purpose 段搜「領用量」無命中。
- [x] 1.2 全庫掃殘留欄名。驗證：`grep -rn "領用量" openspec/specs/` 的命中只剩明文禁止句（SHALL NOT 提供「領用量」），無任何把它當有效欄位使用的句子。
- [x] 1.3 全庫掃殘留特例措辭。驗證：`grep -rn "報工即完成\|三個變體\|三種報工變體\|材料型生產任務 SHALL 固定\|材料型任務固定" openspec/specs/` 的命中只能是明文禁止句（SHALL NOT 以「首筆報工即完成」為判定），無任何把它當規則使用的句子。

## 2. delta 併回主 spec

- [x] 2.1 執行 archive，把 `production-execution`、`work-order`、`recipe-expansion`、`production-overview`、`order-management` 五份 delta 併回主 spec。驗證：`production-execution` 主 spec 的完成判定表只有場內與外發兩列，且出現「不需轉交的前置 SHALL 取該前置的**累計良品數**」。
- [x] 2.2 併回後 `openspec validate --specs` 全部通過。
- [x] 2.3 確認被 MODIFIED 的九個 Requirement 標題與主 spec 逐字相同（archive 按標題比對）。驗證：`grep -c "### Requirement: 拉料備料" openspec/specs/production-execution/spec.md` 得 1。

## 3. 三方一致性檢查

- [x] 3.1 對照 wiki [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md) § 欄位（業務可見）的兩種報工變體表與併回後的 `production-execution` § 報工，兩邊變體數與欄位清單一致。
- [x] 3.2 對照 wiki [生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md) § 轉換條件與觸發事件 與併回後的完成判定表，場內三類同取投入累計、外發取產出累計兩邊一致。
- [x] 3.3 對照 wiki [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 數量「欄位結構不依任務類型分支」與併回後的 `work-order` § 製程規劃、§ 生產任務目標數量預設與放損率，放損率三類一律顯示、無值填「—」兩邊一致。
- [x] 3.4 確認 `dispatch-order` spec 未與本次完成判定衝突（外發取產出累計不變）。驗證：`grep -n "產出累計\|點收" openspec/specs/dispatch-order/spec.md` 讀過無矛盾項。
- [x] 3.5 確認 `work-order` § 存量生產任務的數量拆欄遷移 與 § 預估成本凍結 未被本次改動波及（數量算式與計價分項歸屬原樣保留）。
