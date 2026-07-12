/**
 * 【精校可运行】LCEL RunnableSequence（第 15 章）
 * 原 Python: LCEL_RunnableSequenceDemo.py
 *
 *   npx tsx book/cases-langchain/06-lcel/LCEL_RunnableSequenceDemo.ts
 */
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createChatModel } from "../../../src/shared/llm.js";

async function main() {
  const prompt = ChatPromptTemplate.fromTemplate(
    "把下面概念讲给初学者听，100 字以内：{concept}",
  );
  const chain = RunnableSequence.from([
    prompt,
    createChatModel(0.2),
    new StringOutputParser(),
  ]);
  const text = await chain.invoke({
    concept: process.argv[2] || "Tool Calling",
  });
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});