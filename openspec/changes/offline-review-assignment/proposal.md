# 線下單審稿人員分派機制變更

## Why

### Background

現行規格中，審稿人員於印件首次上傳稿件時由系統依難易度自動分派（不分訂單來源），覆寫權在審稿主管。實務上線下單全客製、製作複雜，哪些印件要先審核是業務對客戶交期與製作風險的人為判斷，自動分派無法反映這些調度考量。

Miles 於 2026-07-02 逐題拍板新設計，wiki 商業邏輯正本已先行更新（BRD 先行）：

- [審稿分配規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/審稿分配規則.md) — 分派執行者雙型與改派規則正本
- [訂單管理人](../../../memory/Sens_wiki/wiki/erp/03-roles/訂單管理人.md) — 新獨立角色（推翻 XM-003 第一階段併卡）
- [審稿主管](../../../memory/Sens_wiki/wiki/erp/03-roles/審稿主管.md) — 職責收斂為改派＋能力等級＋監控
- [印件狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/印件狀態.md) — 審稿維度新增「待分派」初始態
- [審稿討論Slack串接約束](../../../memory/Sens_wiki/wiki/erp/04-business-logic/外部約束/審稿討論Slack串接約束.md) — Slack 討論串介面約束
- [印件審稿](../../../memory/Sens_wiki/wiki/erp/07-scenarios/印件審稿.md)、[覆寫審稿分派](../../../memory/Sens_wiki/wiki/erp/07-scenarios/覆寫審稿分派.md) — 業務情境
- [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) — 新增「負責審稿人員」業務欄位

相關未解 OQ：[AR-15 webhook 失敗補救](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-15-審稿討論webhook建立失敗補救.md)、[AR-16 Slack 帳號對應](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-16-Slack帳號對應維護.md)、[AR-17 待分派停滯提醒](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-17-待分派停滯提醒機制.md)、[AR-5 待審清單排序](../../../memory/Sens_wiki/wiki/erp/08-open-questions/AR-5-待審清單預設排序與急單標記.md)（範圍已縮）——實作階段裁決。

### Problem Statement

1. 線下單審核先後順序無法由系統自動判斷，業務的人為調度判斷沒有進入分派流程的管道。
2. 現行規格分派綁定「首次上傳稿件」時點，無法支援「回簽後先討論、先分派、稿件後補」的實務順序。
3. 業務與訂單管理人的審核順序溝通散在 Slack、與單據脈絡脫節，事後無法回溯。

## What Changes

- **BREAKING** 線下單（B2B）分派機制：系統自動分派 → 訂單回簽後由訂單管理人手動分派；候選清單不過濾（全部在崗審稿人員），難易度與能力等級僅參考標示。線上單（EC / B2C）維持首次上傳時系統自動分派，同一流程、執行者分型。
- **BREAKING** 印件審稿維度新增「待分派」初始狀態（判準＝無負責審稿人員），分派與稿件上傳解耦；「稿件未上傳」語意改為「已分派、等稿」。
- 「審稿主管覆寫分配」改為「改派」：訂單管理人與審稿主管皆可執行，候選不過濾、須填原因、留活動紀錄；原「覆寫候選過濾能力不足者」規則廢除。
- 新增 Slack 審稿討論串：業務勾選印件開啟討論，ERP 透過 webhook 建立 Slack 對話、帶入訂單與印件資訊並 mention 訂單管理人；可選輔助、非分派必要前置；審核順序不落系統欄位。
- 新增「訂單管理人」角色與其工作視角（待分派清單、分派與改派操作）。
- 難易度更正後的重派邏輯分型：線上單維持次次上傳時依新難易度重派；線下單原審稿人員不變、換人走改派。

## Capabilities

### New Capabilities

（無——審稿討論串與分派變更均屬印前審稿既有 capability 範疇）

### Modified Capabilities

- **prepress-review**：「印件自動分配機制」改寫為分派執行者雙型（線上自動／線下訂單管理人手動）；「審稿主管覆寫分配」改寫為「改派」（雙角色、候選不過濾）；「審稿階段流程（端到端）」「印件審稿狀態與 Round 同步」納入待分派狀態；新增「Slack 審稿討論串」「待分派清單與分派操作」Requirement；「審稿主管工作台」調整（覆寫相關與自動分配命中率移除）。
- **order-management**：印件「負責審稿人員」欄位的行為規格（分派時點與回簽的關係）；訂單回簽觸發印件進入可分派狀態的轉換規則。

## Impact

- 影響 spec：`openspec/specs/prepress-review/spec.md`（主要）、`openspec/specs/order-management/spec.md`（回簽觸發與印件欄位行為）
- Prototype：`sens-erp-prototype/src/` 審稿模組（分派 UI、待分派清單、改派、Slack 討論串按鈕與 mock webhook）、印件狀態機型別（`src/types/order.ts` 審稿維度 enum 新增待分派）
- 角色權限：新增訂單管理人角色的操作權限；審稿主管權限收斂
- 外部整合：Slack Webhook（出向）——Prototype 階段以 mock 實作，真實串接待 AR-15 / AR-16 裁決
