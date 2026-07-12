/**
 * 【精校可运行】多工具天气比较 Agent（第 21 章 V1.0 意图）
 * 原 Python: AgentSmartSelectV1.0.py
 * 使用 mock 天气工具 + createReactAgent（不依赖 OpenWeather Key）
 *
 *   npx tsx book/cases-langchain/12-agent/AgentSmartSelectV1.0.ts
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "../../../src/shared/llm.js";

const weatherDb: Record<string, { temp: number; desc: string }> = {
  Beijing: { temp: 10.5, desc: "阴，多云" },
  Shanghai: { temp: 15.3, desc: "晴" },
  Shenzhen: { temp: 28.1, desc: "阵雨" },
  北京: { temp: 10.5, desc: "阴，多云" },
  上海: { temp: 15.3, desc: "晴" },
  深圳: { temp: 28.1, desc: "阵雨" },
};

const getWeather = tool(
  async ({ loc }) => {
    const hit = weatherDb[loc] || weatherDb[loc.trim()];
    if (!hit) {
      return JSON.stringify({ name: loc, temp: 26, desc: "教学默认多云" });
    }
    return JSON.stringify({ name: loc, temp: hit.temp, desc: hit.desc });
  },
  {
    name: "get_weather",
    description: "查询城市天气。loc 如 Beijing/Shanghai/北京/上海",
    schema: z.object({ loc: z.string() }),
  },
);

async function main() {
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: [getWeather],
  });

  const question =
    process.argv.slice(2).join(" ") ||
    "请问今天北京和上海的天气怎么样，哪个城市更热？请比较温度并给结论。";

  const result = await agent.invoke({
    messages: [new HumanMessage(question)],
  });
  const last = result.messages[result.messages.length - 1];
  console.log(last.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});