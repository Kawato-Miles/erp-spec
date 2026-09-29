// 印務印件檔案與檔案備註的可維護者判定（純函式層）。
// 規格：order-management spec § 印件印務印件檔案與檔案備註（change officer-files-to-print-item）。
// 畫面操作的驗收在 tests/e2e/07-process-planning/officer-files.spec.mjs（7.36、7.37）。
import { describe, expect, it } from 'vitest';
import { printItemOfficerFilesEditGuard } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

// 同一件印件旗下的兩張工單：印刷工單由周建宏負責，裝訂工單由蔡明修負責
const PRINTING = {
  work_order_no: 'WO-2026-0904',
  status: '製作中',
  owner: '周建宏',
  shared_members: [],
};
const BINDING = {
  work_order_no: 'WO-2026-0905',
  status: '製作中',
  owner: '蔡明修',
  shared_members: [
    { name: '林佩君', level: 'edit' },
    { name: '陳怡君', level: 'view' },
  ],
};

describe('印務印件檔案與檔案備註——可維護者', () => {
  it('該印件任一張工單的負責人可維護，不限目前這一張', () => {
    expect(printItemOfficerFilesEditGuard([PRINTING, BINDING], 'print_officer', '周建宏').allowed).toBe(true);
    expect(printItemOfficerFilesEditGuard([PRINTING, BINDING], 'print_officer', '蔡明修').allowed).toBe(true);
  });

  it('另一張工單編輯（代理）層級的分享成員可維護', () => {
    const guard = printItemOfficerFilesEditGuard([PRINTING, BINDING], 'print_officer', '林佩君');
    expect(guard.allowed).toBe(true);
    expect(guard.reason).toBeNull();
  });

  it('印務主管不看工單歸屬即可維護', () => {
    const unassigned = { ...PRINTING, owner: null };
    const guard = printItemOfficerFilesEditGuard([unassigned], 'print_manager', '吳國豪');
    expect(guard.allowed).toBe(true);
    expect(guard.reason).toBeNull();
  });

  it('已取消工單的負責人仍可維護', () => {
    const cancelled = { ...BINDING, status: '已取消' };
    expect(printItemOfficerFilesEditGuard([PRINTING, cancelled], 'print_officer', '蔡明修').allowed).toBe(true);
  });

  it('工單全部在終態（已完成、已取消）仍可維護：不看工單狀態，也不看印件狀態', () => {
    const done = { ...PRINTING, status: '已完成' };
    const cancelled = { ...BINDING, status: '已取消' };
    expect(printItemOfficerFilesEditGuard([done, cancelled], 'print_officer', '周建宏').allowed).toBe(true);
    expect(printItemOfficerFilesEditGuard([done, cancelled], 'print_officer', '林佩君').allowed).toBe(true);
    expect(printItemOfficerFilesEditGuard([done, cancelled], 'print_manager', '吳國豪').allowed).toBe(true);
  });

  it('不是任何一張工單的負責人或編輯（代理）成員的印務擋下，並附理由', () => {
    for (const user of ['郭俊賢', '陳怡君']) {
      const guard = printItemOfficerFilesEditGuard([PRINTING, BINDING], 'print_officer', user);
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toBeTruthy();
    }
  });

  it('業務與生管擋下', () => {
    for (const role of ['sales', 'production_planner']) {
      const guard = printItemOfficerFilesEditGuard([PRINTING, BINDING], role, '周建宏');
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toBeTruthy();
    }
  });
});
