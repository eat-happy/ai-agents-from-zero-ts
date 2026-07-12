/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/invoke/LLM_Invoke_InputTypes.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】invoke / ainvoke 的多种输入类型（字符串、Message 列表、元组列表、字典列表）

对应教程章节：第 13 章 → 2、调用大模型的入参类型

知识点速览：
- 聊天模型的 `invoke` 不只接受字符串，也常接受消息对象列表、`(role, content)` 元组列表、
  `{"role": "...", "content": "..."}` 字典列表。
- 这些写法的目标都是表达“这次输入由哪些角色、哪些内容组成”；LangChain 会在内部转成统一的消息表示。
- 初学者若想把角色关系看得最清楚，优先用 `SystemMessage`、`HumanMessage` 等 Message 类写法。
 */

import asyncio
import os

import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// dotenv/config loaded

model = new new ChatOpenAI(
    model="qwen-plus",
    
    apiKey:process.env.aliQwen-api,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)


function demo_message_objects() {
    /* 推荐：显式 Message 对象，角色与字段最清晰。 */
    messages = [
        SystemMessage(content="你是一个专业的数学助手，回答要简短。"),
        HumanMessage(content="你好，你是谁？"),
    ]
    resp = model.invoke(messages)
    console.log(type(resp), resp.content[:80] if resp.content else "")


function demo_tuple_list() {
    /* 元组列表：与 ChatPromptTemplate.from_messages 的写法一致。 */
    messages = [
        ("system", "你是一个专业的数学助手，回答要简短。"),
        ("human", "你好，你是谁？"),
    ]
    resp = model.invoke(messages)
    console.log(type(resp), resp.content[:80] if resp.content else "")


function demo_dict_list() {
    /* 字典列表：与 OpenAI Chat Completions 等 API 的请求体形状接近。 */
    messages = [
        {"role": "system", "content": "你是一个专业的数学助手，回答要简短。"},
        {"role": "user", "content": "你好，你是谁？"},
    ]
    resp = model.invoke(messages)
    console.log(type(resp), resp.content[:80] if resp.content else "")


async function demo_ainvoke_tuple() {
    /* 异步调用同样支持元组简写。 */
    resp = await model.ainvoke([("user", "用一句话说明什么是素数")])
    console.log(type(resp), resp.content[:80] if resp.content else "")


if (__name__ == "__main__") {
    console.log("--- Message 对象列表 ---")
    demo_message_objects()
    console.log("--- 元组列表 ---")
    demo_tuple_list()
    console.log("--- 字典列表 ---")
    demo_dict_list()
    console.log("--- ainvoke + 元组 ---")
    await (demo_ainvoke_tuple())

/* 
【输出示例】
--- Message 对象列表 ---
<class 'langchain_core.messages.ai.AIMessage'> 我是Qwen，阿里巴巴研发的超大规模语言模型。
--- 元组列表 ---
<class 'langchain_core.messages.ai.AIMessage'> 我是Qwen，阿里巴巴研发的超大规模语言模型。
--- 字典列表 ---
<class 'langchain_core.messages.ai.AIMessage'> 我是Qwen，阿里巴巴研发的超大规模语言模型。
--- ainvoke + 元组 ---
<class 'langchain_core.messages.ai.AIMessage'> 素数（或质数）是指大于1的自然数中，除了1和它本身之外不再有其他正因数的数。
 */
