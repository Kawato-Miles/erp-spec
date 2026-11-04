# oq-manage 版本紀錄

只追加層：記每次改動與理由。最新在下。SKILL.md 本體只寫現行規則，不載入本檔。

舊版沒有版本紀錄；2026-03-25 建立、2026-06-11 v3 封存制重寫等改動見 git 歷史。

## 2026-11-04 完整重寫

- 依據：skill、CLAUDE.md、派工範本重構計畫批次 5（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.8、§ 9-2、§ 9-3）。
- 改為共用骨架六段：目標、產出、限制、順序、情況對應檔案、陷阱。mode A～E 名稱保留為段內標籤。
- 保留：平層等於待裁決佇列、拍板即封存；查詢結果不得當現況的例外宣告；去重含封存卡；紅旗表精簡成陷阱段；卡長相正本在 [[規範 - OQ]]。
- 新增：與 erp-audit 的接點 `references/待裁決清單格式.md`（評分表待裁決項依 OQ 編號列給 Miles；延後的 OQ 只留 OQ 卡），依準則卡 § 三與 D2 拍板。
- 拆檔：去重流程移 `references/去重方法.md`；mode E 移 `references/整理報告格式.md`。
- 刪除，理由如下：
  - audience「開卡必判」與 external 推送 Notion 段：與專案 CLAUDE.md 現行指示（一律 internal、暫停推送）不一致；改為一律 internal。
  - mode E「external 待推送」清單：推送暫停期間不用。
  - § 三協作表：改寫進 description 的「用」「不用」與限制段的轉介句。
  - description 內各 mode 說明：description 只寫觸發時機。
- open 久置天數門檻只留在 `references/整理報告格式.md`；vault-audit 維度 8 重寫時引用該檔。
- description 補「先開一張 OQ」「之後再問業務」「看哪些 OQ 放太久」，依 2026-11-04 觸發評測 K01 兩版都沒觸發。

## 2026-11-04 驗證

- 指名類觸發 K01～K03 兩輪全部觸發；久置起算點改回只從 raised-at 起算；見基線結果 § 十。

## 2026-11-04 OpenSpec 退場

起因：Miles 拍板 Q10、Q12。裁決結果不再追加 grill.md，改為 grill 中由 Miles 確認、要改正本卡的轉 `wiki-amend`；新增「grill 進行中識別到不確定項，當下開卡」一條；audit-rN.md 落點改為 `.scratch/<主題>/`。
