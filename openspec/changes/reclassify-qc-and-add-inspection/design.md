## Context

當前 ERP 中 QC 為獨立 capability（`QCRecord`），與 `ProductionTask` 並列為兩個派工模型。實務上現場痛點：
- QC 與品檢（工序中間檢驗）的業務動作差異未在系統中明確區分
- QC 派工流程與生產任務派工流程斷裂
- 「品檢」（如新製程良率追蹤、外包回廠半成品驗收）目前無系統建模

本 change 將 QC 與品檢統一為 ProductionTask 的不同 `type`，利用既有 `ProductionTaskWorkRecord` 多筆累計機制承載分批驗收。

關連 spec：
- [production-task spec](../../specs/production-task/spec.md)
- [qc spec](../../specs/qc/spec.md)
- [state-machines spec](../../specs/state-machines/spec.md)
- [user-roles spec](../../specs/user-roles/spec.md)
- [business-processes spec](../../specs/business-processes/spec.md)（齊套性公式，C1 不動，C4 處理）

本 change 為 4 個 sequential change 的第 1 個（C1），後續：
- **C2** `simplify-production-task-completion`：報工即完成、移除「製作中」狀態
- **C3** `add-production-task-rework`：補生產（Rework）副流程的具體實現
- **C4** `move-warehousing-to-print-item-layer`：入庫上移到印件層、齊套性公式變更

**設計迭代記錄**：本 design 經多輪討論後收斂。曾考慮但放棄的方向：Lot 實體、葉節點公式、子 PT 鏈、PT 一次性報工限制、`assigned_qty` 欄位。理由詳見 § Risks / Trade-offs 與每個 Decision 段。

## Goals / Non-Goals

**Goals:**
- 統一派工模型：ProductionTask 涵蓋 production / QC / 品檢三種 type
- 區分作用層級：`scope` 欄位區分工序層（`work_order_task`）與印件層（`print_item`）
- 廢止 QCRecord 獨立實體，相關資料併入 ProductionTask + ProductionTaskWorkRecord
- 系統建模「品檢」（工序中間檢驗）與「QC」（印件入庫檢查）的差異
- 新增 NCR（不合格紀錄）實體與 Disposition 機制框架
- 保留既有派工 / 報工流程（PT 級派工 + 多筆 WorkRecord 累計）的最小侵入

**Non-Goals:**
- C1 不改 ProductionTask 狀態機節點（移除「製作中」屬於 C2）
- C1 不實作補生產 / Rework 的具體流程（C3）
- C1 不調整入庫概念與齊套性公式（C4）
- C1 不修改 Prototype（依 Miles 指示：先記錄到 change，不實作 Prototype）
- C1 不處理 QCRecord 既有資料 migration（正式上線階段另議）

## Decisions

### Decision 1：QC 與品檢的業務定義（最終版）

| 概念 | 業務定義 | 系統屬性 | 強制性 |
|------|---------|---------|--------|
| **QC**（出貨前入庫檢查）| 印件成品最終驗證、入庫前必經 | `type = qc`、`scope = print_item` | **每個印件強制 1 個** |
| **品檢**（工序檢驗）| 特定工序的中間檢驗（如新製程良率追蹤、外包回廠半成品驗收）| `type = inspection`、`scope = work_order_task` | 印務在規劃時對特定 production PT 加入（選擇性）|

**迭代記錄**：早期 design 將 QC 視為工序層、品檢視為印件層，與本最終定義相反。本版本以 Miles 最新確認為準。

### Decision 2：type / scope 列舉值與對應規則

```
type = production | qc | inspection
scope = work_order_task | print_item
```

對應規則：

| type | scope | 建立時機 |
|------|-------|---------|
| `production` | `work_order_task` | 印務工單規劃時建立 |
| `qc` | `print_item` | 工單規劃時系統自動建（每印件 1 個）|
| `inspection` | `work_order_task` | 印務工單規劃時對特定 production PT 加入 |

`type` + `scope` 系統自動推導，使用者不可手動覆寫。

### Decision 3：放棄「PT 一次性報工」限制，沿用既有 WorkRecord 多筆累計

**迭代記錄**：早期討論曾確認「PT 一次性報工」，但為支援分批提前出貨衍生出多種補救機制（拆 PT、子 PT 鏈、Lot 實體、`assigned_qty`），均增加系統複雜度。最終決定放棄該限制。

**最終設計**：
- ProductionTask 的執行透過既有 `ProductionTaskWorkRecord` 多筆累計（既有設計）
- 派工 = PT 級別動作（一次性，設 `assigned_operator` + `actual_start_date`）
- 報工 = 多筆 WorkRecord（執行者自由分批，每次一筆）
- 完成判定 = 系統自動偵測 `pt_produced_qty >= pt_target_qty`（衍生公式既有）

**不新增**：~~Lot 實體~~、~~`assigned_qty` 欄位~~、~~`is_final` 旗標~~、~~子 PT 鏈~~、~~葉節點~~

### Decision 4：PT 屬性新增

ProductionTask 新增以下欄位（規劃時印務設定）：

| 欄位 | 型別 | 必填 | 適用 type | 說明 |
|------|------|------|----------|------|
| `type` | 列舉 | Y | 全部 | production / qc / inspection |
| `scope` | 列舉 | Y | 全部 | 依 type 自動帶入 |
| `requires_inspection` | 布林 | N | production | 是否要對應 inspection PT（取代早期 `requires_qc`）|
| `require_transfer` | 布林 | N | production | 是否需要轉交（影響系統自動建 TransferTicket）|
| `previous_production_task_ids` | FK array | N | 全部 | 前置 PT 清單（AND 邏輯）|

**`requires_qc` vs `requires_inspection`**：在 QC = 印件層的最終定義下，「該 production PT 是否需要驗證」這個屬性應稱為 `requires_inspection`（指向 type=inspection 的中間品檢），不是 `requires_qc`（後者已固定為印件層）。

### Decision 5：QC / 品檢結果欄位

`ProductionTaskWorkRecord` 新增以下欄位（僅 type=qc / inspection 才有值）：

| 欄位 | 來源 | 說明 |
|------|------|------|
| `passed_quantity` | QC / 品檢人員填寫 | 此次驗收通過數量 |
| `failed_quantity` | 系統計算 = `reported_quantity - passed_quantity` | 不由人員填寫，便於資料分析 |

PT 衍生欄位（QC / 品檢 PT 才有）：
- `pt_qc_passed` = `sum(WorkRecord.passed_quantity where production_task_id = pt.id AND status = 已完成)`

完成判定（QC / 品檢 PT）：`pt_qc_passed >= pt_target_qty`，系統自動。

### Decision 6：PT 相依性（DAG，前置條件 AND）

每個 PT 可有 0 個或多個前置條件，所有前置滿足才能由生管派工。

前置條件類型（依 Miles 確認）：
- 某前置 PT 的 QC（type=qc 或 inspection）完成（不看數量）
- 某前置 PT 的轉交（TransferTicket）完成（不看數量）

**「不看數量」**：差額由 NCR Disposition 處理，不阻擋下游派工。

預設策略：
- 印務在規劃時為每個 PT 設定排序（1, 2, 3...）
- 系統依排序自動帶線性相依：`PT-N.previous = [PT-(N-1)]`
- 印務僅在並行匯流情境手動修改（如裝訂 PT.previous = [封面 PT, 內頁 PT]）

### Decision 7：QC PT 建立規則（每印件強制 1 個）

工單規劃完成時，系統自動建立：
- 每個 PrintItem 對應 1 個 QC ProductionTask
- `type = qc`、`scope = print_item`、`pt_target_qty = 印件預計總數量`
- `previous_production_task_ids` 預設為「該印件下所有 affects_product 的 production PT」
- 印務派工時指派 QC 人員（`assigned_operator`）

**分批驗收**：透過多筆 ProductionTaskWorkRecord 累計（既有機制）。
- QC 人員自主決定每次驗收數量（看儀表板：上游通過 vs 自己已驗）
- 印務 / 生管口頭協調優先順序（不走系統強制機制）

**OQ-C1-2**：未來若發現需要系統強制「派工數量」機制，再評估新增 `assigned_qty` 欄位。

### Decision 8：品檢 PT 建立規則（選擇性）

印務在工單規劃時，對特定 production PT 加入對應品檢 PT：
- `type = inspection`、`scope = work_order_task`
- `pt_target_qty` 由印務設定（通常 = 對應 production PT 的 target）
- 設定該 production PT 的 `requires_inspection = TRUE`

執行：
- 該 production PT 報工完成後，inspection PT 才能派工（依相依性）
- inspection PT 透過多筆 WorkRecord 累計
- 通過數量影響「該 production PT 的 pt_effective_qty」（C4 細化）

### Decision 9：齊套規則（保留既有公式）

C1 範圍下，齊套規則沿用既有 [state-machines § 完成度計算（齊套性邏輯 Kitting Logic）](../../specs/state-machines/spec.md)：

```
pi_cumulative = floor(min over affects_product PT (pt_effective_qty / qpwo)) × qppi
```

其中 `pt_effective_qty` 定義：
- 若 production PT 有 `requires_inspection = TRUE`：等其對應 inspection PT 完成、用 inspection PT 通過數
- 若 production PT 無 inspection：用 `pt_produced_qty`

入庫公式（C4 後調整）：
- C1 過渡期：沿用既有 `pi_warehouse_qty` 計算
- C4 後：`pi_warehouse_qty = sum(QC PT.passed_quantity where status = 已完成)`

**葉節點公式已放棄**。在 PT 相依性保證下，既有「所有 affects_product PT 取 min」與葉節點取 min 結果相同，無需新增葉節點概念。

### Decision 10：NCR + Disposition 機制（新實體，C1 引入）

QC / 品檢失敗時自動建 NCR，印務做 Disposition 三選一。

**NCR 實體**（新增）：

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | UUID | Y | 主鍵 |
| `source_work_record_id` | FK | Y | 觸發此 NCR 的 ProductionTaskWorkRecord |
| `defect_quantity` | 整數 | Y | 不合格數量（= source WorkRecord 的 failed_quantity）|
| `disposition` | 列舉 | N | rework / use_as_is / scrap |
| `disposition_at` | 日期時間 | N | 印務做決策的時間 |
| `disposition_by` | FK | N | 印務 FK |
| `notes` | 文字 | N | 印務備註 |
| `status` | 列舉 | Y | pending（待 disposition）/ resolved |
| `created_at` / `updated_at` | 日期時間 | Y | — |

**NCR 觸發**：
- QC / 品檢 PT 的 WorkRecord 提交時，若 `failed_quantity > 0` → 系統自動建立 NCR、status=pending、通知印務
- 不阻擋主流程（下游 PT 仍可派工）

**Disposition 三種選項**：
- `rework`：補做缺口（C3 詳細實現）
- `use_as_is`：議價接受（業務發起訂單異動退款）
- `scrap`：報廢（標記放棄）

**C1 範圍**：定義 NCR 實體 + Disposition 列舉 + 觸發機制；具體 Rework 流程（如何建補做 WorkRecord、相依性處理）留 C3 完整設計。

### Decision 11：派工流程與角色職責

| 角色 | 規劃期 | 生產執行 | NCR 處理 | 出貨期 |
|------|--------|----------|---------|--------|
| **業務** | — | — | （議價接受時收通知）| **決定出貨數量**、訂單款項 |
| **印務** | 工單規劃、PT 屬性設定、相依性、品檢加入 | 跟生管協調生產節奏 | **NCR Disposition 決策** | — |
| **生管** | — | **PT 派工**（一次性指派 operator）| — | — |
| **師傅 / 廠商** | — | 報工（多筆 WorkRecord） | — | — |
| **QC / 品檢人員** | — | 接派工、驗收、報工（多筆 WorkRecord）| — | — |
| **出貨** | — | — | — | 依業務指示建出貨單、執行出貨 |

「印務管印件、業務管款項」：印務不決定出貨數量。

### Decision 12：QC spec 處理方式

選擇：QC spec 大幅收斂為「QC 角色執行行為的薄層說明」，主要欄位與業務規則遷至 production-task spec。

收斂內容：
- 保留 QC 角色執行行為（接派工、驗收、報工提交）
- 保留與出貨的薄層引用（指向 business-processes）
- 移除 QCRecord 實體相關 Requirement

**注意**：QC spec 內容需依新定義（QC = 印件入庫檢查）重寫，與既有 QC spec（QC = 工序層驗證）內容對齊不一致需處理。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **設計討論曾走過多個方向（Lot / 葉節點 / 子 PT 鏈），最終收斂**，過程中可能仍有未察覺的盲點 | 透過完整測試情境（精裝書 + 分批提前 + 品檢失敗）跑通驗證；OQ-C1-6 持續追蹤 |
| QC 為印件層、每印件強制 1 個，分批驗收依靠人為協調（無系統強制）| 若實務發現需要強制機制，未來再加 `assigned_qty`；當前依儀表板 + 口頭協調運作 |
| `requires_inspection` 與既有 `affects_product` 的關係 | spec 階段釐清（要看 BOM 帶入機制與工單建立流程的細節）|
| NCR 跨多個 capability 引用，C3 才完整實現 Rework | C1 僅定義 NCR 實體與 Disposition 列舉，具體流程在 C3；spec 中明確標示 |
| QC / 品檢定義在迭代中翻轉，可能影響其他文件引用（business-scenarios、order-management 等）| 歸檔後執行 doc-audit 全域檢查 |
| 議價交付（Use-As-Is）下印件預計數量、業務退款流程的銜接 | 留 C3 / C4 處理，C1 僅定義 Disposition 列舉值 |
| Prototype 既有 QC 元件遷移工作量未估 | 依 Miles 指示，C1 暫不動 Prototype |

## Migration Plan

**C1 範圍（spec / design 變更）**：
1. 更新 OpenSpec 工作版本（production-task / qc / state-machines / user-roles delta specs）
2. 新增 NCR 實體定義至 production-task spec § Data Model
3. 歸檔後執行 `doc-audit` 檢查跨檔案引用一致性

**Prototype 不在 C1 範圍**（依 Miles 指示）：
- mock data 更新留待 C3 / C4 / 整批時再做
- 既有 QCRecord 元件暫不重構

**正式上線（未來）**：
- QCRecord 既有資料 migration 範圍與 script 另開 change（OQ-C1-5）

Rollback：spec 階段可直接還原 OpenSpec change（未歸檔前）。

## Open Questions

### C1 本身衍生 OQ（design 期間識別）

| OQ | 描述 | 落點 |
|----|------|------|
| OQ-C1-1 | `requires_inspection` 與既有 `affects_product` 的關係（兩者是否衝突 / 重複 / 互補）| spec 階段釐清 |
| OQ-C1-2 | QC 分批驗收：是否需要系統強制「派工數量」機制（如 `assigned_qty`）？目前設計依靠儀表板 + 人為協調 | 後續觀察實務需求 |
| OQ-C1-3 | NCR Disposition = Rework 的具體實現（自動建補生產 WorkRecord vs 印務手動發起）| C3 範圍 |
| OQ-C1-4 | 議價交付（Use-As-Is）下 `pi_planned_qty` 是否要鎖定？業務退款流程串接方式 | C3 / C4 |
| OQ-C1-5 | 既有 QCRecord 資料 migration 範圍與時機 | 正式上線階段另議 |
| OQ-C1-6 | 設計討論中迭代多次，Miles 反饋「還是滿奇怪的」表示設計可能仍有未盡之處 | 透過跑情境測試案例驗證；後續 change 持續修正 |

### Vault 既有相關 OQ（2026-05-20 透過 `oq-manage` mode A 補抓）

| OQ | 相關性 | 落點 |
|----|-------|------|
| [[QC-001-OpenSpec 品管是否拆審稿與 QC\|QC-001]]：OpenSpec「品管」是否該拆為「審稿」+「QC」 | **高** — reclassify-qc 已動 user-roles spec，可考慮 C1 階段一併解 | 三視角審查時決定（併入 C1 或保持 open）|
| [[PT-001-師傅報工行動裝置例外\|PT-001]]：師傅報工是否可行動裝置例外（priority: high）| 間接 — reclassify-qc 涉及 PT 報工框架，但 UI 例外議題不在 C1 範圍 | C1 範圍外（保持 open，待 Prototype 階段或 Phase 2 北極星指標規劃時處理）|
| [[SHP-005-分批出貨觸發節點\|SHP-005]]：分批出貨觸發節點（priority: high）| 弱 — reclassify-qc 提到分批驗收（多筆 WorkRecord），與分批出貨概念類似但不重疊 | C1 範圍外（出貨層議題）|

## Review History

### Round 1（2026-05-20）— 三視角審查

**結論**：senior-pm + ceo-reviewer + erp-consultant 三視角審查均判「通過但有觀察」。詳細審查內容見 [review-round-1.md](review-round-1.md)。

**P0 必修項**（archive 前處理）：
1. use_as_is（議價接受）→ 業務退款流程串接：spec 明示「業務手動發起退款」，避免上線後業務以為自動處理（CEO 提出）
2. proposal § Why 重寫：補現場 case 數字、使用者實際痛點場景（senior-pm + CEO）
3. 補建 3 條 User Story 至各模組 spec § Scenarios（senior-pm 提出）

**P1 觀察項**（建議 archive 前處理）：
- OQ-C1-6「設計仍奇怪」轉具體下一步建議
- NCR.defect_category LOV 補欄位（material / process / equipment / supplier / human）
- QC PT.previous 定義一致性釐清
- state-machines delta 補 Purpose 段 + 傳遞鏈 MODIFIED
- NCR vs WorkRecord 已作廢狀態互動定義（含 NCR status=cancelled）
- 分批出貨情境 QC PT 強制 1 個衝突驗證
- `requires_inspection` vs `affects_product` 雙旗標互動釐清（OQ-C1-1 解掉）

**P2 觀察項**（可選處理）：
- 印件中途取消 / 數量變更時 QC PT 行為
- Disposition 客訴退貨 / 降級邊界（補 OQ-C1-7）
- proposal § What Changes 補業務角色影響
- ActivityLog 稽核鉤子 4 類關鍵動作寫入 spec
- tasks 重整：1.4 改名、新增 1.5 補 User Story、新增 4.1.5 中間檢查閘門

**QC-001 決議**：採 erp-consultant 見解 — C1 歸檔時 close QC-001（status=answered）。理由：QC 與 prepress-review 為兩個獨立 capability，不存在「拆」問題；reclassify-qc 重新定義 QC 為「印件入庫檢查 + 工序中間品檢」執行者後，與審稿 capability 結構性分離。

**CEO 第 6 維度 KPI 對齊結論**：C1 對 Phase 2 北極星指標「訂單流程完整完成率」**無直接貢獻**，是純前置投資。CEO 可接受但條件是 C2 必須緊接其後（拖延 1-2 個月以上會讓 C1 變沉沒成本）。

**Task 1.3 範圍**：依 P0 + P1 + P2 整合 action items 修正 proposal / design / delta specs，留下個 session 執行。
