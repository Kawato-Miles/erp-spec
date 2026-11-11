# 17 開發現況落差調查（wiki、原型、正式前端、後端）

主對話抽查（2026-11-11）：相符：現行後端是 sens-print-core（分支 develop，本機落後遠端 147 筆）；`.github/workflows/api-docs.yml` 把 OpenAPI 推到 `sensationsprint/api-docs`；正式前端 `packages/shared/services/quote/constants.js` 第 18、20 行的兩個顯示名與 `schemas.js` 的 zod 驗證（讀 origin/develop）；原型常數檔檔頭兩句並存。三張比對表未逐列查證。
主對話補查（本檔沒有的事實）：`sensationsprint/api-docs` 以 Miles 的 GitHub 權限可讀。結構為每個服務一個資料夾，下分 `develop/`、`staging/`、`production/`、`drafts/pr-<n>/`，各含 `openapi.yaml`（sens-print-core 的 develop 版約 1.17MB）、`index.md`、分域的 `reference/<domain>.md`（30 個檔）；另有自動產生的端點層級 `CHANGELOG.md`。根目錄 `COLLABORATION.md` 寫明前端、後端、PM 三種角色的用法：PM 以 `drafts/pr-<n>/index.md` 看規格現況，驗收看 `staging/`，已上線看 `production/`；另有 `linear-sync` 把契約連結掛到前端的 Linear 卡。Sens 的 AGENTS.md、skill、`memory/shared`、記憶卡沒有任何一處提到這個程式庫。

調查日：2026-11-11。嚴格只讀。範圍：wiki、erp 前端程式庫、sens-print-core、sensation-api。

引用格式說明：
- 後端路徑（sens-print-core）引本機工作樹（分支 `develop`，落後遠端 147 個提交）。已用 `git diff HEAD origin/develop` 確認需求單相關檔案只差遷移檔與測試（`apps/quote/migrations/0010`、`0011`、`tests/`），帳務公司選項兩邊相同（各 4 值）。
- 正式前端引 `origin/develop`，寫成 `FE:路徑:行`。本機 erp 工作樹停在 `prototype/production-stage`，落後 `origin/develop` 696 個提交，且 `packages/shared/services/quote/constants.js` 版本較舊（`git diff HEAD origin/develop --stat` 差 15 行增、3 行減）。
- 原型引本機工作樹 `apps/erp/src/app/(prototype)/quote-prototype/`，簡寫成 `PROTO:`；原型為本機工作樹，未與 `origin/develop` 比對（未查證）。
- wiki 引 `memory/Sens_wiki/wiki/erp/`，簡寫成 `WIKI:`。

## 一、摘要

1. ERP 現行後端是 sens-print-core（Django 5.2、DRF、Python 3.13），含 quote、order、production 等模組；sensation-api 是電商後端（Django 4.2），沒有需求單。
2. 後端有機器可讀契約：由 drf-spectacular 自動產生 OpenAPI，經 CI 推到獨立程式庫 `sensationsprint/api-docs`；契約檔不在後端程式庫內（`docs/` 被 gitignore），執行時的 `/api/schema` 端點預設關閉。
3. 正式前端是純 JavaScript（程式庫內找不到 `.ts`、`.tsx`），沒有自動產生的用戶端，型別與列舉全部手寫在 `packages/shared/services/<模組>/constants.js` 與 `schemas.js`（zod 加 react-hook-form）。
4. 需求單四方比對：狀態代碼值四方一致；顯示名有 2 處不一致（正式前端把「需求確認中」寫成「待確認需求」、「已評估成本」寫成「待報價」）。
5. 欄位與驗證有多處分歧，主要類型：值域不同（帳務公司：後端 4 值，wiki 與原型 2 值）、數值範圍不同（後端不擋負的單價與成本）、欄位只存在一方（wiki 的來源諮詢單、Caac 兩欄、報價版本；原型的是否急件；後端與正式前端的預計交貨日期）。
6. 原型的識別碼是字串（`AU-001`、`CUS-0012`），後端是整數與 UUID；原型欄位名 `expected_delivery_date` 對應後端 `delivery_date`；原型獨有 `file_names`、`is_urgent`。
7. 原型宣稱「逐字取自正式前端」的常數檔，實際已有 5 處刻意改動（見表 a、表 b），原型檔頭有註明。
8. 近 60 天提交對得回 Linear 的比例低：正式前端非原型提交約 6.0%（14／235），後端 sens-print-core 22.8%（68／298），且 68 筆全來自單一作者；PR 範本要求填 Linear 議題識別碼，但允許填 N/A。
9. 原型到正式頁不是搬移而是重寫：歷史中沒有任何由 `(prototype)` 到 `(dashboard)` 的改名；以 `d952a5d9` 等三例看，正式頁是新增檔案，原型原地保留。方向反過來也存在：需求單原型的常數是從正式前端複製來的。
10. 後端有一處自身不一致：印件項目的利潤率缺值時回 `0.00`，報價紀錄快照缺值時回 `null`（見表 b）。

## 二、後端現況

### 2.1 各程式庫概況

| 項目 | sens-print-core | sensation-api | 備註 |
|------|----------------|---------------|------|
| 是否為 ERP 現行後端 | 是。`SPECTACULAR_SETTINGS.TITLE` 為「Sens print core (ERP) API」（`sens_print_core/settings.py:245`）；前端 `API_PREFIX` 為 `/api/v1/admin`（FE:`packages/shared/constants/apiEndpoints.js:5`），後端對應 `sens_print_core/urls.py:40` 的 `admin/` | 否。電商後端（`README.md:1-5`），無 QuoteRequest 相關程式（`grep -rli "quote_request\|QuoteRequest"` 無結果） | 另有 `/Users/b-f-03-029/sens-erp-prototype`：舊版 React＋TypeScript（Lovable 遷移）原型，近 60 天 0 提交，最後提交 2026-07-21 |
| 語言與框架 | Python >=3.13、Django >=5.2.6、DRF >=3.16.1、drf-spectacular（`pyproject.toml:6-18`）；PostgreSQL；Celery | Python >=3.8（`pyproject.toml:6`）、Django 4.2＋DRF 3.14（`README.md` 技術棧表）；PostgreSQL＋MongoDB | |
| 目前分支 | `develop` | `develop` | 兩者主分支為 `production`（sens-print-core `CLAUDE.md:9`） |
| 本機最後提交 | 5b33d6ca，2026-10-28 | 51a6a950，2026-10-27 | |
| 遠端最後提交（`origin/develop`） | bffe92a5，2026-11-11 | 2fb69d93，2026-11-10 | |
| 近 60 天提交數（含合併） | 本機 HEAD 255；`origin/develop` 398；所有參照 425 | HEAD 124；`origin/develop` 198；所有參照 208 | 指令：`git log <ref> --since=60.days.ago --format=%H \| wc -l` |
| 落後遠端 | 147 個提交 | 74 個提交 | `git rev-list --count HEAD..origin/develop` |
| `.git/FETCH_HEAD` 修改時間 | 2026-11-11 22:49 | 2026-11-11 23:05 | 遠端參照新，本機分支舊 |

### 2.2 各類定義位置（sens-print-core）

| 類別 | 位置 | 例（需求單） |
|------|------|-------------|
| 模組清單 | `apps/`：core、ec、note、order、partner、payment、product、production、quote、sens_admin、supplier、tag | |
| 資料模型 | `apps/<模組>/models/` | `apps/quote/models/quote_request.py`、`quote_item.py`；遷移 `apps/quote/migrations/0001`～`0009`（本機） |
| 列舉值（狀態名等） | 模型內 `TextChoices` 類別；共用者在 `apps/core/choices.py` | `QuoteRequest.Status`（`quote_request.py:36-43`）；`DeliveryMethod`（`apps/core/choices.py:4-9`） |
| 輸入驗證 | `apps/<模組>/v1/admin/serializers/`（DRF 序列化器），商業規則在 `apps/<模組>/services/` | `quote_serializers.py`、`quote_item_serializers.py`、`quote_transition_serializers.py`；`services/quote_transition_service.py` |
| API 路由 | 根路由 `sens_print_core/urls.py`，模組路由 `apps/<模組>/v1/admin/urls.py` | `apps/quote/v1/admin/urls.py:13-26`（含 `/transitions`、`/items`、`/permissions`） |

### 2.3 機器可讀契約

| 項目 | 事實 | 證據 |
|------|------|------|
| 格式 | OpenAPI，由 drf-spectacular 自動從序列化器與視圖產生 | `settings.py:228`（`DEFAULT_SCHEMA_CLASS`）、`settings.py:244-` |
| 產生指令 | `python manage.py generate_openapi`，輸出 `docs/api/openapi.yaml` | `apps/core/management/commands/generate_openapi.py:12-24` |
| 檢查指令 | `lint_openapi`（CI 閘門） | `apps/core/management/commands/lint_openapi.py`；`.github/workflows/api-docs.yml` |
| 檔案是否在程式庫內 | 否。`docs/` 在 `.gitignore:5`；本機沒有 `docs/` 資料夾；`git ls-files` 找不到 `openapi.yaml` | 指令：`git ls-files \| grep -i openapi` 只得到程式碼與工作流程檔 |
| 檔案行數 | 未查證（檔案不在本機） | |
| 發布路徑 | PR 與 `develop`／`production` 推送時，CI 產生 `openapi.yaml` 推到獨立程式庫 `sensationsprint/api-docs`；PR 推草稿到 `sens-print-core/drafts/pr-<N>/` | `.github/workflows/api-docs.yml` 檔頭註解；後端 `CLAUDE.md:80-87`（`origin/develop`） |
| 執行時端點 | `/api/schema/`、`/swagger-ui`、`/redoc`，僅 `ENABLE_DRF_SPECTACULAR` 為真時掛載；預設值為 False | `sens_print_core/urls.py:57-85`、`config_loader.py:106` |
| sensation-api | 有 `swagger/` 應用程式、`api/swagger.py`、`generate_openapi`、`lint_openapi` 指令；契約檔同樣不在程式庫內 | `git ls-files \| grep -i -E 'openapi\|swagger\|schema'` |
| GraphQL | 未找到 | 三個程式庫的 `git ls-files` 皆無 `.graphql` |

## 三、正式前端現況

程式庫 `/Users/b-f-03-029/erp`：pnpm 工作區，`apps/erp`、`apps/china-supplier`、`packages/shared`（FE:`package.json`）。

### 3.1 `(prototype)` 以外已實作模組

`origin/develop` 的 `apps/erp/src/app/(dashboard)/` 路由資料夾（`git ls-tree -d`）：

admin-user、all-production-tasks、all-transfer-tickets、all-work-packages、binding、dashboard、download、equipment、inspection、material、my-production-tasks、my-work-packages、order-adjustment-review、order-approval、order-list、outsource、partner、pending-refund、pending-transfer-tasks、print-item-list、print-item-unassigned、process、production-detail-queue、quantity、quote、receivable、receiving-queue、review-pending、review-unassigned、role、shipment、size、supplier、tag、urgent-order、waybill、work-order-list。

另有 `apps/erp/src/app/login`、`reset-password`、`(dev)/components`。本機工作樹的 `(dashboard)` 較舊，只有其中約 30 個。

`(prototype)` 資料夾（`origin/develop`）：after-sales、dispatch-orders、orders、payment、prepress-review、print-items、production-floor、qc-shipping、quote-prototype、recipes、sample-resource、work-orders。

### 3.2 型別、驗證與列舉

| 問題 | 事實 | 證據 |
|------|------|------|
| 語言 | 純 JavaScript；`git ls-tree -r origin/develop` 中找不到 `.ts`、`.tsx` | |
| 後端資料型別怎麼取得 | 手寫。沒有自動產生的用戶端（找不到 openapi、orval、codegen、swagger 相關檔）；API 以 axios 呼叫，端點寫在常數 | FE:`packages/shared/constants/apiEndpoints.js:58-69`；FE:`packages/shared/services/quote/api.js:22-44` |
| 契約來源 | 開發者看 `api-docs` 程式庫。例：提交 `d952a5d9` 內文寫「on the /admin/production/work-orders contract from api-docs pr-146」 | `git show d952a5d9` |
| 表單驗證 | zod 加 react-hook-form 的 `zodResolver`；schema 放 `packages/shared/services/<模組>/schemas.js`（部分在 `packages/shared/schemas/`） | FE:`packages/shared/components/quote/QuoteFormDrawer.js:3,27`；FE:`packages/shared/services/quote/schemas.js:47,79` |
| 狀態名與列舉 | `packages/shared/services/<模組>/constants.js`，每個列舉附 `*_LABELS` 與 `*_OPTIONS` | FE:`packages/shared/services/quote/constants.js:8-38` |
| 單價等計算 | 前端自行重算顯示（例：`pricing.js`） | FE:`packages/shared/services/quote/pricing.js` |

### 3.3 原型的驗證寫法

原型表單不用 zod，用 antd `Form.Item` 的 `rules` 與元件屬性（例：`PROTO:_components/QuoteList.js:432`、`PROTO:detail/page.js:1557`）。狀態缺漏檢查寫在純函式 `PROTO:_lib/transitions.js:7-23`。

## 四、需求單四方比對

樣本選需求單：wiki、原型、正式前端（`(dashboard)/quote`，2026-04-15 首次提交 `ec7f5c95`）、後端四方都有。

wiki 有、後端與正式前端找不到：報價版本（`WIKI:05-entities/報價版本.md`）、來源諮詢單、Caac 訊息連結、Caac 名稱、是否急件、參考附件說明（200 字）。證據：`git grep -i "quote_version\|QuoteVersion\|caac\|is_urgent" origin/develop -- apps/quote`（後端）與 `git grep -n -i caac origin/develop -- packages/shared apps`（前端）皆無結果。原型也沒有報價版本與 Caac（`grep -rn -i "caac\|quote_version\|報價版本"` 無結果），但原型有「是否急件」（`PROTO:_lib/constants.js:376-378` 附近的 `QUOTE_ITEM_DEFAULT_VALUES`）。

### 表 a：狀態

#### a-1 狀態名與代碼值

wiki 未列代碼值（`WIKI:06-state-machines/需求單狀態.md:33-40` 只列中文名）。

| 狀態 | wiki 名稱 | 後端代碼值與標籤 | 正式前端代碼值與標籤 | 原型代碼值與標籤 | 結果 |
|------|----------|-----------------|--------------------|-----------------|------|
| 1 | 需求確認中 | `requirement_confirming`「需求確認中」（`quote_request.py:37`） | `requirement_confirming`「待確認需求」（FE:`constants.js:9,18`） | `requirement_confirming`「需求確認中」（`PROTO:_lib/constants.js:10,21`） | 不一致：正式前端標籤 |
| 2 | 待評估成本 | `pending_quote_evaluation`「待評估成本」（`:38`） | 同（FE:`:10,19`） | 同（`:11,22`） | 一致 |
| 3 | 已評估成本 | `quote_evaluated`「已評估成本」（`:39`） | `quote_evaluated`「待報價」（FE:`:11,20`） | `quote_evaluated`「已評估成本」（`:12,23`） | 不一致：正式前端標籤 |
| 4 | 議價中 | `negotiating`「議價中」（`:40`） | 同（FE:`:12,21`） | 同（`:13,24`） | 一致 |
| 5 | 成交 | `won`「成交」（`:41`） | 同 | 同 | 一致 |
| 6 | 流失 | `lost`「流失」（`:42`） | 同 | 同 | 一致 |

原型檔頭自述：顯示名比照 wiki 與後端，正式前端兩個舊名不同（`PROTO:_lib/constants.js:18-19`）；同檔檔頭又寫「逐字取自正式前端」（`:2-3`），兩句並存。

#### a-2 轉換與條件

| 轉換 | wiki | 後端 | 正式前端 | 原型 | 結果 |
|------|------|------|---------|------|------|
| 轉換表（誰可到誰） | 6 條轉換（`WIKI:06:83-94`） | `ALLOWED_TRANSITIONS`（`quote_transition_service.py:22-44`） | `QUOTE_TRANSITIONS`（FE:`constants.js:51-64`） | `QUOTE_TRANSITIONS`（`PROTO:_lib/constants.js:53-64`） | 一致 |
| 需求確認中 → 待評估成本：條件 | 只寫 Slack 通知（`WIKI:06:86`），未寫難易度 | 所有印件須已填難易度，否則 422（`quote_transition_serializers.py:54-68`） | 轉換前在 `useQuoteTransitionFlow.js` 找不到本機檢查；印件表單層已設為必填（FE:`schemas.js:97-110`） | 同後端的本機檢查（`PROTO:_lib/transitions.js:7-9`） | 不一致：wiki 未寫此閘門 |
| 議價中 → 待評估成本：備註 | 未寫備註必填（`WIKI:06:90`） | 備註必填（`quote_transition_serializers.py:12-15,44-47`） | 備註必填（FE:`constants.js:67-70`） | 備註必填（`PROTO:_lib/constants.js:67-70`） | 不一致：wiki 未寫 |
| 流失 → 待評估成本：備註 | 重啟原因必填（`WIKI:06:92`） | 備註必填（同上） | 同 | 同 | 一致 |
| 議價中 → 成交：條件 | 選定報價版本；該版本每筆印件項目單價皆已填（`WIKI:06:89`） | 至少一筆印件，且全部印件已填單價與小計（`quote_transition_service.py:104-118`）；沒有「報價版本」概念 | 未查證 | 單價或小計未填即缺漏（`PROTO:_lib/transitions.js:21-23`）；空陣列通過 | 不一致：wiki 有版本，後端無；原型不擋零筆印件 |

小結：表 a 不一致 5 處（狀態名 2、轉換條件 3）。

### 表 b：欄位

欄位格式：型別與值域；必填以「必」「選」標示。「無」表示該方找不到此欄位。

#### b-1 單頭（25 欄）

| # | 欄位 | wiki（`WIKI:05-entities/需求單.md`） | 後端 | 正式前端（FE） | 原型 | 結果 |
|---|------|-------------------------------|------|--------------|------|------|
| 1 | 需求單編號 | 文字、唯讀，範例 `QR-2026-0188`（:55） | `quote_no` 字串 32、唯一；格式 `Q-YYYYMMDD-NN`（`quote_request.py:101`、`apps/quote/utils.py:8`） | 讀後端值 | `Q-20260601-01`（`PROTO:mock-data.js:159`） | wiki 範例格式與後端不同（僅範例） |
| 2 | 識別碼 | 無 | `id` UUID（`:95`） | 路由用後端 id | `id: 1`（`PROTO:mock-data.js:157`） | 不一致：型別 |
| 3 | 需求案名 | 文字、必（:56） | `title` 字串 255、必（`quote_serializers.py:240`） | 必，無長度上限（FE:`schemas.js:48`） | 必，無上限（`PROTO:_components/QuoteList.js:432`） | 不一致：上限只有後端 |
| 4 | 狀態 | 單選六值（:57） | 見表 a | 見表 a | 見表 a | 見表 a |
| 5 | 客戶 | 單選，客戶身分非「無」者、必（:58） | `customer_id` 整數主鍵、必，查詢集為全部廠客（`:241-244`） | 必，正整數（FE:`schemas.js:49`） | 必（`QuoteList.js:441`）；id 為 `CUS-0012` 字串、選項排除身分「無」（`PROTO:mock-data.js:124`） | 不一致：識別碼型別；「身分非無」只有 wiki 與原型有 |
| 6 | 窗口聯絡人 | 單選，同客戶下（:59）、選 | `contact_id` 選，不驗證屬於該客戶（`:288-293`） | 選（FE:`schemas.js:51-54`） | 選，限已選客戶的聯絡人（`QuoteList.js:530-540`）；id 為 `CT-0012-1` | 不一致：型別；後端不驗歸屬 |
| 7 | 接單業務 | 單選人員、必（:60） | `sales_id` 必（`:246-249`） | 必（FE:`schemas.js:55`） | 必（`QuoteList.js:485`）；id 為 `AU-001` | 不一致：識別碼型別 |
| 8 | 建立者 | 唯讀（:61） | `created_by` 外鍵，伺服端寫入（`:213`、`:307`） | 不在表單 | `created_by_name`（`mock-data.js:174` 附近） | 一致（僅顯示） |
| 9 | 需求品項類別 | 多選（:62），未列值域，範例「型錄、名片」 | `print_type` JSON 陣列，逐值驗證 26 值（`:254-258`）；「card」標籤為「卡類」（`:50`） | 陣列、不驗列舉（FE:`schemas.js:59`）；「card」為「卡片」（FE:`constants.js:157`） | 26 值，「card」為「卡片」；註解寫「27 值」（`PROTO:constants.js:122,155`） | 不一致：標籤「卡類」對「卡片」；wiki 範例「型錄」不在後端值域；原型註解 27 對實際 26 |
| 10 | 詢價來源 | 單選 8 值、必（:63） | 8 值、必（`:245`） | 8 值、必（FE:`schemas.js:56`） | 8 值、必 | 一致 |
| 11 | 帳務公司 | 單選，感官或柏樂、必；已評估成本前可改（留痕）（:64） | `billing_company` 4 值（SSP、BRO、KAD、EC）、必（`:250`；`partner.py:24-29`）；更新序列化器未見狀態限制（`:337-341`） | 標籤 4 值、可選 2 值（SSP、BRO）（FE:`constants.js:297-313`）；必（FE:`schemas.js:57`） | 2 值（SSP、BRO）（`PROTO:constants.js:297-312`）；編輯時不分狀態可改（`detail/page.js:1473-1486`） | 不一致：值域（後端 4 對 2）；可改時機只有 wiki 有 |
| 12 | 來源諮詢單 | 連結、建立後不可改（:65） | 無 | 無 | 無 | 只在 wiki |
| 13 | Caac 訊息連結、Caac 名稱 | 兩欄，選填（:66-67） | 無 | 無 | 無 | 只在 wiki |
| 14 | 評估印務主管 | 多選，具印務主管角色人員、必（:73） | `estimated_by_manager_ids` 整數陣列、至少 1、須為啟用使用者（`:294-299`、`:25-30`）；不驗角色 | 至少 1（FE:`schemas.js:58`） | 必（`QuoteList.js:509`）；id 為字串 | 不一致：後端不驗「印務主管角色」；識別碼型別 |
| 15 | 分享成員層級 | 檢視／編輯（代理）（:74） | `view`／`edit`，標籤「檢視」「編輯」（`quote_permission.py:11-12`） | 「查看」「編輯」（FE:`constants.js:284-285`） | 「檢視」「編輯（代理）」（`PROTO:constants.js:200` 之後的 `PERMISSION_LEVEL_LABELS`） | 不一致：標籤三版不同 |
| 16 | 收款條件備註 | 文字 500（:75） | 500（`:285-287`） | 500（FE:`schemas.js:69`） | 500（`QuoteList.js:571`） | 一致 |
| 17 | 需求備註 | 文字，任何狀態可改（:76） | `requirement_note` 文字，無長度限制（`:44-49`）；終態只允許改此欄（`:393-406`） | 文字（FE:`schemas.js:72`），終態用窄表單（FE:`QuoteFormDrawer.js:68-69`） | 同（`detail/page.js:444-445`） | 一致 |
| 18 | 發票開立方式 | 單選，4 值，第 4 值寫「紙本發票另計」（:77） | 4 值，第 4 值「紙本發票另寄」（`payment.py:25-30`）；選填 | 4 值，選填 | 4 值「紙本發票另寄」（`PROTO:constants.js:314-338`） | 不一致：wiki 標籤「另計」對其他三方「另寄」 |
| 19 | 出貨方式（單頭） | 單選 3 值、選（:78） | `delivery_method` 3 值、選、可 null（`:259-264`） | 3 值、必（前端加嚴）（FE:`schemas.js:61-65`；`QuoteFormDrawer.js:392-396`） | 3 值、選（`QuoteList.js:554-556`） | 不一致：必填性 |
| 20 | 報價截止日 | 日期、選（:84） | `quote_deadline` 日期、選（`:271`） | 日期、選 | 日期、選 | 一致 |
| 21 | 預計交貨日期 | 無（需求單單頭無交期欄） | `expected_delivery_date` 日期、選（`quote_request.py:155`；`:272`） | 表單與基本資訊皆有（FE:`QuoteFormDrawer.js:453`、`QuoteBasicInfo.js:80`） | 無（`PROTO:constants.js:346-362` 預設值無此欄；註解 `:373-374` 寫「單頭已無交期欄」） | 不一致：只在後端與正式前端 |
| 22 | 金額三欄（未稅、稅額、含稅） | 系統計算；稅額＝round(未稅×訂單稅率)（:85-87） | `amount_excl_tax`、`tax_amount`、`total_incl_tax` 十進位 (12,2)；稅率寫死 0.05（`quote_request.py:195-212`、`:256`） | 讀後端 | 稅率寫死 0.05（`PROTO:_lib/pricing.js:37`） | 一致（數值）；wiki 稅率來源為訂單稅率，後端與原型為常數 |
| 23 | 流失原因、流失補充說明 | 六選一、補充文字（:93-94） | `lost_reason` 6 值、`lost_note`（`:85-92`、`:167-174`） | 6 值 | 6 值 | 一致 |
| 24 | 備註 | 文字（:95） | `notes` 文字，終態鎖定（`:273-278`） | 文字 | 文字 | 一致 |
| 25 | 線上討論連結 | 連結；無值可填，有值後不可改（:96） | `slack_thread_url` 字串 500；序列化器驗網址格式（`:251-253`）；通知任務也會寫入（`notify_quote_created.py:54`）；找不到「有值後不可改」的限制 | 限 http／https（FE:`schemas.js:73`） | 輸入框不驗格式；有值即停用（`QuoteList.js:501`、`detail/page.js:1455`） | 不一致：「有值後不可改」只有 wiki 與原型；格式驗證三方各異 |

另有只存在後端的欄位：`linked_order_id`（`:161`）、`deleted_at` 軟刪除（`:226`）；正式前端以 `linked_order {id, order_no}` 顯示（FE:`QuoteBasicInfo.js:44-49,99`），原型以 `order_no` 表示（`PROTO:mock-data.js:182`）。

#### b-2 印件項目（20 欄）

| # | 欄位 | wiki（`WIKI:05-entities/需求單.md:105-118`） | 後端（`quote_item.py`、`quote_item_serializers.py`） | 正式前端（FE） | 原型 | 結果 |
|---|------|--------------------------------------|----------------------------------------------------|--------------|------|------|
| 1 | 項目編號 | 無此列 | `item_no`＝需求單號-序號（`serializers:212-213`） | 讀後端 | `QI-2026-0601`（`PROTO:_lib/store.js:301`；`mock-data.js:162`） | 不一致：編號格式 |
| 2 | 序號 | 無此列 | `seq`，建立時遞增（`quote_item.py:32`） | 讀後端 | 無（以編號代用） | 只在後端 |
| 3 | 項目名稱 | 文字、必（:105） | `name` 字串 255、必（`:131`、`:234`） | 必，無上限（FE:`schemas.js:80`） | 必，無上限（`detail/page.js:1557`） | 不一致：上限只有後端 |
| 4 | 規格備註 | 文字、選（:105） | `spec_note` 文字、選 | 選 | 選 | 一致 |
| 5 | 印件屬性 | 打樣／大貨、必（:106） | `production_type` `proof`／`mass`、必（`:132-134`）；模型預設 `mass`（`quote_item.py:34-39`） | 必（FE:`schemas.js:83-85`） | 必（`detail/page.js:1566`） | 一致 |
| 6 | 數量 | 數字、必（:107） | `quantity` 十進位 (12,2)、須大於 0（`:135-139`、`:194-197`） | 必且大於 0（FE:`schemas.js:86-89`） | 必，`min={0}`，輸入 0 可通過（`detail/page.js:1619-1622`） | 不一致：數值範圍 |
| 7 | 單位 | 單選，數量單位主檔、選（:107） | `unit_id` 整數、選（`:140-145`） | 選（FE:`schemas.js:90-93`） | 選；選項來自 `MOCK_QUANTITY_UNITS` | 一致 |
| 8 | 成本估算 | 金額；需求確認中、待評估成本、已評估成本可改，議價中走重新評估（:108） | `cost_estimate` (12,2)、選、無下限（`:150-152`）；後端沒有議價中鎖成本的程式（`grep NEGOTIATING apps/quote` 僅見列舉與轉換服務） | 非負（FE:`schemas.js:9-13,111`） | 非負；議價中停用輸入（`PROTO:_lib/permissions.js:54-60`、`detail/page.js:1696-1712`） | 不一致：負數、議價中鎖定 |
| 9 | 單價 | 數值，未稅，兩位小數（:109） | `unit_price` (12,2)、選、無下限（`:153-159`） | 非負且至多兩位小數（FE:`schemas.js:17-24`） | `min={0}`、`precision={2}`（`detail/page.js:1719-1721`） | 不一致：後端不擋負數 |
| 10 | 小計 | round(單價×數量)，整數元，唯讀（:110） | `subtotal_excl_tax`；`line_subtotal` 四捨五入至整數元（`apps/core/utils.py:27-`），ROUND_HALF_UP | FE:`pricing.js` | `Math.round`（`PROTO:_lib/pricing.js:9-15`） | 一致（正數情形） |
| 11 | 利潤率 | 唯讀（:111） | 項目序列化器缺值回 `0.00`（`serializers:36-44`）；報價紀錄快照缺值回 `null`（`quote_transition_service.py:227-233`） | 未查證 | 缺值為 `null`，顯示「-」（`PROTO:_lib/pricing.js:21-29`） | 不一致：後端兩處缺值表示法不同；原型與後端項目序列化器不同 |
| 12 | 印件預計交期 | 日期、選（:112） | 欄位名 `delivery_date`，標註「出貨日期」（`quote_item.py:77`） | `delivery_date`（FE:`schemas.js:113`） | `expected_delivery_date`（`PROTO:constants.js:376`） | 不一致：欄位名（wiki、原型用交期，後端、正式前端用出貨日期） |
| 13 | 出貨方式 | 單選 3 值（:112） | `delivery_method` 3 值、選（`:161-166`） | 3 值、選（FE:`schemas.js:114`） | 3 值、選 | 一致 |
| 14 | 包裝備註 | 文字（:112） | `packaging_note`，註解寫「包裝說明」（`quote_item.py:85`） | `packaging_note` | `packaging_note`，介面標籤「包裝說明」（`detail/page.js:1633`） | 不一致：標籤 wiki「包裝備註」對其他「包裝說明」 |
| 15 | 是否急件 | 是／否，預設否（:113） | 無 | 無 | `is_urgent`（`detail/page.js:1598-1612` 附近；`mock-data.js:199`） | 只在 wiki 與原型 |
| 16 | 預計產線 | 多選，產線主檔（:114） | `expected_production_lines` 標籤 id 陣列，限標籤分類 `production`（`:47-49`、`:185-190`） | 正整數 id 陣列（FE:`schemas.js:117`） | 產線名稱字串（`PROTO:mock-data.js:15-27` 的 `MOCK_PRODUCTION_LINES`） | 不一致：識別碼型別（id 對名稱） |
| 17 | 難易度 | 整數 1-10，欄位表未標必填（:115） | `difficulty_level` 1-10、選；送評估時才擋（`serializers:147-149`；`transition_serializers:54-68`） | 必（FE:`schemas.js:97-110`） | 必（`detail/page.js:1642`） | 不一致：必填性 |
| 18 | 是否免審稿 | 是／否（:116） | `review_exempt` 布林，預設否（`:175-177`） | 布林 | 布林 | 一致 |
| 19 | 稿件備註 | 文字 500、選（:117） | `client_note` 500，超過回 422，空字串存 null（`:178-184`、`:199-201`） | 500（FE:`schemas.js:119`） | 500（`detail/page.js:1679`） | 一致 |
| 20 | 參考附件 | 檔案多檔；每檔附說明 200 字（:118） | `file_urls` 字串陣列，每筆至多 500 字元（`:170-174`）；程式註解寫「無額外 metadata」（`quote_item.py:102`） | 字串陣列，不驗證（FE:`schemas.js:122`，註解 `:120-121`） | `file_urls` 加 `file_names`（`detail/page.js:570-571`）；無說明欄 | 不一致：wiki 的「每檔說明」三方皆無；`file_names` 只在原型 |

小結（計數規則：「結果」欄標為不一致或只在一方的列）：單頭非「一致」的列為 #1、2、3、5、6、7、9、11、12、13、14、15、18、19、21、25，共 16 列（#1 只是 wiki 範例格式差異）；印件項目非「一致」的列為 #1、2、3、6、8、9、11、12、14、15、16、17、20，共 13 列。表 b 合計 29 列。

### 表 c：驗證規則

每條規則附各方檔案與行號。「一致」列保留以便對照。

| # | 規則 | wiki | 後端 | 正式前端（FE） | 原型 | 結果 |
|---|------|------|------|--------------|------|------|
| 1 | 需求案名必填、長度 | 必填（:56） | 必填、≤255（`quote_serializers.py:240`） | 必填、無上限（`schemas.js:48`） | 必填、無上限（`QuoteList.js:432`） | 不一致：上限 |
| 2 | 客戶身分須非「無」 | 有（:58） | 查詢集為全部廠客（`:241-244`），序列化器層無此限制；其他層未查證 | 未查證 | 選項過濾（`mock-data.js:124`） | 不一致 |
| 3 | 帳務公司值域 | 感官、柏樂（:64） | 4 值（`:250`；`partner.py:24-29`） | 可選 2 值（FE:`constants.js:308-313`） | 2 值（`PROTO:constants.js:297-312`） | 不一致 |
| 4 | 帳務公司可改時機 | 已評估成本前（:64） | 更新序列化器無狀態限制（`:337-341`、`:393-406`） | 未查證 | 無限制（`detail/page.js:1473-1486`） | 不一致 |
| 5 | 評估印務主管至少一位 | 必填（:73） | 至少 1 且為啟用使用者（`:294-299`、`:25-30`） | `.min(1)`（`schemas.js:58`） | 必填（`QuoteList.js:509`） | 一致 |
| 6 | 評估印務主管須具印務主管角色 | 有（:73） | 只驗啟用，不驗角色（`:25-30`） | 未查證 | 未查證（選項來源 `ADMIN_USER_OPTIONS`） | 不一致 |
| 7 | 收款條件備註 ≤500 | 有（:75） | `max_length=500`（`:285-287`） | `.max(500)`（`schemas.js:69`） | `maxLength={500}`（`QuoteList.js:571`） | 一致 |
| 8 | 單頭出貨方式必填 | 未標必填（:78） | 選填、可 null（`:259-264`） | 必填（`schemas.js:61-65`） | 選填（`QuoteList.js:554-556`） | 不一致 |
| 9 | 線上討論連結格式與可改性 | 有值後不可改（:96） | 驗網址格式；無「有值後不可改」（`:251-253`） | 限 http(s)（`schemas.js:73`） | 不驗格式；有值即停用（`QuoteList.js:501`） | 不一致 |
| 10 | 終態後欄位鎖定 | 一般欄位鎖定（:48） | 只允許改需求備註，否則 422（`:393-406`）；印件項目增修拒絕（`quote_item_serializers.py:13-20`） | 終態窄表單（`QuoteFormDrawer.js:68-69`） | 同（`detail/page.js:444-445`；`permissions.js:69-71`） | 一致 |
| 11 | 項目名稱必填、長度 | 必填（:105） | 必填、≤255（`serializers:131`） | 必填、無上限（`schemas.js:80`） | 必填、無上限（`detail/page.js:1557`） | 不一致：上限 |
| 12 | 數量大於 0 | 必填，範圍未寫（:107） | 大於 0（`serializers:194-197`） | 大於 0（`schemas.js:86-89`） | 必填、`min={0}`（`detail/page.js:1619-1622`） | 不一致 |
| 13 | 難易度 1-10 | 範圍有；必填性未標（:115） | 1-10、選填（`:147-149`） | 必填（`schemas.js:97-110`） | 必填（`detail/page.js:1642`） | 不一致：必填性 |
| 14 | 送印務評估前每筆印件須已填難易度 | 未寫（`WIKI:06:86`） | 有（`transition_serializers:54-68`） | 找不到本機檢查 | 有（`transitions.js:7-9`） | 不一致 |
| 15 | 單價非負、兩位小數 | 兩位小數（:109） | 兩位小數；無下限（`:153-159`） | 非負且兩位（`schemas.js:17-24`） | `min={0}` `precision={2}`（`detail/page.js:1719-1721`） | 不一致：後端可存負數 |
| 16 | 成本估算非負 | 未寫（:108） | 無下限（`:150-152`） | 非負（`schemas.js:9-13`） | `min={0}`（`detail/page.js:1711`） | 不一致：後端可存負數 |
| 17 | 議價中不可直接改成本估算與預計產線 | 有（:108、:114） | 未找到 | 未查證 | 有（`permissions.js:54-62`） | 不一致 |
| 18 | 評估完成前全部印件已填成本；至少一筆印件 | 成本填畢（`WIKI:06:87`） | 至少一筆且成本皆填（`transition_service.py:89-101`） | 未查證 | 只查成本；零筆印件放行（`transitions.js:14-16`） | 不一致：零筆印件 |
| 19 | 成交前全部印件已填單價與小計；至少一筆 | 選定版本單價皆填（`WIKI:06:89`） | 有（`transition_service.py:104-118`） | 未查證 | 查單價與小計；零筆放行（`transitions.js:21-23`） | 不一致：零筆印件、報價版本 |
| 20 | 標記流失須選流失原因 | 有（`WIKI:06:91`） | 有（`transition_serializers:49-52`） | 有（FE:`schemas.js:137-141`；`QuoteActionModals.js:164`） | 有（`detail/page.js:2018`） | 一致 |
| 21 | 重新評估報價、重新啟動須填備註 | 只寫重啟（`WIKI:06:92`） | 兩者皆必填（`transition_serializers:12-15`） | 兩者皆必填（`constants.js:67-70`） | 兩者皆必填（`PROTO:constants.js:67-70`） | 不一致：wiki 未寫重新評估 |
| 22 | 稿件備註 ≤500 | 有（:117） | 有（`:178-184`） | 有（`schemas.js:119`） | 有（`detail/page.js:1679`） | 一致 |
| 23 | 預計產線值域 | 產線主檔（:114） | 標籤分類 `production`（`:47-49`） | id 陣列 | 名稱字串 | 不一致：型別 |
| 24 | 檔案連結 | 每檔說明 200 字（:118） | 每筆網址 ≤500 字元（`:170-174`） | 不驗（`schemas.js:120-122`） | 不驗；另存 `file_names` | 不一致 |
| 25 | 小計與稅額取整 | 整數元（:85-86、:110） | 四捨五入至整數元（`utils.py:22-39`；`quote_request.py:256`） | 讀後端 | `Math.round`（`pricing.js:14,37`） | 一致 |

小結：表 c 共 25 列；一致列為 #5、7、10、20、22、25，共 6 列；不一致列為其餘 19 列。

#### 三張表不一致總數（以「結果」欄逐列清點為準）

| 表 | 不一致或只在一方的列數 |
|----|----------------------|
| a（狀態名 2、轉換條件 3） | 5 |
| b（單頭 16 列＋印件項目 13 列） | 29 |
| c | 19 |

註：表 b 單頭 #1 僅為 wiki 範例格式差異，若不計則單頭為 15 列、表 b 為 28 列。

## 五、提交與 Linear 的對應

範圍：2026-09-12 至 2026-11-11（60 天），所有參照（`git log --all --since=60.days.ago`），分「不含合併」與「合併」。識別碼定義：`FE-`、`BE-`、`PM-` 加數字（PR 範本示例 `BE-95`、`FE-15`；提交內可見 `PM-1358`）。通用規則（兩到四個大寫字母加連字號加數字）在 erp 會誤抓單據編號（`ORD-2026`、`WO-2026`、`PI-2026`），erp 通用規則命中 102 筆，其中大部分不是 Linear 議題，故以 `FE|BE|PM` 為準。

| 程式庫 | 提交總數（所有參照） | 不含合併 | 含 Linear 識別碼（提交訊息標題加內文） | 比例 | 補充 |
|--------|---------------------|---------|-------------------------------------|------|------|
| erp | 860 | 677 | 14 | 2.1% | 其中只動 `(prototype)`、`docs`、`openspec` 的提交 442 筆，0 筆含識別碼；其餘 235 筆含 14 筆，6.0% |
| sens-print-core | 425 | 298 | 68 | 22.8% | 通用規則 70 筆；68 筆全來自作者 billluo（93 筆中的 68 筆）；Eric Chang 0／108、raymond 0／97 |
| sensation-api | 208 | 111 | 5 | 4.5% | 5 筆全來自 billluo；raymond 0／58、Eric Chang 0／46 |

erp 作者分佈：Kawato-Miles 0／435、Yana 8／161、Northa Huang 6／45、其餘 0。

合併提交與分支名：

| 程式庫 | 合併提交 | 合併提交含 `fe|be|pm` 加數字 | 近期有活動的分支 | 分支名含 Linear 式識別碼 |
|--------|---------|---------------------------|-----------------|----------------------|
| erp | 183 | 98 | 86 | 38（例：`feat/fe257-receivable`、`feat/fe-592-production-management-pages`；多數寫成 `fe257` 無連字號） |
| sens-print-core | 127 | 0 | 47 | 0；其中 36 個含 `#數字`（例：`feat/activity_log_#2833`） |
| sensation-api | 未統計（取樣不一致） | 0 | 18 | 0；其中 7 個含 `#數字` |

`#數字` 指向哪個系統：未查證（提交內文中沒有 `Fixes #` 類語法，`git log --all --since=60.days.ago --no-merges --format=%B \| grep -c -i -E "(close|fix|resolve)[a-z]* #[0-9]+"` 三庫皆為 0）。

### 5.1 抽樣：erp（不含合併，嚴格規則，共 14 筆，取 10 筆）

| 提交 | 日期 | 作者 | 標題（節錄） | 識別碼 |
|------|------|------|-------------|--------|
| 49055a3e | 2026-11-05 | Northa Huang | feat(workOrder): add work order document preview | FE-504、BE-361 |
| c23446f2 | 2026-11-05 | Northa Huang | feat(workOrder): add work order list, assignment and sharing | FE-590 |
| 8eae2da1 | 2026-11-05 | Northa Huang | feat(workOrder): add review flow, delivery and work reports | FE-469 |
| 3152099b | 2026-11-05 | Northa Huang | feat(workOrder): add work order detail page | FE-468、FE-503 等 |
| d9b90e8b | 2026-10-21 | Yana | feat(qc): add the quantity summary and qc records tab | FE-608 |
| 0ab0c4ff | 2026-10-28 | Yana | feat: add all transfer tickets page | FE-594 |
| 07b63d60 | 2026-10-28 | Yana | feat: add all transfer tickets page | FE-594 |
| 7b537ef0 | 2026-10-27 | Yana | feat: add receiving queue page | FE-596 |
| 6dbf04cd | 2026-10-21 | Yana | feat(qc): add the quantity summary and qc records tab | FE-608 |
| 12540523 | 2026-10-21 | Yana | refactor(production): move print item work order writes | FE-468 |

### 5.2 抽樣：sens-print-core（不含合併，嚴格規則，共 68 筆，間隔取 10 筆）

| 提交 | 日期 | 作者 | 標題（節錄） | 識別碼 |
|------|------|------|-------------|--------|
| d91611df | 2026-11-11 | billluo | fix(core): 修正活動紀錄 review 發現的內容與可見範圍問題 | BE-487 |
| a1cf15ec | 2026-11-11 | billluo | feat(order): 訂單層事件寫入統一活動紀錄 | BE-487 |
| babceb30 | 2026-11-10 | billluo | feat(core): 新增統一活動紀錄表與寫入口 | BE-487 |
| 366af672 | 2026-10-30 | billluo | fix(production): BE-360 工序 P5~P7 成本改帶上機張數 | BE-360 |
| eef84c90 | 2026-10-28 | billluo | fix(production): BE-427 /receipts 關掉繼承到的 PATCH | BE-427、FE-595 |
| 33a9874c | 2026-10-23 | billluo | feat(production): BE-427 點收佇列、點收紀錄與點收／補收 | BE-427、PM-1359 |
| a5d34d49 | 2026-10-23 | billluo | feat(production): BE-426 轉交單模型 | BE-424、BE-426、BE-427 |
| af9c3018 | 2026-10-21 | billluo | feat(production): 生產管理任務列加訂單簡要（BE-424） | BE-424、FE-592 |
| 2766f6fd | 2026-10-18 | billluo | feat(order): 印件印製狀態初始值改為等待中（FE-467） | FE-467 |
| ca8ba94c | 2026-10-18 | billluo | feat(production): BE-424 權限碼、生產管理選單 | BE-424 |

### 5.3 合併請求範本

| 程式庫 | 有無範本 | 內容 |
|--------|---------|------|
| erp | 有：`.github/PULL_REQUEST_TEMPLATE.md`（FE，2026-06-12 最後修改） | 第 1 行「Linear issue - Fixes <>」，註解說明填 `BE-95`、`FE-15`，無對應議題填 N/A；本機 `docs/pm-prototype-workflow.md` 與 Sens 專案規則另要求原型 PR 填 N/A |
| sens-print-core | 找不到範本（`git ls-tree -r origin/develop` 無 `PULL_REQUEST_TEMPLATE`）；有 PR 檢查工作流程 `api-docs.yml`、`claude-code-review.yml` | |
| sensation-api | 找不到範本 | |

## 六、原型與正式前端的關係

### 6.1 引用方向

| 方向 | 事實 | 證據 |
|------|------|------|
| 正式頁引用原型 | 沒有。僅 4 處文字提到 `(prototype)`，皆為註解或路由防護，不是 import | `git grep -n -E "\(prototype\)\|quote-prototype" origin/develop -- 'apps/erp/src/app/(dashboard)' packages/shared apps/china-supplier`：`DashboardShell.js:48`、`order/detail/constants.js:1`、`constants/index.js:13`、`hooks/useAuthGuard.js:74` |
| 原型引用正式共用套件 | 有，主要是元件與樣式：`@shared/components` 467 次、`@shared/styles` 80 次、`@shared/utils` 6 次、`@shared/constants` 3 次、`@shared/lib` 2 次、`@shared/hooks` 2 次、`@shared/services` 1 次 | `git grep -h -o -E "from '@shared/[a-z]+" origin/develop -- 'apps/erp/src/app/(prototype)'` |
| 需求單原型的常數 | 不引用共用套件，自帶一份複製：「逐字取自正式前端 origin/develop 分支 `packages/shared/services/quote/constants.js`」，避免動到共用套件 | `PROTO:_lib/constants.js:1-5` |
| 原型的假資料與純函式 | 放在 `(prototype)/<模組>/_lib/`，正式頁沒有引用 | `docs/pm-prototype-workflow.md`「mock 與商業邏輯放哪」；上列 grep 無反向引用 |

### 6.2 搬移或重寫

程式庫文件規定做法是搬移：「把資料夾從 `(prototype)/<name>/` 移到 `(dashboard)/<name>/`，把靜態 mock 換成 React Query hooks」（`docs/pm-prototype-workflow.md` 第 3 步，最後修改 2026-09-16）。

實際歷史：

- `git log origin/develop -C -M20% --diff-filter=RC --name-status -- apps/erp/src/app` 中，來源在 `(prototype)` 而目的不在（或反向）的改名或複製：0 筆。
- 三個例子都是「新增檔案」，原型原地保留：

| 提交 | 日期 | 作者 | 標題 | 檔案狀態 |
|------|------|------|------|---------|
| d952a5d9 | 2026-10-14 | Northa Huang | feat(work-order): migrate work order list from prototype to dashboard | 10 個新增、2 個修改；內文寫「move the prototype /work-orders list to the dashboard as /work-order-list …backed by an API-shaped mock」，同時說明路由改名為 `/work-order-list`，因為原型保留 `/work-orders` 路徑 |
| 40864b68 | 2026-10-21 | Yana | feat(production): add the print item unassigned and list pages with the assign dialog | 12 個新增、5 個修改；內文稱「five prototype actions with three placeholders disabled」 |
| 924a85da | 2026-10-30 | Yana | feat(shipment): add shipment management page and order shipments tab | 16 個新增、2 個修改；無原型檔被刪除 |

- 需求單：正式頁首次提交 `ec7f5c95`（2026-04-15，Northa Huang「feat: quote module UI」）早於原型首次提交 `fd429c01`（2026-09-02，Kawato-Miles「新增需求單模組 prototype（列表＋詳情，比照正式前端現況）」）。需求單的流向是正式頁到原型。
- 近 60 天內 `(dashboard)` 路徑的非合併提交 53 筆；其中提交訊息含 prototype 或原型字樣的 6 筆（`git log origin/develop --since=60.days.ago --no-merges -i --grep='prototype\|原型' -- '(dashboard)' packages/shared`）。
- 正式提交內文有 Co-Authored-By 署名（例：`d952a5d9` 署名 Claude Fable 5.1），表示正式頁也由 AI 輔助撰寫（僅依署名行，未查證其他）。

## 七、未查證

1. 後端 `openapi.yaml` 實際內容與行數：檔案不在任何本機程式庫（`docs/` 被 gitignore），未去 `sensationsprint/api-docs` 取得。
2. 原型本機工作樹與 `origin/develop` 的差異：只確認 `packages/shared/services/quote/constants.js` 較舊，原型資料夾本身未比對。
3. 後端 `origin/develop` 新增的 147 個提交中，除 `apps/quote`、`apps/partner`、`apps/core/choices.py` 外的差異未逐一比對；表中後端行號引自本機工作樹。
4. 正式前端是否在「評估完成」「成交」前做本機缺漏檢查：只查了 `useQuoteTransitionFlow.js`，其他檔案未逐一查。
5. 正式前端對「客戶身分非無」「評估印務主管角色」「帳務公司可改時機」的處理：未查。
6. 原型 `ADMIN_USER_OPTIONS` 是否限制為印務主管角色：未查。
7. 後端刪除需求單的視圖（`quote_views.py:333`）是否有狀態限制：只確認方法存在，未讀內容。
8. `#數字`（後端分支名與合併訊息，例 `#2369`）所屬系統：未查證。
9. sensation-api 的合併提交數：兩次統計結果不同（97 與 109），未採用。
10. 利潤率「0.00」與「null」在前端的實際顯示差異：只比對後端兩處程式，未追前端呈現。
11. wiki 稅率來源（「與成交後訂單同一個」）在後端是否有設定值：只看到需求單內寫死 `Decimal("0.05")`，訂單端未查。
12. 原型 `PERMISSION_LEVEL_LABELS` 的確切行號：以區塊名標示，未逐行確認。
13. 報價紀錄（PriceLog）、活動紀錄、分享成員、複製需求單等次要功能的四方比對：本次未涵蓋。

### 檔案中出現的疑似指示文字（視為資料，未照做）

- `/Users/b-f-03-029/erp/CLAUDE.md` 開頭的 OPENSPEC 區塊：「Always open `@/openspec/AGENTS.md` when the request…」。
- `/Users/b-f-03-029/sens-print-core/CLAUDE.md`、`/Users/b-f-03-029/sensation-api/CLAUDE.md`：給 Claude Code 的開發指引（環境設定、指令、PR 與文件流程）。
- `/Users/b-f-03-029/erp/docs/pm-prototype-workflow.md`：「不要在 PR 頁面按 Update branch」「`git merge develop` / `git pull origin develop`」等操作禁令，為人與 AI 共用的作業說明。
