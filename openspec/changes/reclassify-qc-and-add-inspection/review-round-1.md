# Review Round 1 — 三視角審查報告

**執行時間**：2026-05-20
**審查 agents**：senior-pm + ceo-reviewer + erp-consultant（平行執行）
**審查範圍**：proposal.md / design.md / specs/ 4 個 delta / tasks.md
**整體判斷**：三個 agent 均判「通過但有觀察」

---

## 一、senior-pm 視角結論

### 整體判斷
通過但有觀察：structural change 框架合理、與 Phase 2 北極星指標路徑明確，但 proposal § Why 與 KPI 鏈結論述、tasks 順序、QC-001 處理三點需修正才能進入 archive。

### 問題清單

| # | 嚴重度 | 描述 |
|---|--------|------|
| 1 | P0 | proposal § Why 對 Phase 2 KPI 對齊只是宣告，未說明因果鏈。寫了「為 C2/C3/C4 的基礎前置條件」但沒解釋「為什麼這個前置不存在就會卡住訂單流程完整完成率 ≥ 60%」 |
| 2 | P0 | 問題定義缺「使用者實際痛點場景」描述。§ Why 三條都是系統面（「斷裂」「未建模」「未明確區分」），沒有任何一條從印務 / QC 人員 / 業務的日常情境出發 |
| 3 | P0 | User Story 完全缺席。動了 4 個 spec、新增 NCR 實體、新建 inspection type，但沒列出任何對應 User Story |
| 4 | P1 | tasks 1.4 描述應改為「同步 Vault OQ 卡至 Notion」（OQ 已在 Vault，Task 1.4 只是執行寫入 Notion） |
| 5 | P1 | 24 個 tasks 全擠在 6 段、缺「驗證里程碑」閘門（Section 2 同步完成後是否有跨檔案邏輯一致性中間檢查） |
| 6 | P1 | QC-001 在 design.md 被列為「高相關」但只列為「三視角審查時決定」，沒給明確 default proposal |
| 7 | P2 | Decision 1 的「QC = 印件層每印件強制 1 個」沒有 User Story 描述「精裝書多個工序 → 1 個印件 QC」是否符合 QC 人員心智模型 |
| 8 | P2 | OQ-C1-6「設計仍奇怪」這條本身就是 P0 風險。把 Miles 反饋「滿奇怪的」放到 OQ 卻不嘗試解釋是什麼層面奇怪，等於把問題吞掉 |
| 9 | P2 | proposal § What Changes 沒對「業務」角色說明任何影響 |

### QC-001 處理建議
**Default：不在 C1 解，但 C1 範圍下做兩件事讓 QC-001 不會被誤判已解。**
- C1 歸檔後立即啟動單獨 change `split-quality-control-roles`（範圍：user-roles + qc + prepress-review）
- 將 QC-001 priority 從 medium 升為 high
- 建議在 C2 啟動之前完成此 change

### 建議修正方向
1. 重寫 proposal § Why：補「現在的訂單卡點」具體場景與數據
2. 新增 § 使用者痛點段（在 § Why 之後）
3. 起草 3 條 User Story 草稿並放入 tasks
4. tasks 1.4 改名為「將 OQ-C1-1 ~ OQ-C1-6 從 Vault OQ 卡同步至 Notion Follow-up DB」
5. 新增 task 1.5 「補建 3 條 User Story 至各模組 spec § Scenarios」
6. 新增 task 4.1.5 「跨檔案邏輯一致性中間檢查（Section 2 完成後跑）」
7. OQ-C1-6 在 design 補上 default proposal（建議透過 1-2 個情境跑通驗證）

---

## 二、ceo-reviewer 視角結論

### 整體判斷
通過但有觀察。設計方向正確（統一派工模型確實是現場痛點），但「先做 C1 純 spec 不動 Prototype」+「NCR Disposition 三選一只定 enum 不串退款」這兩個決策合起來，會讓 C1 上線後的可驗證價值非常薄。

### 問題清單

| # | 嚴重度 | 描述 |
|---|--------|------|
| 1 | P0 | use_as_is（議價接受）→ 業務退款流程串接到 C3/C4 才設計。C1 只定義 enum 不串流程，意味著上線後業務遇到 use_as_is，系統只能記錄 disposition 但無法觸發退款動作 |
| 2 | P1 | Why 段「現場痛點」描述薄弱，更像系統整潔重構。「QC 派工不在統一派工板上」是真痛點，但「品檢業務動作未建模」目前是「依賴口頭與紙本」 — 在現場是不是真的會痛？需要 Miles 確認是否有現場 case 證明 |
| 3 | P1 | NCR Disposition 三選一的「rework」現場真實做法存疑。印刷業很多場景的潛規則是「印不好就重印一刀切」 |
| 4 | P1 | 「QC = 印件層強制 1 個」與分批出貨的衝突未交代。印件分批出貨情境下，第一批 300 出貨時 QC PT 還沒完成，出貨單怎麼開？ |
| 5 | P2 | C1 of 4 拆分的機會成本：fix-order-print-item-actions 是 47 個 task 中 0 完成的 bug fix，CEO 直覺會優先修 bug |
| 6 | P2 | OQ-C1-6「Miles 反饋還是滿奇怪的」掛在 open 狀態歸檔。CEO 不接受 spec 帶著「設計者自己覺得怪」的狀態歸檔 |

### 建議修正方向
- **P0（必修）**：use_as_is 退款串接至少要在 C1 spec 中明確標記「use_as_is 觸發業務通知，業務需在訂單異動模組手動發起退款，系統不自動串接」
- **P1**：補一個「分批出貨情境下 QC PT 強制 1 個的銜接」Scenario
- **P1**：邀請 Miles 確認 NCR rework vs scrap 的實際現場分布。若 scrap > 70%，rework 流程設計優先級可調降
- **P2**：OQ-C1-6 不能帶著「設計者覺得怪」歸檔，要嘛收斂、要嘛延後歸檔
- **P2**：Why 段補一個具體現場 case

### 第 6 維度 KPI 對齊評估
- **對應 KPI**：Phase 2 北極星指標「訂單流程完整完成率 ≥ 60%（第 1 個月）/ ≥ 80%（第 3 個月）」
- **直接貢獻**：**無**。C1 是純 spec / design 重構，不解鎖任何使用者可走完的流程節點
- **間接貢獻**：C1 → C2（報工即完成）才開始拉「完整完成率」；C1 → C4（入庫上移到印件層）才真正影響「訂單完整走完」判定機制
- **CEO 結論**：C1 是「無 KPI 直接貢獻、純前置投資」的 change。可接受，但條件是：
  1. C2 必須緊接其後（拖延 1-2 個月以上會讓 C1 變沉沒成本）
  2. use_as_is 退款串接（P0）要先補進 spec
- **機會成本警訊**：若 C2 拖 3 個月以上，建議重新評估是否該先做 fix-order-print-item-actions（直接消除已知 bug）

---

## 三、erp-consultant 視角結論

### 整體判斷
通過但有觀察（4 項 P1、3 項 P2，無 P0 阻擋）。核心架構決策（單表繼承 + discriminator + DAG 相依）對齊業界 MES（SAP S/4HANA QM、Oracle Cloud Quality、Plex MES）；放棄 Lot / 葉節點 / 子 PT 鏈 / `assigned_qty` 的迭代決策正確。

### 問題清單

| # | 嚴重度 | 描述 |
|---|--------|------|
| 1 | P1 | state-machines delta 缺 REMOVED「QC 單狀態機已移至 qc capability」引言段。main spec line 9 + line 17 鏈條為「生產任務 → 任務 → 工單 → 印件 → 訂單」未提 QC PT；delta 只 MODIFIED 齊套公式，未處理 Purpose 段與「跨實體狀態向上傳遞鏈」 |
| 2 | P1 | QC PT.previous 定義在 production-task spec 與 state-machines 齊套公式衝突。「QC 完成事件」指誰？是 inspection PT 達標、production PT 自身達標、還是 print_item 層 QC PT 達標？production PT 若 `requires_inspection=FALSE`，根本沒對應 inspection PT |
| 3 | P1 | NCR 與 ProductionTaskWorkRecord「已作廢」狀態互動未定義。實務情境：QC 人員誤填 passed=80 建了 NCR pending，發現後改填 passed=100 並作廢原 WorkRecord，原 NCR 怎麼處理？ |
| 4 | P1 | NCR 缺命名 / Disposition 缺「分類」維度（5 設計模式 § 2 狀態碼結構化漏套）。NCR 只記錄 `defect_quantity` + `disposition` + `notes` 自由文字，缺「不合格分類」（material / process / equipment / supplier / human）。年度品質報表全文搜尋 notes 不可行 |
| 5 | P2 | Disposition 缺「客訴退貨 / 降級」實務情境。rework / use_as_is / scrap 三選一覆蓋「廠內驗收當下」處置，但漏「客戶端退貨回廠」「降級為次級品出貨」兩種印刷業常見情境 |
| 6 | P2 | `requires_inspection` 與 `affects_product` 雙旗標互動未在 spec 階段釐清（OQ-C1-1 未解）。實務情境：某 production PT `affects_product=FALSE`，但印務想加 inspection 追良率，目前 spec 允許嗎？ |
| 7 | P2 | 印件中途取消 / 數量變更時 QC PT 行為未定義。QC PT `pt_target_qty = pi_planned_qty` 於工單規劃完成時建立，但若印件數量被異動或取消，QC PT 該如何同步？ |

### 5 個資料模型設計模式對照

| 模式 | 套用狀況 | 結論 |
|------|---------|------|
| 當前版本指針（current_X_id）| 不適用 | ProductionTask / WorkRecord / NCR 都是流式累計實體，不存在多輪次需切換場景 |
| 狀態碼結構化（LOV + 備註）| **部分套用、有漏項** | Disposition 3 enum、PT type / scope 為 LOV 已正確；**NCR.notes 該配 `defect_category` LOV 未配**（問題 4） |
| 合格 / 完成終態 | 已套用 | QC PT 達標即終態、NCR resolved 即終態，無回退路徑；補生產走「加新 WorkRecord」而非「重啟達標 PT」，與「棄用建新」原則一致 |
| B2C / B2B 分流 | 不適用 | QC / 品檢屬內部生產驗收，B2C 與 B2B 在「印件入庫前要不要驗」沒有分流必要 |
| 稽核鉤子（ActivityLog）| **該套但部分沒套** | NCR Disposition 記錄 `disposition_at / by` 完整；但 **PT type / scope 不可手動覆寫的阻擋事件、QC PT 自動建立事件、印務加入 / 移除 inspection PT 事件**都未明文寫入 ActivityLog |

### 建議修正方向
- **歸檔前必修（P1 必須在 archive 前處理）**：
  - 解 OQ-C1-1 於 spec（問題 6），不要拖到 C3
  - 修補 QC PT.previous 定義一致性（問題 2）
  - 補 NCR.defect_category LOV（問題 4，影響品質統計能力）
  - 補 state-machines delta Purpose 段與傳遞鏈（問題 1）
- **歸檔後驗證**：tasks.md § 3 業務情境補充 + § 4 doc-audit 務必執行，特別檢查 business-scenarios 中既有「QC 任務作廢」「QCRecord 建立」等段落是否殘留舊概念

### QC-001 處理建議
本 change `user-roles` delta 將 QC 角色「任務」模組從 X 改為 R/W、且明文「QC 兼任品檢執行」，已實質回答 QC-001 的 QC 側 — **QC 角色定位確定為「印件入庫檢查 + 工序中間品檢」執行者，與審稿（prepress-review capability）為兩個完全不同的 capability，不存在「品管要不要拆」的問題**（兩者本來就不在同一框架下）。

**建議**：歸檔時將 QC-001 標記為「已由 reclassify-qc 回答」並 close，理由寫入 OQ 卡。

---

## 四、三視角分歧點與決議

### QC-001 處理（senior-pm vs erp-consultant 分歧）

| Agent | 立場 | 切入視角 |
|-------|-----|---------|
| senior-pm | C1 不解、後續開 split-quality-control-roles change | user-roles spec 角色名稱層（「品管」role 名稱仍涵蓋兩種職責） |
| erp-consultant | reclassify-qc 已實質回答，歸檔時 close | capability spec 結構層（QC ≠ prepress-review，分屬兩個 capability） |

**Miles 決議（2026-05-20）**：採 erp-consultant 見解，C1 歸檔時 close QC-001。

理由：QC 與 prepress-review 為兩個獨立 capability，不存在「拆」問題；reclassify-qc 重新定義 QC 為「印件入庫檢查 + 工序中間品檢」執行者後，與審稿 capability 結構性分離。OQ 卡 frontmatter status 改為 answered，answered-by: Miles，answered-at: 2026-05-20。

---

## 五、整合 Action Items（Task 1.3 處理清單）

### P0 必修（archive 前必處理）
1. **use_as_is 退款流程串接**：proposal / design / delta spec 明示「use_as_is 觸發業務通知，業務需在訂單異動模組手動發起退款，C1 不自動串接」（CEO 提出）
2. **proposal § Why 重寫**：補現場 case 數字、使用者實際痛點場景（senior-pm + CEO）
3. **補建 3 條 User Story** 至各模組 spec § Scenarios（senior-pm 提出）
   - 印務在工單規劃時加入品檢任務
   - QC 人員分批驗收同一印件
   - 印務處理 NCR Disposition

### P1 觀察項
4. OQ-C1-6「設計仍奇怪」轉具體下一步（建議透過情境跑通驗證）
5. NCR.defect_category LOV 補欄位（material / process / equipment / supplier / human）
6. QC PT.previous 定義一致性釐清
7. state-machines delta 補 Purpose 段 + 傳遞鏈 MODIFIED
8. NCR vs WorkRecord 已作廢狀態互動定義（含 NCR status=cancelled 新增列舉）
9. 分批出貨情境 QC PT 強制 1 個衝突驗證（補 Scenario）
10. `requires_inspection` vs `affects_product` 雙旗標互動釐清（OQ-C1-1 解掉）

### P2 觀察項
11. 印件中途取消 / 數量變更時 QC PT 行為（補 Scenario 或標 OQ）
12. Disposition 客訴退貨 / 降級邊界（補 OQ-C1-7 + design 明示「客訴退貨走 AfterSalesTicket、降級出貨非本期範圍」）
13. proposal § What Changes 補業務角色影響（NCR Disposition use_as_is 時收通知、出貨期決定數量）
14. ActivityLog 稽核鉤子 4 類關鍵動作（PT type/scope 阻擋、QC PT 自動建、印務加品檢 PT）寫入 spec
15. tasks 重整：1.4 改名為「同步至 Notion」、新增 1.5 補 User Story、新增 4.1.5 中間檢查閘門

### Task 1.3 不在範圍（後續另開 change）
- fix-order-print-item-actions 機會成本（CEO 提及）— 排程上的議題，不在 reclassify-qc 內處理
- C2 啟動時機緊接 C1（CEO 條件）— 屬於 roadmap 排程議題

---

## 六、原始 Agent 回報（agentId 留存供後續追問）

- senior-pm agentId: `a15a7496fe2b05b86`
- ceo-reviewer agentId: `a4ed45ac66aaf1406`
- erp-consultant agentId: `ad34570ad928451ae`
