# TypeScript 全书迁移报告

- 处理 Markdown 章节：84
- 由 TypeScript 生成 TypeScript 案例：127
- 原 TypeScript 文件保留（便于对照）：127

## 迁移策略

1. **中文正文**：保留原教程讲解，仅替换 TypeScript 技术栈表述为 TypeScript / Node.js。
2. **代码块**：` ```typescript ` 自动迁移为 ` ```typescript `，并映射常见 LangChain/LangGraph API。
3. **案例源码**：每个 `.ts` 生成同名 `.ts`；精校可运行版本在仓库 `examples/`。
4. **低代码章节**（Coze/Dify）：平台操作与语言无关，正文保留，调用章改为 Node fetch/SDK。
5. **微调章**：训练侧仍以 TypeScript / Node.js 生态为主，文中标注；推理/接入侧用 TS。

## 建议阅读顺序

先读 `book/README.md` 与 `book/教程目录大纲.md`，再按 `_sidebar.md` 目录学。
代码以 `examples/01..14` 与 `apps/shop-query-agent` 为准做练习。

## 精校进度

详见 [POLISHED-CASES.md](POLISHED-CASES.md)。

已精校的核心案例可通过：

```bash
npm run case:hello
npm run case:tools
npm run case:agent
npm run case:graph
npm run case:supervisor
```
## 正文代码围栏

全书 Markdown 中的 ``TypeScript 代码围栏已统一改写为 ``typescript（约 610 处）。

说明：
- 这是**教学可读的 TypeScript 轨道写法**，不是逐文件保证可运行。
- 可运行精校清单见 [POLISHED-CASES.md](POLISHED-CASES.md) 与根目录 xamples/。
- 若看到语法未完全闭合的自动迁移痕迹，以精校案例为准。

## 重要更正（代码策略）

此前使用“Python 自动机翻成 TS”的方式**不正确**，会导致半 Python 半 TS 的不可读代码。

当前策略：

1. **中文讲解**：保留原教程
2. **代码块**：替换为仓库内**真实可运行 TypeScript**
   - `examples/**`
   - `book/cases-*/**` 精校案例
   - `apps/shop-query-agent/**`（电商问数 Demo）
3. 不再维护脆弱的整本机翻脚本结果

若某章节代码仍显示异常，请对照章节顶部的「TypeScript 可运行示例（推荐）」与 [POLISHED-CASES](POLISHED-CASES.md)。


## 内容切合 TS 生态

正文讲解已映射到 TypeScript / Node 生态：

| 原教程概念 | TS 轨道对应 |
|-----------|------------|
| Python | TypeScript / Node.js |
| pip / venv | npm / nvm |
| Pydantic | Zod |
| FastAPI | Next.js Route Handler / Hono / Fastify |
| SQLAlchemy | Prisma / Drizzle / TypeORM |
| init_chat_model / create_agent | ChatOpenAI / createReactAgent |
| HuggingFaceEndpointEmbeddings | OpenAIEmbeddings（OpenAI 兼容） |

代码块来自真实仓库文件，不使用机翻。
