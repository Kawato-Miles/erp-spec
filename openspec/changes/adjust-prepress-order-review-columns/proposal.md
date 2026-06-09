## Why

### Background

審稿「訂單脈絡查詢視圖」（`/prepress/by-order`）於 add-prepress-order-review-view（2026-06-09 歸檔）建立，以「訂單（母）→ 印件（子）」兩層呈現待審內容，供審稿人員與審稿主管從訂單視角監看稿件脈絡。相關背景：

- 角色與資料範圍：[審稿人員](../../../memory/Sens_wiki/wiki/erp/03-roles/審稿人員.md)、[審稿主管](../../../memory/Sens_wiki/wiki/erp/03-roles/審稿主管.md)（兩者對訂單為限定唯讀存取）
- 訂單既有欄位「案名」（自需求單標題帶入）：[訂單實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)
- 印件層待補欄位「難易度 / 客戶稿件備註」：[印件實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md)、[印件檔案備註上限](../../../memory/Sens_wiki/wiki/erp/04-business-logic/印件檔案備註上限.md)
- 印件兩維度狀態（審稿維度 vs 印製維度）：[印件狀態機卡](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md)

### Problem Statement

該視圖上線後，兩層列表的欄位呈現有三個與「審稿人員實際判讀需求」不貼合之處：

1. **訂單層缺案名**：審稿人員從訂單視角查稿件時，需快速辨識案件；案名在訂單詳情頁已顯示，但列表母列缺漏，辨識需多一跳。
2. **訂單層承載績效監看指標不合職責**：母列現顯示「審稿停留天數 / 退件率」。此視圖定位為審稿人員「查資料」的脈絡視圖，承載績效監看指標造成職責混雜；且審稿主管儀表板已有「平均停留天數」監看，訂單層重複呈現此類指標無助於查詢動線。
3. **印件層欄位與審稿判讀脫節**：印件層顯示「印件狀態」（印製維度：製作中 / 出貨中…），在審稿脈絡關聯度低；同時缺少審稿人員在「我的待審」頁慣用的判讀欄位（印件編號 / 難易度 / 客戶稿件備註 / 印件交期），導致需切換視圖才能取得完整判讀資訊。

## What Changes

### Modified Capabilities

- **prepress-review**：調整「審稿訂單脈絡查詢視圖」兩層列表欄位；移除「審稿環節訂單級指標」Requirement 中的「訂單審稿停留天數（與退件率配對顯示）」指標及對應 Scenario。
- **user-roles**：審稿主管職責描述同步——移除「透過脈絡查詢視圖監看停留天數」（停留天數已從該視圖移除，績效監看歸審稿 KPI / 主管儀表板）。

具體變更：

- 訂單母列：**新增**「案名」；**移除**「審稿停留天數 / 退件率」。
- 印件子列：**移除**「印件狀態」（印製維度）；**新增** 4 欄（取自「我的待審」視圖、扣除與訂單層重疊後）——印件編號、難易度、客戶稿件備註、印件交期。
- spec「審稿環節訂單級指標」Requirement：移除「訂單審稿停留天數」指標 + 配對退件率敘述 + Scenario「計算訂單審稿停留天數」。**保留**「審稿關卡逾期訂單數」（距交期口徑，列表頂部彙總統計）與「訂單視角使用率」（採用訊號）——此二者非本次移除範圍。

非破壞性變更：此視圖為純讀取視圖，本次調整不新增資料欄位、不改狀態轉換、不改角色權限；所補印件層欄位（案名 / 難易度 / 客戶稿件備註 / 印件交期）皆為實體既有欄位。

## Capabilities

### Modified Capabilities

- **prepress-review**：審稿訂單脈絡查詢視圖兩層列表欄位調整 + 移除訂單級停留天數/退件率指標。
- **user-roles**：審稿主管監看職責描述同步（移除脈絡查詢視圖的停留天數監看項）。

## Impact

- **Prototype**（`/Users/b-f-03-029/sens-erp-prototype/src`）：
  - `pages/prepress/OrderReviewView.tsx`：訂單層 +案名 −停留/退件率欄；印件層 −印件狀態欄、+印件編號/難易度/客戶稿件備註/印件交期 4 欄。
  - `utils/prepressReview.ts`：`computeOrderReviewDwellDays`、`computeOrderRejectionRate` 移除後成孤兒，一併刪除；`computeOrderDeadline` / `computeOrderDaysToDeadline` / `isOrderOverdueInReview`（距交期 + 逾期 summary 仍用）**保留**。
  - `utils/__tests__/prepressReview.test.ts`：移除上述兩函式對應的單元測試（停留天數 3 項 + 退件率 2 項）。
- **e2e**：`prepressReviewE2E` 為 store / 邏輯層測試，不渲染列表表格欄位，不受影響。
- **spec 連帶**：user-roles「審稿主管與審稿角色階段限制」Requirement 為純描述同步（移除停留天數監看項），無 prototype code 影響；prepress-review 兩個 Requirement 的 MODIFIED 對應上述 prototype 欄位調整。
- **wiki**：經 erp-planning-pre-check 稽核確認**無需回補**——案名 / 難易度 / 客戶稿件備註 / 印件兩維度狀態列舉皆為既有正本；停留天數/退件率原僅定義於 spec（衍生指標、非實體欄位），wiki 商業邏輯卡無記錄。
- **規格流程判斷**：方向已透過與 Miles 的 AskUserQuestion 直接拍板（監看徹底移除 + 待審印件列表取「我的待審」），變動性質為「局部欄位調整 + 一個指標移除」，不觸發序列協作三視角。
