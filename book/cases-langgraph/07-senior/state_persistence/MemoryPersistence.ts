/**
 * 【精校可运行】InMemorySaver 检查点（第 25 章）
 * 原 Python: MemoryPersistence.py
 *
 *   npx tsx book/cases-langgraph/07-senior/state_persistence/MemoryPersistence.ts
 */
import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

const PersistenceDemoState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  step_count: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});

function stepOne() {
  console.log("执行步骤 1");
  return { messages: ["执行了步骤 1"], step_count: 1 };
}
function stepTwo() {
  console.log("执行步骤 2");
  return { messages: ["执行了步骤 2"], step_count: 1 };
}
function stepThree() {
  console.log("执行步骤 3");
  return { messages: ["执行了步骤 3"], step_count: 1 };
}

async function main() {
  console.log("=== LangGraph 内存持久化演示 ===\n");
  const checkpointer = new MemorySaver();
  const app = new StateGraph(PersistenceDemoState)
    .addNode("step_one", stepOne)
    .addNode("step_two", stepTwo)
    .addNode("step_three", stepThree)
    .addEdge(START, "step_one")
    .addEdge("step_one", "step_two")
    .addEdge("step_two", "step_three")
    .addEdge("step_three", END)
    .compile({ checkpointer });

  const config = { configurable: { thread_id: "user_13811112222" } };

  console.log("1. 首次执行:");
  const result = await app.invoke(
    { messages: ["开始执行"], step_count: 0 },
    config,
  );
  console.log("result:", result);

  console.log("\n2. get_state:");
  const saved = await app.getState(config);
  console.log("values:", saved.values);
  console.log("next:", saved.next);

  console.log("\n3. get_state_history (最多 5 条):");
  let i = 0;
  for await (const snap of app.getStateHistory(config)) {
    console.log(`#${i++}`, {
      values: snap.values,
      next: snap.next,
      checkpoint_id: snap.config?.configurable?.checkpoint_id,
    });
    if (i >= 5) break;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});