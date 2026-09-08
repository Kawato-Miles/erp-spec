import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, clickIntoDetail, warmUp } from '../_helpers.mjs';
import { buildDeliveredSampleItem } from './_setup.mjs';

// 5.10／5.11 的前置（buildDeliveredSampleItem）會依序切到六個角色、走過近十個路由；開發伺服器
// 首次編譯某條路由時側欄選單可能還沒繪出目標項目，導致 gotoInApp 找不到選單項。在整條情境的
// 第一步 openAs 之後、尚無需保留狀態時，先把會用到的路由整頁載入暖機一輪。
const SAMPLE_FLOW_ROUTES = [
  '/orders/production-detail-queue',
  '/print-items', '/print-items/pending-assign', '/print-items/detail',
  '/work-orders', '/work-orders/detail', '/work-orders/review-queue',
  '/production-floor/dispatch', '/production-floor/work-packages',
];

// 情境目錄第五章補件：換人分派、候選為空、打樣結果三分流、補件不設上限。
// 雙層表格（審稿清單）的列定位同 prepress-review.spec.mjs 開頭註解：先精準命中印件名稱文字節點、
// 再取最近的 <tr> 祖先，避免命中外層展開容器。
const reviewRow = (page, text) =>
  page.getByText(text, { exact: true }).locator('xpath=ancestor::tr[1]');

test('5.8 換人分派審稿人員留調度軌跡', async ({ page }) => {
  // 起點：鏈八 ORD-2026-0920 旗下 PI-2026-0921（等待審稿、負責審稿魏彣軒）
  await openAs(page, '訂單管理人', '/prepress-review');
  await reviewRow(page, '量販促銷吊卡').locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /分派審稿人員/ }).click();

  const dialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  // 對話框帶出印件資訊表（同一顆「分派審稿人員」處理首次分派與換人）
  await expect(dialog.getByText('量販促銷吊卡', { exact: true })).toBeVisible();
  await dialog.getByLabel('審稿人員').click();
  // 候選列出啟用中的審稿人員並附能力等級（如「范湘瑜（能力 3）」），故用包含比對
  await page.locator('.ant-select-dropdown').last().getByText(/范湘瑜/).click();
  await dialog.getByLabel('原因（選填）').fill('魏彣軒手上案件堆積，改分給范湘瑜');
  await dialog.getByRole('button', { name: /確認分派/ }).click();
  await expect(page.getByText(/已分派 1 件印件/)).toBeVisible();

  // 換人後負責審稿改為范湘瑜，審稿狀態維持等待審稿、不另建新輪次
  await gotoInApp(page, '/orders');
  await page.locator('a', { hasText: 'ORD-2026-0920' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: '量販促銷吊卡' });
  await expect(itemRow.getByText('等待審稿', { exact: true })).toBeVisible();
  await itemRow.getByRole('button', { name: '檢視印件' }).click();
  await expect(page).toHaveURL(/print-items\/detail/);
  await expect(
    page.locator('tr', { hasText: '負責審稿人員' }).getByText('范湘瑜', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('審稿紀錄（1）')).toBeVisible();

  // 活動紀錄留一筆改派，含原審稿人員、新審稿人員、操作者與時間
  await page.getByRole('tab', { name: /活動紀錄/ }).click();
  await expect(page.getByText(/將印件從 魏彣軒 轉派至 范湘瑜/)).toBeVisible();
  await expect(page.getByText(/reason：魏彣軒手上案件堆積，改分給范湘瑜/)).toBeVisible();
});

// 5.9 起點：同 5.8 的印件。介面沒有停用審稿人員的入口，現行三位審稿人員（魏彣軒、范湘瑜、柯宥安）
// 皆為啟用中，候選為空這個狀態要改 mock 資料才驗得到；本次遵守「只讀不改 erp」，改不了 mock，
// 故無法在畫面上重現候選為空，記為 fixme。
test.fixme(
  '5.9 沒有可選的審稿人員時本次分派不成立',
  {
    annotation: {
      type: '與 prototype 不符',
      description:
        '候選審稿人員取 PREPRESS_REVIEWERS.filter(r => r.active)，現行三位（魏彣軒、范湘瑜、' +
        '柯宥安）皆為啟用中；介面沒有停用審稿人員的入口，候選為空這個狀態要改 erp mock 資料' +
        '（prepressReview.js 的 active 欄位）才驗得到，不在測試只讀不改 erp 的授權範圍內。',
    },
  },
  async () => {},
);

test('5.10 業務填打樣結果 OK，放行大貨投產', async ({ page }) => {
  test.setTimeout(180_000);
  const ITEM = '打樣測試樣品甲';
  await warmUp(page, SAMPLE_FLOW_ROUTES);
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await buildDeliveredSampleItem(page, ITEM);

  // 業務打開該打樣印件詳情，按「填打樣結果」
  await switchRole(page, '業務');
  await gotoInApp(page, '/print-items');
  await clickIntoDetail(page, ITEM, /print-items\/detail/);
  await page.getByRole('button', { name: '填打樣結果' }).click();
  const dialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await expect(dialog.getByText('OK（客戶確認樣品，可進大貨）')).toBeVisible();
  // 選單只有三個已判定值，沒有「待確認」可選
  await expect(dialog.getByText('待確認', { exact: true })).toHaveCount(0);
  await dialog.getByText('OK（客戶確認樣品，可進大貨）', { exact: true }).click();
  await dialog.getByRole('button', { name: /記錄結果/ }).click();
  await expect(page.getByText(/打樣結果已記為「OK」/)).toBeVisible();

  // 判定不可逆：再開同一顆按鈕時停用並提示已判定不可更改
  const button = page.getByRole('button', { name: '填打樣結果' });
  await expect(button).toBeDisabled();
  await button.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('已判定為「OK」，已判定，不可更改');

  // 大貨印件完全不出現這顆按鈕（鏈一既有的大貨印件、印製維度已送達，狀態不受本條動作影響）
  await gotoInApp(page, '/print-items');
  await clickIntoDetail(page, '會員卡（客製燙金）', /print-items\/detail/);
  await expect(page.getByRole('button', { name: '填打樣結果' })).toHaveCount(0);
});

test('5.11 打樣結果 NG-製程問題，系統自動在原印件下建新打樣工單', async ({ page }) => {
  test.setTimeout(180_000);
  const ITEM = '打樣測試樣品乙';
  await warmUp(page, SAMPLE_FLOW_ROUTES);
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');
  await buildDeliveredSampleItem(page, ITEM);

  await switchRole(page, '業務');
  await gotoInApp(page, '/print-items');
  await clickIntoDetail(page, ITEM, /print-items\/detail/);
  await page.getByRole('button', { name: '填打樣結果' }).click();
  const dialog = page.locator('.ant-modal-content, [role="dialog"]').last();
  await dialog.getByText('NG-製程問題（重打一輪）', { exact: true }).click();
  await expect(dialog.getByText(/系統自動建立新打樣工單/)).toBeVisible();
  await dialog.getByRole('button', { name: /記錄結果/ }).click();
  await expect(page.locator('.ant-modal-content:visible, [role="dialog"]:visible')).toHaveCount(0);
  await expect(
    page.getByText(/已建立新打樣工單.*印製狀態自「已送達」回「等待中」並即刻推進「製程已確認」/).last(),
  ).toBeVisible();
  await expect(page.locator('.ant-message-notice-content', { hasText: '打樣結果重置回「待確認」' })).toBeVisible();

  // 印製狀態即刻推進「製程已確認」，不進待確認製作細節佇列
  await expect(page.getByText('製程已確認', { exact: true }).first()).toBeVisible();

  // 工單與生產任務頁籤業務平台角色看不到（canSeeProductionTabs 排除業務／諮詢／會計），
  // 切印務才看得到這個 Tab；印件詳情不分角色，切角色不影響已在頁面上的資料
  await switchRole(page, '印務');
  await page.getByRole('tab', { name: /工單與生產任務/ }).click();
  // 兩張工單：原工單＋系統新建的草稿打樣工單
  await expect(page.getByText(/工單與生產任務（2）/)).toBeVisible();

  // 本輪的成品側數量帳自新工單建立時點重新累計，皆為 0
  // Descriptions 一列有兩組欄名／值，用 tr+hasText 抓不到精準配對，改抓欄名 th 緊接的下一個 td
  const valueOf = (label) =>
    page.getByText(label, { exact: false }).locator('xpath=ancestor::th[1]/following-sibling::td[1]');
  await expect(valueOf('累計已出貨數量')).toHaveText('0', { exact: true });
  await expect(valueOf('累計送達數')).toHaveText('0', { exact: true });

  // 打樣結果重置回待確認，可對新樣品重新判定：按鈕重新可按（守衛看的是印製狀態須為「已送達」，
  // 此刻已回「製程已確認」，故按鈕維持停用，但理由改為尚未送達——驗證守衛依現況重新求值，不是卡在舊的已判定理由）
  await switchRole(page, '業務');
  const button = page.getByRole('button', { name: '填打樣結果' });
  await expect(button).toBeDisabled();
  await button.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('樣品尚未送達客戶');
});

test('5.12 不合格後未補件不設上限、不設停滯提醒', async ({ page }) => {
  // 起點：鏈八 ORD-2026-0920 旗下 PI-2026-0922（已判不合格）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0920&tab=printItems');
  const boxRow = page.locator('tr', { hasText: '禮盒外盒包裝' });
  await expect(boxRow.getByText('不合格', { exact: true })).toBeVisible();

  // 走三輪以上「補件 → 審稿人員判不合格」，驗補件次數不設上限
  for (let round = 1; round <= 3; round += 1) {
    await boxRow.getByRole('button', { name: '補件' }).click();
    await page
      .locator('.ant-modal-content input[type="file"]')
      .first()
      .setInputFiles({
        name: `box-resupply-${round}.pdf`,
        mimeType: 'application/pdf',
        buffer: Buffer.from(`pdf-${round}`),
      });
    await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*定/ }).click();
    await expect(boxRow.getByText('已補件', { exact: true })).toBeVisible();

    await switchRole(page, '審稿人員');
    await gotoInApp(page, '/prepress-review');
    await reviewRow(page, '禮盒外盒包裝').getByRole('button', { name: '審稿' }).click();
    await page.getByRole('button', { name: '完成審核' }).first().click();
    const reviewDialog = page.locator('.ant-modal-content, [role="dialog"]').last();
    await reviewDialog.getByText('不合格', { exact: true }).click();
    await reviewDialog.locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
    await reviewDialog.getByRole('button', { name: /完成審核/ }).click();
    await expect(page.getByText(/已完成審核 1 件印件：不合格/).last()).toBeVisible();

    await switchRole(page, '業務');
    await gotoInApp(page, '/orders');
    await page.locator('a', { hasText: 'ORD-2026-0920' }).click();
    await page.getByRole('tab', { name: /訂單項目/ }).click();
    await expect(boxRow.getByText('不合格', { exact: true })).toBeVisible();
  }

  // 第三輪判不合格後，補件按鈕照樣在、沒有補件次數上限的擋下或提示
  await expect(boxRow.getByRole('button', { name: '補件' })).toBeEnabled();
  await boxRow.getByRole('button', { name: '檢視印件' }).click();
  await expect(page).toHaveURL(/print-items\/detail/);
  // 已累積至少 4 輪審稿紀錄（起點 1 輪＋本次 3 輪），系統不擋下、不特別標記已達上限
  await expect(page.getByText(/審稿紀錄（[4-9]\d*）/)).toBeVisible();
  await expect(page.getByText(/已達上限|補件次數上限|停滯提醒|請儘速補件/)).toHaveCount(0);
});
