# Design System（照 interface-design 範本存檔；數值全部取自 erp Designs.md）

本檔依 interface-design 完成後「存檔」的要求產出，只存在本試驗資料夾，不寫進 erp。
erp 的設計正本是 `Designs.md`，本檔只轉錄，不另立規範。

## Direction

**Personality:** Precision & Density（工廠辦公室的調度清單）
**Foundation:** neutral（白容器、中性灰、單一藍主色）
**Depth:** borders-only（表格外框 1px 邊）

## Tokens

### Spacing
Base: 8px
Scale: 8, 12, 16, 24, 32, 48（Designs.md §5 spacing）

### Colors
```
--foreground: colorText
--secondary: colorTextSecondary
--muted: colorTextTertiary
--faint: colorTextQuaternary
--accent: colorPrimary（accent 500）
```
狀態色（colorSuccess、colorWarning、colorError）只用於狀態標籤與提示。

### Radius
Scale: AntD 元件 6px；容器（TableBlock、BorderBlock）12px

### Typography
Font: Noto Sans TC
Scale: 12, 14 (base), 16, 20, 24
Weights: 400, 500, 700

## Patterns

本次未建畫面，不記元件尺寸。元件選型由 prototype-from-prompt 依 `docs/component-catalog.md` 與配方決定。

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 視覺數值全部沿用 Designs.md | erp 規定新需求延伸既有風格、不另立一套 | 2026-11-14 |
| 色彩世界不轉成配色 | erp 用色紀律為白、中性灰、單一藍主色 | 2026-11-14 |
