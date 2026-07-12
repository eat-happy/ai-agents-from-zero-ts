from pathlib import Path
import re
n=0
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    o=t.replace('// TypeScript 轨道 · 真实代码来自仓库：', '// Real TypeScript from repo: ')
    if o!=t:
        f.write_text(o, encoding='utf-8')
        n+=1
print('files normalized', n)

# final strict report
total=real=junk=py=0
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    py += t.count('```python')
    for m in re.finditer(r'```typescript\s*\n([\s\S]*?)```', t):
        total += 1
        body=m.group(1)
        if re.search(r'Real TypeScript from repo:|// examples/|// book/cases-|// apps/shop-query-agent/', body):
            real += 1
        if re.search(r'(?m)^\s*from\s+\S+\s+import\s+|^\s*(?:async\s+)?def\s+\w+\s*\(|constructor\s*\(\s*self|\bself\.|new\s+new\s+|__name__\s*==|aembed_query|HuggingFaceEndpointEmbeddings|langchain_huggingface|^\s*print\s*\(|\[TS-PORT\] Auto-migrated', body):
            junk += 1
            print('JUNK', f, t[:m.start()].count('\n')+1)
print({'python_fences':py,'ts_fences':total,'real_ts_fences':real,'junk_code_fences':junk,'coverage': f'{real}/{total}'})
