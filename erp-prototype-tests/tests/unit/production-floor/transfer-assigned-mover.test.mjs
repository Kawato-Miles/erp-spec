import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/notificationStore.js';
import { MOCK_FLOOR_STAFF } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { transferMoverCandidates } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';

// 情境目錄 10.40「建轉交單指定廠務」的資料層驗算（畫面另在 e2e 10.40 驗）。
// 起點資料：鏈四 PT-0820-9 精裝裝訂（目的站點品檢站，可搬量 500）；現場名冊兩位廠務簡俊男、邱志明。

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workReports: useProductionFloorStore.getState().workReports,
};

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useNotificationStore.setState({ notifications: [] });
});

const floor = () => useProductionFloorStore.getState();
const inboxOf = (name) => useNotificationStore.getState().inboxOf(name);
const create = (assignedMover) =>
  floor().createTransferTickets({
    picks: [{ task_id: 'pt-0820-9', qty: 200 }],
    actor: '許文傑',
    assignedMover,
  });

describe('10.40 建轉交單指定廠務', () => {
  it('候選只有具轉交搬運回報權限的人員：兩位廠務，不含師傅與品檢人員', () => {
    expect(transferMoverCandidates(MOCK_FLOOR_STAFF)).toEqual(['簡俊男', '邱志明']);
  });

  it('沒指派或指派非候選人員時建單擋下，不產生轉交單', () => {
    const before = floor().transferTickets.length;
    expect(create(undefined).error).toBe('請指派一位廠務搬運');
    expect(create('劉阿海').error).toBe('請指派一位廠務搬運');
    expect(floor().transferTickets).toHaveLength(before);
  });

  it('建單寫入指派廠務、停在待搬運，系統只通知被指派的那一位', () => {
    const { created } = create('邱志明');
    expect(created).toHaveLength(1);
    expect(created[0].assigned_mover).toBe('邱志明');
    expect(created[0].status).toBe('待搬運');
    expect(created[0].executor).toBeNull();
    expect(created[0].history.at(-1).event).toContain('指派廠務 邱志明');
    expect(inboxOf('邱志明')).toHaveLength(1);
    expect(inboxOf('邱志明')[0].title).toContain(created[0].ticket_no);
    expect(inboxOf('簡俊男')).toHaveLength(0);
  });

  it('待搬運可改指派：通知新的被指派者，歷程記原指派與新指派', () => {
    const ticket = create('邱志明').created[0];
    const result = floor().reassignTransferMover(ticket.id, {
      assignedMover: '簡俊男',
      actor: '許文傑',
    });
    expect(result.ok).toBe(true);
    const after = floor().transferTickets.find((t) => t.id === ticket.id);
    expect(after.assigned_mover).toBe('簡俊男');
    expect(after.history.at(-1).event).toBe('改指派廠務：邱志明 → 簡俊男');
    expect(inboxOf('簡俊男')).toHaveLength(1);
  });

  it('開始搬運後不可改指派；廠內執行者記實際回報開始搬運的人，可與指派廠務不同', () => {
    const ticket = create('邱志明').created[0];
    expect(floor().startTransfer(ticket.id, { executor: '簡俊男' }).ok).toBe(true);
    const moving = floor().transferTickets.find((t) => t.id === ticket.id);
    expect(moving.assigned_mover).toBe('邱志明');
    expect(moving.executor).toBe('簡俊男');
    const result = floor().reassignTransferMover(ticket.id, {
      assignedMover: '簡俊男',
      actor: '許文傑',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不可改指派廠務');
  });

  it('既有轉交單都帶指派廠務', () => {
    floor().transferTickets.forEach((t) => expect(t.assigned_mover).toBe('簡俊男'));
  });
});
