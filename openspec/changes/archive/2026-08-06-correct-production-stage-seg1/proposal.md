## Why

### Background

wiki 於 2026-07 至 2026-08 完成生產階段的商業層重構與拍板擴散，但 OpenSpec 規格與 Prototype 未跟上，三方（wiki／openspec／prototype）出現大量不一致。2026-08-06 以 wiki 為基準完成四段全流程差異盤點（共 156 項），本 change 承接其中**段 1：製作細節確認 → 工單建立與分派 → 製程規劃 → 製程審核 → 交付產線 → 生管派工 → 外發派單**的 48 項差異。

商業層依據（wiki 正本，本 change 不重述其內容）：

- 情境：[印件製作細節確認](../../../memory/Sens_wiki/wiki/erp/07-scenarios/印件製作細節確認.md)、[工單製程審核](../../../memory/Sens_wiki/wiki/erp/07-scenarios/工單製程審核.md)、[外發委外與回廠點收](../../../memory/Sens_wiki/wiki/erp/07-scenarios/外發委外與回廠點收.md)
- 狀態機：[印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)、[工單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/工單狀態.md)、[派單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/派單狀態.md)、[生產任務狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/生產任務狀態.md)
- 實體：[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md)、[生產任務](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md)、[工作包](../../../memory/Sens_wiki/wiki/erp/05-entities/工作包.md)、[派單](../../../memory/Sens_wiki/wiki/erp/05-entities/派單.md)
- 角色：[訂單管理人](../../../memory/Sens_wiki/wiki/erp/03-roles/訂單管理人.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)、[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[生管](../../../memory/Sens_wiki/wiki/erp/03-roles/生管.md)
- 規則：[齊套邏輯](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/齊套邏輯.md)、[工序相依性規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工序相依性規則.md)、[生產績效指標](../../../memory/Sens_wiki/wiki/erp/04-business-logic/領域知識/生產績效指標.md)

設計正本：`production-stage-seg1-design.md`（已過 plan-audit：0 項未通過；Miles 七項裁決已於 2026-08-06 落 wiki 12 卡）。

### Problem Statement

段 1 的三方不一致集中在六類：

1. **規格自相矛盾**：`order-management` 與 `work-order` 對「生產任務何時可建立」寫成完全相反（前者「工單審核完成後」、後者「僅草稿或重新確認製程時」）。
2. **規格漏掉已拍板的關卡**：印件印製維度缺「製程已確認」一態，建單觸發點仍寫舊條文「審稿已確認可製作後建工單」，跳過訂單管理人確認製作細節這一關。
3. **規格與已封存決議相斥**：外發任務「點收確認即完成」與 B1 定案（印務依點收結果報工收斂）相反；派單「訂單管理人確認工單內容」與 B9 定案（不設第二道確認）相反。
4. **規格複寫 wiki 正本**：多處複寫狀態列舉與欄位表，違反單一正本鐵則。
5. **Prototype 缺已定案的功能**：無訂單管理人確認製作細節的入口、無印件詳情頁、無工單加開與審核佇列、無生管接收留痕。
6. **Prototype 與正本用詞不一致**：日期欄名三套寫法、動作名「交付」未帶產線語意、BOM 選項顯示價格、生產任務規劃以序號表達平行。

## What Changes

### 規格修正（openspec）

- **印件印製維度狀態鏈補「製程已確認」**，複寫的狀態列舉改為引用 wiki 狀態機卡
- **層級建立順序更正**：刪除「工單審核完成後建立生產任務」的相斥條文
- **狀態向上傳遞鏈補交付層**（製程已確認 → 工單已交付 → 訂單工單已交付）
- **BREAKING** 外發任務完成判定改依報工收斂（刪除「點收確認即完成」）
- **BREAKING** 派單刪除「訂單管理人確認工單內容」轉換（B9）
- 工單收回守衛加嚴：旗下已有派單者不可收回、改走異動
- 新增印務主管刪除空草稿工單的規格
- 補生管接收確認留痕、收回與審核併發處理、參考完稿圖自動帶入
- 外發點收補分批累計、短少二路（補件／折價）與超交口徑
- 措辭統一：交付產線、預計開工日、未送大陸、完工良品數、狀態向上傳遞

### 介面修正（Prototype，erp repo `prototype/production-stage` 分支）

- 新增「待確認製作細節」佇列頁；訂單詳情頁新增製作討論串批次建立
- 審稿印件詳情頁升格為統一印件詳情頁（保留審稿紀錄與活動紀錄，新增生產階段區塊與成本區塊）；印件總覽抽屜廢除、點擊導向詳情頁
- 工單詳情製程規劃改三段區塊（材料／工序／裝訂）＋段內拖曳、移除序號欄、BOM 選項移除價格、完稿圖改唯讀帶入
- 新增印務主管加開工單、刪除空草稿、製程審核待辦佇列；收回原因改必填
- 生管派工新增接收確認、待排區補印件交期、工作包補上機日、移除工作包狀態欄
- 派單新增認列工單（段 1 暫置）與點收登記；印務切「台灣已入庫」終態
- 訂單層狀態向上傳遞的四條模擬資料連動

## Capabilities

### New Capabilities

無。段 1 全部落在既有 capability 的行為修正。

### Modified Capabilities

- `order-management`：印製維度狀態鏈、層級建立順序、狀態向上傳遞鏈、印件詳情頁區塊、內部製作截止日
- `work-order`：工單草稿建立與刪除、製程規劃、製程審核流程（含收回守衛加嚴與併發處理）、任務交付措辭、生產任務結構與帶入規則
- `dispatch-order`：派單狀態轉換（B9）、回廠點收（認列／登記／切終態／分批／短少／超交）、外發數量取數
- `production-execution`：待派任務接收留痕、生產任務狀態轉換（B1）、拉料備料呈現
- `sales-platform`：印件詳情頁 Tab 結構（審稿與生產合併、移除獨立品檢 Tab）

## Impact

- **規格檔**：`openspec/specs/` 下五份 spec 的 delta（order-management、work-order、dispatch-order、production-execution、sales-platform）
- **Prototype**：erp repo `apps/erp/src/app/(prototype)/` 下 orders、prepress-review、print-items、work-orders、production-floor、dispatch-orders 六個模組；新增 print-items/detail 與待確認佇列兩個路由；經 `prototype-from-prompt` skill 實作於 `prototype/production-stage` 分支、不開 PR
- **wiki**：本 change 不動 wiki（商業層已於 2026-08-06 落卡完成，本 change 為下游實作）
- **未解 OQ**：段 1 相關的 PT-026（外部廠商門戶身分與可視邊界）、PT-027（製作中改價與計價快照）、PT-023（材料用量帳正本歸屬）、PI-007（印件獨立交貨日）仍為 open，皆不擋段 1 實作；PT-036 已於 2026-08-06 以前提失效結案
- **後段依賴**：報工與轉交歸段 2、品檢與出貨歸段 3、副流程歸段 4；貨運單頁面與運費關稅攤回歸段 3（認列工單在段 1 暫掛派單介面）
