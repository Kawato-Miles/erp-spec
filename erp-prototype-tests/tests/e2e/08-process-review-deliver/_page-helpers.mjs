import { expect } from '@playwright/test';
import { gotoInApp, ROLE_USERS } from '../_helpers.mjs';

// 本章測試共用的頁面操作（只在第八章使用，未收進 _helpers.mjs）

// 切模擬角色（本章專用）：共用工具的 switchRole 連續送鍵時，AntD 下拉會漏掉大部分按鍵，
// 跨多個位置切換（例如業務切回印務）會停在錯的角色。這裡改成逐鍵確認目前反白的選項再送出。
export async function switchRoleReliable(page, roleLabel) {
  const wanted = `${roleLabel}（${ROLE_USERS[roleLabel]}）`;
  const select = page.locator('header, .ant-layout-header').first().locator('.ant-select').first();
  const shown = select.locator('.ant-select-selection-item');
  if ((await shown.innerText()).trim() === wanted) return;
  await select.click();
  // 反白中的選項直接由畫面上讀（清單為虛擬捲動，選項元素會隨捲動增減，故不用 locator 等待）
  const activeOption = () =>
    page.evaluate(
      () =>
        document
          .querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
          ?.querySelector('.ant-select-item-option-active')
          ?.textContent?.trim() ?? '',
    );
  for (let i = 0; i < 24; i += 1) {
    if ((await activeOption()) === wanted) break;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('Enter');
  await expect(shown).toHaveText(wanted);
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
