import { describe, it, expect } from 'vitest';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import {
  PREPRESS_REVIEWERS,
  reviewerNameById,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/prepressReview.js';
import { ROLES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

// 15.6 審稿人員一律是名單上實際存在的人（原編號 183）
// 起點資料：鏈一、鏈二、鏈三的印件 PI-2026-0601、PI-2026-0710、PI-2026-0815。
// 三張印件的負責審稿人員與活動紀錄的審稿事件，一律顯示同一位審稿人員（魏彣軒），
// 不出現不在角色名單中的人名。
describe('15.6 審稿人員一律是名單上實際存在的人', () => {
  const REVIEWER_NAME = '魏彣軒';
  const CHAIN_PRINT_ITEM_IDS = ['pi-2026-0601', 'pi-2026-0710', 'pi-2026-0815'];

  it('魏彣軒同時是審稿人員角色名單與印務評估審稿人員名單上實際存在的人', () => {
    expect(ROLES.some((r) => r.label === '審稿人員' && r.user_name === REVIEWER_NAME)).toBe(true);
    expect(PREPRESS_REVIEWERS.some((r) => r.name === REVIEWER_NAME)).toBe(true);
  });

  it('鏈一、鏈二、鏈三印件的審稿輪次負責審稿人員皆為魏彣軒', () => {
    const orders = MOCK_ORDERS.filter((o) =>
      (o.print_items ?? []).some((pi) => CHAIN_PRINT_ITEM_IDS.includes(pi.id)),
    );
    expect(orders.length).toBeGreaterThan(0);

    const checkedItems = [];
    orders.forEach((order) => {
      order.print_items
        .filter((pi) => CHAIN_PRINT_ITEM_IDS.includes(pi.id))
        .forEach((pi) => {
          expect(pi.review_rounds.length).toBeGreaterThan(0);
          pi.review_rounds.forEach((round) => {
            const name = reviewerNameById(round.reviewer_id);
            expect(name, `${pi.id} 第 ${round.round_no} 輪審稿人員不在名單上`).toBe(REVIEWER_NAME);
          });
          checkedItems.push(pi.id);
        });
    });
    expect(checkedItems.sort()).toEqual([...CHAIN_PRINT_ITEM_IDS].sort());
  });

  it('三張印件所屬訂單的活動紀錄「審稿合格」事件的操作人皆為魏彣軒，不出現名單外的人名', () => {
    const rolesNames = new Set(ROLES.map((r) => r.user_name));
    const orders = MOCK_ORDERS.filter((o) =>
      (o.print_items ?? []).some((pi) => CHAIN_PRINT_ITEM_IDS.includes(pi.id)),
    );
    expect(orders.length).toBeGreaterThan(0);
    orders.forEach((order) => {
      const reviewLogs = (order.activities ?? []).filter((log) => log.action === '審稿合格');
      expect(reviewLogs.length).toBeGreaterThan(0);
      reviewLogs.forEach((log) => {
        expect(rolesNames.has(log.actor), `${log.actor} 不在角色名單上`).toBe(true);
        expect(log.actor).toBe(REVIEWER_NAME);
      });
    });
  });
});
