import { describe, expect, it } from 'vitest';
import { taskActualStartAt } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/task-reports.js';
import { proofRequirementEditGuard } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

// 10.19 任務實際開工取首筆報工時間
// 期望值取自 openspec work-order § 工單排程日期的四個 Scenario：
// 生管分派日不寫入、尚未報工時為空、第二筆報工不改寫、只報一次工時開工等於完成。

const TASK = { id: 'pt-0710-1', name: '海報四色印刷' };
const report = (id, at, extra = {}) => ({
  id,
  task_id: TASK.id,
  reported_at: at,
  status: '有效',
  ...extra,
});

describe('10.19 任務實際開工取首筆有效報工的時間', () => {
  it('08-15 分派、08-18 首筆報工：寫入 08-18 那一筆的時間，不寫 08-15', () => {
    expect(taskActualStartAt(TASK, [report('wr-1', '2026-08-18 09:20')])).toBe('2026-08-18 09:20');
  });

  it('已分派但尚無報工時為空，不以分派日或任何預設值填補', () => {
    expect(taskActualStartAt(TASK, [])).toBeNull();
  });

  it('第二筆報工不改寫：取最早的那一筆', () => {
    const reports = [report('wr-1', '2026-08-18 09:20'), report('wr-2', '2026-08-19 14:05')];
    expect(taskActualStartAt(TASK, reports)).toBe('2026-08-18 09:20');
    // 回報順序顛倒時讀數不變
    expect(taskActualStartAt(TASK, [...reports].reverse())).toBe('2026-08-18 09:20');
  });

  it('只報一次工的任務，開工時間等於那一筆報工的時間（照實記，不視為異常）', () => {
    expect(taskActualStartAt(TASK, [report('wr-1', '2026-08-20 16:40')])).toBe('2026-08-20 16:40');
  });

  it('已作廢的報工不算動工事實（沿用既有報工作廢規則）', () => {
    const reports = [
      report('wr-1', '2026-08-18 09:20', { status: '已作廢' }),
      report('wr-2', '2026-08-19 14:05'),
    ];
    expect(taskActualStartAt(TASK, reports)).toBe('2026-08-19 14:05');
  });
});

// 7.26 確樣需求的可改角色與可改期間
// 期望值取自 openspec work-order § 工單確樣需求：
// 負責印務與其編輯（代理）成員於工單非終態可改，其餘角色與終態工單唯讀。

const workOrder = (status, owner, sharedMembers = []) => ({
  id: 'wo-x',
  status,
  owner,
  shared_members: sharedMembers,
});

describe('7.26 確樣需求限負責印務與其編輯（代理）成員，工單非終態全程可改', () => {
  it('製作中工單的負責印務可改（不鎖到草稿段）', () => {
    expect(proofRequirementEditGuard(workOrder('製作中', '周建宏'), 'print_officer', '周建宏').allowed).toBe(true);
  });

  it('編輯（代理）層級的分享成員可改', () => {
    const wo = workOrder('製作中', '周建宏', [{ name: '蔡明修', level: 'edit' }]);
    expect(proofRequirementEditGuard(wo, 'print_officer', '蔡明修').allowed).toBe(true);
  });

  it('檢視層級的分享成員不可改', () => {
    const wo = workOrder('製作中', '周建宏', [{ name: '蔡明修', level: 'view' }]);
    expect(proofRequirementEditGuard(wo, 'print_officer', '蔡明修').allowed).toBe(false);
  });

  it('業務、生管、師傅一律唯讀', () => {
    const wo = workOrder('製作中', '周建宏');
    for (const role of ['sales', 'production_planner', 'master', 'print_manager']) {
      expect(proofRequirementEditGuard(wo, role, '周建宏').allowed).toBe(false);
    }
  });

  it('工單進終態（已完成、已取消）後唯讀', () => {
    for (const status of ['已完成', '已取消']) {
      expect(proofRequirementEditGuard(workOrder(status, '周建宏'), 'print_officer', '周建宏').allowed).toBe(false);
    }
  });
});
