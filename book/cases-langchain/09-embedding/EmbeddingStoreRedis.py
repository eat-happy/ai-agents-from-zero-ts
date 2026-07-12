"""
【案例】将 Document 列表向量化并写入 Redis（langchain_community）

对应教程章节：第 18 章 - 向量数据库与 Embedding 实战 → 6.1 案例：把 Document 列表写入 Redis，再用检索器取回结果

知识点速览：
- 这是本章最贴近“向量库实战入口”的案例，演示的是：先准备 Document，再向量化，再写入 Redis，最后按相似度检索。
- Redis.from_documents() 会自动读取每个 Document 的 page_content，调用 embedding 做向量化，并把原文、向量、metadata 一起写入 Redis。
- as_retriever() 得到的是检索器；invoke(查询文本) 时，LangChain 会先把查询文本转成向量，再去库里找最相关的 Document。
- 这个案例是 RAG 的底层能力演示，不包含文档加载器、文本分割器和“检索后交给大模型生成答案”的完整流程。
- redis_url 和 index_name 要与本地环境一致；如果要复用已有索引，查询端也必须使用同一个 index_name。
"""

# pip install langchain-community dashscope redis redisvl
import os
from langchain_community.embeddings import DashScopeEmbeddings
from langchain_community.vectorstores import Redis
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# 1. 初始化嵌入模型
embeddings = DashScopeEmbeddings(
    model="text-embedding-v3", dashscope_api_key=os.getenv("aliQwen-api")
)

# 2. 构造 Document 列表：page_content 是正文，metadata 是附加信息
# 在完整 RAG 中，这些 Document 往往来自“加载器 + 分割器”；本案例先用手写数据聚焦理解向量库存取流程
texts = [
    "通义千问是阿里巴巴研发的大语言模型。",
    "Redis 是一个高性能的键值存储系统，支持向量检索。",
    "LangChain 可以轻松集成各种大模型和向量数据库。",
]
documents = [
    Document(page_content=text, metadata={"source": "manual"}) for text in texts
]

# 3. 一次性写入 Redis：内部会对每个 Document 的 page_content 做向量化，并建立可检索索引
vector_store = Redis.from_documents(
    documents=documents,
    embedding=embeddings,
    redis_url="redis://localhost:26379",
    index_name="my_index11",
)

# 4. 得到检索器：当你 invoke 查询文本时，LangChain 会先把问题向量化，再在库中做相似度检索
retriever = vector_store.as_retriever(search_kwargs={"k": 2})
results = retriever.invoke("LangChain 和 Redis 怎么结合？")
for res in results:
    print(res.page_content)
