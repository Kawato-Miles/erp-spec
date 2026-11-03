# vault-audit 版本紀錄

只追加層：記每次改動與理由。最新在下。

## 2026-11-04 重寫

- 依 skill、CLAUDE.md、派工範本重構計畫批次 5（`memory/erp/skill-rewrite-20261029/重構計畫-初稿.md` § 2.10、§ 9-3）。
- SKILL.md 改共用骨架；維度定義與判定標準移到 `references/稽核維度.md`；維度編號 1 至 16 不變，其他卡引用的「維度 N」照舊有效。
- 新增 `scripts/mechanical_check.py`：維度 2、5、6、7、8、9、10、11、17 改由腳本判定，結果直接採用。值域讀 wiki-schema 與 taxonomy；門檻讀稽核維度 § 一、vault-ingest 掃描報告格式、oq-manage。
- 判讀維度 1、12、13、14 改派子代理，加懷疑者複核（`references/判讀派工單.md`）；起因是 2026-08-18 維度 14「收款條件」誤判。
- 新增維度 17 審查知識層健康：參考模型卡引用的 raw 卡存在且已精練、檢核素材有出處、誤判案例與評測反例一一對應。
- 模式 C 改為只報不修：修復清單經 Miles 確認後轉介 wiki-amend、oq-manage、vault-ingest；原本可直接做的機械修復（補欄位、死鏈改向、建 stub）一併轉介。
- 建議門檻（卡異動張數、提交數）收進稽核維度 § 一；raw 累積門檻改引 vault-ingest，不再複寫。
- 維度 9 停留門檻改引 vault-ingest（raw、reviewed 停留天數）；舊版自訂的 90 天 Warning、180 天 Error 兩級取消，停留超期一律 Warning。
- 維度 6 機械掃描改為只計真正的 callout 與連結語法，排除行內程式碼裡描述禁令的句子；OQ 卡命名檢查併入維度 8（wiki-schema § 七原本就指維度 8）。
- 實測校準句（孤島、CLI 省略參數、待確認類詞）從維度正文移到 SKILL.md 陷阱段。
