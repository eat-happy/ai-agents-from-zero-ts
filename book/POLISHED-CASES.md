# 精校可运行案例清单（打磨进度）

自动迁移的 `book/**/*.ts` 中，**下列文件已人工精校**，可直接运行。  
其余 `.ts` 仍可能是半自动产物，请优先用本清单 + 根目录 `examples/`。

## 运行方式

在仓库根目录：

```bash
npm install
cp .env.example .env   # 填写 OPENAI_API_KEY / BASE_URL / MODEL

# 任选：
npx tsx book/cases-langchain/01-helloworld/LangChainV1.0.ts
npm run case:hello
npm run case:tools
npm run case:agent
npm run case:graph
npm run case:supervisor
```

## LangChain 案例（精校）

| 文件 | 章节 | 状态 |
|------|------|------|
| `cases-langchain/01-helloworld/LangChainV1.0.ts` | 第 10 章 | ✅ |
| `cases-langchain/01-helloworld/StandardDesc.ts` | 第 10 章 | ✅ |
| `cases-langchain/05_parser/StructuredOutput_Zod.ts` | 第 14 章 | ✅ |
| `cases-langchain/06-lcel/LCEL_RunnableSequenceDemo.ts` | 第 15 章 | ✅ |
| `cases-langchain/07-memory/Memory_InMemoryChatMessageHistory.ts` | 第 16 章 | ✅ |
| `cases-langchain/08-tools/Tool_AddNumberTool.ts` | 第 17 章 | ✅ |
| `cases-langchain/08-tools/QueryWeatherTool.ts` | 第 17 章 | ✅ |
| `cases-langchain/08-tools/LLMQueryWeatherDemo.ts` | 第 17 章 | ✅ |
| `cases-langchain/10-rag/EmbeddingRagLLM.ts` | 第 18-19 章 | ✅ |
| `cases-langchain/11-mcp/McpServer.ts` | 第 20 章 | ✅ |
| `cases-langchain/11-mcp/McpClientAgent.ts` | 第 20-21 章 | ✅ |
| `cases-langchain/12-agent/AgentReact.ts` | 第 21 章 | ✅ |
| `cases-langchain/12-agent/AgentSmartSelectV1.0.ts` | 第 21 章 | ✅ |

## LangGraph 案例（精校）

| 文件 | 章节 | 状态 |
|------|------|------|
| `cases-langgraph/01-helloworld/LangGraphHello.ts` | 第 22 章 | ✅ |
| `cases-langgraph/01-helloworld/LangGraphLLM.ts` | 第 22 章 | ✅ |
| `cases-langgraph/08-multi_agent/SupervisorV1.0.ts` | 第 26 章 | ✅ |

## 根目录精校示例（始终推荐）

`examples/01` … `examples/14` 与 `apps/shop-query-agent` 为课程练习主线。

## 后续打磨优先级

1. `cases-langgraph/03-state` ~ `07-senior`（状态、边、持久化、流式）
2. `cases-langchain/04-prompt` 全量
3. 电商问数 / 深度研搜项目代码级 TS 复刻（目前文档在 `book/projects`，可运行版在 `apps/shop-query-agent`）