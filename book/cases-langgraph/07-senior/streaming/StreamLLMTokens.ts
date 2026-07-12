/**
 * 【精校可运行】流式输出 LLM token（第 25 章）
 * 原 Python: StreamLLMTokens.py 教学意图
 *
 *   npx tsx book/cases-langgraph/07-senior/streaming/StreamLLMTokens.ts
 */
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  END,
  START,
  StateGraph,
  messagesStateReducer,
} from "@langchain/langgraph";
import { createChatModel } from "../../../../src/shared/llm.js";

const ChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

async function modelNode(state: typeof ChatState.State) {
  const model = createChatModel(0.2);
  const reply = await model.invoke(state.messages);
  return { messages: [reply] };
}

async function main() {
  const app = new StateGraph(ChatState)
    .addNode("model", modelNode)
    .addEdge(START, "model")
    .addEdge("model", END)
    .compile();

  // messages 模式：尽量拿到 token 级流（取决于模型/SDK）
  process.stdout.write("[stream messages] ");
  const stream = await app.stream(
    { messages: [new HumanMessage("用一句话介绍 LangGraph 流式输出")] },
    { streamMode: "messages" },
  );
  for await (const chunk of stream) {
    // chunk 形态随版本可能是 [message, meta] 或对象
    const msg = Array.isArray(chunk) ? chunk[0] : chunk;
    const content = msg?.content ?? msg?.kwargs?.content ?? "";
    if (content) process.stdout.write(String(content));
  }
  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});