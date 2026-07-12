/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/invoke/LLM_aStream.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】模型调用：异步 astream（异步流式输出）

对应教程章节：第 13 章 - 提示词与消息模板 → 4、调用大模型的调用方式

知识点速览：
- `astream` 是 `stream` 的异步版本，适合异步服务里的流式输出。
- 它返回的是异步生成器，因此必须用 `async for` 遍历，而不是普通 `for`。
- 循环中的每一块通常仍是 `AIMessageChunk`，只是读取方式变成了异步。
 */

import os
import asyncio
import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
from langchain.messages import HumanMessage, SystemMessage

// dotenv/config loaded

// ---------- 1. 实例化模型 ----------
model = new new ChatOpenAI(
    model="qwen-plus",
    
    apiKey:process.env.aliQwen-api,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)

// ---------- 2. 构建多角色消息 ----------
messages = [
    SystemMessage(content="你叫小问，是一个乐于助人的AI人工助手"),
    HumanMessage(content="你是谁"),
]


// ---------- 3. 异步流式调用（在 async 函数中）----------
async function async_stream_call() {
    // astream(messages) 返回的是「异步生成器」，不是 await 一个整体结果
    response = model.astream(messages)
    console.log(`响应类型：{type(response)}`)  // <class 'async_generator'>

    // 必须用 async for 遍历异步生成器，不能用普通 for
    for await (const chunk of response) {
        console.log(chunk.content, end="", flush=true)
    console.log("\n")


// ---------- 4. 运行异步函数 ----------
if (__name__ == "__main__") {
    await (async_stream_call())

/* 
【输出示例】
响应类型：<class 'async_generator'>
你好呀！我是小问，一个乐于助人的AI人工助手～😊
我擅长解答问题、帮你理清思路、写文案、做学习规划、整理资料，甚至陪你聊聊天、出出主意。不管是学习上的难题、工作中的困惑，还是生活里的小烦恼，我都很乐意倾听和帮忙！
 */
