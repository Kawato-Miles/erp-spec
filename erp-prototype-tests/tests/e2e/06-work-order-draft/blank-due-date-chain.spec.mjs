import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  pickOption,
  dialog,
  button,
  rowOf,
  goInApp,
  openScenario,
  openByNo,
  openTab,
} from './_local-helpers.mjs';

// 6.13 交期一路留空時工單相關畫面照實留白、不當機
// 線下單離開草稿後有效印件一律有印件預計交期（rush-order-definition，order-management spec
// § 印件預計交期依階段必填檢核），留空走到工單的路徑只剩線上單：線上單印件沒有本欄的來源。
// 起點：鏈外線上單 ORD-2026-0816（等待付款，三件印件日期皆空）。前置：業務以手動推進代替電商付款回寫，
// 推到「已付款」（訂單成立）；新增一件免審印件、不填日期，系統依線上單自動到位建立工單草稿
//（不經待確認製作細節佇列），之後印件內部完成日與工單承接值一路同為空。
test('6.13 交期一路留空時工單相關畫面照實留白、不當機', async ({ page }) => {
  test.setTimeout(300_000);

  // 一、前置：業務把 ORD-2026-0816 由等待付款推進到已付款
  await openScenario(page, '業務', '/orders/detail?id=ORD-2026-0816&tab=printItems', {
    openAs,
    switchRole,
  });
  await page.getByRole('button', { name: /推\s*進\s*狀\s*態/ }).click();
  const advanceModal = dialog(page);
  await expect(advanceModal).toContainText('推進至「已付款」');
  await advanceModal.getByRole('button', { name: /推進一格/ }).click();
  await expect(page.locator('.ant-modal-content:visible')).toHaveCount(0);

  // 新增一件免審印件，印件預計交期留空（線上單不套用必填檢核）：系統自動到位並建立工單草稿
  await page.getByRole('button', { name: '新增印件' }).click();
  const addModal = page.locator('.ant-modal-content:visible').last();
  await expect(addModal.getByText('印件名稱')).toBeVisible();
  await page.getByLabel('印件名稱').fill('6.13 留空印件');
  await addModal.getByText('大貨印件', { exact: true }).click();
  await page.getByLabel('購買數量').fill('2000');
  await page.locator('.ant-select:has(#unit)').click();
  const unitDropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await unitDropdown.locator('.rc-virtual-list-holder').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await unitDropdown.locator('.ant-select-item-option', { hasText: '張' }).click();
  await page.locator('#unit_price_untaxed').fill('8');
  await page.locator('#difficulty_level').fill('3');
  await addModal.locator('.ant-switch').first().click();
  await expect(addModal.locator('#expected_delivery_date')).toHaveValue('');
  await addModal.getByRole('button', { name: '新增印件', exact: true }).click();
  const toast = await page
    .locator('.ant-message-notice-content')
    .filter({ hasText: '工單草稿' })
    .last()
    .innerText();
  const workOrderNo = toast.match(/WO-\d{4}-\d{4}/)[0];
  // 訂單項目該列的兩個日期欄照實留白
  await expect(rowOf(page, '6.13 留空印件')).not.toContainText(/\d{4}-\d{2}-\d{2}/);

  // 二、印務主管指派負責印務（工單要有負責人，印務才進得了製程規劃）
  await switchRole(page, '印務主管');
  await goInApp(page, '/work-orders', gotoInApp);
  await openByNo(page, workOrderNo);
  await button(page, '分派').click();
  const assignModal = dialog(page);
  await pickOption(page, assignModal.locator('.ant-select').nth(0), '周建宏');
  await pickOption(page, assignModal.locator('.ant-select').nth(1), '吳國豪');
  await button(assignModal, '分派').click();
  await expect(page.locator('body')).toContainText('已分派給 周建宏');

  // 三、工單詳情摘要：印件內部完成日那一格照實留白
  const summaryCell = page
    .getByText('印件內部完成日', { exact: true })
    .first()
    .locator('xpath=ancestor::div[3]');
  await expect(summaryCell).toContainText('－');

  // 四、製程規劃：新增一筆生產任務後，清單上方寫明這張工單沒有交期基準，且不判任何超期
  await switchRole(page, '印務');
  await openTab(page, '製程規劃');
  await button(page, '新增生產任務').click();
  const picker = dialog(page);
  await expect(picker).toContainText('選擇 BOM');
  await picker.getByPlaceholder('搜尋材料名稱').fill('雪銅紙');
  await picker.getByPlaceholder('搜尋材料名稱').press('Enter');
  await picker.locator('tbody tr.ant-table-row').first().click();
  await button(picker, '帶入').click();
  const form = dialog(page);
  await form.getByPlaceholder('例：書冊內頁').fill('全張');
  await pickOption(
    page,
    form.locator('.ant-select').filter({ hasText: '選目的站點' }),
    '印刷站',
  );
  // 產線必填：工單非由配方展開，沒有工序段可帶入，產線留空待印務選定
  await pickOption(page, form.locator('.ant-select').filter({ hasText: '選產線' }), '數位產線');
  // 任務預計完成日刻意填一個很晚的日期：沒有基準就不做比對，標籤與提示都不該出現
  const endDate = form
    .locator('.ant-form-item')
    .filter({ hasText: '任務預計完成日' })
    .first()
    .locator('input');
  await endDate.fill('2026-12-31');
  await page.keyboard.press('Enter');
  await form.locator('.ant-tabs-tab', { hasText: '數量與放損' }).click();
  await form.locator('.ant-tabs-tabpane-active').locator('.ant-input-number-input').first().fill('2000');
  await button(form, '新增任務').click();
  // 存檔提示與清單上方說明同一句話，兩處都出現才算對：取第一個即可
  await expect(page.getByText('這張工單沒有交期基準').first()).toBeVisible();
  await expect(page.getByText('超出印件內部完成日')).toHaveCount(0);

  // 五、紙本工單表頭的印件內部完成日欄照實留白，不擋列印（草稿工單走負責印務的送審前預覽，同一張列印單據頁）
  await button(page, '預覽工單').click();
  await expect(page).toHaveURL(/work-orders\/print/, { timeout: 40_000 });
  const dueRow = page
    .locator('table')
    .first()
    .locator('tr')
    .filter({ hasText: '印件內部完成日' })
    .first();
  await expect(dueRow).toContainText('－');

  // 六、工單列表該列的印件內部完成日欄照實留白
  await goInApp(page, '/work-orders', gotoInApp);
  const search = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await search.fill(workOrderNo);
  await search.press('Enter');
  await expect(rowOf(page, workOrderNo)).toContainText('－');
});
