## 1. 明細編輯時機門控（鎖定點 = 訂單完成終態集合）

- [ ] 1.1 `EditOrderPrintItemPanel`：解除 `price_per_unit` 製作後 disabled，改門控「`Order.status ∉ {訂單完成, 已取消}` 時可編輯（含調降）」；`pi_ordered_qty` 同步可改
- [ ] 1.2 印件費（`pi_ordered_qty × price_per_unit`）改價 / 改量時即時重算，訂單應收即時更新（store derived）
- [ ] 1.3 終態（訂單完成 / 已取消）金額欄位 disabled + Tooltip「訂單已完成，金額變更需走『訂單異動』Tab」
- [ ] 1.4 廢除「金額 / 印件規格分開操作、金額走 OA」門控（完成前金額直接改、不強制走 OA）；驗證：完成前改價無「請走訂單異動」攔阻

## 2. 其他費用（OrderExtraCharge）編輯時機 + 審核通過鎖定收斂

- [ ] 2.1 OEC 新增 / 編輯 / 刪除門控改「`status ∉ {訂單完成, 已取消}`」（凍結錨點從「審核通過」改「訂單完成終態」）
- [ ] 2.2 API 層拒絕終態後 OEC 寫入（錯誤訊息「訂單已進入終態，新增費用請走訂單異動單流程」）
- [ ] 2.3 「審核通過狀態下訂單修改」：報價總額（印件金額 + OEC 加總）移出「核心欄位鎖定例外」（完成前可直接改）；保留 `payment_terms_note` / 客戶 / `approved_by_sales_manager_id` 鎖定

## 3. OA 已執行核可即生效 + 退款核銷應退差額

- [ ] 3.1 退款 OA：業務主管核可後系統自動推進「已執行」（executedAt = 核可時點、應收即時 −N），移除「綁退款 Payment 累計達 OA.amount 才推進」
- [ ] 3.2 移除「取消已完成 Payment 致累計不足回退 OA 至已核可」回退機制（OA 已執行不再綁 Payment 累計）
- [ ] 3.3 退款 Payment：`linkedOrderAdjustmentId` 改選填（nullable）；切「已完成」時核銷應退差額、MUST NOT 建 PaymentAllocation、MUST NOT 推進 / 回退 OA
- [ ] 3.4 退款完成判定 = 退款 Payment 切「已完成」（須挂匯款證明附件方可切）；多筆退款各自挂憑證、帳平不分筆判定
- [ ] 3.5 補收 OA：沿用免審直達已執行；「已執行」語意對齊為「核可後應收調整生效」（與退款一致）

## 4. 三方對帳差額分解 + 警示不可忽略

- [ ] 4.1 對帳面板差額四向分解：應收>發票淨額→待開票/待折讓；應收>收款淨額→待收；收款淨額>應收→應退差額；發票淨額>應收→待折讓
- [ ] 4.2 `getOrderRefundableGap(orderId)` selector = max(收款淨額 − 應收, 0)（本 change 一律當「退款待執行」）
- [ ] 4.3 差額警示設為不可忽略（對帳面板 MUST NOT 提供「忽略此差額」選項）
- [ ] 4.4 完成前調降致「Σ BillingInstallment.scheduled_amount > 應收」時，對帳面板顯示「期次規劃需同步」引導（不阻擋）

## 5. 調降留痕 + 缺口責任

- [ ] 5.1 OrderActivityLog 加 `PRE_COMPLETION_AMOUNT_DECREASE` 事件型別 + `logPreCompletionAmountDecrease(orderId, payload)` action（payload 含 printItemId / decreaseFrom / decreaseTo / 操作者 / 時間）
- [ ] 5.2 明細 price_per_unit / pi_ordered_qty 調降、OEC amount 調降 / 刪除致應收減少時寫入該事件（弱把關、不阻擋、不送審）
- [ ] 5.3 缺口第一責任人 `getOrderGapOwner(orderId)` = `order.sales_id`（不新增欄位；監督人 = 該業務主管由角色關係推導）

## 6. 驗證（端到端推演 + e2e）

- [ ] 6.1 e2e（Playwright）：完成前加印（情境 A）→ 應收升 → 對帳差額 → 併期次開票收款 → 三軸帳平
- [ ] 6.2 e2e：完成前已收款減量退款（情境 C）→ 明細減 → 開折讓 → 退款核銷應退差額 → 三軸帳平、無雙重計算、無 OA
- [ ] 6.3 e2e：售後整筆退款（情境 D）→ OA 核可即生效（應收 −N、不等退款）→ 退款 Payment 核銷差額 → 帳平
- [ ] 6.4 e2e：多筆退款（情境 F）→ 各自挂憑證 → 帳平不分筆
- [ ] 6.5 e2e：諮詢取消訂單（已取消終態）明細唯讀（雙終態鎖定驗證——不可只判「訂單完成」）
- [ ] 6.6 推演：反覆增減 100→120→90→150 → 印件費 derived = 1500、無 OA、無雙重
- [ ] 6.7 驗證：取消退款 Payment 後 OA 維持已執行、應退差額重現引導重退（無回退機制）
- [ ] 6.8 console.error / pageerror 嚴格斷言；smoke + navigation 通過

## 7. spec sync + 收尾

- [ ] 7.1 `/opsx:verify` 驗證實作符合 specs delta（三方對帳 / OA 狀態機 / 明細門控）
- [ ] 7.2 archive 後對齊 wiki [[訂單異動規則]]（退款送審 / 已執行認列回退 / 鐵則 1 / 應收公式「已執行」定義）+ 新增「明細時點分界」商業卡（ORD-030 訪談已備）
- [ ] 7.3 doc-audit 跨檔一致性檢查（含 wiki 商業邏輯卡回補清單）
