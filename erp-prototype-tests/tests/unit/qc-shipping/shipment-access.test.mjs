// 情境目錄 12.27、12.28（單據權責修正第五批）：出貨單的可見範圍跟著訂單、業務端操作的操作者依訂單編輯權。
// 範圍看所屬訂單的接單業務與分享成員，不看出貨單的建單人；現場動作（揀貨、裝箱、拋單、出貨確認、送達確認、
// 補附送達憑證）維持揀貨與出貨人員，不隨訂單編輯權開放。
// 依據：出貨與售後檢視活動清單（ACT-VDLV-001 至 007、014）、出貨活動清單（ACT-SHP-001 至 033）、
// 受控清單 § 訂單關聯單據的編輯權。畫面見 tests/e2e/12-shipping/access-scope.spec.mjs。
import { describe, expect, it } from 'vitest';
import {
  attachDeliveryProofOf,
  nextStatusOptions,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import {
  canCreateShipmentDraft,
  canDeleteShipmentDraft,
  canEditShipment,
  canFinalizeShipment,
  canViewShipment,
  canVoidShipment,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipment-access.js';

// 訂單的接單業務為洪嘉駿；張惠雯與印務周建宏以編輯層級、李志豪以檢視層級列入分享成員
const ORDER = {
  sales_person: '洪嘉駿',
  shared_members: [
    { name: '張惠雯', level: 'edit' },
    { name: '周建宏', level: 'edit' },
    { name: '李志豪', level: 'view' },
  ],
};
const OTHER_ORDER = { sales_person: '陳映蓉', shared_members: [] };

const HELPERS = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '蔡明修'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];
const NO_ENTRY = [
  ['production_planner', '許文傑'],
  ['qc_inspector', '郭淑芬'],
  ['master', '劉阿海'],
  ['facility_staff', '簡俊男'],
  ['accountant', '陳美玲'],
  ['reviewer', '魏彣軒'],
];
const OPS = [
  ['建立出貨單草稿', canCreateShipmentDraft],
  ['編輯出貨單', canEditShipment],
  ['刪除出貨單草稿', canDeleteShipmentDraft],
  ['建立出貨單', canFinalizeShipment],
  ['作廢出貨單', canVoidShipment],
];

describe('12.28 出貨單業務端操作：接單業務、編輯分享成員、六個全公司協助角色', () => {
  it.each(OPS)('%s：接單業務與編輯分享成員可以，檢視分享成員與非負責業務不可', (_, can) => {
    expect(can(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(can(ORDER, 'consultant', '張惠雯')).toBe(true);
    expect(can(ORDER, 'print_officer', '周建宏')).toBe(true);
    expect(can(ORDER, 'sales', '李志豪')).toBe(false);
    expect(can(ORDER, 'sales', '陳映蓉')).toBe(false);
    expect(can(OTHER_ORDER, 'sales', '洪嘉駿')).toBe(false);
  });

  it.each(OPS)('%s：六個全公司協助角色對任何訂單都可以', (_, can) => {
    for (const [role, name] of HELPERS) {
      expect(can(ORDER, role, name)).toBe(true);
      expect(can(OTHER_ORDER, role, name)).toBe(true);
    }
  });

  it.each(OPS)('%s：揀貨人員、出貨人員與其他角色不可', (_, can) => {
    for (const [role, name] of [['picker', '范姜宏'], ['shipper', '曾志偉'], ...NO_ENTRY]) {
      expect(can(ORDER, role, name)).toBe(false);
    }
  });

  it('沒有訂單時一律不可（查無訂單不放行）', () => {
    expect(canEditShipment(null, 'sales_manager', '林雅婷')).toBe(false);
    expect(canVoidShipment(undefined, 'supervisor', '王大明')).toBe(false);
  });

  it('改派後新接單業務可處置、原業務不可：權限只看訂單現值，不看建單人', () => {
    const shipment = { created_by: '賴柏宇', status: '草稿' };
    const reassigned = { sales_person: '洪嘉駿', shared_members: [] };
    expect(shipment.created_by).not.toBe(reassigned.sales_person);
    expect(canEditShipment(reassigned, 'sales', '洪嘉駿')).toBe(true);
    expect(canDeleteShipmentDraft(reassigned, 'sales', '洪嘉駿')).toBe(true);
    expect(canEditShipment(reassigned, 'sales', '賴柏宇')).toBe(false);
    expect(canVoidShipment(reassigned, 'sales', '賴柏宇')).toBe(false);
  });

  it('現場動作不隨訂單編輯權開放：業務、業務主管等看不到任何現場下一步，也沒有補附送達憑證', () => {
    const states = ['未處理', '打包中', '待出貨', '運送中'];
    for (const [role] of [['sales'], ['consultant'], ...HELPERS]) {
      for (const status of states) {
        const options = nextStatusOptions({ role, shipment: { status, method: '新竹物流' } });
        expect(options.filter((o) => o.status !== '已作廢')).toEqual([]);
      }
      expect(attachDeliveryProofOf({ role, shipment: { status: '已送達', method: '新竹物流' } }).allowed).toBe(false);
    }
    // 補附送達憑證只給出貨人員（ACT-SHP-025）
    expect(attachDeliveryProofOf({ role: 'shipper', shipment: { status: '已送達', method: '新竹物流' } }).allowed).toBe(true);
  });
});

describe('12.27 出貨單的檢視範圍：業務、諮詢看自己負責與被分享訂單底下的單，其餘依活動列', () => {
  it('接單業務、檢視與編輯分享成員都看得到；非負責又未被分享的業務看不到', () => {
    expect(canViewShipment(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(canViewShipment(ORDER, 'sales', '李志豪')).toBe(true);
    expect(canViewShipment(ORDER, 'consultant', '張惠雯')).toBe(true);
    expect(canViewShipment(ORDER, 'sales', '陳映蓉')).toBe(false);
    expect(canViewShipment(OTHER_ORDER, 'sales', '洪嘉駿')).toBe(false);
  });

  it('揀貨人員、出貨人員、業務主管、Supervisor 與四個協助角色看全公司', () => {
    for (const [role, name] of [['picker', '范姜宏'], ['shipper', '曾志偉'], ...HELPERS]) {
      expect(canViewShipment(ORDER, role, name)).toBe(true);
      expect(canViewShipment(OTHER_ORDER, role, name)).toBe(true);
    }
  });

  it('生管、品檢人員、師傅、廠務、會計、審稿人員沒有出貨單檢視', () => {
    for (const [role, name] of NO_ENTRY) {
      expect(canViewShipment(ORDER, role, name)).toBe(false);
    }
  });

  it('被分享只看那一張訂單：分享成員對別的訂單仍看不到', () => {
    expect(canViewShipment(OTHER_ORDER, 'sales', '李志豪')).toBe(false);
  });
});
