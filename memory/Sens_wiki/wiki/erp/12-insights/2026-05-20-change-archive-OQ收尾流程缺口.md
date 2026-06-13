---
type: insight
module:
  - 跨模組
status: open
priority: high
raised-at: 2026-05-20
raised-by: vault-insight skill
triggered-by: audit-接續（vault-audit 維度 4 / 8 發現多重 OQ 收尾相關問題）
related-vault:
  - "[[changelog]]"
  - "[[OQ運作總覽]]"
related-oq:
  - PT-002
  - PT-003
  - PT-004
  - PT-005
  - XM-005
  - XM-007
related-spec: openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/
expected-action-at: 2026-06-01
---

# 2026-05-20：change archive 流程缺 OQ 收尾步驟 — 累積治理債

## 背景

vault-audit 全量稽核（2026-05-20）+ 補測（obsidian CLI orphans / unresolved）發現多重 OQ 治理問題集中於「change archive 後沒清理 OQ」這個流程缺口。本 insight 收斂為具體 action。

## 觀察

### 1. 7 個 OQ 在 change archive 後變 orphan

`reclassify-qc-and-add-inspection` change（2026-05-20 archive）期間建立 6 個 OQ，archive 後狀態：

| OQ ID | 主題 | 當前狀態 | 後續處理 |
|-------|------|---------|---------|
| [PT-002](../08-open-questions/PT-002-QC 分批驗收派工數量機制.md) | QC 分批驗收 | open，無 backlink | 未明確 |
| [PT-003](../08-open-questions/PT-003-NCR Rework 具體實現.md) | NCR Rework | open，無 backlink | 引用「C3 add-production-task-rework 範疇」（未建 change）|
| [PT-004](../08-open-questions/PT-004-QCRecord 資料遷移.md) | QCRecord 資料遷移 | open，無 backlink | archive 已處理（spec 改 ProductionTask 框架），OQ 未 close |
| [PT-005](../08-open-questions/PT-005-QC 心智模型驗證.md) | QC 心智模型 | open，無 backlink | 未明確 |
| [XM-005](../08-open-questions/XM-005-Use-As-Is 退款流程串接.md) | Use-As-Is 退款 | open，無 backlink，**priority high** | 跨售後 ticket（已列入 Insight 1）|
| [XM-007](XM-007-降級為次級品出貨.md) | 降級為次級品 | open，無 backlink | 未明確 |

### 2. XM-006 編號撞號（資料完整性違規）

兩個 OQ 共用 `XM-006`：

- `XM-006-備註模板維護路徑.md`（add-order-note-section-with-template-tool change，2026-05-20）
- `XM-006-降級為次級品出貨.md`（reclassify-qc-and-add-inspection change，2026-05-20）

oq-manage skill 命名規約規定「oq-id MUST 唯一」，但兩個 change 同日各自分配 XM-006 未檢查衝突。

### 3. 3 個 OQ source-link 指向 active change 路徑（已過期）

`PT-002` / `PT-003` / `XM-006-降級為次級品出貨` 的 source-link 與內文連結指向 `openspec/changes/reclassify-qc-and-add-inspection/` 但該 change 已 archive 為 `openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/`，連結 broken。

### 4. 9 個 OQ 缺 expected-resolution-at（治理債）

```
ORD-001、PI-001、PI-002、PT-001、PT-002、SHP-005、XM-002、XM-003、XM-006-降級為次級品出貨
```

多數為 v0.x 時代建立的 OQ，oq-manage skill v2.1（2026-05-19）強制要求 `expected-resolution-at` 但舊資料未補。

### 5. 既有 OQ 命名前綴不一致

- 舊命名：`after-sales-ticket-AFT-1-...` / `after-sales-ticket-AFT-2-...`（前綴含模組名）
- 新命名：`AFT-3-...` ~ `AFT-8-...`（無前綴，直接 MODULE-NNN）

本次 audit 發現 wiki link 撞到不一致命名（[[AFT-1-業務離職轉派]] 找不到，因為實際檔名是 `after-sales-ticket-AFT-1-...`）。

## 推論

`/opsx:archive` 工作流目前的 archive checklist 缺「OQ 收尾」步驟，導致：

1. **change 期間建立的 OQ 在 archive 後變孤兒**：無 backlink、source-link 過期、未 close 也未連結後續 change
2. **OQ 編號未跨 change 統一管理**：同日多個 change 各自分配 ID 未檢查衝突
3. **OQ 治理規約演化未回溯舊資料**：oq-manage skill 升 v2.1 強制 expected-resolution-at 但既有 OQ 沒補
4. **命名規約不一致累積債**：舊命名與新命名同存於 OQ 目錄，跨卡 wiki link 易誤

這四點同一根因：**OpenSpec change archive 流程沒把 OQ 視為「change 的衍生產出物」做收尾治理**。

## 下一步建議

### Action 1：更新 `/opsx:archive` skill 加 OQ 收尾步驟（priority high）

- **負責人**：Miles 確認設計 + Claude 改 SKILL.md
- **時程**：2026-05-22 前
- **內容**：在 `.claude/skills/openspec-archive-change/SKILL.md` archive 流程加：
  - 列出本 change 期間建立的 OQ（透過 source-link 或 raised-by 反查）
  - 對每筆 OQ 詢問 Miles：close（answered + 補答覆段）/ 改派下一 change（更新 source-link）/ 維持 open（補 expected-resolution-at）
  - 確認新 OQ 編號未撞號（grep `oq-id: XXX-NNN` 全域唯一）
  - 更新 source-link 路徑（active change → archive change 路徑）
- **預期產出**：archive 工作流產生 OQ 收尾報告（追加到 audit-log）

### Action 2：修本次 audit 發現的 6 個 QC 重構期 OQ + XM-006 撞號（priority high）

- **負責人**：Miles 決策 + Claude 執行
- **時程**：2026-05-22 前
- **內容**：
  1. 與 Miles 對齊 PT-002/003/004/005 / XM-005 / XM-006-降級 6 個 OQ：close / 改派 / 維持 open
  2. 重編「XM-006-降級為次級品出貨」為 `XM-007-降級為次級品出貨`（避免撞號）
  3. 修 PT-002/003 / XM-006-降級 的 source-link 改指向 archive 路徑
  4. 補納入 `08-open-questions/README.md` OQ 清單表格（目前缺漏）
- **預期產出**：6 個 OQ status 明確；XM-006 撞號解除

### Action 3：補 9 個 OQ 的 expected-resolution-at（priority medium）

- **負責人**：Miles
- **時程**：2026-06-01 前
- **內容**：對 ORD-001 / PI-001/002 / PT-001/002 / SHP-005 / XM-002/003 / XM-006-降級 9 個 OQ，補上預計解決時程
- **預期產出**：所有 OQ 都有 expected-resolution-at 欄位（vault-audit 維度 8 → OK）

### Action 4：統一 OQ 命名規約（priority low）

- **負責人**：Claude（一次性遷移）+ Miles 確認
- **時程**：2026-06-01 前
- **內容**：把 `after-sales-ticket-AFT-1-...` / `after-sales-ticket-AFT-2-...` 兩個舊命名 OQ 重命名為 `AFT-1-業務離職轉派.md` / `AFT-2-逾期分級.md`，並全 grep 替換 wiki link 引用
- **預期產出**：OQ 目錄內檔名格式統一（`<MODULE>-<NNN>-<簡述>.md` 無前綴）

## 涉及

### Vault 卡
- [[changelog]]
- [[OQ運作總覽]]
- （已移除，見各 skill）

### OQ
- [[PT-002-QC 分批驗收派工數量機制]]
- [[PT-003-NCR Rework 具體實現]]
- [[PT-004-QCRecord 資料遷移]]
- [[PT-005-QC 心智模型驗證]]
- [[XM-005-Use-As-Is 退款流程串接]]
- [[XM-007-降級為次級品出貨]]
- [[AFT-1-業務離職轉派]]
- [[AFT-2-逾期分級]]

### Skill
- `.claude/skills/openspec-archive-change/SKILL.md`
- `.claude/skills/oq-manage/SKILL.md`

### Archive 路徑
- `openspec/changes/archive/2026-05-20-reclassify-qc-and-add-inspection/`

## 後續更新

- 2026-05-20：建卡 status = open
