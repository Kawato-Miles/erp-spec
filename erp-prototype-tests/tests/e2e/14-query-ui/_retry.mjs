import { gotoInApp } from '../_helpers.mjs';

// 本機測試常與其他 sub-agent 並行、系統負載偏高時，Next dev server 首次編譯某條路由可能
// 超過 gotoInApp 內建的 5 秒斷言逾時（該逾時寫死在共用工具 _helpers.mjs，本檔不可修改）。
// 這裡包一層重試：第一次失敗多半是路由剛觸發編譯，稍候即可，不代表選單項或路由本身有問題。
// 提議：若其他章節也常撞到這個問題，_helpers.mjs 的 gotoInApp 可考慮把 5 秒逾時開放為可選參數。
export const gotoInAppPatiently = async (page, path, attempts = 3) => {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await gotoInApp(page, path);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1000);
    }
  }
  throw lastError;
};
