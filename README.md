# ai-agents-from-zero-ts

TypeScript 重写版学习仓库，对齐 [didilili/ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 的 **LangChain / LangGraph 核心实践路径**，面向 **JS/TS 求职落地**。

> 说明：原仓库以 Python + 中文教程为主。本仓库 **不逐字翻译全部 Markdown 教程**，而是把可运行代码案例迁移到 TypeScript，并提供章节映射，方便你对照原文概念、用 JS 动手。

## 你能学到什么

1. OpenAI 兼容模型接入（百炼 / DeepSeek / OpenAI / OpenRouter 等）
2. Prompt / Structured Output / LCEL 链式调用
3. Memory（多轮对话）
4. Tools / Tool Calling
5. Embedding + RAG
6. Agent Loop（ReAct / createReactAgent）
7. LangGraph.js：状态图、并行、工具 Agent、Supervisor 多智能体
8. 附加：OpenAI Agents SDK（TS）快速轨
9. MCP（stdio server + client agent）
10. 电商问数 Next.js 可演示项目（精简版）

## 快速开始

### 1. 环境要求

- Node.js >= 20
- 任意 OpenAI 兼容 API Key

### 2. 安装

```bash
cd ai-agents-from-zero-ts
npm install
cp .env.example .env
```

编辑 `.env`：

```env
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-plus
OPENAI_EMBEDDING_MODEL=text-embedding-v3
```

> 若使用官方 OpenAI，可删掉 `OPENAI_BASE_URL`，模型改为 `gpt-4.1-mini` 等。

### 3. 按顺序跑案例

```bash
npm run ex:01   # Hello World
npm run ex:02   # Model I/O
npm run ex:03   # Prompt Template
npm run ex:04   # Structured Output
npm run ex:05   # LCEL Chain
npm run ex:06   # Memory
npm run ex:07   # Tools
npm run ex:08   # RAG
npm run ex:09   # Agent
npm run ex:10   # LangGraph Hello
npm run ex:11   # LangGraph Tool Agent
npm run ex:12   # Multi-Agent Supervisor
npm run ex:13   # OpenAI Agents SDK
npm run ex:14   # MCP server + client agent

电商问数 Demo：

```bash
npm run shop:install
npm run shop:dev
# http://localhost:3007
```
```

类型检查：

```bash
npm run typecheck
```

## 目录结构

```text
ai-agents-from-zero-ts/
├── data/                      # RAG 示例文档
├── docs/
│   ├── MAPPING.md             # 与原 Python 仓库映射
│   └── LEARNING-PATH.md       # 2 周 JS 求职学习路径
├── examples/
│   ├── 01-helloworld/
│   ├── 02-models-io/
│   ├── ...
│   └── 13-openai-agents-sdk/
└── src/shared/                # 公共模型/工具封装
```

## 与原仓库的关系

| 原仓库 | 本仓库 |
|--------|--------|
| 中文理论长文 | 建议继续读原仓库 Markdown |
| Python 案例 | TS 可运行案例（概念对齐） |
| Coze / Dify / 微调 / 部署大段 | 暂不迁移（偏平台或 Python 生态） |
| 实战项目（研搜 / 问数） | 可作为下一阶段 TS 复刻目标 |

详见 [docs/MAPPING.md](docs/MAPPING.md)。

## 求职建议（JS 方向）

1. 把 `08-rag` + `09-agent` + `12-multi-agent` 做成你自己的业务主题
2. 用 Next.js / Fastify 包一层 API，录 2 分钟演示
3. 简历关键词：TypeScript、LangGraph.js、Tool Calling、RAG、Multi-Agent、OpenAI Agents SDK

## 许可证与致谢

- 原教程版权归 [didilili/ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 作者所有
- 本仓库为学习用途的 TypeScript 重写/对照实现，请遵循原仓库 License