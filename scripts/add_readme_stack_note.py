from pathlib import Path
p=Path('book/README.md')
t=p.read_text(encoding='utf-8')
note='''
> ## TypeScript / Node 生态主线
>
> 本译本学习与实现主线：
> - 运行时：Node.js 20+
> - 语言：TypeScript
> - 框架：LangChain.js / LangGraph.js / OpenAI Agents SDK
> - Web 交付：Next.js Route Handler（电商问数 Demo）
> - 校验：Zod
> - 包管理：npm / pnpm
>
> 原教程中的 Python / FastAPI / Pydantic / SQLAlchemy 等，在正文中已映射到上述 TS 生态对应物。
'''
if 'TypeScript / Node 生态主线' not in t:
    if t.lstrip().startswith('#'):
        # after first heading line
        lines=t.splitlines(True)
        # find first heading end
        for i,l in enumerate(lines):
            if l.startswith('#'):
                lines.insert(i+1, note+'\n')
                break
        t=''.join(lines)
    else:
        t=note+'\n'+t
    p.write_text(t, encoding='utf-8')
    print('book README note added')
else:
    print('book README note exists')
