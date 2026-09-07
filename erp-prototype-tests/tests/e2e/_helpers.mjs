import { expect } from '@playwright/test';

// 注意：共用篩選元件 GenericFilter 的搜尋框要按 Enter 才送出，只 fill 不按 Enter 不會篩選。
// 注意：以負責印務身分看工單列表會依負責人過濾，要看別人的工單先切成印務主管。

// 模擬角色顯示名（與 (prototype)/_lib/sessionStore.js 的 ROLES label 一字不差）
export const ROLE_USERS = {
  業務: '洪嘉駿', 業務主管: '林雅婷', 諮詢: '張惠雯', 會計: '陳美玲', 主管: '王大明',
  審稿人員: '魏彣軒', 訂單管理人: '黃聖雯', 審稿主管: '魏彣軒', 印務: '周建宏',
  印務主管: '吳國豪', 生管: '許文傑', 師傅: '劉阿海', 廠務: '簡俊男',
  品檢人員: '郭淑芬', 揀貨人員: '范姜宏', 出貨人員: '曾志偉',
};

// 切右上角「模擬角色」下拉。模擬資料與角色都存在記憶體，整頁重新載入即重置，
// 同一條情境內一律用 gotoInApp 站內導頁，不可再呼叫 page.goto。
export const ROLE_ORDER = ['業務','業務主管','諮詢','會計','主管','審稿人員','訂單管理人','審稿主管','印務','印務主管','生管','師傅','廠務','品檢人員','揀貨人員','出貨人員'];

export async function switchRole(page, roleLabel) {
  const target = ROLE_ORDER.indexOf(roleLabel);
  if (target < 0) throw new Error(`未知角色：${roleLabel}`);
  const header = page.locator('header, .ant-layout-header').first();
  const select = header.locator('.ant-select').first();
  const shown = select.locator('.ant-select-selection-item');
  const expected = `${roleLabel}（${ROLE_USERS[roleLabel]}）`;
  const indexOf = (text) => ROLE_ORDER.findIndex((r) => text.startsWith(`${r}（`));
  // AntD Select 下拉為虛擬捲動、後段選項未渲染，一次送多個按鍵又會漏吃：
  // 改為開下拉後逐鍵移動，每按一鍵讀一次反白選項，命中目標才 Enter。整段可重試。
  await expect(async () => {
    if ((await shown.innerText()).startsWith(`${roleLabel}（`)) return;
    await select.click();
    const dropdown = page.locator('.ant-select-dropdown:visible').last();
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    for (let step = 0; step < ROLE_ORDER.length + 2; step += 1) {
      const active = dropdown.locator('.ant-select-item-option-active');
      const activeText = (await active.count()) ? await active.first().innerText() : await shown.innerText();
      const cur = indexOf(activeText);
      if (cur === target) break;
      await page.keyboard.press(cur < target ? 'ArrowDown' : 'ArrowUp');
      await page.waitForTimeout(60);
    }
    await page.keyboard.press('Enter');
    await expect(shown).toContainText(expected, { timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 20000 });
}

// AntD 會在兩個中文字的按鈕文字中間插空白（「核可」顯示為「核 可」），比對按鈕名用本函式產生的正規式。
export const cjkName = (label) => new RegExp(label.split('').map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'));

// 點清單上的文字（單據編號等）進詳情頁：清單剛掛載時第一次點擊常落在尚未接上事件的節點，
// 重試到網址符合為止。urlPattern 為 RegExp 或字串片段。
export async function clickIntoDetail(page, text, urlPattern) {
  const re = urlPattern instanceof RegExp ? urlPattern : new RegExp(urlPattern);
  await expect(async () => {
    await page.getByText(text, { exact: true }).first().click();
    await expect(page).toHaveURL(re, { timeout: 5000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 20000 });
}

// 站內導頁：點側欄選單項（layout 以 router.push 做前端路由，記憶體狀態保留）。
// 已在目標頁直接返回；側欄該項已是選中項時 AntD Menu 不觸發導頁，改走頁首返回鍵或頁面連結。
// 開發伺服器首次編譯路由可能超過 5 秒，整段可重試。
export async function gotoInApp(page, path) {
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlRe = new RegExp(`${esc}/?(\\?|$)`);
  if (urlRe.test(page.url())) return;
  // 側欄群組的子項在群組第一次展開前不會渲染，先把收合群組逐一展開到目標出現
  const revealItem = async () => {
    const item = page.locator(`.ant-menu-item[data-menu-id$="${path}"]`).first();
    for (let i = 0; i < 12; i += 1) {
      if (await item.isVisible().catch(() => false)) return item;
      const title = page.locator('.ant-menu-submenu:not(.ant-menu-submenu-open) > .ant-menu-submenu-title').first();
      if (!(await title.count())) break;
      await title.click();
      await page.waitForTimeout(250);
    }
    return (await item.isVisible().catch(() => false)) ? item : null;
  };
  // 目標已是選中項時 AntD Menu 不再觸發導頁；改先點另一個可見選單項再點目標，兩次都是前端路由。
  // 禁用 history.pushState 加 popstate：Next 會把非自家的歷史狀態視為外來而整頁重載，記憶體資料歸零。
  await expect(async () => {
    const item = await revealItem();
    if (!item) throw new Error(`找不到通往 ${path} 的選單項（此角色可能沒有這個入口）`);
    const selected = ((await item.getAttribute('class')) ?? '').includes('ant-menu-item-selected');
    if (selected) {
      const sibling = page.locator('.ant-menu-item:not(.ant-menu-item-selected)').filter({ visible: true }).first();
      if (await sibling.count()) {
        await sibling.click();
        await page.waitForTimeout(400);
      }
    }
    await item.click();
    await expect(page).toHaveURL(urlRe, { timeout: 10000 });
  }).toPass({ intervals: [1000, 2000, 4000], timeout: 40000 });
}

// 開一條情境：首次整頁載入後切角色
export async function openAs(page, roleLabel, path) {
  await page.goto(path);
  await switchRole(page, roleLabel);
}
