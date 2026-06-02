## Context

訂單正向增項（加印件 / 加其他費用）的應收感知、收款與發票對應在原規格不明確（只設計過退款負項閉環）。經 explore + pre-check 雙領域稽核 + 業務訪談（A-D）收斂出「路 C」。商業推理正本見 [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md)、[對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/對帳一致性.md)；序列協作 Phase 1-4 + Miles 範疇決策已收斂（audit-log 2026-06-02 路 C pre-check）。

現況關鍵約束：
- 應收 = ∑印件費 + ∑其他費用 + ∑已執行 OA（[訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md) 應收公式）。
- 現有退款 OA「已執行」綁「退款 Payment 累計達 OA.amount」；明細金額製作後 disabled、報價總額審核通過鎖定（三處時點不一致、L1822/L3671/L1465 既有矛盾）。
- 對帳三軸相等是領域底線（[對帳一致性](../../../memory/Sens_wiki/wiki/erp/04-business-logic/對帳一致性.md)）。

## Goals / Non-Goals

**Goals:**
- 正向補收與反向退款統一在「對帳三軸（應收 = 發票淨額 = 收款淨額）平衡」判定。
- 明細時點分界統一到「訂單完成 / 已取消」終態（完成前直接增減含調降）。
- 退款完成判定解循環：物理錨點 = 退款款項切「已完成」，對帳差額歸零為結果呈現。

**Non-Goals:**
- 缺口 KPI 帳齡指標 + 彙總監控盤（後驗 epic，本 change 不埋帳齡錨點——Miles 拍板）。
- 報價版本留存 + 改價紅標（另議）。
- 溢收（誤多收）vs 預收（客戶預付）細分（本 change「已收 > 應收」都當該退，BI-3 另議）。
- fix-order-print-item-actions 重評、ORD-025 完成後補收入口、ORD-027 部分付款態（連帶另議）。

## Decisions

### D1：明細鎖定點 = 訂單狀態終態集合 {訂單完成, 已取消}
- 決策：完成前（所有未達終態的狀態）印件費 + 其他費用可由業務 / 諮詢直接增減（含調降）；進入終態後鎖定走 OA。
- Rationale：業務訪談（[ORD-030](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-030-完成前明細直接增減真實業務流程待訪談.md)）確認完成前直接改是真需求（加印 / 改規格 / 報價打錯修正 / 議價調降四情境），業務 + 諮詢操作、弱把關（主管事後可見）。
- Alternatives：(a) 審核通過鎖定報價（senior-pm Phase 1 自圓）——Miles 撤回，審核通過完全不鎖定；(b) 製作後鎖定（現狀）——卡死正常議價。
- 關鍵：門控用「status ∈ {訂單完成, 已取消}」終態集合，非單一「訂單完成」——諮詢取消終態是「已取消」，只判「訂單完成」會漏鎖（顧問 challenge a）。

### D2：退款核銷對帳應退差額（不綁 OA）
- 決策：退款 Payment 核銷「收款淨額 − 應收 > 0」應退差額，`linkedOrderAdjustmentId` 改選填，不進期次。
- Rationale：正反向統一對帳判定；補收退出 OA（明細直接改）後，退款也不需逐筆綁 OA。
- Alternatives：(a) 負期次（explore 中途方案）——折讓在發票淨額層、非負期次，棄用；(b) 逐筆 OA 綁 Payment（現狀）——明細減 + OA 雙重計算。

### D3：OA「已執行」= 核可後應收調整生效（與補收對稱）
- 決策：退款 OA「已執行」從「綁 Payment 累計達標」改為「核可即生效」，移除「取消 Payment 致累計不足回退 OA」回退機制（[BI-9](../../../memory/Sens_wiki/wiki/erp/08-open-questions/BI-9-補收OA立即執行對稱破壞表述.md) 方案 D、[ORD-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-003-取消退款Payment是否回退OA.md) 回退機制取代）。
- Rationale：補收與退款「已執行」語意統一（都 = 應收生效），spec 表述簡化為單一 invariant。
- Alternatives：BI-9 原 A/B/C（兩條 invariant 並存 / 擴充 / derived 判定）——前提（退款綁 Payment）被路 C 拆除，全失效。

### D4：退款完成物理錨點 = 退款款項切「已完成」（破循環）
- 決策：退款完成判定錨在「退款款項自身切已完成（業務上傳匯款證明）」，對帳差額歸零是**結果呈現**、非完成判定本身。
- Rationale：破解 pre-check 攔截的循環定義（差額歸零 ← 應收=收款淨額 ← 退款完成 ← 差額歸零）。匯款證明是物理鐵證。
- 多筆退款**逐筆挂匯款證明**（帳平不分筆判定、但憑證逐筆，顧問漏洞 1）。

### D5：缺口責任歸屬（軟兜底的責任人）
- 決策：Order 加「缺口負責業務」欄位（gap_primary_owner_id，預設 = 訂單負責業務）；角色層明定第一責任人 = 訂單業務、監督人 = 業務主管。
- Rationale：CEO challenge——軟兜底假設「有人看警示去收尾」，但無責任歸屬會「差額長期掛著沒人理」。
- 完成前調降一律留 OrderActivityLog（沿用既有實體；輕量、不做大額 Slack 監督——Miles 簡化）。

## Risks / Trade-offs

- **退款保護降級**（拆「OA 已執行 = 一定退完」單筆硬約束換對帳軟兜底，重開「帳上已退、實際沒退」）→ Mitigation：D4 物理錨點（匯款證明）+ 差額警示**不可忽略**（不提供「忽略此差額」選項）+ D5 缺口責任 + 逐筆憑證。退錢動作本身仍走 OA 退款路徑（既有業務主管核可不變）。
- **雙終態鎖定坑**（門控只判「訂單完成」漏鎖諮詢取消訂單）→ Mitigation：門控用終態集合 {訂單完成, 已取消}（D1）。
- **完成前調降與期次規劃 invariant 衝突**（應收降 → Σ期次 > 應收 → 誤觸警示）→ Mitigation：完成前調降由差額警示**同步引導**業務調期次，不阻擋（沿用既有警示精神）。
- **應退差額 vs 待折讓方向混淆**（先退款後折讓會出現反向差額）→ Mitigation：差額分解明確區分（應收>發票淨額→待開票/待折讓；收款淨額>應收→待退款），對外文案區分留 [BI-16] 上線前驗證。

## Migration Plan

- spec delta：order-management（印件 / 其他費用編輯時機、退款 Payment 核銷、OA 已執行、三方對帳、報價鎖定）+ state-machines（OA 狀態機、退款 Payment 推進）+ prototype-data-store（Payment 型別、應退差額公式、調降活動紀錄、Order 缺口欄位）MODIFIED。
- archive 後 MUST 對齊 wiki [訂單異動規則](../../../memory/Sens_wiki/wiki/erp/04-business-logic/訂單異動規則.md)（退款送審 / 退款已執行認列與回退 / 一定要成立的規則第 1 條 / 應收公式「已執行」定義）+ 新增「明細時點分界」商業規則卡（ORD-030 訪談已備）。
- Prototype：sens-erp-prototype 印件 / 其他費用編輯門控、對帳面板差額、退款核銷。

## Open Questions

- [BI-16](../../../memory/Sens_wiki/wiki/erp/08-open-questions/BI-16-差額警示文案區分待開票與退款待執行.md)（open, low）：差額警示對外文案區分「待開票 vs 退款待執行」，上線前驗證；prototype 階段三軸數值呈現足夠。
- 缺口 KPI 帳齡指標 + 彙總盤（後驗 epic，本 change 不埋帳齡錨點）。
- [BI-3](../../../memory/Sens_wiki/wiki/erp/08-open-questions/BI-3-溢收預收未分配後續處理.md)（open）：溢收 vs 預收細分另議（本 change「已收 > 應收」都當該退）。
