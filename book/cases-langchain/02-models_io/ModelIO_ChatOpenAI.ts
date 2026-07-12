/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/02-models_io/ModelIO_ChatOpenAI.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】使用 LangChain ChatOpenAI 调用大模型（OpenAI 兼容接口）

对应教程章节：第 11 章 - Model I/O 与模型接入 → 3、接入大模型

知识点速览：
- 本案例对应第 11 章中“OpenAI 兼容接口 + LangChain provider 类”这条接法。
- 通过 `ChatOpenAI + base_url` 可接入通义 / 阿里百炼等兼容接口，并继续与 Prompt、Parser、Chain、Agent、Memory 等组件配合。
- 与 `ModelIO_OpenAI.py` 的核心区别在于：这里返回的是 LangChain 语义下的 `AIMessage`，通常先用 `response.content` 取正文。
- 依赖 `langchain-openai`，运行前在 `.env` 中配置 API Key。
 */

// ========== 1. 导入与环境 ==========
import { ChatOpenAI } from "@langchain/openai"
import os

import "dotenv/config"

// dotenv/config loaded

// ========== 2. 初始化聊天模型（OpenAI 兼容接口） ==========
// 这里选择 qwen-plus + 阿里百炼兼容端点，目的是演示“如何把兼容接口接进 LangChain 模型对象”。
chat_llm = new ChatOpenAI(
    model="qwen-plus",  // 可按需更换，模型列表见阿里云文档
    apiKey:process.env.aliQwen-api,  // 或 process.env.QWEN_API_KEY
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)

// ========== 3. 调用模型并打印回复 ==========
// 这里直接传入多角色消息列表，后续第 13 章会继续系统讲解 Message 体系。
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "你是谁？"},
]

response = chat_llm.invoke(messages)
// 返回值是 AIMessage；若你要看 token 用量、finish_reason、模型名等，可继续查看 response.response_metadata。
console.log(response.content)
