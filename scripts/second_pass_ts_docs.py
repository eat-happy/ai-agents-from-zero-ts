import re, json
from pathlib import Path

BOOK = Path("book")

def second_pass(md: str) -> str:
    out = md

    # multi-line function signatures: async def name(\n ... \n):
    def repl_async_def(m):
        name = m.group(1)
        args = re.sub(r"\s+", " ", m.group(2).strip())
        return f"async function {name}({args}) {{"
    out = re.sub(
        r"^async def\s+([A-Za-z_][\w]*)\(([\s\S]*?)\):\s*$",
        repl_async_def,
        out,
        flags=re.M,
    )
    def repl_def(m):
        name = m.group(1)
        args = re.sub(r"\s+", " ", m.group(2).strip())
        return f"function {name}({args}) {{"
    out = re.sub(
        r"^def\s+([A-Za-z_][\w]*)\(([\s\S]*?)\):\s*$",
        repl_def,
        out,
        flags=re.M,
    )

    # leftover python-y dict returns in ts fences
    out = out.replace('return {"error": null}', "return { error: null }")
    out = out.replace('return {"error": None}', "return { error: null }")

    # TypedDict wording
    out = out.replace("TypedDict", "TypeScript type / interface")
    out = out.replace("Pydantic BaseModel", "Zod schema")
    out = out.replace("Pydantic", "Zod")
    out = out.replace("dataclass", "class / interface with defaults")

    # prose leftovers
    prose = [
        ("普通 Python 计算", "普通 TypeScript 计算"),
        ("Python 计算", "TypeScript 计算"),
        ("Python 函数", "TypeScript 函数"),
        ("Python 代码", "TypeScript 代码"),
        ("python 代码", "TypeScript 代码"),
        ("pip install", "npm install"),
        ("requirements.txt", "package.json"),
        ("FastAPI", "Next.js / Hono / Fastify"),
        ("uvicorn", "node server"),
        ("graph.py", "graph.ts"),
        ("main.py", "main.ts"),
        ("app.py", "app.ts"),
        ("`.py`", "`.ts`"),
        ("文件 graph.py", "文件 graph.ts"),
        ("docs.langchain.com/oss/python/", "docs.langchain.com/oss/javascript/"),
    ]
    for a, b in prose:
        out = out.replace(a, b)

    # fix incomplete type blocks that are only 1-3 fields and missing closing brace before fence end
    def close_types(m):
        body = m.group(1)
        # if starts with type X = { and no closing } before end
        if re.search(r"type\s+\w+\s*=\s*\{", body) and body.count("{") > body.count("}"):
            body = body.rstrip() + "\n}\n"
        return "```typescript\n" + body + "\n```"
    out = re.sub(r"```typescript\n([\s\S]*?)```", close_types, out)

    return out

files = list(BOOK.rglob("*.md"))
touched = 0
for f in files:
    md = f.read_text(encoding="utf-8")
    out = second_pass(md)
    if out != md:
        f.write_text(out, encoding="utf-8")
        touched += 1
print(json.dumps({"touched": touched, "files": len(files)}))
# counts
py = 0
ts = 0
async_def = 0
for f in files:
    t = f.read_text(encoding="utf-8")
    py += t.count("```python")
    ts += t.count("```typescript")
    async_def += len(re.findall(r"(?m)^async def\s+", t))
print(json.dumps({"python_fences": py, "typescript_fences": ts, "remaining_async_def_lines": async_def}))
