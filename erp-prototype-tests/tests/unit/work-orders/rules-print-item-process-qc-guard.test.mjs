// 情境目錄 7.25「製程說明與品檢需求記在印件層」的把關條件（純函式層）。
// 畫面操作的驗收在 tests/e2e/07-process-planning/process-tab.spec.mjs。
import { describe, expect, it } from 'vitest';
import { printItemProcessQcEditGuard } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

// 同一件印件底下的兩張非終態工單：一張由周建宏負責，一張尚未指派（鏈七 PI-2026-0904 的形狀）
const OWNED = { work_order_no: 'WO-2026-0904', status: '草稿', owner: '周建宏', shared_members: [] };
const UNASSIGNED = {
  work_order_no: 'WO-2026-0905',
  status: '草稿',
  owner: null,
  shared_members: [],
};
// 編輯（代理）層級的分享成員：負責人休假時代理人照樣改得動
const SHARED_TO_AGENT = {
  work_order_no: 'WO-2026-0904',
  status: '草稿',
  owner: '周建宏',
  shared_members: [{ name: '蔡明修', level: 'edit' }],
};
const TERMINAL_WORK_ORDER = {
  work_order_no: 'WO-2026-0601',
  status: '已完成',
  owner: '周建宏',
  shared_members: [],
};

describe('7.25 製程說明與品檢需求記在印件層——編輯把關', () => {
  it('印務主管不看工單歸屬，全部可改', () => {
    const guard = printItemProcessQcEditGuard(
      [UNASSIGNED],
      '製程已確認',
      'print_manager',
      '吳國豪',
    );
    expect(guard.allowed).toBe(true);
    expect(guard.reason).toBeNull();
  });

  it('負責該印件任一張非終態工單的印務可改', () => {
    const guard = printItemProcessQcEditGuard(
      [OWNED, UNASSIGNED],
      '製程已確認',
      'print_officer',
      '周建宏',
    );
    expect(guard.allowed).toBe(true);
  });

  it('不負責該印件任何工單的印務不可改，理由寫明原因', () => {
    const guard = printItemProcessQcEditGuard(
      [OWNED, UNASSIGNED],
      '製程已確認',
      'print_officer',
      '蔡明修',
    );
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toContain('編輯（代理）');
  });

  it('只負責已終態工單的印務不可改：那張單的活已經收掉了', () => {
    const guard = printItemProcessQcEditGuard(
      [TERMINAL_WORK_ORDER],
      '製作完成',
      'print_officer',
      '周建宏',
    );
    expect(guard.allowed).toBe(false);
  });

  it('編輯（代理）層級的分享成員可改', () => {
    const guard = printItemProcessQcEditGuard(
      [SHARED_TO_AGENT],
      '製程已確認',
      'print_officer',
      '蔡明修',
    );
    expect(guard.allowed).toBe(true);
  });

  it('印件印製維度到終態時一律唯讀，理由帶出當下狀態', () => {
    for (const status of ['已送達', '已棄用']) {
      const guard = printItemProcessQcEditGuard([OWNED], status, 'print_manager', '吳國豪');
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toContain(status);
    }
  });

  it('印務側以外的角色一律唯讀', () => {
    for (const role of ['sales', 'production_planner', 'qc_inspector']) {
      expect(printItemProcessQcEditGuard([OWNED], '製程已確認', role, '某人').allowed).toBe(false);
    }
  });

  it('解析不到印製維度時視為非終態，只判角色與工單歸屬', () => {
    expect(printItemProcessQcEditGuard([OWNED], null, 'print_officer', '周建宏').allowed).toBe(true);
  });
});
