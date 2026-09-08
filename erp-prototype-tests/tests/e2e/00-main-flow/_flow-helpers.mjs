// 第零章（主流程 smoke）專用工具。撰寫規約第 5 條：AntD 結構類名只在本檔使用。
// 本檔刻意不 import 其他章的工具檔——各章可獨立退役，跨章相依會讓刪一章就壞一片。
import { expect } from '@playwright/test';

// AntD 會在兩個中文字的按鈕文字中間插空白（「核可」顯示為「核 可」），
// 帶圖示的按鈕又會把圖示名稱塞進可及名稱最前面（「新增」為「plus 新增」），
// 故按鈕文字只錨定結尾：既容忍圖示前綴，也不會讓「新增」誤中「新增印件」。
export const spaced = (label) => new RegExp(`${label.split('').join('\\s*')}$`);

/** 依按鈕文字取按鈕（容忍 AntD 的中文字間空白） */
export const button = (scope, label) => scope.getByRole('button', { name: spaced(label) });

/** 目前開著的對話框（Modal 或 PanelDialog） */
export const dialog = (page) => page.locator('.ant-modal-content:visible').last();

/** 目前開著的側板（PanelDrawer，mode=edit 關閉即銷毀內容，故不必再濾可見） */
export const drawer = (page) => page.locator('.ant-drawer-content').last();

/**
 * 點一顆會開對話框／側板的按鈕：頁面剛載入或剛重繪時第一次點擊常落在尚未接上事件的節點，
 * 重試到目標真的出現為止。
 */
export async function clickOpen(clickTarget, appearTarget) {
  await expect(async () => {
    await clickTarget.click();
    await expect(appearTarget).toBeVisible({ timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
}

/** 表格中含指定文字的那一列 */
export const rowOf = (scope, text) =>
  scope.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();

/** 目前開著的下拉（排除收合中的那些） */
const openDropdown = (page) =>
  page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();

// 傳進來的定位器可能是 AntD Select 的內層搜尋輸入框（getByLabel 命中的就是它）：
// 那個輸入框寬度為零、又被 .ant-select-selection-item 蓋住，直接點永遠點不下去。
// 故一律先往上找到最外層的 .ant-select 容器再點（class 用整詞比對，才不會誤中 .ant-select-selector）。
const selectBox = (target) =>
  target.locator(
    "xpath=ancestor-or-self::div[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]",
  );

/** 在單選下拉挑一個選項 */
export async function pickOption(page, select, label) {
  // 下拉為虛擬捲動，目標選項可能在視窗外：開下拉後把選項捲進來再點；沒點到就整段重試
  await expect(async () => {
    const box = selectBox(select).first();
    if (!(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').count())) await box.click();
    const option = openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.scrollIntoViewIfNeeded({ timeout: 2000 });
    await option.click({ timeout: 3000 });
    await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0, { timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30000 });
}

/** 在複選下拉挑一個選項後按 Escape 收下拉（複選下拉點完不會自己關） */
export async function pickMulti(page, select, label) {
  await selectBox(select).first().click();
  await openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
}

/** 在複選下拉挑第一個選項（候選只有一筆、名稱由主檔拼出來時用） */
export async function pickMultiFirst(page, select) {
  await selectBox(select).first().click();
  await openDropdown(page).locator('.ant-select-item-option').first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
}

/** 切詳情頁的某個頁籤（頁籤標題可能帶筆數，故用包含比對） */
export async function openTab(page, label) {
  await page.locator('.ant-tabs-tab', { hasText: label }).first().click();
}

/** 展開母子表的某一列 */
export async function expandRow(page, text) {
  await rowOf(page, text).locator('.ant-table-row-expand-icon').first().click();
}

/**
 * 點清單上的單據編號進詳情頁（Typography.Link 無 href，故點文字）。
 * 清單剛掛載時第一次點擊常落在尚未接上事件的節點，開發伺服器首次編譯路由又要好幾秒，故重試。
 */
export async function openByNo(page, no, urlPattern = /detail/) {
  const link = page.getByText(no, { exact: true }).first();
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

/** 重試：頁面剛載入或剛切角色時，第一次的點擊與鍵盤事件可能整組掉了 */
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
 * gotoInApp 的重試包裝（換角色後選單重繪、首次進路由要即時編譯）。
 * 側欄改建期間第一次點擊會落空，殘留的提示訊息與遮罩也會把點擊吃掉，故每輪先清乾淨再點。
 */
export async function goInApp(page, path, gotoInApp) {
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${esc}/?(\\?|$)`);
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Escape').catch(() => {});
    await waitModalsClosed(page).catch(() => {});
    try {
      await gotoInApp(page, path);
      return;
    } catch (e) {
      try {
        await page.waitForURL(pattern, { timeout: 20_000 });
        return;
      } catch {
        if (i === 3) throw e;
      }
    }
  }
}

/** 讀最新一則成功提示的文字（單據編號多半只在這裡出現一次） */
export async function toastText(page, pattern) {
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toContainText(pattern ?? /./, { timeout: 15_000 });
  return notice.innerText();
}

/** 等對話框與遮罩完全關閉：遮罩還在時點側欄會被吃掉，站內導頁看起來像沒反應 */
export async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
  await expect(page.locator('.ant-drawer-mask:visible')).toHaveCount(0);
}

// 頁首（banner）也有一個 level 4 的頁面標題，故詳情頁的標頭一律限定在 main 內找。
/** 詳情頁的標題（單號與案名） */
export const detailTitle = (page) =>
  page.getByRole('main').getByRole('heading', { level: 4 }).first();

/** 訂單詳情頁標頭那一列（返回鍵、單號案名、狀態標籤同在一個 Flex 內） */
export const orderHeader = (page) => detailTitle(page).locator('xpath=..');

/** 表單中某個欄位標籤對應的控制項（AntD Form.Item 的 label 以 for 指向控制項） */
export const field = (scope, label) => scope.getByLabel(label);

/** 需求單詳情頁進度條目前所在的那一格 */
export const quoteCurrentStep = (page) =>
  page.locator('.ant-steps-item-process .ant-steps-item-title');
