## Why

### Background

2026-10-06 生產段分派、報工、轉交 grill 共二十七題拍板，wiki 已落卡（提交 977bb80）。拍板正本在 `memory/erp/production-dispatch-report-transfer-20261006/grill-decisions.md`。本輪依 Miles 拍板不跑 plan-audit，改為落卡時把情境卡寫完整（見拍板正本「範圍」表）。本 change 只把系統承諾與驗收條目同步到 OpenSpec。

本次對照的 wiki 正本卡：

| 類別 | 卡 |
|------|----|
| 規則 | [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)、[工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)、[印件生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/印件生產流程.md) § 生產管理單元的權限範圍、[數量換算規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/數量換算規則.md) |
| 實體 | [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)、[轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[工作包](../../../memory/Sens_wiki/wiki/erp/05-entities/工作包.md)、[產線](../../../memory/Sens_wiki/wiki/erp/05-entities/產線.md)、[人員](../../../memory/Sens_wiki/wiki/erp/05-entities/人員.md) |
| 狀態機 | [轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)、[生產任務交付狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務交付狀態.md)、[生產任務轉交狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務轉交狀態.md) |
| 角色 | [生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)、[師傅](../../../memory/Sens_wiki/wiki/erp/03-roles/師傅.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[品檢人員](../../../memory/Sens_wiki/wiki/erp/03-roles/品檢人員.md) |
| 情境 | [生產任務接收與派工](../../../memory/Sens_wiki/wiki/erp/07-scenarios/生產任務接收與派工.md)、[師傅報工與修改](../../../memory/Sens_wiki/wiki/erp/07-scenarios/師傅報工與修改.md)、[場內轉交與更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與更正.md)、[生產數量錯誤的逐層更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/生產數量錯誤的逐層更正.md)（新卡）、[生產管理單元可見範圍](../../../memory/Sens_wiki/wiki/erp/07-scenarios/生產管理單元可見範圍.md) |

相關未結 OQ：

| OQ | 與本 change 的關係 |
|----|------------------|
| [PT-067 產線底下的站點清單](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-067-產線底下的站點清單.md) | 站點清單未定；驗收條目與 mock 先用假資料（壓克力產線／數位站、品檢線／品檢站） |
| [PT-063 外發回台送場內後段是否走轉交單](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-063-外發回台送場內後段是否走轉交單.md) | 外發不在本輪；報工前置檢查沿用原條文 |
| [PT-064 來源任務報廢後重建的轉交單無法點收](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-064-來源任務報廢後重建的轉交單無法點收.md) | 逆流程不在本輪；條文不動 |
| [PT-042 拼版模數算法](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-042-拼版模數算法.md) | 單位換算全面拿掉後，wiki 數量換算規則已不引用；是否封存由 Miles 判斷 |

PT-065 已依拍板以「前提不成立」封存，本 change 移除 spec 對它的引用。

### Problem Statement

OpenSpec 仍承載拍板前的規則，與 wiki 正本衝突。衝突點如下：

| 主題 | spec 現行 | wiki 現行（拍板後） |
|------|----------|------------------|
| 報工前提 | 自有工廠任務須已派入工作包 | 交付時間有值且前置到料量大於 0；不看接收與打包 |
| 報工入口 | 含印件詳情頁，管道四值 | 五個入口、管道三值；印件詳情不報工 |
| 代報範圍 | 生產管理頁面代報不限工單 | 所有〇〇看所屬產線、我的〇〇看指派、工單詳情看負責或編輯分享 |
| 已完成任務 | 可再報工、維持已完成；不可作廢 | 不可新增報工；可修改與作廢，跌破目標退回製作中 |
| 數量單位 | 良品數依 BOM 單位用量換算 | 一律當數值，單位取 BOM 主檔設定只用於顯示 |
| 點收 | 首次點收、再次點收兩種動作；代點收標記 | 單一點收動作；不分代點收；點收紀錄可作廢，全作廢退回已送達 |
| 轉交單作廢 | 已送達一般不可作廢 | 點收前（待搬運、搬運中、已送達）都可作廢，原因為文字 |
| 搬運數量 | 開始搬運後鎖定 | 開始搬運後可經修改更正，有下限與額度檢核 |
| 批次建單超額 | 只擋超額那張 | 任一張超額即全部擋下 |
| 轉交目的地 | 目的地為產線或品檢站 | 明細記目的站點、單頭記目的產線；新增品檢線 |
| 人工註記、前置受影響 | 存在 | 拿掉 |
| 所有生產任務 | 只列自有工廠 | 列已交付的自有工廠與加工廠任務 |
| 數量錯誤更正 | 擋下後走人工程序與人工註記 | 由下往上逐層更正，每層照擋下條件檢查 |

## What Changes

- 報工：改寫報工前提、五個入口與三值管道、各入口範圍檢查；照片必填；已完成任務不可新增報工；拿掉所屬工作包與單位換算。
- 報工修改與作廢：擋下條件正本改指 wiki 報工規則；已完成任務可作廢；擋下後接逐層更正，不再提示人工註記。
- 新增「生產數量錯誤的逐層更正」系統承諾與驗收條目。
- 轉交與點收：點收單一動作、點收紀錄作廢、全作廢退回已送達；點收前可作廢；搬運數量修改更正；批次建單任一超額全擋；目的站點與目的產線。
- 生產管理單元：所有生產任務納入加工廠；跨產線工作包只能操作自己範圍的任務；點收佇列與所有轉交單功能相同；我的生產任務可報工、修改與作廢自己的報工。
- 工作包取消即刪除；報工不記所屬工作包。
- 刪除：人工註記、代點收標記、前置受影響、越權報工的稽核日誌、PT-065 引用。
- **BREAKING**：印件詳情頁的報工入口與「印務於印件詳情頁」提交管道移除（order-management 移除該 Requirement）。
- 工單：加工廠任務的交付狀態照常推導；生產任務的單位取 BOM 主檔項目的單位欄；刪單位換算句與前置受影響引用。
- 生產管理：拉料備料刪「派工擋前置」驗收條目；需轉交鎖定改看在途的轉交單；現場回報通道刪印件詳情頁管道；搬運數量一律大於 0。
- 指標：折損率與良率刪單位換算。
- 品檢：待驗清單的擋下條件正本改指 wiki 報工規則；點收人用語改「所屬產線含品檢線」。

外發、補做、逆流程不在本輪範圍，不新增相關條文；既有外發條文與本輪無衝突者不動。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- production-execution：改寫報工、轉交、點收、工作包、生產管理單元的系統承諾，新增報工前提與逐層更正。
- work-order：加工廠任務交付狀態照常推導；生產任務單位改取 BOM 主檔項目的單位欄。
- order-management：移除印件詳情頁批次報工入口；印件詳情區塊刪除報工入口殘句。
- production-overview：五指標的折損率與良率刪除單位換算。
- qc：待驗清單的擋下條件正本改指報工規則，點收人用語對齊品檢線。

## Impact

- Prototype（erp repo `(prototype)/`）：生產管理各單元、工單詳情生產任務頁籤、印件詳情的工單與生產任務區塊、轉交單側板與點收對話框、報工對話框。待修清單見拍板正本「Prototype 與 Linear 待修清單」。
- 驗收測試（Sens `erp-prototype-tests/`）：情境目錄第九、十、十四章與 smoke 主流程第 27、28、30、31～33 站；mock 鏈補站點假資料、加工廠樣本、點收紀錄備註。
- Linear（另案，由 Miles 觸發 linear-delivery）：PM-1356～1359、BE-424～426。
- 存量驗收條目缺 wiki 情境卡步驟者，列在 design.md § Open Questions，歸檔前補。
