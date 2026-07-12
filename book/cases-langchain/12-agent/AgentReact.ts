/**
 * 【精校可运行】ReAct 电商助手（第 21 章）
 * 原 Python: AgentReact.py
 *
 *   npx tsx book/cases-langchain/12-agent/AgentReact.ts
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "../../../src/shared/llm.js";

const PRODUCT_DATABASE: Record<
  string,
  Array<{ id: string; name: string; popularity: number; price: number }>
> = {
  无线耳机: [
    { id: "WH-1000XM5", name: "索尼 WH-1000XM5", popularity: 95, price: 299 },
    { id: "QC45", name: "Bose QuietComfort 45", popularity: 88, price: 329 },
    { id: "AIRMAX", name: "苹果 AirPods Max", popularity: 92, price: 549 },
  ],
  游戏鼠标: [
    { id: "GPW", name: "罗技 G Pro 无线", popularity: 90, price: 129 },
    { id: "VIPER", name: "雷蛇 Viper V2 Pro", popularity: 87, price: 149 },
  ],
};

const INVENTORY: Record<string, { stock: number; location: string }> = {
  "WH-1000XM5": { stock: 10, location: "仓库-A" },
  QC45: { stock: 0, location: "仓库-B" },
  AIRMAX: { stock: 5, location: "仓库-C" },
  GPW: { stock: 8, location: "仓库-C" },
  VIPER: { stock: 12, location: "仓库-A" },
};

const searchProducts = tool(
  async ({ query }) => {
    console.log(`[tool] search_products(${query})`);
    const category = Object.keys(PRODUCT_DATABASE).find((c) => query.includes(c));
    if (!category) return `未找到匹配「${query}」的产品`;
    const items = [...PRODUCT_DATABASE[category]].sort(
      (a, b) => b.popularity - a.popularity,
    );
    return items
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} (ID:${p.id}) 热度${p.popularity} ￥${p.price}`,
      )
      .join("\n");
  },
  {
    name: "search_products",
    description: "按类别搜索产品，如无线耳机、游戏鼠标",
    schema: z.object({ query: z.string() }),
  },
);

const checkInventory = tool(
  async ({ productId }) => {
    console.log(`[tool] check_inventory(${productId})`);
    const info = INVENTORY[productId];
    if (!info) return `未找到产品ID: ${productId}`;
    const status = info.stock > 0 ? "有库存" : "缺货";
    return `${productId}: ${status} (${info.stock}) @ ${info.location}`;
  },
  {
    name: "check_inventory",
    description: "根据产品 ID 查询库存",
    schema: z.object({ productId: z.string() }),
  },
);

async function main() {
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: [searchProducts, checkInventory],
  });

  const question =
    process.argv.slice(2).join(" ") ||
    "帮我找最受欢迎的无线耳机，并检查第一名库存，用中文给购买建议。";

  const result = await agent.invoke({
    messages: [new HumanMessage(question)],
  });

  for (const msg of result.messages) {
    console.log(`\n[${msg.getType()}]`, msg.content);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});