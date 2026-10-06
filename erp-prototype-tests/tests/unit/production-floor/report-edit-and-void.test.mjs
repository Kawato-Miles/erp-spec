import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import * as transferRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.34～10.37：報工修改、修改與作廢共用擋下條件、已完成任務的修改與作廢、報廢任務的報工修改。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence
// production-execution delta § 報工修改、作廢與留痕、§ 已完成任務不可新增報工、§ 生產任務狀態轉換 的 THEN。
// 2026-10-06 改版：拿掉人工程序與人工註記提示（擋下只指出卡在哪一筆，之後走逐層更正，見 10.56）；
// 已完成任務可作廢報工、不能新增報工；修改原因自由填寫，不驗固定字樣。
//
// 本檔先於實作撰寫（tasks 2.6），報工修改的契約由 task 6.4 補上：
//   store.editWorkReport(reportId, { input_qty?, good_qty?, defect_qty?, reason, by })
//     → { ok, error? }；只開放生產數量、良品數、不良品數三欄，修改原因必填；
//     成立時每改一欄在該筆報工 edit_logs 追加一筆
//     { field: '生產數量'｜'良品數'｜'不良品數', before, after, edited_by, edited_at, reason }，
//     生產任務歷程追加一筆「報工修改（原因）」，前後值 changes 列良品數 500 → 480，並以 ref 關聯該筆報工。
//   修改與作廢共用擋下條件；擋下訊息列出佔用的單據與提示（未送達的單「先作廢尚未送達的單」、
//   已送達的單「先照實點收」），不帶人工程序與人工註記。

const { deriveTransferStatus } = transferRules;

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workReports: useProductionFloorStore.getState().workReports,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;
const printItemsInitial = {
  printItems: usePrintItemsStore.getState().printItems,
  qcRecords: usePrintItemsStore.getState().qcRecords,
};

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
  usePrintItemsStore.setState(printItemsInitial);
});

const floor = () => useProductionFloorStore.getState();
const taskById = (id) => floor().tasks.find((t) => t.id === id);
const reportById = (id) => floor().workReports.find((r) => r.id === id);

// 合成資料：一筆生產任務、它的報工、轉交單與下游任務一次寫入現場任務池（不掛工單，已驗量檢核不介入）
const seed = ({ task, reports, tickets = [], extraTasks = [] }) => {
  useProductionFloorStore.setState({
    tasks: [
      {
        work_order_no: 'WO-TEST',
        // 已交付（交付時間有值）：報工前提，未交付的任務不收新報工（10.48）
        delivered_at: '2026-10-01 09:00',
        depends_on: [],
        history: [],
        package_id: 'wp-test',
        ...task,
      },
      ...extraTasks,
    ],
    workReports: reports.map((r) => ({
      task_id: task.id,
      defect_qty: 0,
      status: '有效',
      reporter: '劉阿海',
      void_reason: null,
      voided_by: null,
      voided_at: null,
      edit_logs: [],
      ...r,
    })),
    transferTickets: tickets,
  });
  useWorkOrdersStore.setState({ workOrders: [] });
};

// 擋下時「列出佔用的單據」：單號寫在訊息裡或隨結果帶出 tickets 都算列出
const listedTickets = (result) =>
  [result.error ?? '', ...(result.tickets ?? []).map((t) => t.ticket_no)].join('、');

const receivedTicket = (taskId, qty) => ({
  id: 'tt-test-recv',
  ticket_no: 'TT-TEST-RECV',
  status: '已點收',
  destination_line: '手工產線',
  details: [
    {
      task_id: taskId,
      task_name: '合成印刷',
      destination_station_key: '裁切站',
      qty,
      sign_photos: ['合成照.jpg'],
      receipts: [
        { id: 'tt-test-recv-r1', qty, received_by: '李榮發', received_at: '2026-10-05 10:00', remark: '', status: '有效' },
      ],
    },
  ],
  history: [],
});

describe('10.34 報工修改三欄可改、原因必填、留修改紀錄、調升不擋', () => {
  // 鏈外 WO-2026-0812 證書四色印刷那筆報工 wr-0018（投入 515、良品 500、不良 15；TT-20260827-001 已點收 480）
  it('未填修改原因時擋下送出，數字不變', () => {
    const result = floor().editWorkReport('wr-0018', { good_qty: 480, reason: '', by: '周建宏' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('修改原因');
    expect(reportById('wr-0018').good_qty).toBe(500);
    expect(reportById('wr-0018').edit_logs).toHaveLength(0);
  });

  it('良品改為 480 成立（不低於已點收 480、不低於已驗量 0），留修改紀錄並記入任務歷程', () => {
    const result = floor().editWorkReport('wr-0018', {
      good_qty: 480,
      reason: '現場清點後更正',
      by: '周建宏',
    });
    expect(result.ok).toBe(true);
    const report = reportById('wr-0018');
    expect(report.good_qty).toBe(480);
    expect(report.input_qty).toBe(515);
    expect(report.defect_qty).toBe(15);
    expect(report.status).toBe('有效');
    expect(report.edit_logs).toHaveLength(1);
    expect(report.edit_logs[0]).toMatchObject({
      field: '良品數',
      before: 500,
      after: 480,
      edited_by: '周建宏',
      reason: '現場清點後更正',
    });
    expect(report.edit_logs[0].edited_at).toBeTruthy();

    const task = taskById('pt-0812-2');
    expect(task.good_qty).toBe(480);
    const last = task.history.at(-1);
    // 歷程每筆比照報工紀錄列格式：事件一句、前後值逐欄列出（Miles 2026-10-06 拍板）
    expect(last.event).toContain('報工修改（現場清點後更正）');
    expect(last.changes).toContainEqual({ field: '良品數', before: 500, after: 480 });
    expect(last.ref).toBe('wr-0018');
    expect(last.actor).toBe('周建宏');
  });

  it('改回 500 屬調升、不被擋，修改紀錄再新增一筆', () => {
    floor().editWorkReport('wr-0018', { good_qty: 480, reason: '現場清點後更正', by: '周建宏' });
    const result = floor().editWorkReport('wr-0018', {
      good_qty: 500,
      reason: '貨已找回',
      by: '周建宏',
    });
    expect(result.ok).toBe(true);
    const report = reportById('wr-0018');
    expect(report.good_qty).toBe(500);
    expect(report.edit_logs).toHaveLength(2);
    expect(report.edit_logs[1]).toMatchObject({ field: '良品數', before: 480, after: 500 });
  });

  it('修改只動生產數量、良品數、不良品數三欄，其餘欄位帶了也不改', () => {
    floor().editWorkReport('wr-0018', {
      good_qty: 480,
      reporter: '別人',
      defect_reason: '其他',
      reason: '現場清點後更正',
      by: '周建宏',
    });
    const report = reportById('wr-0018');
    expect(report.reporter).toBe('劉阿海');
    expect(report.defect_reason).toBe(floorInitial.workReports.find((r) => r.id === 'wr-0018').defect_reason);
  });
});

describe('10.34（2026-10-06 補）修改把良品改記為不良品、生產數量不變、修改原因自由填寫', () => {
  // 合成資料：一筆需轉交的生產任務只有一筆報工 200／200／0，沒有任何轉交單、下游未動工、未被品檢驗過
  const seedLoss = () =>
    seed({
      task: { id: 'pt-test-loss', name: '合成印刷', status: '製作中', needs_transfer: true, target_qty: 1000, input_qty: 200, good_qty: 200, produced_qty: 200 },
      reports: [{ id: 'wr-test-loss', input_qty: 200, good_qty: 200, defect_qty: 0 }],
    });

  it('良品 200 改 0、不良品 0 改 200：修改成立，生產數量維持 200，修改紀錄各記一筆', () => {
    seedLoss();
    const result = floor().editWorkReport('wr-test-loss', {
      good_qty: 0,
      defect_qty: 200,
      reason: '這一批整批不能用',
      by: '周建宏',
    });
    expect(result.ok).toBe(true);
    const report = reportById('wr-test-loss');
    expect([report.input_qty, report.good_qty, report.defect_qty]).toEqual([200, 0, 200]);
    expect(report.edit_logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: '良品數', before: 200, after: 0, reason: '這一批整批不能用' }),
        expect.objectContaining({ field: '不良品數', before: 0, after: 200, reason: '這一批整批不能用' }),
      ]),
    );
    const task = taskById('pt-test-loss');
    expect(task.input_qty).toBe(200);
    expect(task.good_qty).toBe(0);
  });

  it('只把良品改為 0、不良品維持 0：擋下（良品數與不良品數不可同時為 0），數字不變', () => {
    seedLoss();
    const result = floor().editWorkReport('wr-test-loss', { good_qty: 0, reason: '這一批整批不能用', by: '周建宏' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不可同時為 0');
    expect(reportById('wr-test-loss').good_qty).toBe(200);
  });
});

describe('10.35 報工修改與作廢共用擋下條件：在途與已點收量、下游已動工、已驗量', () => {
  it('海報四色印刷第二筆報工良品改為 900：改後 1,890 低於在途與已送達的 1,990，擋下並列出兩張單與各自提示', () => {
    // 鏈二 PT-0710-2（良品 1,990：TT-20260830-002 已送達 1,190、TT-20260830-003 搬運中 800）
    const result = floor().editWorkReport('wr-0006', { good_qty: 900, reason: '誤報', by: '周建宏' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('TT-20260830-003');
    expect(result.error).toContain('先作廢尚未送達的單');
    expect(result.error).toContain('TT-20260830-002');
    expect(result.error).toContain('先照實點收');
    // 擋下只指出卡在哪一筆，不再帶人工程序與人工註記（之後由下往上逐層更正，見 10.56）
    expect(result.error).not.toContain('人工註記');
    expect(result.error).not.toContain('工單異動加開');
    expect(reportById('wr-0006').good_qty).toBe(1000);
    expect(taskById('pt-0710-2').good_qty).toBe(1990);
  });

  it('信封四色印刷那筆報工作廢：作廢後良品 0 低於已送達的 300，擋下並列出 TT-20260827-002、提示先照實點收', () => {
    const result = floor().voidWorkReport('wr-0019', { reason: '誤報', by: '劉阿海' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('TT-20260827-002');
    expect(result.error).toContain('先照實點收');
    expect(reportById('wr-0019').status).toBe('有效');
  });

  it('需轉交、量已被點收帶走：製作中、良品 300 其中 200 已點收，作廢一筆良品 150 被擋，列出已點收的單號', () => {
    seed({
      task: { id: 'pt-test-a', name: '合成印刷', status: '製作中', needs_transfer: true, target_qty: 1000, input_qty: 300, good_qty: 300, produced_qty: 300 },
      reports: [
        { id: 'wr-test-a1', input_qty: 150, good_qty: 150 },
        { id: 'wr-test-a2', input_qty: 150, good_qty: 150 },
      ],
      tickets: [receivedTicket('pt-test-a', 200)],
    });
    const result = floor().voidWorkReport('wr-test-a2', { reason: '誤報', by: '劉阿海' });
    expect(result.ok).toBe(false);
    expect(listedTickets(result)).toContain('TT-TEST-RECV');
    expect(floor().rollbackTransferTicket).toBeUndefined();
  });

  it('需轉交、量已被點收帶走時，把良品調降到已點收量以下的修改同樣被擋', () => {
    seed({
      task: { id: 'pt-test-a', name: '合成印刷', status: '製作中', needs_transfer: true, target_qty: 1000, input_qty: 300, good_qty: 300, produced_qty: 300 },
      reports: [
        { id: 'wr-test-a1', input_qty: 150, good_qty: 150 },
        { id: 'wr-test-a2', input_qty: 150, good_qty: 150 },
      ],
      tickets: [receivedTicket('pt-test-a', 200)],
    });
    // 良品改 0、改記為不良品 150（生產數量大於 0 時良品與不良品不可同時為 0，見 10.48）
    const result = floor().editWorkReport('wr-test-a2', {
      good_qty: 0,
      defect_qty: 150,
      reason: '誤報',
      by: '周建宏',
    });
    expect(result.ok).toBe(false);
    expect(listedTickets(result)).toContain('TT-TEST-RECV');
    expect(taskById('pt-test-a').good_qty).toBe(300);
  });

  const notTransferSeed = ({ downstreamStarted }) => {
    const downstream = {
      id: 'pt-test-down',
      name: '合成裁切',
      work_order_no: 'WO-TEST',
      status: downstreamStarted ? '製作中' : '待處理',
      depends_on: ['pt-test-up'],
      input_qty: downstreamStarted ? 100 : 0,
      good_qty: downstreamStarted ? 100 : 0,
      produced_qty: downstreamStarted ? 100 : 0,
      history: [],
    };
    seed({
      task: { id: 'pt-test-up', name: '合成軋盒', status: '製作中', needs_transfer: false, target_qty: 1000, input_qty: 520, good_qty: 500, produced_qty: 520 },
      reports: [{ id: 'wr-test-up', input_qty: 520, good_qty: 500, defect_qty: 20 }],
      extraTasks: [downstream],
    });
    if (downstreamStarted) {
      useProductionFloorStore.setState((s) => ({
        workReports: [
          ...s.workReports,
          {
            id: 'wr-test-down',
            task_id: 'pt-test-down',
            input_qty: 100,
            good_qty: 100,
            defect_qty: 0,
            status: '有效',
            reporter: '李榮發',
            edit_logs: [],
          },
        ],
      }));
    }
  };

  it('不需轉交、下游未動工：作廢成立，生產數量、良品數、不良品數各減 520、500、20，紀錄列已作廢並留作廢人、時間、原因', () => {
    notTransferSeed({ downstreamStarted: false });
    const result = floor().voidWorkReport('wr-test-up', { reason: '誤報', by: '劉阿海' });
    expect(result.ok).toBe(true);
    const task = taskById('pt-test-up');
    expect(task.input_qty).toBe(0);
    expect(task.good_qty).toBe(0);
    // 產出數量＝良品＋不良品，不良品減 20 一併落在這一欄
    expect(task.produced_qty).toBe(0);
    const report = reportById('wr-test-up');
    expect(report.status).toBe('已作廢');
    expect(report.voided_by).toBe('劉阿海');
    expect(report.voided_at).toBeTruthy();
    expect(report.void_reason).toBe('誤報');
  });

  it('不需轉交、下游已動工：作廢與調降都被擋，列出已動工的下游任務', () => {
    notTransferSeed({ downstreamStarted: true });
    const voided = floor().voidWorkReport('wr-test-up', { reason: '誤報', by: '劉阿海' });
    expect(voided.ok).toBe(false);
    expect(voided.error).toContain('合成裁切');
    const edited = floor().editWorkReport('wr-test-up', { good_qty: 450, reason: '誤報', by: '周建宏' });
    expect(edited.ok).toBe(false);
    expect(edited.error).toContain('合成裁切');
    expect(taskById('pt-test-up').good_qty).toBe(500);
  });

  it('無佔用的報工作廢：200／190／10 作廢成立，生產數量、良品數、產出數量各減 200、190、200', () => {
    seed({
      task: { id: 'pt-test-free', name: '合成印刷', status: '製作中', needs_transfer: true, target_qty: 1000, input_qty: 500, good_qty: 480, produced_qty: 500 },
      reports: [
        { id: 'wr-test-free1', input_qty: 300, good_qty: 290, defect_qty: 10 },
        { id: 'wr-test-free2', input_qty: 200, good_qty: 190, defect_qty: 10 },
      ],
    });
    expect(floor().voidWorkReport('wr-test-free2', { reason: '誤報', by: '劉阿海' }).ok).toBe(true);
    const task = taskById('pt-test-free');
    expect(task.input_qty).toBe(300);
    expect(task.good_qty).toBe(290);
    expect(task.produced_qty).toBe(300);
    expect(reportById('wr-test-free2').status).toBe('已作廢');
  });

  it('唯一一筆報工作廢：任務退回待處理、仍屬原工作包，不需重新派工', () => {
    seed({
      task: { id: 'pt-test-only', name: '合成印刷', status: '製作中', needs_transfer: true, target_qty: 1000, input_qty: 200, good_qty: 190, produced_qty: 200 },
      reports: [{ id: 'wr-test-only', input_qty: 200, good_qty: 190, defect_qty: 10 }],
    });
    expect(floor().voidWorkReport('wr-test-only', { reason: '誤報', by: '劉阿海' }).ok).toBe(true);
    const task = taskById('pt-test-only');
    expect(task.status).toBe('待處理');
    expect(task.package_id).toBe('wp-test');
  });
});

describe('10.36 已完成任務可修改與作廢報工；跌破目標退回製作中；已完成任務不能新增報工', () => {
  it('證書四色印刷（已完成）那筆報工：作廢不因任務已完成擋下，而是被 TT-20260827-001 已點收的 480 擋下；修改仍可用', () => {
    const voided = floor().voidWorkReport('wr-0018', { reason: '整筆不該存在', by: '周建宏' });
    expect(voided.ok).toBe(false);
    expect(voided.error).toContain('TT-20260827-001');
    expect(voided.error).not.toContain('已完成');
    const edited = floor().editWorkReport('wr-0018', { good_qty: 480, defect_qty: 35, reason: '現場清點後更正', by: '周建宏' });
    expect(edited.ok).toBe(true);
  });

  it('已完成任務新增報工被擋下：證書四色印刷再報生產數量 20 不寫入，累計維持 515', () => {
    const before = floor().workReports.length;
    floor().submitWorkReport('pt-0812-2', {
      input_qty: 20,
      good_qty: 20,
      defect_qty: 0,
      photos: ['補報.jpg'],
      channel: '印務於工單詳情頁',
      reporter: '周建宏',
    });
    expect(floor().workReports).toHaveLength(before);
    const task = taskById('pt-0812-2');
    expect(task.input_qty).toBe(515);
    expect(task.status).toBe('已完成');
  });

  it('已完成任務沒有被佔用時可作廢報工：目標 515、兩筆 310 與 205，作廢 205 那一筆 → 累計 310、退回製作中、之後可新增報工', () => {
    seed({
      task: { id: 'pt-test-done', name: '合成信封印刷', status: '已完成', needs_transfer: true, target_qty: 515, input_qty: 515, good_qty: 500, produced_qty: 515 },
      reports: [
        { id: 'wr-test-done1', input_qty: 310, good_qty: 300, defect_qty: 10 },
        { id: 'wr-test-done2', input_qty: 205, good_qty: 200, defect_qty: 5 },
      ],
    });
    const voided = floor().voidWorkReport('wr-test-done2', { reason: '整筆不該存在', by: '許文傑' });
    expect(voided.ok).toBe(true);
    const task = taskById('pt-test-done');
    expect(task.input_qty).toBe(310);
    expect(task.status).toBe('製作中');
    const before = floor().workReports.length;
    floor().submitWorkReport('pt-test-done', {
      input_qty: 205,
      good_qty: 200,
      defect_qty: 5,
      photos: ['重報.jpg'],
      channel: '生產管理頁面代報',
      reporter: '許文傑',
    });
    expect(floor().workReports).toHaveLength(before + 1);
    expect(taskById('pt-test-done').status).toBe('已完成');
  });

  it('純函式：裁切任務目標 1,020、累計 1,020 已完成，一筆生產數量 300 改為 280 → 累計 1,000、退回製作中、仍屬原工作包；再報工 20 → 已完成', () => {
    seed({
      task: { id: 'pt-test-cut', name: '合成裁切', status: '已完成', needs_transfer: false, target_qty: 1020, input_qty: 1020, good_qty: 980, produced_qty: 980 },
      reports: [
        { id: 'wr-test-cut1', input_qty: 300, good_qty: 280 },
        { id: 'wr-test-cut2', input_qty: 720, good_qty: 700 },
      ],
    });
    const edited = floor().editWorkReport('wr-test-cut1', {
      input_qty: 280,
      reason: '生產數量誤報',
      by: '周建宏',
    });
    expect(edited.ok).toBe(true);
    let task = taskById('pt-test-cut');
    expect(task.input_qty).toBe(1000);
    expect(task.status).toBe('製作中');
    expect(task.package_id).toBe('wp-test');
    expect(reportById('wr-test-cut1').edit_logs[0]).toMatchObject({ field: '生產數量', before: 300, after: 280 });

    floor().submitWorkReport('pt-test-cut', {
      input_qty: 20,
      good_qty: 20,
      defect_qty: 0,
      photos: ['補量.jpg'],
      channel: '生產管理頁面代報',
      reporter: '許文傑',
    });
    task = taskById('pt-test-cut');
    expect(task.input_qty).toBe(1020);
    expect(task.status).toBe('已完成');
  });
});

describe('10.37 已報廢任務的報工照同一組條件判定、任務狀態不變', () => {
  it('報廢任務的報工良品 300 改為 280：修改成立、任務維持報廢、轉交狀態顯示「－」', () => {
    seed({
      task: { id: 'pt-test-scrap', name: '合成印刷', status: '報廢', needs_transfer: true, target_qty: 1000, input_qty: 310, good_qty: 300, produced_qty: 310 },
      reports: [{ id: 'wr-test-scrap', input_qty: 310, good_qty: 300, defect_qty: 10 }],
    });
    const result = floor().editWorkReport('wr-test-scrap', { good_qty: 280, reason: '重點數量', by: '周建宏' });
    expect(result.ok).toBe(true);
    const task = taskById('pt-test-scrap');
    expect(task.good_qty).toBe(280);
    expect(task.status).toBe('報廢');
    expect(deriveTransferStatus(task, floor().transferTickets)).toBe('－');
  });
});
