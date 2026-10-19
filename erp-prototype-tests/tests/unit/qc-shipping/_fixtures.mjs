// 出貨單、裝箱資料、物流單三層的測試樣本工廠（第十二章單元測試共用，不是測試檔）。
// 出貨單已裝箱之後的狀態由物流單計算，所以測試要的狀態一律用物流單的狀態搭出來，
// 不直接寫出貨單狀態（單上只記草稿、未處理、打包中、已裝箱標記、已作廢）。

/** 一筆物流單；left 為 true 時帶離廠時間（出貨動作之後的物流單都有） */
export const logistics = (no, status, extra = {}) => ({
  logistics_order_no: no,
  status,
  tracking_no: null,
  label_file: null,
  dispatch_error: null,
  dispatch_attempts: 0,
  left_at: null,
  left_by: null,
  delivered_at: null,
  delivered_by: null,
  delivery_proof: null,
  exception_reason: null,
  exception_source: null,
  void_reason: null,
  void_at: null,
  undelivered: [],
  history: [],
  ...extra,
});

/** 已離廠的物流單（有離廠時間，出貨動作已執行過） */
export const departed = (no, status, extra = {}) =>
  logistics(no, status, {
    left_at: '2026-10-01 10:00',
    left_by: '曾志偉',
    dispatch_attempts: 1,
    ...extra,
  });

export const box = (boxNo, logisticsNo, extra = {}) => ({
  box_no: boxNo,
  box_spec: 'A 箱（60×40×40）',
  photos: ['裝箱照.jpg'],
  note: '',
  logistics_order_no: logisticsNo,
  sub_tracking_no: null,
  ...extra,
});

/**
 * 一張已裝箱之後的出貨單。logisticsOrders 為物流單陣列；沒給 boxes 時每筆物流單配一箱。
 * 出貨單單頭的 status 只記「已裝箱」標記，實際狀態問 shipmentStatusOf。
 */
export const packedShipment = ({
  id = 'sh-1',
  shipmentNo = 'SH-TEST-0001',
  orderNo = 'ORD-TEST',
  method = '順豐',
  qty = 100,
  printItemNo = 'PI-TEST',
  name = '測試印件',
  logisticsOrders,
  boxes,
  ...rest
} = {}) => ({
  id,
  shipment_no: shipmentNo,
  order_no: orderNo,
  client_name: '樣本客戶',
  status: '已裝箱',
  method,
  details: [{ print_item_no: printItemNo, name, qty, picked_qty: qty, per_box_qty: 50 }],
  planned_details: [],
  packing_boxes:
    boxes ?? logisticsOrders.map((l, i) => box(String(i + 1).padStart(3, '0'), l.logistics_order_no)),
  box_seq: (boxes ?? logisticsOrders).length,
  logistics_orders: logisticsOrders,
  packing_corrections: [],
  history: [],
  ...rest,
});
