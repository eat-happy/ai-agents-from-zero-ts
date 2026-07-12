# 第 5 章 TypeScript / Node.js 调用 Coze 平台工作流


<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js**。
> 可运行精校示例见仓库根目录 `examples/` 与 `apps/shop-query-agent/`。自动迁移的代码块若与最新 SDK API 有差异，以可运行示例为准。


## TypeScript / Node.js 最小可运行示例

> 本章原 Python 调用示例已迁移。下面给出 Node.js 侧最常用的 etch 写法，便于你直接落地。

```ts
const COZE_TOKEN = process.env.COZE_TOKEN!;
const WORKFLOW_ID = process.env.COZE_WORKFLOW_ID!;

async function runCozeWorkflow(parameters: Record<string, unknown>) {
  const res = await fetch("https://api.coze.cn/v1/workflow/run", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COZE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      parameters,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const result = await runCozeWorkflow({ input: "生成一份商品卖点" });
console.log(result);
```

本章偏**平台调用实战**：学会用 API 和 TypeScript / Node.js 调用你在 Coze 上已搭建好的工作流，把“扣子里的工作流”接进本地代码和业务系统。

---

**本章课程目标：**

- 知道调用前需在 Coze 中**发布 API**，并在 API 调试页面拿到 `workflow_id`、`app_id` 和 API Key。
- 理解 Coze 工作流调用里最关键的请求字段：`workflow_id`、`app_id`、`parameters`。
- 能看懂 Coze 流式返回里的常见事件：`PING`、`Message`、`Done`。
- 能用 **cozepy** 官方 SDK 在本地跑通一次最小调用，并知道真实项目里为什么要用环境变量而不是把密钥写死在代码里。

**学习建议：** 这章和第 4 章最适合对照着看。你会发现两个平台虽然界面、SDK 和字段命名不同，但背后的主线是一样的：**平台发布 -> 鉴权 -> 传业务参数 -> 收事件流 -> 去平台日志核对结果**。

---

## 1、调用前必须先发布 API

Coze 的 API 能力需要通过应用发布功能启用。

![Coze 工作流发布 API 入口的界面示意图](images/5/5-1-1-1.png)

这一步的意义和 Dify 很像：只有发布后的工作流，才适合作为外部系统依赖的稳定入口。

---

## 2、先在平台里把关键信息拿全

### 2.1 API 调试入口

发布成功后，在工作流画布页面可以看到 API 调试入口。

![Coze 工作流画布中的 API 调试入口界面](images/5/5-2-1-1.png)

### 2.2 查看 workflow_id 和 app_id

通过 API playground，选择右侧的 Shell 请求方式。

界面中会显示：

- **工作流 ID**：`workflow_id`
- **应用 ID**：`app_id`

![Coze API Playground 中查看 workflow_id 和 app_id 的界面](images/5/5-2-2-1.png)

可以这样理解：

- `workflow_id`：这次到底执行哪一个工作流
- `app_id`：这个工作流属于哪个应用上下文

### 2.3 生成并授权 API Key

左侧窗口向下滑动，可以看到 token（即 API Key），点击“授权”按钮。

![Coze API Playground 中生成并授权 API Key 的界面](images/5/5-2-3-1.png)

点击后会自动生成并填充 API Key。

![Coze API Playground 中自动填充 API Key 后的界面](images/5/5-2-3-2.png)

右侧的 Shell 命令窗口会同步更新。

### 2.4 添加参数

请求体中的 `parameters` 对象用于向工作流传递参数，该对象的每个属性都对应工作流中的一个输入变量。

![Coze API Playground 中配置 parameters 入参的界面](images/5/5-2-4-1.png)

这也是 Coze 调用里最容易出错的地方。因为它不是“差不多就行”，而是**字段名、类型、结构都必须对齐平台里的定义**。

### 2.5 运行

可以直接点击 Shell 命令窗口右上角的“运行”按钮。

![Coze API Playground 中运行工作流请求的界面](images/5/5-2-5-1.png)

---

## 3、看懂最小调用请求

平台里看到的 curl 命令大致如下：

```sh
curl -X POST 'https://api.coze.cn/v1/workflow/stream_run' \
-H "Authorization: Bearer {api_key}" \
-H "Content-Type: application/json" \
-d '{
  "workflow_id": "{workflow_id}",
  "app_id": "{app_id}",
  "parameters": {
    "link": "https://example.com/video"
  }
}'
```

这里最关键的字段只有三个：

- `workflow_id`：执行哪个工作流
- `app_id`：归属哪个应用
- `parameters`：传给工作流的实际业务参数

> **注意：** JSON 标准不支持注释，所以请求体里不要写 `# 说明文字` 这种内容。

---

## 4、怎么看流式结果

### 4.1 运行结果界面

![Coze 工作流流式运行结果界面的整体示意图](images/5/5-4-1-1.png)

### 4.2 Message

![Coze 流式返回中 Message 事件内容的界面示意图](images/5/5-4-2-1.png)

`Message` 才是携带真正业务内容的事件类型，此处的 `content` 就是工作流某一步的输出。

### 4.3 Done

![Coze 流式返回中 Done 结束事件的界面示意图](images/5/5-4-3-1.png)

`Done` 表示流式响应结束，通常出现在所有 `Message` 之后。

### 4.4 你真正需要记住的三类信号

- **PING**：心跳包，只负责保活连接，通常可忽略。
- **Message**：真正携带内容的事件。
- **Done**：整次流式输出结束。

> **可这样记：** 写代码时，重点关注 `Message` 和结束信号；`PING` 不是业务结果，只是说明连接还活着。

---

## 5、用 TypeScript / Node.js 调用 Coze 工作流

### 5.1 官方 Python SDK 入口

Coze 提供了官方 Python SDK：`cozepy`。

![Coze 官方 Python SDK cozepy 的文档或仓库界面示意图](images/5/5-5-1-1.png)

### 5.2 安装依赖

```sh
npm install cozepy
```

### 5.3 示例源码

````typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
/* 
This example describes how to use the workflow interface to stream chat.
 */


// Our official coze sdk for Python [cozepy](https://github.com/coze-dev/coze-py)
from cozepy import COZE_CN_BASE_URL

// Get an access_token through personal access token || oauth.
coze_api_token = '{API_KEY}'
// The default access is api.coze.com, but if you need to access api.coze.cn,
// please use base_url to configure the api endpoint to access
coze_api_base = COZE_CN_BASE_URL

from cozepy import Coze, TokenAuth, Stream, WorkflowEvent, WorkflowEventType  // noqa

// Init the Coze client through the access_token.
coze = Coze(auth=TokenAuth(token=coze_api_token), configuration:{ baseURL:coze_api_base)

// Create a workflow instance in Coze, copy the last number from the web link as the workflow's ID.
workflow_id = '{WORKFLOW_ID}'


// The stream interface will return an iterator of WorkflowEvent. Developers should iterate
// through this iterator to obtain WorkflowEvent && handle them separately according to
// the type of WorkflowEvent.
function handle_workflow_iterator(stream: Stream[WorkflowEvent]) {
    for (const event of stream) {
        if (event.event == WorkflowEventType.MESSAGE) {
            console.log("got message", event.message)
        } else if (event.event == WorkflowEventType.ERROR) {
            console.log("got error", event.error)
        } else if (event.event == WorkflowEventType.INTERRUPT) {
            handle_workflow_iterator(
                coze.workflows.runs.resume(
                    workflow_id=workflow_id,
                    event_id=event.interrupt.interrupt_data.event_id,
                    resume_data="hey",
                    interrupt_type=event.interrupt.interrupt_data.type,
                )
            )


handle_workflow_iterator(
    coze.workflows.runs.stream(
        workflow_id=workflow_id
    )
)

### 5.4 在本地 VS Code / WebStorm 中运行

当你直接拷贝平台生成代码时，如果工作流定义了输入变量，但 `stream()` 调用里没有传 `parameters`，就会报错。

![在 VS Code / WebStorm 中运行 Coze 工作流代码时报缺少 parameters 的界面示意图](images/5/5-5-4-1.png)

平台里的提示也已经很清楚：

![Coze 平台提示需要传入 parameters 参数的界面示意图](images/5/5-5-4-2.png)

**处理方式**：在从 Coze 平台拷贝的代码基础上，为 `stream()` 调用增加 **parameters** 参数：



```typescript
handle_workflow_iterator(
    coze.workflows.runs.stream(
        workflow_id=workflow_id,
        parameters={
            "link": "https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0"   # 替换成实际需要的链接
        }
    )
)
````

### 5.4 最终代码

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
/* 
This example describes how to use the workflow interface to stream chat.
 */


// Our official coze sdk for Python [cozepy](https://github.com/coze-dev/coze-py)
from cozepy import COZE_CN_BASE_URL

// Get an access_token through personal access token || oauth.
coze_api_token = 'cztei_hXYOqnustyYyhrSuGFl4tgcxJ9E2KjYLPnHvcEcoWRwWvujWU0sPqka8xyQ1wsCyi'
// The default access is api.coze.com, but if you need to access api.coze.cn,
// please use base_url to configure the api endpoint to access
coze_api_base = COZE_CN_BASE_URL

from cozepy import Coze, TokenAuth, Stream, WorkflowEvent, WorkflowEventType  // noqa

// Init the Coze client through the access_token.
coze = Coze(auth=TokenAuth(token=coze_api_token), configuration:{ baseURL:coze_api_base)

// Create a workflow instance in Coze, copy the last number from the web link as the workflow's ID.
workflow_id = '7537267958432858127'


// The stream interface will return an iterator of WorkflowEvent. Developers should iterate
// through this iterator to obtain WorkflowEvent && handle them separately according to
// the type of WorkflowEvent.
function handle_workflow_iterator(stream: Stream[WorkflowEvent]) {
    for (const event of stream) {
        if (event.event == WorkflowEventType.MESSAGE) {
            console.log("got message", event.message)
        } else if (event.event == WorkflowEventType.ERROR) {
            console.log("got error", event.error)
        } else if (event.event == WorkflowEventType.INTERRUPT) {
            handle_workflow_iterator(
                coze.workflows.runs.resume(
                    workflow_id=workflow_id,
                    event_id=event.interrupt.interrupt_data.event_id,
                    resume_data="hey",
                    interrupt_type=event.interrupt.interrupt_data.type,
                )
            )


handle_workflow_iterator(
    coze.workflows.runs.stream(
        workflow_id=workflow_id,
        parameters={
            "link": "https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0"   // 替换成实际需要的链接
        }
    )
)


```

### 5.5 运行结果

![TypeScript / Node.js 调用 Coze 工作流后的运行结果界面示意图](images/5/5-5-5-1.png)

## 6、除了 SDK，还可以在平台侧运行

如果你只是想先确认工作流本身能正常输出，也可以直接在平台里测试。

![在 Coze 平台侧直接测试工作流输出的界面示意图](images/5/5-6-1-1.png)

真实项目中，推荐的顺序通常是：

1. 先在平台确认工作流逻辑跑通
2. 再用 API playground 验证请求结构
3. 最后再接入 TypeScript 代码

这样最容易把问题分层定位，而不是平台和代码一起调，最后什么都分不清。

---

**章节思考题：**

1. 调用 Coze 工作流前，你会如何确认“平台侧已经准备好”？

   **参考思路：** 先确认工作流发布状态、Token 或鉴权方式、`workflow_id`、必要的 `app_id` / `bot_id`、输入参数和平台侧测试结果。平台侧没跑通时，TypeScript 代码再完整也只会放大问题。

2. Coze 和 Dify 的接口字段不同，但调用主线为什么很像？

   **参考思路：** 两者本质都是把平台工作流暴露成 API：发布、鉴权、传业务参数、接收运行结果、回日志核对。字段名会变，排查顺序和工程关注点差不多。

3. 如果 TypeScript 代码没有拿到预期输出，你会如何分层排查？

   **参考思路：** 先在平台调试工作流，再用 API playground 或最小请求确认接口，最后看 Python 解析逻辑。这样能分清是平台配置、接口参数、鉴权，还是代码处理的问题。

**本章小结：**

- **调用前提**：Coze 工作流要先发布 API，并确认 `workflow_id`、`app_id` 和 API Key 都已拿到。
- **调用核心**：`cozepy` 帮你封装了请求与事件流，但真正最关键的仍然是 `parameters` 是否和工作流输入变量一一对齐。
- **事件流不要只看正文**：Coze 的流式执行除了正常输出，还可能出现 ERROR、INTERRUPT 等事件。学这章时，重点不是“能打印出一段文本”，而是能正确理解一次工作流执行到底是成功完成、等待干预，还是中途失败。
- **调试主线**：和第 4 章一样，平台调试和代码调用要相互印证；一旦结果异常，优先看参数映射、事件流、平台侧调试输出和本地日志是否能互相对上。

**建议下一步：** 如果你想继续走 Coze 本地化和私有化路线，可以看 [第 6 章 Coze 与 Dify 的 Windows 平台部署](6-Coze与Dify的Windows平台部署.md)；如果你想从平台调用进一步过渡到代码框架主线，也可以回到 [第 9 章 LangChain 概述与架构](9-LangChain概述与架构.md) 开始进入 LangChain 学习。
