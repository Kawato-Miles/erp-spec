## 1. 三視角審查（archive 前必做）

- [x] 1.1 觸發 senior-pm agent 審查 proposal + design（PM 視角：問題框架是否正確、user story 與 spec 對齊度）
- [x] 1.2 觸發 ceo-reviewer agent 審查 proposal + design（CEO 視角：KPI 對齊 / 商業合理性）
- [x] 1.3 觸發 erp-consultant agent 審查 specs delta（ERP 顧問視角：5 個資料模型設計模式對照 / 與既有 spec 一致性）
- [x] 1.4 整合三視角審查意見，修訂 proposal / design / specs（P0 全採納、P1 部分採納、P2/P3 不採）

## 2. Spec 同步至 main specs（archive 階段）

- [ ] 2.1 執行 `openspec archive align-business-consultation-coverage-gaps`
- [ ] 2.2 確認 order-management/spec.md 7 個 ADDED + 2 個 MODIFIED Requirement 已 merge 至 main spec
- [ ] 2.3 確認 state-machines/spec.md 訂單前段審核通過狀態 Requirement 已 ADDED 至 main spec
- [ ] 2.4 確認 after-sales-ticket/spec.md 售後場景退款流程三組件組合 Requirement 已 ADDED 至 main spec
- [ ] 2.5 確認 business-processes/spec.md 跨齊報稅期作廢 vs 折讓流程節點 Requirement 已 ADDED 至 main spec

## 3. memory 檔案補情境範例

- [ ] 3.1 修訂 `memory/erp/payment-invoice-scenarios.md`：補 I7 跨齊報稅期作廢失敗 → 折讓的完整情境範例
- [ ] 3.2 同檔案：補 I10 多品項發票進位差額算法的計算情境範例（含具體數字驗算）

## 4. CLAUDE.md spec 規格檔清單更新

- [ ] 4.1 更新 `CLAUDE.md` § Spec 規格檔清單：order-management spec 版本號（補本 change 變動摘要）
- [ ] 4.2 更新同清單：state-machines spec 版本變動摘要（新增「審核通過」狀態）
- [ ] 4.3 更新同清單：after-sales-ticket spec 版本變動摘要（退款流程三組件組合）
- [ ] 4.4 更新同清單：business-processes spec 版本變動摘要（跨齊報稅期作廢 vs 折讓流程節點）

## 5. doc-audit 跨檔案一致性檢查

- [ ] 5.1 執行 `doc-audit` skill 檢查 order-management / state-machines / after-sales-ticket / business-processes 四個 spec 與本 change 變更的一致性
- [ ] 5.2 修正 doc-audit 識別到的不一致項

## 6. Prototype 補實作（範圍外，後續另開 task）

> 以下任務不在本 change 範圍，僅列為後續實作追蹤。本 change archive 完成後另開實作 change 處理。

- [ ] 6.1 Prototype：訂單前段審核流程實作（草稿 / 待主管審核 / 審核通過 / 報價待回簽 四階段 UI + 業務「已送報價單」按鈕）
- [ ] 6.2 Prototype：Order 新增 `source_order_id` 欄位 + 訂單列表「複製訂單」按鈕
- [ ] 6.3 Prototype：客戶資料 relation 帶出邏輯（已開發票仍保留快照）
- [ ] 6.4 Prototype：印件層 `shipment_quantity` 累計欄位 + 印件出貨狀態三態 + 出貨單列表分次進度
- [ ] 6.5 Prototype：PaymentPlan 新增 `original_expected_date` / `change_count` 欄位 + 分階段稽核邏輯（取代既有「變更回主管審核」）
- [ ] 6.6 Prototype：多品項發票稅額算法（每品項分別計算 + 差額集中最後品項）
- [ ] 6.7 Prototype：發票異動 UI 純化（作廢 / 折讓兩按鈕，作廢失敗錯誤訊息引導折讓）
- [ ] 6.8 Prototype：售後服務單三組件進度展示區 + 三組件未完成不可結案邏輯

## 7. Notion 推送（累積數個 change 後手動觸發）

- [ ] 7.1 確認本 change 與其他 archive 的 change 累積後，手動將 order-management spec 推送至 [Notion 發布版本](https://www.notion.so/32c3886511fa806bad41d755349b0567)
- [ ] 7.2 同步：state-machines spec → [Notion](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)
- [ ] 7.3 同步：business-processes spec → [Notion](https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a)
- [ ] 7.4 after-sales-ticket spec：目前無 Notion 發布版本，待累積版本內容後再建立
