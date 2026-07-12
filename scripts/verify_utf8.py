from pathlib import Path
for rel in [
 'book/projects/shop-query/2-项目整体架构与智能体流程.md',
 'book/projects/shop-query/6-MySQL、Embedding与日志管理.md',
 'book/10-LangChain快速上手与HelloWorld.md',
]:
 p=Path(rel)
 t=p.read_text(encoding='utf-8')
 print('====', rel)
 print('has 电商/LangChain chinese', ('电商' in t) or ('快速上手' in t) or ('Embedding' in t))
 print(t[:120].replace('\n',' | '))
 print('python fences', t.count('```python'), 'ts fences', t.count('```typescript'))
