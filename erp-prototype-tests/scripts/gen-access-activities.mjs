#!/usr/bin/env node
// 由 wiki 活動清單卡產生 Prototype 的活動表資料：
//   node scripts/gen-access-activities.mjs
// 輸出到 erp (prototype)/_lib/access-activities.js。wiki 活動清單卡改動後重跑本腳本，
// 單元測試 tests/unit/access/access-activities.test.mjs 會核對兩邊一致。
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ERP_ROOT, PROTOTYPE_ROOT } from '../config.mjs';
import { readAllActivityCards } from './lib/activity-cards.mjs';

const cards = readAllActivityCards();
const rows = cards.flatMap((c) => c.rows);
const q = (v) => JSON.stringify(v);

const body = rows
  .map(
    (r) =>
      `  { id: ${q(r.id)}, roles: ${q(r.roles)}, scope: ${q(r.scope)}, basis: ${q(r.basis)}, op: ${q(r.op)}, opName: ${q(r.opName)}, sec: ${q(r.sec)} },`,
  )
  .join('\n');

const text = `// 活動表（腳手架層）：由 wiki 活動清單卡（04-business-logic/服務藍圖/<流程群組>/<階段>活動清單.md）逐列轉錄，共 ${rows.length} 列。
// 不手改本檔：wiki 活動清單卡改動後，在 Sens erp-prototype-tests 跑 scripts/gen-access-activities.mjs 重新產生，
// 單元測試（tests/unit/access）核對本檔與活動清單卡一致。
//
// 欄位（對應活動清單卡的活動表）：
//   id       活動編號（ACT-<活動清單代碼>-<流水>）
//   roles    執行角色（wiki 角色卡名稱；'*' 代表「所有角色」，只出現在被分享列，實際是對該單據有不靠分享活動列的角色）
//   scope    範圍：全公司／自己負責／被分享（檢視）／被分享（編輯）／所屬產線
//   basis    依據欄位（單據 欄位名）；範圍為全公司時為 null
//   op       操作編號（OP-<單據代碼>-<流水>）
//   opName   操作名稱
//   sec      活動表小節標題（同一張卡內同一操作出現在不同列表時用來分辨，例如印件的「審稿」與「品檢待驗清單」）
// 判讀規則正本：wiki 受控清單 § 未列即不可做、§ 範圍用詞。

export const ACCESS_ACTIVITIES = [
${body}
];
`;

const target = path.join(PROTOTYPE_ROOT, '_lib/access-activities.js');
writeFileSync(target, text);
// erp 的 CI 檢查 prettier 格式：產生後交給 erp 自己的 prettier 排版，重跑產生的檔案才不會與提交內容不同
execFileSync(path.join(ERP_ROOT, 'node_modules/.bin/prettier'), ['--write', target], { stdio: 'ignore' });
console.log(`已寫入 ${rows.length} 列、${cards.length} 張卡 → ${target}`);
