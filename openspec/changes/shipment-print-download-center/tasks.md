## 1. 規格

- [x] 1.1 delta specs 寫成：shipment（ADDED 1、MODIFIED 19、RENAMED 1、REMOVED 2）、download-center（ADDED 3）、order-management（ADDED 1、MODIFIED 3）、business-scenarios（MODIFIED 1）、prepress-review（MODIFIED 1）；`openspec validate shipment-print-download-center --strict` 通過
- [x] 1.2 design.md 檔尾追加「規格與驗收對應」：全部驗收條目逐條對到情境卡步驟與情境目錄節號
- [x] 1.3 `openspec/config.yaml` context 的模組清單補「下載中心」；完成條件：grep「下載中心」在該檔有一處

## 2. 情境目錄（Sens `erp-prototype-tests/docs/scenario-catalog.md`）

依據 wiki〈出貨與送達〉主流程第 4～8 步、副流程各分支，〈訂單取消〉第 5 步，〈品檢通過入庫〉第 2、4 步（wiki 落卡提交 8080388）。先補目錄節，再寫測試。

- [x] 2.1 第十二章章首補 2026-10-23 一段：出貨單新增可出貨、物流單於確認可出貨時產生、集合詞改依物流單狀態、第三方物流只依物流商回傳推進、批次列印經下載中心；設計依據寫 `openspec/changes/shipment-print-download-center/design.md`
- [x] 2.2 改寫第十二章既有節（內容見測試影響清單）：12.1、12.2、12.3、12.5、12.6、12.7、12.8、12.10、12.15、12.16、12.17、12.19、12.20、12.21、12.22、12.23、12.26、12.28、12.32、12.33、12.34、12.35、12.36、12.37、12.38、12.41、12.42、12.43、12.44、12.45；各節「依據」行補 wiki 卡名與本案 grill 序號
- [x] 2.3 刪除 12.14、12.25、12.31，照目錄末「刪除」表的寫法列原節號、原標題、刪除原因（H6、H7、H9、H10；G1）。節號不遞補：既有測試標題以節號引用，遞補會連動改寫全章測試
- [x] 2.4 新增第十二章節：12.46 確認可出貨、12.47 撤回確認可出貨、12.48 確認可出貨與撤回的併發、12.49 單筆下載物流單檔案、12.50 第三方物流只依物流商回傳推進、12.51 批次列印、12.52 下載檔案狀態、12.53 下載中心的檢視、下載與入口、12.54 分次驗收與分批出貨的跨模組接力
- [x] 2.5 改寫 4.12、4.13（訂單預計交貨日期與逾期改依全數離廠；部分延遲與整單逾期以全部交完日切開互斥）、14.16（列表同一列只標一種）
- [x] 2.6 改寫 11.26（尚未確認可出貨時業務先調低明細）；新增 11.32 出貨單已確認可出貨時先撤回再調低明細
- [x] 2.7 新增 15.16 印件完工日的寫入、15.17 印件準時完工率的判定；改寫 15.15 的活動表列數（活動清單卡增刪活動列後重算）
- [x] 2.8 改寫 14.37（出貨單對話框）、14.38（兩處子母表）；新增 14.44 子母表樣式五處一致、14.45 介面字樣檢查
- [x] 2.9 改寫 16.18 的集合詞用語：「未出貨動作」改為「未離廠」
- [x] 2.10 `docs/main-flow.md` 站表加第 34～39 站，終點改為訂單完成，「33 站」改為「39 站」；`README.md` smoke 說明同步
- [x] 2.11 目錄末「統計」表依本次增刪重算各章情境數與合計

## 3. 測試先行（Sens `erp-prototype-tests/`，先紅後綠）

每條 delta 驗收條目至少對應一項測試。期望值取自 delta spec 的 THEN，不由實作重算。驗收條目與節號的逐條對照見 design.md「規格與驗收對應」。本節全部寫完後跑一次，確認新增與改寫的測試為紅。

- [x] 3.1 確認可出貨 12.46：新增 `tests/unit/qc-shipping/confirm-shippable.test.mjs`（驗收條目：揀貨相符時確認可出貨並產生物流單、揀貨不符時擋下確認可出貨、確認可出貨後數量與箱數鎖住、揀貨不符時停在已裝箱、沒有物流單）；`tests/e2e/12-shipping/shipping.spec.mjs` 加 12.46 畫面（揀貨人員手機寬度操作確認可出貨）
- [x] 3.2 撤回確認可出貨 12.47：`confirm-shippable.test.mjs` 加（驗收條目：撤回確認可出貨刪除物流單並回到已裝箱、有物流單不在可出貨時不能撤回、撤回時已列印的下載檔案保留、確認可出貨與撤回各記一筆並帶物流單編號）；`shipping.spec.mjs` 加 12.47 畫面（撤回後物流單序號接續、不重用）
- [x] 3.3 併發 12.48：`confirm-shippable.test.mjs` 加（驗收條目：明細改動先寫入後，確認可出貨以當下判定重新檢核；撤回先成立時拋單被擋下；拋單處理中時撤回被擋下；物流商回傳在途先寫入後，裝箱回報修正以當下的可執行條件重新檢核）
- [x] 3.4 揀貨與裝箱回報 12.3、12.5、12.19、12.20、12.37：`tests/unit/qc-shipping/shipping-rules.test.mjs` 改寫（驗收條目：揀貨兩步推進並逐條、逐箱回報；逐箱新增、沒有一次新增多箱；揀貨不符照實回報、列表標示並擋下確認可出貨；業務改明細或揀貨人員修正揀貨數量後放行；改明細數量重跑檢核（扣回本單自身佔用）；已裝箱時裝箱回報修正留紀錄、不牽動物流單；確認可出貨後只開放所屬物流單還沒離廠的箱；開始揀貨與裝箱回報各記一筆歷程）；`shipping.spec.mjs` 改寫同節畫面；12.37 加新增箱時先顯示下一個箱序（G24）
- [x] 3.5 拆單 12.32：`tests/unit/qc-shipping/shipment-logistics.test.mjs` 改寫（驗收條目：支援子母單時全部箱合成一筆物流單、不支援子母單時一箱一筆物流單、已裝箱時增刪箱後才確認，物流單依當下箱數產生）；產生時點由完成裝箱回報改為確認可出貨
- [x] 3.6 出貨動作與拋單 12.6、12.21、12.33、12.36、12.43：`tests/unit/qc-shipping/shipment-draft.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：出貨動作依出貨方式分流，只有拋單方式的出貨單有批次拋單；第三方拋單後物流單號與子單號由物流商回傳；逐筆拋單時出貨單取最落後；拋單失敗時物流單不推進、不設重試；拋單逾時視為失敗；一筆成功一筆失敗仍屬未離廠；拋單成功記入物流單歷程並帶物流單號）；刪離廠時間與實際出貨日的斷言
- [x] 3.7 送達與交付 12.7、12.8、12.35：`tests/unit/qc-shipping/shipment-terminal.test.mjs`、`shipment-logistics.test.mjs`、`tests/unit/orders/shipment-advance.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：專車出貨確認與送達確認、自取標記可自取再交付確認、子母單一箱遺失以送達確認填未送達數量、自取客戶只載走一部分、專車少交一箱以送達確認填未送達數量、送達數量扣除未送達數量、最後一張送達才收尾、殘留草稿不卡收尾、異常出貨單視為未收尾、補做超量送達不卡住判定、售後補做量於印件終態後送達只記數不動狀態）；送達確認與交付確認改為不附照片
- [x] 3.8 第三方物流回傳 12.33、12.50：`shipment-logistics.test.mjs` 改寫 12.33 的重新同步斷言、加 12.50（驗收條目：物流商依序回傳在途與配達、超商到店對映運送中、已作廢物流單收到配達回傳只寫歷程、人工送達確認與物流商回傳同時到時先寫入者成立、第三方物流不開放人工標記例外、物流商回傳例外後依下一次回傳恢復、配達回傳未進來時由出貨人員備援確認、出貨單取未作廢物流單最落後、任一物流單例外即異常，優先於其他結果、已送達需至少一筆未作廢物流單且全部送達）；以純函式驗，畫面示意方式見 5.4
- [x] 3.9 作廢與回補 12.22、12.23、12.34：`shipment-terminal.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：作廢出貨單只限未離廠；作廢未離廠的出貨單時物流單一併作廢、整張回補；等待出貨仍屬未離廠、物流商回傳在途才全數離廠；第三方物流在等待出貨與運送中可直接作廢；專車已出貨要先轉例外才能作廢；可出貨的物流單只在撤回走不通時可單筆作廢；逐筆作廢物流單，最後一筆系統預填並使出貨單作廢；其餘物流單都已作廢時剩下這一筆的作廢；作廢物流單後依未送達數量重算，不另加回補項；守恆鏈不得被違反；重出開新單；異常不回補、作廢物流單才回補；標記例外使出貨單轉異常且不回補額度；收掉最後一張在途單時補跑收尾判定）
- [x] 3.10 訂單取消連鎖 12.10、12.38：`shipment-logistics.test.mjs` 改寫 12.38（驗收條目：訂單取消時草稿刪除、未離廠的單自動作廢；三個集合詞互斥並各自分流；未離廠且有物流單已拋單時系統照常作廢；部分離廠的出貨單擋下其餘出貨動作、未離廠的物流單由業務作廢；訂單取消連鎖不另設狀態；order-management 的草稿刪除、未離廠的出貨單自動作廢、全數離廠者不動；未離廠且有物流單在等待出貨的出貨單由系統作廢；部分離廠的出貨單擋下其餘出貨動作；US-ORD-002 訂單取消與五層連鎖的出貨單一層）；`shipping.spec.mjs` 改寫 12.10 畫面
- [x] 3.11 批次拋單 12.41、12.42：`tests/unit/qc-shipping/next-status-options.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：批次拋單全部成功、批次拋單部分失敗、支援子母單的出貨單批次拋單只送一筆、出貨單異常時只送可出貨的物流單、批次拋單依出貨單狀態與出貨方式渲染、訂單已取消時部分離廠出貨單的批次拋單逐筆失敗）；12.42 刪「揀貨不符時停用」的斷言（揀貨不符到不了可出貨），保留「異常且沒有可出貨物流單時停用」
- [x] 3.12 裝箱回報修正與拒收 12.45：`shipping-rules.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：改被拒收那一箱的箱規再拋單；全數離廠後沒有裝箱回報修正；確認可出貨後不能新增箱，被拒收的一箱以作廢物流單處理）；刪「部分離廠後新增箱產生新物流單」的斷言（推翻 10-22 G49）
- [x] 3.13 箱規 12.44、12.32：`shipping-rules.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：箱規選單列全部箱規加自訂箱規，不分出貨方式；選有尺寸的箱規時帶入並鎖住；選沒有記尺寸的箱規時長寬高照實空白、不開放填寫；選自訂箱規時名稱必填、長寬高選填；裝箱回報修正改箱規，長寬高照箱規帶入，改成自訂箱規保留原值）；選項名稱「自訂」改為「自訂箱規」，名稱預設帶「自訂箱規」（G23）
- [x] 3.14 列上動作鈕與權限 12.15、12.16、12.17、12.28：`next-status-options.test.mjs`、`tests/unit/qc-shipping/shipment-access.test.mjs`、`tests/e2e/12-shipping/access-scope.spec.mjs` 改寫（驗收條目：全公司協助角色建立出貨單草稿、非業務的編輯分享成員建立並作廢出貨單、全公司協助角色作廢出貨單、編輯權角色作廢物流單、現場角色沒有作廢物流單、改派後新接單業務可處置原業務建的出貨單、現場動作不隨訂單編輯權開放）；揀貨人員在已裝箱有確認可出貨、在可出貨有撤回確認可出貨；列上與物流單列沒有重新同步、補附送達憑證、下載全部物流單；第三方物流的物流單列沒有標記例外
- [x] 3.15 單筆下載 12.49：`shipment-logistics.test.mjs`、`shipping.spec.mjs` 加（驗收條目：單筆下載物流單檔案，還沒拋單也可下載）；起點用鏈九 SH-2026-0921-001
- [x] 3.16 批次列印 12.51：新增 `tests/unit/qc-shipping/download-files.test.mjs`、`tests/e2e/12-shipping/download-center.spec.mjs`（驗收條目：列印新竹物流三筆物流單產出物流單列印與托運總表、跨出貨單列印時托運總表只收已拋單者、按下列印之後才拋單的物流單不補進已建立的托運總表）；畫面驗勾母列等於勾底下全部未作廢物流單、子列可單選、按列印後下載中心多出等待中的資料列
- [x] 3.17 下載檔案狀態 12.52：`download-files.test.mjs` 加（驗收條目：全部產出時轉成功、產檔前一筆物流單被作廢時轉部分成功、撤回確認可出貨刪除物流單後產檔轉失敗、產檔出錯的物流單記錯誤訊息原文、缺物流商標籤的物流單照常產出、失敗不重試，重新列印另建新紀錄）；以純函式驗狀態判定，不產檔（見 5.8）；畫面只驗模擬資料列的五種狀態與異常內容
- [x] 3.18 下載中心 12.53：`download-center.spec.mjs`、`download-files.test.mjs`、`tests/unit/access/access-control.test.mjs` 加（驗收條目：出貨人員看得到別人建立的下載檔案、成功與部分成功的檔案可下載、等待中、處理中、失敗的檔案不可下載、下載檔案不刪除也不過期、活動清單沒有列出的角色進不了下載中心）；畫面另驗欄位、篩選（檔案類型、狀態、建立人）、新到舊排序、側邊選單「品檢與出貨」群組有下載中心
- [x] 3.19 草稿與建立 12.1、12.2：`shipment-draft.test.mjs`、`shipping.spec.mjs` 改寫（驗收條目：額度足夠建立出貨單成功、超額整張擋下並只顯示一句、必填未齊先擋下、不進額度檢核、建單當下額度被別張單吃掉、同訂單多印件合在同一張出貨單、跨訂單不得合併、訂單終態後仍可建立出貨單、短出結案後為作廢物流單回補的量建新單、短出結案後補做量驗過、額度回彈再建單、已棄用印件不出現在預計出貨印件可選清單、草稿內印件被單獨棄用時建立自動移除、新建畫面直接建立仍經草稿、建立即草稿、建立出貨單才進未處理、只填出貨單預計出貨日即可儲存草稿、出貨單預計出貨日與印件預計交期各自獨立、草稿不佔可出貨額度、草稿不使印件算已出貨、預計出貨印件預設帶入全部未棄用印件、可移除與加回、草稿不進揀貨人員與出貨人員的清單、草稿不推進印件與訂單）；刪實際出貨日欄的斷言；建立時對話框標題為「建立出貨單」（G18）
- [x] 3.20 品檢修正與出貨佔用 11.18、11.26、11.32：`tests/unit/qc-shipping/inspection-lower-bound.test.mjs`、`tests/e2e/11-qc/qc.spec.mjs` 改寫與新增（驗收條目：差的是帳上總數時業務先調低明細、品檢再修正；品檢修正不得使完工良品數低於出貨明細佔用；出貨單已確認可出貨時先撤回再調低明細；異常出貨單仍計入品檢修正的通過下限）
- [x] 3.21 印件完工日 15.16、15.17：新增 `tests/unit/delivery-chain/print-item-completion-date.test.mjs`（驗收條目：首次齊套當天寫入完工日並判準時、晚於印件內部完成日完工判未準時、印件內部完成日為空時寫入完工日但不計入指標、先出一批的印件在工單全部完成當天寫入完工日、補做重開工單後完工日不變、短出結案造成的全部完成不寫完工日、短出結案後售後補做再次全部完成仍不寫完工日、打樣印件不寫完工日）；`tests/e2e/04-order-print-item/order-print-item.spec.mjs` 加印件詳情的完工日欄（鏈一 PI-2026-0601 有值、未齊套印件顯示「－」）
- [x] 3.22 訂單衍生日期與逾期 4.12、4.13、14.16：`tests/unit/delivery-chain/order-derived-dates.test.mjs` 改寫（驗收條目：訂單預計交貨日期依全數離廠滾動；物流單在等待出貨時不算已出貨、逾期也不跳筆；全部印件出貨後停在最後一筆；全數離廠的出貨單作廢後滾動值退回、轉異常不退回；物流單在等待出貨時印件仍標逾期、訂單標部分延遲；全數離廠後解除逾期；系統日期跨過全部交完日時部分延遲換成整單逾期；印件預計交期改晚到全部交完日之後仍只看全部交完日；日期為空時不判定；逾期標示不通知）；加一條：全部 mock 訂單在同一系統日期下沒有任何一張同時標部分延遲與整單逾期；`tests/e2e/14-query-ui/order-list-delivery-date.spec.mjs` 改寫 14.16 畫面
- [x] 3.23 跨模組接力 12.54：`shipment-logistics.test.mjs` 加 12.54（驗收條目：分次驗收與分批出貨），逐步斷言 business-scenarios 數量帳表的每一列；品檢缺口補做沿用 11.28 既有測試，不改
- [x] 3.24 本案未改行為的既有節：確認下列驗收條目的既有測試維持通過、不改斷言；完成條件：對應測試檔在 3.29 為綠
  - 4.11：訂單內部完成時間取最晚一筆、已棄用印件不計入訂單層衍生日期、全部印件皆無日期時顯示破折號、訂單層衍生日期不驅動訂單狀態
  - 4.23：業務取消進行中的訂單
  - 11.20、5.11：重打後數量帳按週期歸零、週期界線取重打起點打樣工單的建立時點、手動加開的打樣工單不位移界線、舊週期紀錄不刪、重打不污染折損率、大貨印件不適用
  - 12.4：漏填揀貨數量、沒有箱或缺照片不推進
  - 12.9：草稿不走作廢弧、刪除草稿不填理由、不落已作廢
  - 12.11、12.12、12.39：寄件資訊依帳務公司帶出且唯讀、訂單事後改帳務公司不改寫已成立出貨單的寄件人、收件三欄預設帶訂單聯絡人、可改、儲存前改選訂單時收件三欄整組重帶、草稿存在後訂單換窗口聯絡人不回寫、勾選保密代寄改用客戶指定名義、保密代寄用於自取、專車或其他時只顯示
  - 12.13：首張出貨單成立觸發出貨中、第二張不重複觸發；先出一批時印件與訂單自製作中轉出貨中
  - 只對到第十六章待辦、沒有測試（依 README 規則 7 不寫）：已完成的工單不被取消連鎖改寫、外發生產任務依派單是否已發稿分流、取消時終止進行中的工單異動（16.18）；取消後退款流程（訂單收退款模型，非 EC 序列）（16.27）
- [x] 3.25 介面 14.37、14.38、14.44、14.45：`tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs` 改寫 14.37（單頭沒有實際出貨日、建立時標題「建立出貨單」、檢視時標題為編號加狀態、說明文字依 G21 三表）與 14.38（物流單子表沒有離廠時間欄與補附送達憑證、出貨管理每列有勾選框）；新增 `tests/e2e/14-query-ui/nested-tables.spec.mjs`（14.44：出貨管理、訂單出貨單頁籤、訂單列表、訂單發票區、需求單詳情五處子表各有表頭、無子列顯示「沒有資料」）；新增 `tests/e2e/14-query-ui/ui-wording.spec.mjs`（14.45：依 Sens `memory/shared/ui-wording.md` 第一節，檢查出貨管理、出貨單對話框、訂單出貨單頁籤、下載中心的對話框標題、送出鈕等於動作名稱、批次動作為「批次＋動作」；畫面上不得出現實際出貨日、離廠時間、送達憑證、重新同步、下載全部物流單、選項名稱「自訂」）
- [x] 3.26 刪除廢止節的測試：刪 `tests/unit/delivery-chain/shipment-on-time.test.mjs`（12.14）、`tests/unit/qc-shipping/shipment-proof-access.test.mjs`（12.31）、`shipment-terminal.test.mjs` 的 12.25 段、`shipping.spec.mjs` 的 12.25 兩條、`access-scope.spec.mjs` 的 12.31
- [x] 3.27 smoke 主流程第 34～39 站：`tests/e2e/00-main-flow/main-flow.spec.mjs` 加六站（34 品檢人員對甲、乙驗收通過；35 業務建專車配送出貨單；36 揀貨人員開始揀貨與裝箱回報、尚無物流單；37 揀貨人員確認可出貨、產生一筆可出貨物流單；38 出貨人員出貨確認；39 出貨人員送達確認不附照片、印件已送達、訂單完成）；每站驗單據狀態、球的交接、留痕
- [x] 3.28 共用動線與夾具：`tests/e2e/11-qc/_setup.mjs`、第十二章 e2e 的建單揀貨共用步驟在裝箱回報後加確認可出貨；`tests/unit/qc-shipping/_fixtures.mjs` 物流單初始狀態改可出貨、刪離廠時間與實際出貨日欄位
- [x] 3.29 跑 `npm run test:module -- tests/e2e/12-shipping`、`tests/e2e/14-query-ui`、`tests/e2e/11-qc` 與 `npm run test:unit`；確認 3.1～3.28 新增與改寫的條目為紅、其餘既有條目維持綠

## 4. Mock 資料

順序固定：先改 erp repo `(prototype)/MOCK-DATA-CHAIN.md`，再改各模組 `mock-data.js`，最後改 Sens 測試。

- [x] 4.1 改 `(prototype)/MOCK-DATA-CHAIN.md`：出貨單狀態加可出貨；物流單初始狀態改可出貨；刪離廠時間、實際出貨日、送達憑證；箱規固定選項改名「自訂箱規」；鏈一 SH-2026-0601 歷程照第三方新路徑（可出貨 → 等待出貨 → 運送中 → 已送達），送達改記物流商回傳；SH-2026-0602 補交付確認；ORD-2026-0601 活動「順豐送達確認」改記物流商回傳（mock-audit 中級與低級各一項）
- [x] 4.2 MOCK-DATA-CHAIN 新增鏈九，取 mock-audit 提案（`/Users/b-f-03-029/Library/Application Support/Claude/side-session-notes/local_4026755b-e001-4ef1-98d9-b335da6ab83c/mock-audit-20261023.md` § 三），出貨單狀態改新模型：SH-2026-0921 專車配送 1,200 份 4 箱，可出貨，一筆物流單 SH-2026-0921-001 在可出貨（12.49 起點）；SH-2026-0922 順豐 600 份 3 箱，已裝箱、尚無物流單（待確認可出貨）；SH-2026-0923 7-11 交貨便 300 份，未處理；剩餘可出貨額度 900
- [x] 4.3 MOCK-DATA-CHAIN 新增下載檔案模擬資料：五種狀態各至少一筆；建立人兩位出貨人員；部分成功與失敗附異常內容（「物流單編號：錯誤訊息原文」；「物流單已作廢／已刪除」的格式由純函式驗，模擬資料不造已作廢的物流單）；物流單編號取自鏈一與鏈九、建立時間在該物流單確認可出貨之後；最早一筆 2026-06-18 建立、狀態成功（12.53 不過期）
- [x] 4.4 MOCK-DATA-CHAIN 人員表補第二位出貨人員；已齊套的大貨印件補完工日（鏈一 PI-2026-0601 等），打樣印件與短出結案印件不填
- [x] 4.5 依 4.1～4.4 改 `qc-shipping/_lib/mock-data.js`、`orders/mock-data.js`、`print-items/_lib/mock-data.js`、`(prototype)/_lib/people-roster.js`；下載檔案模擬資料放 qc-shipping 模組內
- [x] 4.6 wiki 活動清單卡已增刪活動列（ACT-SHP-042～044、ACT-VDLV-016、ACT-OUT-017 新增；ACT-SHP-025、ACT-SHP-037、ACT-OUT-015 刪除），在 Sens 重跑 `scripts/gen-access-activities.mjs` 產生 `(prototype)/_lib/access-activities.js`；15.15 轉綠
- [x] 4.7 更新引用鏈編號、出貨單狀態、箱規名稱與歷程筆數的既有測試（14.37 的歷程筆數、12.26 的鏈一樣本）

## 5. Prototype 實作（erp repo，經 `prototype-from-prompt` skill）

限制：只動 `(prototype)/` 目錄；共用元件與 app 層檔案不碰（子母表只引用 `@shared/styles/table` 的 nestedTableCss）；erp repo 不加任何測試檔、不動 erp skill 與 `(prototype)/README.md`；介面字樣照 Sens `memory/shared/ui-wording.md`，新增說明文字須先經 Miles 同意。

- [x] 5.1 確認可出貨與撤回確認可出貨：揀貨人員在已裝箱與可出貨的入口（手機寬度可操作）；確認時依出貨方式產生物流單、寫入每箱所屬物流單；撤回時刪除物流單、序號接續不重用；確認後鎖出貨明細數量、揀貨數量、增刪箱；先後判定照 § 併發寫入的重新檢核；對應 3.1～3.3 轉綠
- [x] 5.2 揀貨與裝箱回報：完成裝箱回報不產生物流單；揀貨不符只擋確認可出貨；裝箱回報修正依項目開放（確認可出貨後只開放所屬物流單在可出貨或等待出貨的箱）；部分離廠後不能新增箱；「自訂」改名「自訂箱規」、名稱必填預設帶「自訂箱規」；新增箱先顯示下一個箱序；對應 3.4、3.5、3.12、3.13 轉綠
- [x] 5.3 集合詞與作廢：集合詞改依物流單狀態（「未出貨動作」改名「未離廠」）；刪離廠時間與實際出貨日欄位（列表、對話框單頭、物流單子表）；作廢出貨單開放於未離廠（含可出貨、等待出貨），不向物流商取消；訂單取消連鎖照新分流；對應 3.9、3.10 轉綠
- [x] 5.4 物流單狀態路徑：第三方物流不經已出貨；刪重新同步與補附送達憑證；第三方物流不開放標記例外，在等待出貨、運送中、例外可直接作廢；可出貨的物流單只在撤回不可用時可作廢；送達確認與交付確認不附照片，第三方送達確認開放於等待出貨、運送中、例外。物流商回傳在 Prototype 的呈現方式：預設以純函式推進、畫面只看靜態樣本；要加畫面操作的示意入口，先經 Miles 同意；對應 3.6～3.8 轉綠
- [x] 5.5 批次拋單只在可出貨渲染、送出本單可出貨的物流單；異常且沒有可出貨物流單時停用並顯示理由；對應 3.11 轉綠
- [x] 5.6 列上動作鈕：依角色、出貨單狀態與出貨方式過濾，加確認可出貨與撤回、刪重新同步、補附送達憑證與下載全部物流單；對應 3.14 轉綠
- [x] 5.7 單筆下載物流單檔案：任何未作廢物流單可下載（含出貨明細頁，沒拋單者缺物流商標籤），已作廢者不提供；對應 3.15 轉綠
- [x] 5.8 批次列印與下載中心（只用模擬資料，不實作產檔與下載）：出貨管理子母表加勾選框（勾母列＝勾底下全部未作廢物流單、子列可單選）與「列印」鈕；按列印依當下涵蓋範圍在下載中心直接新增資料列（等待中，托運總表只收已拋單者）；新頁下載中心放側邊選單「品檢與出貨」群組（`(prototype)/_lib/menu-model.js`）；欄位、篩選、新到舊排序；下載鈕只在成功與部分成功渲染、點擊不產檔；畫面不另加「不產檔」說明；狀態判定寫成純函式供 3.17 驗；對應 3.16～3.18 轉綠
- [x] 5.9 印件完工日與訂單逾期：印件完工日於首次齊套寫入（短出結案、打樣除外），印件詳情顯示完工日欄；訂單預計交貨日期與印件逾期改依全數離廠；部分延遲與整單逾期以全部交完日切開互斥；對應 3.21、3.22 轉綠
- [x] 5.10 出貨單對話框：建立時標題「建立出貨單」、檢視時「出貨單編號＋狀態」；送出鈕文字等於動作名稱；現有說明文字依 G21 三表（刪除、保留縮短、新增）處理，三表由主對話隨派工任務書帶入；對應 3.19、3.25（14.37）轉綠
- [x] 5.11 子母表：出貨管理、訂單出貨單頁籤、訂單列表、訂單發票區、需求單詳情五處改用 nestedTableCss；對應 3.25（14.38、14.44）轉綠
- [x] 5.12 smoke 第 34～39 站走得通；對應 3.27 轉綠
- [x] 5.13 每項完成後依序跑 `npm run impact`、`npm run test:smoke`、受影響章 `npm run test:module -- <目錄>`（例：`tests/e2e/12-shipping`、`tests/e2e/14-query-ui`、`tests/e2e/11-qc`、`tests/e2e/04-order-print-item`）；smoke 加影響章通過即可提交，提交訊息附兩個結果。全套 `npm test` 只在 Miles 指示時跑，合併或開 PR 前也不主動跑；`npm run impact` 對 `_lib` 改動提示「影響全站」時，照 2026-10-23 拍板仍不主動跑全套，提交訊息註明

## 6. archive 前驗證

- [x] 6.1 smoke 與第四、十一、十二、十四、十五章對應測試通過；全套 `npm test` 只在 Miles 指示時跑；有 fixme 的條目在 `docs/findings-*.md` 有對應紀錄
- [x] 6.2 逐條比對 design.md「規格與驗收對應」：每條驗收條目對到存在的情境目錄節，該節列出的測試檔有對應斷言
- [x] 6.3 掃 proposal.md、design.md、specs 的 inline OQ 措辭與 `[!question]`；延後的 ORD-059、PT-070 只留在 Vault OQ 卡，不寫進 proposal、design、specs
- [x] 6.4 檢查 delta 每個 Requirement 描述段沒有重述業務規則句；每條驗收條目的情境標註指到存在的情境卡與步驟
- [x] 6.5 情境目錄各改寫與新增節的「依據」行寫 wiki 卡名；發現清單關掉本案修好的項目

## 7. archive 後手改

- [ ] 7.1 `openspec/specs/production-overview/spec.md`「五指標」Requirement 末句：「印件準時交貨率……見 shipment spec § 實際出貨日與出貨準時判定」改為印件準時完工率，引用 wiki [北極星指標](../../../memory/Sens_wiki/wiki/erp/01-products/北極星指標.md) 與 order-management spec § 印件完工日寫入與準時完工判定
- [ ] 7.2 `openspec/specs/shipment/spec.md` Purpose 段：補確認可出貨與撤回確認可出貨、列印物流單經下載中心；範圍「主要」補同兩項；確認 RENAMED 後的「物流單例外」標題生效
- [ ] 7.3 grep `openspec/specs/` 全目錄的「實際出貨日」「離廠時間」「送達憑證」「重新同步」「下載全部物流單」「未出貨動作」「印件準時交貨率」；完成條件：每一處已改寫，或屬 REMOVED 說明段

## 測試影響清單

依 Sens `erp-prototype-tests/docs/scenario-catalog.md` 節號列。Mock 異動順序：先改 MOCK-DATA-CHAIN，再改各模組 `mock-data.js`，最後改引用鏈編號、狀態與箱規名稱的測試。

| 情境目錄節號 | 動作 | 測試檔 | 說明 |
|---|---|---|---|
| 4.12 | 改寫 | `tests/unit/delivery-chain/order-derived-dates.test.mjs` | 滾動改依全數離廠；等待出貨不算已出貨；例外不退回、作廢退回 |
| 4.13 | 改寫 | `order-derived-dates.test.mjs` | 部分延遲與整單逾期以全部交完日切開互斥；印件預計交期改晚仍只看全部交完日；全部 mock 訂單不同時標兩種 |
| 11.18 | 改寫 | `tests/unit/qc-shipping/inspection-lower-bound.test.mjs` | 異常出貨單仍計入通過下限，物流單狀態改新模型 |
| 11.26 | 改寫 | `inspection-lower-bound.test.mjs`、`tests/e2e/11-qc/qc.spec.mjs` | 尚未確認可出貨時業務先調低明細、品檢再修正 |
| 11.32 | 新增 | `inspection-lower-bound.test.mjs`、`qc.spec.mjs` | 出貨單已確認可出貨時先撤回再調低明細 |
| 12.1 | 改寫 | `tests/e2e/12-shipping/shipping.spec.mjs` | 列表與對話框刪實際出貨日欄 |
| 12.2 | 改寫 | `tests/unit/qc-shipping/shipment-draft.test.mjs`、`shipping.spec.mjs` | 草稿不使印件算已出貨（不提實際出貨日）；建立時標題「建立出貨單」 |
| 12.3 | 改寫 | `tests/unit/qc-shipping/shipping-rules.test.mjs`、`shipping.spec.mjs` | 完成裝箱回報不產生物流單，每箱所屬物流單為空 |
| 12.5、12.19 | 改寫 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 揀貨不符只擋確認可出貨；放行後揀貨人員可確認可出貨 |
| 12.6 | 改寫 | `shipment-draft.test.mjs`、`shipping.spec.mjs` | 出貨動作在物流單為可出貨時出現；沒有重新同步 |
| 12.7 | 改寫 | `shipment-draft.test.mjs`、`shipping.spec.mjs` | 送達確認與交付確認不附照片；第三方以物流商回傳為主、送達確認備援 |
| 12.8 | 改寫 | `tests/unit/orders/shipment-advance.test.mjs`、`shipping.spec.mjs` | 送達由物流商回傳推進，不經重新同步 |
| 12.10 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 「尚未出貨動作」改「未離廠」，含可出貨與等待出貨 |
| 12.14 | 刪除 | `tests/unit/delivery-chain/shipment-on-time.test.mjs` 整檔刪 | 實際出貨日與出貨準時判定已 REMOVED；準時改看 15.17 |
| 12.15、12.16、12.17、12.28 | 改寫 | `tests/unit/qc-shipping/next-status-options.test.mjs`、`tests/unit/qc-shipping/shipment-access.test.mjs`、`tests/e2e/12-shipping/access-scope.spec.mjs`、`shipping.spec.mjs` | 揀貨人員加確認可出貨與撤回；刪下載全部物流單、重新同步、補附送達憑證；第三方沒有標記例外；批次拋單在可出貨 |
| 12.20 | 改寫 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 已裝箱時修正不牽動物流單；確認後只開放所屬物流單未離廠的箱 |
| 12.21 | 改寫 | `shipping-rules.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` | 拋單自可出貨；不寫實際出貨日；刪下載全部物流單 |
| 12.22 | 改寫 | `tests/unit/qc-shipping/shipment-terminal.test.mjs`、`shipping.spec.mjs` | 標記例外只限專車、其他、自取 |
| 12.23 | 改寫 | `shipment-terminal.test.mjs`、`shipping.spec.mjs` | 作廢出貨單開放於未離廠（含可出貨、等待出貨），不向物流商取消 |
| 12.25 | 刪除 | `shipment-terminal.test.mjs` 12.25 段、`shipping.spec.mjs` 12.25 兩條 | 補附送達憑證已 REMOVED |
| 12.26 | 改寫 | `shipping.spec.mjs` | 鏈一樣本刪下載全部物流單與補附送達憑證；歷程照新路徑 |
| 12.31 | 刪除 | `tests/unit/qc-shipping/shipment-proof-access.test.mjs` 整檔刪、`access-scope.spec.mjs` 12.31 | 補附送達憑證已 REMOVED |
| 12.32 | 改寫 | `shipment-logistics.test.mjs`、`shipping-rules.test.mjs`、`shipping.spec.mjs` | 拆單時點改確認可出貨；已裝箱增刪箱後才確認；選項「自訂箱規」 |
| 12.33 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 刪重新同步；最落後順序起點改可出貨；例外依物流商下一次回傳恢復 |
| 12.34 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 第三方在等待出貨、運送中可直接作廢；專車已出貨先轉例外；可出貨只在撤回不可用時可作廢 |
| 12.35 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 交付確認不附照片 |
| 12.36 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 物流單留在可出貨；屬未離廠時有撤回與作廢出貨單；成功後沒有撤回 |
| 12.37 | 改寫 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 新增箱先顯示下一個箱序；裝箱回報後沒有物流單 |
| 12.38 | 改寫 | `shipment-logistics.test.mjs` | 集合詞依物流單狀態；改名未離廠；等待出貨屬未離廠、系統照常作廢 |
| 12.39 | 改寫 | `shipping.spec.mjs` | 起點動線在裝箱回報後加確認可出貨（共用步驟） |
| 12.41 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 送出可出貨的物流單；刪寫入實際出貨日 |
| 12.42 | 改寫 | `next-status-options.test.mjs`、`shipping.spec.mjs` | 只在可出貨渲染；刪揀貨不符停用；保留異常無可出貨時停用 |
| 12.43 | 改寫 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 逾時後物流單維持可出貨 |
| 12.44 | 改寫 | `shipping-rules.test.mjs`、`shipping.spec.mjs` | 「自訂」改「自訂箱規」，名稱必填、預設帶「自訂箱規」 |
| 12.45 | 改寫 | `shipping-rules.test.mjs`、`shipment-logistics.test.mjs`、`shipping.spec.mjs` | 部分離廠後不能新增箱；改被拒收那一箱再拋單；救不回時作廢該筆物流單 |
| 12.46 | 新增 | `tests/unit/qc-shipping/confirm-shippable.test.mjs`、`shipping.spec.mjs` | 確認可出貨：相符產生物流單、不符擋下、確認後鎖數量與箱數 |
| 12.47 | 新增 | `confirm-shippable.test.mjs`、`shipping.spec.mjs` | 撤回：刪物流單回已裝箱、序號不重用、額度不變、歷程記編號、已列印檔保留 |
| 12.48 | 新增 | `confirm-shippable.test.mjs` | 併發：明細先寫入、撤回先成立、拋單處理中、物流商回傳在途先寫入 |
| 12.49 | 新增 | `shipment-logistics.test.mjs`、`shipping.spec.mjs` | 單筆下載物流單檔案：未拋單可下載、已作廢不可、不進下載中心 |
| 12.50 | 新增 | `shipment-logistics.test.mjs` | 第三方物流只依物流商回傳推進：不經已出貨、到店、已作廢後配達、同時到、例外恢復、送達確認備援 |
| 12.51 | 新增 | `tests/unit/qc-shipping/download-files.test.mjs`、`tests/e2e/12-shipping/download-center.spec.mjs` | 批次列印：產哪幾份、托運總表只收已拋單、列印後拋單不補進 |
| 12.52 | 新增 | `download-files.test.mjs`、`download-center.spec.mjs` | 下載檔案狀態：成功、部分成功、失敗與異常內容；不重試 |
| 12.53 | 新增 | `download-center.spec.mjs`、`download-files.test.mjs`、`tests/unit/access/access-control.test.mjs` | 下載中心：全部資料列可見、可下載狀態、不刪不過期、業務進不了 |
| 12.54 | 新增 | `shipment-logistics.test.mjs` | 分次驗收與分批出貨的數量帳接力 |
| 14.16 | 改寫 | `tests/e2e/14-query-ui/order-list-delivery-date.spec.mjs` | 母表同一列只標部分延遲或整單逾期其中一種 |
| 14.37 | 改寫 | `tests/e2e/14-query-ui/shipment-dialog-and-thumbnail.spec.mjs` | 單頭刪實際出貨日；建立時標題「建立出貨單」；說明文字依 G21；歷程筆數照新樣本 |
| 14.38 | 改寫 | `shipment-dialog-and-thumbnail.spec.mjs` | 物流單子表刪離廠時間欄與補附送達憑證；出貨管理每列有勾選框 |
| 14.44 | 新增 | `tests/e2e/14-query-ui/nested-tables.spec.mjs` | 五處子母表同一套樣式 |
| 14.45 | 新增 | `tests/e2e/14-query-ui/ui-wording.spec.mjs` | 介面字樣檢查：對話框標題、送出鈕、批次動作、已刪除字樣不出現 |
| 15.15 | 改寫 | `tests/unit/access/access-activities.test.mjs`、`access-control.test.mjs`、`menu-and-roster.test.mjs` | 重跑活動表後列數改變；名冊多一位出貨人員 |
| 15.16 | 新增 | `tests/unit/delivery-chain/print-item-completion-date.test.mjs` | 完工日寫入：首次齊套、先出一批、補做不改、短出不寫、打樣不寫 |
| 15.17 | 新增 | `print-item-completion-date.test.mjs`、`tests/e2e/04-order-print-item/order-print-item.spec.mjs` | 準時完工率：準時、未準時、內部完成日空不計入；印件詳情完工日欄 |
| 16.18 | 改寫 | 無（第十六章待辦，不寫測試） | 「未出貨動作」改「未離廠」 |
| smoke 第 34～39 站 | 新增 | `tests/e2e/00-main-flow/main-flow.spec.mjs`、`docs/main-flow.md` | 品檢 → 建出貨單（專車配送）→ 裝箱 → 確認可出貨 → 出貨確認 → 送達確認 → 訂單完成 |
| 共用動線 | 改寫 | `tests/e2e/11-qc/_setup.mjs`、`tests/unit/qc-shipping/_fixtures.mjs`、第十二章 e2e 共用步驟 | 裝箱回報後加確認可出貨；物流單初始可出貨；刪離廠時間與實際出貨日 |

Mock 動到的位置：

| 檔案 | 內容 |
|---|---|
| `(prototype)/MOCK-DATA-CHAIN.md` | 狀態模型、鏈一出貨歷程、鏈九、下載檔案模擬資料、第二位出貨人員、印件完工日 |
| `qc-shipping/_lib/mock-data.js` | 鏈一出貨單與物流單、鏈九出貨單、下載檔案模擬資料 |
| `orders/mock-data.js` | ORD-2026-0601 送達活動、鏈九訂單與活動 |
| `print-items/_lib/mock-data.js` | 印件完工日、鏈九印件 |
| `(prototype)/_lib/people-roster.js` | 第二位出貨人員 |
| `(prototype)/_lib/access-activities.js` | 由 Sens `scripts/gen-access-activities.mjs` 重產 |
