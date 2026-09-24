# 手冊改寫共用任務書

## 背景
感官 ERP 操作手冊（`/Users/b-f-03-029/Sens/production-stage-seg1-manual-artifact.html`）最後更新於 2026-09-08。之後 Prototype 迭代，Miles 以 grill 裁決（`grill-decisions.md`）處理差異，wiki 與 Prototype 已依裁決改好並推送（erp 分支 prototype/production-stage 至 4669ea12）。你負責依裁決與 Prototype 現況，改寫手冊的一個主題群。

## MUST 先讀
1. `/Users/b-f-03-029/Sens/memory/erp/manual-writing-rules.md` 全文（手冊寫法規則正本：資料結構、步驟規則、常見問題規則、內容通則）
2. `/Users/b-f-03-029/.claude/output-styles/ste100-pm.md`、`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`
3. 裁決正本：`/Users/b-f-03-029/Sens/memory/erp/manual-audit-20260923/grill-decisions.md` 全文
4. 待確認清單：同目錄 `followups.md`（暫定做法照寫）
5. 你負責主題群的現行內容：同目錄 `manual-units/current-<key>.json`（或新單元的 `draft-<key>.json`）
6. 你負責主題群的比對報告與改寫草稿（見各任務指派）
7. Prototype 現況程式碼（介面字串逐字取自這裡）：`/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/`，比對時搜整個目錄含 `_components`、`_lib`
8. wiki 正本卡（狀態名、角色名、實體名依此）：`/Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/`

## 做法
- 以現行 JSON 為底，逐頁套用比對報告的差異與裁決，介面字串重新對照 Prototype 現況（Prototype 在 9-23 之後又改過，報告裡的行號與字串可能已變，以程式碼為準）。
- 鍵名不可增減，與現行頁一致（howto：id、kind、title、actor、intro、goals、points、story、before、entries、steps、fields、check、notes；overview 照現行頁的鍵）。新頁複製同單元既有頁的鍵。
- 裁決要求刪頁或加頁的，照做；頁 id 不改（新頁用指定 id）。
- 概覽頁的 related 清單要與本群實際頁面一致。
- 不寫單號、人名、公司名、實作詞（Dialog、Drawer、Modal、Tab 元件詞、placeholder、上限 N 字寫在步驟）、prototype／mock／模擬字樣；「模擬物流商回報配達」按鈕不寫成步驟。
- 句長：扣掉「」內字串後，操作指示 25 字內、說明句 30 字內；常見問題每頁最多四題；步驟說明欄每頁最多兩處。
- 列舉前不寫死數量詞。
- 手冊、Prototype、wiki 三方仍有矛盾時，照裁決；裁決沒涵蓋的停下列出，不自行調和。

## 產出
1. 把改寫後的主題群 JSON（與 current 同結構：key、unit、role、user、pos、duty、scenarios）寫到 `/Users/b-f-03-029/Sens/memory/erp/manual-audit-20260923/manual-units/out-<key>.json`。若工具不允許寫檔，把完整 JSON 放在回覆裡的 ```json 區塊。
2. 不要修改 `production-stage-seg1-manual-artifact.html`，由主對話合併。
3. 回覆：逐頁改了什麼（頁 id｜一句話｜依據）、無法判斷需 Miles 決定的事項、自查結果（句長、單號、實作詞、常見問題題數、說明欄處數）。
