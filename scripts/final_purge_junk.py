from pathlib import Path
import re

# Fix remaining real code residuals
fixes = 0

# 1) shop-query ch9 python shell verification block
p = Path('book/projects/shop-query/9-字段与指标检索能力构建.md')
t = p.read_text(encoding='utf-8')
old = None
# replace the bash heredoc python snippet
pat = re.compile(r"```bash\n(?:uv run )?python - <<'PY'[\s\S]*?PY\n```", re.M)
repl = '''```bash
# TypeScript 轨道验证示例（对应 apps/shop-query-agent + examples/08-embedding-rag）
npx tsx -e "import { createEmbeddings } from './src/shared/llm.ts'; const e=createEmbeddings(); console.log((await e.embedQuery('销售额')).slice(0,3));"
```

或运行完整可运行示例：

```bash
npx tsx examples/08-embedding-rag/index.ts
```'''
t2, n = pat.subn(repl, t)
if n:
    print('ch9 bash python replaced', n)
    t = t2
    fixes += n
# also plain leftover python-ish lines if any
t = t.replace('aembed_query', 'embedQuery')
t = t.replace('from app.clients.embedding_client_manager import embedding_client_manager', '')
t = t.replace('from app.clients.qdrant_client_manager import qdrant_client_manager', '')
t = t.replace('from app.repositories.qdrant.column_qdrant_repository import ColumnQdrantRepository', '')
# remove orphaned import asyncio / python fragments in fences
def clean_fence(m):
    body = m.group(1)
    if 'from app.' in body or 'import asyncio' in body or 'aembed_query' in body or re.search(r'(?m)^\s*print\(', body):
        src = Path('examples/08-embedding-rag/index.ts').read_text(encoding='utf-8')
        return "```typescript\n// Real TypeScript from repo: examples/08-embedding-rag/index.ts\n" + src.rstrip() + "\n```"
    return m.group(0)
t3 = re.sub(r'```(?:bash|typescript|python)?\s*\n([\s\S]*?)```', clean_fence, t)
# only replace if looks like bad code - the clean_fence for bash may be too aggressive
# better targeted: only typescript fences with app. imports
def clean_ts(m):
    body = m.group(1)
    if re.search(r'(?m)^\s*from\s+app\.|^\s*import asyncio|aembed_query|^\s*print\(', body):
        src = Path('examples/08-embedding-rag/index.ts').read_text(encoding='utf-8')
        return "```typescript\n// Real TypeScript from repo: examples/08-embedding-rag/index.ts\n" + src.rstrip() + "\n```"
    return m.group(0)
t = re.sub(r'```typescript\s*\n([\s\S]*?)```', clean_ts, t)
p.write_text(t, encoding='utf-8')

# 2) global prose fixes for Python-only wording inside project docs
for f in Path('book').rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    o = t
    o = o.replace('`self.', '`this.')
    o = o.replace('self.qdrant_config', 'this.qdrantConfig')
    o = o.replace('self.es_config', 'this.esConfig')
    o = o.replace('self.config', 'this.config')
    o = o.replace('self.client', 'this.client')
    o = o.replace('self._get_url()', 'this.getUrl()')
    o = o.replace('hosts=[self._get_url()]', 'node: this.getUrl()')
    o = o.replace('用 `python -m` 执行包内模块', '用 `npx tsx` 执行包内模块')
    o = o.replace('### 4.4 python -m、uv run 与 PYTHONPATH', '### 4.4 npx tsx、npm scripts 与模块路径')
    o = o.replace('`base_url=...`', '`configuration.baseURL=...`')
    o = o.replace('`api_key=...`', '`apiKey=...`')
    o = o.replace('`model_provider="openai"`', '`OpenAI 兼容协议（ChatOpenAI / baseURL）`')
    o = o.replace('model_provider="openai"', 'OpenAI 兼容协议（ChatOpenAI + baseURL）')
    o = o.replace('from app.core.log import logger', '// logger from your app logger module')
    # leftover python shell blocks
    o2, n = re.subn(r"```bash\n(?:uv run )?python(?:3)?(?: - <<'PY'[\s\S]*?PY| [^\n]+)\n```", "```bash\n# TypeScript 轨道：使用 npx tsx 运行对应 examples/ 或 apps/ 代码\nnpx tsx examples/01-helloworld/index.ts\n```", o)
    if n:
        fixes += n
        o = o2
    if o != t:
        f.write_text(o, encoding='utf-8')
        print('prose fixed', f)

print('fixes', fixes)

# re-audit strict junk in CODE FENCES only
junk_in_code = 0
real = 0
total = 0
for f in Path('book').rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    for m in re.finditer(r'```typescript\s*\n([\s\S]*?)```', t):
        total += 1
        body = m.group(1)
        if re.search(r'Real TypeScript from repo:|// examples/|// book/cases-|// apps/shop-query-agent/|// Real TypeScript', body):
            real += 1
        if re.search(r'(?m)^\s*from\s+\S+\s+import\s+|^\s*(?:async\s+)?def\s+|constructor\s*\(\s*self|\bself\.|new\s+new\s+|__name__\s*==|aembed_query|HuggingFaceEndpointEmbeddings|langchain_huggingface|^\s*print\s*\(', body):
            junk_in_code += 1
            line = t[:m.start()].count('\n')+1
            print('JUNK_CODE', f, line)
print({'ts_total': total, 'ts_real_marker': real, 'ts_junk_code': junk_in_code, 'python_fences': sum(p.read_text(encoding='utf-8').count('```python') for p in Path('book').rglob('*.md'))})
