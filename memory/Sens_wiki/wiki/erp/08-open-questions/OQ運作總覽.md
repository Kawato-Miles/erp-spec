---
type: meta
module:
  - 跨模組
related-notion: https://www.notion.so/32c3886511fa808e9754ea1f18248d92
status: active
last-reviewed: 2026-06-13
---

# OQ 運作總覽

OQ 是**待裁決佇列**：每張卡一個待確認的問題，拍板後決議寫回卡、封存出平層。所有操作（查詢／新增／解答封存／遷出／批次整理）統一走 `oq-manage` skill；frontmatter 正本見 [[wiki-schema]] § type=open-question。

## 結構

| 位置 | 放什麼 |
|------|--------|
| `08-open-questions/`（平層） | **只放 status=open**——平層數量＝真實待辦壓力 |
| `08-open-questions/_archives/<拍板年份>/` | 已結案（answered／cancelled）；封存卡只增不改，翻案開新 OQ 引舊卡 |

## 三條軸線

- **狀態**：`open`（待解，含部分拍板）→ `answered`（已拍板，決議段記結論與落地去處）／`cancelled`（不再相關）。嚴格三值，拍板即封存移檔。
- **內外部（audience）**——判斷問句「誰能回答這個問題？」：
  - `internal`＝開發迭代待確認議題（Miles 或內部討論可拍板）
  - `external`＝要與業務單位確認的未知內容（商業層面：現場實務／客戶慣例／計價緣由），彙整推送 Notion Follow-up DB 由外部確認
- **封存**：wiki link 按檔名解析，移目錄不斷鏈；序號取號平層與封存一起算、永不重用。

## 查詢方式（不維護人工清單）

> 本 README 不放 OQ 清單快照——靜態清單必過時。要看現況：

- 某模組未解 OQ：觸發 `oq-manage` mode A（或 grep 平層 `status: open` 依 module 過濾）
- 待外部確認清單：grep 平層 `audience: external`
- 健康狀況（超期／缺欄位／違規）：`vault-audit` 維度 8 或 `oq-manage` mode E

## Notion 同步策略

- Notion [Follow-up DB](https://www.notion.so/32c3886511fa808e9754ea1f18248d92) 為**對外確認版**（audience=external 專用）；Vault 永遠是正本
- 推送由 Miles 觸發，skill 不主動推；推送後回填該卡 frontmatter `notion-url`

## 相關文件

- `.claude/skills/oq-manage/SKILL.md` — 操作正本（五 mode）
- [[wiki-schema]] § type=open-question — frontmatter 正本
- [[erp_index]] — 分層體系中 OQ 的位置
