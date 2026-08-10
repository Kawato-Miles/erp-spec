## Why

### Background

wiki 於 2026-07 至 2026-08 完成生產階段重構與拍板擴散，段 2（報工、場內轉交）的商業層設計已於 2026-08-10 完成三輪 plan-audit 稽核（未通過 0）、Miles 拍板、wiki 落卡（W1–W27，commit 0344fd7）。商業正本：

- 報工規則與欄位：[報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)、[報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)
- 轉交五態與收貨人點收：[轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、[轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)
- 數量帳與齊套：[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md)
- 指標取數：[生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)
- 角色分工：[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)、[廠務](../../../memory/Sens_wiki/wiki/erp/03-roles/廠務.md)、[師傅](../../../memory/Sens_wiki/wiki/erp/03-roles/師傅.md)、[品檢人員](../../../memory/Sens_wiki/wiki/erp/03-roles/品檢人員.md)
- 有效對抗情境：[場內轉交與更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與更正.md)

設計正本：`production-stage-seg2-design.md`（§ 八 openspec 修正方向 H1–H26）、拍板紀錄 `production-stage-seg2-alignment.md`（§ 一至 § 九）。

### Problem Statement

openspec 五份 main spec 的報工與轉交規格落後於 wiki 拍板現況：報工欄位口徑（停機兩欄已移除、耗料延後、材料任務領用量）、轉交單生命週期（三態自動成單 → 五態生管建單）、到料放行依據（已送達 → 已點收）、可轉交量口徑（產出 → 良品）、指標取數（稼動率、折損率、漏單率）皆已改變，spec 不改則 prototype 校正無所依據。

### 相關未解 OQ（建立前查核，2026-08-10）

- [PT-042 拼版模數算法](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-042-拼版模數算法.md)：材料任務目標數量的算法待 Miles 提供，不擋本 change（mock 直接給目標值）
- [PT-026 外部廠商協作門戶身分與可視邊界](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-026-外部廠商協作門戶身分與可視邊界.md)：供應商自助報工介面繫此 OQ，spec 補管道行為、介面留待驗

## What Changes

- 報工欄位口徑修正：工序型四欄（投入／良品／不良品／實際工時）、材料型單欄（領用量）、外發變體（印務依點收結果補記，不填工時與設備）；**BREAKING**——停機時數與停機原因兩欄移除、耗料兩欄延後至庫存模組
- 報工檢核與作廢：良品＋不良品 ≤ 投入；作廢兩道前置檢核（額度不得為負、已流出擋作廢）；向上反映鏈補訂單層並加前態守衛
- 報工五管道補齊行為規格：師傅自助、供應商自助、生管代報、印務兩管道；師傅行動版範圍（報工＋點收）；廠務 Slack 通道四前提
- **BREAKING** 轉交單生命週期改五態（待搬運／搬運中／已送達／已點收／已作廢）：生管手動建單（取代廠務確認搬運自動成單）、批次建單依目的地分組、一單可跨印件、待搬運可改、回運單與「貨已在現場」更正路徑、作廢移生管
- **BREAKING** 到料放行改掛「已點收」：目的地 × 角色點收佇列（產線師傅群、品檢站品檢人員）、生管可代點收；滾動放行鏈接通（下游到料量遞增、回運為唯一減記）
- **BREAKING** 可轉交量改良品口徑：累計良品 − 未作廢明細抽走總和；良品數與產出數量同受報廢除帳（PT-041）
- 單據與歷程紀錄：生產任務與轉交單變化自動留痕（操作人、時間、觸發單據）、報工作廢留痕、印務人工註記
- 生產績效指標取數修正：稼動率（分子實際工時加總、分母設備固定班內工時）、折損率（單位明定、放損取報工紀錄）、良率分母改投入、補漏單率成六項、材料成本改取領用量 × 單價
- 進度呈現：印件層進度主數字改齊套完成數、產出數量退工單明細層、兩本帳並排
- 轉交範圍宣告：段 2 只做產線 → 產線、產線 → 品檢站；暫存區三類路徑與外部廠商目的地留段 3

## Capabilities

### New Capabilities

（無——全部為既有 spec 的行為修正）

### Modified Capabilities

- `production-execution`：報工欄位口徑與三變體、作廢檢核、五管道、工作包工時分填、轉交五態全流程（建單／點收佇列／回運／歷程紀錄）、材料型任務排除需轉交（H1–H8a、H22）
- `production-overview`：六項指標取數修正（稼動率、折損率單位、良率、漏單率）（H9–H14）
- `qc`：折損率分子括號修正、品檢站在站量口徑（＝已點收量）（H16、H26）
- `order-management`：印件詳情頁成本段與生產任務列品質帳修正、進度主數字改齊套完成數、措辭類（H17–H21）
- `work-order`：實際成本四來源、交付產線措辭、向上反映鏈訂單層（H23–H25）

## Impact

- openspec：上列五份 main spec 的 delta specs
- prototype（erp repo `prototype/production-stage` 分支）：`production-floor/`（報工、工作包、轉交）、`work-orders/`、`print-items/`、指標區塊；新增師傅行動版報工＋點收版型、工作包子母列表、批次報工欄位形式對話框（參照 `prepress-review/ReviewDialog` 範式）
- 不影響：品檢驗收流程本體（段 3）、出貨（段 3）、副流程（段 4）、庫存模組（未設計）
