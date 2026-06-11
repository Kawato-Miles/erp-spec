---
type: open-question
module:
  - 印前審稿
oq-id: AR-2
status: answered
priority: low
audience: internal
raised-at: 2026-05-21
raised-by: claude-on-task
answered-at: 2026-05-21
answered-by: Miles
source-link: pilot 遷移審稿模組 user story 時識別
related-vault:
  - "[[US-AR-002-設定印件難易度與免審稿]]"
  - "[[US-AR-011-打樣後重新處理稿件]]"
related-oq: []
---

## 決策（2026-05-21 Miles 拍板）

**保留 US-AR-011 為獨立卡**：「打樣後重新處理稿件」業務情境獨立性足夠（打樣後識別稿件問題並重新走審稿流程，與 US-AR-001 主審稿循環的「補件迴圈」場景不同 — 補件迴圈是審稿不通過導致補件；本卡是打樣後才發現問題），應獨立成卡。

Notion 端歷史資料處理：下次 mode C 推送時，將 Notion 原 US-AR-002（打樣後重新處理稿件）條目改編碼為 US-AR-011 並 update；US-AR-002（設定印件難易度與免審稿）保留原條目 update。

---


# AR-2 Notion US-AR-002 編碼重複處理

## 問題

[Notion User Story DB](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d) 內 `US-AR-002` 編碼出現 2 個不同條目：

| 編碼 | 名稱 | 優先度 | 流程 |
|------|------|--------|------|
| US-AR-002 | 設定印件難易度與免審稿 | 中 | 主要流程 |
| US-AR-002 | 打樣後重新處理稿件 | 中 | （未設）|

US-AR-001 的「流程說明」內引用 `US-AR-002` 是指「設定印件難易度與免審稿」這條（從上下文 — 前置設定 + 業務於需求單標註），因此前者為原始 US-AR-002，後者為錯誤編碼。

## 暫定處理（pilot 已執行）

- US-AR-002（設定印件難易度與免審稿）→ Vault `US-AR-002-設定印件難易度與免審稿.md`（保留原編碼）
- US-AR-002（打樣後重新處理稿件）→ Vault `US-AR-011-打樣後重新處理稿件.md`（重新編號為 011）

## 待 Miles 確認

1. 「打樣後重新處理稿件」是否本來就應該獨立為 user story？或它本質上是 US-AR-001 § 業務流程內「補件迴圈」的延伸場景，可併入 US-AR-001 不獨立成卡？
2. 若保留為 US-AR-011，Notion 上原 US-AR-002（打樣後重新處理稿件）條目應如何處理？選項：
   - A：保留 Notion 條目，下次 mode C 推送時改編碼為 US-AR-011 update
   - B：刪除 Notion 重複條目，下次 mode C 推送 US-AR-011 重新 create
   - C：暫不處理 Notion 端，Vault 為內部正本，待 mode C 真正推送時再決定

## 影響

- 影響範圍：僅 Notion 端歷史記錄；Vault 端 pilot 已用 US-AR-011 隔離問題
- 不阻擋 pilot 進度
