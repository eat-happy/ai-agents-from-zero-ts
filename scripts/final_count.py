import re
from pathlib import Path
py=ts=defn=0
for f in Path('book').rglob('*.md'):
 t=f.read_text(encoding='utf-8')
 py+=t.count('```python')
 ts+=t.count('```typescript')
 defn+=len(re.findall(r'(?m)^\s*(?:async\s+)?def\s+', t))
print({'python_fences':py,'typescript_fences':ts,'def_lines':defn})
