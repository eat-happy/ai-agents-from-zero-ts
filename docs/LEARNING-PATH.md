# JS/TS 两周求职路径（配合本仓库）

## 第 1 周：单 Agent 能力

| 天 | 任务 | 案例 |
|----|------|------|
| D1 | 模型接入、invoke/stream | 01, 02 |
| D2 | Prompt + 结构化输出 | 03, 04 |
| D3 | LCEL + Memory | 05, 06 |
| D4 | Tools 与 tool calling | 07 |
| D5 | RAG 知识库问答 | 08 |
| D6 | Agent 工具循环 | 09 |
| D7 | 复盘：做一个“公司 FAQ Agent”小项目 | 08+09 |

## 第 2 周：工作流与多智能体

| 天 | 任务 | 案例 |
|----|------|------|
| D8 | LangGraph 状态与并行 | 10 |
| D9 | 手写 tool agent 图 | 11 |
| D10 | Supervisor 多智能体 | 12 |
| D11 | OpenAI Agents SDK 对照 | 13 |
| D12 | 包 API（Fastify/Express）+ 简单前端 | 自选 |
| D13 | 写 README / 架构图 / 评测 10 条 | - |
| D14 | 模拟面试（工具循环、RAG、多 Agent） | - |

## 作品集最小集合

1. **知识库 Agent**（RAG + tools）
2. **Supervisor 多 Agent**（路由 + 专家）
3. （可选）Next.js 聊天页 + 流式输出

## 面试可讲点

- Agent Loop 与普通 RAG 链区别
- 为什么 tool schema 用 Zod
- LangGraph 状态如何更新、如何防死循环
- Supervisor 何时比单 Agent 更合适
- 如何评测（成功率、拒答、时延、成本）