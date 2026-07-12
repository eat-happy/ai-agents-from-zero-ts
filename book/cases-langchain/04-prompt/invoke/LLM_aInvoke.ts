/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/invoke/LLM_aInvoke.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】模型调用：异步 ainvoke

对应教程章节：第 13 章 - 提示词与消息模板 → 4、调用大模型的调用方式

知识点速览：
- `ainvoke` 是 `invoke` 的异步版本，等待模型返回时不会阻塞事件循环。
- 它适合异步 Web 服务、并发任务和需要同时处理多条请求的场景。
- 返回结果类型通常仍是 `AIMessage`；只是调用方式从“直接返回”变成了“`await` 后返回”。
 */

import os
import asyncio
import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"

// dotenv/config loaded

// ---------- 1. 实例化模型（与同步版本相同）----------
model = new new ChatOpenAI(
    model="qwen-plus",
    
    apiKey:process.env.aliQwen-api,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)


async function main() {
    /* 异步主函数：必须用 async def，内部用 await 调用 ainvoke。 */
    // ---------- 2. 异步调用一条请求 ----------
    // 这里演示最简单的字符串输入；若需要系统设定、多轮上下文，也可以像同步 invoke 一样传 messages 列表。
    // await：等待模型返回时不阻塞事件循环，其他协程可同时执行。
    response = await model.ainvoke("解释一下LangChain是什么，简洁回答100字以内")
    console.log(`响应类型：{type(response)}`)
    console.log(response.content_blocks)


// ---------- 3. 运行异步程序 ----------
// await (main()) 会启动事件循环、执行 main()，直到 main() 结束。初学者只需记住：异步入口这样写。
if (__name__ == "__main__") {
    await (main())

/* 
【输出示例】
响应类型：<class 'langchain_core.messages.ai.AIMessage'>
[{'type': 'text', 'text': 'LangChain是一个开源框架，用于构建基于大语言模型（LLM）的应用程序。它提供模块化组件（如链、代理、记忆、工具集成等），支持提示工程、数据检索增强（RAG）、多步推理和外部工具调用，简化LLM应用的开发、编排与部署。'}]
 */
