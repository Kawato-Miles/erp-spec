# Design: remove-after-sales-responsibility-and-soften-closure

## Context

售後服務單設計憲章：「本身不直接改錢——錢與貨的動作掛在底下的訂單異動單與補印印件」（[售後服務實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/售後服務.md)）。責任歸屬欄位是唯一「宣稱驅動錢、卻與執行解耦」的欄位（spec 已明定不自動帶建補收異動單），移除後系統回歸單一真相。設計已由 Miles 於 2026-07-20 全數拍板（方案 A 行為驅動、軟提示結案、出貨完成錨點、AFT-5 解答），本 design 只記錄取捨脈絡，無待決事項。

## Goals / Non-Goals

### Goals

- spec 三份（after-sales-ticket / business-scenarios / prototype-data-store）與 wiki 正本對齊：無責任歸屬引用、結案軟提示、AFT-10 留痕規則
- 補印收費判斷改為行為驅動：收費事實＝售後單下有無補收異動單
- Prototype 移除欄位與相關 UI（篩選器、表格欄、詳情顯示）

### Non-Goals

- 不新增「補印收費」衍生顯示欄（Miles 2026-07-20 拍板不做）
- 不做「公司認賠金額」管理切片欄位或圖表（dashboard 屬後驗 epic，本次僅確保可由退款異動單總額＋售後類型推導）
- 不動退款三組件的帳務規則本體（異動單審核、退款款項、折讓／作廢的規則不變，只改結案閘門行為）
- 不動售後類型（case_category）七值列舉

## Decisions

### 決策 1：收費判斷載體——方案 A（行為驅動）而非方案 B（決議五值細化）

- 方案 A（採用）：決議處理方式維持四值（不處理／退款／補印／退款+補印），收費事實由「有無建補收異動單」承載。
- 方案 B（否決）：決議細化為五值（免費補印／付費補印分開）。否決理由：把「誰付錢」從一個欄位搬到另一個欄位，雙寫打架未解決；表達不了共同分擔與混合情境；違反業界售後（RMA）「處理方式與計價正交、計價走帳務側」慣例（erp-consultant 2026-07-20 輕量審查）。
- 忘建補收異動單的兜底：既有「我的售後服務」下一步動作欄「待建關聯動作」分組已涵蓋（決議含補印但下游未建動作時提示），不需新機制。

### 決策 2：結案模型——軟提示取代硬阻擋

- 採用：結案時列出未完結項目（未完結異動單、未出貨完成的補印印件）提醒，業務確認後仍可結案。
- 否決（原 spec 硬阻擋）：三組件未完成不可結案、按鈕鎖定。否決理由：「處理完沒」只有業務看全貌才知道，系統資訊不足以擋人；漏做退款有三方對帳「應退差額警示（不可忽略）」兜底，不會無聲消失。
- delta op 紀律:硬阻擋的兩個 Requirement（三組件組合、三組件進度展示）與狀態機 Requirement 以 **MODIFIED** 改寫（supersession，禁 ADDED），避免歸檔後主 spec 軟硬兩套並存。

### 決策 3：補印提醒錨點——印件「出貨完成」

- 採用「出貨完成」：與 spec 既有「補印印件出貨完成 SHALL NOT 自動結案」用語一致、印件印製維度既有狀態、改動最小。
- 否決「出貨單送達確認」：送達屬出貨單／物流維度，guard 需跨實體取狀態，複雜度不對稱。

### 決策 4：AFT-10 留痕規則落點

- 新增獨立 Requirement「客訴內容與結案後客戶回饋修改留痕」：兩欄任何階段（含結案後）可改，每次修改寫入活動紀錄（修改人／時間／修改前後全文）。
- 補述紀錄（additional_complaint_log）維持唯增不可改，與留痕欄位區隔（前者是累加紀錄、後者是可覆寫欄位＋審計軌跡）。

## Risks / Trade-offs

- [列表失去責任歸屬篩選] → 篩選需求由售後類型（case_category）承接；主管切片由退款異動單總額推導，dashboard epic 再驗證維度
- [強制結案後下游未完結] → 三方對帳應退差額警示兜底（[對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/共用規則/對帳一致性.md)）；提醒與確認寫入活動紀錄供事後究責
- [歷史 mock 資料含 responsibility] → Prototype 假資料同批清除，無正式資料遷移問題（Prototype 階段無真實資料）

## Migration Plan

1. spec delta 撰寫（本 change specs/）
2. `/opsx:sync` 將 delta 合入 main specs（供 Linear 交付引用）
3. Prototype 依 tasks 移除欄位與 UI、更新測試（先紅後綠）
4. `/opsx:verify` 後歸檔

## Open Questions

（無——設計決策已全數拍板；相關未解 OQ 見 proposal § Impact，均不阻擋本 change）
