import { describe, it, expect } from 'vitest';
import {
  MOCK_FLOOR_TASKS,
  MOCK_TRANSFER_TICKETS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { canReportTask } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/report-rules.js';
import { resolvePrecedence } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/precedence.js';

// 10.1／10.18 可報工判定（report-rules.canReportTask）：介面入口顯不顯示報工，取這一支。
// 兩個條件同時成立才算可報工：
//   一、狀態為「待處理」或「製作中」（已完成不用再報，已作廢與報廢不能再收數字）
//   二、沒有前置，或前置到料量大於 0——需轉交的前置看轉交單已點收量、不需轉交的前置看該前置
//       報工的累計良品
// 起點資料：鏈二 pt-0710-2 海報四色印刷（製作中、無未到料前置）、pt-0710-3 裁切成型
//（待處理，前置轉交單皆未點收）、pt-0710-1 雪銅紙 150g 備料（已完成）。
describe('可報工判定（canReportTask）', () => {
  const ctx = { tasks: MOCK_FLOOR_TASKS, tickets: MOCK_TRANSFER_TICKETS };
  const taskOf = (id) => MOCK_FLOOR_TASKS.find((t) => t.id === id);

  it('製作中且前置已到料 → 可報工', () => {
    const task = taskOf('pt-0710-2');
    expect(task.status).toBe('製作中');
    expect(canReportTask(task, ctx)).toBe(true);
  });

  it('待處理但前置一份料都還沒到 → 不可報工（入口隱藏）', () => {
    const task = taskOf('pt-0710-3');
    expect(task.status).toBe('待處理');
    expect(canReportTask(task, ctx)).toBe(false);
  });

  it('已完成的任務不可報工：補報一律走印務入口', () => {
    const task = taskOf('pt-0710-1');
    expect(task.status).toBe('已完成');
    expect(canReportTask(task, ctx)).toBe(false);
  });

  it('已作廢與報廢的任務不可報工：兩種都不該再收數字', () => {
    const task = taskOf('pt-0710-2');
    expect(canReportTask({ ...task, status: '已作廢' }, ctx)).toBe(false);
    expect(canReportTask({ ...task, status: '報廢' }, ctx)).toBe(false);
  });

  it('待處理且沒有任何前置 → 可報工', () => {
    const task = taskOf('pt-0710-2');
    expect(
      canReportTask(
        { ...task, status: '待處理', depends_on: [], depends_on_external: [] },
        { tasks: [], tickets: [] },
      ),
    ).toBe(true);
  });

  it('前置到料量由零變正（下游站點收該張轉交單）→ 同一筆任務由不可報工變可報工', () => {
    const task = taskOf('pt-0710-3');
    const pending = MOCK_TRANSFER_TICKETS.find((ticket) =>
      (ticket.details ?? []).some((detail) => (task.depends_on ?? []).includes(detail.task_id)),
    );
    expect(pending).toBeTruthy();
    // 點收才算到料（已送達是搬運方的單方宣稱，放行由要動手做的人說了算）
    const received = { ...pending, status: '已點收' };
    const tickets = MOCK_TRANSFER_TICKETS.map((t) => (t.id === pending.id ? received : t));
    expect(canReportTask(task, { tasks: MOCK_FLOOR_TASKS, tickets })).toBe(true);
  });

  // 鏈三 pt-0815-3 軋盒成型（不需轉交，與下游糊盒機同屬手工線）→ pt-0815-4 糊盒成型：
  // 同產線連續兩道之間沒有搬運，下游的到料量取上一道報工的累計良品。
  describe('不需轉交的前置以報工累計良品計入下游到料量', () => {
    const upstream = taskOf('pt-0815-3');
    const downstream = taskOf('pt-0815-4');
    const withGood = (goodQty) =>
      MOCK_FLOOR_TASKS.map((t) => (t.id === upstream.id ? { ...t, good_qty: goodQty } : t));

    it('前置標為不需轉交（做完直接落在下一台機）', () => {
      expect(upstream.needs_transfer).toBe(false);
      expect(downstream.depends_on).toContain(upstream.id);
    });

    it('前置累計良品 0 → 不可報工，擋單來源指名該前置', () => {
      expect(upstream.good_qty).toBe(0);
      const { blocking, workableQty } = resolvePrecedence(
        downstream,
        MOCK_FLOOR_TASKS,
        MOCK_TRANSFER_TICKETS,
      );
      expect(workableQty).toBe(0);
      expect(blocking.map((b) => b.name)).toEqual(['軋盒成型']);
      expect(canReportTask(downstream, ctx)).toBe(false);
    });

    it('前置累計良品大於 0 → 可報工，可做量等於良品換算後的量', () => {
      const tasks = withGood(1200);
      const { blocking, workableQty } = resolvePrecedence(
        downstream,
        tasks,
        MOCK_TRANSFER_TICKETS,
      );
      // 兩道的投入與產出同單位（bom_unit_usage 為 1），可做量即上一道的累計良品
      expect(downstream.bom_unit_usage).toBe(1);
      expect(workableQty).toBe(1200);
      expect(blocking).toEqual([]);
      expect(canReportTask(downstream, { tasks, tickets: MOCK_TRANSFER_TICKETS })).toBe(true);
    });

    it('前置累計良品的換算依本任務的單位用量（每 1 件產出耗用 4 單位投入 → 可做量取整除）', () => {
      const tasks = withGood(1000);
      const scaled = { ...downstream, bom_unit_usage: 4 };
      expect(resolvePrecedence(scaled, tasks, MOCK_TRANSFER_TICKETS).workableQty).toBe(250);
    });

    it('不需轉交的前置不因為沒有轉交單就放行（沒有料的機台開不了工）', () => {
      // 鏈三沒有任何轉交單，唯一的放行依據就是前置的累計良品
      const chainTickets = MOCK_TRANSFER_TICKETS.filter((t) =>
        (t.details ?? []).some((d) => (d.task_id ?? '').startsWith('pt-0815')),
      );
      expect(chainTickets).toHaveLength(0);
      expect(canReportTask(downstream, { tasks: MOCK_FLOOR_TASKS, tickets: [] })).toBe(false);
    });
  });

  it('任務或前置資料缺漏時一律不可報工（不給入口比給錯入口安全）', () => {
    expect(canReportTask(null, ctx)).toBe(false);
    expect(canReportTask(undefined)).toBe(false);
  });
});
