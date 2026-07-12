/**
 * Maps to: 案例与源码-2-LangChain框架/11-mcp/McpServerByFastMCP.py
 * + McpServerWeatherByFastMCP.py (tools only, stdio transport)
 *
 * Run by MCP client (do not type into this process manually):
 *   npx tsx examples/14-mcp/server.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const weatherTable: Record<string, string> = {
  北京: "晴，24°C，东北风 2 级",
  上海: "多云，27°C，东风 3 级",
  深圳: "阵雨，29°C，南风 2 级",
  beijing: "Sunny, 24C",
  shanghai: "Cloudy, 27C",
  hangzhou: "Light rain, 22C",
};

const server = new McpServer({
  name: "ai-agents-from-zero-ts-demo",
  version: "0.1.0",
});

server.registerTool(
  "add",
  {
    description: "Add two integers and return the sum.",
    inputSchema: {
      a: z.number().int().describe("First integer"),
      b: z.number().int().describe("Second integer"),
    },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }),
);

server.registerTool(
  "get_weather",
  {
    description: "Query current weather for a city (teaching mock data).",
    inputSchema: {
      city: z.string().describe("City name, e.g. 北京 / Shanghai"),
    },
  },
  async ({ city }) => {
    const key = city.trim();
    const lower = key.toLowerCase();
    const text =
      weatherTable[key] ??
      weatherTable[lower] ??
      `${city}：教学示例默认 26°C，多云`;
    return { content: [{ type: "text", text }] };
  },
);

server.registerResource(
  "greeting",
  "greeting://default",
  {
    description: "Static greeting resource for MCP demos",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/plain",
        text: "Hello from static MCP resource!",
      },
    ],
  }),
);

server.registerPrompt(
  "greet_user",
  {
    description: "Generate a short greeting prompt template",
    argsSchema: {
      name: z.string().describe("User name"),
      style: z
        .enum(["friendly", "formal", "casual"])
        .optional()
        .describe("Greeting style"),
    },
  },
  async ({ name, style }) => {
    const styles: Record<string, string> = {
      friendly: "写一句友善的问候",
      formal: "写一句正式的问候",
      casual: "写一句轻松的问候",
    };
    const s = style ?? "friendly";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `为${name}${styles[s] ?? styles.friendly}`,
          },
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});