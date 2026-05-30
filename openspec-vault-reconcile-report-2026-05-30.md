# OpenSpec → Obsidian 商業邏輯收斂回補報告
> 本報告為 read-only 盤點，未修改任何 Vault 卡。方向為 OpenSpec→Vault 單向回補。
> 產出：2026-05-30，多 agent workflow（13 agent ＝ 12 比對單元 + 1 彙整）。

## 一、執行摘要

**總落差數：65 項**（workflow 程式統計權威值。下方各模組明細表為彙整 agent 撰寫，若內文出現「57」為彙整時手算低估，一律以本節 65 為準）

按方向分布：
- vault-missing（Vault 完全缺卡 / 缺段）：33 項
- vault-stale（Vault 停留舊版）：25 項
- conflict（雙向敘述矛盾）：6 項
- vault-only-ok（Vault 較新 / 無需動作）：1 項

按 severity 分布：
- high：23 項
- medium：31 項
- low：11 項

**跨模組最該優先處理（依「核心分權規則矛盾 > 實體模型翻轉缺卡 > 跨模組核心規則缺正本」排序）：**

1. **「補收免審 vs 退款主管核可」不對稱審核規則**（同一核心規則散見 5 個單元矛盾／缺漏：order-core 訂單實體卡、order-billing 付款發票卡、business-scenarios 情境 13、after-sales 售後實體卡、user-roles 業務／業務主管卡）— 多卡仍停留「對稱皆需核可綁 Payment」舊模型，與 spec L3176/L3224 直接矛盾，會讓規劃時誤判審核路徑與分權。
2. **QC 心智模型翻轉（獨立 QCRecord → 印件層生產任務）整批缺卡**（production-task 8 項、work-order 2 項、business-processes 齊套邏輯卡、state-machines 傳遞鏈例外）— reclassify-qc（2026-05-20）後 Vault 商業邏輯卡整批停留 2026-05-19 舊版，且 NCR 不合格處置機制查無任何卡。
3. **billing-cash 領域 5 個新狀態機在 06-state-machines 完全缺卡**（訂單異動 OA／分期請款雙維度／售後服務單／發票／折讓單）— 其中 OA 三方審核分流是核心分權規則，缺卡會誤判審核路徑。
4. **需求單轉訂單帶入規則（含諮詢費 Payment 轉移）整塊缺卡**（business-processes）— 核心跨模組規則，報價邏輯卡自列為未完成 TODO，完全無正本承載。
5. **請款規劃實體合併（PaymentPlan + PlannedInvoice → BillingInstallment）未回補**（order-billing、business-scenarios 情境 7/8/9、after-sales、user-roles）— 訂單實體卡關聯段仍寫 PaymentPlan[]，且 Payment 已改 PaymentAllocation 推導不再直接掛期次。
6. **訂單編輯時機翻轉（製作前後雙閘門 → 未取消即可編輯）未回補**（order-core）— 訂單備註卡仍寫「完成後鎖定唯讀」，與 v1.13 直接矛盾。
7. **諮詢費金額 1000 → 2000 未回補實體卡**（consultation）— 諮詢單實體卡欄位表仍寫「通常 1000 元」，與正本（固定 2000、收 2000 退 1000）直接矛盾，誤導對帳理解。
8. **需求單「重新評估」退回起點狀態寫錯**（quote-request）— 狀態卡寫「已評估成本→待評估成本」，但 spec 與 Vault 自家 US-QR-006 皆為「議價中→待評估成本」，卡內自相矛盾。

## 二、優先區塊：兩個遺留 spec 的收斂（Miles 點名取代）

### business-processes：跨模組流程規則該收進 Vault

| 規則 | 收斂目標卡類型 | severity |
|------|----------------|----------|
| 需求單成交轉訂單帶入規則（三類帶入語意 + 前置條件 + 諮詢費 Payment 轉移） | 04-business-logic/報價邏輯.md 新增節 | high |
| 印件完成數層級 1 來源改由生產任務報工承載（QCRecord 廢止） | 04-business-logic/齊套邏輯.md § 二 層級 1 更新 | high |
| 審稿合格後依訂單來源分流建工單（B2C 自動帶生產任務 / B2B 空草稿手動拆） | 04-business-logic/印件生產流程.md 補節 | medium |
| 外包供應商報價審核流程（報價與生產可並行、未報價也可先開工） | 新建 04-business-logic/供應商報價流程.md | medium |
| 變更需求三向路由（訂單異動 / 售後服務單 / 工單異動，含公司吸收成本不建 amount=0 OA） | 04-business-logic/付款發票邏輯.md（或新建 變更路由判定.md） | medium |
| 報價建印件拆併原則（同批合併 / 獨立拆分 / 打樣大貨分開） | 04-business-logic/報價邏輯.md 補節 | medium |
| 單據層級結構 + 業務五大階段定義（上層建立才能產生下層、不得跳階） | 04-business-logic/印件生產流程.md 開頭或新建總覽卡 | medium |
| 補件流程依來源分流（B2C 電商自助 / B2B 業務）+ 回原審稿人員不重跑自動分配 | 04-business-logic/審稿分配規則.md 補節 | low |

> 衝突補註：business-processes spec § 帳務公司延伸（L815）停留 simplify change 前、Vault 報價邏輯 § 四較新（自動推導唯讀）。屬 OpenSpec 落後、Vault 不需改；彙整時標記 business-processes 該段待對齊 simplify-quote-billing-company-mapping（quote-request v3.2）。

### business-scenarios：端到端情境缺口

OpenSpec business-scenarios spec 凍結於 2026-05-18，且其補收 / 補印收費情境（情境 8 / 13）仍寫舊核可規則 — **收斂時 MUST NOT 把 OpenSpec 舊核可規則同步進 Vault**。Vault 07-scenarios/README.md 反而較新（已自行收錄情境 14/15/16，且情境 16 含 2026-05-30 諮詢取消收斂）。

該處理項目（皆為同步索引欄位詞彙 / 改寫舊規則，非新建情境卡）：

| 項目 | 動作 |
|------|------|
| 情境 13 行（補收 / 補印收費）照抄舊核可規則 | 改寫 07-scenarios/README.md 情境 13 行為「補收正項跳過審核直達已執行、退款負項才需主管核可」，規則正本指向 [[付款發票邏輯]] / business-processes |
| 情境清單表「涉及主要實體」欄仍列 PaymentPlan / SalesAllowance / PaymentInvoice junction | 同步詞彙：PaymentPlan → BillingInstallment、PaymentInvoice junction → PaymentAllocation；情境 8 描述移除 phase=during_order |
| 遺留 spec 缺情境 14（審稿端到端）/ 15（諮詢 webhook 自動建單）/ 16（訂單取消連鎖） | Vault 已收錄且較完整，無須回補 Vault；若要反向對齊 OpenSpec 須另開 change（Vault→OpenSpec，非本任務範疇） |

## 三、各模組商業邏輯回補清單

### business-processes

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 需求單轉訂單帶入規則（含諮詢費 Payment 轉移） | vault-missing | high | business-processes spec L44-101 | 報價邏輯.md 無此段，§ 八列為未完成 TODO | 04-business-logic/報價邏輯.md |
| 印件完成數層級 1 來源改生產任務報工（QCRecord 廢止） | vault-stale | high | business-processes spec L351 | 齊套邏輯.md § 二 層級 1 仍寫 `pt_qc_passed = sum(QCRecord.passed_quantity)` | 04-business-logic/齊套邏輯.md |
| 審稿合格後 B2C/B2B 建工單分流 | vault-missing | medium | business-processes spec L547-576 | 審稿分配規則.md / 免審決策樹.md 未區分來源 | 04-business-logic/印件生產流程.md |
| 外包供應商報價審核流程（報價與生產可並行） | vault-missing | medium | business-processes spec L516-539 | 無對應卡 | 新建 04-business-logic/供應商報價流程.md |
| 變更需求三向路由（含公司吸收成本不建 amount=0 OA） | vault-stale | medium | business-processes spec L1010-1075 | 付款發票邏輯.md § 四僅兩欄表帶過、缺第二判定軸 | 04-business-logic/付款發票邏輯.md |
| 報價建印件拆併原則 | vault-missing | medium | business-processes spec L491-512 | 無對應卡 | 04-business-logic/報價邏輯.md |
| 單據層級結構 + 業務五大階段 | vault-missing | medium | business-processes spec L9-24 + L27-41 | 04-business-logic 無整合卡 | 04-business-logic/印件生產流程.md |
| 補件流程來源分流 + 回原審稿人員 | vault-stale | low | business-processes spec L589-616 | 審稿分配規則.md 未含來源分流與不重跑分配 | 04-business-logic/審稿分配規則.md |
| 接單公司 vs 帳務公司（spec 落後、Vault 較新） | conflict | low | business-processes spec L813-821 | 報價邏輯.md § 四已自動推導唯讀（較新） | Vault 不改；標記 spec 待對齊 |

### business-scenarios

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 補收 / 退款審核不對稱（情境 8/13 寫舊核可規則） | conflict | high | business-scenarios spec L436-487、L660-699 | 07-scenarios/README.md 情境 13 行照抄舊規則 | 07-scenarios/README.md（正本指向 04-business-logic/付款發票邏輯.md） |
| 請款規劃實體合併為 BillingInstallment | vault-stale | medium | business-scenarios spec L390-521（情境 7/8/9） | 情境清單實體欄仍列 PaymentPlan / SalesAllowance；情境 8 寫 phase=during_order | 07-scenarios/README.md（實體欄 + 情境 7/8/9 描述） |
| 端到端情境 14/15/16（Vault 較完整） | vault-only-ok | low | business-scenarios spec 僅含情境 1-13 | 07-scenarios 已收錄且含 2026-05-30 收斂 | 無 Vault 動作 |

### order-core

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 訂單異動補收/退款審核時機不對稱 | vault-stale | high | order-management spec L3176-3185 + L3224-3233 | 訂單.md § OA 行為摘要 L69-75 停留舊對稱模型（標 2026-05-21） | 05-entities/訂單.md |
| 訂單編輯時機翻轉為「未取消即可編輯」 | vault-stale | high | order-management spec L2853-2872 + L2396-2399 | 訂單.md § 訂單備註 L106 仍寫「完成/取消後鎖定唯讀」（v1.6 舊規則） | 05-entities/訂單.md |
| 訂單詳情頁編輯角色邊界（業務主管無編輯權、會計/Supervisor 唯讀） | vault-missing | high | order-management spec L2863-2872 + L2386-2394 | 訂單.md § 相關角色 L88-93 僅列業務主管審核，未載 X 邊界 | 05-entities/訂單.md |
| 製作後印件規格異動寫入責任邊界與系統通知 | vault-missing | medium | order-management spec L1816-1828 + L2969-2993 | 訂單.md 未載 v1.13 動線翻轉 | 05-entities/訂單.md |
| 完成/已取消禁於詳情頁新增 OA、完成後改走售後 | vault-missing | medium | order-management spec L1089 + L1161-1169 | 訂單.md § OA 行為摘要僅有編輯閘門表、無建立閘門 | 05-entities/訂單.md |
| 訂單列表角色可見範圍（業務主管全公司、諮詢比照業務） | vault-missing | medium | order-management spec L3445-3465 | 訂單.md § 相關角色未載列表可見範圍 | 05-entities/訂單.md |
| 訂單其他附件實體（OrderAttachment，不觸發狀態推進） | vault-missing | low | order-management spec L2922-2930 + L3712-3736 | 訂單.md § 關鍵關聯 L37-46 未提兩類附件語意差異 | 05-entities/訂單.md |

### order-billing

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 補收/退款不對稱審核（補收免審即時認列、退款需核可） | conflict | high | order-management spec L3176-3196 + L3224-3253 + L3178-3185 | 訂單.md § OA 行為摘要 L69-77 停留 2026-05-21 對稱模型；付款發票邏輯.md 5B.1 未列此原則 | 05-entities/訂單.md（主）+ 04-business-logic/付款發票邏輯.md（連帶） |
| 訂單款項規劃改單一請款期次（PaymentPlan 廢止） | vault-stale | high | order-management spec L3043-3061 + L3393-3403 | 訂單.md § 關鍵關聯 L43 仍寫 PaymentPlan[]、Payment 仍掛期次 | 05-entities/訂單.md |
| 請款期次雙維度狀態（開票/收款獨立，支援先收後開） | vault-stale | medium | order-management spec L3112-3140 | 付款發票邏輯.md § 五僅標籤帶過、未說明業務語意 | 04-business-logic/付款發票邏輯.md |
| 期次規劃完整性檢核（補收已執行未對應期次時對帳警示） | vault-missing | medium | order-management spec L3212-3222 | 付款發票邏輯.md § 六未涵蓋此 invariant | 04-business-logic/付款發票邏輯.md |
| 處理中收款不入會計帳本 + 老化追蹤（>7 天） | vault-missing | medium | order-management spec L2653-2663 + L2619-2633 | 付款發票邏輯.md § 六僅一句「不計入收款淨額」 | 04-business-logic/付款發票邏輯.md |
| 已完成收款取消採邏輯刪除保留稽核 | vault-missing | medium | order-management spec L2678-2719 | 付款發票邏輯.md 與訂單.md 均無此業務規則 | 04-business-logic/付款發票邏輯.md |
| 收款開票領域營運管理 KPI vs 產品機制指標分界 | vault-missing | low | order-management spec L3310-3326 | 付款發票邏輯.md 無 KPI 段 | 04-business-logic/付款發票邏輯.md |

### consultation

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 諮詢費金額固定 2000 元 | conflict | high | consultation-request spec L38、L400/L404 | 諮詢單.md 欄位表仍寫「通常 1000 元」（業務流程段已寫 2000，卡內矛盾） | 05-entities/諮詢單.md |
| 諮詢取消角色責任邊界（誰可取消） | vault-missing | medium | consultation-request spec L533-588 | 諮詢單.md / 03-roles/諮詢.md / 03-roles/業務主管.md 皆無；僅 US-CR-006 被動引用 | 05-entities/諮詢單.md（+ 03-roles 兩卡補註） |
| 取消原因六分類 enum | vault-missing | medium | consultation-request spec L40 + L607/L624 | 諮詢單.md 欄位表未列 cancel_reason_category；狀態機卡僅寫「六選一必填」未列值 | 05-entities/諮詢單.md |
| 諮詢主管 = 業務主管同一人 | conflict | low | consultation-request spec L136、L185 | 諮詢單.md 相關角色 L63 仍以「諮詢主管」為獨立條目（非 wikilink） | 05-entities/諮詢單.md |

### quote-request

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 重新評估退回起點狀態 | conflict | high | quote-request spec L87 + L118-123（US-QR-006） | 需求單狀態.md 寫「已評估成本→待評估成本」，但同 Vault US-QR-006 正確寫「議價中→待評估成本」，卡內自相矛盾 | 06-state-machines/需求單狀態.md |
| 諮詢轉需求單需求備註雙區塊帶入 | vault-stale | medium | quote-request spec L476-519 + L417-432 | 需求單.md requirement_note 僅「需求說明」；US-CR-004 停留舊版單欄位 mapping | 05-entities/需求單.md（+ US-CR-004 更新） |
| 收款備註編輯時機 + 業務主管審核移至訂單階段 | vault-missing | low | quote-request spec L295-323 | 需求單.md payment_terms_note 未載非終態可編輯與審核位移 | 05-entities/需求單.md |
| 報價邏輯卡停留骨架版且版本落後（v3.2 vs spec v3.4） | vault-stale | low | quote-request spec v3.4 L417-432 + L521-537 | 報價邏輯.md frontmatter 標 v3.2、自述骨架版、§ 八補完任務未做、缺連結 [[諮詢單]] 與 [[發票法規硬約束-ezPay-MIG]] | 04-business-logic/報價邏輯.md |

### after-sales

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 售後單內補收/退款不對稱核可 | vault-stale | high | after-sales-ticket spec L828-868（v0.7） | 售後服務.md 退款流程 L81-91 停留 v0.5「一律送審主管核可」；近期 change 清單漏 v0.6/v0.7 | 05-entities/售後服務.md |
| 售後服務單三態生命週期轉換條件 | vault-missing | medium | after-sales-ticket spec L120-169 | 06-state-machines 無對應卡；售後服務.md 僅列狀態名未載轉換條件 | 新建 06-state-machines/售後服務狀態.md |
| 業務主管全公司售後監督職責邊界 | vault-missing | medium | after-sales-ticket spec L652-826（v0.6） | 售後服務.md 相關角色 L123-126 未涵蓋全公司唯讀檢視 vs 部門內核可邊界 | 05-entities/售後服務.md |
| 售後類型七項分類業務語意（含色差爭議） | vault-stale | low | after-sales-ticket spec L175-183 | 售後服務.md case_category 段 L60-62 留「Phase B 補完整列表」佔位字 | 05-entities/售後服務.md |

### work-order

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 工單與品檢關聯（QCRecord 廢止改印件層生產任務） | vault-stale | high | work-order spec L396-430 | 工單.md § 關鍵關聯 L35 / § 相關角色 L72 仍把品檢當獨立 QCRecord 實體 | 05-entities/工單.md |
| 工單收回前置條件（任一任務已交付即禁收回、須改異動） | vault-stale | high | work-order spec L90-115 | 工單狀態.md § 收回 L35-40 僅列兩條件，缺「所有任務須待交付」「印務主管尚未開始審核」前置 | 06-state-machines/工單狀態.md |
| 工單異動雙路徑 + 生管兩步驟確認 | vault-stale | high | work-order spec L147-213 + state-machines spec L415-453 | 工單狀態.md § 異動 L42-49 過度簡化兩列、未區分是否需重新審核、缺收斂兩步驟 | 06-state-machines/工單狀態.md |
| 印務主管印件總覽防掉單 + 一次建多張工單 | vault-missing | medium | work-order spec L432-494 | 工單.md / 工單狀態.md / 印件生產流程.md 皆未涵蓋 | 04-business-logic/印件生產流程.md |
| 工單區域設定一次後不可變更 + 工廠類別路由 | vault-stale | medium | work-order spec L596-621 | 工單.md § 核心欄位 L23 僅一句、缺三條業務規則 | 05-entities/工單.md |
| 工單草稿建立兩途徑（線上自動 BOM 展開 / 線下手動） | vault-stale | low | work-order spec L22-47 | 工單.md § 建單與分派流程 L40 僅單一途徑 | 05-entities/工單.md |

### production-task

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| QC 從工序層 QCRecord 翻轉為印件層強制任務（心智模型重構） | vault-stale | high | production-task spec L1275-1311 + L1340-1382 | 生產任務.md 缺 type/scope 概念、仍寫「包含 QCRecord[]」L37；QC.md 整卡停留 2026-05-19 | 05-entities/生產任務.md（+ QC.md 加 deprecation 註） |
| QC 任務每印件強制 1 個（印件入庫前最終驗證定位） | vault-missing | high | production-task spec L1340-1382 | 無對應卡 | 05-entities/生產任務.md |
| 不合格品處置 NCR（重做/議價接受/報廢 + 並行不阻擋） | vault-missing | high | production-task spec L1533-1567 + L1571-1622 | 無對應卡（僅散落 OQ PT-003/XM-005/XM-007 與 03-roles/QC.md） | 新建 05-entities/NCR.md |
| QC 狀態機已廢止（不再有獨立 QC 單狀態） | vault-stale | high | production-task spec L1457-1496；reclassify-qc 已 REMOVED qc/spec.md QC 單狀態機 | 06-state-machines/QC 狀態.md 仍完整描述獨立 QC 單狀態機（停留 2026-05-19） | 06-state-machines/QC 狀態.md（標 deprecated） |
| 工序中間品檢（inspection 任務，選擇性、僅影響成品工序） | vault-missing | medium | production-task spec L1385-1417 + L1315-1337 | 無對應卡、無 requires_inspection 業務語意 | 05-entities/生產任務.md |
| 生產任務前置相依 + 「不看數量」派工原則 | vault-missing | medium | production-task spec L1499-1529 + L1323 | 無對應卡 | 04-business-logic/印件生產流程.md（或新建 生產任務相依規則.md） |
| QC 數量限制改累計報工通過數達標（舊「可申請上限」廢止） | vault-stale | medium | production-task spec L1457-1496 + L1420-1453 | 印件生產流程.md § 七 L64-70 與齊套邏輯.md 層級1、QC.md 均為舊「多張 QC 單競爭額度」模型 | 04-business-logic/印件生產流程.md |
| QC 角色職責邊界更新（兩類檢驗 + 任務模組 R/W + 不合格分類必填） | vault-stale | medium | production-task spec L1442、L1547/L1558-1562；user-roles reclassify-qc MODIFIED | 03-roles/QC.md 停留 2026-05-19（任務操作 X、僅可編輯 QC 紀錄） | 03-roles/QC.md |

### prepress-review

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 退件原因 10 項分類 + 「技術性退件不計入不合格率」指標規則 + source 三值業務語意 | vault-stale | medium | prepress-review spec L147 + L201-207 | 稿件管理規則.md 只記 review_note/client_note 生命週期與結果合格/不合格；分類知識只散落 US-AR-007 與 11-review-knowledge 設計範式卡 | 04-business-logic/稿件管理規則.md |

### state-machines

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 訂單異動狀態機 + 三方審核分流（補收免審/退款核可/諮詢取消系統核可） | vault-missing | high | state-machines spec L814-950 + L1272-1305 + L1356-1384 | 06-state-machines 無對應卡 | 新建 06-state-machines/訂單異動狀態.md |
| 分期請款雙維度狀態機（開票/收款獨立、支援先收後開） | vault-missing | high | state-machines spec L1184-1234 + L1235-1270 | 06-state-machines 無對應卡 | 新建 06-state-machines/分期請款狀態.md |
| 售後服務單狀態機（無主管核可關卡、結案純手動、不可重開、不阻擋主訂單） | vault-missing | medium | state-machines spec L952-1010 | 06-state-machines 無對應卡 | 新建 06-state-machines/售後服務單狀態.md |
| 發票狀態機（開立/作廢、流水號不重用、作廢不參與對帳） | vault-missing | medium | state-machines spec L1012-1045 | 06-state-machines 無對應卡 | 新建 06-state-machines/發票狀態.md |
| 折讓單狀態機（開立即已確認、可作廢還原剩餘可折讓） | vault-missing | medium | state-machines spec L1047-1085 | 06-state-machines 無對應卡 | 新建 06-state-machines/折讓單狀態.md |
| 品檢/品管生產任務不走向上傳遞鏈（跨層例外） | vault-stale | medium | state-machines spec L23-26 + L54-64 | 此跨層例外無任何狀態機卡涵蓋；生產任務狀態卡仍寫舊「生產任務作廢→QC 單自動作廢」 | 06-state-machines/生產任務狀態.md |

### user-roles

| 主題 | 方向 | severity | OpenSpec 出處 | Vault 現況 | 收斂目標卡 |
|------|------|----------|--------------|-----------|-----------|
| 業務主管款項職責調整（廢付款計畫回審、退款才核可、大額補收事後監督） | vault-stale | high | user-roles spec L803-836（對照舊 L684-693） | 業務主管卡職責只列訂單審核/OA 審核（不分正負一律送審）/售後檢視；內容停留 add-sales-manager 版 | 03-roles/業務主管.md |
| 業務款項核可權責不對稱（補收自己執行、退款送主管） | vault-missing | high | user-roles spec L838-850（對照 L763-779） | 業務卡僅泛寫「款項、發票處理」、無不對稱權責規則 | 03-roles/業務.md |
| QC 角色重分類為兩類檢驗 + 任務模組 R/W + 分批驗收 | vault-stale | high | user-roles spec L473-490 + L104/L108 | QC 卡停留 reclassify-qc 前（任務操作 X、工單 R/W、僅記檢驗結果） | 03-roles/QC.md |
| 業務手動覆寫收款對期次分攤（核銷分配） | vault-missing | low | user-roles spec L763-765 + business-processes「請款+核銷流程」 | 業務卡 § 款項追款流程未載自動分攤與手動覆寫權責 | 03-roles/業務.md |
| 會計對帳職責（CSV 匯出 + 月結批次差錯清單 + Slack 人工閉環） | vault-missing | medium | user-roles spec L870-899 + L207-215 | 會計卡 § 月結對帳節奏僅非正式背景、未正式化職責 | 03-roles/會計.md |
| 會計查閱售後單用途 + 公司認賠月度統計 | vault-missing | medium | user-roles spec L207-228 | 會計卡查閱範圍仍停在「基本資料、付款紀錄」 | 03-roles/會計.md |

## 四、建議新建的 Vault 卡

| 卡名 | type | 為何需要 | 來源 OpenSpec |
|------|------|----------|---------------|
| 04-business-logic/供應商報價流程.md | business-logic | 外包供應商報價審核流程（報價與生產獨立可並行）無任何卡承載 | business-processes spec L516-539 |
| 05-entities/NCR.md（不合格紀錄） | entity | reclassify-qc 新增的不合格處置機制（重做/議價接受/報廢、並行不阻擋）核心商業規則無正本卡 | production-task spec L1533-1567 + L1571-1622 |
| 06-state-machines/訂單異動狀態.md | state-machine | OA 六態 + 補收免審/退款核可/諮詢取消系統核可三方分流，是核心分權規則，缺卡會誤判審核路徑 | state-machines spec L814-950 + L1272-1305 + L1356-1384 |
| 06-state-machines/分期請款狀態.md（BillingInstallment） | state-machine | 雙維度狀態（開票/收款獨立）取代 PaymentPlan + PlannedInvoice 兩舊概念，狀態機層完全缺落點 | state-machines spec L1184-1234 + L1235-1270 |
| 06-state-machines/售後服務狀態.md | state-machine | 06-state-machines 9 張卡獨缺售後服務；三態轉換條件與終態規則無正本（與 after-sales 單元 state-machines 單元重疊，建議合一） | after-sales-ticket spec L120-169；state-machines spec L952-1010 |
| 06-state-machines/發票狀態.md | state-machine | 發票兩態（開立/作廢）+ 流水號不重用 + 作廢不參與對帳，狀態機層缺落點 | state-machines spec L1012-1045 |
| 06-state-machines/折讓單狀態.md | state-machine | 折讓單兩態（已確認/已作廢）+ undo 還原剩餘可折讓，狀態機層缺落點 | state-machines spec L1047-1085 |

> 註：07-scenarios 端到端情境 14/15/16 Vault 已自行收錄且較 OpenSpec 完整，**不需新建**。售後服務狀態機在 after-sales 與 state-machines 兩單元各被點名一次，建議新建單張卡（06-state-machines/售後服務狀態.md）並於 05-entities/售後服務.md 互引，避免重複維護。

## 五、衝突項（需 Miles 拍真值方向）

共 6 項 direction=conflict。其中 5 項實為「兩邊／一邊停留舊版」的單向落差（真值方向明確），1 項為 OpenSpec 落後而 Vault 較新。逐項列出：

| # | 主題 | OpenSpec 敘述 | Vault 敘述 | 建議真值來源 | 理由 |
|---|------|--------------|-----------|-------------|------|
| 1 | 補收/退款審核不對稱（order-billing + business-scenarios + business-processes） | order-management L3176/L3224：補收正項免審直達已執行、退款負項才需主管核可 | 訂單.md OA 行為摘要 L69-77 寫「對稱皆需核可綁 Payment」（2026-05-21）；business-scenarios 情境 8/13 + 07-scenarios 情境 13 行寫舊核可規則 | **business-processes spec L1234-1250「補收/退款不對稱操作流」為正本**；Vault 與 business-scenarios 皆停留舊版需對齊 | 不對稱規則是 2026-05-28 unify-billing 後核心分權；business-scenarios 自身落後屬 OpenSpec 內部問題（另開 change），**收斂 Vault 時 MUST NOT 同步 OpenSpec 舊核可規則** |
| 2 | 諮詢費金額（consultation） | consultation-request L38/L400/L404：含稅固定 2000、收 2000 退 1000 | 諮詢單.md 欄位表「通常 1000 元」（業務流程段與狀態機卡已寫 2000，卡內自相矛盾） | **spec（2000）為真值** | v1.10 已由 1000 改 2000；同卡其他段與狀態機卡、US-CR-006 皆已用 2000，僅欄位表落後 |
| 3 | 諮詢主管角色定位（consultation） | consultation-request L136/L185：業務主管 = 諮詢主管同一人，不另開獨立角色 | 諮詢單.md 相關角色 L63 以「諮詢主管」為獨立條目 | **spec（同一人）為真值** | 源自 add-sales-manager-after-sales-page 角色收斂；Vault 僅角色稱謂落後，功能描述正確 |
| 4 | 重新評估退回起點狀態（quote-request） | quote-request L87 + L118-123：議價中 → 待評估成本 | 需求單狀態.md 主要轉移表寫「已評估成本 → 待評估成本」（同 Vault US-QR-006 卻寫「議價中→待評估成本」） | **spec + Vault 自家 US-QR-006（議價中→待評估成本）為真值** | 卡內自相矛盾，狀態機表寫錯來源狀態 |
| 5 | 接單公司 vs 帳務公司（business-processes） | business-processes L815：兩者獨立欄位、業務分別填寫、UI 軟性提示 | 報價邏輯.md § 四：系統自動推導唯讀、業務不再手動選（v3.2，較新） | **Vault（自動推導）為真值** | 反向落差 — OpenSpec business-processes 該段停留 simplify-quote-billing-company-mapping 前；**Vault 不需改**，標記 business-processes 待對齊 |
| 6 | （與 #1 同源）order-core 訂單實體卡 OA 行為摘要對稱模型 | order-management L3176-3196 + L3224-3253 | 訂單.md § OA 行為摘要 L69-75 對稱模型（標 add-payment-status 2026-05-21） | 同 #1，spec 不對稱規則為正本 | 與 #1 為同一核心規則的不同落點（order-core 單元獨立提報），歸併處理 |

> 說明：上述 6 項雖標記 conflict，真值方向皆已明確（5 項 Vault／business-scenarios 停留舊版、1 項 OpenSpec 落後 Vault 較新），不存在「兩邊皆為當前有效設計但互斥」的開放性爭議。Miles 僅需確認 #1/#6 不對稱規則收斂方向（建議直接以 business-processes 正本為準改卡）即可。

## 六、建議後續動作

### A. 適合直接補卡（vault-stale 明確、真值來源清楚）

依「改字／改段」即可，不需 Miles 拍板真值：
- 諮詢費 1000 → 2000（諮詢單.md 欄位表）— 同卡其他段已是 2000
- 諮詢主管 → [[業務主管]]（同一人）（諮詢單.md L63）
- 需求單「重新評估」起點改「議價中→待評估成本」（需求單狀態.md）— 對齊自家 US-QR-006
- 訂單編輯時機改「未取消即可編輯」（訂單.md § 訂單備註 L106）
- 訂單款項關聯 PaymentPlan[] → BillingInstallment[] + PaymentAllocation 推導（訂單.md L43）
- 齊套邏輯卡層級 1 來源 QCRecord → 生產任務報工（齊套邏輯.md § 二）
- QC 狀態機卡標 deprecated（QC 狀態.md）+ 生產任務.md 移除「包含 QCRecord[]」
- 工單卡 QCRecord 字樣移除、改品檢生產任務（工單.md § 關鍵關聯/相關角色）
- 工單收回／異動雙路徑前置條件補齊（工單狀態.md）
- 三張角色卡款項/QC 職責回補（業務主管.md、業務.md、QC.md）
- 售後服務卡退款流程限縮退款負項 + 近期 change 補 v0.6/v0.7（售後服務.md）
- 報價邏輯卡版本 v3.2 → v3.4 + 補連結 [[諮詢單]] / [[發票法規硬約束-ezPay-MIG]]（報價邏輯.md）
- 業務情境索引情境 13 行改寫 + 實體欄詞彙同步（07-scenarios/README.md）

### B. 該先轉 OQ（需業務確認真值或機制後才補）

本輪落差真值方向多已明確，**無強制須先轉 OQ 者**；但下列三項建議補卡前先與 Miles 確認業務細節以免補錯語意：
- 需求單轉訂單帶入規則的「諮詢費 Payment 轉移」具體動作（Payment 轉移 + 建諮詢費 OrderExtraCharge + MUST NOT 建諮詢訂單）— 屬跨模組核心規則，補卡前確認帶入語意三分類無遺漏
- NCR 三處置（重做/議價接受/報廢）各自業務後果（尤其 use_as_is → 印件數量鎖定 + 通知業務手動建 OA 退款）— 牽涉退款邊界，補卡前確認與既有 OQ XM-005/XM-007 一致
- 收款/開票領域營運管理 KPI 是否在付款發票卡只放「分界 + 指向 success-metrics」避免重複維護

### C. 需新建卡 + 批次順序

建議分三批，依「核心分權規則 > 實體模型翻轉 > 周邊狀態機」：

- **批次 1（核心分權，最優先）**：06-state-machines/訂單異動狀態.md（含三方審核分流）+ 06-state-machines/分期請款狀態.md（雙維度）— 兩者是 billing-cash 核心規則缺口，且訂單實體卡 OA 行為摘要改寫需引用此卡
- **批次 2（實體模型翻轉）**：05-entities/NCR.md + 06-state-machines/QC 狀態.md 標 deprecated（與生產任務.md / QC.md / 工單.md / 齊套邏輯.md 的 QC 翻轉補卡一併處理，避免半套）
- **批次 3（周邊狀態機）**：06-state-machines/售後服務狀態.md（與 after-sales 售後實體卡互引）+ 發票狀態.md + 折讓單狀態.md + 04-business-logic/供應商報價流程.md

> 補卡完成後因 ≥ 5 個 Vault 卡異動且涉及多狀態機新建，建議跑 vault-audit（10 維度自審）驗證 frontmatter / wikilink / last-reviewed 一致性。
