// 側欄入口依檢視活動清單（menu-model）、人員名冊只有一份（people-roster）、介面字串不含權限名稱。
// 對應情境目錄 2.20、2.26（側欄入口）、14.41、14.42（分享候選、用詞）、1.29（需求單入口）。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ROOT } from '../../../config.mjs';
import { ROLES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';
import {
  ROSTER,
  adminUsers,
  shareCandidateNames,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/people-roster.js';
import {
  defaultPathOf,
  visibleMenuGroups,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/menu-model.js';

const groupsOf = (role) => visibleMenuGroups(role).map((g) => g.name);
const labelsOf = (role) => visibleMenuGroups(role).flatMap((g) => g.children.map((c) => c.label));

describe('15.15 人員名冊只有一份：模擬角色的每一位都在名冊上，角色一致', () => {
  it('ROLES 每位人員在 ROSTER 有同角色同姓名的一列', () => {
    for (const r of ROLES) {
      expect(ROSTER.some((p) => p.role === r.value && p.name === r.user_name), `${r.label} ${r.user_name}`).toBe(true);
    }
  });

  it('名冊的「角色＋姓名」不重複', () => {
    const keys = ROSTER.map((p) => `${p.role}:${p.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('需求單管理員名冊的角色標示對齊模擬角色：林雅婷是業務主管、黃聖雯是訂單管理人，不再是印務主管', () => {
    const users = adminUsers();
    const roleOf = (name) => users.find((u) => u.name === name)?.role;
    expect(roleOf('林雅婷')).toBe('業務主管');
    expect(roleOf('黃聖雯')).toBe('訂單管理人');
    expect(roleOf('吳國豪')).toBe('印務主管');
    expect(roleOf('王大明')).toBe('Supervisor');
    // 既有 id 不動
    expect(users.find((u) => u.name === '洪嘉駿').id).toBe('AU-001');
    expect(users.find((u) => u.name === '吳國豪').id).toBe('AU-009');
  });

  it('分享候選人員：需求單、訂單、工單各自的角色範圍', () => {
    const order = shareCandidateNames('order');
    expect(order).toEqual(expect.arrayContaining(['陳映蓉', '蘇怡君', '林雅婷', '黃聖雯', '吳國豪', '周建宏', '魏彣軒', '王大明']));
    expect(order).not.toContain('陳美玲');
    expect(order).not.toContain('許文傑');
    const wo = shareCandidateNames('workOrder');
    expect(wo).toEqual(expect.arrayContaining(['陳映蓉', '許文傑', '鄭宇翔', '黃聖雯', '王大明', '吳國豪', '周建宏']));
    expect(wo).not.toContain('陳美玲');
    const quote = shareCandidateNames('quote');
    expect(quote).toEqual(expect.arrayContaining(['蘇怡君', '林雅婷', '吳國豪', '王大明']));
    expect(quote).not.toContain('黃聖雯');
    expect(quote).not.toContain('周建宏');
  });
});

describe('2.20、2.26、1.29 側欄入口依檢視活動清單', () => {
  it('會計沒有訂單管理群組，款項管理有四張清單；預設頁是待開發票', () => {
    expect(groupsOf('accountant')).not.toContain('訂單管理');
    expect(labelsOf('accountant')).toEqual(expect.arrayContaining(['待開發票', '應收款項', '待退款', '帳務異常']));
    expect(defaultPathOf('accountant')).toBe('/payment/pending-invoice');
  });

  it('印務主管、印務、審稿主管有訂單列表', () => {
    for (const role of ['print_manager', 'print_officer', 'reviewer_supervisor', 'order_manager', 'sales_manager', 'supervisor']) {
      expect(labelsOf(role), role).toContain('訂單列表');
    }
  });

  it('審稿人員、生管、師傅、廠務、品檢人員、揀貨與出貨人員沒有訂單列表', () => {
    for (const role of ['reviewer', 'production_planner', 'master', 'facility_staff', 'qc_inspector', 'picker', 'shipper']) {
      expect(labelsOf(role), role).not.toContain('訂單列表');
    }
  });

  it('需求單入口：業務、諮詢、業務主管、印務主管、Supervisor 有；其他角色沒有', () => {
    for (const role of ['sales', 'consultant', 'sales_manager', 'print_manager', 'supervisor']) {
      expect(labelsOf(role), role).toContain('需求單列表');
    }
    for (const role of ['accountant', 'order_manager', 'print_officer', 'reviewer', 'production_planner', 'master']) {
      expect(labelsOf(role), role).not.toContain('需求單列表');
    }
  });

  it('出貨管理：生管、品檢人員沒有；印務、印務主管、業務主管、揀貨、出貨人員有', () => {
    for (const role of ['production_planner', 'qc_inspector']) expect(labelsOf(role), role).not.toContain('出貨管理');
    for (const role of ['print_officer', 'print_manager', 'sales_manager', 'picker', 'shipper', 'sales', 'supervisor']) {
      expect(labelsOf(role), role).toContain('出貨管理');
    }
  });

  it('審稿管理：審稿人員、訂單管理人、審稿主管、印務主管、印務、Supervisor 有；業務與諮詢沒有（wiki 未定義他們的入口）', () => {
    for (const role of ['reviewer', 'order_manager', 'reviewer_supervisor', 'print_manager', 'print_officer', 'supervisor']) {
      expect(labelsOf(role), role).toContain('待審訂單');
    }
    for (const role of ['sales', 'consultant']) expect(labelsOf(role), role).not.toContain('待審訂單');
  });

  it('工單列表：印務、印務主管、生管、訂單管理人、Supervisor 有；業務與諮詢沒有', () => {
    for (const role of ['print_officer', 'print_manager', 'production_planner', 'order_manager', 'supervisor']) {
      expect(labelsOf(role), role).toContain('工單列表');
    }
    for (const role of ['sales', 'consultant', 'accountant']) expect(labelsOf(role), role).not.toContain('工單列表');
  });

  it('待辦佇列頁各只給持有核心操作的角色', () => {
    expect(labelsOf('sales_manager')).toEqual(expect.arrayContaining(['訂單審核', '訂單異動審核']));
    expect(labelsOf('order_manager')).toEqual(expect.arrayContaining(['待確認製作細節', '待分派審稿']));
    expect(labelsOf('print_manager')).toEqual(expect.arrayContaining(['待分派印件', '待審核工單']));
    expect(labelsOf('sales')).not.toContain('訂單審核');
    expect(labelsOf('reviewer_supervisor')).toContain('待分派審稿');
  });

  it('售後服務入口：全公司看到「售後服務」，只看自己負責與被分享的看到「我的售後服務」；會計與 Supervisor 也有', () => {
    expect(labelsOf('sales')).toContain('我的售後服務');
    expect(labelsOf('sales_manager')).toContain('售後服務');
    expect(labelsOf('accountant')).toContain('售後服務');
    expect(labelsOf('supervisor')).toContain('售後服務');
    expect(labelsOf('production_planner')).not.toContain('售後服務');
  });

  it('預設頁面：每個角色都落在自己選單的第一個頁面', () => {
    expect(defaultPathOf('sales')).toBe('/quote-prototype');
    expect(defaultPathOf('production_planner')).toBe('/work-orders');
    expect(defaultPathOf('master')).toBe('/production-floor/dispatch/mine');
    expect(defaultPathOf('reviewer')).toBe('/prepress-review');
  });
});

// 14.42 介面不顯示權限名稱：掃 (prototype)/ 的原始碼，使用者看得到的字串（非註解、非權限表資料欄）不含權限名稱
describe('14.42 介面字串不含權限名稱', () => {
  const PERMISSION_NAME = /管理(生產任務|工作包|待轉交任務|轉交單|點收佇列)（/;
  const jsFiles = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (name === '__checks__' || name === 'node_modules') return [];
      return statSync(full).isDirectory() ? jsFiles(full) : full.endsWith('.js') ? [full] : [];
    });

  it('原始碼中帶權限名稱的行只有註解或權限表的 permission 欄', () => {
    const offenders = [];
    for (const file of jsFiles(PROTOTYPE_ROOT)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (!PERMISSION_NAME.test(line)) return;
          const t = line.trim();
          if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || /^permission:/.test(t)) return;
          offenders.push(`${path.relative(PROTOTYPE_ROOT, file)}:${i + 1} ${t.slice(0, 60)}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
