---
type: open-question
module:
  - <中文 module，見 [[wiki-schema]] § 二>
tags:
  - 領域/<領域名>   # 必填，可多值；判定依 [[business-domain-taxonomy]]（mode A 依此查佇列）
oq-id: <前綴>-<NNN>
status: open
priority: high | medium | low
audience: internal | external   # 判斷問句「誰能回答」，判定規則見 oq-manage skill
raised-at: {{date}}   # Obsidian 插入自動帶入；AI 複製起手時手填今日日期
raised-by: <誰提出（人名／協作階段／skill 名）>
source-link: <識別到此問題的出處：對話／卡／spec 路徑>
related-vault:
  - "[[<相關卡>]]"
related-oq:
  - "[[<相關 OQ 全檔名>]]"   # 禁別名、禁短名（別名的 | 會截斷表格且易斷鏈）
related-change:
  - <change 名>              # 承接此問題的 OpenSpec change；不需要時刪除整個欄位
expected-resolution-at: YYYY-MM-DD   # external 必填（預期確認時點）；internal 建議填
answered-at: YYYY-MM-DD              # 拍板時填
answered-by: <拍板者>                 # 拍板時填
notion-url: <推送後回填>             # audience=external 推送 Notion 後填
---

# <前綴>-<NNN> <問題簡述>

## 問題描述

<這個問題卡在哪：現況怎麼寫、缺什麼或與什麼衝突、為什麼不拍板就走不下去。矛盾型問題並列矛盾兩方的出處，並註明是既有正本矛盾或本次討論產生>

## 待解答

- [ ] <一句話的可回答問句；拍板後打勾並在同行接「→ 結論一句或見決議」>

## 候選方案（選用；有兩案以上時填，僅一條路時整段刪除）

- **A（<方案短名>）**：<這條路怎麼走> ；<代價或風險>
- **B（<方案短名>）**：<同上>

<不受影響項：裁決任一方向皆不動的部分，明列出來縮小裁決壓力>
<裁決後要同步的位置：逐處寫清楚（wiki 卡以 [[<卡名>]]、實作規格以段落名）>

## 部分拍板（選用；已定一部分、其餘仍待裁決時填，status 維持 open）

- <已定的部分＋拍板日期與拍板者>
- <仍待裁決的部分>

## 決議（拍板時補；未拍板前整段不留）

<結論一句話講清楚採哪案＋理由（為什麼這案的營運語意站得住、被否決的那案哪裡不成立）。附拍板日期與拍板者>

落地去處：<決議改了哪些正本卡，逐卡 [[<卡名>]]；無需落地則寫明「無需落地（現況即定案）」>

<!-- 起手提醒（填完刪除本註解）：撰寫規則與稽核維度見 08-open-questions/規範 - OQ（一卡一議題／範圍宣告／檔名序號／段落紀律）；去重與封存流程、audience 判定見 .claude/skills/oq-manage/SKILL.md；合規樣貌對照 08-open-questions/範例 - OQ；共用治理（流程／停下鐵則／紀律）見 00-meta/卡片撰寫共用規範 -->
