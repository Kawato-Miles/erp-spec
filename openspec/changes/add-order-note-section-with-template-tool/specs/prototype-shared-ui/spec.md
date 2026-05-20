## ADDED Requirements

### Requirement: NoteTemplatePopover 共用元件

`NoteTemplatePopover` SHALL 為可重用 molecule，提供「點按鈕 → 跳出 Popover → 多選 seed 模板 → 組合文字 → 通知父元件 append 至 textarea」的工作流。元件位於 `sens-erp-prototype/src/components/shared/NoteTemplatePopover.tsx`，可掛在任意 textarea 欄位旁使用。

元件 SHALL 提供以下 API：

```ts
interface NoteTemplate {
  id: string;
  label: string;
  text: string;
}

interface NoteTemplatePopoverProps {
  templates: NoteTemplate[];
  currentValue: string;
  onInsert: (combinedText: string) => void;
  buttonLabel?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
}
```

- `templates`：該欄位適用的全部模板清單
- `currentValue`：textarea 現值（用於父元件 append 行為，元件本身不直接修改）
- `onInsert`：使用者點「插入」時的 callback，元件傳回**勾選模板 text 用 `\n` 串接的字串**；父元件負責 `newValue = currentValue ? currentValue + '\n' + combinedText : combinedText`
- `buttonLabel`：觸發按鈕文字，預設「插入常用備註」
- `align`：Popover 對齊方向，預設 `'end'`（貼欄位右側展開）
- `disabled`：與 textarea 同步 disabled，預設 `false`

元件結構 SHALL 包含：
- **觸發按鈕**：`Button variant="ghost" size="sm"` + FileText icon + `buttonLabel`
- **PopoverContent**：寬 420px、max-height 480px overflow-y-auto
  - **Header**：說明文字「勾選後按『插入』追加至備註尾端」+ 「全部清除」連結（僅在有勾選時顯示）
  - **Checkbox List**：每列含 Checkbox + label 文字 + hover 時顯示前 60 字預覽（`line-clamp-2`）
  - **Footer**：「取消」按鈕 + 「插入 N 條」主按鈕（N=0 時 disabled）

#### Scenario: 點觸發按鈕開啟 Popover

- **GIVEN** NoteTemplatePopover 掛在某 textarea label 列右側
- **AND** disabled = false
- **WHEN** 使用者點「插入常用備註」按鈕
- **THEN** Popover SHALL 從按鈕下方彈出（align='end' 預設貼右側）
- **AND** Popover SHALL 顯示 templates prop 傳入的所有模板項目（Checkbox + label）
- **AND** 所有 Checkbox SHALL 預設未勾選

#### Scenario: 勾選多個模板後插入

- **GIVEN** Popover 已開啟、顯示 10 條模板
- **WHEN** 使用者勾選 3 條模板
- **THEN** Footer 主按鈕 SHALL 顯示「插入 3 條」、enabled 狀態
- **WHEN** 使用者點「插入 3 條」按鈕
- **THEN** 元件 SHALL 呼叫 `onInsert(text1 + '\n' + text2 + '\n' + text3)`
- **AND** Popover SHALL 關閉
- **AND** Toast 通知 SHALL 顯示「已插入 3 條模板」（2-3 秒）

#### Scenario: 父元件負責 append 行為

- **GIVEN** currentValue = "業務已先確認交期"（非空字串）
- **WHEN** 元件呼叫 onInsert("★ 預估工作天 15-18 天")
- **THEN** 父元件 SHALL 將 textarea 值更新為 `"業務已先確認交期\n★ 預估工作天 15-18 天"`
- **AND** 元件本身 MUST NOT 直接修改 textarea state

#### Scenario: currentValue 為空時不前置換行

- **GIVEN** currentValue = ""
- **WHEN** 元件呼叫 onInsert("★ 全額付款 3-5 工作天")
- **THEN** 父元件 SHALL 將 textarea 值更新為 `"★ 全額付款 3-5 工作天"`（無前置 `\n`）

#### Scenario: 0 條勾選時插入按鈕 disabled

- **GIVEN** Popover 開啟、無任何勾選
- **THEN** Footer 主按鈕 SHALL 顯示「插入 0 條」、disabled 狀態
- **AND** 使用者點擊 MUST NOT 觸發 onInsert

#### Scenario: Popover 關閉後不保留勾選狀態

- **GIVEN** Popover 開啟、使用者勾選 2 條後點「取消」或按 ESC
- **THEN** Popover SHALL 關閉
- **AND** 下次開啟時所有 Checkbox SHALL 重新預設為未勾選

#### Scenario: disabled prop 為 true 時按鈕禁用

- **GIVEN** disabled = true
- **THEN** 觸發按鈕 SHALL 顯示為 disabled 狀態
- **AND** 使用者點擊 MUST NOT 開啟 Popover

#### Scenario: 鍵盤可達性

- **GIVEN** 使用者用 Tab 鍵聚焦到觸發按鈕
- **WHEN** 使用者按 Enter
- **THEN** Popover SHALL 開啟、焦點移至第一個 Checkbox
- **WHEN** 使用者按上下方向鍵或 Tab 鍵
- **THEN** 焦點 SHALL 在 Checkbox 列表中移動
- **WHEN** 使用者按 Space
- **THEN** 當前焦點 Checkbox SHALL 切換勾選狀態
- **WHEN** 使用者按 ESC
- **THEN** Popover SHALL 關閉、焦點返回觸發按鈕

#### Scenario: Hover 顯示模板預覽

- **GIVEN** Popover 開啟、列表顯示模板項目
- **WHEN** 使用者 hover 某 Checkbox 列的 label
- **THEN** label 下方 SHALL 顯示該模板 text 的前 60 字預覽（`line-clamp-2`、`text-muted-foreground`）

---

### Requirement: Form Field Label 右側 Trailing Action Button 規範

ERP Prototype 的 form field（textarea / input）label 列右側 SHALL 可放置「操作按鈕」（如「插入常用備註」「智能填寫」等），補充既有 Info icon + Tooltip 規範。所有 trailing action button SHALL 遵守以下視覺與行為合約：

- **樣式**：使用 `Button variant="ghost" size="sm"`，保持輕量、不搶 textarea 視覺焦點
- **位置**：放在 label 列最右側；若同時有字數計數，按鈕在計數左邊（次序：label → 按鈕 → 計數）
- **對齊**：與 label 文字 baseline 對齊；多個輔助按鈕排列使用 `gap-2` 間距
- **disabled 同步**：按鈕 disabled 條件 MUST 與對應 textarea / input 的 disabled 條件同步
- **icon 規範**：可帶 lucide-react icon（`h-3.5 w-3.5 mr-1`），icon 應與按鈕語意對應（如「插入模板」用 FileText、「智能填寫」用 Sparkles）
- **與 Info icon 共存**：若 label 同時需要 Info icon（hint）與 trailing action button，Info icon 緊鄰 label 文字右側、trailing button 放在最右側

#### Scenario: textarea label 列同時含 Info icon 與 trailing action button

- **GIVEN** textarea 的 label 為「付款備註」、含 hint「訂單階段補充的付款條件」、字數上限 500
- **WHEN** 元件渲染
- **THEN** label 列 SHALL 依序排列：「付款備註」 + Info icon（hint Tooltip）+ flex spacer + 「插入常用備註」按鈕 + 「N / 500」字數計數

#### Scenario: textarea disabled 時 trailing action button 同步 disabled

- **GIVEN** textarea disabled = true
- **THEN** trailing action button SHALL 顯示為 disabled 狀態
- **AND** 使用者點擊 MUST NOT 觸發任何動作

#### Scenario: 多個輔助按鈕的排列

- **GIVEN** textarea label 列同時含「插入常用備註」與「智能填寫」兩個 trailing action button
- **THEN** 兩按鈕 SHALL 使用 `gap-2` 間距排列、左對齊於 flex spacer 右側
