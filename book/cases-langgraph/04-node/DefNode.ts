/**
 * 【精校可运行】Node 定义：接收 state，返回部分更新（第 24 章）
 * 原 Python: DefNode.py 教学意图
 *
 *   npx tsx book/cases-langgraph/04-node/DefNode.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const NodeState = Annotation.Root({
  name: Annotation<string>,
  greeting: Annotation<string>,
  upper: Annotation<string>,
});

function makeGreeting(state: typeof NodeState.State) {
  return { greeting: `Hello, ${state.name}` };
}

function toUpper(state: typeof NodeState.State) {
  return { upper: state.greeting.toUpperCase() };
}

async function main() {
  const app = new StateGraph(NodeState)
    .addNode("make_greeting", makeGreeting)
    .addNode("to_upper", toUpper)
    .addEdge(START, "make_greeting")
    .addEdge("make_greeting", "to_upper")
    .addEdge("to_upper", END)
    .compile();

  const result = await app.invoke({
    name: "LangGraph",
    greeting: "",
    upper: "",
  });
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});