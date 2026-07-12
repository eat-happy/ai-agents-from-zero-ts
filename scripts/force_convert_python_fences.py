import re, json
from pathlib import Path

BOOK = Path("book")

def convert_python_body(code: str) -> str:
    reps = [
        (r"^from\s+dotenv\s+import\s+load_dotenv\s*$", 'import "dotenv/config";'),
        (r"^load_dotenv\(.*\)\s*$", "// env loaded via dotenv/config"),
        (r"^import\s+os\s*$", ""),
        (r"^import\s+json\s*$", ""),
        (r"^import\s+re\s*$", ""),
        (r"^import\s+asyncio\s*$", ""),
        (r"^from\s+typing(?:_extensions)?\s+import\s+.+$", ""),
        (r"^from\s+pathlib\s+import\s+.+$", ""),
        (r"^from\s+loguru\s+import\s+logger\s*$", "const logger = console;"),
        (r"^from\s+pydantic\s+import\s+.+$", 'import { z } from "zod";'),
        (r"^from\s+langchain_openai\s+import\s+ChatOpenAI\s*$", 'import { ChatOpenAI } from "@langchain/openai";'),
        (r"^from\s+langchain\.chat_models\s+import\s+init_chat_model\s*$", 'import { ChatOpenAI } from "@langchain/openai";'),
        (r"^from\s+langchain\.agents\s+import\s+create_agent\s*$", 'import { createReactAgent } from "@langchain/langgraph/prebuilt";'),
        (r"^from\s+langchain_core\.tools\s+import\s+tool\s*$", 'import { tool } from "@langchain/core/tools";'),
        (r"^from\s+langchain\.tools\s+import\s+tool\s*$", 'import { tool } from "@langchain/core/tools";'),
        (r"^from\s+langchain_core\.prompts\s+import\s+(.+)$", r'import { \1 } from "@langchain/core/prompts";'),
        (r"^from\s+langchain_core\.messages\s+import\s+(.+)$", r'import { \1 } from "@langchain/core/messages";'),
        (r"^from\s+langchain_core\.output_parsers\s+import\s+(.+)$", r'import { \1 } from "@langchain/core/output_parsers";'),
        (r"^from\s+langchain_core\.runnables\s+import\s+(.+)$", r'import { \1 } from "@langchain/core/runnables";'),
        (r"^from\s+langgraph\.graph\s+import\s+(.+)$", r'import { \1 } from "@langchain/langgraph";'),
        (r"^from\s+langgraph\.constants\s+import\s+(.+)$", r'import { \1 } from "@langchain/langgraph";'),
        (r"^from\s+langgraph\.graph\.message\s+import\s+add_messages\s*$", 'import { messagesStateReducer as add_messages } from "@langchain/langgraph";'),
        (r"^from\s+langgraph\.checkpoint\.memory\s+import\s+InMemorySaver\s*$", 'import { MemorySaver as InMemorySaver } from "@langchain/langgraph";'),
        (r"^from\s+fastapi\s+import\s+(.+)$", "// FastAPI -> Next.js / Hono / Fastify in TypeScript"),
        (r"\bTrue\b", "true"),
        (r"\bFalse\b", "false"),
        (r"\bNone\b", "null"),
        (r"\bself\.", "this."),
        (r"print\((.+)\)", r"console.log(\1)"),
        (r"logger\.info\((.+)\)", r"console.log(\1)"),
        (r"logger\.warning\((.+)\)", r"console.warn(\1)"),
        (r"logger\.error\((.+)\)", r"console.error(\1)"),
        (r"^async def\s+([A-Za-z_][\w]*)\((.*)\):\s*$", r"async function \1(\2) {"),
        (r"^def\s+([A-Za-z_][\w]*)\((.*)\):\s*$", r"function \1(\2) {"),
        (r"^class\s+([A-Za-z_][\w]*)\(TypedDict\):\s*$", r"type \1 = {"),
        (r"^class\s+([A-Za-z_][\w]*)\(BaseModel\):\s*$", r"const \1Schema = z.object({"),
        (r"^class\s+([A-Za-z_][\w]*):\s*$", r"class \1 {"),
        (r"^(\s*)elif\s+(.+):\s*$", r"\1} else if (\2) {"),
        (r"^(\s*)else:\s*$", r"\1} else {"),
        (r"^(\s*)if\s+(.+):\s*$", r"\1if (\2) {"),
        (r"^(\s*)for\s+(.+)\s+in\s+(.+):\s*$", r"\1for (const \2 of \3) {"),
        (r"^(\s*)while\s+(.+):\s*$", r"\1while (\2) {"),
        (r"^(\s*)try:\s*$", r"\1try {"),
        (r"^(\s*)except\s+Exception\s+as\s+(\w+):\s*$", r"\1} catch (\2) {"),
        (r"^(\s*)except\s+.+:\s*$", r"\1} catch {"),
        (r"^(\s*)finally:\s*$", r"\1} finally {"),
        (r": str\b", ": string"),
        (r": int\b", ": number"),
        (r": float\b", ": number"),
        (r": bool\b", ": boolean"),
        (r": list\b", ": any[]"),
        (r": dict\b", ": Record<string, any>"),
        (r"List\[(.+?)\]", r"\1[]"),
        (r"Dict\[(.+?),\s*(.+?)\]", r"Record<\1, \2>"),
        (r"Optional\[(.+?)\]", r"\1 | null"),
        (r"\binit_chat_model\(", "new ChatOpenAI("),
        (r"\bChatOpenAI\(", "new ChatOpenAI("),
        (r"\bcreate_agent\(", "createReactAgent("),
        (r"\bStateGraph\(", "new StateGraph("),
        (r"\bmodel_provider\s*=\s*['\"]openai['\"]\s*,?", ""),
        (r"\bapi_key\s*=", "apiKey:"),
        (r"\bbase_url\s*=", "configuration:{ baseURL:"),
        (r"\btemperature\s*=", "temperature:"),
        (r"\bmax_tokens\s*=", "maxTokens:"),
        (r"^@tool\s*$", "// tool(...)"),
        (r"^@mcp\.tool\(\)\s*$", "// MCP tool"),
        (r"(^|\s)# (.*)$", r"\1// \2"),
        (r"asyncio\.run\((.+)\)", r"await \1"),
        (r"\band\b", "&&"),
        (r"\bor\b", "||"),
    ]
    out = code
    for pat, repl in reps:
        out = re.sub(pat, repl, out, flags=re.M)
    out = re.sub(r'f"([^"]*)"', lambda m: "`" + re.sub(r"\{([^}]+)\}", r"${\1}", m.group(1)) + "`", out)
    out = re.sub(r"f'([^']*)'", lambda m: "`" + re.sub(r"\{([^}]+)\}", r"${\1}", m.group(1)) + "`", out)
    out = re.sub(
        r"os\.getenv\((['\"])(.+?)\1(?:,\s*(['\"])(.*?)\3)?\)",
        lambda m: f"(process.env.{m.group(2)} ?? {m.group(3)}{m.group(4)}{m.group(3)})" if m.group(4) is not None else f"process.env.{m.group(2)}",
        out,
    )
    out = re.sub(r'"""([\s\S]*?)"""', r"/* \1 */", out)
    out = re.sub(r"'''([\s\S]*?)'''", r"/* \1 */", out)
    if "[TS-PORT]" not in out:
        out = "// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.\n" + out
    return out

def convert_markdown(md: str):
    count = 0
    def repl_labeled(m):
        nonlocal count
        count += 1
        return "```typescript\n" + convert_python_body(m.group(1)) + "\n```"
    out = re.sub(r"```(?:python|py|ipython)\s*\n([\s\S]*?)```", repl_labeled, md, flags=re.I)
    def repl_unlabeled(m):
        nonlocal count
        body = m.group(1)
        if re.search(r"(?:^|\n)\s*(?:def |async def |from langchain|from langgraph|from fastapi|import os|print\(|load_dotenv|@tool|class \w+\(TypedDict\)|class \w+\(BaseModel\))", body):
            count += 1
            return "```typescript\n" + convert_python_body(body) + "\n```"
        return m.group(0)
    out = re.sub(r"```\s*\n([\s\S]*?)```", repl_unlabeled, out)
    out = re.sub(r"```python", "```typescript", out, flags=re.I)
    prose = [
        ("Python 示例", "TypeScript 示例"),
        ("如下 Python 代码", "如下 TypeScript 代码"),
        ("下面的 Python 代码", "下面的 TypeScript 代码"),
        ("用 Python 实现", "用 TypeScript 实现"),
        ("Python 版本", "TypeScript 版本"),
        ("（Python）", "（TypeScript）"),
        ("(Python)", "(TypeScript)"),
        ("Python 代码如下", "TypeScript 代码如下"),
        ("完整 Python 代码", "完整 TypeScript 代码"),
    ]
    for a,b in prose:
        out = out.replace(a,b)
    return out, count

files = list(BOOK.rglob("*.md"))
total = 0
touched = 0
for f in files:
    md = f.read_text(encoding="utf-8")
    out, count = convert_markdown(md)
    if out != md:
        f.write_text(out, encoding="utf-8")
        touched += 1
        total += count
        print(f"{count}\t{f.as_posix()}")
print(json.dumps({"files": len(files), "touched": touched, "convertedFences": total}, ensure_ascii=False, indent=2))
