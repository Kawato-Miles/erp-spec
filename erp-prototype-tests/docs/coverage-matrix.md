# 商業需求覆蓋矩陣

比對三個來源：wiki 商業需求正本（分母）、Prototype 實作、測試情境目錄。

範圍：需求單 → 訂單（含款項與發票）→ 審稿 → 訂單管理人確認製作細節與工單建立 → 印務製程登打與審核 → 交付產線 → 生管接收與派工 → 師傅報工與場內轉交。

計數口徑：

| 欄位 | 定義 |
| --- | --- |
| wiki | wiki 卡定義的流程條數 |
| 實作 | Prototype 有完整實作證據的條數；「部分」不計入，另在缺什麼句列出 |
| 測試 | 測試情境目錄有對應節號的條數；第十三章列待辦者計入，並標「列待辦」 |

分類：主流程＝單據往下一站的必經路徑；副流程＝正常營運也會走到的附加或分支路徑；逆流程＝往回走或中止的路徑。

---

## 一、總表

| 模組 | 主流程 | 副流程 | 逆流程 |
| --- | --- | --- | --- |
| A 需求單 | 3／3／0，缺：三條流程無畫面測試（純函式已有 Vitest） | 3／3／0，缺：三條流程全無測試 | 2／1／0，缺：諮詢轉入的需求單流失自動建諮詢訂單未實作 |
| B 訂單成立與維護 | 8／7／3，缺：訂單複製建單未實作 | 8／5／3，缺：回簽檔追加上傳、已取消後備註與附件鎖定、代理期間操作歸屬三條只做一半 | 1／0／0，缺：取消原訂單另開新訂單重談只做到取消 |
| C 款項與發票 | 4／3／1，缺：對帳與催收沒有逾期款項清單；規劃、開發票、核銷三條全無測試 | 9／7／0，缺：一期拆兩期未實作；九條流程全無測試 | 5／5／1，缺：退款執行四步全無測試 |
| D 審稿 | 4／3／1，缺：維護審稿人員能力等級未實作；覆寫分派與打樣決策無測試 | 8／8／5，缺：候選清單為空、不補件不設上限兩條無測試 | 2／2／1，缺：打樣後稿件問題重審無測試 |
| E 製作細節確認與工單建立 | 2／2／2 | 3／3／3 | 1／1／1 |
| F 製程規劃、審核與交付產線 | 3／3／3 | 5／5／5 | 3／3／3，缺：三條全部只列待辦、本輪未測 |
| G 生管接收與派工 | 2／2／2 | 2／2／2 | 0／0／0 |
| H 報工與場內轉交 | 2／2／2 | 4／4／3，缺：來源任務報廢時擋下點收無測試 | 4／4／4，缺：其中三條只列待辦、本輪未測 |
| 合計 | 28／24／14 | 42／37／21 | 18／16／10 |

---

## 二、明細表

### A 需求單

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| A 需求單 | 主 | 需求單報價成交（建單填項目 → 送印務評估 → 評估完成 → 議價 → 成交轉訂單） | [[需求單報價成交]] | 有：quote-prototype/page.js、detail/page.js；store 的 createQuote、submitForEstimate、completeEstimate、sendQuote、closeDeal；轉單為 orders/_lib/store.js 的 createOrderFromQuote | 未涵蓋 |
| A 需求單 | 主 | 需求單複製建單 | [[需求單複製建單]] | 有：quote-prototype/_lib/store.js 的 duplicateQuote | 未涵蓋 |
| A 需求單 | 主 | 需求單參考附件保存 | [[需求單參考附件保存]] | 部分：quote-prototype/detail/page.js 有「參考檔案」欄唯讀列出 file_urls，store 無上傳與換版動作 | 未涵蓋 |
| A 需求單 | 副 | 重新評估報價（議價中退回待評估成本） | [[需求單報價成交]] | 有：requoteQuote | 未涵蓋 |
| A 需求單 | 副 | 已評估成本階段主管直接改成本、不退狀態 | [[需求單報價成交]] | 有：updateQuoteItem 可改 cost_estimate，不切狀態 | 未涵蓋 |
| A 需求單 | 副 | 沒有相近舊單時改從頭新建 | [[需求單複製建單]] | 有：createQuote | 未涵蓋 |
| A 需求單 | 逆 | 需求單流失 | [[需求單流失]] | 有：markLost（含流失原因） | 未涵蓋 |
| A 需求單 | 逆 | 諮詢轉入的需求單流失時系統自動建諮詢訂單結算諮詢費 | [[需求單流失]] | 未實作：全 (prototype)/ 目錄未找到自動建諮詢訂單的動作 | 未涵蓋 |

### B 訂單成立與維護

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| B 訂單 | 主 | 訂單成立確認（草稿 → 待業務主管審核 → 審核通過 → 報價待回簽 → 已回簽） | [[訂單成立確認]] | 有：orders/approval-queue/page.js；store 的 submitForReview、approveOrder、markQuoteSent、confirmSignBack | 未涵蓋 |
| B 訂單 | 主 | 訂單複製建單 | [[訂單複製建單]] | 未實作：全目錄無 duplicateOrder 或同義動作 | 未涵蓋 |
| B 訂單 | 主 | 訂單客戶與聯絡資料維護 | [[訂單客戶與聯絡資料維護]] | 有：orders/_components/detail/InfoTab.js；updateOrderFields | 未涵蓋 |
| B 訂單 | 主 | 訂單印件規格維護 | [[訂單印件規格維護]] | 有：updatePrintItem、updatePrintItemUnitPrice | 1.3 |
| B 訂單 | 主 | 訂單三類備註維護（訂單須知、交貨備註、付款備註） | [[訂單三類備註維護]] | 有：InfoTab.js 三欄獨立編輯，經 updateOrderFields 保存 | 未涵蓋 |
| B 訂單 | 主 | 訂單其他附件保存（含用途說明） | [[訂單其他附件保存]] | 有：AttachmentsTab.js 含用途說明欄；store 的 addAttachment、removeAttachment | 未涵蓋 |
| B 訂單 | 主 | 訂單負責業務改派（含理由分類與離職交接清空分享成員） | [[訂單負責業務改派]] | 有：reassignOwner（帶 reasonCategory、reasonNote） | 3.5 |
| B 訂單 | 主 | 單據分享與職務代理（授予檢視或編輯代理、收回） | [[單據分享與職務代理]] | 有：orders 的 addSharedMember、removeSharedMember；work-orders 的 addSharedMember、updateSharedMemberLevel、removeSharedMember；quote 的 updateQuotePermissionLevel | 11.15 |
| B 訂單 | 副 | 業務主管認為條件不合理時系統內不設退回、討論走系統外 | [[訂單成立確認]] | 有：permissions.js 與 store 均無訂單退回草稿的動作 | 未涵蓋 |
| B 訂單 | 副 | 回簽檔追加上傳、不重複推進狀態、不覆寫首次回簽時間 | [[訂單成立確認]] | 部分：confirmSignBack 可重複執行，但未見多份回簽檔並存與首次時間保護 | 未涵蓋 |
| B 訂單 | 副 | 比價期間直接改印件單價、依當前內容重出報價單 | [[訂單成立確認]] | 有：updatePrintItemUnitPrice；markQuoteSent 可重複 | 未涵蓋 |
| B 訂單 | 副 | 改急件選項重推訂單交期並同步未終態工單、通知負責印務 | [[訂單印件規格維護]] | 有：_lib/urgent-due-date.js、store 的 _notifyUrgentOptionChange；work-orders 的 syncPrintItemDueDate | 1.5、1.6、1.7 |
| B 訂單 | 副 | 製作段購買數量鎖定、加量改走加開印件 | [[訂單印件規格維護]] | 有：permissions.js 的分界判定；store 的 addPrintItem 複製原規格 | 1.3 |
| B 訂單 | 副 | 訂單進終態後客戶欄與印件欄位唯讀 | [[訂單客戶與聯絡資料維護]]、[[訂單印件規格維護]] | 有：permissions.js 的 isOrderTerminal 與 canEditOrderSection | 未涵蓋 |
| B 訂單 | 副 | 訂單已取消後三類備註與其他附件鎖定 | [[訂單三類備註維護]]、[[訂單其他附件保存]] | 部分：備註鎖定條件為兩個終態（見反向落差第 3 條）；附件未見取消後停用上傳 | 未涵蓋 |
| B 訂單 | 副 | 代理期間被授權者代為操作、活動紀錄歸實際操作者 | [[單據分享與職務代理]] | 部分：分享層級與代理動作開放已做；活動紀錄的操作者歸屬未逐項驗證 | 11.15 |
| B 訂單 | 逆 | 取消原訂單、另開新訂單依重談金額重走成立 | [[訂單成立確認]] | 部分：cancelOrder 有；另開新訂單無複製入口，須從頭建 | 未涵蓋 |

### C 款項與發票

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| C 款項 | 主 | 收款項目規劃（建期、填預計收款日與預計開發票日、預計金額） | [[收款項目規劃]] | 有：billing/InstallmentModal.js、InstallmentSection.js；store 的 addBillingInstallment、updateBillingInstallment | 未涵蓋 |
| C 款項 | 主 | 收款項目開立發票（一期一票、含稅目標值、品項檢核） | [[收款項目開立發票]] | 有：billing/IssueInvoiceModal.js；store 的 issueInvoice | 未涵蓋 |
| C 款項 | 主 | 收款核銷分配（登款、分配各期、切已完成） | [[收款核銷分配]] | 有：billing/PaymentRecordModal.js、PaymentAllocationTable.js；store 的 addPayment、updatePayment | 未涵蓋 |
| C 款項 | 主 | 對帳與催收（三方對帳差錯清單、逾期款項清單、催補複核） | [[對帳與催收]] | 部分：payment/billing-anomaly、payment/receivable、payment/pending-invoice 三頁與 billing/ReconciliationPanel.js 已做；逾期款項清單未做 | 11.13 |
| C 款項 | 副 | 一期拆兩期（原期取消、兩筆新期平輩） | [[收款項目規劃]] | 未實作：全目錄無拆期動作 | 未涵蓋 |
| C 款項 | 副 | 預開發票單張超上限時規劃階段拆多期 | [[收款項目規劃]] | 有：addBillingInstallment 可自由多建期 | 未涵蓋 |
| C 款項 | 副 | 預計金額合計與應收總額不符時顯示差額提示、不阻擋 | [[收款項目規劃]] | 有：InstallmentSection.js 的「收款項目合計與應收總額不一致」提示 | 未涵蓋 |
| C 款項 | 副 | 已開立發票作廢重開 | [[收款項目開立發票]] | 有：billing/VoidInvoiceModal.js；store 的 voidInvoice | 未涵蓋 |
| C 款項 | 副 | 開出後折讓減額 | [[收款項目開立發票]] | 有：billing/CreateAllowanceModal.js、VoidAllowanceModal.js；store 的 createAllowance、voidAllowance | 未涵蓋 |
| C 款項 | 副 | 客戶指定品名或要求攤開明細時改品項 | [[收款項目開立發票]] | 有：IssueInvoiceModal.js 的品項多列與差額擋下 | 未涵蓋 |
| C 款項 | 副 | 溢收餘額掛預收（未分配） | [[收款核銷分配]] | 有：PaymentAllocationTable.js 註明未分配差額記入預收 | 未涵蓋 |
| C 款項 | 副 | 一筆匯款跨多期分配 | [[收款核銷分配]] | 有：PaymentAllocationTable.js 逐期填分配金額 | 未涵蓋 |
| C 款項 | 副 | 出貨後指定期限付款、依預計收款日盯客戶 | [[收款項目規劃]]、[[對帳與催收]] | 部分：預計收款日欄位有；無逾期清單與盯收動線 | 未涵蓋 |
| C 款項 | 逆 | 退款執行（主管核可 → 確認生效認列 → 建退款款項與折讓 → 會計出金後切已完成） | [[退款執行]] | 有：orders/adjustment-review-queue、payment/refund-payout；store 的 createAdjustment、submitAdjustment、approveAdjustment、confirmAdjustment | 未涵蓋 |
| C 款項 | 逆 | 主管退回退款訂單異動、業務修改後重送 | [[退款執行]] | 有：rejectAdjustment | 未涵蓋 |
| C 款項 | 逆 | 訂單異動流程判路（補收與五個退款進入點） | [[訂單異動流程]] | 有：createAdjustment 的 type 分流；permissions.js 的售後與諮詢分流判定 | 未涵蓋 |
| C 款項 | 逆 | 訂單取消五層連鎖（訂單、印件、工單、生產任務、出貨單） | [[訂單異動流程]] | 有：cancelOrder、logCancelCascade、_lib/cancel-actions.js；work-orders 的 cancelForPrintItems；production-floor 的 applyCancelledTaskStatuses | 13.18（列待辦） |
| C 款項 | 逆 | 訂單異動單據更正（改金額、取消建錯的單） | [[訂單異動流程]] | 有：updateAdjustment、cancelAdjustment | 未涵蓋 |

### D 審稿

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| D 審稿 | 主 | 印件審稿（建印件評難易度 → 分派 → 上傳稿件 → 逐輪判定 → 確認可製作） | [[印件審稿]] | 有：prepress-review/page.js、detail、pending-assign；orders store 的 uploadArtwork、assignReviewer、submitReview、confirmProducible | 2.1、2.2、2.3、2.5 |
| D 審稿 | 主 | 覆寫審稿分派（換人並留活動紀錄） | [[覆寫審稿分派]] | 有：prepress-review/_components/AssignReviewerDialog.js；store 的 assignReviewer（帶 reason） | 未涵蓋 |
| D 審稿 | 主 | 維護審稿人員能力等級 | [[維護審稿人員能力等級]] | 未實作：_lib/prepressReview.js 只有能力等級判定資料，無主管維護介面與調整留痕 | 未涵蓋 |
| D 審稿 | 主 | 打樣決策與重新打樣（填打樣結果 → 確認大貨可製作） | [[打樣決策與重新打樣]] | 有：sample-resource/page.js；orders store 的 recordSampleResult | 未涵蓋 |
| D 審稿 | 副 | 建立審稿討論串（勾選印件共用一串、mention 訂單管理人） | [[印件審稿]] | 有：_lib/discussions.js；store 的 openReviewDiscussion | 1.4 |
| D 審稿 | 副 | 免審印件建立當下直達合格、仍需業務確認可製作 | [[印件審稿]] | 有：addPrintItem 的免審路徑自建合格輪次 | 2.4 |
| D 審稿 | 副 | 批次審稿（整批同一結果、退件原因共用、備註可逐件覆寫） | [[印件審稿]] | 有：submitBatchReview | 2.6 |
| D 審稿 | 副 | 補件迴圈（不合格 → 補件 → 已補件 → 原審稿人員重審） | [[印件審稿]] | 有：resupplyArtwork | 2.5 |
| D 審稿 | 副 | 審稿備註修改留痕（限該輪原審稿人員） | [[印件審稿]] | 有：updateReviewNote | 2.6 |
| D 審稿 | 副 | 候選清單為空時提示、本次分派不成立 | [[覆寫審稿分派]] | 有：AssignReviewerDialog.js 的無可選人員提示 | 未涵蓋 |
| D 審稿 | 副 | 打樣結果 NG-製程問題時自動在原打樣印件下建新打樣工單 | [[打樣決策與重新打樣]] | 有：recordSampleResult 帶 newWorkOrderNo | 未涵蓋 |
| D 審稿 | 副 | 不合格後未補件：不設上限、不設停滯提醒 | [[印件審稿]] | 有：store 無補件次數上限與提醒 | 未涵蓋 |
| D 審稿 | 逆 | 合格後退回重審（轉待改稿、不建輪次） | [[印件審稿]] | 有：returnForRework | 13.21（列待辦） |
| D 審稿 | 逆 | 打樣後稿件問題重審（棄用原打樣印件、複製新印件重走審稿） | [[打樣後稿件問題重審]] | 有：abandonPrintItem（fromSampleArtworkNg）、copyPrintItemForSampleArtworkNg | 未涵蓋 |

### E 製作細節確認與工單建立

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| E 工單建立 | 主 | 印件製作細節確認並自動建立草稿工單 | [[印件製作細節確認]] | 有：orders/production-detail-queue/page.js；store 的 confirmProductionDetails；work-orders 的 createDraftWorkOrder | 3.1 |
| E 工單建立 | 主 | 印務主管指派負責印務與審核主管 | [[印件製作細節確認]] | 有：print-items/pending-assign/page.js；work-orders 的 assignWorkOrder | 3.2、3.6、3.7 |
| E 工單建立 | 副 | 一張工單不足時印務主管加開工單 | [[印件製作細節確認]] | 有：addExpandedWorkOrders | 3.7、3.8 |
| E 工單建立 | 副 | 製作細節有誤時走製作討論串、系統內不設退回 | [[印件製作細節確認]] | 有：openProductionDiscussion；store 無製作細節退回動作 | 1.4 |
| E 工單建立 | 副 | 工單改派負責印務（含理由分類、離職交接清空分享成員） | [[工單]]、[[印務主管]] | 有：assignWorkOrder 帶 reason 與 reason_note | 3.3、3.4 |
| E 工單建立 | 逆 | 刪除尚未送審且無生產任務的空草稿工單 | [[工單狀態]]、[[印務主管]] | 有：deleteDraftWorkOrder；orders 的 logDraftWorkOrderDeleted | 3.9、3.10 |

### F 製程規劃、審核與交付產線

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| F 製程 | 主 | 工單製程規劃（建生產任務挑計價選項 → 設前置 → 登色數 → 填預計生產與放損 → 帶成本 → 選設備與目的站點填預計完成日） | [[工單製程規劃]] | 有：work-orders/detail/page.js；store 的 addProductionTask、updateProductionTask、applyTaskOrder、updateProcessInfo | 4.1 至 4.19 |
| F 製程 | 主 | 工單製程審核（送審 → 主管檢視 → 核可） | [[工單製程審核]] | 有：work-orders/review-queue/page.js；store 的 submitProcess、approveProcess | 5.1、5.2、5.4、5.9 |
| F 製程 | 主 | 交付產線（印務把生產任務交付給生管） | [[工單製程審核]]、[[生產流程]] | 有：deliverTasks | 5.3、5.5 |
| F 製程 | 副 | 外發承作的印刷類工序照登色數、計畫設備留空、設備費為零 | [[工單製程規劃]] | 有：work-orders store 的外發任務分支（setOutsourceVendor、setOutsourceReceivedQty） | 4.7、4.14 |
| F 製程 | 副 | 拼版模數在系統外算、填進材料型任務的預計生產 | [[工單製程規劃]] | 有：備料張為手填欄位，系統不代算 | 12.4 |
| F 製程 | 副 | 良品已足下游所需時生管手動完成生產任務 | [[工單製程規劃]] | 有：production-floor 的 manuallyCompleteTask；work-orders 的 completeProductionTask | 7.16 |
| F 製程 | 副 | 配方展開建工單、做過的工單沉澱回部件配方 | [[配方展開規則]]、[[印件生產流程]] | 有：recipes/print-items、recipes/components 兩組頁面；work-orders 的 replacePrintItemWorkOrders | 4.20、4.21、5.10 |
| F 製程 | 副 | 紙本工單列印與送審前預覽（不含價格、限印務與生管） | [[工單]] | 有：work-orders/print/page.js | 5.6、5.7、5.8 |
| F 製程 | 逆 | 印務主管退回製程（填退回原因、工單轉重新確認製程） | [[工單製程審核]] | 有：rejectProcess | 13.1（列待辦） |
| F 製程 | 逆 | 印務收回已送審工單（填收回原因、回草稿） | [[工單製程審核]] | 有：withdrawProcess | 13.2、13.8（列待辦） |
| F 製程 | 逆 | 工單異動與生產任務調整（加開、移除、作廢、報廢、減量、生管確認後回原狀態） | [[工單異動與生產任務調整]] | 有：confirmAdjustments、voidTask、scrapTask、excludeTaskByAdjustment、removeProductionTask、startRemakeProduction | 13.20（列待辦） |

### G 生管接收與派工

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| G 派工 | 主 | 生管接收印務交付的自有工廠任務 | [[生管]]、[[生產任務]]、[[生產流程]] | 有：production-floor/receiving/page.js；store 的 receiveDeliveredTasks、confirmTaskReceipt | 6.2 |
| G 派工 | 主 | 建工作包合批派工給師傅（填預計完成日、備註、確樣需求） | [[工作包]]、[[生產流程]] | 有：production-floor/work-packages、dispatch 兩頁；store 的 createWorkPackage、updateMaster、updateWorkPackage | 6.1、6.3 至 6.9 |
| G 派工 | 副 | 派工不檢查前置到料、把關點在報工 | [[生產流程]]、[[工序相依性規則]] | 有：_lib 的 resolvePrecedence 只在報工時擋 | 6.10、7.1 |
| G 派工 | 副 | 印務與印務主管代行生管的生產管理操作 | [[生管]] | 有：production-floor 各動作以 operator 傳入、不綁角色 | 7.4、7.5 |

### H 報工與場內轉交

| 模組 | 類別 | 流程名 | wiki 卡 | Prototype 實作 | 測試情境 |
| --- | --- | --- | --- | --- | --- |
| H 報工 | 主 | 師傅報工（填投入、良品、不良品與現場照；首次報工推進生產任務、工單、印件、訂單） | [[報工規則]] | 有：production-floor 的 submitWorkReport；work-orders 的 applyReportDelta、advanceOnFirstReport；orders 的 advanceOnFirstProductionReport | 7.4、7.11、7.12、7.14、7.15 |
| H 報工 | 主 | 場內轉交（算可搬量 → 生管建轉交單 → 廠務搬運 → 抵達 → 收貨人點收 → 計入下游到料量） | [[場內轉交與更正]] | 有：production-floor/pending-moves、transfers 兩頁；store 的 createTransferTickets、startTransfer、deliverTransfer、receiveTransfer | 7.2、7.3、7.6、7.7、7.8、7.9 |
| H 報工 | 副 | 三個報工入口與代報管道記錄 | [[報工規則]] | 有：submitWorkReport 依來源記管道 | 7.4 |
| H 報工 | 副 | 報工權限守門與繞過介面時寫稽核日誌 | [[報工規則]] | 有：logReportGuardBypass；work-orders 的可見範圍過濾 | 7.5、11.14 |
| H 報工 | 副 | 轉交單在待搬運態可改明細與數量 | [[場內轉交與更正]] | 有：updateTransferTicket | 7.6 |
| H 報工 | 副 | 來源生產任務轉報廢或已作廢時擋下在途單點收 | [[場內轉交與更正]] | 有：production-floor store 的點收把關（報廢與已作廢來源擋下） | 未涵蓋 |
| H 報工 | 逆 | 報工作廢（量未流出者作廢並下修累計） | [[場內轉交與更正]] | 有：voidWorkReport | 13.9、13.22（列待辦） |
| H 報工 | 逆 | 轉交單作廢重開（含勾「貨已在現場」直接以已送達生成） | [[場內轉交與更正]] | 有：voidTransfer、reopenTransferTicket | 13.10（列待辦） |
| H 報工 | 逆 | 貨送錯站建回運單、點收後誤收站到料量減記 | [[場內轉交與更正]] | 有：createReturnTicket | 13.11（列待辦） |
| H 報工 | 逆 | 良品已被已點收轉交單帶走時擋下作廢、改走人工註記 | [[場內轉交與更正]] | 有：voidWorkReport 的擋下分支；appendManualNote | 7.10 |

---

## 三、落差一：wiki 有定義、Prototype 未實作或只做一半

共 11 條。

| 條 | 流程 | wiki 卡 | 缺什麼 |
| --- | --- | --- | --- |
| 1 | 諮詢轉入的需求單流失時自動建諮詢訂單結算諮詢費 | [[需求單流失]] | 未實作。全目錄找不到自動建諮詢訂單的動作 |
| 2 | 訂單複製建單 | [[訂單複製建單]] | 未實作。無複製動作、無複製來源關聯與雙向活動紀錄 |
| 3 | 收款項目一期拆兩期 | [[收款項目規劃]] | 未實作。無拆期動作，客戶臨時要求拆票只能手動取消再建 |
| 4 | 維護審稿人員能力等級 | [[維護審稿人員能力等級]] | 未實作。能力等級只存在於判定資料，審稿主管無維護介面、無調整留痕 |
| 5 | 需求單參考附件保存 | [[需求單參考附件保存]] | 只做一半。參考檔案欄唯讀顯示，無上傳與多版並存 |
| 6 | 回簽檔追加上傳 | [[訂單成立確認]] | 只做一半。確認回簽可重複執行，但未見多份回簽檔並存與首次回簽時間保護 |
| 7 | 訂單已取消後三類備註與其他附件鎖定 | [[訂單三類備註維護]]、[[訂單其他附件保存]] | 只做一半。附件未見取消後停用上傳；備註的鎖定條件與 wiki 不同（見落差二第 3 條） |
| 8 | 代理期間操作歸實際操作者 | [[單據分享與職務代理]] | 只做一半。層級與代理動作已開放，活動紀錄的操作者歸屬未逐項落實 |
| 9 | 取消原訂單後另開新訂單依重談金額重走 | [[訂單成立確認]] | 只做一半。取消已做，另開新訂單無帶入路徑 |
| 10 | 對帳與催收的逾期款項清單 | [[對帳與催收]] | 只做一半。三方對帳與三張跨訂單清單已做，逾期款項清單未做 |
| 11 | 出貨後指定期限付款的盯收動線 | [[收款項目規劃]]、[[對帳與催收]] | 只做一半。預計收款日欄位有，接近付款日的盯收清單與提示未做 |

---

## 四、落差二：Prototype 有實作、wiki 找不到定義或與 wiki 相牴觸

共 4 條。這一段是反向落差，判斷 Prototype 是否自行發明了規則。

| 條 | Prototype 行為 | 證據 | 與 wiki 的關係 |
| --- | --- | --- | --- |
| 1 | 需求單可從「流失」重新啟動回「待評估成本」 | quote-prototype/_lib/store.js 的 requoteQuote 判斷來源為 LOST 時走重新啟動；detail/page.js 有「重新啟動」按鈕 | 與 wiki 相牴觸。[[需求單狀態]] 寫明流失為終態、流失後鎖定不可再變更，轉換表無此路徑 |
| 2 | 需求單狀態顯示名為「待確認需求」與「待報價」 | quote-prototype/_lib/constants.js 的 QUOTE_STATUS_LABELS | 與 wiki 不一致。[[需求單狀態]] 的列舉為「需求確認中」與「已評估成本」 |
| 3 | 三類備註在訂單進入「訂單完成」時即鎖定 | orders/_lib/permissions.js 的 canEditOrderSection 以兩個終態為界 | 與 wiki 相牴觸。[[訂單三類備註維護]] 寫明訂單完成後仍可改，只有已取消才鎖 |
| 4 | 需求單可直接刪除 | quote-prototype/page.js 呼叫 deleteQuote 移除整筆需求單 | wiki 找不到定義。[[需求單狀態]] 轉換表無刪除路徑，流失是唯一的中止出口 |

---

## 五、範圍外未比對

品檢、出貨與送達、外發與派單、售後服務、諮詢受理與諮詢費結算五段不在本次範圍，未比對。對應的 wiki 卡為 [[品檢通過入庫]]、[[QC不通過補生產]]、[[出貨與送達]]、[[外發委外與回廠點收]]、[[售後受理與決議]]、[[諮詢受理與出口分流]]、[[諮詢費結算收尾]]。
