## 1. 建立 qc capability

- [x] 1.1 撰寫 `openspec/specs/qc/spec.md`，10 個 Requirement
- [x] 1.2 涵蓋 QCRecord Data Model（於 qc spec 內嵌）
- [x] 1.3 三視角審查（senior-pm / ceo-reviewer / erp-consultant），決策定版 D1-D6

## 2. 修改既有 capability 的 QC 段落

- [x] 2.1 `work-order`：MODIFIED 「QC 單建立」、「QC 執行與結果記錄」改為引用 qc capability
- [x] 2.2 `state-machines`：MODIFIED 「完成度計算」補 `pt_qc_passed` 引用；REMOVED 「QC 單狀態機」
- [x] 2.3 `user-roles`：MODIFIED 「QC 角色編輯限制」明示 QC 單建立權屬印務

## 3. 連帶修改（超出 delta 機制）

- [x] 3.1 `state-machines/spec.md` Purpose 段「涵蓋實體」移除「QC 單」，加「QC 單狀態機已移至 qc capability」說明（archive 後手動同步）
- [x] 3.2 `work-order/spec.md` § Data Model QCRecord / QCDetail 段改為引用 + 移除 QCDetail（archive 後手動同步）
- [x] 3.3 `user-roles/spec.md` 前段 QC 角色限制描述補「不建立 QC 單」（archive 後手動同步）
- [x] 3.4 `CLAUDE.md` § Spec 規格檔清單新增 QC 模組（master 已完成）
- [x] 3.5 `CLAUDE.md` § 載入原則新增 QC 設計類型（master 已完成）

## 4. 封存驗證

- [ ] 4.1 `openspec validate qc-spec-consolidation`
- [ ] 4.2 archive → delta 合併至 main specs
- [ ] 4.3 手動同步連帶修改（§ 3.1 / 3.2 / 3.3）

## 5. 後續追蹤（非本 change 範圍）

- [ ] 5.1 Prototype 對齊：QCRecord 欄位 rename、通過/不通過雙欄位 UI、QC 人員選擇、可申請餘額提示
- [ ] 5.2 Notion BRD 推送：新增 QC 頁面、同步四個 main spec 發布版本
- [ ] 5.3 建立五筆待新增 OQ：QC 撤銷、rework chain、通知機制、多工序聯檢、報工語意治理
