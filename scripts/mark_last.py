from pathlib import Path
p = Path('book/projects/shop-query/6-MySQL、Embedding与日志管理.md')
t = p.read_text(encoding='utf-8')
t = t.replace(
'// Real TypeScript from repo pattern: OpenAIEmbeddings + TEI/OpenAI-compatible baseURL',
'// Real TypeScript from repo: apps/shop-query-agent pattern (OpenAIEmbeddings + TEI-compatible baseURL)\n// Also see: examples/08-embedding-rag/index.ts'
)
p.write_text(t, encoding='utf-8')
print('marked')
