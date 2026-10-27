// 出貨單、裝箱資料、物流單三層的測試樣本工廠（第十二章單元測試共用，不是測試檔）。
// 對齊後端第一版（Miles 2026-10-27 拍板）：
// ・物流單於確認可出貨時產生，沒有物流單編號：內部識別 id 串接裝箱資料，畫面以我方自編單號（own_order_no）
//   與物流單號（tracking_no）識別。樣本的 id 與我方自編單號取同一個值，測試好讀。
// ・物流單狀態拆成兩欄：拋單狀態（dispatch_status，只有第三方物流：未拋單、拋單中、拋單成功、拋單失敗、已取消）
//   與貨態（cargo_status：待出貨、已出貨、可自取、運送中、已送達、已自取、例外三態、已作廢）。
// ・出貨單確認可出貨之後的狀態由物流單計算（已確認、待出貨、已出貨、運送中、異常、已送達），
//   所以測試要的狀態一律用物流單搭出來，不直接寫出貨單狀態。
// ・物流單是否離廠一律看貨態（已離廠＝已出貨、可自取、運送中、例外三態、已送達、已自取），沒有離廠時間欄。
import { isThirdPartyMethod } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';

/**
 * 一筆物流單。cargo 為貨態；拋單狀態預設未拋單（packedShipment 會把非第三方物流的拋單狀態清成 null）。
 */
export const logistics = (id, cargo = '待出貨', extra = {}) => ({
  id,
  own_order_no: id,
  tracking_no: null,
  dispatch_status: '未拋單',
  dispatch_error: null,
  cargo_status: cargo,
  label_file: null,
  delivered_at: null,
  delivered_by: null,
  exception_reason: null,
  exception_source: null,
  void_reason: null,
  void_at: null,
  undelivered: [],
  ...extra,
});

/** 剛由確認可出貨產生、還沒做出貨動作的物流單（貨態待出貨；第三方物流為未拋單） */
export const undispatched = (id, extra = {}) => logistics(id, '待出貨', extra);

/** 第三方物流已拋單成功、物流商還沒收件的物流單（貨態仍待出貨） */
export const dispatched = (id, extra = {}) =>
  logistics(id, '待出貨', { dispatch_status: '拋單成功', tracking_no: `T-${id}`, ...extra });

/**
 * 出貨動作之後的物流單：是否離廠由貨態決定，不另帶時間欄。第三方物流一律已拋單成功
 *（非第三方物流由 packedShipment 清成 null）。
 */
export const departed = (id, cargo, extra = {}) =>
  logistics(id, cargo, { dispatch_status: '拋單成功', ...extra });

// 預設箱規取箱規主檔的「1 號箱」（45×30×15，所有出貨方式共用）
export const box = (boxNo, logisticsId, extra = {}) => ({
  box_no: boxNo,
  box_spec: '1 號箱',
  length: 45,
  width: 30,
  height: 15,
  photos: ['裝箱照.jpg'],
  note: '',
  logistics_id: logisticsId,
  sub_tracking_no: null,
  ...extra,
});

// 收件資訊預設值：收件電話只有一欄、填手機，地址四欄齊全（各出貨方式的確認可出貨都過得了收件電話檢查）
const RECEIVER = {
  receiver_name: '樣本收件人',
  receiver_phone: '0912-345-678',
  receiver_zip: '110',
  receiver_city: '台北市',
  receiver_district: '信義區',
  receiver_address: '樣本路 1 號',
};

// 非第三方物流（自取、專車配送、其他）的物流單沒有拋單狀態
const normalizeDispatch = (method, list) =>
  isThirdPartyMethod(method) ? list : list.map((l) => ({ ...l, dispatch_status: null }));

/**
 * 一張已確認可出貨的出貨單。logisticsOrders 為物流單陣列；沒給 boxes 時每筆物流單配一箱。
 * 單頭 status 記「已確認」（實際狀態問 shipmentStatusOf，由物流單計算）。
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
} = {}) => {
  const list = normalizeDispatch(method, logisticsOrders);
  return {
    id,
    shipment_no: shipmentNo,
    order_no: orderNo,
    client_name: '樣本客戶',
    status: '已確認',
    method,
    ...RECEIVER,
    details: [{ print_item_no: printItemNo, name, qty, picked_qty: qty }],
    planned_details: [],
    packing_boxes: boxes ?? list.map((l, i) => box(String(i + 1).padStart(3, '0'), l.id)),
    box_seq: (boxes ?? list).length,
    logistics_seq: list.length,
    logistics_orders: list,
    packing_corrections: [],
    history: [],
    ...rest,
  };
};

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
    ...RECEIVER,
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
