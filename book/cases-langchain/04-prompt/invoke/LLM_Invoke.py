"""
【案例】模型调用：同步 invoke（单次调用，一次性返回）

对应教程章节：第 13 章 - 提示词与消息模板 → 4、调用大模型的调用方式

知识点速览：
- `invoke` 是聊天模型最常用的同步调用方式：发一条输入，等待模型完整生成后一次性返回结果。
- 当输入由 `SystemMessage + HumanMessage` 组成时，模型能更清楚地区分“系统规则”和“当前问题”。
- 返回值通常是 `AIMessage`，正文一般通过 `.content` 读取；这和第 11 章 Model I/O 的返回值主线一致。
"""

import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

# 从 .env 文件加载环境变量（如 aliQwen-api），避免把 API Key 写死在代码里
load_dotenv()

# ---------- 1. 实例化聊天模型 ----------
# init_chat_model 会根据 model_provider 等参数创建「聊天模型」对象，后续用 invoke/stream/batch 调用
model = init_chat_model(
    model="qwen-plus",
    model_provider="openai",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# ---------- 2. 构建多角色消息列表（即本次请求的 Prompt）----------
# 关系：Prompt ≥ Message ≥ 字符串。这里用两条「带角色的消息」组成一次 Prompt。
# - SystemMessage：设定模型角色与行为边界（谁、怎么答），是高质量输出的第一步。
# - HumanMessage：用户输入，即你向模型提出的问题。
messages = [
    SystemMessage(
        content="你是一个法律助手，只回答法律问题，超出范围的统一回答，非法律问题无可奉告"
    ),
    HumanMessage(content="简单介绍下广告法，一句话告知50字以内"),
]

# ---------- 3. 同步调用模型（invoke）----------
# invoke(messages)：把上面这条 Prompt 发给模型，阻塞等待直到模型推理完成，返回一条 AIMessage。
# 取 response.content 即可得到模型回复的纯文本。
response = model.invoke(messages)
# 响应类型：<class 'langchain_core.messages.ai.AIMessage'>
# - 含义：LangChain 规定「聊天模型」的 invoke 返回的是「AI 这条消息」对象，即 AIMessage。
#   对应多角色里的「助手角色」：你发 System+Human，模型回一条 AI 的回复，用 AIMessage 表示。
# - 是否固定：在 LangChain 的约定下是固定的。只要是同一套 ChatModel 接口（invoke），返回的就是
#   AIMessage（或子类）；stream 时每块是 AIMessageChunk。不同厂商（通义、OpenAI 等）都封装成 AIMessage，
#   所以用 response.content 取文本即可，无需关心底层 API 差异。
print(f"响应类型：{type(response)}")
print(response.content)
print(response.content_blocks)

"""
【输出示例】
响应类型：<class 'langchain_core.messages.ai.AIMessage'>
《广告法》是规范广告活动、保护消费者权益、维护市场秩序的法律，禁止虚假宣传、误导欺诈等行为。
[{'type': 'text', 'text': '《广告法》是规范广告活动、保护消费者权益、维护市场秩序的法律，禁止虚假宣传、误导欺诈等行为。'}]
"""
