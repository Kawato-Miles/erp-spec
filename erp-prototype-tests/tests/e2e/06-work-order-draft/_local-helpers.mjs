// 第六章共用的小工具（尚未進 _helpers.mjs 的候選）：只做選單、對話框與表格列的定位，
// 不含任何情境語意。AntD 的結構類名只在本檔使用（撰寫規約第 5 條）。
import { expect } from '@playwright/test';

// 目前開著的 AntD 下拉（排除收合中的那些）
const openDropdown = (page) =>
  page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();

/** 在指定的下拉選單挑一個選項（選項數少、非虛擬捲動時適用） */
export async function pickOption(page, select, label) {
  await select.click();
  await openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first().click();
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
  // 以 placeholder 認人的下拉選完值後就不再命中原本的定位條件，這種情形略過值的驗證
  if ((await select.count()) === 1) {
    await expect(select.locator('.ant-select-selection-item')).toContainText(label);
  }
}

/**
 * 點列表上的單據編號進詳情（AntD Typography.Link 無 href，故以文字定位）。
 * 頁面剛載入、React 尚未接手時的點擊會沒有反應，故重試到網址真的換頁為止。
 */
export async function openByNo(page, no, urlPattern = /detail/) {
  const link = page.getByText(no, { exact: true }).first();
  // 開發伺服器首次進某個路由要即時編譯，換頁可能要十幾秒，故單次等待放寬
  for (let i = 0; i < 3; i += 1) {
    await link.click();
    try {
      await page.waitForURL(urlPattern, { timeout: 20_000 });
      return;
    } catch {
      // 沒換頁就再點一次
    }
  }
  throw new Error(`點了 ${no} 三次仍未進入詳情頁`);
}

/** 表格中含指定文字的那一列 */
export function rowOf(scope, text) {
  return scope.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();
}

/** 展開母子表的某一列（以列上的文字認人） */
export async function expandRow(page, text) {
  const row = rowOf(page, text);
  await row.locator('.ant-table-row-expand-icon').first().click();
}

/** 目前開著的對話框（Modal 或 PanelDialog） */
export const dialog = (page) => page.locator('.ant-modal-content:visible').last();

/** 目前開著的側板（PanelDrawer） */
export const drawer = (page) => page.locator('.ant-drawer-content:visible').last();

/** 切到詳情頁的某個頁籤（頁籤標題可能帶筆數，故用開頭比對） */
export async function openTab(page, label) {
  await page.locator('.ant-tabs-tab', { hasText: label }).first().click();
}

// AntD 會在兩個中文字的按鈕文字中間插入空白（「改 派」），
// 故按鈕一律以「字元間可有空白」的規則比對，不用完全相等
export const spaced = (label) => new RegExp(`^${label.split('').join('\\s*')}$`);

/** 依按鈕文字取按鈕（容忍 AntD 的中文字間空白） */
export function button(scope, label) {
  return scope.getByRole('button', { name: spaced(label) });
}

/**
 * 情境明寫「重整頁面」時用：整頁重載讓模擬資料回到起點，再把角色切回來。
 * 重載後 React 尚未接手前送出的鍵盤事件會掉，故先等頁面靜止再切角色。
 */
export async function reloadAs(page, roleLabel, switchRole) {
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('header .ant-select-selection-item').first()).toBeVisible();
  await retry(() => switchRole(page, roleLabel), page);
}

/** 重試三次：頁面剛載入時 React 尚未接手，第一次的點擊或鍵盤事件可能整組掉了 */
export async function retry(fn, page, times = 3) {
  for (let i = 0; i < times; i += 1) {
    try {
      await fn();
      return;
    } catch (e) {
      if (i === times - 1) throw e;
      await page.waitForTimeout(800);
    }
  }
}


/**
 * gotoInApp 的重試包裝：頁面剛換角色或剛重載時的第一次點擊可能沒反應；
 * 開發伺服器首次進某個路由要即時編譯，換頁本身也可能超過 gotoInApp 內建的等待。
 */
export async function goInApp(page, path, gotoInApp) {
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${esc}/?(\\?|$)`);
  for (let i = 0; i < 3; i += 1) {
    try {
      await gotoInApp(page, path);
      return;
    } catch (e) {
      try {
        await page.waitForURL(pattern, { timeout: 20_000 });
        return;
      } catch {
        if (i === 2) throw e;
      }
    }
  }
}

/**
 * openAs 的重試包裝：整頁載入後 React 尚未接手時，切角色的鍵盤事件會整組掉，
 * 導致角色停在預設的業務。第一次沒切成就再切一次（不再重載，記憶體狀態不動）。
 */
export async function openScenario(page, roleLabel, path, { openAs, switchRole }) {
  try {
    await openAs(page, roleLabel, path);
  } catch {
    await retry(() => switchRole(page, roleLabel), page);
  }
}

/** 活動紀錄時間軸中含指定文字的那一筆 */
export function activityItem(page, text) {
  return page.locator('.ant-timeline-item-content').filter({ hasText: text });
}

/**
 * 停在停用的按鈕上讀 Tooltip 文字：停用的按鈕本身不觸發滑鼠事件，
 * 要停在外層 span 上；hover 偶爾不觸發，故重試到 Tooltip 出現為止。
 */
export async function tooltipTextOf(page, target) {
  let text = '';
  await expect(async () => {
    await page.mouse.move(0, 0);
    await target.hover();
    text = await page.locator('.ant-tooltip-inner').last().innerText({ timeout: 2000 });
    expect(text.length).toBeGreaterThan(0);
  }).toPass({ timeout: 20_000 });
  return text;
}
