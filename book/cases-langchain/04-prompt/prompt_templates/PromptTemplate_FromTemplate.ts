/**
 * 【精校可运行】PromptTemplate.fromTemplate（第 13 章）
 *
 *   npx tsx book/cases-langchain/04-prompt/prompt_templates/PromptTemplate_FromTemplate.ts
 */
import { PromptTemplate } from "@langchain/core/prompts";

async function main() {
  const prompt = PromptTemplate.fromTemplate(
    "请用一句话向初学者解释：{concept}",
  );
  const text = await prompt.format({ concept: "Tool Calling" });
  console.log(text);

  // 也可作为 Runnable 调用
  const msg = await prompt.invoke({ concept: "RAG" });
  console.log(msg.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});