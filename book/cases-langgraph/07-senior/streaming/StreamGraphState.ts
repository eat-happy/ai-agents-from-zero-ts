/**
 * 【精校可运行】stream updates vs values（第 25 章）
 * 原 Python: StreamGraphState.py
 *
 *   npx tsx book/cases-langgraph/07-senior/streaming/StreamGraphState.ts
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const DiliState = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
});

function refineTopic(state: typeof DiliState.State) {
  return { topic: `${state.topic} and cats` };
}

function generateJoke(state: typeof DiliState.State) {
  return { joke: `This is a joke about ${state.topic}` };
}

async function main() {
  const graph = new StateGraph(DiliState)
    .addNode("refine_topic", refineTopic)
    .addNode("generate_joke", generateJoke)
    .addEdge(START, "refine_topic")
    .addEdge("refine_topic", "generate_joke")
    .addEdge("generate_joke", END)
    .compile();

  console.log("=== stream_mode=updates ===");
  for await (const chunk of await graph.stream(
    { topic: "ice cream", joke: "" },
    { streamMode: "updates" },
  )) {
    console.log(chunk);
  }

  console.log("\n=== stream_mode=values ===");
  for await (const chunk of await graph.stream(
    { topic: "ice cream", joke: "" },
    { streamMode: "values" },
  )) {
    console.log(chunk);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});