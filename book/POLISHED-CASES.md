# 精校可运行案例清单（打磨进度）

自动迁移的 `book/**/*.ts` 中，**下列文件已人工精校**，可直接运行。  
其余 `.ts` 仍可能是半自动产物，请优先用本清单 + 根目录 `examples/`。

## 运行方式

在仓库根目录：

```bash
npm install
cp .env.example .env   # 填写 OPENAI_API_KEY / BASE_URL / MODEL

npx tsx book/cases-langgraph/03-state/DefState.ts
npm run case:state
npm run case:edge
npm run case:stream
npm run case:persist
npm run case:prompt
```

## LangChain 案例（精校）

| 文件 | 章节 | 状态 |
|------|------|------|
| `cases-langchain/01-helloworld/LangChainV1.0.ts` | 第 10 章 | ✅ |
| `cases-langchain/01-helloworld/StandardDesc.ts` | 第 10 章 | ✅ |
| `cases-langchain/04-prompt/prompt_templates/PromptTemplate_FromTemplate.ts` | 第 13 章 | ✅ |
| `cases-langchain/04-prompt/prompt_templates/PromptTemplate_PartialVariables.ts` | 第 13 章 | ✅ |
| `cases-langchain/04-prompt/chat_prompt_template/ChatPromptTemplate_Constructor.ts` | 第 13 章 | ✅ |
| `cases-langchain/04-prompt/chat_prompt_template/placeholder/ChatPromptTemplate_MessagesPlaceholder.ts` | 第 13 章 | ✅ |
| `cases-langchain/04-prompt/invoke/LLM_Invoke_Stream_Batch.ts` | 第 11/13 章 | ✅ 需 API Key |
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
| `cases-langgraph/02-graph/BuildWholeGraphSummary.ts` | 第 22-23 章 | ✅ |
| `cases-langgraph/03-state/DefState.ts` | 第 23 章 | ✅ |
| `cases-langgraph/03-state/reducers/StateReducer_AddMessages.ts` | 第 23 章 | ✅ |
| `cases-langgraph/03-state/reducers/StateReducer_Custom.ts` | 第 23 章 | ✅ |
| `cases-langgraph/03-state/reducers/StateReducer_OperatorAdd.ts` | 第 23 章 | ✅ |
| `cases-langgraph/04-node/DefNode.ts` | 第 24 章 | ✅ |
| `cases-langgraph/05-edge/Edge_Conditional.ts` | 第 24 章 | ✅ |
| `cases-langgraph/05-edge/Edge_ConditionalV2.ts` | 第 24 章 | ✅ |
| `cases-langgraph/07-senior/streaming/StreamGraphState.ts` | 第 25 章 | ✅ |
| `cases-langgraph/07-senior/streaming/StreamLLMTokens.ts` | 第 25 章 | ✅ 需 API Key |
| `cases-langgraph/07-senior/state_persistence/MemoryPersistence.ts` | 第 25 章 | ✅ |
| `cases-langgraph/07-senior/subgraph/SubGraphSimple.ts` | 第 25 章 | ✅ |
| `cases-langgraph/07-senior/time_travel/TimeTravel.ts` | 第 25 章 | ✅ |
| `cases-langgraph/08-multi_agent/SupervisorV1.0.ts` | 第 26 章 | ✅ |

## 根目录精校示例（始终推荐）

`examples/01` … `examples/14` 与 `apps/shop-query-agent` 为课程练习主线。

## 后续打磨优先级

1. `cases-langgraph/06-specialApi`（Command / Send / RuntimeContext）
2. `cases-langchain/04-prompt` 剩余细节样例（load_external 等）
3. 电商问数 / 深度研搜项目代码级完整 TS 复刻