#!/usr/bin/env python3
"""Aggressive cleanup of Python residue inside TypeScript code fences in book markdown."""
from __future__ import annotations

import re
from pathlib import Path

BOOK = Path("book")


def clean_ts_code(code: str) -> str:
    lines = code.splitlines()
    out: list[str] = []

    for line in lines:
        raw = line
        stripped = line.strip()

        # Drop pure python import noise / convert common ones
        if re.match(r"^from\s+langchain_huggingface\s+import\s+", stripped):
            out.append('import { OpenAIEmbeddings } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain_openai\s+import\s+OpenAIEmbeddings", stripped):
            out.append('import { OpenAIEmbeddings } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain_openai\s+import\s+ChatOpenAI", stripped):
            out.append('import { ChatOpenAI } from "@langchain/openai";')
            continue
        if re.match(r"^from\s+langchain_core\.", stripped) or re.match(r"^from\s+langgraph\.", stripped) or re.match(r"^from\s+langchain\.", stripped):
            # try keep as comment if unknown mapping already missed
            m = re.match(r"^from\s+(\S+)\s+import\s+(.+)$", stripped)
            if m:
                mod, names = m.group(1), m.group(2)
                names = names.replace("(", "").replace(")", "").strip()
                # map known modules
                mapping = {
                    "langchain_core.messages": "@langchain/core/messages",
                    "langchain_core.prompts": "@langchain/core/prompts",
                    "langchain_core.tools": "@langchain/core/tools",
                    "langchain_core.output_parsers": "@langchain/core/output_parsers",
                    "langchain_core.runnables": "@langchain/core/runnables",
                    "langchain_openai": "@langchain/openai",
                    "langgraph.graph": "@langchain/langgraph",
                    "langgraph.constants": "@langchain/langgraph",
                    "langgraph.checkpoint.memory": "@langchain/langgraph",
                    "langchain.agents": "@langchain/langgraph/prebuilt",
                }
                target = mapping.get(mod)
                if target:
                    # create_agent special
                    names2 = names.replace("create_agent", "createReactAgent")
                    names2 = names2.replace("InMemorySaver", "MemorySaver")
                    out.append(f'import {{ {names2} }} from "{target}";')
                    continue
            out.append("// " + stripped)
            continue
        if re.match(r"^from\s+app\.", stripped) or re.match(r"^from\s+\.", stripped):
            out.append("// " + stripped + "  // project-local import (TS path differs)")
            continue
        if re.match(r"^from\s+\S+\s+import\s+", stripped):
            out.append("// " + stripped)
            continue
        if re.match(r"^import\s+[a-zA-Z_][\w\.]*\s*$", stripped) and " from " not in stripped and not stripped.startswith("import {"):
            # bare `import os` etc
            if stripped in {"import os", "import json", "import re", "import asyncio", "import uuid", "import httpx"}:
                continue
            out.append("// " + stripped)
            continue

        # main guard
        if "__name__" in line and "__main__" in line:
            out.append("async function main() {")
            continue
        if stripped in {") {", "}"} and out and "async function main" in out[-1]:
            out.append(line)
            continue

        # constructor / methods with self
        line = re.sub(r"constructor\(self,\s*", "constructor(", line)
        line = re.sub(r"constructor\(self\)", "constructor()", line)
        line = re.sub(r"function\s+([A-Za-z_][\w]*)\(self,\s*", r"\1(", line)
        line = re.sub(r"function\s+([A-Za-z_][\w]*)\(self\)", r"\1()", line)
        line = re.sub(r"async function\s+([A-Za-z_][\w]*)\(self,\s*", r"async \1(", line)
        line = re.sub(r"async function\s+([A-Za-z_][\w]*)\(self\)", r"async \1()", line)

        # private helpers named _get_url etc that became function _get_url(
        line = re.sub(r"^\s*function\s+(_[A-Za-z_][\w]*)\(", lambda m: re.match(r"^(\s*)", line).group(1) + m.group(1) + "(", line)

        # this.x: Type = null  => this.x = null (type field invalid in ctor body)
        line = re.sub(r"this\.(\w+)\s*:\s*[^=]+=\s*", r"this.\1 = ", line)
        line = re.sub(r"this\.(\w+)\s*:\s*[^;=]+;", r"// declare private \1 on class field", line)

        # python kwargs-ish model= url=
        line = line.replace("HuggingFaceEndpointEmbeddings(", "new OpenAIEmbeddings(")
        line = line.replace("OpenAIEmbeddings(", "new OpenAIEmbeddings(")
        line = re.sub(r"new new OpenAIEmbeddings\(", "new OpenAIEmbeddings(", line)
        line = re.sub(r"new new ChatOpenAI\(", "new ChatOpenAI(", line)
        line = re.sub(r"\bmodel\s*=\s*this\._get_url\(\)", 'configuration: { baseURL: this.getUrl() }', line)
        line = re.sub(r"\bmodel\s*=\s*this\.getUrl\(\)", 'configuration: { baseURL: this.getUrl() }', line)
        # general kwarg to prop for common ones only when clearly constructor args
        for pyk, tsk in [
            ("api_key=", "apiKey:"),
            ("base_url=", "baseURL:"),
            ("max_tokens=", "maxTokens:"),
            ("model_provider=", "// model_provider removed:"),
            ("temperature=", "temperature:"),
        ]:
            line = line.replace(pyk, tsk)

        # methods
        line = line.replace("aembed_query", "embedQuery")
        line = line.replace("aembed_documents", "embedDocuments")
        line = line.replace("embed_query", "embedQuery")
        line = line.replace(".ainvoke(", ".invoke(")
        line = line.replace(".astream(", ".stream(")

        # slices
        line = re.sub(r"(\w+)\[:(\d+)\]", r"\1.slice(0, \2)", line)
        line = re.sub(r"(\w+)\[(\d+):\]", r"\1.slice(\2)", line)

        # dict style returns {"a": b} simple cases
        def dict_repl(m):
            body = m.group(1)
            # "k": v  -> k: v for simple keys
            body2 = re.sub(r'"([A-Za-z_][\w]*)"\s*:', r"\1:", body)
            return "return { " + body2 + " }"
        line = re.sub(r'return\s*\{\s*(.+)\s*\}\s*$', dict_repl, line)

        # python prints leftovers
        line = line.replace("self.", "this.")

        # assignment without let/const for obvious locals
        if re.match(r"^[A-Za-z_][\w]*\s*=\s*", stripped) and not stripped.startswith("this.") and ":" not in stripped.split("=")[0]:
            # avoid class fields and exports
            if not any(stripped.startswith(p) for p in ("export ", "const ", "let ", "var ", "type ", "class ", "import ")):
                # only if looks like local assignment in function
                line = re.sub(r"^(\s*)([A-Za-z_][\w]*)\s*=", r"\1const \2 =", line)

        # instantiation without new for manager pattern
        line = re.sub(r"=\s*EmbeddingClientManager\(", "= new EmbeddingClientManager(", line)
        line = re.sub(r"=\s*ChatOpenAI\(", "= new ChatOpenAI(", line)

        # snake_case manager singleton naming to camel lightly for new code style
        # keep names if already used extensively

        out.append(line)

    code2 = "\n".join(out)

    # fix _get_url leftovers
    code2 = code2.replace("this._get_url()", "this.getUrl()")
    code2 = code2.replace("function _get_url", "getUrl")
    code2 = re.sub(r"(?m)^\s*_get_url\(", "  getUrl(", code2)

    # close bare class blocks that open { and never close before next top-level
    # lightweight: ensure code ends with balanced braces by appending } if needed
    opens = code2.count("{")
    closes = code2.count("}")
    if opens > closes:
        code2 += "\n" + ("}" * (opens - closes))

    if "[TS-PORT]" not in code2:
        code2 = "// [TS-PORT] Cleaned for TypeScript track. Prefer examples/ and POLISHED-CASES for runnable code.\n" + code2
    return code2


def process_markdown(md: str) -> str:
    def repl(m: re.Match) -> str:
        body = m.group(1)
        cleaned = clean_ts_code(body)
        return "```typescript\n" + cleaned + "\n```"

    out = re.sub(r"```typescript\s*\n([\s\S]*?)```", repl, md)

    # bash/python run commands
    out = out.replace("python3 -m ", "npx tsx ")
    out = out.replace("python -m ", "npx tsx ")
    out = re.sub(r"(?m)^python3\s+(\S+\.py)", r"npx tsx \1", out)
    out = re.sub(r"(?m)^python\s+(\S+\.py)", r"npx tsx \1", out)
    out = out.replace(".py", ".ts")  # careful? may break URLs - only in code-ish contexts already mostly ts

    # prose language nits
    prose = [
        ("HuggingFaceEndpointEmbeddings", "OpenAIEmbeddings（对接 TEI OpenAI 兼容接口）"),
        ("langchain_huggingface", "@langchain/openai"),
        ("aembed_query", "embedQuery"),
        ("Python 客户端", "HTTP/SDK 客户端"),
        ("普通 Python 类", "普通业务类"),
        ("self.config", "this.config"),
        ("self.client", "this.client"),
    ]
    for a, b in prose:
        out = out.replace(a, b)
    return out


def main():
    files = list(BOOK.rglob("*.md"))
    touched = 0
    for f in files:
        md = f.read_text(encoding="utf-8")
        out = process_markdown(md)
        if out != md:
            f.write_text(out, encoding="utf-8")
            touched += 1
            print("updated", f.as_posix())
    print("touched", touched, "of", len(files))


if __name__ == "__main__":
    main()
