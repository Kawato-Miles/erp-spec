# 票 42 實測：受測者 A2 第二輪修改紀錄

依 `audit-A2.md` 的發現改一輪。工作樹 `/Users/b-f-03-029/erp/.claude/worktrees/ticket42-a2`，本機提交 `1a6bbd57`（訊息 `local: 票 42 實測甲第二輪`），基底 `6e75fa07`。路徑相對於 `apps/erp/src/app/(prototype)/`；改後行號以提交 `1a6bbd57` 為準。

結果：38 項中已改 16 項、未改 22 項。未改原因：需要 PM 決定 7 項、與 erp 不相容 6 項、超出範圍 8 項、其他 1 項。

## 一、用到的 Impeccable 指令

| 指令 | 為什麼用 | 依據原文句 |
|------|---------|-----------|
| `typeset` | audit 建議；處理字級、字重寫死值 | `typeset.md`：Typography carries information, hierarchy, and voice. Improve it inside the established visual world; do not replace the identity unless the user asked to. |
| `clarify` | audit 建議；處理錯誤呈現與篩選灰字用詞 | `clarify.md`：Rewrite unclear interface text so users understand what happened, what matters, and what to do next. |
| `layout` | audit 建議；處理寫死間距 | `layout.md`：Layout turns product priority into reading order, grouping, rhythm, and usable space. |
| `polish` | audit 規定最後一步；處理鍵盤可及、標題語意、共用格式 | `audit.md`：End with `/impeccable polish` as the final step if any fixes were recommended. |

動手前依 SKILL.md 讀了 `craft-floor.md`（原文：read [reference/craft-floor.md](reference/craft-floor.md) immediately before any UI edit, including small refinements.）。
`typeset` 與 `layout` 各要求跑一次範圍掃描（`detect --json --scope type`、`--scope layout`），改前在 8 個範圍內檔案上執行，兩者都是 `[]`。
`polish` 的前次評論快照讀取（`critique-storage latest`）沒有執行：本輪沒跑 critique，沒有快照可讀。

## 二、處置表

| 編號 | 處置 | 檔案與改後行號 | 改前 | 改後／未改原因 |
|------|------|--------------|------|---------------|
| A2-01 | 未改 | — | — | 需要 PM 決定。縮短說明會改寫事實性文案，Impeccable 要求先問（`SKILL.md`：Ask before replacing factual copy or adding claims.） |
| A2-02 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 1 項） |
| A2-03 | 已改 | `production-floor/transfers/page.js` 594、606、618、631 | `<Select allowClear style={{ width: '100%', marginTop: 4 }} placeholder="全部狀態"` | `<Select allowClear aria-label="狀態" …>`；目的產線、負責廠務、建單時間區間同樣補上 |
| A2-04 | 未改 | — | — | 超出範圍。灰色值是 AntD token（`colorTextTertiary`），由 Figma 管；同寫法在 `(prototype)/` 有 39 處 |
| A2-05 | 已改 | `production-floor/transfers/page.js` 27、673–678 | `<Typography.Text type="danger">來源任務已無效（…）：本單自動標警示、點收已擋下， 處置由生管…` | `<StyledAlert type="error" showIcon message={…點收已擋下} description="處置由生管、印務或印務主管決定——…" />`；文字未改，只拆成標題與說明並去掉多出的空白 |
| A2-06 | 已改 | `production-floor/transfers/page.js` 715、729 | `style={{ display: 'block', marginBottom: 8 }}` | `style={{ display: 'block', marginBottom: theme.spacing.xs }}` |
| A2-07 | 未改 | — | — | 超出範圍。沒有 href 的連結寫法同樣出現在共用的 `TransferTicketTable` 與其他模組，修法要由前端統一 |
| A2-08 | 未改 | — | — | 需要 PM 決定。操作名稱要照實體卡操作段，代理查不到該卡用「編輯」還是「修改」 |
| A2-09 | 未改 | — | — | 超出範圍。刷新是行為，不是呈現 |
| A2-10 | 已改 | `orders/_components/detail/billing/ReconciliationPanel.js` 31、38、66、72、80、107、133 | `<Text type="secondary" style={{ fontSize: 13 }}>` | 分項列、處理中列、差額列：`style={{ fontSize: theme.typography.bodySm.fontSize }}`（12）；卡名：`<Text type="secondary">{title}</Text>`（預設 14） |
| A2-11 | 已改 | `ReconciliationPanel.js` 134–141 | `<div style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 12px' }}>` | `fontSize: theme.typography.titleMd.fontSize`、`lineHeight: …titleMd.lineHeight`、`margin: ${theme.spacing.xs} 0 ${theme.spacing.sm}` |
| A2-12 | 已改 | `ReconciliationPanel.js` 137 | `fontWeight: 600` | `fontWeight: theme.typography.titleMd.fontWeight`（700） |
| A2-13 | 未改 | — | — | 需要 PM 決定。負數要紅字（與款項紀錄、發票一致）還是黑字（`Designs.md` 狀態色只用於狀態），兩邊都有理由 |
| A2-14 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 2 項） |
| A2-15 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 3 項） |
| A2-16 | 未改 | — | — | 超出範圍。同 A2-04，值屬 AntD token |
| A2-17 | 未改 | — | — | 超出範圍。標籤顏色由共用元件 `orders/_components/StatusTag.js` 與 `orders/mock-data.js` 狀態表提供，兩者都不能動 |
| A2-18 | 已改 | `orders/_components/detail/billing/ReceivableCard.js` 24 | `style={{ fontSize: 13, display: 'block', marginBottom: 8 }}` | `style={{ display: 'block', marginBottom: theme.spacing.xs }}` |
| A2-19 | 已改 | `ReceivableCard.js` 96–102 | `<Text strong style={{ fontSize: 18 }}>` | `fontSize: theme.typography.titleMd.fontSize`、`fontWeight: theme.typography.titleMd.fontWeight`；與上方對帳卡主數字同為 20 |
| A2-20 | 未改 | — | — | 需要 PM 決定。已取消列的呈現方式（去掉半透明、改刪除線）可能偏離正式前端 |
| A2-21 | 未改 | — | — | 超出範圍。減少可見欄位等於動欄位 |
| A2-22 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 4 項） |
| A2-23 | 未改 | — | — | 需要 PM 決定。改寫區塊說明屬事實性文案 |
| A2-24 | 未改 | — | — | 需要 PM 決定。程式註解寫「比照正式前端」，刪退款訊號可能偏離正式環境 |
| A2-25 | 已改 | `orders/_components/detail/billing/PaymentRecordSection.js` 149、153 | `<Text key={a.installment_id} style={{ fontSize: 13 }}>` | `<Text key={a.installment_id}>`；未分配列同樣拿掉 13px |
| A2-26 | 已改 | `PaymentRecordSection.js` 28、164 | ``<Text type="danger">{`-NT$ ${Math.abs(v).toLocaleString()}`}</Text>`` | `<Text type="danger">{fmtNegative(v)}</Text>`；整數金額顯示不變 |
| A2-27 | 未改 | — | — | 超出範圍。子表空狀態「沒有資料」在 `(prototype)/` 有 9 處，是跨模組慣例 |
| A2-28 | 已改 | `after-sales/page.js` 280–284、399 | `<Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>` | `style={{ fontSize: theme.typography.bodySm.fontSize }}`；值不變，改從 token 取 |
| A2-29 | 已改 | `after-sales/page.js` 295、361 | `<Typography.Text type="secondary">{formatRelativeDays(t.opened_at)}</Typography.Text>` | `render: (_, t) => formatRelativeDays(t.opened_at)`（一般文字色）；最後活動同 |
| A2-30 | 已改 | `after-sales/page.js` 424、439、454、470、485 | `<Select allowClear style={{ width: '100%', marginTop: 4 }} placeholder="全部"` | 五個控制項補上 `aria-label`（下一步動作、狀態、售後類型、接單業務、受理區間） |
| A2-31 | 未改 | — | — | 超出範圍。同 A2-04 |
| A2-32 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 1 項） |
| A2-33 | 已改 | `after-sales/page.js` 426 | `placeholder="全部"` | `placeholder="全部動作"` |
| A2-34 | 未改 | — | — | 需要 PM 決定。「編號」欄名可能沿用原型或正式環境用詞 |
| A2-35 | 已改 | `after-sales/page.js` 562–579 | `<BorderBlock $autoHeight onClick={onClick} style={{ cursor: 'pointer', … }}>` | 加上 `role="button"`、`tabIndex={0}`、`aria-pressed={active}`、Enter 與空白鍵觸發同一個 `onClick` |
| A2-36 | 已改 | `after-sales/page.js` 587–596 | `<Typography.Title level={3} style={{ margin: 0 }}>{count}</Typography.Title>` | `<Typography.Text strong style={{ fontSize: …titleLg.fontSize, fontWeight: …titleLg.fontWeight, lineHeight: … }}>{count}</Typography.Text>` |
| A2-37 | 未改 | — | — | 與 erp 不相容（見不相容紀錄第 2 項） |
| A2-38 | 未改 | — | — | 其他。欄寬重排要看改後畫面才能確認不切字；本工作樹沒裝相依套件，拍照用工作樹規定停在基底，改後無法渲染驗證 |

## 三、不相容紀錄

| # | 發現 | Impeccable 原文句與位置 | erp 原文句與位置 |
|---|------|------------------------|-----------------|
| 1 | A2-02、A2-32 搜尋框灰字 | `clarify.md`（Forms 段）：Use persistent labels; placeholders are examples, not labels.；`craft-floor.md`（Verify 段）：body and placeholder text ≥4.5:1, large text ≥3:1. | `docs/recipes/resource-page.recipe.md` 第 111 行：多條件搜尋用單一 `search` 框 + placeholder 列出條件（如 `'搜尋單號 / 客戶名稱'`），不要拆成多個搜尋框。；`Designs.md` 第 74 行：改色 / 改字體一律回 Figma 改 token 再跑 transform。**不要**在元件裡硬寫顏色。 |
| 2 | A2-14、A2-37 標籤對比 | `craft-floor.md`（Verify 段）：body and placeholder text ≥4.5:1, large text ≥3:1. | `Designs.md` 第 248 行（撰寫規則表）：狀態用 AntD Tag + 正體中文文案（對面欄「不要」：自訂狀態色塊）；第 107 行：狀態色只用於狀態（Tag / Alert / 狀態欄） |
| 3 | A2-15 卡中卡 | `craft-floor.md`（Refuse 段）：Cards are the lazy container; nested cards are always wrong. | `Designs.md` 第 155 行：需要客製版面 / 容器時，用 `packages/shared/components/common/` 既有包裝層。；`.claude/skills/prototype-from-prompt/SKILL.md` 第 17 行：產出長相 100% 等於正式環境、結構與正式頁一致,前端 handoff 才不用重做。 |
| 4 | A2-22 停用原因鍵盤取不到 | `polish.md`（Interaction and state 段）：Preserve visible keyboard focus, logical tab order, labels, and platform-appropriate touch targets. | `.claude/skills/prototype-from-prompt/SKILL.md` 第 52 行：**禁止在 prototype 就地手刻共用模式**——那會長出第二種樣式,之後要花一輪專案級統一 |

第 2 項補充：改用 erp 的語意狀態色（`warning`）會更差。`colorWarning` #eea23e 對 `colorWarningBg` #fff8eb 只有 2.01:1，比現在的金色 2.76:1 低。要達到 4.5:1 只能自訂標籤色，`Designs.md` 不允許。

## 四、偵測程式改前與改後命中數

| 掃描 | 改前 | 改後 |
|------|------|------|
| 原始碼掃描，8 個範圍內檔案（`detect-A2-base.json`、`detect-A2-after.json`） | 0 | 0 |
| `--scope type` 原始碼掃描 | 0 | 未重跑 |
| `--scope layout` 原始碼掃描 | 0 | 未重跑 |
| 渲染頁面掃描（`detect-A2-render.json`） | 23（P1 2、P2 11、P3 10） | 未重跑。本工作樹沒裝相依套件，拍照用工作樹規定停在基底 |

原始碼掃描對 `.js` 只跑正規表示式比對，改前改後都是 0。16 項已改的內容，偵測程式在原始碼模式一項都量不到。

## 五、`git diff --stat 6e75fa07`

```
 apps/erp/src/app/(prototype)/after-sales/page.js   | 46 ++++++++++++++++------
 .../detail/billing/PaymentRecordSection.js         | 16 ++------
 .../_components/detail/billing/ReceivableCard.js   | 10 ++++-
 .../detail/billing/ReconciliationPanel.js          | 31 ++++++++++-----
 .../(prototype)/production-floor/transfers/page.js | 20 ++++++----
 5 files changed, 80 insertions(+), 43 deletions(-)
```

## 六、無法確認處

- 改後畫面沒有看過。Impeccable 要求看渲染結果驗證（`SKILL.md`：Verify by looking at the rendered result at the sizes it ships at），本輪做不到。
- AntD 日期區間（`DatePicker.RangePicker`）的 `aria-label` 會落在哪個元素上，未以渲染驗證。
- 格式只用拍照用工作樹的 prettier 檢查（唯讀使用），五檔通過；沒有跑 eslint 與測試。
- 改動的文字（「全部動作」）與元素（摘要卡加按鈕角色、計數從標題改成文字）沒有對照 Sens `erp-prototype-tests` 逐條確認；代理只用關鍵字搜尋，沒找到依賴這些字或第三級標題的測試。
