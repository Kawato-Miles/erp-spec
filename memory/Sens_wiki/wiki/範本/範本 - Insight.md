---
type: insight
module:
  - <中文 module，見 [[wiki-schema]] § 二>
tags:
  - 領域/<領域名>   # 可多值；判定依 [[business-domain-taxonomy]]（insight 屬正本卡時必標）
status: open          # open / in-progress / resolved / cancelled
priority: high | medium | low
raised-at: {{date}}
raised-by: vault-insight skill
triggered-by: <manual / oq-accumulation / phase / change-archive / audit / raw>
related-vault:
  - "[[<相關卡>]]"
related-oq:
  - "[[<OQ 全檔名>]]"   # 禁別名、禁短名（別名的 | 會截斷表格且易斷鏈）
related-raw:
  - "[[raw/<檔名>]]"   # 素材含 raw 時填；MUST status=ingested／reviewed，不需要時刪除整個欄位
expected-action-at: YYYY-MM-DD
---

# <現象命名或根因一句話（不用「XX 檢討」式空名）>

## 背景

<觸發情境一段：誰在什麼時機觸發、取了哪個素材集合、為什麼此刻聚這批訊號有意義>

## 觀察

1. <事實一條，句尾附來源（[[來源卡]] 或 wiki/log.md 條目時間）；粗體點出這條事實的名字>
2. <同上>
3. <至少 3 條，每條都能被查證；只寫事實不寫評語>

## 推論

<觀察聚成什麼系統性議題：指出同一根因或替現象命名，1-3 段。MUST NOT 只是觀察的複述——要回答「所以呢」：不處理會在哪裡重演、處理順序為什麼是這樣>

## 下一步建議

1. <誰> 於 <何時> <做什麼> → 預期結果：<可驗證的結果>
2. <同上；四要素缺一即為不可執行的建議>

## 後續更新

<status 變化時追加：日期＋進展一句＋仍未收斂的部分；resolved 後移 `12-insights/_archives/<YYYY>/` 並記 log>

<!-- 起手提醒（填完刪除本註解）：素材範圍、模式識別方式、產出前自查閘門與紅旗清單見 .claude/skills/vault-insight/SKILL.md；合規樣貌對照 12-insights/範例 - Insight；共用治理（流程／停下鐵則／紀律）見 00-meta/卡片撰寫共用規範 -->
