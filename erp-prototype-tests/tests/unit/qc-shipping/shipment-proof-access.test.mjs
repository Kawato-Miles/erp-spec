// 情境目錄 12.31（單據權責修正第七批）：已送達的出貨單補附送達憑證，只給出貨人員（ACT-SHP-025），各出貨方式皆可，
// 補附只補憑證、不改狀態，歷程記補附人與時間。功能本體在 12.25 已落地；本節把「誰可以」對齊活動表，並補上接單業務看不到入口的斷言。
// 依據：出貨活動清單（ACT-SHP-025）、出貨單（OP-SHP-015、送達確認欄）、受控清單 § 訂單關聯單據的編輯權。
// 畫面操作在 tests/e2e/12-shipping/access-scope.spec.mjs（12.31）。
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ROLE_WIKI_NAME,
  activitiesOfOp,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/access-control.js';
import { attachDeliveryProofOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';

const METHODS = ['專車配送', '自取', '新竹物流'];
const delivered = (method) => ({ status: '已送達', method });

describe('12.31 補附送達憑證的操作者與活動表一致', () => {
  it('活動表只有一列：出貨人員、全公司', () => {
    const rows = activitiesOfOp('OP-SHP-015');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('ACT-SHP-025');
    expect(rows[0].roles).toEqual(['出貨人員']);
    expect(rows[0].scope).toBe('全公司');
  });

  it('每個角色逐一比對：活動表列出的角色可以，其餘全部角色（含接單業務與六個協助角色）不可', () => {
    const allowedNames = activitiesOfOp('OP-SHP-015').flatMap((r) => r.roles);
    for (const [role, wikiName] of Object.entries(ROLE_WIKI_NAME)) {
      for (const method of METHODS) {
        expect(
          attachDeliveryProofOf({ role, shipment: delivered(method) }).allowed,
          `${wikiName}／${method}`,
        ).toBe(allowedNames.includes(wikiName));
      }
    }
  });

  it('憑證名稱依出貨方式：專車司機交付照、自取現場點交照、第三方物流送達照片', () => {
    expect(attachDeliveryProofOf({ role: 'shipper', shipment: delivered('專車配送') }).proofLabel).toBe('司機交付照');
    expect(attachDeliveryProofOf({ role: 'shipper', shipment: delivered('自取') }).proofLabel).toBe('現場點交照');
    expect(attachDeliveryProofOf({ role: 'shipper', shipment: delivered('新竹物流') }).proofLabel).toBe('送達照片');
  });
});

describe('12.31 補附後的歷程記補附人與時間，狀態不變', () => {
  const byId = (id) => useQcShippingStore.getState().shipments.find((sh) => sh.id === id);
  beforeEach(() => {
    useQcShippingStore.setState({
      shipments: [
        {
          id: 'van',
          shipment_no: 'SH-TEST-VAN',
          order_no: 'ORD-TEST-PROOF',
          status: '已送達',
          method: '專車配送',
          details: [],
          planned_details: [],
          history: [],
          delivery_proof: null,
          delivered_at: '2026-10-01 09:00',
          delivered_by: '曾志偉',
        },
      ],
    });
  });

  it('補附一張簽收照片：憑證存下、狀態維持已送達、歷程多一筆帶補附人與時間', () => {
    const result = useQcShippingStore
      .getState()
      .attachDeliveryProof('van', { operator: '曾志偉', proof: { name: '簽收照片.jpg', url: null } });
    expect(result.ok).toBe(true);
    const sh = byId('van');
    expect(sh.status).toBe('已送達');
    expect(sh.delivery_proof).toEqual({ name: '簽收照片.jpg', url: null });
    const event = sh.history[sh.history.length - 1] ?? sh.history[0];
    expect(event.event).toBe('補附送達憑證');
    expect(event.actor).toBe('曾志偉');
    expect(event.at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('沒有附照片不寫入任何東西', () => {
    const result = useQcShippingStore.getState().attachDeliveryProof('van', { operator: '曾志偉', proof: null });
    expect(result.ok).toBe(false);
    expect(byId('van').history).toEqual([]);
  });
});
