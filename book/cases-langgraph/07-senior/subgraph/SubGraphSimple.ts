/**
 * 【精校可运行】父子图共享字段（第 25 章）
 * 原 Python: SubGraphSimple.py
 *
 *   npx tsx book/cases-langgraph/07-senior/subgraph/SubGraphSimple.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const ParentState = Annotation.Root({
  parent_messages: Annotation<string[]>({
    reducer: (l, r) => l.concat(r),
    default: () => [],
  }),
});

const SubgraphState = Annotation.Root({
  parent_messages: Annotation<string[]>({
    reducer: (l, r) => l.concat(r),
    default: () => [],
  }),
  sub_message: Annotation<string>,
});

function subgraphNode(_state: typeof SubgraphState.State) {
  return {
    parent_messages: ["message from subgraph updateO(∩_∩)O"],
    sub_message: "subgraph private message",
  };
}

function parentNode(_state: typeof ParentState.State) {
  return { parent_messages: ["message from 父亲 node"] };
}

function buildSubgraph() {
  return new StateGraph(SubgraphState)
    .addNode("sub_node", subgraphNode)
    .addEdge(START, "sub_node")
    .addEdge("sub_node", END)
    .compile();
}

async function main() {
  const compiledSubgraph = buildSubgraph();
  const parentGraph = new StateGraph(ParentState)
    .addNode("parent_node", parentNode)
    .addNode("subgraph_node", compiledSubgraph)
    .addEdge(START, "parent_node")
    .addEdge("parent_node", "subgraph_node")
    .addEdge("subgraph_node", END)
    .compile();

  const initial = { parent_messages: ["我是父消息"] };
  console.log("初始状态：", initial);
  const finalState = await parentGraph.invoke(initial);
  console.log("\n执行后最终状态：", finalState);
  // sub_message 不会出现在父图输出
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});