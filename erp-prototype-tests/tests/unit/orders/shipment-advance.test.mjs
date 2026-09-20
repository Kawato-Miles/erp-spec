import { beforeEach, describe, expect, it } from 'vitest';
import {
  isPrintItemDelivered,
  useOrdersStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.13（先做完的那一批可以先出）與 12.8 補充（殘留的草稿不卡收尾）的判定驗算。
// 合成資料的理由：現行 mock 的鏈四訂單與印件都已在製作完成，構造不出「兩者皆製作中」的起點；
// 一張訂單底下兩件印件各走各的，mock 上也沒有現成樣本。

const ORDER_NO = 'ORD-TEST-ADVANCE';

const seedOrder = ({ orderStatus, itemStatus }) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-advance',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: orderStatus,
        account_company: 'SSP',
        activities: [],
        print_items: [
          {
            id: 'pi-a',
            print_item_no: 'PI-TEST-A',
            name: '甲印件',
            print_item_status: itemStatus,
            ordered_qty: 500,
            unit_price: 10,
          },
          {
            id: 'pi-b',
            print_item_no: 'PI-TEST-B',
            name: '乙印件',
            print_item_status: itemStatus,
            ordered_qty: 300,
            unit_price: 10,
          },
        ],
      },
    ],
  });
};

const orderNow = () => useOrdersStore.getState().orders[0];
const itemStatusOf = (printItemNo) =>
  orderNow().print_items.find((p) => p.print_item_no === printItemNo).print_item_status;

describe('12.13 首張出貨單成立時，製作中的印件與訂單都推得動出貨中', () => {
  beforeEach(() => {
    seedOrder({ orderStatus: '製作中', itemStatus: '製作中' });
  });

  it('單上那一件印件與訂單自製作中轉出貨中', () => {
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(result.shippingNames).toEqual(['甲印件']);
    expect(result.orderAdvanced).toBe(true);
    expect(itemStatusOf('PI-TEST-A')).toBe('出貨中');
    expect(orderNow().status).toBe('出貨中');
  });

  it('不在這張單上的第二件印件維持製作中', () => {
    useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(itemStatusOf('PI-TEST-B')).toBe('製作中');
  });

  it('第二張單成立時兩邊都已在出貨中，前態守衛讓它推不動任何東西', () => {
    useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    const second = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(second.shippingNames).toEqual([]);
    expect(second.orderAdvanced).toBe(false);
  });

  it('製作完成的那一側照樣推得動（兩個前態並列，不是二選一）', () => {
    seedOrder({ orderStatus: '製作完成', itemStatus: '製作完成' });
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-B']);
    expect(result.orderAdvanced).toBe(true);
    expect(itemStatusOf('PI-TEST-B')).toBe('出貨中');
    expect(itemStatusOf('PI-TEST-A')).toBe('製作完成');
  });

  it('已送達的印件不會被新成立的單拉回（印製維度沒有回退弧）', () => {
    seedOrder({ orderStatus: '出貨中', itemStatus: '已送達' });
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(result.shippingNames).toEqual([]);
    expect(itemStatusOf('PI-TEST-A')).toBe('已送達');
  });
});

// ── 12.8 補充：殘留的草稿不卡印件與訂單收尾 ──

const printItem = { print_item_no: 'PI-TEST-A', ordered_qty: 500 };

const deliveredShipment = {
  id: 'sh-done',
  status: '已送達',
  details: [{ print_item_no: 'PI-TEST-A', name: '甲印件', qty: 500 }],
  planned_details: [],
};

// 草稿的印件列存在預計出貨印件、正式明細為空：收尾判定只認正式明細
const draftShipment = {
  id: 'sh-draft',
  status: '草稿',
  details: [],
  planned_details: [{ print_item_no: 'PI-TEST-A', name: '甲印件', qty: 500 }],
};

describe('12.8 補充 沒清掉的草稿不擋印件收尾', () => {
  it('唯一一張正式的單已送達且累計送達達到購買數量時成立', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment])).toBe(true);
  });

  it('同一件印件上另掛一張草稿時判定不變', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment, draftShipment])).toBe(true);
  });

  it('只有一張草稿、沒有任何正式的單時不成立（貨根本還沒出）', () => {
    expect(isPrintItemDelivered(printItem, [draftShipment])).toBe(false);
  });
});
