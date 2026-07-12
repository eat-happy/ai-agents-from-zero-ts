from pathlib import Path
import re
unknown=[]
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    for m in re.finditer(r'```typescript\s*\n([\s\S]*?)```', t):
        body=m.group(1)
        is_real=bool(re.search(r'Real TypeScript from repo:|// examples/|// book/cases-|// apps/shop-query-agent/|// Real TypeScript', body))
        if not is_real:
            line=t[:m.start()].count('\n')+1
            first=body.strip().splitlines()[:3]
            unknown.append((f.as_posix(), line, first))
print('unknown', len(unknown))
for u in unknown[:40]:
    print(u[0], u[1], u[2])
