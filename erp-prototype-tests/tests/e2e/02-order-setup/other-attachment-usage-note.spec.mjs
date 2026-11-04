import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { button, dialog, openByNo, openScenario, openTab } from './_local.mjs';

// 情境 2.9：其他附件區按上傳，選檔案並填用途說明才送得出（wiki 訂單其他附件保存 主流程第 1 步）；
// 送出後清單帶檔名、用途說明、上傳者與上傳時間，檔名列可下載（主流程第 2 步）。
test(
  '2.9 訂單其他附件要填用途說明才送得出（商業需求覆蓋矩陣 B）',
  async ({ page }) => {
    test.setTimeout(60_000);
    await openScenario(page, '業務', '/orders', { openAs, switchRole });
    await openByNo(page, 'ORD-2026-0710');
    await openTab(page, '訂單附件');
    await expect(page.locator('body')).toContainText('尚無訂單附件');

    await button(page, '上傳附件').click();
    const panel = dialog(page);
    await panel.locator('input[type="file"]').setInputFiles({
      name: '合約掃描檔.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake'),
    });
    // 只選檔案、不填用途說明就送出：應擋下不得送出
    await panel.getByRole('button', { name: /^上\s*傳$/ }).click();
    await expect(page.getByText('請輸入用途說明')).toBeVisible();

    // 補填用途說明後再送一次
    await panel.getByLabel('用途說明').fill('客戶簽回合約掃描檔');
    await panel.getByRole('button', { name: /^上\s*傳$/ }).click();
    await expect(page.getByText('已上傳附件').last()).toBeVisible();

    // 送出後清單多一列，帶檔名、用途說明、上傳者與上傳時間
    const row = page.locator('tbody tr.ant-table-row').filter({ hasText: '合約掃描檔.pdf' });
    await expect(row).toContainText('客戶簽回合約掃描檔');
    await expect(row).toContainText('洪嘉駿');
  },
);
