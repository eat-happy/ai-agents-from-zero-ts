/**
 * 【精校可运行】LangGraph HelloWorld（第 22 章）
 * 原 Python: LangGraphHello.py
 *
 *   npx tsx book/cases-langgraph/01-helloworld/LangGraphHello.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const HelloState = Annotation.Root({
  name: Annotation<string>,
  greeting: Annotation<string>,
});

function greet(state: typeof HelloState.State) {
  return { greeting: `你好,${state.name}` };
}

function addEmoji(state: typeof HelloState.State) {
  return { greeting: `${state.greeting}  。。。😄` };
}

async function main() {
  // 注意：节点名不能与 state 字段同名（LangGraph.js 会把 state key 注册为 channel）
  const app = new StateGraph(HelloState)
    .addNode("greet_node", greet)
    .addNode("add_emoji", addEmoji)
    .addEdge(START, "greet_node")
    .addEdge("greet_node", "add_emoji")
    .addEdge("add_emoji", END)
    .compile();

  const result = await app.invoke({ name: "z3", greeting: "" });
  console.log(result);
  console.log(result.greeting);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});