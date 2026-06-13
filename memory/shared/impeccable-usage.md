# impeccable 使用指引（ERP 場景）

> **定位**：印刷業 ERP 系統與線上編輯器使用 impeccable 設計稽核 skill 的選擇決策樹。
> **觸發時機**：(1) 開新 OpenSpec change 前，對既有頁面 / 元件做 UX 評估；(2) Prototype 完成後驗收 review；(3) 需要量化 UX 健康度（Nielsen scoring）時；(4) 設計討論時需要選對 impeccable 指令時。
> **不適用**：日常 commit-level QA（成本太高）、brand register 設計（ERP 屬 product register）。

---

## 1. 依「問題型態」選指令（最常用查找路徑）

| 我現在的狀況 | 用哪個指令 | 關鍵 reference |
|------------|----------|---------------|
| 整體覺得 UX 有問題但說不清哪裡 | `critique` | critique.md + cognitive-load.md + heuristics-scoring.md + personas.md |
| 知道是「資訊架構 / 視覺層次」問題 | `layout` | layout.md + spatial-design.md |
| 知道是「太多東西塞一起、要砍」 | `distill` | distill.md |
| 知道是「文字 / 標籤 / 錯誤訊息」問題 | `clarify` | clarify.md + ux-writing.md |
| 要新做一個 feature，從規劃開始 | `shape`（Discovery Interview → Brief）| shape.md（強制 user gate）|
| 已上線前的最後 pass | `polish` | polish.md（22 點 checklist）|
| 處理 edge case / error / empty / 長文字溢出 | `harden` | harden.md |
| 介面慢 | `optimize` | optimize.md（Core Web Vitals）|
| 空狀態 / 新手不友善 | `onboard` | onboard.md（empty state 模板）|
| 想了解 a11y / 對比 / 色彩理論 | （reference 自助） | color-and-contrast.md + interaction-design.md |
| 從 code 反推 DESIGN.md | `document` | document.md |
| 建立 PRODUCT.md 對齊 | `teach` | teach.md |

## 2. 依「開發階段」對齊 ERP 工作流

| ERP 階段 | 用什麼 | 怎麼用 |
|---------|-------|-------|
| 開新 OpenSpec change 前對既有頁面做評估 | `critique` | 結果作為 change proposal 的 background |
| change proposal 的問題框架 | critique 結果 | 不用跑 `shape`，OpenSpec proposal 替代 |
| Spec 撰寫 | （無對應）| 走 OpenSpec spec-driven 工作流 |
| Prototype 完成後驗收 | `critique` + Lovable | 跑 critique 代替人工 UX review |
| 設計觀念固化進規範 | reference 內容抽進 DESIGN.md | 已執行：cognitive-load / squint test / 跨 Tab 錨點（2026-05-18）|

## 3. ERP 不適用的指令清單

| 指令 | 不適用原因 |
|------|----------|
| `craft` | ERP 本地 `npm run dev` 與 Playwright 端對端測試（e2e）即驗證，Lovable 雲端建置同步部署；OpenSpec change 已是建置前 gate |
| `live` | 需開發伺服器跑視覺變體迭代 |
| `bolder` / `quieter` / `delight` / `overdrive` | brand register 視覺放大器，product register 不追求驚奇 |
| `colorize` | brand register 色彩策略；ERP 走 Figma token |
| `animate` / `motion-design` | ERP motion 150-250ms 已上限，不需放大 |
| `adapt` / `responsive-design` | ERP 桌機限定 |
| `brand` | ERP 非 brand register |
| `codex` | OpenAI Codex 環境特定 |
| `typeset` | ERP 字型階層已強規範（Noto Sans TC + 8 件套 utility class） |
| `extract` | ERP token system 已建（src/index.css）|

## 4. 關鍵執行注意（從首次接入經驗）

1. **CLI `detect` 對 product register 精度差**：首次跑 11/11 false positive（Tab 底線誤判為 rounded card 邊框）→ 對 ERP 跳過 detect，只跑 LLM Design Review
2. **Persona 選擇**：dashboard/admin → 預設用 **Alex（Power User）+ Sam（A11y）**；ERP 可加自定義 persona（印務組長 / 新進業務 / 業務主管 / 業務主管）
3. **跑 critique 前必備**：PRODUCT.md（位於 `sens-erp-prototype/PRODUCT.md`）+ DESIGN.md（位於 `sens-erp-prototype/DESIGN.md`）都已對齊
4. **不適合每次小變更跑**：critique 一次 ~130k tokens，適合 change-level 起點，不適合 commit-level QA
5. **跑完 critique 不直接修 code**：ERP 走 OpenSpec change 工作流，critique 結果作為 proposal 的 background；不直接 invoke `layout` / `distill` / `clarify` 改 code
6. **跳過三視角審查時**：依 Miles 指示，可跳過 senior-pm + ceo-reviewer + erp-consultant，但 critique 已部分覆蓋此角色（提供量化 + 多 persona 視角）

## 5. ERP 既有規範與 impeccable 概念對照

| impeccable 概念 | ERP 對應位置 / 狀態 |
|---------------|-------------------|
| Cognitive Load 8 項檢查 | `sens-erp-prototype/DESIGN.md` §2.2 / §2.3（已採納）|
| Squint Test（眯眼測試）| DESIGN.md §2.2（已採納，視覺層次須 ≥2 維度共建）|
| 跨 Tab 上下文錨點原則 | DESIGN.md §0.1（已採納，三類錨點：A 實體識別 / B 上下文關聯 / C 戰情關鍵數字）|
| Nielsen 10 Heuristics Scoring | 評估時用，不固化進規範（量化工具）|
| Persona Red Flags（5 個固定 persona）| 對應 user-roles spec 角色定義；可派生 ERP 自定義 persona |
| Anti-patterns（OKLCH / fluid type / glassmorphism / nested cards / hero metric）| DESIGN.md §1 視覺規範 + §8 BAN-* 黑名單已涵蓋；ERP 規範優先 |
| Information architecture（cards 不必要、nested cards 禁、everything in container 禁）| DESIGN.md §0.1「info row 統一格式」+「並列比較用 ErpSummaryGrid」已涵蓋 |
| Loading / Error / Empty states 規範 | DESIGN.md §0.2 + `memory/shared/ui-business-rules.md` §3-7 已涵蓋 |
| OKLCH 色彩策略 | **不採用**（ERP 用 Figma HSL token）|
| Fluid typography（clamp 排版）| **不採用**（ERP fixed rem scale）|
| Motion 150-250ms | 跟 ERP 一致（DESIGN.md §2.2）|

## 6. 安裝與設定（一次性）

- 安裝位置：`~/.agents/skills/impeccable/`（global），symlink 至 `~/.claude/skills/impeccable`
- 安裝指令：`npx skills add pbakaus/impeccable -g -y`
- Skill 入口：`impeccable` 出現在 Skill tool 清單
- Setup 前置：
  - `sens-erp-prototype/PRODUCT.md`（必須）— 含 register / users / tone / strategic principles / anti-references
  - `sens-erp-prototype/DESIGN.md`（建議，已有）— 視覺、UX、業務規範
  - register 為 `product`（內部工具 / dashboard / admin tool）

## 7. 首次接入結果（2026-05-18 印件詳情頁 critique）

- Nielsen 24/40（Acceptable，需顯著改進）
- Cognitive Load 5/8 Fail（高負荷 critical）
- Anti-Patterns Fail
- 衍生 3 個 follow-up change：
  - `refactor-print-item-detail-split-platform-routing`（資訊架構 + 拆 routing，P0 級）
  - `align-print-item-detail-design-system-compliance`（純實作對齊，P1 級 quick win）
  - DESIGN.md 補規範（已完成）

完整 critique 報告與行動清單見對應 OpenSpec change 的 proposal.md。

## 8. 相關資源

| 資源 | 位置 |
|------|------|
| impeccable skill 主目錄 | `~/.agents/skills/impeccable/` |
| Reference 完整清單 | `~/.agents/skills/impeccable/reference/` |
| 已讀 / 熟悉的 reference（核心 critique 流程）| critique / cognitive-load / heuristics-scoring / personas / product / layout / spatial-design / clarify / distill / audit / polish / shape / harden / interaction-design / ux-writing / color-and-contrast / onboard / optimize |
| 對 ERP 不深讀的 reference（brand register / 環境不適用）| craft / live / codex / adapt / responsive-design / bolder / quieter / delight / animate / colorize / typeset / overdrive / motion-design / brand / typography / extract / teach / document |
| 線上 docs | https://impeccable.style/docs/（index 樞紐，深度都在個別 reference）|
| Skill 安裝資訊 | https://skills.sh/pbakaus/impeccable |

## 9. 版本記錄

| 日期 | 變更 |
|------|------|
| 2026-05-18 | 初版建立。首次接入 impeccable 後對 ERP 場景的指令選擇決策樹，含 5 維度查找路徑 + ERP 不適用清單 + 安裝設定備忘 |
