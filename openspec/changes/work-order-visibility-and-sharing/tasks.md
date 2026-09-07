# 任務清單

> 實作範圍：erp repo `/Users/b-f-03-029/erp` apps/erp/src/app/(prototype)/，MUST 經 skill `prototype-from-prompt`；只動 (prototype)/ 目錄。

## 1. 資料與權限

- [ ] 1.1 mock 工單補 `shared_members: []`（`{ name, level }`），WO-2026-0901 預置蔡明修（檢視）
- [ ] 1.2 store 新增 addSharedMember／updateSharedMemberLevel／removeSharedMember
- [ ] 1.3 permissions.js 新增 isEditorOf、canManageSharing、canSeeWorkOrderInList；八支把關改用 isEditorOf；停用理由不揭露姓名

## 2. 列表與詳情

- [ ] 2.1 工單列表套 canSeeWorkOrderInList
- [ ] 2.2 工單詳情新增「分享（n）」頁籤（兩層級，管理限 canManageSharing）
- [ ] 2.3 印件列表套旗下工單可見過濾；印件詳情與展開列不過濾
- [ ] 2.4 印件詳情與工單詳情報工入口改 isEditorOf 口徑

## 3. 改派

- [ ] 3.1 AssignWorkOrdersDialog 改派時必選五類理由分類＋選填補述
- [ ] 3.2 store assignWorkOrder：離職交接清空 shared_members；異動內容文字含理由分類與清空人數

## 4. 文件與檢查

- [ ] 4.1 ACCEPTANCE 補三列；MOCK-DATA-CHAIN 鏈五補預置分享成員
- [ ] 4.2 `__checks__/*.mjs`、lint 通過；「負責印務為」殘留為零
- [ ] 4.3 主對話對照 skill 稽核（hex／px／important／createGlobalStyle；未動共用元件）並瀏覽器核對
