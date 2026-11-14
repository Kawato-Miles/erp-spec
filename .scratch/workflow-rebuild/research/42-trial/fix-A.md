# 票 42 實測甲：依稽核結果改一輪（第二步）

稽核結果正本是同資料夾 `audit-A.md`，本檔不重述問題內容。
erp 工作樹 `ticket42-a`，本機分支 `local/ticket42-a`，本機提交 `8590c4d6`（基底 `6e75fa07`）。沒有推送、沒有開 PR、沒有啟動開發伺服器、沒有跑測試。
路徑都相對於 `apps/erp/src/app/(prototype)/`，「改後」行號是提交 `8590c4d6` 的行號。

## 一、結果總覽

| 處置 | 數量 | 編號 |
|------|------|------|
| 已改 | 18 | A-01、A-04、A-05、A-07、A-08、A-09、A-12、A-13、A-14、A-15、A-18、A-19、A-21、A-24、A-26、A-30、A-31、A-32 |
| 未改：需要 PM 決定 | 7 | A-02、A-10、A-16、A-17、A-20、A-25、A-28 |
| 未改：與 erp 不相容 | 4 | A-11、A-23、A-27、A-33 |
| 未改：超出範圍 | 1 | A-03 |
| 未改：其他 | 3 | A-06、A-22、A-29 |
| 合計 | 33 | |

## 二、處置表

| 編號 | 處置 | 檔案與行號（改後） | 改前 | 改後／未改原因 |
|------|------|------------------|------|---------------|
| A-01 | 已改 | `production-floor/transfers/page.js` 591–595、605–609、619–623、635–639 | 篩選標題是獨立文字 `<Typography.Text type="secondary">狀態</Typography.Text>`，下拉沒有名稱 | 標題文字外觀不變，內層改成 `<label htmlFor="transfer-filter-status">`，下拉加對應 `id`；日期區間以 `id={{ start: ... }}` 綁到起日輸入框 |
| A-02 | 未改 | `production-floor/transfers/page.js` 574–580 | | 需要 PM 決定。改寫要刪掉 Slack 通道的事實說明，屬替換事實文案。Impeccable 原文：「Ask before replacing factual copy or adding claims.」（`SKILL.src.md`） |
| A-03 | 未改 | `production-floor/transfers/page.js` 586 | | 超出範圍。讓刷新鈕有作用要改行為，不是呈現 |
| A-04 | 已改 | `production-floor/transfers/page.js` 680–686 | 紅色內文段落 `<Typography.Text type="danger">來源任務已無效…` | 改用共用提示框 `<StyledAlert type="warning" showIcon message=…>`，文字內容不變 |
| A-05 | 已改 | `production-floor/transfers/page.js` 679、722、736 | `gap={20}`；小標題 `marginBottom: 8` | `gap={theme.spacing.lg}`（24px）；`marginBottom: theme.spacing.xs`（8px，值不變，改用代號） |
| A-06 | 未改 | `production-floor/transfers/page.js` 858–859 | | 其他。Sens 畫面測試 `tests/e2e/10-report-transfer/transfer-tickets.spec.mjs` 171、173、182、503、510 行用「修改轉交單」「儲存修改」定位對話框與按鈕。改字要同步改 Sens 測試，超出本任務只改 erp 工作樹的範圍 |
| A-07 | 已改 | `production-floor/transfers/page.js` 883、975 | 編輯與重開對話框欄名 `title: '數量'` | `title: '搬運數量'` |
| A-08 | 已改 | `production-floor/transfers/page.js` 891、983 | 數字輸入框沒有名稱 | 加 `aria-label={`${d.task_name} 搬運數量`}` |
| A-09 | 已改 | `production-floor/transfers/page.js` 753–755 | 對話框直接是表格，沒有照片規則說明 | 表格上方加一句次要文字：「每條明細至少上傳一張簽收照片；有一條缺照，整筆就無法送出。」規則出處：同檔 `handleDeliver` 上方註解 |
| A-10 | 未改 | `production-floor/transfers/page.js` 444 等五處 | | 需要 PM 決定。erp 規範沒寫作廢類操作用哪個圖示，改哪一邊都是新定慣例。Impeccable 原文：「Ask when a binding system principle cannot be inferred.」（`polish.md`） |
| A-11 | 未改 | `production-floor/transfers/page.js` 灰字各處 | | 與 erp 不相容，見第三節第 1 項 |
| A-12 | 已改 | `orders/_components/detail/billing/ReconciliationPanel.js` 31、38、66、72、80、107、133 | `fontSize: 13` | `fontSize: theme.typography.bodySm.fontSize`（12px） |
| A-13 | 已改 | `orders/_components/detail/billing/ReconciliationPanel.js` 136–144 | `style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 12px' }}` | `fontSize`、`fontWeight` 取 `theme.typography.titleMd`（20／700），邊距取 `theme.spacing.xs`、`theme.spacing.sm` |
| A-14 | 已改 | `orders/_components/detail/billing/ReceivableCard.js` 26、99 | 欄名 `fontSize: 13`；應收總額 `fontSize: 18` | 欄名 `bodySm`；應收總額 `titleMd`（20px），與對帳卡主數字同級 |
| A-15 | 已改 | `orders/_components/detail/billing/PaymentRecordSection.js` 150、155 | `fontSize: 13` | `fontSize: theme.typography.bodySm.fontSize` |
| A-16 | 未改 | `orders/_components/detail/billing/ReconciliationPanel.js` 36–43 | | 需要 PM 決定。要定負數金額用紅字還是深灰。`Designs.md` 寫「狀態色只用於狀態」，傾向深灰；發票區現行是紅字，兩邊都有依據 |
| A-17 | 未改 | `orders/_components/detail/billing/ReconciliationPanel.js` 181–186 | | 需要 PM 決定。改寫說明等於在提示框加上金額主張。Impeccable 原文：「Ask before changing factual claims, legal meaning, or a term that may be domain-specific.」（`clarify.md`） |
| A-18 | 已改 | `orders/_components/detail/billing/InstallmentSection.js` 101；`billing/PaymentRecordSection.js` 34–41、246 | `<span style={{ opacity: 0.5 }}>`；已取消列 `opacity: 0.5` | `<Typography.Text type="secondary">`；已取消列改 `color` 取 AntD 代號 `colorTextSecondary`（約 5.9:1）。列內自帶顏色的標籤與 `Text` 不受影響 |
| A-19 | 已改 | `orders/_components/detail/billing/PaymentRecordSection.js` 169 | `` {`-NT$ ${Math.abs(v).toLocaleString()}`} `` | `{fmtNegative(v)}`（同資料夾 `format.js`） |
| A-20 | 未改 | `orders/_components/detail/billing/PaymentRecordSection.js` 35–37 等 | | 需要 PM 決定。檔頭註解寫明「退款列金額紅字帶負號 + 退款 Tag；退款整列淡黃底」，是既定呈現。Impeccable `quieter.md` 原文：「If any of these are unclear from the codebase, do not guess.」 |
| A-21 | 已改 | `orders/_components/detail/billing/InstallmentSection.js` 248–256；`billing/InvoiceSection.js` 112–143、273–285、303–331 | 停用鈕外層 `<span>` 不可聚焦，提示只在滑鼠懸停時出現；回簽檔、作廢折讓停用時提示只寫按鈕名 | 提示加 `trigger={['hover', 'focus']}`；停用時外層 `tabIndex={0}`；停用時按鈕名稱帶原因（例「作廢發票：訂單已取消，不可操作」）；訂單已取消的原因補進回簽檔、作廢折讓、開立折讓單、作廢發票四個提示。原因出處：同檔 `canEdit` 註解 |
| A-22 | 未改 | `orders/_components/detail/billing/InvoiceSection.js` 161 | | 其他。Sens 畫面測試 `tests/e2e/14-query-ui/nested-tables.spec.mjs` 8、30、35 行約定子表沒有子列時顯示「沒有資料」，14.44 條目直接驗證本頁發票子表 |
| A-23 | 未改 | `ReconciliationPanel.js`、`PaymentRecordSection.js` 標籤各處 | | 與 erp 不相容，見第三節第 2 項 |
| A-24 | 已改 | `after-sales/page.js` 581–603 | `<BorderBlock $autoHeight onClick={onClick}>`，一般區塊 | 加 `role="button"`、`tabIndex={0}`、`aria-pressed={active}`、Enter 與空白鍵觸發 `onClick` |
| A-25 | 未改 | `after-sales/page.js` 211–216、533–539 | | 需要 PM 決定。卡的計數範圍或點擊篩選範圍要改一邊，屬業務邏輯 |
| A-26 | 已改 | `after-sales/page.js` 607–616 | `<Typography.Title level={3} style={{ margin: 0 }}>` | `<Typography.Text>`，字級、字重、行高取 `theme.typography.titleLg`（24／700／36） |
| A-27 | 未改 | `after-sales/page.js` 521、528、535 | | 與 erp 不相容，見第三節第 2 項。另外列表的「下一步動作」標籤色來自 `orders/mock-data.js` 的 `NEXT_ACTION_META`，只改摘要卡會讓卡與列表顏色不一致 |
| A-28 | 未改 | `after-sales/page.js` 324–330 | | 需要 PM 決定。拿掉狀態欄的「（逾期）」會改變狀態欄顯示內容，需確認是否為既定呈現 |
| A-29 | 未改 | `after-sales/page.js` 253–348、547 | | 其他。要改欄寬才能讓狀態欄進畫面，但操作欄由範圍外的 `TicketRowActions` 決定按鈕數。任務禁止啟動開發伺服器，無法目視確認改後不截字。Impeccable `layout.md` 原文：「Make optical corrections only after inspecting the rendered result.」 |
| A-30 | 已改 | `after-sales/page.js` 283、403 | `style={{ fontSize: 12 }}` | `style={{ fontSize: theme.typography.bodySm.fontSize }}` |
| A-31 | 已改 | `after-sales/page.js` 398–413 | 「售後服務單自訂單詳情頁的「售後服務」Tab 建立」；有篩選時無提示 | 「Tab」改「分頁」；有篩選時加一行「可調整或清空篩選條件」 |
| A-32 | 已改 | `after-sales/page.js` 430–434、448–452、464–468、482–486、500–504 | 篩選標題是獨立文字 | 同 A-01 做法：`<label htmlFor>` 加下拉 `id`，日期區間綁起日輸入框 |
| A-33 | 未改 | `after-sales/page.js` 灰字各處 | | 與 erp 不相容，見第三節第 1 項 |

## 三、不相容紀錄

| 項目 | Impeccable 原文句與位置 | erp 原文句與位置 | 涉及發現 |
|------|------------------------|-----------------|---------|
| 1. 輸入框灰字對比 | 「body and placeholder text ≥4.5:1, large text ≥3:1.」（`reference/craft-floor.md`，Verify 段 Contrast 項） | 「改色 / 改字體一律回 Figma 改 token 再跑 transform。**不要**在元件裡硬寫顏色。」（`Designs.md` §2）；「想自己刻元件 / 寫死顏色 → 回 catalog 查、用 AntD 原生。」（`.claude/skills/prototype-from-prompt/SKILL.md` Red Flags） | A-11、A-33 |
| 2. 狀態標籤對比 | 「Text contrast ratios < 4.5:1, or < 3:1 for large text (or 7:1 for AAA)」（`reference/audit.md`，第 1 面向）；「Verify text, control, and focus contrast in every state.」（`reference/polish.md`，Color 段） | 「狀態用 AntD Tag + 正體中文文案」對照禁止項「自訂狀態色塊」（`Designs.md` §8）；「改色 / 改字體一律回 Figma 改 token 再跑 transform。**不要**在元件裡硬寫顏色。」（`Designs.md` §2） | A-23、A-27 |

說明：兩項都是顏色值的問題。Impeccable 要在畫面上把對比修到 4.5:1；erp 規定顏色只能從 Figma 色彩代號或 AntD 預設來，頁面不得自訂。修法只能走 Figma 色彩代號，由設計與前端處理。

## 四、用到的指令

| 指令 | 為什麼用 | 依據原文句（出處） | 本輪處理的發現 |
|------|---------|------------------|--------------|
| `harden` | 稽核建議的第一順位，處理無障礙與狀態 | 「Proper ARIA labels」；「All functionality accessible via keyboard」；「Clear explanation of why」（`harden.md` Accessibility Resilience 與 Permission states） | A-01、A-04、A-08、A-09、A-18、A-21、A-24、A-32 已改；A-03、A-11、A-23、A-25、A-27、A-33 未改 |
| `typeset` | 稽核建議處理寫死字級 | 「Keep repeated roles consistent across screens and states.」（`typeset.md` Apply） | A-12 至 A-15、A-26、A-30 已改 |
| `clarify` | 稽核建議處理用詞與空白狀態 | 「Keep the same noun and verb for the same concept throughout the product.」；「An empty state distinguishes first use, no results, filters, permissions, and failure. Explain the state and provide the next useful action.」（`clarify.md`） | A-07、A-31 已改；A-02、A-06、A-17、A-22 未改 |
| `layout` | 稽核建議處理間距與欄寬 | 「Use a documented spacing scale rather than one-off values.」（`layout.md` Apply） | A-05 已改；A-29 未改 |
| `quieter` | 稽核建議處理重複標示 | 「Operate + Read: "quieter" means reducing visual noise.」（`quieter.md` Visitor mode） | A-20、A-28 都未改（需要 PM 決定） |
| `polish` | 稽核規定最後一步；處理圖示、負數顏色、自組格式 | 「End with `{{command_prefix}}impeccable polish` as the final step if any fixes were recommended.」（`audit.md`）；「Replace custom implementations with shared components where the system owns the pattern.」（`polish.md`） | A-19 已改；A-10、A-16 未改 |

每個指令的參考檔都讀完全文：`harden.md`、`typeset.md`、`clarify.md`、`layout.md`、`quieter.md`、`polish.md`。改檔前已讀 `craft-floor.md`。

### 修正階段降級或跳過的步驟

| 原文句（出處） | 處理 | 少了什麼 |
|---------------|------|---------|
| 「{{scripts_path}}/impeccable detect --json --scope type [target files or dirs]」（`typeset.md`）、同樣的 `--scope layout`（`layout.md`） | 不執行 | 沒有機械掃描，只有讀碼評估 |
| 「Answer each item with rendered or source evidence, then rerun the scan.」（`typeset.md`、`layout.md` Verify） | 只能給程式碼證據 | 沒有畫面證據，沒有重掃 |
| 「Use the feature yourself at the surface's representative sizes」（`polish.md`） | 不能啟動開發伺服器 | 改後沒有目視檢查，也沒有鍵盤實走 |
| 「{{scripts_path}}/impeccable critique-storage latest "<resolved target>" --json」（`polish.md`） | 不執行 | 沒有讀取先前的評論快照（本專案也沒有） |
| 「Test with screen reader」「Test keyboard-only navigation」（`harden.md` Manual testing） | 沒做 | A-01、A-21、A-24、A-32 的鍵盤與螢幕閱讀器效果未驗證 |

改檔後只用專案的 Prettier 設定檢查與格式化七個檔，確認語法可解析。ESLint 與 Sens 畫面測試都沒跑。

## 五、改動範圍

`git -C /Users/b-f-03-029/erp/.claude/worktrees/ticket42-a diff --stat 6e75fa07` 的輸出：

```
 apps/erp/src/app/(prototype)/after-sales/page.js   | 66 ++++++++++++++++++----
 .../detail/billing/InstallmentSection.js           | 11 ++--
 .../_components/detail/billing/InvoiceSection.js   | 58 ++++++++++++-------
 .../detail/billing/PaymentRecordSection.js         | 19 +++----
 .../_components/detail/billing/ReceivableCard.js   |  7 ++-
 .../detail/billing/ReconciliationPanel.js          | 28 ++++++---
 .../(prototype)/production-floor/transfers/page.js | 46 ++++++++++-----
 7 files changed, 163 insertions(+), 72 deletions(-)
```

七個檔都在 `prep.md` 的範圍內。`format.js` 沒改。共用元件 `orders/_components/StatusTag.js`、mock 資料、業務邏輯都沒動。

## 六、對 Sens 測試的可能影響（未跑測試，靠讀測試檔推斷）

| 改動 | 可能影響 |
|------|---------|
| A-21 停用時按鈕名稱帶原因 | `03-payment/billing-installments.spec.mjs` 69 行等處用 `getByRole('button', { name: '取消收款項目' })`。Playwright 名稱比對預設是子字串，推斷仍會命中；未實測 |
| A-07 欄名「數量」改「搬運數量」 | 測試用 `.ant-input-number-input` 定位，不用欄名，推斷不受影響 |
| A-01、A-32 標題包進 `label` | `10-report-transfer/transfer-tickets.spec.mjs` 86 行以文字「狀態」「全部狀態」找篩選區，文字未變，推斷不受影響 |
