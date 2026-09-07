import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  bomPicker,
  formField,
  openWorkOrder,
  pickBomRow,
  switchFormTab,
  taskForm,
} from './_ch07.mjs';

test('7.1 新增任務時前置相依不自動帶值（原編號 49）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  const before = await page.locator('.ant-table-tbody tr.ant-table-row').count();

  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 前置相依為空，不帶上一道也不帶任何值
  const depends = formField(page, '前置相依');
  await expect(depends.locator('.ant-select-selection-item')).toHaveCount(0);
  await expect(depends.getByText('選擇前置任務（可選同印件其他工單）')).toBeVisible();

  // 候選清單分組，可多選（本工單內四筆既有任務；本印件沒有其他工單，故只有這一組）
  await depends.locator('.ant-select').click();
  const dropdown = page.locator('.ant-select-dropdown').last();
  await expect(dropdown.getByText('本工單內')).toBeVisible();
  await expect(dropdown.locator('.ant-select-item-option')).toHaveCount(before);
  await expect(depends.locator('.ant-select-multiple')).toHaveCount(1);
  await page.keyboard.press('Escape');

  // 不選前置直接送出，照樣建得起來
  await formField(page, '印件部位').locator('input').fill('全張');
  await formField(page, '目的站點').locator('.ant-select').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await switchFormTab(page, '數量與放損');
  await formField(page, '預計生產').locator('input').fill('3000');
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toHaveCount(0);
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  await expect(rows).toHaveCount(before + 1);
  await expect(rows.last()).toContainText('無'); // 前置欄顯示「無」
});

test.fixme(
  '7.3 參考完稿圖唯讀，工單上不再上傳完稿（原編號 70）',
  async ({ page }) => {
    // 預期：基本資料顯示參考完稿圖的檔名與「已鎖定不隨改稿更動」說明；
    //       「編輯製程說明與品檢需求」對話框只有製程說明與品檢需求兩段。
    // 實際：工單詳情的「工單資訊」卡不列參考完稿圖（原始碼註解寫明改由印件檔案面板承載，
    //       同一份檔案不在一頁上出現兩次），畫面上沒有「已鎖定不隨改稿更動」這句；
    //       編輯入口名為「編輯工單資訊」，抽屜有預計完工日、製程說明、品檢需求三段。
    await openAs(page, '印務', '/work-orders');
    await openWorkOrder(page, 'WO-2026-0901');
    await page.getByText('查看工單資訊').click();
    await expect(page.getByText('參考完稿圖')).toBeVisible();
    await expect(page.getByText('已鎖定不隨改稿更動')).toBeVisible();
    await page.getByRole('button', { name: '編輯製程說明與品檢需求' }).click();
    await expect(page.locator('.ant-drawer-body')).toContainText('製程說明');
    await expect(page.locator('.ant-drawer-body')).toContainText('品檢需求');
    await expect(page.locator('.ant-drawer-body')).not.toContainText('上傳');
  },
);

test.fixme(
  '7.4 同一個日期在三個頁面叫同一個名字（原編號 71）',
  async ({ page }) => {
    // 預期：製程規劃、生產任務管理、工廠總覽三處的日期欄名皆為「預計完成日」，
    //       且製程規劃的表與對話框另有唯讀的「實際開工日」成對呈現。
    // 實際：製程規劃母表與生產任務管理頁的欄名是「預計完成」（無「日」字），
    //       實際開工只出現在製程規劃的展開層、欄名為「實際開工」，任務表單裡沒有這一欄。
    //       「預計開工日／建議開工日／建議日期」三個舊名確實已全數不存在。
    await openAs(page, '印務', '/work-orders');
    await openWorkOrder(page, 'WO-2026-0901');
    const planningHeaders = page.locator('.ant-table-thead th');
    await expect(planningHeaders.filter({ hasText: '預計完成日' })).toHaveCount(1);
    await expect(planningHeaders.filter({ hasText: '實際開工日' })).toHaveCount(1);
    for (const legacy of ['預計開工日', '建議開工日', '建議日期']) {
      await expect(page.getByText(legacy)).toHaveCount(0);
    }
    await switchRole(page, '生管');
    await gotoInApp(page, '/production-floor/dispatch');
    await expect(page.locator('.ant-table-thead th').filter({ hasText: '預計完成日' })).not.toHaveCount(0);
    await gotoInApp(page, '/production-floor/metrics');
    await expect(page.getByText('預計完成日').first()).toBeVisible();
  },
);

test.fixme(
  '7.5 需轉交標記在有報工之後鎖定（原編號 98）',
  async ({ page }) => {
    // 預期：鏈二 WO-2026-0710 的「裁切成型」（尚無報工）可切換需轉交，
    //       「海報四色印刷」（已有報工）切換鎖定並提示不可變更。
    // 實際：WO-2026-0710 的狀態是「製作中」，製程編輯把關條件只放行草稿與重新確認製程，
    //       故兩筆任務的表單都整份唯讀（標題後綴「製程已定案，僅備註可改」），
    //       需轉交切換一律停用，沒有「有無報工」這一層差別；原始碼註解亦寫明此規則不另設把關。
    await openAs(page, '印務', '/work-orders');
    await openWorkOrder(page, 'WO-2026-0710');
    const cutRow = page.locator('tr.ant-table-row').filter({ hasText: '裁切成型' });
    await cutRow.getByRole('button', { name: '編輯' }).click();
    const toggle = formField(page, '需轉交').locator('button[role="switch"]');
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(taskForm(page)).toContainText('不需轉交');
  },
);

test.fixme(
  '7.9 生產任務清單改成單一平列卡片（原編號 161）',
  async ({ page }) => {
    // 預期：卡內欄序為群組、廠商、任務名稱、製作細節、設備、預計生產、放損、目標數量、單位、備註，
    //       其後接狀態、預計完成日、前置與操作；卡上沒有任何成本或金額欄。
    // 實際：清單確實沒有材料／工序／裝訂分段標題、為單一序列（這一半成立），
    //       但呈現是母子表格（任務／印件部位／印務規劃／現場執行四個欄群），不是平列卡片，
    //       且「印務規劃」群內有「預估成本」金額欄，與「卡上沒有任何成本或金額欄」相斥。
    await openAs(page, '印務', '/work-orders');
    await openWorkOrder(page, 'WO-2026-0901');
    for (const section of ['材料任務', '工序任務', '裝訂任務']) {
      await expect(page.getByRole('heading', { name: section })).toHaveCount(0);
    }
    await expect(page.locator('.ant-table-thead th').filter({ hasText: '預估成本' })).toHaveCount(0);
  },
);

test('7.10 排序走側板，一次生效；清單被動過就擋下（原編號 162）', async ({ page }) => {
  test.setTimeout(90_000); // 拖曳整段可重試，預設 30 秒不夠
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  const originalFirst = (await rows.first().innerText()).includes('雪銅紙');
  expect(originalFirst).toBe(true);

  // 開排序側板拖一列後按取消：清單順序完全不變
  await page.getByRole('button', { name: '調整順序' }).click();
  const drawer = page.locator('.ant-drawer-open .ant-drawer-content');
  await expect(drawer).toBeVisible();
  await dragFirstRowDown(page, drawer);
  // AntD 兩字按鈕中間會插空白；側板關閉有動畫，關不掉就再按一次
  await expect(async () => {
    await drawer.getByRole('button', { name: /取\s*消/ }).click();
    await expect(drawer).toBeHidden({ timeout: 4000 });
  }).toPass({ timeout: 20000 });
  await expect(rows.first()).toContainText('雪銅紙');

  // 再開一次拖同一列後按確定：清單依側板新序，訊息寫已更新生產任務順序
  await page.getByRole('button', { name: '調整順序' }).click();
  const drawer2 = page.locator('.ant-drawer-open .ant-drawer-content');
  await dragFirstRowDown(page, drawer2);
  const message = page.locator('.ant-message');
  await drawer2.getByRole('button', { name: '確定' }).click();
  await expect(message).toContainText('已更新生產任務順序');
  await expect(drawer2).toBeHidden();
  await expect(rows.first()).toContainText('DM 四色雙面印刷');
  await expect(rows.nth(1)).toContainText('雪銅紙');

  // 「側板不關、在另一個分頁加開任務後按確定會被擋下」無法在此重現：
  // 模擬資料存在單一分頁的記憶體，另開分頁不會共用同一份清單。
  // 該把關條件（清單版本比對）的驗算在 tests/unit/work-orders/process-planning.test.mjs 的 7.10。
});

// 排序側板的列用 dnd-kit 排序：以鍵盤（Space 抓起、方向鍵移動、Space 放下）移動第一列到第二列
async function dragFirstRowDown(page, drawer) {
  const rows = drawer.locator('tbody tr');
  // 側板有滑入動畫，動畫中量到的座標會落在畫面外
  await expect(rows).toHaveCount(4);
  await page.waitForTimeout(500);
  // 機器忙碌時單次拖曳可能來不及被判定成拖曳，整段重試到列真的換位為止
  await expect(async () => {
    const from = await rows.nth(0).boundingBox();
    const to = await rows.nth(1).boundingBox();
    await page.mouse.move(from.x + 40, from.y + from.height / 2);
    await page.mouse.down();
    // PointerSensor 設了 5px 起拖門檻，逐格移動才會被判定為拖曳並算出落點
    const distance = to.y - from.y + 20;
    for (let i = 1; i <= 20; i += 1) {
      await page.mouse.move(from.x + 40, from.y + from.height / 2 + (distance * i) / 20);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect(rows.first()).toContainText('DM 四色雙面印刷', { timeout: 2000 });
  }).toPass({ timeout: 30000 });
}

test('7.12 預計完成日純手填，工單預計完工日取最大值（原編號 164）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 新增一筆任務時預計完成日為空，不帶任何系統推算值
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });
  await expect(formField(page, '預計完成日').locator('input')).toHaveValue('');
  await taskForm(page).getByRole('button', { name: '取消' }).click();
  await expect(taskForm(page)).toHaveCount(0);

  // 全部任務都不填時，工單資訊的預計完工日為空
  await page.getByText('查看工單資訊').click();
  const info = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: '預計完工日' })
    .locator('xpath=following-sibling::td[1]');
  await expect(info).toBeVisible();
  await expect(info).toContainText('—');

  // 填其中兩筆後，工單預計完工日等於已填者的最大值
  await fillTaskEndDate(page, '雪銅紙 150g 菊全', '2026-09-12');
  await fillTaskEndDate(page, 'DM 四色雙面印刷', '2026-09-18');
  await expect(info).toContainText('2026-09-18');

  // 在工單資訊直接填一個預計完工日時以人填的為準
  // 工單資訊卡標題列的編輯鈕（頁面上第一顆「編輯」）
  await page.getByRole('button', { name: /編輯$/ }).first().click();
  const drawer = page.locator('.ant-drawer-content');
  await drawer.getByPlaceholder('留空＝取任務預計完成日的最大值').fill('2026-09-25');
  await page.keyboard.press('Enter');
  await drawer.getByRole('button', { name: '儲存' }).click();
  await expect(drawer).toBeHidden();
  await expect(info).toContainText('2026-09-25');
});

// 對某一筆生產任務填預計完成日（走該列的編輯對話框）
async function fillTaskEndDate(page, taskName, date) {
  const row = page.locator('tr.ant-table-row').filter({ hasText: taskName }).first();
  await row.getByRole('button', { name: '編輯' }).click();
  const input = formField(page, '預計完成日').locator('input');
  await input.fill(date);
  await page.keyboard.press('Enter');
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(taskForm(page)).toHaveCount(0);
}
