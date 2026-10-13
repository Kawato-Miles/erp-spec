標題：[ Task ] - 需求單建立的頁面
Label：Type/Task、Role/Frontend、Product/ERP
Parent：PM-1207
說明：上方三行是 Linear 欄位設定；描述全文從「=== 描述全文開始 ===」下一行起算。現行票狀態為 In Review。

=== 描述全文開始 ===

## 要做什麼

讓業務與諮詢在需求單列表與詳情頁建立需求單、登記印件項目並送印務評估。

## 頁面與控制元件

* 需求單列表頁
  * 動作按鈕：新增、編輯
  * 側板：新增需求單、編輯需求單
* 需求單詳情頁
  * 動作按鈕：編輯、新增印件、送印務評估、印件列的編輯與刪除
  * 對話框：送印務評估（缺漏）、刪除資料
  * 側板：編輯需求單、新增印件、編輯印件
  * 頁籤：印件報價、活動紀錄

## 不用自己做

* 單據分享成員的授予、改層級與收回：由 FE-588 提供。
* 客戶與聯絡人的可選清單：由 <project id="c726a27d-e733-4c7b-b812-441d280aa3fe" href="https://linear.app/sensationdeveloper/project/feature-erp-%E4%B8%AD%E5%8F%B0-%E5%BB%A0%E5%AE%A2%E7%AE%A1%E7%90%86%E6%A8%A1%E7%B5%84-c5bb98f98cc0/overview">[ Feature ] - ERP 中台 - 廠客管理模組</project> 提供。
* 產線的可選清單：沿用既有產線資料。
