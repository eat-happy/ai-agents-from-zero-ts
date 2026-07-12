# 21 - Agent 智能体

<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：中文讲解保留原教程；**代码块使用仓库内真实 TypeScript**（`examples/` / 精校案例 / `apps/shop-query-agent`），不再使用机翻 Python。
> 精校清单：[POLISHED-CASES](POLISHED-CASES.md)


## TypeScript 可运行示例（推荐）

本章优先对照仓库真实文件：`examples/09-agent/index.ts`

```typescript
// examples/09-agent/index.ts
/**
 * Maps to: 案例与源码-2-LangChain框架/12-agent
 * Python refs: AgentSmartSelectV1.0.py, AgentReact.py
 *
 * Modern LangChain JS path: createReactAgent (tool-calling ReAct loop).
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "../../src/shared/llm.js";
import { basicTools } from "../../src/shared/tools.js";
import { printRunHeader } from "../../src/shared/env.js";

const PRODUCT_DATABASE: Record<
  string,
  Array<{ id: string; name: string; popularity: number; price: number }>
> = {
  无线耳机: [
    { id: "WH-1000XM5", name: "索尼 WH-1000XM5", popularity: 95, price: 299 },
    { id: "QC45", name: "Bose QuietComfort 45", popularity: 88, price: 329 },
  ],
  游戏鼠标: [
    { id: "GPW", name: "罗技 G Pro 无线", popularity: 90, price: 129 },
    { id: "VIPER", name: "雷蛇 Viper V2 Pro", popularity: 87, price: 149 },
  ],
};

const INVENTORY: Record<string, { stock: number; location: string }> = {
  "WH-1000XM5": { stock: 10, location: "仓库-A" },
  QC45: { stock: 0, location: "仓库-B" },
  GPW: { stock: 8, location: "仓库-C" },
  VIPER: { stock: 12, location: "仓库-A" },
};

const searchProductsTool = tool(
  async ({ query }) => {
    const category = Object.keys(PRODUCT_DATABASE).find((c) => query.includes(c));
    if (!category) return `未找到与「${query}」匹配的产品类别`;
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

const checkInventoryTool = tool(
  async ({ productId }) => {
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

async function runMathWeatherAgent() {
  printRunHeader("09-agent | tool agent (math + weather)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: basicTools,
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage("请计算 45+17，并查询深圳天气，最后用中文给一个简短总结。"),
    ],
  });

  const last = result.messages[result.messages.length - 1];
  console.log("[final]", last.content);
}

async function runReactShopAgent() {
  printRunHeader("09-agent | ReAct shop agent (search + inventory)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: [searchProductsTool, checkInventoryTool],
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "帮我找最受欢迎的无线耳机，并检查第一名的库存，用中文给出购买建议。",
      ),
    ],
  });

  for (const msg of result.messages) {
    const role = msg.getType?.() ?? msg.constructor.name;
    console.log(`\n[${role}]`, msg.content);
  }
}

async function main() {
  await runMathWeatherAgent();
  await runReactShopAgent();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```bash
npx tsx examples/09-agent/index.ts
```



---

**本章课程目标：**

- 理解 **Agent（智能体）** 到底是什么、适合解决什么问题，以及它与 [Tool](17-Tools工具调用.md)、Function Calling、[RAG](19-RAG检索增强生成.md)、[MCP](20-MCP模型上下文协议.md) 的关系。
- 掌握 Agent 的核心工作方式：**围绕目标持续推理、决定是否调用工具、接收结果、继续决策，直到满足结束条件**。
- 理解 LangChain 中 Agent 的两条学习主线：**V0.3 / classic 的 Agent + AgentExecutor**，以及 **V1.x 的 `create_agent` + LangGraph 运行时**。
- 跑通并理解本章全部案例：`AgentSmartSelectV0.3.py`、`AgentSmartSelectV1.0.py`、`AgentReact.py`、`Agent2Agent.py`、`McpClientAgent.py`。

**学习建议：** Agent 这章先抓一句话：Agent 是决策层，不是工具本身。读的时候先看它如何决定下一步，再看 Tool、RAG、MCP、Function Calling 分别给它补了什么能力。代码部分重点比较旧的 AgentExecutor 和新的 `create_agent` 思路；读完后要能判断一个需求到底该用普通链、工具调用，还是 Agent。

**官方文档与资源**：详见 [工具导航与参考资料索引 - 工具调用、MCP与智能体](工具导航与参考资料索引.md#工具调用、MCP与智能体)。

---

## 1、Agent 简介

### 1.1 定义

先给初学者一句最重要的话：**Agent 不是某个单独的模型，也不是某个单独的工具，而是一种“围绕目标持续做决策并调用能力”的运行方式。**

如果只看最小本质，可以把 Agent 看作：**Agent = 模型 + 工具集 + 运行循环 + 当前状态**。

这里的四个部分分别代表：

- **模型（Model）**：负责理解用户目标、分析当前局面、决定下一步。
- **工具集（Tools）**：负责执行动作，例如查天气、查库存、调用 API、搜索文档、访问数据库。
- **运行循环（Loop）**：负责让模型不是只回答一次，而是可以“想一步、做一步、看结果、再决定下一步”。
- **状态（State）**：负责保存本轮对话、工具返回、中间结果，有时也包含短期记忆。

这也是本章首先要修正的一个常见误区：**不是所有 Agent 都必须同时具备“长期记忆、复杂规划、多智能体协作”。**

对很多入门场景来说，一个最简单的 Agent 只要能：1. 读懂用户目标；2. 知道什么时候调工具；3. 能根据工具结果继续判断；4. 最后给出答案。就已经是 Agent 了。

上面的公式是帮助你先抓住重点的“最小理解版”。如果把 Agent 再进一步展开，它在更完整的架构图里还可能包含记忆、规划、反思等能力。所以下图更适合理解为“扩展后的能力拼图”，而不是和上面四项定义做一一对应。

![Agent 扩展架构示意：中心为 Agent，周邻 Memory（短/长期）、Planning（反思、自评、思维链）、Tools（日历、计算、搜索等）与 Action，强调多模块协同而非最小四元组一一对应（中文）](images/21/21-1-1-2.png)

![Agent 扩展架构示意：中心为 Agent，周邻 Memory（短/长期）、Planning（反思、自评、思维链）、Tools（日历、计算、搜索等）与 Action，强调多模块协同而非最小四元组一一对应（英文）](images/21/21-1-1-1.jpeg)

### 1.2 Agent 最常见的工作方式：ReAct

**ReAct = Reason + Act。**中文可以看作：**先推理，再行动。**

这是 Agent 最经典的一种运行循环：

1. **Thought / Reason（思考）**：当前要做什么，先想一步。
2. **Action（行动）**：如果需要外部能力，就调用某个工具。
3. **Observation（观察）**：拿到工具返回结果。
4. **继续循环或结束**：如果还没完成，就继续下一轮；如果信息足够，就给出最终答案。

所以 ReAct 的本质就是：**先推理，再行动；根据行动结果，再继续推理。**

这点和普通“只回答一次”的 LLM 调用差异非常大。普通对话通常是：用户提问、模型直接回答。而 Agent 更像：用户提问、模型判断要不要查工具、调工具、看结果、再判断要不要继续、最终回答。

下图正好对应这条循环：

![ReAct 模式：思考（Thought）→ 行动（Action）→ 观察（Observation）→ 根据结果继续循环或给出最终答案的闭环示意](images/21/21-1-2-1.jpeg)

这里还要补一个现实中的重要认知：**现代 Tool Calling Agent 不一定会把“Thought”完整显示给你看。**

很多时候你在代码里真正看到的是：

- `AIMessage` 里出现 `tool_calls`
- 工具执行后得到 `ToolMessage`
- 最后再出现一个普通 `AIMessage`

所以在今天的 LangChain / Tool Calling 语境里，ReAct 更应该被理解成一种**工作机制**，而不只是某种固定的 Prompt 模板格式。

**Agent 不只有 ReAct 这一种工作方式。**

ReAct 只是最经典、最适合入门的一种理解方式，因为它最容易让人看懂“为什么 Agent 不只是一次回答”。但在真实项目里，常见的 Agent 形态还包括：

- **Plan-and-Execute**：先整体规划，再按计划逐步执行。
- **Router / Supervisor**：先判断该把任务交给哪个工具、哪个子 Agent、哪个流程。
- **Workflow + Agent 混合**：固定部分用工作流，遇到不确定节点时再让 Agent 决策。
- **Multi-Agent / A2A**：多个 Agent 分工协作，由一个主 Agent 或协调器统筹。
- **Human-in-the-loop**：关键步骤需要人工确认，Agent 不是全自动闭环。

所以更准确的结论是：

- **ReAct 是 Agent 最经典的一种工作机制**
- **不是 Agent 的唯一形态**
- **本章先用 ReAct 入门，是因为它最容易把 Agent 的核心价值讲清楚**

### 1.3 Tool 与 Agent 的关系

这一节是整章最容易混淆的地方。

**Tool（工具）** 是能力封装。

例如： `get_weather()`、`search_products()`、`check_inventory()`、`book_flight()`。它们都只是“能做一件事”的函数或接口。

**Agent** 则是决策者。

它负责判断：现在要不要调用工具、调哪个工具、先调哪个、后调哪个、一个工具够不够、工具失败了要不要重试或换路线、什么时候可以停止并给最终答案。

所以两者关系可以概括成：**Tool = 能力；Agent = 决策 + 使用这些能力。**

| 对象      | 本质定位 | 一句话理解                         |
| --------- | -------- | ---------------------------------- |
| **Tool**  | 能力层   | 我能做什么                         |
| **Agent** | 决策层   | 我什么时候、按什么顺序去用这些能力 |

也正因为如此，**不是“有 Tool 就有 Agent”**。比如“查一下北京天气”这种一步问题，直接调一个天气工具就够了，完全可以不需要 Agent。

但如果问题变成：“帮我找最热门的无线耳机，再查库存，再告诉我哪款可以买”；“先订机票，再订酒店，再预约打车”；“先查知识库，再看是否需要调外部 API，再整理成报告”。

这时就不是某个单独 Tool 能解决的了，而是需要有人负责多步决策，这时 Agent 才有价值。

### 1.4 Agent 的使用场景

这一点结合官方关于 **workflow vs agent** 的区分来理解最清楚。这里的 **workflow**，中文通常可以理解成：**工作流 / 固定流程**。指的是一条**步骤基本提前确定、执行顺序相对稳定**的处理路线，例如先做 A，再做 B，再做 C，中间不太需要模型临场决定“下一步该怎么走”。

先把它和 Agent 粗略区分开会更清楚：**workflow** 的流程基本写死，重点是“按既定步骤执行”；**agent** 的流程不完全固定，重点是“根据上下文动态决策”。**如果流程路径是固定的，优先考虑工作流 / 链，而不是 Agent。**

比如：

- 固定先做文本切分，再做向量化，再写入向量库
- 固定先分类，再摘要，再存库
- 固定按 A → B → C 的顺序执行

这类场景更像 [第 15 章 LCEL 与链式调用](15-LCEL与链式调用.md) 或后续 LangGraph 的**工作流**问题。

**如果下一步怎么做不固定，需要模型根据中间结果动态决定，就更适合 Agent。**

比如：

- 用户问题不确定，需要模型决定先查库还是先调 API
- 工具很多，模型要自己选哪个
- 可能要调一次工具，也可能要调很多次
- 工具返回后还要继续推理

所以更贴近实际项目的判断标准可以写成：

| 场景                                                   | 更适合什么  |
| ------------------------------------------------------ | ----------- |
| 路径固定、步骤明确、顺序可提前写死                     | 链 / 工作流 |
| 路径不固定、工具选择依赖上下文、中间结果会影响后续决策 | Agent       |

这也是为什么今天很多企业项目其实是：**Workflow 负责固定骨架，Agent 负责不确定节点的决策。**

从 2025-2026 年的真实项目看，Agent 的典型场景也在从“会调几个工具”扩展到更完整的任务闭环。比如：

- **浏览器自动化 / Computer Use Agent**：根据目标理解页面、点击按钮、填写表单、滚动页面，并通过截图或页面状态校验结果。
- **长任务研究代理**：围绕复杂问题拆分子任务，多轮搜索、交叉验证资料，最后生成带来源的结构化报告。
- **代码库维护代理**：读取代码库、定位相关文件、制定修改计划、编辑代码、运行测试，并根据失败结果继续修复。
- **文件 / 数据分析代理**：读取表格、PDF、日志或业务数据，调用代码执行、SQL、统计或可视化工具，输出分析结论和图表。

这些例子仍然符合上面的判断标准：如果流程完全固定，用链或工作流更稳；如果每一步都要根据中间结果继续判断，才更适合交给 Agent。

---

## 2、演变过程：从多步组装到一步创建

### 2.1 V0.3 / classic 路线：显式组装 Agent

在较早的 LangChain Agent 写法中，通常要显式准备这些部分：1. 模型；2. 工具列表；3. Prompt 模板；4. `create_tool_calling_agent(...)`；5. `AgentExecutor(...)`。

也就是说，Agent 本身只负责“出主意、决定调用什么”，真正驱动循环、执行工具、把结果写回上下文的，通常是 **AgentExecutor**。

这一套写法的优点是：结构清楚、很适合教学、容易看懂 Agent 和 Executor 是怎么配合的。

它的局限是：代码更长、容易被 Prompt、scratchpad、executor 等概念同时压住、工程上需要手动拼接更多组件。

仓库里的 `AgentSmartSelectV0.3.py` 就是这条路线的典型案例。

### 2.2 V1.x 路线：create_agent 一步创建

到了 LangChain 1.x，官方更推荐的入口是：

```typescript
// Real TypeScript from repo: examples/09-agent/index.ts
/**
 * Maps to: 案例与源码-2-LangChain框架/12-agent
 * Python refs: AgentSmartSelectV1.0.py, AgentReact.py
 *
 * Modern LangChain JS path: createReactAgent (tool-calling ReAct loop).
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "../../src/shared/llm.js";
import { basicTools } from "../../src/shared/tools.js";
import { printRunHeader } from "../../src/shared/env.js";

const PRODUCT_DATABASE: Record<
  string,
  Array<{ id: string; name: string; popularity: number; price: number }>
> = {
  无线耳机: [
    { id: "WH-1000XM5", name: "索尼 WH-1000XM5", popularity: 95, price: 299 },
    { id: "QC45", name: "Bose QuietComfort 45", popularity: 88, price: 329 },
  ],
  游戏鼠标: [
    { id: "GPW", name: "罗技 G Pro 无线", popularity: 90, price: 129 },
    { id: "VIPER", name: "雷蛇 Viper V2 Pro", popularity: 87, price: 149 },
  ],
};

const INVENTORY: Record<string, { stock: number; location: string }> = {
  "WH-1000XM5": { stock: 10, location: "仓库-A" },
  QC45: { stock: 0, location: "仓库-B" },
  GPW: { stock: 8, location: "仓库-C" },
  VIPER: { stock: 12, location: "仓库-A" },
};

const searchProductsTool = tool(
  async ({ query }) => {
    const category = Object.keys(PRODUCT_DATABASE).find((c) => query.includes(c));
    if (!category) return `未找到与「${query}」匹配的产品类别`;
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

const checkInventoryTool = tool(
  async ({ productId }) => {
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

async function runMathWeatherAgent() {
  printRunHeader("09-agent | tool agent (math + weather)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: basicTools,
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage("请计算 45+17，并查询深圳天气，最后用中文给一个简短总结。"),
    ],
  });

  const last = result.messages[result.messages.length - 1];
  console.log("[final]", last.content);
}

async function runReactShopAgent() {
  printRunHeader("09-agent | ReAct shop agent (search + inventory)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: [searchProductsTool, checkInventoryTool],
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "帮我找最受欢迎的无线耳机，并检查第一名的库存，用中文给出购买建议。",
      ),
    ],
  });

  for (const msg of result.messages) {
    const role = msg.getType?.() ?? msg.constructor.name;
    console.log(`\n[${role}]`, msg.content);
  }
}

async function main() {
  await runMathWeatherAgent();
  await runReactShopAgent();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

然后直接把模型、工具、系统提示等交进去，得到一个可运行的 Agent。

这种方式的核心变化不是“Agent 不循环了”，而是：**很多原来要自己显式组装的部分，被封装进了更统一的运行时。**

根据当前官方文档，`create_agent` 背后使用的是**基于 LangGraph 的 graph-based runtime**。这里的 **graph-based runtime**，可以看成：**Agent 的执行过程不再只是“一次函数调用”，而是由一个基于状态流转的运行框架来驱动。**

可以把它看成这样：

- 当前有哪些消息和中间结果，这是**状态**
- 下一步是继续让模型推理、去调工具，还是结束输出，这是**状态流转**
- 整个过程像一张“节点 + 连线”的执行图，所以叫 **graph-based**

这里不用先深入 LangGraph 细节，先抓住一句话就够了：

**`create_agent` 虽然看起来像一步创建，但底层仍然有一套负责“循环、状态、工具调用”的运行时在支撑它。**

这意味着：Agent 仍然在循环，仍然会调工具，仍然会维护消息状态。只是这些动作不再要求你手动拼出一套 `Agent + AgentExecutor + scratchpad` 才能跑。

### 2.3 这两条路线的意义

对你这套教程来说，这两条路线都值得保留，因为它们分别承担不同教学价值：

- **V0.3 / classic 路线**  
  帮助你理解 Agent 内部到底怎么转：Prompt、工具、Executor、循环是怎么配合的。

- **V1.x / `create_agent` 路线**  
  帮助你掌握当前官方更推荐的写法，更接近真实项目开发。

所以这一章不是在教你背两个 API，而是在教你：**经典写法怎么看**，**当前写法怎么用**，**二者背后的 Agent 本质其实是同一件事**。

下图就可以把这种“从组件输入到 Agent 创建”的感觉建立起来：

![三步组装智能体示意：① 定义工具（如 `tools = [get_weather]`）② 构建系统提示 ③ 调用 `create_agent(model, tools, system_prompt)` 将 Tools / Prompt / Model 收口为可运行 Agent](images/21/21-2-1-1.jpeg)

### 2.4 V0.3 与 V1.x 的对比速览

| 维度       | V0.3 / classic                                | V1.x / `create_agent`  |
| ---------- | --------------------------------------------- | ---------------------- |
| 核心入口   | `create_tool_calling_agent` + `AgentExecutor` | `create_agent`         |
| 代码组织   | 手动拼更多组件                                | 统一入口更简洁         |
| 学习价值   | 更容易看清内部结构                            | 更接近当前官方主线     |
| 运行方式   | Agent 决策，Executor 驱动循环                 | graph runtime 驱动循环 |
| 更适合     | 理解原理、维护旧案例                          | 新项目、快速搭建       |

还有一个实践补充：

**当前官方 1.x 文档更强调以 `messages` 状态作为 Agent 的统一输入。**但本教程仓库中为了教学连续性，仍保留了部分 `{"input": "..."}` 风格示例。读代码时先抓住入口含义：**它们都是在给 Agent 一个“新的用户请求”**，只是不同版本、不同适配层的调用方式略有差异。

---

## 3、Agent 工作原理（V0.3）

这一节聚焦本教程里的 classic 路线，因为它最适合拆开理解 Agent 的内部工作机制。

### 3.1 保留 V0.3 的原因

虽然今天新项目更常直接用 `create_agent`，但 classic 路线依然有学习价值。它能让你看清楚：Agent 自己负责什么，AgentExecutor 负责什么，为什么 Prompt 里要有 `agent_scratchpad`，工具结果是怎么“再喂回去”给模型继续推理的。

### 3.2 Agent 与 AgentExecutor 的职责分工

在 V0.3 / classic 路线下，职责可以直接拆成：

- **Agent**：负责分析输入、决定下一步动作
- **AgentExecutor**：负责执行动作、拿结果、继续驱动循环

也就是说：**Agent 更像大脑，AgentExecutor 更像执行器和循环调度器。**这也是为什么单独有 Agent 通常还不够，还要再交给 Executor 去跑。

下图正好适合理解这一点：

![AgentExecutor 工作流示意：左侧为消息流（Input、模型回复、History）；中间为 Agent 链（Prompt、LLM、输出解析）决定下一步；右侧为可调用的 Tool 1…n，执行结果回传并形成循环直至结束](images/21/21-3-2-1.jpeg)

### 3.3 agent_scratchpad 重要性

你在 classic 路线里经常会看到 Prompt 里有这样一个占位：

```typescript
// Real TypeScript from repo: book/cases-langchain/12-agent/AgentReact.ts
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
```

其中 `ChatPromptTemplate`、占位符与消息结构，与 [第 13 章 提示词与消息模板](13-提示词与消息模板.md) 一脉相承；这里多出来的 `{agent_scratchpad}` 专供多轮工具循环使用。

这不是装饰，它的作用非常关键。它相当于 Agent 的“草稿区 / 中间步骤区”，用来承接：模型上一轮决定调用什么工具；工具返回了什么；下一轮模型基于这些信息继续推理。

如果没有这块区域，模型就很难在多步循环里“记住刚刚自己做过什么”。

所以在 classic 路线里，`agent_scratchpad` 不是一个边角知识点，而是 **ReAct 循环能成立的重要拼图**。

### 3.4 结合案例理解

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV0.3.py`

[AgentSmartSelectV0.3.py](案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV0.3.py ":include :type=code")

这个案例适合用来理解 classic Agent 的完整链路，因为它把这些部分都摆出来了：

1. 定义 `get_weather` 工具
2. 定义 `ChatPromptTemplate`
3. 在 Prompt 里保留 `agent_scratchpad`
4. 用 `create_tool_calling_agent` 得到 Agent
5. 用 `AgentExecutor` 驱动执行

当用户问：请问今天北京和上海的天气怎么样，哪个城市更热？

这个案例里的 Agent 并不是“一次回答完”，而是更像这样：

1. 先判断需要查天气
2. 调一次 `get_weather(Beijing)`
3. 再调一次 `get_weather(Shanghai)`
4. 根据两次工具结果做比较
5. 最后输出总结

所以它真正演示的不是“天气查询”，而是：**一个 classic Agent 如何做多步工具调用，并把多次结果汇总成最终回答。**

---

## 4、Agent 工作原理（V1.0）

这一节对应当前官方主线，也就是你项目里更现代的 Agent 入口。

### 4.1 create_agent 的意义

`create_agent` 的最大价值不是“少写几行代码”，而是：**把 Agent 的常见配置收口到一个统一入口里。**

你通常会把这些东西交给它：模型，工具，系统提示，有时再加结构化输出、状态、中间件等。这样你可以更专注于业务目标，而不是一开始就陷进大量底层组装细节里。

![Agent 工作循环：用户目标进入 Agent，模型判断下一步，必要时调用工具并根据观察结果继续循环](images/21/21-4-1-1.png)

### 4.2 V1.x 的核心输入

在入门阶段，先看 `create_agent` 常见的 6 个参数：

| 参数              | 是否常见     | 作用                                         |
| ----------------- | ------------ | -------------------------------------------- |
| `model`           | 必备         | 让谁来做推理与决策                           |
| `tools`           | 很常见       | 给 Agent 哪些可调用能力                      |
| `system_prompt`   | 很常见       | 约束 Agent 的角色、风格和工作规则            |
| `response_format` | 很常见       | 让最终结果更适合结构化输出                   |
| `checkpointer`    | 工程化能力   | 保存运行状态，可支撑短期记忆                 |
| `middleware`      | 工程化能力   | 在模型调用、工具调用等阶段插入自定义控制逻辑 |

放到项目开发里，可以这样对应：

- `model`：模型能力怎么选
- `tools`：Agent 可以用哪些外部能力
- `system_prompt`：行为规则怎么约束
- `response_format`：输出要不要便于程序直接接收
- `checkpointer`：跨多轮调用时，状态和短期记忆怎么保留
- `middleware`：要不要加入守护、拦截、动态控制

其中前四个最适合先入门；后两个更偏工程化能力。

### 4.3 结构化输出在 Agent 中的理解

本教程里的 V1.0 案例保留了一个很有价值的知识点：**Agent 不一定只能返回自然语言，它也可以返回结构化结果。**实际项目里，我们常常不只是想“让模型说一段话”，而是希望它最终给出：JSON、TypedDict、Pydantic 对象、便于程序直接消费的字段结构。

官方文档也把 `response_format` 作为 `create_agent` 的重点能力之一。所以你可以把这个能力理解成：**Agent 不只是会调用工具，它还可以把最终答案整理成程序更容易接收的格式。**

在当前 1.x 文档语境里，`response_format` 常见有三种理解方式：

- 直接传 schema 类型：例如 `TypedDict`、Pydantic 模型，框架会按模型能力自动选择更合适的结构化输出策略。
- 显式 `ProviderStrategy(schema)`：当底层模型原生支持结构化输出时，更贴近 provider 原生能力。
- 显式 `ToolStrategy(schema)`：把结构化输出当成一次工具调用式约束，兼容性通常更好。

在入门阶段，可先把握一个基本判断：**`response_format` 不是“把字符串转 JSON”的后处理，而是在 Agent 最终输出阶段，把“结果长什么样”提前约束清楚。**

### 4.4 checkpointer、thread_id 与短期记忆

如果你给 `create_agent` 传入 `checkpointer`，底层运行时就可以把 Agent 的状态保存下来。这时 Agent 不再只是“当前这一轮问什么答什么”，而是可以在多轮调用之间保留上下文。

这里可以先把三个词对应起来：

- **checkpointer**：状态保存器，负责把运行过程中的状态记下来
- **thread_id**：一次会话或一条对话线程的标识
- **短期记忆**：在同一个 `thread_id` 下，多轮消息和状态能够被延续使用

所以可以概括成一句话：**checkpointer 决定“状态能不能存下来”，thread_id 决定“这些状态属于哪一条会话”。**

![Agent 短期记忆：thread_id 区分会话线程，checkpointer 按线程保存 messages 和 state，支撑多轮延续](images/21/21-4-4-1.png)

实际调用时，`thread_id` 通常通过运行配置传入，例如：

```typescript
// Real TypeScript from repo: examples/09-agent/index.ts
/**
 * Maps to: 案例与源码-2-LangChain框架/12-agent
 * Python refs: AgentSmartSelectV1.0.py, AgentReact.py
 *
 * Modern LangChain JS path: createReactAgent (tool-calling ReAct loop).
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel } from "../../src/shared/llm.js";
import { basicTools } from "../../src/shared/tools.js";
import { printRunHeader } from "../../src/shared/env.js";

const PRODUCT_DATABASE: Record<
  string,
  Array<{ id: string; name: string; popularity: number; price: number }>
> = {
  无线耳机: [
    { id: "WH-1000XM5", name: "索尼 WH-1000XM5", popularity: 95, price: 299 },
    { id: "QC45", name: "Bose QuietComfort 45", popularity: 88, price: 329 },
  ],
  游戏鼠标: [
    { id: "GPW", name: "罗技 G Pro 无线", popularity: 90, price: 129 },
    { id: "VIPER", name: "雷蛇 Viper V2 Pro", popularity: 87, price: 149 },
  ],
};

const INVENTORY: Record<string, { stock: number; location: string }> = {
  "WH-1000XM5": { stock: 10, location: "仓库-A" },
  QC45: { stock: 0, location: "仓库-B" },
  GPW: { stock: 8, location: "仓库-C" },
  VIPER: { stock: 12, location: "仓库-A" },
};

const searchProductsTool = tool(
  async ({ query }) => {
    const category = Object.keys(PRODUCT_DATABASE).find((c) => query.includes(c));
    if (!category) return `未找到与「${query}」匹配的产品类别`;
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

const checkInventoryTool = tool(
  async ({ productId }) => {
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

async function runMathWeatherAgent() {
  printRunHeader("09-agent | tool agent (math + weather)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: basicTools,
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage("请计算 45+17，并查询深圳天气，最后用中文给一个简短总结。"),
    ],
  });

  const last = result.messages[result.messages.length - 1];
  console.log("[final]", last.content);
}

async function runReactShopAgent() {
  printRunHeader("09-agent | ReAct shop agent (search + inventory)");
  const agent = createReactAgent({
    llm: createChatModel(0),
    tools: [searchProductsTool, checkInventoryTool],
  });

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "帮我找最受欢迎的无线耳机，并检查第一名的库存，用中文给出购买建议。",
      ),
    ],
  });

  for (const msg of result.messages) {
    const role = msg.getType?.() ?? msg.constructor.name;
    console.log(`\n[${role}]`, msg.content);
  }
}

async function main() {
  await runMathWeatherAgent();
  await runReactShopAgent();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

> **版本说明：** 在 LangChain 1.x 语境里，`thread_id` 主要服务于 checkpointing 和多轮状态隔离；如果要传用户资料、租户信息、权限上下文等静态运行时信息，还需要关注 `create_agent` 的 `context` 等上下文机制，不要把所有业务信息都塞进 `thread_id`。

这一点和 [第 16 章 记忆与对话历史（含Redis基础）](16-记忆与对话历史（含Redis基础）.md) 是连着的。第 16 章更偏“记忆是什么、怎么存历史消息”，而这里更偏“在 `create_agent` 这条 1.x 主线上，状态和短期记忆是怎么接进 Agent 运行时的”。

### 4.5 运行过程怎么观察：stream 与 LangSmith

在真实项目里，只会 `invoke()` 还不够，因为 Agent 往往不是一步完成的。

#### 4.5.1 stream() 的作用

如果 Agent 要经历：模型判断、工具调用、工具返回、再次判断、最终输出。那么直接 `invoke()` 往往要等到最后才看到结果。而 `stream()` 的价值就在于：**把中间进展实时暴露出来。**

这对实际项目非常有用，因为它能帮助你：

- 看到 Agent 到底卡在模型还是工具上
- 看到是否发生了多轮工具调用
- 给前端提供更好的交互体验
- 调试“为什么这次 Agent 没按预期走”

所以这里的区别很直接：`invoke()` 更像等最终结果，`stream()` 更像看 Agent 执行过程。

#### 4.5.2 LangSmith 与 Agent 的关系

Agent 的问题，往往不是“有没有报错”这么简单，而是：

- 为什么调了这个工具而不是那个
- 为什么多调了一轮
- 为什么结构化输出没按预期生成
- 为什么这一步耗时特别长

这类问题只看最后一句回答，通常是不够的。也是为什么官方文档会把 **LangSmith** 和 Agent 经常放在一起讲。可以把 LangSmith 先看作：**用于追踪、调试、测试、评估 Agent 运行过程的可观测平台。**

这里不用立刻深入平台细节，只要先知道：`stream()` 让你在代码层面看到过程，**LangSmith** 让你在可视化层面看到过程，两者都能帮助 Agent 开发。

### 4.6 结合案例理解

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV1.0.py`

[AgentSmartSelectV1.0.py](案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV1.0.py ":include :type=code")

这个案例和 V0.3 做的是同一类业务：都是围绕“北京和上海谁更热”来调用天气工具。

但它的教学重点已经变了，不再强调 Prompt + Executor 的手工组装，而是在强调：

- `create_agent(...)` 的统一创建方式
- `response_format` 带来的结构化输出
- V1.x Agent 的更简洁用法

所以读这个案例时，建议把关注点放在两件事上：

1. **为什么代码明显更短了**
2. **为什么最后可以直接拿到 `structured_response`**

这两点正好代表了 V1.x 路线的两个现实价值：更适合新项目快速搭建；更适合把 Agent 输出接进后端业务逻辑。

另外，虽然本教程里的 `AgentSmartSelectV1.0.py` 重点放在 `invoke()` 和结构化输出上，但如果放到真实项目里，你通常还会继续关心：

- 要不要用 `stream()` 展示中间进展
- 要不要用 `checkpointer` 保留短期记忆
- 要不要通过 `middleware` 做动态控制和守护

这也是为什么 `create_agent` 看起来只是一个函数，背后却能一路延展到更完整的 Agent 工程化能力。

### 4.7 V0.3 与 V1.x 结合案例对比

总体差异已在上文 **2.4 节（V0.3 与 V1.x 对比速览）** 从 API 与运行时角度概括过；下表仅对照本仓库**同一业务（双城气温比较）**下的两个文件，便于你并排阅读代码。

| 维度     | `AgentSmartSelectV0.3.py`               | `AgentSmartSelectV1.0.py`            |
| -------- | --------------------------------------- | ------------------------------------ |
| 教学重点 | 看懂 Agent + Executor 怎么配合          | 看懂 `create_agent` 统一入口         |
| 代码风格 | 显式组装                                | 一步创建                             |
| 中间机制 | `agent_scratchpad`、Executor 循环更明显 | 运行时被更高层封装                   |
| 输出重点 | 最终自然语言回答                        | `structured_response` 更适合程序处理 |

一句总结：**V0.3 更适合理解“Agent 是怎么转起来的”，V1.x 更适合理解“今天项目里通常怎么写”。**

### 4.8 Middleware 与人类审核

如果说 `tools` 是给 Agent 增加能力，`middleware` 更像是给 Agent 增加运行边界。它可以在模型调用、工具调用、状态更新等阶段插入控制逻辑。

![Agent Middleware 概念：在模型调用、工具调用和运行过程之间插入守护、改写、审核与日志逻辑](images/21/21-4-8-1.png)

常见用途包括：

- **动态提示词**：根据用户、租户、权限或场景调整 system prompt。
- **工具调用守护**：高风险工具调用前先检查参数、权限或业务规则。
- **人类审核**：删除、支付、发消息、批量修改这类动作，不让 Agent 静默执行。
- **日志与监控**：记录关键决策、工具参数、异常和耗时。

所以生产级 Agent 的重点不是“工具越多越好”，而是：能力越强，边界越要清楚。后续 LangGraph 章节会继续展开中断、人工确认和复杂状态控制。

---

## 5、实操与案例

前面 3、4 节已经把两条 Agent 主线讲清楚了，这一节把所有案例重新放回到清晰的位置里。

### 5.1 全部案例先建立一张总览表

| 案例                      | 主要学习点                         | 工具来自哪里 | 更适合放在什么语境里理解 |
| ------------------------- | ---------------------------------- | ------------ | ------------------------ |
| `AgentSmartSelectV0.3.py` | classic Agent + AgentExecutor      | 本地 `@tool` | 理解 Agent 内部工作机制  |
| `AgentSmartSelectV1.0.py` | `create_agent` + 结构化输出        | 本地 `@tool` | 理解当前 1.x 主线        |
| `AgentReact.py`           | ReAct 循环、多步工具调用、消息轨迹 | 本地 `@tool` | 理解 Agent 的动态决策    |
| `Agent2Agent.py`          | 多智能体协作 / A2A                 | 本地 `@tool` | 理解多角色分工           |
| `McpClientAgent.py`       | Agent + MCP 工具接入               | MCP 服务     | 理解外部工具接入         |

也就是说，这一章不是在用 5 个案例重复讲一件事，而是在从 5 个不同角度，把 Agent 的完整能力拼出来。

### 5.2 ReAct 实操

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentReact.py`

[AgentReact.py](案例与源码-2-LangChain框架/12-agent/AgentReact.py ":include :type=code")

这个案例可以用来建立“**Agent 会自己连续做多步决策**”的直觉。

它定义了两个工具：

- `search_products`
- `check_inventory`

用户的问题不是简单的“查某个 ID 是否有库存”，而是：查找当前最受欢迎的无线耳机并检查是否有库存。

这个问题天然要求两步：

1. 先搜索产品，找出哪个最热门
2. 再根据搜索结果，决定去查哪个产品的库存

这里最关键的地方不是工具本身，而是：**第二步依赖第一步的结果。**  
如果流程完全固定，普通工作流也能完成这件事；本案例使用 Agent，是为了观察模型如何根据第一步返回内容，自己决定第二步该查哪个产品、该调用哪个工具。

这个案例还有一个很值得保留的学习点：它会展示 `result["messages"]`，让你看到：`AIMessage`、`tool_calls`、`ToolMessage`、最终 `AIMessage`。

所以这个案例不仅适合学 ReAct，也适合学：**现代 Agent 在消息层面到底长什么样。**

---

### 5.3 A2A 实操

【案例源码】`案例与源码-2-LangChain框架/12-agent/Agent2Agent.py`

[Agent2Agent.py](案例与源码-2-LangChain框架/12-agent/Agent2Agent.py ":include :type=code")

这个案例对应的是广义上的多智能体协作，也就是 **A2A（Agent-to-Agent）**。这里的 A2A 指“Agent 之间分工协作”的思想，不特指某一个外部通信协议。

它的教学价值非常高，因为它把“一个 Agent 解决所有问题”换成了另一种思路：携程 Agent 只负责机票；美团 Agent 只负责酒店；滴滴 Agent 只负责打车；最上面再有一个总协调逻辑负责调度。

这和真实项目非常贴近。因为很多企业级系统里，往往不是“一个大而全的 Agent”，而是：

- 一个总入口
- 多个领域专长子 Agent
- 各自有边界
- 最后再汇总结果

和 LangChain 官方多智能体资料对照时要注意：**官方常见做法是把 subagent 包装成 tool，再交给主 Agent 调用。**

而本教程里的这个案例，使用的是：

- 子 Agent 链
- `RunnableLambda` 协调
- 显式顺序调度

这不是错误，而是另一种更适合教学的表达方式。它的好处是你可以更清楚地看到：子 Agent 如何单一职责；总协调如何串联业务顺序；A2A 不一定非要从“主 Agent 调子 Agent 工具”这一个套路入门。

所以这个案例更适合帮你先抓住一个重点：**多智能体协作的关键不是 API 长什么样，而是“分工 + 协调”。**

---

### 5.4 Agent + MCP 实操

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpClientAgent.py`

[McpClientAgent.py](案例与源码-2-LangChain框架/11-mcp/McpClientAgent.py ":include :type=code")

这一节把第 20 章 MCP 和本章 Agent 接上了。前面几个案例里的工具，基本都是当前进程里直接写的 `@tool`。而这个案例演示的是另一件更接近真实项目的事：**工具不一定定义在本地代码里，也可以来自外部 MCP 服务。**

它的大致链路是：

1. 读取 `mcp.json`
2. 用 `MultiServerMCPClient` 连接 MCP 服务
3. 获取 MCP 暴露出来的工具列表
4. 把这些工具交给 LangChain Agent
5. 让 Agent 在对话中继续像本地 Tool 一样使用它们

所以这个案例真正学的不是“怎么聊天”，而是：**Agent 的工具来源可以被标准化外置。**

这在实际项目里意义很大，因为很多企业系统都会走这条路线：

- 能力由后端团队封装成 MCP 服务
- Agent 侧只负责接入和使用
- 这样一个工具集可以被多个 AI 应用复用

也正因为如此，本章和 [第 20 章 MCP 模型上下文协议](20-MCP模型上下文协议.md) 是强关联的：第 20 章解决“工具怎么标准化暴露”，第 21 章解决“Agent 怎么把这些能力真正用起来”。

---

## 6、小结：Agent、Tool、Function Calling、RAG、MCP 的区别与联系

这是本章最后必须收口的一节，因为这些概念最容易混。

> **术语约定：** 为和前文保持一致，本章这里写 **Function Calling** 是因为它在很多官方资料里仍然常见；如果你更习惯 [第 17 章](17-Tools工具调用.md) 的说法，也可以直接把它理解成 **Tool Calling 这层调用机制**。

### 6.1 一张总表先记住

| 概念                 | 它解决什么问题                      | 一句话理解   |
| -------------------- | ----------------------------------- | ------------ |
| **Tool**             | 系统有哪些可调用能力                | 能力层       |
| **Function Calling** | 模型怎么把“调工具”表达出来          | 调用机制     |
| **RAG**              | 模型缺知识时怎么拿上下文            | 上下文增强   |
| **MCP**              | 工具 / 资源 / Prompt 怎么标准化接入 | 连接协议     |
| **Agent**            | 什么时候用什么能力、按什么顺序做    | 决策与编排层 |

### 6.2 在真实项目里怎么配合

一个更接近真实项目的完整链路通常像这样：

1. 用户提出一个目标
2. **Agent** 先判断该怎么做
3. 如果缺知识，就先走 **RAG**
4. 如果缺动作能力，就通过 **Function Calling** 去调 **Tool**
5. 这些 Tool 可能是本地写的，也可能来自 **MCP**
6. Agent 再根据返回结果继续判断，直到最终完成任务（需设好迭代上限与超时，避免死循环）

所以关系可以简写成：

- **Agent = 决策层**
- **Tool = 能力层**
- **Function Calling = 调用机制**
- **RAG = 上下文增强**
- **MCP = 外部能力接入协议**

---

**章节思考题：**

1. 一个任务是否需要 Agent，你会看哪些信号？

   **参考思路：** 看任务是否步骤不固定、需要多次决策、需要选择工具、需要根据中间结果调整路线。如果只是固定输入到固定输出，链或工作流通常更简单。

2. Agent、Tool、RAG、MCP 放在一起时，各自的位置是什么？

   **参考思路：** Agent 负责决策和推进任务，Tool 提供可执行能力，RAG 提供外部知识上下文，MCP 提供标准化接入方式。它们不是互相替代，而是在不同层协作。

3. 为什么 Agent 系统要设置迭代上限、超时和失败处理？

   **参考思路：** Agent 会根据中间结果继续决策，如果没有边界，可能循环调用、成本失控或执行危险动作。工程上需要有停止条件、错误兜底和日志追踪。

4. 旧的 AgentExecutor 和新的 `create_agent` 思路，你会怎样看待它们？

   **参考思路：** 旧写法有助于读懂历史代码，新写法更贴近当前 LangChain / LangGraph 主线。学习时不必纠结“谁完全替代谁”，要看项目版本、依赖和维护成本。

**本章小结：**

- **Agent 的定位是决策层**：它不是多几个 API，也不是多几个 Tool，而是让系统围绕目标判断下一步做什么。Tool 是能力层，Agent 负责协调这些能力。
- **理解 Agent，可以放回 ReAct 循环里看**：观察问题、决定动作、调用工具、拿回观察结果、继续决策。这样再去看 classic 路线里的 scratchpad / AgentExecutor，以及 1.x 路线里的 `create_agent`，就不会只剩 API 记忆。
- **LangChain 1.x 的主线要抓住三个工程点**：`response_format` 负责把最终输出结构化，`checkpointer` 负责线程状态持久化，`thread_id` 负责多轮对话和会话隔离。它们共同决定 Agent 能不能从“演示能跑”走向“系统可用”。
- **什么时候不该上 Agent 也要明确**：如果步骤固定、路径稳定、可控性要求高，优先用 LCEL 或 Workflow；只有当任务真的需要动态选工具、临场分解步骤、边执行边调整时，Agent 才值得它带来的复杂度。
- **可上线的 Agent，重点在边界而不只是能力**：工具白名单、参数校验、人审或二次确认、超时重试、日志与状态持久化，往往比“再多接几个 Tool”更重要。

**建议下一步：** 先在本地依次运行 `AgentSmartSelectV0.3.py`、`AgentSmartSelectV1.0.py`、`AgentReact.py` 和 `Agent2Agent.py`，对照文档理解 [Tool](17-Tools工具调用.md)、Agent、AgentExecutor 的配合。若要把外部能力接入 Agent，再回看 [第 20 章 MCP 模型上下文协议](20-MCP模型上下文协议.md) 中的 `McpClientAgent.py`。链式固定流程与 Agent 的取舍，可对照 [第 15 章 LCEL 与链式调用](15-LCEL与链式调用.md) 和本文 **1.4 Agent 的使用场景**。
