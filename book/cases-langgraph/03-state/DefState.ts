/**
 * 【精校可运行】最简 State 透传（第 23 章）
 * 原 Python: DefState.py
 *
 *   npx tsx book/cases-langgraph/03-state/DefState.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const BasicState = Annotation.Root({
  user_input: Annotation<string>,
  response: Annotation<string>,
  count: Annotation<number>,
  process_data: Annotation<Record<string, string>>,
});

async function main() {
  // 无业务节点：START -> END，状态原样透传
  const app = new StateGraph(BasicState)
    .addEdge(START, END)
    .compile();

  const initial = {
    user_input: "a",
    response: "resp",
    count: 25,
    process_data: { k1: "v1" },
  };
  const result = await app.invoke(initial);
  console.log("执行结果：", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});