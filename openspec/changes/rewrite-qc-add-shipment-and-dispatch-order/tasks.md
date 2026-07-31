# 批二實作任務（M4 品檢與出貨＋M5 派單＋外圍段落）

## 1. 前置（apply 前已完成，此處僅記錄依賴）

- [x] 1.1 擋批二的五張 OQ 全部拍板封存：`QC-003`（不通過原因單選、初版六組選項）、`QC-005`（不建不符合報告單、品檢與打樣兩條路徑切開）、`QC-006`（外發回廠確認歸揀貨人員）、`SHP-013`（EC 海外訂單本輪當不存在）、`SHP-014`（退回實物不進系統）
- [x] 1.2 wiki 回補：印件卡新增 § 品檢缺口處置、品檢紀錄卡定不通過原因單選並補值域段、派單狀態卡的角色正名與海外直發範圍外標註、齊套邏輯補退回實物處理、生產流程藍圖階段 5 外發同步敘述補正
- [x] 1.3 業務情境卡補齊：`出貨與送達`、`外發委外與回廠點收`（Scenario 的驗證來源）

## 2. spec 落地（sync 至 main specs）

- [x] 2.1 `qc` 依 delta 重寫（1 removed／6 added）
- [x] 2.2 新建 `shipment` main spec（7 條 Requirement）
- [x] 2.3 新建 `dispatch-order` main spec（10 條 Requirement）
- [x] 2.4 `order-management` 依 delta 改三處（QC 狀態徽章、向上傳遞鏈、印件棄用連動）
- [x] 2.5 `business-scenarios` 依 delta 改**四處**（全流程驗證的 QC 單欄與步驟 13-15、製程審核與工單收回的任務層級欄、「工單異動與任務層級管理」整條改寫為生產任務層異動、「QC 與出貨」整條改寫為品檢與出貨）
- [x] 2.6 更新 `openspec/config.yaml` 的 main spec 數量（20 → 22）與模組敘述

## 3. Prototype 對照（`erp` repo，分支 `prototype/production-stage`）

M4 與 M5 頁面在批一期間已落地（`qc-shipping/inspection`、`qc-shipping/shipments`、`dispatch-orders`），本批只做兩向缺口核對與必要補做。依 `prototype-from-prompt` skill 指向的規範執行，不直推 main。

- [x] 3.1 `qc` 對照：待驗清單來源（轉交單彙總）、分次驗一次一筆、不通過原因單選、缺口處置掛印件層且限印務、品檢人員無處置入口
- [x] 3.2 `shipment` 對照：建單額度即時檢核、合箱不跨訂單、揀貨兩步、三方式分流（自取不經運送中）、送達憑證、異常與作廢回補、重出開新單
- [x] 3.3 `dispatch-order` 對照：派單粒度（廠商×工單）、交付即發送、報價核價、在途自動映射、回廠點收連動任務完成、運費關稅攤回、海外直發終態不推印件收尾
- [x] 3.4 補做本批識別的缺口：四項必補已落地（驗收數量上限檢核、處置留痕多筆與報廢累計、裝箱實裝不符記差異、點收短少不切終態），ACCEPTANCE 補驗收項 52-55；四類跨模組未連動與三項覆蓋不足記入 § 已知限制

## 4. 驗收（verify 前逐項跑）

- [x] 4.1 過時概念殘留（判準精確化：原 pattern 的「任務層」會誤命中合法用詞「生產任務層」）：
  - 硬性零命中：`grep -rn "QC 單\|品檢 PT\|BOM 行項目\|供應商自助報工\|工單區域\|NCR\|拼版試算" openspec/specs/`
  - `QC PT` 與 `任務層`（排除「生產任務層」）：僅允許「已移除／已廢除」的說明語境，逐行確認；現況三處皆為說明語境（`order-management` 2062、`production-execution` 21、`business-scenarios` 190）
- [x] 4.2 欄位表與狀態列舉未回流：三份皆零命中 `^## Data Model` 與狀態列舉表，只以正本邊界段引 wiki
- [x] 4.3 死鏈：三份新 spec 與五份 delta 的 wiki 相對連結全部存在（delta 另修相對層數：四層 → 五層）
- [x] 4.4 spec 數量：22 份，含 `shipment`、`dispatch-order`；config.yaml 同步
- [x] 4.5 Prototype 對照：見第 3 節
- [x] 4.6 對抗式找漏（單線）：
  - 派單「沿用」邊界：以 raw 現況爬取逐條核對十條標記，三處只寫「現況已實作」會誤讀為掛載實體不變（報價、13 值狀態、委外情境六值），已補「掛載實體本輪改變」；另補漏掉的一條 Requirement（外發數量以回廠點收為準——現況採信廠商回報數，與批一 work-order 拍板衝突）
  - 海外直發：狀態列舉保留三終態並以獨立 Requirement 明示範圍外＋Scenario 界定終態只讓生產任務完成報工，不留無規格路徑
  - 佔位語殘留：`出貨模組待建立` 等佔位零命中（SHP-006 記錄的缺口已由 `shipment` 承接）
  - capability 交叉引用：三份新 spec 引用的 `work-order`／`prepress-review` 皆存在
- [x] 4.7 三張對照表：
  - wiki↔spec：三份新 spec 皆無欄位表與狀態列舉、以正本邊界段引 wiki 實體卡與狀態機卡；不通過原因值域、額度公式、13 值列舉、分攤政策皆為引用不複寫
  - spec↔Prototype：見第 3 節（四項必補已補、跨模組未連動列已知限制）
  - 情境卡↔Scenario：出貨五條岔路全部有對應 Scenario（額度不足、分批、實裝不符、拒收轉異常、未離廠作廢）；外發五條中三條有對應 Scenario（點收短少、補印開新派單、海外直發終態），打樣委外與分批回台由 § 委外製作情境與 § 派單狀態轉換的規則本體涵蓋、未另設 Scenario
