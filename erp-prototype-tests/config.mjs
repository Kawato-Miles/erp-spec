// 所有指向 erp repo 的路徑集中在此；erp 搬目錄或 handoff 到 (dashboard)/ 時只改這裡。
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ERP_ROOT = '/Users/b-f-03-029/erp';
export const ERP_APP_SRC = path.join(ERP_ROOT, 'apps/erp/src');
export const PROTOTYPE_ROOT = path.join(ERP_APP_SRC, 'app/(prototype)');
export const SHARED_ROOT = path.join(ERP_ROOT, 'packages/shared');
export const ERP_APP_DIR = path.join(ERP_ROOT, 'apps/erp');
export const DEV_PORT = 3020;
export const BASE_URL = `http://localhost:${DEV_PORT}`;
export const TESTS_ROOT = path.dirname(fileURLToPath(import.meta.url));
