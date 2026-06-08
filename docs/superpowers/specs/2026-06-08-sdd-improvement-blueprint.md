# SDD 工作流程改善藍圖

- 日期：2026-06-08
- 類型：階段 3 最終 deliverable（診斷 + 改善方向藍圖；不含逐步執行步驟，每項標執行路徑）
- 輸入：[研究發現](2026-06-08-sdd-research-findings.md)（階段 1）+ [診斷發現](2026-06-08-sdd-diagnosis-findings.md)（階段 2）
- 前提：維持 OpenSpec 框架不變
- 狀態：待 gate 3 審閱

---

## 一、執行摘要

研究與診斷收斂出單一根因：**規格庫的治理約束全是「靠人/agent 自覺遵守的散文」，沒有一條變成 commit/PR/archive 當下的機械閘門**；而 OpenSpec 歸檔是覆寫式合併（後歸檔者整條取代前者、靜默丟 scenario）。兩者疊加，任何疏漏都無聲變成漏改或矛盾——這就是你遇到的「漏改、矛盾」。

改善不是「換框架」，而是三件事協同：
1. **把散文規則變成機械閘門**（最高槓桿，且機械化的同時能刪散文 —— 見核心策略）
2. **拆掉 God spec（order-management）降低撞車面與 context rot**
3. **清整過載與鏽蝕的 skill/指令/協議**

---

## 二、現況問題總覽（按嚴重度）

| 編號 | 問題 | 嚴重度 | 來源 |
|---|---|---|---|
| H1 | 治理約束全為散文、零機械閘門；11 active change、6 個 tasks=0、最久掛單 68 天 | high | 診斷 H1 |
| H2 | 3 組 active change 對同名 Requirement 方向相反撞車（work-order / production-task / state-machines），歸檔將靜默丟失 | high | 診斷 H2 |
| H3 | 防漏改機制自己失效：vault-audit 維度 13 幽靈引用、Phase 4 第三張對照表 agent 端只渲染兩張 | high | 診斷 H3 |
| H4 | order-management God spec（4504 行 / 115 Req / 22 實體），帳務佔 50 Req+14 實體可抽出 | high | 診斷 H4 |
| M1 | wiki↔openspec 矛盾：pi_ordered_qty 可編輯性，fix-order-print-item-actions 未 rebase route-C | med | 診斷 M1 |
| M2 | 切分維度錯誤：state-machines / business-processes 按技術層橫切，同一規則散三檔 | med | 診斷 M2 |
| M3 | 後期稽核 skill 鏽蝕：doc-audit 腳本指兩代前架構、erp-spec 停用殘留、archive 後觸發重疊 | med | 診斷 M3 |
| L1 | CLAUDE.md 448 行過載 + 願望式指令 + 可機械驗卻寫成散文 | low | 診斷 L1 |
| L2 | erp-planning-pre-check 負擔偏重（小範圍仍跑完整 6×7 矩陣） | low | 診斷 L2 |
| L3 | 5 協議 + 3 agent 過載；deprecated 協議未清；5 個 SKILL.md 超 500 行 | low | 診斷 L3 |

---

## 三、核心策略：機械化與精簡是同一動作的兩面

這份藍圖最重要的觀念，也是調和「研究建議加閘門」與「精簡、勿過度處理」偏好的關鍵：

**把一條靠人遵守的散文規則變成 lint/hook 後，那條散文就能從指令檔刪掉、縮為一行「由 X 強制」。** 機械閘門增加的同時，CLAUDE.md / skill / 協議的散文負擔下降，遵從負擔反而變輕。

範例：CLAUDE.md L331「上游 wiki 的 source 禁指 openspec/specs/（違者報錯）」——這條已經寫了「違者報錯」卻沒有報錯的機制。把它寫成連結方向 lint 後，CLAUDE.md 那條可縮成一行引用，agent 不必每次靠記性遵守。

**判準（沿用研究「絕不派 LLM 去做 linter 的工作」）：**
- 可純字串/路徑/結構比對的（禁用詞、引用格式、source 方向、死鏈、錨點、需求 hash、並行重疊）→ 變成 lint/hook，從指令檔移除
- 需要商業判斷、無法機械驗的少數鐵則（單一正本的「為什麼」、角色分權動機、Prototype 優先）→ 留 CLAUDE.md always-on，每條附來源
- 兩者之間「找不到來源」的規則 → 移除候選

這條策略同時解 H1、H3、L1、L3：閘門補上、失效機制修復、指令檔瘦身。閘門設計要求**輕量、低摩擦（兩分鐘內可修）**，不是建一套重型 CI。

---

## 四、四面向改善方向

### C1 規格顆粒度與模組化

- **抽出 billing-management bounded context**：把 order-management 的帳務子塊（發票/收款/期次/對帳/退款，約 50 Requirement + 14 實體）抽為獨立 spec，與訂單核心以「order_id + 應收/已收金額」單向契約銜接。預期 order-management 縮至約 1500–2000 行，回到可管理區間，且帳務 change 不再與訂單/印件 change 擠同一檔。
- **判準是 actor 與內聚度，不是行數**：拆分只針對「混多領域者」（order-management）與「切錯維度者」（見 C2），不碰 production-task（1777 行屬真實複雜度的對照組）。
- **拆分前提**：必須先完成 P0 止血與觸 order-management 的 active change 收斂，否則拆分本身又變成新的撞車源。

### C2 一致性與防漂移

- **連結/方向/錨點 lint**（機械閘門）：跨層引用方向（source 禁指 openspec）、死鏈、標題改名後的錨點失效，寫成 commit/PR 可擋的檢查。一併實作 L1 的 L331。
- **requirement clone 偵測**（機械閘門）：對長 spec 掃同一規則重述多處（如應收公式重述 10+ 處、措辭已漂移），找出後改為單一正本 + 交叉引用。
- **切分維度修正（中長期、漸進、列觀察）**：state-machines / business-processes 按技術層橫切是高風險重構，狀態機應隨各自領域 spec 走（訂單狀態機歸 order/billing）。此項牽動幾乎所有領域 spec，建議漸進收斂、不一次性拆，且排在 billing-management 抽出之後再評估。

### C3 工作流程治理

- **並行 change 重疊偵測 + 序列化閘門**（機械閘門，最高槓桿）：commit/PR 時偵測多個 active change 是否觸及同一 spec 的同一 Requirement，重疊則警示；觸同一 spec 者要求先 archive+sync 其一再開下一個。
- **歸檔前 hash 比對閘門**（機械閘門）：archive 前從 live spec 重算需求 hash，與 delta 的 base 不符即中止、要求 rebase——這是直接堵住「覆寫式合併靜默丟 scenario」的關鍵閘門。
- **propose 階段宣告觸及範圍**：change proposal 模板加一段「本 change 觸及哪些 spec / Requirement」，作為重疊偵測與排序歸檔的輸入。
- **對齊前移到變更當下**：把 doc-audit 從「archive 後一次性」前移為 commit/PR diff 觸發的輕量檢查，降摩擦到兩分鐘內。
- **active change 健康指標**：並行數、未歸檔天數、tasks 完成度當監控指標（現有 6 個 tasks=0、最久 68 天）。

### C4 skill / 指令清整（前期規劃 + 後期稽核）

| skill / 物件 | 處置 | 理由 |
|---|---|---|
| erp-spec | **砍** | CLAUDE.md 已標停用，317 行檔仍在，且含與現行 OpenSpec-first 矛盾的 Notion-first 流程 |
| doc-audit 的 audit-erp-docs.sh | **改** | 腳本 targets 指兩代前架構（memory/erp、Notion-first、硬指 erp-spec），須改指現行 OpenSpec + Vault 雙層 |
| multi-agent-discussion-protocol | **砍/收斂** | 已自標 deprecated-verify-only 並列淘汰條件；三 agent 各保留整段死格式須一併移除 |
| doc-audit / vault-audit / vault-insight（archive 後觸發） | **併** | 三者 archive 後觸發重疊、5 skill 共寫 audit-log.md；收斂為單一 archive-後稽核入口 |
| vault-audit 維度 13 | **改（修幽靈引用）** | erp-user-story 四處引用不存在的維度 13；要嘛補上維度，要嘛改指正確 lint |
| senior-pm.md Phase 4 模板 | **改（補第三張表）** | 規範寫三張、模板只渲染兩張，補上防覆寫合併的第三張對照表 |
| 5 個超 500 行 SKILL.md | **改（拆 reference）** | 違反 progressive disclosure，超出部分拆到 reference 按需載入 |
| CLAUDE.md（448 行） | **改（瘦身）** | 抽 10–15 條不可協商鐵則 always-on，其餘流程/路由/觸發矩陣下放 skill；可機械驗的轉 lint |
| erp-planning-pre-check | **改（分級減負）** | 小範圍局部調整免跑完整 6×7 矩陣 + N/M/K，按變動性質分級 |
| misjudgement-record | **留（連動評估）** | 設計良好；但其價值綁三 agent 協作，若多 agent 協作收斂須同步評估服務範圍 |

---

## 五、排序改善項清單

排序原則：相依性 > 時效性 > 槓桿。每項標執行路徑（本次不執行，藍圖批准後各自走）。

### P0 — 止血（時效最急，不處理會在誤 archive 時丟資料）

| # | 動作 | 對應問題 | 執行路徑 | 相依 |
|---|---|---|---|---|
| P0-1 | 釐清 work-order「印務主管印件總覽」兩 change 的歸檔順序與 rebase | H2(1) | OpenSpec change 收斂 | 無 |
| P0-2 | 釐清 production-task「供應商自助報工」NEW/MODIFIED 前提矛盾 | H2(2) | OpenSpec change 收斂 | 無 |
| P0-3 | 釐清 state-machines「生產任務狀態機」完整 body vs 片段覆蓋 | H2(3) | OpenSpec change 收斂 | 無 |
| P0-4 | fix-order-print-item-actions rebase 到 route-C（pi_ordered_qty） | M1 | OpenSpec change 收斂 | 無 |

### P1 — 機械閘門 + 修失效機制（最高槓桿、防再犯）

| # | 動作 | 對應問題 | 執行路徑 | 相依 |
|---|---|---|---|---|
| P1-1 | 歸檔前需求 hash 比對閘門（不符即擋、要求 rebase） | H1/H2 | writing-plans + 實作（git hook/腳本） | 無；建議最先做（防 P0 再發生） |
| P1-2 | 並行 change 重疊偵測 + propose 宣告觸及範圍 | H1 | writing-plans + 實作 | 可與 P1-1 並行 |
| P1-3 | 連結/方向/錨點 lint（含 CLAUDE.md L331） | M2/L1 | writing-plans + 實作 | 無 |
| P1-4 | requirement clone 偵測（掃長 spec 重複規則） | H4/M2 | writing-plans + 實作 | 無 |
| P1-5 | 修 vault-audit 維度 13 幽靈引用 | H3(A) | 直接編輯 skill | 無 |
| P1-6 | 補 senior-pm.md Phase 4 第三張對照表 | H3(B) | 直接編輯 agent | 無 |

### P2 — 結構改善（依賴前面穩定後）

| # | 動作 | 對應問題 | 執行路徑 | 相依 |
|---|---|---|---|---|
| P2-1 | 抽出 billing-management bounded context | H4 | OpenSpec change（refactor） | P0 全部 + P1-2（避免拆時撞車） |
| P2-2 | prototype-data-store/shared-ui 下放領域專屬條目 | M2 | OpenSpec change | P2-1 |
| P2-3 | 砍 erp-spec 殘留 + 改 doc-audit 腳本指現行架構 | M3 | 直接編輯 | 無 |
| P2-4 | 後期稽核三 skill（doc-audit/vault-audit/vault-insight）archive 後觸發收斂為單一入口 | M3 | writing-plans | P2-3 |
| P2-5 | CLAUDE.md 瘦身（抽 10–15 鐵則 always-on，其餘下放） | L1 | writing-plans（謹慎） | P1-3（先把可 lint 的移走） |
| P2-6 | 清 multi-agent-discussion-protocol deprecated + 三 agent 死格式 | L3 | 直接編輯 | 無 |
| P2-7 | 5 個超 500 行 SKILL.md 拆 reference | L3 | 直接編輯 | 無 |
| P2-8 | erp-planning-pre-check 按變動性質分級減負 | L2 | 直接編輯 skill | 無 |

### P3 — 觀察 / 漸進（高風險、長期）

| # | 動作 | 對應問題 | 執行路徑 | 相依 |
|---|---|---|---|---|
| P3-1 | state-machines / business-processes 切分維度修正（狀態機隨領域走） | M2 | 漸進、列觀察 | P2-1 完成後再評估 |

---

## 六、決策點（gate 3 請定，或執行各項時再定）

1. **billing-management 拆分要不要做、何時做**：這是最大的結構工程，影響 5 個觸 order-management 的 active change。建議 P0/P1 穩定後做，但要你拍板。
2. **機械閘門建在哪一層**：git pre-commit hook / CI / Claude Code hook（settings.json）。各有摩擦與維護成本差異，執行 P1 時定。建議優先 Claude Code hook + 輕量腳本（你是主要使用者，低摩擦最重要）。
3. **CLAUDE.md 那 10–15 條鐵則的具體清單**：瘦身會動到你熟悉的結構，P2-5 執行前應單獨對齊清單。

---

## 七、不在本藍圖（後續執行才定）

- 任何 spec 的實際拆分內容、任何 skill 的實際刪改、任何 lint 腳本的實作。
- Notion / Linear 發布流程調整。
- Prototype 程式碼。
