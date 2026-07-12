/**
 * Bonus track for JS job seekers:
 * OpenAI Agents SDK (TypeScript) — modern alternative/complement to LangGraph.
 * Not in the original Python course, but aligned to the same concepts:
 * instructions + tools + handoffs.
 */
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { env, printRunHeader } from "../../src/shared/env.js";

// OpenAI Agents SDK reads OPENAI_API_KEY.
// For compatible gateways, set OPENAI_BASE_URL in env if your SDK version supports it.

const weatherTool = tool({
  name: "get_weather",
  description: "Get weather by city",
  parameters: z.object({ city: z.string() }),
  async execute({ city }) {
    return `${city}: 教学示例天气 26°C，多云`;
  },
});

async function main() {
  printRunHeader("13-openai-agents-sdk | agent + tool");
  console.log("model hint:", env.model);

  const agent = new Agent({
    name: "TS Assistant",
    instructions: "你是简洁的中文助手。查天气必须调用工具。",
    tools: [weatherTool],
    model: env.model,
  });

  const result = await run(agent, "帮我查一下杭州天气，并用一句话总结。");
  console.log("\n[finalOutput]\n", result.finalOutput);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});