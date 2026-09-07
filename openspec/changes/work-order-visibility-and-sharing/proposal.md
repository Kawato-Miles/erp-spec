# 工單可見範圍與分享

## Why

### Background

工單分派後主責是該印務，但工單列表讓每位印務看到全公司所有工單；印務休假或協作也沒有把工單交給同事看或代為操作的正當通道。wiki 已於 2026-09-07 落卡：[印務](../../../memory/Sens_wiki/wiki/erp/03-roles/印務.md) § 職務範圍、[印務主管](../../../memory/Sens_wiki/wiki/erp/03-roles/印務主管.md)、[工單](../../../memory/Sens_wiki/wiki/erp/05-entities/工單.md) § 欄位「負責人」「分享成員」與 § 異動紀錄、[單據分享與職務代理](../../../memory/Sens_wiki/wiki/erp/07-scenarios/單據分享與職務代理.md)、[報工規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/報工規則.md) § 報工權限守門、[工單狀態](../../../memory/Sens_wiki/wiki/erp/06-state-machines/工單狀態.md) § 轉換條件。

設計正本：[work-order-visibility-design.md](../../../work-order-visibility-design.md)（grill 五題＋五項補充拍板、plan-audit 五輪全過）。後端 sens-print-core 訂單側已有兩層分享、五類改派理由分類、離職交接清空分享；工單側全無，為新做。

### Problem Statement

印務進系統要從全公司工單裡找自己的活；別人的工單只有負責人一人能動，沒有代理通道；工單改派沒有理由分類，分享成員處置無所依。

## What Changes

- 工單列表：印務只列負責人為自己或分享成員含自己的工單；印務主管與其他角色不變
- 工單詳情：全體印務可開；負責人動作（八支既有把關＋兩處報工入口＋分享管理）限負責人與編輯（代理）層級分享成員，停用理由不揭露負責人姓名
- 印件列表：印務只列旗下至少一張列表可見工單的印件；印件詳情與展開列的工單照舊列全部
- 工單分享成員：兩層級（檢視／編輯（代理）），負責人或編輯（代理）成員維護，介面比照訂單分享頁籤
- 改派：印務主管改派必選五類理由分類，離職交接清空分享成員、其餘保留，寫進改派異動紀錄的異動內容；改派異動維持純留痕
- 工單狀態送審兩列與收回列的操作者條件擴為含編輯（代理）成員

## Capabilities

### Modified Capabilities

- work-order：新增「工單與印件列表可見範圍與負責人動作」「工單分享成員」兩條 Requirement；§ 工單分派補改派理由分類與分享成員處置

## Impact

- OpenSpec：work-order spec
- Prototype（erp repo）：工單列表過濾、分享頁籤、permissions 八支擴充與停用理由、印件列表過濾、報工入口、改派 Dialog 理由分類、mock `shared_members`
- wiki：八卡已先行落卡，本 change 不再動 wiki
- 既存缺陷另案：訂單 prototype 改派缺理由分類與清空分享；派單頁動作無負責人把關
