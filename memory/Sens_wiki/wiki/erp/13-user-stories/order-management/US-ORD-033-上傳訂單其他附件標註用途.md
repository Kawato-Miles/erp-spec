---
type: user-story
us-id: US-ORD-033
module:
  - 訂單管理
role:
  - "[[業務]]"
priority: medium
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § 訂單其他附件上傳
  - openspec/changes/relax-order-detail-edit-conditions/proposal.md § What Changes
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-test-cases: []
---

# US-ORD-033 上傳訂單其他附件並標註用途

## 業務情境

### 作為
[[業務]]

### 我希望
在訂單詳情頁上傳合約、規格說明書、客戶聲明、補充說明等非回簽用途的其他文件，並於上傳時標註該檔案的用途說明。

### 以便
能將過往散落在電子郵件附件、Slack 對話、Google Drive 個人雲端的客戶文件集中保存於訂單下，便於後續查找與交接，並透過用途說明快速識別檔案內容（如「合約掃描」「客戶聲明」「補充規格說明」），不需打開檔案才知道用途。

### 前置條件
- 訂單已建立並未取消
- 業務為該訂單負責業務、或諮詢、或訂單管理人
- 業務有檔案需要上傳並能描述該檔案的用途

### 業務流程

1. 業務於訂單詳情頁的檔案區進入其他附件區
2. 業務選擇要上傳的檔案並填寫該檔案用途說明（例：合約掃描、規格說明書、客戶聲明書）
3. 業務確認上傳
4. 系統建立附件紀錄（含檔名、用途、上傳者、上傳時間）並寫入訂單活動紀錄
5. 系統將該附件加入訂單其他附件清單，依上傳時間倒序顯示
6. 業務或其他授權角色日後可從該清單下載檢視

### 成功條件（acceptance criteria）

1. 用途說明欄位為必填，業務未填寫時系統阻擋上傳並提示
2. 用途說明長度上限 200 字，超過時系統自動截斷或提示
3. 附件清單依上傳時間倒序顯示，每筆顯示檔名、用途、上傳者、上傳時間、下載連結
4. 已取消訂單不可再上傳新附件，但既有附件仍可下載檢視
5. 其他附件與回簽檔案分區顯示，上傳新附件不會觸發訂單狀態自動推進

## 來源（provenance）

- openspec/changes/relax-order-detail-edit-conditions/specs/order-management/spec.md § Requirement「訂單其他附件上傳」+ ADDED Data Model「OrderAttachment」
- openspec/changes/relax-order-detail-edit-conditions/proposal.md § What Changes（議題 2 拍板：統一清單 + 用途 free-text）
- openspec/changes/relax-order-detail-edit-conditions/design.md § D4 OrderAttachment 實體設計
