## Why

### Background

2026-10-12 生產與出貨介面修正 grill 共五十六題拍板，設計稿經規劃稽核三輪後由 Miles 拍板。wiki 已落卡（提交 718f51b、7995c14、96ba2e8、6b65371、a748db4）。工作稿正本在 `memory/erp/plans/production-ui-correction-20261012/`（grill.md、design.md、audit-r1～r3）。本 change 只把系統承諾與驗收條目同步到 OpenSpec，不重跑釐清。

本次對照的 wiki 正本卡：

| 類別 | 卡 |
|------|----|
| 規則 | [報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)（修正範圍依入口、一次報多筆、併發寫入）、[工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)（點收修正下限）、[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)、[印件生產流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/印件生產流程.md) |
| 實體 | [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)（修正的定義與責任原則）、[品檢紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/品檢紀錄.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) § 品檢缺口處置、[轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[出貨單](../../../memory/Sens_wiki/wiki/erp/05-entities/出貨單.md) |
| 狀態機 | [轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、[出貨單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/出貨單狀態.md) § 揀貨不符與裝箱回報修正、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)、[生產任務轉交狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務轉交狀態.md) |
| 角色 | [師傅](../../../memory/Sens_wiki/wiki/erp/03-roles/師傅.md)、[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[品檢人員](../../../memory/Sens_wiki/wiki/erp/03-roles/品檢人員.md)、[揀貨人員](../../../memory/Sens_wiki/wiki/erp/03-roles/揀貨人員.md)、[出貨人員](../../../memory/Sens_wiki/wiki/erp/03-roles/出貨人員.md)、[業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md) |
| 情境 | [報工與修正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/報工與修正.md)、[場內轉交與修正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與修正.md)、[生產數量錯誤的逐層修正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/生產數量錯誤的逐層修正.md)、[品檢通過入庫](../../../memory/Sens_wiki/wiki/erp/07-scenarios/品檢通過入庫.md)、[QC不通過補生產](../../../memory/Sens_wiki/wiki/erp/07-scenarios/QC不通過補生產.md)、[出貨與送達](../../../memory/Sens_wiki/wiki/erp/07-scenarios/出貨與送達.md) |

相關未結 OQ（相關行為不進本 change）：

| OQ | 本 change 的處理 |
|----|----------------|
| [SHP-020 ERP 出貨單承接 EC 物流串接的狀態對映與拋單失敗處置](../../../memory/Sens_wiki/wiki/erp/08-open-questions/SHP-020-ERP出貨單承接EC物流串接的狀態對映與拋單失敗處置.md) | 只收已部分拍板的兩點：第三方出貨確認稱拋單、物流單號由物流商回傳。拋單失敗、狀態對映、輪詢延遲不寫 |
| [SHP-021 出貨單編輯與作廢的操作範圍未涵蓋改派與代理](../../../memory/Sens_wiki/wiki/erp/08-open-questions/SHP-021-出貨單編輯與作廢的操作範圍未涵蓋改派與代理.md) | 建單人不在時誰改出貨明細，不寫 |
| [SHP-022 出貨明細全數缺貨時無法移除該條明細](../../../memory/Sens_wiki/wiki/erp/08-open-questions/SHP-022-出貨明細全數缺貨時無法移除該條明細.md) | 移除單條明細、揀貨數量可否填 0，不寫 |
| [QC-010 計入完成度任務報廢後待驗量變負](../../../memory/Sens_wiki/wiki/erp/08-open-questions/QC-010-計入完成度任務報廢後待驗量變負.md) | 報廢後已驗量的處理，不寫 |

進行中的 change [production-dispatch-report-transfer-convergence](../production-dispatch-report-transfer-convergence/proposal.md)（下稱收斂 change）與本 change 動到同一批 Requirement。分界如下：

| 項目 | 收斂 change | 本 change |
|------|-----------|----------|
| 依據 | 2026-10-06 grill（報工前提、五個入口、點收單一動作、站點） | 2026-10-12 grill（修正機制統一、品檢與出貨） |
| 生產執行 Requirement 的寫法 | 以主規格為底改寫 | 以收斂 change 改寫後的文字為底，再套本次修正 |
| 歸檔順序 | 先歸檔 | 後歸檔；本 change 的 MODIFIED 與 RENAMED 依賴收斂 change 新增的 Requirement |

兩者沒有規則衝突。本 change 推翻的收斂 change 條文（報工修正範圍「生管、印務、印務主管不受此限」、品檢負數沖銷）都是 wiki 在 2026-10-12 拍板翻案，翻案依據在 design.md。

### Problem Statement

OpenSpec 仍承載修正機制統一之前的規則與用詞，與 wiki 正本衝突：

| 主題 | spec 現行 | wiki 現行 |
|------|----------|----------|
| 修正用詞 | 修改、更正混用 | 一律「修正」；修正一次、每個被改的欄位記一筆修正紀錄 |
| 報工修正範圍 | 師傅限自己提交；生管、印務、印務主管不受此限 | 依入口：所有生產任務、所有工作包、工單詳情＝入口報工範圍內全部；我的生產任務、我的工作包＝自己提交的 |
| 一次報多筆 | 未定義 | 任一筆被擋下，整批不寫入 |
| 併發寫入 | 只寫轉交單作廢與點收 | 報工、點收、品檢、出貨與裝箱回報各類寫入，先寫入者成立，後到者以寫入當下的數字重新檢核 |
| 品檢誤記 | 新增負數沖銷紀錄、原紀錄不改 | 修正原紀錄，受總數上限、通過下限、不通過下限把關 |
| 品檢缺口處置 | 決策後不可修改 | 印務可修正處置數量與瑕疵品去向 |
| 裝箱回報 | 單頭記實際裝箱數量、每箱幾個；不符不擋出貨 | 揀貨數量與每箱幾個逐條記在出貨明細；揀貨不符擋下拋單、出貨確認、交付確認；待出貨期間可裝箱回報修正 |
| 第三方出貨 | 出貨確認時手填托運單號 | 拋單；物流單號與物流單由物流商回傳 |
| 出貨重量 | 選填，可補填 | 拿掉 |
| 數量用詞 | 轉交量、轉交點收量、齊套完成數、現場照片 | 搬運量、點收量、完成數、報工照片 |
| 轉交進度 | 三數「轉交量／點收量／良品」 | 兩數「搬運量／點收量」 |

## What Changes

- 報工、點收、搬運數量的修正：用詞改「修正」，修正紀錄一次修正、每個被改的欄位一筆；報工修正與作廢的範圍改依入口；外包廠與中國廠商任務的報工只能經工單詳情修正。
- 新增「一次報多筆」：任一筆被擋下，整批不寫入。
- 新增併發寫入的系統承諾：生產執行（報工、點收類）、品檢（驗收與修正）、出貨（建單、明細增減、作廢、裝箱回報與其修正、拋單、出貨確認）。
- **BREAKING**：品檢紀錄改為修正原紀錄，負數沖銷紀錄廢止；新增三條品檢修正界線與擋下訊息。
- 品檢缺口處置改為可修正，受處置修正界線把關。
- **BREAKING**：出貨單的實際裝箱數量拿掉，揀貨數量與每箱幾個下放到出貨明細；揀貨不符擋下拋單、出貨確認、交付確認；新增裝箱回報修正（只在待出貨）。
- 第三方出貨確認改稱拋單；物流單號與物流單由物流商回傳，出貨人員不手填，已拋單可下載物流單。
- 新增出貨單歷程紀錄的系統承諾。
- **BREAKING**：出貨重量相關的 Requirement 條文與 Scenario 刪除。
- 轉交進度改兩數「搬運量／點收量」。生產任務側板不顯示可做量；師傅工作包任務清單的可做量呈現不變。生產管理的任務清單對前置未到料的任務改以狀態欄標籤呈現，等貨說明移到生產任務側板（對齊 Prototype 試用後調整，取代原「所有生產任務不呈現前置狀態」）。
- 工單詳情的生產任務列新增「檢視」，開同一個生產任務側板，依工單詳情的修正範圍修正與作廢報工。
- 用詞清理：搬運量、點收量（合計）與點收數量（單筆）、完成數、報工照片；三張情境卡改名後的引用路徑同步。
- 重新命名 Requirement：點收紀錄的修正與作廢、生產數量錯誤的逐層修正、轉交單改單與修正、報工修正、作廢與留痕。

範圍外：拋單失敗（SHP-020）、出貨單編輯範圍（SHP-021）、單條明細移除（SHP-022）、報廢後已驗量（QC-010）；外發報工與修正的 Prototype 入口另案（grill 第 42 題）；審稿難易度與發票的「更正」用詞屬他領域，不在本次清理。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- production-execution：報工、點收、搬運數量的修正改寫；新增一次報多筆與併發寫入；轉交進度兩數；前置未到料標籤與側板不顯示可做量；用詞清理；四條 Requirement 改名。
- qc：品檢紀錄改為修正原紀錄與三條界線；缺口處置可修正；新增併發寫入；用詞清理。
- shipment：揀貨數量下放明細、揀貨不符擋下離廠動作、裝箱回報修正、拋單與物流單號回傳、刪出貨重量、品檢修正不再造成額度負數暫態；新增出貨單歷程紀錄與併發寫入。
- work-order：工單詳情轉交進度兩數、工單詳情按檢視開生產任務側板並依工單詳情範圍修正報工；完成數改名；情境卡引用改名。
- order-management：完成數改名。
- dispatch-order：完成數改名。
- business-scenarios：品檢與出貨情境改寫為修正與逐條揀貨、拋單。

## Impact

- Prototype（erp repo 分支 `prototype/production-stage`）：已實作，提交 0c7168a3、ea4ed9c4、adf5461f、0a7b33c9、9602a825。
- 驗收測試（Sens `erp-prototype-tests/`）：已提交 79b4d61、7995c14、91bc28d、96ba2e8、368d998；情境目錄第十、十一、十二章與 14.29～14.40、10.61。
- 歸檔順序：本 change 必須在收斂 change 歸檔之後歸檔；歸檔前以收斂 change 歸檔後的主規格重新比對本 change 的 MODIFIED 區塊。
- Linear：生產管理與工單管理已於 v7 交付；品檢與出貨另開「中台 - 品檢與出貨」project，由 Miles 另行觸發。
