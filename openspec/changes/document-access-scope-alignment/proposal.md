## Why

### Background

誰能看哪些單據、誰能做哪些動作，wiki 已收斂成單一正本，拍板與驗證已完成：

- 權責正本：各服務藍圖的活動清單卡（[服務藍圖](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/)，例如 [訂單審核活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/線下接單流程群組/訂單審核活動清單.md)、[出貨活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/出貨與交付流程群組/出貨活動清單.md)、[製程規劃活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/生產流程群組/製程規劃活動清單.md)）。
- 檢視正本：[售前單據檢視活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/售前單據檢視活動清單.md)、[訂單與帳務檢視活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/訂單與帳務檢視活動清單.md)、[生產單據檢視活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/生產單據檢視活動清單.md)、[出貨與售後檢視活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/出貨與售後檢視活動清單.md)、[輸出活動清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖/單據存取流程群組/輸出活動清單.md)。
- 判讀規則：[受控清單](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/受控清單.md) § 未列即不可做、§ 訂單關聯單據的編輯權、§ 工單關聯單據的編輯權、§ 範圍用詞。
- 操作登記：各實體卡的操作段，例如 [訂單](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)、[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)、[出貨單](../../../memory/Sens_wiki/wiki/erp/05-entities/出貨單.md)。
- 角色定位：[業務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/業務主管.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)、[Supervisor](../../../memory/Sens_wiki/wiki/erp/03-roles/Supervisor.md)、[會計](../../../memory/Sens_wiki/wiki/erp/03-roles/會計.md)。
- 過程正本：[單據分享與職務代理](../../../memory/Sens_wiki/wiki/erp/07-scenarios/單據分享與職務代理.md)、[訂單接單業務改派](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單接單業務改派.md)。

拍板依據（依 G64，本變更免跑 plan-audit）：

| 依據 | 內容 |
|------|------|
| [grill 拍板紀錄](../../../memory/erp/plans/document-access-scope-20261013/grill.md) | C1、C2、G1 至 G66；G64 確認本變更免規劃稽核 |
| [盲測紀錄](../../../memory/erp/plans/document-access-scope-20261013/blind-test-r1.md) | 三輪試點撰寫與查詢盲測；最終權限表盲測三位受測者訂單 59 組、工單 34 組全對 |
| [落差盤點第二版](../../../memory/erp/plans/document-access-scope-20261013/asis-gap-v2.md) | Prototype 89 筆落差、29 筆測試衝突、未覆蓋清單 |

### Problem Statement

Prototype 與驗收測試仍照舊的角色名單判斷權限，與活動清單不一致：

| 問題 | 使用者遇到的狀況 |
|------|----------------|
| 訂單詳情的編輯入口只看訂單狀態 | 會計、檢視層級的分享成員也能改訂單、帳務、異動、售後 |
| 少數動作改用角色名單把關，名單只有業務或諮詢，不看歸屬 | 六個全公司協助角色做不了；別人的訂單反而按得到 |
| 工單側動作先判是否為印務 | 印務主管代做工單、非印務的編輯分享成員都做不了 |
| 側欄入口與檢視活動清單不同 | 有檢視權的角色沒有入口；沒有檢視權的角色有入口 |
| 分享候選只放業務或印務 | 活動清單的被分享列無從發生 |
| 詳情頁網址不判範圍 | 沒有檢視權的人直接開網址就看得到內容 |
| 29 筆測試斷言舊權限 | Prototype 改對後測試會失敗，測試改對前 Prototype 改不了 |

## What Changes

- 系統依活動清單判斷每個角色的模組入口、列表範圍、詳情頁可否進入與操作鈕；活動清單沒有列出的組合一律不可做。
- 沒有檢視組合的人直接開詳情頁網址，系統導回預設頁面，不顯示內容（G65 第 59 題）。
- 對訂單有編輯權的人（自己負責、被分享（編輯）、六個全公司協助角色），可做訂單與其直接關聯單據上接單業務能做的動作；審核類、管理類與其他角色的現場動作除外（G48、G49、G61）。
- 對工單有編輯權的人（負責印務、被分享（編輯）、印務主管），可做工單與其直接關聯單據上負責印務能做的動作（G62、G63）。
- 檢視層級的分享成員只能看，所有編輯、推進、刪除入口不顯示。
- 分享成員候選依活動列判斷：只列對該單據至少有一列不靠分享的活動的角色，例如訂單可分享給業務、諮詢與六個全公司協助角色，不可分享給會計、生管（G66）；評估印務主管列在需求單分享成員清單，以編輯分享成員身分可改整張需求單（G41、G66）。
- **BREAKING**（Prototype 行為）：會計離開訂單模組，從四張跨訂單清單處理帳務，不再開訂單詳情（G48）。
- **BREAKING**（Prototype 行為）：需求單建立者不再因建立而取得權限；複製需求單、複製訂單時，新單的接單業務是執行複製的人（G36、G50）。
- **BREAKING**（Prototype 行為）：訂單的業務、諮詢不再因被指派為審核業務主管而看到訂單（G65 預設）。
- 師傅修正、作廢報工只看報工人員是本人，限仍看得到該生產任務時；工作包改派後原師傅看不到原任務，由生管更正（G53 第 3 項、G66 第 64 題）。
- 印務主管在製程核可前也可改生產任務的目的站點與產線（ACT-PLAN-041）。
- 生管可在工單異動確認後重印工單單據；印務主管可預覽與列印工單單據（G65 第 61 題）。
- 應收款項清單的「匯出逐張發票明細」即匯出對帳明細，看得到該清單的角色都可以匯出（G65 第 62 題）。
- 稿件備註維持一般欄位，印務可改（G65 第 60 題）。
- 介面用詞對齊 wiki：角色名「Supervisor」、頁籤「分享成員」、欄名「評估印務主管」；介面不顯示權限名稱。
- 驗收測試先改：29 筆衝突逐筆改斷言，未覆蓋的活動組合補測試。

## Capabilities

### New Capabilities

- `document-access`：跨模組的單據存取共用承諾，含依活動清單判斷入口與操作、直連導回預設頁、檢視層級不可編輯、分享候選與介面用詞。

### Modified Capabilities

- `quote-request`：需求單可見範圍與編輯者依活動清單；評估印務主管為編輯分享成員；改派加 Supervisor；複製者為新單接單業務。
- `order-management`：訂單與印件的可見範圍、編輯者依活動清單；全公司協助角色；改派加 Supervisor；複製訂單的新單接單業務。
- `order-billing`：帳務操作的執行者依活動清單；跨訂單清單含被分享訂單；會計從清單進入；匯出對帳明細與待退款報表的角色。
- `order-adjustment`：訂單異動的建立、編輯、送審、生效、取消依活動清單；取消已認列異動限審核業務主管本人。
- `work-order`：工單與生產任務的編輯者依活動清單；印務主管代做；印務自行加開工單；工單單據預覽與列印的角色。
- `production-execution`：工單詳情的報工、修正、作廢依活動清單；師傅修正只看報工人員；目的站點修改者。
- `qc`：品檢待驗清單與品檢紀錄依角色範圍列出；缺口處置與補做依工單編輯權。
- `shipment`：出貨單可見範圍跟著訂單；全公司協助角色與編輯分享成員可操作出貨單；出貨人員補附送達憑證。
- `after-sales-ticket`：售後服務單可見範圍跟著訂單；編輯、送出決議、結案依活動清單。

## Impact

| 影響面 | 內容 |
|------|------|
| Prototype | erp repo `apps/erp/src/app/(prototype)/`：共用側欄、各模組權限判斷、分享頁籤、詳情頁進入判斷、mock 人員名冊 |
| 驗收測試 | Sens `erp-prototype-tests/`：第一、二、三、四、五、七、八、九、十、十一、十二、十四章，見 tasks § 測試影響清單 |
| mock 資料 | `(prototype)/MOCK-DATA-CHAIN.md` 先改，再改各模組 `mock-data.js`：分享成員層級、依活動列的分享候選、審核業務主管途徑 |
| 後端 | 不在本變更範圍；後端落差由下列未解問題追蹤 |
| Linear | 不在本變更範圍；待 Prototype 完成後依 linear-delivery 另案更正 |

### 範圍外（另案）

| 項目 | 理由 |
|------|------|
| 諮詢單模組全部活動（V2-023） | Prototype 未建模組，另案規劃 |
| 外包、中國廠商、派單、貨運單相關活動（V2-012、V2-075、V2-093） | G53 外包另案 |
| 主檔維護與配方檢視（V2-094、V2-095） | G60 第 53 題：主檔納入 Prototype 時再處理 |
| 欄位與頁籤層級可見性（V2-058） | XM-016 未拍板 |
| C1 所列既存漏洞以外的新權限設計 | C1 |

### 相關未解問題（wiki 08-open-questions，status=open）

| 編號 | 議題 | 與本變更的關係 |
|------|------|--------------|
| [AFT-16](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AFT-16-售後服務單可見範圍後端以建立者判定與wiki跟著訂單不一致.md) | 售後服務單可見範圍後端以建立者判定 | Prototype 改跟著訂單；後端另案 |
| [ORD-058](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-058-核准訂單權限同時承載改派接單業務與跨單取消.md) | Supervisor 改派與管理分享的後端權限 | Prototype 開放 Supervisor 改派與管理訂單分享；後端另案 |
| [QR-009](../../../memory/Sens_wiki/wiki/erp/08-open-questions/QR-009-需求單狀態轉換的角色把關後端未擋.md) | 需求單狀態轉換的後端角色把關 | 本變更只動 Prototype 介面判斷 |
| [QR-015](../../../memory/Sens_wiki/wiki/erp/08-open-questions/QR-015-印務主管檢視全公司需求單的後端權限未支援.md) | 印務主管、業務主管全公司需求單的後端權限 | Prototype 開放全公司檢視；後端另案 |
| [QR-020](../../../memory/Sens_wiki/wiki/erp/08-open-questions/QR-020-需求單分享候選人的排除規則.md) | 分享候選人的排除規則 | 本變更只放寬候選角色；排除規則維持 Prototype 現況，待本卡裁決 |
| [XM-016](../../../memory/Sens_wiki/wiki/erp/08-open-questions/XM-016-詳情頁頁籤與欄位層級的可見性規則.md) | 頁籤與欄位層級可見性 | 本變更不動既有頁籤、欄位遮蔽 |
| [XM-017](../../../memory/Sens_wiki/wiki/erp/08-open-questions/XM-017-會計檢視派單成本的範圍.md) | 會計檢視派單成本 | 範圍外；會計維持無派單檢視 |
| [ORD-053](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-053-訂單完成後可否編輯四張情境卡說法不一.md) | 訂單完成後可否編輯 | 本變更只改「誰」，不改「何時」；狀態時機維持現況 |

已封存：

- PT-068（經分享或延伸看得到工單的人能否看生產任務歷程與轉交進度）依 G57 採 A 案封存，本變更照 A 案驗收。
- [QR-016](../../../memory/Sens_wiki/wiki/erp/08-open-questions/_archives/2026/QR-016-評估印務主管的自動編輯授權可改接單業務與評估名單.md)（評估印務主管的自動編輯授權範圍）依 G41 封存（G66 第 65 題）：評估印務主管以編輯分享成員身分可改整張需求單。
