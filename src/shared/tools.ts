import { tool } from "@langchain/core/tools";
import { z } from "zod";

/** Equivalent of Tool_AddNumberTool / Tool_AddNumberToolPro in the Python course. */
export const addNumberTool = tool(
  async ({ a, b }) => {
    return String(a + b);
  },
  {
    name: "add_number",
    description: "Add two integers and return the sum.",
    schema: z.object({
      a: z.number().int().describe("First integer"),
      b: z.number().int().describe("Second integer"),
    }),
  },
);

/** Mock weather tool (same teaching goal as QueryWeatherTool.py). */
export const getWeatherTool = tool(
  async ({ city }) => {
    const table: Record<string, string> = {
      北京: "晴，24°C，东北风 2 级",
      上海: "多云，27°C，东风 3 级",
      深圳: "阵雨，29°C，南风 2 级",
      beijing: "Sunny, 24C",
      shanghai: "Cloudy, 27C",
    };
    const key = city.trim();
    const lower = key.toLowerCase();
    return (
      table[key] ??
      table[lower] ??
      `${city}：暂无实时数据，教学示例默认 26°C，适合户外活动`
    );
  },
  {
    name: "get_weather",
    description: "Query current weather for a city. Use for weather questions.",
    schema: z.object({
      city: z.string().describe("City name, e.g. 北京 / Shanghai"),
    }),
  },
);

/** Simple company policy lookup tool for multi-agent demos. */
export const searchPolicyTool = tool(
  async ({ keyword }) => {
    const docs: Record<string, string> = {
      报销: "差旅报销：火车票/机票可报，需发票；市内交通单日上限 100 元。",
      请假: "年假每年 5 天；事假需主管审批；病假需医院证明超过 1 天。",
      加班: "工作日加班需提前登记；调休优先于加班费。",
    };
    const hit = Object.entries(docs).find(([k]) => keyword.includes(k));
    return hit
      ? hit[1]
      : `未找到与「${keyword}」直接相关的制度，请联系 HR。`;
  },
  {
    name: "search_policy",
    description: "Search internal HR / finance policy snippets by keyword.",
    schema: z.object({
      keyword: z.string().describe("Policy keyword, e.g. 报销 / 请假"),
    }),
  },
);

export const basicTools = [addNumberTool, getWeatherTool];
export const policyTools = [searchPolicyTool];