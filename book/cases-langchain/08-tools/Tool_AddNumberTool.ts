/**
 * 【精校可运行】基础加法 Tool（第 17 章）
 * 原 Python: Tool_AddNumberTool.py
 *
 *   npx tsx book/cases-langchain/08-tools/Tool_AddNumberTool.ts
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const addNumber = tool(
  async ({ a, b }) => a + b,
  {
    name: "add_number",
    description: "两个整数相加",
    schema: z.object({
      a: z.number().int().describe("第一个整数"),
      b: z.number().int().describe("第二个整数"),
    }),
  },
);

async function main() {
  const result = await addNumber.invoke({ a: 1, b: 12 });
  console.log(result);
  console.log({
    name: addNumber.name,
    description: addNumber.description,
    schema: addNumber.schema,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});