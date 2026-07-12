#!/usr/bin/env python3
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path('.')
BOOK = ROOT / 'book'

MAP = {
  '10-LangChain': ['examples/01-helloworld/index.ts', 'book/cases-langchain/01-helloworld/LangChainV1.0.ts'],
  '11-Model-I-O': ['examples/02-models-io/index.ts', 'book/cases-langchain/04-prompt/invoke/LLM_Invoke_Stream_Batch.ts'],
  '12-Ollama': ['examples/01-helloworld/index.ts'],
  '13-': ['examples/03-prompt-template/index.ts', 'book/cases-langchain/04-prompt/prompt_templates/PromptTemplate_FromTemplate.ts', 'book/cases-langchain/04-prompt/chat_prompt_template/ChatPromptTemplate_Constructor.ts'],
  '14-': ['examples/04-output-parser/index.ts', 'book/cases-langchain/05_parser/StructuredOutput_Zod.ts'],
  '15-LCEL': ['examples/05-lcel-chain/index.ts', 'book/cases-langchain/06-lcel/LCEL_RunnableSequenceDemo.ts'],
  '16-': ['examples/06-memory/index.ts', 'book/cases-langchain/07-memory/Memory_InMemoryChatMessageHistory.ts'],
  '17-Tools': ['examples/07-tools/index.ts', 'book/cases-langchain/08-tools/Tool_AddNumberTool.ts', 'book/cases-langchain/08-tools/LLMQueryWeatherDemo.ts'],
  '18-': ['examples/08-embedding-rag/index.ts', 'book/cases-langchain/10-rag/EmbeddingRagLLM.ts'],
  '19-RAG': ['examples/08-embedding-rag/index.ts', 'book/cases-langchain/10-rag/EmbeddingRagLLM.ts'],
  '20-MCP': ['examples/14-mcp/server.ts', 'examples/14-mcp/client-agent.ts'],
  '21-Agent': ['examples/09-agent/index.ts', 'book/cases-langchain/12-agent/AgentReact.ts'],
  '22-LangGraph': ['examples/10-langgraph-helloworld/index.ts', 'book/cases-langgraph/01-helloworld/LangGraphHello.ts', 'book/cases-langgraph/01-helloworld/LangGraphLLM.ts'],
  '23-LangGraph': ['book/cases-langgraph/03-state/DefState.ts', 'book/cases-langgraph/03-state/reducers/StateReducer_AddMessages.ts', 'book/cases-langgraph/03-state/reducers/StateReducer_Custom.ts'],
  '24-LangGraph': ['book/cases-langgraph/04-node/DefNode.ts', 'book/cases-langgraph/05-edge/Edge_Conditional.ts', 'book/cases-langgraph/05-edge/Edge_ConditionalV2.ts'],
  '25-LangGraph': ['book/cases-langgraph/07-senior/streaming/StreamGraphState.ts', 'book/cases-langgraph/07-senior/state_persistence/MemoryPersistence.ts', 'book/cases-langgraph/07-senior/subgraph/SubGraphSimple.ts', 'book/cases-langgraph/07-senior/time_travel/TimeTravel.ts'],
  '26-LangGraph': ['examples/12-langgraph-multi-agent/index.ts', 'book/cases-langgraph/08-multi_agent/SupervisorV1.0.ts'],
  '4-Python调用Dify': ['examples/01-helloworld/index.ts'],
  '5-Python调用Coze': ['examples/01-helloworld/index.ts'],
  'projects/shop-query/6-': ['examples/08-embedding-rag/index.ts', 'apps/shop-query-agent/lib/metadata.ts'],
  'projects/shop-query/': ['apps/shop-query-agent/lib/agent.ts', 'apps/shop-query-agent/lib/metadata.ts', 'apps/shop-query-agent/lib/sql-engine.ts', 'apps/shop-query-agent/lib/warehouse.ts', 'apps/shop-query-agent/app/api/query/route.ts'],
  'projects/deep-research/': ['examples/12-langgraph-multi-agent/index.ts', 'examples/11-langgraph-tool-agent/index.ts', 'examples/09-agent/index.ts', 'examples/14-mcp/client-agent.ts'],
}

def pick_sources(rel: str, name: str) -> list[str]:
    keyspace = rel + ' ' + name
    for k, v in MAP.items():
        if k in keyspace or k in rel or name.startswith(k):
            xs = [s for s in v if (ROOT/s).exists()]
            if xs:
                return xs
    return [s for s in ['examples/01-helloworld/index.ts'] if (ROOT/s).exists()]

def load(p: str) -> str:
    t = (ROOT/p).read_text(encoding='utf-8')
    if len(t) > 10000:
        t = t[:10000] + "\n// ... truncated; see full file in repository ...\n"
    return t.rstrip() + "\n"

def process(md: str, sources: list[str]) -> tuple[str, int]:
    codes = [load(s) for s in sources]
    i = 0
    n = 0
    def block(_m=None):
        nonlocal i, n
        src = sources[i % len(sources)]
        code = codes[i % len(codes)]
        i += 1
        n += 1
        return "```typescript\n// Real TypeScript from repo: " + src + "\n" + code + "```"
    out = re.sub(r"```(?:python|py|ipython)\s*\n[\s\S]*?```", lambda m: block(), md, flags=re.I)
    # replace auto junk ts
    def maybe(m):
        body = m.group(1)
        if re.search(r"(?m)^\s*(from\s+\S+\s+import\s+|def\s+|async def\s+|print\(|self\.|__name__|constructor\(self|new new )", body) or "[TS-PORT] Auto-migrated" in body:
            return block()
        return m.group(0)
    out = re.sub(r"```typescript\s*\n([\s\S]*?)```", maybe, out)

    primary = sources[0]
    pcode = codes[0]
    banner = (
        "\n\n<!-- TS-TRACK-BANNER -->\n"
        "> **TypeScript 轨道说明**：中文讲解保留原教程；**代码块使用仓库内真实 TypeScript**（`examples/` / 精校案例 / `apps/shop-query-agent`），"
        "不再使用机翻 Python。\n"
        "> 精校清单：[POLISHED-CASES](POLISHED-CASES.md)\n\n"
    )
    section = (
        "\n## TypeScript 可运行示例（推荐）\n\n"
        f"本章优先对照仓库真实文件：`{primary}`\n\n"
        f"```typescript\n// {primary}\n{pcode}```\n\n"
        f"```bash\nnpx tsx {primary}\n```\n\n"
    )
    if "TypeScript 可运行示例（推荐）" not in out:
        m = re.search(r"^# .+$", out, flags=re.M)
        if m:
            pos = m.end()
            out = out[:pos] + banner + section + out[pos:]
        else:
            out = banner + section + out
    elif "TS-TRACK-BANNER" not in out:
        m = re.search(r"^# .+$", out, flags=re.M)
        if m:
            pos = m.end()
            out = out[:pos] + banner + out[pos:]

    for a,b in [
        ("Python 示例", "TypeScript 示例"),
        ("如下 Python 代码", "如下 TypeScript 代码（见上方真实代码）"),
        ("下面的 Python 代码", "下面的 TypeScript 代码（见上方真实代码）"),
        ("用 Python 实现", "用 TypeScript 实现"),
        ("pip install", "npm install"),
        ("python3 -m ", "npx tsx "),
        ("python -m ", "npx tsx "),
    ]:
        out = out.replace(a,b)
    return out, n

def main():
    touched=0; total=0
    for f in sorted(BOOK.rglob('*.md')):
        if f.name in {'README.md','POLISHED-CASES.md','TS迁移说明.md','_sidebar.md','CONTRIBUTING.md'}:
            continue
        rel = f.relative_to(BOOK).as_posix()
        md = f.read_text(encoding='utf-8')
        # only process if has python or is project/core chapter
        if '```python' not in md and not rel.startswith('projects/') and not re.match(r'^\d', f.name):
            continue
        sources = pick_sources(rel, f.name)
        if not sources:
            continue
        out, n = process(md, sources)
        if out != md:
            f.write_text(out, encoding='utf-8')
            touched += 1
            total += n
            print(f"{n:3d} {rel}")
    py = sum(p.read_text(encoding='utf-8').count('```python') for p in BOOK.rglob('*.md'))
    ts = sum(p.read_text(encoding='utf-8').count('```typescript') for p in BOOK.rglob('*.md'))
    print({'touched':touched,'replaced':total,'python':py,'typescript':ts})

if __name__ == '__main__':
    main()
