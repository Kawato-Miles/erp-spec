# BRD 架構準則統整 + 商業邏輯卡稽核計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 產出 04-business-logic 的架構準則文件（分類/寫哪/怎麼寫/擴張），並逐張稽核全部 22 張卡片是否對齊新架構。

**Architecture:** Task 1 統整架構準則寫入模板；Task 2 平行稽核全部卡片，產出稽核報告；Task 3 依報告修正。所有不確定項與 Miles 確認，不捏造。

**Tech Stack:** Obsidian Flavored Markdown、Git

---

### Task 1: 統整架構準則文件

**Files:**
- Modify: `memory/Sens_wiki/wiki/erp/04-business-logic/_template-business-logic.md`

架構準則需涵蓋：
- [ ] **Step 1: 目錄結構與分類方式** — 四子目錄的定位、判斷口訣、擴張規則
- [ ] **Step 2: 兩種卡型（A/B）的寫法** — 已有骨架，補充判斷邊界
- [ ] **Step 3: 不收清單 + 下沉規則** — 發現實作細節時的處置 SOP
- [ ] **Step 4: 擴張準則** — 何時拆子目錄、何時新建卡 vs 併入既有卡
- [ ] **Step 5: Commit**

---

### Task 2: 深度稽核全部 22 張卡片

**稽核維度（每張卡逐項檢查）：**

| 維度 | 檢查項 |
|------|--------|
| 1. 分類正確 | 卡片放對子目錄了嗎？ |
| 2. 卡型對齊 | frontmatter type 是 service-blueprint 或 business-rule？ |
| 3. 結構對齊 | 段落結構符合 A 類或 B 類骨架？ |
| 4. 不收內容 | 有無殘留欄位名、計算公式、API 規格、Prototype 引用？ |
| 5. 規則唯一性 | 同一規則是否只寫一次？有無跨卡重複？ |
| 6. 引用完整 | 服務藍圖有引用適用規則？規則卡有引用適用範圍？ |
| 7. 語言紀律 | 禁中英夾雜、禁實作術語當主詞？ |
| 8. 範圍外 | 有寫「範圍外」段嗎？ |

- [ ] **Step 1: 平行派 4 個子代理人，各負責一個子目錄**
  - 服務藍圖/（2 張）
  - 外部約束/（1 張）
  - 領域知識/（5 張）
  - 營運規則/（14 張，含三個子目錄）

- [ ] **Step 2: 彙整稽核報告** — 每張卡的通過/不通過 + 不通過原因

- [ ] **Step 3: 呈報 Miles 確認** — 不確定的項目停下討論

---

### Task 3: 依稽核報告修正卡片

- [ ] **Step 1: 逐張修正不通過的卡片**
- [ ] **Step 2: 每批修正後 Commit**
- [ ] **Step 3: 再跑一次快速驗證確認全部通過**
