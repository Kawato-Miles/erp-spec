標題：[ Task ] - 物流單批次列印與下載中心的頁面
Label：Type/Task、Role/Frontend、Product/ERP
Parent：<新 Feature 票：物流單批次列印與下載中心>
狀態：新開（Miles 已同意開票；PM team 建立再轉入 FE team）

---

## 要做什麼

讓出貨人員在出貨管理勾選物流單列印，並在下載中心查看產檔結果與下載列印檔。

## 頁面與控制元件

* 出貨管理頁
  * 勾選框：出貨單、物流單
  * 動作按鈕：列印
* 下載中心頁
  * 篩選：檔案類型、狀態、建立人
  * 動作按鈕：下載

## 不用自己做

* 出貨管理頁本體：由 <issue id="dc892534-abea-4bc8-91a1-c98024139e20" href="https://linear.app/sensationdeveloper/issue/FE-609/task-出貨單建立與管理的頁面">FE-609</issue> 提供。
* 下載檔案的狀態、物流單筆數與異常內容：由 <新後端 Task 票識別碼，開票後回填> 回傳。
