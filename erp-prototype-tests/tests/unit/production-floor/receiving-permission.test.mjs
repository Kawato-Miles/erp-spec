import { describe, expect, it } from 'vitest';
import { canReceiveTransfer } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';

// 情境 10.8「點收佇列依所屬產線過濾」的判定驗算（畫面呈現另在 e2e 10.8 驗）。
// 誰能點收只看人員的所屬產線（看得到就能做，2026-10-06 拍板 T2）：點收佇列看目的產線；所有轉交單看來源或目的產線，
// 兩個單元功能相同，所以來源任務產線或目的產線任一在所屬產線內即可點收、修改、作廢點收紀錄；
// 不分代點收、不依角色區分點收方式，點收人記實際操作的人（T3）。
// 品檢站是品檢線底下的站點，品檢人員郭淑芬的所屬產線為品檢線（L4）。
// 現場人員的所屬產線（production-floor/_lib/mock-data.js MOCK_FLOOR_STAFF）：
// 劉阿海＝數位產線、裝訂產線；李榮發＝數位產線、手工產線；郭淑芬＝品檢線；
// 許文傑＝數位、裝訂、手工產線；鄭宇翔＝手工、壓克力產線；周建宏、吳國豪＝六條產線加品檢線。
// 轉交單單頭記目的產線（destination_line），明細記目的站點（destination_station_key）。

const ticketTo = (line, station) => ({
  id: `tt-${station}`,
  status: '已送達',
  destination_line: line,
  details: [{ task_id: 'pt-demo', destination_station_key: station, qty: 100, receipts: [] }],
});

const CUT_STATION = ticketTo('手工產線', '裁切站');
const QC_STATION = ticketTo('品檢線', '品檢站');

// 轉交來源任務（明細 task_id 為 pt-demo）所在的產線
const sourceOn = (line) => [{ id: 'pt-demo', production_line: line }];

describe('10.8 點收依所屬產線過濾', () => {
  it('師傅劉阿海不屬於手工產線，點不了手工產線的單', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'master', currentUser: '劉阿海' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('手工產線');
  });

  it('師傅李榮發的所屬產線含手工產線，點得了同一張單', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'master', currentUser: '李榮發' });
    expect(result.allowed).toBe(true);
    expect(result.proxy).toBeFalsy();
  });

  it('品檢人員郭淑芬的所屬產線為品檢線：只對目的產線為品檢線的單可點收', () => {
    expect(canReceiveTransfer(QC_STATION, { role: 'qc_inspector', currentUser: '郭淑芬' }).allowed).toBe(
      true,
    );
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'qc_inspector', currentUser: '郭淑芬' }).allowed,
    ).toBe(false);
  });

  it('品檢線不看角色：所屬產線不含品檢線的師傅一樣點不了', () => {
    expect(canReceiveTransfer(QC_STATION, { role: 'master', currentUser: '劉阿海' }).allowed).toBe(
      false,
    );
  });

  it('生管許文傑的所屬產線含手工產線：點得了手工產線且不留代點收標記；品檢線不在他的所屬產線', () => {
    const cut = canReceiveTransfer(CUT_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    const qc = canReceiveTransfer(QC_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    expect(cut.allowed).toBe(true);
    expect(cut.proxy).toBeFalsy();
    expect(qc.allowed).toBe(false);
  });

  it('生管鄭宇翔只負責手工與壓克力：點得了手工產線、點不了數位產線', () => {
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'production_planner', currentUser: '鄭宇翔' }).allowed,
    ).toBe(true);
    expect(
      canReceiveTransfer(ticketTo('數位產線', '印刷站'), {
        role: 'production_planner',
        currentUser: '鄭宇翔',
      }).allowed,
    ).toBe(false);
  });

  it('同一條產線的不同站點同一套判斷：鄭宇翔點得了壓克力產線雷切站的單', () => {
    expect(
      canReceiveTransfer(ticketTo('壓克力產線', '雷切站'), {
        role: 'production_planner',
        currentUser: '鄭宇翔',
      }).allowed,
    ).toBe(true);
  });

  it('印務與印務主管六條產線加品檢線全選：手工產線與品檢線都點得了，不留代點收標記', () => {
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'print_officer', currentUser: '周建宏' }).allowed,
    ).toBe(true);
    const qc = canReceiveTransfer(QC_STATION, { role: 'print_manager', currentUser: '吳國豪' });
    expect(qc.allowed).toBe(true);
    expect(qc.proxy).toBeFalsy();
  });

  it('不在現場人員名冊上的角色（業務）一律點不了', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'sales', currentUser: '洪嘉駿' });
    expect(result.allowed).toBe(false);
  });

  it('所有轉交單：來源任務產線在所屬產線內也點得了——劉阿海（數位、裝訂）對來源在數位產線、目的在手工產線的單可點收', () => {
    const result = canReceiveTransfer(CUT_STATION, {
      role: 'master',
      currentUser: '劉阿海',
      tasks: sourceOn('數位產線'),
    });
    expect(result.allowed).toBe(true);
  });

  it('來源與目的產線都不在所屬產線內：點不了——劉阿海對來源在壓克力產線、目的在手工產線的單', () => {
    const result = canReceiveTransfer(CUT_STATION, {
      role: 'master',
      currentUser: '劉阿海',
      tasks: sourceOn('壓克力產線'),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('手工產線');
  });

  it('主管唯讀：即使來源或目的產線在範圍內也不點收', () => {
    const result = canReceiveTransfer(CUT_STATION, {
      role: 'supervisor',
      currentUser: '許文傑',
      tasks: sourceOn('數位產線'),
    });
    expect(result.allowed).toBe(false);
  });
});
