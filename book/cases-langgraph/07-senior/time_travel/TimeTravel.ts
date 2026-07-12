/**
 * 【精校可运行】Time-Travel 基础：检查点历史 + 从历史状态继续（第 25 章）
 * 原 Python: TimeTravel.py 教学意图精简版
 *
 *   npx tsx book/cases-langgraph/07-senior/time_travel/TimeTravel.ts
 */
import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

const TTState = Annotation.Root({
  value: Annotation<string>({
    reducer: (l, r) => l + r,
    default: () => "",
  }),
  step: Annotation<number>({
    reducer: (l, r) => l + r,
    default: () => 0,
  }),
});

function a() {
  console.log("node A");
  return { value: "A", step: 1 };
}
function b() {
  console.log("node B");
  return { value: "B", step: 1 };
}
function c() {
  console.log("node C");
  return { value: "C", step: 1 };
}

async function main() {
  const checkpointer = new MemorySaver();
  const app = new StateGraph(TTState)
    .addNode("a", a)
    .addNode("b", b)
    .addNode("c", c)
    .addEdge(START, "a")
    .addEdge("a", "b")
    .addEdge("b", "c")
    .addEdge("c", END)
    .compile({ checkpointer });

  const config = { configurable: { thread_id: "tt-demo" } };
  const result = await app.invoke({ value: "", step: 0 }, config);
  console.log("full run:", result);

  const history: Array<{ id?: string; values: unknown; next: unknown }> = [];
  for await (const snap of app.getStateHistory(config)) {
    history.push({
      id: snap.config?.configurable?.checkpoint_id as string | undefined,
      values: snap.values,
      next: snap.next,
    });
  }
  console.log("\nhistory snapshots:", history.length);
  // 取较早的一个检查点（通常 history[1] 或更后），演示“回到过去”
  const past = history.find((h) => Array.isArray(h.next) && h.next.length > 0);
  if (!past?.id) {
    console.log("no intermediate checkpoint found");
    return;
  }
  console.log("resume from checkpoint:", past.id, past.values, "next=", past.next);

  const resumed = await app.invoke(null, {
    configurable: {
      thread_id: "tt-demo",
      checkpoint_id: past.id,
    },
  });
  console.log("resumed result:", resumed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});