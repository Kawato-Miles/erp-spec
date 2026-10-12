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
