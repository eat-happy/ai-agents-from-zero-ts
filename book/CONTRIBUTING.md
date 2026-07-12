# Contributing to AI-Agents-From-Zero


<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：中文讲解来自原教程；**文中代码块已替换为仓库内真实可运行 TypeScript**（来自 `examples/` 与精校案例），不再展示自动机翻 Python。
> 完整精校清单：[POLISHED-CASES](POLISHED-CASES.md) · 电商问数可运行 Demo：`apps/shop-query-agent`


## TypeScript 可运行示例（推荐）

本章对应真实代码文件：[`examples/01-helloworld/index.ts`](../../examples/01-helloworld/index.ts)（路径相对仓库根目录时可直接打开）。

```typescript
// examples/01-helloworld/index.ts
/**
 * Maps to: 案例与源码-2-LangChain框架/01-helloworld
 * Python refs: LangChainV1.0.py, StandardDesc.py
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { env, printRunHeader } from "../../src/shared/env.js";

async function main() {
  printRunHeader("01-helloworld | Chat model hello");
  console.log("model:", env.model);
  console.log("baseURL:", env.baseURL ?? "(OpenAI default)");

  const model = createChatModel(0.2);
  const res = await model.invoke([
    new SystemMessage("你是简洁的中文助教，用 3 句话解释概念。"),
    new HumanMessage("什么是 AI Agent？它和普通 Chatbot 有什么区别？"),
  ]);

  console.log("
[AI]");
  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

运行（在仓库根目录）：

```bash
npx tsx examples/01-helloworld/index.ts
```



<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js**。
> 可运行精校示例见仓库根目录 `examples/` 与 `apps/shop-query-agent/`。自动迁移的代码块若与最新 SDK API 有差异，以可运行示例为准。


感谢你对本项目的关注 🙌

本项目旨在构建一套从零基础到企业级落地的 AI Agent 实战教程。
欢迎所有形式的贡献。

---

## 📌 可以贡献什么？

我们欢迎以下类型的贡献：

- 修复文档错误 / 错别字
- 补充案例说明
- 增加实战项目示例
- 优化代码结构
- 提供更优的 Prompt 模板
- 改进 RAG / Agent 架构方案
- 英文翻译（未来计划）

---

## 🛠 如何贡献？

### 1️⃣ Fork 仓库

点击右上角 Fork

### 2️⃣ 创建新分支

```bash
git checkout -b feature/your-feature-name
```
