from pathlib import Path
import re
from collections import defaultdict

# Show remaining Python mentions contexts (prose only)
hits=defaultdict(list)
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    prose=re.sub(r'```[\s\S]*?```','',t)
    for m in re.finditer(r'Python', prose):
        line=prose[:m.start()].count('\n')+1
        sn=prose.splitlines()[line-1].strip()[:140]
        hits[f.as_posix()].append((line,sn))
print('files with Python word', len(hits))
for f, arr in list(hits.items())[:15]:
    print('\n', f)
    for line,sn in arr[:3]:
        print(f'  {line}: {sn}')
