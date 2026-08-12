# 生產階段校正 Handover（段 1 完成 → 段 2 接手）

> 最後更新：2026-08-06。接手者讀完本檔即可續作段 2，不需回溯前一段對話。

## 一、這件事在做什麼

以 **wiki 為基準**，把生產階段的 openspec 規格與 erp prototype 校正到一致。起因是 wiki 於 2026-07 至 2026-08 完成生產階段重構與拍板擴散，但下游兩層沒跟上。

分四段執行，每段一個 OpenSpec change：

| 段 | 範圍 | 狀態 |
|----|------|------|
| 1 | 製作細節確認 → 工單建立與分派 → 製程規劃 → 製程審核 → 交付產線 → 生管派工 → 外發派單 | **完成並 archive**（`2026-08-06-correct-production-stage-seg1`） |
| 2 | 報工、場內轉交 | **完成並 archive**（`2026-08-11-correct-production-stage-seg2`）：五批實作＋每批稽核修正＋verify 修正輪，main specs 已合併（含 A2 檔頭）；拍板紀錄 `production-stage-seg2-alignment.md`（十節）；轉交範圍收回為產線 → 產線、產線 → 品檢站兩類（暫存區三類留段 3，見 § 八 B2）；另案 A1（設備停機來源）、A3（bubble-up 全庫清整）與 warehouse_qty 死欄位留後續 |
| 3 | 品檢、齊套與完工判定、出貨、送達、訂單完成＋五項附屬（SHP-017、A8、A9、A10、認列工單遷回貨運單） | **完成並 archive**（`2026-08-12-correct-production-stage-seg3`）：七批 46 項 tasks＋3 輪補修＋verify 修正，每批 Opus 稽核；main specs 合併 19 MODIFIED／4 ADDED／4 REMOVED（出貨行為單一落點歸 shipment）、validate 全過；erp 分支疊 33 commit（`29385aa`…`b7837c2`）；wiki 落卡兩批（批次一 21 卡＋新情境卡品檢通過入庫、批次二 10 條含短出結案正名 15 卡與訂單手動推進規則）；SHP-017 甲案結案、PT-011 前提修正註記。設計正本 `production-stage-seg3-design.md`、拍板紀錄 `production-stage-seg3-grill.md`（§ 一～一之四）、as-is 正本 `production-stage-dispatch-waybill-asis.md`（**ERP 後端＝`sens-print-core`，`sensation-api` 是 EC 後台勿認錯**）、稽核三輪 `production-stage-seg3-audit-r1/r2/r3.md` |
| 4 | 副流程（**生產側**）＋審稿段（C1）。**切兩個 change**：段 4A＝副流程生產側、段 4B＝審稿段 openspec 棄用重寫 | **4A change 已開**（2026-08-12）：grill 拍板 30 條（`production-stage-seg4-grill.md`）→ 設計 v3 三輪 plan-audit 收斂（含三雙盲對抗鏡頭）→ Miles 拍板 → wiki 落卡三批次 25 卡（含 PT-034／PT-044 具名翻案取代註記）→ `correct-production-stage-seg4a` 四 artifact 齊（8 capability delta、tasks 29 項）、validate 通過；**下一步 `/opsx:apply`**。關鍵翻案：售後與補做統一（廢補印印件型別、售後單零前提）、出貨建單額度單軌（段 3 R2 翻案）、取消連鎖五層。4B 待 4A apply 後開。**舊 repo sens-erp-prototype＋Lovable 已全面棄用**（正本 CLAUDE.md § 偏好） |

## 二、工作方法（沿用，不要另創）

### 模型分工（Miles 2026-08-06 拍板，正本在 memory `feedback_model_split_opus_for_agents`）

| 角色 | 職責 |
|------|------|
| Sonnet high | 機械式修正與查詢（批次換字、grep 盤點）、**實作** |
| Opus high | wiki／openspec 的修改與修正、**稽核**（禁給修改建議、統一由 Fable 裁決；確定是規格問題就停下不修，待規格定案再回到實作）、plan-design／plan-audit |
| Fable（主對話） | 方向、設計、**所有裁決** |

### 每段的執行流程

```
差異盤點（已完成，見差異矩陣）
  → plan-design 撰寫商業層設計（五必含段）
  → plan-audit 稽核（Opus，rubric 三值判定＋強制證據）
  → Fable 逐項裁決 → 修正至全過
  → Miles 拍板
  → wiki-amend 落卡（BRD 先於 PRD）
  → /opsx:propose 建 change（proposal → specs → design → tasks）
  → /opsx:apply 分批實作（Sonnet，經 erp repo prototype-from-prompt skill）
  → 每批 Opus 稽核 → Fable 裁決 → 修正 → commit
  → /opsx:verify → 裁決 → 修正
  → /opsx:archive
```

### 實作的硬性約束

- **只動 erp repo**（`/Users/b-f-03-029/erp`），分支 `prototype/production-stage`，**不開 PR**
- 實作 MUST 經 repo 內 skill `.claude/skills/prototype-from-prompt/SKILL.md`：套既有配方與真元件、禁自創 UI、禁手寫 hex 與 px、巢狀表用 `packages/shared/styles/table.js` 的 `SubTableWrapper`（不用 `size="small"`）
- 只動 `apps/erp/src/app/(prototype)/`，不碰 `(dashboard)/`
- dev server：`http://localhost:3000`（`.claude/launch.json` 的 `erp` 設定，`autoPort: false`）

## 三、關鍵檔案

| 檔案 | 用途 |
|------|------|
| `production-stage-alignment-diff-matrix.md` | **四段差異矩陣**（156 項）＋實作階段追加發現 A1–A10。段 2 開工先讀「段 2」全部 |
| `production-stage-seg1-design.md` | 段 1 商業層設計（含五必含段、48 項差異對照），段 2 的設計比照此格式 |
| `production-stage-handover.md` | 本檔 |
| `openspec/changes/archive/2026-08-06-correct-production-stage-seg1/` | 段 1 的四份 artifact（proposal／design／specs／tasks 65 項） |
| `memory/Sens_wiki/wiki/erp/` | 商業正本（BRD），任何設計以它為準 |
| `/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/ACCEPTANCE.md` | 86 項驗收操作，段 2 要續補 |

## 四、段 1 做完了什麼

### wiki（32 卡）
拍板擴散（製作討論串、品檢處置兩軸、預計開工日正名、交付產線定義、A3／B9／B1、切終態統一印務、折損率回 QC-004、良率排除外發、接收確認擴及加工廠、訂單類型值域對齊介面用語）、死引用回填（QC-003／QC-004／PT-001／PT-007）、內部矛盾修補（線下訂單流程退回敘述、派單狀態圖直接弧、數量帳彙稱）。

### openspec（5 份 main spec）
新增 3 個 Requirement、修改 18 個、移除 1 個。兩個 BREAKING：外發完成改依報工收斂（B1）、派單刪除訂單管理人確認站（B9）。

### prototype（7 個 commit）
新增待確認製作細節佇列頁、製作討論串、統一印件詳情頁（審稿頁升格、兩個抽屜廢除）、加開與刪除空草稿、製程審核待辦佇列、製程規劃三段區塊＋拖曳、交付產線與收回守衛加嚴、生管接收確認、外發認列與點收與報工收斂、編號統一（印件 `PI-年-四碼`、工單 `WO-年-四碼`、配方 `PS-`／`BR-`）。

## 五、段 2 開工前必看

### 已知待裁決口徑（段 2 主場）

| 編號 | 議題 | 出處 |
|------|------|------|
| A7 | 一印件多工單時，印件層產出數量的彙整口徑（加總 vs 取最落後）——印件卡說產出是報工累計、齊套邏輯說取最慢的是齊套完成數，兩卡都沒答 | 差異矩陣 |
| — | 良率排除外發批次：已拍板（wiki 生產績效指標已改），實作在段 2 | 段 1 裁決 |
| — | 訂單詳情「生產數量」欄名實為產出數量（wiki 生產數量＝投入量含放損） | 段 1 verify |
| PT-013 | 倒扣耗料口徑（不良品是否計耗料、扣帳時點） | OQ 平層 |
| PT-023 | 材料用量帳與放損換算鏈正本歸屬 | OQ 平層 |
| PT-040 | 生產績效指標的停機與可用時數取數 | OQ 平層 |
| PT-041 | 報廢生產任務產出是否自印件產出累計排除 | OQ 平層 |

### 段 2 的差異重點（矩陣段 2 共 31 項，摘關鍵）

- 首次報工的向上反映鏈缺訂單層（spec 與 prototype 都缺）
- 報工五管道只實作兩個（師傅自助、生管代報），供應商自助與印務兩管道未做
- 報工欄位缺運轉設備、實際耗料、放損自動換算單位
- 轉交送達後下游到料量未遞增（滾動放行鏈斷）
- 轉交單作廢與額度回補未實作
- 開機費分攤、停機歸集、稼動率與良率的取數口徑錯
- 現場回報的行動版與 Slack 通道，spec 與 prototype 都無

### 段 3、段 4 累積待辦

段 3：SHP-017（累計送達數計算層級，已開 OQ）、A8（派單明細副本違反事實單一持有）、A9（dispatch spec 觸發者敘述脫節）、A10（五張孤兒派單）、認列工單遷回貨運單。
段 4：矩陣段 4 共 42 項，其中 BI-25（退款兩段式認列）與 PT-025（打樣序列不管制）已拍板落 wiki 但 openspec 全庫未同步。

## 六、踩過的坑（別重蹈）

1. **改了程式忘了改規格**：段 1 統一編號格式後，delta spec 仍留舊格式，verify 才抓到。實作與規格同批改。
2. **跨模組連動看似完成、實際斷掉**：外發報工只在派單模組累加、工單那邊不知道；交付時把指向外發任務的前置相依整條丟掉。畫面都正常，只有追資料流才看得出來——稽核時務必逐條追跨模組寫入。
3. **畫面數字用不同基準**：印件層產出數量沒經「每份印件生產數量」換算，顯示「180/300」實際是 90/300。
4. **為 mock 缺陷新增資料結構**：留痕義務落空的原因是 mock 對不上，不是邏輯缺陷——修 mock，不要為此加欄位。
5. **wiki 兩卡相斥時不要自行調和**：開 OQ（如 SHP-017），在程式註解裡擱置不算處置。
6. **erp repo 有多方同時在動**：工作區可能有其他對話的改動（段 1 期間有 `AdjustmentsTab.js`），commit 前確認範圍；曾有外部程序跑 `git reset --hard` 清掉未提交的工作。

## 七之一、段 4 範圍拍板（2026-08-12，grill 對齊）

### 範圍決策（Miles 拍板，勿重問）

| 決策點 | 拍板 |
|--------|------|
| 只做生產側 | **A 類訂單異動（金額）15 項＋B#16 補收免審整批拿掉**（錢的範疇，待帳務類規劃）；售後最多做到補印工單（生產側） |
| 段 4 內容 | B 售後補印生產側 6 項（#15 建單入口前提、#17-21）＋C 取消連鎖 4 項（#22-25，含 PT-044 派單收尾）＋D 工單異動與加印 9 項（#26-34）＋E 打樣 8 項（#35-42）＋收編 A3 與 warehouse_qty |
| 端到端涵蓋盤點 | 範圍＝訂單「已確認」→「訂單完成」；方法＝雙軸（07-scenarios 情境卡逐張標記歸屬＋06-state-machines 轉換逐條查承載）；帳務類卡濾掉不入盤點 |
| 漏網歸屬 | 盤點抓到的漏網逆流程不分落在哪段，一律併入段 4 change |
| 品檢／揀貨／出貨／報工／審稿 | 逆流程一併入盤點——段 3 已收的不重做，wiki 無承載或下游沒校的補起來 |
| prototype 側重驗 | 輕量——只重驗矩陣段 4 中 prototype 欄標「缺／衝突」的生產側列 |
| C 類歸屬（盤點後追加拍板） | **C1 審稿段三卡入段 4**（先跑三方差異盤點再定修量）；C2 訂單維護五卡、C3 單據分享與職務代理登記另案 |

### 已知候選漏網（盤點驗證清單）

報工階段品檢前提前發起補生產（wiki 無承載，Miles 點名）、審稿段是否曾被其他 change 校正、物流問題重製歸屬（wiki 內部相斥）、訂單「已取消」後的售後入口、品檢整批退站路徑、品檢紀錄作廢、揀貨中發現品檢漏網瑕疵、送達後客戶發現短少銜接售後。

### 另案清單（本工程不收，登記待接）

| 項目 | 去處 |
|------|------|
| A 類金額異動 15 項＋B#16（含 **BI-25 退款兩段式的 openspec 全庫同步債**，至少 14 處舊句） | 帳務／訂單異動類規劃時收 |
| A1 設備停機資料來源（production-overview 三處與 prototype 不同步） | 後續 MES 設計一併處理 |
| 矩陣段 4 #9 性質變化：終態後新增訂單異動，prototype 已明文為刻意設計（AdjustmentsTab.js:397 註解），與 wiki 訂單異動規則終態閘門相斥 | 屬金額類，隨 A 類歸帳務規劃裁決 |
| C2 訂單維護五卡（印件規格、三類備註、其他附件、客戶資料、負責業務改派）三方一致性未驗 | 訂單管理類規劃時收 |
| C3 單據分享與職務代理（跨領域授權）對生產側單據的適用性未確認 | 全域能力規劃時收 |
| 「補印」與英文識別（AfterSalesTicket 等）全庫用詞掃描（統一案後補印失去系統詞義；wiki 約 12 卡＋openspec 敘述性引文殘留） | 段 4 收尾批次 |
| business-scenarios 全流程驗證表列 8／16／17 打樣印件印製維度回退字面（已送達後又製作完成，存量矛盾） | 段 4A verify 時查證 |
| 派單卡「顯示型上游狀態欄收不收」判準不一致（本批新增兩欄 vs 範圍外不收工單狀態欄）；訂單狀態卡 227 行超規範粗標 | wiki 治理批次 |

### 四項前置查核結果（2026-08-12，全文 append 於差異矩陣末四段）

| 查核 | 小計 |
|------|------|
| wiki 側重驗（27 列） | 成立 21／行號漂移 4／內容已變 2（#19 矛盾已解消、#36 擴充為週期界線＋自動推進）；疑似缺漏 5 項全數解消；順帶發現 5 條（含訂單狀態 L188 任務層殘留相斥） |
| openspec 側重驗（27 列） | 成立 12／行號漂移 9／已修 3（#25、#33、#41）／部分已修 3（#35-37）；新相斥點 5 處（N1 回退弧、N2 打樣觸發者、N3 補印品出貨被建單前提封死、N4 補印後訂單完成判定未定義、N5 段 3 新條文帶入退役名） |
| prototype 輕量重驗（18 列） | 已修 5（#19、#32、#33、#35、#36）／部分已修 1（#26）／仍缺衝突 12；順帶 #41、#18 已修 |
| 雙軸涵蓋盤點 | 軸一 23 張情境卡：涵蓋 7／歸段 4 未執行 5／四段不涵蓋 9／範圍外 2。軸二 93 條轉換：已校 70／未校 23。漏網：A 類 5 項（wiki 有下游無）、B 類 3 項（wiki 無承載）、C 類 3 組（審稿段三卡、訂單維護五卡、單據分享）；報工提前補生產＝已知刻意留白（PT-014 延 MES）、品檢紀錄作廢＝負數沖銷已涵蓋非洞 |

OQ 勘誤：段 4 實際 open 僅 **PT-027／ORD-043／PI-007**（PT-041、PT-036、PT-044 已封存；PI-005 為 PI-007 之誤）。

### 審稿段三方差異盤點（2026-08-12，C1 入段 4 的追加前置；全文 append 於差異矩陣末段）

- 小計：**差異 48 項（#43-#100 續編）**、對齊 10、wiki 內部疑義 9。性質分佈：openspec 衝突 21／openspec 缺 7／prototype 衝突 18／prototype 缺 16／措辭過時 6／術語撞名 1。
- 三大主題：① 2026-08-01 AR／PI 系列 OQ 拍板後 openspec 未回寫（#63、#96 甚至寫著與拍板相反的內容）；② 「待分派」初始態未貫穿三方（打樣 clone reset 寫「稿件未上傳」擴散多處；訂單層派生五規則無「待分派」分支，上游是 wiki 疑義 3）；③ 段 3 新增四 Requirement 未與審稿段既有條文對接（#75、#82-87）。
- **prototype 職能分裂**：審稿主管工作台／KPI、退回重審、免審合格輪次、能力等級維護、訂單層向上歸納五項只在舊 repo（sens-erp-prototype），新 repo（erp）無且無測試——段 4 實作範圍是否搬遷待 Miles 裁決。
- wiki 內部疑義 9 項中：機械修正方向明確 6 項（AR-6 措辭、AR-10 封存卡取代註記、打樣流程卡自動推進未同步、mermaid 圖表不同步、能力等級稱法、實作進度寫入欄位表）；需 grill 裁決 3 項（疑義 3 訂單審稿段三值涵蓋不到「待分派＋稿已上傳」、疑義 5 請假換人無系統事實來源、疑義 7 免審輪次時點兩處不同）。

## 七、現況快照（2026-08-11 段 2 archive 後）

- Sens repo master：最新為段 2 archive（main specs 已合併，validate 22 過 0 敗）
- erp repo `prototype/production-stage`：段 2 疊 14 個 commit（`53c0b05`…`9f5e09e`＋免登入白名單 `84414c6`），未合併、未開 PR；工作區另有平行對話在 `print-items/*` 與 `qc-shipping/_lib/store.js` 的未提交變更（勿誤 stage）
- OQ 平層：4 張（PT-004／PT-026／PT-027 之外，段 2 新開 PT-042 拼版模數、PT-043 設備費率欄位歸屬；PT-013／023／040／041 已結案封存）
- dev server：3000 可能被其他對話佔用，本 session 用 launch.json 的 `erp-verify`（port 3020）；prototype 區免登入白名單已補齊段 1／2 路由群
- 段 3 解凍條件已達成：main specs 已收斂，`/opsx:propose` 可開（erp repo 分支段 2 已用畢）
