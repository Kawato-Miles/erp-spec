import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

test.describe.configure({ timeout: 120_000 });

// 1.10 需求單客戶欄引用廠客主檔、類型欄改名
// 期望值取自 openspec quote-request § 需求單客戶欄引用廠客主檔、§ 印件項目管理：
// 需求單顯示客戶名稱（取廠客簡稱）與客戶編號兩項，皆為唯讀衍生；27 值的分類欄名為
// 「需求品項類別」，打樣／大貨那一欄名為「印件屬性」，畫面不再出現「印件類型」字樣。

test('1.10 需求單顯示廠客簡稱與客戶編號，類型欄改名後不再出現印件類型字樣', async ({ page }) => {
  // 起點資料：鏈一 Q-20260601-01（客戶誠品書店股份有限公司，廠客簡稱誠品書店、客戶編號 BC000011）
  await openAs(page, '業務', '/quote-prototype');
  await page.getByText('Q-20260601-01', { exact: true }).first().click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  const valueOf = (label) =>
    page.locator(`th.ant-descriptions-item-label:has-text("${label}") + td`).first();

  // 客戶名稱取廠客簡稱、客戶編號取廠客的客戶編號
  await expect(valueOf('客戶')).toHaveText('誠品書店');
  await expect(valueOf('客戶編號')).toHaveText('BC000011');

  // 27 值的分類欄名為「需求品項類別」
  await expect(page.locator('body')).toContainText('需求品項類別');

  // 印件項目列的打樣／大貨欄名為「印件屬性」，畫面不再出現「印件類型」字樣
  await expect(page.locator('.ant-table-thead')).toContainText('印件屬性');
  await expect(page.locator('body')).not.toContainText('印件類型');
});
