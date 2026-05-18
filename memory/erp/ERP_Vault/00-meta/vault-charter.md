---
type: meta
status: active
last-reviewed: 2026-05-19
---

# ERP_Vault 章程

> 本 Vault 為 Sens ERP 與圖編產品的「**商業需求 KM**」內部正本，與 OpenSpec（功能規格層）、Notion（對外確認介面）構成三邊分工。

## 一、定位

- **路徑**：`Sens/memory/erp/ERP_Vault/`，沿用 Sens 主 repo（不獨立 repo、不用 submodule）
- **採用範式**：PARA + Zettelkasten 混合，目錄前綴 00 ~ 10 為 PARA 階層，內容卡片本身遵循 Zettelkasten 原子化原則
- **服務對象**：Miles（PM）、Claude Code（撰寫 spec 時的背景資料來源）、未來公司同仁（透過 Vault → Notion 推送的發布版本）

## 二、三邊分工

| 層級 | 角色 | 收什麼 | 不收什麼 |
|------|------|--------|----------|
| **Obsidian Vault（本 Vault）** | 商業需求 KM（內部正本） | 商業目標 / 印刷業 domain / 角色 R&R / 商業邏輯（齊套、報價、付款發票、審稿分配等）/ 資料模型實體與欄位定義 / 跨模組情境 / KPI / OQ | 功能 step-by-step Requirement、change workflow、delta spec |
| **OpenSpec** | 功能規格層（內部正本） | 各模組 spec § Requirements / § Scenarios（功能級）/ change workflow / delta / archive / tasks | 商業層知識（以 wiki link 從 Vault 引用） |
| **Notion** | 對外確認介面（發布版本） | Prototype 階段完成後 Vault + OpenSpec 彙整推送的 BRD / user story / 需求頁面，給公司同仁與外部單位確認 | 工作版本、迭代中的探索（內部正本在 Vault / OpenSpec） |

詳細「收 / 不收」邊界見 [[scope-boundary]]。

## 三、Source of Truth 規則

- 商業邏輯異動 → 先改 Vault，OpenSpec 受影響的 spec 在 change proposal 中以 wiki link 引用
- 功能規格異動（不涉及商業邏輯）→ 走既有 OpenSpec change 流程
- 跨層異動（如新業務規則影響規格）→ Vault + OpenSpec 同 change 內處理

### 同步方向

- **首次建立 Vault 時**：從 Notion 既有頁面（產品目標 / 使用者權責 / 業務情境 DB 等）抽取作為 ground truth 進 Vault（一次性遷移）
- **未來迭代**：
  - **Vault + OpenSpec → Notion**（彙整推送）：Miles 在重要里程碑（如 prototype 階段完成、change 歸檔）後手動觸發，將最新 Vault 內容 + OpenSpec 對應 spec 彙整推送至 Notion 對應頁面
  - **Notion → Vault + OpenSpec**（反饋回流）：公司同仁在 Notion 反饋後，Miles 把對應 Notion 連結給 Claude，由 Claude 更新 Vault / OpenSpec 內容
  - **不做自動 sync**

詳細同步流程見 [[sync-workflow]]（Phase C 撰寫）。

## 四、目錄結構

```
ERP_Vault/
├── 00-meta/                      # 章程 / 入口 / 編輯規約 / 邊界 / 同步流程
├── 01-products/                  # 產品願景 / 痛點 / 利害關係人 / Phase / 北極星指標 / KPI
├── 02-domain/                    # 印刷業 domain knowledge / 三份 glossary
├── 03-roles/                     # 角色 R&R（以 Notion 核心角色權責 DB 為 ground truth）
├── 04-business-logic/            # 商業邏輯 Zettel 卡（齊套、報價、付款發票、審稿分配等）
├── 05-entities/                  # 資料模型實體（需求單 / 訂單 / 工單 / 印件 / 生產任務 / QC / 出貨 / 售後）
├── 06-state-machines/            # 各實體狀態機獨立檔
├── 07-scenarios/                 # 跨模組業務情境（鏡像 Notion 業務情境 DB + business-scenarios spec）
├── 08-open-questions/            # OQ 內部正本（oq-manage skill 改寫後寫此處）
├── 09-canvases/                  # JSON Canvas 視覺化（角色 swimlane / 狀態機 graph / 實體關聯 / 模組依賴 / traceability）
└── 10-references/                # 外部連結索引（Notion / OpenSpec / Prototype / decks）
```

## 五、Commit 規範

依 `Sens/CLAUDE.md` 版本控管規範，Vault 異動 commit 格式：

```
{prefix}: {繁體中文描述} (ERP_Vault)
```

- prefix：`feat: / fix: / refactor: / docs:`
- 結尾必加 `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- 每次 Vault 異動連同 CLAUDE.md（若有索引變動）一起 commit

## 六、不在此 Vault 的內容（請去對應位置）

| 內容類型 | 位置 |
|---------|------|
| UI 設計系統（顏色、字型、元件、layout） | `sens-erp-prototype/DESIGN.md`（實作層唯一權威）|
| UI 業務規則（表格密度 / 批次操作 / 響應式等） | `memory/shared/ui-business-rules.md` + Prototype |
| Prototype 設計原則（指針模式 / 狀態碼結構化等） | `memory/shared/principles.md` |
| 演算法 / 計算公式 / 自動分配步驟 | Prototype `src/utils/` 與各模組 spec § Requirements |
| 功能 step-by-step Requirement | OpenSpec 各模組 spec § Requirements |
