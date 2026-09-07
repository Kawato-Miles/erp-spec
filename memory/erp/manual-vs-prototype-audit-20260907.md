# 操作手冊 vs Prototype 比對報告（2026-09-07）

比對基準：手冊 `production-stage-seg1-manual-artifact.html`（41 頁，2026-09-05 撰寫）對 erp repo prototype 程式碼（commit 4dd04a8，2026-09-07）。六個 Sonnet sub-agent 各比一單元，只讀不改。

## 總覽

| 單元 | 差異筆數 | 一致項目數 | 主因 |
|---|---|---|---|
| 需求單管理 | 12 | 約 60 | 手冊誤讀居多、mock 種子資料改版 |
| 訂單管理 | 12 | 38 | 手冊缺漏程式碼既有操作 |
| 款項與發票 | 5 | 約 61 | 一個入口失效（prototype 缺陷） |
| 審稿管理 | 8 | 35 | 09-07 拍板未同步、清單名稱不一致 |
| 工單管理 | 15 | 34 以上 | 09-04 到 09-07 備料規格層改版未同步 |
| 生產管理 | 10 | 34 | 09-07 轉交單改版未同步 |

差異依原因分四類：

| 原因 | 說明 | 處置方向 |
|---|---|---|
| A. prototype 後來改版 | 手冊 09-05 寫完後 prototype 又改，手冊過期 | 改手冊 |
| B. 手冊撰寫時誤讀或簡化 | sub-agent 寫手冊時沒抄到或抄錯 | 改手冊 |
| C. prototype 缺陷 | 程式碼本身有錯或不一致 | 修 prototype，手冊照設計寫 |
| D. 需 Miles 裁決 | 設計未定或兩邊都可能對 | 先裁決再改 |

## 一、需求單管理

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| q-create | 「評估印務主管」單數描述 | `quote-prototype/page.js:433-445` 欄位為複選（`estimated_by_manager_ids` 陣列） | 文字不同 | A |
| q-create | Slack 連結列為建立時選填欄位 | `page.js:425-429` 只在編輯抽屜出現，新增表單無此欄 | 入口不存在 | B |
| q-create | 「客戶改選後，系統清空聯絡人，需重選」 | `page.js:385-393` 換客戶時自動帶入新客戶主要窗口 | 步驟不同 | B |
| q-overview | 單頭欄位群未列「印件類型」 | `page.js:470-479` 有「印件類型」多選欄 | 手冊缺漏 | B |
| q-items | 數量單位、難易度、成本總額、報價總額標必填 | `detail/page.js:1081-1106` 只有項目名稱、印件類型、數量必填 | 文字不同 | B |
| q-items | 印件類型「打樣印件、大貨印件」 | `constants.js:217-220` 為「打樣」「大貨」 | 文字不同 | B |
| q-quote | 「議價中時右上恰好三顆按鈕」 | `detail/page.js:723-744` 另有「編輯」與「複製需求單」，共五顆 | 文字不同 | B |
| q-quote | 「成交後印件不可再新增或修改」 | `detail/page.js:539-563,356-361` 新增、編輯、刪除印件未依狀態鎖定 | prototype 缺功能 | C／D |
| q-quote | 「成交後進度條全亮」 | `detail/page.js:116-123` 成交只亮最後一格，其餘 wait | 狀態不同 | C／D |
| q-estimate | 「只有指定的評估印務主管能按」 | quote-prototype 全模組無角色判斷 | prototype 缺功能 | D |
| q-estimate | 評估印務主管「吳國豪」 | `mock-data.js:12-21` 無此人，同單號評估者為林雅婷 | 文字不同 | B |
| q-create 至 q-order | 故事線用 Q-20260903-01 從待確認需求起步，估成本 12,000 | `mock-data.js:601,637` 該單已成交並掛訂單，cost_estimate 10,400 | 狀態不同 | A |

## 二、訂單管理

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| o-approve | 確認框按「OK」 | `detail/page.js:149-152` 未設 okText，antd 中文預設「確定」 | 文字不同 | B |
| o-quote-signback | 活動紀錄「確認回簽」 | `store.js:427-431` 為「確認客戶回簽」 | 文字不同 | B |
| o-overview | 流程圖只畫兩條取消訂單邊 | `permissions.js:73` 任一非終態皆可取消 | 狀態不同 | B（簡化） |
| o-discussion | 「沒有通知對象」 | `ItemsTab.js:1270` 對話框內文同；`ItemsTab.js:622` toast 為「沒有 mention 對象」 | 文字不同 | C |
| o-add-item | 步驤未提「印件難易度」 | `PrintItemEditDrawer.js:184-192` 必填，未填擋送出 | 手冊缺漏 | B |
| o-upload-artwork | 未提免審路徑檔位標籤變化 | `ArtworkUploadSlots.js:34` 免審時「稿件檔案」改「原始印件檔」 | 手冊缺漏 | B |
| o-upload-artwork | 「完稿縮圖（必填）」 | `ArtworkUploadSlots.js:64-66` 標籤未標必填，靠送出警示 | 文字不同 | B |
| o-add-item／o-approve | 未提「切換窗口聯絡人」「變更出貨方式」「編輯訂單備註」 | `InfoTab.js:250-311` 三顆按鈕存在 | 手冊缺漏 | B |
| o-add-item | 未提「新增項目」（其他費用） | `ItemsTab.js:1131-1135,1432-1464` | 手冊缺漏 | B |
| o-upload-artwork | 「ERP 側不提供代傳入口」 | `ItemsTab.js:936-955` 業務仍看得到「會員中心上傳（模擬回寫）」prototype 專用鈕 | 手冊缺漏 | B（手冊對正式系統沒錯） |
| o-approve | 未註明「改派」可見角色 | `permissions.js:204` 限 sales_manager／supervisor | 手冊缺漏 | B |
| o-approve 入口 | 「訂單審核待辦清單依送審時間排序」 | `approval-queue/page.js:33` 可切五種狀態，不只待審 | 手冊缺漏 | B |

已核對一致：改派只改業務負責人、核准無退回、確認可製作與待確認製作細節限線下單（記憶中三筆已知落差在手冊現版已正確）。

## 三、款項與發票

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| m-check-amount／m-issue-invoice／m-record-payment／m-worklists | 點訂單編號直接跳「金額與發票」頁籤 | `payment/receivable/page.js:32`、`pending-invoice/page.js:39` 帶 `tab=billing`，但 `orders/detail/page.js:38-48` 合法 key 為 `paymentPlan`，實際落到「資訊」頁籤 | 入口不存在 | C |
| m-void-allowance | 發票列只列開立折讓單、作廢發票 | `InvoiceSection.js:238-251` 另有「檢視」「下載」 | 手冊缺漏 | B |
| 全單元 | 未提發票檢視側板 | `InvoiceViewDrawer.js:1-162` 三段式側板 | 手冊缺漏 | B |
| m-plan-installment | 未列「取消收款項目」對話框欄位 | `CancelInstallmentModal.js:42-49` 取消原因必填 60 字 | 手冊缺漏 | B |
| m-worklists | 匯出提示文字 | `receivable/page.js:36-39` 多「本 prototype 不產生實際檔案」 | 文字不同 | B（可維持） |

## 四、審稿管理

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| r-overview 等四處 | 「待審清單」「待分派清單」 | `layout.js:64,72` 為「待審訂單」「待分派審稿」 | 文字不同 | D |
| r-assign | 能力低於最高難易度出黃色提示 | `AssignReviewerDialog.js:44-46` 註解「Miles 2026-09-07 拍板」取消 | prototype 缺功能 | A |
| r-assign | 「待分派狀態的線上單印件不會出現在可勾選清單」 | `selectors.js:131-138` 線上單離開待分派後可手動改派 | 手冊缺漏 | B |
| r-overview | 流程圖無「合格→待分派」 | `prepressReview.js:55` 取消免審且未分派時退回待分派 | 手冊缺漏 | B |
| r-judge | 「合格後自動推進印製狀態」未限線上單 | `online-order-actions.js:9-16` 僅線上單；線下單走確認可製作 | 文字不同 | B |
| r-return | 「這兩個動作限業務與諮詢」 | `permissions.js:153,161` 確認可製作限業務；退回重審業務＋諮詢 | 文字不同 | B |
| r-overview | 角色表業務列未提諮詢可退回重審 | 同上 | 手冊缺漏 | B |
| r-resupply | 提示引號用『』 | `permissions.js:123-124` 用「」 | 文字不同 | B |

## 五、工單管理

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| w-overview | 工單六節點，未列「異動」「已取消」 | `mock-data.js:8-18` 九值 | 狀態不同 | B（簡化） |
| w-assign | 審核主管未選無法送出 | 對話框開啟即預帶當前登入印務主管 | 手冊缺漏 | B |
| w-assign | 未提加開列可移除、空清單提示 | 對話框有「移除此列」與空清單提示 | 手冊缺漏 | B |
| w-assign | 分派對話框與詳情頁改派「同一套邏輯」 | `detail/page.js:919-923` 獨立 Modal，只共用規則 | 文字不同 | B |
| w-assign | 入口收「非終態工單未指派」 | `usePrintItemsFilter.js:18` 只排除已取消 | 狀態不同 | B |
| w-add-delete | 確認框文字 | 印件總覽版與印件詳情頁版文字不一致 | 文字不同 | C |
| w-add-delete | 打樣重打起點刪除「數量帳退回上一輪」 | `permissions.js:335-341` 直接停用刪除並提示走工單取消 | 手冊缺漏 | B |
| w-task | 新增後提示「已新增生產任務…」 | `ProcessTab.js` 無任何 message | prototype 缺功能 | B／C |
| w-task | 前置相依「預設帶上一道」 | `TaskFormDialog.js:124-125` 一律空白，但 hint 仍寫預設帶 | 欄位不同 | C（程式碼自相矛盾） |
| w-task | 未提「需轉交」「目的站點」 | `TaskFormDialog.js:435-459` 兩欄存在，未填擋送出 | 手冊缺漏 | A |
| w-task | BOM「材料、工序、裝訂三類主檔擇一列」 | `bom-picker-rows.js`、`BomPickerDialog.js:33-51` 材料 Tab 攤到備料規格層四欄 | 欄位不同 | A |
| w-task | 表頂端出現「廠商、計價、放損率、單價」 | `TaskFormDialog.js:662-700` 拆「備料」「供應商原料」，用「牌價」 | 文字不同 | A |
| w-task | 缺漏欄位頁籤帶「缺 N」 | `TaskFormDialog.js:288-291` BOM、任務名稱、計畫設備、面積四項在頂端固定區，不帶缺 N | 文字不同 | B |
| w-task | 未提上機張數口徑提示 | `TaskFormDialog.js:585-589` | 手冊缺漏 | A |
| w-task | 未提「調整順序」 | `ProcessTab.js:396-399` 排序側板 | 手冊缺漏 | B |

w-submit、w-review、w-deliver 三頁逐字全符。

## 六、生產管理

| 手冊頁 | 手冊寫法 | Prototype 實況 | 類型 | 原因 |
|---|---|---|---|---|
| f-overview／f-transfer 四處 | 「起搬」「卸貨送達」 | `transfers/page.js:385-403,843-844` 為「開始搬運」「抵達站點」 | 文字不同 | A |
| f-transfer | 目的地預設帶下游站、可逐列改 | `pending-moves/page.js:96-104,944-951` 目的地唯讀，沿用生產任務目的站點 | 欄位不同 | A |
| f-transfer | 在主表列上填數量 | `pending-moves/page.js:379-437` 數量在建單 Dialog 內填 | 步驟不同 | A |
| f-transfer | 點「確認」 | `pending-moves/page.js:384` 鈕文字「建立 N 張單」 | 文字不同 | A |
| f-transfer | 欄位表有「運送方式」「貨運行名稱」 | 全 repo 查無此欄位 | 欄位不同 | D |
| f-receive | 接收後圖示換綠色勾勾 | `dispatch/page.js:271-301` 按鈕消失，改獨立「接收狀態」欄 | 文字不同 | A |
| f-overview | 生產任務三態 | `mock-data.js:18-24` 五態（多已作廢、報廢） | 狀態不同 | B（簡化，f-complete 有補述） |

f-package、f-report、f-complete 三頁一致。

## 需 Miles 裁決清單

| 編號 | 議題 | 選項 |
|---|---|---|
| 1 | 需求單教學單號 Q-20260903-01 在 mock 已成交 | 換未成交單號／加教學種子資料／手冊改寫成回顧式 |
| 2 | 需求單「只有指定印務主管能按評估完成」、「成交後印件鎖定」、「進度條全亮」三項 prototype 無 | 補 prototype／手冊註明尚未落地／刪句 |
| 3 | 審稿「待審清單」「待分派清單」用詞 | 改成 UI 標籤／維持業務簡化詞 |
| 4 | 生產轉交「運送方式」「貨運行名稱」欄位來源不明 | 查 wiki 轉交單卡與 spec 後定去留 |
| 5 | 工單前置相依「預設帶上一道」程式碼自相矛盾 | 定案帶或不帶，再修 hint |
| 6 | 訂單四個未收錄操作（新增項目、切換窗口、變更出貨方式、編輯備註） | 補頁／併入欄位一覽／不收 |
| 7 | 概覽流程圖簡化（訂單取消邊、工單九態、生產任務五態） | 補齊／維持簡化加圖說 |
