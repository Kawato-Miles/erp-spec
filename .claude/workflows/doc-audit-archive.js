export const meta = {
  name: 'doc-audit-archive',
  description: 'doc-audit archive 後對抗式找漏 workflow：對單一 change delta fan-out 三類偵測（ADDED sync 殘留 / Data Model section 漏合 / wiki 商業邏輯卡停舊版）+ 對抗式互審找漏 → 待回補清單。維持執行者/稽核者分離：workflow 內只偵測、主對話 agent 在 workflow 外回補。索引層 grep（audit-erp-docs.sh）留 bash 不進此 workflow。',
  whenToUse: 'change archive 後（doc-audit Step 2 的三個語意比對維度）。單一 change delta 範圍、3 偵測 + 1 互審 agent；機械 grep 與實際回補不在此 workflow。',
  phases: [
    { title: '三類偵測', detail: 'ADDED 殘留 / Data Model 漏合 / wiki 停舊版 各一 sonnet agent fan-out', model: 'sonnet' },
    { title: '對抗式互審', detail: '找三類偵測漏掉的殘留 / 漏合 / 停舊版', model: 'sonnet' },
    { title: '彙整', detail: '待回補清單交主對話 agent（workflow 外執行回補）' },
  ],
}

// ---- 入口參數（robust：args 可能以物件或 JSON 字串注入）----
// args: { topic: "本 change 主題關鍵字（如：諮詢取消 / 對帳 / 期次）", changeRef?: "change 名稱或 archive 路徑", affectedSpecs?: ["order-management", ...] }
let _args = args
if (typeof _args === 'string') {
  try { _args = JSON.parse(_args) } catch (e) { _args = {} }
}
const topic = (_args && _args.topic) || ''
const changeRef = (_args && _args.changeRef) || ''
const affectedSpecs = (_args && Array.isArray(_args.affectedSpecs) && _args.affectedSpecs) || []
log(`doc-audit archive 稽核：topic="${topic}"、changeRef="${changeRef}"、affectedSpecs=${JSON.stringify(affectedSpecs)}（args 原始型別：${typeof args}）`)

if (!topic) {
  log('缺 topic。請以 args 傳入 { topic, changeRef?, affectedSpecs? }（topic = 本 change 主題關鍵字）。')
  return { error: 'missing topic', need: '{ topic: string, changeRef?: string, affectedSpecs?: string[] }' }
}

const CATEGORIES = [
  {
    key: 'ADDED-residue',
    name: 'ADDED 修訂既有 Requirement 的 archive sync 殘留',
    detail: 'archive sync 只「新增」## ADDED Requirement、不會「移除」被語意取代的舊 Requirement/Scenario，致新舊兩套描述物理並存矛盾。檢查本 change 每個 ## ADDED Requirement 是否語意上取代了某既有 Requirement/Scenario（尤其跨 spec 的狀態機 / 流程 / 對帳邏輯）；被取代的舊描述是否仍殘留主 spec。殘留則列位置 + 回補方向（對齊新版或標 deprecated）。對應 doc-audit v1.5 維度（converge change 9 CRITICAL 教訓）。',
  },
  {
    key: 'datamodel-sync',
    name: 'Data Model section 漏合',
    detail: 'archive sync 只處理 ## ADDED/MODIFIED Requirements、完全不處理 ## ADDED/MODIFIED Data Model section。檢查 delta specs 是否含 Data Model section；若有，內容是否已合進主 spec 的 ## Data Model 段；漏合則列 + 回補方向（含子實體 cross-link、命名慣例 snake_case/camelCase 對齊、跨 change 同實體多版本整併至單一權威來源）。對應 doc-audit v1.4 維度（align-invoice-line-items CRITICAL 教訓）。',
  },
  {
    key: 'wiki-drift',
    name: 'wiki 商業邏輯卡停留 archive 前舊版',
    detail: 'archive sync 完全不觸及 ERP_Vault（wiki 是商業邏輯正本、openspec 是實作規格）。用 grep 列本主題在 openspec specs 的已定案 Requirement/規則（終態 / 狀態 / 公式）+ ERP_Vault 商業邏輯卡（04-business-logic / 05-entities / 06-state-machines / 07-scenarios / 13-user-stories）；逐條比對 wiki 卡是否停留 archive 前舊版；停舊版則列卡:行 + 回補方向。對應 doc-audit v1.6 維度（converge change 漏 wiki 6 卡教訓）。',
  },
]

const DETECT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string' },
    checkedScope: { type: 'string', description: '實際檢查了哪些 delta / 主 spec / wiki 卡' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          location: { type: 'string', description: '檔:行 或 wiki 卡路徑' },
          issue: { type: 'string' },
          fixDirection: { type: 'string', description: '回補方向，供主對話 agent 在 workflow 外執行' },
          severity: { type: 'string', enum: ['critical', 'warning'] },
        },
        required: ['location', 'issue', 'fixDirection', 'severity'],
      },
    },
  },
  required: ['category', 'checkedScope', 'findings'],
}

const ADV_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    missed: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          location: { type: 'string' },
          issue: { type: 'string' },
          fixDirection: { type: 'string' },
        },
        required: ['category', 'location', 'issue', 'fixDirection'],
      },
    },
    assessment: { type: 'string' },
  },
  required: ['missed', 'assessment'],
}

function detectPrompt(c) {
  return `你是 doc-audit archive 後稽核員（執行者/稽核者分離：只偵測、不回補、不改任何檔案）。

本 change 主題關鍵字：${topic}
${changeRef ? 'change 名稱 / archive 路徑：' + changeRef : '（未指定 changeRef，請依 topic 在 openspec/changes/archive/ 定位本 change delta）'}
${affectedSpecs.length ? '涉及 spec：' + affectedSpecs.join(', ') : ''}

你負責的稽核類別：【${c.name}】
${c.detail}

可用工具：grep（doc-audit SKILL.md「archive 後雙層稽核 grep 片段」）+ Read（delta specs / 主 spec / wiki 卡）。工作目錄 /Users/b-f-03-029/Sens。
對每個發現給：location（檔:行 或 wiki 卡）+ issue（問題）+ fixDirection（回補方向，給主對話 agent 在 workflow 外執行）+ severity（critical / warning）。
只回傳結構化 findings，不修改任何檔案。`
}

function advPrompt(detections) {
  return `你是對抗式審查員。以下是 archive 後三類稽核的 findings。你的任務是找「三類偵測漏掉的」——預設它有遺漏，實讀 delta + 主 spec + wiki 卡查證，挖出未被列出的殘留 / 漏合 / 停舊版。

本 change 主題：${topic}
findings：
${JSON.stringify(detections, null, 2)}

MUST 實際讀檔查證（不只憑 findings 推斷）。對每個漏掉項給 category（ADDED-residue / datamodel-sync / wiki-drift）+ location + issue + fixDirection。
若三類確實完整，missed 回空陣列並在 assessment 說明。只回傳結構化結果。`
}

// ---- Phase 1：fan-out 三類偵測 ----
phase('三類偵測')
const detections = (await parallel(CATEGORIES.map((c) => () =>
  agent(detectPrompt(c), { label: 'detect:' + c.key, phase: '三類偵測', model: 'sonnet', schema: DETECT_SCHEMA })
))).filter(Boolean)

// ---- Phase 2：對抗式互審（需全部 detections，barrier 後跑）----
phase('對抗式互審')
const adversarial = await agent(advPrompt(detections), { label: 'adversarial', phase: '對抗式互審', model: 'sonnet', schema: ADV_SCHEMA })

// ---- Phase 3：彙整 ----
phase('彙整')
const allFindings = detections.flatMap((d) => (d.findings || []).map((f) => ({ ...f, category: d.category })))
const missed = (adversarial && adversarial.missed) || []
const criticalCount = allFindings.filter((f) => f.severity === 'critical').length
log(`偵測 ${allFindings.length} 項待回補（${criticalCount} critical）+ 對抗式補 ${missed.length} 項`)

return {
  topic,
  changeRef,
  findings: allFindings,
  adversarialMissed: missed,
  assessment: adversarial && adversarial.assessment,
  note: '主對話 agent 依此清單在 workflow 外回補（edit 主 spec / wiki 卡）；本 workflow 只偵測不寫檔。索引層 audit-erp-docs.sh 由 doc-audit Step 1 另跑 bash。',
}
