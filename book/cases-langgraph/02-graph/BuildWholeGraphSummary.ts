/**
 * 【精校可运行】图构建全流程小结（第 22-23 章）
 * 原 Python: BuildWholeGraphSummary.py 教学意图
 *
 *   npx tsx book/cases-langgraph/02-graph/BuildWholeGraphSummary.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const SummaryState = Annotation.Root({
  input: Annotation<string>,
  step1: Annotation<string>,
  step2: Annotation<string>,
  final: Annotation<string>,
});

async function main() {
  const app = new StateGraph(SummaryState)
    .addNode("n1", (s) => ({ step1: `parse(${s.input})` }))
    .addNode("n2", (s) => ({ step2: `enrich(${s.step1})` }))
    .addNode("n3", (s) => ({ final: `done:${s.step2}` }))
    .addEdge(START, "n1")
    .addEdge("n1", "n2")
    .addEdge("n2", "n3")
    .addEdge("n3", END)
    .compile();

  const result = await app.invoke({
    input: "hello",
    step1: "",
    step2: "",
    final: "",
  });
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});