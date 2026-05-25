## Context

`add-review-rounds-to-print-item-side-panel`（已 archive）apply 階段已重做 PrintItemDetailSidePanel 移除 ErpDetailCard 外框並改用 ErpInfoTable inline，但 Miles 視覺對比 Figma node-id `8977:269607` 後發現 7 處差異 + 要求把 SidePanel 內容抽成跨模組共用元件 + 寫 DESIGN.md 作為後續驗收標準。

本變更：建立 `src/components/side-panel/` 內 5 個元件，**改動 1 行 ErpSidePanel SIZE_CLASS**（加 `'2xl': 'sm:max-w-[800px]'`），改寫 PrintItemDetailSidePanel 作為元件庫示範，新增 DESIGN.md §1.5 章節。**不動既有 ErpInfoTable / ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard / ErpSummaryGrid**（這些有 8+ 個既有消費點）。

## Goals / Non-Goals

**Goals:**
- Figma node-id `8977:269607` 視覺像素級對齊（寬度 / section 間距 / 分隔線 / 標題字級 / 檔案 chip / 縮圖）
- 5 個 SidePanel 共用元件可被其他模組組合出對齊 Figma 規範的 SidePanel layout
- DESIGN.md §1.5 規範作為「後續 SidePanel 開發驗收標準」，避免重複自寫樣式
- 編輯型 SidePanel 豁免（不強制 form 場景套同一規範）

**Non-Goals:**
- **不**修改既有 ErpInfoTable / ErpDetailCard / ErpSummaryGrid / PrintItemSpecCard / PrintItemArtworkCard 元件 API
- **不**修改 ErpSidePanel sm/md/lg/xl/full 既有 size variant
- **不**修改 `.erp-table` CSS class
- **不**遷移其餘 7 個 SidePanel 消費點（漸進遷移、DESIGN.md 註明）
- **不**處理編輯型 SidePanel form layout
- **不**新增 ReviewRound 模型 / 任何業務語意變更

## Decisions

### D1：元件 API 設計

放 `src/components/side-panel/`，barrel 匯出 `index.ts`。5 個元件：

**1. `SidePanelBody`** — body 容器：管理 padding（px-6 py-5）+ section 間距（16px + 1px hr + 16px）+ 自動省略最後 section 底 hr

```ts
interface SidePanelBodyProps {
  children: React.ReactNode;
  className?: string;
}
```

實作要點：`React.Children.toArray` + `index < count - 1` 控制 hr；section 之間插 `<hr className="border-t border-[#e3e4e5] my-4" />`（16px margin + 1px hr）。

**2. `SidePanelSection`** — title (h3 text-base font-semibold / 24h line-height) + 12px gap + children + 可選 hint Tooltip / action 按鈕

```ts
interface SidePanelSectionProps {
  title: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

實作要點：title row `flex items-center justify-between gap-2 mb-3`（12px = mb-3）；title `<h3 className="text-base font-semibold">`；hint 沿用 ErpInfoTable Info icon + Tooltip pattern。

**3. `SidePanelInfoTable`** — **直接 re-export** ErpInfoTable，不做 thin wrapper

```ts
export { ErpInfoTable as SidePanelInfoTable, type ErpInfoItem as SidePanelInfoItem } from '@/components/layout/ErpInfoTable';
```

理由：ErpInfoTable 已對齊 Figma（label 120w / px-4 py-2 / rounded-lg / `#e3e4e5` border）、無 SidePanel 特化需求；re-export 為「在 SidePanel context 用 SidePanel* 前綴」的一致性。未來特化需求出現再升級 wrapper（YAGNI）。

**4. `SidePanelFileList`** — 檔案 chip list（attach_file icon 20x20 + 檔名 14px text-primary link），垂直疊放、僅處理檔案 chip 視覺

```ts
interface SidePanelFile {
  id: string;
  filename: string;
  fileUrl: string;
}

interface SidePanelFileListProps {
  files: SidePanelFile[];
  emptyText?: string;  // 預設 '—'
}
```

實作要點：固定 `flex flex-col gap-1`（垂直疊放、4px 間距）；**不**支援 horizontal layout 或縮圖渲染——縮圖場景請用 `SidePanelThumbnailList`（單一職責、避免 API 重疊；三視角審查 erp-consultant 必修 2）。

**5. `SidePanelThumbnailList`** — 縮圖 list（固定 48x48 / gap 4px / horizontal）

```ts
interface SidePanelThumbnail {
  id: string;
  src: string;
  alt: string;
  href?: string;
}

interface SidePanelThumbnailListProps {
  thumbs: SidePanelThumbnail[];
  size?: number;        // 預設 48
  emptyText?: string;
}
```

實作要點：`flex flex-row items-center gap-1`（gap-1 = 4px）；image `w-12 h-12 rounded border border-[#e3e4e5]`（w/h 12 = 48px）。

### D2：ErpSidePanel size=2xl 擴充（1 行新增）

`src/components/layout/ErpSidePanel.tsx`：

```diff
- export type ErpSidePanelSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
+ export type ErpSidePanelSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  const SIZE_CLASS: Record<ErpSidePanelSize, string> = {
    sm: 'sm:max-w-[480px]',
    md: 'sm:max-w-[560px]',
    lg: 'sm:max-w-[600px]',
    xl: 'sm:max-w-[720px]',
+   '2xl': 'sm:max-w-[800px]',
    full: 'w-[90vw] max-w-none sm:max-w-none',
  };
```

既有 sm/md/lg/xl/full 完全不動、向後相容。

### D3：PrintItemDetailSidePanel 改寫策略

結構大綱（4 section）：
1. **印件資訊** → `SidePanelSection` 包 2 個 `SidePanelInfoTable`（systemItems 單欄 + printItemItems cols=2）
2. **印件檔案** → `SidePanelSection` 包 1 個 `SidePanelInfoTable`，cell value 為 `<SidePanelFileList kind='file'>` / `<SidePanelThumbnailList>` 取代既有 FileChips inline helper
3. **相關工單** → `SidePanelSection` 直接放 `<table className="erp-table">`
4. **審稿紀錄** → 同 section 3

異動：
- size `xl` → `2xl`
- 移除 inline `FileChips` helper（連同 FileText / Download lucide icon import — 改由 SidePanelFileList 內部 attach_file icon）
- 新增 import：`SidePanelBody / SidePanelSection / SidePanelInfoTable / SidePanelFileList / SidePanelThumbnailList`
- 保留：headerTitle / headerActions / early return / data preparation block（systemItems / printItemItems / sourceFiles / processedFiles / thumbFiles）

### D4：編輯型 SidePanel 豁免規則

「詳情預覽型 SidePanel」（列表頁「檢視」觸發）SHALL 用 SidePanelBody + SidePanelSection。「編輯型 SidePanel」（新增 / 編輯 form）SHALL 繼續用 ErpEditFormCard + ErpFormField，**豁免** SidePanelBody / SidePanelSection 規範。

識別判準（寫入 DESIGN.md §1.5.2）：
- 詳情預覽型：列表頁 row「檢視」按鈕觸發、內容為唯讀資訊呈現
- 編輯型：新增 / 編輯 form、有 Save / Cancel 按鈕、用戶輸入為主

混合型（資訊預覽 + 表單）暫不規範、未來需求出現時加。

### D5.5：DESIGN.md §0.1 line 52 同步修訂（erp-consultant 必修 1）

DESIGN.md §0.1 line 52 末段既有「Side Panel 內容結構：依詳情頁 §0.1『涉及印件的詳情頁三分類區塊』原則沿用既有共用元件（如 PrintItemSpecCard / PrintItemArtworkCard）+ 工單清單 / 任務清單表格」，與本變更 §1.5 禁用事項「SHALL NOT 使用 PrintItemSpecCard / PrintItemArtworkCard」直接矛盾。tasks § 4.0 修訂為「採用 §1.5 SidePanel 元件組（SidePanelBody / Section / InfoTable / FileList / ThumbnailList），SHALL NOT 沿用詳情頁專用卡（ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard）」。

### D6：接受 Rule of Three premature abstraction trade-off

三視角審查 ceo-reviewer 提出 challenge：本變更實際 consumer = 1（PrintItemDetailSidePanel），其餘 7 個 SidePanel 全為編輯型豁免，從 Rule of Three（Martin Fowler）角度屬於 premature abstraction，建議砍掉元件抽取、保留 DESIGN.md 規範即可。

**Miles 拍板（plan 階段已決）**：維持元件化路線。理由：
1. 「驗收標準寫入 DESIGN.md 確保後續 SidePanel 不會自己再寫樣式出來」是 Miles plan 明確訴求
2. 元件化 + 規範化雙軌可降低未來 SidePanel 開發時的「視覺對齊驗收」迭代成本（Miles 個人時間痛點）
3. PrintItemDetailSidePanel 在 add-review-rounds-to-print-item-side-panel change apply 階段已迭代 ≥ 3 次仍不齊，本變更建立規範 + 元件雙軌避免下次重蹈
4. 未來新增詳情預覽型 SidePanel（如工單詳情 / 諮詢單詳情 SidePanel）為合理預期 backlog，雖無精確時程承諾

**Trade-off 承諾**：若元件 API 在第 2-3 個真實 consumer 出現時不符實際需求（如 SidePanelInfoTable 需要 SidePanel 特化 padding / SidePanelFileList prop 缺彈性），**將重構 API 而非保留向後相容包袱**——元件目前處於 prototype 階段、API 變動不視為 breaking change。

### D5：DESIGN.md §1.5 章節結構

5 子節：
- §1.5.1 元件清單（5 個元件 + 用途表）
- §1.5.2 使用情境（詳情預覽型 vs 編輯型；明示豁免）
- §1.5.3 驗收清單（≥ 13 項可驗證視覺特徵）
- §1.5.4 禁用事項（≥ 6 項 anti-pattern）
- §1.5.5 範例（2 個 code snippet：完整 SidePanel + 單獨 Section；註明「漸進遷移」）

原 §1.5「專用 CSS class」重編為 §1.6。

## Risks / Trade-offs

| 風險 | Mitigation |
|------|-----------|
| **R1**：SidePanelInfoTable re-export 而非 wrapper、未來若 SidePanel 內 ErpInfoTable 需特化（如 cell padding 改變），需重構為 wrapper | 接受 YAGNI 風險；特化需求出現時改 thin wrapper 對既有 import 無影響（type 與名稱不變）|
| **R2**：5 個元件 + 1 個示範消費點，其餘 7 個 SidePanel 仍用舊樣式（漸進遷移），短期 SidePanel 視覺不一致 | DESIGN.md §1.5 明示「漸進遷移」、新 SidePanel 必用新規範；舊 SidePanel 由各自模組 PR 漸進遷移、不在本變更 scope |
| **R3**：DESIGN.md §1.5 規範若不嚴格執行，後續 SidePanel 仍可能自寫樣式分歧 | 驗收清單 ≥ 13 項可驗證 + 禁用事項 ≥ 6 項明示，後續 review 可逐項對照；e2e 內加 dialog width / hr count / 檔案 chip layout 斷言 |
| **R4**：編輯型 SidePanel 豁免規則可能在「混合型」場景產生爭議 | 豁免規則明示適用範圍（純編輯 form），混合型暫不規範、未來需求出現時走新 change |
| **R5**：本變更與已 archive 的 add-review-rounds-to-print-item-side-panel 在 spec 上有雙重 MODIFIED（同 Requirement 兩次）| 接受；OpenSpec workflow 允許同 Requirement 多次 MODIFIED；archive 後 Requirement 反映兩次合併結果 |

## Migration Plan

不適用（純 UI / 元件抽取、無資料遷移）。

## Open Questions

無新 OQ。其餘 7 個 SidePanel 漸進遷移時程不在本變更 scope（屬未來各自模組 PR 範疇）。
