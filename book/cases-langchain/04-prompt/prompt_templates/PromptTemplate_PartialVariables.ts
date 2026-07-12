/**
 * 【精校可运行】PromptTemplate partial（第 13 章）
 *
 *   npx tsx book/cases-langchain/04-prompt/prompt_templates/PromptTemplate_PartialVariables.ts
 */
import { PromptTemplate } from "@langchain/core/prompts";

async function main() {
  const base = PromptTemplate.fromTemplate(
    "你是{role}。请回答：{question}",
  );
  const tutorPrompt = await base.partial({ role: "TypeScript Agent 助教" });
  const text = await tutorPrompt.format({
    question: "什么是 messagesStateReducer？",
  });
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});