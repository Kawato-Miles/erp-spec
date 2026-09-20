import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';

// 本機測試常與其他 sub-agent 並行、系統負載偏高，放寬本檔逾時
test.setTimeout(60_000);

test('14.3 印件列表的主列與旗下工單展開列（原編號 10）', async ({ page }) => {
  // 起點資料：鏈七 PI-2026-0904（旗下 WO-2026-0904 與 WO-2026-0905 兩張工單）
  await openAs(page, '印務主管', '/print-items');
  const row = page.locator('.ant-table-row', { hasText: 'PI-2026-0904' }).first();
  await expect(row).toBeVisible();

  // 情境：任一角色看主列欄位，再展開該印件
  // 系統之後怎麼變：主列含完工良品數、不通過累計、可出貨額度（欄名在表頭，不在資料列），
  // 欄名不出現舊欄名「入庫累計」
  const header = page.locator('.ant-table-thead').first();
  await expect(header).toContainText('完工良品數');
  await expect(header).toContainText('不通過累計');
  await expect(header).toContainText('可出貨額度');
  await expect(page.locator('body')).not.toContainText('入庫累計');

  // 展開見兩張工單，示範一件印件掛多張工單。展開列的生產進度由旗下工序即時推算
  await row.locator('.ant-table-row-expand-icon').click();
  const expandedRow = page.locator('tr.ant-table-expanded-row').first();
  await expect(expandedRow).toContainText('WO-2026-0904');
  await expect(expandedRow).toContainText('WO-2026-0905');
});

test('14.6 報價與利潤頁籤的角色可見性（原編號 57）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601（實際成本已有報工事實）
  // 期望值取自 openspec sales-platform § 業務平台印件詳情頁 Tab 閹割的可見範圍表
  await openAs(page, '審稿人員', '/print-items/detail?id=PI-2026-0601');
  await expect(page.locator('body')).toContainText('PI-2026-0601');

  // 審稿人員整個頁籤不出現，不是空值也不是「權限不足」字樣
  await expect(page.getByRole('tab', { name: '報價與利潤' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('權限不足');

  // 訂單管理人與現場角色同樣整個頁籤不出現
  for (const role of ['訂單管理人', '品檢人員']) {
    await switchRole(page, role);
    await expect(page.getByRole('tab', { name: '報價與利潤' })).toHaveCount(0);
  }

  const tabText = async () => {
    await page.getByRole('tab', { name: '報價與利潤' }).click();
    return page.locator('.ant-tabs-tabpane-active');
  };

  // 印務、印務主管、主管見七欄
  for (const role of ['印務', '印務主管', '主管']) {
    await switchRole(page, role);
    const pane = await tabText();
    for (const label of [
      '印件小計（未稅）',
      '預計成本（未稅）',
      '實際成本（未稅）',
      '預估利潤（未稅）',
      '預估利潤率',
      '實際利潤（未稅）',
      '實際利潤率',
    ]) {
      await expect(pane).toContainText(label);
    }
  }

  // 業務與業務主管見五欄，預計成本與實際成本兩欄不出現
  for (const role of ['業務', '業務主管']) {
    await switchRole(page, role);
    const pane = await tabText();
    for (const label of [
      '印件小計（未稅）',
      '預估利潤（未稅）',
      '預估利潤率',
      '實際利潤（未稅）',
      '實際利潤率',
    ]) {
      await expect(pane).toContainText(label);
    }
    await expect(pane).not.toContainText('預計成本');
    await expect(pane).not.toContainText('實際成本');
  }
});

test('14.18 利潤率依三段門檻標示且不擋動作', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601（旗下工單已有報工事實，兩個利潤率都算得出來）
  // 期望值取自 openspec sales-platform § 利潤率依三段門檻標示且不擋動作：
  // 門檻只有三段（35% 以上／20% 至 35%／20% 以下），標示不擋編輯、不擋建工單、不擋推進狀態
  await openAs(page, '印務主管', '/print-items/detail?id=PI-2026-0601');
  await page.getByRole('tab', { name: '報價與利潤' }).click();
  const pane = page.locator('.ant-tabs-tabpane-active');

  const bandOf = (label) =>
    pane.locator(`th.ant-descriptions-item-label:has-text("${label}") + td`).first();

  for (const label of ['預估利潤率', '實際利潤率']) {
    // 每一格都落在三段其中一段，且只落一段
    const text = await bandOf(label).innerText();
    const hit = ['35% 以上', '20% 至 35%', '20% 以下'].filter((band) => text.includes(band));
    expect(hit).toHaveLength(1);
  }

  // 標示只是讀數提示：頁上的操作入口不因落在任一段而消失或被擋下
  await expect(page.locator('body')).not.toContainText('利潤率過低');
  await expect(page.locator('body')).not.toContainText('需主管核可');
});

test('14.7 印件詳情的工單與生產任務頁籤（原編號 58）',
  async ({ page }) => {
    // 起點資料：鏈七 PI-2026-0904（兩張工單）
    await openAs(page, '印務主管', '/print-items/detail?id=PI-2026-0904');

    // 固定區塊的印件基本資訊面板含製程說明與品檢需求兩欄（兩欄的家在印件層，一份管旗下全部工單）
    const basicPanel = page.locator('.ant-descriptions').first();
    await expect(basicPanel).toContainText('製程說明');
    await expect(basicPanel).toContainText('品檢需求');
    await expect(
      page.locator('xpath=//th[normalize-space(.)="品檢需求"]/following-sibling::td[1]').first(),
    ).toHaveText('板面四色套印全檢，裁切尺寸允差 1mm；立牌架插接牢固度抽檢 5%。');

    await page.getByRole('tab', { name: /工單與生產任務/ }).click();

    // 工單列含工單編號、類型、狀態、負責印務、內部完成日、推算完工日、生產進度
    await expect(page.locator('body')).toContainText('WO-2026-0904');
    await expect(page.locator('body')).toContainText('WO-2026-0905');
    await expect(page.locator('body')).toContainText('內部完成日');
    await expect(page.locator('body')).toContainText('預計完工日');

    // 工單列預設收合（Miles 2026-09-08 維持先前拍板），逐張展開看生產任務
    await expect(page.locator('tr.ant-table-expanded-row')).toHaveCount(0);
    await page.locator('.ant-table-row-expand-icon').first().click();

    // 生產任務子表四個欄群共十欄：任務（序號、種類、任務名同一行）、印件部位、
    // 印務規劃（設備／承作、投產目標、預估成本、預計完成、前置）、現場執行（狀態、交付狀態、完成量），
    // 沒有獨立的順序欄
    const expandedRows = page.locator('tr.ant-table-expanded-row');
    await expect(expandedRows.first()).toBeVisible();
    for (const label of [
      '任務',
      '印件部位',
      '設備／承作',
      '投產目標',
      '預估成本',
      '預計完成',
      '前置',
      '狀態',
      '交付狀態',
      '完成量',
    ]) {
      await expect(expandedRows.first().locator('.ant-table-thead')).toContainText(label);
    }
    await expect(expandedRows.first().locator('.ant-table-thead')).not.toContainText('順序');
  },
);

test('14.8 業務看到的印件詳情有三個頁籤（原編號 59）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601
  // 期望值取自 openspec sales-platform § 業務進入印件詳情頁看到三個 Tab
  await openAs(page, '業務', '/print-items/detail?id=PI-2026-0601');

  // 審稿紀錄、活動紀錄、報價與利潤三個頁籤
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(3);
  await expect(page.getByRole('tab', { name: /審稿紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /活動紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: '報價與利潤' })).toBeVisible();

  // 工單與生產任務、品檢紀錄與缺口處置兩個頁籤仍隱藏
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /品檢/ })).toHaveCount(0);

  // 固定區塊不再有成本區；其餘固定區塊正常顯示
  await expect(page.locator('body')).toContainText('購買數量');
  await expect(page.locator('body')).toContainText('製作進度');
  await expect(page.locator('body')).toContainText('可出貨額度');
});

test('14.9 印件詳情頁的兩本帳與報價與利潤都要有數字（原編號 75）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601（實際成本已有報工事實、已出貨送達）
  await openAs(page, '印務主管', '/print-items/detail?id=PI-2026-0601');

  // 數量與進度區塊逐格都要有真數字，不是「尚無資料」。
  // AntD Descriptions 的欄名（th.ant-descriptions-item-label）與值（緊接的 td）為相鄰兄弟節點，
  // 逐一取值格斷言，不對整頁做「尚無資料」全域計數（頁面另有欄位如「良品數／不良品數」
  // 本來就固定顯示尚無資料，非本情境驗收範圍）
  const valueOf = (label) =>
    page.locator(`th.ant-descriptions-item-label:has-text("${label}") + td`).first();

  for (const label of [
    '製作進度',
    '品質帳',
    '報廢數',
    '不通過累計',
    '未處置品檢缺口',
    '累計已出貨數量',
    '累計送達數',
    '可出貨額度',
  ]) {
    await expect(valueOf(label)).not.toContainText('尚無資料');
  }

  // 成本改由「報價與利潤」頁籤呈現：七欄都有數字，且不出現稅額欄與含稅金額欄
  await page.getByRole('tab', { name: '報價與利潤' }).click();
  const pane = page.locator('.ant-tabs-tabpane-active');
  for (const label of [
    '印件小計（未稅）',
    '預計成本（未稅）',
    '實際成本（未稅）',
    '預估利潤（未稅）',
    '預估利潤率',
    '實際利潤（未稅）',
    '實際利潤率',
  ]) {
    await expect(
      pane.locator(`th.ant-descriptions-item-label:has-text("${label}") + td`).first(),
    ).not.toHaveText('—');
  }
  await expect(pane).not.toContainText('稅額');
  await expect(pane).not.toContainText('含稅');

  // 審稿紀錄、活動紀錄、工單與生產任務、品檢紀錄四個頁籤都有內容
  await expect(page.getByRole('tab', { name: /審稿紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /活動紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /品檢紀錄/ })).toBeVisible();
});
