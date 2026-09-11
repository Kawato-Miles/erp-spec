import { expect, test } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';
import {
  clickAndWaitUrl,
  gotoWorkOrderList,
  openWorkOrderFromList,
  switchRoleReliable,
} from './_page-helpers.mjs';

// 開發伺服器首次編譯各路由要數秒，測試逾時放寬
test.describe.configure({ timeout: 120_000 });

// 第八章 製程審核與交付產線：紙本單據（8.6 版式與欄位範圍、8.7 預覽與列印權限、8.8 急件標示）

// 單據本體那張紙的文字（排除頁上不印出的操作列）
const sheetText = (page) =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(
      (e) =>
        e.innerText?.includes('工作印製傳單') &&
        e.innerText.includes('參考完稿圖') &&
        !e.innerText.includes('回工單詳情'),
    );
    return el?.innerText ?? '';
  });

test('8.6 印務列印紙本工單，版式與欄位範圍固定且不含價格（原編號 168）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0908');
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '列印紙本工單' }),
    /\/work-orders\/print\/?\?id=wo-2026-0908/,
  );

  // 一、文件表頭
  await expect(page.getByText('工作印製傳單')).toBeVisible();
  await expect(page.getByText('SENSATIONS PRINT')).toBeVisible();
  await expect(page.getByText('感官文化印刷', { exact: true })).toBeVisible();
  await expect(page.getByText('抬頭：感官文化印刷有限公司／統編：54922191')).toBeVisible();

  // 二、區塊條
  await expect(page.getByText('工 單 資 訊')).toBeVisible();

  // 三、工單資訊表：兩組鍵值四欄
  const infoTable = page.locator('table').first();
  const pairs = [
    ['工單編號', 'WO-2026-0908', '客戶', '青硯文具股份有限公司'],
    ['印件名稱', '名片', '印務', '周建宏'],
    ['印件數量', '123', '電話', ''],
    // 交期取印件的「預計交期」（本印件訂單交期 2026-09-10 − 1 天、一般件不再多減）
    ['工單日期', '2026-09-03', '交期', '2026-09-09'],
  ];
  for (const [k1, v1, k2, v2] of pairs) {
    const row = infoTable.locator('tr').filter({ hasText: k1 }).first();
    await expect(row).toContainText(k1);
    await expect(row).toContainText(v1);
    await expect(row).toContainText(k2);
    if (v2) await expect(row).toContainText(v2);
  }
  // 備註、確樣需求、品檢需求各跨欄一列
  for (const key of ['備註', '確樣需求', '品檢需求']) {
    const row = infoTable.locator('tr').filter({ hasText: key }).first();
    await expect(row.locator('td')).toHaveCount(1);
    await expect(row.locator('td')).toHaveAttribute('colspan', '3');
  }

  // 四、明細八欄，製程為群組名粗體、列序同畫面排序，數量欄放損非零時接「＋放 N」
  const detailTable = page.locator('table').nth(1);
  const detailHeaders = detailTable.locator('thead th');
  await expect(detailHeaders).toHaveCount(8);
  for (const [i, title] of [
    '製程',
    '廠商',
    '印件名稱',
    '製作細節',
    '內容',
    '數量',
    '單位',
    '備註',
  ].entries()) {
    await expect(detailHeaders.nth(i)).toHaveText(title);
  }
  const detailRows = detailTable.locator('tbody tr');
  await expect(detailRows).toHaveCount(3);
  await expect(detailRows.nth(0)).toContainText('一級卡 300g 名片八開');
  await expect(detailRows.nth(1)).toContainText('名片雙面四色印刷');
  await expect(detailRows.nth(2)).toContainText('名片裁切分盒');
  await expect(detailRows.nth(0).locator('td').first().locator('strong')).toBeVisible();
  await expect(detailRows.nth(0).locator('td').nth(5)).toContainText('615');
  await expect(detailRows.nth(0).locator('td').nth(5)).toContainText('＋放13');

  // 單據上沒有任何價格或成本
  const text = await sheetText(page);
  expect(text).not.toContain('NT$');
  expect(text).not.toContain('單價');
  expect(text).not.toContain('小計');
  expect(text).not.toContain('成本');
  expect(text).not.toContain('金額');

  // 明細之後只有參考完稿圖一張表，沒有落款
  const tables = page.locator('table');
  await expect(tables).toHaveCount(3);
  await expect(tables.nth(2)).toContainText('參考完稿圖');
  expect(text).not.toContain('製表');
  expect(text).not.toContain('簽核');
});

test('8.7 送審前可預覽紙本，列印權限限印務與生管（原編號 169）', async ({ page }) => {
  // 送審前狀態（草稿）：負責印務看得到「預覽工單」
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0901');
  await expect(page.getByRole('button', { name: '列印紙本工單' })).toHaveCount(0);
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '預覽工單' }),
    /\/work-orders\/print\/?\?id=wo-2026-0901/,
  );
  await expect(
    page.getByText(/製程尚未經主管核可，此版不得作為現場作業依據/),
  ).toBeVisible();

  // 非負責印務（WO-2026-0910 負責印務為蔡明修）連工單都看不到：工單列表只帶自己負責或被分享的工單，
  // 故「看不到預覽按鈕」在列表這一層就成立，權限把關另以直接開列印網址驗（見本測試最後一段）
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '回工單詳情' }).first(),
    /\/work-orders\/detail/,
  );
  await gotoWorkOrderList(page);
  const listSearch = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await listSearch.fill('WO-2026-0910');
  await listSearch.press('Enter');
  await expect(page.locator('.ant-empty-description')).toContainText('無此資料');
  await listSearch.fill('');

  // 製程審核完成之後改為「列印紙本工單」；業務開列印網址顯示沒有列印權限，切回印務後可列印
  await openWorkOrderFromList(page, 'WO-2026-0908');
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '列印紙本工單' }),
    /\/work-orders\/print/,
  );
  await switchRoleReliable(page, '業務');
  await expect(page.getByText('沒有列印權限')).toBeVisible();
  await switchRoleReliable(page, '印務');
  await expect(page.getByRole('button', { name: /^列\s*印$/ })).toBeVisible();

  // 列印預覽只印單據本體：左側選單、頁首與頁內按鈕都不印
  await page.emulateMedia({ media: 'print' });
  const hidden = await page.evaluate(() => {
    const check = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).display : 'absent';
    };
    return {
      sider: check('.ant-layout-sider'),
      header: check('.ant-layout-header'),
      actions: check('.no-print'),
    };
  });
  expect(hidden).toEqual({ sider: 'none', header: 'none', actions: 'none' });
  await page.emulateMedia({ media: 'screen' });

  // 直接開送審前工單的列印網址而自己不是該工單的負責印務：另一個分頁以印務身分開啟，顯示沒有預覽權限。
  // 對照組取 WO-2026-0905（草稿、尚未指派負責印務）；情境目錄寫的 WO-2026-0910 現況已是「製程審核完成」，
  // 不落在送審前預覽的把關範圍（該狀態下印務與生管皆可列印，與負責人無關）
  const other = await page.context().newPage();
  await other.goto('/work-orders/print?id=wo-2026-0905');
  await switchRoleReliable(other, '印務');
  await expect(other.getByText('沒有預覽權限')).toBeVisible();
  await other.close();
});

test('8.8 急件工單的紙本標示與交期（原編號 170）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/print?id=wo-2026-0820');

  // 交期取印件的「預計交期」推導值：本印件訂單交期 2026-09-10 − 1 天 − 三天急件凍結天數 ＝ 2026-09-06
  const infoTable = page.locator('table').first();
  const dueRow = infoTable.locator('tr').filter({ hasText: '交期' }).first();
  await expect(dueRow).toContainText('2026-09-06');

  // 明細每一列的製作細節欄列首都有紅色急件標記
  const detailRows = page.locator('table').nth(1).locator('tbody tr');
  const rowCount = await detailRows.count();
  expect(rowCount).toBeGreaterThan(0);
  for (let i = 0; i < rowCount; i += 1) {
    const mark = detailRows.nth(i).locator('td').nth(3).getByText('＊急件');
    await expect(mark).toBeVisible();
    // 紅色＝設計系統的 error[600]
    await expect(mark).toHaveCSS('color', 'rgb(226, 52, 29)');
  }

  // 一般件的對照組（錨例 WO-2026-0908／PI-2026-0801）：沒有急件標記，
  // 交期＝本印件訂單交期 2026-09-10 − 1 天（一般件凍結天數 0）＝ 2026-09-09
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '回工單詳情' }).first(),
    /\/work-orders\/detail/,
  );
  await openWorkOrderFromList(page, 'WO-2026-0908');
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '列印紙本工單' }),
    /\/work-orders\/print/,
  );
  await expect(page.getByText('＊急件')).toHaveCount(0);
  await expect(
    page.locator('table').first().locator('tr').filter({ hasText: '交期' }).first(),
  ).toContainText('2026-09-09');
});

test('8.8（補）工單交期為空時印據表頭印「－」', async ({ page }) => {
  // 鏈二 PI-2026-0710／WO-2026-0710：業務把印件的訂單交期清空，預計交期同為空、
  // 非終態工單的預計交期同步為 null；印據表頭不留空白、不擋列印，印「－」（work-order spec
  // § 工單列印單據 Scenario「工單交期為空時印據表頭印「－」」）。
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  // 清除鈕只在 hover 時才顯示、位置常落在可視區外；直接對元素派送 click 事件繞開座標可視性檢查
  const dueDateClear = page.locator('.ant-form-item', { hasText: '訂單交期' }).locator('.ant-picker-clear');
  await dueDateClear.waitFor({ state: 'attached' });
  await dueDateClear.evaluate((el) => el.click());
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已更新印件，預計交期已重推導為「未定」/)).toBeVisible();
  await expect(row.getByText('—').first()).toBeVisible();

  await switchRoleReliable(page, '印務');
  // 目前站在訂單詳情頁（非工單詳情頁），gotoWorkOrderList／openWorkOrderFromList 假設呼叫端
  // 已在工單模組內、靠頁首返回鍵離開，這裡改直接以側欄站內導頁到工單列表再搜尋
  await gotoInApp(page, '/work-orders');
  const search = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  await page.getByText('WO-2026-0710', { exact: true }).first().click();
  await clickAndWaitUrl(
    page,
    page.getByRole('button', { name: '列印紙本工單' }),
    /\/work-orders\/print/,
  );
  const infoTable = page.locator('table').first();
  const dueRow = infoTable.locator('tr').filter({ hasText: '交期' }).first();
  await expect(dueRow).toContainText('—');
});
