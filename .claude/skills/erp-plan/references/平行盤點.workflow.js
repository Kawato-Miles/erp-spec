export const meta = {
  name: 'erp-plan-parallel-precheck',
  description: 'erp-plan 平行盤點：每個領域一個盤點者，配一個找漏者；彙整成 precheck.md 各段的素材。',
  whenToUse: '議題涉及兩個領域以上時，由 erp-plan 以 scriptPath 執行。單一領域派一個子代理即可。',
  phases: [
    { title: '盤點', detail: '每個領域一個盤點者，依 erp-plan 的 SKILL.md 與盤點方法.md 回傳' },
    { title: '找漏', detail: '每個領域一個找漏者，讀卡查證第一輪漏掉的卡、缺口與 OQ' },
    { title: '彙整', detail: '合併各領域結果，交主對話存 precheck.md' },
  ],
}

// 參數：{ topic, domains, model, effort }
// domains 用 business-domain-taxonomy 的領域 tag 值，例：["生產執行", "履約與售後"]。
// model 與 effort 的預設值只寫在 erp-plan 的 SKILL.md 限制段，本檔不設預設。
let a = args
if (typeof a === 'string') {
  try { a = JSON.parse(a) } catch (e) { a = {} }
}
a = a || {}
const topic = a.topic || ''
const domains = Array.isArray(a.domains) ? a.domains : []
const { model = '', effort = '' } = a
log(`參數：topic="${topic}"、domains=${JSON.stringify(domains)}、model=${model}、effort=${effort}`)

if (!topic || domains.length === 0 || !model || !effort) {
  log('缺參數。topic、domains、model、effort 都要傳；model 與 effort 照 erp-plan SKILL.md 限制段的預設值。')
  return { error: 'missing args', need: '{ topic: string, domains: string[], model: string, effort: string }' }
}

const READ = `先讀下列檔：
- /Users/b-f-03-029/.claude/output-styles/ste100-pm.md 與 /Users/b-f-03-029/Sens/memory/shared/non-business-terms.md（句法兩檔，回傳文字照它寫）
- .claude/skills/erp-plan/SKILL.md 與 .claude/skills/erp-plan/references/盤點方法.md（依其產出段落回傳）
- .claude/skills/erp-plan/references/調研判斷.md（調研建議欄照它判）
不改任何檔。`

const STR = { type: 'string' }
const STRS = { type: 'array', items: STR }
const obj = (properties, required) => ({ type: 'object', additionalProperties: false, properties, required })

const AUDIT_SCHEMA = obj({
  domain: STR,
  loadedCards: { ...STRS, description: '實際載入的卡名' },
  overviewCard: { ...STR, description: '資料結構總覽卡名；沒有寫「無」' },
  matrix: {
    type: 'array',
    items: obj({
      cardType: { type: 'string', enum: ['角色', '實體', '流程', '業務情境', '業務邏輯', '法規'] },
      covered: { type: 'integer', description: '已涵蓋 N' }, toFix: { type: 'integer', description: '待修補 M' }, oq: { type: 'integer', description: '待確認 OQ K' },
    }, ['cardType', 'covered', 'toFix', 'oq']),
  },
  gaps: {
    type: 'array',
    description: '現況缺口，分類照盤點方法.md § 二',
    items: obj({
      card: STR,
      desc: STR,
      category: { type: 'string', enum: ['現況缺漏', '現況錯誤', '未決', '已宣告延後'] },
    }, ['card', 'desc', 'category']),
  },
  openOQ: { type: 'array', items: obj({ id: STR, topic: STR }, ['id', 'topic']), description: '既有未決 OQ' },
  newOQ: { ...STRS, description: '建議新開的 OQ 議題，一句一條；編號由 oq-manage 給' },
  linkage: obj({ source: { ...STR, description: '連帶矩陣卡名；沒有寫「本領域無連帶矩陣」' }, entities: STRS }, ['source', 'entities']),
  wikiCards: { type: 'array', description: '寫規劃單前須更新的卡', items: obj({ card: STR, change: STR }, ['card', 'change']) },
  research: obj({ recommend: { type: 'string', enum: ['要', '不要'] }, reason: STR, topic: STR, questions: STRS },
    ['recommend', 'reason', 'topic', 'questions']),
}, ['domain', 'loadedCards', 'overviewCard', 'matrix', 'gaps', 'openOQ', 'newOQ', 'linkage', 'wikiCards', 'research'])

const MISS_SCHEMA = obj({
  missedGaps: { type: 'array', items: obj({ card: STR, desc: STR }, ['card', 'desc']) },
  missedWikiCards: { type: 'array', items: obj({ card: STR, change: STR }, ['card', 'change']) },
  missedOQ: STRS,
  researchDissent: { ...STR, description: '不同意調研建議時寫理由；同意寫空字串' },
  assessment: { ...STR, description: '一句話：第一輪漏了什麼，或為何判定沒漏' },
}, ['missedGaps', 'missedWikiCards', 'missedOQ', 'researchDissent', 'assessment'])

const auditPrompt = (domain) => `${READ}

議題：${topic}
你負責的領域：${domain}。只盤這個領域與「領域/全域」的卡。
依讀到的檔回傳盤點結果。`

const missPrompt = (domain, audit) => `${READ}

議題：${topic}；領域：${domain}。
下面是第一輪盤點結果。預設它有遺漏。回卡上讀原文查證，找出漏掉的缺口、寫規劃單前須更新的卡、OQ。
第一輪確實完整時，各陣列回空，並在 assessment 說明查過哪些卡。

${JSON.stringify(audit, null, 2)}`

const perDomain = await pipeline(
  domains,
  (domain) => agent(auditPrompt(domain), { label: `盤點:${domain}`, phase: '盤點', model, effort, schema: AUDIT_SCHEMA }),
  (audit, domain) => {
    if (!audit) return null
    return agent(missPrompt(domain, audit), { label: `找漏:${domain}`, phase: '找漏', model, effort, schema: MISS_SCHEMA })
      .then((miss) => ({ domain, audit, miss }))
  }
)

phase('彙整')
const done = perDomain.filter(Boolean)
const dropped = domains.filter((d) => !done.some((x) => x.domain === d))
if (dropped.length) log(`下列領域沒有回傳結果，彙整未含：${dropped.join('、')}`)

const uniq = (xs) => [...new Set(xs)]
const gaps = done.flatMap((d) => [
  ...d.audit.gaps.map((g) => ({ ...g, domain: d.domain, from: '盤點' })),
  ...((d.miss && d.miss.missedGaps) || []).map((g) => ({ ...g, category: '待主對話分類', domain: d.domain, from: '找漏' })),
])
const wikiCards = done.flatMap((d) => [
  ...d.audit.wikiCards.map((w) => ({ ...w, domain: d.domain, from: '盤點' })),
  ...((d.miss && d.miss.missedWikiCards) || []).map((w) => ({ ...w, domain: d.domain, from: '找漏' })),
])

log(`完成 ${done.length} 個領域；缺口 ${gaps.length} 項；寫規劃單前須更新的卡 ${uniq(wikiCards.map((w) => w.card)).length} 張。`)

return {
  topic,
  domains: done.map((d) => ({
    domain: d.domain,
    loadedCards: d.audit.loadedCards,
    overviewCard: d.audit.overviewCard,
    matrix: d.audit.matrix,
    linkage: d.audit.linkage,
    research: d.audit.research,
    researchDissent: d.miss ? d.miss.researchDissent : '找漏者未回傳',
    assessment: d.miss ? d.miss.assessment : '找漏者未回傳',
  })),
  droppedDomains: dropped,
  gaps,
  openOQ: done.flatMap((d) => d.audit.openOQ.map((o) => ({ ...o, domain: d.domain }))),
  newOQ: uniq(done.flatMap((d) => [...d.audit.newOQ, ...((d.miss && d.miss.missedOQ) || [])])),
  wikiCards,
  note: '主對話依此存 precheck.md；現況缺口經 Miles 確認後轉 wiki-amend，新 OQ 走 oq-manage mode B。',
}
