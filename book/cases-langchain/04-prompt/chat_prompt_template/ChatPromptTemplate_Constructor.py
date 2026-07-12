"""
【案例】使用构造函数创建 ChatPromptTemplate

对应教程章节：第 13 章 - 提示词与消息模板 → 7、对话提示词模板（ChatPromptTemplate）

知识点速览：

- `ChatPromptTemplate` 用来组织“多角色、多条消息”的输入，天然比 `PromptTemplate` 更贴近聊天模型。
- 构造函数 `ChatPromptTemplate(messages)` 与 `from_messages(messages)` 本质等价；教程正文里更推荐后者，本文件演示前者。
- `messages` 里的每一项可以是元组、字典或 Message 类；理解这一点后，后面的参数写法就不容易混乱。
"""

from langchain_core.prompts import ChatPromptTemplate
import os
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv

load_dotenv()


# 用「元组列表」定义对话结构：system 设定角色，human 表示用户，ai 表示助手回复（可带占位符）
chatPromptTemplate = ChatPromptTemplate(
    [
        ("system", "你是一个AI开发工程师，你的名字是{name}。"),
        ("human", "你能帮我做什么?"),
        ("ai", "我能开发很多{thing}。"),
        ("human", "{user_input}"),
    ]
)

# format_messages：把模板里的占位符替换成实际值，得到「消息列表」，可直接交给 model.invoke(prompt)
prompt = chatPromptTemplate.format_messages(
    name="小谷AI", thing="AI", user_input="7 + 5等于多少"
)
print(prompt)

llm = init_chat_model(
    model="qwen-plus",
    model_provider="openai",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
print()
print("======================")

# invoke(prompt)：把组装好的消息列表发给模型，返回的 result 是 AIMessage，.content 即模型生成的文本
result = llm.invoke(prompt)
print(result)
print(result.content)

"""
【输出示例】
[SystemMessage(content='你是一个AI开发工程师，你的名字是小谷AI。', additional_kwargs={}, response_metadata={}), HumanMessage(content='你能帮我做什么?', additional_kwargs={}, response_metadata={}), AIMessage(content='我能开发很多AI。', additional_kwargs={}, response_metadata={}, tool_calls=[], invalid_tool_calls=[]), HumanMessage(content='7 + 5等于多少', additional_kwargs={}, response_metadata={})]

======================
content='7 + 5 等于 **12**。😊  \n需要我帮你用这个结果做点什么吗？比如写个小程序、出几道类似的小学数学题，或者用它来演示某个AI小应用？欢迎随时告诉我！' additional_kwargs={'refusal': None} response_metadata={'token_usage': {'completion_tokens': 54, 'prompt_tokens': 51, 'total_tokens': 105, 'completion_tokens_details': None, 'prompt_tokens_details': {'audio_tokens': None, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'qwen-plus', 'system_fingerprint': None, 'id': 'chatcmpl-2439ca79-e851-9a84-9c96-5864104354b6', 'finish_reason': 'stop', 'logprobs': None} id='lc_run--019d3e65-0c13-73f0-b5af-b357573e3617-0' tool_calls=[] invalid_tool_calls=[] usage_metadata={'input_tokens': 51, 'output_tokens': 54, 'total_tokens': 105, 'input_token_details': {'cache_read': 0}, 'output_token_details': {}}
7 + 5 等于 **12**。😊  
需要我帮你用这个结果做点什么吗？比如写个小程序、出几道类似的小学数学题，或者用它来演示某个AI小应用？欢迎随时告诉我！
"""
