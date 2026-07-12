/**
 * 【精校可运行】messagesStateReducer / add_messages（第 23 章）
 * 原 Python: StateReducer_AddMessages.py
 *
 *   npx tsx book/cases-langgraph/03-state/reducers/StateReducer_AddMessages.ts
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

const AddMessagesState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

function chatNode1(_state: typeof AddMessagesState.State) {
  return { messages: [new AIMessage("Hello from node 1")] };
}

function chatNode2(_state: typeof AddMessagesState.State) {
  return { messages: [new AIMessage("Hello from node 2")] };
}

async function main() {
  console.log("add_messages / messagesStateReducer demo:");
  const app = new StateGraph(AddMessagesState)
    .addNode("chat1", chatNode1)
    .addNode("chat2", chatNode2)
    .addEdge(START, "chat1")
    .addEdge(START, "chat2")
    .addEdge("chat1", END)
    .addEdge("chat2", END)
    .compile();

  const result = await app.invoke({
    messages: [new HumanMessage("Hi there!")],
  });

  console.log(
    "messages:",
    result.messages.map((m) => `${m.getType()}: ${m.content}`),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});