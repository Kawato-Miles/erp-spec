## Context

2026-05-08 需求單位於 [訂單模組 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567) 留下 26 條欄位備註，本 change 承接其中已收斂的調整（Track 1 + Track 2 + Track 3 已決議部分）。設計核心圍繞三個結構性問題：

1. **計價基準二元化**：線下單以未稅計價（公司營業額統計基礎）、線上單以含稅計價（EC 零售概念）。目前 spec 金額欄位單一含稅基準，無法支撐線下對帳。
2. **訂單階段印件編輯時機**：回簽前可自由修改規格 / 數量 / 報價；回簽後（已進入製作）的調整需走 OrderAdjustment 補收 / 退款流程。目前 spec 對「可編輯」沒有時機限制描述。
3. **線下訂單回簽推進路徑**：需求單位希望線下單上傳回簽檔案即自動推進為「已回簽」，比照 Ragic 行為，減少業務手動操作。

相依：
- 進行中 change：`add-after-sales-ticket`（影響 OrderAdjustment）、`extend-invoice-issuance-flexibility`（影響 Invoice）— 本 change 對 Invoice / OrderAdjustment 的補強需於三視角審查階段確認與兩者無衝突。
- [state-machines spec](../../specs/state-machines/spec.md)：訂單上層狀態機需補一條 transition。
- [business-processes spec](../../specs/business-processes/spec.md)：印件編輯時機判定邏輯需與「訂單異動」流程銜接。

## Goals / Non-Goals

**Goals:**
- 線下訂單能以未稅計價輸入，並由系統推算含稅；線上訂單反向。雙欄同步寫入，後續對帳 / 報表可依需要取用任一基準。
- 訂單階段印件規格 / 數量 / 報價的可編輯範圍以「是否已進入製作」為邊界，明確切換為 OrderAdjustment 流程。
- 線下單回簽檔案上傳成為訂單推進的觸發點之一，與業務手動點「確認回簽」並存（任一觸發即推進）。
- 將 26 條欄位備註中已收斂部分一次性對齊 spec，避免線下單上線時返工。
- Prototype mock data 與 UI 顯示同步調整，可立即驗證雙欄計價的 UX。

**Non-Goals:**
- 不重構既有 `_with_tax` 欄位名（保留向後相容）。
- 不處理 EC 訂單 case_name 生成規則（開為新 OQ）。
- 不處理跨訂單合併出貨資料模型（揀貨員工自行處理，不入系統）。
- 不擴充訂單類型 enum（月結 / 訂閱制不在 Phase 1 / 2 / 3）。
- 不處理 EC 會員附加欄位（登入方式 / 會員群組 / 員工身份）— 屬廠客 / EC CRM 模組界線。

## Decisions

### Decision 1：雙欄計價採「同時儲存兩個值」（Track 2 選項 A）

**選擇：** 每個金額欄位同時儲存 `_with_tax` 與 `_without_tax` 兩個值。Order 新增 `tax_amount` 獨立欄位記錄稅額（= total_with_tax − total_without_tax）。輸入端依 `order_source` 決定主欄；寫入時雙欄同時更新（由 BE / Prototype 計算邏輯保證一致性）。

**替代方案：**
- B. Order 加 `tax_mode` 標記欄位，金額欄位語意依此切換。問題：UI 要做 mode 切換邏輯，歷史資料轉檔（既有 `_with_tax` 全為含稅輸入）需要回填邏輯，報表查詢時無法不經換算取得未稅 / 含稅。
- C. 改中性欄位名（移除 `_with_tax` 後綴）+ 獨立 `tax_amount`。問題：欄位重命名影響範圍大（spec / mock data / Notion BRD），且與既有 `_with_tax` 命名慣例衝突。

**選 A 的理由：**
- 報表 / 對帳查詢可不經換算直接取用任一基準
- 既有 `_with_tax` 欄位完全保留，向後相容
- 雙欄同步寫入的一致性責任在寫入端（API / Prototype mutation），讀取端永遠安全
- Notion BRD 既有欄位清單只需「新增」未稅欄位 + `tax_amount`，不需重新組織

**雙欄關係（稅率 r，預設 r = 0.05）：**
```
with_tax = without_tax × (1 + r)
without_tax = with_tax / (1 + r)
tax_amount = with_tax − without_tax
```

**寫入規則：**
- 線下訂單：業務輸入未稅 → 系統計算含稅 → 同步寫入兩欄
- 線上訂單：EC 帶入含稅 → 系統反推未稅 → 同步寫入兩欄
- 折扣 / 紅利：建議與商品同基準輸入（線下未稅、線上含稅），系統反推另一基準

**邊界情況：**
- 退款 / 折讓金額：沿用同樣雙欄結構（SalesAllowance.allowance_amount 已是含稅基準，新增 `allowance_amount_without_tax`）
- OrderAdjustment.fee：同樣需雙欄
- Payment.amount：實際收款金額不需拆雙欄（含稅實收即為入帳金額）

### Decision 2：訂單階段印件編輯時機以「訂單狀態」為閘門

**選擇：** 印件規格（spec_note）/ 購買數量（pi_ordered_qty）/ 單位（unit）/ 難易度（difficulty_level）/ 報價單價的可編輯性，由 `Order.status` 決定：

| 狀態階段 | 可否編輯 | 處理路徑 |
|---------|---------|---------|
| 訂單已建立 → 報價待回簽 → 已回簽前 | 可自由編輯，直接更新欄位 | 直接 UPDATE 印件欄位 |
| 已回簽（含後續所有狀態，已取消除外） | 不可直接編輯，需走 OrderAdjustment | 業務開立 OrderAdjustment（type = 規格變更 / 數量追加 / 數量減少），業務主管核可後執行，系統同步更新印件欄位並建立補收 / 退款 Payment |

**替代方案：**
- B. 以「是否有工單建立」為閘門。問題：工單建立時間點晚於訂單確認，業務在「訂單確認 → 工單建立」之間仍會發生規格調整，此區間若已視為「需走 OrderAdjustment」會增加業務操作負擔。
- C. 加 `is_locked` 欄位由業務手動鎖定。問題：業務忘記鎖定會造成生產段被惡意改動，靠人為紀律不可靠。

**選 A 的理由：**
- 「已回簽」是訂單客戶確認的明確時間點，業務有清楚的心智模型
- OrderAdjustment 已是既有機制（refactor-order-adjustment-and-cleanup 已歸檔），複用即可
- 不增加新欄位，不增加狀態機節點

**「規格變更觸發 OrderAdjustment」與既有 OrderAdjustment.adjustment_type 對齊：**
- 數量追加 → 對應 `add-after-sales-ticket` 重定義 enum 中的「加印追加」
- 數量減少 → 對應「退印」
- 規格 / 單位 / 難易度變更 → 對應「規格變更」

> 完整 adjustment_type enum 8 值（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）定義於 `add-after-sales-ticket` change 的 `specs/order-management/spec.md` § OrderAdjustment.adjustment_type 完整 enum。本 change 在訂單期間建立的 OrderAdjustment SHALL 將 `linked_after_sales_ticket_id` 設為 NULL（區分於售後 ticket 內建立的關聯異動）。

### Decision 3：線下單回簽自動推進採「OR 觸發」設計

**選擇：** 線下單「報價待回簽 → 已回簽」狀態轉換的觸發條件擴充為兩個：
- (a) 業務手動點「確認回簽」按鈕（既有）
- (b) 業務於訂單詳情頁上傳回簽檔案至指定 file_role（新增）

兩者任一成立即推進，並寫入 `signed_at` = 觸發時間。

**替代方案：**
- B. 移除手動推進按鈕，僅靠檔案上傳。問題：客戶可能透過 email 回簽紙本，業務需手動標記；強制檔案上傳會增加業務不必要的負擔（如需先拍照存檔）。
- C. 上傳檔案後彈窗詢問「是否同時推進狀態？」。問題：增加一次操作，且若業務點「否」會造成檔案與狀態不一致。

**選 A 的理由：**
- 兩種推進路徑覆蓋線下實務（紙本 email 回簽 vs 數位回簽檔上傳）
- 上傳檔案的動作本身即表達業務意圖（拿到回簽憑證），自動推進降低操作成本
- 既有手動按鈕保留，業務心智模型不變

**回簽檔案的 file_role：** 在 Order 層新增 `OrderSignedFile` 子表，或於既有 `OrderAttachment`（如有）內以 `file_role = signed_quote` 區分。本 change 採新建 `OrderSignedFile` 子表，與後續其他訂單附件（折讓 / 收款）保持「每類附件一張子表」一致風格。

### Decision 4：附件多檔採「每實體一張子表」

**選擇：** 為三類訂單附件各建獨立子表：
- `SalesAllowanceFile`（折讓單回簽檔）
- `PaymentFile`（收款對帳檔）
- `OrderSignedFile`（訂單回簽檔，新增）

每張子表結構接近 `PrintItemFile`（id / 父實體 FK / filename / file_url / file_size_kb / file_type / uploaded_by / uploaded_at），不採 polymorphic 通用 OrderAttachment。

**替代方案：**
- B. 通用 OrderAttachment 子表，以 `linked_entity_type` + `linked_entity_id` polymorphic 區分。問題：失去 FK 約束、查詢需多一層 type 過濾、未來加新類型附件雖只改 enum 但 schema 易變得鬆散。
- C. 主表存 JSON 陣列。問題：失去 metadata 擴充能力（如未來補審核狀態 / 用印日期），無法做唯一性 / 大小總和約束。

**選 A 的理由：**
- 每張子表 schema 乾淨、FK 強約束
- 既有 PrintItemFile 已是「子表」風格，與本系統慣例一致
- 三類附件用途清晰且穩定，未來不會頻繁新增類型

### Decision 5：notes 拆三欄不做資料遷移自動分類

**選擇：** Order 現有 `notes` 欄位拆為 `customer_note` / `internal_note` / `production_note` 三欄。既有 `notes` 內容於 Prototype 階段不自動分類，由業務於 UI 上手動移轉（或於後續資料遷移腳本以「全部歸 internal_note」為預設）。

**理由：**
- Prototype 階段資料量少，Miles 可手動處理
- 自動分類無可靠規則（既有 notes 內容混雜三類用途）
- 若未來上線時資料量大，可在正式遷移腳本中加入「全部歸 internal_note」的安全預設

### Decision 6：Invoice Data Model 首次完整定義

**選擇：** 本 change 同時補完整 Invoice Data Model（spec 目前缺）。欄位以 Notion BRD § Section 5 為基準，加 `ezpay_invoice_url` derived 欄位，去除 `print_flag`。

**理由：**
- 既有 spec Requirement 已多次引用 Invoice 欄位（如 `Requirement: 發票開立`），但 Data Model 段未列；本 change 牽涉 Invoice 即藉機補上，避免後續 change 再次補
- `ezpay_invoice_url` 為衍生值（呼叫藍新 API 取得），不入持久化儲存，於 Prototype 以 mock URL 代替

### Decision 7：難易度 difficulty_level 訂單階段可覆寫的紀錄方式

**選擇：** PrintItem.difficulty_level 在訂單階段可覆寫；覆寫時記錄於 ActivityLog（既有機制），不新增 `difficulty_level_original` 欄位。

**替代方案：** 新增 `difficulty_level_original`（繼承來源值）+ `difficulty_level`（當前值）兩欄。問題：欄位翻倍，且查詢「是否被覆寫」可由 ActivityLog 推得，不需新欄位。

**選 A 的理由：**
- ActivityLog 已是稽核標準路徑（add-prepress-review 已建立模式）
- 業務需要時可從 ActivityLog 看出「誰、何時、從幾改到幾」

## Risks / Trade-offs

| 風險 | 緩解策略 |
|------|---------|
| 雙欄計價寫入端忘記同步兩欄，造成資料不一致 | Prototype 統一以 helper function 處理金額寫入（如 `setAmount(field, value, mode)` 自動算另一欄）；後端實作時以 hook / model 層強制兩欄同步 |
| 既有 mock data 全部以含稅輸入，需回填未稅 | Prototype tasks 中明列回填 script：對既有 `_with_tax` 反推 `_without_tax = _with_tax / 1.05`，rounding 至小數 0 位（與會計慣例一致） |
| OrderAdjustment 觸發條件變動（回簽後印件編輯均走 OrderAdjustment）可能增加業務心智負擔 | 在訂單詳情頁印件區於「回簽後」自動將「編輯」按鈕改為「申請異動」，UI 提示路徑變更原因；保留輕量訂正（如錯字）不觸發 OrderAdjustment 的例外規則需於後續 change 評估 |
| 線下單回簽檔案上傳自動推進，可能誤觸（業務上傳了非回簽檔案至同一上傳區） | OrderSignedFile 子表獨立於其他訂單附件區，UI 強制業務在「上傳回簽檔案」專屬入口操作，避免與其他附件混淆 |
| 與 `add-after-sales-ticket` 對 OrderAdjustment 的擴充有衝突 | 衝突檢查（2026-05-14）結論：無實質衝突。本 change 依賴的 adjustment_type（規格變更 / 數量追加 / 數量減少）已涵蓋於後者重定義的 8 值完整 enum；後者新增 `linked_after_sales_ticket_id` 為 nullable，訂單期間異動傳入 NULL 不影響既有流程；後者廢止 `adjustment_phase` 雙重身份不影響本 change 的「已回簽閘門」邏輯。雙欄計價對 OrderAdjustment.amount 的擴充與後者並行實作 |
| 與 `extend-invoice-issuance-flexibility` 對 Invoice 的擴充有衝突 | 該 change 目錄目前為空（2026-05-14），無內容可比對；後續若補上實質設計，於該 change 三視角審查階段再做衝突確認 |

## Migration Plan

1. **Spec 階段（本 change）**
   - 提交 proposal / design / specs / tasks
   - 三視角審查（senior-pm + ceo-reviewer + erp-consultant）
   - Miles 核可後進入實作

2. **Prototype 階段**
   - Schema：TypeScript type 補新欄位
   - Mock data：既有 Order / PrintItem / PaymentPlan / Invoice / SalesAllowance / Payment 補新欄位值；金額欄位回填未稅值
   - UI：Order 詳情頁金額區雙欄顯示邏輯；印件編輯按鈕依訂單狀態切換；回簽檔案上傳區
   - 驗證：以線下訂單範例與線上訂單範例分別跑通建立 → 報價 → 回簽 → 製作 → 異動 → 出貨流程

3. **Notion 同步階段（歸檔後）**
   - 將 spec 內容推回 Notion BRD § Section 1-6 欄位表
   - 在 Notion 對應討論串補解答留言並標 resolved
   - Follow-up DB 新增「線上單 case_name 規則」OQ

4. **Rollback**
   - OpenSpec change 可直接 archive --rollback（若三視角審查指出重大問題）
   - Prototype 改動以 git revert 處理

## Open Questions

- **ORD-XXX（待 oq-manage 流程編號）**：線上單 case_name 自動生成規則為何？候選：(a) EC 商品名 + 訂單日期、(b) EC 商品名 + 客戶名稱、(c) EC 訂單編號為案名、(d) 業務後續手動填寫
- **Phase 2 範疇外**：「輕量訂正（如錯字）不觸發 OrderAdjustment」的例外規則是否需要？若需要，閘門如何設計？（暫於本 change 不處理，由 Prototype UAT 收回饋）
