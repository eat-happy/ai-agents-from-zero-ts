# 4 - Python 调用 Dify 平台工作流

<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：中文讲解保留原教程；**代码块使用仓库内真实 TypeScript**（`examples/` / 精校案例 / `apps/shop-query-agent`），不再使用机翻 Python。
> 精校清单：[POLISHED-CASES](POLISHED-CASES.md)


## TypeScript 可运行示例（推荐）

本章优先对照仓库真实文件：`examples/01-helloworld/index.ts`

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

  console.log("\n[AI]");
  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```bash
npx tsx examples/01-helloworld/index.ts
```



本章偏**平台调用实战**：学会用 API 和 Python 调用你在 Dify 上已搭建好的工作流，把“页面里的工作流”真正变成“代码里可调用的服务”。

---

**本章课程目标：**

- 知道调用前需在 Dify 中**发布工作流**，并会**创建 API 密钥**（密钥与工作流一一对应）。
- 掌握 Dify 工作流调用最核心的 5 个要素：URL、Authorization、`inputs`、`response_mode`、`user`。
- 能用 **Postman** 或 **Python + requests** 成功触发一个 Dify 工作流，并从流式结果里拿到最终输出。
- 会在 Dify 工作空间里查看运行日志，把“代码侧日志”和“平台侧日志”对起来排查问题。

**学习建议：** 这篇是在把 Dify 工作流从页面带到代码里。读的时候盯住五个位置：发布状态、API Key、`inputs`、流式事件、运行日志。建议先用 Postman 或 `requests` 跑通一个最小调用，再回头补字段细节；否则很容易把“接口没通”和“工作流本身没跑对”混在一起。如果你已经看过 [第 3 章](3-基于Coze&Dify平台的智能体开发.md) 的平台案例，本章会是非常自然的下一步。

---

## 1、调用前必须完成的三件事

### 1.1 先发布工作流

要通过 API 的方式启动工作流，**工作流必须处于已发布状态**。

![Dify 工作流发布入口与发布状态的界面示意图](images/4/4-1-1-1.png)

这一步很好理解：未发布的工作流仍处于编辑态，节点、变量、提示词都可能随时变化，不适合作为外部代码依赖的服务接口。

### 1.2 查看 API 文档

Dify 会为工作流提供对应的 API 文档入口。

![Dify 工作流 API 文档入口的界面示意图](images/4/4-1-2-1.png)

第一次学习时，建议你不要跳过这一步。因为后面 Python 代码里用到的 URL、请求头、请求体结构，平台都已经给你说明了。

### 1.3 创建 API 密钥

#### 1.3.1 创建密钥

![在 Dify 中创建工作流 API 密钥的界面](images/4/4-1-3-1.png)

![在 Dify 中查看并复制 API 密钥的界面](images/4/4-1-3-2.png)

创建后复制即可。

#### 1.3.2 工作流和 API Key 的关系

Dify 的 API 密钥是**和工作流绑定**的。一个 API Key 只能用于**访问特定的工作流**，而一个工作流可以对应多个 API Key。

![Dify 工作流与 API Key 绑定关系的界面示意图](images/4/4-1-3-3.png)

这和真实项目的权限控制很像：同一个工作流可以给不同环境、不同服务、不同调用方分发不同密钥，但密钥本身并不是“整个工作空间通用”的万能钥匙。

---

## 2、先看懂请求结构

通过 POST 请求启动工作流，官方常见写法如下：

```sh
curl -X POST 'https://api.dify.ai/v1/workflows/run' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'
```

### 2.1 URL

```text
https://api.dify.ai/v1/workflows/run
```

如果你使用的是本地部署版 Dify，通常改成：

```text
http://localhost/v1/workflows/run
```

如果是服务器部署，则替换成你自己的域名或服务器地址。

### 2.2 请求头

| 键            | 值                 |
| ------------- | ------------------ |
| Authorization | `Bearer {api_key}` |
| Content-Type  | `application/json` |

其中 `api_key` 替换为上一步创建的密钥。

### 2.3 请求体

```json
{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}
```

这三个字段分别解决不同问题：

- `inputs`：传给工作流的业务入参，字段名必须和工作流中定义的输入变量对齐。
- `response_mode`：决定返回方式，是流式还是阻塞式。
- `user`：标识调用方，便于平台日志区分不同用户或请求来源。

### 2.4 streaming 和 blocking 的区别

- **流式（streaming）**：基于 SSE（Server-Sent Events）边执行边返回，适合长时间任务、需要看到过程日志的场景。
- **阻塞式（blocking）**：等待工作流全部执行完再一次性返回，写法更简单，但长流程更容易超时。

> **可这样记：** 调试和真实项目里，一般优先用 `streaming`。因为它既能让你拿到最终结果，也能帮助你看到中间节点发生了什么。

---

## 3、先用 Postman 验证一次

这一节不是必须的，但非常推荐。因为很多问题在 Python 接入之前，先用 Postman 就能定位清楚。

### 3.1 新建 POST 请求并填写 URL

![在 Postman 中新建 Dify 工作流 POST 请求的界面](images/4/4-3-1-1.png)

### 3.2 添加请求头

![在 Postman 中配置 Dify 工作流请求头的界面](images/4/4-3-2-1.png)

### 3.3 添加请求体

Body 选择 `raw`，格式选择 `JSON`。

![在 Postman 中填写 Dify 工作流 JSON 请求体的界面](images/4/4-3-3-1.png)

示例请求体：

```json
{
  "inputs": {
    "target": "新能源汽车发展概况"
  },
  "response_mode": "streaming",
  "user": "postman_test"
}
```

这里的 `target` 就是工作流输入变量名，必须和你在 Dify 工作流中定义的字段一致。

### 3.4 发送请求

![在 Postman 中发送 Dify 工作流请求的界面](images/4/4-3-4-1.png)

### 3.5 看懂响应

![Postman 中查看 Dify 流式响应整体结果的界面](images/4/4-3-5-1.png)

响应开始标志：

![Dify 流式响应开始事件的界面示意图](images/4/4-3-5-2.png)

响应结束标志：

![Dify 流式响应结束事件的界面示意图](images/4/4-3-5-3.png)

最终响应体携带工作流的最终输出：

![Dify 工作流最终输出结果在响应体中的界面示意图](images/4/4-3-5-4.png)

### 3.6 怎么理解返回体

最后一个关键事件通常是：

```json
{
  "event": "workflow_finished",
  "workflow_run_id": "xxx",
  "task_id": "xxx",
  "data": {
    "status": "succeeded",
    "outputs": {
      "output": ["...最终结果..."]
    }
  }
}
```

第一次学习时，把它记成一句话就够了：

> **只要你最终收到了 `workflow_finished`，并且 `status` 是 `succeeded`，这次工作流调用通常就算成功了。**

---

## 4、在 Dify 后台看运行日志

### 4.1 打开日志页面

![Dify 工作流运行日志入口的界面示意图](images/4/4-4-1-1.png)

### 4.2 查看结果

![Dify 工作流运行结果列表页的界面示意图](images/4/4-4-2-1.png)

### 4.3 查看详情

![Dify 工作流运行详情页的界面示意图](images/4/4-4-3-1.png)

### 4.4 查看追踪信息

![Dify 工作流追踪信息页面的界面示意图](images/4/4-4-4-1.png)

平台日志的价值非常大，因为它能告诉你：这次请求有没有真正进到工作流；哪个节点报错了；输入变量有没有传对；最终输出是不是和代码侧拿到的一致。

很多时候，问题并不是 Python 代码写错，而是**工作流内部节点、变量名、工具配置**出了问题。这个时候平台日志会比本地日志更直观。

---

## 5、用 Python 调用 Dify 工作流

### 5.1 安装依赖

```sh
npm install requests
```

### 5.2 一份更适合真实项目的示例代码

```typescript
// Real TypeScript from repo: examples/01-helloworld/index.ts
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

  console.log("\n[AI]");
  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 5.3 代码里最关键的三件事

这段代码最值得你真正看懂的，不是语法，而是这三件事：

1. 通过 `Authorization: Bearer ...` 完成身份认证。
2. 通过 `inputs` 把业务参数传给工作流。
3. 通过监听 `workflow_finished` 事件拿到最终结果。

### 5.4 本地部署版 Dify 怎么改？

如果你调用的是自己部署的 Dify，通常只需要把环境变量改成：

```bash
export DIFY_BASE_URL=http://localhost/v1
export DIFY_API_KEY=your_api_key
```

Windows PowerShell 可改成：

```powershell
$env:DIFY_BASE_URL="http://localhost/v1"
$env:DIFY_API_KEY="your_api_key"
```

---

## 6、怎么读懂流式日志

### 6.1 日志分为两类

#### 1. 以 data: 开头

这类是真正的工作流运行日志。

```text
decoded_line: data: {"event": "iteration_next", ...}
```

#### 2. 以 event: 开头

这类通常是通信层心跳或事件类型提示。

```text
decoded_line: event: ping
```

### 6.2 真正要抓住的主线

```text
workflow_started
-> node_started / node_finished（每个节点的开始与结束）
-> iteration_next（如果有循环或迭代）
-> workflow_finished
```

一个更适合阅读的日志片段如下：

```text
=== 开始接收流式响应 ===
decoded_line: data: {"event":"workflow_started", ...}
decoded_line: data: {"event":"node_started", "data":{"title":"开始", ...}}
decoded_line: data: {"event":"node_finished", "data":{"title":"开始", "status":"succeeded", ...}}
decoded_line: data: {"event":"node_started", "data":{"title":"谷歌搜索", ...}}
decoded_line: data: {"event":"node_finished", "data":{"title":"谷歌搜索", "status":"succeeded", ...}}
decoded_line: data: {"event":"workflow_finished", "data":{"status":"succeeded", "outputs":{...}}}
```

这些事件分别对应工作流的不同阶段：`workflow_started` 表示整次工作流开始执行，`node_started / node_finished` 表示某个具体节点开始或结束，`workflow_finished` 则表示整次流程结束，并会在 `outputs` 中给出最终结果。

### 6.3 为什么不建议把完整正文原样打印进文档

如果你的工作流输出是一篇长文，不建议把整篇正文原样打印进教学文档。真实项目里更常见的做法是：

1. 在日志里确认 `status` 是否为 `succeeded`
2. 从 `outputs` 中取出最终字段
3. 只打印前几百个字符做调试预览
4. 需要完整内容时再写入文件、数据库或上层接口响应

例如：

```typescript
// Real TypeScript from repo: examples/01-helloworld/index.ts
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

  console.log("\n[AI]");
  console.log(res.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 6.4 查看 Dify 后台日志

对比 Dify 后台日志和 Python 控制台日志，最终运行结果应该能互相对应。

![Dify 后台日志与 Python 控制台日志对照的界面示意图](images/4/4-6-4-1.png)

![Dify 后台详细运行日志与节点执行信息的界面示意图](images/4/4-6-4-2.png)

---

## 7、真实项目里最常见的排查顺序

如果 API 调用失败，建议按下面顺序排查：

1. **先看平台**：工作流是否已发布、API Key 是否对应这个工作流。
2. **再看请求**：URL、Header、`inputs` 字段名、变量类型是否正确。
3. **再看事件流**：有没有收到 `workflow_finished`，`status` 是不是 `succeeded`。
4. **最后看后台日志**：哪一个节点出错，是否是平台内部逻辑问题。

这条顺序比“哪里报错就盯哪里”更稳定，因为它把问题分成了**入口层、请求层、执行层、平台层**四个层次。

---

**章节思考题：**

1. 从页面里的 Dify 工作流，到 Python 代码调用，中间必须确认哪几个点？

   **参考思路：** 先确认工作流已发布，再确认 API Key、调用地址、`inputs` 字段、`response_mode`、`user` 和日志入口。页面能跑只是第一步，代码侧还要验证鉴权、参数和返回事件是否一致。

2. 如果接口返回异常，你会如何判断是工作流没发布、鉴权错误、入参错误，还是事件解析错误？

   **参考思路：** 先看 HTTP 状态码和平台日志；401/403 优先查 Key，404 或找不到应用查发布和地址，参数报错查 `inputs`，代码没拿到最终结果再查流式事件解析。不要一上来就改工作流节点。

3. 为什么调用工作流时不能只关心最终文本，还要看中间事件？

   **参考思路：** 流式事件能告诉你工作流执行到了哪一步、哪个节点报错、最终输出来自哪个事件。真实项目里排障、进度展示和超时处理都依赖这些中间信息。

**本章小结：**

- **调用前提**：Dify 工作流必须先发布，并创建与之绑定的 API Key。
- **调用核心**：最关键的请求要素是 URL、Authorization、`inputs`、`response_mode` 和 `user`；它们共同决定“调哪个工作流、用什么身份、传什么输入、怎么拿结果”。
- **返回模式要分清**：`blocking` 适合简单调用，`streaming` 更适合真实项目调试与长流程任务。
- **排查主线**：本章最重要的不是背某段代码，而是掌握一条稳定排查路径：**平台先发布并调通 -> Postman / curl 验证 -> Python 接入 -> Dify 日志对照排查**。

**建议下一步：**

- 如果你还要继续接 Coze 平台工作流，进入 [第 5 章 Python 调用 Coze 平台工作流](5-Python调用Coze平台工作流.md)。
- 如果你想把平台能力和 Agent 原理连接起来，进入 [第 21 章 Agent 智能体](21-Agent智能体.md)。
- 如果你准备部署自己的 Dify 环境，进入 [第 6 章 Dify 的安装和启动](6-Coze与Dify的Windows平台部署.md#_4、dify-的安装和启动) 或 [第 7 章 企业级大模型部署](7-企业级大模型部署.md)。
