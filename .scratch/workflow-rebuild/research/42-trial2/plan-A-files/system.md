# Design System（諮詢單，照 interface-design 的 system-template 格式）

本檔是方法「完成後存檔」步驟的產出。值一律取自 erp 規範，方法自訂的值不採用。

## Direction

**Personality:** Utility & Function（預約簿式的受理畫面）

**Foundation:** neutral（erp 中性灰；方法建議的暖色基調被 erp 規範排除）

**Depth:** borders-only（erp 容器既有的 neutral[200] 實線邊框）

## Tokens

### Spacing
Base: 8px（erp `theme.spacing`）
Scale: 8, 12, 16, 24, 32, 48

### Colors
```
--foreground: theme.antd.token.colorText
--secondary:  theme.antd.token.colorTextSecondary
--muted:      theme.antd.token.colorTextTertiary
--faint:      theme.colors.neutral[200]
--accent:     theme.colors.accent[500]
```
狀態標籤：待諮詢 processing（藍）、完成諮詢 success（綠）、已轉需求單 purple（點綴）、已取消 default（灰）。

### Radius
Scale: 6px（AntD 元件）、12px（容器）

### Typography
Font: Noto Sans TC（erp 固定）
Scale: 12, 14（base）, 16, 20, 24（erp typography token）
Weights: 400, 500, 700

## Patterns

### 清單頁
- 外框：GenericFilter（搜尋加篩選）＋ StatCards（四狀態計數）＋ TableBlock
- 預設排序：待諮詢依預約時段由近到遠，其後終態依預約時段由新到舊
- 未認領：諮詢人員欄顯示「未認領」標籤

### 明細頁
- 標頭：BorderBlock，左側返回鈕、標題、狀態標籤；右側操作鈕，主色鈕最多一顆
- 分區：PanelBlock，依序「預約與客戶資料」「客戶原話｜諮詢人員筆記」「受理與結果」「活動紀錄」
- 對照區：兩欄等寬，左欄唯讀、右欄可撰寫

### 操作容器
- 編輯：PanelDrawer（edit 模式）
- 取消、代派、改派：PanelDialog
- 完成諮詢、轉需求單：ConfirmModal 的 getConfirmModalConfig

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 依預約時段排序 | 諮詢人員關心下一位客戶何時到 | 2026-11-14 |
| 客戶原話與筆記並排 | 客戶指示唯讀可追溯、內部紀錄另起一欄 | 2026-11-14 |
| 顏色字型全沿用 erp | erp 規範禁止自訂色票與字級 | 2026-11-14 |
