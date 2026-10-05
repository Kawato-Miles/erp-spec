## Why

### Background

2026-10-04 grill 拍板與第二輪裁決、2026-10-05 三條補充裁決已全部落卡（wiki commit 05498b6、0f44a8b）。設計方案經 plan-audit 四輪稽核，無未通過項。本 change 把已定案的商業規則轉成系統承諾與驗收條目。

| 主題 | wiki 正本 |
|------|----------|
| 線下單送審條件、核准時重檢、成立前刪除印件 | [訂單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md)、[明細時點分界](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/明細時點分界.md)、[訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) |
| 收款項目規劃提前到送審前 | [付款發票邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/帳務/付款發票邏輯.md)、[帳務](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) |
| 發票草稿、開立失敗、一期同一時間至多一張未作廢發票 | [發票狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/發票狀態.md)、[收款項目開發票狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/收款項目開發票狀態.md)、[收款項目收款狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/收款項目收款狀態.md) |
| 點收填實際量、多次點收、點收修改、已送達不作廢、簽收照片逐條 | [轉交單](../../../memory/Sens_wiki/wiki/erp/05-entities/轉交單.md)、[轉交單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/轉交單狀態.md)、[工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md) |
| 報工開放修改、已完成後可再報工 | [報工紀錄](../../../memory/Sens_wiki/wiki/erp/05-entities/報工紀錄.md)、[報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md)、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md) |
| 生產任務轉交狀態、交付狀態、產線欄 | [生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[生產任務轉交狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務轉交狀態.md)、[生產任務交付狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務交付狀態.md)、[產線](../../../memory/Sens_wiki/wiki/erp/05-entities/產線.md) |
| 角色權責 | [業務](../../../memory/Sens_wiki/wiki/erp/03-roles/業務.md)、[業務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/業務主管.md)、[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)、[廠務](../../../memory/Sens_wiki/wiki/erp/03-roles/廠務.md)、[師傅](../../../memory/Sens_wiki/wiki/erp/03-roles/師傅.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md) |
| 業務情境（驗收條目的步驟出處） | [訂單成立確認](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單成立確認.md)、[訂單印件規格維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單印件規格維護.md)、[收款項目規劃](../../../memory/Sens_wiki/wiki/erp/07-scenarios/收款項目規劃.md)、[收款項目開立發票](../../../memory/Sens_wiki/wiki/erp/07-scenarios/收款項目開立發票.md)、[場內轉交與更正](../../../memory/Sens_wiki/wiki/erp/07-scenarios/場內轉交與更正.md)、[工單製程規劃](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單製程規劃.md)、[訂單複製建單](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單複製建單.md) |

### Problem Statement

現行 spec 與拍板後的商業規則有下列落差：

- 線下單送審不檢查備註與收款項目。主管核准時看不到各期怎麼收。
- 收款項目寫在訂單成立後才規劃。主管審核時還沒有期次可看。
- 回簽前不做的印件只能棄用，留下沒有生產事實的空殼印件。
- 發票只有開立與作廢兩態。開票資訊不齊時無處先存，開立失敗沒有地方停。
- 點收是純確認、不可改量。數量不符一律作廢重開，已送達的貨還要重走一次搬運與送達。
- 報工不可修改，誤報只能作廢重報。任務已完成後作廢被擋，短少無法更正。
- 生產任務看不出轉交進度與交付進度，產線歸戶依計畫設備推導，外發任務歸不了線。

## What Changes

- 線下單送審條件：四格備註皆有值，且至少一筆未取消的收款項目。條件不齊時按鈕停用並列缺項。業務主管核准當下系統重檢一次。
- 收款項目改為線下單草稿態起可建；複製建單不帶收款項目。
- 訂單成立前，業務可真刪除印件，記錄消失、活動紀錄留一筆，應收總額當下重算。成立後與線上單等待付款期間不提供刪除。
- **BREAKING** 發票新增初始態「草稿」：收款項目上提供「建立草稿」與「直接開立發票」兩個入口。草稿不驗證、不計入發票淨額；開立失敗停在草稿並顯示原因。一個收款項目同一時間至多一張未作廢發票，在寫入當下擋下。
- **BREAKING** 轉交點收改為逐條明細填實際量：同一明細可多次點收，累計不超過設定量；點收量可修改並留痕。
- **BREAKING** 已送達的轉交單不可作廢，例外為來源生產任務已轉報廢或已作廢。取消「貨已在現場」建單分流。
- 簽收照片改掛轉交明細，每條至少一張，不足擋下抵達站點回報。
- **BREAKING** 報工的生產數量、良品數、不良品數開放修改，與作廢同一群人、留修改紀錄。報工修改與作廢共用一組擋下條件。任務已完成後仍可再報工。
- 生產任務新增兩條系統推導的衍生進度（轉交狀態、交付狀態）與產線欄，交付時間以生產任務為單位記錄。
- 待驗量不再照實顯示負數；報工修改或作廢會讓待驗量變負時擋下。

### Pending（另案處理，本 change 不規範）

| 議題 | 出處 | 本 change 的處理 |
|------|------|----------------|
| 來源任務報廢後重建的轉交單點不了收 | [PT-064](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-064-來源任務報廢後重建的轉交單無法點收.md) | 點收、再次點收、點收修改在來源任務報廢或作廢時一律擋下，重建單的處置不寫 |
| 已完成任務再報工是否受工單、印件印製終態限制 | [PT-065](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-065-已完成任務再報工是否受工單與印件印製終態限制.md) | 只承諾任務層「已完成後可再報工、維持已完成」，不寫工單或印件終態的限制 |
| 外發前置的到料量是否比對站點 | [PT-063](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-063-外發回台送場內後段是否走轉交單.md) | 到料量改取轉交點收量只套場內前置，外發前置沿用既有條文 |
| 送出開立後平台沒有回應、送出期間收款項目被取消、草稿送出時含稅目標值的取值 | 設計方案附錄乙 E11、E12、E13（wiki 未落卡、未開 OQ 卡） | 另案處理，本 change 不寫對應 Scenario |

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- order-management：線下單送審條件與核准重檢、成立前刪除印件、複製建單不帶收款項目。
- order-billing：收款項目建立時點提前、發票草稿與開立失敗、一期同一時間至多一張未作廢發票、收款項目開發票與收款兩條狀態各自推進。
- production-execution：轉交點收填實際量、多次點收與修改、已送達不作廢、簽收照片逐條、報工修改、已完成後再報工、生產任務轉交狀態推導、歷程紀錄擴充。
- work-order：生產任務產線欄、交付時間與交付狀態。
- qc：待驗量為負改為擋下。

## Impact

- Prototype（erp repo `prototype/dispatch-and-shipping` 分支，只動 `(prototype)/`）：訂單詳情（送審、刪除印件、收款項目、發票區）、生產管理（轉交單點收與修改、報工修改）、工單詳情（生產任務列表三個狀態欄、產線欄、批次交付）、品檢站。
- 測試：Sens `erp-prototype-tests/` 第二、三、八、十、十一章與第十六章待辦表；mock 先改 `(prototype)/MOCK-DATA-CHAIN.md`。
- 相依 change：本 change 修改 `floor-transfer-no-return` 新增或修改的 production-execution Requirement，須在該 change 封存後才能封存。
- 後端：發票草稿態、點收紀錄子表、報工修改紀錄子表、生產任務產線欄與交付時間欄屬後端尚未實作的範圍，交付時由 Linear 另行處理。
