from pathlib import Path
import re

# Fix remaining one python fence if any
for p in Path('book').rglob('*.md'):
    t = p.read_text(encoding='utf-8')
    if '```python' in t:
        print('still python in', p)

# Chapter 6 prose + embedding section rewrite around 1.5/1.6
p = Path('book/projects/shop-query/6-MySQL、Embedding与日志管理.md')
t = p.read_text(encoding='utf-8')

# Replace HF wording with TS track wording
t = t.replace(
    '而是选择了更贴近整套教程技术栈的方案：使用 LangChain 提供的 `HuggingFaceEndpointEmbeddings`。',
    '在 TypeScript 轨道里，我们选择更贴近 Node 技术栈的方案：使用 LangChain.js 的 `OpenAIEmbeddings`，把 TEI / 云端服务当作 OpenAI 兼容的 `/v1/embeddings` 来接入。'
)
t = t.replace(
    '使用 Hugging Face 的 Python 客户端：也就是 `huggingface_hub` 里的 `InferenceClient`',
    '使用 Hugging Face / TEI 的 HTTP 接口（原课 Python 用 `huggingface_hub.InferenceClient`；TS 轨道用 OpenAI 兼容 SDK）'
)
t = t.replace('普通 Python 类', '普通业务类')
t = t.replace('Python 节点', 'Agent 节点')
t = t.replace('解析成 Python 列表', '解析成 TypeScript 数组')

# Inject a dedicated embedding manager example after section header 1.6 if not present
marker = '### 1.6 封装 Embedding 客户端'
if marker in t and 'class EmbeddingClientManager' not in t:
    emb = Path('examples/08-embedding-rag/index.ts').read_text(encoding='utf-8')
    manager = '''
项目对应文件路径（TS Demo）：`apps/shop-query-agent/lib/metadata.ts` 与 `examples/08-embedding-rag/index.ts`

TypeScript 轨道推荐写法（OpenAI 兼容 Embedding）：

```typescript
// Real TypeScript from repo pattern: OpenAIEmbeddings + TEI/OpenAI-compatible baseURL
import { OpenAIEmbeddings } from "@langchain/openai";

export type EmbeddingConfig = {
  host: string;
  port: number;
  model?: string;
};

export class EmbeddingClientManager {
  private client: OpenAIEmbeddings | null = null;
  constructor(private readonly config: EmbeddingConfig) {}

  private getUrl() {
    return `http://${this.config.host}:${this.config.port}/v1`;
  }

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

// 验证
// const mgr = new EmbeddingClientManager({ host: "127.0.0.1", port: 8080 });
// mgr.init();
// console.log((await mgr.getClient().embedQuery("销售额")).slice(0, 3));
```

对应可运行完整 RAG 示例：

```typescript
// Real TypeScript from repo: examples/08-embedding-rag/index.ts
''' + emb + "```\n\n"
    # insert after first occurrence of marker paragraph block "代码如下" if exists
    if '### 1.6 封装 Embedding 客户端' in t:
        t = t.replace('### 1.6 封装 Embedding 客户端', '### 1.6 封装 Embedding 客户端\n' + manager, 1)

p.write_text(t, encoding='utf-8')
print('ch6 updated')

# Update TS迁移说明 strategy
note = Path('book/TS迁移说明.md')
nt = note.read_text(encoding='utf-8') if note.exists() else '# TS迁移说明\n'
if '真实 TypeScript' not in nt:
    nt += '''

## 重要更正（代码策略）

此前使用“Python 自动机翻成 TS”的方式**不正确**，会导致半 Python 半 TS 的不可读代码。

当前策略：

1. **中文讲解**：保留原教程
2. **代码块**：替换为仓库内**真实可运行 TypeScript**
   - `examples/**`
   - `book/cases-*/**` 精校案例
   - `apps/shop-query-agent/**`（电商问数 Demo）
3. 不再维护脆弱的整本机翻脚本结果

若某章节代码仍显示异常，请对照章节顶部的「TypeScript 可运行示例（推荐）」与 [POLISHED-CASES](POLISHED-CASES.md)。
'''
    note.write_text(nt, encoding='utf-8')
print('note updated')
