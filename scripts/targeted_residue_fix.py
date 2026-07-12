from pathlib import Path
import re

# Targeted cleanup for remaining high-signal residue
for f in Path('book').rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    o = t

    def clean_fence(m):
        body = m.group(1)
        # drop leftover pure python imports
        body = re.sub(r'(?m)^from\s+\S+\s+import\s+.+\n?', '', body)
        body = re.sub(r'(?m)^import\s+[a-zA-Z_][\w\.]*\s*\n?', '', body)
        # self leftovers
        body = body.replace('self.', 'this.')
        body = re.sub(r'function\s*\(self\)', '()', body)
        body = re.sub(r'function\s*\(self,\s*', '(', body)
        body = re.sub(r'async function\s*\(self\)', 'async ()', body)
        body = re.sub(r'async function\s*\(self,\s*', 'async (', body)
        # main guard
        body = re.sub(r'if\s*\(.*__name__.*__main__.*\)\s*\{?', 'if (require.main === module || import.meta.url.endsWith(process.argv[1] || "")) {', body)
        # py slice
        body = re.sub(r'(\w+)\[:(\d+)\]', r'\1.slice(0, \2)', body)
        # return {"a": b} simple
        body = re.sub(r'return\s*\{\s*"([A-Za-z_][\w]*)"\s*:', r'return { \1:', body)
        return '```typescript\n' + body + '\n```'

    o = re.sub(r'```typescript\s*\n([\s\S]*?)```', clean_fence, o)
    if o != t:
        f.write_text(o, encoding='utf-8')

# verify ch6 snippet contains real TS and Chinese
p = Path('book/projects/shop-query/6-MySQL、Embedding与日志管理.md')
t = p.read_text(encoding='utf-8')
assert 'export class EmbeddingClientManager' in t
assert '封装 Embedding' in t
assert 'from langchain_huggingface' not in t
assert 'HuggingFaceEndpointEmbeddings' not in t
print('ch6 assertions ok')

# residual audit (narrow)
from collections import Counter
c=Counter()
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    for name,pat in {
        'from_import': r'(?m)^from\s+\S+\s+import\s+',
        'constructor_self': r'constructor\(self',
        'function_self': r'function\s+\w+\(self|\(self\)',
        'huggingface': r'langchain_huggingface|HuggingFaceEndpointEmbeddings|aembed_query',
        'if_name_main': r'__name__\s*==',
        'python_fence': r'```python',
    }.items():
        c[name]+=len(re.findall(pat,t))
print(dict(c))
