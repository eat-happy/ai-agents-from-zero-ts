from pathlib import Path
import re
py=ts=real=0
for p in Path('book').rglob('*.md'):
    t=p.read_text(encoding='utf-8')
    py += len(re.findall(r'```python', t))
    ts += len(re.findall(r'```typescript', t))
    real += t.count('Real TypeScript from repo')
    if '```python' in t:
        print('PY', p)
print({'python':py,'typescript':ts,'real':real})
t=Path('book/projects/shop-query/6-MySQL、Embedding与日志管理.md').read_text(encoding='utf-8')
print('OpenAIEmbeddings', 'OpenAIEmbeddings' in t)
print('HuggingFaceEndpoint', 'HuggingFaceEndpointEmbeddings' in t)
print('recommended section', 'TypeScript 可运行示例' in t)
print('manager class', 'class EmbeddingClientManager' in t)
i=t.find('```typescript')
print(t[i:i+300] if i>=0 else 'no ts fence')
