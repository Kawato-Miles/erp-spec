## Why

審稿主管目前手上沒有可量化的審稿人員與客戶品質對比工具。現行 SupervisorDashboard 僅呈現「進行中件數」負擔視圖與基本退件原因 Top N，無法回答三個核心管理問題：

1. **審稿速度是否拖累整體產線？**——沒有「審稿環節平均滯留天數」指標，主管無法與印務、出貨速度對比
2. **哪些稿件反覆被退？哪位審稿人員退件行為異常？**——現行不區分「稿有問題」與「人有問題」，無法做差異化管理；但在「改稿原因代碼」結構化之前，僅作觀察用，不做行動判定
3. **哪些客戶的稿件品質最差、最常反覆退件？**——現行指標全按 reviewer 分組，缺客戶維度；主管無法向業務回報具體客戶品質問題

三視角審查（senior-pm / ceo-reviewer / erp-consultant）後修訂：刪除原版「審稿王」與「訂單合格數排行榜」（CEO 指出小團隊排名會誘發搶件內耗、指標可被繞過）；新增客戶維度指標與審稿環節經營指標；訂單級統計落地為冗餘欄位（顧問指出動態計算效能與凍結問題）。

## What Changes

### Dashboard 新增指標集

- **審稿環節經營指標**（highlight 2 格）：
  - 審稿環節平均滯留天數（訂單進入到審稿全部完成的平均耗時）
  - 退件 > 3 輪訂單數（當前有印件反覆退件 3 輪以上的訂單數）
- **審稿人員對比表擴欄**（預設依姓名排序，**無排名性質**）：
  - 新增 5 欄：訂單合格數 / 退件印件數 / 退件次數 / 補件後退件印件數 / 補件後退件次數
  - 「退件印件數 vs 次數」「補件後退件印件數 vs 次數」並列呈現，讓主管辨識「稿問題」vs「人問題」
- **客戶審稿成果表**（新）：
  - 欄位：客戶 / 訂單合格數 / 退件印件數 / 補件後退件次數 / 反覆退件訂單數
  - 支援主管向業務回報客戶品質

### 資料模型落地

- **BREAKING**：`Order` 新增兩個冗餘欄位
  - `prepressApprovedAt`：訂單所有非免審印件首次全部進入合格的時間戳（快照凍結）
  - `primaryContributorId`：訂單主要貢獻者（審最多印件的審稿人員；平手時取收尾者）
- `business-processes` 補寫入規則：印件狀態轉為合格後，若訂單達成全合格條件，寫入兩欄位；**一經寫入不再變動**，即便後續重審退件也不清空

### 時間區間語意統一（併入）

- `ReviewerInbox` / `InProgressItems` 時間區間語意統一為「審稿完成時間」(`ReviewRound.reviewedAt`)
- 預設值改為「不限」，加「不限」選項；Summary Bar 拆成「手上工作量」+「完成統計」兩組（Prototype 已實作，本 change 同步 spec）

### 規則補完

- 訂單歸屬月份：依 `prepressApprovedAt` 落月份；**已結月份不回溯改寫**（凍結）
- 離職審稿人員：歷史歸屬鎖定於 `primaryContributorId`；對比表當期無活動者自動不顯示 row
- 補件後退件歸屬：依 `ReviewRound.reviewerId`（與訂單主要貢獻者獨立）
- `skipReview` 訂單：不計入退件率分母；不計入訂單合格數

### 不涵蓋

- **改稿原因代碼結構化**（CEO 強烈建議，但範疇獨立）：延後至獨立 change；無此基礎前，「補件後退件」僅作觀察用
- 審稿王 / 訂單合格數排行榜（三視角一致反對，移除）
- 下鑽到印件清單、異常徽章、行動閉環（業務通知 / 派案等級自動調整）
- 狀態機新增「審稿全部完成」獨立狀態節點（冗餘欄位已足夠）
- 諮詢退件納入統計（資料模型不足，維持原 Non-Goals）

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `prepress-review`：新增審稿環節經營指標、客戶審稿成果表、補件後退件指標；擴充審稿人員對比表；統一時間區間語意與 Summary Bar 拆分
- `order-management`：`Order` 新增 `prepressApprovedAt` / `primaryContributorId` 兩個冗餘欄位及寫入 / 凍結規則
- `business-processes`：於「審稿合格後自動建工單」章節補「達成訂單全印件合格時寫入冗餘欄位」邏輯

## Impact

- **Prototype 程式碼**：
  - 擴充 [src/pages/prepress/SupervisorDashboard.tsx](/Users/b-f-03-029/sens-erp-prototype/src/pages/prepress/SupervisorDashboard.tsx)：對比表擴欄 + 新增「客戶審稿成果」Tab + 審稿環節經營指標 highlight
  - 新增 util 函式於 [src/utils/prepressReview.ts](/Users/b-f-03-029/sens-erp-prototype/src/utils/prepressReview.ts)：訂單合格寫入鉤子、滯留天數計算、客戶維度聚合、補件後退件過濾
  - `src/store/useErpStore.ts`：擴充 Order 型別；於審稿合格 action 內掛訂單級判定鉤子
- **Spec**：
  - [prepress-review/spec.md](openspec/specs/prepress-review/spec.md)：§ 審稿主管工作台、§ 審稿人員對比表、§ 審稿總覽時間區間篩選與 Summary Bar、新增審稿環節經營指標 / 客戶審稿成果表 / 補件後退件指標 Requirements
  - [order-management/spec.md](openspec/specs/order-management/spec.md) § Data Model：新增 `prepressApprovedAt`、`primaryContributorId`
  - [business-processes/spec.md](openspec/specs/business-processes/spec.md) §「審稿合格後自動建工單」：補寫入邏輯
- **狀態機**：無影響（現有「製作等待中」狀態節點足以表達「審稿全部完成」，僅需時間戳紀錄）
- **資料遷移**：新增欄位於既有 Order 初始化為 NULL；歷史訂單不回填（Prototype 階段 mock 資料重跑即可）
- **測試**：新增 utils 層單元測試（7 個核心情境：寫入時機、凍結、跨月、離職、補件後退件歸屬、skipReview、三人跨輪）
- **不影響**：狀態機、角色權限、工單模組、印件模組的既有流程
