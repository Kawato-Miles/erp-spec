import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 14.16 訂單列表顯示訂單預計交貨日期並可排序與區間篩選（2026-09-21 翻案改寫）
// 訂單預計交貨日期＝尚未出貨的有效印件，其印件預計交期取最早一筆（衍生值、訂單不存欄）。
// 訂單內部完成時間與全部交完日不上列表，只在訂單詳情呈現。
// 期望值取自 openspec order-management § 訂單層衍生交期日期，不由實作反推。
// 2026-10-23 改寫（change shipment-print-download-center K3）：部分延遲與整單逾期以全部交完日切開、互斥，
// 母表同一列只標其中一種；「已出貨」改依出貨單全數離廠（SHP-028 裁決 A）。
test('14.16 訂單列表顯示訂單預計交貨日期並可排序與區間篩選', async ({ page }) => {
  await openAs(page, '業務', '/orders');
  // 列表每頁十筆、依日期新到舊，不綁定特定編號在第一頁：只確認列表已載出訂單
  await expect(page.getByText(/ORD-\d{4}-\d{4}/).first()).toBeVisible();

  // 母表有訂單預計交貨日期欄，沒有已刪除的兩個訂單層交期欄，也沒有詳情才呈現的另兩個衍生日期
  await expect(page.getByRole('columnheader', { name: '訂單預計交貨日期' })).toBeVisible();
  for (const gone of ['訂單交期', '內部製作截止日', '訂單內部完成時間', '全部交完日']) {
    await expect(page.getByRole('columnheader', { name: gone, exact: true })).toHaveCount(0);
  }

  // 篩選區提供該欄的日期區間（一組日期區間選擇器）
  await expect(page.getByText('訂單預計交貨日期').last()).toBeVisible();
  await expect(page.locator('.ant-picker-range')).toHaveCount(1);

  // 該欄可排序：點欄頭排一次，列表照樣列得出訂單
  const rows = page
    .locator('.ant-table')
    .first()
    .locator('> .ant-table-container tbody.ant-table-tbody > tr.ant-table-row')
    // 收合後的子表列仍留在頁面上（隱藏），只算看得見的母表列
    .filter({ visible: true });
  const before = await rows.count();
  expect(before).toBeGreaterThan(1);
  await page.getByRole('columnheader', { name: '訂單預計交貨日期' }).click();
  await expect(rows.first()).toBeVisible();

  // 清除篩選後列表行為正常：先用關鍵字篩到只剩一張，再清除，筆數回到原本
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: /清空/ }).click();
  await expect(rows).toHaveCount(before);

  // 印件子列有印件內部完成日與印件預計交期兩欄，值為該印件自己的推導值
  //（PI-2026-0710：印件預計交期 2026-09-15，往前減 1 個工作天得印件內部完成日 2026-09-14）
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  const orderRow = page.locator('tr', { hasText: 'ORD-2026-0710' }).first();
  await orderRow.locator('.ant-table-row-expand-icon').click();
  const expanded = page.locator('tr.ant-table-expanded-row');
  await expect(expanded.getByRole('columnheader', { name: '印件內部完成日' })).toBeVisible();
  await expect(expanded.getByRole('columnheader', { name: '印件預計交期' })).toBeVisible();
  await expect(expanded).toContainText('2026-09-14');
  await expect(expanded).toContainText('2026-09-15');

  // 部分延遲與整單逾期互斥（K3）：母表每一列至多標其中一種；逐頁檢查到最後一頁
  await orderRow.locator('.ant-table-row-expand-icon').click();
  await page.getByRole('button', { name: /清空/ }).click();
  await expect(rows).toHaveCount(before);
  for (let guard = 0; guard < 20; guard += 1) {
    const count = await rows.count();
    for (let i = 0; i < count; i += 1) {
      const text = await rows.nth(i).innerText();
      expect(
        text.includes('部分延遲') && text.includes('整單逾期'),
        `訂單列同時標部分延遲與整單逾期：${text.match(/ORD-\d{4}-\d{4}/)?.[0]}`,
      ).toBe(false);
    }
    const next = page.locator('.ant-pagination-next').first();
    if ((await next.count()) === 0 || (await next.getAttribute('aria-disabled')) === 'true') break;
    await next.click();
  }
});

// 14.46 訂單急件標注與急件篩選（OpenSpec change rush-order-definition，order-management spec § 訂單急件標注、
// § 訂單列表權限與可見範圍）：任一有效印件是否急件為是即標注，已棄用的急件印件不計；
// 線上單印件的購買的急件選項不參與判定。列表提供「急件」篩選條件、作用於角色可見訂單集，不依急件自動排序。
// 起點資料：mock 帶急件標注的訂單只有兩張——鏈四 ORD-2026-0820（PI-2026-0820 是否急件為是）與
// 線上單 ORD-2026-0816（PI-2026-0861 是否急件為是）；ORD-2026-0913 旗下印件皆為否。
test('14.46 訂單列表帶訂單急件標注並可篩選急件，已棄用的急件印件不計', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '訂單管理人', '/orders');
  await expect(page.getByText(/ORD-\d{4}-\d{4}/).first()).toBeVisible();
  const rows = page
    .locator('.ant-table')
    .first()
    .locator('> .ant-table-container tbody.ant-table-tbody > tr.ant-table-row')
    .filter({ visible: true });
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });

  // ORD-2026-0820 與 ORD-2026-0816 帶標注；ORD-2026-0913 不帶
  for (const [orderNo, marked] of [
    ['ORD-2026-0820', true],
    ['ORD-2026-0816', true],
    ['ORD-2026-0913', false],
  ]) {
    await search.fill(orderNo);
    await search.press('Enter');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText('急件', { exact: true })).toHaveCount(marked ? 1 : 0);
  }
  await page.getByRole('button', { name: /清空/ }).click();

  // 篩選「急件」：只列被標注的訂單（兩張），每一列都帶急件標注
  const urgentFilter = page
    .locator('.ant-col')
    .filter({ has: page.getByText('急件', { exact: true }) })
    .locator('.ant-select')
    .first();
  const pickUrgent = async () => {
    await urgentFilter.click();
    await page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
      .last()
      .locator('.ant-select-item-option', { hasText: '急件' })
      .click();
  };
  await pickUrgent();
  await expect(rows).toHaveCount(2);
  for (let i = 0; i < 2; i += 1) {
    await expect(rows.nth(i).getByText('急件', { exact: true })).toBeVisible();
  }
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0820' })).toHaveCount(1);
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0816' })).toHaveCount(1);
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0913' })).toHaveCount(0);

  // 鏈四唯一的急件印件取消製作（已棄用）後，ORD-2026-0820 不再出現在急件篩選結果
  await page.getByRole('button', { name: /清空/ }).click();
  await search.fill('ORD-2026-0820');
  await search.press('Enter');
  await page.locator('a', { hasText: 'ORD-2026-0820' }).first().click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  await page
    .locator('tr', { hasText: 'PI-2026-0820' })
    .first()
    .getByRole('button', { name: '取消製作' })
    .click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: '取消製作' }).click();
  await expect(page.getByText(/已棄用印件「.*」/)).toBeVisible();
  await gotoInApp(page, '/orders');
  await expect(rows.first()).toBeVisible();
  await pickUrgent();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('ORD-2026-0816');
});
