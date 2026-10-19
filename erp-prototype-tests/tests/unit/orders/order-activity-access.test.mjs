// 單據權責修正第二批（change document-access-scope-alignment）：訂單與印件的操作者依活動清單。
// 對應情境目錄 2.22（已送報價單、確認回簽、上傳回簽）、2.24（核准訂單）、4.22（新增與刪除印件、修改備註、取消製作）、
// 4.23（取消訂單、手動推進）、5.18（確認可製作、上傳稿件）、2.25 的改派判斷。
// 規則正本：wiki 訂單審核活動清單、報價單簽回活動清單、稿件審查活動清單、改派負責人活動清單、受控清單 § 訂單關聯單據的編輯權。
// 畫面操作的驗收見 tests/e2e/02-order-setup/、tests/e2e/04-order-print-item/。
import { beforeEach, describe, expect, it } from 'vitest';
import * as perms from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { cancelOrderWithCascade } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/cancel-actions.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

// 六個全公司協助角色（業務主管、訂單管理人、印務主管、印務、審稿主管、Supervisor）
const ASSIST = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '周建宏'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];
const NOT_ASSIST = [
  ['accountant', '陳美玲'],
  ['production_planner', '許文傑'],
  ['picker', '范姜宏'],
  ['shipper', '曾志偉'],
  ['qc_inspector', '郭淑芬'],
  ['reviewer', '魏彣軒'],
];
const order = (patch = {}) => ({
  status: '審核通過',
  order_type: '線下單',
  sales_person: '洪嘉駿',
  assigned_manager: '林雅婷',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '蘇怡君', level: 'view' },
  ],
  ...patch,
});

// 對有訂單編輯權的三類人逐一斷言：接單業務、編輯層級分享成員、六個協助角色可；
// 檢視層級分享成員、非負責業務、其餘角色不可
function expectEditorsOnly(can) {
  expect(can('sales', '洪嘉駿'), '接單業務').toBe(true);
  expect(can('sales', '陳映蓉'), '編輯層級分享成員').toBe(true);
  for (const [role, name] of ASSIST) expect(can(role, name), role).toBe(true);
  expect(can('consultant', '蘇怡君'), '檢視層級分享成員').toBe(false);
  expect(can('sales', '李志豪'), '非負責業務').toBe(false);
  for (const [role, name] of NOT_ASSIST) expect(can(role, name), role).toBe(false);
}

describe('2.22 已送報價單、確認回簽、上傳回簽檔案只給有訂單編輯權的人', () => {
  it('已送報價單：審核通過時三類編輯者可見', () => {
    expectEditorsOnly((role, name) => perms.canMarkQuoteSent(order({ status: '審核通過' }), role, name));
  });
  it('已送報價單：不是審核通過就不出現（狀態時機維持現況）', () => {
    expect(perms.canMarkQuoteSent(order({ status: '報價待回簽' }), 'sales', '洪嘉駿')).toBe(false);
  });
  it('確認回簽：報價待回簽時三類編輯者可見', () => {
    expectEditorsOnly((role, name) => perms.canConfirmSignBack(order({ status: '報價待回簽' }), role, name));
  });
  it('上傳回簽檔案：三類編輯者可見', () => {
    expectEditorsOnly((role, name) => perms.canUploadSignedFile(order({ status: '報價待回簽' }), role, name));
  });
  it('業務乙（非接單業務、不在分享成員）看不到已送報價單，訂單管理人看得到', () => {
    const o = order({ status: '審核通過', shared_members: [] });
    expect(perms.canMarkQuoteSent(o, 'sales', '陳映蓉')).toBe(false);
    expect(perms.canMarkQuoteSent(o, 'order_manager', '黃聖雯')).toBe(true);
  });
});

describe('2.24 核准訂單只給審核業務主管本人，不隨編輯權開放', () => {
  const pending = order({ status: '待業務主管審核', assigned_manager: '林雅婷' });
  it('指定的審核業務主管本人可核准', () => {
    expect(perms.canApproveOrder(pending, 'sales_manager', '林雅婷')).toBe(true);
  });
  it('另一位業務主管、訂單管理人、Supervisor、接單業務都不可核准', () => {
    expect(perms.canApproveOrder(pending, 'sales_manager', '蔡佩珊')).toBe(false);
    expect(perms.canApproveOrder(pending, 'order_manager', '黃聖雯')).toBe(false);
    expect(perms.canApproveOrder(pending, 'supervisor', '王大明')).toBe(false);
    expect(perms.canApproveOrder(pending, 'sales', '洪嘉駿')).toBe(false);
  });
});

describe('4.22 新增與刪除印件、修改規格備註與包裝備註、取消製作', () => {
  it('新增印件：三類編輯者可，其餘不可', () => {
    expectEditorsOnly((role, name) => perms.canAddPrintItem(order({ status: '草稿' }), role, name));
  });

  it('刪除印件：成立前三類編輯者可；成立後仍一律不提供', () => {
    expectEditorsOnly((role, name) => perms.canDeletePrintItem(order({ status: '草稿' }), role, name));
    for (const [role, name] of [['sales', '洪嘉駿'], ...ASSIST]) {
      expect(perms.canDeletePrintItem(order({ status: '製作中' }), role, name)).toBe(false);
    }
  });

  it('修改規格備註與包裝備註：諮詢（自己負責）、業務主管、審稿主管、Supervisor 都可；檢視層級不可', () => {
    const consultantOrder = order({ status: '製作中', sales_person: '張惠雯' });
    expect(perms.canEditPrintItemNotes(consultantOrder, 'consultant', '張惠雯')).toBe(true);
    for (const [role, name] of [
      ['sales_manager', '林雅婷'],
      ['reviewer_supervisor', '魏彣軒'],
      ['supervisor', '王大明'],
    ]) {
      expect(perms.canEditPrintItemNotes(order({ status: '製作中' }), role, name), role).toBe(true);
    }
    expect(perms.canEditPrintItemNotes(order({ status: '製作中' }), 'consultant', '蘇怡君')).toBe(false);
    expect(perms.canEditPrintItemNotes(order({ status: '製作中' }), 'accountant', '陳美玲')).toBe(false);
  });

  it('編輯印件（含稿件備註）：三類編輯者可，終態訂單不可', () => {
    expectEditorsOnly((role, name) => perms.canEditPrintItem(order({ status: '製作中' }), role, name));
    expect(perms.canEditPrintItem(order({ status: '訂單完成' }), 'sales', '洪嘉駿')).toBe(false);
  });

  it('取消製作：進行中印件，訂單管理人可；非負責且不在分享成員的業務不可', () => {
    const item = { print_item_status: '製作中' };
    expect(perms.canAbandonPrintItem(order({ status: '製作中' }), item, 'order_manager', '黃聖雯')).toBe(true);
    expect(perms.canAbandonPrintItem(order({ status: '製作中' }), item, 'sales', '李志豪')).toBe(false);
    expect(perms.canAbandonPrintItem(order({ status: '製作中' }), item, 'consultant', '蘇怡君')).toBe(false);
    // 已棄用印件不再提供
    expect(
      perms.canAbandonPrintItem(order({ status: '製作中' }), { print_item_status: '已棄用' }, 'sales', '洪嘉駿'),
    ).toBe(false);
  });
});

describe('4.23 取消訂單與手動推進：協助角色可，非負責業務不可', () => {
  it('取消訂單：三類編輯者可，終態不可', () => {
    expectEditorsOnly((role, name) => perms.canCancelOrder(order({ status: '製作中' }), role, name));
    expect(perms.canCancelOrder(order({ status: '訂單完成' }), 'sales_manager', '林雅婷')).toBe(false);
  });
  it('手動推進：三類編輯者可（已回簽起），審核段兩格維持不提供', () => {
    expectEditorsOnly((role, name) => perms.canAdvanceOrderStatus(order({ status: '已回簽' }), role, name));
    expect(perms.canAdvanceOrderStatus(order({ status: '草稿' }), 'sales_manager', '林雅婷')).toBe(false);
  });
  it('非負責業務直接呼叫取消連鎖被擋下，訂單狀態不變；業務主管可取消', () => {
    const initial = useOrdersStore.getState().orders;
    try {
      useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
      const blocked = cancelOrderWithCascade('ORD-2026-0814');
      expect(blocked.ok).toBe(false);
      expect(useOrdersStore.getState().getOrder('ORD-2026-0814').status).toBe('草稿');
      useSessionStore.setState({ role: 'sales_manager', userName: null });
      expect(cancelOrderWithCascade('ORD-2026-0814').ok).toBe(true);
      expect(useOrdersStore.getState().getOrder('ORD-2026-0814').status).toBe('已取消');
    } finally {
      useOrdersStore.setState({ orders: initial });
      useSessionStore.setState({ role: 'sales', userName: null });
    }
  });
});

describe('2.25 改派接單業務：未取消即可（含訂單完成），業務主管與 Supervisor 才有入口', () => {
  it('改派入口：業務主管與 Supervisor 在未取消訂單可，其餘角色不可', () => {
    const o = order({ status: '製作中' });
    expect(perms.canReassignOrderOwner(o, 'sales_manager', '林雅婷')).toBe(true);
    expect(perms.canReassignOrderOwner(o, 'supervisor', '王大明')).toBe(true);
    for (const [role, name] of [
      ['sales', '洪嘉駿'],
      ['sales', '陳映蓉'],
      ['print_manager', '吳國豪'],
      ['order_manager', '黃聖雯'],
      ['accountant', '陳美玲'],
    ]) {
      expect(perms.canReassignOrderOwner(o, role, name), role).toBe(false);
    }
  });
  it('訂單完成可改派，已取消不可', () => {
    expect(perms.canReassignOrderOwner(order({ status: '訂單完成' }), 'sales_manager', '林雅婷')).toBe(true);
    expect(perms.canReassignOrderOwner(order({ status: '已取消' }), 'sales_manager', '林雅婷')).toBe(false);
    expect(perms.canReassignOrderOwner(order({ status: '已取消' }), 'supervisor', '王大明')).toBe(false);
  });
});

describe('5.18 確認可製作與上傳稿件的操作者', () => {
  const ORDER_ID = 'ORD-2026-0920';
  const ITEM_ID = 'pi-2026-0923'; // 審稿維度「合格」的大貨印件，接單業務洪嘉駿
  const initialOrders = useOrdersStore.getState().orders;
  const store = () => useOrdersStore.getState();
  const reviewStatus = () =>
    store().getOrder(ORDER_ID).print_items.find((p) => p.id === ITEM_ID).review_status;

  beforeEach(() => {
    useOrdersStore.setState({ orders: initialOrders });
    useSessionStore.setState({ role: 'sales', userName: null });
  });

  it('起點資料：審稿維度為合格', () => {
    expect(reviewStatus()).toBe('合格');
  });

  it('業務乙（非接單業務、不在分享成員）繞過介面送出確認可製作：被擋下，審稿維度維持合格', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    expect(store().confirmProducible(ORDER_ID, ITEM_ID)).toMatchObject({ ok: false });
    expect(reviewStatus()).toBe('合格');
  });

  it('審稿人員繞過介面送出確認可製作：被擋下', () => {
    useSessionStore.setState({ role: 'reviewer', userName: null });
    expect(store().confirmProducible(ORDER_ID, ITEM_ID)).toMatchObject({ ok: false });
    expect(reviewStatus()).toBe('合格');
  });

  it('業務主管（全公司協助角色）確認可製作成立', () => {
    useSessionStore.setState({ role: 'sales_manager', userName: null });
    expect(store().confirmProducible(ORDER_ID, ITEM_ID)).toMatchObject({ ok: true });
    expect(reviewStatus()).toBe('已確認可製作');
  });

  it('系統自動確認（線上單免審）不受角色限制', () => {
    useSessionStore.setState({ role: 'accountant', userName: null });
    expect(store().confirmProducible(ORDER_ID, ITEM_ID, { auto: true })).toMatchObject({ ok: true });
    expect(reviewStatus()).toBe('已確認可製作');
  });

  it('退回重審：業務乙被擋下；接單業務可退回', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    expect(store().returnForRework(ORDER_ID, ITEM_ID).ok).toBe(false);
    expect(reviewStatus()).toBe('合格');
    useSessionStore.setState({ role: 'sales', userName: null });
    expect(store().returnForRework(ORDER_ID, ITEM_ID).ok).toBe(true);
    expect(reviewStatus()).toBe('待改稿');
  });

  it('上傳稿件：接單的諮詢可上傳自己負責訂單的稿件；非負責業務與審稿人員不可', () => {
    const item = { order_source: 'B2B' };
    const consultantOrder = order({ status: '稿件未上傳', sales_person: '張惠雯', shared_members: [] });
    expect(perms.canUploadArtwork(item, consultantOrder, 'consultant', '張惠雯')).toBe(true);
    expect(perms.canUploadArtwork(item, consultantOrder, 'sales', '洪嘉駿')).toBe(false);
    expect(perms.canUploadArtwork(item, consultantOrder, 'reviewer', '魏彣軒')).toBe(false);
  });

  it('上傳稿件：六個全公司協助角色與編輯層級分享成員可；會員自傳的線上單印件任何人都不提供', () => {
    const item = { order_source: 'B2B' };
    for (const [role, name] of ASSIST) {
      expect(perms.canUploadArtwork(item, order({ status: '稿件未上傳' }), role, name), role).toBe(true);
    }
    expect(perms.canUploadArtwork(item, order({ status: '稿件未上傳' }), 'sales', '陳映蓉')).toBe(true);
    expect(perms.canUploadArtwork({ order_source: 'B2C' }, order(), 'sales_manager', '林雅婷')).toBe(false);
  });

  it('打樣結果：三類編輯者可填；審稿人員、會計不可', () => {
    expectEditorsOnly((role, name) => perms.canJudgeSampleResult(order({ status: '製作中' }), role, name));
  });
});

describe('2.21 被指派為審核業務主管不構成業務看到訂單的途徑', () => {
  it('業務乙即使被記為審核業務主管，不是接單業務也不在分享成員就看不到訂單', () => {
    const o = order({ assigned_manager: '陳映蓉', shared_members: [] });
    expect(perms.canSeeOrder(o, 'sales', '陳映蓉')).toBe(false);
    expect(perms.canSeeOrder(o, 'sales', '洪嘉駿')).toBe(true);
  });
  it('會計沒有訂單檢視；六個全公司協助角色看得到', () => {
    expect(perms.canSeeOrder(order(), 'accountant', '陳美玲')).toBe(false);
    for (const [role, name] of ASSIST) expect(perms.canSeeOrder(order(), role, name), role).toBe(true);
  });
});
