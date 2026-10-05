import { expect } from '@playwright/test';
import { gotoInApp, switchRole } from '../_helpers.mjs';

// 本章測試共用的頁面操作（只在第八章使用，未收進 _helpers.mjs）

// 切模擬角色：沿用共用工具的 switchRole（逐鍵確認反白選項、可重試）。模擬角色下拉改為同角色多人並帶所屬產線後，
// 選項文字不再等於「角色（人名）」、選項數也超過舊版逐鍵上限，本章不再自帶一份。
export async function switchRoleReliable(page, roleLabel) {
  await switchRole(page, roleLabel);
}

// AntD 會在兩個中文字的按鈕文字中間插一個空白（核可 → 核 可），
// 依按鈕文字取元素時一律用本函式產生的比對式
export const cjkName = (text) => new RegExp(`^${text.split('').join('\\s*')}$`);

// 等對話框與遮罩完全關閉：遮罩還在時點側欄會被吃掉，站內導頁看起來像沒反應
export async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
  await expect(page.locator('.ant-modal-wrap:visible')).toHaveCount(0);
}

// 站內導頁（本章專用）：剛切完角色時側欄選單正在重繪，第一次點擊可能落空，故重試
export async function gotoInAppStable(page, path) {
  for (let i = 0; i < 3; i += 1) {
    try {
      await gotoInApp(page, path);
      return;
    } catch {
      await page.waitForTimeout(300);
    }
  }
  await gotoInApp(page, path);
}

// 點一顆會換頁的按鈕：開發伺服器首次編譯該路由要好幾秒，逾時再點一次
export async function clickAndWaitUrl(page, locator, pattern) {
  await locator.click();
  try {
    await expect(page).toHaveURL(pattern, { timeout: 20_000 });
  } catch {
    await locator.click();
    await expect(page).toHaveURL(pattern, { timeout: 20_000 });
  }
}

// 回工單列表：工單詳情頁的側欄「工單列表」已是選中項，點它不會換頁（AntD Menu 只在選項改變時觸發），
// 故詳情頁改用頁首的返回鍵
export async function gotoWorkOrderList(page) {
  const back = page
    .locator('button')
    .filter({ has: page.getByText('arrow_back', { exact: true }) })
    .first();
  if (await back.count()) {
    await back.click();
    await expect(page).toHaveURL(/\/work-orders\/?(\?|$)/, { timeout: 20_000 });
    return;
  }
  await gotoInAppStable(page, '/work-orders');
}

// 由工單列表開一張工單詳情（站內導頁，工單編號為 Typography.Link 無 href，故點文字）
export async function openWorkOrderFromList(page, workOrderNo) {
  await gotoWorkOrderList(page);
  const search = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await search.fill(workOrderNo);
  await search.press('Enter');
  const link = page.getByText(workOrderNo, { exact: true }).first();
  const heading = page.getByRole('heading', { level: 4, name: workOrderNo });
  await link.click();
  try {
    await expect(heading).toBeVisible({ timeout: 20_000 });
  } catch {
    await link.click();
    await expect(heading).toBeVisible({ timeout: 20_000 });
  }
}

// 生產任務清單（製程規劃頁籤）中該筆任務的列
export const taskRow = (page, taskName) =>
  page.locator('tbody tr').filter({ hasText: taskName }).first();

// 勾選生產任務清單中的某幾筆任務
export async function checkTasks(page, taskNames) {
  for (const name of taskNames) {
    await taskRow(page, name).getByRole('checkbox').check();
  }
}

/**
 * 表格中某一列、某一欄的文字（欄以表頭葉節點的文字定位，含群組表頭的跨欄與跨列）。
 * 第七、八、九章共用：工單詳情的生產任務列表與待審核列表的子表都是群組表頭，
 * 欄位順序會隨改版調整，只用列文字比對會把同一列其他欄的同名值（如「－」「已完成」）算進來。
 * 列以「含 rowText 的資料列、且列內沒有巢狀表格」定位，表頭取該列所屬的那一張表；
 * 同一段文字同時出現在母表與子表時（例：母表的印件名稱含子表的任務名），只取表頭有該欄的那一張表的列。
 * 找不到列或欄時回 null。
 */
export function cellText(page, rowText, header) {
  return page.evaluate(
    ([text, headerText]) => {
      const candidates = [...document.querySelectorAll('tr.ant-table-row')].filter(
        (tr) => tr.textContent.includes(text) && !tr.querySelector('.ant-table'),
      );
      // 只看該列所屬那一張表自己的表頭（第一個 thead），不把展開列裡子表的表頭算進來
      const hasHeader = (tr) =>
        [...(tr.closest('.ant-table')?.querySelector('thead')?.querySelectorAll('th') ?? [])].some(
          (th) => th.textContent.trim() === headerText,
        );
      const rows = candidates.filter(hasHeader);
      const row = rows.find((tr) => tr.offsetParent !== null) ?? rows[0];
      if (!row) return null;
      const table = row.closest('.ant-table');
      const thead = table?.querySelector('thead');
      if (!thead) return null;
      const grid = [];
      [...thead.querySelectorAll(':scope > tr')].forEach((tr, ri) => {
        grid[ri] = grid[ri] ?? [];
        let ci = 0;
        [...tr.children].forEach((th) => {
          while (grid[ri][ci]) ci += 1;
          for (let r = 0; r < (th.rowSpan || 1); r += 1) {
            grid[ri + r] = grid[ri + r] ?? [];
            for (let c = 0; c < (th.colSpan || 1); c += 1) grid[ri + r][ci + c] = th;
          }
          ci += th.colSpan || 1;
        });
      });
      const leaf = grid[grid.length - 1] ?? [];
      const index = leaf.findIndex((th) => th && th.textContent.trim() === headerText);
      if (index < 0) return null;
      let ci = 0;
      for (const td of row.children) {
        const span = td.colSpan || 1;
        if (index >= ci && index < ci + span) return td.textContent.trim();
        ci += span;
      }
      return null;
    },
    [rowText, header],
  );
}

/** 斷言某列某欄的文字（逾時內重讀，等畫面重繪完成） */
export async function expectCell(page, rowText, header, expected) {
  await expect
    .poll(() => cellText(page, rowText, header), {
      message: `「${rowText}」列的「${header}」欄`,
      timeout: 15_000,
    })
    .toBe(expected);
}
