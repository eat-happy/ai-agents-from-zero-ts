#!/usr/bin/env node
// Force-convert remaining python fences in book markdown to TypeScript track.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOK = path.resolve(__dirname, "../book");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (p.endsWith(".md")) acc.push(p);
  }
  return acc;
}

function convertPythonBody(code) {
  let out = code;
  const reps = [
    [/^from\\s+dotenv\\s+import\\s+load_dotenv\\s*$/gm, "import \\"dotenv/config\\";"],
    [/^load_dotenv\\(.*\\)\\s*$/gm, "// env loaded via dotenv/config"],
    [/^import\\s+os\\s*$/gm, ""],
    [/^import\\s+json\\s*$/gm, ""],
    [/^import\\s+re\\s*$/gm, ""],
    [/^import\\s+asyncio\\s*$/gm, ""],
    [/^from\\s+typing(?:_extensions)?\\s+import\\s+.+$/gm, ""],
    [/^from\\s+pathlib\\s+import\\s+.+$/gm, ""],
    [/^from\\s+loguru\\s+import\\s+logger\\s*$/gm, "const logger = console;"],
    [/^from\\s+pydantic\\s+import\\s+.+$/gm, "import { z } from \\"zod\\";"],
    [/^from\\s+langchain_openai\\s+import\\s+ChatOpenAI\\s*$/gm, "import { ChatOpenAI } from \\"@langchain/openai\\";"],
    [/^from\\s+langchain\\.chat_models\\s+import\\s+init_chat_model\\s*$/gm, "import { ChatOpenAI } from \\"@langchain/openai\\";"],
    [/^from\\s+langchain\\.agents\\s+import\\s+create_agent\\s*$/gm, "import { createReactAgent } from \\"@langchain/langgraph/prebuilt\\";"],
    [/^from\\s+langchain_core\\.tools\\s+import\\s+tool\\s*$/gm, "import { tool } from \\"@langchain/core/tools\\";"],
    [/^from\\s+langchain\\.tools\\s+import\\s+tool\\s*$/gm, "import { tool } from \\"@langchain/core/tools\\";"],
    [/^from\\s+langchain_core\\.prompts\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/core/prompts\\";"],
    [/^from\\s+langchain_core\\.messages\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/core/messages\\";"],
    [/^from\\s+langchain_core\\.output_parsers\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/core/output_parsers\\";"],
    [/^from\\s+langchain_core\\.runnables\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/core/runnables\\";"],
    [/^from\\s+langgraph\\.graph\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/langgraph\\";"],
    [/^from\\s+langgraph\\.constants\\s+import\\s+(.+)$/gm, "import { $1 } from \\"@langchain/langgraph\\";"],
    [/^from\\s+langgraph\\.graph\\.message\\s+import\\s+add_messages\\s*$/gm, "import { messagesStateReducer as add_messages } from \\"@langchain/langgraph\\";"],
    [/^from\\s+langgraph\\.checkpoint\\.memory\\s+import\\s+InMemorySaver\\s*$/gm, "import { MemorySaver as InMemorySaver } from \\"@langchain/langgraph\\";"],
    [/^from\\s+fastapi\\s+import\\s+(.+)$/gm, "// FastAPI -> Next.js route handler / Hono / Fastify in TS"],
    [/\\bTrue\\b/g, "true"],
    [/\\bFalse\\b/g, "false"],
    [/\\bNone\\b/g, "null"],
    [/\\bself\\./g, "this."],
    [/print\\((.+)\\)/g, "console.log($1)"],
    [/logger\\.info\\((.+)\\)/g, "console.log($1)"],
    [/logger\\.warning\\((.+)\\)/g, "console.warn($1)"],
    [/logger\\.error\\((.+)\\)/g, "console.error($1)"],
    [/^async def\\s+([A-Za-z_][\\w]*)\\((.*)\\):\\s*$/gm, "async function $1($2) {"],
    [/^def\\s+([A-Za-z_][\\w]*)\\((.*)\\):\\s*$/gm, "function $1($2) {"],
    [/^class\\s+([A-Za-z_][\\w]*)\\(TypedDict\\):\\s*$/gm, "type $1 = {"],
    [/^class\\s+([A-Za-z_][\\w]*)\\(BaseModel\\):\\s*$/gm, "const $1Schema = z.object({"],
    [/^class\\s+([A-Za-z_][\\w]*):\\s*$/gm, "class $1 {"],
    [/^(\\s*)elif\\s+(.+):\\s*$/gm, "$1} else if ($2) {"],
    [/^(\\s*)else:\\s*$/gm, "$1} else {"],
    [/^(\\s*)if\\s+(.+):\\s*$/gm, "$1if ($2) {"],
    [/^(\\s*)for\\s+(.+)\\s+in\\s+(.+):\\s*$/gm, "$1for (const $2 of $3) {"],
    [/^(\\s*)while\\s+(.+):\\s*$/gm, "$1while ($2) {"],
    [/^(\\s*)try:\\s*$/gm, "$1try {"],
    [/^(\\s*)except\\s+Exception(?:\\s+as\\s+(\\w+))?:\\s*$/gm, (m, ind, name) => name ? `${ind}} catch (${name}) {` : `${ind}} catch {`],
    [/^(\\s*)except\\s+.+:\\s*$/gm, "$1} catch {"],
    [/^(\\s*)finally:\\s*$/gm, "$1} finally {"],
    [/: str\\b/g, ": string"],
    [/: int\\b/g, ": number"],
    [/: float\\b/g, ": number"],
    [/: bool\\b/g, ": boolean"],
    [/: list\\b/g, ": any[]"],
    [/: dict\\b/g, ": Record<string, any>"],
    [/List\\[(.+?)\\]/g, "$1[]"],
    [/Dict\\[(.+?),\\s*(.+?)\\]/g, "Record<$1, $2>"],
    [/Optional\\[(.+?)\\]/g, "$1 | null"],
    [/\\binit_chat_model\\(/g, "new ChatOpenAI("],
    [/\\bChatOpenAI\\(/g, "new ChatOpenAI("],
    [/\\bcreate_agent\\(/g, "createReactAgent("],
    [/\\bStateGraph\\(/g, "new StateGraph("],
    [/\\bmodel_provider\\s*=\\s*["']openai["']\\s*,?/g, ""],
    [/\\bapi_key\\s*=/g, "apiKey:"],
    [/\\bbase_url\\s*=/g, "configuration:{ baseURL:"],
    [/\\btemperature\\s*=/g, "temperature:"],
    [/\\bmax_tokens\\s*=/g, "maxTokens:"],
    [/^@tool\\s*$/gm, "// tool(...)"],
    [/^@mcp\\.tool\\(\\)\\s*$/gm, "// MCP tool"],
    [/(^|\\s)# (.*)$/gm, "$1// $2"],
    [/asyncio\\.run\\((.+)\\)/g, "await $1"],
  ];
  for (const [re, to] of reps) out = out.replace(re, to);
  out = out.replace(/f"([^"]*)"/g, (m, body) => "`" + body.replace(/\\{([^}]+)\\}/g, "${$1}") + "`");
  out = out.replace(/f'([^']*)'/g, (m, body) => "`" + body.replace(/\\{([^}]+)\\}/g, "${$1}") + "`");
  out = out.replace(/os\\.getenv\\((["'`])(.+?)\\1(?:,\\s*(["'`])(.*?)\\3)?\\)/g, (m, q1, key, q2, defv) => defv != null ? `(process.env.${key} ?? ${q2}${defv}${q2})` : `process.env.${key}`);
  out = out.replace(/"""([\\s\\S]*?)"""/g, "/* $1 */");
  out = out.replace(/'''([\\s\\S]*?)'''/g, "/* $1 */");
  // Keep and/or/not careful - only bare words outside identifiers is hard; do simple line-level ops
  out = out.replace(/\\band\\b/g, "&&");
  out = out.replace(/\\bor\\b/g, "||");
  if (!out.includes("[TS-PORT]")) {
    out = "// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.\\n" + out;
  }
  return out;
}

function convertMarkdown(md) {
  let count = 0;
  let out = md.replace(/```(?:python|py|ipython)\\s*\\n([\\s\\S]*?)```/gi, (_, body) => {
    count++;
    return "```typescript\\n" + convertPythonBody(body) + "\\n```";
  });
  out = out.replace(/```\\s*\\n([\\s\\S]*?)```/g, (full, body) => {
    if (/(?:^|\\n)\\s*(?:def |async def |from langchain|from langgraph|from fastapi|import os|print\\(|load_dotenv|@tool|class \\w+\\(TypedDict\\)|class \\w+\\(BaseModel\\))/.test(body)) {
      count++;
      return "```typescript\\n" + convertPythonBody(body) + "\\n```";
    }
    return full;
  });
  out = out.replace(/```python/gi, "```typescript");
  out = out.replace(/Python 示例/g, "TypeScript 示例");
  out = out.replace(/如下 Python 代码/g, "如下 TypeScript 代码");
  out = out.replace(/下面的 Python 代码/g, "下面的 TypeScript 代码");
  out = out.replace(/用 Python 实现/g, "用 TypeScript 实现");
  out = out.replace(/Python 版本/g, "TypeScript 版本");
  out = out.replace(/（Python）/g, "（TypeScript）");
  out = out.replace(/\\(Python\\)/g, "(TypeScript)");
  return { out, count };
}

function main() {
  const files = walk(BOOK);
  let total = 0, touched = 0;
  for (const file of files) {
    const md = fs.readFileSync(file, "utf8");
    const { out, count } = convertMarkdown(md);
    if (out !== md) {
      fs.writeFileSync(file, out, "utf8");
      touched++; total += count;
      console.log(count + "\\t" + path.relative(BOOK, file));
    }
  }
  console.log(JSON.stringify({ files: files.length, touched, convertedFences: total }, null, 2));
}

main();
