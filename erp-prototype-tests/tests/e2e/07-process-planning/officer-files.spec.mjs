import { test, expect } from '@playwright/test';
import { assertRoleKept, expandPanel, gotoInApp, openAs, panelBlock, switchRole, warmUp } from '../_helpers.mjs';
import { clickIntoDetail, openWorkOrder } from './_ch07.mjs';

// 印務印件檔案與檔案備註記在印件層（change officer-files-to-print-item）。
// 規格：order-management spec § 印件印務印件檔案與檔案備註。

// 詳情頁「標題：值」的值（AntD Descriptions 以 th／td 成對呈現）
const descValue = (page, label) =>
  page.locator(`xpath=//th[normalize-space(.)="${label}"]/following-sibling::td[1]`).first();

// 7.36 的錨值：鏈七 PI-2026-0904 在 mock 上已有兩份印務印件檔案與一則檔案備註（見 MOCK-DATA-CHAIN 鏈七）
const MOCK_FILE_1 = '促銷立牌A1-板面裁切刀模-v1.pdf';
const MOCK_FILE_2 = '促銷立牌A1-立牌架壓折線位置圖-v1.pdf';
const MOCK_FILE_NOTE = '板面刀模含出血 3mm，裁切依此檔對版；立牌架壓折線位置以位置圖為準，組裝前先對樣。';
const NEW_FILE = '促銷立牌A1-燙金位置圖.pdf';
const NEW_FILE_NOTE = '燙金只做板面正面，立牌架不燙金。';

const officerFilesCell = (page) => descValue(page, '印務印件檔案');
const fileNoteCell = (page) => descValue(page, '檔案備註');
const filesPanelButton = (page, name) =>
  panelBlock(page, '印件檔案').getByRole('button', { name });

// 在工單詳情的印件檔案面板按「上傳檔案」，選一個檔案後確認
async function uploadOfficerFile(page, fileName) {
  await filesPanelButton(page, /上傳檔案/).click();
  const dialog = page.locator('.ant-modal').filter({ hasText: '上傳印件檔案' }).last();
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 mock'),
  });
  await expect(dialog).toContainText(fileName);
  await dialog.getByRole('button', { name: /確\s*認/ }).click();
  await expect(dialog).toBeHidden();
}

// 在工單詳情的印件檔案面板按「編輯備註」，改寫後儲存
async function editFileNote(page, note) {
  await filesPanelButton(page, /編輯備註/).click();
  const dialog = page.locator('.ant-modal').filter({ hasText: '編輯檔案備註' }).last();
  await expect(dialog).toBeVisible();
  await dialog.locator('textarea').fill(note);
  await dialog.getByRole('button', { name: /儲\s*存/ }).click();
  await expect(dialog).toBeHidden();
}

// 印務印件檔案格裡某一個檔案那一列的刪除鈕（每列兩顆：下載、刪除）
const removeButtonOf = (page, fileName) =>
  officerFilesCell(page)
    .locator('div')
    .filter({ hasText: fileName, has: page.locator('button') })
    .last()
    .getByRole('button')
    .nth(1);

test('7.36 同一印件兩張工單共用一份印務印件檔案與檔案備註，印件詳情頁不顯示（新增）', async ({ page }) => {
  // 本條走工單詳情、印件詳情、另一張工單詳情三頁，全程靠記憶體狀態存活：先暖機三條路由
  await warmUp(page, ['/work-orders', '/work-orders/detail', '/print-items/detail']);
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0904');

  // 起點：印件上已有的兩份檔案與一則備註，在工單詳情讀得到
  await expandPanel(page, '印件檔案');
  await expect(officerFilesCell(page)).toContainText(MOCK_FILE_1);
  await expect(officerFilesCell(page)).toContainText(MOCK_FILE_2);
  await expect(fileNoteCell(page)).toHaveText(MOCK_FILE_NOTE);

  // 周建宏是 WO-2026-0904 的負責人：上傳一份檔案、改寫檔案備註
  await uploadOfficerFile(page, NEW_FILE);
  await expect(officerFilesCell(page)).toContainText(NEW_FILE);
  await editFileNote(page, NEW_FILE_NOTE);
  await expect(fileNoteCell(page)).toHaveText(NEW_FILE_NOTE);

  // 印件詳情頁不顯示這兩欄
  await expandPanel(page, '印件基本資訊');
  await clickIntoDetail(page, 'PI-2026-0904', /print-items\/detail/);
  await assertRoleKept(page, '印務', '導頁到印件詳情頁');
  await expect(page.getByRole('heading', { name: '印件檔案', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('印務印件檔案');
  await expect(page.locator('body')).not.toContainText('檔案備註');
  await expect(page.locator('body')).not.toContainText(NEW_FILE);

  // 同印件的另一張工單 WO-2026-0905（尚未分派印務）詳情看到同一份檔案與同一則備註
  await page.getByRole('tab', { name: /工單與生產任務/ }).click();
  await clickIntoDetail(page, 'WO-2026-0905', /work-orders\/detail/);
  await expect(page.getByRole('heading', { name: 'WO-2026-0905' })).toBeVisible();
  await assertRoleKept(page, '印務', '導頁到 WO-2026-0905 工單詳情');
  await expandPanel(page, '印件檔案');
  for (const name of [MOCK_FILE_1, MOCK_FILE_2, NEW_FILE]) {
    await expect(officerFilesCell(page)).toContainText(name);
  }
  await expect(fileNoteCell(page)).toHaveText(NEW_FILE_NOTE);

  // 周建宏負責同印件的另一張工單，在這張單上同樣可維護：移除一份檔案（不限上傳者）
  await expect(filesPanelButton(page, /上傳檔案/)).toBeEnabled();
  await expect(filesPanelButton(page, /編輯備註/)).toBeEnabled();
  await removeButtonOf(page, MOCK_FILE_2).click();
  await expect(officerFilesCell(page)).not.toContainText(MOCK_FILE_2);

  // 回到 WO-2026-0904，同一份清單也不再列出被移除的檔案
  await expandPanel(page, '印件基本資訊');
  await clickIntoDetail(page, 'PI-2026-0904', /print-items\/detail/);
  await page.getByRole('tab', { name: /工單與生產任務/ }).click();
  await clickIntoDetail(page, 'WO-2026-0904', /work-orders\/detail/);
  await expect(page.getByRole('heading', { name: 'WO-2026-0904' })).toBeVisible();
  await assertRoleKept(page, '印務', '導頁回 WO-2026-0904 工單詳情');
  await expandPanel(page, '印件檔案');
  await expect(officerFilesCell(page)).toContainText(MOCK_FILE_1);
  await expect(officerFilesCell(page)).toContainText(NEW_FILE);
  await expect(officerFilesCell(page)).not.toContainText(MOCK_FILE_2);
});

test('7.37 印件已送達仍可上傳；非負責的印務入口停用（新增）', async ({ page }) => {
  await warmUp(page, ['/work-orders', '/work-orders/detail']);
  // 鏈一 PI-2026-0601 印製維度已送達，旗下 WO-2026-0601 已完成，負責印務周建宏
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0601');
  await expandPanel(page, '印件檔案');
  await expect(filesPanelButton(page, /上傳檔案/)).toBeEnabled();
  await expect(filesPanelButton(page, /編輯備註/)).toBeEnabled();
  await uploadOfficerFile(page, '會員卡-下次追加參考檔.pdf');
  await expect(officerFilesCell(page)).toContainText('會員卡-下次追加參考檔.pdf');

  // 錨例 WO-2026-0910（PI-2026-0803 唯一一張工單，負責印務蔡明修）：周建宏不是負責人也不是分享成員。
  // 印務的工單列表只列自己的單，故先以印務主管進詳情，並由印務主管先上傳一份檔案（主管可維護）
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0910');
  await expandPanel(page, '印件檔案');
  await uploadOfficerFile(page, '貼紙-模切位置圖.pdf');
  await expect(officerFilesCell(page)).toContainText('貼紙-模切位置圖.pdf');

  // 切成印務周建宏：看得到檔案清單與檔案備註，上傳與編輯備註停用
  await switchRole(page, '印務');
  await expect(page.getByRole('heading', { name: 'WO-2026-0910' })).toBeVisible();
  await expandPanel(page, '印件檔案');
  await expect(officerFilesCell(page)).toContainText('貼紙-模切位置圖.pdf');
  await expect(fileNoteCell(page)).toBeVisible();
  await expect(filesPanelButton(page, /上傳檔案/)).toBeDisabled();
  await expect(filesPanelButton(page, /編輯備註/)).toBeDisabled();
  // 按檔案列的刪除鈕不會移除檔案
  await removeButtonOf(page, '貼紙-模切位置圖.pdf').click();
  await expect(officerFilesCell(page)).toContainText('貼紙-模切位置圖.pdf');
});
