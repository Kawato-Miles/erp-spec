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

// 第一章「需求單」情境驗收（docs/scenario-catalog.md 第一章各節）。
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
  await switchRole(page, '印務主管');
  await fillCostAndCompleteEstimate(page, ['名片印件', '型錄印件'], 5);
  await switchRole(page, '業務');
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

test('1.12 需求單印件側板依五區顯示、印務只改成本版同版面', async ({ page }) => {
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

  // 印務只改成本版：同樣五個區塊標題依序出現，只有成本估算與預計產線可編輯
  await switchRole(page, '印務主管');
  await clickOpen(rowOf(page, '甲印件').getByRole('button').first(), panel.getByLabel('成本估算（未稅）'));
  await expect(panel.getByText('僅能編輯成本估算（未稅）與預計產線，其餘欄位唯讀顯示。')).toBeVisible();
  text = await layoutText(panel);
  expectInOrder(text, sections);
  expectInOrder(text, ['規格與製程', '數量', '單位', '包裝說明', '難易度', '預計產線', '審稿設定']);
  expectInOrder(text, ['審稿設定', '是否免審稿', '印件檔案備註', '成本評估區']);
  // 印務版同樣唯讀顯示印件內部完成日與印件預計交期，是否免審稿帶同一個提示圖示
  expectInOrder(text, ['規格與製程', '出貨方式', '印件內部完成日', '印件預計交期', '數量', '審稿設定']);
  await expect(panel.getByLabel('印件內部完成日')).toHaveCount(0);
  await expect(panel.getByText('未扣急件內部完成日')).toHaveCount(0);
  await expectReviewExemptHint(panel);
  await expect(panel.getByLabel('成本估算（未稅）')).toBeEditable();
  // 預計產線是多選下拉，搜尋框本身為 readonly，改驗未停用
  await expect(panel.getByLabel('預計產線')).toBeEnabled();
  // 其餘欄位唯讀：不是表單欄位、沒有可綁定的輸入框
  for (const label of ['項目名稱', '印件屬性', '數量', '單位', '包裝說明', '難易度', '單價（未稅）']) {
    await expect(panel.getByLabel(label, { exact: true })).toHaveCount(0);
  }
  await expect(panel.getByRole('button', { name: /選擇檔案/ })).toHaveCount(0);
  // 整個側板只剩兩個未停用的輸入元件：成本估算與預計產線（印件預計交期為停用輸入框）
  await expect(panel.locator('input:not([disabled]), textarea:not([disabled])')).toHaveCount(2);
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

test('1.13 無刪除權限者看不到刪除鈕', async ({ page }) => {
  const title = '1.13 權限情境需求案';
  await openAs(page, '業務', '/quote-prototype');
  const quoteNo = await createQuoteHeader(page, { title });

  await gotoInApp(page, '/quote-prototype');
  await switchRole(page, '業務主管');
  const row = rowOf(page, quoteNo);
  await expect(row).toBeVisible();
  await expect(row.locator('td').last().locator('button')).toHaveCount(0);
});
