/**
 * 【精校可运行】LangGraph 单节点 LLM 对话
 * 原 Python: LangGraphLLM.py
 *
 *   npx tsx book/cases-langgraph/01-helloworld/LangGraphLLM.ts
 */
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  END,
  START,
  StateGraph,
  messagesStateReducer,
} from "@langchain/langgraph";
import { createChatModel } from "../../../src/shared/llm.js";

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

  const result = await app.invoke({
    messages: [new HumanMessage("用一句话介绍 LangGraph")],
  });
  const last = result.messages[result.messages.length - 1] as AIMessage;
  console.log(last.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});