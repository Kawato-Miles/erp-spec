// 情境目錄 7.45、7.46、7.47、8.20、8.21、8.22（單據權責修正第四批：工單與生產）。
// 工單動作的操作者改依活動表：負責印務、被分享（編輯）成員（不限角色）、印務主管（全公司）可做負責印務能做的動作；
// 審核類與其他角色的現場動作不隨編輯權開放；不再先判斷是不是印務。
// 畫面操作在 tests/e2e/07-process-planning/officer-proxy-access.spec.mjs 與
// tests/e2e/08-process-review-deliver/print-sheet.spec.mjs。
// 依據：製程規劃活動清單（ACT-PLAN-001 至 046）、輸出活動清單（ACT-OUT-002、003、010、011）、
// 分享與職務代理活動清單（ACT-SHR-009 至 011）、受控清單 § 工單關聯單據的編輯權。
import { describe, expect, it } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

const clone = (v) => JSON.parse(JSON.stringify(v));
const wo = (no, patch = {}) => ({
  ...clone(MOCK_WORK_ORDERS.find((o) => o.work_order_no === no)),
  ...patch,
});

// 起點資料（MOCK-DATA-CHAIN § 單據的分享成員）：
//   WO-2026-0901 草稿，負責印務周建宏，檢視層級成員蔡明修
//   WO-2026-0906 製程確認中，負責印務周建宏，編輯（代理）成員生管許文傑、業務陳映蓉
//   WO-2026-0907 製程確認中，負責印務蔡明修；WO-2026-0908 製程審核完成，負責印務周建宏
const MANAGER = ['print_manager', '吳國豪'];
const SALES_EDIT = ['sales', '陳映蓉'];
const PLANNER_EDIT = ['production_planner', '許文傑'];
const OTHER_OFFICER = ['print_officer', '周建宏']; // 周建宏不是 WO-2026-0907、0910 的負責人
const VIEW_ONLY = ['print_officer', '蔡明修']; // 蔡明修是 WO-2026-0901 的檢視層級成員

describe('7.45 印務主管不是負責人也不在分享成員，照樣代做負責印務的動作', () => {
  it('草稿工單：可編輯製程、建立與刪除生產任務、送審、改確樣需求、編輯工單資訊', () => {
    const draft = wo('WO-2026-0901');
    expect(permissions.canEditProcess(draft, ...MANAGER)).toBe(true);
    expect(permissions.canSubmitProcess(draft, ...MANAGER)).toBe(true);
    expect(permissions.proofRequirementEditGuard(draft, ...MANAGER).allowed).toBe(true);
    expect(permissions.workOrderInfoEditGuard(draft, ...MANAGER).allowed).toBe(true);
  });

  it('製程確認中可收回；製程審核完成可交付；製作中可發起異動；任何狀態可管理分享成員', () => {
    expect(permissions.canWithdrawProcess(wo('WO-2026-0906'), ...MANAGER).allowed).toBe(true);
    const approved = wo('WO-2026-0908');
    expect(approved.tasks.some((t) => !t.delivered)).toBe(true);
    expect(permissions.canDeliverTasks(approved, ...MANAGER)).toBe(true);
    expect(permissions.canAdjustTasks(wo('WO-2026-0710'), ...MANAGER)).toBe(true);
    expect(permissions.canManageSharing(wo('WO-2026-0908'), ...MANAGER)).toBe(true);
  });

  it('送審前預覽單據；製程審核完成後可列印', () => {
    expect(permissions.canPreviewWorkOrder(wo('WO-2026-0901'), ...MANAGER)).toBe(true);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0908'), ...MANAGER)).toBe(true);
  });

  it('印務主管對印件的製程說明與品檢需求、印務印件檔案照樣可改', () => {
    const items = [wo('WO-2026-0901')];
    expect(permissions.printItemProcessQcEditGuard(items, '製作中', ...MANAGER).allowed).toBe(true);
    expect(permissions.printItemOfficerFilesEditGuard(items, ...MANAGER).allowed).toBe(true);
  });
});

describe('7.46 非印務的編輯分享成員做負責印務的動作（WO-2026-0906 的業務陳映蓉、生管許文傑）', () => {
  it.each([SALES_EDIT, PLANNER_EDIT])('%s：草稿可編輯製程與送審、改確樣需求、編輯工單資訊', (...who) => {
    const draft = wo('WO-2026-0906', { status: '草稿' });
    expect(permissions.canEditProcess(draft, ...who)).toBe(true);
    expect(permissions.canSubmitProcess(draft, ...who)).toBe(true);
    expect(permissions.proofRequirementEditGuard(draft, ...who).allowed).toBe(true);
    expect(permissions.workOrderInfoEditGuard(draft, ...who).allowed).toBe(true);
  });

  it.each([SALES_EDIT, PLANNER_EDIT])('%s：製程確認中可收回、製作中可發起異動、可管理分享成員', (...who) => {
    expect(permissions.canWithdrawProcess(wo('WO-2026-0906'), ...who).allowed).toBe(true);
    expect(permissions.canAdjustTasks(wo('WO-2026-0906', { status: '製作中' }), ...who)).toBe(true);
    expect(permissions.canManageSharing(wo('WO-2026-0906'), ...who)).toBe(true);
  });

  it.each([SALES_EDIT, PLANNER_EDIT])('%s：改所屬印件的製程說明與印務印件檔案', (...who) => {
    const items = [wo('WO-2026-0906', { status: '製作中' })];
    expect(permissions.printItemProcessQcEditGuard(items, '製作中', ...who).allowed).toBe(true);
    expect(permissions.printItemOfficerFilesEditGuard(items, ...who).allowed).toBe(true);
  });

  it('同樣是業務與生管，不在這張工單的分享成員就沒有任何入口', () => {
    const draft = wo('WO-2026-0901');
    for (const who of [['sales', '洪嘉駿'], ['production_planner', '許文傑']]) {
      expect(permissions.canEditProcess(draft, ...who), who.join()).toBe(false);
      expect(permissions.canSubmitProcess(draft, ...who), who.join()).toBe(false);
      expect(permissions.canManageSharing(draft, ...who), who.join()).toBe(false);
      expect(permissions.proofRequirementEditGuard(draft, ...who).allowed, who.join()).toBe(false);
    }
  });
});

describe('7.47 印務不能動別人的工單；檢視層級的分享成員沒有任何修改入口', () => {
  it('非負責印務（周建宏對蔡明修負責的 WO-2026-0907）：沒有建立任務、送審、收回、交付、異動、分享、預覽', () => {
    const reviewing = wo('WO-2026-0907');
    const draft = wo('WO-2026-0907', { status: '草稿' });
    expect(permissions.canEditProcess(draft, ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canSubmitProcess(draft, ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canWithdrawProcess(reviewing, ...OTHER_OFFICER).visible).toBe(false);
    expect(permissions.canDeliverTasks(wo('WO-2026-0910'), ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canAdjustTasks(wo('WO-2026-0907', { status: '製作中' }), ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canManageSharing(reviewing, ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canPreviewWorkOrder(draft, ...OTHER_OFFICER)).toBe(false);
    expect(permissions.workOrderInfoEditGuard(reviewing, ...OTHER_OFFICER).allowed).toBe(false);
    expect(permissions.proofRequirementEditGuard(reviewing, ...OTHER_OFFICER).allowed).toBe(false);
  });

  it('檢視層級成員（蔡明修對 WO-2026-0901）：任何修改入口都沒有', () => {
    const draft = wo('WO-2026-0901');
    expect(draft.shared_members.find((m) => m.name === '蔡明修').level).toBe('view');
    expect(permissions.canEditProcess(draft, ...VIEW_ONLY)).toBe(false);
    expect(permissions.canSubmitProcess(draft, ...VIEW_ONLY)).toBe(false);
    expect(permissions.canPreviewWorkOrder(draft, ...VIEW_ONLY)).toBe(false);
    expect(permissions.canManageSharing(draft, ...VIEW_ONLY)).toBe(false);
    expect(permissions.canAdjustTasks(wo('WO-2026-0901', { status: '製作中' }), ...VIEW_ONLY)).toBe(false);
    expect(permissions.canDeliverTasks(wo('WO-2026-0901', { status: '製程審核完成' }), ...VIEW_ONLY)).toBe(false);
    expect(permissions.workOrderInfoEditGuard(draft, ...VIEW_ONLY).allowed).toBe(false);
    expect(permissions.printItemProcessQcEditGuard([draft], '製作中', ...VIEW_ONLY).allowed).toBe(false);
    expect(permissions.printItemOfficerFilesEditGuard([draft], ...VIEW_ONLY).allowed).toBe(false);
  });
});

describe('8.20 核可製程與異動審核不隨工單編輯權開放；印務主管管理工單分享成員', () => {
  it('編輯分享成員（業務、生管）在製程確認中沒有核可與退回製程', () => {
    const reviewing = wo('WO-2026-0906');
    expect(permissions.canReviewProcess(reviewing, 'print_manager')).toBe(true);
    for (const who of [SALES_EDIT, PLANNER_EDIT]) {
      expect(permissions.canReviewProcess(reviewing, who[0]), who.join()).toBe(false);
    }
    // 負責印務也不是審核者
    expect(permissions.canReviewProcess(reviewing, 'print_officer')).toBe(false);
  });

  it('核可補做異動只給印務主管；確認工單異動只給生管', () => {
    const pendingReview = wo('WO-2026-0906', {
      status: '異動',
      adjustments: [{ id: 'adj-x', type: '補做', needs_review: true, confirmed_by: null }],
    });
    const pendingPlanner = wo('WO-2026-0906', {
      status: '異動',
      adjustments: [{ id: 'adj-y', type: '加開', needs_review: false, confirmed_by: null }],
    });
    expect(permissions.canConfirmAdjustments(pendingReview, 'print_manager')).toBe(true);
    for (const role of ['sales', 'print_officer', 'production_planner']) {
      expect(permissions.canConfirmAdjustments(pendingReview, role), role).toBe(false);
    }
    expect(permissions.canConfirmAdjustmentsAsPlanner(pendingPlanner, 'production_planner')).toBe(true);
    for (const role of ['sales', 'print_officer', 'print_manager']) {
      expect(permissions.canConfirmAdjustmentsAsPlanner(pendingPlanner, role), role).toBe(false);
    }
  });
});

describe('8.21 目的站點與產線：業務被分享（編輯）可改，生管不可；製程核可前印務主管也可改', () => {
  const taskOf = (workOrder) => workOrder.tasks.find((t) => !['已作廢', '報廢'].includes(t.status));

  it('業務陳映蓉是 WO-2026-0906 的編輯分享成員，可改目的站點與產線', () => {
    const w = wo('WO-2026-0906');
    const task = taskOf(w);
    expect(permissions.canEditTaskDestination(w, task, ...SALES_EDIT)).toBe(true);
    expect(permissions.canEditTaskProductionLine(w, task, ...SALES_EDIT)).toBe(true);
  });

  it('生管許文傑不在 WO-2026-0901 的分享成員內，不可改；印務主管製程確認中也可改', () => {
    const draft = wo('WO-2026-0901');
    expect(permissions.canEditTaskDestination(draft, taskOf(draft), 'production_planner', '許文傑')).toBe(false);
    expect(permissions.canEditTaskProductionLine(draft, taskOf(draft), 'production_planner', '許文傑')).toBe(false);
    const reviewing = wo('WO-2026-0907');
    expect(permissions.canEditTaskDestination(reviewing, taskOf(reviewing), ...MANAGER)).toBe(true);
    expect(permissions.canEditTaskProductionLine(reviewing, taskOf(reviewing), ...MANAGER)).toBe(true);
  });

  it('已作廢與報廢的任務任何人都不可改', () => {
    const w = wo('WO-2026-0906');
    for (const status of ['已作廢', '報廢']) {
      expect(permissions.canEditTaskDestination(w, { ...taskOf(w), status }, ...MANAGER)).toBe(false);
      expect(permissions.canEditTaskDestination(w, { ...taskOf(w), status }, ...SALES_EDIT)).toBe(false);
    }
  });
});

describe('8.22 工單單據：預覽與列印的操作者依活動清單', () => {
  it('印務主管預覽（送審前）與列印（製程審核完成後）', () => {
    expect(permissions.canPreviewWorkOrder(wo('WO-2026-0907'), ...MANAGER)).toBe(true);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0908'), ...MANAGER)).toBe(true);
  });

  it('非負責印務不可預覽、不可列印（周建宏對蔡明修負責的 WO-2026-0910）', () => {
    expect(permissions.canPreviewWorkOrder(wo('WO-2026-0907'), ...OTHER_OFFICER)).toBe(false);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0910'), ...OTHER_OFFICER)).toBe(false);
  });

  it('負責印務與編輯分享成員可列印；檢視層級成員與業務、會計不可', () => {
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0908'), 'print_officer', '周建宏')).toBe(true);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0906'), ...SALES_EDIT)).toBe(true);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0901'), ...VIEW_ONLY)).toBe(false);
    for (const who of [['sales', '洪嘉駿'], ['accountant', '陳美玲'], ['qc_inspector', '郭淑芬']]) {
      expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0908'), ...who), who.join()).toBe(false);
    }
  });

  it('生管列印工單單據（全公司，異動確認後重印），不看負責人與分享成員', () => {
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0908'), 'production_planner', '鄭宇翔')).toBe(true);
    expect(permissions.canPrintWorkOrderByRole(wo('WO-2026-0910'), 'production_planner', '許文傑')).toBe(true);
  });
});
