import { defineConfig } from 'vitest/config';
import { ERP_APP_SRC, SHARED_ROOT } from './config.mjs';

export default defineConfig({
  resolve: {
    // 對齊 erp/apps/erp/jsconfig.json 的 paths，讓 _lib 檔的 @shared／@ 引用解析得到
    alias: {
      '@shared': SHARED_ROOT,
      '@': ERP_APP_SRC,
    },
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
