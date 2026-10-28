## Why

印件有下列三種「複製」動作。每種動作各自列出帶入哪些欄位，寫法不一：

| 動作 | 現況寫法 | 正本位置 |
|---|---|---|
| 打樣 NG-稿件問題棄用重建（[[印件]] OP-PI-010） | 「各欄照舊帶入，唯印務印件檔案與檔案備註不帶入」 | [打樣後稿件問題重審](../../../memory/Sens_wiki/wiki/erp/07-scenarios/打樣後稿件問題重審.md) § 範圍外 |
| 複製訂單（[[訂單]] OP-ORD-008） | 「整批帶入，不帶工單、稿件、活動紀錄、收款項目」，帶入範圍指向印件卡，但印件卡沒寫 | [訂單複製建單](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單複製建單.md) |
| 複製加開（[[訂單]] OP-ORD-003） | 只列規格側欄位白名單；購買數量與印件預計交期不預填 | [訂單印件規格維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單印件規格維護.md) |

問題：
- 每新增一個印件欄位，就要在三個動作各判一次帶不帶。[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) 36 欄只有 6 欄寫到複製動作。
- 同一動作在情境卡與行為規格兩處互相矛盾（PI-009：打樣重建時免審稿、負責審稿人員重不重設）。
- 同一欄在三個動作的處理不同，沒有共同理由。例：出貨方式在複製加開取訂單的值，在另兩個動作取原印件的值。

拍板見同資料夾 grill.md（G1～G4、Q1～Q7）。盤點見同資料夾 precheck.md。

## What Changes

- 新增一條印件複製規則：欄位帶不帶依欄位性質判斷，不依動作、不依印件屬性、不分線上線下。
  - 內容類一律帶入。
  - 歷程與產出類一律不帶，回到新建印件的初始值。
  - 追溯欄由系統依動作寫入。
- 唯一例外：打樣 NG-稿件問題重建時，免審稿重設為「否」。
- 規則只寫一處。三個動作與印件欄位表的「填入時點」欄改成引用。
- **MODIFIED** 複製加開：帶入原印件的印件名稱、購買數量、印件預計交期、出貨方式、客戶指定收件日、製程說明、品檢需求、購買的急件選項，經手者可改，含印件屬性。推翻 rush-order-definition 的 R6-6。
- **MODIFIED** 購買的急件選項：同一張訂單內的複製（打樣 NG 重建、複製加開）帶入原值；複製訂單因新訂單是線下單而為空（Q1）。推翻 rush-order-definition 的 H28。
- **MODIFIED** 複製訂單：已棄用的印件不帶入。
- **MODIFIED** 打樣 NG 重建：刪除原印件與新印件兩處備註加註；重建來由由衍生來源印件與活動紀錄承載。推翻封存 OQ AR-12「備註文字與衍生來源印件並存」這一點（D5）。稿件上傳開放重設為開放。
- **MODIFIED** 新印件審稿維度初始為「待分派」的範圍補複製訂單。
- 衍生來源印件維持只在打樣 NG 重建寫入。
- 需求單複製維持現況（已符合「內容帶、歷程不帶」）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `order-management`：複製訂單、複製加開的帶入承諾改引用印件複製規則；「印件是否急件」條目的購買的急件選項帶入改依 Q1。
- `prepress-review`：打樣後棄用原印件建新印件的保留與重設清單改引用印件複製規則，保留免審稿重設例外；審稿維度同步表的印件建立列補複製訂單。

## Impact

- wiki：[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、通用規則落點（由 wiki-amend 判定）、[打樣後稿件問題重審](../../../memory/Sens_wiki/wiki/erp/07-scenarios/打樣後稿件問題重審.md)、[訂單印件規格維護](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單印件規格維護.md)、[訂單複製建單](../../../memory/Sens_wiki/wiki/erp/07-scenarios/訂單複製建單.md)、[訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/訂單異動規則.md)、[打樣流程](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/打樣流程.md)、[訂單領域資料結構總覽](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單領域資料結構總覽.md)（只改兩句指向正本位置的措辭）；OQ PI-009 封存。
- OpenSpec：本案 delta 以 rush-order-definition 歸檔後的主 specs 為基準（Q7）。
- Prototype（erp repo）：三個複製動作的帶入邏輯與對應 mock、測試。
