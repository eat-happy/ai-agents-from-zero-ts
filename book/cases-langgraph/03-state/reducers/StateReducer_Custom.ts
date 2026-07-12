/**
 * 【精校可运行】自定义 Reducer（第 23 章）
 * 原 Python: StateReducer_Custom.py
 *
 *   npx tsx book/cases-langgraph/03-state/reducers/StateReducer_Custom.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

function myOperatorMul(current: number, update: number): number {
  // 首次合并时 current 可能是 0，直接相乘会“锁死”为 0
  if (current === 0) {
    console.log("current:", current, "update:", update);
    return 1 * update;
  }
  return current * update;
}

const MultiplyState = Annotation.Root({
  factor: Annotation<number>({
    reducer: myOperatorMul,
    default: () => 0,
  }),
});

function multiplier(_state: typeof MultiplyState.State) {
  return { factor: 2.0 };
}

async function main() {
  console.log("自定义 reducer 乘法累计:");
  const app = new StateGraph(MultiplyState)
    .addNode("multiplier", multiplier)
    .addEdge(START, "multiplier")
    .addEdge("multiplier", END)
    .compile();

  const result = await app.invoke({ factor: 5.0 });
  console.log("初始 factor=5.0, 节点返回 2.0");
  console.log("执行结果:", result);
  console.log("解释: 5.0 * 2.0 =", result.factor);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});