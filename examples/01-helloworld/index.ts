/**
 * Maps to: 案例与源码-2-LangChain框架/01-helloworld
 * Python refs: LangChainV1.0.py, StandardDesc.py
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { env, printRunHeader } from "../../src/shared/env.js";

async function main() {
  printRunHeader("01-helloworld | Chat model hello");
  console.log("model:", env.model);
  console.log("baseURL:", env.baseURL ?? "(OpenAI default)");

  const model = createChatModel(0.2);
  const res = await model.invoke([
    new SystemMessage("你是简洁的中文助教，用 3 句话解释概念。"),
    new HumanMessage("什么是 AI Agent？它和普通 Chatbot 有什么区别？"),
  ]);

  console.log("\n[AI]");
  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});