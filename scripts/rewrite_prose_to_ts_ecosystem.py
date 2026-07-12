#!/usr/bin/env python3
"""Rewrite book prose to TypeScript/Node ecosystem, preserving code fences."""
from __future__ import annotations

import re
from pathlib import Path

BOOK = Path("book")

# Order matters: longer / more specific first
REPLACEMENTS: list[tuple[str, str]] = [
    # commands / tooling
    ("uv run python -m ", "npx tsx "),
    ("uv run python3 -m ", "npx tsx "),
    ("uv run python ", "npx tsx "),
    ("uv run ", "npm run / npx "),
    ("python3 -m ", "npx tsx "),
    ("python -m ", "npx tsx "),
    ("pip install ", "npm install "),
    ("pip 安装", "npm 安装"),
    ("requirements.txt", "package.json"),
    ("pyproject.toml", "package.json"),
    ("venv/conda", "nvm / node_modules"),
    ("虚拟环境（venv", "Node 环境（nvm"),
    ("创建虚拟环境", "准备 Node.js 环境"),
    ("激活虚拟环境", "切换到项目 Node 版本并安装依赖"),
    ("PyCharm", "VS Code / WebStorm"),
    ("PYTHONPATH", "Node module resolution / tsx paths"),
    # frameworks
    ("FastAPI + SSE", "Next.js Route Handler + 流式响应"),
    ("FastAPI", "Next.js / Hono / Fastify"),
    ("fastapi", "Next.js route handler"),
    ("uvicorn", "node server"),
    ("SQLAlchemy", "Prisma / Drizzle / TypeORM（或轻量 query layer）"),
    ("Pydantic BaseModel", "Zod schema"),
    ("Pydantic", "Zod"),
    ("pydantic", "zod"),
    ("TypedDict", "TypeScript type / interface"),
    ("dataclass", "TypeScript interface / class"),
    ("init_chat_model", "ChatOpenAI（OpenAI 兼容入口）"),
    ("create_agent", "createReactAgent"),
    ("AgentExecutor", "createReactAgent 运行时图"),
    ("create_tool_calling_agent", "createReactAgent"),
    ("RunnableWithMessageHistory", "消息历史封装（自管 history / checkpointer）"),
    ("huggingface_hub", "OpenAI 兼容 Embedding SDK / HTTP"),
    ("HuggingFaceEndpointEmbeddings", "OpenAIEmbeddings（对接 TEI/OpenAI 兼容接口）"),
    ("jieba", "中文分词库（TS 可用 segmentit / nodejieba 等）"),
    ("asyncio.run", "await / top-level await"),
    ("asyncio", "Promise / async-await"),
    # API style
    ("model_provider=\"openai\"", "OpenAI 兼容协议（ChatOpenAI + baseURL）"),
    ("model_provider='openai'", "OpenAI 兼容协议（ChatOpenAI + baseURL）"),
    ("model_provider", "OpenAI 兼容协议"),
    ("base_url=", "baseURL:"),
    ("api_key=", "apiKey:"),
    ("`base_url`", "`baseURL`"),
    ("`api_key`", "`apiKey`"),
    # file extensions in prose paths (careful patterns)
    ("app.scripts.", "app/scripts/"),
    ("app.agent.", "app/agent/"),
    ("app.clients.", "app/clients/"),
    (".py`", ".ts`"),
    ("`.py`", "`.ts`"),
    (" graph.py", " graph.ts"),
    (" main.py", " main.ts"),
    (" app.py", " app.ts"),
    # language stack
    ("Python 生态", "TypeScript / Node.js 生态"),
    ("Python 技术栈", "TypeScript 技术栈"),
    ("Python 工程", "TypeScript / Node 工程"),
    ("Python 项目", "TypeScript 项目"),
    ("Python 包", "npm 包"),
    ("Python 模块", "TypeScript 模块"),
    ("Python 文件", "TypeScript 文件"),
    ("Python 脚本", "TypeScript 脚本"),
    ("Python 代码", "TypeScript 代码"),
    ("Python 函数", "TypeScript 函数"),
    ("Python 类", "TypeScript 类"),
    ("Python 节点", "Agent 节点"),
    ("Python 列表", "TypeScript 数组"),
    ("Python 字典", "TypeScript 对象"),
    ("Python 实现", "TypeScript 实现"),
    ("Python 版本", "TypeScript 版本"),
    ("Python 示例", "TypeScript 示例"),
    ("Python 客户端", "TypeScript / HTTP 客户端"),
    ("Python 调用", "TypeScript / Node.js 调用"),
    ("用 Python", "用 TypeScript"),
    ("基于 Python", "基于 TypeScript"),
    ("学习 Python", "学习 TypeScript"),
    ("熟悉 Python", "熟悉 TypeScript / Node.js"),
    ("Python 基础", "TypeScript / JavaScript 基础"),
    ("主线聚焦 **Python + LangChain + LangGraph**", "主线聚焦 **TypeScript + LangChain.js + LangGraph.js**"),
    ("Python + LangChain + LangGraph", "TypeScript + LangChain.js + LangGraph.js"),
    ("LangChain 的 Python", "LangChain.js"),
    ("LangGraph 的 Python", "LangGraph.js"),
    ("docs.langchain.com/oss/python/", "docs.langchain.com/oss/javascript/"),
    # shopkeeper original project naming bridge
    ("shopkeeper-agent/", "apps/shop-query-agent/（TS Demo）或原项目概念对应路径 "),
]

# Keep these intact if they explain strategy
KEEP_IF_CONTAINS = [
    "不再使用机翻 Python",
    "机翻 Python",
    "不再使用机翻",
]


def protect_fences(md: str):
    fences = []
    def repl(m):
        fences.append(m.group(0))
        return f"@@FENCE{len(fences)-1}@@"
    out = re.sub(r"```[\s\S]*?```", repl, md)
    return out, fences


def restore_fences(md: str, fences: list[str]) -> str:
    def repl(m):
        return fences[int(m.group(1))]
    return re.sub(r"@@FENCE(\d+)@@", repl, md)


def rewrite_prose(md: str) -> str:
    body, fences = protect_fences(md)
    # Don't rewrite banner strategy sentences badly
    # Apply replacements line-wise for safety on KEEP
    lines = body.splitlines(True)
    out_lines = []
    for line in lines:
        if any(k in line for k in KEEP_IF_CONTAINS):
            # still replace stack words except the phrase itself
            l = line
            for a, b in REPLACEMENTS:
                if a in ("Python 示例",) or a.startswith("Python"):
                    continue
                l = l.replace(a, b)
            out_lines.append(l)
            continue
        l = line
        for a, b in REPLACEMENTS:
            l = l.replace(a, b)
        # remaining bare Python as language name in prose
        # avoid replacing inside already converted strategy text
        if "机翻" not in l and "TypeScript 轨道" not in l:
            l = re.sub(r"(?<![A-Za-z])Python(?![A-Za-z])", "TypeScript", l)
        out_lines.append(l)
    body2 = "".join(out_lines)
    # extra ecosystem sentence inject for shop-query project chapters
    return restore_fences(body2, fences)


SHOP_STACK_NOTE = (
    "\n> **TS 生态对照（本仓库）**：可运行 Demo 在 `apps/shop-query-agent`，技术栈为 "
    "**Next.js + LangChain.js + 内存数仓/元数据召回 + Route Handler**；"
    "原教程中的 MySQL / Qdrant / ES / FastAPI 在 Demo 中做了教学简化，概念仍按章节理解。\n"
)


def main():
    touched = 0
    for f in BOOK.rglob("*.md"):
        if f.name in {"POLISHED-CASES.md"}:
            # still rewrite lightly
            pass
        md = f.read_text(encoding="utf-8")
        out = rewrite_prose(md)
        rel = f.as_posix()
        if "projects/shop-query/" in rel and "TS 生态对照（本仓库）" not in out:
            # insert after first banner or H1
            if "<!-- TS-TRACK-BANNER -->" in out:
                out = out.replace("<!-- TS-TRACK-BANNER -->", "<!-- TS-TRACK-BANNER -->" + SHOP_STACK_NOTE, 1)
            elif re.search(r"^# .+$", out, flags=re.M):
                out = re.sub(r"^(# .+)$", r"\1\n" + SHOP_STACK_NOTE, out, count=1, flags=re.M)
        if "projects/deep-research/" in rel and "TS 生态对照" not in out:
            note = (
                "\n> **TS 生态对照（本仓库）**：深度研搜原项目偏 Python DeepAgents；"
                "本仓库用 `examples/12-langgraph-multi-agent`、`examples/11-langgraph-tool-agent`、`examples/14-mcp` 提供同主题 TypeScript 可运行对照。\n"
            )
            if "<!-- TS-TRACK-BANNER -->" in out:
                out = out.replace("<!-- TS-TRACK-BANNER -->", "<!-- TS-TRACK-BANNER -->" + note, 1)
            elif re.search(r"^# .+$", out, flags=re.M):
                out = re.sub(r"^(# .+)$", r"\1\n" + note, out, count=1, flags=re.M)
        if out != md:
            f.write_text(out, encoding="utf-8")
            touched += 1
            print("updated", f.relative_to(BOOK).as_posix())
    print("touched", touched)

if __name__ == "__main__":
    main()
