// 出貨單、裝箱資料、物流單三層的測試樣本工廠（第十二章單元測試共用，不是測試檔）。
// 物流單於確認可出貨時產生，初始狀態為「可出貨」；出貨單可出貨之後的狀態由物流單計算，
// 所以測試要的狀態一律用物流單的狀態搭出來，不直接寫出貨單狀態。
// 物流單是否離廠一律看物流單狀態（已離廠＝已出貨、可自取、運送中、例外三態、已送達、已自取），
// 物流單上沒有離廠時間欄，出貨單上也沒有實際出貨日欄。

/** 一筆物流單 */
export const logistics = (no, status = '可出貨', extra = {}) => ({
  logistics_order_no: no,
  status,
  tracking_no: null,
  label_file: null,
  delivered_at: null,
  delivered_by: null,
  exception_reason: null,
  exception_source: null,
  void_reason: null,
  void_at: null,
  undelivered: [],
  history: [],
  ...extra,
});

/** 一筆剛由確認可出貨產生、還沒做出貨動作的物流單 */
export const shippable = (no, extra = {}) => logistics(no, '可出貨', extra);

/**
 * 出貨動作之後的物流單（語意別名，與 logistics 相同）：是否離廠由狀態決定，不另帶時間欄。
 * 保留這個名字只為讓測試讀得出「這筆已經送出去」的意圖。
 */
export const departed = (no, status, extra = {}) => logistics(no, status, extra);

// 預設箱規取箱規主檔的「1 號箱」（45×30×15，所有出貨方式共用）
export const box = (boxNo, logisticsNo, extra = {}) => ({
  box_no: boxNo,
  box_spec: '1 號箱',
  length: 45,
  width: 30,
  height: 15,
  photos: ['裝箱照.jpg'],
  note: '',
  logistics_order_no: logisticsNo,
  sub_tracking_no: null,
  ...extra,
});

/**
 * 一張已確認可出貨的出貨單。logisticsOrders 為物流單陣列；沒給 boxes 時每筆物流單配一箱。
 * 單頭 status 記「可出貨」（實際狀態問 shipmentStatusOf，由物流單計算）。
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
  status: '可出貨',
  method,
  details: [{ print_item_no: printItemNo, name, qty, picked_qty: qty }],
  planned_details: [],
  packing_boxes:
    boxes ?? logisticsOrders.map((l, i) => box(String(i + 1).padStart(3, '0'), l.logistics_order_no)),
  box_seq: (boxes ?? logisticsOrders).length,
  logistics_seq: logisticsOrders.length,
  logistics_orders: logisticsOrders,
  packing_corrections: [],
  history: [],
  ...rest,
});

/**
 * 一張已裝箱、尚未確認可出貨的出貨單：有裝箱回報（揀貨數量與箱），沒有物流單，每箱的所屬物流單為空。
 * boxCount 為箱數；picked 預設等於 qty（揀貨相符）。
 */
export const boxedShipment = ({
  id = 'sh-1',
  shipmentNo = 'SH-TEST-0001',
  orderNo = 'ORD-TEST',
  method = '順豐',
  qty = 100,
  picked,
  printItemNo = 'PI-TEST',
  name = '測試印件',
  boxCount = 1,
  boxes,
  ...rest
} = {}) => {
  const list =
    boxes ?? Array.from({ length: boxCount }, (_, i) => box(String(i + 1).padStart(3, '0'), null));
  return {
    id,
    shipment_no: shipmentNo,
    order_no: orderNo,
    client_name: '樣本客戶',
    status: '已裝箱',
    method,
    details: [{ print_item_no: printItemNo, name, qty, picked_qty: picked ?? qty }],
    planned_details: [],
    packing_boxes: list,
    box_seq: list.length,
    logistics_seq: 0,
    logistics_orders: [],
    packing_corrections: [],
    history: [],
    ...rest,
  };
};
