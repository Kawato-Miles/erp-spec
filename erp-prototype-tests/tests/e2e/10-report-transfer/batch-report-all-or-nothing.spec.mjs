import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { FAKE_PHOTO } from './_ch10.mjs';

// 情境目錄 10.61：一次報多筆時，任一筆被擋下整批不寫入，改好後整批重送成立。
// 起點資料：鏈五 WP-2026-0812-01（師傅劉阿海）的「信封四色印刷」（製作中，已報 310、良品 300、不良 10）
// 與「內卡四色印刷」（製作中，已報 205、良品 200、不良 5），兩筆都無未到料前置。
// 入口：我的工作包母列的整包報工（工單詳情的勾選批次報工共用同一顆對話框與同一段檢核，不另測）。

test('10.61 一次報多筆時任一筆被擋下整批不寫入，改好後整批重送各新增一筆報工', async ({ page }) => {
  await openAs(page, '師傅', '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  // 子表在母列展開後才渲染；先展開記下報工前的已報數量
  await pkgRow.getByLabel('展開行').click();
  const subTable = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subTable.locator('tr', { hasText: '信封四色印刷' }).first()).toContainText('310');
  await expect(subTable.locator('tr', { hasText: '內卡四色印刷' }).first()).toContainText('205');

  // 母列的整包報工
  await pkgRow.getByRole('button', { name: '報工', exact: true }).click();
  const dialog = page.locator('.ant-modal-content:visible').last();
  const envelope = dialog.locator('tbody tr.ant-table-row', { hasText: '信封四色印刷' });
  const card = dialog.locator('tbody tr.ant-table-row', { hasText: '內卡四色印刷' });
  await expect(dialog.locator('tbody tr.ant-table-row')).toHaveCount(2);

  // 兩筆都填數量；只有信封附照片，內卡故意不附
  for (const row of [envelope, card]) {
    const inputs = row.locator('input.ant-input-number-input');
    await inputs.nth(0).fill('100'); // 生產數量
    await inputs.nth(1).fill('100'); // 良品
  }
  await envelope.locator('input[type="file"]').first().setInputFiles(FAKE_PHOTO('信封現場照.jpg'));
  await dialog.getByRole('button', { name: /送出報工/ }).click();

  // 整批擋下：訊息指出整批未送出與原因，原因標在內卡那一列，信封那一列沒有錯誤
  await expect(page.getByText(/整批未送出/).last()).toBeVisible();
  await expect(page.getByText(/報工照片必填/).last()).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(card).toContainText('報工照片必填');
  await expect(envelope).not.toContainText('報工照片必填');
  await expect(page.getByText(/已送出 \d+ 筆報工/)).toHaveCount(0);

  // 沒有任何一筆寫入：對話框已報數量欄仍是原值
  await expect(envelope).toContainText('310');
  await expect(card).toContainText('205');

  // 改好被擋下那筆（補照片），整批重新送出
  await card.locator('input[type="file"]').first().setInputFiles(FAKE_PHOTO('內卡現場照.jpg'));
  await dialog.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText('已送出 2 筆報工').last()).toBeVisible();

  // 兩筆各新增一筆報工：已報數量各加 100（310→410、205→305，目標 515）
  const after = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(after.locator('tr', { hasText: '信封四色印刷' }).first()).toContainText('410 / 515');
  await expect(after.locator('tr', { hasText: '內卡四色印刷' }).first()).toContainText('305 / 515');
});
