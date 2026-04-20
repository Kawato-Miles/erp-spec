# OQ 入庫紀錄（本 change 衍生的 OQ 清單）

> 狀態：所有 OQ 已入 Notion Follow-up DB（2026-04-19）
> DB：[Follow-up](https://www.notion.so/32c3886511fa808e9754ea1f18248d92)
>
> 三視角審查後異動：OQ3（PI-005）已解答並關閉；新增 PI-008 與圖編器 Preflight 追蹤。

## 進行中 OQ（3 筆）

| 序號 | 任務名稱 | 優先順序 | Notion URL |
|------|---------|---------|-----------|
| PI-006 | 審稿人員工作台 UI 設計細節 | 中 | [open](https://www.notion.so/3473886511fa8133951bc56bdbc82c56) |
| PI-007 | 審稿主管工作台 UI 設計細節（能力設定 / KPI / 覆寫） | 中 | [open](https://www.notion.so/3473886511fa81cbac8bf1908ad3cf9e) |
| ORD-010 | B2B 業務補件入口的 UI 位置與上傳樣式 | 中 | [open](https://www.notion.so/3473886511fa8114a638c3679af56987) |
| XM-006 | 審稿不合格的通知管道與內容模板 | 高 | [open](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) |

## 已解答（Notion 已更新為「已完成」）

| 序號 | 任務名稱 | 決議 | design 段落 |
|------|---------|------|------------|
| PI-003 | ReviewRound 內 file_role 枚舉範圍確認 | 採兩值（印件檔 / 縮圖）；審稿人員合併多類內容為單一印件檔，參考圖由縮圖承擔 | D4 |
| PI-004 | 審稿人員能力不足時的自動分配降級策略 | 破例派給當前能力最高者 + ActivityLog 標註；破例頻率為人力補充訊號 | D13 |
| PI-009 | 退件原因 LOV 選單完整清單 | 10 項 LOV（含「技術性退件」與「其他」）；前 8 項與圖編器 Preflight 規則對映 | D14 |

## 歸檔時同步更新的 OQ（本 change 歸檔前處理）

| 序號 | 任務名稱 | 新狀態 | 決議 |
|------|---------|-------|------|
| PI-005 | 合格後自動建工單的「製程/材料已設定」判定規則 | 已完成 | **B2C 自動帶生產任務 / B2B 建空工單草稿**（理由：B2C 商品主檔已規格化、B2B 印件客製化需印務主管拆分）。詳見 add-prepress-review design § D11 |
| PI-002 | 打樣 NG 稿件問題：檔案版次 vs 重建印件 | 已完成 | 採**混合路徑**：審稿階段內採同印件補件（檔案版次方案）；合格後代表業務內容變更，走開新印件。詳見 add-prepress-review state-machines delta § 合格為終態 |

## 本 change 新增 OQ（已建立）

| 序號 | 任務名稱 | 優先順序 | Notion URL |
|------|---------|---------|-----------|
| PI-008 | 審稿人員規模成長時 Prepress Operator / Approver 角色拆分檢視 | 低 | [open](https://www.notion.so/3473886511fa81f898f9c987299dd177) |
| PI-009 | 退件原因選單（reject_reason_category LOV）的完整清單 | 中 | [open](https://www.notion.so/3473886511fa81108fbdd9c0a2a44521) |
| XM-007 | 圖編器 Preflight 自動檢查（出血 / 解析度 / 色彩模式）上游攔截 | 高 | [open](https://www.notion.so/3473886511fa81738471f2f2753e0f97) |

XM-007 實際執行於圖編器 repo 另開 `add-print-preflight-check` OpenSpec change；ERP 這邊僅作追蹤 OQ，與本 change 的「B2C 退件後補件回流率」KPI 互為依賴。PI-009 對齊 QR-002（需求單流失原因選單）的 LOV 設計模式。

## 相關 relation 設定

- **PI-003 → PI-002**：`相關問題` relation。歸檔時同步更新 PI-002 為已完成。
- **XM-006 → XM-002, XM-004**：`相關問題` relation。共用通知管道配置。
- **PI-008 → PI-004**：`相關問題` relation（能力分級的角色拆分影響）。

## Archive 階段 checklist

本 change `/opsx:archive` 前需：

- [x] 更新 PI-003 為「已完成」+ 決議與理由（apply 前定案完成，2026-04-19）
- [x] 更新 PI-004 為「已完成」+ 決議與理由（apply 前定案完成，2026-04-19）
- [x] 更新 PI-009 為「已完成」+ 決議與理由（apply 前定案完成，2026-04-19）
- [ ] 歸檔時更新 PI-005 為「已完成」+ 決議與理由（見上）
- [ ] 歸檔時更新 PI-002 為「已完成」+ 決議與理由（見上）
- [x] 建立 PI-008（角色拆分未來檢視）— 已完成
- [x] 建立 XM-007（圖編器 Preflight 追蹤）— 已完成，待於圖編器 repo 另開 change
- [ ] delta specs 合併至 main specs 後，`oq-drafts.md` 可移除（歷史已在 Notion 保存）
