---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-05-30
---

# 跨 Agent 共用 Checklist

> 三視角審查 Agent 不論哪個視角都該掃的共通項。避免每個 agent 各自重複定義基礎審查項目。

## 一、適用範圍

下列 checklist **任一 agent 在審查時都應檢視**。若有遺漏，視為審查不完整。

## 二、共通 Checklist

### 1. OQ 衝突 / 回答檢查

- [ ] **是否與既有 OQ 衝突**：本次設計有無與 Vault `08-open-questions/` 既有 OQ 的決議牴觸？
- [ ] **是否回答了既有未解 OQ**：本次設計是否實際回答了某個 `08-open-questions/` 待確認 OQ？若有，**MUST** 在審查輸出中標記「本設計回答了 [[<OQ 編號>]]」，提醒呼叫方解 OQ。
- [ ] **是否引入新 OQ**：審查過程中識別到新的不確定項，**MUST** 觸發 `oq-manage` skill mode B（新增），不可僅 inline 標注「待確認」。

### 2. 異常路徑覆蓋

審查 **MUST** 檢視以下異常路徑是否在設計中被覆蓋（不一定每個都要支援，但 **MUST** 明確說明是否處理）：

- [ ] **急單插入**：在現有流程進行中急單插入會怎樣？
- [ ] **客戶中途改稿**：產品已進入審稿 / 工單後，客戶要求改設計
- [ ] **退單**：訂單成立後客戶取消，影響哪些下游？
- [ ] **部分出貨**：印件部分完成，能否先出貨？
- [ ] **重工**：QC 不合格回到生產，狀態如何回滾？
- [ ] **並行操作**：兩個人同時改同一筆資料的衝突處理

若設計中**完全未提**某項異常路徑，**MUST** 在審查中標記「異常路徑遺漏：XXX」。

### 3. 跨模組整合節點

- [ ] **上游觸發點**：本模組的資料 / 狀態從哪個上游模組來？觸發條件是什麼？
- [ ] **下游影響**：本模組的狀態變化會觸發哪些下游模組？
- [ ] **資料一致性**：跨模組欄位（如 order_id / work_order_id）的變更是否同步？
- [ ] **狀態同步**：上下層狀態機（需求單 / 訂單 / 工單 / 印件 vs 任務 / 生產任務 / QC / 出貨單）的傳遞邏輯（基於 BOM 結構的齊套性邏輯）是否正確？

### 4. 業界參考必附 URL

- [ ] 提到「業界做法」「成熟設計」「最佳實踐」時 **MUST** 附 URL
- [ ] 若 WebSearch 後仍無找到具體案例，改用「依個人 N 年經驗判斷」並標明
- [ ] **MUST NOT** 假裝有業界案例

### 5. 每問題必附解法

- [ ] 指出問題 / 漏洞 / 不合理之處時 **MUST** 附解法或設計方向
- [ ] 純商業決策需 Miles 拍板時，**MUST** 說明 A / B 方向的影響，不可空白

### 6. 既有規則全覆蓋 + delta op 分類一致

- [ ] **既有規則全覆蓋**：枚舉 wiki（ERP_Vault `04-business-logic/` `05-entities/` `06-state-machines/`）+ openspec specs 雙層所有提及本主題的既有 Requirement / 規則，無漏看（漏看會導致 supersession 誤判、新舊並存）
- [ ] **delta op 分類一致**：supersession（取代既有 Requirement / Scenario）**MUST** 標 MODIFIED 不用 ADDED（`openspec archive` sync 按 exact-title 只增不刪，ADDED 取代會致主 spec 新舊兩套描述物理並存、直接矛盾）

## 三、Checklist 使用方式

- 在審查輸出中**不一定逐項列出**「已檢查」（避免冗長）
- 但若有任一項**未通過**或**設計中未涵蓋**，**MUST** 在輸出中明確指出
- 多 Agent 討論時，Round 2 起每個 agent 應假設其他 agent 已掃過此 checklist，可直接質疑「你 Round 1 沒提到異常路徑 XX，是覺得不重要還是遺漏？」

## 四、與視角專屬 Checklist 的關係

| 共通項 | 視角專屬補充 |
|--------|-------------|
| OQ 衝突 / 回答 | 所有視角都掃 |
| 異常路徑覆蓋 | CEO 視角重點：現場可行性；ERP 視角重點：狀態機完整性 |
| 跨模組整合節點 | ERP 視角重點 |
| 業界參考附 URL | PM 視角：產品設計案例；CEO 視角：印刷業案例；ERP 視角：ERP 設計模式 |
| 每問題附解法 | 所有視角都掃 |
| 既有規則全覆蓋 + delta op 分類 | ERP 視角重點：枚舉雙層既有 Requirement + supersession 標 MODIFIED |

## 五、相關卡

- [[insight-discipline]] — Insight 規範
- [[review-loading-checklist]] — 背景載入規則
- [[pm-review-framework]] — PM 視角專屬 5 維度
- [[ceo-review-framework]] — CEO 視角專屬 6 維度
- [[erp-review-framework]] — ERP 視角專屬 6 維度
