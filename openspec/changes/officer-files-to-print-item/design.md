## Context

設計工作稿在 Sens 的 `memory/erp/plans/_archives/2026/officer-files-to-print-item/officer-files-to-print-item-design.md`（plan-audit 三輪全過、Miles 拍板）。wiki 已落卡：欄位正本 [印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) § 基本資料；角色範圍 [印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)。

Prototype 現況與設計的差距：

| 項目 | Prototype 現況 | 設計 |
|------|---------------|------|
| 資料存放 | 存在工單資料上，每張工單各一份 | 存在印件，旗下工單共用一份 |
| 權限 | 本單負責人、本單編輯（代理）成員、印務主管 | 該印件任一張工單（含已取消）的負責人與編輯（代理）成員、印務主管 |
| 狀態限制 | 不看狀態 | 不看工單狀態、也不看印件狀態 |
| 顯示位置 | 工單詳情 | 工單詳情；印件詳情不顯示 |
| 新印件 | 無此行為 | 加開與棄用重建都從空白開始 |

約束：Prototype 只動 erp repo 的 `(prototype)/` 目錄；mock 資料依 MOCK-DATA-CHAIN 為唯一正本；測試放 Sens 的 `erp-prototype-tests/`。

## Goals / Non-Goals

### Goals

- 同一印件的多張工單詳情顯示同一份印務印件檔案與檔案備註
- 權限判定改看該印件旗下全部工單
- 加開印件與棄用重建的新印件，這兩欄為空

### Non-Goals

- 外部廠商能不能看到這兩欄（併入 PT-057）
- 棄用重建其他欄位的保留與重設清單（PI-009）
- 記錄每個檔案的上傳者或備註改寫者
- 印件詳情頁新增顯示

## Decisions

| 決策 | 選擇 | 替代方案與否決理由 |
|------|------|------------------|
| 權限判定的輸入 | 傳入該印件旗下全部工單，任一張的負責人或編輯（代理）成員即放行；印務主管直接放行 | 只看當前工單：同印件其他工單的負責人無法補件，與設計不符 |
| 權限判定是否排除終態工單 | 不排除，已取消工單的負責人仍放行 | 比照製程說明排除終態：製程說明會印在紙本上所以鎖定，這兩欄不印，鎖住只會逼出系統外補洞（grill 第 20 題採甲） |
| 資料寫入位置 | 寫入印件資料，工單詳情讀所屬印件 | 寫工單再同步到其他工單：會有多份副本，同步漏掉就不一致 |
| 移除權限 | 任一可維護者都可移除任一檔案 | 只准上傳者移除：要記錄上傳者，超出需求範圍（grill 第 2 題否決） |
| 未歸檔 change 的處理 | 直接改 `work-order-visibility-and-sharing` 的規格差異檔，刪除負責人動作清單中的「印務印件檔案上傳」 | 等它歸檔後再開 MODIFIED：主規格目前沒有該 Requirement，本 change 無法對它寫差異 |

## Risks / Trade-offs

- [同一印件的可維護者可互相覆寫備註] → 一個印件一則，最後一次存檔為準；其他可維護者看得到並可再改（設計情境表已列）
- [印件唯一的空草稿工單被刪除後暫時沒有入口] → 印務主管加開工單後，新工單詳情再度可維護
- [兩個未歸檔 change 都動 work-order 規格] → 兩者改的 Requirement 不同，歸檔順序不影響結果

## Migration Plan

| 步驟 | 內容 |
|------|------|
| 1 | 改未歸檔 change 的規格差異檔 |
| 2 | Sens 測試專案先寫失敗測試 |
| 3 | 改 MOCK-DATA-CHAIN，再改 mock 資料：每個印件一份檔案清單與一則備註，舊工單層資料不保留 |
| 4 | Prototype 改資料存放、權限與新印件行為，跑測試至通過 |
| 5 | Linear PM-1074 的修改內容列給 Miles，同意後才寫入 |

回滾：Prototype 在 `prototype/production-stage` 分支迭代，還原該批提交即可。

## Open Questions

- [PT-057-門戶可視範圍與稿件保密邊界](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-057-門戶可視範圍與稿件保密邊界.md)：外部廠商是否看得到這兩欄，不擋本 change
- [PI-009-打樣後棄用重建新印件的帶入與重設清單](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PI-009-打樣後棄用重建新印件的帶入與重設清單.md)：其餘欄位的帶入與重設清單，不擋本 change
