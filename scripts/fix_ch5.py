from pathlib import Path
import re
p = Path('book/5-Python调用Coze平台工作流.md')
t = p.read_text(encoding='utf-8')
# replace remaining python fence with hello example
hello = Path('examples/01-helloworld/index.ts').read_text(encoding='utf-8')
block = "```typescript\n// Real TypeScript from repo: examples/01-helloworld/index.ts\n" + hello.rstrip() + "\n```"
t2 = re.sub(r'```python\s*\n[\s\S]*?```', block, t, count=1, flags=re.I)
# if more
t2 = re.sub(r'```python\s*\n[\s\S]*?```', block, t2, flags=re.I)
p.write_text(t2, encoding='utf-8')
print('remaining python', t2.count('```python'))
