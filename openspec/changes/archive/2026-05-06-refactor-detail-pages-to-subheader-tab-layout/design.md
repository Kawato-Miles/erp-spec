## Context

### 現狀

ERP Prototype 兩個詳情頁因「Tabs 之上資訊卡 + Tab 內單層 Table + Tab 內子母 Table」三類內容堆疊在同一捲軸內，視覺長度失控：

| 頁面 | 行數 | Tabs 之上資訊區 | Tab 內最複雜結構 |
|---|---|---|---|
| [WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx) | **1974**（最長頁）| 4 張 ErpDetailCard（工單資訊 / 生產資訊 / 印件檔案 / 退回原因條件）| 異動紀錄 Tab：PT 異動快照子母 Table |
| [PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx) | 1145 | 3 張 ErpDetailCard（印件資訊 / 印件檔案 / 生產資訊）| 工單與生產任務 Tab：印件 → 工單 → 任務 → PT 3 Category Tabs（4 層巢狀）|

進入頁面要先捲過 600px+ 資訊區才能進到 Tab。

### 設計反轉脈絡

本 change 經歷一次重大設計反轉，紀錄如下：

**初版設計（提案階段）**：引入新元件 `ErpDetailSubHeader`（rounded container + 4 欄 context-keeping metadata + 排程進度進度條），參考 [Figma 中台商品編輯頁](https://www.figma.com/design/ir3n64dyNMuAXG5Iy5R8el/ERP-中台設計?node-id=7187-300805) 的 Sub-header 折衷版型。decisions D1-D9 圍繞此版型展開（含與訂單 pilot ErpDetailHero 的差異化、metadata 4 欄 JTBD 對齊、進度條映射狀態機等）。

**反轉觸發（apply 階段，Lovable 視覺驗證後）**：Miles 指示「不要留 Sub-header 容器，直接整合到資訊 tab 中」。澄清後選定方向：**完全取消 Sub-header 容器與 metadata 4 欄設計，回到 `ErpPageHeader`，metadata 不要了**。

**反轉理由（D10）**：
1. **視覺累贅**：Sub-header rounded container 增加一層視覺邊框，與下方 Tabs 容器並列形成兩個 rounded card，視覺密度過高
2. **metadata 重複資訊**：4 欄 metadata（交期 / 完成度 / 排程進度 / 負責印務 等）內容已在「資訊」Tab 的生產資訊卡內呈現（「交貨日期」「完成度」「排程進度」），Sub-header 的副本造成資訊重複
3. **context-keeping 不必要**：工單 / 印件主用者（印務）的操作集中於 Tab 內，切 Tab 後 metadata 即離開視窗也不影響操作流；持續監看狀態的需求弱於業務追蹤客戶詢問場景（訂單 pilot 適用 sticky Hero）
4. **元件抽象成本與收益不對稱**：`ErpDetailSubHeader` 元件僅本 change 兩頁使用，未來推廣若不適配（如需求單 / 審稿頁主用者不同），元件抽象將成為負擔

**反轉後 change 範圍**：純 Tabs 化（資訊卡進「資訊」Tab）+ 印件狀態 Badge bug 補修 + DESIGN.md §6.3.1 新增「Tabs 化版型」範式。

**保留的初版決策**：D3（資訊卡進資訊 Tab）/ D4（defaultValue=info）/ D6（退回原因 InfoBanner）/ D7（補修狀態 Badge bug）— 這些決策在反轉後仍適用。

**取消的初版決策**：D1（採 Sub-header 折衷）/ D2（不 sticky）/ D5（metadata 4 欄）/ D8（排程進度進度條）/ D9（工單數分母）— 全部失效，OQ-4 / OQ-5 自動取消。

### 限制與既有資產

- 平台限制：ERP 僅桌機（不規劃行動裝置），可假設視窗寬度 ≥ 1280px
- DESIGN.md §0.1 既有原則：「業務流先後 + 活動紀錄末位」「同層級僅一個 Primary CTA」「禁 Emoji」「印件三分類獨立 ErpDetailCard」「Header 只承載實體名稱 + 主動作」
- DESIGN.md §1.4 既有元件：`ErpPageHeader`（sticky）/ `ErpDetailCard` / `ErpDetailTabs` / `ErpInfoTable` / `ErpSummaryGrid`
- 既有 `PrintItemStatusBadge`（[shared/PrintItemStatusBadge.tsx](sens-erp-prototype/src/components/shared/PrintItemStatusBadge.tsx)）+ `derivePrintItemStatusFromWOs`（[utils/printItemStatus.ts](sens-erp-prototype/src/utils/printItemStatus.ts)）已實作，本 change reuse 即可

## Goals / Non-Goals

### Goals

1. 「Tabs 之上太長」核心痛點解除：3-4 張資訊卡離開主軸捲動、收進「資訊」Tab 首位
2. 修正既有 PrintItemDetail 印件狀態 Badge 缺失 bug（違反 DESIGN.md §0.1 規範）
3. 為後續需求單 / 審稿詳情頁同步重構建立可遵循的「Tabs 化版型」範式（DESIGN.md §6.3.1）

### Non-Goals

1. 不重構訂單詳情頁（既有 `refactor-order-detail-to-hero-tab-layout` 維持 Sticky Hero pilot）
2. 不重構需求單 / 審稿詳情頁（本 change pilot 後另立推廣 change）
3. 不重構 Tab 內子母 Table（原樣保留）
4. 不引入新狀態 / 新計算邏輯 / 新角色權責（不觸及 state-machines / business-processes / user-roles spec）
5. 不修訂 DESIGN.md §0.1「印件三分類」核心規範（僅補語意說明卡片可在 Tab 內或 Tabs 之上呈現）
6. **不引入新元件**（反轉後決策；初版的 `ErpDetailSubHeader` 已刪除）

## Decisions

### Decision 3：資訊卡進「資訊」Tab 首位，保留三分類獨立卡邊界

**選擇**：

- 工單詳情頁原 4 張資訊卡（工單資訊 / 生產資訊 / 印件檔案 / 退回原因）→ 前 3 張移入「資訊」Tab 內單欄垂直排列；「退回原因」獨立成 ErpPageHeader 下方 InfoBanner（D6）
- 印件詳情頁原 3 張資訊卡（印件資訊 / 印件檔案 / 生產資訊）→ 全部移入「資訊」Tab 內單欄垂直排列
- 三張卡保留 `ErpDetailCard` 邊框，依 DESIGN.md §0.1 三分類規範各自獨立

**否決方案**：

- **三卡合併為「三口雙欄」單一 Tab 內 view**：視覺更輕，但需修訂 §0.1「三分類獨立 ErpDetailCard」核心規範。否決理由：本 change 範圍應收斂，§0.1 是跨頁面共識，不要為單一版型重構而動規範核心。
- **三卡保留在 Tabs 之上、僅加 Sub-header**：問題不解，「Tabs 之上太長」核心痛點未消除。

**§0.1 規範語意微調**：保留「印件三分類獨立 ErpDetailCard」原則，補語句「卡片可在『資訊』Tab 內或 Tabs 之上呈現，依詳情頁版型決定」。原則本質不變。

### Decision 4：defaultValue =「資訊」Tab（首位）

**選擇**：工單 5 Tabs / 印件 7 Tabs 的 defaultValue 均為「資訊」（首位）。

**理由**：使用者進入詳情頁的第一個動作通常是「確認這張單據是什麼」（核心屬性 / 進度），而非直接深入特定 Tab 任務。資訊 Tab 整合了三分類規範卡片，預設打開可一次性涵蓋實體完整脈絡。

**對印件詳情頁的副作用**：原既有 `reviewHistoryTabDefault` 動態邏輯（依 `reviewDimensionStatus` 帶到審稿紀錄 Tab）失效。已 commit 移除該變數（unused after refactor）。若驗收期使用者反饋「審稿階段應預設審稿 Tab」，可後續迭代恢復動態邏輯（成本低，僅一個 ternary）。

### Decision 6：工單「退回原因提示」改為 ErpPageHeader 下方獨立 InfoBanner

**選擇**：既有 [WorkOrderDetail.tsx 行 798-807](sens-erp-prototype/src/pages/WorkOrderDetail.tsx) 的「退回原因提示」（狀態=重新確認製程才出現）從資訊區第 4 張卡 → 改為 ErpPageHeader 下方獨立 InfoBanner（紅底 / 警告色，非常駐）。

**理由**：

- 此元素本質是「條件顯示警告」，不是常駐資訊。放進「資訊」Tab 內會讓使用者誤以為是常駐欄位
- 退回原因要求高可見度（印務看到要立刻處理），獨立 InfoBanner 比 Tab 內第 N 張卡更醒目
- 條件顯示邏輯（`status === '重新確認製程' && rejectReason`）原樣保留

**InfoBanner 視覺**：紅底 / 紅框 / 紅字（`rounded-xl border border-red-200 bg-red-50`），對齊 [memory/shared/ui-business-rules.md](memory/shared/ui-business-rules.md) Info Banner 模式。

### Decision 7：補修 PrintItemDetail 印件狀態 Badge 缺失 bug

**選擇**：本 change 重構 [PrintItemDetail.tsx 行 438](sens-erp-prototype/src/pages/PrintItemDetail.tsx) 的 ErpPageHeader 時，順手在 badges slot 補上 `PrintItemStatusBadge`（既有未顯示，違反 DESIGN.md §0.1 規範）。

**否決方案**：

- **另立 fix change**：違反「重構順手修」原則 — 既然要動 ErpPageHeader，順手補上更省事
- **保持現況**：違反 §0.1 規範

**狀態 Badge 取自**：既有 [PrintItemStatusBadge](sens-erp-prototype/src/components/shared/PrintItemStatusBadge.tsx) 元件 + `derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))` 工具，本 change 直接 reuse 不新建。

### Decision 10：設計反轉決策（apply 階段）

**選擇**：取消初版的 `ErpDetailSubHeader` 元件 + 4 欄 metadata 設計，回到 `ErpPageHeader`。

**反轉時點**：apply 階段 commit `5d34a77` / `e0ddc17` / `bc457a9` push 到 Lovable 後，Miles 視覺驗證指出「Sub-header 容器累贅、metadata 不需要」。

**反轉前實作（已 push 後反轉）**：
- `ErpDetailSubHeader` 共用元件（rounded container + 返回 + 標題 + Badges + metadata 1-5 欄 + 主動作；不 sticky）
- 工單 Sub-header metadata 4 欄：交期 / 完成度 / 排程進度（進度條 hover Tooltip）/ 負責印務
- 印件 Sub-header metadata 4 欄：交期 / 出貨方式 / 工單數 / 完成度
- 排程進度進度條依 STATUS_STEPS 5 段映射 0/25/50/75/100

**反轉後實作（commit `da60d87`）**：
- `ErpDetailSubHeader` 元件刪除（避免死代碼）
- 工單 / 印件 ErpPageHeader 維持原狀（sticky），承載返回 + 標題 + Badges + 主動作
- 印件 ErpPageHeader badges slot 補 `PrintItemStatusBadge`（保留 D7）
- 退回原因 InfoBanner 仍在 ErpPageHeader 下方（保留 D6）
- 5 Tabs / 7 Tabs + defaultValue="info" 結構保留（保留 D3 / D4）

**反轉後仍實現的核心價值**：
1. 三張資訊卡離開 Tabs 之上、解除「太長」核心痛點
2. 印件狀態 Badge bug 修正
3. DESIGN.md §6.3.1 新增「Tabs 化版型」範式（與訂單 pilot 的 Sticky Hero 並列為兩種版型；§6.3 長捲版型維持為第三種）

**反轉的設計教訓**（記錄供後續類似決策參考）：
- 「為了使用者持續看到 X 欄位」這類 context-keeping 假設，需在 Lovable 視覺驗證後重新校準。資訊重複（4 欄 metadata 與生產資訊卡欄位重複）會讓 sticky / 容器化設計顯得多餘。
- 元件抽象（如 `ErpDetailSubHeader`）若僅服務本 change 範圍且無強制推廣 plan，可推遲到至少三個使用點才考慮抽象。

### Decision 11：範圍擴展至訂單 / 需求單詳情頁（apply 階段）

**選擇**：本 change 範圍從原「工單 + 印件 2 頁」擴展到「工單 + 印件 + 訂單 + 需求單 4 頁全套」，建立統一的「Tabs 化詳情頁版型」（DESIGN.md §6.3.1）。

**擴展時點**：D10 設計反轉收尾後（commit `da60d87` push 後），Miles 指示「也處理訂單、需求單的詳情頁」，將 OQ-3「Sub-header 推廣到需求單 / 審稿詳情頁的範圍」直接前置處理（推廣對象從「Sub-header」改為「Tabs 化版型」）。

**訂單詳情頁實作（[OrderDetail.tsx](sens-erp-prototype/src/pages/OrderDetail.tsx)）**：
- 5 張資訊卡（訂單資訊 / 金額及付款狀態 / 發票設定[條件] / 物流設定[條件] / 客戶資訊）從原 `grid grid-cols-[1fr_380px]` 兩欄佈局移入新增「資訊」Tab 內單欄垂直排列
- Tabs 5 → 6（資訊 NEW 首位）+ defaultValue="info"（從原 "printItems"）
- 主動作（B2C 前台 Demo / 確認回簽 / 變更路徑 Tooltip / 取消訂單）保留於 ErpPageHeader

**需求單詳情頁實作（[QuoteDetailPage.tsx](sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx)）**：
- 1 張基本資訊卡（StatusStepper + 主資訊欄位 + 報價金額橫排）移入新增「資訊」Tab 內
- Tabs 4 → 5（資訊 NEW 首位）+ defaultValue="info"（從原 "items"）
- 多個條件性 inline banner（業務側提示 / 等待核可 / 業務主管視角對照）位置不變（緊貼 ErpPageHeader 之下）
- 雖然只 1 張卡視覺改善有限，但跨頁面一致性 > 視覺改善幅度，且未來資訊卡擴增時不需重構

**處理既有 [refactor-order-detail-to-hero-tab-layout](openspec/changes/) change**：
- 該 change 為訂單詳情頁的「Sticky Hero + 6 Tab」pilot，與 D10 設計反轉後的方向衝突
- apply 進度：1/46 task 完成（specs delta 寫好但未實作）
- 處置：直接 abandon — 刪除 `openspec/changes/refactor-order-detail-to-hero-tab-layout/` 整個目錄
- git history 仍可追溯該 change 曾存在；DESIGN.md §6.3.1 「版型選擇判斷準則」對照表標明 Sticky Hero 為訂單 pilot **已 abandon、改採 Tabs 化**

**為何不另立新 change 處理訂單 / 需求單**：
- 本 change 已是「詳情頁版型重構」共識，再開新 change 會讓「同一設計理念」分散在多個 change history 中，未來追溯困難
- 4 頁實作做法一致（Tabs 化 + defaultValue="info"），單一 change 涵蓋 + design.md 內標明範圍演進更清晰
- Lovable 驗收統一執行（驗收清單為 4 頁同套規則，省一次 push round-trip）

**為何不採 Sticky Hero 訂單 pilot**：
- D10 反轉理由（資訊重複 / context-keeping 不必要 / 元件抽象成本）對訂單頁同樣適用 — 業務追蹤客戶詢問場景的 metadata 4 欄（客戶 / 款項 / 出貨日 / 印件進度）大多已在訂單資訊卡與金額卡內呈現
- 統一版型 > 訂單頁特殊化，避免 OQ-1「版型分裂」風險再次出現

## Risks / Trade-offs

### Risk A：「資訊 Tab 變雜物倉」風險

三張資訊卡進 Tab 後若內容仍過長（> 1200px），代表 §0.1 三分類已不足以涵蓋資訊密度。

**Mitigation**：
- Lovable 驗收新增「資訊 Tab 內容高度 ≤ 1200px」檢查
- 若超出，後續另立 change 重新評估三分類規範或拆 sub-card

### Risk B：補修印件狀態 Badge 引發未預期回歸

補上 `PrintItemStatusBadge` 後可能與既有 ErpPageHeader 內的 deprecated `badges` prop 行為不一致。

**Mitigation**：
- 已驗證 ErpPageHeader 雖標 badges deprecated 但仍可用（既有訂單頁、工單頁皆使用）
- Lovable 驗收檢查：印件詳情頁 Badge 顯示文字與顏色對齊狀態機 spec

### Risk C：Tab 內子母 Table 不動 = 詳情頁仍可能很長

本 change 只動容器層，工單異動紀錄 / 印件「工單與生產任務」Tab 內的子母 Table 結構不變。若使用者反饋「Tab 內仍太長」，需後續另立 change 處理。

**Mitigation**：
- 本 change 範圍故意收斂（容器層先解決）
- Pilot 後評估 Tab 內視覺回歸，必要時開新 change 處理子母 Table 重構

### Risk D：印件詳情頁 defaultValue 動態邏輯失效

原依 `reviewDimensionStatus` 動態決定預設 Tab 的邏輯被取消，審稿階段使用者要多點一次切到「審稿紀錄」Tab。

**Mitigation**：
- 改為固定 `defaultValue="info"` 為 D4 一致性決策
- 若驗收期反饋為痛點，可後續迭代恢復動態邏輯（成本低）

## Migration Plan

### 第一階段（OpenSpec artifacts，已完成）

1. proposal.md（已更新反映設計反轉）
2. design.md（本檔，已更新含 D10 反轉決策）
3. specs/prototype-shared-ui/spec.md delta（待更新：移除 ErpDetailSubHeader Requirement、印件版型 metadata 描述）
4. specs/work-order/spec.md delta（待更新：移除 Sub-header 版型 ADDED Requirement、metadata 4 欄、進度條描述；MODIFIED Tab 結構保留）
5. tasks.md（待更新：標記取消的 task）

### 第二階段（Prototype 實作，已完成）

1. ~~建立 `ErpDetailSubHeader` 元件~~（commit `5d34a77`，後 commit `da60d87` 刪除）
2. 重構 [WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx)（含設計反轉收尾）
3. 重構 [PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx) + 補狀態 Badge（含設計反轉收尾）
4. 更新 [DESIGN.md](sens-erp-prototype/DESIGN.md)（§0.1 補語句 / §1.4 不增條目 / §6.3.1 新增 Tabs 化版型範式）
5. push origin/main → Lovable 自動部署
6. Lovable 驗收（依 tasks.md §10 驗收清單，移除 metadata 相關項）

### Pilot 退場條件（必須兩項全通過）

1. Lovable 驗收通過：第一屏可見性 + 兩頁 ErpPageHeader Badge 正確（含印件狀態 Badge 補修）+ Tab 結構正確（5 / 7 Tabs，defaultValue="info"）+ 三張卡邊界保留 + 退回原因 InfoBanner 條件顯示 + 子母 Table 行為不變
2. Miles 試用 5 個工作天，無「找不到 X 欄位」「審稿階段應預設審稿 Tab」等重大反饋

兩項全通過 → 啟動需求單 / 審稿詳情頁同步推廣 change（OQ-3）。

### Rollback 策略

[WorkOrderDetail.tsx](sens-erp-prototype/src/pages/WorkOrderDetail.tsx) 與 [PrintItemDetail.tsx](sens-erp-prototype/src/pages/PrintItemDetail.tsx) 各為單檔重構。本 change 共 4 個 commit（5d34a77 / e0ddc17 / bc457a9 / da60d87），若 Lovable 反饋嚴重問題，可透過 git revert 回到 ffd5ee8（本 change 起點）。

## Open Questions

### OQ-1：~~版型分裂期收斂時機~~

**已解（D10 設計反轉）**：本 change 取消 Sub-header 折衷版型，工單 / 印件統一為「Tabs 化版型」（DESIGN.md §6.3.1）。訂單 pilot 的 Sticky Hero（[refactor-order-detail-to-hero-tab-layout](openspec/changes/refactor-order-detail-to-hero-tab-layout/)）獨立適用業務追蹤客戶詢問場景。三種版型（Sticky Hero / Tabs 化 / 長捲）依 §6.3.1 判斷準則對照表選用，無需後續 unify change。

### OQ-2：印件詳情頁 spec capability 歸屬

本 change 暫將印件詳情頁「Tabs 化版型」requirement 掛在 `prototype-shared-ui` capability，但長期歸屬未決。

- 候選方案：
  1. 維持 `prototype-shared-ui`（印件版型本質是共用 UI 配置）
  2. 新建 `print-item` capability（印件作為 ERP 核心實體應有獨立 spec）
  3. 併入 `prepress-review`（既有審稿 spec，但印件範圍超出審稿）
- 處理位置：本 change pilot 後若推廣到其他模組，於該推廣 change 一併決定

### OQ-3：Tabs 化版型推廣到需求單 / 審稿詳情頁的範圍

- 需求單詳情頁（QuoteDetail）：是否同步「資訊卡進資訊 Tab」+ defaultValue="info"？需求單主用者（業務）的初次體驗是否適用？
- 審稿任務詳情頁：審稿人員以審稿 Tab 為核心操作，defaultValue 應為「審稿紀錄」而非「資訊」？
- 處理位置：本 change pilot 退場後另立推廣 change

### OQ-4：~~工單 Sub-header「排程進度」呈現方式~~

**已撤銷（D10 設計反轉）**：本 change 取消 Sub-header 與 metadata 4 欄，「排程進度」進度條設計失效。Notion UI-001 對應 OQ 標為「已解（本 change 取消 Sub-header）」。

### OQ-5：~~印件 Sub-header「工單數」分母~~

**已撤銷（D10 設計反轉）**：本 change 取消 Sub-header 與 metadata 4 欄，「工單數」欄位失效。Notion UI-001 對應 OQ 標為「已解（本 change 取消 Sub-header）」。
