#!/usr/bin/env python3
"""遷移工具：把卡頭 source 每筆改成只留出處指標（G18）。用法：python3 source_pointer.py <卡...>
- 「拍板（…路徑…）：內容」只留括號；「拍板：內容」只留到「拍板」
- 「同上／同 grill」換成前一筆出現過的紀錄檔路徑
- 括號內「主題名 grill，路徑」只留路徑；去掉「Sens 」前綴
輸出每張卡改了幾筆；改完請人工抽查，不自動提交。"""
import re, sys

def convert(item, last):
    m = re.search(r'(memory/erp/[^\s，、）)"]+)', item)
    head = re.split(r'[）)]\s*[：:]', item)[0]
    if head != item:
        head += '）'
    else:
        head = re.sub(r'^((?:Miles )?[\d～\-]+[^：:"]*?(?:拍板|確認|裁決)[^：:"]*?)[：:].*$', r'\1', head)
        head = re.sub(r'^(change \S+ grill\.md [^：:]*?)[：:].*$', r'\1', head)
    if re.search(r'同上|同 ?grill', head) and last:
        head = re.sub(r'（(?:同上|同) ?grill', f'（{last}', head)
    head = head.replace('Sens memory/', 'memory/')
    head = re.sub(r'（[^（）]*?grill[^（）]*?，(memory/[^）]+)）', r'（\1）', head)
    return head, (m.group(1) if m else last)

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    end = s.index('\n---', 4)
    fm, body, out, insrc, last, n = s[:end], s[end:], [], False, None, 0
    for l in fm.split('\n'):
        if l.startswith('source:'):
            insrc = True; out.append(l); continue
        if insrc and not l.startswith('  - '):
            insrc = False
        if insrc:
            item = l[4:].strip().strip('"')
            new, last = convert(item, last)
            n += new != item
            out.append(f'  - "{new}"')
        else:
            out.append(l)
    open(p, 'w', encoding='utf-8').write('\n'.join(out) + body)
    print(f'{p}: 改 {n} 筆')
