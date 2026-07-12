import re
from pathlib import Path
from collections import defaultdict

hits = defaultdict(list)
for f in Path('book').rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    for i, line in enumerate(t.splitlines(), 1):
        if re.search(r'(?m)^from\s+\S+\s+import\s+', line):
            hits['from'].append(f'{f}:{i}:{line.strip()[:120]}')
        if re.search(r'function\s+\w+\(self|\(self\)', line):
            hits['self'].append(f'{f}:{i}:{line.strip()[:120]}')
        if '__name__' in line:
            hits['main'].append(f'{f}:{i}:{line.strip()[:120]}')
for k,v in hits.items():
    print('===', k, len(v))
    for x in v[:10]:
        print(x)
