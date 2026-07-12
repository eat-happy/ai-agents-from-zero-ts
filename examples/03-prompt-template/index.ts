/**
 * Maps to course chapter 13: 提示词与消息模板
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

async function main() {
  printRunHeader("03-prompt-template | ChatPromptTemplate");

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是{role}，回答要简洁，并给出 1 个可执行建议。"],
    ["human", "主题：{topic}"],
  ]);

  const model = createChatModel(0.2);
  const chain = prompt.pipe(model);

  const res = await chain.invoke({
    role: "Agent 求职教练",
    topic: "如何用 TypeScript 做 Agent 作品集",
  });

  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});