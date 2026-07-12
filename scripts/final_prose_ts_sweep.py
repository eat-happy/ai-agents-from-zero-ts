from pathlib import Path
import re

def protect(md):
    fences=[]
    def repl(m):
        fences.append(m.group(0)); return f"@@F{len(fences)-1}@@"
    return re.sub(r'```[\s\S]*?```', repl, md), fences

def restore(md,fences):
    return re.sub(r'@@F(\d+)@@', lambda m: fences[int(m.group(1))], md)

reps=[
    ('jieba', '中文分词（segmentit/nodejieba）'),
    ('init_chat_model', 'ChatOpenAI'),
    ('SQLAlchemy', 'Prisma / Drizzle / TypeORM'),
    ('PyCharm', 'VS Code / WebStorm'),
    ('uv run', 'npx tsx'),
    ('uvicorn', 'node server'),
    ('conda 环境', 'Node 环境'),
    ('api_key=', 'apiKey:'),
]
# .py in prose only -> .ts for path-like tokens
path_py = re.compile(r'([A-Za-z0-9_./-]+)\.py\b')

for f in Path('book').rglob('*.md'):
    md=f.read_text(encoding='utf-8')
    body,fences=protect(md)
    for a,b in reps:
        body=body.replace(a,b)
    body=path_py.sub(r'\1.ts', body)
    # don't touch strategy lines with "机翻 Python"
    out=restore(body,fences)
    if out!=md:
        f.write_text(out, encoding='utf-8')
print('done')
