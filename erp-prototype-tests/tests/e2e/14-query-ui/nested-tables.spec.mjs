import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 情境目錄 14.44（2026-10-23 新增）：子母表樣式五處一致。
// 依據：change shipment-print-download-center grill G25；Sens memory/shared/ui-wording.md 第二節。
// 五處：出貨管理、訂單出貨單頁籤、訂單列表、訂單發票區、需求單詳情（報價紀錄）。
// 規則：母表與子表的巢狀呈現一律用共用子母表樣式（@shared/styles/table 的 nestedTableCss）；
// 子表有自己的表頭；每列可展開；沒有子列時顯示「沒有資料」。
// 樣式一致以展開列底色比對：nestedTableCss 把展開列的儲存格改成 surface 底色，五處取到的底色要相同。
//
// 起點資料：出貨管理鏈一 SH-2026-0601（有物流單）、鏈四 SH-2026-0820（草稿，沒有物流單）；
// 訂單出貨單頁籤鏈一 ORD-2026-0601；訂單列表第一頁；訂單發票區鏈二 ORD-2026-0710（發票 SSP-26081201）；
// 需求單詳情鏈一 Q-20260601-01（id=1）的報價紀錄頁籤。

test.describe.configure({ timeout: 180_000 });

/** 在 scope 內展開第一個可展開的母列，回展開列（tr.ant-table-expanded-row） */
async function expandFirst(scope) {
  const icon = scope.locator('.ant-table-row-expand-icon-collapsed').first();
  await expect(icon).toBeVisible();
  // 點開後圖示改成已展開，原定位器會改指到下一個收合的圖示，所以先以列鍵（data-row-key）固定母列
  const key = await icon.locator('xpath=ancestor::tr[1]').getAttribute('data-row-key');
  const parent = scope.locator(`tr.ant-table-row[data-row-key="${key}"]`).first();
  await parent.locator('.ant-table-row-expand-icon').click();
  const expanded = parent.locator('xpath=following-sibling::tr[1]');
  await expect(expanded).toHaveClass(/ant-table-expanded-row/);
  return expanded;
}

/** 展開列：子表有自己的表頭（至少一個欄名）；沒有子列時顯示「沒有資料」 */
async function expectSubTable(expanded, where) {
  const heads = (await expanded.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  expect(heads.length, `${where} 子表沒有表頭`).toBeGreaterThan(0);
  const dataRows = await expanded.locator('.ant-table-tbody tr.ant-table-row').count();
  if (dataRows === 0) await expect(expanded, `${where} 子表沒有子列時應顯示沒有資料`).toContainText('沒有資料');
}

/** 展開列儲存格的底色（nestedTableCss 套用後為 surface 色） */
const expandedBackground = (expanded) =>
  expanded.locator('> td').first().evaluate((td) => getComputedStyle(td).backgroundColor);

test('14.44 子母表樣式五處一致：出貨管理、訂單出貨單頁籤、訂單列表、訂單發票區、需求單詳情各有子表表頭，展開列底色相同', async ({
  page,
}) => {
  const backgrounds = {};

  // 一、出貨管理：有物流單的 SH-2026-0601 與沒有物流單的草稿 SH-2026-0820
  await openAs(page, '業務', '/qc-shipping/shipments');
  const shipRow = page.locator('tr.ant-table-row').filter({ hasText: 'SH-2026-0601' }).first();
  await shipRow.locator('.ant-table-row-expand-icon').click();
  const shipExpanded = shipRow.locator('xpath=following-sibling::tr[1]');
  await expect(shipExpanded).toHaveClass(/ant-table-expanded-row/);
  await expectSubTable(shipExpanded, '出貨管理');
  backgrounds['出貨管理'] = await expandedBackground(shipExpanded);
  const draftRow = page.locator('tr.ant-table-row').filter({ hasText: 'SH-2026-0820' }).first();
  await draftRow.locator('.ant-table-row-expand-icon').click();
  const draftExpanded = draftRow.locator('xpath=following-sibling::tr[1]');
  await expect(draftExpanded).toContainText('沒有資料');
  await expectSubTable(draftExpanded, '出貨管理（草稿）');

  // 二、訂單出貨單頁籤
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  const tabExpanded = await expandFirst(page.locator('.ant-tabs-tabpane-active'));
  await expectSubTable(tabExpanded, '訂單出貨單頁籤');
  backgrounds['訂單出貨單頁籤'] = await expandedBackground(tabExpanded);

  // 三、訂單列表（展開為印件子表）
  await openAs(page, '業務', '/orders');
  await expect(page.getByText(/ORD-\d{4}-\d{4}/).first()).toBeVisible();
  const orderExpanded = await expandFirst(page.locator('.ant-layout-content'));
  await expectSubTable(orderExpanded, '訂單列表');
  backgrounds['訂單列表'] = await expandedBackground(orderExpanded);

  // 四、訂單發票區（展開為折讓子表）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');
  const invoiceTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '發票號碼' }) }).first();
  await expect(invoiceTable).toBeVisible();
  const invoiceExpanded = await expandFirst(invoiceTable);
  await expectSubTable(invoiceExpanded, '訂單發票區');
  backgrounds['訂單發票區'] = await expandedBackground(invoiceExpanded);

  // 五、需求單詳情（報價紀錄頁籤，展開為印件快照子表）
  await openAs(page, '業務', '/quote-prototype/detail?id=1');
  await page.locator('.ant-tabs-tab', { hasText: '報價紀錄' }).first().click();
  const quoteExpanded = await expandFirst(page.locator('.ant-tabs-tabpane-active'));
  await expectSubTable(quoteExpanded, '需求單詳情');
  backgrounds['需求單詳情'] = await expandedBackground(quoteExpanded);

  // 五處展開列底色相同，且不是透明或白底（套了 nestedTableCss 的 surface 色）
  const values = Object.values(backgrounds);
  expect(new Set(values).size, `五處展開列底色不一致：${JSON.stringify(backgrounds)}`).toBe(1);
  expect(['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)', 'transparent']).not.toContain(values[0]);
});
