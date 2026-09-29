## Why

### Background

印務製作期間會上傳給工廠參考的稿件檔案（印務印件檔案），並附一則說明（檔案備註）。wiki 已把這兩欄定為印件的欄位，旗下每張工單共用同一份：

- 欄位正本：[印件](../../../memory/Sens_wiki/wiki/erp/05-entities/印件.md) § 基本資料「印務印件檔案」「檔案備註」
- 工單側只顯示所屬印件的值：[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) § 工單內容
- 與審稿檔案分開：[稿件管理規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/稿件管理規則.md)、[審稿輪次](../../../memory/Sens_wiki/wiki/erp/05-entities/審稿輪次.md) § 建立來源
- 角色範圍：[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md)、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md) § 職務範圍
- 代理成員可改印件層欄位：[單據分享與職務代理](../../../memory/Sens_wiki/wiki/erp/07-scenarios/單據分享與職務代理.md) § 範圍外
- 新印件不帶入：[打樣後稿件問題重審](../../../memory/Sens_wiki/wiki/erp/07-scenarios/打樣後稿件問題重審.md) § 範圍外

設計方案已過 plan-audit 稽核、Miles 拍板，wiki 已落卡。

### Problem Statement

主規格目前沒有這兩欄的系統行為。未歸檔的 change `work-order-visibility-and-sharing` 把「印務印件檔案上傳」列為單張工單的負責人動作，與 wiki 的印件層設計衝突。其他規格有幾處寫法會讓讀者誤以為印件上的檔案一律屬審稿輪次、工單完全不能上傳檔案、新印件會帶入這兩欄。

| 位置 | 目前寫法 | 問題 |
|------|---------|------|
| 未歸檔 change 的負責人動作清單 | 含「印務印件檔案上傳」 | 同一印件其他工單的負責人與印務主管不能維護 |
| order-management § 印件 ReviewRound 整合 | 印件檔案一律按所屬輪次綁定 | 沒排除印務印件檔案 |
| order-management § 加開印件 | 帶入清單未提這兩欄 | 撰寫者可能照規格側內容一起帶入 |
| work-order § 製程規劃 | 系統不於工單提供另行上傳的入口 | 語意上只指完稿縮圖，字面會擋掉印務印件檔案的上傳入口 |
| prepress-review § 打樣後棄用原印件建新印件 | 保留與重設清單未提這兩欄 | 新印件是否帶入沒有規格 |

## What Changes

- order-management 新增一條 Requirement：印務印件檔案與檔案備註的維護入口、可維護者、不設狀態限制、只在工單詳情顯示、不隨工單單據列印、不設上限、產生新印件不帶入
- order-management § 印件 ReviewRound 整合：限定「按所屬輪次綁定」指審稿檔案
- order-management § 加開印件：明列不帶入這兩欄
- work-order § 製程規劃：「不於工單提供另行上傳的入口」限定指完稿縮圖
- prepress-review § 打樣後棄用原印件建新印件：重設清單補這兩欄
- 未歸檔 change `work-order-visibility-and-sharing` 的負責人動作清單移除「印務印件檔案上傳」，改引用本 change 新增的 Requirement（直接改該 change 的規格差異檔）

不含破壞性變更：主規格原本沒有這兩欄的行為。

## Capabilities

### New Capabilities

- 無

### Modified Capabilities

- `order-management`：新增印務印件檔案與檔案備註的 Requirement；修改印件 ReviewRound 整合與加開印件兩條
- `work-order`：修改製程規劃，完稿縮圖以外的上傳入口不受限
- `prepress-review`：修改打樣後棄用原印件建新印件的重設清單

## Impact

- Prototype（erp repo `(prototype)/`）：工單詳情的印務印件檔案區改讀寫所屬印件；權限改為該印件任一張工單的負責人與編輯（代理）成員加印務主管；mock 資料依 MOCK-DATA-CHAIN 改為每個印件一份
- Sens 測試專案 `erp-prototype-tests/`：權限純函式測試與工單詳情畫面測試要改寫
- 未歸檔 change `work-order-visibility-and-sharing`：規格差異檔改一處
- Linear PM-1074 § 印務印件檔案上傳：交付內容要改成印件層規則（寫入前另取 Miles 同意，不在本 change 的任務內自動執行）
- 相關未解 OQ：[PT-057](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PT-057-門戶可視範圍與稿件保密邊界.md)（外部廠商是否看得到這兩欄）、[PI-009](../../../memory/Sens_wiki/wiki/erp/08-open-questions/PI-009-打樣後棄用重建新印件的帶入與重設清單.md)（棄用重建的帶入與重設清單正本）；兩者都不擋本 change
