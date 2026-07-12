import re
from pathlib import Path
c=0
py=0
ts=0
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    c += len(re.findall(r'(?m)^\s*(?:async\s+)?def\s+', t))
    py += t.count('```python')
    ts += t.count('```typescript')
print('remaining_def', c)
print('python_fences', py)
print('typescript_fences', ts)
# show remaining def if any
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    for i,line in enumerate(t.splitlines(),1):
        if re.match(r'^\s*(?:async\s+)?def\s+', line):
            print(f'{f}:{i}:{line.strip()[:140]}')
