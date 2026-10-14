import { expect, test } from '@playwright/test';
import { openAs, switchRole, taskRows } from '../_helpers.mjs';
import {
  checkTasks,
  cjkName,
  expectCell,
  gotoInAppStable,
  openWorkOrderFromList,
  waitModalsClosed,
} from './_page-helpers.mjs';

// 開發伺服器首次編譯各路由要數秒，測試逾時放寬
test.describe.configure({ timeout: 180_000 });

// 第八章 製程審核與交付產線：產線欄、三個狀態欄、一次交付全部任務、核可後改產線（8.14～8.17）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 work-order 規格差異檔。
// 欄位一律以表頭文字定位（expectCell）：「－」「已完成」這類值在同一列的其他欄也會出現。
const DASH = '－';

test('8.14 印務主管審核製程時任務列表帶出產線', async ({ page }) => {
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0906');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0906' })).toBeVisible({
    timeout: 20_000,
  });
  // 工單詳情的生產任務列表
  await expectCell(page, '雪銅紙 150g 菊全', '產線', '數位產線');
  await expectCell(page, '局部上光', '產線', '手工產線');

  await openWorkOrderFromList(page, 'WO-2026-0907');
  await expectCell(page, '雪銅紙 150g 菊全', '產線', '數位產線');
  await expectCell(page, '型錄四色雙面印刷', '產線', '數位產線');

  // 待審核工單列表展開兩張工單的子表
  await gotoInAppStable(page, '/work-orders/review-queue');
  for (const no of ['WO-2026-0906', 'WO-2026-0907']) {
    const row = page.locator('tr.ant-table-row', { hasText: no }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    const expand = row.locator('.ant-table-row-expand-icon');
    if ((await expand.getAttribute('class'))?.includes('collapsed')) await expand.click();
  }
  await expectCell(page, '局部上光', '產線', '手工產線');
  await expectCell(page, '型錄四色雙面印刷', '產線', '數位產線');
});

test('8.15 工單詳情任務列表現場執行欄序、轉交進度兩數與生產數量；外發任務交付後交付狀態顯示「－」', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  // 現場執行欄序：生產任務狀態、交付狀態、轉交狀態、生產數量、轉交進度（Miles 2026-10-12 拍板：生產數量移到轉交進度前）
  const floorHeaders = await page
    .locator('.ant-table-thead tr')
    .last()
    .locator('th')
    .allInnerTexts();
  const order = ['生產任務狀態', '交付狀態', '轉交狀態', '生產數量', '轉交進度'].map((label) =>
    floorHeaders.findIndex((text) => text.trim().startsWith(label)),
  );
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  // 轉交進度表頭為「轉交進度（搬運量／點收量）」
  await expect(
    page.locator('.ant-table-thead th').filter({ hasText: '轉交進度' }).first(),
  ).toContainText('轉交進度（搬運量／點收量）');

  // WO-2026-0812 各列（情境目錄 8.15 表）
  await expectCell(page, '雪銅紙 150g 菊全', '生產任務狀態', '已完成');
  await expectCell(page, '雪銅紙 150g 菊全', '轉交狀態', '不適用');
  await expectCell(page, '證書四色印刷', '生產任務狀態', '已完成');
  await expectCell(page, '證書四色印刷', '轉交狀態', '待點收');
  const certRow = taskRows(page).filter({ hasText: '證書四色印刷' });
  await expect(certRow).toContainText('500／480');
  // 生產數量只顯示當前報工累計，下行良品與不良品，不再顯示「515 / 515」式分母
  await expectCell(page, '證書四色印刷', '生產數量', '515良品 500／不良品 15');
  await expect(certRow).not.toContainText('515 / 515');
  // 已完成屬生產任務終態，交付狀態顯示「－」（wiki 生產任務交付狀態推導條件第 1 條）
  await expectCell(page, '雪銅紙 150g 菊全', '交付狀態', '－');
  await expectCell(page, '證書四色印刷', '交付狀態', '－');

  for (const [name, good] of [
    ['信封四色印刷', 300],
    ['內卡四色印刷', 200],
  ]) {
    await expectCell(page, name, '生產任務狀態', '製作中');
    await expectCell(page, name, '轉交狀態', '轉交中');
    await expectCell(page, name, '交付狀態', '已接收');
    // 已送達待點收不另設標記：點收量 0 與搬運量的差就看得出來
    const row = taskRows(page).filter({ hasText: name });
    await expect(row).toContainText(`${good}／0`);
    await expect(row).not.toContainText('有貨待點收');
  }

  for (const name of ['證書裁切', '信封裁切', '內卡裁切', '三件配套裝袋']) {
    await expectCell(page, name, '生產任務狀態', '待處理');
    await expectCell(page, name, '轉交狀態', '待轉交');
    await expectCell(page, name, '交付狀態', '已接收');
    await expect(taskRows(page).filter({ hasText: name })).toContainText('0／0');
  }

  // 對照一：WO-2026-0906 的局部上光是外包廠任務，交付狀態不推導；雪銅紙備料為未交付
  await openWorkOrderFromList(page, 'WO-2026-0906');
  await expectCell(page, '局部上光', '交付狀態', DASH);
  await expectCell(page, '雪銅紙 150g 菊全', '交付狀態', '未交付');

  // 對照二：WO-2026-0909 已作廢的 DM 對摺加工，轉交狀態與交付狀態都顯示「－」
  await openWorkOrderFromList(page, 'WO-2026-0909');
  await expectCell(page, 'DM 對摺加工', '生產任務狀態', '已作廢');
  await expectCell(page, 'DM 對摺加工', '轉交狀態', DASH);
  await expectCell(page, 'DM 對摺加工', '交付狀態', DASH);
});

test('8.16 印務在工單一次交付全部生產任務，每筆寫入交付時間、工單轉工單已交付；逐筆交付未到齊時工單停在製程審核完成', async ({
  page,
}) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0909');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  });

  // 一次交付全部：有效的三筆各寫入交付時間，已作廢那筆不寫入、不列入判定
  await page.getByRole('button', { name: cjkName('全部交付') }).click({ timeout: 20_000 });
  const confirm = page.locator('.ant-modal:visible').filter({ hasText: '全部交付' }).last();
  if (await confirm.waitFor({ timeout: 3000 }).then(() => true, () => false)) {
    await confirm.getByRole('button', { name: /全\s*部\s*交\s*付|確\s*認|確\s*定/ }).last().click();
  }
  await waitModalsClosed(page);
  for (const name of ['雪銅紙 150g 菊全', 'DM 雙面四色印刷', 'DM 裁切成品']) {
    await expectCell(page, name, '交付狀態', '已交付');
  }
  await expectCell(page, 'DM 對摺加工', '交付狀態', DASH);
  await expect(page.getByText('工單已交付', { exact: true }).first()).toBeVisible();

  // 逐筆交付：WO-2026-0908 只交一筆時工單維持製程審核完成，其餘兩筆交完才推進
  await openWorkOrderFromList(page, 'WO-2026-0908');
  await checkTasks(page, ['一級卡 300g 名片八開']);
  await page.getByRole('button', { name: /交付產線（1）/ }).click();
  await page
    .locator('.ant-modal')
    .filter({ hasText: '交付產線（1）' })
    .last()
    .getByRole('button', { name: /交付產線/ })
    .click();
  await expectCell(page, '一級卡 300g 名片八開', '交付狀態', '已交付');
  await expectCell(page, '名片雙面四色印刷', '交付狀態', '未交付');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();

  await checkTasks(page, ['名片雙面四色印刷', '名片裁切分盒']);
  await page.getByRole('button', { name: /交付產線（2）/ }).click();
  await page
    .locator('.ant-modal')
    .filter({ hasText: '交付產線（2）' })
    .last()
    .getByRole('button', { name: /交付產線/ })
    .click();
  await expectCell(page, '名片裁切分盒', '交付狀態', '已交付');
  await expect(page.getByText('工單已交付', { exact: true }).first()).toBeVisible();
});

test('8.17 製程核可後印務主管或工單負責人改產線，不必收回或重審，歷程留原值與新值', async ({
  page,
}) => {
  // 印務主管吳國豪改 WO-2026-0910 貼紙四色數位印刷的產線
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0910');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  });
  await changeProductionLine(page, '貼紙四色數位印刷', '手工產線');
  await expectCell(page, '貼紙四色數位印刷', '產線', '手工產線');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();
  // 不要求收回或重新送審
  await expect(page.getByText(/重新送審|收回工單/)).toHaveCount(0);
  await expectHistory(page, '貼紙四色數位印刷', '吳國豪');

  // 負責印務周建宏改 WO-2026-0908 名片雙面四色印刷的產線
  await switchRole(page, '印務');
  await openWorkOrderFromList(page, 'WO-2026-0908');
  await changeProductionLine(page, '名片雙面四色印刷', '手工產線');
  await expectCell(page, '名片雙面四色印刷', '產線', '手工產線');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();
  await expectHistory(page, '名片雙面四色印刷', '周建宏');
});

// 開任務的編輯表單、改產線、儲存
async function changeProductionLine(page, taskName, line) {
  await taskRows(page).filter({ hasText: taskName }).getByRole('button', { name: /編輯/ }).first().click({ timeout: 20_000 });
  const form = page.locator('.ant-modal:visible').last();
  const field = form.locator('.ant-form-item').filter({ has: page.getByText('產線', { exact: true }) }).first();
  await field.locator('.ant-select').click({ timeout: 20_000 });
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator(`.ant-select-item-option[title="${line}"]`)
    .click();
  await form.getByRole('button', { name: cjkName('儲存') }).click();
  await waitModalsClosed(page);
}

// 展開該筆任務，歷程記欄位原值、新值與修改人（預設驗產線由數位產線改為手工產線）
async function expectHistory(page, taskName, actor, text = /產線由 數位產線 改為 手工產線/) {
  const row = taskRows(page).filter({ hasText: taskName });
  const expand = row.locator('.ant-table-row-expand-icon');
  // 展開圖示在重新渲染後偶爾點不到，重試到歷程文字出現為止
  await expect(async () => {
    if ((await expand.getAttribute('class'))?.includes('collapsed')) await expand.click();
    await expect(page.getByText(text).first()).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await expect(page.locator('.ant-table-expanded-row').filter({ hasText: text }).first()).toContainText(actor);
}

// 8.18（2026-10-06 新增）：加工廠任務交付後照常推導已交付、已接收（拍板 D3）。
// 起點：鏈外 WO-2026-0812 的證書局部上光（加工廠、2026-08-22 交付、許文傑已接收）。
test('8.18 加工廠任務交付後照常推導已交付、已接收', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  await expectCell(page, '證書局部上光', '交付狀態', '已接收');
  // 對照：外包廠任務交付後仍顯示「－」（WO-2026-0906 的局部上光尚未交付，交付後的推導以純函式驗）
});


// 8.19（2026-10-12 新增、2026-10-14 改寫）：製程確認中，工單負責人、編輯（代理）成員與印務主管都能直接改產線與目的站點。
// 起點：鏈外 WO-2026-0907（製程確認中，負責印務蔡明修）的型錄四色雙面印刷（數位產線、品檢站）。
const lineAndDestinationFields = (page) => {
  const form = page.locator('.ant-modal:visible').last();
  return {
    form,
    line: form.locator('.ant-form-item').filter({ has: page.getByText('產線', { exact: true }) }).first().locator('.ant-select'),
    destination: form.locator('.ant-form-item').filter({ has: page.getByText('目的站點', { exact: true }) }).first().locator('.ant-select'),
  };
};

test('8.19 製程確認中印務主管吳國豪直接改產線與目的站點，工單維持製程確認中，歷程留原值與新值', async ({
  page,
}) => {
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0907');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0907' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
  await expectCell(page, '型錄四色雙面印刷', '產線', '數位產線');

  // 其餘欄位鎖定（製程已送審），只有產線與目的站點（以及備註）可改
  await taskRows(page).filter({ hasText: '型錄四色雙面印刷' }).getByRole('button', { name: /編輯/ }).first().click({ timeout: 20_000 });
  const { form, line, destination } = lineAndDestinationFields(page);
  await expect(form).toBeVisible();
  await expect(line).not.toHaveClass(/ant-select-disabled/);
  await expect(destination).not.toHaveClass(/ant-select-disabled/);
  await form.getByRole('button', { name: cjkName('取消') }).click();
  await waitModalsClosed(page);

  // 改產線：直接儲存，不要求收回或重新送審
  await changeProductionLine(page, '型錄四色雙面印刷', '裝訂產線');
  await expectCell(page, '型錄四色雙面印刷', '產線', '裝訂產線');
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/重新送審|收回工單/)).toHaveCount(0);
  await expectHistory(page, '型錄四色雙面印刷', '吳國豪', /產線由 數位產線 改為 裝訂產線/);

  // 改目的站點：同樣直接儲存，歷程留一筆（品檢站 → 其他站點）
  await taskRows(page).filter({ hasText: '型錄四色雙面印刷' }).getByRole('button', { name: /編輯/ }).first().click({ timeout: 20_000 });
  const second = lineAndDestinationFields(page);
  await second.destination.click();
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)').filter({ hasNotText: '品檢站' }).first().click();
  await second.form.getByRole('button', { name: cjkName('儲存') }).click();
  await expect(page.getByText(/已更新目的站點；已建的轉交單不跟著改/)).toBeVisible();
  await waitModalsClosed(page);
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
  // 目的站點變更記在任務歷程區：事件名、前後值與修改人
  await expect(page.getByText('目的站點變更；已建的轉交單不跟著改').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/目的站點：品檢站 → /).first()).toBeVisible();
  await expect(page.locator('.ant-table-expanded-row').filter({ hasText: '目的站點變更' }).first()).toContainText('吳國豪');
});

// 目錄情境的後半（切成負責印務蔡明修改產線）無法在畫面上演：模擬角色切換器的印務只有周建宏，
// 沒有蔡明修，所以這一半只在純函式測試驗（tests/unit/work-orders/rules-production-line.test.mjs 的 8.19）。
// 這裡只驗對照組：非負責印務（周建宏）打開同一張單，同樣改不了產線。
test('8.19 製程確認中非負責印務（周建宏）同樣改不了產線與目的站點', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0907');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0907' })).toBeVisible({
    timeout: 20_000,
  });
  await taskRows(page).filter({ hasText: '型錄四色雙面印刷' }).getByRole('button', { name: /編輯/ }).first().click({ timeout: 20_000 });
  const { form, line, destination } = lineAndDestinationFields(page);
  await expect(form).toBeVisible();
  await expect(line).toHaveClass(/ant-select-disabled/);
  await expect(destination).toHaveClass(/ant-select-disabled/);
});
