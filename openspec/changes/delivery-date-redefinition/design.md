# 設計說明

## Context

公司 2026-09-18 交來的《ERP 日期欄位架構定義與算法 v3》把交期鏈的方向定死了：業務壓的是內部該做完的那一天，對客戶的交期由它往後推，不是反過來。系統現行條文是反方向的——業務填預計出貨日、系統減一天推內部完成日，而且加減以曆日計。兩邊方向相反，同一批資料在兩套算式下會得到不同的日期。

同一份文件另外要求排程可行性在送審與核可時把關、要求訂單層看得到最近一批何時交與全部何時交完、要求記下客戶指定的收件日，並把準時的錨點定在實際出貨日。這些在現行規格裡都沒有落點。

Miles 2026-09-21 的兩點裁決、grill 十二題與稽核後裁決已逐題定案，設計方案經 plan-audit 四輪稽核全過。本 change 只做系統行為規格的同步，不重做商業層決策。

約束：不新增狀態、不新增角色、不新增審核關卡。狀態轉換本身不動，只在既有轉換上附帶寫入衍生日期，並在工單送審與核可兩個轉換上增加把關條件。

## Goals / Non-Goals

### Goals

- 交期鏈的算式方向與公司文件一致：未扣急件內部完成日 → 印件內部完成日 → 印件預計交期 → 訂單層衍生日期。
- 整條鏈的日期加減與逾期天數改以工作天計，算法只有一份正本。
- 排程可行性在送審與核可兩個時點擋得住，擋下時看得到擋的理由與差幾個工作天。
- 工單、生產任務與出貨單各有一個「實際做完 / 實際出貨」的時間事實，準時判定與指標取得到數。
- 訂單層看得到最近一批何時交、全部何時交完，並記得住客戶指定的收件日。
- 六份 spec 的日期欄名與 wiki 正本一致。

### Non-Goals

- 不重新裁決命名與算式。grill 十二題與稽核後裁決已定案。
- 不做起算日、商品工作天與 EC 官網單的帶入規則（EC 整合另案）。
- 不做任何到期或逾期的通知推送，也不做交期檢核列。
- 不啟用運輸天數，只在 wiki 記為預留欄。
- 不新增任務準時率指標。
- 不處理既有印件日期的資料遷移（屬上線前的資料遷移計畫）。
- 不定義工作天維護表自己的維護介面規格——ERP 不開這個介面，維護表由後端維護者處理。

## Decisions

**D1：業務壓的那一天獨立成欄，扣急件之後才叫印件內部完成日**

業務在需求單或訂單印件上壓的是「未扣急件內部完成日」，系統扣掉急件選項凍結的天數之後才是印件內部完成日。取代方案（業務直接壓印件內部完成日、急件只做標示）不採：急件選項事後常改，只留扣後的值就回推不出業務當初談的是哪一天，急件改了也不知道該從哪一天重扣。取代方案（急件不參與計算）由 Miles 明示否決。

**D2：印件預計交期是系統建議值，業務可改但不得早於印件內部完成日**

印件預計交期 ＝ 印件內部完成日的下一個工作天。業務可以改晚（客戶說下週再寄），不可以改早於印件內部完成日——那等於承諾一個內部還沒做完的日子。印件內部完成日一改，系統重算建議值並覆蓋業務改過的值，同時提示已重算。取代方案（重算時保留業務改過的值）不採：保留下來的舊值可能已經早於新的內部完成日，系統會留下一組自相矛盾的日期。

**D3：工作天算法只有一份正本，spec 只引不抄**

哪些天算工作天、加減怎麼數、逾期天數怎麼算，正本在 wiki [工作天規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/工作天規則.md)。spec 只寫「系統 SHALL 依工作天規則計算」與資料由後端維護表提供、ERP 無維護介面。取代方案（在 spec 內複寫規則與假日清單）不採：假日每年更新，抄一份進 spec 就會出現兩份對不起來的日曆。

**D4：訂單層的日期一律衍生、不存欄**

訂單內部完成時間、訂單預計交貨日期、全部交完日都由旗下印件即時算出。取代方案（存成訂單欄位，印件改動時回寫）不採：回寫會漏（印件棄用、加開、出貨都要觸發），漏一次訂單層就長期顯示一個錯的日期，而業務正是靠這個數盯單。

**D5：訂單預計交貨日期只依出貨事實滾動**

滾到下一筆的條件是「這一件出貨了」，不是「這一天過了」。日期已過而未出貨的印件仍停在欄內並標逾期。公司文件 § 06 的字面是系統日期超過就顯示下一筆——不採，因為逾期未出的那一筆正是最該被盯的；讓它消失，業務就看不到自己最該處理的那件事。差異已在 proposal 標明。

**D6：排程把關放在送審與核可兩個時點，硬擋；任務層維持軟提示**

任務層的軟提示是印務填日期時的即時回饋，送審與核可的硬擋是製程出門前的把關，兩者分工不重疊。印件內部完成日為空時不比對、不擋，畫面顯示這張工單沒有交期基準。取代方案（只留軟提示、由印務自行決定）不採：公司文件定案為擋審核，而基準已由業務直接壓、口徑明確，擋得住也說得出理由。取代方案（核可後也持續硬擋）不採：活已經在做了，擋住只會讓現場停擺，改標「排程超期」由印務承接。

**D7：晚期建單路徑一樣擋**

打樣 NG 重打、外包大貨 NG 補印、加印等在印件內部完成日之後才開的工單，照樣被擋。取代方案（這些路徑排除硬擋）不採：排除之後現場就有一條繞過把關的路，而且該改的其實是業務手上的未扣急件內部完成日——擋下正好逼出這個動作。

**D8：實際出貨日取狀態群，不寫出貨方式特例**

實際出貨日 ＝ 出貨單首次進入已出貨狀態群（運送中、已送達）的日期。自取直接進已送達，也由同一條規則涵蓋，不另寫特例。取代方案（依出貨方式分別定義）不採：出貨方式的值域會增減，每增一種就要補一條特例。

**D9：準時判定以印件的首張出貨單為準**

一件印件分批出貨時，以最早進入已出貨狀態群的那張出貨單判定；同一時間多張以出貨單編號較小者為首張。後續分批不改變已判定的結果。首張出貨單作廢或轉異常時該印件回到未出貨，重開後以新的首張為準。取代方案（以最後一批判定）不採：分批出貨常常是為了讓客戶先拿到一部分，用最後一批判會把「有先交」與「完全沒交」算成同一件事。

**D10：與兩個未歸檔 change 的重疊，以最新文字為基準、歸檔順序寫死**

本 change 的部分 Requirement 也被尚未歸檔的兩個 change 修改中。歸檔以 Requirement 標題比對，後歸檔者覆蓋先歸檔者，因此基準文字取最新的那一份：

| Requirement | 基準取自 | 原因 |
|---|---|---|
| order-management § 印件內部完成日推導 | change `delivery-date-naming-convergence` | 主 spec 無此 Requirement，該 change 新增 |
| order-management § 印件急件選項 | change `delivery-date-naming-convergence` | 該檔已改內部完成日用詞 |
| order-management § 成交轉訂單 | change `delivery-date-naming-convergence` | 同上 |
| order-management § 印件詳情頁工單與生產任務區塊 | change `delivery-date-naming-convergence` | 同上 |
| order-management § 訂單詳情頁編輯型 Section 統一編輯時機與角色 | change `delivery-date-naming-convergence` | 同上 |
| order-management § 製作後印件規格異動系統自動通知 | change `work-order-detail-company-alignment` | 該檔較新 |
| order-management § 訂單列表權限與可見範圍 | change `work-order-detail-company-alignment` | 該檔已改接單業務 |
| order-management § 訂單階段印件規格編輯時機 | change `work-order-detail-company-alignment` | 該檔已加印件備註可改角色 |
| order-management § 新增印件欄位與必填檢核、§ 加開印件（複製原印件規格） | change `work-order-detail-company-alignment` | 該檔已改印件屬性 |
| work-order § 工單排程日期、§ 製程規劃、§ 工單列印單據 | change `work-order-detail-company-alignment` | 該檔已加任務實際開工、確樣需求與聯絡電話 |
| work-order § 任務預計完成日超期軟提示 | change `delivery-date-naming-convergence` 的「生產任務預計完成日超期提示」 | 主 spec 無此 Requirement |
| work-order § 製程審核流程、§ 印務主管待審核工單列表 | 主 spec | 兩個 change 皆未改 |
| quote-request § 印件項目管理 | change `work-order-detail-company-alignment` | 該檔已改需求品項類別與利潤率 |
| quote-request § 成交轉訂單 | change `delivery-date-naming-convergence` | 該檔已改交期帶入 |
| production-overview § 待排區 | change `delivery-date-naming-convergence` | 該檔已改內部完成日 |
| production-overview § 五指標 | change `work-order-detail-company-alignment` | 該檔已改利潤率 |
| prepress-review § 待審清單排序與停滯規則 | change `delivery-date-naming-convergence` | 該檔已改排序鍵 |
| shipment 各 Requirement | 主 spec | 兩個 change 皆未改 |

歸檔順序 SHALL 為：`delivery-date-naming-convergence` → `work-order-detail-company-alignment` → 本 change。順序顛倒時本 change 的條文會被舊文字蓋回去。歸檔前逐份比對重疊 Requirement 的主 spec 現值，發現與本檔基準不同即重貼（見 tasks.md § 1）。

**D11：改標題的 Requirement 用 REMOVED ＋ ADDED，不用 MODIFIED**

歸檔的同步機制以 Requirement 標題做比對鍵。標題含被改名欄名者若用 MODIFIED，歸檔後主 spec 會留下舊標題的孤兒內容、新舊並存。本 change 走此路徑的有下列各條：

| 舊標題 | 新標題 | 所在 |
|---|---|---|
| 印件急件選項與預計出貨日變更留痕與同步 | 印件交期欄變更的重算、覆蓋與同步 | order-management |
| 生產任務預計完成日超期提示 | 任務預計完成日超期軟提示 | work-order |

**D12：排程硬擋獨立成一條 Requirement，不塞進製程審核流程**

硬擋在送審與核可兩個時點各判一次，而送審的條文在 § 製程規劃、核可的條文在 § 製程審核流程；規則寫兩份就會分岔。獨立一條、兩處引用，改的時候只有一個地方要動。

**D13：標示的條件寫進 spec，顏色留給 Prototype**

逾期、部分延遲、整單逾期、排程超期、今日到期、準時等都是商業規則判定的結果，判定條件與顯示文字寫進 spec；用什麼顏色呈現屬介面實作，歸 Prototype。

## Risks / Trade-offs

- **[風險] 歸檔順序被打亂，本 change 的用詞被舊文字蓋回去** → D10 寫死順序，tasks.md § 1 設歸檔前逐份比對與重貼步驟，另設歸檔後的 grep 驗收（舊名零殘留）。
- **[風險] 算式方向反轉後，既有印件的日期全部失真** → 既有資料的日期重推屬上線前的資料遷移計畫，列為後端另案；本 change 的規格只管新算式，不寫遷移條文。
- **[風險] 工作天維護表的假日資料缺漏，整條鏈算出錯的日期** → 資料的核對與年度更新責任開 PT-061 追蹤；spec 明文「維護表新增假日後既有日期不回頭重算」，避免一次補假日就讓歷史日期整批變動。
- **[取捨] 硬擋會擋住晚期建單路徑** → 現場要多一趟請業務改未扣急件內部完成日。接受，因為那一步本來就該做（D7）。
- **[取捨] 訂單預計交貨日期與公司文件字面不同** → 逾期未出的印件停在欄內。差異已明示，回頭向公司確認。
- **[取捨] 印件已送達後仍可改交期欄** → 印件準時交貨率會被事後改寫。Miles 拍板不鎖，指標照實反映。
- **[取捨] 未扣急件內部完成日留空時整條鏈都是空值** → 這類印件不進準時率分母、工單不受硬擋。留空比例的管理面追蹤屬 ORD-051。

## Migration Plan

1. wiki 落卡（已完成，2026-09-21，commit 9158ab1，本 change 不重做）。
2. OpenSpec 規格差異檔（本 change）：order-management、work-order、quote-request、shipment、production-overview、prepress-review 六份。
3. Prototype（erp repo `(prototype)/`）依 tasks.md 逐項施工，MUST 經 skill `prototype-from-prompt`，只動 `(prototype)/` 目錄。
4. Mock 資料鏈同步：先改 `MOCK-DATA-CHAIN.md`，再改各模組 `mock-data.js`，最後改引用該鏈編號的測試。需求單印件 → 訂單印件 → 工單 → 生產任務 → 出貨單的日期不可斷鏈。
5. Sens `erp-prototype-tests`：本次寫 Vitest 純函式測試（工作天算法、急件扣減、預計交期推算、滾動值、硬擋判定、準時判定），Playwright 畫面測試只補情境目錄節與待補註記、不新寫（Miles 指示）。
6. 歸檔：先確認 `delivery-date-naming-convergence` 與 `work-order-detail-company-alignment` 已歸檔，再歸檔本 change；歸檔後手改規格差異檔改不到的殘留用詞（清單見 tasks.md § 1）。
7. 回滾：本次為算式方向、欄位改名與新增衍生顯示，OpenSpec 側無資料遷移；需回退時逐份 spec 與 Prototype commit 各自還原。既有資料的重推屬後端另案，回退時一併不執行。

## Open Questions

本 change 不留待確認項。下列各題已列為 OQ、標記另案處理，皆不決定本 change 的行為：

| OQ | 議題 | 對本 change 的影響 |
|---|---|---|
| PT-061 | 工作天維護表的初始值核對與年度更新責任 | 無。spec 只寫算法引 wiki、資料由後端提供 |
| ORD-057 | 客戶指定收件日檢核所需運送天數的來源 | 無。本 change 只做「早於最晚印件預計交期」的提醒，不算運送天數 |
| ORD-051 | 印件準時交貨率在大面積留空時的代表性 | 無。留空不計入分母的規則不變 |
| PT-054 | 延後型急件使兩個日期顛倒 | 無。照實顯示、不加下限的結論維持 |

另有一件事在本 change 產出過程中判定、不開 OQ：`openspec/specs/order-management/spec.md` § Data Model 的實體關聯總覽與 `openspec/specs/production-overview/spec.md` 檔頭的指標列在 Requirement 之外，規格差異檔改不到，歸檔後一併手改（見 tasks.md § 1）。
