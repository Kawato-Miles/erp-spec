import { defineConfig } from 'vitest/config';
import { ERP_APP_SRC, ERP_ROOT, SHARED_ROOT } from './config.mjs';

// 純函式測試檔以絕對路徑引用 erp 主 repo 的被測檔。以 ERP_ROOT 指到另一份工作副本時
// （盲測或平行驗證），這條別名把那串寫死的主 repo 前綴改寫成指定的副本；
// 未設環境變數時前綴與替換值相同，等同沒有這條規則。
const ERP_DEFAULT_ROOT = '/Users/b-f-03-029/erp';

export default defineConfig({
  resolve: {
    // 對齊 erp/apps/erp/jsconfig.json 的 paths，讓 _lib 檔的 @shared／@ 引用解析得到
    alias: [
      { find: '@shared', replacement: SHARED_ROOT },
      { find: '@', replacement: ERP_APP_SRC },
      { find: ERP_DEFAULT_ROOT, replacement: ERP_ROOT },
    ],
    extensions: ['.js', '.jsx', '.mjs', '.json'],
  },
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['tests/unit/**/*.test.mjs'],
    environment: 'node',
    reporters: ['default'],
  },
  server: {
    // erp 的依賴（zustand、dayjs 等）由被測檔所在的 erp/node_modules 解析
    fs: { allow: ['/Users/b-f-03-029'] },
  },
});
