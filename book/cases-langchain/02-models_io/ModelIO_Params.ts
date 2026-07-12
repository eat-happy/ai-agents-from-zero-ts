/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/02-models_io/ModelIO_Params.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】模型标准化参数：temperature、max_tokens 等

对应教程章节：第 11 章 - Model I/O 与模型接入 → 2.5 常用模型参数、2.6 Token、max_tokens 与计费的关系、2.9 调用后的返回信息

知识点速览：
- 这是一个“观察型案例”，重点不是业务功能，而是帮助你理解模型参数与返回对象结构。
- 演示 `temperature` 如何影响输出随机性，以及 `max_tokens` 与回复长度 / 成本控制的关系。
- 也适合配合第 11 章里关于 `AIMessage`、`response.content`、`response_metadata`、`usage_metadata` 的讲解一起看。
- 依赖 `langchain`、`langchain-openai`，运行前在 `.env` 中配置 `deepseek-api`。
 */

// ========== 1. 导入与环境 ==========
import os
import { ChatOpenAI } from "@langchain/openai"

import "dotenv/config"

// dotenv/config loaded

// ========== 2. 实例化时设置常用参数 ==========
// temperature：控制输出随机性，0 更确定、高重复，越大越随机、越有创意。
// 通常取 0~2，源于 OpenAI API 约定；具体上下界以所用 API 文档为准。
// 超过 2（如 2.1）可能被部分接口拒绝或截断，且与 2.0 效果差异不大，建议不超过 2。
model = new new ChatOpenAI(
    model="deepseek-v4-flash",
    
    apiKey:process.env.deepseek-api,
    configuration: { baseURL:"https://api.deepseek.com",
    temperature:0.7,  // 0～1，越高越随机；此处略高便于看到多次输出差异
    // maxTokens:256,  # 可选：限制单次回复长度
)

// 直接打印完整 response，便于观察 AIMessage 结构：
// - content：正文
// - response_metadata：厂商原始元数据
// - usage_metadata：统一整理后的 token 用量
console.log(model.invoke("写一句关于春天的词，14 字以内"))
// <class 'langchain_openai.chat_models.base.ChatOpenAI'>
console.log(type(model))
// <class 'str'>
console.log(type(model.invoke("写一句关于春天的词，14 字以内").then(r => r.content) /* prefer await */))
// <class 'langchain_core.messages.ai.AIMessage'>
console.log(type(model.invoke("写一句关于春天的词，14 字以内")))

// ========== 3. 多次调用观察参数效果（如 temperature 对多样性的影响） ==========
// 你可以把 temperature 改成 0、0.7、1.2 等再运行，对比回答是否更稳定、更多样。
for (const i of range(3)) {
    console.log(`--- 第 {i + 1} 次 ---`)
    console.log(model.invoke("写一句关于春天的词，14 字以内").then(r => r.content) /* prefer await */)


/* 
【输出示例】温度为 2.0 时，输出如下结果
莺惊柳浪春犁响，一鞭云水碧
**诗家酥雨润，闲趁卖花声。**
寒威已退先春雨，万枝吐翠流云间。
 */

/* 
【输出示例】温度为 0 时，输出如下结果
风软一溪云，花明两岸春。
风软一溪云，花明两岸春。
风软一溪云，花明两岸春。
 */
