/**
 * Maps to: 案例与源码-2-LangChain框架/02-models_io
 * Focus: model I/O, batch, streaming
 */
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

async function main() {
  printRunHeader("02-models-io | invoke / batch / stream");
  const model = createChatModel(0.3);

  // 1) invoke
  const one = await model.invoke([new HumanMessage("用一句话介绍 TypeScript")]);
  console.log("\n[invoke]", one.content);

  // 2) batch
  const many = await model.batch([
    [new HumanMessage("1+1=?")],
    [new HumanMessage("用一个词形容 Agent")],
  ]);
  console.log("\n[batch]");
  many.forEach((m, i) => console.log(`#${i + 1}`, m.content));

  // 3) stream
  process.stdout.write("\n[stream] ");
  const stream = await model.stream([
    new HumanMessage("用 40 字以内介绍 LangChain.js"),
  ]);
  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content ?? ""));
  }
  console.log("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});