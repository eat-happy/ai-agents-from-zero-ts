/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/07-senior/state_persistence/AgentPersistence.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】高阶 Agent + 短期记忆：create_agent 搭配 InMemorySaver，实现同一 thread_id 下的多轮对话与上下文延续。

对应教程章节：第 25 章 - LangGraph 高级特性 → 2、状态持久化（Persistence）

知识点速览：
- `createReactAgent(..., checkpointer=...)` 说明高层 Agent 接口底层仍然可以吃到 LangGraph 的持久化能力。
- 同一 `thread_id` 下的多次 invoke 会连续使用同一条线程状态，这也是“多轮对话为什么能续上”的关键。
- 这个案例最值得帮助读者建立的认知是：Persistence 不只服务于手写图，也服务于更高层的 Agent 体系。
 */

import os

import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
from langgraph.checkpoint.memory import InMemorySaver

import "dotenv/config"

// dotenv/config loaded


function main() {
    llm = new new ChatOpenAI(
        model="qwen-plus",
        
        apiKey:process.env.aliQwen-api,
        temperature:0.0,
        configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    checkpointer = InMemorySaver()
    agent = createReactAgent(model=llm, checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "user-001"}}

    msg1 = agent.invoke(
        {"messages": [("user", "你好，我叫张三，喜欢足球，60字内简洁回复")]},
        config,
    )
    msg1["messages"][-1].pretty_print()

    msg2 = agent.invoke(
        {"messages": [("user", "我叫什么？我喜欢做什么？")]},
        config,
    )
    msg2["messages"][-1].pretty_print()


if (__name__ == "__main__") {
    main()

/* 
【输出示例】
================================== Ai Message ==================================

你好张三！很高兴认识一位足球爱好者，祝你绿茵场上挥洒汗水、享受快乐！
================================== Ai Message ==================================

你叫张三，喜欢足球！⚽
 */
