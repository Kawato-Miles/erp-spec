#!/usr/bin/env bash
# 票 42 乙方案：畫面機械檢查，第二回修訂版（由第一回 check-B.sh 擴充）
#
# 用法：
#   check-B2.sh <工作樹路徑> <基底提交> [操作名稱清單檔] [ERP 詞彙表路徑]
#
# 輸入：
#   工作樹路徑      erp 程式庫的工作樹根目錄（含 apps/erp/src/app/(prototype)/）
#   基底提交        比對的基準提交；檢查範圍是工作樹相對基底提交改過或新增的 (prototype)/ 內 .js、.jsx 檔
#                   （含尚未提交的改動與未追蹤的新檔）
#   操作名稱清單檔  選用。純文字，每行一個 wiki 實體卡「操作」段的操作名稱。給了才跑 C13。
#                   產生方式（在 Sens 工作樹根目錄執行）：
#                     find memory/Sens_wiki/wiki/erp/05-entities -name '*.md' \
#                       -exec awk -F'|' '/^\| OP-[A-Z]+-[0-9]+ /{gsub(/^ +| +$/,"",$3); print $3}' {} + | sort -u > ops.txt
#   ERP 詞彙表路徑  選用。Sens 的 memory/Sens_wiki/wiki/erp/ERP 詞彙表.md。給了才跑 C14。
#
# 輸出：每筆命中一行「檢查項 | 檔案:行號 | 命中的那一行    ← 註記」，最後附各檢查項命中數與合計。
#   註記含「本次新增」表示該行在基底提交之後新增或改過。
#
# 檢查項：
#   C01–C11  第一回原有，判斷邏輯不變（字級、字重、色碼、調色盤色名、提示字數、灰字、長文字、間距、emoji）
#   C12      同一份改動的畫面文字裡，「編輯／修改／修正／訂正／變更」出現兩種以上時，列出全部命中行
#   C13      按鈕文字、圖示按鈕提示、對話框標題與確認鈕文字中，不在操作名稱清單內的動詞（需操作名稱清單檔）
#   C14      畫面文字用到 ERP 詞彙表的避免用詞（需 ERP 詞彙表）
#
# 規則與門檻值的正本：同資料夾 checklist-B.md。本腳本裡的數值（字數篩選值等）只是篩選用，判定以清單為準。
# 限制：C12 至 C14 用文字比對找畫面文字，不解析程式結構；跨行的按鈕文字只認「開標籤獨佔一行、下一行是文字」的寫法。
# 本腳本只讀檔與執行唯讀的 git 指令（diff、ls-files），不改檔、不連網。
set -euo pipefail

if [ "$#" -lt 2 ] || [ "$#" -gt 4 ]; then
  echo "用法：check-B2.sh <工作樹路徑> <基底提交> [操作名稱清單檔] [ERP 詞彙表路徑]" >&2
  exit 2
fi
WT=$1
BASE=$2
OPS=${3:-}
GLOSS=${4:-}

if [ ! -d "$WT/apps/erp/src/app/(prototype)" ]; then
  echo "找不到 $WT/apps/erp/src/app/(prototype)" >&2
  exit 2
fi
git -C "$WT" rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || { echo "基底提交不存在：$BASE" >&2; exit 2; }
[ -z "$OPS" ] || [ -f "$OPS" ] || { echo "找不到操作名稱清單檔：$OPS" >&2; exit 2; }
[ -z "$GLOSS" ] || [ -f "$GLOSS" ] || { echo "找不到 ERP 詞彙表：$GLOSS" >&2; exit 2; }

exec python3 -I - "$WT" "$BASE" "$OPS" "$GLOSS" <<'PY'
import os
import re
import subprocess
import sys
from collections import OrderedDict

WT, BASE, OPS_PATH, GLOSS_PATH = sys.argv[1:5]
WT = os.path.abspath(WT)
OPS_PATH = os.path.abspath(OPS_PATH) if OPS_PATH else ''
GLOSS_PATH = os.path.abspath(GLOSS_PATH) if GLOSS_PATH else ''
os.chdir(WT)
PROTO = 'apps/erp/src/app/(prototype)'

def git(*args):
    return subprocess.run(['git', '-C', WT] + list(args), check=True,
                          capture_output=True, text=True).stdout

# ── 檢查範圍：相對基底提交改過或新增的檔（含未提交、未追蹤） ──
changed = set(git('diff', '--name-only', '--diff-filter=AMR', BASE, '--', PROTO).split('\n'))
changed |= set(git('ls-files', '--others', '--exclude-standard', '--', PROTO).split('\n'))
files = sorted(f for f in changed if f and re.search(r'\.(js|jsx)$', f) and os.path.isfile(f))

# 每個檔在本次改動新增或改過的行號
added_lines = {}
for f in files:
    s = set()
    tracked = subprocess.run(['git', '-C', WT, 'cat-file', '-e', f'{BASE}:{f}'],
                             capture_output=True).returncode == 0
    if not tracked:
        with open(f, encoding='utf-8') as fh:
            s = set(range(1, fh.read().count('\n') + 2))
    else:
        for m in re.finditer(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@', git('diff', '-U0', BASE, '--', f), re.M):
            start, cnt = int(m.group(1)), int(m.group(2) or 1)
            s.update(range(start, start + cnt))
    added_lines[f] = s

TYPE_SCALE = {12, 14, 16, 20, 24}          # Designs.md §4 Type scale
LOADED_WEIGHTS = {400, 500, 700}           # Designs.md §4 載入
PALETTE = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green',
           'cyan', 'blue', 'geekblue', 'purple', 'pink', 'yellow']
PALETTE_RE = re.compile(r"""['"](%s)['"]""" % '|'.join(PALETTE))
TIP_LIMIT = 20                             # 提示字數篩選值（正本見 checklist-B.md 門檻值表）
LONG_LIMIT = 30                            # 長畫面文字篩選值（同上）

CHECKS = OrderedDict([
    ('C01 手寫字級', 0),
    ('C02 手寫字重', 0),
    ('C03 手寫色碼', 0),
    ('C04 狀態標籤用調色盤色名', 0),
    ('C05 狀態標籤用調色盤色名（來源 META 表）', 0),
    ('C06 提示泡泡或欄位說明超過20字', 0),
    ('C07 輸入框灰字為請輸入或請選擇加欄位名', 0),
    ('C08 圖示按鈕提示超出動作名稱', 0),
    ('C09 長畫面文字超過30字', 0),
    ('C10 手寫間距px', 0),
    ('C11 emoji', 0),
    ('C12 編輯類動詞多種叫法並存', 0),
    ('C13 按鈕與對話框動詞不在操作名稱清單', 0),
    ('C14 用到詞彙表避免用詞', 0),
])

out = []
notes = []

def hit(check, path, lineno, text, note=''):
    CHECKS[check] += 1
    t = text.strip()
    if path in added_lines and lineno in added_lines[path]:
        note = ('本次新增；' + note) if note else '本次新增'
    if note:
        t = t + '    ← ' + note
    out.append(f'{check} | {path}:{lineno} | {t}')

# ── 註解遮罩：回傳每行「去掉註解後的程式碼」（第一回原樣） ──
def strip_comments(lines):
    res = []
    in_block = False
    for line in lines:
        s = line
        code = ''
        i = 0
        while i < len(s):
            if in_block:
                j = s.find('*/', i)
                if j < 0:
                    i = len(s)
                else:
                    in_block = False
                    i = j + 2
                    if i < len(s) and s[i] == '}':
                        i += 1
                continue
            ch = s[i]
            if ch in '\'"`':
                q = ch
                j = i + 1
                while j < len(s) and s[j] != q:
                    if s[j] == '\\':
                        j += 1
                    j += 1
                code += s[i:j + 1]
                i = j + 1
                continue
            if s.startswith('{/*', i):
                in_block = True
                i += 3
                continue
            if s.startswith('/*', i):
                in_block = True
                i += 2
                continue
            if s.startswith('//', i) and not s[max(0, i - 1):i] == ':':
                break
            code += ch
            i += 1
        res.append(code)
    return res

STR_RE = re.compile(r"""'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`""")
CJK_RE = re.compile(r'[㐀-鿿＀-￯　-〿]')

def literals(code):
    for m in STR_RE.finditer(code):
        s = next(g for g in m.groups() if g is not None)
        yield s

def visible_len(s):
    s = re.sub(r'\$\{[^}]*\}', '', s)
    s = re.sub(r'\s+', '', s)
    return len(s)

def jsx_text(code):
    for m in re.finditer(r'(?<!=)>([^<>{}]*[㐀-鿿][^<>{}]*)', code):
        yield m.group(1)
    stripped = code.strip()
    if CJK_RE.search(stripped) and not re.search(r"""['"`=<>{}()]""", stripped):
        yield stripped

def screen_texts(code):
    """畫面文字候選：含中文的字串字面值與 JSX 文字。import 行不算。"""
    if re.match(r'\s*import\b', code):
        return []
    return [s for s in literals(code) if CJK_RE.search(s)] + list(jsx_text(code))

TIP_PROP_OPEN = re.compile(r'\b(tooltip|description|help|extra|alertMessage)\s*=\s*\{')
TIP_PROP_INLINE = re.compile(r"""\b(tooltip|description|help|extra|alertMessage)\s*=\s*["'`]""")
TOOLTIP_TITLE = re.compile(r'<Tooltip\b[^>]*\btitle\s*=')
TIP_VAR_OPEN = re.compile(r'\bconst\s+\w*(Tip|tip|TIP|Notice|NOTICE)\w*\s*=')
ALERT_MSG = re.compile(r'\b(message|description)\s*=\s*\{?\s*["\'`]')

def read_lines(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read().split('\n')

IMPORT_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'([^']+)'", re.S)

def resolve(base, spec):
    if not spec.startswith('.'):
        return None
    p = os.path.normpath(os.path.join(os.path.dirname(base), spec))
    for cand in (p, p + '.js', p + '.jsx', os.path.join(p, 'index.js')):
        if os.path.isfile(cand):
            return cand
    return None

def meta_block(src_path, name):
    lines = read_lines(src_path)
    start = None
    for i, l in enumerate(lines):
        if re.search(r'export\s+const\s+%s\s*=' % re.escape(name), l):
            start = i
            break
    if start is None:
        return []
    block = []
    depth = 0
    for j in range(start, len(lines)):
        l = lines[j]
        block.append((j + 1, l))
        depth += l.count('{') - l.count('}')
        if depth <= 0 and '{' in ''.join(x for _, x in block):
            break
    return block

# ── C13、C14 的輸入 ──
VERBS = sorted(set('''新增 建立 編輯 修改 修正 訂正 變更 更改 調整 刪除 移除 作廢 取消 儲存 送出 提交 確認 確定
核准 退回 駁回 審核 指派 改派 分派 檢視 查看 匯出 匯入 下載 上傳 列印 複製 重開 開立 開始 完成 抵達 點收
結案 申請 撤回 收回 轉交 搬運 報工 派工 拋單 出貨 啟用 停用 關閉 搜尋 重設 返回 分享 加開 補做 回簽 簽收
合併 拆分 標記 設定 選擇 套用 重新 認列 核銷 退款 收款 開始搬運'''.split()), key=len, reverse=True)
CONTROL_VERBS = {'儲存', '取消', '確定', '確認', '關閉', '搜尋', '重設', '返回', '選擇', '套用'}
EDIT_VARIANTS = ['編輯', '修改', '修正', '訂正', '變更']

ops = []
if OPS_PATH:
    with open(OPS_PATH, encoding='utf-8') as fh:
        ops = [l.strip() for l in fh if l.strip()]

def find_verbs(s):
    found, i = [], 0
    while i < len(s):
        for v in VERBS:
            if s.startswith(v, i):
                found.append(v)
                i += len(v)
                break
        else:
            i += 1
    return found

# 操作名稱去掉開頭動詞後的對象名詞（例：編輯轉交單 → 轉交單）
op_nouns = {}
for op in ops:
    vs = [v for v in VERBS if op.startswith(v)]
    if vs:
        noun = op[len(vs[0]):]
        if len(noun) >= 2:
            op_nouns.setdefault(noun, []).append(op)

avoid = []   # (避免用詞, 正式詞條)
if GLOSS_PATH:
    heading = ''
    for l in read_lines(GLOSS_PATH):
        m = re.match(r'###\s+(.+?)\s*$', l)
        if m:
            heading = m.group(1)
        m = re.match(r'_Avoid_\s*[:：]\s*(.+)$', l)
        if m:
            for t in re.split(r'[、，,]', m.group(1)):
                t = re.sub(r'[（(].*?[）)]', '', t).strip()
                if len(t) >= 2:
                    avoid.append((t, heading))

BUTTON_INLINE = re.compile(r'<(\w*Button)\b[^>]*>\s*([^<>{}]*[㐀-鿿][^<>{}]*)')
BUTTON_OPEN_ALONE = re.compile(r'<\w*Button\b[^>]*>\s*$')
TITLE_PROP = re.compile(r"""\b(title|okText|confirmText)\s*[=:]\s*\{?\s*['"`]([^'"`]*[㐀-鿿][^'"`]*)['"`]""")
DIALOG_CTX = re.compile(r'<\w*(Modal|Drawer|Dialog|Popconfirm|Confirm|Tooltip)\w*\b|\b(confirm|Modal\.\w+|modal\.\w+)\s*\(')

seen_meta = set()
edit_hits = []   # (path, lineno, line, variant, text)

for path in files:
    raw = read_lines(path)
    code_lines = strip_comments(raw)
    full = '\n'.join(raw)

    tip_ctx = 0
    tipvar_ctx = False
    button_pending = False
    for idx, code in enumerate(code_lines):
        n = idx + 1
        line = raw[idx]
        if not code.strip():
            continue

        # C01 手寫字級
        for m in re.finditer(r"""font-?[sS]ize\s*:\s*['"]?(\d+)""", code):
            v = int(m.group(1))
            note = '' if v in TYPE_SCALE else f'{v}px 不在五級內'
            hit('C01 手寫字級', path, n, line, note)

        # C02 手寫字重
        for m in re.finditer(r"""font-?[wW]eight\s*:\s*['"]?(\d+|bold|bolder|normal|lighter)""", code):
            v = m.group(1)
            note = ''
            if v.isdigit() and int(v) not in LOADED_WEIGHTS:
                note = f'{v} 不在載入範圍 400／500／700'
            hit('C02 手寫字重', path, n, line, note)

        # C03 手寫色碼
        if any(re.search(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b', s) for s in literals(code)) \
           or re.search(r'\b(rgba?|hsla?)\(', code):
            hit('C03 手寫色碼', path, n, line)

        # C04 狀態標籤用調色盤色名（本檔直接寫）
        for m in PALETTE_RE.finditer(code):
            hit('C04 狀態標籤用調色盤色名', path, n, line, f'色名 {m.group(1)}')

        # C07 輸入框灰字
        if re.search(r"""placeholder\s*[=:]\s*\{?\s*['"`]請(輸入|選擇)""", code):
            hit('C07 輸入框灰字為請輸入或請選擇加欄位名', path, n, line)

        # C06 / C08 提示類文字
        in_tip = tip_ctx > 0 or tipvar_ctx
        is_tooltip_title = bool(TOOLTIP_TITLE.search(code))
        is_inline_prop = bool(TIP_PROP_INLINE.search(code))
        is_alert = bool(ALERT_MSG.search(code)) and ('Alert' in code or 'description' in code)
        if in_tip or is_tooltip_title or is_inline_prop or TIP_PROP_OPEN.search(code) or TIP_VAR_OPEN.search(code) or is_alert:
            for s in literals(code):
                if not CJK_RE.search(s):
                    continue
                L = visible_len(s)
                if L > TIP_LIMIT:
                    hit('C06 提示泡泡或欄位說明超過20字', path, n, line, f'{L} 字')
                if (is_tooltip_title or tipvar_ctx) and re.search(r'[：，；。]', s):
                    hit('C08 圖示按鈕提示超出動作名稱', path, n, line)
        if tip_ctx > 0:
            tip_ctx += code.count('{') - code.count('}')
            if tip_ctx < 0:
                tip_ctx = 0
        else:
            m = TIP_PROP_OPEN.search(code)
            if m:
                rest = code[m.end() - 1:]
                d = rest.count('{') - rest.count('}')
                if d > 0:
                    tip_ctx = d
        if tipvar_ctx:
            if code.rstrip().endswith(';'):
                tipvar_ctx = False
        elif TIP_VAR_OPEN.search(code) and not code.rstrip().endswith(';'):
            tipvar_ctx = True

        # C09 長畫面文字
        texts = screen_texts(code)
        for s in texts:
            L = visible_len(s)
            if L > LONG_LIMIT:
                hit('C09 長畫面文字超過30字', path, n, line, f'{L} 字')

        # C10 手寫間距 px
        spacing_hits = []
        for m in re.finditer(r"""\b(margin|padding)(Top|Bottom|Left|Right|Inline|Block)?\s*:\s*(['"]?)([^,}]+)""", code):
            val = m.group(4)
            if 'theme.' in val:
                continue
            if re.search(r'\b[1-9]\d*', val):
                spacing_hits.append(m.group(0))
        for m in re.finditer(r'\bgap\s*[=:]\s*\{?\s*([1-9]\d*)', code):
            spacing_hits.append(m.group(0))
        for m in re.finditer(r'\bgutter\s*=\s*\{\s*\[?\s*([1-9]\d*)', code):
            spacing_hits.append(m.group(0))
        for m in re.finditer(r'<Space\b[^>]*\bsize\s*=\s*\{\s*([1-9]\d*)', code):
            spacing_hits.append(m.group(0))
        if spacing_hits:
            hit('C10 手寫間距px', path, n, line)

        # C11 emoji
        if re.search('[\U0001F300-\U0001FAFF☀-➿⭐⭕✅❌]', code):
            hit('C11 emoji', path, n, line)

        # C12 收集編輯類動詞（畫面文字內）
        for s in texts:
            for v in EDIT_VARIANTS:
                if v in s:
                    edit_hits.append((path, n, line, v, s.strip()))

        # C13 按鈕、圖示按鈕提示、對話框標題與確認鈕
        if ops:
            labels = []
            for m in BUTTON_INLINE.finditer(code):
                labels.append(('按鈕', m.group(2).strip()))
            if button_pending:
                labels += [('按鈕', s.strip()) for s in jsx_text(code)]
                button_pending = False
            if BUTTON_OPEN_ALONE.search(code):
                button_pending = True
            ctx = '\n'.join(code_lines[max(0, idx - 5):idx + 1])
            for m in TITLE_PROP.finditer(code):
                if m.group(1) != 'title' or DIALOG_CTX.search(ctx):
                    kind = '圖示按鈕提示' if '<Tooltip' in ctx and m.group(1) == 'title' else (
                        '確認鈕' if m.group(1) != 'title' else '對話框標題')
                    labels.append((kind, m.group(2).strip()))
            for kind, label in labels:
                label = re.sub(r'\$\{[^}]*\}', '', label)
                core = re.sub(r'[（(][^）)]*[）)]', '', label)   # 括號內多半是狀態名或補充，不取動詞
                for v in dict.fromkeys(find_verbs(core)):
                    nouns = [nn for nn in op_nouns if nn in label]
                    if nouns:
                        same_obj = [op for nn in nouns for op in op_nouns[nn]]
                        if not any(v in op for op in same_obj):
                            hit('C13 按鈕與對話框動詞不在操作名稱清單', path, n, line,
                                f'{kind}「{label}」的動詞「{v}」；同對象的操作：{"、".join(same_obj)}')
                    elif not any(v in op for op in ops) and v not in CONTROL_VERBS:
                        hit('C13 按鈕與對話框動詞不在操作名稱清單', path, n, line,
                            f'{kind}「{label}」的動詞「{v}」不在任何操作名稱內')

        # C14 避免用詞
        if avoid:
            for s in texts:
                for t, head in avoid:
                    if t in s:
                        hit('C14 用到詞彙表避免用詞', path, n, line, f'「{t}」；正式詞條：{head}')

    # C05 META 表追蹤
    imports = {}
    for m in IMPORT_RE.finditer(full):
        for nm in m.group(1).split(','):
            nm = nm.strip().split(' as ')[0].strip()
            if nm:
                imports[nm] = m.group(2)
    used = set(re.findall(r'\b([A-Z][A-Z0-9_]*_META)\b', full))
    for name in sorted(used):
        if name in imports:
            src = resolve(path, imports[name])
        elif re.search(r'export\s+const\s+%s\s*=|const\s+%s\s*=' % (name, name), full):
            src = path
        else:
            src = None
        if not src:
            notes.append(f'註記 | {path} | {name} 的來源無法解析，未檢查')
            continue
        key = (src, name, path)
        if key in seen_meta:
            continue
        seen_meta.add(key)
        ref_line = next((i + 1 for i, l in enumerate(raw) if name in l and 'import' not in l and not l.strip().startswith(name + ',')), None)
        for ln, l in meta_block(src, name):
            for m in PALETTE_RE.finditer(l):
                hit('C05 狀態標籤用調色盤色名（來源 META 表）', src, ln, l,
                    f'來源 {name}，由 {path}:{ref_line} 引用；色名 {m.group(1)}')

# C12 判定：整份改動出現兩種以上叫法才列出
variants = OrderedDict()
for _, _, _, v, _ in edit_hits:
    variants[v] = variants.get(v, 0) + 1
if len(variants) >= 2:
    seen = set()
    for path, n, line, v, s in edit_hits:
        if (path, n, v) in seen:
            continue
        seen.add((path, n, v))
        legit = [op for op in ops if v in op and op in s]
        note = f'叫法「{v}」'
        if legit:
            note += f'；字串含操作名稱 {"、".join(legit)}'
        hit('C12 編輯類動詞多種叫法並存', path, n, line, note)
dist = '、'.join(f'{k} {v} 處' for k, v in variants.items()) or '無'
notes.append(f'註記 | C12 叫法分布 | {dist}')
if not ops:
    notes.append('註記 | C13 | 未給操作名稱清單檔，未檢查')
if not avoid:
    notes.append('註記 | C14 | 未給 ERP 詞彙表或讀不到避免用詞，未檢查')

print(f'檢查範圍：{WT} 相對 {BASE} 改過或新增的 {len(files)} 個檔')
for f in files:
    print(f'  {f}')
for line in out:
    print(line)
for line in notes:
    print(line)
print('---- 命中數 ----')
for k, v in CHECKS.items():
    print(f'{k}：{v}')
print(f'合計：{sum(CHECKS.values())}')
PY
