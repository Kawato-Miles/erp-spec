## 任務：依規劃品質評分準則，稽核「出貨對話框、批次列印與下載中心」的設計，產出評分表

先讀下列兩檔，評分表的證據說明與所有文字依其撰寫（你拿不到專案 CLAUDE.md 與 output style，這是唯一送達管道）：`/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`（受控句法正本）、`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`（非商業術語對照）。繁體中文，禁 emoji，禁中英夾雜。

`$R` 是 `/private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-shipping-logistics-features-dd104a/8b1fe26d-f57b-479b-bec0-9903a342bd42/scratchpad/audit-env2`。`$A` 是 `/private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-shipping-logistics-features-dd104a/8b1fe26d-f57b-479b-bec0-9903a342bd42/scratchpad/audit-run2`。wiki 路徑相對於 `$R/memory/Sens_wiki/wiki/erp/`。

## 一、基線

| 項目 | 內容 |
|------|------|
| 分支 | 無寫入 git；只寫 `$A` 下你的評分表檔 |
| 基底提交碼 | wiki 業務卡取 e2e4e96（設計拍板後、落卡前）；11-review-knowledge 取 origin/master 新版 |
| 依賴的規範檔與版本 | `11-review-knowledge/規劃品質評分準則.md`（批次 2 新版）；`11-review-knowledge/審查知識路由.md`（批次 2 新版）；`11-review-knowledge/稽核誤判記錄.md`（批次 2 新版） |
| 執行者 | sub-agent（稽核者） |
| 模型等級 | Opus high（新版 erp-audit 稽核者） |

## 二、範圍與排除

| 項目 | 內容 |
|------|------|
| 受審檔 | `$A/proposal.md`、`$A/design.md`、`$A/grill.md`。全文讀，不摘要 |
| 分級 | 局部變動（主對話已判定）：單一稽核者跑完整評分準則，不跑對抗式情境推演 |
| 量尺 | 先讀 `11-review-knowledge/規劃品質評分準則.md` 全文；判定值依該卡 § 三（通過／未通過／待裁決），檢核陳述依 § 四，業界比對依 § 五（讀該領域參考模型卡 `11-review-knowledge/參考模型/`，沒有對應領域就寫「無參考模型」），稽核者紀律依 § 八 |
| 誤判紀錄 | 先讀 `11-review-knowledge/稽核誤判記錄.md` § 一禁用推論模式 |
| 資料結構總覽卡（必讀全文） | `05-entities/履約與售後資料結構總覽.md`（主）、`05-entities/ERP 資料結構總覽.md` |
| 領域背景（必讀全文，依檢索規約載入） | 履約與售後：出貨單、出貨單狀態、物流單、物流單狀態、下載檔案、下載檔案狀態、出貨與送達、出貨活動清單、輸出活動清單、出貨與售後檢視活動清單、EC 物流串接約束、品檢通過入庫、SHP-023-第三方物流部分送達與誤報配達的處理路徑。角色：出貨人員、揀貨人員、業務。全域與相鄰：齊套邏輯、北極星指標、生產績效指標、工作天規則、訂單、訂單狀態、訂單取消、印件、工單、受控清單。用 `find $R/memory/Sens_wiki/wiki/erp -name '<卡名>.md'` 找檔 |
| 其他正本卡 | 依受審檔引到的 `[[卡名]]` 自行讀全文；產品（01）、角色（03）、商業規則（04）、實體（05，含營運背景與範圍外段）、狀態機（06）、情境（07）缺一類都會變成憑推測稽核 |
| 規格 | 可讀 `$R/openspec/specs/` 下的主 spec 當現況對照 |
| 範圍外 | 不讀 `$A` 以外的暫存目錄；不讀 `$R/openspec/changes/` 下任何出貨相關 change 的檔；不讀 git 歷史；不讀 erp repo（`/Users/b-f-03-029/erp`）。5-3 現行實作抽驗本次判「不適用：回放限制，不抽驗」 |
| 不准動的檔 | 任何 repo 檔案 |

## 三、禁止清單

- 卡內已宣告現況邊界或「延後至 X 階段設計」者，列「已宣告延後」，不判缺漏。
- 判「出處查無」或「正本沒定義」之前，MUST 讀完指名來源卡全文（誤判記錄 § 一模式 7）。
- 不給設計建議以外的意見；只判定、附證據、寫處置。

## 三之二、評分表格式（新版 erp-audit）

評分表格式與業界比對段、不確定項段，照 `/private/tmp/claude-501/-Users-b-f-03-029-Sens--claude-worktrees-shipping-logistics-features-dd104a/8b1fe26d-f57b-479b-bec0-9903a342bd42/scratchpad/audit-run2/稽核者派工單.md` § 三、§ 四；該檔內的 wiki 連結以 `$R/memory/Sens_wiki/wiki/erp/` 為根找檔。參考模型卡在 `$R/memory/Sens_wiki/wiki/erp/11-review-knowledge/參考模型/`。

## 四、產出自檢

- [ ] 評分準則 § 四每個檢核項逐項列，不跳項
- [ ] 每列都有證據（卡名、行號、情境名或「推演至第 N 步斷掉：缺 Y」）
- [ ] 未通過與待裁決都寫處置；待裁決寫明依賴哪張 OQ 或哪條偏離
- [ ] 句法依 ste100-pm.md

## 五、停止點

回報待裁決：只寫評分表檔，不做任何 git 寫入。完成定義：評分表檔存在，§ 四全部檢核項都有判定與證據。

## 六、回報格式（繁體中文）

1. 評分表檔路徑。
2. 判定統計：通過、未通過、待裁決、不適用各幾項。
3. 每個「未通過」與「待裁決」一句摘要，附 design.md 行號。
4. 最不確定的幾項判定與理由。
