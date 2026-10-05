import { describe, expect, it } from 'vitest';
import { canReceiveTransfer } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';

// 情境 10.8「點收佇列依所屬產線過濾」的判定驗算（畫面呈現另在 e2e 10.8 驗）。
// 誰能點收只看人員的所屬產線含不含該站（看得到就能做，2026-10-06 拍板）；
// 生管、印務與印務主管點收時留代點收標記；生管依人（許文傑不含品檢站），印務與印務主管六條產線加品檢站全選。
// 現場人員的所屬產線（production-floor/_lib/mock-data.js MOCK_FLOOR_STAFF）：
// 劉阿海＝數位產線、裝訂產線；李榮發＝數位產線、手工產線；郭淑芬＝品檢站。
// 目的站點以產線標籤為鍵（2026-10-06 拍板）。

const ticketTo = (stationKey) => ({
  id: `tt-${stationKey}`,
  status: '已送達',
  target_station_key: stationKey,
  target_station: stationKey,
  details: [],
});

const CUT_STATION = ticketTo('手工產線');
const QC_STATION = ticketTo('品檢站');

describe('10.8 點收依所屬產線過濾', () => {
  it('師傅劉阿海不屬於手工產線，點不了手工產線的單', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'master', currentUser: '劉阿海' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('手工產線');
  });

  it('師傅李榮發的所屬產線含手工產線，點得了同一張單', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'master', currentUser: '李榮發' });
    expect(result.allowed).toBe(true);
    expect(result.proxy).toBe(false);
  });

  it('品檢人員郭淑芬只對品檢站可點收', () => {
    expect(canReceiveTransfer(QC_STATION, { role: 'qc_inspector', currentUser: '郭淑芬' }).allowed).toBe(
      true,
    );
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'qc_inspector', currentUser: '郭淑芬' }).allowed,
    ).toBe(false);
  });

  it('品檢站不看角色：所屬產線不含品檢站的師傅一樣點不了', () => {
    expect(canReceiveTransfer(QC_STATION, { role: 'master', currentUser: '劉阿海' }).allowed).toBe(
      false,
    );
  });

  it('生管許文傑的所屬產線含手工產線：點得了手工產線並標為代點收；品檢站不在他的所屬產線', () => {
    const cut = canReceiveTransfer(CUT_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    const qc = canReceiveTransfer(QC_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    expect(cut).toMatchObject({ allowed: true, proxy: true });
    expect(qc.allowed).toBe(false);
  });

  it('生管鄭宇翔只負責手工與壓克力：點得了手工產線、點不了數位產線', () => {
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'production_planner', currentUser: '鄭宇翔' }).allowed,
    ).toBe(true);
    expect(
      canReceiveTransfer(ticketTo('數位產線'), { role: 'production_planner', currentUser: '鄭宇翔' })
        .allowed,
    ).toBe(false);
  });

  it('印務與印務主管六條產線加品檢站全選：手工產線與品檢站都點得了，並標為代點收', () => {
    expect(
      canReceiveTransfer(CUT_STATION, { role: 'print_officer', currentUser: '周建宏' }).allowed,
    ).toBe(true);
    expect(
      canReceiveTransfer(QC_STATION, { role: 'print_manager', currentUser: '吳國豪' }),
    ).toMatchObject({ allowed: true, proxy: true });
  });

  it('不在現場人員名冊上的角色（業務）一律點不了', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'sales', currentUser: '洪嘉駿' });
    expect(result.allowed).toBe(false);
  });
});
