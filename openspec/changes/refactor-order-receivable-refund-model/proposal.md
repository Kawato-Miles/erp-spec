## Why

訂單「正向增項」（加印件 / 加其他費用）發生時，系統如何感知應收上升、收款與發票如何對應，在原規格不明確——原本只設計過退款（負項）閉環，正向缺對稱機制。經 explore + pre-check 雙領域稽核 + 業務訪談收斂出「路 C」：把補收（正向）與退款（反向）統一在**對帳三軸（應收 = 發票淨額 = 收款淨額）是否平衡**判定，訂單異動單（OA）退化為「審核閘門 + 應收調整生效」載具，退款完成從「綁 OA 逐筆達標」改為「對帳應退差額歸零 + 退款款項自身切『已完成』物理錨點」。

商業推理正本見 [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md)（補收免審 / 退款送審不對稱、應收認列公式）與 [對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/對帳一致性.md)（三方對帳相等領域底線）。業務訪談確認見 [ORD-030](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-030-完成前明細直接增減真實業務流程待訪談.md)（answered）。

## What Changes

- **明細時點分界 = 訂單狀態終態集合**：訂單完成前（含製作中 / 出貨中等所有未達「訂單完成 / 已取消」的狀態）印件費 + 其他費用可由業務 / 諮詢直接增減（含調降）；進入「訂單完成 / 已取消」終態後鎖定、金額異動一律走 OA。**BREAKING**（推翻「製作後金額欄位 disabled」與「審核通過鎖定報價總額」）
- **退款核銷對帳應退差額**：退款 Payment 核銷「收款淨額 − 應收 > 0」的應退差額，`linkedOrderAdjustmentId` 改選填、不綁 OA 累計、不進期次。**BREAKING**
- **OA「已執行」改「核可後應收調整生效」**：與補收對稱、不綁退款 Payment 累計達標；移除「取消 Payment 致累計不足回退 OA」回退機制。**BREAKING**
- **報價鎖定點 = 訂單完成**：審核通過完全不鎖定；收斂 order-management spec L1822（印件單價製作前可改）vs L3671（報價總額審核通過鎖定）vs L1465（製作後 disabled）三處矛盾條文
- **完成前調降一律留活動紀錄**（OrderActivityLog 新增事件類型，沿用既有實體；輕量、不做大額 Slack 監督）
- **缺口責任歸屬**：Order 新增「缺口負責業務」欄位（gap_primary_owner_id），角色層明定「第一責任人 = 訂單業務、監督人 = 業務主管」
- 差額警示設為**不可忽略**（補「帳上已退、實際沒退」保護降級洞）；多筆退款**逐筆挂匯款證明**（帳平不分筆但憑證逐筆）；完成前調降與期次規劃 invariant 衝突由差額警示**同步引導**調期次

## Capabilities

### New Capabilities
（無——本次為既有能力的需求修正，不新增 capability）

### Modified Capabilities
- `order-management`: 印件 / 其他費用編輯時機（鎖定點改訂單完成終態集合）、退款 Payment 核銷邏輯（核銷應退差額）、OA「已執行」語意、三方對帳差額（應退差額定義 + 不可忽略 + 防超退）、報價鎖定點收斂
- `state-machines`: OrderAdjustment 狀態機（已執行改核可即生效 + 移除回退機制）、退款 Payment 推進（不綁 OA 累計）
- `prototype-data-store`: Payment 型別（linkedOrderAdjustmentId 改 nullable）、對帳三軸與應退差額公式、完成前調降活動紀錄事件、Order gap_primary_owner_id 欄位

## Impact

- **OpenSpec spec**：order-management（5-6 處 Requirement MODIFIED）+ state-machines（2 處 MODIFIED）+ prototype-data-store（2 處 MODIFIED）。顧問已標 MODIFIED（非 ADDED），避免 archive sync 新舊並存。
- **wiki 商業邏輯卡回補（archive 後）**：[訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md)（退款送審 / 退款已執行認列與回退 / 一定要成立的規則第 1 條 / 應收公式「已執行」定義）；新增「明細時點分界」商業規則卡（業務訪談已備，ORD-030）；[對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/對帳一致性.md) 沿用（不改底線）。
- **OQ**：BI-9 resolved（採方案 D）、ORD-027 re-open（鎖定點推翻）、ORD-003 回退機制被取代、BI-3 本 change 範圍界定（已收 > 應收都當該退）。
- **後驗 / 另議**：缺口 KPI 帳齡指標 + 彙總監控盤（後驗 epic，本 change 不埋帳齡錨點——Miles 拍板）；報價版本留存 + 改價紅標（另議）；fix-order-print-item-actions change 重評；ORD-025 完成後補收入口；ORD-027 部分付款態。
- **Prototype**：sens-erp-prototype 對應模組（印件 / 其他費用編輯門控、對帳面板差額、退款核銷）。
