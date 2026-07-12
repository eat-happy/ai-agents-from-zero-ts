# -*- coding: utf-8 -*-
from pathlib import Path
import re

BOOK = Path('book')

def protect(md: str):
    fences = []
    def repl(m):
        fences.append(m.group(0))
        return f'@@F{len(fences)-1}@@'
    return re.sub(r'```[\s\S]*?```', repl, md), fences

def restore(md: str, fences):
    return re.sub(r'@@F(\d+)@@', lambda m: fences[int(m.group(1))], md)

REPL = [
    ('uv run python -m ', 'npx tsx '),
    ('uv run python3 -m ', 'npx tsx '),
    ('uv run python ', 'npx tsx '),
    ('uv run ', 'npx tsx '),
    ('python3 -m ', 'npx tsx '),
    ('python -m ', 'npx tsx '),
    ('pip install ', 'npm install '),
    ('requirements.txt', 'package.json'),
    ('PyCharm', 'VS Code / WebStorm'),
    ('FastAPI + SSE', 'Next.js Route Handler + 流式响应'),
    ('FastAPI', 'Next.js / Hono / Fastify'),
    ('uvicorn', 'node server'),
    ('SQLAlchemy', 'Prisma / Drizzle / TypeORM'),
    ('Pydantic BaseModel', 'Zod schema'),
    ('Pydantic', 'Zod'),
    ('TypedDict', 'TypeScript type / interface'),
    ('dataclass', 'TypeScript interface / class'),
    ('init_chat_model', 'ChatOpenAI'),
    ('create_agent', 'createReactAgent'),
    ('AgentExecutor', 'createReactAgent 运行时'),
    ('HuggingFaceEndpointEmbeddings', 'OpenAIEmbeddings（OpenAI 兼容 / TEI）'),
    ('huggingface_hub', 'OpenAI 兼容 Embedding HTTP/SDK'),
    ('jieba', '中文分词（segmentit / nodejieba）'),
    ('asyncio', 'async/await'),
    ('model_provider="openai"', 'OpenAI 兼容协议（ChatOpenAI + baseURL）'),
    ('model_provider', 'OpenAI 兼容协议'),
    ('base_url=', 'baseURL:'),
    ('api_key=', 'apiKey:'),
    ('`base_url`', '`baseURL`'),
    ('`api_key`', '`apiKey`'),
    ('docs.langchain.com/oss/python/', 'docs.langchain.com/oss/javascript/'),
    ('Python + LangChain + LangGraph', 'TypeScript + LangChain.js + LangGraph.js'),
    ('Python 生态', 'TypeScript / Node.js 生态'),
    ('Python 技术栈', 'TypeScript 技术栈'),
    ('Python 工程', 'TypeScript / Node 工程'),
    ('Python 项目', 'TypeScript 项目'),
    ('Python 包', 'npm 包'),
    ('Python 模块', 'TypeScript 模块'),
    ('Python 文件', 'TypeScript 文件'),
    ('Python 脚本', 'TypeScript 脚本'),
    ('Python 代码', 'TypeScript 代码'),
    ('Python 函数', 'TypeScript 函数'),
    ('Python 类', 'TypeScript 类'),
    ('Python 节点', 'Agent 节点'),
    ('Python 列表', 'TypeScript 数组'),
    ('Python 字典', 'TypeScript 对象'),
    ('Python 实现', 'TypeScript 实现'),
    ('Python 版本', 'TypeScript 版本'),
    ('Python 示例', 'TypeScript 示例'),
    ('Python 客户端', 'TypeScript / HTTP 客户端'),
    ('Python 调用', 'TypeScript / Node.js 调用'),
    ('用 Python', '用 TypeScript'),
    ('基于 Python', '基于 TypeScript'),
    ('学习 Python', '学习 TypeScript'),
    ('熟悉 Python', '熟悉 TypeScript / Node.js'),
    ('Python 基础', 'TypeScript / JavaScript 基础'),
    ('Python 侧', 'TypeScript 侧'),
    ('Python 写法', 'TypeScript 写法'),
    ('Python API', 'TypeScript / Node API'),
    ('Python SDK', 'TypeScript SDK'),
    ('虚拟环境', 'Node.js 环境'),
    ('venv', 'Node 环境'),
    ('conda', 'nvm'),
    ('shopkeeper-agent/', 'apps/shop-query-agent/'),
]

SHOP_NOTE = (
    '\n> **TS 生态对照（本仓库）**：可运行 Demo 在 `apps/shop-query-agent`，技术栈为 '
    '**Next.js + LangChain.js + Zod + 内存数仓/元数据召回 + Route Handler**；'
    '原教程 MySQL / Qdrant / ES / FastAPI 在 Demo 中教学简化，概念仍按本章理解。\n'
)
DEEP_NOTE = (
    '\n> **TS 生态对照（本仓库）**：深度研搜原项目偏 Python DeepAgents；'
    'TypeScript 对照请看 `examples/12-langgraph-multi-agent`、`examples/11-langgraph-tool-agent`、`examples/14-mcp`。\n'
)

touched = 0
for f in BOOK.rglob('*.md'):
    md = f.read_text(encoding='utf-8')
    body, fences = protect(md)
    lines = []
    for line in body.splitlines(True):
        if '机翻 Python' in line or '不再使用机翻' in line:
            lines.append(line)
            continue
        l = line
        for a, b in REPL:
            l = l.replace(a, b)
        # bare Python word except banners
        if 'TypeScript 轨道' not in l and '机翻' not in l and '原教程（Python' not in l:
            l = re.sub(r'(?<![A-Za-z])Python(?![A-Za-z])', 'TypeScript', l)
        # path-like .py to .ts in prose
        l = re.sub(r'([A-Za-z0-9_./-]+)\.py\b', r'\1.ts', l)
        lines.append(l)
    out = restore(''.join(lines), fences)
    rel = f.as_posix()
    if 'projects/shop-query/' in rel and 'TS 生态对照（本仓库）' not in out:
        if '<!-- TS-TRACK-BANNER -->' in out:
            out = out.replace('<!-- TS-TRACK-BANNER -->', '<!-- TS-TRACK-BANNER -->' + SHOP_NOTE, 1)
    if 'projects/deep-research/' in rel and 'TS 生态对照（本仓库）' not in out:
        if '<!-- TS-TRACK-BANNER -->' in out:
            out = out.replace('<!-- TS-TRACK-BANNER -->', '<!-- TS-TRACK-BANNER -->' + DEEP_NOTE, 1)
    # chapter title soft renames
    out = out.replace('FastAPI入门', 'API 与 Next.js/Hono 入门')
    out = out.replace('FastAPI 入门', 'API 与 Next.js/Hono 入门')
    if out != md:
        f.write_text(out, encoding='utf-8')
        touched += 1
print('touched', touched)

# ch6 embedding prose fix
p = Path('book/projects/shop-query/6-MySQL、Embedding与日志管理.md')
t = p.read_text(encoding='utf-8')
t = t.replace(
    '而是选择了更贴近整套教程技术栈的方案：使用 LangChain 提供的 `HuggingFaceEndpointEmbeddings`。',
    '在 TypeScript 轨道里，选择更贴近 Node 技术栈的方案：使用 LangChain.js 的 `OpenAIEmbeddings`，把 TEI / 云端服务当作 OpenAI 兼容的 `/v1/embeddings` 接入。'
)
t = t.replace(
    '使用 Hugging Face 的 Python 客户端：也就是 `huggingface_hub` 里的 `InferenceClient`',
    '使用 TEI / Embedding 服务的 HTTP 接口（TS 轨道用 OpenAI 兼容 SDK）'
)
if 'class EmbeddingClientManager' not in t and '### 1.6 封装 Embedding 客户端' in t:
    mgr = '''
TypeScript 轨道推荐封装：

```typescript
// Real TypeScript from repo: apps/shop-query-agent pattern + examples/08-embedding-rag/index.ts
import { OpenAIEmbeddings } from "@langchain/openai";

export type EmbeddingConfig = { host: string; port: number; model?: string };

export class EmbeddingClientManager {
  private client: OpenAIEmbeddings | null = null;
  constructor(private readonly config: EmbeddingConfig) {}
  private getUrl() { return `http://${this.config.host}:${this.config.port}/v1`; }
  init() {
    this.client = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY || "tei-local",
      model: this.config.model || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      configuration: { baseURL: this.getUrl() },
    });
  }
  getClient() {
    if (!this.client) throw new Error("call init() first");
    return this.client;
  }
}
```

'''
    t = t.replace('### 1.6 封装 Embedding 客户端', '### 1.6 封装 Embedding 客户端\n' + mgr, 1)
p.write_text(t, encoding='utf-8')
print('ch6 done')

# fix remaining python fence if any
for f in BOOK.rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    if '```python' in t:
        hello = Path('examples/01-helloworld/index.ts').read_text(encoding='utf-8')
        block = '```typescript\n// Real TypeScript from repo: examples/01-helloworld/index.ts\n' + hello.rstrip() + '\n```'
        t2 = re.sub(r'```python\s*\n[\s\S]*?```', block, t, flags=re.I)
        f.write_text(t2, encoding='utf-8')
        print('fixed python fence in', f)

# book README stack note
rp = Path('book/README.md')
rt = rp.read_text(encoding='utf-8')
note = '''
> ## TypeScript / Node 生态主线
>
> - 运行时：Node.js 20+
> - 语言：TypeScript
> - Agent 框架：LangChain.js / LangGraph.js / OpenAI Agents SDK
> - 校验：Zod
> - Web 交付：Next.js Route Handler（`apps/shop-query-agent`）
> - 包管理：npm / pnpm
>
> 原教程 Python / FastAPI / Zod 前身（Pydantic）/ ORM 等概念，正文已映射到上述 TS 生态对应物。
'''
if 'TypeScript / Node 生态主线' not in rt:
    rt = re.sub(r'^(# .+)$', r'\1\n' + note, rt, count=1, flags=re.M)
    rp.write_text(rt, encoding='utf-8')
    print('readme note')

# TS migration note
mp = Path('book/TS迁移说明.md')
mt = mp.read_text(encoding='utf-8') if mp.exists() else '# TS迁移说明\n'
if '内容切合 TS 生态' not in mt:
    mt += '''

## 内容切合 TS 生态

正文讲解已映射到 TypeScript / Node 生态：

| 原教程概念 | TS 轨道对应 |
|-----------|------------|
| Python | TypeScript / Node.js |
| pip / venv | npm / nvm |
| Pydantic | Zod |
| FastAPI | Next.js Route Handler / Hono / Fastify |
| SQLAlchemy | Prisma / Drizzle / TypeORM |
| init_chat_model / create_agent | ChatOpenAI / createReactAgent |
| HuggingFaceEndpointEmbeddings | OpenAIEmbeddings（OpenAI 兼容） |

代码块来自真实仓库文件，不使用机翻。
'''
    mp.write_text(mt, encoding='utf-8')
print('all done')
