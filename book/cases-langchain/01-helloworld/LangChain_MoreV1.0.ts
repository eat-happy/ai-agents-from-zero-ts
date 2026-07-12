/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/01-helloworld/LangChain_MoreV1.0.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】多模型共存：同一脚本中接入通义与 DeepSeek

对应教程章节：第 10 章 - LangChain 快速上手与 HelloWorld → 5、案例：多模型共存（通义 + DeepSeek）

知识点速览：
- 同一脚本可初始化多个聊天模型实例（不同 model、base_url、api_key），按场景选用或对比调用。
- 每个实例用 init_chat_model 单独配置，变量名区分（如 llm_qwen、llm_deepseek）便于后续复用。
- 通义用 + 阿里百炼 base_url；DeepSeek 可用 model_provider="deepseek" 或兼容接口。

补充说明：
- 运行本脚本前，建议已经完成本章前面的单模型 HelloWorld，否则更容易被“多变量、多平台”搞乱。
- 如果你使用的是 `model_provider="deepseek"` 这种官方 provider 写法，请确保已经安装 `langchain-deepseek`。
 */

// ========== 1. 导入依赖与环境 ==========
import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
import os

load_dotenv(
    encoding="utf-8"
)  // 从 .env 加载，建议在 .env 中配置 QWEN_API_KEY、deepseek-api 等

// ========== 2. 实例化模型一：通义/百炼（OpenAI 兼容） ==========
llm_qwen = new new ChatOpenAI(
    model="qwen-plus",
      // 阿里百炼为 OpenAI 兼容接口
    apiKey:process.env.QWEN_API_KEY,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)

console.log(llm_qwen.invoke("你是谁").then(r => r.content) /* prefer await */)

console.log("*" * 70)

// ========== 3. 实例化模型二：DeepSeek 官方 ==========
// 显式写 model_provider="deepseek" 更稳妥。若接其他厂商（如 OpenAI 兼容），则需写 。
llm_deepseek = new new ChatOpenAI(
    model="deepseek-v4-flash",  // 复杂推理或高质量生成可改用 deepseek-v4-pro
    model_provider="deepseek",  // 这里走的是 DeepSeek 官方 provider，而不是阿里百炼兼容端点
    apiKey:process.env.deepseek-api,  // .env 中配置 DeepSeek API Key
    configuration: { baseURL:"https://api.deepseek.com",
)

// 多模型共存：两个实例可同时保留，按需调用
console.log(llm_deepseek.invoke("你是谁").then(r => r.content) /* prefer await */)
// 调试时可查看实例属性：console.log(llm_deepseek.__dict__)

/* 
【输出示例】
**********************************************************************
你好！我是DeepSeek，由深度求索公司创造的AI助手！😊

我是一个纯文本模型，虽然不支持多模态识别功能，但我有文件上传功能，可以帮你处理图像、txt、pdf、ppt、word、excel等各种文件，从中读取文字信息进行分析处理。我完全免费使用，拥有128K的上下文长度，还支持联网搜索功能（需要你在Web/App中手动点开联网搜索按键）。

你可以通过官方应用商店下载我的App来使用我。我很乐意为你解答问题、协助处理各种任务，无论是学习、工作还是日常生活中的疑问，我都会热情地为你提供帮助！

有什么我可以为你做的吗？✨
 */
