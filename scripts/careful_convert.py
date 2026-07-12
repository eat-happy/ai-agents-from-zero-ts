#!/usr/bin/env python3
"""Careful Python->TypeScript code-fence conversion that preserves markdown structure."""
from __future__ import annotations

import re
from pathlib import Path

BOOK = Path("book")
BANNER = (
    "\n\n<!-- TS-TRACK-BANNER -->\n"
    "> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。"
    "中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js** 轨道写法。\n"
    "> 可运行精校示例见仓库 `examples/` 与 [POLISHED-CASES](POLISHED-CASES.md)。"
    "自动迁移代码若与最新 SDK 有差异，以精校示例为准。\n\n"
)


def convert_code(code: str) -> str:
    lines = code.splitlines()
    out = []
    for line in lines:
        s = line
        # imports
        if re.match(r"^from\s+dotenv\s+import\s+load_dotenv\s*$", s.strip()):
            out.append('import "dotenv/config";')
            continue
        if re.match(r"^load_dotenv\(.*\)\s*$", s.strip()):
            out.append("// env loaded via dotenv/config")
            continue
        if s.strip() in {"import os", "import json", "import re", "import asyncio", "import uuid"}:
            continue
        if re.match(r"^from\s+typing(?:_extensions)?\s+import\s+", s.strip()):
            continue
        if re.match(r"^from\s+pathlib\s+import\s+", s.strip()):
            continue
        if re.match(r"^from\s+loguru\s+import\s+logger", s.strip()):
            out.append("const logger = console;")
            continue
        if re.match(r"^from\s+pydantic\s+import\s+", s.strip()):
            out.append('import { z } from "zod";')
            continue
        if re.match(r"^from\s+langchain_huggingface\s+import\s+", s.strip()):
            out.append('import { OpenAIEmbeddings } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain_openai\s+import\s+ChatOpenAI", s.strip()):
            out.append('import { ChatOpenAI } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain_openai\s+import\s+OpenAIEmbeddings", s.strip()):
            out.append('import { OpenAIEmbeddings } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain\.agents\s+import\s+create_agent", s.strip()):
            out.append('import { createReactAgent } from "@langchain/langgraph/prebuilt";')
            continue
        if re.match(r"^from\s+langchain_core\.tools\s+import\s+tool", s.strip()) or re.match(r"^from\s+langchain\.tools\s+import\s+tool", s.strip()):
            out.append('import { tool } from "@langchain/core/tools";')
            continue
        m = re.match(r"^from\s+(langchain_core\.(?:prompts|messages|output_parsers|runnables))\s+import\s+(.+)$", s.strip())
        if m:
            mod = {
                "langchain_core.prompts": "@langchain/core/prompts",
                "langchain_core.messages": "@langchain/core/messages",
                "langchain_core.output_parsers": "@langchain/core/output_parsers",
                "langchain_core.runnables": "@langchain/core/runnables",
            }[m.group(1)]
            out.append(f'import {{ {m.group(2)} }} from "{mod}";')
            continue
        m = re.match(r"^from\s+langgraph\.graph\s+import\s+(.+)$", s.strip())
        if m:
            out.append(f'import {{ {m.group(1)} }} from "@langchain/langgraph";')
            continue
        m = re.match(r"^from\s+langgraph\.constants\s+import\s+(.+)$", s.strip())
        if m:
            out.append(f'import {{ {m.group(1)} }} from "@langchain/langgraph";')
            continue
        if re.match(r"^from\s+langgraph\.checkpoint\.memory\s+import\s+InMemorySaver", s.strip()):
            out.append('import { MemorySaver } from "@langchain/langgraph";')
            continue
        if re.match(r"^from\s+langgraph\.graph\.message\s+import\s+add_messages", s.strip()):
            out.append('import { messagesStateReducer as add_messages } from "@langchain/langgraph";')
            continue
        if re.match(r"^from\s+fastapi\s+import\s+", s.strip()):
            out.append("// FastAPI equivalent in TS: Next.js route handler / Hono / Fastify")
            continue
        if re.match(r"^from\s+\S+\s+import\s+", s.strip()):
            out.append("// " + s.strip() + "  // TODO: map to TS import path")
            continue

        # defs / classes (single-line signatures only to avoid structural damage)
        m = re.match(r"^(\s*)async def\s+([A-Za-z_][\w]*)\((.*)\)(?:\s*->\s*([^:]+))?:\s*$", s)
        if m:
            ind, name, args, ret = m.groups()
            ret = f": {ret.strip()}" if ret else ""
            args = args.replace("self, ", "").replace("self", "")
            out.append(f"{ind}async function {name}({args}){ret} {{")
            continue
        m = re.match(r"^(\s*)def\s+([A-Za-z_][\w]*)\((.*)\)(?:\s*->\s*([^:]+))?:\s*$", s)
        if m:
            ind, name, args, ret = m.groups()
            ret = f": {ret.strip()}" if ret else ""
            if name == "__init__":
                args = args.replace("self, ", "").replace("self", "")
                out.append(f"{ind}constructor({args}) {{")
            else:
                args = args.replace("self, ", "").replace("self", "")
                # methods inside class: omit function keyword style -> keep as method-like
                out.append(f"{ind}function {name}({args}){ret} {{")
            continue
        m = re.match(r"^(\s*)class\s+([A-Za-z_][\w]*)\(TypedDict\):\s*$", s)
        if m:
            out.append(f"{m.group(1)}type {m.group(2)} = {{")
            continue
        m = re.match(r"^(\s*)class\s+([A-Za-z_][\w]*)\(BaseModel\):\s*$", s)
        if m:
            out.append(f"{m.group(1)}// Zod schema alternative for {m.group(2)}")
            out.append(f"{m.group(1)}const {m.group(2)}Schema = z.object({{")
            continue
        m = re.match(r"^(\s*)class\s+([A-Za-z_][\w]*):\s*$", s)
        if m:
            out.append(f"{m.group(1)}class {m.group(2)} {{")
            continue

        # control flow single-line headers only
        m = re.match(r"^(\s*)elif\s+(.+):\s*$", s)
        if m:
            out.append(f"{m.group(1)}} else if ({m.group(2)}) {{")
            continue
        m = re.match(r"^(\s*)else:\s*$", s)
        if m:
            out.append(f"{m.group(1)}}} else {{")
            continue
        m = re.match(r"^(\s*)if\s+(.+):\s*$", s)
        if m and not s.strip().startswith("if __name__"):
            out.append(f"{m.group(1)}if ({m.group(2)}) {{")
            continue
        m = re.match(r"^(\s*)for\s+(.+)\s+in\s+(.+):\s*$", s)
        if m:
            out.append(f"{m.group(1)}for (const {m.group(2)} of {m.group(3)}) {{")
            continue
        m = re.match(r"^(\s*)while\s+(.+):\s*$", s)
        if m:
            out.append(f"{m.group(1)}while ({m.group(2)}) {{")
            continue
        m = re.match(r"^(\s*)try:\s*$", s)
        if m:
            out.append(f"{m.group(1)}try {{")
            continue
        m = re.match(r"^(\s*)except\s+Exception\s+as\s+(\w+):\s*$", s)
        if m:
            out.append(f"{m.group(1)}}} catch ({m.group(2)}) {{")
            continue
        m = re.match(r"^(\s*)except\s+.+:\s*$", s)
        if m:
            out.append(f"{m.group(1)}}} catch {{")
            continue
        m = re.match(r"^(\s*)finally:\s*$", s)
        if m:
            out.append(f"{m.group(1)}}} finally {{")
            continue

        # replacements
        s = s.replace("True", "true").replace("False", "false").replace("None", "null")
        s = s.replace("self.", "this.")
        s = re.sub(r"\bprint\((.+)\)", r"console.log(\1)", s)
        s = re.sub(r"logger\.info\((.+)\)", r"console.log(\1)", s)
        s = re.sub(r"logger\.warning\((.+)\)", r"console.warn(\1)", s)
        s = re.sub(r"logger\.error\((.+)\)", r"console.error(\1)", s)
        s = re.sub(r"os\.getenv\((['\"])(.+?)\1\)", r"process.env.\2", s)
        s = re.sub(r'f"([^"]*)"', lambda m: "`" + re.sub(r"\{([^}]+)\}", r"${\1}", m.group(1)) + "`", s)
        s = re.sub(r"f'([^']*)'", lambda m: "`" + re.sub(r"\{([^}]+)\}", r"${\1}", m.group(1)) + "`", s)
        s = s.replace("init_chat_model(", "new ChatOpenAI(")
        s = s.replace("ChatOpenAI(", "new ChatOpenAI(")
        s = s.replace("create_agent(", "createReactAgent(")
        s = s.replace("StateGraph(", "new StateGraph(")
        s = s.replace("HuggingFaceEndpointEmbeddings(", "new OpenAIEmbeddings(")
        s = s.replace("InMemorySaver(", "new MemorySaver(")
        s = s.replace("api_key=", "apiKey:")
        s = s.replace("base_url=", "configuration: { baseURL:")
        s = s.replace("temperature=", "temperature:")
        s = s.replace("max_tokens=", "maxTokens:")
        s = s.replace("model_provider=\"openai\",", "")
        s = s.replace("model_provider='openai',", "")
        s = s.replace("aembed_query", "embedQuery")
        s = s.replace("aembed_documents", "embedDocuments")
        s = re.sub(r"(\w+)\[:(\d+)\]", r"\1.slice(0, \2)", s)
        s = re.sub(r"(^|\s)# (.*)$", r"\1// \2", s)
        s = s.replace("@tool", "// tool(...)")
        if s.strip().startswith("if __name__"):
            out.append("async function main() {")
            continue
        # type renames
        s = s.replace(": str", ": string").replace(": int", ": number").replace(": float", ": number").replace(": bool", ": boolean")
        s = s.replace("List[", "Array<").replace("Dict[", "Record<").replace("Optional[", "(" )
        # Optional[x] rough already broken - skip complex
        out.append(s)

    code = "\n".join(out)
    code = re.sub(r'"""([\s\S]*?)"""', r"/* \1 */", code)
    code = re.sub(r"'''([\s\S]*?)'''", r"/* \1 */", code)
    if "[TS-PORT]" not in code:
        code = "// [TS-PORT] TypeScript track example migrated from original Python tutorial.\n// For guaranteed runnable code, see examples/ and POLISHED-CASES.md\n" + code
    return code


def convert_md(md: str) -> tuple[str, int]:
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        count += 1
        body = m.group(1)
        return "```typescript\n" + convert_code(body) + "\n```"

    out = re.sub(r"```(?:python|py|ipython)\s*\n([\s\S]*?)```", repl, md, flags=re.I)

    # unlabeled python-looking fences
    def repl2(m: re.Match) -> str:
        nonlocal count
        body = m.group(1)
        if re.search(r"(?m)^\s*(?:def |async def |from langchain|from langgraph|from fastapi|import os|print\(|load_dotenv|@tool|class \w+\(TypedDict\))", body):
            count += 1
            return "```typescript\n" + convert_code(body) + "\n```"
        return m.group(0)

    out = re.sub(r"```\s*\n([\s\S]*?)```", repl2, out)

    # prose only (safe)
    for a, b in [
        ("Python 示例", "TypeScript 示例"),
        ("如下 Python 代码", "如下 TypeScript 代码"),
        ("下面的 Python 代码", "下面的 TypeScript 代码"),
        ("用 Python 实现", "用 TypeScript 实现"),
        ("Python 版本", "TypeScript 版本"),
        ("Python 脚本", "TypeScript 脚本"),
        ("Python 代码", "TypeScript 代码"),
        ("pip install", "npm install"),
        ("python3 -m ", "npx tsx "),
        ("python -m ", "npx tsx "),
        ("（Python）", "（TypeScript）"),
        ("(Python)", "(TypeScript)"),
    ]:
        out = out.replace(a, b)

    if "TS-TRACK-BANNER" not in out and out.lstrip().startswith("#"):
        out = re.sub(r"^(# .+\n)", r"\1" + BANNER, out, count=1, flags=re.M)

    return out, count


def main():
    total = 0
    touched = 0
    for f in BOOK.rglob("*.md"):
        # skip polished list itself maybe ok
        md = f.read_text(encoding="utf-8")
        out, c = convert_md(md)
        if out != md:
            f.write_text(out, encoding="utf-8")
            touched += 1
            total += c
            print(f"{c}\t{f.as_posix()}")
    print({"touched": touched, "converted": total})


if __name__ == "__main__":
    main()
