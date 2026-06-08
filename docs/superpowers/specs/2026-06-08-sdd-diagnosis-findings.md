# SDD 現況診斷發現（階段 2 產出）

- 日期：2026-06-08
- 來源：sdd-diagnosis workflow（Run ID wf_a0caa10c-d45，5 個 Sonnet agent，4 面向對照階段 1 最佳實踐 + 跨面向綜合）
- 狀態：待 gate 2 確認
- 用途：階段 3 改善藍圖的現況基準

---

## 綜合根因

最嚴重的問題不是任一單檔或單規則，而是**整個規格庫的治理約束全以「人/agent 須自覺遵守的散文」形式存在，無一落為 commit/PR/archive 當下的機械閘門**——而 OpenSpec 歸檔又是覆寫式合併（同名 Requirement 後歸檔者整條取代前者並靜默丟 scenario），兩者疊加使任何一次遵守疏漏都會無聲變成交付漏改或跨檔矛盾。

---

## 問題清單（按嚴重度，跨面向彙整）

### HIGH

**H1. 治理約束全為散文、零機械閘門**
- config.yaml 無任何並行 change 序列化／重疊宣告／hash 核對／年齡告警約束；整套流程靠 CLAUDE.md「主動收尾」10 條人工清單 + Stop hook（自陳僅「備用提醒」）驅動。
- 結果：11 個 active change 並存、6 個 tasks 完成度=0、最久掛單約 68 天（supplier-portal / scheduling-completion-date 自 2026-03-31）。等同多條長命分支把風險推遲到最危險的合併時刻。
- 證據：`openspec/config.yaml` grep parallel/序列化/hash/收斂 → 僅 1 條 explore 衝突檢查；tasks done=0：add-consultation-activity-log(0/21)、extend-prepress-supervisor-dashboard(0/43)、fix-order-print-item-actions(0/47)、scheduling-completion-date(0/41)、supplier-portal(0/24)、add-pending-receivables(0/42)。
- 涉及：工作流程治理 / 一致性 / AI 輔助

**H2. 並行 change 對同名 Requirement 方向相反撞車（3 組確認衝突，歸檔將靜默丟失內容）**
- (1) work-order「印務主管印件總覽（防掉單）」：refine-print-item-allocation-mixed-mode 重寫為「混合模式雙路徑」vs scheduling-completion-date 保留「一次完成工單草稿建立」，body 與 scenario 互斥。
- (2) production-task「供應商自助報工」：supplier-portal 放 `## NEW Requirements`（假設不存在）vs refactor-production-task-transfer 放 `## MODIFIED Requirements`（假設已存在），前提互斥且 body 已分歧（transferRequired 連動條款只有後者有）。
- (3) state-machines「生產任務狀態機」：refactor-transfer 提供完整替換 body（四工廠路徑全列舉+依賴邊）vs supplier-portal 僅片段 MODIFIED，後歸檔者刪掉遠多於新增。
- 涉及：一致性 / 工作流程治理

**H3. 防漏改機制本身因未機械化而失效（規則存在但不被執行）**
- (A) erp-user-story 四處宣稱 Mode B 推送前 MUST 跑「vault-audit 維度 13」lint 自審，但 vault-audit 只定義維度 1-12 + 15，**維度 13 是幽靈引用，閘門根本不存在**。證據：vault-audit/SKILL.md grep「維度 13」零命中 vs erp-user-story/SKILL.md L17/L211/L357/L369。
- (B) Phase 4 verify consistency 的「第三張表」（既有規則覆蓋/分類對照，2026-05-30 專為對抗 archive 覆寫合併新增，supersession 列須標 MODIFIED 不可 ADDED）在規範端（CLAUDE.md、sequential 協議、dispatch 模板）寫「三張」，**但實際產表的 senior-pm agent 全寫「兩張」、模板只渲染兩張，缺的正是防 SpecFall 那張**。
- 涉及：AI 輔助 / 一致性 / 工作流程治理

**H4. order-management 為 God spec（4504 行、115 Requirement、22 實體）**
- 單檔混裝至少 5 個可各自演進的子領域：訂單核心生命週期、發票/收款/期次/對帳/退款帳務（佔 50 Requirement + 14 實體）、訂單異動、出貨、印件詳情頁 UI 版型。
- 同檔內「應收總額/發票淨額」公式重述 10+ 處且措辭已漂移（:1321「∑已執行 OA」vs :1641「∑已執行或已核可 OA」）。
- 帳務子塊內部高內聚、對訂單核心僅以 order_id + 應收/已收金額契約耦合，是抽出獨立 billing-management bounded context 的強訊號。抽出後訂單核心可縮至約 1500–2000 行。
- 涉及：顆粒度 / 一致性 / 工作流程治理

### MED

**M1. wiki↔openspec 對同一欄位給相反規則**
- 購買數量（pi_ordered_qty）可編輯性：主 spec route-C（2026-06-02 已歸檔）與 wiki「明細時點分界」一致規定「訂單終態前業務可直接增減、不走 OrderAdjustment、不送主管核可」；但 active change fix-order-print-item-actions（0/47 tasks 未實作、authored 2026-05-12 早於 route-C、從未 rebase）規定「永遠唯讀、一律走 OrderAdjustment」。fix change 若照現狀歸檔將與已歸檔規則並存矛盾。

**M2. 切分維度錯誤（按技術層/文件型別橫切而非業務領域）**
- state-machines（1415）與 business-processes（1366）按「全系統狀態機一檔/全系統計算規則一檔」橫切，使同一業務規則（訂單異動、三方對帳、諮詢、BillingInstallment）被三向切散在 order-management + state-machines + business-processes，呈現「永遠一起改＝切錯線」。
- prototype-data-store（789）與 prototype-shared-ui（916）明文按 Zustand store 層/共用 UI 元件層切（有部分正當性，屬共用基礎設施，但收納了領域專屬條目）。
- 「生產任務狀態機」同名需求同時存在 production-task 與 state-machines 兩檔（requirement clone，一概念兩個家），且 2 change × 2 檔 = 4 個覆寫面。

**M3. 後期稽核 skill 鏽蝕且職責重疊**
- doc-audit 唯一可機械執行的 bash 腳本（audit-erp-docs.sh）targets 仍指向兩代前架構：memory/erp 目錄 + Notion-first 假設 + 硬指已停用的 erp-spec/SKILL.md（L24），對現行 OpenSpec-first + Vault 雙層正本零覆蓋。
- doc-audit/vault-audit/vault-insight 三 skill 在「change archive 後」觸發時機重疊；5 個 skill 共寫同一 audit-log.md，邊界僅靠三處重複的散文分工表維持。
- erp-spec 已停用但 18KB（317 行）檔仍留存。

### LOW

**L1. CLAUDE.md 過載（448 行）+ 願望式指令 + 可機械驗卻寫成散文**
- 願望式不可執行：「理性、直接，不作客套寒暄」「保持內容精簡、易讀」「重點優先，避免冗詞」。
- 可機械驗卻寫成散文鐵則：L331「上游 wiki 的 source 禁指 openspec/specs/（違者報錯）」明示要機械驗卻無實作（經查目前無違規，靠人遵守）；L122「跨頁面引用一律 [可讀名稱](URL)」可正則驗。

**L2. erp-planning-pre-check 負擔偏重**
- 強制 6 領域 × 7 卡類型矩陣 + 5 步驟含閉環 + 量化 N/M/K + 執行者稽核者分離，每次規劃前 MUST 全跑。單領域局部欄位調整仍須跑完整 7 卡矩陣 + N/M/K，對純查證型規劃可能是儀式化負擔。

**L3. 5 協議 + 3 agent 多層協作機器負擔重**
- protocols/ 5 檔共 1054 行；senior-pm.md 526 行含八套格式。multi-agent-discussion-protocol 已自標 deprecated-verify-only 並列了完全淘汰條件，卻三 agent（senior-pm/ceo-reviewer/erp-consultant）仍各保留整段「輪次討論模式（deprecated）」未移除。「五項紀律」在 sequential + dispatch + 三 agent 四處重述。
- 5 個超 500 行的 SKILL.md：superpowers-writing-skills(655)、vault-audit(610)、vault-ingest(601)、openspec-onboard(554)、oq-manage(536)。

**L4.（反證錨點）production-task 1777 行不該拆**
- 屬真實商業複雜度（齊套性邏輯 Kitting Logic），同一 actor（生管+師傅）同一職能，無混異質子領域。確認拆分建議僅針對混多領域者與切錯維度者，避免被「行數大＝該拆」誤導。

---

## 跨面向模式

1. **顆粒度→一致性放大鏈**：order-management 4504 行 God spec 同時被 5 個 active change 觸及，巨檔最大化「同名 Requirement 覆寫撞車面」與「公式 clone 漂移面」。顆粒度問題不是獨立缺陷，而是一致性問題的物理容器。
2. **切分維度錯誤→跨檔漂移**：按技術層橫切使一個領域變更被迫同時動多檔（2檔×2change=4 覆寫面），把單純的並行紀律問題升級為跨檔同步問題。
3. **「機制存在但未接上開關」三層級同時出現**（最強根因佐證）：(1) wiki source「違者報錯」無 lint；(2) erp-user-story 的 lint 閘門指向不存在的維度 13；(3) Phase 4 第三張對照表規範寫三張、產出端只渲染兩張。三者都是「規則被寫下來但機械上不會被執行」，證明根因不是缺乏設計意圖，而是設計到強制執行之間的斷裂。
4. **對齊時點後置 + 長命 change → SpecFall**：doc-audit/wiki 對齊全綁在 archive 之後而非變更當下；同時 6 個 change tasks=0、最久 68 天。摩擦推遲使未 rebase 的舊模型 change 與已歸檔規則的矛盾，被推遲到審查有效性最低的合併時刻才暴露。
5. **「無單一正本」三面向矛盾同源**：一致性面是 requirement clone、顆粒度面是 God spec 把多正本擠進一檔、治理面是 archive 缺「指定主 spec 名收斂」。根源同一：OpenSpec 無自動收斂、無 clone 偵測、無「一個概念一個家」機械守衛，全靠散文自律。
