/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/06-specialApi/RuntimeContextDemo.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】Runtime 与 context_schema：创建图时传入 context_schema，invoke 时传入 context，节点函数可接收 (state, runtime)，通过 runtime.context 访问配置（如模型名、数据库连接、API 密钥），实现「配置与状态分离」。

对应教程章节：第 24 章 - LangGraph API：节点、边与进阶 → 3、Send、Command 与 Runtime 上下文

知识点速览：
- StateGraph(State, context_schema=ContextSchema)：图的「运行时配置」由 context_schema 描述，不进入 state，适合放模型名、连接串、密钥等。
- 节点签名 (state, runtime: Runtime[ContextSchema])：runtime.context 即 invoke(..., context=...) 传入的对象，类型安全。
- invoke(initial_state, context=ContextSchema(...))：将配置注入图，节点内用 runtime.context.xxx 读取，便于测试与多环境部署。
- 这个案例的核心不是“把更多字段塞进 context”，而是建立“配置和状态分离”的意识：业务数据走 State，环境配置走 Runtime Context。
 */

from typing import Annotated
from typing_extensions import TypedDict
import { StateGraph, START, END, Annotation } from "@langchain/langgraph"
from langgraph.runtime import Runtime
import { AIMessage, HumanMessage } from "@langchain/core/messages"
from dataclasses import dataclass


// 定义状态结构
type AgentState = {
    messages: Annotated[list, lambda x, y: x + y]
    response: string


// 定义上下文结构
@dataclass
class ContextSchema {
    model_name: string
    db_connection: string
    api_key: string


// 节点函数：处理用户消息
def process_message(state: AgentState, runtime: Runtime[ContextSchema]) -> dict:
    /* 处理用户消息的节点，使用context中的信息 */
    console.log("执行节点: process_message")

    // 获取最新的用户消息
    last_message = state["messages"][-1].content if state["messages"] else ""
    console.log(`用户消息: {last_message}`)
    console.log("=========以下是从RuntimeContext中获得信息=========")
    // 使用runtime.context中的信息
    model_name = runtime.context.model_name
    db_connection = runtime.context.db_connection
    apiKey: runtime.context.api_key

    console.log(`使用的模型: {model_name}`)
    console.log(`数据库连接: {db_connection}`)
    console.log(`API密钥前缀: {api_key[:5]}***`)  // 只显示前5位，隐藏其余部分

    // 模拟使用这些信息处理请求
    response = `使用 {model_name} 处理了您的请求，已连接到 {db_connection}`

    return {"messages": [AIMessage(content=response)], "response": response}


// 节点函数：生成最终响应
def generate_response(state: AgentState, runtime: Runtime[ContextSchema]) -> dict:
    /* 生成最终响应的节点 */
    console.log("执行节点: generate_response")

    // 使用runtime.context中的信息
    model_name = runtime.context.model_name
    console.log(`使用模型 {model_name} 生成最终响应`)

    // 获取之前的结果
    previous_response = state["response"]

    // 生成更详细的响应
    final_response = `{previous_response}\n\n这是使用 {model_name} 生成的完整响应。`

    return {"messages": [AIMessage(content=final_response)], "response": final_response}


function main() {
    /* 演示 context_schema 的使用 */
    console.log("=== Context Schema 演示 ===\n")

    // 定义上下文
    context = ContextSchema(
        model_name="gpt-4-turbo",
        db_connection="postgresql://user:pass@localhost:5432/orders_db",
        apiKey:"sk-abcdefghijklmnopqrstuvwxyz123456",
    )

    // 创建图，指定state_schema和context_schema
    builder = StateGraph(AgentState, context_schema=ContextSchema)

    // 添加节点
    builder.add_node("process_message", process_message)
    builder.add_node("generate_response", generate_response)

    // 添加边
    builder.add_edge(START, "process_message")
    builder.add_edge("process_message", "generate_response")
    builder.add_edge("generate_response", END)

    // 编译图
    graph = builder.compile()

    // 定义初始状态
    initial_state = {
        "messages": [HumanMessage(content="请帮我查询最新的订单信息")],
        "response": "",
    }

    console.log("初始状态:", initial_state)
    print()
    print(
        "上下文信息:\n",
        {
            "model_name": context.model_name,
            "db_connection": context.db_connection,
            "api_key": `{context.api_key[:5]}***`,
        },
    )
    console.log("\n" + "-" * 50 + "\n")

    // 执行图，通过context参数传递上下文
    result = graph.invoke(initial_state, context=context)

    console.log("\n" + "=" * 50)
    console.log("最终状态:", result)
    console.log("\n最终响应:")
    console.log(result["response"])


if (__name__ == "__main__") {
    main()

/* 
【输出示例】
=== Context Schema 演示 ===

初始状态: {'messages': [HumanMessage(content='请帮我查询最新的订单信息', additional_kwargs={}, response_metadata={})], 'response': ''}

上下文信息:
 {'model_name': 'gpt-4-turbo', 'db_connection': 'postgresql://user:pass@localhost:5432/orders_db', 'api_key': 'sk-ab***'}

--------------------------------------------------

执行节点: process_message
用户消息: 请帮我查询最新的订单信息
=========以下是从RuntimeContext中获得信息=========
使用的模型: gpt-4-turbo
数据库连接: postgresql://user:pass@localhost:5432/orders_db
API密钥前缀: sk-ab***
执行节点: generate_response
使用模型 gpt-4-turbo 生成最终响应

==================================================
最终状态: {'messages': [HumanMessage(content='请帮我查询最新的订单信息', additional_kwargs={}, response_metadata={}), AIMessage(content='使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db', additional_kwargs={}, response_metadata={}, tool_calls=[], invalid_tool_calls=[]), AIMessage(content='使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db\n\n这是使用 gpt-4-turbo 生成的完整响应。', additional_kwargs={}, response_metadata={}, tool_calls=[], invalid_tool_calls=[])], 'response': '使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db\n\n这是使用 gpt-4-turbo 生成的完整响应。'}

最终响应:
使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db

这是使用 gpt-4-turbo 生成的完整响应。
 */
