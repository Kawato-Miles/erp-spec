# 設計：工單可見範圍與分享（Prototype 層）

## Context

商業層設計正本：[work-order-visibility-design.md](../../../work-order-visibility-design.md)。現況：工單列表只有負責印務下拉篩選、預設全部；`permissions.js` 八支把關以 `isOwner` 為條件；工單無 `shared_members`；改派只換人不選理由。

## Goals / Non-Goals

### Goals

- `canSeeWorkOrderInList`（印務：負責人或分享成員含自己）套在工單列表與印件列表
- `isEditorOf`（負責人或編輯（代理）成員）取代八支把關的 `isOwner`；兩處報工入口同口徑；停用理由不揭露姓名
- 工單詳情新增「分享（n）」頁籤（比照訂單 SharingTab，多層級欄）；store 三支動作
- 改派 Dialog 必選理由分類；離職交接清空 `shared_members`；寫進既有改派異動紀錄文字

### Non-Goals

- 直連擋下（詳情全體可開）；通知模擬；送審／核可／交付操作者留痕；訂單分享補兩層；派單頁負責人把關

## Decisions

- 分享成員形狀 `{ name, level }`，level 兩值中文字面，與 wiki 欄位一致
- 改派理由不新增欄位，寫進異動內容文字（與後端訂單側寫活動紀錄一致）
- 只動 (prototype)/ 目錄
