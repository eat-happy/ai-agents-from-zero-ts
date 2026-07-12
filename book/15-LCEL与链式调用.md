# 15 - LCEL 与链式调用


<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js**。
> 可运行精校示例见仓库根目录 `examples/` 与 `apps/shop-query-agent/`。自动迁移的代码块若与最新 SDK API 有差异，以可运行示例为准。


---

**本章课程目标：**

- 理解 **Runnable** 的定位，知道 LangChain 为什么要把 Prompt、Model、Parser、Tool、Chain 都抽象成统一的“可执行组件”。
- 理解 **LCEL**（LangChain Expression Language，LangChain 表达式语言）到底解决了什么问题，掌握 `|` 管道符背后的链式组合思想。
- 能读懂并运行本章全部案例：**顺序链、分支链、多步串行链、并行链、函数链**，建立后续学习 [记忆与对话历史](16-记忆与对话历史（含Redis基础）.md)、[Tools 工具调用](17-Tools工具调用.md)、[RAG](19-RAG检索增强生成.md)、[Agent](21-Agent智能体.md) 的基础。

**学习建议：** 先亲手跑通 `prompt | model | parser`，再谈分支、并行和自定义函数节点。读代码时盯住两件事：每个 Runnable 收什么、吐什么；组合之后还能不能继续被 `invoke`、`stream`、`batch` 调用。这样看 LCEL，就不会只把它当成一个管道符语法。

---

## 1、Runnable 与统一调用方式

### 1.1 前置知识点：抽象基类（ABC）

如果你第一次接触 **抽象基类**，不用把它想得太复杂。对这一章来说，你只需要先建立一个足够实用的理解：

**抽象基类，就是先规定“这一类对象应该具备哪些共同能力”，但不急着规定“每个对象内部具体怎么做”。**

这里说的就是一种“统一规则”或“公共协议”。

比如框架设计者先约定：

- 只要你属于“可执行组件”
- 你就应该支持某些统一方法
- 例如单次调用、批量调用、流式调用、异步调用

这样后面无论这个对象到底是 Prompt、Model、Parser，还是整条 Chain，使用者都可以按同一种方式去理解和调用它。这就是抽象基类最有价值的地方：**先把共同规则定下来，再让不同对象去实现自己的具体行为。**

放到 LangChain 里，你可以把 **Runnable** 理解成这样一种核心抽象接口。它背后的思想就是：

- Prompt 是一种可执行组件
- Model 是一种可执行组件
- Parser 是一种可执行组件
- Chain 也是一种可执行组件

既然它们都属于“可执行组件”这一大类，那么就应该尽量遵守同一套调用协议。所以这一节你不用死记 `ABC`、`abstractmethod` 这些 Python 细节，只要先抓住一句话：**抽象基类解决的是“先把共同规则定下来”，而 Runnable 正是 LangChain 用来统一这些规则的关键抽象。**

![`langchain_core.runnables.base` 中 Runnable 的类定义与职责说明：可 invoke、batch、stream 并支持组合](images/15/15-1-1-1.jpeg)

> **图意说明**：上图截自 LangChain 参考文档。`Runnable` 声明为 `class Runnable(ABC, Generic[Input, Output])`，描述的是“可被调用、批量处理、流式输出、变换与组合”的工作单元；`invoke`/`ainvoke`、`batch`/`abatch`、`stream`/`astream` 等成对出现，`astream_log` 还可流式透出部分中间结果。各方法均可传入 `config`（如标签、元数据）便于追踪与排障；输入/输出/config 的结构信息可通过 `input_schema`、`output_schema`、`config_schema` 等暴露给工具链与 IDE。

### 1.2 统一接口的意义

如果没有统一接口，Prompt、模型、解析器、工具、检索器往往会各自一套入口（例如 `format`、`generate`、`parse`、`run`、`stream` 等混用）。结果是：**组件难拼接、方法名难记、替换实现时调用处到处要改**，也很难把整条流程写成清晰的“从左到右”数据流。

LangChain 的解决思路就是：**把这些“能接收输入并产生输出”的对象，尽量抽象成统一接口。**这个统一接口，就是 **Runnable**。

### 1.3 定义

**Runnable** 是 LangChain 中最核心的抽象之一，本质上就是一个“可执行的数据处理节点”接口。

这里要特别区分一个很容易混淆的点：

- **Runnable 是什么**：它表示“这一类对象是可执行组件”，是一种统一抽象标准。
- **统一调用方式是什么**：它是 Runnable 带来的结果，也就是这些组件都可以尽量用同一套方式去调用，比如 `invoke`、`batch`、`stream`。

所以更准确的结论是，**Runnable 不是“统一调用方式”的翻译，而是“统一调用方式”背后的抽象基础。**

只要某个对象实现了 Runnable 接口，它通常就能用统一方式来调用，比如： `invoke`、`batch`、`stream`、`ainvoke`、`abatch`、`astream`。

在 LangChain 里，很多你已经学过的对象，本质上都属于 Runnable：

- [Prompt 模板](13-提示词与消息模板.md)、[聊天模型](11-Model-I-O与模型接入.md)、[输出解析器](14-输出解析器.md)
- 后面会学到的检索器、工具、甚至整条链
- 更进一步，编译后的 LangGraph 图本身也可以作为 Runnable 被调用

也就是说，后面之所以能把这些组件顺畅地串成一条链，并不是因为“管道符很神奇”，而是：**这些组件本身都被设计成了可组合的 Runnable。**

### 1.4 统一调用方式

这一节先解决一个问题：后面“链式组合”为什么能成立、为什么会好用。

先看你已经学过的三个典型对象：

**1. Prompt 模板**

- 从业务角度看，Prompt 模板最常见的方法是 `format(...)`
- 但从“统一接口、便于后续组合”的角度看，它也可以用 `invoke(...)`

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
// 业务层面常见写法
prompt_str = prompt.format(topic="LangChain")

// LCEL 统一接口写法
prompt_value = prompt.invoke({"topic": "LangChain"})


```

**2. 模型**

- 从业务角度看，模型最常见的是 `invoke(...)`
- 它接收上一步 Prompt 的输出，再返回 `AIMessage`

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
ai_message = model.invoke(prompt_value)


```

**3. 解析器**

- 从业务角度看，解析器常见有 `parse(...)`
- 但在 LCEL 里也可以统一通过 `invoke(...)` 接收上一步结果

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
result = parser.invoke(ai_message)


```

这样一来，三步就被统一成了同一种风格：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
prompt_value = prompt.invoke({"question": "什么是 LangChain？"})
ai_message = model.invoke(prompt_value)
result = parser.invoke(ai_message)


```

这背后最大的价值是：**组件之间更容易替换**；**流程更容易串联**；**链本身也可以继续被当作一个组件使用**；**中间结果传递方式更统一，不需要每一步都手写很多适配代码**。

这就是后面 `prompt | model | parser` 能成立的根本原因。

### 1.5 常用方法

实现了 Runnable 接口的对象，通常都支持下面这些核心方法：

| 方法               | 作用                       | 适合场景                   |
| ------------------ | -------------------------- | -------------------------- |
| `invoke(input)`    | 同步处理单个输入           | 最常用，单次调用           |
| `batch(inputs)`    | 同步批量处理多个输入       | 批量任务、离线任务         |
| `stream(input)`    | 同步流式处理               | 打字机输出、长文本生成     |
| `ainvoke(input)`   | 异步处理单个输入           | 异步服务、高并发           |
| `abatch(inputs)`   | 异步批量处理               | 异步批量任务               |
| `astream(input)`   | 异步流式处理               | 异步聊天 UI、流式返回      |
| `astream_log(...)` | 流式输出并可选带上中间步骤 | 调试链、观察多节点执行过程 |

可以把它们理解成：

- `invoke` 是最基础的“执行一次”
- 其他方法是在同步 / 异步、单条 / 批量、一次性 / 流式这几个维度上的扩展

所以当你看到“Prompt、Model、Parser、Chain 都支持 invoke”时，不要把它理解成“它们完全一样”，而要理解成：**它们不同，但都遵守同一套调用协议。**

### 1.6 在实际项目中的价值

这一点在小案例里不一定立刻感受到，但放到实际项目里就很常见。比如一个典型企业问答系统，可能会经历这样的演进：

1. 一开始只是 `prompt + model`
2. 后来为了稳定输出，加上 `parser`
3. 再后来要分中文和英文回答，加上 `branch`
4. 再后来要同时返回摘要与原文观点，加上 `parallel`
5. 再后来要插入自定义日志、埋点、字段映射，又加上 `lambda`

如果没有 Runnable 这层统一抽象，每增加一步，代码都要改很多地方；而在 LCEL 下，这些变化更像“往链上加节点”。这也是为什么 LangChain 的链式调用会让人觉得“像拼积木”。

也正因为这种统一性，后面你会发现检索器、工具、记忆模块甚至 LangGraph 节点，理解起来都会更顺。很多更复杂的高级能力，本质上都是在 Runnable 这层统一抽象之上继续往上搭。

---

## 2、LCEL 简介

### 2.1 定义

**LCEL** 是 **LangChain Expression Language** 的缩写，中文通常叫 **LangChain 表达式语言**。它的作用很直接：**用一种声明式、可组合的方式，把多个 Runnable 连接起来。**

最经典的 LCEL 写法就是：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
chain = prompt | model | parser
result = chain.invoke({"question": "什么是 LangChain？"})


```

所以你先把 LCEL 理解成：**“用 `|（管道符）` 或其他组合方式，把多个 Runnable 连接起来的一套表达方法。”**

但 LCEL 不只是“把对象连起来”，它还在帮我们做两件事：

- 把前一步输出自动传给后一步
- 尽量减少不同节点之间手写适配的样板代码

### 2.2 LCEL 不只是语法糖

很多人第一次看到 `prompt | model | parser`，会觉得它只是“写起来更短”。但 LCEL 的价值远不止省代码。

它真正带来的好处有三层：

**1. 表达更清晰**

传统写法：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
prompt_value = prompt.invoke({"question": "什么是 LangChain？"})
ai_message = model.invoke(prompt_value)
result = parser.invoke(ai_message)


```

LCEL 写法：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
chain = prompt | model | parser
result = chain.invoke({"question": "什么是 LangChain？"})


```

第二种写法更像在表达“流程本身”，而不是只是在堆代码。

**2. 更容易组合**

- 用 LCEL 连接出来的结果，本身还可以继续参与组合：

- 一条顺序链可以放进分支链
- 一条顺序链可以放进并行链
- 并行链的输出还可以继续交给下一步处理

而且在很多常见场景里，LCEL 还会帮我们自动处理“前一步结果如何传给下一步”这类重复性工作。只有当前后节点的输入输出结构不匹配时，我们才需要自己插入 `lambda` 或 `RunnableLambda` 做一次映射。

**3. 统一支持同步、异步、批量、流式**

根据 LangChain 官方参考，`RunnableSequence` 和 `RunnableParallel` 这类组合结构，会自动继承 Runnable 的同步、异步、批量、流式能力。这意味着你不只是得到了一条“可读的链”，还得到了一条“可统一执行的链”。

### 2.3 LCEL 的核心组合思想

在入门阶段，本章最重要的不是死记类名，而是理解 LCEL 背后的几种核心组合思想：

- **顺序组合**：前一步输出作为下一步输入
- **条件路由**：根据输入选择不同链
- **并行组合**：同一输入同时喂给多条链

这里再补充一层组合视角：

- **RunnableSequence** 和 **RunnableParallel** 是两种最核心的组合原语
- 很多其他 Runnable 结构，本质上都可以看作在这两种基础组合能力上的扩展或变体

而 `RunnableLambda` 则相当于在组合过程中插入一段你自己的 Python 逻辑，让你可以做：

- 中间结果调试
- 输入结构映射
- 输出结果整理
- 简单业务判断

也就是说，LCEL 的本质并不是“多了几个类”，而是：**LangChain 开始让你用“数据流编排”的方式思考 LLM 应用。**

### 2.4 LCEL 和 Chain 的关系

这一点特别容易混淆，所以单独强调一下：

- **LCEL 是什么**：它是构建流程的一种表达方式，重点在“怎么写”。
- **Chain 是什么**：它是通过 LCEL 或其他组合方式构建出来的可执行流程，重点在“最后得到了什么”。

所以可以先用一句最容易记的话来理解：**LCEL 是构建链的方法，Chain 是构建出来的流程。**

---

## 3、Chain 结构

### 3.1 定义

在 LangChain 语境里，**Chain（链）** 可以简单理解成：**把多个 Runnable 按某种规则组合起来后，形成的一段可执行流程。**

这段流程可以很简单，也可以很复杂：

- 简单时，就是 `prompt | model`
- 常见时，是 `prompt | model | parser`
- 复杂时，可能是分支 + 并行 + 自定义函数节点混合组成的流程

最关键的一点是：**链本身也是 Runnable。**

这意味着链不会成为“终点对象”，它依然可以继续被组合。比如：

- 一条顺序链可以作为 `RunnableBranch` 的分支
- 一条顺序链可以放进 `RunnableParallel`
- 并行结果还可以继续交给后面的节点处理

### 3.2 典型结构

这一节开始，我们不再重点讨论“怎么写链”，而是看“链通常长什么样”。这一章和前面三章的关系非常紧密。

如果把 [第 13 章](13-提示词与消息模板.md)、[第 11 章](11-Model-I-O与模型接入.md)、[第 14 章](14-输出解析器.md) 放在一起看，你会发现最典型的一条链就是：

1. **Prompt**：组织输入
2. **Model**：调用模型生成结果
3. **Parser**：把结果解析成业务更容易使用的形式

也就是：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
chain = prompt | model | parser


```

这条链不是偶然写法，而是 LangChain 里最经典、最基础的组合方式。

---

## 4、链式调用基础用法与案例

### 4.1 几种链的选择与对比

| 类型           | 典型写法 / 类名                                  | 执行方式               | 输入 → 输出     | 典型场景                     |
| -------------- | ------------------------------------------------ | ---------------------- | --------------- | ---------------------------- |
| **顺序链**     | `prompt -> model -> parser` / `RunnableSequence` | 一步接一步执行         | 单输入 → 单输出 | 最基础的问答、抽取、摘要     |
| **分支链**     | `RunnableBranch(...)`                            | 按条件只走其中一条子链 | 单输入 → 单输出 | 意图路由、多语言路由         |
| **多步串行链** | 多条子链继续串联                                 | 前一步结果给后一步     | 单输入 → 单输出 | 先总结再翻译、先整理再生成   |
| **并行链**     | `RunnableParallel({...})`                        | 多条子链同时执行       | 单输入 → 多输出 | 中英文同时生成、多模型并跑   |
| **函数链**     | `RunnableLambda(func)`                           | 在链中插入 TypeScript 函数 | 取决于函数      | 字段映射、调试、轻量业务逻辑 |

如果你现在只想快速建立直觉，可以这样选：

- **只有一条直线流程**：先用顺序链
- **要按条件切换不同流程**：用分支链
- **要把多个模型调用前后串起来**：用多步串行链
- **要同一输入同时跑多条链**：用并行链
- **要插入自定义 Python 逻辑**：用函数链

---

### 4.2 RunnableSequence（顺序链）

`RunnableSequence` 是最常见、也最重要的链类型之一。LangChain 官方参考里明确说明，它几乎出现在所有基础链式流程中。

它的核心规则很简单：**前一个 Runnable 的输出，直接作为后一个 Runnable 的输入。**

所以：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
chain = prompt | model | parser


```

本质上就是一个 `RunnableSequence`。

你也可以显式写成：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
import { RunnableSequence } from "@langchain/core/runnables";

chain = RunnableSequence(first=prompt, middle=[model], last=parser)


```

但在实际开发中，更常见、更推荐的仍然是管道符写法，因为可读性更好。

这类链最典型的场景，就是把前面几章的核心内容一次性串起来：

- Prompt 组织输入
- Model 调用模型
- Parser 把输出转成字符串或结构化结果

【案例源码】`cases-langchain/06-lcel/LCEL_RunnableSequenceDemo.ts`

[LCEL_RunnableSequenceDemo.py](cases-langchain/06-lcel/LCEL_RunnableSequenceDemo.ts ":include :type=code")

这个案例建议重点看一下，因为它不仅演示了“分步执行”，也演示了“直接把三步写成一条链再一次 invoke”。这正是 LCEL 的核心体验。

### 4.3 RunnableBranch（分支链）

如果顺序链解决的是“按顺序做”，那么 `RunnableBranch` 解决的就是：**根据输入内容，决定走哪条链。**

它很像编程里的 `if / elif / else`，只是现在被放进了 Runnable 体系中。典型结构是：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
RunnableBranch(
    (条件1, 链1),
    (条件2, 链2),
    默认链,
)


```

执行时会依次判断条件：

- 第一个命中的条件对应的链会被执行
- 如果都不命中，就走默认链

这在项目里非常常见，比如：

- 根据语言选择不同翻译链
- 根据用户意图选择不同客服流程
- 根据问题类型选择不同 Prompt 或模型

本章配套案例就是一个非常典型的“语言路由”例子：

- 输入里有“日语”关键词，走日语翻译链
- 输入里有“韩语”关键词，走韩语翻译链
- 否则默认走英语翻译链

【案例源码】`cases-langchain/06-lcel/LCEL_RunnableBranchDemo.ts`

[LCEL_RunnableBranchDemo.py](cases-langchain/06-lcel/LCEL_RunnableBranchDemo.ts ":include :type=code")

这个案例和实际项目非常贴近，因为很多真实业务并不是“所有请求走同一条链”，而是“先判断，再分流”。

### 4.4 Multi-Step Chain（多步串行链）

这一节要学的重点是：**如何把多条子链首尾串起来，形成多步串行流程。**

比如这个案例做的事是：

1. 先让模型用中文介绍某个主题
2. 再把第一步结果转换成第二步所需的输入结构
3. 最后再交给另一条链翻译成英文

也就是一种非常典型的“多步加工”：

- 第一步不是最终结果
- 第二步依赖第一步结果
- 中间还可能需要做一次结构映射

这类串行链在项目里特别常见，比如：

- 先摘要，再翻译
- 先提取要点，再生成报告
- 先检索，再重写，再结构化

【案例源码】`cases-langchain/06-lcel/LCEL_MultiStepChainDemo.ts`

[LCEL_MultiStepChainDemo.py](cases-langchain/06-lcel/LCEL_MultiStepChainDemo.ts ":include :type=code")

这个案例里最值得你注意的点，不是文件名，而是中间这个映射动作：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
(lambda content: {"input": content})


```

它说明一个很常见的现实问题：**前后两步的输入输出结构，不一定天然匹配。**这也是为什么函数节点和 RunnableLambda 在 LCEL 中很实用。

### 4.5 RunnableParallel（并行链）

`RunnableParallel` 解决的是另一个常见问题：**同一份输入，我想同时交给多条链处理。**

它的核心特点是：多条子链共享同一输入、同时执行，最后再把结果按键汇总成一个 `dict`。

![RunnableParallel 并行链：同一输入进入多条 Runnable，并将结果汇总成 dict 后交给下游链](images/15/15-4-5-1.svg)

从执行机制上理解也很有帮助：

- 同步执行时，LangChain 通常会并发调度这些子 Runnable
- 异步执行时，思路上就是把多个异步任务一起等待后再汇总结果

你不一定需要一开始就记住底层细节，但要知道：**并行链不是“写在一起”，而是真的在“同一输入下多路执行”。**

例如：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
parallel_chain = RunnableParallel({
    "chinese": chain1,
    "english": chain2,
})


```

除了显式使用 `RunnableParallel(...)`，LCEL 里还有一个非常实用的写法：**直接用字典表达并行结构**。例如：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
parallel_then_summary = {
    "paragraph_1": chain1,
    "paragraph_2": chain2,
} | summary_chain


```

这段写法的含义是：

1. 先并行运行 `chain1` 和 `chain2`
2. 把结果汇总成一个字典
3. 再把这个字典交给后面的 `summary_chain`

这类写法在实际项目里很常见，因为很多业务并不是“并行完就结束”，而是“并行生成多个结果后，再统一分析或总结”。

调用后返回结果可能像这样：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
{
    "chinese": "...",
    "english": "..."
}


```

根据 LangChain 官方参考，`RunnableParallel` 是与 `RunnableSequence` 并列的另一个核心组合原语。

这种链在实际项目里也非常常见：

- 同一问题同时生成中英文答案
- 同一问题同时走多个模型做对比
- 同一份输入同时做多个维度分析

下面这个案例就是一个很清晰的例子：

- 一条子链用中文介绍 `LangChain`
- 另一条子链用英文介绍 `LangChain`
- 然后一次性返回两个结果

【案例源码】`cases-langchain/06-lcel/LCEL_RunnableParallelDemo.ts`

[LCEL_RunnableParallelDemo.py](cases-langchain/06-lcel/LCEL_RunnableParallelDemo.ts ":include :type=code")

这个案例还有一个很有价值的补充点：它调用了 `get_graph().print_ascii()`。这有助于你从“代码链”过渡到“图结构”的理解，为后续学习 LangGraph 做铺垫。

### 4.6 RunnableLambda（函数链）

`RunnableLambda` 的价值在于：**把普通 TypeScript 函数也变成 Runnable。**

这听起来像个小功能，但在实际开发里非常实用，因为链式流程经常会遇到这种情况：

- 上一步输出结构不符合下一步输入要求
- 想打印中间结果做调试
- 想做一次字段重命名
- 想插入一点简单业务逻辑

如果没有函数节点，你就得把链拆开，在外面手写很多中间处理代码；有了 `RunnableLambda`，这些逻辑就能被放回链内部。

例如：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
import { RunnableLambda } from "@langchain/core/runnables";

function debug(x) { console.log(x); }
    console.log(x)
    return {"input": x}

chain = chain1 | RunnableLambda(debug_print) | chain2


```

LangChain 还支持一种更省事的写法：直接把函数放在 `|` 中间，框架会自动包装成 Runnable。

本章配套案例也同时演示了两种写法：

- `chain1 | debug_print | chain2`
- `chain1 | RunnableLambda(debug_print) | chain2`

【案例源码】`cases-langchain/06-lcel/LCEL_RunnableLambdaDemo.ts`

[LCEL_RunnableLambdaDemo.py](cases-langchain/06-lcel/LCEL_RunnableLambdaDemo.ts ":include :type=code")

从项目角度看，RunnableLambda 很像“链里的胶水层”：

- 不负责模型能力
- 负责把前后节点粘起来

如果前面的“多步串行链”让你感受到“为什么需要中间映射”，这一节就是在回答“中间映射应该怎么优雅地写进链里”。

### 4.7 补充：其他常见 Runnable 结构

除了本章重点展开的几种结构，LangChain 里还有一些在实际项目里很常见、但初学阶段不必深入的 Runnable 组件。

| 名称                    | 作用                                                    | 什么时候会用到                               |
| ----------------------- | ------------------------------------------------------- | -------------------------------------------- |
| `RunnablePassthrough`   | 接收输入后原样透传，也可顺手往输出中补充字段            | 想保留原始输入、给结果加键、做轻量上下文拼装 |
| `RunnableWithFallbacks` | 为某个 Runnable 配置兜底逻辑，失败后回退到备用 Runnable | 模型调用失败、主链失败后自动切备用方案       |
| `RunnableBinding`       | 为 Runnable 预绑定 `config`、默认参数等                 | 同一链在不同环境复用、可配置温度与模型等     |

你现在不需要立刻掌握它们，但可以先建立印象：**Runnable 世界不只有“顺序、分支、并行、lambda”这几种，LangChain 提供了一整套可执行节点家族。**

### 4.8 重试与兜底

真实项目里，链路不是每次都能顺利跑完：模型接口会超时，结构化输出可能偶尔不合规，外部服务也可能短暂失败。LCEL 的好处之一，是可以把这类稳定性处理挂在 Runnable 上，而不是散落在业务代码各处。

最常见的两个动作是：

| 写法                    | 作用                                | 适合场景                       |
| ----------------------- | ----------------------------------- | ------------------------------ |
| `with_retry(...)`       | 当前 Runnable 失败后自动重试        | 临时网络抖动、模型偶发格式错误 |
| `with_fallbacks([...])` | 主 Runnable 失败后切到备用 Runnable | 主模型不可用、主链策略失败     |

简化示例：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
safe_chain = chain.with_retry(stop_after_attempt=3)

fallback_chain = primary_chain.with_fallbacks([backup_chain])


```

这类写法不改变链的主流程，却能让项目更接近生产环境。入门阶段不需要把参数都背下来，先记住：**LCEL 不只负责“怎么串”，也能帮助你把重试、兜底、配置这些工程能力放到链上。**

---

**章节思考题：**

1. LCEL 帮你解决的不是“少写几行代码”，而是什么问题？

   **参考思路：** 它让输入格式化、模型调用、解析、分支、并行和后处理都变成可组合的 Runnable。重点是流程结构清楚、可复用、可流式、可批处理，而不是管道符看起来简洁。

2. 读一条 LCEL 链时，你会如何判断每一段是否设计合理？

   **参考思路：** 看每个 Runnable 的输入和输出是否清楚，是否只做一类事情，是否方便单独测试。链路问题很多不是模型错，而是前后节点的数据结构没对上。

3. `RunnableLambda` 什么时候是好用的胶水，什么时候会变成坏味道？

   **参考思路：** 少量字段转换、清洗、路由判断适合用它；如果里面塞了大量业务逻辑、外部副作用和复杂异常处理，就应该拆成明确函数、工具或服务，而不是藏在链里。

4. 遇到“先分类、再分流、部分并行、最后汇总”的任务，你会如何拆链？

   **参考思路：** 先用顺序链做分类，再用分支链选择路线，可并行的检索或分析用并行链，最后用汇总节点统一输出。先画数据流，再写 LCEL，会比直接拼管道稳。

**本章小结：**

- **Runnable** 是 LangChain 中统一的“可执行组件”抽象。Prompt、Model、Parser、Tool、Chain 之所以能被统一调用，是因为它们在 Runnable 这层被约束成了同一种接口风格。
- **LCEL** 是把多个 Runnable 组合成链的表达式语言。它最核心的价值，不只是 `|` 写起来简洁，而是让流程变得声明式、可组合、可扩展。
- **链的核心主线** 是前面几章内容的自然延伸：把 [提示词模板](13-提示词与消息模板.md)、[模型调用](11-Model-I-O与模型接入.md)、[输出解析器](14-输出解析器.md) 组织成一条可执行流程。
- **常见链结构** 中，顺序链是基础，分支链解决路由问题，多步串行链解决前后步骤依赖问题，并行链解决多路同时处理问题，RunnableLambda 解决自定义逻辑如何插入链；重试与兜底则解决链路稳定性问题。
- 从掌握结果看，学完本章后，你至少应该：明白 `Runnable` 为什么是 LangChain 里最重要的统一抽象，知道 Prompt、Model、Parser、Chain 都能被统一调用；能熟练读懂并写出 `prompt | model | parser` 这种最基础 LCEL 链；能区分顺序链、分支链、多步串行链、并行链、函数链的使用场景。

**建议下一步：** 先把本章 5 个案例都跑一遍，重点观察“每一步输入输出是什么、为什么能接上下一步”；然后继续学习 [第 16 章 记忆与对话历史](16-记忆与对话历史（含Redis基础）.md) 和 [第 17 章 Tools 工具调用](17-Tools工具调用.md)，你会更清楚链式调用如何进一步扩展成带状态、带工具、带决策能力的 LLM 应用。
