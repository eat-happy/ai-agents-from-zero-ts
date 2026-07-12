# ai-agents-from-zero-ts

[didilili/ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 的 **TypeScript 完整译本 / JS 学习轨道**。

> 目标：把原仓库「整本中文教程」迁移为 **TypeScript 可学、可跑** 的版本——  
> **中文概念保留，Python 代码与调用改为 TS**。

## 仓库结构

```text
ai-agents-from-zero-ts/
├── book/                         # 全书中文 Markdown（TS 轨道）
│   ├── README.md                 # 教程首页
│   ├── 教程目录大纲.md
│   ├── 1-1 ... 28 章正文
│   ├── cases-langchain/          # LangChain 案例（.ts + 原 .py 对照）
│   ├── cases-langgraph/          # LangGraph 案例
│   ├── cases-coze-dify/          # 低代码案例文档
│   ├── projects/shop-query/      # 电商问数项目文档
│   ├── projects/deep-research/   # 深度研搜项目文档
│   └── TS迁移说明.md
├── examples/                     # 精校可运行示例（推荐动手）
│   ├── 01-helloworld ... 14-mcp
├── apps/shop-query-agent/        # 电商问数 Next.js 可演示精简版
├── src/shared/                   # 公共模型/工具
└── scripts/convert-book-to-ts.mjs
```


## 在线阅读（GitHub Pages）

文档站（Docsify）：

- 发布后访问：https://eat-happy.github.io/ai-agents-from-zero-ts/
- 本地预览：在仓库根目录执行 `npx serve .` 后打开首页

> 章节插图默认从原仓库 CDN 加载（避免镜像 500MB+ 图片）。
> 项目内图片（`book/projects/**`、`book/cases-coze-dify/**`）使用本仓库资源。

## 快速开始

### 1) 读全书（中文）

从这里开始：

- [book/README.md](book/README.md)
- [book/教程目录大纲.md](book/教程目录大纲.md)
- [book/TS迁移说明.md](book/TS迁移说明.md)

### 2) 跑精校示例（TypeScript）

```bash
npm install
cp .env.example .env
# 填写 OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL

npm run ex:01
npm run ex:09
npm run ex:14

# 精校后的 book 案例
npm run case:hello
npm run case:agent
npm run case:supervisor
```

### 3) 跑电商问数 Demo

```bash
npm run shop:install
npm run shop:dev
# http://localhost:3007
```

## 代码策略（重要）

**不再使用 Python 机翻。** 章节正文中的代码块来自：

- `examples/**` 精校示例
- `book/cases-*/**` 精校案例
- `apps/shop-query-agent/**` 电商问数 Demo

中文讲解保留原教程；要跑通请优先看章节顶部的「TypeScript 可运行示例」和 [book/POLISHED-CASES.md](book/POLISHED-CASES.md)。

## 迁移覆盖范围

| 原仓库内容 | TS 译本状态 |
|------------|-------------|
| 全部中文章节 Markdown | ✅ 收入 `book/` 并加 TS 轨道说明 |
| 文中 Python 代码块 | ✅ 批量改为 TypeScript（自动迁移） |
| LangChain/LangGraph 案例 `.py` | ✅ 生成同名 `.ts`，原 `.py` 保留对照 |
| Coze/Dify 平台操作 | ✅ 文档保留（与语言无关） |
| Python 调 Coze/Dify | ✅ 改为 Node `fetch` 示例 |
| 电商问数 / 深度研搜文档 | ✅ 收入 `book/projects/` |
| 电商问数可运行演示 | ✅ `apps/shop-query-agent`（精简版） |
| 精校可运行代码 | ✅ `examples/01..14` |

> 说明：自动迁移无法保证 100% 与最新 SDK 逐行可运行；学习时 **概念看 book/**，**动手跟 examples/**。

## 与原仓库关系

- 原作者与中文教程版权归 [didilili/ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero)
- 本仓库为学习用途的 **TypeScript 轨道迁移版**
- 若你主要用 Python，请直接学习原仓库

## License

请遵循原仓库 License。TypeScript 迁移与精校示例以本仓库提交为准。