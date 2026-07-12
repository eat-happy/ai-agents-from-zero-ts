# 电商问数 Agent Demo（TypeScript / Next.js）

精简可演示版，对齐原课「实战项目-电商问数」主链路：

1. 元数据召回（字段 / 指标 / 取值）
2. SQL 生成（LLM 结构化输出，失败则规则兜底）
3. SQL 校验
4. 内存数仓执行
5. 结论与结果表

## 与原项目差异

| 原项目 | 本 Demo |
|--------|---------|
| MySQL 数仓 + meta 库 | 内存表 `lib/warehouse.ts` |
| Qdrant + ES 多路召回 | 关键词/取值规则召回 `lib/metadata.ts` |
| LangGraph 多节点生产流 | 同序步骤函数（易改成 LangGraph） |
| FastAPI + SSE | Next.js Route Handler |
| 完整前端联调工程 | 单页演示 UI |

## 启动

```bash
cd apps/shop-query-agent
npm install
copy .env.example .env.local
# 填入 OPENAI_API_KEY / BASE_URL / MODEL
npm run dev
```

打开 http://localhost:3007

> 没有 Key 也能跑：SQL 生成会走规则兜底，仍可演示完整链路。

## 推荐体验问题

- 统计华北地区的销售总额
- 各品牌销售额是多少
- 黄金会员贡献了多少订单和销售额
- 华东地区苹果品牌的成交额

## 简历可写点

- NL2SQL Agent：元数据召回 → SQL 生成/校验/执行
- TypeScript 全栈交付（Next.js）
- 危险 SQL 拦截与失败兜底