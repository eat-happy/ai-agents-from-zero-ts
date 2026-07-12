from pathlib import Path
import re

path = Path("book/projects/shop-query/6-MySQL、Embedding与日志管理.md")
text = path.read_text(encoding="utf-8")

# --- Rewrite the main Embedding manager code block (section 1.6) ---
old_block = '''```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.



from langchain_huggingface import HuggingFaceEndpointEmbeddings

from app.conf.app_config import EmbeddingConfig, app_config


class EmbeddingClientManager {
    constructor(self, config: EmbeddingConfig) {
        // 客户端在模块导入阶段先不立即创建，避免启动时就发起外部依赖连接
        this.client: HuggingFaceEndpointEmbeddings | null = null
        // 保存 Embedding 服务配置，供 init() 时组装服务访问地址使用
        this.config = config

    function _get_url(self) {
        // 当前项目通过 host + port 访问外部已启动的 Embedding 推理服务
        return `http://${this.config.host}:${this.config.port}`

    function init(self) {
        // 在应用启动阶段显式调用，完成真正的客户端初始化
        this.client = HuggingFaceEndpointEmbeddings(model=this._get_url())


// 模块级单例，供其他模块按需复用同一个客户端管理器
embedding_client_manager = EmbeddingClientManager(app_config.embedding)


if (__name__ == "__main__") {
    // 本地调试入口：初始化客户端后执行一次最小化向量化调用
    embedding_client_manager.init()
    client = embedding_client_manager.client

    async function test() {
        // 使用示例文本验证 Embedding 服务是否可正常响应
        text = "What is deep learning?"
        query_result = await client.aembed_query(text)
        // 只打印前 3 个维度，便于快速确认返回结果结构正确
        console.log(query_result[:3])

    // 运行调试测试
    await test()


```'''

new_block = '''```typescript
// [TS-PORT] TypeScript rewrite for the JS track
// TEI can be accessed as an OpenAI-compatible /v1/embeddings endpoint.
// Prefer this over HuggingFaceEndpointEmbeddings in Node/LangChain.js.

import { OpenAIEmbeddings } from "@langchain/openai";

export type EmbeddingConfig = {
  host: string;
  port: number;
  model?: string;
};

export class EmbeddingClientManager {
  private client: OpenAIEmbeddings | null = null;

  constructor(private readonly config: EmbeddingConfig) {
    // 客户端在模块导入阶段先不立即创建，避免启动时就发起外部依赖连接
  }

  private getUrl(): string {
    // 当前项目通过 host + port 访问外部已启动的 Embedding 推理服务
    // TEI OpenAI-compatible base: http://host:port/v1
    return `http://${this.config.host}:${this.config.port}/v1`;
  }

  init(): void {
    // 在应用启动阶段显式调用，完成真正的客户端初始化
    this.client = new OpenAIEmbeddings({
      // TEI 本地服务通常不强制真实 key，但 SDK 需要一个非空字符串
      apiKey: process.env.OPENAI_API_KEY || "tei-local",
      model: this.config.model || "BAAI/bge-large-zh-v1.5",
      configuration: {
        baseURL: this.getUrl(),
      },
    });
  }

  getClient(): OpenAIEmbeddings {
    if (!this.client) {
      throw new Error("Embedding client is not initialized. Call init() first.");
    }
    return this.client;
  }
}

// 模块级单例，供其他模块按需复用同一个客户端管理器
export const embeddingClientManager = new EmbeddingClientManager({
  host: process.env.EMBEDDING_HOST || "127.0.0.1",
  port: Number(process.env.EMBEDDING_PORT || 8080),
  model: process.env.EMBEDDING_MODEL || "BAAI/bge-large-zh-v1.5",
});

// 本地调试入口：npx tsx embedding_client_manager.ts
async function main() {
  embeddingClientManager.init();
  const client = embeddingClientManager.getClient();
  const text = "What is deep learning?";
  const queryResult = await client.embedQuery(text);
  // 只打印前 3 个维度，便于快速确认返回结果结构正确
  console.log(queryResult.slice(0, 3));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("embedding_client_manager.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```'''

if old_block not in text:
    # try a more tolerant replace by locating section markers
    print("EXACT_BLOCK_NOT_FOUND")
else:
    text = text.replace(old_block, new_block)
    print("MAIN_BLOCK_REPLACED")

# replace smaller broken snippets
text = text.replace(
'''```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
class EmbeddingClientManager {
    constructor(self, config: EmbeddingConfig) {
        this.client: HuggingFaceEndpointEmbeddings | null = null
        this.config = config


```''',
'''```typescript
class EmbeddingClientManager {
  private client: OpenAIEmbeddings | null = null;
  constructor(private readonly config: EmbeddingConfig) {}
}
```'''
)

text = text.replace(
'''```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
function _get_url(self) {
    return `http://${this.config.host}:${this.config.port}`


```''',
'''```typescript
private getUrl(): string {
  return `http://${this.config.host}:${this.config.port}/v1`;
}
```'''
)

text = text.replace(
'''```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
function init(self) {
    this.client = HuggingFaceEndpointEmbeddings(model=this._get_url())


```''',
'''```typescript
init(): void {
  this.client = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY || "tei-local",
    model: this.config.model || "BAAI/bge-large-zh-v1.5",
    configuration: { baseURL: this.getUrl() },
  });
}
```'''
)

# prose fixes for this chapter section
replacements = [
    ("使用 Hugging Face 的 Python 客户端：也就是 `huggingface_hub` 里的 `InferenceClient`",
     "使用 Hugging Face 的 HTTP/SDK 客户端（Python 原课用 `huggingface_hub.InferenceClient`；TS 可用官方 HTTP 或兼容 SDK）"),
    ("而是选择了更贴近整套教程技术栈的方案：使用 LangChain 提供的 `HuggingFaceEndpointEmbeddings`。",
     "在 TypeScript 轨道里，我们选择更贴近 Node 技术栈的方案：用 LangChain.js 的 `OpenAIEmbeddings`，把 TEI 当作 OpenAI 兼容的 `/v1/embeddings` 服务接入。"),
    ("`self.config`：保存配置对象，里面有 `host`、`port`、`model`",
     "`this.config`：保存配置对象，里面有 `host`、`port`、`model`"),
    ("`self.client`：保存真正可调用的 Embedding 客户端实例",
     "`this.client`：保存真正可调用的 Embedding 客户端实例"),
    ("`model=` 传进去的并不是 Hugging Face 上的模型名称，而是**本地已经部署好的 Embedding 服务地址**。",
     "这里的关键点是：`baseURL` 指向**本地已经部署好的 TEI 服务地址**；`model` 才是服务端实际加载的模型名。"),
    ("```bash\n(shopkeeper-agent) didilili@DidililiMacBook-Pro shopkeeper-agent % python3 -m app.clients.embedding_client_manager\n",
     "```bash\n# TypeScript 轨道调试示例\nnpx tsx app/clients/embedding_client_manager.ts\n"),
    ("它不是写在后端代码里的普通 Python 类，而是作为这套项目 Docker 基础服务环境中的一个容器服务启动起来",
     "它不是写在后端代码里的普通业务类，而是作为这套项目 Docker 基础服务环境中的一个容器服务启动起来"),
]
for a,b in replacements:
    if a in text:
        text = text.replace(a,b)
        print("prose_ok:", a[:40])
    else:
        print("prose_miss:", a[:40])

path.write_text(text, encoding="utf-8")
print("saved")
