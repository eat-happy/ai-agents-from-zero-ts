/**
 * 【精校可运行】条件边：字符串路由键 + 多分支入口（第 24 章）
 * 原 Python: Edge_ConditionalV2.py
 *
 *   npx tsx book/cases-langgraph/05-edge/Edge_ConditionalV2.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const DiliState = Annotation.Root({
  x: Annotation<number>,
});

function addition1(state: typeof DiliState.State) {
  console.log("addition1 收到:", state);
  return { x: state.x + 1 };
}
function addition2(state: typeof DiliState.State) {
  console.log("addition2 收到:", state);
  return { x: state.x + 2 };
}
function addition3(state: typeof DiliState.State) {
  console.log("addition3 收到:", state);
  return { x: state.x + 3 };
}

function routeByX(state: typeof DiliState.State) {
  if (state.x === 1) return "condition_1";
  if (state.x === 2) return "condition_2";
  return "condition_3";
}

async function main() {
  const app = new StateGraph(DiliState)
    .addNode("node1", addition1)
    .addNode("node2", addition2)
    .addNode("node3", addition3)
    .addConditionalEdges(START, routeByX, {
      condition_1: "node1",
      condition_2: "node2",
      condition_3: "node3",
    })
    .addEdge("node1", END)
    .addEdge("node2", END)
    .addEdge("node3", END)
    .compile();

  const result = await app.invoke({ x: 3 });
  console.log("最后的结果是:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});