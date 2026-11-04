# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Sens is a multi-context repo. The root `GLOSSARY-MAP.md` lists every context and the path of its glossary. Glossary files keep their Chinese names under `memory/Sens_wiki/wiki/`, so read the path the map gives; do not look for a `GLOSSARY.md` inside each context.

## Before exploring, read these

- **`GLOSSARY-MAP.md`** at the repo root: it points at one glossary per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. All ADRs are system-wide and live here; there are no context-scoped ADR directories.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Multi-context repo (presence of `GLOSSARY-MAP.md` at the root):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
└── memory/Sens_wiki/wiki/
    ├── erp/ERP 詞彙表.md              ← ERP context glossary
    └── 編輯器/線上編輯器詞彙表.md       ← online editor context glossary
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the glossary. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doc doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
