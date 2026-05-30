# Tasks — 業務主管改派負責業務

> Prototype 路徑：`/Users/b-f-03-029/sens-erp-prototype/src/`。實作於 `/opsx:apply` 階段執行。
> 進度（2026-05-30）：資料層 / UI 三入口 / 閘門 / 權限 / 核心 e2e 完成並 push（prototype commits 6d55f59 / 903e307 / 20657f7，111 e2e 全綠）。

## 1. 資料層（型別 + store）

- [x] 1.1 ActivityLog 新增改派事件 + 五要素（design D1）— 訂單 ActivityLog 加 optional `detail` 欄承載；三單據改派寫 action='改派負責業務/負責人' + detail（原→新/理由/操作主管 user）
- [x] 1.2 `reassign_reason_category` LOV 五值 + `reassign_note`（design D1）— `src/types/reassign.ts`
- [x] 1.3 store `reassignOwner` action：三單據統一（更新 owner + ActivityLog + sharedMembers 依分類 + Slack mock 通知；改派不改狀態 design D2）
- [x] 1.4 候選新負責人篩選（design D4）— `getReassignCandidates` 業務線 Role（REASSIGN_CANDIDATE_ROLES）+ 排除原負責人
- [x] 1.5 售後負責人衍生自訂單 salesPerson（design D3）— 改派訂單 salesPerson 即連帶轉移售後歸屬（售後無獨立負責人欄位，衍生達成）

## 2. UI 層（共用 Dialog + 三單據入口）

- [x] 2.1 共用 `ReassignOwnerDialog`（選新負責人 + 必選 reason_category + 選填 note + 防呆）
- [x] 2.2 OrderDetail 業務負責人 row 業務主管視角「改派」入口
- [x] 2.3 QuoteDetailPage ErpPageHeader 業務主管「改派負責業務」按鈕
- [x] 2.4 ConsultationRequestDetail「改派負責人」按鈕（consultantId 有值顯改派、為空顯認領，互斥）

## 3. 狀態 / 邊界閘門

- [x] 3.1 終態禁改派 disabled：訂單已取消 / 需求單成交·流失 / 諮詢單完成·已取消
- [x] 3.2 訂單完成狀態例外允許改派（售後繼承，design D3）
- [x] 3.3 電商訂單無 salesPerson 時 disabled + Tooltip

## 4. 權限收斂

- [x] 4.1 改派入口全程限業務主管（currentUser.role === 'sales_manager'）
- [x] 4.2 業務「轉單」收斂為「僅分享」：業務 / 諮詢視角無改派入口（e2e 5.2 訂單已驗）

## 5. e2e 驗證（Playwright；`e2e/reassign-owner.spec.ts` 5 case 通過、repeat 2 次無 flaky）

- [x] 5.1 訂單改派 Dialog 流程 + 成功 toast + 無 console error
- [~] 5.2 角色權限：訂單業務主管有入口 / 業務無（done）；**需求單角色斷言待補**
- [~] 5.3 邊界：完成訂單可改派（D3，done）；**已取消 / 電商 disabled / 需求單成交·流失 / 諮詢單完成·取消 disabled 待補**
- [ ] 5.4 reason_category 驅動：離職清空 sharedMembers + 不通知原；其餘保留 + 通知（待補）
- [x] 5.5 諮詢單認領 / 改派互斥（已認領顯改派、未認領顯認領）

## 6. Spec / wiki 對齊（archive 階段）

- [ ] 6.1 archive 時 sync 5 delta 至 main spec（user-roles / order-management / quote-request / consultation-request / state-machines），確認 3 個 MODIFIED exact-title 匹配
- [ ] 6.2 確認 after-sales-ticket spec 是否需補「售後負責人衍生自訂單負責人」delta（design Open Questions）
- [ ] 6.3 archive 後回補 wiki 商業邏輯卡（doc-audit）：[[訂單]]/[[需求單]]/[[諮詢單]] 實體卡 + [[業務]]/[[業務主管]]/[[諮詢]] 角色卡 + 03-roles _alignment-report（業務轉單收斂）
- [ ] 6.4 更新 OQ：XM-008 / CR-4 標 answered（oq-manage mode C）；AFT-1 補本 change 涵蓋前段三單據售後歸屬
