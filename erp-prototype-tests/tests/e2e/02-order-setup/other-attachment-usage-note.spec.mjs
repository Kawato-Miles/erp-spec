import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { button, dialog, openByNo, openScenario, openTab } from './_local.mjs';

// fixme：情境 2.9 要求「其他附件區按上傳，只選檔案不填用途說明就送出時擋下」，但上傳附件 Modal
// （orders/_components/detail/AttachmentsTab.js）目前只有「檔名」一個文字欄，沒有真實檔案選取
//（input type=file）、也沒有「用途說明」欄位可填——用途說明只在送出後的表格欄呈現，沒有輸入來源。
// 與 prototype 不符，不改測試迎合、不改 prototype，回報待裁決（用途說明欄應在上傳當下就收，
// 還是事後才補填，需業務裁決）。
test.fixme(
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
    await panel.getByRole('button', { name: '上傳' }).click();
    await expect(page.getByText('請輸入用途說明')).toBeVisible();

    // 補填用途說明後再送一次
    await panel.getByLabel('用途說明').fill('客戶簽回合約掃描檔');
    await panel.getByRole('button', { name: '上傳' }).click();
    await expect(page.getByText('已上傳附件').last()).toBeVisible();

    // 送出後清單多一列，帶檔名、用途說明、上傳者與上傳時間
    const row = page.locator('tbody tr.ant-table-row').filter({ hasText: '合約掃描檔.pdf' });
    await expect(row).toContainText('客戶簽回合約掃描檔');
    await expect(row).toContainText('洪嘉駿');
  },
);
