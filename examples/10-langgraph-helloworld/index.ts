/**
 * Maps to: 案例与源码-3-LangGraph框架/01-helloworld
 * Course chapter 22 sample graph + LLM node + parallel fan-out.
 */
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

// --- Graph A: pure state transform (no LLM) ---
const HelloState = Annotation.Root({
  name: Annotation<string>,
  greeting: Annotation<string>,
  finalText: Annotation<string>,
});

function greet(state: typeof HelloState.State) {
  return { greeting: `你好，${state.name}` };
}

function addEmoji(state: typeof HelloState.State) {
  return { finalText: `${state.greeting} 👋` };
}

function buildHelloGraph() {
  return new StateGraph(HelloState)
    .addNode("greet", greet)
    .addNode("add_emoji", addEmoji)
    .addEdge(START, "greet")
    .addEdge("greet", "add_emoji")
    .addEdge("add_emoji", END)
    .compile();
}

// --- Graph B: parallel retrieval then merge ---
const QAState = Annotation.Root({
  query: Annotation<string>,
  ragResult: Annotation<string>,
  webResult: Annotation<string>,
  finalAnswer: Annotation<string>,
});

function ragSearch(state: typeof QAState.State) {
  return { ragResult: `知识库：关于「${state.query}」的内部资料片段` };
}

function webSearch(state: typeof QAState.State) {
  return { webResult: `联网：关于「${state.query}」的公开信息片段` };
}

async function finalAnswer(state: typeof QAState.State) {
  const model = createChatModel(0);
  const res = await model.invoke(
    `综合以下信息，用 2 句话回答用户问题「${state.query}」\n` +
      `RAG: ${state.ragResult}\nWEB: ${state.webResult}`,
  );
  return { finalAnswer: String(res.content) };
}

function buildParallelQAGraph() {
  return new StateGraph(QAState)
    .addNode("rag_search", ragSearch)
    .addNode("web_search", webSearch)
    .addNode("final_answer", finalAnswer)
    .addEdge(START, "rag_search")
    .addEdge(START, "web_search")
    .addEdge("rag_search", "final_answer")
    .addEdge("web_search", "final_answer")
    .addEdge("final_answer", END)
    .compile();
}

async function main() {
  printRunHeader("10-langgraph-helloworld | state graph basics");

  const hello = buildHelloGraph();
  const helloResult = await hello.invoke({
    name: "小林",
    greeting: "",
    finalText: "",
  });
  console.log("[hello graph]", helloResult);

  printRunHeader("10-langgraph-helloworld | parallel fan-in");
  const qa = buildParallelQAGraph();
  const qaResult = await qa.invoke({
    query: "TypeScript 做 Agent 有什么优势",
    ragResult: "",
    webResult: "",
    finalAnswer: "",
  });
  console.log("[parallel QA]", qaResult.finalAnswer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});