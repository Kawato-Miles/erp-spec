---
type: review-knowledge
module:
  - cross-module
business-domain:
  - cross-domain
status: active
last-reviewed: 2026-05-28
---

# 稽核反模式追蹤卡（Audit Failure Patterns）

> 累積 `erp-planning-pre-check` skill 稽核過程中識別到的五大反模式案例。
> 受 YouTube /goal 影片啟發（執行者與稽核者分離 + 閉環化 + 五大反模式）。
> 與 [[misjudgement-record]] 互補：misjudgement 記三視角審查 agent 誤審；本卡記稽核盲點。

## 一、五大反模式定義

### 1. Scope creep（範圍漂移）

**描述**：稽核 / 修補時範圍越寫越大，超出原議題；或一張卡內容吃掉其他卡職責。
**典型情境**：
- 業務情境段塞了「使用者角色」職責內容
- User Story 同時涵蓋多角色 / 多動作（違反 INVEST Independent）
- 業務邏輯卡塞了「實體 Data Model」內容
**對策**：嚴格依雙軸分類；發現越界時回卡類型本職；超範圍內容拆到對應卡
**對應紀律**：[[../pm/user-story-spec]] § INVEST / `erp-user-story` skill 兩階段紀律 / `oq-manage` 禁 anchor 故事

### 2. False completion（假完成）

**描述**：稽核走一次後沒回驗修補真的完成，看似涵蓋卻漏 edge case。
**典型情境**：
- Step 3 矩陣標「已涵蓋」但實際 acceptance criteria 缺驗收條件
- 修補後 frontmatter 已改但內容章節未補
- User Story `related-test-cases` 標了 URL 但 Test Case 實際不存在
**對策**：**Step 5 閉環驗證強制**（受 YouTube /goal 影片啟發）；修補後回頭看矩陣格子真轉「已涵蓋」否則回 Step 4
**對應紀律**：[[../../00-meta/erp-planning-audit-framework]] § 三 Step 5

### 3. Dead loops（死循環）

**描述**：OQ 反覆討論不收斂，超過 3 輪未閉環。
**典型情境**：
- 同主題 OQ 被改寫 3 次仍無拍板
- Miles 與 Claude 來回討論同議題 ≥ 3 輪無進展
- 修補 → 標 OQ → 再修補 → 又標 OQ 循環
**對策**：
- 對應 OQ 累積 ≥ 15 觸發 `vault-insight` 跨主題提煉
- 單次稽核同領域最多 3 輪（超過標 OQ 等 Miles 決策）
- 識別「死循環候選 OQ」獨立排程解答 session
**對應紀律**：`vault-insight` skill 觸發條件 / `oq-manage` skill mode B 去重

### 4. Immeasurable targets（無法量化）

**描述**：卡內容空泛無 acceptance criteria，產出結論用「大致 OK」「再看看」等非量化措辭。
**典型情境**：
- User Story 缺 acceptance criteria 或寫得太抽象
- 業務邏輯卡缺「計算公式」「邊界規則」
- 稽核報告寫「Billing & Cash 大致涵蓋完整」（無 N/M/K 數字）
**對策**：**量化矩陣強制 N/M/K 三數字**（受 YouTube /goal 影片啟發）；非量化結論禁止
**對應紀律**：[[../../00-meta/erp-planning-audit-framework]] § 五 稽核產出格式 / § 五 量化矩陣

### 5. Token exhaustion（成本過高）

**描述**：稽核成本過高（如「狀態機」跨多模組全跑），token 黑洞且結論失焦。
**典型情境**：
- 一次稽核試圖跑全 6 領域
- 跨領域議題沒拆 + 共用層全載
- 修補單張卡時讀全 Vault
**對策**：
- 單次稽核 ≤ 2-3 個領域（超過拆多次）
- 跨領域議題 sub-agent 並行
- 共用層精準載入（不全載 `03-roles` 16 角色，依領域 filter）
**對應紀律**：[[../../00-meta/erp-planning-audit-framework]] § 八 稽核回合 / 時間預算

## 二、案例累積

> 每次稽核中識別到反模式時，追加到本段。

### 範本

```markdown
### YYYY-MM-DD 反模式：<反模式名稱>

**情境**：<具體稽核議題 + 反模式表現>
**領域**：<L1.X>
**卡類型**：<7 類之一>
**修正方式**：<如何避免 / 對策應用>
**根因**：<為什麼會發生這個反模式>
**衍生 OQ / Insight**（若有）：<連結>
```

### 2026-05-28 反模式：Scope creep（會計 Role 卡 stage-mismatch）

**情境**：第一輪 Billing & Cash 稽核時識別到 `03-roles/會計.md` 參與階段標記為「審稿」階段，但實際業務職責涵蓋全程（建單 / 出貨 / 月結對帳 / 報表）。
**領域**：Billing & Cash
**卡類型**：1. 角色
**修正方式**：edit `03-roles/會計.md` 補「月結對帳節奏」段 + 修正參與階段欄位（已開 [[../../08-open-questions/ORD-001-會計階段標記是否錯誤|ORD-001]] 等 Miles 拍板）
**根因**：角色卡頭部 metadata「參與階段」未追上業務範疇擴張（refine-after-sales / billing-installment 累積後職責變寬但卡未更新）
**衍生 OQ**：[[../../08-open-questions/BI-13-第一輪稽核識別的領域缺漏項]]

### 2026-05-28 反模式：False completion（User Story related-test-cases 全空陣列）

**情境**：第一輪 Billing & Cash 稽核時識別到 18 張款項相關 User Story 的 `related-test-cases` frontmatter 欄位全為空陣列（`[]`），acceptance criteria 無對應 Test Case 反向連結。
**領域**：Billing & Cash
**卡類型**：5. User Story
**修正方式**：批次 backfill `related-test-cases`（從 Notion ERP Test Case DB 配對）；已開 [[../../08-open-questions/BI-12-款項UserStory批次backfill business-domain與related-test-cases|BI-12]]
**根因**：User Story 與 Test Case 兩邊各自累積，缺「上層改了下層需重審」正式機制（受 Miles 第六輪反饋拍板：「User Story 從 acceptance criteria 到 Test Case 一層一層稽核」）
**衍生紀律**：[[../../00-meta/erp-planning-audit-framework]] § 六 跨層影響稽核（商業需求 ↔ User Story ↔ spec ↔ Test Case 四層雙向追溯）

### 2026-05-28 反模式：Immeasurable targets（7 實體連帶關係散佈無統一索引）—— 本輪修補

**情境**：第一輪 Billing & Cash 稽核時識別到 7 實體（Payment / Invoice / OA / SalesAllowance / PlannedInvoice / AfterSalesTicket / PaymentInvoice junction）跨模組影響原散佈在 `order-management spec`（L900-3100）/ `付款發票邏輯.md` / `售後服務.md` / `發票法規硬約束-ezPay-MIG.md`，無中心化「連帶矩陣」可一鍵查詢。
**領域**：Billing & Cash
**卡類型**：6. 業務邏輯
**修正方式**：edit `付款發票邏輯.md` 補 § 五B 七實體連帶矩陣章節（含 5B.1 連帶表 + 5B.2 連帶網絡圖 + 5B.3 連帶檢查紀律 + 5B.4 外部硬約束連帶）
**根因**：跨實體連帶關係累積過程中每次 change 各自寫入相關 spec / 卡，未有 KM 角色彙整中心化索引
**狀態**：✓ **本輪修補完成**（連帶矩陣已寫入付款發票邏輯.md）
**演化**：後續若再發現新跨實體影響，MUST 更新到 § 五B 而非散佈到各卡

---

### 2026-05-28 反模式：Over-report（稽核 over-report 把已涵蓋情境誤判為缺漏）

**情境**：第一輪 Billing & Cash 稽核時，sub-agent 報「情境維度 K=1 缺邊界情境變體（跨期作廢折讓 / 拆票 / 合期）」。但 Miles 確認 + 核對 payment-invoice-scenarios.md 後發現：跨期作廢折讓已涵蓋（情境 7 + 8）、拆票已涵蓋（情境 2）、合期已涵蓋（特殊收款）。sub-agent 誤把已涵蓋的情境判為缺漏。
**領域**：Billing & Cash
**卡類型**：4. 情境
**修正方式**：閉環驗證 + Miles 確認時核對既有情境檔，修正稽核判斷（BI-13 § 4 標明組 3 修正）
**根因**：sub-agent 稽核未實際讀完 payment-invoice-scenarios.md 全 13 情境就判缺漏（憑印象 over-report）
**教訓**：稽核「缺漏」判斷 MUST 先讀完該卡類型既有內容才能下結論；over-report 是 False completion 的相反（false completion = 漏報、over-report = 誤報），兩者都靠「Step 5 閉環驗證 + Miles 確認」修正
**衍生紀律**：稽核 Step 3 判「待修補 M」前 MUST 完整讀既有卡，禁憑印象判缺漏

### 2026-05-28 反模式：Scope creep（business-logic 卡混入 user-story / test-case 格式模板）

**情境**：Miles 發現 business-logic 卡內容沒被規範 → 沒被稽核。具體例：付款發票邏輯.md § 九 + payment-invoice-scenarios.md § 使用建議 混入 user-story 格式模板（作為/我希望/以便/驗收條件）+ test-case 範本，這些屬 erp-user-story / erp-test-case skill 職責，不該複製進 business-logic 卡。
**領域**：Billing & Cash（cross-domain 規範問題）
**卡類型**：6. 業務邏輯
**修正方式**：(1) wiki-schema 新增 § 十一「卡類型內容職責邊界」+ 維度 14 lint (2) 清理兩卡越界內容改為 cross-reference skill
**根因**：wiki-schema 只對 user-story 有內容 lint（維度 13），business-logic / scenario / entity / role / state-machine 只規範 frontmatter、正文無邊界 → 任何卡可混入其他卡類型內容不被稽核抓到
**教訓**：每個卡類型須有「正文內容職責邊界」（該寫什麼 / 不該寫什麼）+ 對應 lint；產 user story / test case 一律 cross-reference skill 而非複製模板
**衍生紀律**：[[../../00-meta/wiki-schema]] § 十一 + 維度 14

---

（後續累積實證案例）

## 三、預防機制

### 流程層

- 每次稽核 MUST 跑 Step 5 閉環驗證（防 false completion）
- 每次稽核 MUST 用量化矩陣產出（防 immeasurable）
- 單次稽核 ≤ 2-3 領域（防 token exhaustion）
- 同領域 ≤ 3 輪修補（防 dead loops）
- 嚴格依雙軸分類（防 scope creep）

### Skill 層

- `erp-planning-pre-check` skill Anti-pattern 區明示 5 個反模式（v1.0 起內建）
- `vault-audit` 12 維度可考慮加入「反模式累積率」維度（演化議題）

### 紀律層

- 識別到反模式 MUST 追加本卡（不只口頭說「下次注意」）
- 與 [[misjudgement-record]] 配合：稽核反模式 vs 審查誤判 分別記錄
- 與 [[../erp/erp-design-patterns]] 互補：本卡記反模式 / erp-design-patterns 記正模式

## 四、相關卡

- [[../../00-meta/erp-planning-audit-framework]] — 稽核框架正本
- [[../../00-meta/business-domain-taxonomy]] — 6 領域分類
- [[misjudgement-record]] — 三視角審查 agent 誤審記錄
- [[../pm/user-story-spec]] — User Story 撰寫紀律（INVEST）
- [[../erp/erp-design-patterns]] — 5 ERP 設計範式（正模式）

## 五、來源

- YouTube Claude Code /goal 影片（五大反模式：scope creep / false completion / dead loops / immeasurable / token exhaustion）
- VentureBeat：「separates the agent that works from the one that decides it's done」
- explainx.ai Goal mode 完整分析
- Karpathy LLM Wiki Vault（raw 不可變 + bookkeeping LLM 不疲勞）
