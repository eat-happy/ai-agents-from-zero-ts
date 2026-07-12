/**
 * 【精校可运行】条件边：奇偶分流（第 24 章）
 * 原 Python: Edge_Conditional.py
 *
 *   npx tsx book/cases-langgraph/05-edge/Edge_Conditional.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const MyState = Annotation.Root({
  x: Annotation<number>,
  result: Annotation<string | undefined>,
});

function checkX(state: typeof MyState.State) {
  console.log("[check_x] Received", state);
  return {};
}

function isEven(state: typeof MyState.State) {
  return state.x % 2 === 0 ? "handle_even" : "handle_odd";
}

function handleEven(state: typeof MyState.State) {
  console.log("[handle_even] x 是偶数");
  return { result: "even" };
}

function handleOdd(state: typeof MyState.State) {
  console.log("[handle_odd] x 是奇数");
  return { result: "odd" };
}

async function main() {
  const app = new StateGraph(MyState)
    .addNode("check_x", checkX)
    .addNode("handle_even", handleEven)
    .addNode("handle_odd", handleOdd)
    .addEdge(START, "check_x")
    .addConditionalEdges("check_x", isEven, {
      handle_even: "handle_even",
      handle_odd: "handle_odd",
    })
    .addEdge("handle_even", END)
    .addEdge("handle_odd", END)
    .compile();

  for (const x of [2, 3]) {
    const result = await app.invoke({ x, result: undefined });
    console.log(`x=${x} =>`, result);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});