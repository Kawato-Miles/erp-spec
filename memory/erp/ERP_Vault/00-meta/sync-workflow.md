---
type: meta
status: active
last-reviewed: 2026-05-19
---

# Vault ↔ OpenSpec ↔ Notion 同步流程

> 三邊同步**無自動 sync**。重要里程碑後由 Miles 觸發；外部反饋走人工流程。

## 一、總原則

依 [[vault-charter#三、Source of Truth 規則|Vault Charter]]：

| 層 | 角色 |
|---|-----|
| **Vault** | 商業需求 KM（內部正本） |
| **OpenSpec** | 功能規格層（內部正本） |
| **Notion** | 對外確認介面（發布版本） |

**Vault + OpenSpec → Notion**（彙整推送）+ **Notion → Vault + OpenSpec**（反饋回流），都是人工觸發。

## 二、流程 1：Vault + OpenSpec → Notion（彙整推送）

### 觸發時點

- Prototype 階段完成
- 重大 OpenSpec change 歸檔
- Miles 主動觸發（如：要給公司同仁或外部單位確認新功能）

### 步驟

1. **Miles 通知 Claude**：「請推送 [模組] 至 Notion 給 [對象] 確認」
2. **Claude 讀取 Vault**：相關卡（如 [[訂單]] / [[齊套邏輯]] / [[03-roles/業務]]）
3. **Claude 讀取 OpenSpec**：對應 spec 的 § Requirements / § Scenarios
4. **Claude 組裝 BRD 格式**：
   - 商業背景（自 Vault [[product-vision]] / [[pain-points]]）
   - 角色 R&R（自 Vault `03-roles/`）
   - 商業邏輯（自 Vault `04-business-logic/`）
   - 資料模型（自 Vault `05-entities/`）
   - 狀態機（自 Vault `06-state-machines/`）
   - 功能 Requirement（自 OpenSpec spec § Requirements）
   - User Story（自 OpenSpec spec § Scenarios）
5. **Claude 用 Notion MCP 寫入**：
   - 更新對應 Notion BRD 頁面（[[notion-index|模組 BRD URL]]）
   - 或建立新頁面（如 Feature DB 內新 entry）
6. **Claude 報告**：Notion 頁面 URL 給 Miles 確認

### 注意事項

- **不複製演算法 / UI 規範**（依 [[scope-boundary]] 排除）
- 跨頁面引用用 `[可讀名稱](URL)` 格式（依 CLAUDE.md § 11 規則）
- Notion 內容若已存在，採 update 而非 duplicate

## 三、流程 2：Notion → Vault + OpenSpec（反饋回流）

### 觸發時點

- 公司同仁在 Notion 頁面留 comment 或在會議反映
- 外部單位（客戶 / 廠商）反饋

### 步驟

1. **Miles 收到反饋**（透過 Slack / 會議 / Notion comment）
2. **Miles 給 Claude**：對應 Notion 連結 + 簡短 context
3. **Claude 抓內容**（用 `notion-fetch` / `notion-get-comments`）
4. **Claude 判斷影響範圍**：
   - 是否動到商業層？→ 更新 Vault 對應卡（如 `04-business-logic/` / `05-entities/`）
   - 是否動到功能規格？→ 開新 OpenSpec change 或直接更新 spec
   - 是否動到角色 R&R？→ 更新 `03-roles/` + `_alignment-report.md`
5. **Claude 執行更新**：
   - 修改 Vault 卡 frontmatter `last-reviewed` 為當天
   - 修改 OpenSpec spec（若涉及）
   - **不直接更新 Notion**（避免循環，等下一次 Miles 觸發推送）
6. **Claude commit**：依 [[vault-charter#五、Commit 規範]]
7. **Claude 報告**：本次更新摘要給 Miles

## 四、流程 3：純 Vault 異動（最常見）

### 觸發時點

- Miles / Claude 撰寫新 OpenSpec change 過程中
- 發現 Vault 卡內容不足 / 錯誤
- 新增 OQ 識別出來的問題

### 步驟

1. **直接編輯 Vault 卡**
2. **更新 frontmatter `last-reviewed`**
3. **commit**：依 [[vault-charter#五、Commit 規範]]
4. **不主動推 Notion**（累積數個異動後由 Miles 統一觸發推送）

## 五、流程 4：純 OpenSpec change 工作流

### 觸發時點

- 撰寫新 change（feature / fix / refactor）

### 步驟（既有 OpenSpec workflow，本流程不改變）

1. `/opsx:propose` 或 `/opsx:new` + `/opsx:continue`
2. proposal / design / specs 階段：**必須在 `## Why` 或 `## Background` 段以 wiki link 引用 Vault 對應節點**
3. `/opsx:apply` 實作
4. `/opsx:verify` 驗證
5. `/opsx:archive` 歸檔
6. delta spec 合併回 main spec

### 與 Vault 的關係

- change proposal 撰寫時 AI 必須先讀 Vault 對應背景卡
- 若新 change 引入新商業邏輯 → **同 change 內更新 Vault**
- 若新 change 引入新角色 → 更新 `03-roles/` + `_alignment-report.md`

## 六、誰負責什麼

| 角色 | 責任 |
|------|------|
| **Miles** | 觸發推送 / 給反饋連結 / 決策 OpenSpec change 範圍 / 確認 Notion 內容 |
| **Claude** | 讀 / 寫 Vault / 寫 OpenSpec / 推 Notion / commit |
| **公司同仁** | 在 Notion 給反饋（不直接編輯 Vault） |

## 七、不做的事

- ❌ Vault → Notion 自動 sync（每月人工 / cron 都不做）
- ❌ Notion → Vault 自動 sync
- ❌ 公司同仁直接編輯 Vault
- ❌ Claude 在無 Miles 觸發下推送 Notion

## 八、相關卡

- [[vault-charter]] — Source of Truth 規則
- [[scope-boundary]] — 收 / 不收邊界
- [[notion-index]] — Notion 資源索引
- [[openspec-index]] — OpenSpec 索引
