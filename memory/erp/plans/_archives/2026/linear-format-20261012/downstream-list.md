# 下游更正清單（wiki 提交 27b36ab，2026-10-12 盤點）

只讀盤點結果，尚未修改任何下游。變動編號：1 範圍用詞五個與刪權限名稱；2 評估印務主管＝自動被分享（編輯），列分享清單、含刪除與推進、成本可改階段同接單業務；3 業務主管與印務主管看全公司需求單，業務主管可代操作任何訂單；4 Supervisor 可改派四種單據；5 被分享（編輯）不論角色、活動紀錄記實際操作者；6 生產範圍改稱所屬產線、自己負責。

## A. OpenSpec

| 檔案 | 位置 | 矛盾 |
|---|---|---|
| quote-request | 接單業務改派 L759、L781 | 4 |
| quote-request | 狀態機刪除 L146、L218-222 | 2、用詞 |
| quote-request | 檢視權限管理 L264-281 | 用詞；缺評估印務主管自動列入分享成員 |
| quote-request | 詳情頁 L484、L497 | 3 |
| quote-request | 成本評估流程 L241-254；評估印務主管 lifecycle L419-440 | 2 |
| consultation-request | 諮詢人員改派 L684-708 | 4 |
| order-management | 接單業務改派 L3046-3062、L3085 | 4 |
| order-management | 備註編輯權限表 L1556-1560、L1596-1600 | 3 |
| order-management | 列表可見範圍 L785；業務主管可見範圍 L1341-1360 | 3、範圍卡各角色 |
| order-management | 訂單分享 L856-859 | 5 |
| order-management | 工單編輯（代理）L957、L986、L1701 | 用詞 |
| work-order | L1778；詳情可見範圍 L1822 | 用詞；可見角色待對照 |
| production-execution | L53、L367、L990、L1036、L1382-1387、L1408、L1453、L1472 | 6、權限名稱、用詞 |
| after-sales-ticket | 無改派 Requirement | 4，屬新增承諾，走 OpenSpec change |

## B. Linear 已交付票

| 票號 | 矛盾 |
|---|---|
| PM-1207 | 權限名稱與範圍用詞；送印務評估實體關係 2 與驗收 4「不列在分享成員清單」相反；另案「印務主管全公司」已拍板 |
| PM-1215 | 「被指派」範圍；成本估算填寫驗證規則 1、2 與驗收缺需求確認中 |
| PM-1338 | 需求單刪除驗證規則 2 與驗收 2 相反；權限名稱 |
| PM-1216 | 改派缺 Supervisor；另案「業務主管全公司」已拍板 |
| PM-1347 | 權限名稱；工單列表只帶自己的屬介面預設篩選 |
| PM-1085 | 業務主管全公司唯讀與驗收「無修改入口」相反（代操作） |
| PM-1086 | 分享對象限業務諮詢；轉派限業務主管 |
| PM-1074 | 權限名稱、範圍用詞 |
| PM-1217 | 諮詢單改派限業務主管 |
| PM-1356、PM-1357、PM-1359 | 生產範圍用詞與權限名稱 |
| PM-1346、PM-1146、PM-1149 等 | 未盤點 |

## C. 操作手冊（production-stage-seg1-manual-artifact.html）

需求單管理概覽 L392、L501、L505；建立需求單 L692；登錄印件需求與金額 L766、L796；送印務評估與評估完成 L983-1046；需求單分享成員 L443、L1259、L1329；改派接單業務 L1270-1346；訂單改派 L1358、L1593、L1720-1820 待核對。Prototype 完成後再改。

## D. Prototype（erp 分支 prototype/dispatch-and-shipping）

| 檔案 | 函式 | 應有行為 |
|---|---|---|
| quote-prototype/_lib/permissions.js | canManageQuote、canDeleteQuote、canCompleteEstimate、isQuoteOwnerOrEditor | 評估印務主管等同被分享（編輯）；不限角色 |
| 同上 | canEditCostFields | 加需求確認中 |
| 同上 | RELATED_ONLY_ROLES、canSeeQuote | 業務主管看全公司 |
| 同上 | canReassignQuoteOwner | 加 Supervisor |
| orders/_lib/permissions.js | canAdvanceOrderStatus、canCancelOrder 等 | 業務主管代操作與跨單取消；被分享（編輯）不限角色 |
| 同上 | canOperateOrderShipments、canSubmitOrderForReview、canDeletePrintItem | 被分享（編輯）不限角色 |
| 同上 | canManageSharing | 含 Supervisor，wiki 未載，待裁決 |
| work-orders/_lib/permissions.js | canManageSharing、canSubmitProcess | 被分享（編輯）不限角色 |
| production-floor 多檔 | 使用者可見訊息與註解「產線範圍」「負責範圍」 | 改用詞 |

## E. 測試（erp-prototype-tests）

unit：quote-rules.test.mjs L115-167；ch2-order-lifecycle-rules.test.mjs L27、L88-91。scenario-catalog：1.2、1.13、1.14、1.15、1.16、2.10、10.5、14.15。e2e：01-quote 對應情境。

## 盲測後追加

| 項目 | 說明 |
|---|---|
| AFT-16 | 售後服務單可見範圍後端以建立者判定，wiki 定為跟著訂單（D5）；Prototype 與測試的售後可見範圍一併對齊 |
| ORD-058 | 擴充 Supervisor 管理訂單分享成員的後端權限（D1） |

## 需求單重新交付前要先裁決的上游矛盾（範例審查發現，2026-10-12）

| # | 議題 | wiki | 情境目錄或 Prototype | 歸屬 |
|---|---|---|---|---|
| 1 | 重新評估的調整說明 | 選填 | 必填 | 新議題 |
| 2 | 評估印務主管刪除需求單 | 可以 | 不可以 | 權限修正 change |
| 3 | 被分享（編輯）的非業務角色推進需求單 | 可以 | 限業務、諮詢 | 權限修正 change |
| 4 | 評估印務主管改成本的狀態 | 含需求確認中 | 不含 | 權限修正 change |
| 5 | 單價何時可改 | 議價階段 | 所有非終態 | 新議題 |
| 6 | 業務主管看需求單的範圍 | 全公司 | 只看相關的單 | 權限修正 change |
| 7 | 進入議價按鈕名稱 | — | 情境目錄「送出報價」、Prototype「報價」 | F1 已裁決，情境目錄待改 |
| 8 | 需求單編號格式 | 情境卡例子 QR-2026-0512 | Prototype Q 加日期加兩碼 | 新議題，無 OQ |
| 9 | 狀態機轉換條件缺「單價未填不可成交」「沒有印件不可評估完成或成交」 | 狀態機卡沒有 | 情境目錄與 Prototype 都有 | 新議題 |
| 10 | 需求單欄位名稱：wiki 實體卡「詢問來源」、Prototype「詢價來源」 | 名稱不一致 | 新議題 |
| 11 | 需求單報價成交情境卡第 6 步把標記成交與轉訂單寫在同一步，未說明是兩個動作；狀態卡與 Prototype 是兩個動作 | 情境卡措辭不清 | 新議題，wiki 小修 |
| 12 | mock 人員清單把張惠雯列為業務，Prototype 模擬登入與情境目錄 1.25 把她當諮詢 | — | mock 與登入設定不一致 | 與 K11 林雅婷殘留一起修 erp mock |
