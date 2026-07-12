# 16 - 记忆与对话历史（含 Redis 基础）

<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：中文讲解保留原教程；**代码块使用仓库内真实 TypeScript**（`examples/` / 精校案例 / `apps/shop-query-agent`），不再使用机翻 Python。
> 精校清单：[POLISHED-CASES](POLISHED-CASES.md)


## TypeScript 可运行示例（推荐）

本章优先对照仓库真实文件：`examples/06-memory/index.ts`

```typescript
// examples/06-memory/index.ts
/**
 * Maps to: 案例与源码-2-LangChain框架/07-memory
 * Python refs: Memory_InMemoryChatMessageHistory.py, Memory_RunnableWithMessageHistory*.py
 *
 * JS/TS approach: keep an in-memory message list (same teaching goal as chat history).
 * Redis variants are documented in docs/MAPPING.md for production follow-up.
 */
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

class InMemoryChatHistory {
  private store = new Map<string, BaseMessage[]>();

  get(sessionId: string): BaseMessage[] {
    return this.store.get(sessionId) ?? [];
  }

  append(sessionId: string, messages: BaseMessage[]) {
    const prev = this.get(sessionId);
    this.store.set(sessionId, [...prev, ...messages]);
  }
}

async function chat(sessionId: string, history: InMemoryChatHistory, text: string) {
  const model = createChatModel(0.2);
  const messages: BaseMessage[] = [
    new SystemMessage("你是有记忆的助教。请结合历史对话回答。"),
    ...history.get(sessionId),
    new HumanMessage(text),
  ];
  const ai = await model.invoke(messages);
  history.append(sessionId, [new HumanMessage(text), new AIMessage(String(ai.content))]);
  return String(ai.content);
}

async function main() {
  printRunHeader("06-memory | multi-turn chat history");
  const history = new InMemoryChatHistory();
  const sessionId = "user-001";

  const a1 = await chat(sessionId, history, "我叫小林，我在学 TypeScript Agent。");
  console.log("\n[round1]", a1);

  const a2 = await chat(sessionId, history, "还记得我的名字和在学什么吗？");
  console.log("\n[round2]", a2);

  console.log("\n[history size]", history.get(sessionId).length, "messages");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```bash
npx tsx examples/06-memory/index.ts
```



---

**本章课程目标：**

- 理解本章所说的**记忆（Memory）**到底是什么，知道它为什么在多轮对话中不可缺少。
- 掌握“**读历史 → 拼入提示 → 调模型 → 写回历史**”这条最核心的实现主线，理解 `RunnableWithMessageHistory` 与 `BaseChatMessageHistory` 的职责分工。
- 对 Redis 在本章中的定位建立清晰认识：它不是让模型“变聪明”，而是让**会话历史可持久化、可跨进程、可跨实例共享**。

**学习建议：** 这章最好用两轮对话来学：先看没有记忆时模型为什么“忘事”，再看同一个 `session_id` 下历史消息如何被读出、拼进提示词、调用模型、写回存储。Redis 先别当重点，它只是把内存版的历史保存得更持久。只要能讲清“读历史 -> 拼提示 -> 调模型 -> 写历史”，后面的实现类就不散。

**官方文档与资源**：详见 [工具导航与参考资料索引 - LangGraph](工具导航与参考资料索引.md#LangGraph)。

---

## 1、记忆简介

### 1.1 为什么需要记忆

如果你只做单轮问答，那么每次请求都是一次独立调用，模型只看当前输入，答完就结束。  
但只要你开始做聊天机器人、客服助手、学习助手、企业知识问答，多轮上下文就会立刻成为刚需。

最典型的现象就是：

1. 第一轮你说：“我叫张三。”
2. 第二轮你再问：“我叫什么？”

如果系统没有保存并重新注入上一轮内容，模型就只能把第二轮当作一条全新的请求，于是很自然地回答：“我不知道。”这不是模型“太笨”，而是程序根本没有把上一轮信息带给它。

![无记忆时两轮对话相互独立，模型无法利用上一轮信息](images/16/16-1-1-1.jpeg)

所以从工程角度看，记忆并不是一个“可有可无的高级特性”，而是多轮对话系统最基础的能力之一。它至少解决三类问题：

- **上下文连续性**：让模型知道上一轮说过什么。
- **会话个性化**：让模型记住用户在当前会话里提供的信息，如名字、偏好、任务背景。
- **多步任务承接**：让模型把前一步结果作为后一步输入，而不是每轮都重新从零开始。

用一句最直白的话说：**没有记忆，聊天系统就只是“连续发了很多次单轮请求”；有了记忆，它才真正开始像“对话”。**

![LangChain 官方文档「Core components → Short-term memory」概述：记忆用于保存先前交互信息，支撑智能体在多轮交互中保持效率与体验](images/16/16-1-1-2.jpeg)

### 1.2 定义

本章里的**记忆（Memory）**，指的主要是**短期记忆（Short-Term Memory）**或**对话历史（Chat History）**。

它的本质不是“模型真的记住了”，而是：**程序把之前的消息保存下来，并在下一轮调用前，再把这些历史消息一并传给模型。**

所以它更像一种“外部会话状态管理机制”，而不是模型参数层面的学习。

### 1.3 这不是训练模型

这里容易混淆，所以单独强调。

本章所说的记忆：

- **不是**重新训练模型
- **不是**把信息写进模型参数
- **不是**让模型永久学会某些知识

它做的事情只是：

1. 把历史消息保存在外部
2. 下次调用前重新读出来
3. 和当前问题一起发给模型

也就是说，模型“记住你是谁”，不是因为它内部学会了你，而是因为程序每次都把“你叫张三”这条历史重新带给它。

这也是为什么：

- **内存版**：程序一关，历史就丢了
- **Redis 版**：程序重启后，历史还能读回来

### 1.4 本章的“记忆”能做什么

从项目角度看，本章的记忆主要能做这些事：

- **让多轮问答连续起来**：例如先自我介绍，再追问名字、偏好、之前说过的内容。

- **保存当前会话上下文**：例如用户正在做一份简历、正在学习 TypeScript、正在整理某份报告，后续问题不必每轮都重述背景。

- **为链式流程提供上下文**：历史消息最终通常通过 [第 13 章](13-提示词与消息模板.md) 的 `MessagesPlaceholder` 注入模板，与 [第 15 章](15-LCEL与链式调用.md) 中的链组合在一起使用。

- **为后续 Agent / Tool / LangGraph 打基础**：你后面会发现，工具调用、Agent、多步决策几乎都离不开“当前线程 / 当前会话”的状态保存。

### 1.5 本章不重点讨论什么

为了避免和后面章节混在一起，这里也要明确本章边界：

- **不是长期知识记忆**：比如用户永久画像、跨很多天的长期偏好管理，这不属于本章核心。

- **不是 RAG 检索记忆**：把外部文档查出来再回答，属于 [第 19 章 RAG](19-RAG检索增强生成.md) 的主线。

- **不是 Agent 决策状态机**：更复杂的循环式状态与持久化，会在 [Agent](21-Agent智能体.md) 与 LangGraph 相关章节里更自然地出现。

所以你可以先把本章聚焦成一句话：**本章主要讲“当前会话里，怎么把历史消息保存起来并重新喂给模型”。**

---

## 2、「我不知道」演示：无记忆时的行为

在真正上记忆之前，最好的学习方式不是先背概念，而是先亲眼看到“没有记忆时会发生什么”。下面这个案例故意只保留最简单的链：Prompt、Model、Parser。

然后连续做两次调用：

1. 第一次告诉模型：“我叫张三，你叫什么？”
2. 第二次再问：“你知道我是谁吗？”

因为程序没有保存第一轮内容，也没有在第二轮重新注入历史，所以模型只能把第二个问题当作一条全新的请求处理，于是给出“我不知道”之类的回答。

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_IDontKnow.ts`

[Memory_IDontKnow.ts](案例与源码-2-LangChain框架/07-memory/Memory_IDontKnow.ts ":include :type=code")

这个案例用来建立一个基础直觉：**模型不是天然会记住多轮对话，是程序决定它能不能看见历史。**

---

## 3、实现原理

### 3.1 核心主线

先不急着看类名，记忆的实现过程可以拆成四步：

1. **读历史**
2. **把历史拼进当前提示**
3. **调用模型**
4. **把本轮输入和输出写回历史**

这就是本章最核心的链路。

![记忆在链中的位置：读历史 → 拼入 Prompt → 调模型 → 写回历史](images/16/16-3-1-1.jpeg)

### 3.2 工程化表达

如果用更接近程序的方式来描述，一次带记忆的调用通常是这样发生的：

**第一步：根据会话标识找到对应历史。**  
比如通过 `session_id="user-001"` 找到这位用户当前会话的消息列表。

**第二步：把历史消息插入 Prompt。**  
这一步通常会和 [第 13 章](13-提示词与消息模板.md) 里的 `MessagesPlaceholder("history")` 配合使用。

**第三步：把“历史 + 当前问题”一起交给模型。**  
这样模型看到的就不再只是当前一句话，而是完整上下文。

**第四步：把本轮消息写回历史存储。**  
也就是把：用户这一轮输入、模型这一轮回复，都追加进去，供下一轮再读取。

### 3.3 MessagesPlaceholder 与模板的关系

在对话历史场景里，你通常不会把历史消息一条条手写死在模板中，因为历史轮数与内容每轮都在变。更合理的做法是在模板里留一个“历史消息插槽”，运行时再把当前会话历史整块塞进去——这正是 [第 13 章](13-提示词与消息模板.md) 中 `MessagesPlaceholder` 的典型用法，与本章的“读写历史”前后衔接。

### 3.4 session_id 的意义

只要涉及记忆，就会涉及一个关键问题：**你怎么知道哪份历史属于哪位用户、哪次会话？**

最常见的做法就是使用 `session_id`，它就是“当前会话的编号”。

例如：

- `user-001`
- `user-002`
- `chat-room-a`

不同的 `session_id`，通常对应不同的历史记录。

在 `RunnableWithMessageHistory` 里，`session_id` 通常通过运行配置传入，例如 `config={"configurable": {"session_id": "user-001"}}`。不同的 `session_id` 会对应不同的历史对象。

这也是为什么本章 Redis 版和多 session 版案例里，`session_id` 都很重要。如果没有这层区分，系统就可能把 A 用户的历史错拿给 B 用户。

### 3.5 本章和 LangGraph 官方主线的关系

这里需要补一个版本背景。

在 LangChain / LangGraph 当前官方主线里，**短期记忆**越来越倾向于放在 **LangGraph persistence / checkpointer / thread** 这条体系里来讲。  
也就是说，官方现在更强调：

- 线程（thread）
- 持久化（persistence）
- 检查点（checkpointer）
- 图执行状态

但这并不意味着 `RunnableWithMessageHistory` 没价值了。对 LCEL 链来说，它更直观，也更容易看清“历史消息如何注入到当前调用里”。

所以本章采用这条学习顺序：

- 先用 `RunnableWithMessageHistory + BaseChatMessageHistory` 看清链级对话历史
- 再知道复杂 Agent 的状态持久化会继续走向 LangGraph persistence

> **版本说明：** 本章继续使用 `RunnableWithMessageHistory`，是为了把 LCEL 链里的“历史消息如何读写和注入”讲清楚。生产级 Agent 或复杂多轮状态管理，建议再对照 LangGraph 的 checkpointer、thread 和 persistence 机制来设计。

这样后面你切到更复杂的 Agent / LangGraph，就不会断层。

**补充：** 历史消息会占用模型上下文窗口；轮数过多时需要做截断、摘要或只保留最近 \(k\) 轮，否则可能触达 token 上限或带来额外成本。本章先把“注入历史”这件事讲清楚，具体压缩策略后面按产品需求再选。

---

## 4、记忆相关实现类

### 4.1 本章使用哪套写法

前面已经明确：本章先用 `RunnableWithMessageHistory + BaseChatMessageHistory` 讲清链级对话历史；复杂 Agent 的状态持久化，后续再放到 LangGraph 的 `thread / checkpointer / persistence` 里理解。

接下来先看几个相关类：哪些是早期写法，哪些适合作为本章重点。

### 4.2 ConversationChain（早期写法）

LangChain 早期有一个比较有代表性的类，叫 `ConversationChain`。

它内置了对话模板和记忆机制，所以很适合快速做简单演示；但它的灵活性有限，也不太贴合 LCEL / Runnable 体系，面对复杂对话流程时扩展性会比较差。

所以在今天的学习路径里，它不再适合作为本章的主线写法。

### 4.3 RunnableWithMessageHistory（更合适的写法）

`RunnableWithMessageHistory` 的作用很直接：**给一条已有的 Runnable / Chain 包上一层历史管理能力。**

它并不替代你的 Prompt、Model、Parser，而是站在它们外面，统一负责历史的读取、注入和写回。

这和第 15 章讲的 LCEL 很契合，因为它不是另起一套风格，而是在 Runnable 体系之上继续工作。所以从教学角度说，它特别适合这一章，因为它能把“记忆是在链外单独管理的一层会话能力”讲清楚。

### 4.4 BaseChatMessageHistory（历史存储接口）

如果 `RunnableWithMessageHistory` 解决的是“历史读写时机”，那么 `BaseChatMessageHistory` 解决的就是：

**历史到底存在哪里、怎么存。**它可以看作“聊天消息历史的统一抽象接口”。

不必先纠结源码细节，只要抓住这层分工：

- **RunnableWithMessageHistory**：控制历史何时读、何时写
- **BaseChatMessageHistory 及其实现类**：控制历史存到哪里

这就是为什么本章会同时讲它们两个，而不是只讲其中一个。

### 4.5 常见实现类

LangChain 提供了多种聊天历史实现（如内存、文件、Redis、Elasticsearch、DynamoDB 等），核心差别主要在于**是否持久化、是否适合多实例共享**。

常见实现的区别主要看存储位置：

| 组件名称                     | 存储方式     | 适合什么场景                   |
| ---------------------------- | ------------ | ------------------------------ |
| `InMemoryChatMessageHistory` | 进程内内存   | 本地学习、单进程演示、临时会话 |
| `FileChatMessageHistory`     | 本地文件     | 轻量持久化、小型脚本           |
| `RedisChatMessageHistory`    | Redis        | 持久化、跨进程、多实例共享     |
| 其他后端实现                 | ES、数据库等 | 和现有技术栈集成               |

对这一章来说，最重要的是前两个核心结论：

- **先学 InMemory**，因为它最直观
- **再学 Redis**，因为它最贴近真实项目

### 4.6 本章案例结构对应关系

下面按学习顺序列出本章案例文件：

| 文件                                     | 作用                              |
| ---------------------------------------- | --------------------------------- |
| `Memory_IDontKnow.ts`                    | 先看无记忆时的问题                |
| `Memory_RunnableWithMessageHistory.ts`   | 最基础的内存版带历史对话          |
| `Memory_RunnableWithMessageHistoryV2.ts` | 多 session 版，对应真实多用户场景 |
| `Memory_InMemoryChatMessageHistory.ts`   | 不走包装器，直接手动操作 history  |
| `RedisEnvCheck.ts`                       | 跑 Redis 版前先做环境校验         |
| `Memory_RedisChatMessageHistory.ts`      | Redis 持久化主案例                |
| `Memory_RedisStackChatMessageHistory.ts` | Redis Stack 可选案例              |

这样安排其实很合理：

- 先让你看到问题
- 再给出最简单解决方案
- 再扩展到多 session
- 最后再讲持久化

---

## 5、案例代码

### 5.1 内存版（进程内，重启即丢失）

内存版最适合入门，因为它把“记忆的本质”暴露得最清楚：

- 历史就是一个消息列表
- 每轮都从这份列表里读取
- 每轮结束再把新消息写回去

缺点也很明显：

- 只在当前 TypeScript 进程有效
- 程序一停，历史就没了
- 不适合多实例共享

但正因为足够简单，它适合用来建立第一层理解。

#### 5.1.1 最基础写法：RunnableWithMessageHistory

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_RunnableWithMessageHistory.ts`

[Memory_RunnableWithMessageHistory.ts](案例与源码-2-LangChain框架/07-memory/Memory_RunnableWithMessageHistory.ts ":include :type=code")

这个案例最值得看懂的点有三个：

- `MessagesPlaceholder("history")` 负责接收历史
- `RunnableWithMessageHistory` 负责包住整条链
- `session_id` 负责告诉系统“当前该读哪份历史”

#### 5.1.2 多 session 写法：按 session_id 维护多份历史

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_RunnableWithMessageHistoryV2.ts`

[Memory_RunnableWithMessageHistoryV2.ts](案例与源码-2-LangChain框架/07-memory/Memory_RunnableWithMessageHistoryV2.ts ":include :type=code")

这个案例比上一个更贴近真实项目，因为真实系统里不会只有一个用户，也不会只有一份历史。

它用一个 `store` 字典按 `session_id` 存放不同的 `InMemoryChatMessageHistory`，本质上是在演示：

**同一套链逻辑，如何根据不同会话编号切换到不同历史。**如果你后面要做 Web 聊天、客服系统、多人会话，这个思路会反复用到。

#### 5.1.3 直接操作 InMemoryChatMessageHistory

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_InMemoryChatMessageHistory.ts`

[Memory_InMemoryChatMessageHistory.ts](案例与源码-2-LangChain框架/07-memory/Memory_InMemoryChatMessageHistory.ts ":include :type=code")

这个案例不再通过 `RunnableWithMessageHistory` 自动管理，而是手动：

- `add_user_message(...)`
- `add_message(...)`
- `history.messages`

它的价值在于让你更“看见底层”：**所谓记忆，说到底就是在维护一份消息历史列表。**

从工程角度说：

- **想快速搭多轮链**：优先用 `RunnableWithMessageHistory`
- **想完全掌控读写时机**：可以直接操作 `InMemoryChatMessageHistory`

### 5.2 持久化：Redis 存储

当你已经理解内存版后，就会自然遇到一个问题：**程序一重启，历史全没了，怎么办？**

这就是 Redis 出场的原因。Redis 在本章里的角色非常明确：

- 它不是模型
- 它不是 Prompt
- 它不是“更高级的记忆算法”
- 它只是一个更适合持久化保存会话历史的存储后端

也就是说，本章从内存版切到 Redis 版，变化的不是“记忆原理”，而是“历史保存的位置”。

#### 5.2.1 设计要求与参考文档

这一节的目标非常朴素：**把对话历史从进程内存，换成 Redis 持久化存储。**这样做之后：程序重启后还能恢复历史，多个实例可以共享同一份历史，更贴近真实线上系统。

同时结合本项目当前依赖，你也要知道：

- 本仓库 `package.json` 中已经包含 `redis>=5.3,<6`
- 也包含 `langchain-redis>=0.2`

所以如果你已经执行过 `npm install -r package.json`，通常不需要再单独补装基础依赖。

#### 5.2.2 Redis 与 Redis Stack 简介

先说最重要的结论：**本章对话历史案例，原生 Redis 就够用了。**

原因是 `RedisChatMessageHistory` 存储对话历史时，使用的只是 Redis 的基础数据结构能力，不依赖 Redis Stack 才有的高级模块。

所以：

- **原生 Redis**：完全能跑本章主案例
- **Redis Stack**：可以跑，而且更方便用 RedisInsight 可视化查看数据

![Redis Stack 与原生 Redis 的关系](images/16/16-5-2-1.jpeg)

如果你是第一次学，可以直接把它们区分成这样：`Redis` 是高性能键值存储本体，`Redis Stack` 则是在 Redis 基础上补上更多增强能力，并带来更友好的工具链。

本章之所以还保留 Redis Stack 小节，一方面是为了让你能用 RedisInsight 更直观地观察数据，另一方面也顺手为后面向量存储、搜索等更复杂的 Redis 用法做一点环境铺垫。

| 功能维度 | 原生 Redis                 | Redis Stack 增强功能                                  |
| :------- | :------------------------- | :---------------------------------------------------- |
| 数据结构 | 字符串、列表、集合、哈希等 | 增加 JSON、图、时间序列、概率结构等高级类型           |
| 查询能力 | 仅限键值查询               | 支持全文搜索、向量搜索、图查询、JSON 查询             |
| 使用场景 | 缓存、消息队列、计数器等   | 实时推荐、时序分析、知识图谱、文档数据库、AI 向量检索 |
| 开发体验 | 命令行操作，需手动拼装逻辑 | 提供 RedisInsight 和对象映射库，开发效率更高          |

#### 5.2.3 Docker 启动与宿主机连接

如果你本机没单独装 Redis，用 Docker 是最省事的办法。

**原生 Redis：**

```bash
docker run -d --name docker-redis-1 -p 6379:6379 redis
```

这样本机就可以通过：

```bash
redis://localhost:6379
```

来连接 Redis。

**Redis Stack：**

```bash
docker run -d --name redis-stack -p 26379:6379 -p 8001:8001 redis/redis-stack
```

这里要区分两个端口：

- `26379`：本机访问 Redis 服务用（映射到容器内 `6379`）
- `8001`：浏览器访问 RedisInsight 的常用映射端口

也就是说，Redis Stack 版案例里如果默认连接 `redis://localhost:26379`，是完全正常的，因为它连的是**宿主机映射端口**，不是容器内的原始 `6379`。若你本地镜像或 compose 将 Insight 映到 **8002** 等其他端口，以实际 `docker ps` 或文档为准即可。

#### 5.2.4 Redis 基本命令与查看对话历史

这一节不用学成 Redis 专家，只要会看本章案例写进去的数据就够了。

最常用的命令有这些：

| 命令                 | 说明                       | 示例                             |
| :------------------- | :------------------------- | :------------------------------- |
| `PING`               | 检测服务是否存活           | `PING` → 返回 `PONG`             |
| `SET key value`      | 设置字符串键值             | `SET mykey "hello"`              |
| `GET key`            | 获取字符串值               | `GET mykey`                      |
| `DEL key [key ...]`  | 删除一个或多个键           | `DEL mykey`                      |
| `KEYS pattern`       | 按模式查找键（慎用于生产） | `KEYS *`、`KEYS message_store:*` |
| `EXISTS key`         | 判断键是否存在             | `EXISTS mykey` → 1 或 0          |
| `TTL key`            | 查看键的剩余过期时间（秒） | `TTL mykey`，-1 表示永不过期     |
| `EXPIRE key seconds` | 设置键的过期时间           | `EXPIRE mykey 3600`              |
| `DBSIZE`             | 当前数据库的键数量         | `DBSIZE`                         |
| `FLUSHDB`            | 清空当前数据库（慎用）     | `FLUSHDB`                        |

本章 Redis 对话历史案例里，最值得你关注的是这一点：**LangChain 会按 `session_id` 写入不同的键。**

例如你运行过某个 `session_id=user-001` 的会话后，可能会看到类似：

```redis
KEYS *
TYPE message_store:user-001
LRANGE message_store:user-001 0 -1
```

你看到的每个元素，本质上就是一条序列化后的消息记录。这里可以建立一个基础直觉：

**对话历史并不神秘，落到 Redis 里，本质上就是按 session 管理的一组消息数据。**

#### 5.2.5 环境验证

在真正运行 Redis 对话历史前，建议先检查两个问题：

1. TypeScript 里的 `redis` 包是否安装正常
2. Redis 服务是否真的能连上

【案例源码】`案例与源码-2-LangChain框架/07-memory/RedisEnvCheck.ts`

[RedisEnvCheck.ts](案例与源码-2-LangChain框架/07-memory/RedisEnvCheck.ts ":include :type=code")

这个脚本建议作为“跑 Redis 案例前的第一步”，因为很多问题其实不是 LangChain 的问题，而是 Redis 环境本身没就绪。

#### 5.2.6 案例：Redis 对话历史

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_RedisChatMessageHistory.ts`

[Memory_RedisChatMessageHistory.ts](案例与源码-2-LangChain框架/07-memory/Memory_RedisChatMessageHistory.ts ":include :type=code")

这是本章最重要的持久化案例。它和内存版相比，真正变化的核心只有一处：

- `get_session_history(...)` 不再返回 `InMemoryChatMessageHistory`
- 而是返回 `RedisChatMessageHistory`

也就是说：**链的读写逻辑没变，只是历史的存储后端换了。**

这个认识特别重要，因为它让你真正理解：

- `RunnableWithMessageHistory` 负责“什么时候读写”
- `RedisChatMessageHistory` 负责“历史存到哪里”

两者是配合关系，不是替代关系。

#### 5.2.7 案例：使用 Redis Stack（可选）

【案例源码】`案例与源码-2-LangChain框架/07-memory/Memory_RedisStackChatMessageHistory.ts`

[Memory_RedisStackChatMessageHistory.ts](案例与源码-2-LangChain框架/07-memory/Memory_RedisStackChatMessageHistory.ts ":include :type=code")

这个案例和上一节主案例的逻辑基本一致，只是默认连接到了 Redis Stack 常见端口。

它最大的教学价值不是“换了一个全新方案”，而是：让你确认 Redis Stack 也能兼容跑本章历史存储；让你能用 RedisInsight 直观看到会话数据。

![RedisInsight 中查看 LangChain 写入的会话：键 message_store:user-001 类型为 LIST，元素为序列化后的 human/ai 消息（JSON），便于对照代码理解持久化结构](images/16/16-5-2-2.png)

所以这节更适合看作：**主案例的一个更方便观察数据的变体。**

---

**章节思考题：**

1. 如果用户说“模型记住了我”，你会怎样解释本章里的“记忆”到底是什么？

   **参考思路：** 这里的记忆不是模型参数更新，而是系统把历史消息重新取出来，作为上下文交给模型。模型看起来记得，是因为应用帮它带上了历史。

2. `RunnableWithMessageHistory` 和具体存储类的边界为什么要分清？

   **参考思路：** 前者负责把历史接入调用链，决定何时读写；后者负责消息真正存在哪里。边界分清后，内存、Redis、数据库等存储可以替换，而调用链逻辑不用大改。

3. 多用户场景里，`session_id` 设计不好会出现什么问题？

   **参考思路：** 可能串会话、串用户、误用历史，甚至泄露隐私。`session_id` 应该和用户、会话、业务租户等隔离策略一起设计，而不是随便写一个字符串。

4. 为什么完整历史不能无限塞回模型？

   **参考思路：** 上下文窗口、成本、延迟和噪声都会增加。历史越多不一定越好，真实系统要做窗口截断、摘要、重要信息提取和过期清理。

**本章小结：**

- **记忆是什么**：这里讲的是短期记忆 / 对话历史，不是训练模型，也不是更新模型参数，而是把历史消息保存下来，并在下一轮调用前重新交给模型。
- **基本流程**：读历史 → 拼入提示 → 调模型 → 写回历史。`MessagesPlaceholder` 负责给历史消息留位置，`RunnableWithMessageHistory` 负责管理读写时机，`BaseChatMessageHistory` 及其实现类负责具体存储。
- **存储怎么选**：`InMemoryChatMessageHistory` 适合单进程学习和演示，进程一停就丢；`RedisChatMessageHistory` 适合持久化、多实例共享和跨进程会话恢复。
- **版本关系**：本章用 `RunnableWithMessageHistory + BaseChatMessageHistory` 讲清链级记忆；复杂 Agent 的长期运行状态，后面再看 LangGraph 的 thread、persistence 和 checkpointer。

**建议下一步：** 先把无记忆、内存版、多 session 版、Redis 版案例都跑一遍，重点观察“同一个 `session_id` 下历史是怎么被延续的”；然后继续学习 [第 17 章 Tools 工具调用](17-Tools工具调用.md)，你会更容易理解为什么 Agent 场景不仅需要工具，还需要会话状态与历史管理。
