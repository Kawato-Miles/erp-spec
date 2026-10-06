import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/notificationStore.js';
import { MOCK_FLOOR_STAFF } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { transferMoverCandidates } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { isMyTransferTicket } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/unit-scope.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';

// 情境目錄 10.40「建轉交單選負責廠務」的資料層驗算（畫面另在 e2e 10.40 驗）。
// 起點資料：鏈四 PT-0820-9 精裝裝訂（目的站點品檢站，可搬量 500）；現場名冊兩位廠務簡俊男、邱志明。
// 開始搬運與抵達站點的回報者就是負責廠務，歷程記負責廠務，單上不設廠內執行者（Miles 2026-10-06 拍板）。

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
    plannedDate: '2026-10-07',
    picks: [{ task_id: 'pt-0820-9', qty: 200 }],
    actor: '許文傑',
    assignedMover,
  });
const ticketById = (id) => floor().transferTickets.find((t) => t.id === id);

describe('10.40 建轉交單選負責廠務', () => {
  it('候選只有具轉交搬運回報權限的人員：兩位廠務，不含師傅、品檢人員與生管', () => {
    expect(transferMoverCandidates(MOCK_FLOOR_STAFF)).toEqual(['簡俊男', '邱志明']);
  });

  it('沒選或選了非候選人員時建單擋下，不產生轉交單', () => {
    const before = floor().transferTickets.length;
    expect(create(undefined).error).toBe('請選一位負責廠務');
    expect(create('劉阿海').error).toBe('請選一位負責廠務');
    expect(floor().transferTickets).toHaveLength(before);
  });

  it('建單寫入負責廠務、停在待搬運，系統只通知負責廠務；單上不帶廠內執行者與確認操作人', () => {
    const { created } = create('邱志明');
    expect(created).toHaveLength(1);
    expect(created[0].assigned_mover).toBe('邱志明');
    expect(created[0].status).toBe('待搬運');
    expect(created[0]).not.toHaveProperty('executor');
    expect(created[0]).not.toHaveProperty('confirmed_by');
    expect(created[0].history.at(-1).event).toContain('負責廠務 邱志明');
    expect(inboxOf('邱志明')).toHaveLength(1);
    expect(inboxOf('邱志明')[0].title).toContain(created[0].ticket_no);
    expect(inboxOf('簡俊男')).toHaveLength(0);
  });

  it('待搬運可改負責廠務：通知新的負責廠務，歷程記改前與改後', () => {
    const ticket = create('邱志明').created[0];
    const result = floor().reassignTransferMover(ticket.id, {
      assignedMover: '簡俊男',
      actor: '許文傑',
    });
    expect(result.ok).toBe(true);
    const after = ticketById(ticket.id);
    expect(after.assigned_mover).toBe('簡俊男');
    expect(after.history.at(-1).event).toBe('改負責廠務：邱志明 → 簡俊男');
    expect(inboxOf('簡俊男')).toHaveLength(1);
  });

  it('開始搬運與抵達站點只有負責廠務本人回報得了，歷程記負責廠務', () => {
    const ticket = create('邱志明').created[0];
    const other = floor().startTransfer(ticket.id, { by: '簡俊男' });
    expect(other.ok).toBe(false);
    expect(other.error).toContain('負責廠務是 邱志明');
    expect(ticketById(ticket.id).status).toBe('待搬運');

    expect(floor().startTransfer(ticket.id, { by: '邱志明' }).ok).toBe(true);
    const moving = ticketById(ticket.id);
    expect(moving.status).toBe('搬運中');
    expect(moving.history.at(-1)).toMatchObject({ actor: '邱志明' });

    const delivered = floor().deliverTransfer(ticket.id, {
      by: '邱志明',
      photosByTask: { 'pt-0820-9': ['精裝到站照.jpg'] },
    });
    expect(delivered.ok).toBe(true);
    const arrived = ticketById(ticket.id);
    expect(arrived.status).toBe('已送達');
    expect(arrived.history.at(-1)).toMatchObject({ actor: '邱志明' });
    expect(arrived).not.toHaveProperty('confirmed_by');
  });

  it('我的轉交單只列負責廠務為自己的單（回報按鈕只在這個單元出現）', () => {
    const ticket = create('邱志明').created[0];
    expect(isMyTransferTicket(ticket, '邱志明')).toBe(true);
    expect(isMyTransferTicket(ticket, '簡俊男')).toBe(false);
  });

  it('開始搬運後不可改負責廠務', () => {
    const ticket = create('邱志明').created[0];
    expect(floor().startTransfer(ticket.id, { by: '邱志明' }).ok).toBe(true);
    const result = floor().reassignTransferMover(ticket.id, {
      assignedMover: '簡俊男',
      actor: '許文傑',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不可改負責廠務');
  });

  it('既有轉交單都帶負責廠務簡俊男，且不帶廠內執行者與確認操作人', () => {
    floor().transferTickets.forEach((t) => {
      expect(t.assigned_mover).toBe('簡俊男');
      expect(t).not.toHaveProperty('executor');
      expect(t).not.toHaveProperty('confirmed_by');
    });
  });
});
