## Context

ERP 採用「中台 + 平台」架構（既定，定義於 [user-roles spec § Requirement: 平台歸屬分類](../../specs/user-roles/spec.md)）：
- **中台**：C Level、各模組主管（Supervisor / 訂單管理人 / 業務主管 / 印務主管 / 審稿主管 / EC 商品管理）使用，承載全資料與最完整 layout
- **業務平台**：業務、諮詢、會計使用
- **印務平台**：印務使用
- **審稿平台**：審稿使用
- **工廠平台**：生管、師傅、外包廠商、QC、出貨使用
- **中國供應商平台**：中國廠商使用

每個平台呈現該角色職責所需的功能子集；同一功能在不同平台可有不同 layout / 欄位 / 動作（中台最完整，平台依需要閹割）。Role 設定控制每個使用者可使用哪些中台 / 平台功能。

「印件總覽」目前作為印務主管專用畫面，定義於 [work-order spec](../../specs/work-order/spec.md)（§ 印務主管印件總覽 / § 印務主管審核待辦 / § 印務印件篩選），歸屬中台（印務主管屬中台）。本次不修改既有 work-order spec 行為；中台版與業務平台版的對應關係由 sales-platform spec 內的 Requirement 描述引用。

本次新增業務平台版印件總覽，回應業務跨訂單追蹤自己負責印件的需求。

## Goals / Non-Goals

**Goals:**
- 業務在業務平台可進入印件總覽，看到自己負責訂單下的所有印件（跨訂單彙整視圖）
- 為「業務平台這個容器內的所有功能 spec」建立正式的 capability spec（`sales-platform`），後續業務平台功能（如業務專屬訂單清單、業務 KPI 視圖等）皆可比照納入
- 確立平台版功能 spec 與中台版功能 spec 的對應與差異描述模式，作為後續諮詢 / 工廠平台功能 spec 拆分的範本

**Non-Goals:**
- 不重新定義中台 + 平台架構（既有 user-roles spec 已定義）
- 不調整業務平台印件總覽的閹割範圍（初版與中台版完全相同，後續依使用回饋再決定砍哪些欄位 / 功能）
- 不處理諮詢 / 業務主管 / Supervisor 的印件總覽（諮詢屬業務平台，但本次只開放業務 Role；業務主管 / Supervisor 屬中台，沿用既有 work-order spec 印件總覽）
- 不引入業務團隊組織架構（team_id / 主管下屬關係）
- 不引入 delegation / 代班授權機制
- 不處理「業務開立發票剩餘可開金額」需求（屬發票模組，回 [extend-invoice-issuance-flexibility](../extend-invoice-issuance-flexibility/) change）
- 不變更 Data Model、不變更狀態機

## Decisions

### Decision 1：以新建 capability（`sales-platform`）承載業務平台功能，而非把功能塞進現有模組 spec

**選擇**：新建 `sales-platform` capability。

**理由**：
- ERP 既有 spec 結構是「功能 / 流程模組」（quote-request / order-management / work-order / production-task 等），這些 spec 內的 Requirement 是「該模組的功能行為」，與「該功能在哪個平台呈現」是正交的兩個維度
- 若把「業務平台版印件總覽」塞進 order-management，會出現「order-management spec 內有印件總覽 Requirement，但印件主資料在 work-order spec」的歸屬錯置
- 新建 `sales-platform` capability 把「業務平台容器內的功能 spec 集合」獨立記載，後續諮詢平台、工廠平台可比照建立 `consultation-platform`、`factory-platform` 等 capability（諮詢屬業務平台但未來可能拆獨立 capability，視 Miles 決策）
- 此 capability 內每條 Requirement 描述「該功能在業務平台的呈現方式 + 範圍規則 + 動作可見性」，並引用中台版功能 spec（如 work-order spec）作為內容基準

**替代方案考慮**：
- 把印件總覽 Requirement 加在 order-management spec：歸屬錯置，且無法承載後續業務平台新功能
- 把印件總覽 Requirement 加在 user-roles spec：user-roles 是角色 / 權限 spec，加功能 Requirement 會混淆 spec 職責
- 在 work-order spec 加一條「印件總覽（業務平台版）」Requirement：與「業務平台屬另一容器」的架構意圖不符，且後續業務平台新功能會無處可加

### Decision 2：業務平台版印件總覽內容初版與中台版完全相同，不在本次決定閹割範圍

**選擇**：初版完全沿用中台版（既有 work-order spec § 印務主管印件總覽 的欄位 / 篩選 Tab / 列表呈現）。

**理由**：
- Miles 明確指示：先相同，後續再依使用回饋調整閹割內容
- 避免在無使用數據前過早優化（依 user-research 原則，應先觀察業務真實使用模式）
- 確保業務 / 印務看到相同的印件狀態粒度，避免「業務看到的狀態 vs 印務看到的狀態不一致」的對齊問題
- 後續閹割可獨立 change 處理，不阻塞本次

**例外（業務平台與中台版必然不同的點）**：
- **過濾規則**：業務平台自動套用 `Order.sales_id = current_user.id`（印件所屬訂單的負責業務 = 當前登入業務）
- **動作可見性**：業務平台不顯示「分配印件」「審核工單」按鈕（業務 Role 無此權限）
- **預設 Tab**：業務平台不套用中台版「等待中優先未建工單」預設（業務不關心未建工單），預設為不套篩選的首頁

### Decision 3：業務平台印件總覽的資料源直接讀印件層資料，不違反「業務 MUST NOT 導航至工單模組」原則

**選擇**：業務平台印件總覽前端 UI 在業務平台容器內，後端讀取印件層資料，業務無法從此頁面導航至工單詳情頁。

**理由**：
- user-roles spec § 業務與諮詢角色的工單查閱限制 明文「業務 SHALL 可透過訂單詳情頁面查閱工單狀態與 QC 紀錄摘要，AND MUST NOT 提供導航至工單模組的連結」
- 這條限制的 intent 是「業務不能進工單模組（工單詳情頁 / 派工板 / QC 等）」
- 業務平台印件總覽呈現的是印件層彙整資料（印件名稱、案名、客戶、訂單編號、交貨日期、印製狀態、完成度、工單數量），不需要點擊進入個別工單詳情
- 印件可展開顯示其下工單的狀態與負責印務（沿用中台版 spec），但**展開後的工單項目不可點擊**（業務平台版的差異點，不沿用中台版的「點擊工單導航至工單詳情頁」）

**替代方案考慮**：
- 鬆綁「不導航至工單模組」原則：違反既有 spec 意圖，且打破業務 / 工單模組職責邊界
- 業務看不到展開的工單列表：違反 Decision 2 的「初版內容相同」，且業務確實需要知道印件下有幾張工單在哪個狀態

### Decision 4：權限模型沿用既有「角色屬於平台 + 模組 R/W」雙層結構，不引入新權限維度

**選擇**：業務 Role 透過既有的「平台歸屬 = 業務平台」+「業務平台功能 = sales-platform spec 列舉的 Requirement」確認可用功能；本次不引入「Role × Feature × Action」三維 RBAC。

**理由**：
- 既有 user-roles spec § 模組存取權限模型已支援「粗粒度 R/W 標示 + 細粒度行為由各 spec 規範」的雙層結構
- 業務的「印件總覽純檢視」屬於細粒度行為，由 sales-platform spec 的對應 Requirement 描述
- 引入三維 RBAC 會超出本次 scope，且尚無第二、第三個 feature 需要驗證此結構的必要性

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 業務看到細粒度生產進度（如「正在準備上機」「QC 中」等狀態）後過度介入印務作業（破窗效應），反而讓印務訊息量上升 | 初版沿用中台版狀態粒度，搭配上線後觀察業務 → 印務「介入決策」性質訊息量；若風險顯化，後續 change 處理（縮粒度 / 改為粗段 / 業務平台版閹割掉某些狀態欄位）。本次不前置處理 |
| 業務平台 capability 命名為 `sales-platform`，但既有 user-roles spec § 平台歸屬分類中諮詢、會計也屬業務平台 — 未來諮詢若需獨立平台功能，命名易混淆 | 本次 capability 命名與既有 spec § 平台歸屬分類對齊（「業務平台」內含業務 / 諮詢 / 會計三角色）；若未來諮詢確定獨立平台，再以 change 處理 capability 改名或拆分 |
| 業務 / 印務看到「同一印件」的狀態粒度相同，但業務不知如何解讀某些印務術語（如「待 QC」「派工中」） | 印件總覽欄位中的狀態使用既有狀態機 § 印製維度狀態，這些術語在 spec 中已定義且業務在訂單詳情頁已接觸；若 UI 層需要 sales-facing 顯示名稱對應，於後續 prototype 階段或閹割 change 處理 |
| 業務平台版印件總覽展開工單列表不可點擊，業務可能會抱怨「看得到工單但點不進去」 | 屬於 Decision 3 的設計取捨；若業務真有需要看工單細節，應透過訂單詳情頁的工單狀態摘要查閱（既有功能），不打破工單模組權限邊界 |
| sales-platform capability 本次只有一條 Requirement，spec 看起來內容單薄 | 本 capability 設計為「業務平台功能集合」的容器，後續業務平台功能（如業務專屬訂單清單、業務 KPI 視圖等）皆會以新 Requirement 形式加入；初期單薄是正常的 |

## Migration Plan

- 本次無 Data Model / 狀態機變更，無資料遷移需要
- 既有印務主管使用的中台版印件總覽（work-order spec）行為不變更，僅在該 Requirement 標註為「中台版」
- 業務平台印件總覽為新增功能，上線時僅在業務 Role 出現新入口，不影響其他角色

## Open Questions

1. **業務平台側邊欄印件總覽入口的命名與位置**：是「印件總覽」（與中台版同名）還是「我的印件」之類業務語境名稱？側邊欄歸於哪個 group？— Prototype 暫沿用「印件總覽」名稱，掛在「訂單管理」group 下作為 sub item（與訂單列表並列），命名最終決策留待後續 UI change
2. **業務平台版印件總覽是否需要連結回訂單**：點擊「訂單編號」欄位是否導航至訂單詳情頁？— Prototype 暫沿用中台版邏輯（訂單編號欄位顯示為純文字，與中台版一致），實作時驗證
3. **後續諮詢 / 工廠平台 capability 拆分時機**：諮詢目前歸業務平台，未來若需要諮詢專屬功能 spec，capability 是繼續用 sales-platform 還是拆出 consultation-platform？— 本次不決定
4. **業務開放印件詳情頁存取 + Tab 閹割（Miles 決定，2026-05-14）**：業務需查閱審稿紀錄等印件深度資訊，因此 `/print-items/:id` 路由前綴開放給 sales / consultant ROLE_ALLOWED_PREFIXES。印件詳情頁屬印件模組（非工單模組），開放給業務不違反 user-roles spec § 業務與諮詢角色的工單查閱限制 原則。業務 / 諮詢看印件詳情頁時，僅保留「資訊 / 審稿紀錄 / 活動紀錄」三個 Tab，其他 Tab（工單 / QC 紀錄 / 轉交單 / 出貨單）隱藏 — 避免業務看到生產層細節後跨層介入印務排程（破窗效應）。詳見 sales-platform spec § Requirement: 業務平台印件詳情頁 Tab 閹割
5. **業務平台路由前綴 `/sales/`（Prototype 實作決定）**：本次 Prototype 採用 `/sales/print-items` 作為業務平台印件總覽路徑（與中台版 `/work-orders/print-items` 區隔）。未來業務平台其他功能若加入，可比照 `/sales/{feature}` 模式部署。此 URL 設計屬實作層約定，spec 不規範具體路徑
6. **印件 read model 是否獨立 capability（三視角討論延伸議題）**：ERP 顧問於三視角討論中提出「印件 read model 應從 work-order capability 拆出獨立 `print-item-master` capability」，理由為印件層資料被多個 capability 使用（work-order / order-management / prepress-review / production-task / 本 sales-platform 等），未獨立會出現「多入口、多套 join」維護成本。本次未拆，列為未來 change 候選 — 觸發時機：當第三個以上模組需要新增印件層查詢時
7. **業務看生產進度的破窗效應觀察（三視角討論延伸議題）**：CEO 視角警告業務看到細粒度生產進度後可能跨層介入印務作業（「為什麼還沒上機，催一下」），讓印務訊息量上升。本次依 Miles 決定先同中台版內容（不延遲、不粗粒度），上線後需觀察兩個信號：(a) 業務 → 印務「催進度」訊息量是否下降；(b) 業務 → 印務「介入決策」訊息量是否上升。若 (b) 顯化，後續 change 處理（縮印件總覽 / 印件詳情頁的狀態粒度、UI 層 sales-facing display name 對應、或延遲顯示）
