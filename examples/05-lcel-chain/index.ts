/**
 * Maps to course chapter 15: LCEL 与链式调用
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

async function main() {
  printRunHeader("05-lcel-chain | RunnableSequence");

  const prompt = ChatPromptTemplate.fromTemplate(
    "把下面概念讲给初学者听，100 字以内：{concept}",
  );
  const model = createChatModel(0.2);
  const parser = new StringOutputParser();

  const chain = RunnableSequence.from([prompt, model, parser]);
  const text = await chain.invoke({ concept: "Tool Calling" });
  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});