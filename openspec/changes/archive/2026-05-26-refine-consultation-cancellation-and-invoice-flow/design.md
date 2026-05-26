## Context

既有諮詢取消設計（[consultation-request spec § 諮詢取消觸發建諮詢訂單與退費](../../specs/consultation-request/spec.md)）採全額退費路徑：取消時系統建諮詢訂單 + OEC(2000) + Payment(+2000 從 CR 轉移) + Payment(-2000 退款)，並依 `consultation_invoice_option` 分支：

- `issue_now`：自動開 Invoice(+2000) + 自動開 SalesAllowance(-2000) 沖銷
- `defer_to_main_order`：不開 Invoice、不開 SalesAllowance

業務側決定改為「半額退費」政策（公司前置投入認列 50%、退客戶 50%），同時釐清了既有 invoice_option 自動化在實務上的反直覺：[現有 spec L1706-1710](../../specs/order-management/spec.md) 已說明 `defer_to_main_order` 於「不做大貨 / 需求單流失」情境根本沒有「主訂單可合併」、最終還是要當下開立，這個分支等於空條款；加上「自動開 Invoice + 自動開 SalesAllowance 沖銷」對客戶與會計都是發票流水雙倍，認知負擔大。

本 change 一次處理兩個耦合議題：諮詢取消改半額 + 諮詢費 Invoice 自動化全面退場改為自動建 PlannedInvoice（待開發票）由諮詢人員手動轉立。

Vault 對應商業層 ground truth：[諮詢單實體](../../../memory/erp/ERP_Vault/05-entities/諮詢單.md)、[諮詢角色](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)、[付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)（PlannedInvoice 定位於此）。

## Goals / Non-Goals

**Goals:**

- 諮詢取消退費政策清晰化：固定 50%、不分時機、不分客戶 / 諮詢人員主動，業務培訓與客戶溝通有單一可宣稱規則
- 訂單異動載體統一化：取消的半額退款透過 `OrderAdjustment(-1000, type=諮詢取消退費)` 載體記錄，沿用既有「應收 = OEC + ∑OA」對帳公式，不為諮詢取消另開特殊計算路徑
- 諮詢費 Invoice 生命週期簡化：諮詢相關所有收尾情境統一行為（建 PlannedInvoice、不自動開 Invoice），諮詢人員看「待開發票」清單即知道有哪些諮詢費要去開，避免「半自動半人工」混淆
- 取消理由結構化收集：未來業務做諮詢取消流失分析時有資料可用（找到其他廠商比例 / 預算問題比例 / 諮詢人員無法出席比例等）

**Non-Goals:**

- 不實作 Prototype（後續另開實作 task）
- 不重新設計諮詢費 PlannedInvoice 的 UI（沿用既有 PendingInvoices 列表頁的呈現）
- 不處理諮詢結束做大貨 → 需求單成交轉一般訂單情境的諮詢費 PlannedInvoice 自動建（業務於主訂單既有發票時程流程自行規劃，避免系統盲建一筆與業務真實規劃衝突）
- 不引入退款 SLA 系統機制（依原付款方式刷退、由第三方金流處理，ERP 只記錄取消事實）
- 不引入客戶通知系統機制（由諮詢人員手動執行客戶通知）
- 不允許 50% 比例可由設定檔變動（hardcode in code，未來若要彈性化另開 change）
- 不修改既有「諮詢結束做大貨 → 需求單成交轉一般訂單」路徑（諮詢費以 OEC 進主訂單的設計不動）

## Decisions

### D1. 退費會計詮釋採「部分認列諮詢費」（對應 Q1）

**問題**：留下的 1000 元在會計上是什麼？有三種詮釋（取消手續費收入 / 部分認列諮詢費 / 全額認列＋全額折讓 1000）。

**決策**：採「**部分認列諮詢費**」— 應收 = OEC(2000) + OA(-1000) = 1000；收款 = +2000 - 1000 = 1000；發票淨額由諮詢人員開立決定（建議開 1000 一張）。

**理由**：
- 沿用既有「應收 = OEC + ∑OA」對帳公式，不為諮詢取消另開特殊計算路徑
- 「收 2000 / 退 1000」雙筆 Payment 流水保留完整可追溯
- OA 載體已有「審核機制 + 編輯閘門 + Activity Log」基礎設施，諮詢取消半額退款的編輯與稽核能力自動沿用

**Alternatives 拒絕**：
- 「取消手續費（收入認列）」：應收會變成「諮詢費 + 取消手續費」兩個 OEC，但「取消手續費」是會計上的新收入科目，需與會計確認入帳邏輯（風險：本 change scope 擴大到會計科目）
- 「全額認列 + 折讓 1000」：發票流水複雜（開 2000 + 折讓 1000），客戶與會計都不易理解

### D2. OA 跳過業務主管核可（對應 Q2）

**問題**：諮詢取消觸發的 OA 是否走標準「主管審核 → 已核可」流程？

**決策**：跳過主管審核，系統自動建 OA、status=已核可、approved_by=system、approved_at=取消時點。

**理由**：
- 取消是公司事先公開的退費政策（50% 寫死、不分情境），不是個案決議 — 不需要主管逐單審核
- 諮詢人員或業務主管 hit「取消諮詢」按鈕已是充分的人工授權
- 既有訂單退款流程的主管審核是為了「金額判斷」（退多少？是否合理？），本情境金額固定為 50%、無判斷空間

**Alternatives 拒絕**：
- 走標準審核流程：諮詢取消量小、固定 50%，要求主管逐單按按鈕造成不必要的操作負擔

### D3. Invoice 自動化全面退場 → PlannedInvoice 自動建（對應 Q3 / CR-6）

**問題**：取消情境是否還要保留 `issue_now` 自動開 Invoice + SalesAllowance 邏輯？

**決策**：諮詢費 Invoice 在三個收尾情境的全部自動化邏輯廢止（不做大貨 / 需求單流失 / 諮詢取消），改為**自動建 PlannedInvoice** 1 筆。諮詢人員看「待開發票」清單即可手動將 PlannedInvoice 轉為實際 Invoice。

| 情境 | PlannedInvoice 金額 |
|------|---------------------|
| 諮詢結束不做大貨 | 2000 元（諮詢費全額）|
| 需求單流失（已轉需求單後）| 2000 元 |
| 諮詢取消 | 1000 元（半額退費後）|
| 諮詢結束做大貨 → 需求單成交轉一般訂單 | 不自動建（業務自行規劃主訂單發票時程）|

**理由**：
- 既有 `defer_to_main_order` 在「不做大貨 / 需求單流失」情境根本沒有「主訂單可合併」、最終還是要當下開立，分支等於空條款 — 統一改 PlannedInvoice 反而清晰
- 取消情境「自動開 Invoice + 自動開 SalesAllowance 沖銷」對客戶與會計都是雙倍發票流水，認知負擔重
- PlannedInvoice 是業界 ERP 常見的「待辦提醒」模式，將「該開多少」記下來但不真正呼叫藍新 API — 諮詢人員看清單即可動作
- 既有 PendingInvoices 列表頁與 PlannedInvoice 實體已實作（[Prototype 已有 src/types/plannedInvoice.ts](../../../sens-erp-prototype/src/types/plannedInvoice.ts)），spec 層補對應 Requirement 即可

**Alternatives 拒絕**：
- 只改取消情境、不做大貨 / 需求單流失維持自動開 Invoice：諮詢費發票邏輯分裂為「半自動半人工」，使用者認知負擔重；且既有自動分支實務上等於空條款，保留無價值

### D4. 退費比例 50% 寫死、不開放系統設定（對應 Q4 / CR-4 / CR-5）

**問題**：50% 比例是否要做成系統設定檔（refund_percentage config）讓未來可調？

**決策**：50% **hardcode in code**，不開放系統設定。spec 也直接寫「諮詢取消 SHALL 退諮詢費 50%」單一規則。

**理由**：
- 諮詢取消是低頻 + 政策性決定，業務不需「動態調整」能力
- 若未來要改比例（如改 30% / 70%）必然伴隨業務溝通、客戶政策公告 — 同步動 spec 才合理
- 開放設定檔反而引入「不同分公司可能不同設定」這種非預期使用情境

**Alternatives 拒絕**：
- 設定檔 `refund_percentage`：YAGNI，本 change 不解決「比例彈性化」這個未經驗證的需求

### D5. 不分時機、不分主動方（對應 CR-4）

**問題**：諮詢人員臨時取消（公司側因素）是否應全退（公司違約）？

**決策**：凡允許退款的取消情境一律退 50%，不分客戶 / 諮詢人員主動。

**理由**：
- 簡化業務規則，避免「諮詢人員無法出席」這種邊界情境引入複雜判斷
- `cancel_reason_category` 提供「諮詢人員無法出席」選項，未來若實務反饋公司違約應全退、再開 change 補規則
- 諮詢人員無法出席的實務替代路徑通常是「重新排程」而非「取消」，所以本 change 接受邊界情境的 50%

**Alternatives 拒絕**：
- 按主動方分（客戶取消 50% / 諮詢人員取消 100%）：本 change 階段沒有實務案例支持，先簡化

### D6. OA enum 新增第 9 值「諮詢取消退費」（對應 Q5）

**問題**：諮詢取消的 OA 用哪個 `adjustment_type`？沿用既有 enum（折扣 / 補退 / 其他）還是新增？

**決策**：新增第 9 值「**諮詢取消退費**」，系統內生 type、僅由系統於諮詢取消觸發點建立，業務不可手動選用。

**理由**：
- 語意精準（「折扣」是業務主動降價、「補退」是補件退款、「其他」失去分類意義）
- 未來可獨立統計「諮詢取消退費」總金額作為流失成本指標
- 系統內生 type 不混入業務手動下拉選項，避免誤用

**Alternatives 拒絕**：
- 沿用「折扣」+ reason 寫「諮詢取消退費」：語意不對，業務側看 OA 列表會誤判為主動降價
- 沿用「其他」：失去獨立統計能力

### D7. 諮詢訂單完成時點 = 退款 Payment 切已完成（對應 Q6）

**問題**：諮詢訂單何時推進到「訂單完成」終態？退款一定完成、但發票開不開不確定。

**決策**：**退款 Payment 切「已完成」即推進**訂單到「訂單完成」終態。發票開不開不影響訂單終態，由「對帳警示 banner」既有機制提示漏開發票風險。

**理由**：
- 發票責任已交給諮詢人員手動（PlannedInvoice 待辦）
- 訂單終態與發票完成解耦，避免訂單卡在「未完成」拖累業務追蹤
- 若諮詢人員漏開發票，[現有對帳警示 banner](../../specs/order-management/spec.md) 既有機制會提示

**Alternatives 拒絕**：
- 退款 + 至少開 1 張發票才推進：訂單終態與外部人工動作強耦合，易卡住
- 諮詢人員手動點「結案」按鈕：增加不必要的人工步驟

### D8. 取消權限限縮（對應 Q7）+ 諮詢部門督導角色對齊既有 user-roles spec

**問題**：誰能點「取消諮詢」按鈕？「諮詢主管」角色是否獨立於「業務主管」？

**決策**：
- 取消權限限「當前 `consultant_id` 自己」（已認領該諮詢單的諮詢人員）+「**業務主管**」（可代為取消），**業務不可**
- **「諮詢主管」概念統一為「業務主管」**：公司組織上業務主管 = 諮詢主管同一人（負責業務 / 諮詢部門督導），本 change 統一稱業務主管，不另開「諮詢主管」獨立角色
- 本 change 將既有 main spec § 諮詢人員認領 與 § 諮詢人員筆記欄位 兩個 Requirement 納入 MODIFIED 範圍，把既有「主管」/「諮詢主管」措辭對齊為「業務主管」

**理由**：
- 諮詢相關所有動作（認領 / 編輯 consultant_note / 結束諮詢分支）已由諮詢人員擁有，取消權限對齊
- 業務不負責諮詢階段操作 — 沿用既有「諮詢人員 = 諮詢階段唯一操作者」設計
- 「業務主管」是 [user-roles spec § 業務主管角色職責](../../specs/user-roles/spec.md) 已定義的既有角色（中台平台、訂單審核），對齊使用避免引入新 role enum
- 既有 main spec 雖在 § 諮詢人員認領 用「主管 SHALL 可代為認領」、Scenario 用「諮詢主管」措辭，但語意上指的就是業務主管 — 本 change 一併對齊措辭，避免 archive 後留 inconsistency

**Alternatives 拒絕**：
- 業務也可取消：既有 spec 條款，但實務上業務不負責諮詢階段，本 change 對齊修正
- 新增「諮詢主管」獨立 user_role enum：實務上同一人兼任、新增角色徒增權限矩陣維護成本
- 既有 § 諮詢人員認領 措辭不動：archive 後 main spec 留「諮詢主管」與本 change 引入的「業務主管」混用、不一致

### D9. 取消 dialog 純防呆 + cancel_reason_category 必填（對應 CR-7）

**問題**：取消 dialog 要顯示哪些資訊作為防呆？

**決策**：取消 dialog 內容固定為：
- 警示文字：「確定取消？將自動建諮詢訂單並退款 1000 元，無法復原」
- 必選下拉：cancel_reason_category（6 值）
- 不顯示：`consultation_invoice_option` 意向、客戶聯絡資訊、預約時間

**理由**：
- dialog 是「最後一道防呆」，資訊越精簡越好（避免認知過載）
- `consultation_invoice_option` 在新設計下已不驅動行為，不需提示
- cancel_reason_category 強制收集才能有資料做未來流失分析

**Alternatives 拒絕**：
- 顯示 invoice_option 意向作為「建議開幾張發票」：意向欄位本身降為純展示、不再驅動發票自動化，這時還顯示反而讓諮詢人員誤解「系統會幫我開」

### D10. cancel_reason_category enum 6 值（對應 CR-3 議題 2）

**問題**：取消理由要不要結構化收集？enum 列哪些值？

**決策**：取消時必填 enum 6 值：
1. 找到其他廠商
2. 預算問題
3. 需求改變
4. 時間無法配合
5. 諮詢人員無法出席
6. 其他（原因請參考備註）

不新增 `cancel_reason_note` 欄位 — 補充說明（特別在「其他」情境）寫入既有 `consultant_note`。

**理由**：
- 6 值覆蓋印刷業 B2B 諮詢取消的常見場景（比價 / 預算 / 需求 / 時間 / 公司側 / 兜底）
- 業界 LOV 設計原則：≤ 6 項避免填寫率下降與統計品質惡化
- 不新增 note 欄位：`consultant_note` 已是諮詢人員筆記用途，「其他取消理由」屬筆記類資訊、合用既有欄位避免欄位過多

**Alternatives 拒絕**：
- 不收集理由：未來業務做諮詢取消流失分析時無資料可用
- 新增獨立 `cancel_reason_note`：與 `consultant_note` 語意重疊，欄位過多

### D11. PlannedInvoice expectedDate = 取消時點當天（對應 CR-8）

**問題**：自動建立的 PlannedInvoice 預計開立日（expectedDate）帶什麼值？

**決策**：`expectedDate` = 取消 / 完成諮詢 / 需求單流失的**時點當天**（即觸發時間）。

**理由**：
- 諮詢費發票應盡快開立（避免財務跨期問題）
- 諮詢人員看「待開發票」清單會看到「今天到期」的提示，促使優先處理
- 對齊 `PlannedInvoice.deriveExpectedDateStatus` 既有邏輯（「今天」狀態顯示為提醒色）

**Alternatives 拒絕**：
- 觸發時點 + N 天：N 等於多少沒有業務依據；且延後開發票無實質好處
- 取消 dialog 內由諮詢人員指定：增加不必要的人工步驟

### D12. CR-3 OQ 隨本 change archive 標 resolved

**處理**：
- CR-3 議題 1（部分退費）：本 change 解 — 50% 寫死
- CR-3 議題 2（取消理由）：本 change 解 — cancel_reason_category enum 6 值
- CR-3 議題 3（退款 SLA / 通知）：本 change 解 — 退款依原付款方式刷退由第三方金流處理、客戶通知由諮詢人員手動

CR-3 卡 status 從 `open` 改 `resolved`，source-link 補本 change archive 路徑，於本 change archive 階段執行。

## Risks / Trade-offs

### 風險 1：移除既有 Invoice 自動化邏輯影響 archived change 設計

**風險**：[refactor-order-payment-and-invoice-with-billing-company](../archive/) 定義的 `consultation_invoice_option` 對發票自動化的影響被本 change 廢止，archived change 的 spec 與本 change 的 modified spec 不一致。

**緩解**：
- spec 內保留 `consultation_invoice_option` 欄位（不刪），但行為描述明確改為「客戶意向參考、不驅動系統行為」
- design.md 顯式紀錄此項 archived change 影響
- 未來若需完整移除 invoice_option 欄位，另開 change 清理

### 風險 2：50% 寫死未來需要彈性化

**風險**：未來業務反饋 50% 比例不適用（如：諮詢人員無法出席案例變多、需要全退）。

**緩解**：
- design.md 紀錄「比例彈性化」的後續 evolve 路徑（開新 change，spec 改寫 + 視業務需求決定是否引入設定檔）
- cancel_reason_category 提供「諮詢人員無法出席」分類，未來案例累積後若需差異化規則，有資料可分析

### 風險 3：諮詢人員忘記轉 PlannedInvoice 為實際 Invoice

**風險**：PlannedInvoice 自動建後沒有強制機制要求諮詢人員當天開立，可能導致發票漏開、客戶投訴。

**緩解**：
- PlannedInvoice 的 `expectedDate` 設為當天，諮詢人員看「待開發票」清單會看到「今天到期」提示（既有 `deriveExpectedDateStatus` 邏輯）
- 對帳警示 banner（既有機制）會提示發票淨額與應收的差異
- 本 change 範圍內不引入「未開發票自動排程提醒」（保持 scope 收斂），未來收集案例後可另開 change

### 風險 4：取消權限限縮影響既有業務流程

**風險**：既有 spec 條款允許業務點取消諮詢、本 change 改為業務不可，若實務上業務常代諮詢人員操作可能造成阻礙。

**緩解**：
- 業務主管可代為取消（沿用「業務主管代為認領」設計範式）
- 業務若遇到客戶要求取消、SHALL 通知業務主管處理
- Migration 期需通知業務新權限規則（業務培訓）

### Trade-off：本 change 範圍涵蓋兩個耦合議題（取消半額 + Invoice 退場）vs 拆兩個 change

**取捨**：取消半額退費（議題 A）與 Invoice 自動化退場（議題 B）邏輯相關但可獨立 — 可拆兩個 change 順序執行（A → B 或 B → A）。

**選擇**：採一個 change 整合兩議題，主因：
- 取消半額退費觸發點本來就會建 OA 與 PlannedInvoice，兩議題在「諮詢取消」這個 Requirement 高度耦合
- 拆兩個 change 反而造成同一 Requirement 改兩次（先半額退費保留 SalesAllowance、再廢止 SalesAllowance 改 PlannedInvoice），spec drift 風險高
- archive 後一次性與業務溝通新政策更清楚

## Migration Plan

### Spec 階段（本 change 範圍）

1. 寫 4 個 modified spec 的 delta（consultation-request / order-management / state-machines / business-processes）
2. 寫 tasks.md（含 OQ 更新、Prototype 影響、業務培訓提醒）
3. 三視角審查由 Miles 明確要求**跳過**

### Archive 階段（本 change archive 時執行）

1. CR-3 OQ 卡更新（mode C：status → resolved、source-link 指向本 change archive 路徑、三議題決議寫入「結論」段）
2. delta specs 合併回 main specs（OpenSpec archive 自動處理）

### Prototype 實作階段（後續另案）

1. 諮詢取消按鈕權限改寫（限 consultant_id 自己 + 業務主管、業務隱藏）
2. 取消 dialog 加 cancel_reason_category 必選下拉、防呆文案改為「退 1000 元」
3. 取消後建單流程拆解：諮詢訂單 + OEC + Payment 轉移 + 新增 OA(-1000) + 新退款 Payment(-1000) 為「處理中」
4. 三情境（不做大貨 / 需求單流失 / 諮詢取消）移除既有 Invoice 自動建立邏輯，改自動建 PlannedInvoice
5. 諮詢單實體新增 `cancel_reason_category` 欄位
6. 既有 mock 資料（如有 `cancel_reason_category` 為空的歷史諮詢取消單）補設預設值或標記為 legacy

### 業務培訓

1. 諮詢取消政策變更（全額 → 半額）通知諮詢人員 + 客服流程
2. 諮詢訂單建立後的「待開發票」由諮詢人員手動處理（不再系統自動開）
3. 客戶通知退款由諮詢人員手動執行（不入系統）
4. 業務不可取消諮詢，遇客戶要求取消 SHALL 通知業務主管

## Open Questions

無。所有 OQ（Q1-Q7、CR-3 三議題、CR-4 ~ CR-8）已於 explore 階段全部解決。
