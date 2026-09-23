import { describe, expect, it } from 'vitest';
import { canReceiveTransfer } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';

// 情境 10.8「點收佇列依所屬產線過濾，不看角色」的判定驗算（畫面呈現另在 e2e 10.8 驗）。
// 誰能點收只看人員的所屬產線含不含該站；生管、印務與印務主管可代點收，主管唯讀不可代點收。
// 現場人員的所屬產線（production-floor/_lib/mock-data.js MOCK_FLOOR_STAFF）：
// 劉阿海＝印刷產線、後加工產線；李榮發＝印刷產線、裁切站；郭淑芬＝品檢站。

const ticketTo = (stationKey) => ({
  id: `tt-${stationKey}`,
  status: '已送達',
  target_station_key: stationKey,
  target_station: stationKey,
  details: [],
});

const CUT_STATION = ticketTo('POLAR 137 裁切機'); // 所屬產線為裁切站
const QC_STATION = ticketTo('品檢站');

describe('10.8 點收依所屬產線過濾', () => {
  it('師傅劉阿海不屬於裁切站，點不了裁切站的單', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'master', currentUser: '劉阿海' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('裁切站');
  });

  it('師傅李榮發的所屬產線含裁切站，點得了同一張單', () => {
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

  it('生管兩站都可代點收，並標為代點收', () => {
    const cut = canReceiveTransfer(CUT_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    const qc = canReceiveTransfer(QC_STATION, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    expect(cut).toMatchObject({ allowed: true, proxy: true });
    expect(qc).toMatchObject({ allowed: true, proxy: true });
  });

  it('印務與印務主管同樣可代點收', () => {
    expect(
      canReceiveTransfer(QC_STATION, { role: 'print_officer', currentUser: '周建宏' }).allowed,
    ).toBe(true);
    expect(
      canReceiveTransfer(QC_STATION, { role: 'print_manager', currentUser: '吳國豪' }).allowed,
    ).toBe(true);
  });

  it('不在現場人員名冊上的角色（業務）一律點不了', () => {
    const result = canReceiveTransfer(CUT_STATION, { role: 'sales', currentUser: '洪嘉駿' });
    expect(result.allowed).toBe(false);
  });
});
