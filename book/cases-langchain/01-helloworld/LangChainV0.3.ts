/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/01-helloworld/LangChainV0.3.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】LangChain 0.x 写法：ChatOpenAI + 三种配置方式（硬编码 / 环境变量 / .env）

对应教程章节：第 10 章 - LangChain 快速上手与 HelloWorld → 4、实战：基于阿里百炼的 HelloWorld

知识点速览：
- 0.x 写法从各厂商包直接导入具体类（如 ChatOpenAI），通过 base_url 接国内兼容接口。
- 配置方式演进：硬编码（不推荐）→ 环境变量 → .env + load_dotenv（推荐），避免 API Key 进版本库。
- invoke 同步调用、response.content 取回复正文。了解即可，当前主推 1.0 的 init_chat_model 写法。

补充说明：
- 本脚本虽然放在“阿里百炼 HelloWorld”这一节里，但当前演示模型使用的是部署在阿里百炼兼容端点上的 `deepseek-v3.2`。
- 重点不在“必须调用哪一个模型”，而在“看懂 0.x/经典写法如何通过 OpenAI 兼容接口完成第一次调用”。
- 运行前请在项目根目录准备 `.env`；本仓库里 `QWEN_API_KEY` / `aliQwen-api` 都可能指向阿里百炼 Key，这是历史兼容写法。
 */

from langchain_openai import (
    ChatOpenAI,
)  // OpenAI 兼容的聊天模型封装，可配合 base_url 接国内平台
import os
import "dotenv/config"  // 从 .env 文件加载环境变量，避免把 API Key 写进代码

// ========== 1. 大模型客户端初始化（三种配置方式，推荐第 3 版） ==========

// 第 1 版：硬编码写死（仅演示，不推荐）
// 缺点：API Key 会进版本库，有泄露风险；换环境要改代码。
// llm = new ChatOpenAI(
//     model="qwen-plus",
//     apiKey:"你自己的api-key",
//     configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1"
// )

// 第 2 版：用系统环境变量（需先 export 或在运行前 set）
// 缺点：若未先 export/set 或未执行 // dotenv/config loaded，代码就可能取到空值。
// llm = new ChatOpenAI(
//     model="qwen-plus",
//     apiKey:process.env.aliQwen-api,
//     configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1"
// )

// 第 3 版（推荐）：用 python-dotenv 从 .env 加载，再通过 os.getenv 读取
// 项目根目录放 .env 文件，内容如：QWEN_API_KEY=sk-xxx（不要提交到 Git）。

// dotenv/config loaded  // encoding 指定 utf-8，避免 .env 中中文注释乱码

llm = new ChatOpenAI(
    model="deepseek-v3.2",  // 模型名需与阿里百炼「模型广场」中的调用名一致
    apiKey:process.env.QWEN_API_KEY,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",  // 阿里百炼 OpenAI 兼容接口地址
)

// ========== 2. 调用大模型并打印结果 ==========
// invoke：同步调用，传入用户问题字符串，返回 AIMessage 等消息对象
response = llm.invoke("你是谁")

// response 为 LangChain 消息对象，包含 content、additional_kwargs 等元数据
console.log(response)  // 打印完整对象（含 token 用量、finish_reason 等元数据，便于调试）
print()
console.log(response.content)  // 只取「正文」文本，即模型回复内容

print()

/* 
【输出示例】
content='你好！我是DeepSeek，由深度求索公司创造的AI助手！😊\n\n我是一个纯文本模型，虽然不支持多模态识别功能，但我可以帮你处理上传的各种文件，比如图像、txt、pdf、ppt、word、excel文件，并从中读取文字信息进行分析处理。\n\n我的特点包括：\n- 完全免费使用，没有收费计划\n- 拥有128K的上下文处理能力\n- 支持联网搜索功能（需要手动开启）\n- 可以通过官方应用商店下载App使用\n- 知识截止到2024年7月\n\n我会以热情、细腻的方式为你提供帮助，无论是回答问题、协助思考、创作内容还是处理文档，我都很乐意为你服务！你可以随时向我提出各种问题。\n\n有什么我可以帮助你的吗？✨' additional_kwargs={'refusal': null} response_metadata={'token_usage': {'completion_tokens': 160, 'prompt_tokens': 5, 'total_tokens': 165, 'completion_tokens_details': null, 'prompt_tokens_details': {'audio_tokens': null, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'deepseek-v3.2', 'system_fingerprint': null, 'id': 'chatcmpl-aecd007c-44e7-9240-8d71-c6f49b6a6c1`, `finish_reason': 'stop', 'logprobs': null} id='lc_run--019d2961-6144-7463-ab84-fe5828802d34-0' tool_calls=[] invalid_tool_calls=[] usage_metadata={'input_tokens': 5, 'output_tokens': 160, 'total_tokens': 165, 'input_token_details': {'cache_read': 0}, 'output_token_details': {}}

你好！我是DeepSeek，由深度求索公司创造的AI助手！😊

我是一个纯文本模型，虽然不支持多模态识别功能，但我可以帮你处理上传的各种文件，比如图像、txt、pdf、ppt、word、excel文件，并从中读取文字信息进行分析处理。

我的特点包括：
- 完全免费使用，没有收费计划
- 拥有128K的上下文处理能力
- 支持联网搜索功能（需要手动开启）
- 可以通过官方应用商店下载App使用
- 知识截止到2024年7月

我会以热情、细腻的方式为你提供帮助，无论是回答问题、协助思考、创作内容还是处理文档，我都很乐意为你服务！你可以随时向我提出各种问题。

有什么我可以帮助你的吗？✨
 */
