# 14-mcp（TypeScript）

对应原仓库 `案例与源码-2-LangChain框架/11-mcp`。

## 文件

| 文件 | 作用 |
|------|------|
| `server.ts` | MCP Server：tools / resource / prompt（stdio） |
| `client-agent.ts` | 拉起 server → 取工具 → LangChain Agent |
| `mcp.json` | 连接配置示意（Cursor 等宿主可参考） |

## 运行

在仓库根目录：

```bash
# 需要 OPENAI_API_KEY（及可选 BASE_URL/MODEL）
npm run ex:14
```

自定义问题：

```bash
npx tsx examples/14-mcp/client-agent.ts 帮我查杭州天气
```

## 注意

- `server.ts` 走 stdio，**不要**在终端里单独“聊天式”输入，应由 client 启动。
- 教学版天气工具为本地 mock，不依赖 OpenWeather 外网 Key。