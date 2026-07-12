"""
【案例】使用 langchain-deepseek 原生集成调用 DeepSeek

对应教程章节：第 11 章 - Model I/O 与模型接入 → 3、接入大模型

知识点速览：
- 本案例对应第 11 章中“DeepSeek 原生 provider 集成”这条接法，和 OpenAI 兼容接口路线是并列关系。
- 使用 `ChatDeepSeek` 时通常无需手动写 `base_url`，因为 provider 类内部已经封装了官方地址与接法。
- 原生 provider 的优点是更贴近厂商自身表达；兼容接口的优点是更统一，适合多模型共用一套风格。
- 依赖 `langchain-deepseek`，运行前在 `.env` 中配置 `deepseek-api`。
"""

# ========== 1. 导入与环境 ==========
import os
from langchain_deepseek import ChatDeepSeek

from dotenv import load_dotenv

load_dotenv(encoding="utf-8")

# ========== 2. 初始化 DeepSeek 聊天模型 ==========
# 这里显式写出 temperature、timeout、max_retries，是为了让你看到原生 provider 也支持常见模型参数。
model = ChatDeepSeek(
    model="deepseek-v4-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=os.getenv("deepseek-api"),
)

# ========== 3. 调用并打印回复 ==========
# 返回结果仍然是 LangChain 风格的 AIMessage，因此先读 .content 即可。
print(model.invoke("什么是 LangChain？100 字以内回答，简洁。").content)
