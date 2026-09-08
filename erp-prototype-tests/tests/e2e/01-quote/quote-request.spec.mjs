import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  activeTabRows,
  addItem,
  button,
  clickOpen,
  detailTitle,
  dialog,
  drawer,
  createQuoteHeader,
  fakeFile,
  fillCostAndCompleteEstimate,
  openTab,
  pickOption,
  quoteCurrentStep,
  rowOf,
  waitModalsClosed,
} from './_local.mjs';

// 第一章「需求單」情境驗收（docs/scenario-catalog.md 1.1–1.9）。
// 每條情境獨立一條測試：第一步 openAs 之後一律 gotoInApp 與 switchRole，
// 同一條測試內完成的推狀態鏈就是情境本文寫的「前置」。

test.fixme(
  '1.1 業務建需求單、逐筆填印件項目後送印務評估',
  {
    annotation: {
      type: '與 prototype 不符',
      description:
        '印件抽屜的「難易度」欄在畫面上是 Form 必填規則' +
        '（detail/page.js Form.Item name="difficulty_level" rules required），未選難易度時' +
        '「確認」直接被表單擋下、印件根本存不進去。情境目錄描述的「難易度沒填就存檔、送印務評估' +
        '時才擋下並列出缺漏印件」在畫面上不可達（itemsMissingDifficulty 這條檢查因此形同不會被' +
        '觸發的防呆）。待 Miles 裁決：改畫面拿掉必填限制，或改情境目錄承認難易度在建印件當下即為' +
        '必填。',
    },
  },
  async ({ page }) => {
    const title = '1.1 情境需求案';
    await openAs(page, '業務', '/quote-prototype');
    await createQuoteHeader(page, { title });
    // 甲印件難易度刻意留空，驗證缺漏擋下轉換
    await addItem(page, { name: '甲印件', difficulty: null });
    await addItem(page, { name: '乙印件', difficulty: 5 });
    await expect(quoteCurrentStep(page)).toHaveText('確認需求');

    await button(page, '送印務評估').click();
    await expect(dialog(page)).toContainText('請填寫每個印件項目的難易度，才能送印務評估。');
    await expect(dialog(page)).toContainText('甲印件');
    await expect(dialog(page)).not.toContainText('乙印件');
    await dialog(page).getByRole('button', { name: '知道了' }).click();
    await waitModalsClosed(page);
    // 狀態不動
    await expect(quoteCurrentStep(page)).toHaveText('確認需求');

    // 補上難易度後可送出
    const panel = drawer(page);
    await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('難易度'));
    await pickOption(page, panel.getByLabel('難易度'), '4');
    await button(panel, '確認').click();
    await waitModalsClosed(page);
    await button(page, '送印務評估').click();
    await expect(quoteCurrentStep(page)).toHaveText('評估成本');
  },
);

test('1.2 印務主管評估完成，系統留一筆報價紀錄', async ({ page }) => {
  // 情境內建兩張需求單、跨三次角色切換，開發伺服器路由編譯耗時，預設 30 秒跑不完
  test.setTimeout(120_000);
  const title = '1.2 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title, estimators: ['吳國豪'] });
  await addItem(page, { name: '甲印件', difficulty: 3 });
  await addItem(page, { name: '乙印件', difficulty: 5 });
  await button(page, '送印務評估').click();
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  await switchRole(page, '印務主管');
  await expect(button(page, '評估完成')).toBeVisible();
  await fillCostAndCompleteEstimate(page, ['甲印件', '乙印件'], 20);
  await expect(quoteCurrentStep(page)).toHaveText('報價');
  // 球回業務：印務主管不再有主要動作鈕
  await expect(button(page, '評估完成')).toHaveCount(0);

  // 報價紀錄留一筆，含輪次、評估人、評估時間；展開列看得到成本估算快照
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(page.getByText(/第\s*1\s*輪/)).toBeVisible();
  await expect(activeTabRows(page).first()).toContainText(/\d{4}-\d{2}-\d{2}/);
  await page.locator('.ant-tabs-tabpane-active .ant-table-row-expand-icon').first().click();
  const expanded = page.locator('.ant-table-expanded-row').last();
  await expect(expanded).toContainText('甲印件');
  await expect(expanded).toContainText('乙印件');
  await expect(expanded).toContainText('20 元');

  // 非指定評估人的印務主管看不到「評估完成」鈕：另建一張指派其他印務主管的單
  await switchRole(page, '業務');
  await gotoInApp(page, '/quote-prototype');
  await createQuoteHeader(page, { title: '1.2 非指定評估人情境案', estimators: ['周文彬'] });
  await addItem(page, { name: '丙印件', difficulty: 4 });
  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管'); // 目前登入者固定為吳國豪，未被指派為本單評估人
  await expect(button(page, '評估完成')).toHaveCount(0);
});

test('1.3 業務談定單價、標記成交並一鍵轉出訂單', async ({ page }) => {
  // 情境內含建單、評估、議價、轉訂單、返回需求單多段換頁，開發伺服器首次編譯路由較慢，
  // 預設 30 秒偶爾跑不完
  test.setTimeout(90_000);
  const title = '1.3 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });
  await addItem(page, { name: '名片印件', quantity: '123', unitPrice: '5.29' });
  // 海報印件單價刻意留空，驗證缺漏擋下成交
  await addItem(page, { name: '海報印件', quantity: '50', unitPrice: null });
  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管');
  await fillCostAndCompleteEstimate(page, ['名片印件', '海報印件'], 20);
  await switchRole(page, '業務');
  await button(page, '報價').click();
  await expect(quoteCurrentStep(page)).toHaveText('議價');

  await button(page, '成交').click();
  await expect(dialog(page)).toContainText('請填寫每個印件項目的單價（未稅），才能將需求單標記為成交。');
  await expect(dialog(page)).toContainText('海報印件');
  await dialog(page).getByRole('button', { name: '知道了' }).click();
  await waitModalsClosed(page);

  // 小計驗算：錨例名片 123 × 5.29 ＝ 651（未稅小計四捨五入到整數元）
  await expect(rowOf(page, '名片印件')).toContainText('651');

  // 補上單價後可成交
  const panel = drawer(page);
  await clickOpen(rowOf(page, '海報印件').getByRole('button').first(), panel.getByLabel('單價（未稅）'));
  await panel.getByLabel('單價（未稅）').fill('30');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  await button(page, '成交').click();
  await expect(button(page, '建立訂單')).toBeVisible();

  await button(page, '建立訂單').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  const heading = await detailTitle(page).innerText();
  expect(heading).toContain(title);

  // 需求單掛上訂單編號，頁首改顯示「查看訂單」，同一張需求單不會被建出第二張訂單
  await gotoInApp(page, '/quote-prototype');
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(button(page, '查看訂單')).toBeVisible();
  await expect(button(page, '建立訂單')).toHaveCount(0);
});

test('1.4 議價中申請重新評估，需求單退回待評估成本', async ({ page }) => {
  // 情境內兩輪評估完成、跨三次角色切換，預設 30 秒跑不完
  test.setTimeout(90_000);
  const title = '1.4 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title });
  await addItem(page, { name: '甲印件', unitPrice: '10' });
  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管');
  await fillCostAndCompleteEstimate(page, ['甲印件'], 5);
  await switchRole(page, '業務');
  await button(page, '報價').click();
  await expect(quoteCurrentStep(page)).toHaveText('議價');

  await button(page, '重新評估').click();
  const modal = dialog(page);
  await expect(modal).toContainText('調整說明');
  // 調整說明必填，留空按不下確認
  await expect(modal.getByRole('button', { name: /確\s*認/ })).toBeDisabled();
  await modal.locator('textarea').fill('客戶要求降價 10%');
  await modal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
  // 狀態退回待評估成本
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  // 前一次的報價紀錄保留、不被覆蓋
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
  await openTab(page, '活動紀錄');
  await expect(page.getByText(/調整說明：客戶要求降價 10%/)).toBeVisible();

  // 主管重評完成後再新增一筆，兩筆可並列比對（先切回印件報價頁籤：目前停在活動紀錄頁籤，
  // 該表格是隱藏但仍掛載的節點，直接點擊會因不可見而逾時）
  await switchRole(page, '印務主管');
  await openTab(page, '印件報價');
  await fillCostAndCompleteEstimate(page, ['甲印件'], 4);
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(2);
  await expect(page.getByText(/第\s*1\s*輪/)).toBeVisible();
  await expect(page.getByText(/第\s*2\s*輪/)).toBeVisible();
});

test('1.5 已評估成本階段主管直接改成本、不退狀態', async ({ page }) => {
  const title = '1.5 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title });
  await addItem(page, { name: '甲印件' });
  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管');
  await fillCostAndCompleteEstimate(page, ['甲印件'], 20);
  await expect(quoteCurrentStep(page)).toHaveText('報價');

  const panel = drawer(page);
  await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('成本估算（未稅）'));
  await panel.getByLabel('成本估算（未稅）').fill('35');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  // 成本更新為新值，需求單狀態維持待報價、不退回待評估成本
  await expect(rowOf(page, '甲印件')).toContainText('35');
  await expect(quoteCurrentStep(page)).toHaveText('報價');
  await expect(button(page, '評估完成')).toHaveCount(0);
});

test('1.6 從既有需求單複製建單', async ({ page }) => {
  await openAs(page, '業務', '/quote-prototype');
  await page.getByRole('link', { name: 'Q-20260601-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(page.getByText('會員卡（客製燙金）', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '複製需求單' }).click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  // 產生新單，掛新單號並導頁過去
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  // 狀態回到待確認需求，印件原值帶入
  await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  await expect(page.getByText('會員卡（客製燙金）', { exact: true })).toBeVisible();

  // 報價輪次、報價紀錄、授權清單歸零重來，歷史報價不帶進新單
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(0);
  await openTab(page, '權限管理');
  await expect(page.getByText('尚無授權人員')).toBeVisible();

  // 活動紀錄第一筆寫「由 Q-20260601-01 複製建立需求單」
  await openTab(page, '活動紀錄');
  await expect(page.getByText(/由 Q-20260601-01 複製建立需求單/)).toBeVisible();
});

test.fixme(
  '1.7 需求單參考附件可挑選檔案並列出檔名',
  {
    annotation: {
      type: '與 prototype 不符',
      description:
        '印件抽屜暫存檔案時用 URL.createObjectURL(file) 產生 blob 網址' +
        '（detail/page.js stageFile），存檔只把這個 blob 網址存進 file_urls、原始檔名（file.name）' +
        '被丟棄；印件表格「參考檔案」欄的 render 用 url.split(\'/\').pop() 從網址取檔名，blob 網址' +
        '的路徑段是亂數 UUID，不是原始檔名。抽屜內即時預覽用的是 f.name 所以看得到正確檔名，' +
        '但存檔關閉抽屜後表格上顯示的是一串 UUID，不是「客戶完稿-封面.pdf」這種可讀檔名。' +
        '待 Miles 裁決：暫存物件需一併保留原始檔名（例如 file_urls 存 {url,name} 而非純字串）。',
    },
  },
  async ({ page }) => {
    const title = '1.7 情境需求案';
    await openAs(page, '業務', '/quote-prototype');
    await createQuoteHeader(page, { title });
    await addItem(page, { name: '甲印件' });

    const panel = drawer(page);
    await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('項目名稱'));
    await panel
      .locator('input[type="file"]')
      .setInputFiles([fakeFile('客戶完稿-封面.pdf'), fakeFile('客戶完稿-內頁.pdf')]);
    await expect(panel.getByText('客戶完稿-封面.pdf')).toBeVisible();
    await expect(panel.getByText('客戶完稿-內頁.pdf')).toBeVisible();
    await button(panel, '確認').click();
    await waitModalsClosed(page);

    // 存檔後表格顯示檔名清單
    await expect(rowOf(page, '甲印件')).toContainText('客戶完稿-封面.pdf');
    await expect(rowOf(page, '甲印件')).toContainText('客戶完稿-內頁.pdf');
  },
);

test('1.8 流失需求單重新啟動回待評估成本', async ({ page }) => {
  const title = '1.8 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title });

  // 執行流失（流失原因六選一）
  await button(page, '流失').click();
  const lostModal = dialog(page);
  await expect(lostModal.getByRole('button', { name: /確\s*認/ })).toBeDisabled();
  await lostModal.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').last().getByText('價格因素', { exact: true }).click();
  await lostModal.locator('textarea').fill('客戶覺得報價偏高');
  await lostModal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
  await expect(page.getByText(/印件流失原因：價格因素（客戶覺得報價偏高）/)).toBeVisible();

  // 重新啟動：重啟原因必填
  await button(page, '重新啟動').click();
  const requoteModal = dialog(page);
  await expect(requoteModal.getByRole('button', { name: /確\s*認/ })).toBeDisabled();
  await requoteModal.locator('textarea').fill('客戶隔了兩週回頭要重談');
  await requoteModal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  // 狀態自流失轉待評估成本，流失原因清空、印件明細解除鎖定
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');
  await expect(page.getByText(/印件流失原因/)).toHaveCount(0);
  await expect(button(page, '新增印件')).toBeEnabled();
  await openTab(page, '活動紀錄');
  await expect(page.getByText(/重新啟動需求單（重啟原因：客戶隔了兩週回頭要重談）/)).toBeVisible();
});

test('1.9 需求單狀態只出現六個值，顯示名依 wiki', async ({ page }) => {
  await openAs(page, '業務', '/quote-prototype');

  // 列表狀態篩選只出現六個值（限定 main 內：頁首另有一個模擬角色用的 .ant-select）
  await page.getByRole('main').locator('.ant-select').first().click();
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible();
  const optionTexts = await dropdown.locator('.ant-select-item-option').allInnerTexts();
  expect(optionTexts).toEqual([
    '需求確認中',
    '待評估成本',
    '已評估成本',
    '議價中',
    '成交',
    '流失',
  ]);
  await page.keyboard.press('Escape');

  // 詳情頁步驟條只列前五個，流失不入步驟條、以錯誤色單獨標示
  const title = '1.9 情境需求案';
  await createQuoteHeader(page, { title });
  await button(page, '流失').click();
  const lostModal = dialog(page);
  await lostModal.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').last().getByText('其他', { exact: true }).click();
  await lostModal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  const steps = page.locator('.ant-steps-item');
  await expect(steps).toHaveCount(5);
  const stepTitles = await steps.locator('.ant-steps-item-title').allInnerTexts();
  expect(stepTitles).toEqual(['確認需求', '評估成本', '報價', '議價', '流失']);
  await expect(steps.last()).toHaveClass(/ant-steps-item-finish/);
});
