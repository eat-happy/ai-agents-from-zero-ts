/**
 * 【精校可运行】operator.add 风格列表/数值累计（第 23 章）
 * 原 Python: StateReducer_OperatorAdd*.py 合并教学版
 *
 *   npx tsx book/cases-langgraph/03-state/reducers/StateReducer_OperatorAdd.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const AddState = Annotation.Root({
  logs: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  score: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});

function stepA(_state: typeof AddState.State) {
  return { logs: ["A"], score: 1 };
}

function stepB(_state: typeof AddState.State) {
  return { logs: ["B"], score: 2 };
}

async function main() {
  const app = new StateGraph(AddState)
    .addNode("step_a", stepA)
    .addNode("step_b", stepB)
    .addEdge(START, "step_a")
    .addEdge("step_a", "step_b")
    .addEdge("step_b", END)
    .compile();

  const result = await app.invoke({ logs: ["start"], score: 10 });
  console.log(result);
  // expect logs: start,A,B  score: 13
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});