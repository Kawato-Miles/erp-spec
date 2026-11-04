---
name: vault-audit
description: >
  用：Miles 說「跑 vault audit」「audit vault」「Vault 健康檢查」「健檢」「全量稽核」「只查孤島」「跑維度 N」「稽核我剛 commit 的那批」「audit 並修復」；wiki 卡異動或提交數達建議門檻時主動建議；change 封存後主動建議。
  不用：規劃設計稽核（用 erp-audit）；OpenSpec spec 稽核；Prototype 稽核（用 erp-prototype-tests）；raw 待處理掃描（用 vault-ingest）；交付文件稽核（用 linear-delivery）；寫卡或修卡（用 wiki-amend）。
---

# vault-audit

## 目標

找出 wiki 的矛盾、過時、孤島、死鏈、缺欄位與違規，產出健檢報告與 log 一筆。
報告同時給方向：值得調查的新問題、該補的素材、該收割的 OQ 群。
誰在何時處理，由 Miles 在對話決定。

## 產出

| 產出 | 落點 | 誰寫 |
|------|------|------|
| 健檢報告，含「建議調查的新問題與該補的素材」段 | 對話；格式見 `references/稽核維度.md` § 三 | 主對話 |
| log 一筆（動作＝健檢、標籤＝audit） | `memory/Sens_wiki/wiki/log.md`，最新在上 | 主對話 |
| 修復清單（模式 C） | 對話；Miles 確認後轉介 | 主對話 |

## 限制

- 只讀 `memory/Sens_wiki/wiki/` 與 `memory/Sens_wiki/raw/`。frontmatter 引用的外部路徑只測存在，不讀內容。不讀 OpenSpec、Prototype、已凍結的 `00-meta/changelog.md`。
- 只報不修。修復一律轉介：03～07 與 11 層卡轉 `wiki-amend`；OQ 卡轉 `oq-manage`；raw 卡轉 `vault-ingest`；00-meta 規則正本與規範卡由主對話依 Miles 拍板改。
- 矛盾並排呈報，建議開 OQ，不自行調和。
- 機械維度的結果直接採用，不再派模型複判。判讀維度（1、12、13、14）派子代理判讀，再派懷疑者複核。
- 建議門檻與各維度門檻只寫在 `references/稽核維度.md` § 一。
- 判讀子代理與懷疑者的任務書 MUST 指名先讀非商業術語對照：`/Users/b-f-03-029/Sens/memory/shared/non-business-terms.md`。句法規則由 SubagentStart hook 送達子代理，不另指名。
- 跳過任一維度，報告寫原因。判定不誇大：OK 不報成 Warning。
- 報告與 log 都要有；長敘事只留報告。

## 順序

| 步 | 動作 | 誰做 |
|----|------|------|
| 1 | 宣告模式與範圍 | 主對話 |
| 2 | 跑機械維度：`scripts/mechanical_check.py`、`scripts/authority_check.py`；obsidian-cli 查維度 3、4；規範卡機械自檢（維度 16） | 主對話 |
| 3 | 派判讀子代理，各組平行 | 子代理 |
| 4 | 懷疑者複核判讀結果的 Error 與 Warning 列 | 子代理 |
| 5 | 寫報告 | 主對話 |
| 6 | 追加 log | 主對話 |
| 7 | 模式 C：修復清單給 Miles，確認後轉介 | 主對話 |

| 模式 | 觸發句 | 範圍 |
|------|--------|------|
| A 全量 | 「跑 vault audit」「全量稽核」 | 全部維度 |
| B 單維度 | 「跑維度 N」「只查孤島」 | 指定維度；腳本帶 `--dims` |
| C 修復 | 「audit 並修復」 | 全量加修復清單 |
| D 指名批次 | 「稽核我剛 commit 的那批」 | 該批檔案；腳本帶 `--commit`；跨多個提交時先確認邊界 |

## 情況對應檔案

| 情況 | 讀哪個檔 |
|------|---------|
| 要知道某維度怎麼查、怎麼判、門檻多少 | `references/稽核維度.md` |
| 跑維度 2、5、6、7、8、9、10、11、17 | `scripts/mechanical_check.py`（在 repo 根目錄執行；`--help` 看參數） |
| 跑維度 15 | `scripts/authority_check.py` |
| 跑維度 3、4 | skill `obsidian-cli` |
| 派維度 1、12、13、14 與懷疑者 | `references/判讀派工單.md` |
| 要修卡 | 轉 `wiki-amend`（OQ 卡轉 `oq-manage`，raw 卡轉 `vault-ingest`） |
| 本 skill 改動 | `CHANGELOG.md` 追加 |

## 陷阱

| 陷阱 | 出處 |
|------|------|
| 孤島查成出鏈為 0：入鏈為 0 有 28 筆，出鏈為 0 有 57 筆，兩組毫無關係 | 2026-08-01 實測（舊版維度 3） |
| obsidian-cli 省略參數時靜默改查目前開啟的檔：backlinks 少報 8 倍 | 2026-08-01；`memory/Sens_wiki/CLAUDE.md` § 五 |
| 以 grep 當 vault 稽核手段：grep 解析不了 wiki link 與 vault 索引。腳本只查 frontmatter 與純文字，連結類一律走 CLI | `memory/Sens_wiki/CLAUDE.md` § 五 |
| 「待確認」類詞放進機械掃描：放寬版 40 筆以上命中只有 2 筆真違規 | 2026-07-30 實測（舊版維度 6） |
| 規範卡描述禁令本身被掃成違規：舊 grep 的 `[!question]` 命中 8 筆全是描述句 | 2026-11-04 新舊腳本對照 |
| 把業務概念詞判為欄位簡寫：7 處「收款條件」被要求正名為「收款條件備註」 | 2026-08-18 [[稽核誤判記錄]] § 二（維度 14） |
| 規則正本改了，規範卡卡尾稽核維度表沒跟上，下一張卡被舊標準判違規 | 2026-08-18 source 分工語意改版漏三張表（維度 12 第 2 項） |
