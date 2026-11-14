#!/usr/bin/env bash
# 票 42 實測乙：畫面細節機械檢查
# 用法：check-B.sh <檔案…>
# 輸出：每筆命中一行「檢查項 | 檔案:行號 | 命中的那一行」，最後附各檢查項命中數。
# 規則來源：票 42 Answer 的「禁止清單草稿」與 erp Designs.md（§3、§4、§8）。
# 註解行（// 、/* */、{/* */}）不檢查。
# 狀態標籤的顏色若由 *_META 表提供，循 import 追到來源檔，在來源檔的表內檢查，並標明「來源」。
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "用法：check-B.sh <檔案…>" >&2
  exit 2
fi

exec python3 -I - "$@" <<'PY'
import os
import re
import sys
from collections import OrderedDict

files = sys.argv[1:]

TYPE_SCALE = {12, 14, 16, 20, 24}          # Designs.md §4 Type scale
LOADED_WEIGHTS = {400, 500, 700}           # Designs.md §4 載入
PALETTE = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green',
           'cyan', 'blue', 'geekblue', 'purple', 'pink', 'yellow']
PALETTE_RE = re.compile(r"""['"](%s)['"]""" % '|'.join(PALETTE))
TIP_LIMIT = 20                             # 提示泡泡或欄位說明的字數上限（任務書指定）
LONG_LIMIT = 30                            # 長畫面文字（輔助判讀「業務規則全文」）

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
])

out = []

def hit(check, path, lineno, text, note=''):
    CHECKS[check] += 1
    t = text.strip()
    if note:
        t = t + '    ← ' + note
    out.append(f'{check} | {path}:{lineno} | {t}')

# ── 註解遮罩：回傳每行「去掉註解後的程式碼」 ──
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
                    # 吃掉 JSX 註解的收尾 }
                    if i < len(s) and s[i] == '}':
                        i += 1
                continue
            # 字串內不判註解
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
    # JSX 文字：「>」之後、含中文、不含標籤與大括號的片段（排除箭頭函式的 =>）
    for m in re.finditer(r'(?<!=)>([^<>{}]*[\u3400-\u9fff][^<>{}]*)', code):
        yield m.group(1)
    # 整行都是 JSX 文字（跨行段落的中間行）：含中文、不含引號、等號、括號
    stripped = code.strip()
    if CJK_RE.search(stripped) and not re.search(r"""['"`=<>{}()]""", stripped):
        yield stripped

TIP_PROP_OPEN = re.compile(r'\b(tooltip|description|help|extra|alertMessage)\s*=\s*\{')
TIP_PROP_INLINE = re.compile(r"""\b(tooltip|description|help|extra|alertMessage)\s*=\s*["'`]""")
TOOLTIP_TITLE = re.compile(r'<Tooltip\b[^>]*\btitle\s*=')
TIP_VAR_OPEN = re.compile(r'\bconst\s+\w*(Tip|tip|TIP|Notice|NOTICE)\w*\s*=')
ALERT_MSG = re.compile(r'\b(message|description)\s*=\s*\{?\s*["\'`]')

def read_lines(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read().split('\n')

# ── META 表追蹤 ──
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

seen_meta = set()

for path in files:
    raw = read_lines(path)
    code_lines = strip_comments(raw)
    full = '\n'.join(raw)

    tip_ctx = 0          # 提示類 prop 的大括號深度
    tipvar_ctx = False   # 提示類變數宣告中
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
        # 更新提示類 prop 深度
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

        # C09 長畫面文字（字串字面值與 JSX 文字）
        texts = [s for s in literals(code) if CJK_RE.search(s)] + list(jsx_text(code))
        for s in texts:
            L = visible_len(s)
            if L > LONG_LIMIT:
                hit('C09 長畫面文字超過30字', path, n, line, f'{L} 字')

        # C10 手寫間距 px（Designs.md §8 不手寫 px；間距取 theme.spacing）
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
            out.append(f'註記 | {path} | {name} 的來源無法解析，未檢查')
            continue
        key = (src, name, path)
        if key in seen_meta:
            continue
        seen_meta.add(key)
        # 找出本檔引用位置（第一處）
        ref_line = next((i + 1 for i, l in enumerate(raw) if name in l and 'import' not in l and not l.strip().startswith(name + ',')), None)
        for ln, l in meta_block(src, name):
            for m in PALETTE_RE.finditer(l):
                hit('C05 狀態標籤用調色盤色名（來源 META 表）', src, ln, l,
                    f'來源 {name}，由 {path}:{ref_line} 引用；色名 {m.group(1)}')

for line in out:
    print(line)
print('---- 命中數 ----')
for k, v in CHECKS.items():
    print(f'{k}：{v}')
PY
