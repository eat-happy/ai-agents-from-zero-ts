from pathlib import Path
import re
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    for m in re.finditer(r'```typescript\s*\n([\s\S]*?)```', t):
        body=m.group(1)
        if not re.search(r'Real TypeScript from repo:|// examples/|// book/cases-|// apps/shop-query-agent/', body):
            line=t[:m.start()].count('\n')+1
            print(f.as_posix(), line)
            print(body[:300])
            print('---')
