import { describe, expect, it } from 'vitest';
import {
  calcRemainingToShipQty,
  displayDetailsOf,
  displayDetailsTotalQty,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  defaultMethodFromOrder,
  describeSender,
  isThirdPartyMethod,
  SHIPPING_METHOD_OPTIONS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';

// 情境 12.1（清單與側板呈現草稿的預計值）、12.2（出貨印件預設數量、六值出貨方式）、
// 12.6（第三方判定）、12.11（寄件資訊依帳務公司）的數字與取值驗算。

const printItem = { print_item_no: 'PI-2026-0820', ordered_qty: 500 };

const shipmentWith = (id, status, qty) => ({
  id,
  status,
  details: [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty }],
  planned_details: [],
});

const draftWith = (id, qty) => ({
  id,
  status: '草稿',
  details: [],
  planned_details: [
    { print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty },
  ],
});

describe('出貨印件的預設數量（剩餘應出量）', () => {
  it('沒有其他出貨單時等於購買數量', () => {
    expect(calcRemainingToShipQty(printItem, [])).toBe(500);
  });

  it('扣掉其他非終態出貨單已佔用的量', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 200)])).toBe(300);
  });

  it('異常與已作廢的單退出佔用', () => {
    const shipments = [shipmentWith('sh-1', '異常', 200), shipmentWith('sh-2', '已作廢', 100)];
    expect(calcRemainingToShipQty(printItem, shipments)).toBe(500);
  });

  it('草稿的預計數量不算佔用（預計值不是出貨指令）', () => {
    expect(calcRemainingToShipQty(printItem, [draftWith('sh-d1', 500)])).toBe(500);
  });

  it('改某張單時排除本單自身的佔用', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 200)], 'sh-1')).toBe(
      500,
    );
  });

  it('已佔用超過購買數量時夾在 0、不為負', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 600)])).toBe(0);
  });
});

describe('清單與側板要顯示的印件列', () => {
  it('草稿顯示預計出貨印件', () => {
    const draft = draftWith('sh-d1', 500);
    expect(displayDetailsOf(draft)).toHaveLength(1);
    expect(displayDetailsTotalQty(draft)).toBe(500);
  });

  it('成立後的單顯示正式明細', () => {
    const shipment = shipmentWith('sh-1', '未處理', 480);
    expect(displayDetailsOf(shipment)[0].qty).toBe(480);
    expect(displayDetailsTotalQty(shipment)).toBe(480);
  });

  it('還沒填預計出貨印件的草稿合計為 0', () => {
    expect(displayDetailsTotalQty({ status: '草稿', details: [], planned_details: [] })).toBe(0);
  });
});

describe('出貨方式一欄六值', () => {
  it('六個值為自取、專車配送、順豐、新竹物流、超商、其他', () => {
    expect(SHIPPING_METHOD_OPTIONS).toEqual([
      '自取',
      '專車配送',
      '順豐',
      '新竹物流',
      '超商',
      '其他',
    ]);
  });

  it('自取與專車配送是自家人送，不算第三方', () => {
    expect(isThirdPartyMethod('自取')).toBe(false);
    expect(isThirdPartyMethod('專車配送')).toBe(false);
  });

  it('其餘四值交給外部物流商，算第三方', () => {
    expect(isThirdPartyMethod('順豐')).toBe(true);
    expect(isThirdPartyMethod('新竹物流')).toBe(true);
    expect(isThirdPartyMethod('超商')).toBe(true);
    expect(isThirdPartyMethod('其他')).toBe(true);
  });

  it('草稿還沒填出貨方式時不算第三方', () => {
    expect(isThirdPartyMethod(null)).toBe(false);
  });
});

describe('建草稿時的出貨方式預設（訂單三值對六值）', () => {
  it('訂單談自取或專車配送就直接帶入', () => {
    expect(defaultMethodFromOrder('自取')).toBe('自取');
    expect(defaultMethodFromOrder('專車配送')).toBe('專車配送');
  });

  it('訂單只寫第三方物流時留空，由業務選哪一家', () => {
    expect(defaultMethodFromOrder('第三方物流')).toBeNull();
  });

  it('訂單沒填出貨方式時同樣留空', () => {
    expect(defaultMethodFromOrder(null)).toBeNull();
  });
});

describe('寄件資訊依訂單的帳務公司帶出', () => {
  it('SSP 帶出感官文化印刷', () => {
    expect(describeSender('SSP')).toContain('感官文化印刷');
  });

  it('BRO 帶出理想印製', () => {
    expect(describeSender('BRO')).toContain('理想印製');
  });

  it('查無帳務公司時為空值（畫面顯示破折號）', () => {
    expect(describeSender(null)).toBeNull();
  });
});
