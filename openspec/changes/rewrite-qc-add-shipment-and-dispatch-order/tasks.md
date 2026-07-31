# 批二實作任務（M4 品檢與出貨＋M5 派單＋外圍段落）

## 1. 前置（apply 前已完成，此處僅記錄依賴）

- [x] 1.1 擋批二的五張 OQ 全部拍板封存：`QC-003`（不通過原因單選、初版六組選項）、`QC-005`（不建不符合報告單、品檢與打樣兩條路徑切開）、`QC-006`（外發回廠確認歸揀貨人員）、`SHP-013`（EC 海外訂單本輪當不存在）、`SHP-014`（退回實物不進系統）
- [x] 1.2 wiki 回補：印件卡新增 § 品檢缺口處置、品檢紀錄卡定不通過原因單選並補值域段、派單狀態卡的角色正名與海外直發範圍外標註、齊套邏輯補退回實物處理、生產流程藍圖階段 5 外發同步敘述補正
- [x] 1.3 業務情境卡補齊：`出貨與送達`、`外發委外與回廠點收`（Scenario 的驗證來源）

## 2. spec 落地（sync 至 main specs）

- [ ] 2.1 `qc` 依 delta 重寫（1 removed／6 added）
- [ ] 2.2 新建 `shipment` main spec（7 條 Requirement）
- [ ] 2.3 新建 `dispatch-order` main spec（9 條 Requirement）
- [ ] 2.4 `order-management` 依 delta 改三處（QC 狀態徽章、向上傳遞鏈、印件棄用連動）
- [ ] 2.5 `business-scenarios` 依 delta 改兩處（全流程驗證的 QC 單欄、製程審核與工單收回的任務層級欄）
- [ ] 2.6 更新 `openspec/config.yaml` 的 main spec 數量（20 → 22）與模組敘述

## 3. Prototype 對照（`erp` repo，分支 `prototype/production-stage`）

M4 與 M5 頁面在批一期間已落地（`qc-shipping/inspection`、`qc-shipping/shipments`、`dispatch-orders`），本批只做兩向缺口核對與必要補做。依 `prototype-from-prompt` skill 指向的規範執行，不直推 main。

- [ ] 3.1 `qc` 對照：待驗清單來源（轉交單彙總）、分次驗一次一筆、不通過原因單選、缺口處置掛印件層且限印務、品檢人員無處置入口
- [ ] 3.2 `shipment` 對照：建單額度即時檢核、合箱不跨訂單、揀貨兩步、三方式分流（自取不經運送中）、送達憑證、異常與作廢回補、重出開新單
- [ ] 3.3 `dispatch-order` 對照：派單粒度（廠商×工單）、交付即發送、報價核價、在途自動映射、回廠點收連動任務完成、運費關稅攤回、海外直發終態不推印件收尾
- [ ] 3.4 補做本批識別的缺口（範圍與分批依批一慣例：批內必補／交付前補，逐項記入 `ACCEPTANCE.md` § 已知限制）

## 4. 驗收（verify 前逐項跑）

- [ ] 4.1 過時概念殘留：`grep -rn "QC 單\|QC PT\|品檢 PT\|任務層\|BOM 行項目\|供應商自助報工\|工單區域\|NCR\|拼版試算" openspec/specs/` → **整庫零命中**（批一的當批例外於本批解除；`production-execution` 兩處「任務層已移除」的說明語境仍屬合法）
- [ ] 4.2 欄位表與狀態列舉未回流：`qc`／`shipment`／`dispatch-order` 三份皆無業務欄位表與狀態列舉，只以正本邊界段引 wiki
- [ ] 4.3 死鏈：三份新 spec 的 wiki 相對連結逐條確認檔案存在
- [ ] 4.4 spec 數量：`ls openspec/specs/` 為 22 份，含 `shipment`、`dispatch-order`
- [ ] 4.5 Prototype 對照：M4 與 M5 逐頁核對，兩向缺口逐項攤出並定處置
- [ ] 4.6 對抗式找漏：專找「該砍沒砍、該補沒補」，含派單「沿用」邊界是否被寫成需重做、海外直發是否留下沒有規格的路徑
- [ ] 4.7 三張對照表：wiki↔spec（欄位與狀態的正本歸屬）、spec↔Prototype（行為）、情境卡↔Scenario（`出貨與送達` 與 `外發委外與回廠點收` 的每條岔路是否都有對應 Scenario 或明示範圍外）
