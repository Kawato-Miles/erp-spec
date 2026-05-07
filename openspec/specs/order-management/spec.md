## Purpose

訂單管理模組 -- 統一線上/線下訂單管理，支援多印件多工單結構，涵蓋訂單建立、印件管理、付款記錄、電子發票、出貨單管理全流程。
取代現有 EC + Ragic 雙平台組合。

**問題**：
- EC + Ragic 雙平台管理訂單，線上/線下資料結構不同無法互通
- EC 一訂單僅對應一張工單，無法支援「一訂單→多印件→各自多工單」
- 分批出貨無系統化統計與防呆，審稿兼任工單開立導致職責錯位

**目標**：
- 主要：建立統一訂單管理平台，支援線上/線下訂單，完成 EC + Ragic 系統轉換，支援多印件多工單結構
- 次要：建立 Dashboard / Forecast 的資料基礎

- 來源 BRD：[訂單 BRD](https://www.notion.so/32c3886511fa806bad41d755349b0567)（v0.5）
- Prototype：`sens-erp-prototype/src/components/order/`
- 相依模組：需求單（線下單轉入）、EC 平台（線上單）、工單管理、統一金流、第三方物流

---
## Requirements
### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）、(c) 依 ConsultationRequest 的 `consultation_invoice_option`（若 `issue_now` 則立即在主訂單上開立諮詢費 Invoice）。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下三種「沒進大貨製作」收尾情境之一才建立（webhook 階段不建）：

3. 諮詢結束 - 不做大貨：諮詢人員點擊「結束諮詢 - 不做大貨」時建立
4. 需求單流失：ConsultationRequest 狀態 = 已轉需求單、需求單流失時，系統自動建立諮詢訂單收尾
5. 待諮詢取消（退費）：業務點擊「取消諮詢」時建立

三種情境共同的建立動作：(a) 訂單金額 = 諮詢費，(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) 依 invoice_option 與是否退費決定 Invoice / SalesAllowance 處理（見 [consultation-request spec](../consultation-request/spec.md) § 諮詢費發票時間點處理）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 1000、印件費 = 4000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 1000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，主訂單 SHALL 立即開立諮詢費 Invoice（金額 = 1000）
- **AND** 主訂單三方對帳：應收 = 5000 = 已收 1000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單

- **WHEN** ConsultationRequest 諮詢結束選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 需求單流失觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 待諮詢取消觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment（amount = -諮詢費、payment_method = 退款）

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

---

### Requirement: 訂單確認觸發

系統 SHALL 支援訂單確認觸發：線下單 = 業務手動標記回簽（客戶回簽後）；線上單（含客製單）= 付款完成自動觸發（Phase 2，由 EC 同步）。

Prototype 補強：原實作為每個訂單狀態配一個手動推進按鈕，與[狀態機 spec](../../../../specs/state-machines/spec.md) 不符。修正為 OrderDetail SHALL 僅提供「確認回簽」與「取消訂單」兩個人工操作按鈕；審稿段之後的狀態推進（稿件未上傳 → 等待審稿 → 製作等待中 → ... → 訂單完成）SHALL 由下層模組 bubble-up 驅動。

#### Scenario: 線下單業務手動確認
- **WHEN** 客戶印回簽後，業務在訂單頁面標記「已回簽」
- **THEN** 訂單狀態從草稿轉為已確認

#### Scenario: US-ORD-001 回簽後訂單確認推進
- **WHEN** 客戶印回簽後，業務在訂單頁面手動點擊「標記回簽」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「訂單確認」；活動紀錄 MUST 記錄操作人、操作類型與時間戳

#### Scenario: 線下訂單確認回簽（正常路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」
- **AND** 訂單下有印件的 reviewStatus 不為「合格」且不為「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」推進至「稿件未上傳」

#### Scenario: 線下訂單確認回簽（免審稿快速路徑）

- **WHEN** 業務在 OrderDetail 點擊「確認回簽」
- **AND** 訂單下所有印件的 reviewStatus 皆為「合格」或「免審稿」
- **THEN** 訂單狀態 SHALL 從「報價待回簽」直接推進至「製作等待中」，跳過「稿件未上傳」與「等待審稿」

#### Scenario: 審稿段之後無手動推進按鈕

- **WHEN** 訂單狀態為「稿件未上傳」或之後的任何狀態
- **THEN** OrderDetail 頁面 MUST NOT 顯示狀態推進按鈕
- **AND** 狀態推進 SHALL 等待下層模組（印件審稿、工單、出貨）的 bubble-up 觸發

### Requirement: 多印件管理
系統 SHALL 支援 1 訂單 -> N 印件結構，區分打樣印件與大貨印件。業務/諮詢業務在建立印件時可設定「免審稿」，免審稿設定後審稿狀態直接為「合格」（主要場景：線下追加大貨）。

#### Scenario: 訂單包含多筆印件
- **WHEN** 訂單包含打樣印件與大貨印件
- **THEN** 系統分別管理各印件的審稿狀態、工單狀態、生產進度

#### Scenario: 業務設定免審稿印件
- **WHEN** 業務建立線下追加大貨印件並勾選「免審稿」
- **THEN** 系統將該印件審稿狀態直接設為「合格」，跳過審稿流程

### Requirement: 稿件上傳
系統 SHALL 提供統一的稿件上傳入口，打樣與大貨印件的稿件上傳在訂單管理頁的印件區塊操作。

#### Scenario: 業務上傳印件稿件
- **WHEN** 業務在訂單詳情頁的印件區塊上傳稿件
- **THEN** 系統儲存稿件並觸發對應的審稿流程（除非已設定免審稿）

### Requirement: 打樣決策點
系統 SHALL 支援打樣結果確認流程，業務取得打樣成品後與客戶確認，依據確認結果推進後續流程。

#### Scenario: US-PI-001 打樣結果確認 -- OK 進入大貨
- **WHEN** 業務取得打樣成品，與客戶確認結果為 OK
- **THEN** 系統 SHALL 將打樣印件標記為「打樣通過」，並允許業務觸發大貨生產流程

#### Scenario: US-PI-001 打樣結果確認 -- NG 製程問題重新打樣
- **WHEN** 業務取得打樣成品，與客戶確認結果為 NG（製程問題）
- **THEN** 系統 SHALL 允許業務發起「重新打樣」，建立新一輪打樣工單並推進對應流程

#### Scenario: US-PI-001 打樣結果確認 -- NG 稿件問題作廢重建
- **WHEN** 業務取得打樣成品，與客戶確認結果為 NG（稿件問題）
- **THEN** 系統 SHALL 將該打樣印件作廢，並允許業務重新建立印件與稿件上傳流程

### Requirement: 訂單狀態機
系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 訂單定義的規則進行狀態轉換，支援線下/線上 EC 訂單的完整狀態流程。

#### Scenario: 訂單完整生命週期
- **WHEN** 訂單從建立到完成經歷所有狀態
- **THEN** 狀態依序轉換：草稿 -> 已確認 -> 生產中 -> 出貨中 -> 已完成

### Requirement: 工單清單顯示
系統 SHALL 在訂單詳情頁顯示各印件對應的工單狀態，提供生產進度可見性。工單詳情連結至工單模組。

#### Scenario: 業務查看訂單生產進度
- **WHEN** 業務在訂單詳情頁查看工單區塊
- **THEN** 系統顯示各印件對應的工單清單與狀態，可點擊連結至工單詳情

### Requirement: 訂單取消流程
系統 SHALL 支援任何狀態均可取消訂單。取消後進入「已取消」終態（不可逆）。連動：所屬工單全數轉「取消」終態，所屬生產任務轉「報廢」。已完成報工數量 MUST 計算成本（不退回）。

#### Scenario: 業務取消進行中的訂單
- **WHEN** 業務在任何狀態下取消訂單
- **THEN** 訂單進入「已取消」終態；所屬工單自動轉「已取消」；生產任務轉「報廢」；已報工數量計入成本

#### Scenario: 取消後退款流程
- **WHEN** 已取消訂單需要退款
- **THEN** 系統啟動退款流程：退款申請 -> 退款處理中 -> 已退款（以 EC 狀態機為設計基準）

#### Scenario: US-ORD-002 訂單取消與 top-down 連鎖
- **WHEN** 業務點擊「取消訂單」
- **THEN** 訂單 SHALL 進入「已取消」終態（不可逆）；系統 MUST 自動執行 top-down 連鎖：工單全數轉「已取消」→ 任務全數轉「已作廢」→ 生產任務依當前狀態轉「已作廢」或「報廢」；退款流程 SHALL 依序推進：退款申請 → 退款處理中 → 已退款

### Requirement: 出貨單管理
系統 SHALL 支援分批出貨、多印件合併出貨，並實施木桶原則出貨防呆：出貨數 <= 印件層累計 QC 入庫數。

#### Scenario: 分批出貨
- **WHEN** 印件部分完成，業務建立第一批出貨單
- **THEN** 系統允許出貨數量不超過該印件已入庫數量，記錄累計已出貨量

#### Scenario: 出貨防呆攔截
- **WHEN** 出貨人員填入的出貨數量超過印件可出貨數量
- **THEN** 系統阻擋並提示「出貨數量不可超過可出貨數量（QC 入庫數 - 已出貨數）」

#### Scenario: US-SH-001 自行出貨完整流程
- **WHEN** 業務建立出貨單並選擇「自行出貨」方式，新增出貨明細
- **THEN** 出貨單 SHALL 依序推進狀態：備料打包完成 → 車輛出發出貨中 → 確認送達（已送達）；系統 MUST 支援合併出貨（多印件同一出貨單）及分批出貨（同印件多次出貨）

#### Scenario: US-SH-002 第三方物流出貨完整流程
- **WHEN** 業務建立出貨單並選擇「第三方物流」方式，完成備料打包後移交物流商
- **THEN** 系統 SHALL 透過 API 自動接收物流商狀態更新：運送中 → 已送達；物流異常時系統 MUST 通知業務介入處理

### Requirement: 訂單列表與分享權限
系統 SHALL 依角色限制訂單可見範圍：業務預設看自己的訂單；訂單管理人看全公司訂單。分享機制同需求單（授予他人檢視/編輯權限）。

#### Scenario: 業務查看自己的訂單
- **WHEN** 業務登入查看訂單列表
- **THEN** 系統僅顯示該業務為負責人或被授權的訂單

#### Scenario: 訂單管理人查看全公司訂單
- **WHEN** 訂單管理人登入查看訂單列表
- **THEN** 系統顯示全公司所有訂單

#### Scenario: US-ORD-005 訂單管理人全公司訂單檢視與篩選
- **WHEN** 訂單管理人登入系統後進入訂單列表
- **THEN** 系統 SHALL 預設顯示全公司所有訂單；系統 MUST 提供依業務負責人、訂單狀態、交期等條件篩選功能；業務角色登入時 SHALL 預設僅顯示自己負責的訂單

#### Scenario: US-ORD-004 訂單分享與代理授權
- **WHEN** 業務在訂單詳情頁進入「權限管理」Tab，搜尋同事並授予「檢視」或「編輯」權限
- **THEN** 被授權同事 SHALL 可依授予的權限等級存取該訂單；分享機制 MUST 與需求單權限管理機制一致

### Requirement: 活動紀錄
系統 SHALL 記錄訂單的所有操作歷程，供稽核與追溯。

#### Scenario: 查閱訂單活動紀錄
- **WHEN** 使用者在訂單詳情頁查看活動紀錄
- **THEN** 系統顯示完整的操作歷程，包含操作人、操作時間、操作內容

### Requirement: 印件預計產線

系統 SHALL 支援在印件層填寫「預計產線」，為多選欄位，記錄該印件預計涉及的產線。

#### Scenario: 印務為印件設定預計產線

- **WHEN** 印務在印件詳情頁填寫預計產線
- **THEN** 系統 SHALL 顯示所有產線供多選
- **AND** 選取結果 SHALL 儲存至 PrintItemExpectedLine junction

#### Scenario: 訂單印件清單顯示預計產線

- **WHEN** 使用者在訂單詳情頁查看印件清單
- **THEN** 每筆印件 SHALL 顯示其預計產線（以標籤形式呈現，多個並列）

#### Scenario: 印件總覽顯示預計產線

- **WHEN** 使用者在印件總覽查看印件列表
- **THEN** 系統 SHALL 顯示每筆印件的預計產線（以標籤形式呈現，多個並列）

### Requirement: 印件成品縮圖上傳

系統 SHALL 支援審稿人員為印件上傳成品縮圖。成品縮圖獨立於稿件檔案，代表最終成品的視覺呈現。

#### Scenario: 審稿人員上傳成品縮圖

- **WHEN** 審稿人員在印件詳情頁上傳成品縮圖
- **THEN** 系統 SHALL 儲存縮圖並更新 PrintItem.thumbnail_url
- **AND** 印件詳情頁與相關生產任務詳情頁 SHALL 顯示此縮圖

#### Scenario: 印件詳情顯示稿件與縮圖

- **WHEN** 使用者開啟印件詳情頁
- **THEN** 系統 SHALL 顯示稿件檔案列表（區分最終版與歷史版本）
- **AND** 系統 SHALL 在醒目位置顯示成品縮圖（若已上傳）

---

### Requirement: 成交轉訂單

系統 SHALL 支援從需求單一鍵轉訂單，自動帶入印件規格、客戶資料、交期。

#### Scenario: 需求單成交後建立訂單

- **WHEN** 業務在成交狀態的需求單點擊「建立訂單」
- **THEN** 系統 SHALL 建立新訂單，自動從 quote.printItems 映射為 OrderPrintItem[]
- **AND** 設定 quote.linkedOrderId = 新訂單 ID、quote.status = '成交'
- **AND** 新訂單狀態 SHALL 為「報價待回簽」
- **AND** 操作完成後導航至新訂單頁面

### Requirement: 訂單印件難易度繼承

訂單中每一筆印件 SHALL 具備 `difficulty_level` 欄位，值域 1-10。其值依訂單來源自動帶入：

- **B2B 訂單**（自需求單成交建立）：自對應需求單印件的 `difficulty_level` 繼承
- **B2C 訂單**（自 EC 商品下單建立）：自 EC 商品主檔的 `difficulty_level` 繼承
- **EC 商品主檔**：`difficulty_level` 由 EC 商品管理角色於商品建立時填寫，值域 1-10，必填

訂單印件 `difficulty_level` 本身於本 change 範疇內 SHALL **不**允許業務或其他角色於訂單層覆寫，以確保自動分配依據穩定。

#### Scenario: B2B 訂單印件繼承需求單難易度

- **GIVEN** 需求單印件 `difficulty_level = 7`
- **WHEN** 需求單成交轉為訂單
- **THEN** 訂單印件 SHALL 自動繼承 `difficulty_level = 7`

#### Scenario: B2C 訂單印件繼承商品主檔難易度

- **GIVEN** EC 商品主檔 `difficulty_level = 5`
- **WHEN** 會員下單成功並建立 B2C 訂單
- **THEN** 訂單印件 SHALL 自動繼承 `difficulty_level = 5`

#### Scenario: EC 商品主檔難易度必填

- **WHEN** EC 商品管理角色建立新商品
- **THEN** 系統 SHALL 要求輸入 `difficulty_level`（1-10）
- **AND** 未填寫時不可儲存為上架狀態

---

### Requirement: 訂單詳情頁印件補件入口

當訂單中的印件審稿維度狀態為「不合格」且訂單來源為 B2B 時，訂單詳情頁 SHALL 於該筆印件列表旁提供「補件」入口。業務 SHALL 可點選該入口上傳新的印件檔案，作為客戶端補件的代理操作。

業務 SHALL 僅能檢視到訂單層級，不可直接操作工單或生產任務。補件操作不可跨訂單範圍。

**本 change 新增**：補件入口 SHALL 顯示**歷史輪次 `review_note` 清單**，讓業務於補件前可參照審稿意見並轉達客戶。歷史清單內容與呈現方式對齊 [prepress-review spec § B2B 業務補件](../prepress-review/spec.md)。

#### Scenario: 不合格印件顯示補件入口

- **GIVEN** B2B 訂單中的印件 X 審稿維度狀態為「不合格」
- **WHEN** 業務進入該訂單詳情頁
- **THEN** 系統 SHALL 於印件 X 列顯示「補件」按鈕或入口

#### Scenario: 業務點選補件上傳檔案

- **WHEN** 業務點選印件 X 的「補件」入口
- **THEN** 系統 SHALL 彈出上傳元件
- **AND** 業務上傳檔案後，系統 SHALL 建立新的補件檔案紀錄
- **AND** 印件 X 審稿維度狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

#### Scenario: 非不合格狀態不顯示補件入口

- **WHEN** 印件審稿維度狀態不為「不合格」
- **THEN** 系統 SHALL **不**於訂單詳情頁顯示該印件的「補件」入口

#### Scenario: 補件入口顯示歷史審稿備註清單

- **WHEN** 業務點選印件 X 的「補件」入口
- **THEN** 系統 SHALL 於上傳元件同頁顯示**歷史輪次 `review_note` 清單**（最新在上）
- **AND** 清單 SHALL 含每輪 round_no、result、reject_reason_category、review_note 與時間
- **AND** 業務可參照清單修正或轉達客戶後再上傳補件

### Requirement: 印件 ReviewRound 整合

訂單印件 SHALL 與 `prepress-review` capability 定義的 ReviewRound 模型整合。

**PrintItem 層新增欄位**：
- `current_round_id`：FK ReviewRound（unique）。指向當前合格輪次，作為印件摘要呈現的單一指針。尚未合格時為 NULL。

**PrintItemFile 欄位調整**：
- 新增 `round_id`：FK ReviewRound
- 新增 `file_role`：enum（印件檔 / 縮圖；PI-003 定案兩值）
- 保留 `review_status` 但標為衍生值
- **移除** `is_final`：由 `PrintItem.current_round_id → Round → File` 指針鏈取代

印件詳情頁 SHALL 呈現所有歷史 ReviewRound（時間、輪次、審稿人員、結果、備註、當時的檔案），最新在上。印件摘要（訂單層呈現）SHALL 透過 `current_round_id` 指針查詢合格輪次的加工檔與縮圖。

#### Scenario: 印件詳情頁呈現歷史輪次

- **WHEN** 任一角色檢視訂單下的印件詳情頁
- **THEN** 系統 SHALL 列出該印件所有 ReviewRound 輪次
- **AND** 每一輪可展開檢視當時的原稿、加工檔、縮圖與結果

#### Scenario: 訂單層透過 current_round_id 呈現合格輪檔案

- **WHEN** 訂單詳情頁呈現印件摘要縮圖
- **THEN** 系統 SHALL 透過 `PrintItem.current_round_id → Round → File (file_role=縮圖)` 查詢顯示
- **AND** current_round_id 為 NULL 的印件 SHALL 顯示「待審稿」狀態而非舊輪檔案

#### Scenario: is_final 移除後既有查詢改由指針鏈

- **GIVEN** 本 change 上線前的既有印件已存在 PrintItemFile 紀錄
- **WHEN** 執行資料遷移
- **THEN** 系統 SHALL 為每個既有印件建立 `round_no = 1` 的 ReviewRound（result 依原 review_status 對應）
- **AND** 原 `is_final = TRUE` 的檔案綁入該 Round
- **AND** 若原 review_status = 合格，設 PrintItem.current_round_id 指向該 Round

### Requirement: B2C 會員上傳印件稿件備註

B2C 會員於 EC 前台上傳印件時 SHALL 可選擇性填寫 `client_note`，作為給審稿人員的稿件說明。EC 系統 SHALL 呼叫 ERP 介面將 `client_note` 隨印件一併回寫。

**欄位定義對齊** [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)：
- `client_note`：text（最長 500 字，非必填）
- 層級：印件 1:1，跟著印件走
- 方向：會員 → 審稿

**整合邊界**：EC 整合介面擴充與 `difficulty_level` 同路徑；本 change 僅規範 `client_note` 欄位語意與 Prototype demo，實際 EC API 欄位擴充由 EC 整合 change 處理。

#### Scenario: 會員於 EC 上傳印件附稿件備註

- **WHEN** 會員於 EC 下單頁上傳印件並填寫 `client_note`
- **THEN** EC 系統 SHALL 呼叫 ERP 補件 / 上傳介面，欄位含 `client_note`
- **AND** ERP SHALL 將 `client_note` 存至對應 PrintItem
- **AND** 審稿人員於工作台接收此印件時 SHALL 可見 `client_note` 內容

#### Scenario: 會員未填寫稿件備註仍可送出

- **WHEN** 會員於 EC 下單頁上傳印件但未填寫 `client_note`
- **THEN** 系統 SHALL 允許送出，PrintItem.client_note 存為 NULL

#### Scenario: 稿件備註超過字數上限被拒

- **WHEN** 會員填寫 `client_note` 超過 500 字
- **THEN** EC 前端 SHALL 於送出前顯示字數超出提示
- **AND** 若略過前端檢查直接呼叫 ERP API，ERP SHALL 於介面回應錯誤拒絕寫入

### Requirement: 訂單詳情頁 Tabs 化版型

訂單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 訂單編號（標題）
- 訂單狀態 Badge（沿用既有 `OrderStatusBadge`）
- 主動作群（依訂單狀態條件顯示：B2C 前台 Demo / 確認回簽 / 變更路徑導引 Tooltip / 取消訂單）

訂單詳情頁 SHALL 包含 6 個 Tab，順序：`資訊（首位，defaultValue）→ 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄`。

「資訊」Tab 為 [refactor-detail-pages-to-subheader-tab-layout](../../changes/archive/) 新增 Tab，SHALL 承載原 Tabs 之上資訊區的 5 張資訊卡：訂單資訊 / 金額及付款狀態 / 發票設定（條件顯示）/ 物流設定（條件顯示）/ 客戶資訊。5 張卡 SHALL 在「資訊」Tab 內依此順序單欄垂直排列（移除既有 `grid grid-cols-[1fr_380px]` 兩欄佈局），各自保留 rounded card 邊框（`rounded-xl border border-[#e3e4e5] bg-white`）。

「發票設定」卡 SHALL 在 `order.invoiceEnabled === true` 時顯示，否則隱藏。「物流設定」卡 SHALL 在 `order.shippingMethod` 不為空時顯示，否則隱藏。

#### Scenario: 業務進入訂單詳情頁預設停留資訊 Tab

- **WHEN** 業務從訂單列表點擊訂單編號進入訂單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 依序顯示訂單資訊 → 金額及付款狀態 → 發票設定（條件）→ 物流設定（條件）→ 客戶資訊 5 張卡
- **AND** 5 張卡 SHALL 為單欄垂直排列（不採兩欄 grid 佈局）

#### Scenario: 訂單詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽訂單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）

#### Scenario: 訂單詳情頁資訊區重組

- **WHEN** 業務進入訂單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「訂單資訊」「金額及付款狀態」「發票設定」「物流設定」「客戶資訊」5 張卡
- **AND** 5 張卡 SHALL 在「資訊」Tab 內呈現

#### Scenario: 訂單發票 / 物流卡條件顯示

- **WHEN** 訂單 `order.invoiceEnabled === false`
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「發票設定」卡

- **WHEN** 訂單 `order.shippingMethod` 為空
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「物流設定」卡

#### Scenario: 訂單 ErpPageHeader 主動作維持

- **WHEN** 業務查看訂單詳情頁
- **THEN** `ErpPageHeader` 右側 SHALL 顯示「B2C 前台 Demo」按鈕（恆顯示）
- **AND** 訂單狀態為「報價待回簽」時 SHALL 顯示「確認回簽」按鈕
- **AND** 訂單狀態非「已取消」、非「訂單完成」時 SHALL 顯示「變更路徑導引」Tooltip + 「取消訂單」按鈕
- **AND** 主動作 SHALL NOT 移至 Tab 內或下放至其他位置

---

### Requirement: 訂單業務主管審核欄位

Order 資料模型 SHALL 新增以下業務主管審核相關欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK->使用者；訂單建立時指派、進入「報價待回簽」後鎖定（僅 Supervisor 可解鎖） |
| 是否需審核 | approval_required | boolean | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | text(500) | | | 從來源 QuoteRequest 帶入；業務主管於審核時查看作為決策依據；進入「報價待回簽」後鎖定 |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | text(500) | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續若訂單退回需重審時的條件對照 |

`approved_by_sales_manager_id` 欄位的可選範圍 MUST 限定為具業務主管角色的用戶。

#### Scenario: 線下訂單建立時自動指派業務主管

- **WHEN** 業務於需求單成交後點擊「轉訂單」建立線下訂單
- **THEN** 系統 SHALL 自動將 `approved_by_sales_manager_id` 設為預設業務主管（Phase 1 第一位）
- **AND** 系統 SHALL 將 `approval_required` 設為 `true`
- **AND** 系統 SHALL 將來源需求單的 `payment_terms_note` 內容寫入訂單同名欄位
- **AND** 系統 SHALL 將 `lastApprovedPaymentTermsNote` 預設為 `null`

#### Scenario: 進入報價待回簽後業務主管欄位鎖定

- **GIVEN** 訂單狀態為「報價待回簽」或更後狀態
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `approved_by_sales_manager_id`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀
- **AND** 此規則 MUST NOT 限制 Supervisor 的解鎖權限（見 § Supervisor 重新指定訂單業務主管）

---

### Requirement: 業務主管核准訂單

線下訂單從「待業務主管審核」推進至「報價待回簽」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，訂單維持「待業務主管審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行；本 Requirement MUST NOT 提供「退回討論」按鈕（避免 ERP 內 / Slack 內雙軌討論造成資訊分散）。

業務主管核准時 MUST：
- 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`（快照）
- 寫入 OrderActivityLog（事件描述 = 「核准訂單（成交條件審核）」）
- 將訂單狀態推進至「報價待回簽」

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: 業務主管核准訂單

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`、`payment_terms_note` 非空
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准訂單（成交條件審核）」）
- **AND** 業務 SHALL 看到「外發報價單」相關動作可推進

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 訂單狀態為「待業務主管審核」、`payment_terms_note` 為空
- **WHEN** 業務主管點擊「核准訂單」
- **THEN** UI MUST 跳出 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核准訂單（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，訂單狀態 MUST 維持「待業務主管審核」

#### Scenario: 業務主管不核准透過 Slack thread 溝通

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 業務主管認為需重新討論收款條件或成交條件
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過 Slack thread 與業務直接討論
- **AND** 訂單狀態 MUST 維持「待業務主管審核」直到業務主管核准

#### Scenario: 業務不可從待業務主管審核直接推進至報價待回簽

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟訂單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准訂單」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「報價待回簽」 MUST 回傳權限不足錯誤

#### Scenario: 非指定業務主管不可核准

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於訂單詳情頁點擊「核准訂單」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 該訂單 MUST NOT 出現在當前業務主管的「訂單審核」待辦清單

---

### Requirement: 業務主管於訂單模組的資料可見範圍

業務主管 SHALL 於訂單模組的可見範圍依頁面區分：

| 頁面 | 業務主管可見範圍 |
|------|----------------|
| 訂單列表頁（`/orders`）| 所有訂單（提供部門總覽能力）|
| 訂單審核待辦頁（`/sales-manager/approvals`）| `approved_by_sales_manager_id = self` AND `status ∈ {待業務主管審核, 報價待回簽, 已回簽, 已取消}` |
| 訂單詳情頁（`/orders/{id}`）| 所有訂單可瀏覽；「核准訂單」按鈕僅在 `approved_by_sales_manager_id = self` 時顯示 |

預設篩選 `status = 待業務主管審核`，按進入時間 ASC 排序（最久優先）。

#### Scenario: 業務主管於訂單審核頁僅見自己被指派的訂單

- **GIVEN** 訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管登入並開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 在審核清單中顯示此訂單

#### Scenario: 業務主管於訂單列表頁可見全部

- **WHEN** 業務主管登入並開啟 `/orders`
- **THEN** 列表 SHALL 顯示所有訂單（含其他業務主管被指定、含未進入審核的訂單）
- **AND** 業務主管點開非自己被指定的訂單詳情頁，MUST NOT 顯示「核准訂單」按鈕

---

### Requirement: Supervisor 重新指定訂單業務主管

Supervisor SHALL 擁有「解鎖並重新指定訂單 `approved_by_sales_manager_id`」的權限，作為業務主管離職 / 請假 / 異動時的 Phase 1 處理機制，避免訂單卡在「待業務主管審核」狀態。

此操作 MUST 寫入 OrderActivityLog 記錄解鎖動作（操作者 = Supervisor、舊業務主管、新業務主管、解鎖原因 free text 必填）。新業務主管 MUST 為具業務主管角色的用戶。

#### Scenario: Supervisor 重新指定訂單業務主管

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 原指定業務主管因離職 / 請假 / 異動無法核准
- **WHEN** Supervisor 於訂單詳情頁執行「重新指定業務主管」並填寫解鎖原因
- **THEN** 系統 SHALL 允許 Supervisor 變更 `approved_by_sales_manager_id`
- **AND** 新業務主管 MUST 為具業務主管角色的用戶
- **AND** 系統 MUST 寫入 OrderActivityLog（操作者 = Supervisor、事件描述 = 「重新指定訂單業務主管」、舊值、新值、原因）
- **AND** 新業務主管 SHALL 於自己的訂單審核待辦頁看到此訂單

#### Scenario: 一般使用者不可重新指定訂單業務主管

- **WHEN** 業務、業務主管、印務主管或其他非 Supervisor 角色嘗試執行「重新指定訂單業務主管」
- **THEN** 系統 MUST NOT 顯示此操作入口
- **AND** 任何 API 請求嘗試變更 `approved_by_sales_manager_id` MUST 回傳權限不足錯誤

### Requirement: 帳務公司管理（BillingCompany）

系統 SHALL 維護 BillingCompany 主檔，每個 BillingCompany 對應一個藍新（NewebPay / ezPay）商店帳號（ezpay_merchant_id）。系統管理員可新增、停用 BillingCompany；業務 / 諮詢 / 會計僅可讀取，於需求單 / 訂單建立時選用。BillingCompany.ezpay_merchant_id MUST 唯一，避免兩家公司共用同一商店代號（會違反藍新 MerchantOrderNo 不可重覆規則）。同時間 SHALL 僅允許一筆 is_default = true。

#### Scenario: 系統管理員建立帳務公司

- **WHEN** 系統管理員於後台新增 BillingCompany
- **THEN** 系統 SHALL 寫入 BillingCompany 主檔，要求填入 name、tax_id、ezpay_merchant_id、address、phone
- **AND** 系統 MUST 驗證 ezpay_merchant_id 唯一性

#### Scenario: 業務於需求單下拉選擇帳務公司

- **WHEN** 業務於需求單編輯頁開啟帳務公司下拉
- **THEN** 系統 SHALL 僅顯示 is_active = true 的 BillingCompany
- **AND** 預設值 SHALL 為 is_default = true 的那筆

### Requirement: 付款計畫建立（PaymentPlan）

業務 / 諮詢 SHALL 於訂單成立後（狀態 = 報價待回簽 或 訂單確認）建立付款計畫，定義一個訂單分成 N 期收款的金額與時程。每筆 PaymentPlan 紀錄期別、描述、預定金額、預計收款日。建立時各期金額合計 MUST = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)；若不等系統 SHALL 顯示差額提示。

#### Scenario: 業務建立兩期付款計畫

- **WHEN** 業務於訂單詳情頁點擊「建立付款計畫」，新增「訂金 30%」「尾款 70%」兩期
- **THEN** 系統 SHALL 建立兩筆 PaymentPlan 紀錄（installment_no = 1, 2）
- **AND** 系統 MUST 驗證兩期合計 = 訂單應收總額

#### Scenario: 付款計畫合計與應收總額不符的提示

- **WHEN** 業務輸入的各期合計 ≠ 訂單應收總額
- **THEN** 系統 SHALL 顯示警告「合計金額與應收總額差 X 元」
- **AND** 系統 SHALL 拒絕儲存，要求業務調整

### Requirement: 付款計畫變更觸發訂單回業務主管審核

業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到「業務主管審核」狀態（沿用 [add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 機制）。業務主管未核可前訂單不得進入後續狀態。

#### Scenario: 業務修改尾款日期觸發回審

- **GIVEN** 訂單付款計畫已建立且訂單已過業務主管審核
- **WHEN** 業務修改 PaymentPlan #2 的 scheduled_date
- **THEN** 系統 SHALL 將訂單狀態回退至「業務主管審核」
- **AND** 系統 MUST 在活動紀錄記載「付款計畫變更，回業務主管審核」

#### Scenario: 業務主管核可付款計畫變更

- **GIVEN** 訂單因付款計畫變更回到「業務主管審核」狀態
- **WHEN** 業務主管於訂單詳情頁核可
- **THEN** 訂單 SHALL 推進至原付款計畫變更前的後續狀態

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

**Payment polymorphic 關聯設計（本 change MODIFY refactor change 設計）**：

Payment 的關聯目標 SHALL 為 polymorphic，支援關聯 ConsultationRequest 或 Order：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `linked_entity_type` | enum: `ConsultationRequest` / `Order` | Payment 關聯的實體類型 |
| `linked_entity_id` | UUID | 依 `linked_entity_type` 指向 ConsultationRequest 或 Order 主鍵 |
| `is_transferred` | boolean | 是否已從 ConsultationRequest 轉移過至 Order（一次性轉移完成標記）|
| `original_entity_type` / `original_entity_id` | optional | 若 is_transferred = true，紀錄原始關聯（保留歷史） |

`linked_entity_type = ConsultationRequest` 僅出現在「諮詢費 webhook 自動建立的 Payment 尚未轉移至訂單」的中間態。一旦轉移至 Order（諮詢結束或需求單流失或諮詢取消觸發），`is_transferred` 設為 true，後續不可再次轉移。

`linked_entity_type = Order` 為一般情境（refactor change 原設計皆涵蓋）。

退款 Payment 的 `linked_entity_type` 一律為 `Order`（諮詢取消情境下退款 Payment 直接建在新建的諮詢訂單上）。

#### Scenario: 業務記錄訂金收款

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 建立 Payment 紀錄（linked_entity_type = Order、linked_entity_id = 訂單 ID）
- **AND** 業務 MUST 填入金額、付款方式、收款時間、可選填第三方付款序號

#### Scenario: 諮詢費 webhook 建立的 Payment 關聯 ConsultationRequest

- **GIVEN** webhook 觸發、ConsultationRequest 已建立
- **WHEN** 系統建立諮詢費 Payment
- **THEN** Payment.linked_entity_type SHALL = `ConsultationRequest`
- **AND** Payment.linked_entity_id SHALL = consultation_request_id
- **AND** Payment.is_transferred SHALL = false

#### Scenario: PaymentPlan 期次狀態自動更新

- **WHEN** 某 PaymentPlan 的累計 Payment 金額 = scheduled_amount
- **THEN** 系統 SHALL 自動更新 PaymentPlan.status = 已收訖

---

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與 PaymentPlan / Payment 解耦：可先開後收、後收先開、合併（多筆 Payment 對一張 Invoice）、拆分（一筆 Payment 對多張 Invoice）。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立

#### Scenario: 業務拆分一筆收款開兩張發票

- **GIVEN** 訂單有一筆 Payment 100,000
- **WHEN** 業務開立兩張 Invoice 各 50,000，於 PaymentInvoice junction 各關聯該 Payment 50,000
- **THEN** 系統 SHALL 允許並驗證 ∑(PaymentInvoice.amount where payment_id = X) ≤ Payment.amount

#### Scenario: 業務合併多筆收款開一張發票

- **GIVEN** 訂單有 Payment #1 = 30,000、Payment #2 = 70,000
- **WHEN** 業務開立 Invoice = 100,000，於 PaymentInvoice junction 各關聯一筆
- **THEN** 系統 SHALL 允許並寫入兩筆 PaymentInvoice 紀錄

#### Scenario: 業務先開發票後收款

- **WHEN** 業務於 Payment 為空時開立 Invoice
- **THEN** 系統 SHALL 允許，PaymentInvoice 暫無記錄
- **AND** 後續 Payment 建立時，業務 SHALL 可手動關聯到該 Invoice

### Requirement: 發票作廢

業務 / 諮詢 SHALL 可於訂單詳情頁作廢已開立的發票，不需業務主管 / 會計核可。作廢時必填作廢原因（限中文 6 字或英文 20 字，對應藍新 InvalidReason 限制）。發票字軌號碼作廢後不可重用，重新開新發票時 ezpay_merchant_order_no 流水號 +1。系統 SHALL 在活動紀錄記載作廢動作（誰、何時、原因）。

#### Scenario: 業務作廢統編打錯的發票

- **GIVEN** 業務開立 Invoice 時誤填客戶統編
- **WHEN** 業務於發票清單點擊「作廢」並填入原因「統編錯誤」
- **THEN** 系統 SHALL 更新 Invoice.status = 作廢、invalid_reason、invalid_at、invalid_by
- **AND** 系統 MUST 在訂單活動紀錄記載作廢

#### Scenario: 業務作廢後重新開立新發票

- **GIVEN** Invoice #1 已作廢（ezpay_merchant_order_no = O-25050601-INV-01）
- **WHEN** 業務開立新 Invoice
- **THEN** 系統 SHALL 產生新 ezpay_merchant_order_no = O-25050601-INV-02（流水 +1，不重用）

### Requirement: Invoice 折讓衍生標籤（derived，不入狀態機）

Invoice 自身狀態機只有「開立 / 作廢」兩態，**折讓資訊不入發票狀態機**，改以 derived 衍生標籤呈現於 UI。系統 SHALL 即時計算每張發票的折讓衍生屬性，於發票清單與發票詳情頁顯示。

**衍生欄位算法**：

```
folded = ∑ SalesAllowance.|allowance_amount|
         where invoice_id = X AND status = 已確認

remaining = invoice.total_amount - folded

折讓衍生標籤：
  if invoice.status = 作廢                     → 顯示「－」（不適用）
  elif folded = 0                              → 顯示「無折讓」
  elif 0 < folded < total_amount               → 顯示「已部分折讓 -{folded}」
  elif folded = total_amount                   → 顯示「已完全折讓」
```

**為什麼不入狀態機**：
- 折讓金額是 ∑ SalesAllowance 累計算出，重複進 Invoice.status 會造成同步問題（SalesAllowance 變動要回頭改 Invoice）
- 一張發票可被多次折讓 / 作廢折讓，狀態回退邏輯複雜
- 業界（SAP / NetSuite / Oracle）做法一致：發票狀態只記 issued / void，credited 是 derived

#### Scenario: 發票清單顯示折讓衍生標籤

- **WHEN** 業務 / 會計於訂單詳情頁查看發票清單
- **THEN** 每張發票 SHALL 顯示三欄：對帳編號 / 發票號碼 / 金額 / 狀態 badge / 折讓衍生標籤
- **AND** 折讓衍生標籤 SHALL 依即時計算結果呈現「無折讓 / 已部分折讓 -X,XXX / 已完全折讓 / －（作廢）」

#### Scenario: 發票詳情頁顯示折讓累計

- **WHEN** 業務 / 會計開啟發票詳情頁
- **THEN** 系統 SHALL 顯示：發票金額（total_amount）、折讓累計（folded，已確認折讓合計）、剩餘可折讓金額（remaining）、折讓記錄清單
- **AND** 折讓累計 SHALL 排除 status = 已作廢 的 SalesAllowance

#### Scenario: 折讓變動後衍生標籤即時更新

- **GIVEN** Invoice = 100,000，已有 SalesAllowance #1 = -10,000（已確認）
- **WHEN** 業務作廢 SalesAllowance #1（status → 已作廢）
- **THEN** 折讓衍生標籤 SHALL 從「已部分折讓 -10,000」變回「無折讓」
- **AND** 剩餘可折讓金額 SHALL 從 90,000 回到 100,000

### Requirement: 折讓單（SalesAllowance）建立、確認、作廢

業務 / 諮詢 SHALL 可於已開立發票的詳情頁建立折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條），用於發票已開後不能整張作廢時，附加在原發票上的部分減額憑證。折讓單建立不需業務主管核可。折讓金額 MUST 為負數且絕對值 MUST ≤ 該發票尚未折讓的剩餘金額（即原發票金額 - 已確認折讓累計）。折讓建立時系統 SHALL 呼叫藍新（Mockup）兩段式流程：開立折讓 → 觸發確認折讓，狀態直接寫入「已確認」。已確認折讓可作廢（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立），作廢後該筆 SalesAllowance.status = 已作廢，發票剩餘可折讓金額回到作廢前狀態。一張發票 SHALL 可建立多筆折讓單，直到累計金額 = 原發票金額（已完全折讓）。

#### Scenario: 業務開立折讓單

- **WHEN** 業務於 Invoice = 100,000 詳情頁點擊「開立折讓」，填入金額 -10,000、原因「品質投訴」
- **THEN** 系統 SHALL 建立 SalesAllowance 紀錄、Mockup 產生 ezpay_allowance_no（A + 14 碼數字）
- **AND** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API，status 直接寫入「已確認」（不停留於草稿）
- **AND** Mockup 回傳 RemainAmt = 90,000（折讓後發票剩餘）

#### Scenario: 折讓金額超過剩餘可折讓金額被擋

- **GIVEN** Invoice = 100,000 已有 SalesAllowance #1 = -50,000（已確認）
- **WHEN** 業務嘗試開立 SalesAllowance #2 = -60,000
- **THEN** 系統 SHALL 拒絕並提示「折讓金額不可超過發票剩餘 50,000」

#### Scenario: 折讓限負數防呆

- **WHEN** 業務於折讓金額欄位輸入正數或零
- **THEN** 系統 SHALL 拒絕並提示「折讓金額必須為負數」

#### Scenario: 業務作廢已確認的折讓

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務點擊「作廢折讓」並填入原因
- **THEN** 系統 SHALL 更新 SalesAllowance.status = 已作廢，發票回到折讓前狀態
- **AND** Mockup 呼叫 allowanceInvalid API

### Requirement: 退款 Payment 與折讓分離（先記退款，再開折讓）

退款 Payment 與 SalesAllowance 為**分離設計**，符合業界會計分離原則（Credit Memo 與 Refund 分軸）。實務流程：(1) 業務 / 諮詢先在訂單詳情頁建立退款 Payment（payment_method = 「退款」、amount 為負數）；(2) 視情境決定後續：(a) 已開立發票且需保留發票 → 開立 SalesAllowance 並手動關聯 refund_payment_id；(b) 發票錯誤可作廢 → 作廢原發票重開（refund_payment_id 不需關聯到 SalesAllowance）。系統 SHALL NOT 在折讓建立時自動建立 Payment。

#### Scenario: 業務先建退款 Payment 再開折讓

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先於訂單詳情頁建立 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -10,000、reason = 品質瑕疵）
- **THEN** SalesAllowance.refund_payment_id SHALL 由業務手動關聯該退款 Payment
- **AND** Activity log MUST 分別記載 Payment 建立與 SalesAllowance 開立
- **AND** 系統 SHALL NOT 自動建立任何 Payment

#### Scenario: 業務先建退款後決定走作廢重開

- **GIVEN** Invoice #1 = 100,000 已開立但金額誤填
- **WHEN** 業務先建立 Payment（amount = -100,000、payment_method = 退款）
- **AND** 業務作廢 Invoice #1，重新開立 Invoice #2（金額正確）
- **THEN** 系統 SHALL 接受兩個獨立動作（退款 Payment、作廢 Invoice）
- **AND** SalesAllowance 不需建立

#### Scenario: 對帳檢視面板分桶顯示收款與退款

- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** Payment 區段 SHALL 分兩桶顯示：
- **AND** 一般收款（payment_method ≠ 退款）：累計正項
- **AND** 退款（payment_method = 退款）：累計負項
- **AND** 收款淨額 SHALL = 一般收款 - |退款|

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

#### Scenario: 業務建立加印追加異動

- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁建立 OrderAdjustment
- **THEN** 系統 SHALL 要求業務填入 adjustment_type（加印追加）、amount（如 +20,000）、reason
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務主管核可訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務執行已核可的訂單異動

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行（終態）
- **AND** 訂單應收總額 MUST 更新（Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動

#### Scenario: 訂單異動不阻擋主訂單推進

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

語意更新（vs refactor change）：原算式 `應收總額 = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)` 修訂為 `應收總額 = ∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`。`Order.total_with_tax` 為衍生欄位（從印件費與 OrderExtraCharge 計算而來）。

收款淨額算式同步調整以匹配 Payment polymorphic 設計（只計算當前訂單的 Payment，不計入 ConsultationRequest 上的 Payment）。

#### Scenario: 諮詢來源主訂單對帳通過

- **GIVEN** 主訂單印件費 4000、OrderExtraCharge(consultation_fee, 1000) = 1000、無其他 OrderAdjustment
- **AND** Payment 累計（綁主訂單）= 5000（諮詢費轉移 Payment 1000 + 後續補繳 Payment 4000）
- **AND** Invoice 累計開立 = 5000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 5000，發票淨額 SHALL = 5000，收款淨額 SHALL = 5000，差額 SHALL = 0
- **AND** 面板 SHALL 標記「對帳通過」

#### Scenario: 諮詢訂單對帳通過（不做大貨情境）

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、無印件費、無 OrderAdjustment
- **AND** Payment 綁諮詢訂單 = 1000、Invoice = 1000
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票 = 1000、收款 = 1000、差額 = 0

#### Scenario: 諮詢訂單退費對帳通過

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、issue_now 路徑
- **AND** Payment 綁諮詢訂單：諮詢費 1000 + 退款 -1000 = 0
- **AND** Invoice 1000 + SalesAllowance -1000，發票淨額 = 0
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票淨額 = 0、收款淨額 = 0、差額 = 1000

**註**：此情境差額 = 1000 反映「應收沒沖銷」，但實務上退費完成的諮詢訂單視為合法終態。對帳面板 SHALL 標示「退費完成（OrderExtraCharge 與 SalesAllowance / 退款抵銷）」而非「對帳通過」（細節見「諮詢取消對帳邏輯」ADDED Requirement）。

#### Scenario: 訂單異動 + 折讓退款的三方對帳

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000、開立發票合計 25,000、確認折讓 -10,000、收款合計 25,000、退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000（5000 + 20,000）、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

---

### Requirement: 會計批次對帳檢視

會計 SHALL 可於後台「對帳檢視」頁批次查詢訂單，依 BillingCompany、開立期間、狀態（對帳通過 / 待對帳）篩選，並匯出對帳清單（含 ERP 訂單編號、藍新 InvoiceTransNo、InvoiceNumber、AllowanceNo、三方金額、差額）供藍新後台對帳使用。

#### Scenario: 會計依帳務公司與期間批次查詢

- **WHEN** 會計於「對帳檢視」頁選擇 BillingCompany = 森紙公司、期間 = 2026-04
- **THEN** 系統 SHALL 列出該期間該帳務公司所有訂單對帳狀態
- **AND** 業務 / 會計 SHALL 可勾選「僅顯示差額 ≠ 0」篩選待對帳訂單

#### Scenario: 會計匯出對帳清單

- **WHEN** 會計於對帳清單點擊「匯出」
- **THEN** 系統 SHALL 匯出 CSV 含 ERP 訂單編號、藍新 ezpay_merchant_order_no、InvoiceTransNo、InvoiceNumber、ezpay_allowance_no、應收 / 發票 / 收款 / 差額

### Requirement: 業務一鍵開發票（user story）

業務 / 諮詢 SHALL 可於訂單詳情頁付款區塊點擊「一鍵開發票」，系統自動帶入買受人資訊（從客戶資料）、訂單金額、商品明細（從訂單印件）。業務確認 / 微調後送出。此為效率優化，不取代手動建立發票流程。

#### Scenario: 業務於訂單詳情頁一鍵開發票

- **WHEN** 業務於訂單詳情頁的「發票」區塊點擊「一鍵開發票」
- **THEN** 系統 SHALL 開啟發票表單，自動帶入買受人（B2B 從客戶 tax_id；B2C 從客戶 name）、發票金額（= 訂單應收總額 - 已開發票淨額）、商品明細（從訂單印件）
- **AND** 業務 SHALL 可微調後送出，呼叫藍新 Mockup

### Requirement: 應收帳款帳齡底層欄位與訂單列表帳齡篩選

系統 SHALL 計算 PaymentPlan 的 derived field `overdue_days`（status ≠ 已收訖 時 = TODAY - scheduled_date；scheduled_date 為空時 = NULL），作為應收帳款帳齡（AR aging）底層基礎。訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 PaymentPlan 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）、逾期自動通知、應收帳款 Dashboard 不在本次範疇。

#### Scenario: PaymentPlan 逾期天數自動計算

- **GIVEN** PaymentPlan #1 status = 未收、scheduled_date = 2026-04-01
- **WHEN** 系統時間為 2026-05-06
- **THEN** PaymentPlan #1.overdue_days SHALL = 35

#### Scenario: 已收訖 PaymentPlan 不算逾期

- **GIVEN** PaymentPlan #1 status = 已收訖、scheduled_date = 2026-04-01
- **WHEN** 系統計算 overdue_days
- **THEN** overdue_days SHALL = NULL（不顯示逾期）

#### Scenario: 訂單列表依最長逾期天數篩選

- **WHEN** 業務 / 主管於訂單列表選擇篩選器「最長逾期天數 ≥ 30 天」
- **THEN** 系統 SHALL 列出所有有 PaymentPlan.overdue_days ≥ 30 的訂單
- **AND** 列表 SHALL 顯示該訂單最長逾期天數欄位

### Requirement: 已完成訂單仍可建立 OrderAdjustment（售後服務）

業務 / 諮詢 SHALL 可於主訂單狀態 = 已完成 的訂單建立 OrderAdjustment（典型情境：售後服務、品質投訴退款、補印追加）。已完成訂單上的 OrderAdjustment 觸發應收總額更新後，訂單詳情頁的對帳檢視面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」，提示會計人工重新對帳。系統 SHALL NOT 引入「對帳鎖定 / 解鎖」狀態機（會計人工確認即可）。

#### Scenario: 已完成訂單建立 OrderAdjustment 並執行

- **GIVEN** 訂單狀態 = 已完成、completion_date = 2026-03-15
- **WHEN** 業務於 2026-05-06 建立 OrderAdjustment（adjustment_type = 退印、amount = -5,000、reason = 客戶事後品質投訴）
- **AND** 完成審核流程後業務執行異動
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 訂單應收總額 SHALL 更新
- **AND** 訂單詳情頁的對帳檢視面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行」

#### Scenario: 主訂單狀態維持已完成不回退

- **GIVEN** OrderAdjustment 在已完成訂單上執行
- **THEN** 訂單主狀態 SHALL 維持「已完成」
- **AND** 系統 SHALL NOT 觸發任何訂單狀態回退（與 D5 PaymentPlan 變更生產段不回審原則一致）

### Requirement: 業務主管批次審核 OrderAdjustment（user story）

業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看所有 status = 待主管審核 的 OrderAdjustment，依負責業務 / adjustment_type / 訂單編號篩選，逐筆核可 / 退回。

#### Scenario: 業務主管查看待審核異動清單

- **WHEN** 業務主管登入後台進入「待審核訂單異動」頁
- **THEN** 系統 SHALL 列出所有 status = 待主管審核 的 OrderAdjustment
- **AND** 主管 SHALL 可依 adjustment_type 篩選

### Requirement: 訂單其他費用明細（OrderExtraCharge）

訂單 SHALL 支援「其他費用」明細項目，作為訂單應收金額構成的一部分（與印件費並列）。OrderExtraCharge 實體用於記錄訂單建立時即確定、非屬印件規格的費用項目。

**OrderExtraCharge 欄位**：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單 |
| `charge_type` | enum | Y | `consultation_fee` / `shipping_fee` / `rush_fee` / `other` |
| `amount` | decimal | Y | 金額（一般為正數） |
| `description` | string | N | 描述（如「諮詢費（諮詢單編號 CR-XXX）」） |
| `created_at` | timestamp | Y | 建立時間 |
| `created_by` | FK -> 使用者 | N | 建立者（系統自動建立時可為 null） |

**與 OrderAdjustment 的語意分離**：

| 概念 | OrderExtraCharge | OrderAdjustment |
|------|-----------------|-----------------|
| 何時建立 | 訂單成立時即確定 | 訂單成立後因規格變更 / 加印 / 退印 / 折扣等異動 |
| 是否需要審核 | 否（屬訂單明細的一部分） | 是（草稿 → 待主管審核 → 已核可 → 已執行） |
| 業務語意 | 應收明細項目 | 應收金額異動 |

**諮詢費的特殊路徑**：當訂單 `order_type = 諮詢` 或主訂單來自 ConsultationRequest 時（`linked_consultation_request_id` 非空），系統 SHALL 自動建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，業務無需手動建立。

#### Scenario: 諮詢來源主訂單自動建 consultation_fee OrderExtraCharge

- **GIVEN** 需求單 `linked_consultation_request_id = CR-202605-0001`、諮詢費 = 1000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 在主訂單上建立 OrderExtraCharge：
  - `charge_type = consultation_fee`
  - `amount = 1000`
  - `description = 「諮詢費（諮詢單編號 CR-202605-0001）」`
  - `created_by = null`（系統自動建立）

#### Scenario: 諮詢訂單自動建 consultation_fee OrderExtraCharge

- **WHEN** 系統在「諮詢結束不做大貨 / 需求單流失 / 諮詢取消」三種收尾情境之一建立諮詢訂單
- **THEN** 系統 SHALL 同步建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，使諮詢訂單應收 = 諮詢費

#### Scenario: 業務手動加運費

- **WHEN** 業務於主訂單詳情頁點擊「新增其他費用」、選擇 `charge_type = shipping_fee`、填入 amount = 200、description = 「黑貓宅配」
- **THEN** 系統 SHALL 建立 OrderExtraCharge 記錄
- **AND** 主訂單應收總額 SHALL 增加 200

---

### Requirement: Payment 跨實體轉移

系統 SHALL 支援 Payment 從 ConsultationRequest 轉移至 Order 的單向能力，僅限於以下四種觸發情境之一：

1. 諮詢結束選「不做大貨」 → Payment 轉移至新建諮詢訂單
2. 諮詢結束選「做大貨」、需求單成交、業務轉訂單 → Payment 轉移至新建一般訂單
3. 諮詢結束選「做大貨」、需求單流失 → Payment 轉移至新建諮詢訂單
4. 待諮詢取消（退費）→ Payment 轉移至新建諮詢訂單

**轉移動作**：

1. 修改 `Payment.linked_entity_type` 從 `ConsultationRequest` 改為 `Order`
2. 修改 `Payment.linked_entity_id` 為新建訂單 ID
3. 紀錄 `Payment.original_entity_type / original_entity_id` 為原 ConsultationRequest（保留歷史）
4. 設定 `Payment.is_transferred = true`
5. ActivityLog 記錄轉移動作

**轉移後限制**：Payment.is_transferred = true 後 MUST NOT 再次轉移。

**為何僅限 ConsultationRequest → Order 單向**：本 change 範疇內 Payment 轉移只服務於諮詢費四種收尾情境；其他「跨訂單支付調整」走 refactor change 既有的「退款 Payment + SalesAllowance」分離設計。

#### Scenario: 諮詢結束不做大貨 Payment 轉移

- **GIVEN** ConsultationRequest CR-XXX、Payment(linked_entity_type=ConsultationRequest, linked_entity_id=CR-XXX, amount=1000)
- **WHEN** 諮詢人員點擊「結束諮詢 - 不做大貨」、系統建立諮詢訂單 SO-YYY
- **THEN** 系統 SHALL 修改 Payment.linked_entity_type 從 `ConsultationRequest` 改為 `Order`、linked_entity_id 從 CR-XXX 改為 SO-YYY
- **AND** Payment.is_transferred SHALL = true
- **AND** Payment.original_entity_type / original_entity_id MUST 保留 CR-XXX
- **AND** ActivityLog 記錄「Payment 由 ConsultationRequest CR-XXX 轉移至諮詢訂單 SO-YYY」

#### Scenario: 諮詢結束做大貨需求單成交 Payment 轉移至一般訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX（linked_consultation_request_id = CR-XXX）成交
- **WHEN** 業務點擊「轉訂單」、系統建立一般訂單 SO-ZZZ
- **THEN** 系統 SHALL 修改 Payment.linked_entity_id 為 SO-ZZZ、linked_entity_type = Order
- **AND** is_transferred = true

#### Scenario: 需求單流失觸發 Payment 轉移至諮詢訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX 流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單 SO-WWW
- **THEN** 系統 SHALL 將 Payment 轉移至 SO-WWW
- **AND** is_transferred = true

#### Scenario: 已轉移 Payment 不可再次轉移

- **GIVEN** Payment.is_transferred = true
- **WHEN** 系統嘗試再次修改 Payment.linked_entity_id
- **THEN** 系統 MUST 拒絕
- **AND** ActivityLog 記錄拒絕事件

---

### Requirement: 諮詢訂單發票時間點處理

諮詢訂單（`order_type = 諮詢`）的 Invoice 開立邏輯 SHALL 依對應 ConsultationRequest 的 `consultation_invoice_option` 決定，MUST NOT 套用一般訂單的「業務 / 諮詢手動開立」流程（自動觸發）：

- `issue_now`：諮詢訂單建立時系統 SHALL 自動開立 Invoice（金額 = 諮詢費）
- `defer_to_main_order`：諮詢訂單建立時 MUST NOT 立即開 Invoice。但因諮詢訂單只在三種收尾情境出現，實作上：
  - 不做大貨 / 需求單流失情境：系統 SHALL 在諮詢訂單建立後自動開立 Invoice（沒有「主訂單可合併」的情境，必須當下開）
  - 待諮詢取消（退費）情境：系統 MUST NOT 開 Invoice（直接建退款 Payment、不開 Invoice 也不需 SalesAllowance）

實際上 `defer_to_main_order` 的「延後到主訂單」語意只在「諮詢結束做大貨需求單成交轉一般訂單」情境發揮作用 — 此時諮詢費以 OrderExtraCharge 形式進入主訂單，諮詢費 Invoice 由業務於主訂單正常開立流程涵蓋全額。

#### Scenario: defer_to_main_order 不做大貨諮詢訂單建立時開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`
- **AND** 諮詢人員選「結束諮詢 - 不做大貨」、系統建諮詢訂單
- **WHEN** 系統推進諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）
- **AND** 諮詢訂單推進至「已開發票 → 訂單完成」

#### Scenario: defer_to_main_order 需求單流失諮詢訂單建立時開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`、需求單流失、系統建諮詢訂單
- **WHEN** 系統推進諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）

#### Scenario: defer_to_main_order 待諮詢取消諮詢訂單不開 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`、業務點擊取消
- **WHEN** 系統建諮詢訂單與退款 Payment
- **THEN** 系統 MUST NOT 開立 Invoice
- **AND** 諮詢訂單推進至「訂單完成」終態（退費完成）

#### Scenario: issue_now 諮詢訂單建立時開立 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、諮詢訂單建立（任一收尾情境）
- **THEN** 系統 SHALL 立即開立 Invoice（金額 = 諮詢費）

#### Scenario: issue_now 待諮詢取消開立 Invoice 與 SalesAllowance

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、業務點擊取消
- **WHEN** 系統建諮詢訂單
- **THEN** 系統 SHALL 開立 Invoice（金額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment
- **AND** 系統 SHALL 開立 SalesAllowance（金額 = -諮詢費）關聯該退款 Payment

---

### Requirement: 諮詢取消對帳邏輯

諮詢取消（待諮詢狀態退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並標示「退費完成」而非「對帳通過」或「待對帳」。

判定條件：諮詢訂單同時存在以下特徵時，視為退費完成：

- 至少一筆 Payment.amount > 0（諮詢費收款）
- 至少一筆 Payment.amount < 0（退款）
- ∑ Payment.amount = 0（收支抵銷）
- 若 issue_now 路徑：至少一筆 SalesAllowance 金額對應退款 Payment

對帳面板 SHALL 顯示：

- 應收：諮詢費（OrderExtraCharge）
- 已收：0（諮詢費 + 退款抵銷）
- 已開票（淨額）：0（issue_now：Invoice - SalesAllowance；defer_to_main_order：未開票）
- 標示：「退費完成 - 此筆諮詢已取消、款項已退回」

#### Scenario: 退費完成對帳標示

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000
- **AND** Payment：諮詢費 1000 + 退款 -1000 = 0
- **AND** issue_now 路徑：Invoice 1000 + SalesAllowance -1000 = 0
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 面板 SHALL 顯示「退費完成」標示
- **AND** 不標示為「對帳通過」或「待對帳」

## Data Model

> 來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### Order

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 訂單編號 | order_no | 字串 | Y | Y | 系統自動產生 |
| 訂單類型 | order_type | 單選 | Y | | 線下 / 線上(EC) / 諮詢 |
| 狀態 | status | 單選 | Y | | 依狀態機 |
| 客戶 | customer_id | FK | Y | | FK -> 客戶 |
| 負責業務 | sales_id | FK | Y | | FK -> 使用者 |
| 來源需求單 | quote_request_id | FK | | | FK -> 需求單；線上訂單 / 諮詢訂單可無 |
| 來源諮詢單 | linked_consultation_request_id | FK | | | FK -> ConsultationRequest；非空表示來自諮詢流程；諮詢訂單建立時寫入，需求單轉訂單時若需求單來源為諮詢單也寫入 |
| 帳務公司 | billing_company_id | FK | Y | | FK -> BillingCompany；對應發票主體（藍新 MerchantID_）；從來源需求單帶入，訂單建立後不可變更 |
| 案名 | case_name | 字串 | | | 從需求單 title 帶入，可編輯 |
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK -> 使用者；訂單建立時指派、進入「報價待回簽」後鎖定（僅 Supervisor 可解鎖） |
| 是否需審核 | approval_required | 布林值 | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | 文字 | | | 從來源需求單帶入；最長 500 字；業務主管於審核時查看作為決策依據；進入「報價待回簽」後鎖定 |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | 文字 | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續退回需重審時的條件對照 |
| 客戶交期 | delivery_date | 日期 | | | 客戶確認的最終交期 |
| 審稿前預計出貨日 | expected_ship_date_pre_review | 日期 | | | 審稿前預計出貨 |
| 審稿後預計出貨日 | expected_ship_date_post_review | 日期 | | | 審稿後預計出貨 |
| 內部製作截止日 | internal_complete_date | 日期 | | | 內部製作截止日 |
| 付款狀態 | payment_status | 單選 | Y | | 未付款 / 已付款 / 部分退款 / 已退款 |
| 付款方式 | payment_method | 單選 | | | 現金 / 信用卡 / 銀行轉帳 / 支票 / 其他 |
| 付款備註 | payment_detail | 文字 | | | 分期資訊 / 發票備註 |
| 付款時間 | paid_at | 日期時間 | | | 線上訂單用 |
| 回簽時間 | signed_at | 日期時間 | | | 線下訂單回簽時間 |
| 發票統一編號 | invoice_unified_number | 字串 | | | 發票統一編號 |
| 商品含稅小計 | subtotal_with_tax | 小數 | | | 商品含稅小計（冗餘） |
| 折扣金額 | discount_amount | 小數 | | | 折扣金額（含稅） |
| 紅利金額 | bonus_amount | 小數 | | | 紅利金額（含稅） |
| 運費 | shipping_fee_with_tax | 小數 | | | 運費（含稅） |
| 訂單總額 | total_with_tax | 小數 | | | 訂單總額（含稅） |
| 可獲得紅利點數 | earned_bonus_points | 整數 | | | 可獲得紅利點數 |
| 是否急件 | is_urgent | 布林值 | | | 是否急件 |
| 主訂單 | parent_order_id | FK | | | 補收款主訂單（nullable） |
| 是否補收款訂單 | is_supplemental | 布林值 | Y | | 是否補收款訂單 |
| 最後稿件上傳時間 | file_uploaded_at | 日期時間 | | | 最後稿件上傳時間（統計） |
| 備註 | notes | 文字 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### OrderItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> 訂單 |
| 來源需求單印件項目 | quote_request_item_id | FK | | | FK -> 需求單印件項目 |
| 名稱 | name | 字串 | Y | | |
| 數量 | quantity | 整數 | Y | | |
| 成交單價 | unit_price | 小數 | Y | | 成交單價 |

### PrintItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> 訂單 |
| 所屬訂單項目 | order_item_id | FK | Y | Y | FK -> 訂單項目 |
| 來源需求單印件項目 | quote_request_item_id | FK | | | FK -> 需求單印件項目 |
| 名稱 | name | 字串 | Y | | |
| 類型 | type | 單選 | Y | | 打樣 / 大貨 |
| 規格備註 | spec_note | 文字 | | | 規格備註 |
| 單位 | unit | 單選 | | | 個 / 冊 / 張 / 式 |
| 購買數量 | pi_ordered_qty | 小數 | Y | | 購買數量 |
| 目標數量 | pi_target_qty | 整數 | | Y | 目標數量（跨工單加總） |
| 生產數量 | pi_produced_qty | 整數 | | Y | 生產數量（報工累計） |
| 入庫數量 | pi_warehouse_qty | 整數 | | Y | 入庫數量（QC 通過） |
| 出貨數量 | pi_shipped_qty | 整數 | | Y | 出貨數量 |
| 預計產線 | expected_production_lines | M:N | | | 多選；FK -> ProductionLine（透過 PrintItemExpectedLine） |
| 審稿狀態 | review_status | 單選 | Y | | 稿件未上傳 / 等待審稿 / 已補件 / 合格 |
| 生產狀態 | production_status | 單選 | Y | | 等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達 / 已棄用 |
| 打樣結果 | sample_result | 單選 | | | 待確認 / OK / NG-製程問題 / NG-稿件問題（打樣印件專用） |
| 稿件上傳開放 | file_upload_enabled | 布林值 | Y | | 稿件上傳開放 |
| 首次稿件上傳時間 | file_uploaded_at | 日期時間 | | | 首次稿件上傳時間 |
| 稿件鎖定工單 | file_lock_wo_id | FK | | | 稿件鎖定工單 |
| 成品縮圖 | thumbnail_url | 字串 | | | 審稿人員獨立上傳的成品縮圖 |
| 難易度 | difficulty_level | 整數 | Y | | 印件審稿難易度（1-10），自需求單 / EC 商品主檔繼承（add-prepress-review D5） |
| 當前合格輪次 | current_round_id | FK | | Y | FK -> ReviewRound；指向目前合格的送審輪次，尚未合格時為 NULL；unique constraint 保證每印件至多一合格指針（add-prepress-review D4） |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### PrintItemExpectedLine（印件預計產線 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 印件 | print_item_id | FK | Y | Y | FK -> PrintItem |
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine |

### PrintItemFile

> add-prepress-review D4 調整：以 `PrintItem.current_round_id` 指針 +
> `round_id` FK 取代原 `is_final` 旗標，避免並發切換下多列 TRUE 的 race condition；
> `review_status` 標為衍生值（= 所屬 ReviewRound.result 投影）。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬印件 | print_item_id | FK | Y | Y | FK -> 印件 |
| 所屬審稿輪次 | round_id | FK | | | FK -> ReviewRound；補件上傳時 roundId 暫為 NULL，審稿人員下次送審時與新 Round 綁定（add-prepress-review D4） |
| 檔案角色 | file_role | 單選 | Y | | 印件檔 / 縮圖（PI-003 定案兩值：客戶內容合併為單一印件檔；縮圖為視覺摘要兼參考圖）|
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案網址 | file_url | 字串 | | Y | |
| 檔案大小 | file_size_kb | 整數 | | Y | |
| 檔案類型 | file_type | 單選 | Y | | 稿件 / 刀模 / 其他 |
| 審稿狀態 | review_status | 單選 | | Y | 衍生值（= 所屬 ReviewRound.result 投影）：待審稿 / 合格 / 不合格 |
| 審稿備註 | review_note | 文字 | | | 不合格原因（若有）|
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

出貨單相關資料表（Shipment、ShipmentItem、OrderPaymentRecord）見出貨模組（待建立）。

---

## Phase 2 預留功能

- EC 訂單全自動 API 同步
- 準時出貨率/訂單週期 Dashboard
- 業務 Forecast（需求預測）
- 訂單獲利分析
