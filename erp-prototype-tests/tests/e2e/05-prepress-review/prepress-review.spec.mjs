import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { addPendingReviewItem } from './_setup.mjs';

// 情境目錄第五章：審稿。多數情境先用「新增印件」在鏈六 ORD-2026-0903（訂單管理人黃聖雯）
// 造一件待審印件，共用前置見 ./_setup.mjs。
//
// /prepress-review 與 /prepress-review/pending-assign 為雙層表格（訂單列展開印件子表）：
// 外層展開容器（ant-table-expanded-row）是子表的祖先，其 accessible name／textContent 會
// 遞迴含整張子表的文字，`tr` + hasText 或 getByRole('row', { name }) 都會連帶命中外層容器與
// 同張訂單的其他印件列。改用「先精準命中印件名稱文字節點、再取最近的 <tr> 祖先」精準定位單一列。
// 訂單模組 ItemsTab 是單層表格，沿用 `tr` + hasText 即可。
const reviewRow = (page, text) =>
  page.getByText(text, { exact: true }).locator('xpath=ancestor::tr[1]');

// 5.1 起點：鏈八 ORD-2026-0920 旗下 PI-2026-0921（等待審稿、負責審稿魏彣軒）。七條主鏈的印件
// 審稿都已走完（已確認可製作），母集合 selectOrdersPendingReview 排除這個狀態，不出現在審稿清單，
// 故本條不能沿用主鏈印件，改用仍在審稿段的鏈八印件。還在審稿段的印件尚未登記進印件總覽（要等
// 訂單管理人確認製作細節才進得去），/print-items 這個入口在本條驗不到。
test('5.1 審稿清單與訂單項目兩個入口進到同一頁（原編號 56）', async ({ page }) => {
  await openAs(page, '審稿人員', '/prepress-review');
  await page.getByText('量販促銷吊卡', { exact: true }).click();
  await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0921/);
  await expect(page.getByRole('tab', { name: /審稿紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /活動紀錄/ })).toBeVisible();

  // 切成業務，在訂單詳情的訂單項目點同一件印件（同一頁）
  await switchRole(page, '業務');
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0920' }).first().click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const row = page.locator('tr', { hasText: '量販促銷吊卡' });
  await row.getByRole('button', { name: '檢視印件' }).click();
  await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0921/);

  // 直接開舊網址：本段本質就是在驗「整頁載入舊網址仍能到位」，非站內導頁可涵蓋，故此處例外用 page.goto
  await page.goto('/prepress-review/detail?id=pi-2026-0921');
  await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0921/);
  await expect(page.getByText('找不到頁面')).toHaveCount(0);
});

test('5.2 線下單的稿由業務代傳，審稿人員由訂單管理人指派（原編號 147）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await addPendingReviewItem(page, { name: '菜單摺頁加印版' });

  const row = page.locator('tr', { hasText: '菜單摺頁加印版' });
  await expect(row.getByText('待分派', { exact: true })).toBeVisible();

  // 業務對新造的印件按「上傳稿件」，選一個本機檔案後確定
  await row.getByRole('button', { name: '上傳稿件' }).click();
  const fileInput = page.locator('.ant-modal-content input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'artwork.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test artwork'),
  });
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定/ }).click();
  await expect(page.getByText(/線下單不自動分派/)).toBeVisible();
  await expect(row.getByText('待分派', { exact: true })).toBeVisible();

  // 訂單管理人到待分派印件頁，勾該印件按「分派審稿人員」
  await switchRole(page, '訂單管理人');
  await gotoInApp(page, '/prepress-review/pending-assign');
  const pendingRow = reviewRow(page, '菜單摺頁加印版');
  await pendingRow.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /分派審稿人員/ }).click();

  const dialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await dialog.getByLabel('審稿人員').click();
  await page.locator('.ant-select-dropdown').last().getByText(/魏彣軒/).click();
  await dialog.getByRole('button', { name: /確認分派/ }).click();
  await expect(page.getByText(/已分派 1 件印件/)).toBeVisible();

  // 分派後審稿狀態轉等待審稿、負責審稿填入所選的人
  await expect(pendingRow).toHaveCount(0);
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0903' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: '菜單摺頁加印版' });
  await expect(itemRow.getByText('等待審稿', { exact: true })).toBeVisible();
  await itemRow.getByRole('button', { name: '檢視印件' }).click();
  await expect(
    page.locator('tr', { hasText: '負責審稿人員' }).getByText('魏彣軒', { exact: true }),
  ).toBeVisible();
  // 輪次仍然只有 1 輪（原輪補上審稿人員，不另建新輪）
  await expect(page.getByText('審稿紀錄（1）')).toBeVisible();
});

test('5.3 收稿開關由業務控制，上傳入口只給業務（原編號 148）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await addPendingReviewItem(page, { name: '菜單摺頁收稿測試' });

  const row = page.locator('tr', { hasText: '菜單摺頁收稿測試' });
  // 把「稿件上傳開放」設為否（addPendingReviewItem 已在新增當下填妥難易度等七項必填欄位）
  await row.getByRole('button', { name: '編輯印件' }).click();
  const uploadSwitch = page.locator('.ant-form-item', { hasText: '稿件上傳開放' }).locator('.ant-switch');
  await uploadSwitch.click();
  await page.getByRole('button', { name: '確認' }).click();

  // 未開放時上傳鈕停用但不隱藏，提示要先到編輯印件打開收稿開關
  // 按鈕本身 pointer-events:none（停用態），Tooltip 的 hover 觸發點在外層包裹的 span
  const uploadButton = row.getByRole('button', { name: '上傳稿件' });
  await expect(uploadButton).toBeDisabled();
  await uploadButton.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('稿件上傳尚未開放');

  // 打開後同一顆鈕即可按
  await row.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('.ant-form-item', { hasText: '稿件上傳開放' }).locator('.ant-switch').click();
  await page.getByRole('button', { name: '確認' }).click();
  await expect(row.getByRole('button', { name: '上傳稿件' })).toBeEnabled();

  // 訂單管理人身分下上傳與補件入口都不出現
  await switchRole(page, '訂單管理人');
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0903' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const rowAsManager = page.locator('tr', { hasText: '菜單摺頁收稿測試' });
  await expect(rowAsManager.getByRole('button', { name: '上傳稿件' })).toHaveCount(0);
  await expect(rowAsManager.getByRole('button', { name: '補件' })).toHaveCount(0);

  // 跨訂單勾選：待分派印件頁同時勾選兩張不同訂單的印件，分派鈕停用
  await gotoInApp(page, '/prepress-review/pending-assign');
  await reviewRow(page, '菜單摺頁收稿測試').locator('input[type="checkbox"]').check();
  await reviewRow(page, '量販貨架卡').locator('input[type="checkbox"]').check();
  const assignBtn = page.getByRole('button', { name: /分派審稿人員/ });
  await expect(assignBtn).toBeDisabled();
  await assignBtn.hover({ force: true });
  await expect(page.getByRole('tooltip')).toContainText('批次分派限同一張訂單內的印件');
});

test('5.4 免審印件建立當下就是合格，仍要業務逐件確認可製作（原編號 150）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await addPendingReviewItem(page, {
    name: '菜單摺頁免審加印',
    type: '大貨印件',
    skipReview: true,
  });

  const row = page.locator('tr', { hasText: '菜單摺頁免審加印' });
  await expect(row.getByText('合格', { exact: true })).toBeVisible();

  await row.getByRole('button', { name: '檢視印件' }).click();
  await expect(page.getByText('審稿紀錄（1）')).toBeVisible();
  await expect(page.getByText('免審稿', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('（當前合格）')).toBeVisible();

  // 免審印件不進任何審稿人員的待審清單
  await switchRole(page, '審稿人員');
  await gotoInApp(page, '/prepress-review');
  await expect(page.getByText('菜單摺頁免審加印')).toHaveCount(0);

  // 回訂單項目按「確認可製作」
  await switchRole(page, '業務');
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0903' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const orderRow = page.locator('tr', { hasText: '菜單摺頁免審加印' });
  await orderRow.getByRole('button', { name: '確認可製作' }).click();
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定|確\s*認/ }).click();
  await expect(orderRow.getByText('已確認可製作', { exact: true })).toBeVisible();
});

// 5.5 起點：鏈八 ORD-2026-0920（訂單狀態待補件）。旗下 PI-2026-0922 禮盒外盒包裝已判不合格，
// PI-2026-0921 量販促銷吊卡等待審稿、負責審稿魏彣軒。訂單審稿段三格（稿件未上傳／等待審稿／
// 待補件）互為派生範圍，「待補件」本身即在 ORDER_REVIEW_DERIVABLE_STATUSES 內，補件與判定
// 都會依旗下印件重新歸納，不會卡進單向防退回規則（該規則只擋離開審稿段之後的訂單）。
test('5.5 判不合格的印件把訂單推到待補件，補件後自動退回等待審稿（原編號 151）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0920&tab=printItems');
  const boxRow = page.locator('tr', { hasText: '禮盒外盒包裝' });
  await expect(boxRow.getByText('不合格', { exact: true })).toBeVisible();
  await boxRow.getByRole('button', { name: '補件' }).click();
  await page
    .locator('.ant-modal-content input[type="file"]')
    .first()
    .setInputFiles({ name: 'box-resupply.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf') });
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定/ }).click();

  // 補件後 PI-2026-0922 轉已補件，訂單由待補件自動轉回等待審稿，「1 件不合格」標籤消失
  await expect(boxRow.getByText('已補件', { exact: true })).toBeVisible();
  await gotoInApp(page, '/orders');
  const orderListRow = page.locator('tr', { hasText: 'ORD-2026-0920' });
  await expect(orderListRow.getByText('等待審稿', { exact: true })).toBeVisible();
  await expect(orderListRow.getByText(/件不合格/)).toHaveCount(0);

  // 審稿人員在審稿清單對 PI-2026-0921 點「審稿」（導向印件詳情頁），完成審核選不合格並選退件原因送出
  await switchRole(page, '審稿人員');
  await gotoInApp(page, '/prepress-review');
  await reviewRow(page, '量販促銷吊卡').getByRole('button', { name: '審稿' }).click();
  await page.getByRole('button', { name: '完成審核' }).first().click();
  const reviewDialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await reviewDialog.getByText('不合格', { exact: true }).click();
  await reviewDialog.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
  await reviewDialog.getByRole('button', { name: /完成審核/ }).click();
  await expect(page.getByText(/已完成審核 1 件印件：不合格/)).toBeVisible();

  // PI-2026-0921 判不合格後訂單再次自動轉待補件、「1 件不合格」標籤重新出現
  await switchRole(page, '業務');
  await gotoInApp(page, '/orders');
  const orderListRow2 = page.locator('tr', { hasText: 'ORD-2026-0920' });
  await expect(orderListRow2.getByText('待補件', { exact: true })).toBeVisible();
  await expect(orderListRow2.getByText(/1 件不合格/)).toBeVisible();

  // 業務再對 PI-2026-0921 按「補件」，選檔案後確定
  await page.locator('a', { hasText: 'ORD-2026-0920' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const tagRow = page.locator('tr', { hasText: '量販促銷吊卡' });
  await expect(tagRow.getByText('不合格', { exact: true })).toBeVisible();
  await tagRow.getByRole('button', { name: '補件' }).click();
  await page
    .locator('.ant-modal-content input[type="file"]')
    .first()
    .setInputFiles({ name: 'tag-resupply.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf2') });
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定/ }).click();

  // 第二次補件後印件轉已補件，訂單又回到等待審稿，全程業務不必手動改訂單狀態
  await expect(tagRow.getByText('已補件', { exact: true })).toBeVisible();
  await gotoInApp(page, '/orders');
  const orderListRow3 = page.locator('tr', { hasText: 'ORD-2026-0920' });
  await expect(orderListRow3.getByText('等待審稿', { exact: true })).toBeVisible();
  await expect(orderListRow3.getByText(/件不合格/)).toHaveCount(0);
});

test('5.6 批次退件共用一句備註，改過的備註留得住軌跡（原編號 153）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await addPendingReviewItem(page, { name: '菜單摺頁批次一' });
  await addPendingReviewItem(page, { name: '菜單摺頁批次二' });

  for (const name of ['菜單摺頁批次一', '菜單摺頁批次二']) {
    const row = page.locator('tr', { hasText: name });
    await row.getByRole('button', { name: '上傳稿件' }).click();
    await page
      .locator('.ant-modal-content input[type="file"]')
      .first()
      .setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('a') });
    await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定/ }).click();
  }

  // 分派給同一位審稿人員（魏彣軒）
  await switchRole(page, '訂單管理人');
  await gotoInApp(page, '/prepress-review/pending-assign');
  await reviewRow(page, '菜單摺頁批次一').locator('input[type="checkbox"]').check();
  await reviewRow(page, '菜單摺頁批次二').locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /分派審稿人員/ }).click();
  const assignDialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await assignDialog.getByLabel('審稿人員').click();
  await page.locator('.ant-select-dropdown').last().getByText(/魏彣軒/).click();
  await assignDialog.getByRole('button', { name: /確認分派/ }).click();

  // 審稿人員展開該訂單，勾兩件印件按「批次審稿」，審核結果不合格、選退件原因、填共用審稿備註
  await switchRole(page, '審稿人員');
  await gotoInApp(page, '/prepress-review');
  await reviewRow(page, '菜單摺頁批次一').locator('input[type="checkbox"]').check();
  await reviewRow(page, '菜單摺頁批次二').locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /批次審稿/ }).click();

  const dialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await dialog.getByText('不合格', { exact: true }).click();
  await dialog.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
  await dialog.locator('.ant-form-item', { hasText: '共用審稿備註' }).locator('textarea').fill('整批規格說明不足，請補齊出血線');

  // 把其中一件的審稿備註個別改掉：從印件名稱文字節點往上找到含 textarea 的最近祖先（該印件卡片）
  const card2 = dialog
    .getByText('菜單摺頁批次二', { exact: true })
    .locator('xpath=ancestor::*[.//textarea][1]');
  await card2.locator('textarea').fill('這件另外需要調色');

  // 再改一次共用審稿備註
  await dialog.locator('.ant-form-item', { hasText: '共用審稿備註' }).locator('textarea').fill('整批規格說明不足，請補齊出血線與裁切線');
  await dialog.getByRole('button', { name: /完成審核/ }).click();
  await expect(page.getByText(/已完成審核 2 件印件：不合格/)).toBeVisible();

  // 兩件都轉不合格
  await expect(reviewRow(page, '菜單摺頁批次一').getByText('不合格', { exact: true })).toBeVisible();
  await expect(reviewRow(page, '菜單摺頁批次二').getByText('不合格', { exact: true })).toBeVisible();

  // 到印件詳情的審稿紀錄按「修改備註」改字（限該輪的原審稿人員本人）
  // 判定後審稿狀態已離開可審範圍，操作欄不再有「審稿」圖示按鈕（改顯示唯讀），改點印件名稱連結進詳情頁
  await expect(page.locator('.ant-modal-content, [role="dialog"]')).toHaveCount(0);
  // 清單剛重繪時第一次點擊可能落在尚未接上事件的節點，重試到網址換掉為止
  await expect(async () => {
    await page.getByRole('cell', { name: '菜單摺頁批次一', exact: true }).locator('a').click();
    await expect(page).toHaveURL(/\/print-items\/detail/, { timeout: 4000 });
  }).toPass({ timeout: 20000 });
  await page.getByRole('button', { name: '修改備註' }).click();
  const noteModal = page.locator('.ant-modal-content');
  await expect(noteModal.getByText('整批規格說明不足，請補齊出血線與裁切線')).toBeVisible();
  await noteModal.locator('textarea').fill('整批規格說明不足，請補齊出血線與裁切線（已補充：另附刀模稿）');
  await noteModal.getByRole('button', { name: /儲\s*存/ }).click();
  await expect(page.getByText(/已更新第 \d+ 輪審稿備註/)).toBeVisible();

  // 訂單管理人與審稿主管該格空白（無「修改備註」欄）
  await switchRole(page, '訂單管理人');
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0903' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  await page.locator('tr', { hasText: '菜單摺頁批次一' }).getByRole('button', { name: '檢視印件' }).click();
  await expect(page.getByRole('button', { name: '修改備註' })).toHaveCount(0);
});

// 5.7 起點：鏈八 ORD-2026-0913（審核通過，尚未回簽）旗下 PI-2026-0913（審稿狀態待分派）。
// 待分派審稿佇列的母集合只收已成立（回簽後）訂單，這張單還沒回簽，故整張不出現；
// 印件詳情頁的分派鈕原本沒有這道門檻，改在本條驗證兩處對齊。
// 只驗前半（回簽前不可分派）：把訂單走到已回簽在同一條測試內太繁瑣（要另補收款與審核步驟），
// 「回簽後兩處都能分派」對照組未驗，5.2／5.3 已驗過已成立訂單走分派全流程可正常運作。
test('5.7 回簽前的印件不可分派審稿', async ({ page }) => {
  // 訂單管理人開待分派審稿看不到 ORD-2026-0913
  await openAs(page, '訂單管理人', '/prepress-review/pending-assign');
  await expect(page.getByText('ORD-2026-0913', { exact: true })).toHaveCount(0);

  // 進該印件詳情頁：訂單詳情訂單項目按「檢視印件」
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0913' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: '秋季型錄拍攝背板 DM' });
  // 清單剛重繪時第一次點擊可能落在尚未接上事件的節點，重試到網址換掉為止
  await expect(async () => {
    await itemRow.getByRole('button', { name: '檢視印件' }).click();
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0913/i, { timeout: 4000 });
  }).toPass({ timeout: 20000 });

  // 分派鈕整顆不出現（當前狀態無法使用的功能就隱藏，不停用、不提示）
  await expect(page.getByRole('button', { name: /分派審稿人員/ })).toHaveCount(0);
});

// 5.14 起點：鏈八 ORD-2026-0920 旗下四件印件（預計出貨日皆為 2026-10-08，審稿維度分別為待分派、
// 等待審稿、不合格、合格）。/prepress-review 的訂單列表 defaultExpandAllRows，子表一律已展開，
// 不需另外點展開圖示。排序（5.13）與母列取值規則（5.15）用純函式驗證，
// 見 tests/unit/print-items/rules-prepress-review-sort.test.mjs；本條只驗畫面呈現的欄位與值。
test('5.14 待審訂單模組母列顯示預計出貨日，子列預計出貨日與內部完成日並列', async ({ page }) => {
  await openAs(page, '訂單管理人', '/prepress-review');
  const orderRow = page.getByText('ORD-2026-0920', { exact: true }).locator('xpath=ancestor::tr[1]');
  // 母列的預計出貨日：訂單層已無交期欄，值取自旗下未收斂印件最早的那一個
  await expect(orderRow.getByText('2026-10-08').first()).toBeVisible();
  // 舊欄名不再出現在母表表頭
  await expect(page.getByRole('columnheader', { name: '訂單交期' })).toHaveCount(0);

  // 子列預計出貨日與內部完成日並列：一般件，內部完成日＝預計出貨日（2026-10-08）－1 天＝2026-10-07
  const itemRow = reviewRow(page, '量販促銷吊卡');
  await expect(itemRow.getByText('2026-10-08')).toBeVisible();
  await expect(itemRow.getByText('2026-10-07')).toBeVisible();
});
