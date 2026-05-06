## Context

當前 ERP 沒有諮詢前置流程的紀錄。客人若先諮詢再決定下單，整段足跡（諮詢費收款、討論結果、後續是否轉需求單）散落在 surveycake 表單與業務筆記中。同時 [quote-request](../../specs/quote-request/spec.md) v2.0（`add-sales-manager-quote-approval`, 2026-04-27 歸檔）設計的「核可進議價」gate 與業務主管真實工作節奏不對齊：業務主管在「成交後出報價單前」才有理由動手，而非議價前。

本 change 同時處理兩件事：(1) 新增諮詢前置實體 ConsultationRequest，(2) 把 quote-request v2.0 的核可 gate 從議價前搬到成交後。原因是這兩件事在資料層強耦合 — 諮詢費需 mapping 為一般訂單訂金、需求單轉訂單的時序設計同時受影響。

設計參照：
- [state-machines](../../specs/state-machines/spec.md)：需求單 / 訂單上層狀態機
- [business-processes](../../specs/business-processes/spec.md)：需求單轉訂單的欄位帶入規則
- [user-roles](../../specs/user-roles/spec.md)：業務 / 業務主管 / 諮詢角色權責

## Goals / Non-Goals

**Goals:**
- 客人完整足跡可被 ERP 追蹤：填表單 → 付款 → 諮詢 → 決定走向 → 後續訂單
- 諮詢費可跨單據抵扣，做大貨時自動帶入訂單作為已收訂金，無須業務手動退費再收款
- 業務主管在需求單上的審核時機收斂為單一道「成交後審核」，與真實工作節奏對齊
- 訂單實體擴充支援諮詢訂單型態，同時保留與一般訂單路徑的明確隔離

**Non-Goals:**
- 不取代 surveycake，仍以外部表單為入口（透過 webhook 同步）
- 不在本 change 內建線上自助諮詢預約 UI（ERP 內建表單） — Phase 2+ 議題
- 不處理 EC 線上訂單路徑的諮詢需求（Phase 1 僅針對線下）
- 不改變需求單的成本評估角色（印務主管職責不變）
- 不改變現有訂單的線上 / 線下二分路徑（諮詢訂單為新增第三類，互不干擾）

## Decisions

### D1：諮詢單為獨立實體，與需求單平行（非子階段）

選擇 ConsultationRequest 為新實體，而非把 quote-request 擴充加上「諮詢階段」前置狀態。

理由：諮詢單同時可流向「諮詢訂單」與「需求單」兩個出口，跟兩者都是兄弟關係。若擴充 quote-request 狀態機，會把「客人主動發起」的諮詢單塞進「業務主動發起」的需求單語意，entry point 與權責混淆。獨立實體換取邊界清晰。

替代方案：
- (A) 作為需求單子階段：否決，混淆 entry point
- (B) 作為訂單子型態（先建諮詢訂單）：否決，訂單的「成交後」語意太強，諮詢未成交就建訂單破壞 order 語意

### D2：Payment polymorphic + 諮詢訂單只在「沒進大貨製作」時建立（OQ #2 整合，2026-05-06 修訂三版）

**設計**：

webhook 觸發時，只建立 `ConsultationRequest` 與 `Payment`（Payment 直接關聯 ConsultationRequest，**不建任何 Order**）。後續依案件最終結局決定建什麼訂單與 Payment 轉移到哪裡：

| 結局路徑 | 觸發時點 | 建立的訂單 | Payment 轉移目的地 | OrderExtraCharge |
|---------|---------|-----------|-------------------|------------------|
| 諮詢結束 - 不做大貨 | 諮詢人員選「不做大貨」 | 諮詢訂單（type=諮詢） | 諮詢訂單 | consultation_fee |
| 諮詢結束 - 做大貨 - 需求單成交 | 業務「轉訂單」 | 一般訂單（type=一般） | 一般訂單 | consultation_fee |
| 諮詢結束 - 做大貨 - 需求單流失 | 需求單流失 | 諮詢訂單（type=諮詢） | 諮詢訂單 | consultation_fee |
| 待諮詢取消（退費） | 業務「取消諮詢」 | 諮詢訂單（type=諮詢） | 諮詢訂單（同時建退款 Payment） | consultation_fee |

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾，包含「諮詢結束選不做大貨」、「諮詢結束選做大貨但需求單流失」、「待諮詢取消」三種情境。複用單一收尾流程，不增加新訂單類型。

**Payment 設計擴充（本 change MODIFY refactor change）**：

refactor change 原設 `Payment.order_id` 必填 FK -> Order。本 change MODIFY 此設計，改為 polymorphic 關聯：

| 欄位 | 變更 |
|------|------|
| `linked_entity_type` | 新增，enum: `ConsultationRequest` / `Order` |
| `linked_entity_id` | 新增，依 `linked_entity_type` 指向 ConsultationRequest 或 Order |
| `order_id`（原） | 廢除為衍生欄位，保留向後相容 |

Payment 一開始綁 ConsultationRequest（webhook 觸發時），後續依結局轉移到對應訂單（修改 linked_entity_type 與 linked_entity_id）。

**為何 Payment 必須 polymorphic**：

- webhook 觸發時 ConsultationRequest 已建立但訂單尚未建立 — 此時 Payment 沒有訂單可綁
- 若強行同時建草稿訂單（前版設計），會出現「諮詢結束做大貨」情境下這張草稿訂單最終要作廢（因為主訂單是後續另建的），多餘且破壞訂單獨立帳務語意
- 諮詢結束才依分支建訂單 + Payment 轉移，是最簡潔的設計

**訂單金額結構（本 change 新增）**：

訂單明細 = 印件 line items + 其他費用 line items（OrderExtraCharge）。OrderExtraCharge.charge_type ∈ { `consultation_fee`（諮詢費）/ `shipping_fee`（運費）/ `rush_fee`（急件費）/ `other`（其他） }。

訂單應收計算（修改 refactor change 對帳檢視面板算式）：

`應收總額 = ∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`

OrderExtraCharge 與 OrderAdjustment 語意分離：OrderExtraCharge 是訂單成立時就確定的明細項目（不需審核）；OrderAdjustment 是訂單成立後的金額異動（需審核）。

**對帳邏輯**：

| 路徑 | 諮詢訂單對帳 | 一般訂單對帳 |
|------|------------|------------|
| 不做大貨 | 應收 = 諮詢費（OrderExtraCharge）= 收款（轉移 Payment）= 發票，差額 0 | 不適用 |
| 做大貨 - 需求單成交 | 不適用（諮詢訂單未建） | 應收 = 印件費 + 諮詢費 + 其他費 = 收款（轉移 Payment + 補繳）= 發票，差額 0 |
| 做大貨 - 需求單流失 | 應收 = 諮詢費 = 收款（轉移 Payment）= 發票，差額 0 | 不適用 |
| 待諮詢取消 | 應收 = 諮詢費 = 收款（轉移 Payment + 退款 Payment 抵銷）= 發票（issue_now 開過則開 SalesAllowance），差額 0 | 不適用 |

**OQ #2 退費路徑**（依賴 refactor change 的退款機制）：

客人在「待諮詢」狀態取消預約時：(1) 系統建諮詢訂單（type=諮詢），(2) 建 OrderExtraCharge(consultation_fee, 諮詢費)，(3) Payment 從 ConsultationRequest 轉移至諮詢訂單，(4) 同步在諮詢訂單上建退款 Payment（amount = -諮詢費），(5) 已開立 Invoice（issue_now 路徑）則開 SalesAllowance 關聯退款 Payment，(6) 諮詢訂單推進至訂單完成（退費完成終態）。一律全額退費（只要還未「開始諮詢」）；進入「諮詢中」後不可退。

**Spec 衝擊（依賴 refactor change）**：

- `Order.order_type` enum 新增 `諮詢`（線下 / 線上 / 諮詢）— 本 change 處理
- `Payment` 模型 MODIFY：原 `order_id` 必填 FK 改為 polymorphic（linked_entity_type / linked_entity_id），支援關聯 ConsultationRequest 或 Order — 本 change 處理（與 refactor change 協調）
- 新增 `OrderExtraCharge` 實體與「訂單其他費用明細」Requirement — 本 change 處理
- 修改「三方對帳檢視面板」算式：應收總額納入 OrderExtraCharge — 本 change MODIFY refactor change 此 Requirement
- 新增「Payment 跨實體轉移」Requirement（從 ConsultationRequest 到 Order，含 Invoice 與 PaymentInvoice junction）— 本 change 處理
- `Invoice` / `SalesAllowance` / `PaymentPlan` / `BillingCompany` 等實體沿用 refactor change，本 change MUST NOT 重複定義

**替代方案（已否決）**：

- (A) Payment 維持 order_id 必填、webhook 即建草稿諮詢訂單（前版設計）：否決，做大貨路徑下這張草稿訂單最終要作廢、語意冗餘；且需求單流失路徑要再建另一張訂單，邏輯不一致
- (B) OrderAdjustment(consultation_credit) 抵扣（更前版設計）：否決，三方對帳破洞、語意錯位
- (C) 諮詢費獨立費用不抵主訂單：否決，與業務承諾「諮詢費可抵」不符

**重要依賴**：本 change 必須在 refactor change **歸檔後或同時歸檔**。本 change 對 refactor change 的衝擊較大（Payment 模型 polymorphic 化），建議兩個 change 一起歸檔以同時 sync。

### D3：業務主管 gate 收斂為單一道「成交後審核」

選擇取消 v2.0 的「核可進議價」gate，新增「成交後業務主管審核 → 業務出報價單」gate。

理由：
- v2.0 設計的 gate 在「已評估成本 → 議價中」之間，但實務上業務評估完成本後通常直接跟客人開議。業務主管在這個時點被迫核可，等於在無新資訊下蓋章，淪為形式
- 真正需要業務主管把關的時點是「成交後 → 出報價單前」：此時報價單條件、付款條件、交期都已敲定，主管確認後才正式發給客人簽回。這跟「印章一蓋就外發」的真實節奏吻合
- 諮詢流程帶入後，從 ConsultationRequest 轉的需求單已有客人預付資訊，這個時點的成交審核更需要把關（含諮詢費抵扣金額確認）

翻轉影響：`add-sales-manager-quote-approval`（2026-04-27 歸檔）的核心 gate 設計被翻轉。在 proposal.md 已標記為 BREAKING。v2.0 既有欄位 `approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` 的語意要重新綁定（從議價前 gate 改為成交後 gate）。

替代方案：
- (A) 兩道 gate 都保留：否決，業務主管同案件動兩次手且職責混淆
- (B) `approval_required` 改為案件可選（不全強制）：否決，case-by-case 規則複雜、難維運

### D4：發票時間點由客人在表單 Q4 自選

選擇在表單蒐集階段就讓客人決定 `consultation_invoice_option` ∈ { `defer_to_main_order`, `issue_now` }，而非由業務在轉單時再決定。

理由：
- 發票時間點是稅務 / 會計議題，客人（特別是企業客）有自己的考量（合併開立 vs 即時開立）
- 業務在轉單時若要詢問客人，會多一次溝通往返
- surveycake 已有此題（Q4），順勢沿用

實作（依賴 refactor change 的 Invoice 開立邏輯）：
- `issue_now` → webhook 觸發後，系統於諮詢訂單上立即開立 Invoice（金額 = 諮詢費），後續做大貨時主訂單獨立開另一張 Invoice（金額 = 主訂單總額 - 諮詢費，因諮詢費已獨立開）
- `defer_to_main_order` → 諮詢訂單暫不開立 Invoice，等諮詢結束決定走向後再開：
  - 不做大貨 → 諮詢訂單推進至「已開發票」狀態時開立諮詢費 Invoice（單筆）
  - 做大貨 → 諮詢訂單作廢（不開諮詢費 Invoice）；主訂單應收總額已含諮詢費抵扣，主訂單上的 Invoice 涵蓋全額

### D5：表單入口維持外部 surveycake + webhook，不在本 change 內建表單

選擇繼續使用 surveycake 作為前端表單，透過 webhook 自動建 ConsultationRequest。

理由：
- surveycake 已上線使用、客人習慣已建立
- 內建表單需要 ERP 提供公開頁面、金流串接、表單編輯 UI 等，範圍超出本 change
- webhook 成本低、解耦好

未來路徑：若諮詢量大、需要更深整合（例如諮詢人員時段管理、自動排班），再開新 change 評估內建表單。

### D7：諮詢轉需求單的欄位帶入規則（OQ #1 已解 — 2026-05-06）

**決策**：諮詢結束選擇「轉需求單」時，依以下規則處理欄位帶入：

| 欄位類別 | ConsultationRequest 來源 | QuoteRequest 目的地 | 處理方式 |
|---------|--------------------------|---------------------|---------|
| 客戶資料 | customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension | 需求單客戶資料區 | 直接 mapping，唯讀 |
| 諮詢討論記錄 | consultation_topic（free text） | 需求單新增 `requirement_note` 欄位 | 直接 mapping，業務（即諮詢人員）可編輯 |
| 數量級距預填 | estimated_quantity_band | 印件項目 `quantity` 欄位（中間值預填） | 1-100 → 50；101-300 → 200；301-500 → 400；501-1000 → 750；1000+ → 1500（皆可業務手動調整） |
| 諮詢預約資訊 | reserved_date / reserved_time / visitor_count | 不帶入 | 已過期，不需要保留至需求單 |
| 印件規格細節 | （諮詢單不蒐集）| 印件規格欄位 | 由「需求確認中」狀態下業務（即諮詢人員）與客人交互填入 |
| 來源關聯 | consultation_request_id | `from_consultation_request_id` | 反向關聯，非空時詳情頁顯示「來自諮詢單」連結 |

**諮詢人員 = 需求單負責業務**（重要 nuance）：

諮詢人員轉需求單時，新建需求單的負責人（業務）SHALL 設定為當前諮詢人員（即原 `consultant_id`）。此設計反映「諮詢本身就是業務的一種」的真實工作模型 — 諮詢人員在諮詢中已建立客戶關係，轉需求單後繼續以業務身分跟進，不發生交接。

此決策同時部分回答 OQ #3：諮詢角色不是「業務之外的獨立角色」，而是業務角色在「客人主動發起 + 預付諮詢費」情境下的延伸。完整定位（是否諮詢專人 vs 業務兼任）仍待 OQ #3 解答。

**Spec 影響**：
- `quote-request` spec：新增 `requirement_note` 欄位（text、建立時可寫、進入「議價中」後鎖唯讀）
- `business-processes` spec：「諮詢轉需求單欄位帶入規則」（新增 Requirement，與既有「需求單轉訂單欄位帶入規則」對稱）
- `consultation-request` spec：「諮詢單轉需求單」Requirement 補入完整 mapping table（取代原 placeholder）

**不採取的方案**：
- 諮詢人員轉需求單前先填印件規格：否決，諮詢人員工作象限變得太重，且印件規格在諮詢中常需來回確認、不適合在諮詢結束點固定
- consultation_topic 帶入 negotiation_note：否決，negotiation_note 是議價語意，與諮詢討論語意混用會造成 ActivityLog 與 UI 區分困難

---

### D6：諮詢訂單與一般訂單在同一 Order 實體，以 order_type 區分；諮詢訂單只在「沒進大貨製作」收尾時建立

選擇 order_type 三值化（線下 / 線上 / 諮詢），而非為諮詢訂單新建獨立實體。諮詢訂單 SHALL 於以下三種「沒進大貨製作」收尾情境之一才建立：

1. 諮詢人員選「不做大貨」
2. 諮詢人員選「做大貨」、後續需求單流失（在議價中或更早任何狀態）
3. 待諮詢狀態取消（退費）

諮詢訂單在以上三種情境下都走相同的短路徑：建立 → 已開發票 → 訂單完成。

理由：
- 諮詢訂單有訂單編號、有金額、有發票、有客戶 — 跟一般訂單共用 80% 欄位，order_type 區分即可
- 客戶層面的「我這位客人有幾張訂單」需要統一檢視，分兩個實體會破壞此語意
- 諮詢訂單只在收尾時才建立，避免「webhook 即建草稿訂單」的多餘訂單狀態（前版設計問題：做大貨路徑下這張草稿訂單最終要作廢）
- 諮詢訂單建立的觸發場景統一為「最終沒進大貨」，符合「複用既有流程不增新流程」的原則

諮詢訂單狀態機（短路徑）：建立 → 已開發票 → 訂單完成（單一終態，三種收尾情境都走這條）。

替代方案：
- (A) ConsultationOrder 獨立實體：否決，破壞客戶帳務統一視圖
- (B) webhook 即建草稿諮詢訂單（前版設計）：否決，做大貨路徑下要作廢、多餘
- (C) 需求單流失另建新訂單類型：否決，違反「不增新流程」原則

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 業務主管 gate 翻轉導致 v2.0 已上線案件中途設計變更 | v2.0 才剛歸檔（2026-04-27），prototype 仍在建置中，未進入正式運行；本 change 視為 v2.0 的 iteration，不影響任何已存在的真實案件 |
| surveycake 表單欄位異動，webhook payload 結構不一致 | webhook handler 需有 schema 驗證 + alert；表單欄位變動要同步更新 ConsultationRequest 欄位 mapping（在 spec 中明定欄位對照表） |
| 諮詢費抵扣計算錯誤（重複抵扣、抵扣到錯訂單） | PaymentRecord 一旦關聯到一般訂單即不可再轉指；需有「轉指鎖定」狀態 |
| 客人 Q4 選 `issue_now` 但後來轉一般訂單，發票分兩張造成對帳混亂 | 客戶帳務頁面提供「同客戶同案件發票串連視圖」，訂單頁標示「諮詢費發票已獨立開立」 |
| 諮詢角色權限邊界不清，可能誤改其他需求單 | OQ #3 待解，user-roles spec 撰寫時敲定權限表 |
| 業務主管成交後審核變成新瓶頸（v2.0 議價前 gate 也是瓶頸風險，但時點不同） | 訂閱式通知（成交事件 → 主管 Slack 通知），審核 SLA 設 24h；prototype 階段先量測審核耗時，正式上線前評估是否需自動審核 fallback |

## Migration Plan

1. **Phase 1：建 spec + prototype**
   - 完成 6 份 spec（新建 1 + 修訂 5）
   - sens-erp-prototype 建 `src/components/consultation/`
   - 需求單 prototype 修改 gate UI（移除議價前、新增成交後）

2. **Phase 2：webhook 串接驗證**
   - 用 surveycake 測試表單 + 模擬金流 webhook payload
   - 驗證 ConsultationRequest 自動建立邏輯與欄位 mapping 正確性

3. **Phase 3：跨單據付款 mapping 驗證**
   - 情境驗證：諮詢費 1000 + 大貨 5000 = 訂單已付 1000、待繳 4000
   - 情境驗證：Q4 = issue_now → 兩張獨立發票
   - 情境驗證：Q4 = defer_to_main_order + 不做大貨 → 諮詢費發票（單筆）
   - 情境驗證：業務主管成交後審核通過 → 報價單外發 → 客人簽回 → 訂單建立

4. **歸檔後**
   - sync delta specs 進 main specs
   - 推送 [Notion Feature Database](https://www.notion.so/2823886511fa83d08c16815824afd2b7)（含新建諮詢單頁面）

**回滾策略**：本 change 為 spec-only 與 prototype 階段，無正式系統部署；若決策反悔，回滾 = 刪除 change directory，main specs 不受影響。

## Open Questions

| # | OQ | 狀態 | 必解時機 |
|---|----|------|---------|
| 1 | 諮詢單轉需求單時的欄位帶入規則：哪些欄位直接 mapping 進需求單、哪些重填、印件規格在諮詢時就釐清還是諮詢後才細化 | **已解（2026-05-06）見 D7** | — |
| 2 | 退款情境：客人付了諮詢費但無法諮詢（時間衝突、客人取消）時，ConsultationRequest 是否需「已取消 / 已退費」狀態、PaymentRecord refund 的資料結構 | **已解（2026-05-06）見 D2 「OQ #2 退費路徑」** | — |
| 3 | 諮詢角色定位：諮詢專人 vs 業務兼任、權限邊界（能否看其他需求單 / 訂單） | **已解（2026-05-06）見下方 OQ #3 解答** | — |
| 4 | 諮詢無法成案的時限：客人付款後遲遲未來諮詢，ConsultationRequest 何時自動結案；結案後諮詢費轉訂單金額（諮詢訂單）還是退款 | **已解（2026-05-06）：Phase 1 不實作自動結案，由業務人工判斷處理；Phase 2 視運營資料補規則** | — |
| 5 | estimated_quantity_band 校驗：表單 Q14 客人選的數量級距（如 101-300）跟轉需求單後實際印件數量不一致時要不要警示；諮詢費若有分級定價，校驗是否影響金額調整 | **已解（2026-05-06）：不校驗、不警示、不影響諮詢費。級距僅作為印件數量預填參考，業務轉需求單後可隨意調整；諮詢費為固定金額（不分級）** | — |

**注意**：OQ #1 / #2 / #3 已於 2026-05-06 解答完畢，內容已整合進 D2 / D7 與 user-roles spec。OQ #4 / #5 待後續 spec 撰寫時帶解。

---

## OQ #3 解答（2026-05-06）：諮詢角色定位

**組織編制**：諮詢人員為公司內獨立職位（專人專責），不是業務兼任。

**ERP 系統內權限**：與業務角色完全相同 — 可檢視全公司所有需求單 / 訂單，與業務在系統內無差別。`user-roles` spec 中「諮詢角色 SHALL 具備與業務角色相同的模組權限」維持不變。

**身分連續性（與 D7 整合）**：諮詢人員以 `consultant_id` 身分接諮詢單，諮詢結束「轉需求單」時，新建需求單的負責業務（owner）SHALL 直接設定為當前 `consultant_id`。系統內無「諮詢人員 → 業務」的角色切換動作；組織上他是諮詢職，但在每筆案件的生命週期內，諮詢人員 = 該案件的業務負責人，從諮詢一路跟到出貨完成。

**不採取的方案**：
- (A) 諮詢結束交接給其他業務：否決，破壞客戶關係連續性、增加交接成本
- (B) 諮詢人員只能看自己負責的諮詢單與後續案件：否決，與業務角色「可看所有」不對等、違反系統內權限一致性

**Spec 影響**（最小調整）：
- `user-roles` spec § 諮詢角色額外職責：補一條 Scenario 明確「轉需求單時 consultant_id 成為需求單 owner」
- `consultation-request` spec § 諮詢單轉需求單欄位帶入：補「需求單負責業務 = consultant_id」
