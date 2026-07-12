from pathlib import Path
import re
left=[]
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    prose=re.sub(r'```[\s\S]*?```','',t)
    for i,line in enumerate(prose.splitlines(),1):
        if 'Python' in line and '机翻 Python' not in line and '原教程（Python' not in line:
            left.append(f'{f.as_posix()}:{i}: {line.strip()[:150]}')
print('remaining non-banner Python lines', len(left))
for x in left[:40]:
    print(x)
