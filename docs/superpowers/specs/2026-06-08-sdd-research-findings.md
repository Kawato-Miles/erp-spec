# SDD 最佳實踐研究發現（階段 1 產出）

- 日期：2026-06-08
- 來源：sdd-research workflow（Run ID wf_bab601a0-345，9 個 Sonnet agent，4 面向 fan-out + 對抗式查證）
- 狀態：待 gate 1 確認
- 用途：階段 3 改善藍圖的研究基準

---

## 核心發現

四面向收斂出一個共同根因：**最大風險不在「框架選錯」，而在「強制機制缺位」**——規則靠人遵守而非機械擋關。具體：

- OpenSpec 歸檔合併採**需求層取代式語義**：兩個並行 change 改到同一條需求時，後歸檔者直接覆寫前者並**靜默丟掉 scenario**（官方 parallel-merge-plan.md 自陳）。這是「漏改」痛點的機制級根因。
- 本庫同時有 11 個並行 change，其中 5 個觸及 order-management（4504 行）、4 個觸及 print-item 域——正是上述失效模式的高發溫床。
- 本地實測三項落地缺口：CLAUDE.md 已達 448 行（超出宜遵從區間）、doc-audit 只稽核「索引覆蓋」而不檢查規格 vs Prototype 漂移或跨檔矛盾、漂移偵測未接 commit/PR 硬閘門。

**四條最低風險、可立即落地的改善主軸：**
1. 並行 change 序列化紀律——觸及同一 spec 者先 archive+sync 再開下一個，archive 時顯式指定主 spec 名收斂碎片。
2. 把對齊從「archive 後人工」前移為「變更當下、低摩擦（兩分鐘內可修）」的閘門，並把更新規格納入完成定義。
3. 用克隆／連結 linter 機械化執行既有「單一正本鐵則」與「跨層引用方向」，把靠人遵守的規則變成可阻擋 merge 的檢查。
4. 抽出 10–15 條真正不可協商的鐵則放 CLAUDE.md always-on 段，其餘流程／路由／觸發矩陣下放 skill，以對抗指令過載。

---

## 面向一：規格顆粒度與模組化

| 最佳實踐（holds） | 可信度 | 對 OpenSpec 適用性 |
|---|---|---|
| 切分維度採 SRP 本質：因相同理由（同一 actor／業務職能）改變者聚在一起。ERP 應按「誰會要求改這段規則」（業務角色／領域）劃 spec 邊界，而非按技術層或資料表。 | 高（Robert C. Martin 一手原文） | 高。本庫已按領域分檔，方向正確。actor 軸用於診斷既有交叉引用是否切錯線。屬指導原理非機械規則。 |
| 按業務領域（bounded context）切分，每模組高內聚低耦合、對外只透過明確契約、內部狀態私有。 | 高（Kamil Grzybek + Kapferer/SummerSoC 2020 兩獨立源） | 中高。用「高內聚低耦合」診斷既有跨 spec 引用；order-management 4504 行若承載多個可各自演進的子領域，是抽出子 context 的候選訊號。 |
| 兩端極端都要避免：God spec（多責任邊界不清）與過度拆分（該一起演進的拆成大量緊耦合小檔＝分散式單體）。 | 高（arXiv 1908.04101 微服務反模式學術分類） | 中高。納入 audit 觀察指標：拆後若多份 spec 永遠一起改即切錯線、退回合併。對巨檔先判定是「真實商業複雜度」還是「該拆未拆」。 |

**不採用（對抗式查證剔除）：**
- 「split if AND／10 分鐘可理解性」三條切分判準——僅出自單一未背書 gist，且「10 分鐘」誤植官方原意（官方只確認 kebab-case 命名）。
- 「50+ specs 後應引入巢狀路徑」門檻——issue 提案者個人斷言、未合併，且官方確認手動巢狀會使 list/validate/sync 失效；本庫 spec 數遠未到此規模。

---

## 面向二：一致性與防漂移

| 最佳實踐（holds） | 可信度 | 對 OpenSpec 適用性 |
|---|---|---|
| 規格內部矛盾最大來源是複製貼上冗餘（requirement clones）——同規則重述多處、改一處即生矛盾。堅守單一正本＋交叉引用取代複製。 | 高（ICSE 2010 同行評審頂會，28 份規格/8667 頁實測；arc42 一手） | 高。直接命中本庫「單一正本鐵則」。order-management 4504 行、state-machines 1415 行是克隆偵測最該掃的長檔。 |
| 跨檔引用必須有自動連結檢查（連結／錨點），標題改名後的錨點失效尤其常漏；PR 時跑、違規擋 merge。 | 高（GitLab 官方 + 本地 memory 卡證實連結斷裂為反覆問題） | 高。本庫已記載「改標題斷聯」痛點，跨層引用方向已是鐵則但靠人遵守，可寫成 lint 機械驗。 |
| 並行 change 紀律：一個 change 一個邏輯單位；多 change 觸同一 spec 時先 archive+sync 其一再開下一個；verify 後才 archive。 | 高（OpenSpec 官方 workflows.md + 本地實證 11 並行） | 最高。零工具成本純流程約束，最直接對症漏改。 |
| 規格與實作同步當硬驗證：定期「重建測試」（僅憑規格能否重建並通過既有測試），重建不出的缺口即漂移點。 | 中高（Augment 具名作者 + InfoQ 互證；本地 42 支 e2e 可試點） | 中高。可對單模組做「規格重建推演」試點，受 e2e 覆蓋率制約，定位為抽查。 |
| 規格版本控管採 ADR 式「不可變＋取代鏈」：已接受決策不就地改寫，新增一筆標 supersedes 並雙向連結。 | 強（Azure WAF / AWS / joelparkerhenderson 三源互證） | 高。契合本庫「收斂本體不疊加歷史」與 archive 歷史層。落地在執行一致性而非新增機制。 |

**不採用：** 規格嚴謹度三級模型具體數字（單一廠商）、機械檢查可追溯矩陣強主張（延伸子項證據弱）、自動矛盾偵測作主力（前沿、召回僅 60%）、演化相容性「47% 團隊受困擾」數據（查證為偽，須剔除）。

---

## 面向三：工作流程治理

| 最佳實踐（holds） | 可信度 | 對 OpenSpec 適用性 |
|---|---|---|
| OpenSpec 歸檔採需求層取代式語義，後歸檔覆寫前者並靜默丟 scenario。應對：歸檔前從 live spec 重算需求 hash，與儲存 base 不符即中止要求 rebase。 | 高（OpenSpec 官方 parallel-merge-plan.md 一手逐字） | 最高且最急迫。漏改痛點的機制級根因。歸檔前須人工核對 delta 是否與其他 active change 觸同一需求。 |
| 並行衝突正解是設計上讓重疊難發生：propose 階段顯式宣告本 change 觸及哪些 spec／Requirement，把大變更拆小，合併前強制驗證。 | 中高（Augment 廠商 + OpenSpec 官方 concepts.md 中立互證） | 高。在 change proposal 模板加「本 change 觸及的 spec/Requirement 清單」，作為盤點重疊與排序歸檔依據。 |
| 長時間不歸檔的 active change 等同長命分支：審查有效性在 200–400 行後急降，風險推遲到最危險的合併時刻。 | 強（MinimumCD + Atlassian + DORA/trunk-based 共識） | 中高。本庫 11 active 偏多。200–400 行門檻來自程式碼審查情境，套用須本地校準勿照搬。 |
| 對抗漂移把更新規格納入完成定義，在變更當下（PR/commit diff）觸發偵測與低摩擦修補；修一處超過兩分鐘就會被無限延後。 | 中高（InfoQ + Falconer 一手逐字） | 高。本庫 doc-audit + 主動收尾第 10 條是雛形但時點偏後。把對齊前移到 commit/PR 當下、降摩擦到兩分鐘內。 |
| 同領域後續變更應收斂回同一 domain spec；OpenSpec 無自動收斂，須在 archive 被問命名時指定統一主 spec 名。 | 中（維護者背書「指定主 spec 名」部分；其餘操作判準出自提問者） | 中。「archive 時指定主 spec 名收斂碎片」可採（對 print-item 多支 change 有用）；「寬命名」等列為觀察。 |
| 變更影響追蹤需雙向缺口分析：查有需求無下游連結（漏實作/測），也查有下游產物無上游來源（範圍蔓延）。 | 中至弱（底層原則有支撐，但主力引文誤植於 Jama 該頁查無，降級） | 中。採其方向而非權威背書，可從「有下游產物卻無上游需求」一側先做輕量盤點。 |

---

## 面向四：AI/LLM 輔助 SDD

| 最佳實踐（holds） | 可信度 | 對 OpenSpec 適用性 |
|---|---|---|
| 把脈絡當「注意力預算」經營而非塞滿：輸出品質隨輸入長度連續下滑（context rot），目標是最小高訊號 token 集合。 | 強（Anthropic 一手 + 引 Chroma 第三方實證） | 高。order-management 4504 行、CLAUDE.md 448 行都超高訊號密度。撰寫 change 時只載入對應段而非全檔。 |
| progressive disclosure 三層（metadata → 相關時載正文 → 細節按需）；SKILL.md 正文建議 < 500 行，超過拆分。 | 強（Anthropic 兩份一手文件逐字） | 高。超 500 行 SKILL.md 拆細節到 reference；CLAUDE.md 路由矩陣下放 skill 按需載入。 |
| 指令要「恰當高度」與具體可執行，避免硬編碼脆弱邏輯／空泛高層指導；可機械化檢查的事項不寫進指令檔。 | 強（Anthropic 一手 + TianPan/HumanLayer 同向） | 高。CLAUDE.md 願望式語句（「保持精簡」「理性直接」）宜改為可檢規則或移除；可機械檢查的移到 lint/doc-audit。 |
| 規格嚴格分離 What/Why 與 How，並以強制「澄清標記」暴露不確定，完工前清空所有標記。 | 強（GitHub Spec Kit 一手 + Addy Osmani/O'Reilly 互證） | 高。同構於本庫 wiki(What/Why) vs openspec(How)；[NEEDS CLARIFICATION] 等價於 OQ。可補：archive 前必須清零標記的硬閘門。 |
| 多階段流程在階段間設「人類審查＋一致性檢查」閘門，把找矛盾/缺口當持續精煉。 | 中高（Spec Kit 一手 + ALICE/Springer 2024 同行評審） | 中高。把 doc-audit 從 archive 後一次性前移為每階段輕量閘門。5 個 active change 觸 order-management 是矛盾高風險區。 |
| 用 constitution（憲章）承載少數不可協商恆定原則，與會變動的功能規格分離；每條規則須可追溯回來源，找不到來源者為 drift 候選。 | 強（GitHub Spec Kit 一手；普適的是結構而非逐條內容） | 高。CLAUDE.md 448 行已過載。抽 10–15 條鐵則放最前段 always-on，其餘下放 skill；每條附「為何存在」來源，找不到來源者為移除候選。 |
| living-spec 反向風險把關：agent 自動更新規格可能悄悄丟需求/弱化約束，故自動同步限機械性變更，跨領域/改約束須保人類審查。 | 中（Anthropic 一手警告 + Augment 判準互證） | 中高。agent 自動回填 wiki 商業 invariant/角色分權/KPI 須強制人類確認；欄位/狀態同步可放寬。本庫五級分級已對齊。 |
| 對抗過度文件化：未被消費的文件是浪費。原則是 just enough + just-in-time；對 AI 而言 under-specification 更危險，關鍵是精準而非冗長。 | 強（Scott Ambler 一手 + Addy Osmani 一手） | 高。用「最近被誰消費過」檢視 Vault/CLAUDE.md 段落，未被消費者下放。主動收尾十項+多 skill 觸發矩陣是流程過度文件化典型。 |

**不採用：** 「指令 150–200 條天花板、超過 uniform ignore」（誤植 arXiv 2507.11538，一手實測 500 條仍 68% 準確、漸進下滑無此硬閾值；但 CLAUDE.md 過胖致遵從下滑方向仍成立）、「33,000 PR 研究證明對齊流失多於任務描述錯誤」（廠商詮釋加工，非原 preprint 結論）。

---

## 跨面向洞見

1. **顆粒度與一致性是同一枚硬幣**：規格越粗，內部克隆與矛盾越難發現、context rot 越嚴重、agent 漏改機率越高；但過度拆分又製造跨檔不一致。健康區間靠「高內聚低耦合」雙向診斷。
2. **共同根因是強制機制缺位而非框架選錯**：需求層取代式合併、CLAUDE.md 靠人遵從、doc-audit 只查索引、跨層引用靠人遵守——都是「社會約束」。最高槓桿是把它們逐一變成 commit/PR 當下的機械閘門，而非新增更多文件或更長指令。
3. **「單一正本」在三層面同構並可互相加固**：SDD 的 SSOT、ADR 的不可變＋取代鏈、constitution 的鐵則分離。本庫缺的不是觀念，而是「每條規則可追溯來源＋機械驗證＋找不到來源即移除」的執行迴路。
4. **並行治理與脈絡管理彼此放大**：11 個 active change 既是合併覆寫高風險源，也是 agent 載入時的 context 噪音源。序列化歸檔同時降低兩種風險。並行數本身就該當健康指標監控。
5. **「把對齊前移到變更當下」串起工作流治理與 AI 協作**：對齊動作離變更發生點越遠、摩擦越高，越會被無限延後，最終累積成 SpecFall。把 doc-audit 從 archive 後一次性前移為每階段低摩擦閘門，是最務實的單點改善。
