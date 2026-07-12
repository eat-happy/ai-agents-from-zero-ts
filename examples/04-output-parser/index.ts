/**
 * Maps to course chapter 14: 输出解析器
 * Zod structured output instead of Python Pydantic parsers.
 */
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

const JobPlanSchema = z.object({
  goal: z.string().describe("一周目标"),
  tasks: z.array(z.string()).min(3).max(5).describe("可执行任务列表"),
  risk: z.string().describe("最大风险"),
});

async function main() {
  printRunHeader("04-output-parser | structured output with Zod");

  const model = createChatModel(0).withStructuredOutput(JobPlanSchema);
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是求职规划助手。根据用户背景输出一周学习计划。",
    ],
    ["human", "{input}"],
  ]);

  const plan = await prompt.pipe(model).invoke({
    input: "我是 JS 开发，想转 AI Agent 应用岗，每天 2 小时。",
  });

  console.log(JSON.stringify(plan, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});