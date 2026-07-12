/**
 * 【精校可运行】天气 Tool（教学 mock）
 * 原 Python: QueryWeatherTool.py
 *
 *   npx tsx book/cases-langchain/08-tools/QueryWeatherTool.ts
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const table: Record<string, string> = {
  北京: JSON.stringify({
    name: "Beijing",
    weather: "晴",
    temp: 24,
    humidity: 40,
    wind: "东北风 2 级",
  }),
  Beijing: JSON.stringify({
    name: "Beijing",
    weather: "Sunny",
    temp: 24,
    humidity: 40,
    wind: "NE 2",
  }),
  上海: JSON.stringify({
    name: "Shanghai",
    weather: "多云",
    temp: 27,
    humidity: 65,
    wind: "东风 3 级",
  }),
  Shanghai: JSON.stringify({
    name: "Shanghai",
    weather: "Cloudy",
    temp: 27,
    humidity: 65,
    wind: "E 3",
  }),
};

export const getWeather = tool(
  async ({ city }) => {
    const key = city.trim();
    return (
      table[key] ||
      table[key.toLowerCase()] ||
      JSON.stringify({
        name: city,
        weather: "多云",
        temp: 26,
        humidity: 50,
        wind: "微风",
        note: "teaching mock",
      })
    );
  },
  {
    name: "get_weather",
    description: "查询指定城市即时天气。city 支持中文或英文，如 北京 / Beijing",
    schema: z.object({
      city: z.string().describe("城市名"),
    }),
  },
);

const isMain = process.argv[1]?.includes("QueryWeatherTool");
if (isMain) {
  getWeather
    .invoke({ city: process.argv[2] || "北京" })
    .then((r) => console.log(r))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}