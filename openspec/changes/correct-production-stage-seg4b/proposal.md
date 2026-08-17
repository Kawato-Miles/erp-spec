# Proposal: correct-production-stage-seg4b

## Why

### Background

生產階段校正工程第四段之 B：審稿段。審稿段最後一次 change 為 2026-07-06（線下審稿分派），之後 wiki 於 2026-08-01（AR／PI 系列 OQ 批次拍板）、2026-08-04、2026-08-12 多次更新，三方一致性未驗。段 4 開工盤點產出審稿段三方差異矩陣 #43-100（48 項差異、10 對齊、9 wiki 疑義），其中 21 項 openspec 衝突含多處內部相斥與死引用——Miles 拍板 **prepress-review spec 整檔棄用重寫**（範圍收斂線下單必要流程），不逐項修。商業正本：

- 分派與換人：[審稿分配規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/審稿分配規則.md)、[覆寫審稿分派](../../../memory/Sens_wiki/wiki/erp/07-scenarios/覆寫審稿分派.md)
- 稿件與輪次：[稿件管理規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/稿件管理規則.md)、[審稿輪次](../../../memory/Sens_wiki/wiki/erp/05-entities/審稿輪次.md)、[印件審稿](../../../memory/Sens_wiki/wiki/erp/07-scenarios/印件審稿.md)
- 狀態機：[印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)（審稿維度八態十轉換）、[訂單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/訂單狀態.md)（審稿段三值歸納）
- 免審：[免審決策樹](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/售前/免審決策樹.md)
- 打樣銜接：[打樣後稿件問題重審](../../../memory/Sens_wiki/wiki/erp/07-scenarios/打樣後稿件問題重審.md)

設計正本 `production-stage-seg4b-design.md`（v2，plan-audit 單輪收斂）、拍板紀錄 `production-stage-seg4-grill.md` 條 1-10。已封存拍板依據：AR-5（交期排序）、AR-6（技術性退件不排除）、AR-9（能力等級可為空）、AR-10（取代註記已落）、AR-11／AR-17（不設停滯提醒）、AR-14（逾期指標不做）、PI-006（免審輪次無審稿後檔案）。

### Problem Statement

prepress-review spec 存在系統性失效：2026-08-01 拍板後未回寫（兩處寫著與拍板相反）、內部相斥六組（覆寫路徑、round_id null、輪次時點、合格終態、免審分流、退回原因）、死引用與已封存 OQ 錯引、自造「在崗」欄位、主管工作台與 KPI 與已拍板方向（dashboard 後驗 epic）相悖；訂單層派生五規則缺「待分派」分支使線下單回簽後落點懸空；prototype（erp repo）在線下單自動分派、免審輪次、訂單層歸納、退回重審四處與 wiki 相悖或缺失。

## What Changes

- **BREAKING**：prepress-review spec 整檔重寫——範圍收斂線下單必要流程；主管工作台／KPI／能力等級維護／「在崗」欄／三個指標（逾期、待派工、技術退件排除）全部刪除
- order-management 審稿段修正六處（派生規則補「待分派」分支、免審落點 wiki 口徑、bubble-up 用詞、成品縮圖衍生、退回原因選填、免審直達分流）
- business-scenarios 審稿相關四處（合格非終態、QC 退役措辭、在崗句）
- prototype（erp repo）線下單必要流程修正 P1-P13（免審輪次補建、訂單層歸納實作、退回重審動作、線下不自動分派等）
- wiki 落卡小批（免審時點正名、AR-6／AR-10 收尾、mermaid 免審弧、能力等級正名、人員卡實作進度移出、訂單歸納句、請假註記）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `prepress-review`：整檔重寫（分派與換人、待審排序、稿件上傳、輪次與判定、合格之後、免審路徑、Slack、打樣銜接四 Requirement 修正、OQ 引用勘誤、術語）
- `order-management`：審稿段六處（訂單層派生全八態、免審落點、bubble-up、縮圖衍生、退回原因、免審直達分流）
- `business-scenarios`：合格非終態句、QC 退役措辭、在崗判定句、打樣情境殘項查證

## Impact

- openspec：上列 3 個 capability
- prototype：erp repo `apps/erp/src/app/(prototype)/` 分支 `prototype/production-stage`（prepress-review／orders 審稿相關）
- 不動：金額側（A 類另案）、主管工作台與能力維護介面（延後事實由 handover 另案清單承載）、舊 repo（已棄用）
