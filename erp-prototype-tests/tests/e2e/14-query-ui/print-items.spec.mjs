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

test('14.6 成本區塊的角色可見性（原編號 57）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601（實際成本四分項齊備）
  await openAs(page, '審稿人員', '/print-items/detail?id=PI-2026-0601');
  await expect(page.locator('body')).toContainText('PI-2026-0601');

  // 審稿人員完全看不到成本區塊，不是空值也不是遮罩
  await expect(page.locator('body')).not.toContainText('預計成本');
  await expect(page.locator('body')).not.toContainText('實際成本');

  // 印務看得到預計成本與實際成本、沒有毛利率
  await switchRole(page, '印務');
  await expect(page.locator('body')).toContainText('預計成本');
  await expect(page.locator('body')).toContainText('實際成本');
  await expect(page.locator('body')).not.toContainText('毛利率');

  // 印務主管與高階主管另外看得到毛利率
  await switchRole(page, '印務主管');
  await expect(page.locator('body')).toContainText('毛利率');
  await switchRole(page, '主管');
  await expect(page.locator('body')).toContainText('毛利率');
});

test.fixme(
  '14.7 印件詳情的工單與生產任務頁籤（原編號 58）——工單列七欄與情境相符，但生產任務子表' +
    '（ProductionTasksTable full variant）欄位是「任務（含序號＋種類＋名）、印件部位、設備／承作、' +
    '投產目標、預估成本、預計完成、前置、狀態、交付狀態、完成量」，與情境所述「工序、廠商類別、' +
    '計畫設備、預計完成日、目標數量、產出數量、生產任務狀態（沒有順序欄）」七欄不符——任務欄反而' +
    '帶 #序號標籤，需 Miles 裁決情境目錄或改欄位',
  async ({ page }) => {
    // 起點資料：鏈七 PI-2026-0904（兩張工單）
    await openAs(page, '印務主管', '/print-items/detail?id=PI-2026-0904');
    await page.getByRole('tab', { name: /工單與生產任務/ }).click();

    // 工單列含工單編號、類型、狀態、負責印務、預計交期、推算完工日、生產進度
    await expect(page.locator('body')).toContainText('WO-2026-0904');
    await expect(page.locator('body')).toContainText('WO-2026-0905');
    await expect(page.locator('body')).toContainText('預計交期');
    await expect(page.locator('body')).toContainText('預計完工日');

    // 工單列預設全部展開
    await expect(page.locator('tr.ant-table-expanded-row').first()).toBeVisible();

    // 生產任務子表七欄，沒有順序欄
    const expandedRow = page.locator('tr.ant-table-expanded-row').first();
    await expect(expandedRow).toContainText('工序');
    await expect(expandedRow).toContainText('廠商類別');
    await expect(expandedRow).toContainText('計畫設備');
    await expect(expandedRow).toContainText('預計完成日');
    await expect(expandedRow).toContainText('目標數量');
    await expect(expandedRow).toContainText('產出數量');
    await expect(expandedRow).toContainText('生產任務狀態');
    await expect(expandedRow.locator('text=/^#\\d/')).toHaveCount(0);
  },
);

test('14.8 業務看到的印件詳情只有兩個頁籤（原編號 59）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601
  await openAs(page, '業務', '/print-items/detail?id=PI-2026-0601');

  // 只看得到審稿紀錄與活動紀錄兩個頁籤
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(2);
  await expect(page.getByRole('tab', { name: /審稿紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /活動紀錄/ })).toBeVisible();

  // 工單與生產任務、品檢紀錄與缺口處置兩個頁籤隱藏
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /品檢/ })).toHaveCount(0);

  // 成本區塊不出現，其餘四個固定區塊（購買數量／製作進度／品質帳／可出貨額度等）正常顯示
  await expect(page.locator('body')).not.toContainText('預計成本');
  await expect(page.locator('body')).toContainText('購買數量');
  await expect(page.locator('body')).toContainText('製作進度');
  await expect(page.locator('body')).toContainText('可出貨額度');
});

test('14.9 印件詳情頁的成本與兩本帳都要有數字（原編號 75）', async ({ page }) => {
  // 起點資料：鏈一 PI-2026-0601（實際成本四分項齊備、已出貨送達）
  await openAs(page, '印務主管', '/print-items/detail?id=PI-2026-0601');

  // 數量與進度區塊：製作進度、品質帳、報廢數、不通過累計、未處置缺口、累計已出貨數量、
  // 累計送達數、可出貨額度、預計成本、實際成本、毛利率都要有真數字，不是「尚無資料」。
  // AntD Descriptions 的欄名（th.ant-descriptions-item-label）與值（緊接的 td）為相鄰兄弟節點，
  // 逐一取值格斷言，不對整頁做「尚無資料」全域計數（頁面另有欄位如「良品數／不良品數」
  // 本來就固定顯示尚無資料，非本情境驗收範圍）
  const valueOf = (label) =>
    page.locator(`th.ant-descriptions-item-label:has-text("${label}") + td`).first();

  const labelsWithValue = [
    '製作進度',
    '品質帳',
    '報廢數',
    '不通過累計',
    '未處置品檢缺口',
    '累計已出貨數量',
    '累計送達數',
    '可出貨額度',
    '預計成本',
    '實際成本',
    '毛利率',
  ];
  for (const label of labelsWithValue) {
    await expect(valueOf(label)).not.toContainText('尚無資料');
  }

  // 審稿紀錄、活動紀錄、工單與生產任務、品檢紀錄四個頁籤都有內容
  await expect(page.getByRole('tab', { name: /審稿紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /活動紀錄/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /品檢紀錄/ })).toBeVisible();
});
