"""
【案例】OpenAI 兼容接口调用阿里百炼 Embedding（Hello 级）

对应教程章节：第 18 章 - 向量数据库与 Embedding 实战 → 4.4 案例：OpenAI 兼容写法，理解“同一能力，不同接法”

知识点速览：
- 这个案例演示的是“同一类 Embedding 能力，可以通过 OpenAI 兼容协议来调用”，重点不在 SDK 名字，而在兼容接口思想。
- 对真实项目来说，这种写法很常见，因为保留同一套调用方式后，切换厂商时通常只需要调整 base_url、api_key、model。
- client.embeddings.create() 的 input 可以是单字符串或字符串列表；返回结果中的 data[i].embedding 就是向量。
- 若平台存在不同地域或不同网关，base_url 与对应 API Key 需要保持匹配。
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

input_text = "衣服的质量杠杠的"

# 使用 OpenAI 兼容接口连接阿里百炼：调用方式仍是 OpenAI SDK，只是连接地址改成百炼的兼容网关
client = OpenAI(
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 与 OpenAI Embedding 调用方式一致：model 为百炼模型名，input 为待向量化的文本
completion = client.embeddings.create(model="text-embedding-v4", input=input_text)

print(completion.model_dump_json())

"""
【输出示例】
注：embedding共1024维度，即len(completion.data[0].embedding) == 1024
{"data":[{"embedding":[0.02258586511015892,-0.08700370043516159,-0.013521800749003887,-0.05904024466872215,0.027100207284092903,-0.03104848973453045,0.01432843878865242,0.01706676371395588,'.....'],"index":0,"object":"embedding"}],"model":"text-embedding-v4","object":"list","usage":{"prompt_tokens":6,"total_tokens":6},"id":"37989997-27b1-9416-98af-091ae0b5c118"}
"""
