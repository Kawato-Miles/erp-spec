---
type: meta
status: active
last-reviewed: 2026-05-19
---

# ERP 資料模型設計模式（5 種）

> 從 add-prepress-review change（2026-04-19）三視角審查萃取。適用於所有 ERP 模組設計。
> **遷移歷史**：原存於 `memory/shared/principles.md` § 六（2026-04-19 ~ 2026-05-19）；2026-05-19 遷至本卡，原檔保留 stub 指針。

## 一、適用範圍

本卡列出的 5 個設計模式是 [erp-consultant](../../../../../.claude/agents/erp-consultant.md) 審查時的對照基準：
- 設計中**該套但沒套** → 在 [[erp-review-framework]] § 1 系統設計 Insight 中標記
- 設計中**已套用** → 在審查中肯定
- 設計中**不適用** → 在審查中明確說明理由

## 二、1. 當前版本指針模式（current_X_id）

**場景**：資料實體有「多版本 / 多輪次」歷史（如 ReviewRound、未來可能的工單版本、報價版本）。

**反模式**：在每筆子紀錄加 `is_current` 旗標 → 切換時需同時 `set one to TRUE + set others to FALSE`，並發下可能出現 0 個或 2 個 TRUE。

**正模式**：在父實體加 `current_X_id` FK 指針 → 切換時單次 update，可用 DB unique constraint 保證唯一性。

**範例**：`PrintItem.current_round_id → ReviewRound`（add-prepress-review）。

## 三、2. 狀態碼結構化（LOV + 備註）

**場景**：任何「原因 / 分類 / 類型」欄位（退件原因、流失原因、取消原因、NG 分類）。

**反模式**：自由文字 `reason_note` → 拼寫差異造成統計困難；標籤前綴（如 `[技術退件]`）靠字串匹配，易錯。

**正模式**：`X_category` 欄位採 enum LOV（必填）+ `X_note` text（選填補充）。

**好處**：
- 統計分析（Top N 分組）
- 跨系統對映（如退件分類對應圖編器 Preflight 規則）
- 基於分類的條件邏輯（如「技術性退件」排除於不合格率 KPI）

**範例**：
- `quote-request` § 需求單流失歸因（QR-002 定義選單）
- `prepress-review` § 退件原因（PI-009 定義選單）

## 四、3. 合格 / 完成終態原則

**場景**：任何「終態」狀態（合格、完成、已送達、已取消）。

**原則**：終態無出向轉移。若後續需變更內容，**SHALL** 透過「棄用原實體 + 建立新實體」處理，**MUST NOT** 回退終態。

**反模式**：允許從合格狀態退回審稿中、從已完成退回進行中。會造成：
- 狀態機複雜度指數成長
- 歷史稽核困難（同一實體生命週期重複循環）
- 下游已鎖定資料（如已建工單）被破壞

**例外**：維度分離的情況可有不同終態語意（如印件的審稿維度與印製維度，各維度的終態獨立）。

**範例**：
- 印件審稿維度合格為終態，改內容走棄用建新（add-prepress-review）
- 訂單狀態不可逆（state-machines § 訂單狀態不可逆既有規則）

## 五、4. B2C 規格品 vs B2B 客製品的自動化分流

**印刷業 ERP 核心分流原則**（可擴及其他規格化 vs 客製化並存的製造業 ERP）：

| 特性 | B2C（EC 規格品） | B2B（需求單客製） |
|------|----------------|------------------|
| 規格來源 | 商品主檔預先定義（材料 / 工序 / 裝訂 / 難易度）| 業務填寫需求單 |
| 訂單建立 | 會員下單，系統自動帶入 | 需求單成交轉訂單 |
| 工單建立觸發 | 合格後自動建立 + 帶入生產任務 | 合格後建立空工單草稿，印務主管手動拆分 |
| 分配時機 | 付款即刻 | 付款即刻，但內容靈活度高 |

**意涵**：設計 ERP 功能時，凡涉及「下游自動化」的決策（自動建工單、自動帶任務、自動分配），**MUST** 主動思考 B2C / B2B 是否要分流；B2C 預期全自動、B2B 預留人工介入點。

**範例**：add-prepress-review § 合格後分流規則（design D11）。

## 六、5. 稽核鉤子原則

**場景**：重要業務決策的可追溯性（誰做的、為何、何時）。

**原則**：
- 狀態轉移 / 覆寫 / 退件等關鍵動作 **SHALL** 寫入 ActivityLog
- **欄位層級**：對應 reason / category 類欄位採 LOV（見 § 二 § 2 狀態碼結構化）
- **事件層級**：ActivityLog 至少含 `timestamp` / `actor` / `action_type` / `from_to_diff` / `reason`

**範例**：add-prepress-review § Print Item ActivityLog。

## 七、新增設計模式的流程

未來若從 change 審查萃取出新的設計模式：

1. 確認模式跨多個模組普遍適用（不是單一模組特例）
2. 在本卡新增第 6+ 條
3. 更新 [[erp-review-framework]] § 2 § 1 系統設計 Insight 的 checklist 表
4. 更新 frontmatter `last-reviewed`

## 八、相關卡

- [[erp-review-framework]] — ERP 審查 6 維度（本卡為其 § 1 對照依據）
- [[erp-naming-rules]] — 用語規則
- 設計模式起源：add-prepress-review change（2026-04-19，已歸檔）
