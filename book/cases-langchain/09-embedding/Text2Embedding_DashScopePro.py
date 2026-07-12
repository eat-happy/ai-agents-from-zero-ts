"""
【案例】DashScope 多模态 Embedding：文本/图像向量化（进阶）

对应教程章节：第 18 章 - 向量数据库与 Embedding 实战 → 4.6 案例：进阶扩展，多模态 Embedding

知识点速览：
- 这个案例属于本章的“扩展视野”部分，用来说明 Embedding 的思想不只适用于文本，也可以扩展到图文等多模态内容。
- 多模态嵌入模型可同时处理文本和图像，input 为列表，每项可为 {"text": "..."} 或 {"image": "url"}。
- 返回结构与单模态类似，output.embeddings 为列表，每项都包含 embedding 向量。
- 本示例只演示文本输入，目的是先看懂多模态接口的返回结构；图像输入通常需要 URL 或 base64。

模型文档链接：https://bailian.console.aliyun.com/?productCode=p_efm&tab=model#/model-market/all?capabilities=ME
"""

import dashscope
import json
import os
from http import HTTPStatus
from dotenv import load_dotenv

load_dotenv()
# 多模态 call 内部用 get_default_api_key()，必须提前设置 dashscope.api_key，否则报 No api key provided
dashscope.api_key = os.getenv("aliQwen-api")

# 调用多模态 embedding 接口：支持文本或图像输入，本例只保留最小的文本演示
resp = dashscope.MultiModalEmbedding.call(
    model="tongyi-embedding-vision-plus",
    input=[{"text": "尚硅谷AI"}],
)

result = ""

if resp.status_code == HTTPStatus.OK:
    result = {
        "status_code": resp.status_code,
        "request_id": getattr(resp, "request_id", ""),
        "code": getattr(resp, "code", ""),
        "message": getattr(resp, "message", ""),
        "output": resp.output,
        "usage": resp.usage,
    }
    # ensure_ascii=False：中文等非 ASCII 按原样输出，不转成 \uxxxx；indent=4：每层缩进 4 格，便于阅读
    print(json.dumps(result, ensure_ascii=False, indent=4))

print("=================================")
print()

# 从完整结果中取出第一条 embedding 向量；后续若要做相似度比较，可直接使用这组数值
embedding_values = result["output"]["embeddings"][0]["embedding"]
print(json.dumps(embedding_values, ensure_ascii=False))
