from pathlib import Path
import re

def protect(md):
    fences=[]
    def repl(m):
        fences.append(m.group(0)); return f"@@F{len(fences)-1}@@"
    return re.sub(r'```[\s\S]*?```', repl, md), fences

def restore(md, fences):
    return re.sub(r'@@F(\d+)@@', lambda m: fences[int(m.group(1))], md)

extra = [
    (r'(?<![A-Za-z])\.py\b', '.ts'),
    (r'FastAPI', 'Next.js / Hono / Fastify'),
    (r'SQLAlchemy', 'Prisma / Drizzle / TypeORM'),
    (r'init_chat_model', 'ChatOpenAI'),
    (r'PyCharm', 'VS Code / WebStorm'),
    (r'\bvenv\b', 'Node 环境'),
    (r'\bconda\b', 'nvm / 包管理环境'),
    (r'\bpip\b', 'npm'),
    (r'\buv run\b', 'npx tsx'),
    (r'uvicorn', 'node server'),
    (r'jieba', '中文分词（segmentit/nodejieba）'),
    (r'api_key=', 'apiKey:'),
    (r'base_url=', 'baseURL:'),
    # Chinese leftovers
    (r'Python 侧', 'TypeScript 侧'),
    (r'Python 写法', 'TypeScript 写法'),
    (r'Python API', 'TypeScript / Node API'),
    (r'Python SDK', 'TypeScript SDK'),
    (r'原 Python', '原教程（Python 版）'),
    (r'对应 Python', '对应 TypeScript'),
]

touched=0
for f in Path('book').rglob('*.md'):
    md=f.read_text(encoding='utf-8')
    body, fences = protect(md)
    lines=[]
    for line in body.splitlines(True):
        if '不再使用机翻 Python' in line or '机翻 Python' in line:
            lines.append(line)
            continue
        l=line
        for a,b in extra:
            l=re.sub(a,b,l)
        # remaining bare Python except strategy banners
        if 'TypeScript 轨道' not in l and '机翻' not in l:
            l=re.sub(r'(?<![A-Za-z])Python(?![A-Za-z])', 'TypeScript', l)
        lines.append(l)
    out=restore(''.join(lines), fences)
    # chapter title renames
    out=out.replace('# 第 4 章 Python', '# 第 4 章 TypeScript / Node.js')
    out=out.replace('# 第 5 章 Python', '# 第 5 章 TypeScript / Node.js')
    out=out.replace('FastAPI入门', 'API 与 Next.js/Hono 入门')
    out=out.replace('FastAPI 入门', 'API 与 Next.js/Hono 入门')
    if out!=md:
        f.write_text(out, encoding='utf-8')
        touched+=1
print('touched', touched)
