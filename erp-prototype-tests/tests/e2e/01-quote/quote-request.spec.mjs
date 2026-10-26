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
  completeEstimate,
  createQuoteHeader,
  fakeFile,
  fillCosts,
  openTab,
  pickMulti,
  pickOption,
  quoteCurrentStep,
  rowOf,
  salesFillCostAndCompleteEstimate,
  shareQuoteTo,
  submitQuoteHeader,
  waitModalsClosed,
} from './_local.mjs';

// 第一章「需求單」情境驗收（docs/scenario-catalog.md 第一章各節）。
// 單頭金額區（Descriptions）依標題取其內容格
const amountField = (page, label) =>
  page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: label })
    .first()
    .locator('xpath=following-sibling::td[1]');

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

test('1.2 印務主管回填成本、業務按評估完成，系統留一筆報價紀錄', async ({ page }) => {
  // 情境跨兩次角色切換，開發伺服器路由編譯耗時，預設 30 秒跑不完
  test.setTimeout(120_000);
  const title = '1.2 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title, estimators: ['吳國豪'] });
  await addItem(page, { name: '甲印件', difficulty: 3 });
  await addItem(page, { name: '乙印件', difficulty: 5 });
  await button(page, '送印務評估').click();
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  // 成本估算尚未填齊時按評估完成不受理，視窗列出缺漏印件，狀態不動
  await button(page, '評估完成').click();
  await expect(dialog(page)).toContainText('請填寫每個印件項目的成本估算（未稅），才能完成評估。');
  await expect(dialog(page)).toContainText('甲印件');
  await expect(dialog(page)).toContainText('乙印件');
  await dialog(page).getByRole('button', { name: '知道了' }).click();
  await waitModalsClosed(page);
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  // 被指派的評估印務主管是編輯（代理）分享成員：填成本之外，頁首有「評估完成」、印件報價頁有「新增印件」，
  // 這裡只填成本、不按，狀態不動
  await switchRole(page, '印務主管');
  await fillCosts(page, ['甲印件', '乙印件'], 20);
  await expect(button(page, '評估完成')).toBeVisible();
  await expect(button(page, '新增印件')).toBeVisible();
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  // 業務按評估完成：確認視窗只說建立報價紀錄，不提通知
  await switchRole(page, '業務');
  await button(page, '評估完成').click();
  await expect(dialog(page)).toContainText('系統將自動建立一筆報價紀錄快照。');
  await expect(dialog(page)).not.toContainText('通知');
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
  await expect(quoteCurrentStep(page)).toHaveText('報價');
  await expect(button(page, '評估完成')).toHaveCount(0);

  // 報價紀錄留一筆，含輪次、評估者（實際按評估完成的人）、評估時間；展開列看得到成本估算快照
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(page.getByText(/第\s*1\s*輪/)).toBeVisible();
  await expect(activeTabRows(page).first()).toContainText('洪嘉駿');
  await expect(activeTabRows(page).first()).toContainText(/\d{4}-\d{2}-\d{2}/);
  await page.locator('.ant-tabs-tabpane-active .ant-table-row-expand-icon').first().click();
  const expanded = page.locator('.ant-table-expanded-row').last();
  await expect(expanded).toContainText('甲印件');
  await expect(expanded).toContainText('乙印件');
  await expect(expanded).toContainText('20 元');

  // 活動紀錄記下誰填了成本、評估完成由業務按
  await openTab(page, '活動紀錄');
  const activity = page.locator('.ant-tabs-tabpane-active');
  await expect(activity).toContainText('吳國豪 編輯印件「甲印件」成本估算（未稅）：－ → 20');
  await expect(activity).toContainText('吳國豪 編輯印件「乙印件」成本估算（未稅）：－ → 20');
  await expect(activity).toContainText('洪嘉駿 完成成本評估');
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
  await salesFillCostAndCompleteEstimate(page, ['名片印件', '海報印件'], 20);
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
  // 起點：Q-20260908-01（鼎味餐飲集團冬季菜單桌卡，議價中，報價紀錄一筆）
  await openAs(page, '業務', '/quote-prototype');
  // 列表每頁固定筆數、新單排前面（鏈九 Q-20260921-01 加入後 0908 被擠出第一頁）：
  // 先用搜尋框篩到這張單再點（共用篩選元件按 Enter 才送出）
  const search = page.getByPlaceholder('請輸入需求單編號、需求案名、或客戶名稱');
  await search.fill('Q-20260908-01');
  await search.press('Enter');
  await page.getByRole('link', { name: 'Q-20260908-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(quoteCurrentStep(page)).toHaveText('議價');
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
  await openTab(page, '印件報價');

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

  // 印務主管吳國豪把冬季菜單桌卡成本由 4,485 改為 4,200、業務再按評估完成後新增一筆，
  // 兩筆可並列比對（先切回印件報價頁籤：目前停在活動紀錄頁籤，該表格是隱藏但仍掛載的節點，
  // 直接點擊會因不可見而逾時）
  await switchRole(page, '印務主管');
  await openTab(page, '印件報價');
  await fillCosts(page, ['冬季菜單桌卡'], 4200);
  await switchRole(page, '業務');
  await completeEstimate(page);
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(2);
  await expect(page.getByText(/第\s*1\s*輪/)).toBeVisible();
  await expect(page.getByText(/第\s*2\s*輪/)).toBeVisible();
});

test('1.5 已評估成本階段印務主管直接改成本、不退狀態', async ({ page }) => {
  test.setTimeout(90_000);
  const title = '1.5 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title });
  await addItem(page, { name: '甲印件' });
  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管');
  await fillCosts(page, ['甲印件'], 20);
  await switchRole(page, '業務');
  await completeEstimate(page);
  await expect(quoteCurrentStep(page)).toHaveText('報價');

  await switchRole(page, '印務主管');
  await fillCosts(page, ['甲印件'], 35);

  // 成本更新為新值，需求單狀態維持已評估成本、不退回待評估成本；活動紀錄記前後值
  await expect(rowOf(page, '甲印件')).toContainText('35');
  await expect(quoteCurrentStep(page)).toHaveText('報價');
  await expect(button(page, '評估完成')).toHaveCount(0);
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText(
    '吳國豪 編輯印件「甲印件」成本估算（未稅）：20 → 35',
  );
});

test('1.6 從既有需求單複製建單', async ({ page }) => {
  // 起點：Q-20260601-01（會員卡（客製燙金）5,000 張、單價 9.8、小計 49,000）
  await openAs(page, '業務', '/quote-prototype');
  await page.getByRole('link', { name: 'Q-20260601-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(page.getByText('會員卡（客製燙金）', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '複製需求單' }).click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  // 產生新單，掛新單號並導頁過去
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  // 狀態回到需求確認中，印件原值帶入，單頭金額依帶入的印件重算
  await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  await expect(page.getByText('會員卡（客製燙金）', { exact: true })).toBeVisible();
  const item = rowOf(page, '會員卡（客製燙金）');
  await expect(item).toContainText('5,000');
  await expect(item).toContainText('9.8');
  await expect(item).toContainText('49,000');
  const field = (label) => amountField(page, label);
  await expect(field('小計（未稅）')).toContainText('49,000');
  await expect(field('稅額（5%）')).toContainText('2,450');
  await expect(field('含稅總額')).toContainText('51,450');
  // 評估印務主管帶入
  await expect(field('評估印務主管')).toContainText('吳國豪');

  // 報價紀錄、手動授予的分享成員不帶入，歷史報價不帶進新單；分享成員清單只剩系統列入的評估印務主管吳國豪
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(0);
  await openTab(page, '分享成員');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(activeTabRows(page).first()).toContainText('吳國豪');

  // 活動紀錄第一筆為「建立需求單」，不記來源需求單
  await openTab(page, '活動紀錄');
  const activity = page.locator('.ant-tabs-tabpane-active');
  await expect(activity).toContainText('洪嘉駿 建立需求單');
  await expect(activity).not.toContainText('Q-20260601-01');
  await expect(activity).not.toContainText('複製建立');
});

test('1.7 需求單參考附件可挑選檔案並列出檔名，再上傳新版時舊版保留', async ({ page }) => {
  test.setTimeout(90_000);
  const item = '福利禮盒外包裝';
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260905-01');

  const panel = drawer(page);
  await clickOpen(rowOf(page, item).getByRole('button').first(), panel.getByLabel('項目名稱'));
  await panel
    .locator('input[type="file"]')
    .setInputFiles([fakeFile('客戶完稿-封面.pdf'), fakeFile('客戶完稿-內頁.pdf')]);
  await expect(panel.getByText('客戶完稿-封面.pdf')).toBeVisible();
  await expect(panel.getByText('客戶完稿-內頁.pdf')).toBeVisible();
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  // 存檔後表格以原始檔名列出清單
  await expect(rowOf(page, item)).toContainText('客戶完稿-封面.pdf');
  await expect(rowOf(page, item)).toContainText('客戶完稿-內頁.pdf');

  // 客戶改版：同一件印件再上傳新版，舊版保留、三個檔名同時列出
  await clickOpen(rowOf(page, item).getByRole('button').first(), panel.getByLabel('項目名稱'));
  await expect(panel.getByText('客戶完稿-封面.pdf')).toBeVisible();
  await panel.locator('input[type="file"]').setInputFiles([fakeFile('客戶完稿-封面-v2.pdf')]);
  await expect(panel.getByText('客戶完稿-封面-v2.pdf')).toBeVisible();
  await button(panel, '確認').click();
  await waitModalsClosed(page);
  await expect(rowOf(page, item)).toContainText('客戶完稿-封面.pdf');
  await expect(rowOf(page, item)).toContainText('客戶完稿-內頁.pdf');
  await expect(rowOf(page, item)).toContainText('客戶完稿-封面-v2.pdf');
});

test('1.8 流失需求單重新啟動回待評估成本', async ({ page }) => {
  // 起點：Q-20260909-01（晨光文創文創市集提袋，流失，價格因素，補充說明「客戶轉單同業，價差約一成」）
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260909-01');
  await expect(page.getByText(/印件流失原因：價格因素（客戶轉單同業，價差約一成）/)).toBeVisible();
  await expect(button(page, '新增印件')).toBeDisabled();

  // 重新啟動：重啟原因必填
  await button(page, '重新啟動').click();
  const requoteModal = dialog(page);
  await expect(requoteModal.getByRole('button', { name: /確\s*認/ })).toBeDisabled();
  await requoteModal.locator('textarea').fill('客戶預算核准');
  await requoteModal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  // 狀態自流失轉待評估成本，流失原因清空、印件明細解除鎖定
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');
  await expect(page.getByText(/印件流失原因/)).toHaveCount(0);
  await expect(button(page, '新增印件')).toBeEnabled();
  await openTab(page, '活動紀錄');
  await expect(page.getByText(/重新啟動需求單（重啟原因：客戶預算核准）/)).toBeVisible();
  // 流失當時的活動紀錄保留
  await expect(page.getByText(/流失原因：價格因素（客戶轉單同業，價差約一成）/)).toBeVisible();

  // 印件項目的成本估算與單價保留
  await openTab(page, '印件報價');
  const keptItem = rowOf(page, '文創市集提袋');
  await expect(keptItem).toContainText('8,125');
  await expect(keptItem).toContainText('12.5');
  await expect(keptItem).toContainText('12,500');

  // 報價紀錄第 1 輪一筆仍在
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
});

test('1.9 需求單狀態只出現六個值，顯示名依 wiki', async ({ page }) => {
  await openAs(page, '業務', '/quote-prototype');

  // 列表狀態篩選只出現六個值（限定 main 內：頁首另有一個模擬角色用的 .ant-select）
  await page.getByRole('main').locator('.ant-select').first().click();
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible();
  // 下拉選項渲染略晚於容器出現，先等到六個選項都在才讀文字
  await expect(dropdown.locator('.ant-select-item-option')).toHaveCount(6);
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

test('1.10 成交轉訂單印件的未扣急件內部完成日逐件帶入、空的就留空', async ({ page }) => {
  test.setTimeout(90_000);
  const title = '1.10 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title });

  // 新增印件項目時需求單側板的印件內部完成日一律空白、無預設值（需求單單頭已無交期欄可預填），
  // 推得的印件預計交期同為空、顯示無值符號
  const panel = drawer(page);
  await clickOpen(button(page, '新增印件'), panel.getByLabel('項目名稱'));
  await expect(panel.getByLabel('印件內部完成日')).toHaveValue('');
  // 印件預計交期是唯讀顯示、不是表單欄位（沒有 name，label 也就沒有綁定），以所在 Form.Item 取值
  const readonlyValue = (label) =>
    panel.locator('.ant-form-item').filter({ hasText: label }).first().locator('input');
  await expect(readonlyValue('印件預計交期')).toHaveValue('－');
  await button(panel, '取消').click();
  await waitModalsClosed(page);

  // 名片印件在需求單側板填自己談定的印件內部完成日（2026-09-08 週二）；型錄印件不填，
  // 代表還沒跟客戶談定這件的內部完成日
  await addItem(page, {
    name: '名片印件',
    quantity: '100',
    unitPrice: '10',
    undeductedInternalDueDate: '2026-09-08',
  });
  await addItem(page, { name: '型錄印件', quantity: '50', unitPrice: '20' });
  // 需求單階段沒有急件選項，列表的印件內部完成日等於側板所填日期；印件預計交期為其下一個工作天
  await expect(rowOf(page, '名片印件')).toContainText('2026-09-08');
  await expect(rowOf(page, '名片印件')).toContainText('2026-09-09');

  await button(page, '送印務評估').click();
  await salesFillCostAndCompleteEstimate(page, ['名片印件', '型錄印件'], 5);
  await button(page, '報價').click();
  await button(page, '成交').click();
  await button(page, '建立訂單').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });

  // 訂單單頭沒有任何交期欄（訂單資訊只剩案名可編輯）
  await page.getByRole('tab', { name: /^資訊$/ }).click();
  await expect(page.getByText('訂單交期', { exact: true })).toHaveCount(0);
  await expect(page.getByText('內部製作截止日', { exact: true })).toHaveCount(0);

  // 訂單項目：名片印件帶出 2026-09-08 與 2026-09-09，型錄印件兩欄留空、不從任何地方回補
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const cardRow = page.locator('tr', { hasText: '名片印件' });
  await expect(cardRow).toContainText('2026-09-08');
  await expect(cardRow).toContainText('2026-09-09');
  const catalogRow = page.locator('tr', { hasText: '型錄印件' });
  await expect(catalogRow).not.toContainText('2026-09-08');
  await expect(catalogRow.getByText('－').first()).toBeVisible();
});

test('1.12 需求單印件側板依五區顯示，評估印務主管開的側板同業務版', async ({ page }) => {
  test.setTimeout(90_000);
  const sections = ['基本資訊', '規格與製程', '審稿設定', '成本評估區', '參考附件'];
  // 以側板文字的先後位置驗區塊順序與欄位歸屬：從「基本資訊」起算，避開頂部說明提示裡的欄位名
  const layoutText = async (panel) => {
    const text = await panel.innerText();
    return text.slice(text.indexOf('基本資訊'));
  };
  const expectInOrder = (text, labels) => {
    const positions = labels.map((label) => text.indexOf(label));
    for (const [i, pos] of positions.entries()) {
      expect(pos, `找不到「${labels[i]}」`).toBeGreaterThanOrEqual(0);
    }
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  };

  const expectReviewExemptHint = async (panel) => {
    const hintIcon = panel
      .locator('.ant-form-item-label')
      .filter({ hasText: '是否免審稿' })
      .locator('.anticon-info-circle');
    await expect(hintIcon).toHaveCount(1);
    await hintIcon.hover();
    await expect(
      panel.page().getByRole('tooltip', { name: '勾選後此印件轉訂單時自動合格，不進入審稿流程' }),
    ).toBeVisible();
    await panel.page().mouse.move(0, 0);
  };

  const title = '1.12 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title, estimators: ['吳國豪'] });

  // 業務版：五個區塊標題依序出現；數量／單位／包裝說明與難易度、預計產線都在規格與製程區
  const panel = drawer(page);
  await clickOpen(button(page, '新增印件'), panel.getByLabel('項目名稱'));
  let text = await layoutText(panel);
  expectInOrder(text, sections);
  expectInOrder(text, ['規格與製程', '數量', '單位', '包裝說明', '難易度', '預計產線', '審稿設定']);
  expectInOrder(text, ['成本評估區', '成本估算（未稅）', '單價（未稅）', '小計（未稅）', '利潤率', '參考附件']);
  // 規格與製程區只有一格可填日期（印件內部完成日），旁邊一格唯讀印件預計交期；
  // 需求單不標示急件，側板不再出現「未扣急件內部完成日」字樣
  expectInOrder(text, ['規格與製程', '出貨方式', '印件內部完成日', '印件預計交期', '數量', '審稿設定']);
  await expect(panel.locator('.ant-form-item-label').filter({ hasText: /^印件內部完成日$/ })).toHaveCount(1);
  await expect(panel.locator('.ant-form-item-label').filter({ hasText: /^印件預計交期$/ })).toHaveCount(1);
  await expect(panel.getByText('未扣急件內部完成日')).toHaveCount(0);
  await expect(panel.locator('.ant-picker')).toHaveCount(1);
  await expect(panel.getByLabel('印件內部完成日')).toBeEditable();
  const expectedDeliveryInput = panel
    .locator('.ant-form-item')
    .filter({ hasText: '印件預計交期' })
    .first()
    .locator('input');
  await expect(expectedDeliveryInput).toBeDisabled();
  // 是否免審稿旁有提示圖示，滑過顯示轉訂單自動合格的說明
  await expectReviewExemptHint(panel);
  // 新增模式不顯示印件編號
  await expect(panel.getByText('印件編號', { exact: true })).toHaveCount(0);
  await button(panel, '取消').click();
  await waitModalsClosed(page);

  await addItem(page, { name: '甲印件', difficulty: 3 });
  await button(page, '送印務評估').click();
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  // 評估印務主管是編輯（代理）分享成員：開的側板與業務版同一套，五個區塊標題與欄位順序相同，欄位全部可編輯
  await switchRole(page, '印務主管');
  await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('成本估算（未稅）'));
  await expect(panel.getByText('僅能編輯成本估算')).toHaveCount(0);
  text = await layoutText(panel);
  expectInOrder(text, sections);
  expectInOrder(text, ['規格與製程', '數量', '單位', '包裝說明', '難易度', '預計產線', '審稿設定']);
  expectInOrder(text, ['審稿設定', '是否免審稿', '稿件備註', '成本評估區']);
  await expect(panel.getByText('印件檔案備註')).toHaveCount(0);
  expectInOrder(text, ['規格與製程', '出貨方式', '印件內部完成日', '印件預計交期', '數量', '審稿設定']);
  await expect(panel.getByLabel('印件內部完成日')).toBeEditable();
  await expect(panel.getByText('未扣急件內部完成日')).toHaveCount(0);
  await expectReviewExemptHint(panel);
  await expect(panel.getByLabel('成本估算（未稅）')).toBeEditable();
  await expect(panel.getByLabel('預計產線')).toBeEnabled();
  // 其餘欄位同樣是可填的表單欄位（不再唯讀）
  for (const label of ['項目名稱', '數量', '難易度', '單價（未稅）']) {
    await expect(panel.getByLabel(label, { exact: true }), label).toHaveCount(1);
  }
  await expect(panel.getByLabel('項目名稱', { exact: true })).toBeEditable();
  await expect(panel.getByLabel('單價（未稅）', { exact: true })).toBeEditable();
});

test('1.13 接單業務刪除需求單，列表不再出現', async ({ page }) => {
  const title = '1.13 情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });

  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '業務');
  const row = rowOf(page, quoteNo);
  await expect(row).toBeVisible();
  // 操作欄依序為編輯、刪除兩顆圖示鈕
  await row.locator('td').last().locator('button').nth(1).click();
  const confirm = dialog(page);
  await expect(confirm).toContainText(title);
  await confirm.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: quoteNo })).toHaveCount(0);
});

test('1.13 評估印務主管在列表有編輯與刪除鈕，可刪除需求單', async ({ page }) => {
  test.setTimeout(120_000);
  const title = '1.13 權限情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title, estimators: ['吳國豪'] });

  // 評估印務主管是編輯（代理）分享成員：列表操作欄有編輯與刪除兩顆圖示鈕
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '印務主管');
  const row = rowOf(page, quoteNo);
  await expect(row).toBeVisible();
  await expect(row.locator('td').last().locator('button')).toHaveCount(2);

  // 評估印務主管按刪除並確認，這張單從列表消失
  await rowOf(page, quoteNo).locator('td').last().locator('button').nth(1).click();
  const confirm = dialog(page);
  await expect(confirm).toContainText(title);
  await confirm.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: quoteNo })).toHaveCount(0);
});

test('1.14 需求單列表可見範圍依活動清單：業務主管、印務主管看全公司，諮詢只看自己負責與被分享的單', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const title = '1.14 可見範圍情境案';
  await openAs(page, '業務', '/quote-prototype');
  // 評估人指定周文彬，現行登入的印務主管吳國豪未被指派
  const quoteNo = await createQuoteHeader(page, { title, estimators: ['周文彬'] });
  await addItem(page, { name: '甲印件' });
  await button(page, '送印務評估').click();

  // 業務主管：沒被分享也看得到（全公司）；進詳情只有改派，沒有編輯、刪除、推進與複製
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '業務主管');
  await expect(rowOf(page, quoteNo)).toBeVisible();
  await expect(rowOf(page, quoteNo).locator('td').last().locator('button')).toHaveCount(0);
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(button(page, '改派')).toBeVisible();
  for (const label of ['編輯', '評估完成', '流失', '新增印件']) {
    await expect(button(page, label), label).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: '複製需求單' })).toHaveCount(0);

  // 諮詢：不是接單業務也沒被分享，列表看不到
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '諮詢');
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: quoteNo })).toHaveCount(0);

  // 印務主管：側欄有「需求單管理」，列表看得到全部需求單，含未被指派評估的單
  await switchRole(page, '印務主管');
  await expect(page.getByRole('menuitem', { name: '需求單管理' }).first()).toBeVisible();
  await expect(rowOf(page, quoteNo)).toBeVisible();
  await expect(rowOf(page, 'Q-20260601-01')).toBeVisible();
  // 未被指派評估的單只能查閱：列表操作欄沒有按鈕，詳情沒有編輯圖示與評估完成鈕
  await expect(rowOf(page, quoteNo).locator('td').last().locator('button')).toHaveCount(0);
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(rowOf(page, '甲印件').getByRole('button')).toHaveCount(0);
  await expect(button(page, '評估完成')).toHaveCount(0);
});

test('1.15 業務主管改派需求單接單業務，離職交接清空分享成員', async ({ page }) => {
  test.setTimeout(120_000);
  const title = '1.15 改派情境案';
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });
  // 業務在編輯畫面不能改接單業務（唯讀）
  const editPanel = drawer(page);
  await clickOpen(button(page, '編輯'), editPanel.getByLabel('需求案名'));
  await expect(editPanel.getByLabel('接單業務')).toHaveCount(0);
  await expect(editPanel).toContainText('洪嘉駿');
  await button(editPanel, '取消').click();
  await waitModalsClosed(page);
  // 業務看不到改派入口
  await expect(button(page, '改派')).toHaveCount(0);

  // 前置：先分享給一位同事（檢視），離職交接時要看到分享成員被清空
  await shareQuoteTo(page, '蘇怡君');
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '業務主管');
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  const panel = drawer(page);
  await clickOpen(button(page, '改派'), panel.getByText('改派理由分類（必選）'));
  // 理由未選不能送出
  await expect(button(panel, '確認')).toBeDisabled();
  await pickOption(page, panel.locator('.ant-select').first(), '賴柏宇');
  await pickOption(page, panel.locator('.ant-select').nth(1), '離職交接');
  await panel.locator('textarea').fill('原業務離職，客戶交接給賴柏宇');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  // 接單業務換人、狀態不動；分享成員清空；活動紀錄留痕
  await expect(page.locator('.ant-descriptions').first()).toContainText('賴柏宇');
  await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  // 手動授予的蘇怡君被清掉，清單只剩系統列入的評估印務主管吳國豪
  await openTab(page, '分享成員');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(activeTabRows(page).first()).toContainText('吳國豪');
  await expect(page.locator('.ant-tabs-tabpane-active')).not.toContainText('蘇怡君');
  await openTab(page, '活動紀錄');
  const activity = page.locator('.ant-tabs-tabpane-active');
  await expect(activity).toContainText('林雅婷 改派接單業務為 賴柏宇（離職交接）：原業務離職，客戶交接給賴柏宇');
  await expect(activity).toContainText('已清空分享成員 1 位');
});

test('1.16 成本估算每次編輯都留活動紀錄，議價中業務不可直接改成本', async ({ page }) => {
  test.setTimeout(120_000);
  const title = '1.16 成本紀錄情境案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title, estimators: ['吳國豪'] });
  // 需求確認中業務可先填成本
  await addItem(page, { name: '甲印件', costEstimate: 20, unitPrice: '10' });
  await button(page, '送印務評估').click();

  // 送評估後業務仍可改評估印務主管人選（多選）
  const editPanel = drawer(page);
  await clickOpen(button(page, '編輯'), editPanel.getByLabel('需求案名'));
  await expect(editPanel.getByLabel('評估印務主管')).toBeEnabled();
  await button(editPanel, '取消').click();
  await waitModalsClosed(page);

  // 印務主管在待評估成本改成本
  await switchRole(page, '印務主管');
  await fillCosts(page, ['甲印件'], 25);
  await switchRole(page, '業務');
  await completeEstimate(page);
  await button(page, '報價').click();
  await expect(quoteCurrentStep(page)).toHaveText('議價');

  // 議價中：業務開印件側板，成本估算與預計產線唯讀，單價仍可改
  const panel = drawer(page);
  await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('項目名稱'));
  await expect(panel.getByLabel('成本估算（未稅）')).toHaveCount(0);
  await expect(panel.getByLabel('預計產線')).toHaveCount(0);
  await expect(panel).toContainText('25 元');
  await expect(panel.getByLabel('單價（未稅）')).toBeEditable();
  await button(panel, '取消').click();
  await waitModalsClosed(page);

  // 活動紀錄依序記下兩次成本編輯：誰、哪件印件、前後值
  await openTab(page, '活動紀錄');
  const activity = page.locator('.ant-tabs-tabpane-active');
  await expect(activity).toContainText('洪嘉駿 編輯印件「甲印件」成本估算（未稅）：－ → 20');
  await expect(activity).toContainText('吳國豪 編輯印件「甲印件」成本估算（未稅）：20 → 25');
});

// 以下 1.18 至 1.24 起點取自資料主鏈鏈八與鏈一（MOCK-DATA-CHAIN.md），期望值取自情境目錄。

async function openQuoteDetail(page, quoteNo) {
  // 需求單列表每頁十筆；資料主鏈的需求單超過十筆時，後面的單在第二頁
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
  const link = page.getByRole('link', { name: quoteNo });
  if ((await link.count()) === 0) await page.locator('.ant-pagination-next').click();
  await link.click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
}

test('1.18 業務建立需求單，接單業務為本人，必填欄位未填無法建立', async ({ page }) => {
  test.setTimeout(90_000);
  const title = '1.18 情境需求案';
  await openAs(page, '業務', '/quote-prototype');

  // 單頭什麼都不填就確認：逐欄提示、不建立
  const panel = drawer(page);
  await clickOpen(button(page, '新增'), panel.getByLabel('需求案名'));
  await button(panel, '確認').click();
  for (const msg of [
    '請輸入需求案名',
    '請選擇客戶',
    '請選擇詢價來源',
    '請選擇接單業務',
    '請選擇評估印務主管',
    '請選擇帳務公司',
  ]) {
    await expect(panel).toContainText(msg);
  }
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: title })).toHaveCount(0);

  // 填齊後建立
  await panel.getByLabel('需求案名').fill(title);
  await pickOption(page, panel.getByLabel('客戶'), '喜互惠量販股份有限公司');
  await pickOption(page, panel.getByLabel('詢價來源'), 'Line');
  await pickOption(page, panel.getByLabel('接單業務'), '洪嘉駿');
  await pickMulti(page, panel.getByLabel('評估印務主管'), '吳國豪');
  await pickOption(page, panel.getByLabel('帳務公司'), '感官');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  const quoteNo = (await rowOf(page, title).innerText()).match(/Q-\d{8}-\d{2}/)[0];
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  await expect(page.locator('.ant-descriptions').first()).toContainText('洪嘉駿');
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('洪嘉駿 建立需求單');
  await openTab(page, '印件報價');

  // 印件項目必填：項目名稱、印件屬性、數量、難易度
  const itemPanel = drawer(page);
  await clickOpen(button(page, '新增印件'), itemPanel.getByLabel('項目名稱'));
  await button(itemPanel, '確認').click();
  for (const msg of ['請輸入項目名稱', '請選擇印件屬性', '請輸入數量', '請選擇難易度']) {
    await expect(itemPanel).toContainText(msg);
  }
  await expect(page.getByText('甲印件', { exact: true })).toHaveCount(0);
  await button(itemPanel, '取消').click();
  await waitModalsClosed(page);
  await addItem(page, { name: '甲印件', quantity: '100', difficulty: 3 });
});

test('1.19 印件項目金額依數量與單價計算，數量改動以原單價重算', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/quote-prototype');

  // Q-20260906-01：3,000 × 6.2 ＝ 18,600，稅額 930，含稅 19,530
  await openQuoteDetail(page, 'Q-20260906-01');
  await expect(rowOf(page, '耶誕禮盒吊卡')).toContainText('18,600');
  await expect(amountField(page, '小計（未稅）')).toContainText('18,600');
  await expect(amountField(page, '稅額（5%）')).toContainText('930');
  await expect(amountField(page, '含稅總額')).toContainText('19,530');

  // Q-20260905-01：數量 800 改為 1,000，小計 15,000 → 18,750、單價仍 18.75
  await gotoInApp(page, '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260905-01');
  await expect(rowOf(page, '福利禮盒外包裝')).toContainText('15,000');
  const panel = drawer(page);
  await clickOpen(rowOf(page, '福利禮盒外包裝').getByRole('button').first(), panel.getByLabel('數量'));
  await panel.getByLabel('數量').fill('1000');
  await button(panel, '確認').click();
  await waitModalsClosed(page);
  await expect(rowOf(page, '福利禮盒外包裝')).toContainText('18,750');
  await expect(rowOf(page, '福利禮盒外包裝')).toContainText('18.75');
  await expect(amountField(page, '小計（未稅）')).toContainText('18,750');
  await expect(amountField(page, '稅額（5%）')).toContainText('938');
  await expect(amountField(page, '含稅總額')).toContainText('19,688');

  // Q-20260601-01 已成交：印件編輯與刪除鈕停用，提示「需求單已成交，印件不可再修改」
  await gotoInApp(page, '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260601-01');
  const lockedButtons = rowOf(page, '會員卡（客製燙金）').getByRole('button');
  await expect(lockedButtons.first()).toBeDisabled();
  await lockedButtons.first().hover({ force: true });
  await expect(page.getByRole('tooltip', { name: '需求單已成交，印件不可再修改' })).toBeVisible();
});

test('1.20 具名需求單評估完成，報價紀錄留利潤率', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260905-01');
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');

  await completeEstimate(page);
  await expect(quoteCurrentStep(page)).toHaveText('報價');
  await expect(amountField(page, '報價輪次')).toContainText('1 輪');

  // 報價紀錄一筆、評估者洪嘉駿；展開第 1 輪看成本、單價、小計、利潤率快照
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(activeTabRows(page).first()).toContainText('洪嘉駿');
  await page.locator('.ant-tabs-tabpane-active .ant-table-row-expand-icon').first().click();
  const expanded = page.locator('.ant-table-expanded-row').last();
  await expect(expanded).toContainText('福利禮盒外包裝');
  await expect(expanded).toContainText('9,800');
  await expect(expanded).toContainText('18.75');
  await expect(expanded).toContainText('15,000');
  await expect(expanded).toContainText('34.67');
});

test('1.21 進入議價後改單價，小計與金額重算', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260906-01');
  await expect(quoteCurrentStep(page)).toHaveText('報價');

  await button(page, '報價').click();
  await expect(quoteCurrentStep(page)).toHaveText('議價');

  const panel = drawer(page);
  await clickOpen(rowOf(page, '耶誕禮盒吊卡').getByRole('button').first(), panel.getByLabel('單價（未稅）'));
  await panel.getByLabel('單價（未稅）').fill('6.5');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  await expect(rowOf(page, '耶誕禮盒吊卡')).toContainText('19,500');
  await expect(amountField(page, '小計（未稅）')).toContainText('19,500');
  await expect(amountField(page, '稅額（5%）')).toContainText('975');
  await expect(amountField(page, '含稅總額')).toContainText('20,475');
});

test('1.22 單價未填不可成交，補齊後成交並鎖定', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260908-01');
  await expect(quoteCurrentStep(page)).toHaveText('議價');
  await expect(amountField(page, '小計（未稅）')).toContainText('6,900');

  // 菜單夾頁單價為空：成交不受理，列出缺漏印件
  await button(page, '成交').click();
  await expect(dialog(page)).toContainText('請填寫每個印件項目的單價（未稅），才能將需求單標記為成交。');
  await expect(dialog(page)).toContainText('菜單夾頁');
  await expect(dialog(page)).not.toContainText('冬季菜單桌卡');
  await dialog(page).getByRole('button', { name: '知道了' }).click();
  await waitModalsClosed(page);
  await expect(quoteCurrentStep(page)).toHaveText('議價');

  // 補單價 3.2：小計 1,600
  const panel = drawer(page);
  await clickOpen(rowOf(page, '菜單夾頁').getByRole('button').first(), panel.getByLabel('單價（未稅）'));
  await panel.getByLabel('單價（未稅）').fill('3.2');
  await button(panel, '確認').click();
  await waitModalsClosed(page);
  await expect(rowOf(page, '菜單夾頁')).toContainText('1,600');

  // 成交：單頭金額 8,500／425／8,925，印件鎖定
  await button(page, '成交').click();
  await expect(button(page, '建立訂單')).toBeVisible();
  await expect(amountField(page, '小計（未稅）')).toContainText('8,500');
  await expect(amountField(page, '稅額（5%）')).toContainText('425');
  await expect(amountField(page, '含稅總額')).toContainText('8,925');
  const lockedButtons = rowOf(page, '菜單夾頁').getByRole('button');
  await expect(lockedButtons.first()).toBeDisabled();
  await lockedButtons.first().hover({ force: true });
  await expect(page.getByRole('tooltip', { name: '需求單已成交，印件不可再修改' })).toBeVisible();
});

test('1.23 已成交未建單的需求單轉出訂單', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260907-01');
  await expect(button(page, '建立訂單')).toBeVisible();
  await expect(button(page, '查看訂單')).toHaveCount(0);

  await button(page, '建立訂單').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });

  // 草稿訂單的訂單項目：春季新品型錄內頁小計 27,500、難易度 3
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: '春季新品型錄內頁' }).first();
  await expect(itemRow).toContainText('27,500');
  // 難易度欄的格比對（不比對整列文字）
  const difficultyCol = (await page.locator('thead th').allInnerTexts()).findIndex((t) => t.trim() === '難易度');
  expect(difficultyCol).toBeGreaterThanOrEqual(0);
  await expect(itemRow.locator('td').nth(difficultyCol)).toHaveText(/^3/);

  // 回需求單：掛上訂單編號、頁首改「查看訂單」、不再出現「建立訂單」
  await gotoInApp(page, '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260907-01');
  await expect(page.getByText(/已建立訂單：ORD-/)).toBeVisible();
  await expect(button(page, '查看訂單')).toBeVisible();
  await expect(button(page, '建立訂單')).toHaveCount(0);
});

test('1.24 標記流失須選原因，流失後鎖定', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260905-01');

  await button(page, '流失').click();
  const lostModal = dialog(page);
  // 未選原因時確認鈕停用
  await expect(lostModal.getByRole('button', { name: /確\s*認/ })).toBeDisabled();
  await lostModal.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown').last().getByText('價格因素', { exact: true }).click();
  await lostModal.getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  // 流失：頁首提示流失原因、印件鎖定、活動紀錄留原因
  await expect(page.getByText(/印件流失原因：價格因素/)).toBeVisible();
  const lockedButtons = rowOf(page, '福利禮盒外包裝').getByRole('button');
  await expect(lockedButtons.first()).toBeDisabled();
  await lockedButtons.first().hover({ force: true });
  await expect(page.getByRole('tooltip', { name: '需求單已流失，印件不可再修改' })).toBeVisible();
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('流失原因：價格因素');
});

test('1.25 被分享（編輯）者複製他人負責的需求單，新單的接單業務與建立者都是複製者', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：Q-20260601-01（接單業務洪嘉駿）；分享為情境內前置步驟
  await openAs(page, '業務', '/quote-prototype');
  await openQuoteDetail(page, 'Q-20260601-01');
  // 前置：洪嘉駿分享給張惠雯並改為編輯（代理）
  await shareQuoteTo(page, '張惠雯');
  await openTab(page, '分享成員');
  await pickOption(page, rowOf(page, '張惠雯').locator('.ant-select'), '編輯（代理）');
  await expect(rowOf(page, '張惠雯')).toContainText('編輯（代理）');

  // 切換成張惠雯，從列表進同一張單，按複製
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '諮詢');
  await page.getByRole('link', { name: 'Q-20260601-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await page.getByRole('button', { name: '複製需求單' }).click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  // 新單的接單業務是執行複製的張惠雯，不沿用來源單的洪嘉駿；張惠雯在新單上有編輯入口
  await expect(quoteCurrentStep(page)).toHaveText('確認需求');
  const header = page.locator('.ant-descriptions').first();
  await expect(header).toContainText('張惠雯');
  await expect(header).not.toContainText('洪嘉駿');
  await expect(button(page, '編輯')).toBeVisible();
  const item = rowOf(page, '會員卡（客製燙金）');
  await expect(item).toContainText('5,000');
  await expect(item).toContainText('9.8');
  await expect(item).toContainText('49,000');
  await expect(amountField(page, '小計（未稅）')).toContainText('49,000');
  await expect(amountField(page, '稅額（5%）')).toContainText('2,450');
  await expect(amountField(page, '含稅總額')).toContainText('51,450');

  // 報價紀錄、手動授予的分享成員不帶入：清單只剩系統列入的評估印務主管，沒有張惠雯與洪嘉駿
  await openTab(page, '報價紀錄');
  await expect(activeTabRows(page)).toHaveCount(0);
  await openTab(page, '分享成員');
  await expect(activeTabRows(page)).toHaveCount(1);
  await expect(activeTabRows(page).first()).toContainText('吳國豪');
  await openTab(page, '活動紀錄');
  const activity = page.locator('.ant-tabs-tabpane-active');
  await expect(activity).toContainText('張惠雯 建立需求單');
  await expect(activity).not.toContainText('Q-20260601-01');

  // 原業務洪嘉駿對新單沒有權限：列表沒有這張新單（來源單仍在），詳情被導回
  const newUrl = page.url();
  await switchRole(page, '業務');
  await expect(page).not.toHaveURL(/quote-prototype\/detail/, { timeout: 15_000 });
  expect(newUrl).toMatch(/quote-prototype\/detail/);
});

// ─── 單據權責修正第三批（OpenSpec change document-access-scope-alignment）：需求單依活動清單判斷 ───

// 在列表以搜尋框找單號並打開詳情
async function openQuoteByTitle(page, title) {
  await gotoInApp(page, '/quote-prototype');
  const link = rowOf(page, title).getByRole('link');
  await link.click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
}

test('1.26 建立者不因建立而看得到需求單：替業務乙建單的洪嘉駿看不到、直連導回', async ({ page }) => {
  test.setTimeout(120_000);
  const title = '1.26 替人建單情境案';
  // 洪嘉駿替業務乙陳映蓉建立需求單（接單業務指定陳映蓉）
  await openAs(page, '業務', '/quote-prototype');
  await submitQuoteHeader(page, { title, sales: '陳映蓉' });
  // 建立者的列表不列這張單
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: title })).toHaveCount(0);

  // 接單業務陳映蓉看得到，進詳情頁
  await switchRole(page, '業務（陳映蓉）');
  await expect(rowOf(page, title)).toBeVisible();
  await openQuoteByTitle(page, title);
  const detailUrl = page.url();
  expect(detailUrl).toMatch(/quote-prototype\/detail/);

  // 切回洪嘉駿：停在這張單的詳情網址等同直連，被導回預設頁面，畫面不出現這張單
  await switchRole(page, '業務');
  await expect(page).not.toHaveURL(/quote-prototype\/detail/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/quote-prototype/);
  await expect(page.locator('body')).not.toContainText(title);
});

test('1.27 諮詢乙被分享（編輯）他人的需求單後可編輯、送評估；檢視層級不可', async ({ page }) => {
  test.setTimeout(180_000);
  const title = '1.27 被分享情境案';
  // 前置：洪嘉駿建單（需求確認中，一筆印件），分享給蘇怡君（編輯）與張惠雯（檢視）
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });
  await addItem(page, { name: '甲印件', difficulty: 3 });
  await shareQuoteTo(page, '蘇怡君');
  await openTab(page, '分享成員');
  await pickOption(page, rowOf(page, '蘇怡君').locator('.ant-select'), '編輯（代理）');
  await expect(rowOf(page, '蘇怡君')).toContainText('編輯（代理）');
  await shareQuoteTo(page, '張惠雯');

  // 檢視層級的張惠雯：看得到單，沒有編輯、流失、送印務評估、新增印件、複製與分享管理入口
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '諮詢');
  await expect(rowOf(page, quoteNo)).toBeVisible();
  await expect(rowOf(page, quoteNo).locator('td').last().locator('button')).toHaveCount(0);
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  await expect(detailTitle(page)).toContainText(title);
  for (const label of ['編輯', '流失', '送印務評估', '新增印件']) {
    await expect(button(page, label), label).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: '複製需求單' })).toHaveCount(0);
  await expect(rowOf(page, '甲印件').getByRole('button')).toHaveCount(0);
  await openTab(page, '分享成員');
  await expect(button(page, '新增人員')).toHaveCount(0);
  await openTab(page, '印件報價');

  // 編輯層級的蘇怡君（諮詢乙，非接單業務）：可編輯、送印務評估，活動紀錄記她，接單業務不變
  await switchRole(page, '諮詢（蘇怡君）');
  await expect(page).toHaveURL(/quote-prototype\/detail/);
  await expect(button(page, '編輯')).toBeVisible();
  await expect(button(page, '新增印件')).toBeVisible();
  await button(page, '送印務評估').click();
  await expect(quoteCurrentStep(page)).toHaveText('評估成本');
  await expect(page.locator('.ant-descriptions').first()).toContainText('洪嘉駿');
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('狀態由「需求確認中」變更為「待評估成本」');
});

test('1.28 評估印務主管列在分享成員清單：頁籤名分享成員，層級編輯，欄名評估印務主管', async ({ page }) => {
  test.setTimeout(90_000);
  const title = '1.28 分享成員情境案';
  await openAs(page, '業務', '/quote-prototype');
  await createQuoteHeader(page, { title, estimators: ['吳國豪'] });

  // 頁籤叫「分享成員」，不再叫權限管理；基本資訊欄名叫「評估印務主管」，不再是「評估印務」
  await expect(page.locator('.ant-tabs-tab', { hasText: '分享成員' })).toBeVisible();
  await expect(page.locator('.ant-tabs-tab', { hasText: '權限管理' })).toHaveCount(0);
  await expect(amountField(page, '評估印務主管')).toContainText('吳國豪');

  // 清單列出吳國豪，層級為編輯（代理），由系統列入；沒有撤銷鈕與層級下拉（人選由評估印務主管欄管理）
  await openTab(page, '分享成員');
  await expect(activeTabRows(page)).toHaveCount(1);
  const row = activeTabRows(page).first();
  await expect(row).toContainText('吳國豪');
  await expect(row).toContainText('編輯（代理）');
  await expect(row).toContainText('系統');
  await expect(row.locator('.ant-select')).toHaveCount(0);
  await expect(row.getByRole('button')).toHaveCount(0);

  // 業務手動授予另一位同事後清單變兩筆；吳國豪不再出現在新增人員的候選裡
  await openTab(page, '印件報價');
  await shareQuoteTo(page, '蘇怡君');
  await openTab(page, '分享成員');
  await expect(activeTabRows(page)).toHaveCount(2);
  const panel = drawer(page);
  await clickOpen(button(page, '新增人員'), panel.getByText('新增關聯人員'));
  await expect(rowOf(panel, '吳國豪')).toHaveCount(0);
  await expect(rowOf(panel, '蘇怡君')).toHaveCount(0);
  await button(panel, '取消').click();
  await waitModalsClosed(page);
});

test('1.29 只有業務、諮詢看到建立需求單；沒有需求單活動的角色側欄沒有需求單入口，停在詳情頁被導回', async ({ page }) => {
  test.setTimeout(240_000);
  await openAs(page, '業務', '/quote-prototype');
  for (const role of ['業務', '諮詢']) {
    await switchRole(page, role);
    await expect(button(page, '新增'), role).toBeVisible();
  }
  // 有檢視、沒有建立活動的角色：列表在、沒有新增鈕
  for (const role of ['業務主管', '印務主管', 'Supervisor']) {
    await switchRole(page, role);
    await expect(page.getByRole('menuitem', { name: '需求單管理' }).first(), role).toBeVisible();
    await expect(button(page, '新增'), role).toHaveCount(0);
  }
  // 沒有任何需求單活動的角色：側欄沒有需求單入口
  for (const role of ['會計', '生管', '訂單管理人', '審稿人員', '印務']) {
    await switchRole(page, role);
    await expect(page.locator('.ant-menu-item', { hasText: '需求單列表' }), role).toHaveCount(0);
  }
  // 停在需求單詳情頁（等同直連）切成這些角色，被導回預設頁面，畫面不出現這張單
  for (const role of ['會計', '生管']) {
    await switchRole(page, '業務');
    await gotoInApp(page, '/quote-prototype');
    await page.getByRole('link', { name: 'Q-20260601-01' }).click();
    await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
    await switchRole(page, role);
    await expect(page, role).not.toHaveURL(/quote-prototype\/detail/, { timeout: 15_000 });
    await expect(page.locator('body'), role).not.toContainText('Q-20260601-01');
  }
});

test('1.30 Supervisor 改派需求單；業務、編輯分享成員、評估印務主管沒有改派入口；改派與分享為獨立入口', async ({ page }) => {
  test.setTimeout(180_000);
  const title = '1.30 改派情境案';
  // 前置：洪嘉駿建單，評估印務主管吳國豪，分享給蘇怡君（編輯）
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });
  await shareQuoteTo(page, '蘇怡君');
  await openTab(page, '分享成員');
  await pickOption(page, rowOf(page, '蘇怡君').locator('.ant-select'), '編輯（代理）');
  await expect(rowOf(page, '蘇怡君')).toContainText('編輯（代理）');

  // 接單業務、編輯分享成員、評估印務主管都沒有改派入口
  await expect(button(page, '改派')).toHaveCount(0);
  await switchRole(page, '諮詢（蘇怡君）');
  await expect(page).toHaveURL(/quote-prototype\/detail/);
  await expect(button(page, '改派')).toHaveCount(0);
  await switchRole(page, '印務主管');
  await expect(page).toHaveURL(/quote-prototype\/detail/);
  await expect(button(page, '改派')).toHaveCount(0);

  // Supervisor 看得到單，改派給賴柏宇、理由選「業務調整」，活動紀錄記操作者為 Supervisor；
  // 角色名顯示 Supervisor；改派與分享成員頁籤是兩個入口，分享成員不因改派而清空（非離職交接）
  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, 'Supervisor');
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  const panel = drawer(page);
  await clickOpen(button(page, '改派'), panel.getByText('改派理由分類（必選）'));
  await pickOption(page, panel.locator('.ant-select').first(), '賴柏宇');
  await pickOption(page, panel.locator('.ant-select').nth(1), '工作負荷平衡');
  await button(panel, '確認').click();
  await waitModalsClosed(page);
  await expect(page.locator('.ant-descriptions').first()).toContainText('賴柏宇');
  await openTab(page, '分享成員');
  await expect(page.locator('.ant-tabs-tab', { hasText: '分享成員' })).toBeVisible();
  await expect(rowOf(page, '蘇怡君')).toBeVisible();
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('王大明 改派接單業務為 賴柏宇（工作負荷平衡）');
});
