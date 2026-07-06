---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-19
---

# PM 視角資料地圖

> [senior-pm](../../../../../.claude/agents/senior-pm.md) 執行前期介入 / BRD 審查時的全景資料清單。讓 PM 視角知道「有哪些參考資料存在、哪些與本次討論最相關」，避免遺漏重要背景。

## 一、原則

開口前必須知道「有哪些參考資料存在、哪些與本次討論最相關」。**MUST** 先掃描全景，再聚焦載入。

## 二、全景資料清單（每次必確認）

> 完整 Notion URL 索引見 `memory/shared/notion-index.md`（唯一正本）。URL 異動時以該檔案為準。

以下資料來源是此 ERP 系統的完整知識庫。執行前先確認自己掌握每一個的現況，再決定本次需要深讀哪些：

| 資料來源 | 說明 | Notion / 路徑 |
|---------|------|--------------|
| 商業流程 | 核心業務規則、決策邏輯 | wiki `04-business-logic/`（正本）+ 各模組 spec |
| 使用者情境 | 角色日常工作、職責、痛點 | wiki `03-roles/`（正本）|
| User Story DB | 已定義的業務故事（US-001 起）| 嵌入各模組 spec（已遷至 OpenSpec）|
| 產品目標 / KPI | 商業目標與可量化指標 | [Notion 產品目標](https://www.notion.so/32c3886511fa81359354e33087d23f23) |
| KPI DB | 各模組可量化成功指標（以 Feature 欄位篩選） | [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f) |
| 狀態機（上層）| 需求單 / 訂單 / 工單 / 印件狀態轉換 | wiki `06-state-machines/` 各狀態機卡 + 各模組 spec（狀態機已拆分至對應模組） |
| 狀態機（下層）| 任務 / 生產任務 / QC / 出貨單 | 同上（各模組 spec 內嵌狀態機 Requirement） |
| 業務情境 DB | PM 視角情境驗證與邊界案例 | [Notion 業務情境](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05) |
| 資料欄位 DB | 現有資料模型與欄位定義 | 嵌入各模組 spec（已遷至 OpenSpec）|
| Follow-up DB（OQ）| 對外確認版 | [Notion Follow-up](https://www.notion.so/32c3886511fa808e9754ea1f18248d92) |
| 既有 Spec（BRD）| 已設計的模組清單 | CLAUDE.md § Spec 規格檔清單 |
| Vault 商業需求 KM | 商業層內部正本 | `memory/Sens_wiki/wiki/`（[[erp_index]]）|

## 三、必讀（每次執行前必載入）

> **載入順序（對齊 CLAUDE.md「先讀 wiki 商業正本 → 再 openspec 實作規格」，2026-05-30 補）**：商業層 **MUST 先讀 Vault `04-business-logic/` 正本，再讀 openspec 實作規格**，順序不可顛倒（漏讀 wiki 正本會漏看既有商業規則）。

1. **Vault `04-business-logic/` 對應領域卡**（商業邏輯正本，**MUST 先於 openspec 讀取**）— 依本次議題領域載入（如審稿 → 審稿分配規則 / 免審決策樹 / 打樣流程 / 稿件管理規則 / 印件生產流程；款項 → 付款發票邏輯 等），這是商業規則的 ground truth
2. **Vault `03-roles/` 對應角色卡**（角色職責正本）— 角色日常工作、痛點來源
4. **業務情境** — 確認新功能是否有對應情境基礎（Vault `07-scenarios/` 業務情境卡）
5. **Notion 產品目標** — 確認新功能能真實貢獻哪個 KPI
6. **Vault `08-open-questions/`** — 避免重複設計已討論過的問題；查詢時 **MUST** 同時閱讀「決議與理由」，了解已解答 OQ 的最終決策，確保新設計不與既有決策衝突

## 四、依討論類型追加載入

| 討論類型 | 追加載入 |
|---------|---------|
| 商業目標 / 痛點探索 | 業務情境 DB（邊界案例）|
| 功能設計 / 流程討論 | 狀態機（依模組讀上層或下層）|
| 資料模型 / 欄位討論 | 各模組 spec 內嵌資料欄位定義 |
| 特定模組審查 | 對應 BRD Notion 頁面（由呼叫方提供連結）|

## 五、輸出規範

執行完畢後，在輸出的「背景載入」欄位 **MUST** 列出：
- 已讀清單（必讀 + 追加載入）
- 本次跳過的項目 + 跳過理由（如「資料欄位 DB：本次不涉及欄位設計」）

讓 PM 知道你的資料視野是否完整。

## 六、與其他視角的資料地圖差異

| 視角 | 重點資料 |
|------|---------|
| PM（本卡）| 產品目標 / KPI / User Story / 使用者情境 |
| CEO | 業務情境 DB / KPI DB / 商業流程（高層）|
| ERP 顧問 | 狀態機 / 資料欄位 / 商業流程（完整）/ 跨模組整合 |

**MUST NOT** 互相重複載入，跨視角的關聯問題由 [[sequential-design-collaboration]] Phase 4 PM verify consistency 集中處理。

## 七、相關卡

- [[review-loading-checklist]] — 跨 agent 共用載入規則
- [[pm-review-framework]] — PM BRD 審查 5 維度
- [[early-intervention-framework]] — PM 前期介入 5 維度
