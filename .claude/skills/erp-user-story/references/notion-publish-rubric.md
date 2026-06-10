# Notion 發布品質 Rubric（User Story DB / 資料欄位 DB）

> 仿 [linear-delivery rubric](../../linear-delivery/references/rubric.md) 衍生。推送 Notion 前由 senior-pm 評審（執行者 / 評審分離），任一維度非「通過」即不推送；維度 4 為一票否決。評分尺度：通過 / 部分 / 未通過。
> 早期 Notion 推送（sync-workflow 流程 1 / 1-B）只「整段覆蓋往外」、無品質閘門；本 Rubric 補上，與 linear-delivery 的 /goal + Rubric 對齊。

## /goal 5 元素（每次推送前複製套用）

| 元素 | Notion 推送的填法 |
|------|------------------|
| Outcome | 受 delta 影響的 Notion 條目（User Story / 欄位）全部新增或更新到位，且經 senior-pm 判 4 維度全「通過」 |
| Verification | senior-pm 跑本 Rubric 4 維度 + 對照 Vault 正本（User Story）/ OpenSpec Data Model（欄位）逐條查證 |
| Constraint | 只動 delta 清單內的條目；以 us-id /（資料表＋英文名稱）為唯一鍵 update，禁建重複；不外露 openspec 路徑 |
| Iteration Policy | 未通過 → 修正 → 重新評審（餵完整草稿、不暗示改動）；硬上限 3 輪；卡住問 Miles |
| Error Handling | 正本未定義就停下記 oq-manage mode B + 標「另案處理」，不自編 |

## 4 維度

| # | 維度 | 一句話 | 性質 |
|---|------|--------|------|
| 1 | 正本對齊 | User Story 條目逐欄對齊 Vault 卡；欄位條目逐欄對齊 OpenSpec Data Model | 一般 |
| 2 | delta 完整性 | delta 清單內每條都已處理（新增 / 更新 / 標廢止），無遺漏、無越界改 delta 外條目 | 一般 |
| 3 | 唯一鍵紀律 | 以 us-id /（資料表＋英文名稱）配對，既有 update 不重建；推送後更新 manifest（`memory/erp/notion-publish-manifest.md` 的 Notion URL + 最後推送日，不回寫 wiki 卡）| 一般 |
| 4 | 真實性（不捏造）| 正本未定義的欄位 / 行為不自編填入；過時註記（如「待 ORD-002」）清掉而非沿用 | 一票否決 |

## 具體禁令（評審逐條抓）

- 禁把 active（未 archive）change 的內容推到對外面（只反映 archived change）
- 禁沿用已淘汰機制敘述（回退機制 / 綁 Payment 累計 / PaymentPlan+PlannedInvoice 雙實體 / 舊「收款」用語 / 製作前後門控）
- 禁保留過時 OQ 註記（「待 ORD-xxx」應已解或清掉）
- 禁建重複條目（同 us-id / 同「資料表＋英文名稱」已存在時必 update）
- 正本本身缺定義（如某實體無完整 Data Model 表）→ 推已查證欄位 + 標另案 + 記 oq-manage，禁臆造補欄位

## 演化紀錄

- 2026-06-03 v1.0：建立。自 linear-delivery rubric 衍生，補「正本對齊」與「delta 完整性」兩個 Notion 特有維度。首次套用於訂單模組對外發布迭代（USDB create 19 / update 8、資料欄位 16 LOV）。
