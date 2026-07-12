/**
 * 【精校可运行】ChatPromptTemplate.fromMessages（第 13 章）
 *
 *   npx tsx book/cases-langchain/04-prompt/chat_prompt_template/ChatPromptTemplate_Constructor.ts
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createChatModel } from "../../../../src/shared/llm.js";

async function main() {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是{role}，回答简洁。"],
    ["human", "主题：{topic}"],
  ]);

  // 先看格式化后的消息
  const messages = await prompt.formatMessages({
    role: "求职教练",
    topic: "如何用 TS 做 Agent 作品集",
  });
  console.log(
    messages.map((m) => `${m.getType()}: ${m.content}`).join("\n"),
  );

  // 需要 API Key 时才会真正调用模型
  if (process.env.OPENAI_API_KEY) {
    const chain = prompt.pipe(createChatModel(0.2));
    const res = await chain.invoke({
      role: "求职教练",
      topic: "如何用 TS 做 Agent 作品集",
    });
    console.log("\n[model]\n", res.content);
  } else {
    console.log("\n(未设置 OPENAI_API_KEY，跳过模型调用)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});