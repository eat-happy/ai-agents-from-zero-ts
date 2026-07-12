/**
 * 【精校可运行】结构化输出（第 14 章，Zod 替代 Pydantic）
 * 原 Python: StructuredOutput_Pydantic.py 教学意图
 *
 *   npx tsx book/cases-langchain/05_parser/StructuredOutput_Zod.ts
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { createChatModel } from "../../../src/shared/llm.js";

const JobPlanSchema = z.object({
  goal: z.string().describe("一周目标"),
  tasks: z.array(z.string()).min(3).max(5),
  risk: z.string().describe("最大风险"),
});

async function main() {
  const model = createChatModel(0).withStructuredOutput(JobPlanSchema);
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是求职规划助手，输出结构化一周计划。"],
    ["human", "{input}"],
  ]);
  const plan = await prompt.pipe(model).invoke({
    input: "我是 JS 开发，想转 AI Agent 应用岗，每天 2 小时。",
  });
  console.log(JSON.stringify(plan, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});