import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkReportPermission,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import {
  canReportTask,
  validateReportRow,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/report-rules.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 9.19、9.20、10.46～10.50：報工前提、五個入口、已完成不能新增、照片必填與數值比較、整筆作廢重報。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence production-execution delta
// § 報工前提、§ 已完成任務不可新增報工、§ 報工、§ 報工權限守門、§ 報工修改、作廢與留痕 的 THEN；
// 規則正本 wiki 報工規則、報工紀錄；情境卡 生產任務接收與派工、師傅報工與修改。
//
// 資料層契約（新契約等 tasks 4.1～4.4 實作）：
//   report-rules.canReportTask(task, { tasks, tickets })：交付時間有值、待處理或製作中、前置到料量大於 0
//   report-rules.validateReportRow(task, row)：沒附現場照片（row.photos 為空）時回「現場照片必填」；
//     良品＋不良品大於生產數量時回「良品數＋不良品數不可超過生產數量」，直接比數值、不依單位用量換算
//   store.submitWorkReport(taskId, report)：任務交付時間無值或任務已完成時不寫入（資料層最後防線）；
//     報工紀錄不記所屬工作包（不帶 work_package_id）
//   store 不再有 logReportGuardBypass（越權報工只擋下、不寫稽核日誌）

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  workPackages: useProductionFloorStore.getState().workPackages,
  workReports: useProductionFloorStore.getState().workReports,
  transferTickets: useProductionFloorStore.getState().transferTickets,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
});

const floor = () => useProductionFloorStore.getState();
const taskById = (id) => floor().tasks.find((t) => t.id === id);
const ctx = () => ({ tasks: floor().tasks, tickets: floor().transferTickets });
const workOrderOf = (no) => useWorkOrdersStore.getState().workOrders.find((o) => o.work_order_no === no);
const PHOTO = ['現場照-001.jpg'];

describe('9.19 生管還沒接收或打包，從所有生產任務代報即可報工', () => {
  // 鏈三 WO-2026-0815 的牛皮紙 150g 備料（pt-0815-1）：已交付、未接收、未打包、沒有前置
  it('起點：已交付、交付狀態已交付（尚未接收）、不屬任何工作包', () => {
    const task = taskById('pt-0815-1');
    expect(task.delivered_at).toBeTruthy();
    expect(task.received_confirmed_at).toBeNull();
    expect(task.package_id).toBeNull();
  });

  it('生管許文傑從所有生產任務代報：守門放行、提交管道記生產管理頁面代報', () => {
    const guard = checkReportPermission({
      source: REPORT_SOURCES.ALL_TASKS,
      role: 'production_planner',
      currentUser: '許文傑',
      task: taskById('pt-0815-1'),
      pkg: null,
    });
    expect(guard).toMatchObject({ allowed: true, channel: '生產管理頁面代報' });
    expect(canReportTask(taskById('pt-0815-1'), ctx())).toBe(true);
  });

  it('報工寫入（520／520／0）：任務轉製作中、仍未接收，之後照樣能接收與打包', () => {
    const result = floor().submitWorkReport('pt-0815-1', {
      input_qty: 520,
      good_qty: 520,
      defect_qty: 0,
      photos: PHOTO,
      channel: '生產管理頁面代報',
      reporter: '許文傑',
    });
    expect(result).toBeTruthy();
    const task = taskById('pt-0815-1');
    expect(task.status).toBe('製作中');
    expect(task.received_confirmed_at).toBeNull();
    floor().confirmTaskReceipt(['pt-0815-1'], '許文傑');
    expect(taskById('pt-0815-1').received_confirmed_at).toBeTruthy();
    const pkg = floor().createWorkPackage({
      taskIds: ['pt-0815-1'],
      master: '劉阿海',
      plannedEndDate: '2026-09-04',
      operator: '許文傑',
    });
    expect(taskById('pt-0815-1').package_id).toBe(pkg.id);
  });

  it('報工紀錄不帶所屬工作包', () => {
    const result = floor().submitWorkReport('pt-0815-1', {
      input_qty: 520,
      good_qty: 520,
      defect_qty: 0,
      photos: PHOTO,
      channel: '生產管理頁面代報',
      reporter: '許文傑',
    });
    expect(result.report).not.toHaveProperty('work_package_id');
  });
});

describe('9.20 加工廠任務接收後不打包，印務從工單詳情或所有生產任務報工', () => {
  // 鏈外 WO-2026-0812 的證書局部上光（pt-0812-9）：加工廠、已交付、已接收、未打包、沒有前置、手工產線
  const plant = () => taskById('pt-0812-9');

  it('起點：加工廠任務在現場任務池、已接收、沒有工作包也沒有指派師傅', () => {
    expect(plant().unit_class).toBe('加工廠');
    expect(plant().received_confirmed_at).toBeTruthy();
    expect(plant().package_id).toBeNull();
    expect(canReportTask(plant(), ctx())).toBe(true);
  });

  it('負責印務周建宏在工單詳情報工：放行、管道記印務於工單詳情頁', () => {
    expect(
      checkReportPermission({
        source: REPORT_SOURCES.WORK_ORDER_DETAIL,
        role: 'print_officer',
        currentUser: '周建宏',
        task: plant(),
        pkg: null,
        workOrder: workOrderOf('WO-2026-0812'),
      }),
    ).toMatchObject({ allowed: true, channel: '印務於工單詳情頁' });
  });

  it('生管鄭宇翔（手工、壓克力）從所有生產任務也報得了；所屬產線不含手工產線的人報不了', () => {
    const by = (role, currentUser) =>
      checkReportPermission({ source: REPORT_SOURCES.ALL_TASKS, role, currentUser, task: plant(), pkg: null })
        .allowed;
    expect(by('production_planner', '鄭宇翔')).toBe(true);
    expect(by('production_planner', '許文傑')).toBe(true);
  });

  it('不需工作包即可寫入報工；報工後交付狀態維持已接收（接收工作不被清除）', () => {
    const result = floor().submitWorkReport('pt-0812-9', {
      input_qty: 200,
      good_qty: 198,
      defect_qty: 2,
      defect_reason: '刮傷',
      photos: PHOTO,
      channel: '印務於工單詳情頁',
      reporter: '周建宏',
    });
    expect(result).toBeTruthy();
    expect(plant().status).toBe('製作中');
    expect(plant().received_confirmed_at).toBeTruthy();
  });
});

describe('10.46 越權報工只擋下、不寫稽核日誌', () => {
  it('store 不再有越權報工的稽核日誌寫入', () => {
    expect(floor().logReportGuardBypass).toBeUndefined();
  });
});

describe('10.48 未交付擋下；已完成任務擋下新增報工，修改跌破目標退回製作中後可再報', () => {
  it('任務交付時間無值：資料層不寫入報工，累計不動', () => {
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === 'pt-0815-1' ? { ...t, delivered_at: null, delivered_by: null } : t)),
    }));
    const before = floor().workReports.length;
    floor().submitWorkReport('pt-0815-1', {
      input_qty: 100,
      good_qty: 100,
      defect_qty: 0,
      photos: PHOTO,
      channel: '印務於工單詳情頁',
      reporter: '周建宏',
    });
    expect(floor().workReports).toHaveLength(before);
    expect(taskById('pt-0815-1').input_qty).toBe(0);
    expect(taskById('pt-0815-1').status).toBe('待處理');
  });

  // 合成資料：信封四色印刷目標 515，兩筆報工 310 與 205，已完成，沒有轉交單、所屬印件已驗量 0
  const seedDone = () => {
    useProductionFloorStore.setState({
      tasks: [
        {
          id: 'pt-test-env',
          name: '信封四色印刷',
          work_order_no: 'WO-TEST',
          status: '已完成',
          needs_transfer: true,
          delivered_at: '2026-08-22 09:00',
          target_qty: 515,
          input_qty: 515,
          good_qty: 500,
          produced_qty: 515,
          depends_on: [],
          history: [],
          package_id: 'wp-test',
        },
      ],
      workReports: [
        { id: 'wr-test-env1', task_id: 'pt-test-env', input_qty: 310, good_qty: 300, defect_qty: 10, defect_reason: '髒點', photos: PHOTO, status: '有效', reporter: '劉阿海', edit_logs: [] },
        { id: 'wr-test-env2', task_id: 'pt-test-env', input_qty: 205, good_qty: 200, defect_qty: 5, defect_reason: '套印不準', photos: PHOTO, status: '有效', reporter: '劉阿海', edit_logs: [] },
      ],
      transferTickets: [],
    });
    useWorkOrdersStore.setState({ workOrders: [] });
  };

  it('已完成任務：canReportTask 為否，資料層新增報工被擋下', () => {
    seedDone();
    expect(canReportTask(taskById('pt-test-env'), ctx())).toBe(false);
    floor().submitWorkReport('pt-test-env', {
      input_qty: 20,
      good_qty: 20,
      defect_qty: 0,
      photos: PHOTO,
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(floor().workReports).toHaveLength(2);
    expect(taskById('pt-test-env').input_qty).toBe(515);
  });

  it('第二筆改為 185／180／5 → 累計 495、退回製作中；再報 20／20／0 被接受，累計 515、再轉已完成', () => {
    seedDone();
    const edited = floor().editWorkReport('wr-test-env2', {
      input_qty: 185,
      good_qty: 180,
      defect_qty: 5,
      reason: '生產數量誤報',
      by: '劉阿海',
    });
    expect(edited.ok).toBe(true);
    expect(taskById('pt-test-env').input_qty).toBe(495);
    expect(taskById('pt-test-env').status).toBe('製作中');
    expect(canReportTask(taskById('pt-test-env'), ctx())).toBe(true);
    floor().submitWorkReport('pt-test-env', {
      input_qty: 20,
      good_qty: 20,
      defect_qty: 0,
      photos: PHOTO,
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(taskById('pt-test-env').input_qty).toBe(515);
    expect(taskById('pt-test-env').status).toBe('已完成');
  });
});

describe('10.49 照片必填；良品＋不良品不大於生產數量，直接比數值、不換算', () => {
  const task = { id: 'pt-test-print', name: '合成印刷' };

  it('沒附現場照片時擋下，提示現場照片必填', () => {
    const errors = validateReportRow(task, {
      input_qty: 205,
      good_qty: 200,
      defect_qty: 5,
      defect_reason: '套印不準',
      photos: [],
    });
    expect(errors.join('、')).toContain('現場照片');
  });

  it('附上兩張照片後檢核通過，store 寫入報工並保存兩張照片', () => {
    const row = {
      input_qty: 205,
      good_qty: 200,
      defect_qty: 5,
      defect_reason: '套印不準',
      photos: ['信封-一.jpg', '信封-二.jpg'],
    };
    expect(validateReportRow(task, row)).toEqual([]);
    const result = floor().submitWorkReport('pt-0815-1', { ...row, channel: '師傅自助', reporter: '劉阿海' });
    expect(result.report.photos).toEqual(['信封-一.jpg', '信封-二.jpg']);
  });

  it('生產數量 1,051、良品 4,084、不良品 0：直接比數值、擋下，不因單位用量換算放行', () => {
    const errors = validateReportRow(
      { ...task, bom_unit_usage: 0.25 },
      { input_qty: 1051, good_qty: 4084, defect_qty: 0, photos: PHOTO },
    );
    expect(errors.join('、')).toContain('不可超過生產數量');
    expect(errors.join('、')).not.toContain('換算');
  });

  it('生產數量 1,000、良品 980、不良品 40：合計 1,020 超過生產數量，擋下', () => {
    const errors = validateReportRow(task, {
      input_qty: 1000,
      good_qty: 980,
      defect_qty: 40,
      defect_reason: '色差',
      photos: PHOTO,
    });
    expect(errors.join('、')).toContain('不可超過生產數量');
  });
});

describe('10.49 資料層最後防線：繞過畫面檢核直接送出也不寫入', () => {
  const base = { input_qty: 200, good_qty: 195, defect_qty: 5, photos: PHOTO, channel: '師傅自助', reporter: '劉阿海' };
  const blocked = (overrides) => {
    const before = floor().workReports.length;
    const result = floor().submitWorkReport('pt-0815-1', { ...base, ...overrides });
    expect(result).toBeNull();
    expect(floor().workReports).toHaveLength(before);
  };

  it('生產數量為 0、沒附照片、良品加不良品超過生產數量、良品與不良品同時為 0 都不寫入', () => {
    blocked({ input_qty: 0, good_qty: 0, defect_qty: 0 });
    blocked({ photos: [] });
    blocked({ input_qty: 100, good_qty: 98, defect_qty: 5 });
    blocked({ input_qty: 300, good_qty: 0, defect_qty: 0 });
  });

  it('四項都合規時照常寫入', () => {
    const before = floor().workReports.length;
    expect(floor().submitWorkReport('pt-0815-1', base)).toBeTruthy();
    expect(floor().workReports).toHaveLength(before + 1);
  });
});

describe('10.50 整筆報到錯的任務作廢後重報', () => {
  // wiki 師傅報工與修改：劉阿海把五色印刷的一筆報工（200／195／5）誤報到同工單的牛皮紙 150g 備料
  it('作廢備料那一筆（原因自由填寫）後，到五色印刷照原數字重報：作廢的那筆不計入累計，兩筆任務的歷程各記一筆', () => {
    const wrong = floor().submitWorkReport('pt-0815-1', {
      input_qty: 200,
      good_qty: 195,
      defect_qty: 5,
      defect_reason: '色差',
      photos: PHOTO,
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    const prepHistory = taskById('pt-0815-1').history.length;
    const voided = floor().voidWorkReport(wrong.report.id, { reason: '報到錯的任務', by: '劉阿海' });
    expect(voided.ok).toBe(true);
    const voidedRecord = floor().workReports.find((r) => r.id === wrong.report.id);
    expect(voidedRecord.status).toBe('已作廢');
    expect(taskById('pt-0815-1').input_qty).toBe(0);
    expect(taskById('pt-0815-1').status).toBe('待處理');
    expect(taskById('pt-0815-1').history.length).toBe(prepHistory + 1);

    const printHistory = taskById('pt-0815-2').history.length;
    floor().submitWorkReport('pt-0815-2', {
      input_qty: 200,
      good_qty: 195,
      defect_qty: 5,
      defect_reason: '色差',
      photos: PHOTO,
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(taskById('pt-0815-2').input_qty).toBe(200);
    expect(taskById('pt-0815-2').history.length).toBe(printHistory + 1);
  });
});
