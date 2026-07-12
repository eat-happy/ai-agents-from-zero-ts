from pathlib import Path
import re
p=Path('book/15-LCEL与链式调用.md')
t=p.read_text(encoding='utf-8')
t2=t.replace('def debug_console.log(x):', 'function debug(x) {\n  console.log(x)\n}')
# also any remaining def at line start
t2=re.sub(r'(?m)^\s*def\s+', 'function ', t2)
t2=re.sub(r'(?m)^\s*async def\s+', 'async function ', t2)
p.write_text(t2, encoding='utf-8')
print('fixed lcel')
