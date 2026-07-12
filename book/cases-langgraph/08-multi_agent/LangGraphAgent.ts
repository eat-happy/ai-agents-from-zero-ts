/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/08-multi_agent/LangGraphAgent.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】单智能体最小闭环：create_agent 绑定 LLM 与工具，invoke 传入 messages，观察工具调用与最终回复。

对应教程章节：第 26 章 - LangGraph 多智能体与 A2A → 1、A2A 协议与多智能体架构概览

知识点速览：
- 这是本章的“对照组”案例：先看单智能体已经能解决什么问题，再理解为什么某些场景并不需要一上来就拆成多智能体。
- 单智能体：一个模型 + 一组工具，由模型决定何时调工具；适合单领域、小任务、统一入口的助手场景。
- create_agent 返回的可执行对象底层仍基于 LangGraph；type(agent) 可帮助读者建立“高层 Agent 接口背后仍是图运行时”的认知。
- 工具函数需清晰 docstring，便于模型理解参数与用途；本案例重点不是天气业务本身，而是“Agent + Tools”的最小闭环。
- 注释中保留 stream 示例：stream_mode 可取 messages / updates / values / custom，用于和前面 LangGraph Streaming 主线衔接（需取消注释运行）。
 */

import os

import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import "dotenv/config"

// dotenv/config loaded


def get_weather(city: string) -> str:
    /* 获取指定城市的天气信息。

    Args:
        city: 城市名称
    Returns:
        返回该城市的天气描述（本案例为写死返回值，仅作演示）
     */
    return `今天{city}是晴天，仅做测试，固定写死`


function main() {
    llm = new new ChatOpenAI(
        model="qwen-plus",
        
        apiKey:process.env.aliQwen-api,
        configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    agent = createReactAgent(
        model=llm,
        tools=[get_weather],
    )
    console.log("agent 底层本质是个什么对象: " + str(type(agent)))

    human_message = HumanMessage(content="今天深圳天气怎么样？")
    response = agent.invoke({"messages": [human_message]})

    print()
    console.log("模型回答：", response["messages"][-1].content)
    print()
    response["messages"][-1].pretty_print()

    // 流式示例（可选）：
    // stream_mode：messages 流式 token；updates 每步工具；values 整状态快照；custom 配合 get_stream_writer
    // for chunk in agent.stream(
    //     {"messages": [{"role": "user", "content": "请问北京今天天气如何？"}]},
    //     stream_mode="values",
    // ):
    //     chunk["messages"][-1].pretty_print()


if (__name__ == "__main__") {
    main()

/* 
【输出示例】
agent 底层本质是个什么对象: <class 'langgraph.graph.state.CompiledStateGraph'>

模型回答： 今天深圳是晴天。

================================== Ai Message ==================================

今天深圳是晴天。
 */
