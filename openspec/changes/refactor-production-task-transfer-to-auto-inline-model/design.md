## Context

2026-04-24 同日，[add-production-task-transfer](../archive/2026-04-24-add-production-task-transfer/) 剛歸檔即經三視角審查與業界研究發現核心結構需重構：

1. **印務建單是重複勞動**：排工時已指定工序流向，報工已累計數量；v0.3 仍要印務事後手動建立 TransferTicket，與既有資料脫節
2. **生產任務層無工序依賴約束**：`ProductionTask` 狀態機僅線性流轉，不表達跨工序依賴，生管派工可能派出上游尚未供料的下游任務
3. **業界做法對齊不足**：SAP PP / Oracle WIP / Dynamics 365 SCM / 印刷業 MIS 普遍採「Header + Line」結構與「佇列模型」表達工序間流轉，v0.3 的「一單多 line 印件級彙整」與業界主流並不衝突，但「印務手動建單」嚴重偏離業界自動化趨勢

本 change 重構為「**排工預填轉交設定 + 報工事件產生 Line 進待交接池 + 印務封單建立 TransferTicket Header + 依賴邊佇列量模型**」。

設計過程中與 Miles 確立的核心原則：**裝訂等齊套工序也須支援分批完成**（業務實務：急單先出 30 本、剩 70 本後送），因此**不採「上游全量到達才解鎖下游」的齊套規則**；改為**佇列量模型**，由 UI 顯示各上游邊的可用料量，現場師傅判斷實際做幾個。

**利害關係人**：
- 印務（排工 + 封單主責）：新模型下少了「事後建單」，多了「在合適時點封單交接」（一鍵動作）
- 廠務（系統外）：依封單後的 TransferTicket 執行運送，每次一張 Header（含多 Line）取代以往多張獨立單
- 生管（派工主責）：派工板新增「依賴邊佇列量」顯示，協助判斷下游何時可派
- 師傅（執行）：任務詳情頁顯示各上游邊的目前佇列量，自行決定本批做幾個

## Goals / Non-Goals

**Goals：**

- G1：消除印務手動建 `TransferTicket` 的重複勞動。報工自動產生 Line，印務一鍵封單即建 Header
- G2：建立跨工序的 `ProductionTask` 依賴約束，避免派出無料可做的下游
- G3：**支援分批完成**：上游下游皆可分批，不強制齊套；佇列量隨送達 / 消耗動態變化
- G4：對齊業界 Header + Line 模式，未來合併出貨 / 跨車次運送可自然擴展
- G5：對齊 MES 佇列模型（Oracle WIP Intraoperation Queue），系統不剛性、現場可彈性

**Success Metrics（Prototype 階段可演示驗收）：**

| Goal | 驗收檢核 |
|------|---------|
| G1 消除重複勞動 | Prototype mock 演示：印件詳情頁「轉交單」Tab 無「新增轉交單」按鈕；報工後 Line 自動進待交接池可觀察；至少一筆 mock TransferTicket 由系統自動建立而非印務手動 |
| G2 依賴約束 | Prototype mock 演示：師傅打開派工後的任務面板，所有任務皆「料齊可動」（無「打開後發現不能做」情境）；首次報工檢查嚴格阻擋佇列為零情境 |
| G3 分批完成 | Prototype mock 演示：同一裝訂任務（計畫 100 本）可分兩次完成（30 本 + 70 本），中間 Header / Line / 佇列狀態正確追蹤 |
| G4 業界對齊（Header + Line） | Prototype mock 演示：至少一張 Header 含 ≥ 2 筆來自不同上游 PT 的 Line（合併運送），廠務簽收一次完成多 Line |
| G5 佇列彈性 | Prototype mock 演示：派工板任務列下方顯示三欄佇列表格（上游 PT / 佇列量 / 消耗比例），上游送達後即時刷新 |

**Non-Goals：**

- N1：不處理「已送達」`TransferTicket` 撤回（沿用 v0.3 決策，後續另案）
- N2：不實作 Slack Webhook 自動發訊（Prototype 範疇，`slackMessageUrl` 為純 URL 欄位）
- N3：不支援跨印件的 `dependsOn`（同印件內可表達主流情境；跨印件依賴罕見，留 Phase 2）
- N4：不支援「報工 200 只轉 150 留廠補工」的例外情境（Line 數量 = 報工數量強綁定）
- N5：不引入 Time Interval / Overlap % 等業界 PP 進階關係屬性（MVP 不需要）
- N6：不支援「最低批次量強制」（現場依佇列量判斷做多少，系統不擋）

## Decisions

### D1：TransferTicket Header + Line 結構（現階段 1:1 退化）

**選擇**：`TransferTicket` 為 Header 實體，`TransferTicketLine` 為其子實體陣列。**現階段一律 1:1**（每張 Header 含唯一一筆 Line），Line 子實體保留為未來擴展預留。

**業界對齊**（Header + Line 結構與業界一致）：
- SAP Confirmation Document（Header + 多 Line）
- Oracle Move Transaction
- Dynamics 365 Route Card Journal（Header + Lines）
- 印刷業 MIS（Pace、PrintOS）的內部交接憑證

**現階段 1:1 的理由**（依 Miles 業務工作流）：
- 印刷廠每張轉交單獨立追蹤（廠務一張一張處理），不批次合併
- 廠務通知印務「我送到了」是逐單動作，不需「合併簽收」
- 一車多批貨的物流彈性由廠務線下處理，不污染系統資料模型

**保留 Line 結構而非扁平化的理由**：
- 未來若有「同一報工事件對應多個下游」（複雜的多工序分料）情境可擴展
- 資料模型一致：未來若需「合併運送」（同一車多 Header 合併簽收），Line 結構支援
- 不增加實作成本（現階段一律 1:1 等同扁平化的程式邏輯）

**替代方案否決**：
- v0.3 印件級彙整單據（印務手動建多 Line）→ 否決，重複勞動
- 完全扁平化（移除 TransferTicketLine 實體）→ 否決，未來擴展受限

### D2：依賴邊單一類型（流水線）+ 多邊 AND + 派工硬擋

**選擇**：`ProductionTask.dependsOn` 為依賴邊陣列，每元素含「上游 PT 引用 + 用量倍率」。**無解鎖類型枚舉**（不分流水線 / 齊套）。

**解鎖判定邏輯**：
- 單邊解鎖條件：上游任一已送達（未作廢）Line 的 quantity 累計 ≥ 1
- 下游可派工 = 全部依賴邊 AND 解鎖
- 派工 action **硬擋** 佇列為零任務（不允許 override）

**派工硬擋的理由**（Miles 強調）：
> 我希望師父打開生產任務面板時，就已經是確定要做的，不應該有要做發現不能做，增加師父的問題

意義：派工通過 = 料保證齊全可動；師傅打開即可開工，不會出現「派來了卻不能做」的尷尬。生管預先排程的需求（CEO 提及）由「料到自動觸發派工提示」處理，不是 override 派工門檻。

**裝訂分批支援機制**：靠**佇列量**（送達 − 消耗）動態表達可做數量，**不靠系統強制齊套**。

**Miles 關鍵回饋**（推翻先前齊套邊設計）：
> 裝訂也要可以支援分批完成，所以不是用完成來定義

**為什麼不分流水線 / 齊套**：
- 「齊套」若定義為「上游全量到達」會擋住分批裝訂的常見業務場景（急單先出 30 本）
- 多邊 AND（每邊至少首批到）已足以表達「裝訂需要 P1+P2 都至少有料」的依賴語意
- 「實際能做幾本」是現場判斷，不是系統強制

**替代方案否決**：
- 雙類型（流水線 + 齊套）→ 否決，齊套阻擋分批
- 業界完整 FS/SS/FF/SF + Time Interval → 否決，MVP 不需要、複雜度過高
- CEO 建議「警示 + override」→ 否決，師傅打開不能做會增加困擾

### D3：佇列量計算模型（不存欄位）

**選擇**：佇列量 = 計算衍生值，不存於資料表。

**公式**：
```
某下游任務 D 的某依賴邊 E（指向上游 U）的佇列量 = 
  Σ(已送達 Line.quantity)
    where Line.來源生產任務 = U
      AND Line.目的生產任務 = D
      AND Line 所屬 Ticket.狀態 = 已送達
  −
  Σ(D 的報工量 × 該邊消耗比例)
    where 報工狀態 = 已確認
```

**消耗比例**：每條依賴邊定義「下游每生產 1 單位消耗該上游多少單位」（OQ-D5 採 (b) 印務手動標）。

**範例**：
- BOOK-裝訂 計畫 100 本，依賴 P1-裁切（消耗比例 1）+ P2-折頁（消耗比例 5）
- 已送達：P1-裁切 100 張、P2-折頁 250 張
- 已報工裝訂：30 本
- P1-裁切邊佇列 = 100 − (30 × 1) = 70
- P2-折頁邊佇列 = 250 − (30 × 5) = 100

**為什麼計算而非儲存**：
- 避免「儲存值 vs 公式」的雙重真相（先前審查指出的核心漏洞）
- 事件 replay / mock 重建天然正確
- 同步性：每次查詢即時算，效能可接受（同印件內生產任務 ≤ 10 筆）

### D4：報工自動建立 TransferTicket Header（1:1）+ 印務手動確認送達

**選擇**：對齊印刷廠實務協作流程：

1. **報工事件**（師傅 / 供應商 / 生管代報）→ 系統自動建立 TransferTicket Header（狀態 = 運送中），含一筆 Line（quantity = 報工量、destinationProductionTaskId = 該上游 PT 的下游依賴邊指向）
2. **廠務依轉交單進行實體運送**（線下動作，系統不介入）
3. **廠務送達後通知印務**（線下溝通，例：Slack / 電話 / LINE）
4. **印務於系統內手動標 Header 為「已送達」**，同時必填簽收照片（signaturePhotos）作為 log
5. **印務未收到通知 → 主動聯繫廠務確認狀況**（線下，系統不介入）

**Header + Line 結構保留但 1:1 運作**：
- 每張 Header 對應一次報工事件，含**唯一一筆** Line
- Line 子實體保留為未來「合併運送」（同一報工事件對應多個下游 / 同一車多筆 Header 合併）擴展預留
- 現階段不實作合併動作，所有 Header 皆 Header:Line = 1:1

**取消的設計**（先前版本中存在但本次推翻）：
- 「待交接池」概念取消（報工不暫存，直接建 Header）
- 「印務封單」動作取消（系統自動，無印務介入）
- 「待交接中心」UI 取消
- 「18:00 自動兜底封單」取消
- 「待印務確認」狀態取消（Header 直接是「運送中」）

**TransferTicket 狀態機**（簡化回 v0.3 同形）：
- 建立即「運送中」（系統報工事件觸發）
- 「運送中」→ 「已送達」（印務手動標記，必填 signaturePhotos）
- 「運送中」→ 「已作廢」（印務手動標記，填作廢原因）
- 「已送達」與「已作廢」為終態

**Miles 業務工作流原文**：
> 1. 報工後自動建立轉交單
> 2. 廠務依照轉交單進行轉交
> 3. 轉交完成後通知印務，印務確認沒問題後，將轉交單改為已轉交
> 4. 沒收到通知的話，印務要去聯繫廠務確認狀況

### D5：依賴邊用量倍率由印務手動標註（BOM 自動建議 + 手動覆寫）

**選擇**：印務在生產任務排工時，為每條依賴邊設定「用量倍率」欄位（OQ-D5 採 (b)），命名上明確為「**下游每生產 1 單位需消耗該上游多少單位**」（例：裝訂 1 本要 5 張內頁，倍率 = 5），非百分比。

**降低印務工作量的補強機制**（採 ERP 顧問 R2 建議）：

1. **新建 PT 時依 BOM `process_master.sort_order` 自動建議 dependsOn**：印件內 sort_order 為 N 的 PT 自動帶入 sort_order = N-1 的 PT 為上游（前提：上游 transferRequired=true）。印務可調整或刪除
2. **依工序類型建議用量倍率**：UI 提供「建議值」按鈕（裁切 = 1、模切 = 1、裝訂依本書內頁張數依 BOM 推算等）
3. **第一次基於某依賴邊報工時跳 confirm**：「依此倍率本次報工將消耗上游 [N 單位]，是否確認？」防止標錯導致佇列大量誤算
4. **異常監控**：當下游報工累計消耗 vs 上游送達累計嚴重背離時 UI 強警示複核

**理由**：
- BOM 推算（a）目前 BOM 結構未完整，作為理想長期方向
- 不記錄比例（c）系統無法擋「料不夠卻要報工」
- 手動標註（b）+ 上述補強 = MVP 可行，印務工作量可接受
- 未來 BOM 結構完整後可改為自動推算 + 印務覆寫（此設計留擴充空間）

**UI 收集**：生產任務編輯頁的依賴邊區塊，每條邊有「用量倍率」數字欄位 + 建議值按鈕 + 註解「下游每生產 1 單位消耗該上游多少單位」。

### D6：上游作廢 Line 的佇列量重算

**選擇**：作廢的 Line（其所屬 Ticket 狀態 = 已作廢）**不計入佇列量**。

**情境**：
- A 送達 Ticket T1（含 Line L1，數量 100）
- B 已開工，消耗 20 → 佇列 = 100 − 20 = 80
- 印務作廢 T1（送錯廠）
- 重算佇列 = 0 − 20 = -20

**佇列負數處理**：
- 若 B 已開工（已有報工紀錄），不回退報工，佇列保持負值，UI 顯示警示「實際生產量超過已送達量，請補送料」
- 若 B 未開工，佇列負值不影響（B 仍可派工但實際無法報工）

**為什麼用「未作廢累計」而非「永久累計」**：
- 簽收邏輯一致（作廢的料不算曾交付）
- 補救機制：印務需重新送料補上佇列

### D7：環形依賴防護

**選擇**：新增 / 編輯 `dependsOn` 時，系統以 DFS 檢查環形依賴傳遞閉包。

**演算法**：
```
新增依賴：D 的 dependsOn 加入 U
檢查：U 的 dependsOn 傳遞閉包是否含 D？
是 → 拒絕（A→B→A 或 A→B→C→A 等所有環形皆禁止）
否 → 允許
```

**效能**：同印件內 ProductionTask 通常 ≤ 10 筆，DFS 時間 O(V+E) 完全可接受。

### D8：依賴限制同印件內

**選擇**：`dependsOn` 引用的上游 PT MUST 與下游 PT 屬同一 `printItemId`。

**理由**：
- 跨印件依賴場景罕見（代工、合併工序）
- 限制可大幅簡化 UI 選擇器（同印件內任務數有限）
- MVP 範疇

### D9：上游作廢阻擋（被引用時不可作廢）

**選擇**：若 PT A 被任一其他 PT 的 `dependsOn` 引用，A 的作廢操作 MUST 被系統阻擋，提示「請先修改下游依賴」。

**理由**：避免「下游依賴已不存在的上游」的孤立狀態，強制印務明確處理依賴解除。

### D10：transferConfig 中途變更不回朔已建 Ticket

**選擇**：印務變更 `ProductionTask.transferConfig`（例：改貨運行）僅影響後續報工自動產生的新 Line / Header；已建 Ticket 不動。

**理由**：
- 已建 Ticket 的資訊已發送給廠務，改動會造成現場混亂
- 印務需手動通知廠務（廠務系統外角色）
- 例外情境走「作廢原 Ticket + 新報工自動建新 Line + 新封單」路徑

### D11：Slack 連結維持選填 URL 欄位

**選擇**：`TransferTicket.slackMessageUrl` 保留為字串 URL 欄位。Prototype 階段不實作 Webhook，印務手動填；未來 Webhook 上線後改自動。

## Risks / Trade-offs

- **[風險] 消耗比例由印務手動標，可能忘填或標錯** → 緩解：(1) 排工時 transferRequired=true 時消耗比例必填；(2) UI 在依賴邊新增時提供「依工序類型建議值」（裁切預設 1、裝訂預設依本書印件用量）
- **[風險] 佇列量計算每次查詢即時算，若印件內 PT 多可能效能下降** → 緩解：MVP 同印件 PT 通常 ≤ 10，計算成本可接受；若未來高頻可加 memoization 快取
- **[風險] 印務忘記封單導致 Line 滯留待交接池** → 緩解：每日 18:00 自動封單兜底；UI 顯示池內 Line 計數提示印務
- **[風險] 佇列負數的 UX 不直覺** → 緩解：UI 強警示，並提示具體補送量；後續可加「自動建立補送提案」
- **[風險] 業務臨時改交貨批次（30 本急出改成 50 本）需重新標料歸屬** → 緩解：Line 與「交貨批次」非強綁定，師傅報工時依當下佇列實際做多少；批次概念在出貨單層面承擔，不污染轉交層
- **[風險] 報工後到封單前的 Line 滯留期間，廠務未收到訊息可能延誤** → 緩解：印務每日固定時點封單（如午休前、傍晚收班前）為標準作業流程
- **[風險] 多次重寫 change（v0.3 → 1:1 扁平 → A' 齊套邊 → A' 流水線 + 佇列）導致團隊困惑** → 緩解：Notion OQ PT-004 維護完整決策脈絡；archive 保留 v0.3、本 change 為當前正本

## Migration Plan

Prototype 階段無 production migration，以下為 store / mock 重設步驟：

1. **資料模型重構**：
   - `TransferTicket` 維持 Header 結構，狀態三態（運送中 / 已送達 / 已作廢）
   - 保留 `TransferTicketLine` 實體（每 Line：來源報工 / 目的生產任務 / 數量；現階段每張 Header 含唯一一筆 Line）
   - `ProductionTask` 移除 `prerequisiteMet` 欄位（改用佇列量計算）
   - `ProductionTask.dependsOn` 改為物件陣列：`[{ upstreamPtId, consumptionRatio }]`
   - `TransferTicket.signaturePhotos` 在「已送達」狀態必填

2. **Mock 資料遷移**：
   - 每個 v0.3 mock TransferTicket 沿用 Header
   - 既有 mock 印件依工序順序推論初始 dependsOn + 預設消耗比例
   - 既有 mock 印件確保有部分 TransferTicket 為「已送達」狀態（含 signaturePhotos placeholder）

3. **UI 重構**：
   - 印件詳情頁「轉交單」Tab：移除「新增轉交單」按鈕，改顯示自動產生的 Header 清單；每個 Header 展開顯示其包含的 Line
   - 「轉交單」Tab 提供「標記已送達」操作：彈出對話框，必填上傳簽收照片
   - 生產任務編輯頁：新增 transferRequired / transferConfig + 依賴邊（含消耗比例）+ 環形驗證
   - 派工板：每個任務列下顯示各依賴邊的「上游名 + 佇列量」三欄迷你表格
   - 報工對話框：成功後直接建立 TransferTicket Header（運送中），顯示 Toast「已建立轉交單 TT-XXX」

4. **計算 helper**：
   - `computeQueueQuantity(downstreamPtId, edge)`：佇列量計算
   - `isReadyToDispatch(pt)`：所有依賴邊佇列量 ≥ 1
   - `consumeQueueOnReport(pt, reportedQty)`：報工時推算消耗（依各依賴邊 consumptionRatio）
   - `detectCycle(ptId, candidateUpstream)`：環形 DFS
   - `confirmTransferDelivered(ticketId, photos)`：標已送達 + 寫入 signaturePhotos 必填

**Rollback 策略**：Prototype 單分支開發，重大瑕疵 revert commit 回 v0.3。

## D12：終端工序不產生 Line + 印件成品由 affects_product 齊套

**選擇**：終端工序（無下游 PT 引用，意即作為印件最末工序）報工**不產生** TransferTicketLine。印件的成品累計量沿用既有 `ProductionTask.affects_product` 欄位機制：

- `affects_product = true` 的所有 PT 為「決定印件成品數的工序」
- 印件成品累計量 = MIN(所有 affects_product=true PT 的 produced_qty)
- 實務上印務通常只在最末工序（如裝訂）勾 `affects_product=true`，其他工序設 false → MIN 退化為單一終端工序的 produced_qty
- 多個獨立終端工序（套書多冊 / 印件含多種成品）情境，MIN 自然取得齊套後本數

**Miles 邏輯**：
> 報工代表已經轉交完才會進製作；或不需轉交就可製作

意義：能報工的 PT 必定通過依賴邊佇列檢查（料齊），所以報工本身就代表「上游已轉交完成」。終端 PT 不需要再向誰轉交，報工 = 成品落到工廠成品堆，等出貨單拉貨即可。

**為什麼不用 TransferTicket 表達成品入庫**：
- 業界做法：SAP Goods Receipt / Oracle Move Completion 都是獨立 transaction，不混入 transfer
- 概念純化：TransferTicket 專責「PT → PT 之間的物料交接」，不擴張為「PT → 成品倉」
- 實作簡化：終端 Line 的 destinationProductionTaskId 不需設 NULL 特例

**對應的 spec 改動**：
- TransferTicketLine.destinationProductionTaskId 改為**必填**（不再允許 NULL 入庫情境）
- 移除「終端工序產生入庫 Line」的 Scenario
- 終端工序的判定：「該 PT 不被任何其他 PT 的 dependsOn 引用」 → 報工不產生 Line
- 印件成品計算：依現有 affects_product 規則，本 change 不修改

## Open Questions

- **OQ-D1**：`transferRequired=true` 但 `transferConfig` / 用量倍率未填妥的 PT 草稿狀態。建議：草稿允許空白；狀態轉「待處理」時驗證必填
- **OQ-D3**：跨印件依賴（套書、合版工序）是否在後續 change 加入。建議：暫不支援，待業務情境累積足夠案例後評估
- **OQ-D4**：佇列負數時的 UI 警示與補救流程細節。建議：apply 階段 UAT 時與印務確認
- **OQ-D5**：用量倍率是否支援「複雜公式」（如裝訂用內頁張數依書本實際頁數變動）。建議：MVP 用固定整數，動態公式待後續
- **OQ-D6**：「料到自動觸發派工提示」（讓生管知道某下游已可派）是否在 MVP 提供。建議：不做，派工板的佇列量視覺化已足夠提示
