"""
【案例】在 Redis 向量库中做相似性检索（similarity_search_with_score）

对应教程章节：第 19 章 - RAG 检索增强生成 → 2.1.3 再往后一步：检索案例和它们是什么关系；也可与第 18 章相似检索案例对照阅读

知识点速览：
- 这个案例对应的是 RAG 的检索阶段：前提是索引已经建好，现在要做的是“把相关内容查出来”。
- 相似性检索的核心流程是：查询文本先向量化，再到向量库中找到与查询向量最接近的若干条记录。
- `similarity_search_with_score(query, k)` 返回 `(Document, score)` 列表；很多实现里 score 更接近“距离”，通常越小越相似。
- 代码里把 score 换算成 1 - score，主要是为了更符合初学者直觉；真实项目里应以具体向量库和距离度量定义为准。
- 运行前需确保 Redis 中已有数据，例如先执行同目录下的 RedisVectorStore.py；`index_name`、`redis_url` 也必须保持一致。
- 在完整 RAG 里，这一步通常不会直接把结果打印完就结束，而是会把查到的 `Document` 进一步组织进 Prompt，再交给 LLM 生成答案。
"""

from langchain_redis import RedisConfig, RedisVectorStore
from langchain_community.embeddings import DashScopeEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# 1. 嵌入模型（与写入时一致，保证向量空间一致）；需在 .env 中配置 aliQwen-api
embeddingsModel = DashScopeEmbeddings(
    model="text-embedding-v3", dashscope_api_key=os.getenv("aliQwen-api")
)

# 2. 连接已有索引（与 RedisVectorStore.py 中 index_name、redis_url 一致）
vector_store = RedisVectorStore(
    embeddingsModel,
    config=RedisConfig(index_name="newsgroups", redis_url="redis://localhost:26379"),
)

# 3. 查询文本 → 向量化 → 在库中做相似度检索；这里取前 3 条结果
query = "我喜欢用什么手机"
results = vector_store.similarity_search_with_score(query, k=3)

print("=== 查询结果 ===")
for i, (doc, score) in enumerate(results, 1):
    # 这里把“距离”近似换算成“相似度”只是为了展示更直观；工程里请以具体返回定义为准
    similarity = 1 - score
    print(f"结果 {i}:")
    print(f"内容: {doc.page_content}")
    print(f"元数据: {doc.metadata}")
    print(f"相似度: {similarity:.4f}")

"""
【输出示例】
=== 查询结果 ===
结果 1:
内容: 我喜欢用苹果手机
元数据: {'segment_id': '3'}
相似度: 0.8594
结果 2:
内容: 我喜欢用苹果手机
元数据: {'segment_id': '3'}
相似度: 0.8594
结果 3:
内容: 我喜欢吃苹果
元数据: {'segment_id': '1'}
相似度: 0.6610
"""
