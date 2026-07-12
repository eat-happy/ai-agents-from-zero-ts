# 原仓库映射表

原仓库：https://github.com/didilili/ai-agents-from-zero

## LangChain 案例映射

| 原 Python 文件 | 本仓库 TS 案例 | 说明 |
|----------------|----------------|------|
| `01-helloworld/LangChainV1.0.py` | `examples/01-helloworld` | OpenAI 兼容模型 HelloWorld |
| `02-models_io/*` | `examples/02-models-io` | invoke / batch / stream |
| `04-prompt/*` + 第13章 | `examples/03-prompt-template` | ChatPromptTemplate |
| `05_parser/StructuredOutput_Pydantic.py` | `examples/04-output-parser` | Zod structured output |
| `06-lcel/LCEL_RunnableSequenceDemo.py` | `examples/05-lcel-chain` | LCEL 管道 |
| `07-memory/Memory_InMemoryChatMessageHistory.py` | `examples/06-memory` | 多轮历史 |
| `08-tools/Tool_AddNumberTool.py` | `examples/07-tools` | Tool 定义 |
| `08-tools/LLMQueryWeatherDemo.py` | `examples/07-tools` | bindTools + 执行 |
| `09-embedding/*` + `10-rag/EmbeddingRagLLM.py` | `examples/08-embedding-rag` | Embedding + RAG |
| `12-agent/AgentSmartSelectV1.0.py` | `examples/09-agent` | 多工具 Agent |
| `12-agent/AgentReact.py` | `examples/09-agent` | ReAct 电商搜索/库存 |
| `11-mcp/McpServerByFastMCP.py` | `examples/14-mcp/server.ts` | MCP tools/resource/prompt |
| `11-mcp/McpClientAgent.py` | `examples/14-mcp/client-agent.ts` | MCP tools → Agent |

## LangGraph 案例映射

| 原 Python 文件 | 本仓库 TS 案例 | 说明 |
|----------------|----------------|------|
| `01-helloworld/LangGraphHello.py` | `examples/10-langgraph-helloworld` | State/Node/Edge |
| 第22章并行 QA 示例 | `examples/10-langgraph-helloworld` | 并行 fan-in |
| 第21-24章 Agent 图 | `examples/11-langgraph-tool-agent` | 手写 tool loop 图 |
| `08-multi_agent/SupervisorV1.0.py` | `examples/12-langgraph-multi-agent` | Supervisor 路由 |

## 实战项目映射

| 原项目 | 本仓库 | 说明 |
|--------|--------|------|
| `实战项目-电商问数` | `apps/shop-query-agent` | Next.js 精简可演示版 NL2SQL Agent |

## API 对照

| Python (原课) | TypeScript (本仓库) |
|---------------|---------------------|
| `init_chat_model` / `ChatOpenAI` | `ChatOpenAI` (`@langchain/openai`) |
| Pydantic schema | Zod (`z.object`) |
| `@tool` | `tool(...)` |
| `create_agent` | `createReactAgent` |
| `StateGraph` + `TypedDict` | `StateGraph` + `Annotation` |
| `add_messages` | `messagesStateReducer` |
| FastMCP | `@modelcontextprotocol/sdk` `McpServer` |
| `langgraph_supervisor.create_supervisor` | 手写 supervisor 路由图（教学版） |

## 暂不迁移 / 简化

- Coze / Dify 平台操作（与语言无关）
- Redis Memory / Redis 向量库完整案例
- 微调训练章节
- 电商问数完整 Qdrant / ES / MySQL 生产链路（Demo 用内存数仓 + 规则召回）
- 深度研搜整仓项目