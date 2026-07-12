/**
 * 【精校可运行】模型 invoke / batch / stream（第 11/13 章）
 * 合并教学：LLM_Invoke.py / LLM_Batch.py / LLM_Stream.py
 *
 *   npx tsx book/cases-langchain/04-prompt/invoke/LLM_Invoke_Stream_Batch.ts
 */
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel } from "../../../../src/shared/llm.js";

async function main() {
  const model = createChatModel(0.2);

  console.log("=== invoke ===");
  const one = await model.invoke([new HumanMessage("用一句话介绍 TypeScript")]);
  console.log(one.content);

  console.log("\n=== batch ===");
  const many = await model.batch([
    [new HumanMessage("1+1=?")],
    [new HumanMessage("用一个词形容 Agent")],
  ]);
  many.forEach((m, i) => console.log(`#${i + 1}`, m.content));

  process.stdout.write("\n=== stream ===\n");
  const stream = await model.stream([
    new HumanMessage("用 40 字以内介绍 LangChain.js"),
  ]);
  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content ?? ""));
  }
  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});