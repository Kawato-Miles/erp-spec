---
type: review-knowledge
scope: shared
topic: e2e-planning
module: 跨模組
status: active
last-reviewed: 2026-05-20
---

# E2E 規劃 checklist（基於失誤案例累積）

> **定位**：累積 e2e 規劃失誤案例，提煉成 checklist 供後續 change 撰寫 Playwright spec 時對齊。
> **觸發時機**：撰寫 e2e spec 前必讀；發現 e2e 漏抓 bug 時新增案例。
> **不適用**：unit / integration test 規劃（屬不同層）。

---

## 一、規劃要素 checklist（撰寫 e2e 前對齊）

### A. 行為導向（必有）
- [ ] 主流程 happy path（建立 → 編輯 → 儲存 → store 驗證）
- [ ] 邊界情境（0 個 / N 個 / disabled）
- [ ] 角色權限（不同 role 進來看到不同）

### B. 視覺合約（**易漏，必補**）
- [ ] **元素可達性**：所有互動元件在 viewport 內**真實可見**（用 `expect(locator).toBeVisible()` 不是 `attached`）
- [ ] **scroll 行為**：列表 / popover / dialog 內 scroll 容器**用 `page.mouse.wheel()` 觸發實際 scroll**（不要用 `dispatchEvent(WheelEvent)` — synthetic event 不會改 scrollTop）
- [ ] **跨 portal 互動**：popover-in-dialog / tooltip-in-popover 等巢狀 portal 場景**必加 case** 驗證 scroll / focus / wheel event 不被外層攔截
- [ ] **取最後一個元素**：用 `.last()` 或 `.nth(-1)` 而非只測 `.nth(0)~.nth(2)`，強制需要 scroll 才能 reach

### C. 跨檔副作用
- [ ] e2e 跑完所有既有 spec 確認無 regression（`npx playwright test`）
- [ ] 對共用元件的修改驗證其他模組使用點未壞（如 NoteTemplatePopover 將來被其他模組用時）

---

## 二、案例庫

### 案例 1：NoteTemplatePopover scroll bug 沒抓到（2026-05-20）

**情境**：
- change：`add-order-note-section-with-template-tool`
- 元件：`NoteTemplatePopover`，10 條模板列表渲染於 `max-h-[480px]` flex column 內
- 結構：Popover 在 Dialog 內（巢狀 portal）

**失誤現象**：
e2e 6 個 case 全綠通過，但 Miles 實際操作時發現「滑鼠滾輪在 popover 內無法滾動列表」。

**根本原因**：
1. e2e 用 `labels.nth(0)` `labels.nth(1)` 操作前 2-3 條 — 剛好都在 viewport 內、不需 scroll → 漏抓「scroll 不可用」這個 bug
2. 沒有「取最後一條 label」test case — 列表第 5 條之後就需要 scroll 才能 reach
3. 沒測「巢狀 portal wheel event 攔截」 — Radix Dialog 預設攔截 wheel event 阻止 outer scroll，但**也會誤殺 popover 內 list 的 wheel scroll**（Radix issue #1159 已知行為）

**修法**：
- list 容器加 `onWheel={(e) => e.stopPropagation()}` 阻止 dialog 攔截
- 業界主流 fix（多個 Radix issue 推薦）

**教訓**：
- **行為測試 ≠ 視覺合約測試**：「能勾選 + 能插入」不代表「列表完整可見、所有條目能 reach」
- **巢狀 portal 是 e2e 高風險區**：popover-in-dialog 必加 wheel / focus / overflow 互動 case
- **Synthetic WheelEvent 無效**：要用 Playwright `page.mouse.wheel()` 真實觸發

**檢出方式**：
真實使用者操作。e2e 仍未涵蓋（需擴充）。

**衍生擴充 e2e**：
- `add-order-note-section-with-template-tool` 補測：點 `labels.last()` + 驗證 scroll 後可見 + `mouse.wheel` 觸發 scrollTop 變化

---

## 三、Playwright API 提醒

### 觸發真實 scroll

```ts
// ❌ 不會改 scrollTop（synthetic event）
await element.dispatchEvent(new WheelEvent('wheel', { deltaY: 200 }));

// ✅ 真實觸發（瀏覽器原生）
await page.mouse.move(x, y);  // 先 hover 到目標容器
await page.mouse.wheel(0, 300);  // deltaX, deltaY

// ✅ 或直接設 scrollTop（測 scroll target，非 wheel event）
await element.evaluate((el) => { el.scrollTop = 300; });
```

### 取最後元素 / 強制 scroll

```ts
const allLabels = popover.locator('label');
const lastLabel = allLabels.last();
await lastLabel.scrollIntoViewIfNeeded();  // 確保可見
await lastLabel.click();
await expect(lastLabel).toBeVisible();
```

### 驗證 overflow / scroll height

```ts
const { clientH, scrollH } = await container.evaluate((el) => ({
  clientH: el.clientHeight,
  scrollH: el.scrollHeight,
}));
expect(scrollH).toBeGreaterThan(clientH);  // 確實 overflow，需 scroll
```

---

## 四、檢測模式對照（avoid these patterns）

| Anti-pattern | 風險 | 改進 |
|------|------|------|
| 全測 `nth(0)~nth(2)` | 漏抓「後面條目需 scroll 才能 reach」 | 至少測 `last()` 一次 |
| `dispatchEvent(WheelEvent)` 模擬滾動 | synthetic event 不改 scrollTop | 用 `page.mouse.wheel()` |
| 只驗證 store state | 漏抓「UI 渲染 / overflow / portal 行為」| 補 `expect(locator).toBeVisible()` |
| 只測單一 portal | 漏抓「巢狀 portal 互動 bug」 | 對 dialog-in-popover / popover-in-dialog 加專屬 case |
| selector 用 viewport 假設 | viewport 外的元素 e2e 不會 click | 用 `scrollIntoViewIfNeeded()` 確保 reach |

---

## 五、引用此 checklist

撰寫 e2e spec 前對齊 § 一 + § 三；發現新失誤案例補入 § 二。

## 六、來源

- 案例 1：`add-order-note-section-with-template-tool` change apply 階段 implementation feedback（2026-05-20）
- Radix Popover-in-Dialog scroll 攔截：[GitHub issue #1159](https://github.com/radix-ui/primitives/issues/1159) 等
- Playwright wheel API：[docs.playwright.dev/.../mouse-wheel](https://playwright.dev/docs/api/class-mouse#mouse-wheel)
