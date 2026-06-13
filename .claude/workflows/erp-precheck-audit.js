export const meta = {
  name: 'erp-precheck-audit',
  description: 'ERP 規劃前 know-how 稽核 fan-out：依領域並行稽核（6 領域 × 6 卡類型雙軸）+ schema 結構化輸出 + 對抗式互審找漏 + 彙整修補清單。對應 erp-planning-pre-check skill 的 Step 3，維持「執行者/稽核者分離」（workflow 內 agent 為稽核者，主對話 agent 為修補者）。',
  whenToUse: '規劃 ERP 功能前、跨 ≥2 領域稽核時。單模組局部變動用 skill 既有單 agent 即可，不需此 workflow。',
  phases: [
    { title: '雙軸稽核', detail: '每領域一個 sonnet 稽核 agent 跑 6 卡類型矩陣（N/M/K）', model: 'sonnet' },
    { title: '對抗式互審', detail: '每領域一個 sonnet agent 試圖找第一輪漏掉的缺漏', model: 'sonnet' },
    { title: '彙整', detail: 'reduce 成統一量化矩陣 + 待修補清單 + OQ 清單 + wiki 回補清單' },
  ],
}

// ---- 入口參數（robust：Workflow args 可能以物件或 JSON 字串注入）----
// args: { topic: "議題描述（如：補收 OA 執行條件）", domains: ["L1.6 Billing & Cash", "L1.2 Order Management"] }
// 領域依 business-domain-taxonomy § 二 觸發詞 mapping 判定（由 skill Step 1 或協調者帶入）。
let _args = args
if (typeof _args === 'string') {
  try { _args = JSON.parse(_args) } catch (e) { _args = {} }
}
const topic = (_args && _args.topic) || ''
const domains = (_args && Array.isArray(_args.domains) && _args.domains) || []
log(`入口參數：topic="${topic}"、domains=${JSON.stringify(domains)}（args 原始型別：${typeof args}）`)

if (!topic || domains.length === 0) {
  log('缺少入口參數。請以 args 傳入 {topic, domains:[...]}；domains 依 business-domain-taxonomy § 二觸發詞 mapping 判定（單次 ≤ 2-3 領域，§七 Token exhaustion 反模式）。')
  return { error: 'missing args', need: '{ topic: string, domains: string[] }' }
}
if (domains.length > 3) {
  log(`警告：傳入 ${domains.length} 個領域，超過框架「單次 ≤ 2-3 領域」紀律（§七 Token exhaustion）。仍會執行，但建議拆次稽核。`)
}

// ---- 結構化輸出 schema（驗證在 tool-call 層，比 prose JSON 可靠）----
const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    domain: { type: 'string' },
    loadedCards: { type: 'array', items: { type: 'string' }, description: '本次實際載入的 Vault 卡路徑' },
    matrix: {
      type: 'array',
      description: '6 卡類型雙軸矩陣，每格 N/M/K 三數字',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          cardType: { type: 'string', enum: ['角色', '實體', '流程', '業務情境', '業務邏輯', '法規'] },
          covered: { type: 'integer', description: '已涵蓋 N' },
          toFix: { type: 'integer', description: '待修補 M' },
          oq: { type: 'integer', description: '待確認 OQ K' },
        },
        required: ['cardType', 'covered', 'toFix', 'oq'],
      },
    },
    gaps: {
      type: 'array',
      description: '待修補細項（修補既有卡，禁新建抽象卡）',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          cardType: { type: 'string' },
          desc: { type: 'string' },
          targetCard: { type: 'string', description: '應 edit 補入的既有卡路徑' },
        },
        required: ['cardType', 'desc', 'targetCard'],
      },
    },
    oqCandidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string', description: 'BI-/ORD-/AR- 等系列建議編號' }, topic: { type: 'string' } },
        required: ['id', 'topic'],
      },
    },
    relatedEntities: { type: 'array', items: { type: 'string' }, description: '連帶矩陣影響的實體清單' },
    wikiCards: { type: 'array', items: { type: 'string' }, description: '本次設計定案後將被改寫的 wiki 商業邏輯卡（pre-check 不修、交棒 archive 回補）' },
  },
  required: ['domain', 'loadedCards', 'matrix', 'gaps', 'oqCandidates', 'relatedEntities', 'wikiCards'],
}

const GAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    missedGaps: {
      type: 'array',
      description: '第一輪稽核漏掉的缺漏（未稽核的角度 / 未識別的連帶 / 未列的 OQ）',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { angle: { type: 'string' }, desc: { type: 'string' }, targetCard: { type: 'string' } },
        required: ['angle', 'desc', 'targetCard'],
      },
    },
    missedOQ: { type: 'array', items: { type: 'string' } },
    assessment: { type: 'string', description: '一句話總評第一輪稽核的覆蓋完整度' },
  },
  required: ['missedGaps', 'missedOQ', 'assessment'],
}

function auditPrompt(domain) {
  return `你是 ERP 規劃前 know-how 稽核員（執行者/稽核者分離：你只稽核、不修補）。

議題：「${topic}」
本次稽核領域：${domain}

## MUST 執行
1. 先讀 memory/Sens_wiki/wiki/erp/00-meta/business-domain-taxonomy.md 確認此領域邊界與所屬卡。
2. 依領域載入 memory/Sens_wiki/wiki/erp/ 對應卡：04-business-logic（商業邏輯正本）/ 05-entities / 06-state-machines / 07-scenarios / 03-roles，並讀跨領域共用層（02-domain glossary / 01-products）。
3. 對此領域 × 6 卡類型（角色 / 實體 / 流程 / 業務情境 / 業務邏輯 / 法規）逐格稽核，每格給「已涵蓋 N / 待修補 M / 待確認 OQ K」三個明確整數（禁「大致 OK」非量化結論）。
4. 業務情境卡類型 MUST 檢查變體判定（接力型 / 能力型 / 排程型）是否正確、步驟判準是否為可觀測業務結果。
5. 業務邏輯卡類型 MUST 檢查連帶矩陣（連帶實體 / 跨模組影響）。
6. 待修補項 MUST 指向「應 edit 補入的既有卡路徑」（禁新建抽象卡）。
7. 列出本次設計定案後將被改寫的 wiki 商業邏輯卡（pre-check 不修、交棒 archive 回補）。

只回傳結構化結果，不要修改任何檔案。`
}

function verifyPrompt(audit, domain) {
  return `你是對抗式互審員（adversarial verify）。任務是找出以下「${domain}」領域、議題「${topic}」的規劃前稽核「漏掉了什麼」——預設它有遺漏，主動挑漏。

第一輪稽核結果：
${JSON.stringify(audit, null, 2)}

## MUST 執行
1. 實際讀對應 Vault 卡查證（memory/Sens_wiki/wiki/erp/ 對應領域），不可只憑稽核結果推斷。
2. 找出第一輪「未稽核到的角度」「未識別的連帶影響」「未列的 OQ」「該 edit 卻沒列的既有卡」。
3. 每個漏掉項指向 targetCard。
4. 若第一輪確實完整，missedGaps 回空陣列並在 assessment 說明。

只回傳結構化補充，不要修改任何檔案。`
}

// ---- Phase 1+2：每領域獨立走「稽核 → 對抗式互審」（pipeline 串流，無 barrier）----
const perDomain = await pipeline(
  domains,
  (domain) => agent(auditPrompt(domain), { label: `audit:${domain}`, phase: '雙軸稽核', model: 'sonnet', schema: AUDIT_SCHEMA }),
  (audit, domain) => {
    if (!audit) return null
    return agent(verifyPrompt(audit, domain), { label: `verify:${domain}`, phase: '對抗式互審', model: 'sonnet', schema: GAP_SCHEMA })
      .then((gaps) => ({ domain, audit, adversarial: gaps }))
  }
)

// ---- Phase 3：彙整 reduce ----
phase('彙整')
const clean = perDomain.filter(Boolean)
const allOQ = clean.flatMap((d) => (d.audit.oqCandidates || []).map((o) => ({ ...o, domain: d.domain })))
const allGaps = clean.flatMap((d) => [
  ...(d.audit.gaps || []).map((g) => ({ ...g, domain: d.domain, source: '稽核' })),
  ...((d.adversarial && d.adversarial.missedGaps) || []).map((g) => ({ cardType: g.angle, desc: g.desc, targetCard: g.targetCard, domain: d.domain, source: '對抗式互審' })),
])
const allWikiCards = [...new Set(clean.flatMap((d) => d.audit.wikiCards || []))]
const allEntities = [...new Set(clean.flatMap((d) => d.audit.relatedEntities || []))]

log(`稽核完成：${clean.length} 領域、待修補 ${allGaps.length} 項、OQ 候選 ${allOQ.length} 個、wiki 回補卡 ${allWikiCards.length} 張。`)

return {
  topic,
  domainsAudited: clean.map((d) => d.domain),
  matrices: clean.map((d) => ({ domain: d.domain, matrix: d.audit.matrix, loadedCards: d.audit.loadedCards })),
  gapsToFix: allGaps,
  oqCandidates: allOQ,
  relatedEntities: allEntities,
  wikiCardsToBackfill: allWikiCards,
  adversarialAssessments: clean.map((d) => ({ domain: d.domain, assessment: d.adversarial && d.adversarial.assessment })),
  note: '主對話 agent 依此結果跑 Step 4 修補（edit 既有卡 + 標 OQ）+ Step 5 閉環驗證；wiki 商業邏輯卡待設計定案後回補（不在 pre-check 修）。',
}
