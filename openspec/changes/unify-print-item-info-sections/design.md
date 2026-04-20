## Context

印件是跨「訂單 → 審稿 → 工單 → 生產任務 → QC → 出貨」整條業務鏈的核心實體。**現況痛點**：公司管理印件製作進度依賴 Slack 回報（印務手動發訊息，管理層手動彙整），每天花大量時間做資訊同步。根因是 ERP 內部沒有可讀的「印件完整詳情視圖」。

三個詳情頁（印件詳情 / 工單詳情 / 審稿詳情）各自獨立演化，導致：

- 印件詳情頁缺紙張/材質、製程內容、規格備註等關鍵印製規格欄位
- 審稿詳情頁有完整印件規格，卻缺印製進度
- 工單詳情頁完全無印件規格與審稿資訊，印務每次要確認印件必須跳頁
- 單一 `ErpInfoTable` 把所有欄位攤平，無法依模組語境隱藏整組資訊
- 跨頁欄位命名不一致（同一概念在不同頁叫不同名字）

本次改動以 **UI 層資訊重組** 為主，不改資料模型、不改狀態機、不改 API。不涵蓋 Tab 區內的印件清單（如訂單詳情頁的印件 Tab），僅針對三個詳情頁的 **Info 區域**。

## Goals / Non-Goals

**Goals：**

- 三頁印件 Info 使用同一組「四分類」語彙：系統資訊 / 印件資訊 / 稿件資料 / 印製資料
- B、C 區塊內容在三頁**完全一致**（由共用元件保證）
- 各區塊以獨立 `ErpDetailCard` 承載，便於未來以「區塊」為單位依模組 show/hide
- 工單詳情頁補齊印件規格與稿件資料，消除「跳頁才能看」的操作成本
- 印件狀態讀取路徑統一：工單頁與印件頁都用 `derivePrintItemStatusFromWOs` 派生

**Non-Goals：**

- 不改 `PrintItem` / `WorkOrder` 的資料模型與欄位定義
- 不改狀態機（印件狀態、工單狀態、審稿狀態皆維持現有定義）
- 不做 User 層權限控管（顯示邏輯以「模組」為單位，進到該頁即代表可見整組資訊）
- 不納入訂單詳情頁（`OrderDetail.tsx`）的印件 Tab 與 `MockEcOrderDetail`
- 不重新設計 Badge、Stepper 等既有元件的視覺

## Decisions

### D1：四個區塊用四張獨立 ErpDetailCard，A 卡 title 依單據類型命名

**選擇**：每個區塊一張獨立 `ErpDetailCard`。B/C/D 卡 title 固定為「印件資訊」「稿件資料」「印製資料」。A 卡 title **依詳情頁單據類型動態命名**：
- 印件詳情頁 A → 「所屬訂單」
- 工單詳情頁 A → 「工單資訊」
- 審稿詳情頁 A → 「審稿任務」

**背景**：原設計三頁 A 卡都叫「基本資訊」，但語意太籠統——使用者預期「基本＝最重要」，但 A 區塊實際是「本頁單據的元資料」，首要資訊反而在 B 卡。改用單據名稱做 A 卡 title，讀者一眼知道 A 卡是講「當前這張單」，B/C/D 是講「印件這個實體」。

**替代方案**：
- 一張大卡內用 sub-section（小標題 + 分隔線）切四段
- 前兩塊合併為「基本資訊」，C/D 各自獨立

**理由**：
- 獨立卡視覺切分最明確，讀者掃描節奏穩定
- 以「卡」為單位最容易對應「模組決定 show/hide」語意（未來要隱藏審稿頁的 D 卡，只要不 render 該卡即可）
- 既有 DESIGN.md §6.3 詳情頁模板本來就允許多張 `ErpDetailCard` 並排

**權衡**：頁面變長（工單頁從 2 張卡變 4 張 + 任務清單），需在 Lovable 驗證視覺密度可接受。

### D2：抽兩個共用元件（B、C），型別用 ViewModel interface

**選擇**：
- 新增 `src/components/shared/PrintItemSpecCard.tsx`（B），吃 `PrintItemSpecViewModel` interface
- 新增 `src/components/shared/PrintItemArtworkCard.tsx`（C），吃 `PrintItemArtworkViewModel` interface
- ViewModel 定義於 `src/types/printItemViewModel.ts`，僅含 B/C 卡顯示所需欄位
- 各詳情頁在呼叫端做 adapter，把 `OrderPrintItem` / 其他型別映射到 ViewModel
- A、D 各頁自組 `ErpDetailCard` + `ErpInfoTable` / `ErpSummaryGrid`

**替代方案**：
- 抽四個共用元件（A、B、C、D 各一）
- B/C 元件直接吃 `OrderPrintItem` 具體型別

**理由**：
- B、C 在三頁**完全一致**（同樣的印件屬性、同樣的稿件檔案），最適合抽共用
- A 在三頁**內容不同**（印件頁放訂單關聯、工單頁放工單系統欄位、審稿頁放審稿人員等）— 強抽共用會讓 props 變得像「隨便塞什麼都行」的配置檔，失去語意
- D 在印件頁（聚合層）與工單頁（工單層）**業務語意不同**（同樣一個「完成數」，在印件頁是跨工單加總，在工單頁是單工單），強共用會隱藏這個語意差異
- ViewModel interface 的設計理由：B 卡顯示的 8 個欄位（印件編號、類型、產品、紙張/材質、製程內容、規格備註、包裝備註、訂單來源）是「印件作為顯示實體的穩定契約」，不應與 `OrderPrintItem` 的完整 type 耦合。未來報價單印件預覽、訂單詳情頁印件 Tab 展開（即使不在本次範圍）重用 B 卡時，只要提供 adapter 即可，不需改元件本身

**本次範圍限制**：不涵蓋 Tab 區的印件清單（如訂單詳情頁的印件 Tab），僅針對三個詳情頁的 Info 區域。訂單詳情頁現行印件 Table 欄位 MUST 與 B 卡欄位集比對，若有命名或內容差異需消除（由 tasks 明列驗證步驟）。

### D3：B 區塊頂端用兩顆 Badge 並排，不用 Stepper

**選擇**：B 卡頂端以橫向 flex 排列兩顆 Badge：`<PrintItemStatusBadge>` + `<ReviewDimensionStatusBadge>`，下方接 `ErpInfoTable`。

**替代方案**：
- 兩個狀態各佔一個 `ErpInfoTable` info row
- 用 `PrintItemStatusStepper` + `ReviewDimensionStatusStepper` 兩條步驟條

**理由**：
- 狀態資訊在 B 卡是**首要視覺焦點**，用 Badge 比 info row 更顯眼
- Stepper 佔用垂直空間大（約 40–60px 高），在三頁都顯示兩條 Stepper 會嚴重拖長頁面
- Badge 並排 + 下方 InfoTable 的結構既傳達「狀態是 B 的摘要」又保留細節

**權衡**：印件詳情頁頂端原有的 `PrintItemStatusStepper` 需移除或改為 Badge（避免重複）；審稿詳情頁的 `ReviewDimensionStatusStepper` 原本放在「審稿進度」獨立卡，改為 B 卡 Badge 後，「審稿進度」卡可以移除或保留為 C 卡頂端的視覺化。本 change 選擇**保留審稿詳情頁的 Stepper 於 C 卡頂端**，因審稿人員工作流高度依賴輪次視覺化；工單頁不放 Stepper。

### D4：印件狀態派生統一用 derivePrintItemStatusFromWOs（含邊界情況）

**選擇**：三頁的 B 卡「印件狀態 Badge」都呼叫 `derivePrintItemStatusFromWOs(關聯工單狀態清單)` 取得。派生前：
- 輸入工單集合 MUST 排除 `status === '已取消'` 的工單（工單狀態機中沒有「已作廢」，作廢概念只存在於生產任務層；已取消工單不應污染印件狀態）
- 若該印件下有打樣工單 + 大貨工單，派生邏輯以大貨為主（打樣完成 ≠ 印件完成）；若 `derivePrintItemStatusFromWOs` 尚未支援類型權重區分，B 卡 Badge SHALL 附 tooltip 揭露「此狀態基於 N 張工單派生（打樣 / 大貨各幾張）」，讓印務自行判讀
- 若 store 尚未載入該印件的全部關聯工單（hydration 空窗），B 卡 Badge SHALL 顯示 loading skeleton 而非以不完整集合派生

**替代方案**：工單頁的「印件狀態」由 `wo.printItem?.status` 欄位讀取（若有）。

**理由**：
- 現有實作中 `PrintItem` 沒有獨立狀態欄位，狀態是由工單狀態派生
- 若兩處派生邏輯不同，會導致印件總覽與工單詳情頁顯示不一致（`print-item-detail-progress` change 已定義「印件狀態讀取路徑統一」規則）
- `derivePrintItemStatusFromWOs` 是純函式，無副作用，三頁共用沒有技術阻力

**未來過渡路徑**：若產品後續決定給 `PrintItem` 獨立 status 欄位（業界正常做法），派生邏輯應改為「欄位優先、派生備援」：`printItem.status ?? derivePrintItemStatusFromWOs(...)`，此時需開新 change 同步更新三頁 B 卡與派生函式。本 change 暫時以派生為唯一 truth source。

**權衡**：工單詳情頁需查印件的所有關聯工單（不只自己），才能正確派生。需從 `useErpStore` 撈 `workOrders.filter(w => w.printItemId === wo.printItemId && w.status !== '已取消')`。

### D5：A 區塊不含印件編號 / 狀態，避免與 B 重複

**選擇**：A 卡（基本資訊）在三頁都 MUST NOT 顯示印件編號、印件類型、印件狀態、審稿狀態。印件相關屬性全部歸 B。

**理由**：
- Miles 的核心決策之一（前置討論第 1 項）
- 若 A 與 B 同時顯示印件編號，違反「資訊欄位不要重複」原則
- 工單詳情頁的 A 顯示「關聯印件（名稱連結）」即可導航至印件詳情，不需在 A 重複印件編號

**權衡**：印件詳情頁的 A 區塊資訊量較薄（只有訂單編號、案名、客戶），但這是正確切法；若未來 Miles 認為太薄，可補建立者、建立日期等系統欄位。

### D6：工單詳情頁卡片順序 A→D→B→C（例外），其餘兩頁 A→B→C→D

**選擇**：
- 印件詳情頁：A → B → C → D
- **工單詳情頁：A → D → B → C**
- 審稿詳情頁：A → B → C（無 D）

**理由**：
- 印務開工單的**第一動作是看進度**（「這張工單做到哪了？什麼時候完成？」），D 卡（印製資料）是主要決策資訊，應置於 A 之後第一張
- B、C 卡（印件規格 + 稿件）是**確認用**（確認這張工單對應的印件規格是否正確），次要於進度
- 審稿與印件詳情頁的使用者動機不同（審稿人員的首要動作是審稿件，業務在印件頁的首要動作是看印件整體屬性），維持 A→B→C→D 自然順序

**替代方案**：三頁統一 A→B→C→D；或工單頁 B/C 預設收合。

**不採納預設收合的理由**：Miles 決策——印務會需要在多個情境下查看 B/C 內容，預設收合會多一步操作。以順序調整解決掃描優先級即可。

**權衡**：三頁 A 卡順序一致，但 B/C/D 排列不同。由於四個卡各自獨立（D1），順序差異不會影響內容一致性。

### D7：印件頁 D 卡欄位命名加「累計」前綴

**選擇**：印件詳情頁 D 卡 `ErpSummaryGrid` 的 label 加「累計」前綴：
- 「預計總數」→「累計預計總數」
- 「完成數」→「累計完成數」
- 「入庫數」→「累計入庫數」
- 「工單完成」→維持原樣（原本就明確是聚合）

工單詳情頁 D 卡維持原樣（「目標數量 / 生產數量 / 入庫數量」），因為單工單語境無歧義。

**理由**：使用者若同時打開印件頁與該印件下某工單頁對照，會看到「累計完成數 80」vs「生產數量 30」，label 差異可立即傳達「前者是跨工單加總、後者是本工單」，避免誤判為系統錯誤。

**替代方案**：在印件頁 D 卡上方加細字註解「以下為所有關聯工單加總」。

**選擇前者的理由**：label 前綴的訊號在 cell 內即完整呈現，使用者掃描時不需閱讀額外註解。

### D8：範圍僅限三頁，不納入訂單詳情頁

**選擇**：不改 `OrderDetail.tsx` 的印件 Tab 與 `MockEcOrderDetail.tsx`。但 tasks 加入**欄位比對驗證**步驟：B 卡欄位集 MUST 涵蓋訂單詳情頁印件 Table 的所有欄位，若發現訂單頁有 B 卡缺的欄位（命名不一致、內容差異），需補入 B 卡並同步回印件 / 審稿 / 工單三頁。

**理由**：
- 業務在訂單詳情頁的印件 Tab 只需知道「可出貨多少、有無安排」，不需要完整製作細節；訂單頁印件 Tab 的**用途與三頁詳情頁不同**，強套四分類會破壞原有用途
- 訂單頁是**印務不會常看**的頁面（Miles 確認），印務痛點集中在工單頁，訂單頁排除不影響本次價值
- MockEcOrderDetail 是 B2C 會員視角，資訊簡化版，共用元件過度設計
- 優先驗證三頁統一效果，若未來訂單頁印件 Tab 要重用 B 卡（例如業務反映欄位不齊），再開 change

**權衡**：訂單詳情頁的印件 Tab 繼續以自有欄位清單運作。本 change 以「欄位比對」保證不出現「工單頁寫『印件規格』、訂單頁寫『印件備註』、實際是同樣內容」的命名不一致，這是最小必要的一致性保證。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 工單詳情頁變長（多 2 張卡），影響掃描速度 | D6：工單頁卡順序改為 A→D→B→C，印務第一眼仍看到進度；Lovable 驗證視覺密度 |
| 共用元件若未來有「工單頁要看更多印件資訊」需求，需擴充 props | D2：元件吃 ViewModel interface，跨頁差異應走 A 卡自組或擴 ViewModel 欄位，不擴 B 的具體 props |
| `derivePrintItemStatusFromWOs` 在工單詳情頁需查全部關聯工單，store 未載入可能派生錯誤 | D4：store hydration 空窗期顯示 loading skeleton；輸入集合 MUST 排除作廢工單 |
| 打樣工單 + 大貨工單並存時派生狀態語意模糊 | D4：B 卡 Badge 附 tooltip 揭露派生基礎（「基於 N 張工單：打樣 X 張 / 大貨 Y 張」），讓印務自行判讀 |
| 審稿詳情頁保留 Stepper 但工單頁不保留，造成 B 卡頂端佈局不一致 | 接受此差異：審稿人員高度依賴輪次視覺化；共用元件以 optional prop 控制是否顯示 Stepper |
| 印件頁 D 的聚合數字與工單頁 D 的單工單數字易被誤讀為不一致 | D7：印件頁 D 卡欄位加「累計」前綴，透過 label 即時傳達聚合語意 |
| 訂單詳情頁印件 Tab 繼續使用舊欄位，與三頁四分類不完全一致 | D8：tasks 加入欄位比對驗證；若訂單頁有 B 卡缺的欄位，補入 B 卡回饋三頁 |
| 未來 `PrintItem` 若新增獨立 status 欄位，派生邏輯需過渡 | D4 已定義過渡路徑：`printItem.status ?? derivePrintItemStatusFromWOs(...)`，需開新 change 執行 |

## Open Questions

以下三項將於收尾時寫入 [Notion Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)：

- **OQ-A**：工單詳情頁的 B 卡新增後，是否需要「一鍵跳轉印件詳情頁」入口？目前 A 卡的「關聯印件（連結）」已提供導航，但若 B 卡標題列旁補 ExternalLink icon 會更好找。Lovable 驗證後決定。
- **OQ-B**：若印件詳情頁 D 卡的 `ErpSummaryGrid` 未來要加進度條視覺化（目前 `print-item-detail-progress` change 決定不放），本 change 維持不放，但需觀察 UAT 反饋。
- **OQ-C**：審稿詳情頁資訊分組規範未在任何獨立 capability spec 中明確定義（prepress-review capability 尚未建立）。本 change 先在 Prototype 層對齊三頁，`prepress-review` capability 建立時需回頭補對應 spec delta。
- **OQ-D**：訂單詳情頁印件 Tab 的欄位比對若發現命名不一致項目，列為後續對齊任務的輸入。
- **OQ-E**：UAT 期間追蹤「管理層在 Slack 詢問印件進度的頻次」，若未顯著下降，需檢視印件詳情頁是否還缺關鍵資訊（成功指標驗證）。
