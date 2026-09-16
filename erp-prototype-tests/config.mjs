// 所有指向 erp repo 的路徑集中在此；erp 搬目錄或 handoff 到 (dashboard)/ 時只改這裡。
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// 本機登入帳密放 `.env.local`（已列入 .gitignore，內容不進版控、不進對話）：
//   ERP_TEST_USERNAME=<電子郵件>
//   ERP_TEST_PASSWORD=<密碼>
// 有設定時 tests/e2e/auth.setup.mjs 會先登入一次並沿用登入狀態；沒設定就照舊免登入直接開頁。
const ENV_LOCAL = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local');
if (fs.existsSync(ENV_LOCAL) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(ENV_LOCAL); } catch { /* 讀不到就當沒設定 */ }
}

// 盲測或平行驗證時可用環境變數指到另一份 erp 工作副本；預設仍是主 repo。
export const ERP_DEFAULT_ROOT = '/Users/b-f-03-029/erp';
export const ERP_ROOT = process.env.ERP_ROOT ?? ERP_DEFAULT_ROOT;
export const ERP_APP_SRC = path.join(ERP_ROOT, 'apps/erp/src');
export const PROTOTYPE_ROOT = path.join(ERP_APP_SRC, 'app/(prototype)');
export const SHARED_ROOT = path.join(ERP_ROOT, 'packages/shared');
export const ERP_APP_DIR = path.join(ERP_ROOT, 'apps/erp');
export const DEV_PORT = Number(process.env.DEV_PORT ?? 3020);
export const BASE_URL = `http://localhost:${DEV_PORT}`;
export const TESTS_ROOT = path.dirname(fileURLToPath(import.meta.url));

// 登入狀態檔（auth.setup.mjs 產出，已列入 .gitignore）
export const AUTH_STATE_PATH = path.join(TESTS_ROOT, '.auth', 'state.json');
export const HAS_LOGIN_CREDENTIALS = Boolean(process.env.ERP_TEST_USERNAME && process.env.ERP_TEST_PASSWORD);
