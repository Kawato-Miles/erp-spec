import { test, expect } from '@playwright/test';
import { assertRoleKept, openAs, gotoInApp, switchRole, warmUp } from '../_helpers.mjs';
import {
  bomPicker,
  clickIntoDetail,
  formField,
  openWorkOrder,
  pickBomRow,
  switchFormTab,
  taskForm,
} from './_ch07.mjs';

// 詳情頁「標題：值」的值（AntD Descriptions 以 th／td 成對呈現）
const descValue = (page, label) =>
  page.locator(`xpath=//th[normalize-space(.)="${label}"]/following-sibling::td[1]`).first();

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

test('7.3 參考完稿圖唯讀，工單上不再上傳完稿（原編號 70）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 工單資訊面板不列參考完稿圖，同一份檔案只在印件檔案面板出現一次，標為審稿後檔案
  await page.getByText('查看工單資訊').click();
  await expect(page.locator('body')).not.toContainText('參考完稿圖');
  // 工單自身的欄位表不含製程說明與品檢需求（兩欄的家在印件層）：先在這張卡上釘死沒有，
  // 後面再到印件基本資訊面板取值，才不會出現「工單留了一份舊值」也一樣通過的情形
  const workOrderInfo = page.locator('.ant-collapse').filter({ hasText: '查看工單資訊' }).first();
  await expect(workOrderInfo).toContainText('預計完工日');
  await expect(workOrderInfo).not.toContainText('製程說明');
  await expect(workOrderInfo).not.toContainText('品檢需求');
  await page.getByText('查看印件檔案').click();
  await expect(page.getByText('審稿後印件檔')).toBeVisible();

  // 編輯工單資訊抽屜只剩預計完工日一段：製程說明與品檢需求的家在印件層，不在工單抽屜裡；
  // 也沒有上傳完稿檔的入口（上傳檔案存的是印務自己的工單附件，是另一顆獨立按鈕）
  await page.getByRole('button', { name: /編輯$/ }).first().click();
  const drawer = page.locator('.ant-drawer-body');
  await expect(drawer).toContainText('預計完工日');
  await expect(drawer).not.toContainText('製程說明');
  await expect(drawer).not.toContainText('品檢需求');
  await expect(drawer).not.toContainText('上傳');
  await page.locator('.ant-drawer').getByRole('button', { name: '關閉' }).click();

  // 兩欄改列在印件基本資訊面板（印件層一份文字管旗下全部工單）
  await page.getByText('查看印件資訊').click();
  await expect(descValue(page, '製程說明')).toHaveText('雪銅紙 150g 四色雙面，裁切摺三摺後入庫。');
  await expect(descValue(page, '品檢需求')).toHaveText('摺線對齊允差 0.5mm，四色套印全檢。');
});

test('7.4 同一個日期在三個頁面叫同一個名字（原編號 71）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0710');

  // 製程規劃、生產任務管理頁欄名縮寫為「預計完成」；三個舊名一律不存在
  const planningHeaders = page.locator('.ant-table-thead th');
  await expect(planningHeaders.filter({ hasText: '預計完成' })).not.toHaveCount(0);
  for (const legacy of ['預計開工日', '建議開工日', '建議日期']) {
    await expect(page.getByText(legacy)).toHaveCount(0);
  }

  // 開工只列在生產任務的展開層，欄名「任務實際開工」（值取首筆報工的時間），
  // 不與預計完成成對呈現在表格上
  const firstRow = page.locator('tr.ant-table-row').first();
  await firstRow.locator('.ant-table-row-expand-icon').click();
  await expect(page.locator('tr.ant-table-expanded-row').first()).toContainText('任務實際開工');
  await expect(planningHeaders.filter({ hasText: '任務實際開工' })).toHaveCount(0);

  // 生管在生產任務管理頁看到同一欄名縮寫
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/dispatch');
  await expect(
    page.locator('.ant-table-thead th').filter({ hasText: '預計完成' }),
  ).not.toHaveCount(0);

  // 工廠總覽寫全名「預計完成日」（生管側欄沒有工廠總覽入口，改切印務檢視）
  await switchRole(page, '印務');
  await gotoInApp(page, '/production-floor/metrics');
  await expect(page.getByText('預計完成日').first()).toBeVisible();
});

test('7.5 需轉交標記在有報工之後鎖定（原編號 98）', async ({ page }) => {
  // 範圍限制：製程編輯只放行草稿與重新確認製程，草稿工單不會有報工——
  // 「已有報工後鎖定」與「僅有未終態轉交單時提示列出單號」兩段在現行資料驗不到，本測試不驗。
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 需轉交可切換，提示寫明標為否代表做完即放行下游、不建轉交單；預設值為是
  const cutRow = page.locator('tr.ant-table-row').filter({ hasText: '裁切成型' });
  await cutRow.getByRole('button', { name: '編輯' }).click();
  const needsTransferField = formField(page, '需轉交');
  const toggle = needsTransferField.locator('button[role="switch"]');
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  // 提示為滑鼠停留才展開的說明圖示，停留在欄名上看內容
  await needsTransferField.locator('.ant-form-item-label').hover();
  await expect(page.locator('.ant-tooltip-inner')).toContainText('做完即放行下游、不建轉交單');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await taskForm(page).getByRole('button', { name: '取消' }).click();
  await expect(taskForm(page)).toBeHidden();

  // 印務可逐筆標例外：三摺加工那一筆各自獨立，不受裁切成型剛才的改動影響
  const foldRow = page.locator('tr.ant-table-row').filter({ hasText: '三摺加工' });
  await foldRow.getByRole('button', { name: '編輯' }).click();
  const toggle2 = formField(page, '需轉交').locator('button[role="switch"]');
  await expect(toggle2).toBeEnabled();
  await expect(toggle2).toHaveAttribute('aria-checked', 'true');
});

test('7.9 生產任務清單是單一序列的母子表格（原編號 161）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0710');

  // 沒有分段標題，全部任務同一序列
  for (const section of ['材料任務', '工序任務', '裝訂任務']) {
    await expect(page.getByRole('heading', { name: section })).toHaveCount(0);
  }

  // 母表格四個欄群：任務、印件部位、印務規劃（設備／承作、投產目標、預估成本、預計完成、前置）、
  // 現場執行（狀態、交付狀態、完成量）。預估成本欄取任務小計（不含顏色）
  const headers = page.locator('.ant-table-thead th');
  for (const label of [
    '任務',
    '印件部位',
    '印務規劃',
    '設備／承作',
    '投產目標',
    '預估成本',
    '預計完成',
    '前置',
    '現場執行',
    '狀態',
    '交付狀態',
    '完成量',
  ]) {
    await expect(headers.filter({ hasText: label })).not.toHaveCount(0);
  }

  // 預估成本欄顯示該任務的任務小計（不含顏色）：海報四色印刷的任務小計為 5,981，
  // 它登記的 CMYK 四色（1,200 × 4 ＝ 4,800）不在這一欄裡，改成工單層的顏色列
  const printingRow = page.locator('tr.ant-table-row').filter({ hasText: '海報四色印刷' }).first();
  await expect(printingRow).toContainText('NT$ 5,981');
  await expect(printingRow).not.toContainText('NT$ 10,781');

  // 展開層才有的項目：製作細節、備註、單位、放損率、需轉交、計入完成度、派單，
  // 以及產出、點收、可轉交上限、任務實際開工、指派師傅
  const firstRow = page.locator('tr.ant-table-row').first();
  await firstRow.locator('.ant-table-row-expand-icon').click();
  const expandedRow = page.locator('tr.ant-table-expanded-row').first();
  for (const label of [
    '製作細節',
    '備註',
    '單位',
    '放損率',
    '需轉交',
    '計入完成度',
    '派單',
    '產出',
    '點收',
    '可轉交上限',
    '任務實際開工',
    '指派師傅',
  ]) {
    await expect(expandedRow).toContainText(label);
  }
});

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

// 7.23 起點：鏈五 WO-2026-0901（草稿、印務登打中），所屬印件 PI-2026-0901 的內部完成日為
// 2026-09-24。超期只提示不擋：規則正本 wiki [[交期鏈]]（Miles 2026-09-11 拍板），判定函式在
// work-orders/_lib/task-due-date-warning.js，納入與排除哪些任務由 7.24 純函式驗算。
test('7.23 生產任務的預計完成日晚於工單內部完成日時軟提示，不擋存檔', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 既有四筆任務的預計完成日皆未填，清單上沒有任何超期標示
  await expect(page.getByText('超出內部完成日')).toHaveCount(0);

  // 新增一筆裝訂任務，預計完成日填 2026-09-28（晚於內部完成日 2026-09-24 四天）
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '裝訂', keyword: '騎馬釘' });
  await formField(page, '印件部位').locator('input').fill('內頁');
  await formField(page, '目的站點').locator('.ant-select').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const endDate = formField(page, '預計完成日').locator('input');
  await endDate.fill('2026-09-28');
  await page.keyboard.press('Enter');
  await switchFormTab(page, '數量與放損');
  await formField(page, '預計生產').locator('input').fill('3000');
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();

  // 存檔照樣成功（表單關閉、任務進清單），另出現一句提示寫明晚於內部完成日、已存檔
  await expect(taskForm(page)).toHaveCount(0);
  await expect(page.getByText(/已新增生產任務「騎馬釘裝訂」/)).toBeVisible();
  await expect(
    page.getByText(
      /生產任務「騎馬釘裝訂」的預計完成日 2026-09-28 晚於本工單內部完成日 2026-09-24，已存檔，請自行確認排程/,
    ),
  ).toBeVisible();

  // 任務列的預計完成欄旁掛「超出內部完成日」標籤
  const taskRow = page.locator('tr.ant-table-row').filter({ hasText: '騎馬釘裝訂' }).first();
  await expect(taskRow.getByText('超出內部完成日')).toBeVisible();

  // 改成同日 2026-09-24：標籤消失（同日不算超期）
  await setTaskEndDate(page, '騎馬釘裝訂', '2026-09-24');
  await expect(page.getByText('超出內部完成日')).toHaveCount(0);
  await expect(taskRow).toContainText('2026-09-24');

  // 再改成早於內部完成日的 2026-09-20：一樣不標示
  await setTaskEndDate(page, '騎馬釘裝訂', '2026-09-20');
  await expect(page.getByText('超出內部完成日')).toHaveCount(0);
  await expect(taskRow).toContainText('2026-09-20');
});

// 改某一筆生產任務的預計完成日（走該列的編輯對話框）
async function setTaskEndDate(page, taskName, date) {
  const row = page.locator('tr.ant-table-row').filter({ hasText: taskName }).first();
  await row.getByRole('button', { name: '編輯' }).click();
  const input = formField(page, '預計完成日').locator('input');
  await input.fill(date);
  await page.keyboard.press('Enter');
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(taskForm(page)).toHaveCount(0);
}

// 7.25 的錨值：鏈七 PI-2026-0904（促銷立牌 A1）旗下有兩張草稿工單（WO-2026-0904 已指派周建宏、
// WO-2026-0905 未指派）。兩欄在 mock 已預填，內容以部件名分段（板面／立牌架），一份文字管兩張工單；
// 先驗預填值在兩頁同值，再從任一入口改、看另一頁是否跟著變（兩個方向各驗一次）
const MOCK_PROCESS_NOTE =
  '板面：合成紙 200g A1 單面四色，印後裁切成型。立牌架：PVC 板裁切壓折線後與板面組裝，每組一袋。';
const MOCK_QC_REQUIREMENT = '板面四色套印全檢，裁切尺寸允差 1mm；立牌架插接牢固度抽檢 5%。';
const NEW_PROCESS_NOTE = '雪銅紙 150g 四色單面，裱五層瓦楞後模切立牌成型。';
const NEW_QC_REQUIREMENT = '立牌裱板平整度全檢，裁切尺寸允差 1mm。';
const REVISED_PROCESS_NOTE = '板面改上霧膜後再模切，立牌架維持原做法。';
const REVISED_QC_REQUIREMENT = '霧膜氣泡與剝離抽檢 5%，其餘同前。';

// 在目前這一頁的印件基本資訊面板按「編輯製程與品檢」，填入兩欄後儲存
async function editProcessQc(page, { processNote, qcRequirement }) {
  await page.getByRole('button', { name: /編輯製程與品檢/ }).click();
  const drawer = page.locator('.ant-drawer-body');
  await drawer.getByLabel(/製程說明/).fill(processNote);
  await drawer.getByLabel(/品檢需求/).fill(qcRequirement);
  await page.locator('.ant-drawer').getByRole('button', { name: /儲\s*存/ }).click();
  // 同一條測試內會連續存兩次，前一則提示可能還沒淡出，故取第一則
  await expect(page.getByText('已更新製程說明與品檢需求').first()).toBeVisible();
}

// 目前這一頁的印件基本資訊面板顯示的兩欄值
async function expectProcessQc(page, { processNote, qcRequirement }) {
  await expect(descValue(page, '製程說明')).toHaveText(processNote);
  await expect(descValue(page, '品檢需求')).toHaveText(qcRequirement);
}

test('7.25 製程說明與品檢需求記在印件層，一處改動兩頁同值（新增）', async ({ page }) => {
  // 本條要走完工單詳情、印件詳情、另一張工單詳情三頁，全程靠記憶體狀態存活：
  // 先把三條路由各整頁載入一次暖機（此時還沒有要保留的狀態），避免首次編譯路由時
  // Next 取回 RSC 失敗退回整頁導航，把剛存進去的兩欄值一併清掉。
  await warmUp(page, ['/work-orders', '/work-orders/detail', '/print-items/detail']);
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0904');

  // 起點就已經是同一份事實：mock 預填的兩欄在工單詳情的印件基本資訊面板上讀得到
  await page.getByText('查看印件資訊').click();
  await expectProcessQc(page, {
    processNote: MOCK_PROCESS_NOTE,
    qcRequirement: MOCK_QC_REQUIREMENT,
  });

  // 印務在工單詳情改：寫的是印件事實、不是這張工單的欄位
  await editProcessQc(page, {
    processNote: NEW_PROCESS_NOTE,
    qcRequirement: NEW_QC_REQUIREMENT,
  });
  await expectProcessQc(page, {
    processNote: NEW_PROCESS_NOTE,
    qcRequirement: NEW_QC_REQUIREMENT,
  });

  // 點印件編號進印件詳情頁：同一筆事實，值必然相同（工單詳情改 → 印件詳情看得到）
  await clickIntoDetail(page, 'PI-2026-0904', /print-items\/detail/);
  await assertRoleKept(page, '印務', '導頁到印件詳情頁');
  await expectProcessQc(page, {
    processNote: NEW_PROCESS_NOTE,
    qcRequirement: NEW_QC_REQUIREMENT,
  });

  // 反方向：改在印件詳情頁，旗下工單跟著同值
  await editProcessQc(page, {
    processNote: REVISED_PROCESS_NOTE,
    qcRequirement: REVISED_QC_REQUIREMENT,
  });
  await expectProcessQc(page, {
    processNote: REVISED_PROCESS_NOTE,
    qcRequirement: REVISED_QC_REQUIREMENT,
  });

  // 同印件的另一張工單（WO-2026-0905）詳情也看到印件詳情剛改的那一份文字
  await page.getByRole('tab', { name: /工單與生產任務/ }).click();
  await clickIntoDetail(page, 'WO-2026-0905', /work-orders\/detail/);
  await expect(page.getByRole('heading', { name: 'WO-2026-0905' })).toBeVisible();
  await assertRoleKept(page, '印務', '導頁到 WO-2026-0905 工單詳情');
  await page.getByText('查看印件資訊').click();
  await expectProcessQc(page, {
    processNote: REVISED_PROCESS_NOTE,
    qcRequirement: REVISED_QC_REQUIREMENT,
  });
});

// 7.26 的錨值：鏈五 WO-2026-0901（草稿、負責印務周建宏、四筆任務其中三摺加工已計入完成度，
// 送審防呆已滿足），所屬印件 PI-2026-0901。mock 的兩欄原本有值，本條先由印務清空
// （兩欄選填、清空是印務自己就做得到的動作），再送出審核。
test('7.26 印件的製程說明與品檢需求都沒填，工單照樣送得出審核（新增）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 前置：印務把所屬印件的兩欄清成空白（兩欄選填，儲存不被擋下）
  await page.getByText('查看印件資訊').click();
  await editProcessQc(page, { processNote: '', qcRequirement: '' });
  await expectProcessQc(page, { processNote: '—', qcRequirement: '—' });

  // 送出審核：系統接受，提示只寫已送出，沒有一句要求補填兩欄
  await page.getByRole('button', { name: '提交審核' }).click();
  await expect(page.getByText('已提交印務主管審核')).toBeVisible();
  const messages = page.locator('.ant-message');
  await expect(messages).not.toContainText('製程說明');
  await expect(messages).not.toContainText('品檢需求');

  // 工單狀態轉製程確認中，球交到印務主管手上
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '提交審核' })).toHaveCount(0);
});
