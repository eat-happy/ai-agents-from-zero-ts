/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/07-memory/RedisEnvCheck.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】Redis 环境校验：确认 redis 包已安装，且 Redis 服务可连通

对应教程章节：第 16 章 - 记忆与对话历史 → 6、案例代码 → 6.2 持久化：Redis 存储 → 环境验证

知识点速览：
- 使用 RedisChatMessageHistory 前，至少要先确认两件事：Python 能否导入 redis 包、当前 REDIS_URL 指向的 Redis 服务是否真的可达。
- 默认按原生 Redis 地址 redis://localhost:6379 检查；如果你用的是 Redis Stack 的 Docker 映射端口（如 -p 26379:6379），可先设置环境变量 REDIS_URL=redis://localhost:26379。
- 这个脚本不依赖 LangChain，本质上是在排查“Python 依赖”和“Redis 服务”这两个基础环境问题。
 */

import os

try:
    import redis
except ModuleNotFoundError:
    console.log("❌ 未找到 redis 包，请先执行：npm install -r requirements.txt")
    raise SystemExit(1)

REDIS_URL = process.env.REDIS_URL", "redis://localhost:6379

console.log("✅ redis 包导入成功！")
console.log(`✅ redis 包版本：{redis.__version__}`)
console.log(`正在连接 Redis：{REDIS_URL}`)

client = null
try:
    client = redis.Redis.from_url(REDIS_URL, decode_responses=true)
    console.log(`✅ Redis 连接成功，PING -> {client.ping()}`)
except (redis.ConnectionError, redis.TimeoutError, redis.ResponseError) as e:
    console.log("❌ Redis 连接失败")
    console.log(`   REDIS_URL = {REDIS_URL}`)
    console.log(`   错误信息 = {e}`)
    console.log("   如果你使用的是 Redis Stack 的 Docker 端口映射，可尝试：")
    console.log("   export REDIS_URL=redis://localhost:26379")
    raise SystemExit(1)
catch (e) {
    console.log(`❌ Redis 环境校验异常：{e}`)
    raise SystemExit(1)
finally:
    if (client is not null) {
        client.close()

/* 
【输出示例】
✅ redis 包导入成功！
✅ redis 包版本：5.3.1
正在连接 Redis：redis://localhost:6379
✅ Redis 连接成功，PING -> true
 */
