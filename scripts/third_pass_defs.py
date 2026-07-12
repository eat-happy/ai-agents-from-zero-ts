import re, json
from pathlib import Path

BOOK = Path("book")

def convert_line_defs(text: str) -> str:
    out = []
    for line in text.splitlines(True):
        # async def name(...):  or multi already partial
        m = re.match(r"^(\s*)async def\s+([A-Za-z_][\w]*)\((.*)\)(?:\s*->\s*(.+))?:\s*$", line)
        if m:
            ind, name, args, ret = m.group(1), m.group(2), m.group(3), m.group(4)
            ret_s = f": {ret.strip()}" if ret else ""
            out.append(f"{ind}async function {name}({args}){ret_s} {{\n")
            continue
        m = re.match(r"^(\s*)def\s+([A-Za-z_][\w]*)\((.*)\)(?:\s*->\s*(.+))?:\s*$", line)
        if m:
            ind, name, args, ret = m.group(1), m.group(2), m.group(3), m.group(4)
            ret_s = f": {ret.strip()}" if ret else ""
            # dunder constructors
            if name == "__init__":
                out.append(f"{ind}constructor({args}) {{\n")
            else:
                out.append(f"{ind}function {name}({args}){ret_s} {{\n")
            continue
        # unfinished multi-line def headers ending without ):
        m = re.match(r"^(\s*)async def\s+([A-Za-z_][\w]*)\((.*)$", line)
        if m and not line.rstrip().endswith(":"):
            # leave for next; but convert keyword
            out.append(line.replace("async def ", "async function ", 1).replace("):", ") {", 1) if False else line.replace("async def ", "async function ", 1))
            continue
        m = re.match(r"^(\s*)def\s+([A-Za-z_][\w]*)\((.*)$", line)
        if m and not line.rstrip().endswith(":"):
            out.append(line.replace("def ", "function ", 1))
            continue
        # close multi-line signature lines that end with ):
        if re.search(r"\)\s*:\s*$", line) and ("function " in "".join(out[-3:]) or "async function " in "".join(out[-3:]) or "constructor(" in "".join(out[-3:])):
            out.append(re.sub(r"\)\s*:\s*$", ") {\n", line))
            continue
        out.append(line)
    text2 = "".join(out)
    # cleanup python return type arrows left in ts
    text2 = text2.replace(" -> null", ": void")
    text2 = text2.replace(" -> str", ": string")
    text2 = text2.replace(" -> int", ": number")
    text2 = text2.replace(" -> dict", ": Record<string, any>")
    text2 = text2.replace(" -> list", ": any[]")
    text2 = re.sub(r"\bstr\s*\|\s*null\b", "string | null", text2)
    text2 = re.sub(r"\bTuple\[(.+?)\]", r"[\1]", text2)
    text2 = text2.replace("AsyncSession", "any /* AsyncSession */")
    text2 = text2.replace("asyncio.Task", "Promise<any>")
    text2 = text2.replace("asyncio.AbstractEventLoop", "any")
    text2 = text2.replace("WebSocket", "WebSocket")
    text2 = text2.replace("Token[str | null]", "any")
    text2 = text2.replace("Record<string, any>[str, Any]", "Record<string, any>")
    text2 = text2.replace("dict[str, Any]", "Record<string, any>")
    text2 = text2.replace("list[dict]", "Array<Record<string, any>>")
    text2 = text2.replace("list[ColumnInfo]", "ColumnInfo[]")
    text2 = text2.replace("any[]", "any[]")
    # Runtime generic python style
    text2 = text2.replace("Runtime[DataAgentContext]", "Runtime<DataAgentContext>")
    text2 = re.sub(r"Runtime\[(.+?)\]", r"Runtime<\1>", text2)
    return text2

files = list(BOOK.rglob("*.md"))
touched = 0
remain = 0
for f in files:
    md = f.read_text(encoding="utf-8")
    out = convert_line_defs(md)
    if out != md:
        f.write_text(out, encoding="utf-8")
        touched += 1
    remain += len(re.findall(r"(?m)^\s*(?:async\s+)?def\s+", out))
print(json.dumps({"touched": touched, "remaining_def_lines": remain}))
