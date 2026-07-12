/**
 * 【精校可运行】MessagesPlaceholder 多轮消息占位（第 13 章）
 *
 *   npx tsx book/cases-langchain/04-prompt/chat_prompt_template/placeholder/ChatPromptTemplate_MessagesPlaceholder.ts
 */
import {
  AIMessage,
  HumanMessage,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

async function main() {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是有记忆的助教。"],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const messages = await prompt.formatMessages({
    history: [
      new HumanMessage("我叫小林"),
      new AIMessage("你好小林"),
    ],
    input: "还记得我的名字吗？",
  });

  for (const m of messages) {
    console.log(`[${m.getType()}] ${m.content}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});