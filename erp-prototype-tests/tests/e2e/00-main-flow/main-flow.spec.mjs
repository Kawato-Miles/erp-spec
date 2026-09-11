import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, warmUp } from '../_helpers.mjs';
import {
  button,
  clickOpen,
  detailTitle,
  dialog,
  drawer,
  expandRow,
  goInApp,
  openByNo,
  openTab,
  orderHeader,
  pickMulti,
  pickMultiFirst,
  pickOption,
  quoteCurrentStep,
  rowOf,
  toastText,
  waitModalsClosed,
} from './_flow-helpers.mjs';

// 主流程 smoke（驗收依據：docs/main-flow.md 的 31 站站表）。
// 一件案子從需求單建單一路走到訂單製作完成，全程只在同一次瀏覽器連線內完成：
// 第一步 openAs 之後一律 gotoInApp 與 switchRole，記憶體裡的模擬資料不可被整頁重載清掉。
// 起點全程從零建，只依賴客戶、材料、設備、人員主檔。
//
// 已知斷點（站表與 prototype 不一致，測試照站表寫、不繞道；2026-09-08 首輪撰寫實測）：
//   第 16 站 審稿人員 乙再判合格——第 14 站退回重審後印件停在「待改稿」，
//     可審範圍只收「等待審稿／已補件」，故審稿人員沒有審稿入口。退回重審對話框本身也寫明
//     「新稿上傳時才開下一輪並轉等待審稿」：站表在第 14、15 站之間少了一站業務補件。
//   第 28 站 生管 開始搬運、抵達站點——這兩顆鈕只開給廠務（生管看到的是停用鈕，
//     提示「由廠務回報開始搬運／抵達站點」）。站表把這兩個動作記在生管身上。
//   兩處各補一站（第 14 站後加業務補件、第 28 站搬運兩動作改廠務）後，31 站全部通過。
//
// 未解斷點（2026-09-11 交期鏈重構後新增，prototype 缺陷、非測試可繞——見 docs/findings-20260908.md
// 「二、改 prototype」表）：
//   第 17 站 業務 甲、乙確認可製作——甲乙兩件印件皆未填印件層訂單交期（合法留空，需求單
//     單頭訂單交期本條測試也未填），訂單管理人進「待確認製作細節」佇列頁在兩列同時預計交期皆
//     為空時整頁當機。根因在 orders/production-detail-queue/page.js 的 delivery_date 回退鏈少一層
//     order.order_due_date、且排序未做空值安全比較，本測試不繞道，主流程 smoke 維持紅燈至此缺口
//     修復。

// 雙層表格（審稿清單、待分派審稿）的列：外層展開容器的文字會遞迴含整張子表，
// 故先精準命中印件名稱的文字節點，再取最近的 <tr> 祖先。
const reviewRow = (page, text) =>
  page.getByText(text, { exact: true }).locator('xpath=ancestor::tr[1]');

const CASE_NAME = '主流程 smoke 誠品週年慶';
const ITEM_A = '主流程印件甲';
const ITEM_B = '主流程印件乙';
const PRINT_STATION = '名片印刷｜海德堡 SM52 四色機';
// 印件部位刻意兩筆各異：工單製程規劃的清單以它分辨同一張工單的兩筆任務
const PART_PREP = '全張備料';
const PART_PRINT = '全張印刷';
// 現場端認任務用任務名稱（材料名與工序名），不用印件部位——
// 交付產線時 print_item_part 沒有被帶進現場任務，現場的報工對話框那一格顯示為「—」
const TASK_PREP = '雪銅紙';
const TASK_PRINT = '平版印刷';

// 在生產任務表單新增一筆任務：BOM 選擇器挑一列帶入，再補印件部位、需轉交、目的站點、前置與數量
async function addProductionTask(
  page,
  { bomTab, keyword, part, needsTransfer = true, destination, dependsOnFirst, plannedQty, countIn },
) {
  await button(page, '新增生產任務').click();
  const picker = dialog(page);
  await expect(picker).toContainText('選擇 BOM');
  if (bomTab !== '材料') await picker.locator('.ant-tabs-tab', { hasText: bomTab }).click();
  const search = picker.getByPlaceholder(`搜尋${bomTab}名稱`);
  await search.fill(keyword);
  await search.press('Enter'); // 共用篩選元件按 Enter 才送出
  await picker.locator('tbody tr.ant-table-row').first().click();
  await button(picker, '帶入').click();

  const form = dialog(page);
  await form.getByPlaceholder('例：書冊內頁').fill(part);
  if (!needsTransfer) {
    // 需轉交預設為是；標為否之後目的站點停用並清空（做完即放行下游、不建轉交單）
    await form.locator('button[role="switch"]').first().click();
  } else {
    await pickOption(page, form.locator('.ant-select').filter({ hasText: '選目的站點' }), destination);
  }
  if (dependsOnFirst) {
    // 候選此刻只有前一筆備料任務；任務名稱由 BOM 主檔拼出（材料名＋規格＋備料），故取第一筆不寫死字串
    await pickMultiFirst(page, form.locator('.ant-select').filter({ hasText: '選擇前置任務' }));
  }
  await form.locator('.ant-tabs-tab', { hasText: '數量與放損' }).click();
  const pane = form.locator('.ant-tabs-tabpane-active');
  // 計入完成度打開後這一頁的第一個數字欄變成「每份工單需生產數量」（預設 1），預計生產排在它後面
  if (countIn) await pane.locator('button[role="switch"]').first().click();
  await pane.locator('.ant-input-number-input').nth(countIn ? 1 : 0).fill(String(plannedQty));
  await button(form, '新增任務').click();
  await expect(dialog(page)).toHaveCount(0);
}

// 印務把一張工單的兩筆任務規劃完（備料＋印刷，印刷計入完成度）
async function planWorkOrder(page, workOrderNo, { prepNeedsTransfer }) {
  await goInApp(page, '/work-orders', gotoInApp);
  await openByNo(page, workOrderNo, /work-orders\/detail/);
  await openTab(page, '製程規劃');
  await addProductionTask(page, {
    bomTab: '材料',
    keyword: '雪銅紙',
    part: PART_PREP,
    needsTransfer: prepNeedsTransfer,
    destination: PRINT_STATION,
    plannedQty: 100,
  });
  await addProductionTask(page, {
    bomTab: '工序',
    keyword: '平版印刷',
    part: PART_PRINT,
    needsTransfer: false,
    dependsOnFirst: prepNeedsTransfer,
    plannedQty: 100,
    countIn: true,
  });
}

// 在工作包報一筆工（投入＝良品＝qty、不良 0）。
// 對話框逐列同時顯示工單編號與任務名稱，兩者一起用才認得出是哪一張工單的哪一筆任務。
async function reportInPackage(page, packageNo, workOrderNo, taskName, qty) {
  await goInApp(page, '/production-floor/work-packages', gotoInApp);
  await rowOf(page, packageNo).getByRole('button', { name: '報工' }).click();
  const box = page.locator('.ant-modal-body').last();
  const taskLine = box
    .locator('tbody tr')
    .filter({ hasText: workOrderNo })
    .filter({ hasText: taskName })
    .first();
  await taskLine.locator('input').nth(0).fill(String(qty));
  await taskLine.locator('input').nth(1).fill(String(qty));
  await button(page, '送出報工').click();
}

// 上傳用的假檔（Upload 的 beforeUpload 一律回 false，只暫存不上傳）
const fakeFile = (name, mimeType = 'application/pdf') => ({
  name,
  mimeType,
  buffer: Buffer.from(`fake ${name}`),
});

// 審稿人員在待審清單對一件印件完成審核。
// 合格路徑要交完稿縮圖（整批一張）與審稿後印件檔（逐件一份），缺件不可送出；
// 不合格路徑要選退件原因。
async function completeReview(page, name, result) {
  await goInApp(page, '/prepress-review', gotoInApp);
  await reviewRow(page, name).getByRole('button', { name: '審稿' }).click();
  await expect(page).toHaveURL(/print-items\/detail/, { timeout: 40_000 });
  await page.getByRole('button', { name: '完成審核' }).first().click();
  const box = dialog(page);
  await box.getByText(result, { exact: true }).click();
  if (result === '合格') {
    const files = box.locator('input[type="file"]');
    await files.nth(0).setInputFiles(fakeFile('final-thumb.jpg', 'image/jpeg'));
    await files.nth(1).setInputFiles(fakeFile(`${name}-reviewed.pdf`));
  } else {
    await box.locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').last().locator('.ant-select-item').first().click();
  }
  await box.getByRole('button', { name: /完成審核/ }).click();
  // 前一則提示可能還沒消失，故取最新那一則
  await expect(page.getByText(new RegExp(`已完成審核 1 件印件：${result}`)).last()).toBeVisible();
  await waitModalsClosed(page);
}

test('主流程：一件印件從需求單到製作完成', { tag: '@smoke' }, async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);
  // 單一動作與斷言的等待上限：走不通的站要當場失敗，不要把整條測試的 20 分鐘耗在一顆按鈕上
  page.setDefaultTimeout(30_000);

  let quoteNo = '';
  let orderNo = '';
  let woA = '';
  let woB1 = '';
  let woB2 = '';
  let packageNo = '';
  let ticketNo = '';

  await test.step('第 0 站 暖機：預先載入全部會用到的路由', async () => {
    await warmUp(page, [
      '/quote-prototype', '/quote-prototype/detail',
      '/orders', '/orders/detail', '/orders/approval-queue', '/orders/production-detail-queue',
      '/prepress-review', '/prepress-review/pending-assign',
      '/print-items', '/print-items/detail', '/print-items/pending-assign',
      '/work-orders', '/work-orders/detail', '/work-orders/review-queue',
      '/production-floor/dispatch', '/production-floor/work-packages', '/production-floor/pending-moves',
      '/production-floor/transfers', '/production-floor/receiving',
    ]);
  });

  await test.step('第 1 站 業務 建需求單並建兩件印件填難易度', async () => {
    await openAs(page, '業務', '/quote-prototype');
    const panel = drawer(page);
    await clickOpen(button(page, '新增'), panel.getByLabel('需求案名'));
    await panel.getByLabel('需求案名').fill(CASE_NAME);
    await pickOption(page, panel.getByLabel('客戶'), '誠品書店股份有限公司');
    await pickOption(page, panel.getByLabel('詢價來源'), 'Line');
    await pickOption(page, panel.getByLabel('接單業務'), '洪嘉駿');
    await pickMulti(page, panel.getByLabel('評估印務主管'), '吳國豪');
    await pickOption(page, panel.getByLabel('帳務公司'), '感官SSP');
    await panel.getByLabel('收款條件備註').fill('訂金 30%，驗收後 30 天內付清');
    await button(panel, '確認').click();
    await waitModalsClosed(page);

    // 需求單建立後狀態為需求確認中
    const listRow = rowOf(page, CASE_NAME);
    await expect(listRow.getByText('需求確認中', { exact: true })).toBeVisible();
    quoteNo = (await listRow.innerText()).match(/Q-\d{8}-\d{2}/)[0];

    // 進詳情建兩件印件，各填難易度與單價
    await page.getByRole('link', { name: quoteNo }).click();
    await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
    for (const name of [ITEM_A, ITEM_B]) {
      const itemPanel = drawer(page);
      await clickOpen(button(page, '新增印件'), itemPanel.getByLabel('項目名稱'));
      await itemPanel.getByLabel('項目名稱').fill(name);
      await pickOption(page, itemPanel.getByLabel('印件類型'), '大貨');
      await itemPanel.getByLabel('數量').fill('100');
      await pickOption(page, itemPanel.getByLabel('難易度'), '3');
      await itemPanel.getByLabel('單價（未稅）').fill('50');
      await button(itemPanel, '確認').click();
      await waitModalsClosed(page);
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
    await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  });

  await test.step('第 2 站 業務 送印務主管評估', async () => {
    await button(page, '送印務評估').click();
    // 狀態轉待評估成本（進度條走到「評估成本」）
    await expect(quoteCurrentStep(page)).toHaveText('評估成本');
    // 球交給印務主管：被指派的評估印務主管才看得到「評估完成」
    await switchRole(page, '印務主管');
    await expect(button(page, '評估完成')).toBeVisible();
  });

  await test.step('第 3 站 印務主管 填兩件印件成本並評估完成', async () => {
    for (const name of [ITEM_A, ITEM_B]) {
      const itemPanel = drawer(page);
      await clickOpen(rowOf(page, name).getByRole('button').first(), itemPanel.getByLabel('成本估算（未稅）'));
      await itemPanel.getByLabel('成本估算（未稅）').fill('20');
      await button(itemPanel, '確認').click();
      await waitModalsClosed(page);
    }
    await button(page, '評估完成').click();
    await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
    await waitModalsClosed(page);
    // 狀態轉已評估成本（進度條走到「報價」），球回業務：印務主管不再有主要動作鈕
    await expect(quoteCurrentStep(page)).toHaveText('報價');
    await expect(button(page, '評估完成')).toHaveCount(0);
  });

  await test.step('第 4 站 業務 進入議價並標記成交', async () => {
    await switchRole(page, '業務');
    await button(page, '報價').click();
    await expect(quoteCurrentStep(page)).toHaveText('議價');
    await button(page, '成交').click();
    // 成交後出現建立訂單鈕
    await expect(button(page, '建立訂單')).toBeVisible();
  });

  await test.step('第 5 站 業務 轉訂單', async () => {
    await clickOpen(button(page, '建立訂單'), dialog(page).getByRole('button', { name: /確\s*認/ }));
    await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
    // 開發伺服器首次編譯訂單詳情路由要好幾秒，換頁等待放寬
    await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
    const heading = await detailTitle(page).innerText();
    orderNo = heading.match(/ORD-\d{4}-\d{4}/)[0];
    // 訂單為草稿，客戶與兩件印件都帶入
    await expect(orderHeader(page)).toContainText('草稿');
    await expect(orderHeader(page)).toContainText(CASE_NAME);
    await openTab(page, '訂單項目');
    await expect(page.getByText(ITEM_A, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(ITEM_B, { exact: true }).first()).toBeVisible();
  });

  await test.step('第 6 站 業務 送業務主管審核', async () => {
    await button(page, '送主管審核').click();
    await expect(orderHeader(page)).toContainText('待業務主管審核');
    // 球交給業務主管：主管審核工作台出現這張單
    await switchRole(page, '業務主管');
    await goInApp(page, '/orders/approval-queue', gotoInApp);
    await expect(rowOf(page, orderNo)).toBeVisible();
  });

  await test.step('第 7 站 業務主管 核准', async () => {
    await rowOf(page, orderNo).getByRole('button').first().click();
    await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
    await button(page, '核准訂單').click();
    await expect(orderHeader(page)).toContainText('審核通過');
  });

  await test.step('第 8 站 業務 送出報價單並確認客戶回簽', async () => {
    await switchRole(page, '業務');
    await button(page, '已送報價單').click();
    await expect(orderHeader(page)).toContainText('報價待回簽');
    await button(page, '確認回簽').click();
    // 回簽後落點由審稿段派生：兩件印件都還沒交稿，故落在稿件未上傳
    await expect(orderHeader(page)).toContainText('稿件未上傳');
  });

  await test.step('第 9 站 業務 兩件印件上傳稿件', async () => {
    await openTab(page, '訂單項目');
    for (const name of [ITEM_A, ITEM_B]) {
      await rowOf(page, name).getByRole('button', { name: '上傳稿件' }).click();
      await dialog(page)
        .locator('input[type="file"]')
        .first()
        .setInputFiles(fakeFile(`${name}.pdf`));
      await dialog(page).getByRole('button', { name: /確\s*定/ }).click();
      await waitModalsClosed(page);
    }
    // 稿到了、人還沒派：訂單轉等待審稿
    await expect(orderHeader(page)).toContainText('等待審稿');
    // 球交給訂單管理人：待分派印件頁出現兩件
    await switchRole(page, '訂單管理人');
    await goInApp(page, '/prepress-review/pending-assign', gotoInApp);
    await expect(reviewRow(page, ITEM_A)).toBeVisible();
    await expect(reviewRow(page, ITEM_B)).toBeVisible();
  });

  await test.step('第 10 站 訂單管理人 分派審稿人員魏彣軒', async () => {
    await reviewRow(page, ITEM_A).locator('input[type="checkbox"]').check();
    await reviewRow(page, ITEM_B).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /分派審稿人員/ }).click();
    const assignDialog = dialog(page);
    await assignDialog.getByLabel('審稿人員').click();
    await page.locator('.ant-select-dropdown').last().getByText(/魏彣軒/).click();
    await assignDialog.getByRole('button', { name: /確認分派/ }).click();
    await waitModalsClosed(page);
    // 兩件離開待分派
    await expect(reviewRow(page, ITEM_A)).toHaveCount(0);
    await expect(reviewRow(page, ITEM_B)).toHaveCount(0);
    // 球交給審稿人員：待審清單出現這兩件
    await switchRole(page, '審稿人員');
    await goInApp(page, '/prepress-review', gotoInApp);
    await expect(reviewRow(page, ITEM_A)).toBeVisible();
    await expect(reviewRow(page, ITEM_B)).toBeVisible();
  });

  await test.step('第 11 站 審稿人員 印件甲判不合格選原因', async () => {
    await completeReview(page, ITEM_A, '不合格');
    // 訂單轉待補件、甲顯示不合格
    await switchRole(page, '業務');
    await goInApp(page, '/orders', gotoInApp);
    const orderRow = rowOf(page, orderNo);
    await expect(orderRow.getByText('待補件', { exact: true })).toBeVisible();
    await page.locator('a', { hasText: orderNo }).first().click();
    await openTab(page, '訂單項目');
    await expect(rowOf(page, ITEM_A).getByText('不合格', { exact: true })).toBeVisible();
  });

  await test.step('第 12 站 業務 印件甲補件', async () => {
    await rowOf(page, ITEM_A).getByRole('button', { name: '補件' }).click();
    await dialog(page)
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fakeFile('item-a-resupply.pdf'));
    await dialog(page).getByRole('button', { name: /確\s*定/ }).click();
    await waitModalsClosed(page);
    // 訂單回等待審稿、甲回原審稿人員的待審清單
    await expect(orderHeader(page)).toContainText('等待審稿');
    await switchRole(page, '審稿人員');
    await goInApp(page, '/prepress-review', gotoInApp);
    await expect(reviewRow(page, ITEM_A).getByRole('button', { name: '審稿' })).toBeVisible();
  });

  await test.step('第 13 站 審稿人員 甲判合格、乙判合格', async () => {
    for (const name of [ITEM_A, ITEM_B]) {
      await completeReview(page, name, '合格');
    }
    await switchRole(page, '業務');
    await goInApp(page, '/orders', gotoInApp);
    await page.locator('a', { hasText: orderNo }).first().click();
    await openTab(page, '訂單項目');
    await expect(rowOf(page, ITEM_A).getByText('合格', { exact: true })).toBeVisible();
    await expect(rowOf(page, ITEM_B).getByText('合格', { exact: true })).toBeVisible();
  });

  await test.step('第 14 站 業務 乙退回重審', async () => {
    await rowOf(page, ITEM_B).getByRole('button', { name: '退回重審' }).click();
    await dialog(page).getByRole('button', { name: /退回重審/ }).click();
    await waitModalsClosed(page);
    await expect(rowOf(page, ITEM_B).getByText('待改稿', { exact: true })).toBeVisible();
    // 乙回到原審稿人員的待審清單
    await switchRole(page, '審稿人員');
    await goInApp(page, '/prepress-review', gotoInApp);
    await expect(reviewRow(page, ITEM_B)).toBeVisible();
  });

  await test.step('第 15 站 業務 乙補件上傳新稿', async () => {
    // 退回重審不開新輪，新稿上傳時才開下一輪並轉等待審稿（wiki 印件審稿、稿件管理規則）
    await switchRole(page, '業務');
    await goInApp(page, '/orders', gotoInApp);
    await page.locator('a', { hasText: orderNo }).first().click();
    await openTab(page, '訂單項目');
    await rowOf(page, ITEM_B).getByRole('button', { name: '補件' }).click();
    await dialog(page)
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fakeFile('item-b-resupply.pdf'));
    await dialog(page).getByRole('button', { name: /確\s*定/ }).click();
    await waitModalsClosed(page);
    await expect(rowOf(page, ITEM_B).getByText('待改稿', { exact: true })).toHaveCount(0);
    // 乙回原審稿人員的待審清單，且有審稿入口
    await switchRole(page, '審稿人員');
    await goInApp(page, '/prepress-review', gotoInApp);
    await expect(reviewRow(page, ITEM_B).getByRole('button', { name: '審稿' })).toBeVisible();
  });

  await test.step('第 16 站 審稿人員 乙再判合格', async () => {
    await completeReview(page, ITEM_B, '合格');
  });

  await test.step('第 17 站 業務 甲、乙確認可製作', async () => {
    await switchRole(page, '業務');
    await goInApp(page, '/orders', gotoInApp);
    await page.locator('a', { hasText: orderNo }).first().click();
    await openTab(page, '訂單項目');
    for (const name of [ITEM_A, ITEM_B]) {
      await rowOf(page, name).getByRole('button', { name: '確認可製作' }).click();
      await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
      await waitModalsClosed(page);
      await expect(rowOf(page, name).getByText('已確認可製作', { exact: true })).toBeVisible();
    }
    await expect(orderHeader(page)).toContainText('製作等待中');
    // 球交給訂單管理人：待確認製作細節佇列出現兩件
    await switchRole(page, '訂單管理人');
    await goInApp(page, '/orders/production-detail-queue', gotoInApp);
    await expect(rowOf(page, ITEM_A)).toBeVisible();
    await expect(rowOf(page, ITEM_B)).toBeVisible();
  });

  await test.step('第 18 站 訂單管理人 兩件確認製作細節', async () => {
    for (const name of [ITEM_A, ITEM_B]) {
      await rowOf(page, name).getByLabel('確認製作細節').click();
      await button(dialog(page), '確認製作細節').click();
      const text = await toastText(page, /WO-\d{4}-\d{4}/);
      const wo = text.match(/WO-\d{4}-\d{4}/)[0];
      if (name === ITEM_A) woA = wo;
      else woB1 = wo;
      await expect(rowOf(page, name)).toHaveCount(0);
    }
    // 球交給印務主管：待分派印件頁出現兩件
    await switchRole(page, '印務主管');
    await goInApp(page, '/print-items/pending-assign', gotoInApp);
    await expect(rowOf(page, ITEM_A)).toBeVisible();
    await expect(rowOf(page, ITEM_B)).toBeVisible();
  });

  await test.step('第 19 站 印務主管 乙加開一張工單並把三張都派周建宏', async () => {
    // 乙：先加開一張，再把兩張都指給周建宏（審核主管預帶當前登入的吳國豪）
    await rowOf(page, ITEM_B).getByLabel('工單分派').click();
    let assign = dialog(page);
    await button(assign, '加開一張工單').click();
    for (let i = 1; i <= 2; i += 1) {
      await pickOption(page, assign.locator('.ant-select').nth(i), '周建宏');
    }
    await expect(assign.locator('.ant-select').nth(0)).toContainText('吳國豪');
    await button(assign, '送出').click();
    await waitModalsClosed(page);

    // 甲：一張，指給周建宏
    await rowOf(page, ITEM_A).getByLabel('工單分派').click();
    assign = dialog(page);
    await pickOption(page, assign.locator('.ant-select').nth(1), '周建宏');
    await button(assign, '送出').click();
    await waitModalsClosed(page);

    // 派齊後待分派頁清空
    await expect(rowOf(page, ITEM_A)).toHaveCount(0);
    await expect(rowOf(page, ITEM_B)).toHaveCount(0);

    // 乙的第二張工單編號由印件總覽的展開列取得
    await goInApp(page, '/print-items', gotoInApp);
    await expandRow(page, ITEM_B);
    const expanded = await page.locator('.ant-table-expanded-row').last().innerText();
    const numbers = [...new Set(expanded.match(/WO-\d{4}-\d{4}/g) ?? [])];
    expect(numbers).toHaveLength(2);
    woB2 = numbers.find((n) => n !== woB1);
    expect(woB2).toBeTruthy();

    // 印務工單列表出現三張
    await goInApp(page, '/work-orders', gotoInApp);
    for (const wo of [woA, woB1, woB2]) {
      await expect(page.getByText(wo, { exact: true }).first()).toBeVisible();
    }
  });

  await test.step('第 20 站 印務 三張各填備料加印刷兩筆任務', async () => {
    await switchRole(page, '印務');
    // 甲的備料需轉交、目的站點為印刷站；印刷掛在備料之後並計入完成度
    await planWorkOrder(page, woA, { prepNeedsTransfer: true });
    await expect(button(page, '提交審核')).toBeEnabled();
    for (const wo of [woB1, woB2]) {
      await planWorkOrder(page, wo, { prepNeedsTransfer: false });
      await expect(button(page, '提交審核')).toBeEnabled();
    }
  });

  await test.step('第 21 站 印務 甲送審', async () => {
    await goInApp(page, '/work-orders', gotoInApp);
    await openByNo(page, woA, /work-orders\/detail/);
    await button(page, '提交審核').click();
    await expect(page.locator('body')).toContainText('已提交印務主管審核');
    // 球交給印務主管：待審核工單列表出現這張
    await switchRole(page, '印務主管');
    await goInApp(page, '/work-orders/review-queue', gotoInApp);
    await expect(rowOf(page, woA)).toBeVisible();
  });

  await test.step('第 22 站 印務主管 退回甲並填原因', async () => {
    await rowOf(page, woA).getByLabel('退回').click();
    const rejectDialog = dialog(page);
    await rejectDialog.locator('textarea').first().fill('備料規格要改為 250 磅');
    await button(rejectDialog, '退回').click();
    await waitModalsClosed(page);
    await expect(rowOf(page, woA)).toHaveCount(0);
    // 甲回重新確認製程，詳情頂部顯示退回原因
    await goInApp(page, '/work-orders', gotoInApp);
    await openByNo(page, woA, /work-orders\/detail/);
    await expect(page.getByText('備料規格要改為 250 磅')).toBeVisible();
  });

  await test.step('第 23 站 印務 甲重新送審、乙兩張送審', async () => {
    await switchRole(page, '印務');
    for (const wo of [woA, woB1, woB2]) {
      await goInApp(page, '/work-orders', gotoInApp);
      await openByNo(page, wo, /work-orders\/detail/);
      await button(page, '提交審核').click();
      await expect(page.locator('body')).toContainText('已提交印務主管審核');
    }
    await switchRole(page, '印務主管');
    await goInApp(page, '/work-orders/review-queue', gotoInApp);
    for (const wo of [woA, woB1, woB2]) {
      await expect(rowOf(page, wo)).toBeVisible();
    }
  });

  await test.step('第 24 站 印務主管 三張核可', async () => {
    for (const wo of [woA, woB1, woB2]) {
      await rowOf(page, wo).getByLabel('審核通過').click();
      await button(dialog(page), '核可').click();
      await expect(page.locator('body')).toContainText('製程已核可');
      await waitModalsClosed(page);
    }
    // 待審核列表不再有這三張（清單本來就有其他 mock 工單，故只驗本次這三張離開）
    for (const wo of [woA, woB1, woB2]) {
      await expect(rowOf(page, wo)).toHaveCount(0);
    }
  });

  await test.step('第 25 站 印務 三張全部任務交付產線', async () => {
    await switchRole(page, '印務');
    for (const wo of [woA, woB1, woB2]) {
      await goInApp(page, '/work-orders', gotoInApp);
      await openByNo(page, wo, /work-orders\/detail/);
      await openTab(page, '製程規劃');
      await page.locator('thead input[type="checkbox"]').first().check();
      await button(page, '交付產線（2）').click();
      await button(dialog(page), '交付產線').click();
      await expect(page.locator('body')).toContainText('2 筆進生管待派清單');
      await waitModalsClosed(page);
    }
    // 球交給生管：待派清單出現六筆
    await switchRole(page, '生管');
    await goInApp(page, '/production-floor/dispatch', gotoInApp);
    for (const wo of [woA, woB1, woB2]) {
      await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: wo })).toHaveCount(2);
    }
  });

  await test.step('第 26 站 生管 接收六筆並建工作包指派師傅劉阿海', async () => {
    for (const wo of [woA, woB1, woB2]) {
      const rows = page.locator('tbody tr.ant-table-row').filter({ hasText: wo });
      for (let i = 0; i < 2; i += 1) {
        await rows.nth(i).locator('input[type="checkbox"]').check({ force: true });
      }
    }
    await button(page, '接收工作（6）').click();
    await expect(page.getByText(/已接收工作 6 筆生產任務/)).toBeVisible();
    await button(page, '派工（6）').click();
    const dispatchDialog = dialog(page);
    await pickOption(page, dispatchDialog.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select'), '劉阿海');
    await button(dispatchDialog, '確認派工').click();
    const text = await toastText(page, /已建立工作包/);
    packageNo = text.match(/WP-[\w-]+/)[0];
    await waitModalsClosed(page);
    // 球交給師傅：工作包頁出現這一包
    await switchRole(page, '師傅');
    await goInApp(page, '/production-floor/work-packages', gotoInApp);
    await expect(rowOf(page, packageNo)).toBeVisible();
  });

  await test.step('第 27 站 師傅 報甲備料完成', async () => {
    await reportInPackage(page, packageNo, woA, TASK_PREP, 100);
    await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
    await waitModalsClosed(page);
    // 待搬頁出現可搬量（師傅無此入口，交由生管確認）
    await switchRole(page, '生管');
    await goInApp(page, '/production-floor/pending-moves', gotoInApp);
    await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: woA })).toHaveCount(1);
  });

  await test.step('第 28 站 生管 建轉交單', async () => {
    const moveRow = page.locator('tbody tr.ant-table-row').filter({ hasText: woA }).first();
    await moveRow.locator('input[type="checkbox"]').check({ force: true });
    await button(page, '建立轉交單（1）').click();
    await page.getByRole('button', { name: /建立 1 張單/ }).click();
    const text = await toastText(page, /TT-\d{8}-\d{3}/);
    ticketNo = text.match(/TT-\d{8}-\d{3}/)[0];
    await waitModalsClosed(page);
    // 球交給廠務：轉交單列表出現這張單、狀態待搬運
    await goInApp(page, '/production-floor/transfers', gotoInApp);
    await expect(rowOf(page, ticketNo)).toBeVisible();
  });

  await test.step('第 29 站 廠務 開始搬運、抵達站點', async () => {
    await switchRole(page, '廠務');
    await goInApp(page, '/production-floor/transfers', gotoInApp);
    const ticketRow = rowOf(page, ticketNo);
    await ticketRow.getByRole('button', { name: '開始搬運' }).click();
    await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
    await ticketRow.getByRole('button', { name: '抵達站點' }).click();
    await dialog(page).locator('input[type="file"]').setInputFiles(fakeFile('unload.jpg', 'image/jpeg'));
    await button(dialog(page), '抵達站點').click();
    await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();
    await expect(rowOf(page, ticketNo)).toContainText('已送達');
  });

  await test.step('第 30 站 生管 印刷站點收', async () => {
    await switchRole(page, '生管');
    await goInApp(page, '/production-floor/receiving', gotoInApp);
    await rowOf(page, ticketNo).getByRole('button', { name: '點收' }).click();
    await button(dialog(page), '確認點收').click();
    await expect(page.getByText(/已點收/).last()).toBeVisible();
    await waitModalsClosed(page);
    // 甲的印刷任務到料，可做量放行
    await goInApp(page, '/production-floor/work-packages', gotoInApp);
    await expandRow(page, packageNo);
    await expect(page.locator('.ant-table-expanded-row').last()).toContainText(TASK_PRINT);
  });

  await test.step('第 31 站 師傅 報甲印刷完成', async () => {
    await switchRole(page, '師傅');
    await reportInPackage(page, packageNo, woA, TASK_PRINT, 100);
    await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
    await waitModalsClosed(page);
    await switchRole(page, '印務');
    await goInApp(page, '/work-orders', gotoInApp);
    await openByNo(page, woA, /work-orders\/detail/);
    await expect(page.getByText('已完成').first()).toBeVisible();
  });

  await test.step('第 32 站 生管 代報乙第一張備料與印刷完成', async () => {
    await switchRole(page, '生管');
    await reportInPackage(page, packageNo, woB1, TASK_PREP, 100);
    await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
    await waitModalsClosed(page);
    await reportInPackage(page, packageNo, woB1, TASK_PRINT, 100);
    await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
    await waitModalsClosed(page);
    await switchRole(page, '印務');
    await goInApp(page, '/work-orders', gotoInApp);
    await openByNo(page, woB1, /work-orders\/detail/);
    await expect(page.getByText('已完成').first()).toBeVisible();
  });

  await test.step('第 33 站 印務 在工單詳情報乙第二張備料與印刷完成', async () => {
    await goInApp(page, '/work-orders', gotoInApp);
    await openByNo(page, woB2, /work-orders\/detail/);
    await openTab(page, '製程規劃');
    for (const taskName of [TASK_PREP, TASK_PRINT]) {
      await rowOf(page, taskName).getByLabel('報工').click();
      const box = page.locator('.ant-modal-body').last();
      const taskLine = box.locator('tbody tr').filter({ hasText: taskName }).first();
      await taskLine.locator('input').nth(0).fill('100');
      await taskLine.locator('input').nth(1).fill('100');
      await button(page, '送出報工').click();
      await waitModalsClosed(page);
    }
    await expect(page.getByText('已完成').first()).toBeVisible();
    // 印件甲乙製作完成、訂單製作完成
    await switchRole(page, '業務');
    await goInApp(page, '/orders', gotoInApp);
    await expect(rowOf(page, orderNo).getByText('製作完成', { exact: true })).toBeVisible();
    await page.locator('a', { hasText: orderNo }).first().click();
    await openTab(page, '訂單項目');
    await expect(rowOf(page, ITEM_A).getByText('製作完成', { exact: true })).toBeVisible();
    await expect(rowOf(page, ITEM_B).getByText('製作完成', { exact: true })).toBeVisible();
  });
});
