# pre-check 回放集

用途：量規劃前盤點（pre-check）列的「寫 specs 前須更新的卡」，涵蓋實際落卡卡名的比例。新版 pre-check（批次 4）用同一批案件重跑，比例不低於本檔舊版數字才算合格（重構計畫 § 2.3 驗證段）。

## 一、案例清單

| 案件 | 舊版 pre-check 產出 | 預測清單所在段 | 實際落卡來源 | 分組 |
|---|---|---|---|---|
| rush-order-definition（急件新定義） | `openspec/changes/archive/2026-10-28-rush-order-definition/precheck.md`（提交 99cedc8 加入） | § 七 | grill.md「wiki 落卡紀錄」（提交 ee8425f）；wiki/log.md 2026-10-27 21:20、22:03、22:10、22:15、22:25 與 2026-10-28 01:39 納入(amend) 條目 | 訓練 |
| shipment-print-download-center（出貨單可出貨狀態、批次列印與下載中心） | `openspec/changes/archive/2026-10-26-shipment-print-download-center/precheck.md`（提交 cd25318 加入） | 「寫 specs 前須先更新的 wiki 卡清單」段＋稽核報告 § 五（5.1、5.2） | grill.md「wiki 落卡紀錄」（提交 8080388）；wiki/log.md 2026-10-23 23:40、2026-10-24 00:30 納入(amend) 條目 | 測試 |
| print-item-copy-rule（印件複製規則） | `openspec/changes/print-item-copy-rule/precheck.md`（最後提交 5928864） | § 八 | grill.md「wiki 落卡紀錄」（提交 1ed0494、46385de）；wiki/log.md 2026-10-29 00:37 納入(amend) 條目 | 測試 |

## 二、計數規則

| 規則 | 做法 |
|---|---|
| 實際落卡卡名 | 上述 grill 段與 log 條目「變更」行裡的卡名聯集 |
| 排除 | 索引檔（index、erp_index）、規範卡、範例卡、卡片撰寫共用規範、OQ 卡、wiki 以外的檔（例：`memory/shared/ui-wording.md`） |
| 預測卡名 | 預測清單段出現的卡名；預測清單寫「新增規則單元，落點由 wiki-amend 判」時，算預測到該新卡 |
| 預測清單自己判「不受影響」的卡 | 不算預測 |
| 涵蓋比例 | 實際落卡卡名中被預測到的張數 ÷ 實際落卡卡名張數 |

## 三、舊版基線

| 案件 | 口徑 | 實際落卡張數 | 預測到 | 涵蓋比例 | 漏列的卡 |
|---|---|---|---|---|---|
| rush-order-definition | A：第一輪落卡（grill 落卡紀錄、log 10-27 21:20） | 28 | 28 | 100% | 無 |
| rush-order-definition | B：本 change 全部納入條目 | 38 | 28 | 74% | 訂單狀態、急件規則（新建）、成本計算規則、查找含急件印件的訂單（新建）、單據存取流程群組、生產任務接收與派工、生產管理單元可見範圍、訂單與帳務檢視活動清單、付款發票邏輯、訂單成立確認 |
| shipment-print-download-center | 全部納入條目 | 31 | 30 | 97% | 單據存取流程群組 |
| print-item-copy-rule | 全部納入條目 | 8 | 8 | 100% | 無 |

預測多列、實際沒改的卡（精確度參考，不計入合格線）：

| 案件 | 多列的卡 |
|---|---|
| print-item-copy-rule | 稿件管理規則、印件審稿狀態、另兩張資料結構總覽（預測清單已寫「只在 U3 擴充時改」） |
| rush-order-definition | 無 |
| shipment-print-download-center | 轉交單（預測清單判不受影響，未計入）；其餘未逐筆核對 |

## 四、讀數限制

| 限制 | 影響 | 批次 4 重跑時的處理 |
|---|---|---|
| 舊版 precheck.md 在 grill 之後才定稿，預測清單的「改寫要點」直接引用拍板題號 | 舊版涵蓋率偏高；落卡也照這份清單做，有循環 | 新版重跑時給同樣的輸入（含 grill.md 拍板），否則不可比 |
| rush-order-definition 的口徑 B 含第二輪拍板（2026-10-27 晚間至 10-28）新增的範圍 | 口徑 B 的漏列不全是 pre-check 漏看，有些是後來才拍板的事 | 主看口徑 A；口徑 B 只當參考 |
| shipment-print-download-center 的預測卡名以該段「出現的卡名」計 | 該段有些卡名只出現在「改成什麼」欄的說明文字 | 新版重跑時用同一計數方式 |
| 調研判斷（重構計畫 § 2.3）舊版沒有此段 | 無基線數字 | 新版只驗「三案都有調研建議段並附理由」 |
