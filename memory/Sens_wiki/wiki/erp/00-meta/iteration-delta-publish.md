---
title: "迭代差異發布 SOP"
type: meta
status: 有效
last-reviewed: 2026-06-03
---

# 迭代差異發布 SOP（對外資料只更新受影響項）

> 解決「整段覆蓋往外」的問題：發布前先算出「自上次發布以來，哪些對外條目受 archived change 影響」，只更新受影響項，而非把當前完整狀態整段覆蓋出去。

## 一、邊界鐵則

- **只反映 archived change**：`openspec/changes/archive/` 內的 change 才算「已發布到 main spec」。active change（`openspec/changes/<name>/`，未 archive）不納入對外發布——它們尚未進 main spec。
- **三邊基準時點各自記錄**：每個對外面有自己的「上次發布時點」（見 § 三）。
- **正本方向不變**：User Story 正本 = Vault `13-user-stories/`；欄位 / 狀態正本 = OpenSpec Data Model / state-machines。發布前正本須先到位（內部對齊先於對外推送）。

## 二、delta 計算（四步）

1. **定上次發布時點**：
   - Notion User Story DB → 取對應 Vault 卡 frontmatter `notion-published-at` 最舊值；若全空 → 查 Notion DB 實際缺哪些 us-id（編碼）。
   - Notion 資料欄位 DB → 比對 DB `資料表` LOV 與 OpenSpec Data Model 實體清單的差集。
   - Linear → 取該 project 上次 linear-delivery 交付日期。**注意中台 vs 業務平台 project 分流**：核心 + 狀態機變動的正本在中台 project，業務平台為視圖層僅沿用。
2. **撈該時點後 archived change**：`ls openspec/changes/archive/` 篩日期 ≥ 基準。
3. **逐 change 抽 delta spec**：讀 `specs/<capability>/spec.md` 的 ADDED/MODIFIED/REMOVED/RENAMED，對映到對外條目（user story / 欄位 / Linear issue）。change → 卡對映後做覆蓋檢查（每個 change 至少對映一張卡；無對映者揭露為覆蓋缺口，補卡或記 OQ）。
4. **產 delta 清單**：每個對外面一張表 `條目 | 動作（新增 / 更新 / 標廢止）| 來源 change | 正本位置`。

## 三、路由（delta 清單 → 推送管道 + 品質閘門）

| 對外面 | 推送管道 | 品質閘門 |
|--------|---------|---------|
| Notion User Story DB | [[erp-user-story]] mode B | [notion-publish-rubric](../../../../.claude/skills/erp-user-story/references/notion-publish-rubric.md)（senior-pm 評審）|
| Notion 資料欄位 DB | [[sync-workflow]] 流程 1-C | notion-publish-rubric |
| Linear project / issue | [[linear-delivery]] | linear-delivery rubric |

## 四、回填追蹤（強制，修正當前失血）

推送成功後 MUST 回填正本的追蹤欄位（user story 卡 `notion-published-at` / `notion-page-url`）。未回填則下次 delta 偵測失準——當前所有訂單 user story 卡 `notion-published-at` 為空即此問題（推過卻沒回填，delta 偵測只能靠查 Notion 缺項兜底）。

## 五、正本缺定義的處理

delta 計算發現正本本身缺定義（如某實體無完整 Data Model 表、某錨點 heading 未確認）→ 推已查證部分 + 標另案 + 觸發 oq-manage mode B 開 OQ，禁臆造補齊（對齊 notion-publish-rubric 維度 4）。

## 關聯區域

- [[sync-workflow]] — 三邊同步總流程（本 SOP 為其 delta 偵測前置；流程 1-C 即依本 SOP）
- [[vault-charter]] — 單一正本規則
- [[scope-boundary]] — 收 / 不收邊界
