---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-28
---

# 單 Agent 輕量審查模式

> 適用情境：CLAUDE.md § ERP 討論主動路由 中「功能設計有傾向（尚無 change）」或「局部欄位調整」類型，不需啟動完整多 agent 協作 / 審查。
> **序列協作（主協議）**：見 [[sequential-design-collaboration]]。

## 一、定位

本模式為「單 Agent 單輪」執行規則，補完三個協議之間的 gap：

| 觸發場景 | 對應協議 |
|---------|---------|
| 局部欄位 / 純探索 / 單一視角足夠 | **本協議**（單 agent 單輪）|
| 規格撰寫 / 變更 / 結構性變更（在 `/opsx:explore` 或 `/opsx:propose` 階段）| [[sequential-design-collaboration]] |
| 規格 verify 前最終驗收 | 不另啟動（由 [[sequential-design-collaboration]] Phase 4 verify consistency 涵蓋）|



## 二、觸發時機

| 觸發信號 | 對應 CLAUDE.md 路由 |
|---------|-------------------|
| 局部欄位調整（單模組內，不影響跨模組） | 「局部欄位調整」級 → 單 agent（erp-consultant）|
| 功能設計有傾向（尚無 OpenSpec change） | 「功能設計有傾向」類型 → 單 agent（senior-pm OR erp-consultant 依議題決定）|
| 系統一致性 / 狀態機快速確認 | 「系統一致性」類型 → 單 agent（erp-consultant）|
| 商業目標 / 痛點探索（前期）| 「商業目標 / 痛點探索」類型 → 單 agent（senior-pm 前期介入模式）|

## 三、Agent 選擇規則

| 議題性質 | 選用 Agent |
|---------|-----------|
| 問題定義 / 使用者需求 / KPI / User Story | [senior-pm](../../../../../.claude/agents/senior-pm.md) |
| 狀態機 / 資料一致性 / 跨模組整合 / 命名 | [erp-consultant](../../../../../.claude/agents/erp-consultant.md) |
| 商業可行性 / 角色合理性 / 現場操作 | [ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md) |

**MUST NOT** 同時呼叫兩個 agent；若需要兩視角，**MUST** 直接升級到 [[sequential-design-collaboration]]。

## 四、執行流程

```
步驟一：呼叫方（Claude 協調者）依議題性質選擇單一 agent
步驟二：傳入 prompt 時明確標記「[MODE: LIGHTWEIGHT]」
步驟三：agent 依 [[review-loading-checklist]] 載入背景（不需載入 multi-agent 載入範圍以外的視角）
步驟四：agent 輸出**單輪審查格式**（沿用 agent.md § 輸出格式中對應的「BRD 審查」或「前期介入」格式）
步驟五：Miles 決定是否升級為三視角討論
```

## 五、升級條件（Agent 主動提醒）

審查過程中若發現以下情況之一，agent **MUST** 在輸出末尾主動建議升級：

| 情況 | 升級建議格式 |
|------|------------|
| 議題影響跨視角（如同時涉及 KPI 與狀態機） | 「建議升級為序列協作 / 三視角討論：本議題同時涉及 [視角 A] 與 [視角 B]，單一視角無法完整評估」 |
| 設計決策影響重大（如新增實體、新增跨模組關聯） | 「建議升級為序列協作：本議題屬結構性變更，需多視角共同確認」 |
| 與既有 OQ / spec 出現矛盾 | 「建議升級為序列協作 / 三視角討論：發現與 [[<OQ 編號>]] 或 [模組 spec] 存在潛在矛盾」 |

Miles 可選擇：
- **採納升級建議**：觸發 [[sequential-design-collaboration]]
- **拒絕升級**：以單 agent 結論作為最終，由 Miles 自行判斷

## 六、輸出格式

沿用各 agent.md § 輸出格式：
- [senior-pm](../../../../../.claude/agents/senior-pm.md) 前期介入模式 → 「問題框架報告」格式
- [senior-pm](../../../../../.claude/agents/senior-pm.md) BRD 審查模式 → 「BRD 審查」格式
- [ceo-reviewer](../../../../../.claude/agents/ceo-reviewer.md) / [erp-consultant](../../../../../.claude/agents/erp-consultant.md) → 「單輪審查」格式

**追加項目**（單 Agent 輕量審查特有）：

```
[輕量審查結論]

審查模式：單 Agent 輕量審查
觸發類型：[局部欄位 / 功能設計傾向 / 系統一致性 / 商業目標探索]

[原 agent.md 對應輸出格式內容]

升級建議：
- [若有升級條件觸發] 建議升級為三視角討論：[原因]
- [若無] 本議題範疇單一視角已足夠評估，無需升級
```

## 七、與多 Agent 討論的差異

| 項目 | 單 Agent 輕量審查 | 多 Agent 完整討論 |
|------|----------------|-----------------|
| 參與 agent 數 | 1 | 2-3 |
| 輪次 | 1 | 2-3 |
| 跨視角質疑 | 無（由 agent 主動建議升級代替）| Round 2 起每輪必填 |
| 收斂判斷 | 無（直接由 Miles 接收結論）| Claude 執行 |
| 寫入流程 | 由 Miles 自行決定 / 直接觸發 oq-manage 等 | 依 [[senior-pm-write-mode]] |
| 適用議題 | 局部 / 探索性 / 單一視角足夠 | 結構性 / 跨視角 / 商業邏輯 |

## 八、相關卡

- [[sequential-design-collaboration]] — 序列式設計協作協議（`/opsx:explore` 與 `/opsx:propose` 主協議）
- [[senior-pm-write-mode]] — Senior PM 寫入流程
- [[review-loading-checklist]] — 各 Agent 背景載入範圍
- CLAUDE.md § ERP 討論主動路由 — 觸發分級主表

---

## 九、explore 輕量商業邏輯衝突檢查變體（2026-05-30 新增）

> 對應 CLAUDE.md 路由「`/opsx:explore` → 輕量商業邏輯衝突檢查」。Miles 拍板：explore 階段不跑完整序列協作 Phase 1，改跑此輕量檢查（平衡探索自由 vs 早期防呆）。

### 觸發
`/opsx:explore` 開新需求、或「功能設計有傾向」討論進入探索時。

### 職責：廣度發現（不是深度釐清）
- **讀**：依議題領域載入對應 Vault `04-business-logic/` 卡（商業正本）+ 查相關 `08-open-questions/` OQ。
- **產「衝突筆記」**：本方向撞了哪些既有商業規則（附檔:行）+ 既有解法是什麼 + 初步方向，給早期 go/no-go 警示。
- **MUST NOT**：跑完整 Phase 1（不產正式 OQ 候選、不啟動 CEO / 顧問、不做完整需求邊界釐清）——那是 propose 階段 PM Phase 1 的職責。

### 發現衝突後的處置分岔（決策權在 Miles，agent MUST NOT 替決定）
attach 三選項給 Miles：
- **A 繞過**：用既有機制（如棄用+clone）滿足痛點 → 可能不進 propose，省下整條設計+實作成本。
- **B 推翻**：確認要改既有規則 → 帶「MODIFIED 既有 Requirement」任務進 propose。
- **C 待釐清**：取捨需現場數據 → 開 OQ，暫緩 propose 或帶 OQ 進 propose 由 CEO Phase 2 補輸入。

### 承接（避免 explore↔propose 重工）
決定推進 propose 時，衝突筆記經 [[dispatch-prompt-template]] context bridging 傳入 propose PM Phase 1；PM Phase 1 **承接深化、增量讀（只讀 explore 未覆蓋 / 需求具體化後新涉及者）、MUST NOT 重新掃描已發現衝突**，將衝突轉為正式 OQ 候選 + 給 CEO / 顧問輸入。

### 輸出格式

```
[explore 輕量商業邏輯衝突檢查]

議題領域：<L1.X 領域>
已讀商業正本：<04-business-logic 卡清單 + 相關 OQ>

衝突筆記：
- 衝突 1：本方向 <動作> 撞 <既有規則>（<檔:行>）；既有解法 <...>
- 衝突 2：...
- （或）無衝突：本方向與既有商業規則無衝突，可直接進 propose

處置選項（待 Miles 拍板）：
- A 繞過：<用哪個既有機制>，影響 <...>
- B 推翻：<要 MODIFIED 哪條既有規則>，影響 <...>
- C 待釐清：<開哪個 OQ>，影響 <...>
```
