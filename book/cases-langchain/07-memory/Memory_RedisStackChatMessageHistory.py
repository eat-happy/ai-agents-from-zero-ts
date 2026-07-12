"""
【案例】使用 Redis Stack 持久化对话历史：RunnableWithMessageHistory + RedisChatMessageHistory

对应教程章节：第 16 章 - 记忆与对话历史 → 6、案例代码 → 6.2 持久化：Redis 存储 → Redis Stack 示例

本示例与 Memory_RedisChatMessageHistory.py 的链路完全相同，仅默认连接 Redis Stack 常见宿主机端口 26379。
Redis Stack 与原生 Redis 协议兼容，本章对话历史仍然只是把消息写进 Redis；它最大的教学价值是方便你借助 RedisInsight 观察会话数据。
项目依赖更推荐使用 langchain-redis；若本地环境仍只有 langchain-community，本示例会自动回退，便于旧环境继续运行。

知识点速览：
- 默认 REDIS_URL=redis://localhost:26379（Redis Stack 常见映射 -p 26379:6379）。
- 启动 Redis Stack（带 RedisInsight 用 redis/redis-stack）：docker run -d --name redis-stack -p 26379:6379 -p 8001:8001 redis/redis-stack
- 其余用法同 Memory_RedisChatMessageHistory.py；变化的是默认端口，不是记忆原理。
"""

from dotenv import load_dotenv

load_dotenv(encoding="utf-8")

from langchain.chat_models import init_chat_model
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
import os
import redis
from loguru import logger

try:
    from langchain_redis import RedisChatMessageHistory

    USE_LANGCHAIN_REDIS = True
except ModuleNotFoundError:
    from langchain_community.chat_message_histories import RedisChatMessageHistory

    USE_LANGCHAIN_REDIS = False

# 默认连接 Redis Stack（端口 26379）；可通过环境变量 REDIS_URL 覆盖
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:26379")
FORCE_SAVE = os.getenv("REDIS_FORCE_SAVE", "0") == "1"


def _check_redis():
    """启动时检查 Redis/Redis Stack 是否可达，不可达时给出明确提示后退出。"""
    try:
        r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        r.ping()
        r.close()
    except (redis.ConnectionError, redis.ResponseError) as e:
        logger.error(
            "Redis Stack / Redis 连接失败（{}）。请先启动 Redis Stack，例如：\n"
            "  docker run -d --name redis-stack -p 26379:6379 -p 8001:8001 redis/redis-stack\n"
            "若使用原生 Redis 或其他端口，可设置环境变量：REDIS_URL=redis://localhost:端口",
            REDIS_URL,
        )
        raise SystemExit(1) from e


_check_redis()

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
logger.info(
    "Redis 历史实现：{} | REDIS_URL={}",
    "langchain-redis" if USE_LANGCHAIN_REDIS else "langchain-community（兼容回退）",
    REDIS_URL,
)

llm = init_chat_model(
    model="qwen-plus",
    model_provider="openai",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
prompt = ChatPromptTemplate.from_messages(
    [MessagesPlaceholder("history"), ("human", "{question}")]
)


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """为每个 session_id 创建/返回对应的 Redis 历史实例，实现持久化存储。"""
    if USE_LANGCHAIN_REDIS:
        return RedisChatMessageHistory(
            session_id=session_id,
            redis_url=REDIS_URL,
        )
    return RedisChatMessageHistory(
        session_id=session_id,
        url=REDIS_URL,
    )


chain = RunnableWithMessageHistory(
    prompt | llm,
    get_session_history,
    input_messages_key="question",
    history_messages_key="history",
)
config = RunnableConfig(configurable={"session_id": "user-001"})

print("开始对话（Redis Stack 版，输入 'quit' 退出）")
while True:
    question = input("\n输入问题：")
    if question.lower() in ["quit", "exit", "q"]:
        break
    response = chain.invoke({"question": question}, config)
    logger.info(f"AI回答:{response.content}")
    # 和原生 Redis 版一样，手动 SAVE 只是可选演示动作，不是记忆原理的一部分。
    if FORCE_SAVE:
        redis_client.save()

"""
【输出示例】
开始对话（Redis Stack 版，输入 'quit' 退出）
"""
