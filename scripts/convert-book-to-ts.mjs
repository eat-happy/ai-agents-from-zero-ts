#!/usr/bin/env node
/**
 * Convert original Python-oriented Chinese tutorial markdown/code into TypeScript track.
 * Strategy:
 * - Keep Chinese prose
 * - Rewrite code fences (python -> typescript) with common API mappings
 * - Generate .ts siblings for .py case files
 * - Annotate chapters with TypeScript track banner
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BOOK = path.join(ROOT, "book");

const textReplacements = [
  [/Python 调用/g, "TypeScript / Node.js 调用"],
  [/python 调用/g, "TypeScript / Node.js 调用"],
  [/用 Python/g, "用 TypeScript"],
  [/基于 Python/g, "基于 TypeScript"],
  [/Python 生态/g, "TypeScript / Node.js 生态"],
  [/Python 技术栈/g, "TypeScript 技术栈"],
  [/pip install/g, "npm install"],
  [/from dotenv import load_dotenv/g, 'import "dotenv/config"'],
  [/load_dotenv\(\)/g, "// dotenv/config loaded"],
  [/load_dotenv\(encoding=["']utf-8["']\)/g, "// dotenv/config loaded"],
  [/os\.getenv\((["'`])(.+?)\1\)/g, "process.env.$2"],
  [/import os\n/g, ""],
  [/from typing import .+\n/g, ""],
  [/from typing_extensions import .+\n/g, ""],
  [/print\((.+)\)/g, "console.log($1)"],
  [/True/g, "true"],
  [/False/g, "false"],
  [/None/g, "null"],
  [/elif /g, "else if "],
  [/except Exception as e:/g, "catch (e) {"],
  [/except Exception:/g, "catch {"],
  [/raise ValueError\((.+)\)/g, "throw new Error($1)"],
  [/raise RuntimeError\((.+)\)/g, "throw new Error($1)"],
  [/def ([a-zA-Z_][\w]*)\((.*)\):\s*$/gm, "function $1($2) {"],
  [/async def ([a-zA-Z_][\w]*)\((.*)\):\s*$/gm, "async function $1($2) {"],
  [/class ([A-Za-z_][\w]*)\(TypedDict\):/g, "type $1 = {"],
  [/class ([A-Za-z_][\w]*):/g, "class $1 {"],
  [/@tool\n/g, "// tool\n"],
  [/from langchain_core\.tools import tool/g, 'import { tool } from "@langchain/core/tools"'],
  [/from langchain_openai import ChatOpenAI/g, 'import { ChatOpenAI } from "@langchain/openai"'],
  [/from langchain\.chat_models import \(\s*init_chat_model,\s*\)/g, 'import { ChatOpenAI } from "@langchain/openai"'],
  [/from langchain\.chat_models import init_chat_model/g, 'import { ChatOpenAI } from "@langchain/openai"'],
  [/from langchain\.agents import create_agent/g, 'import { createReactAgent } from "@langchain/langgraph/prebuilt"'],
  [/from langgraph\.graph import StateGraph, START, END/g, 'import { StateGraph, START, END, Annotation } from "@langchain/langgraph"'],
  [/from langgraph\.graph import StateGraph/g, 'import { StateGraph, Annotation } from "@langchain/langgraph"'],
  [/from langgraph\.constants import START, END/g, 'import { START, END } from "@langchain/langgraph"'],
  [/init_chat_model\(/g, "new ChatOpenAI("],
  [/model_provider\s*=\s*["']openai["']\s*,?/g, ""],
  [/api_key\s*=/g, "apiKey:"],
  [/base_url\s*=/g, "configuration: { baseURL:"],
  [/temperature\s*=/g, "temperature:"],
  [/max_tokens\s*=/g, "maxTokens:"],
  [/ChatOpenAI\(/g, "new ChatOpenAI("],
  [/create_agent\(/g, "createReactAgent("],
  [/AgentExecutor/g, "/* AgentExecutor -> createReactAgent graph */"],
  [/create_tool_calling_agent/g, "createReactAgent"],
  [/RunnableWithMessageHistory/g, "/* message history wrapper */"],
  [/Pydantic/g, "Zod"],
  [/pydantic/g, "zod"],
  [/FastAPI/g, "Next.js / Hono / Fastify"],
  [/fastapi/g, "Next.js route handler"],
  [/uvicorn/g, "node server"],
  [/asyncio\.run\(/g, "await ("],
  [/async for (.+) in (.+):/g, "for await (const $1 of $2) {"],
  [/for (.+) in (.+):/g, "for (const $1 of $2) {"],
  [/if (.+):\s*$/gm, "if ($1) {"],
  [/else:\s*$/gm, "else {"],
  [/\.invoke\(([^)]+)\)\.content/g, ".invoke($1).then(r => r.content) /* prefer await */"],
  [/f"([^"]*)"/g, "`$1`"],
  [/f'([^']*)'/g, "`$1`"],
  [/"""([\s\S]*?)"""/g, "/* $1 */"],
  [/'''([\s\S]*?)'''/g, "/* $1 */"],
  [/# (.*)$/gm, "// $1"],
  [/（Python\)/g, "（TypeScript）"],
  [/\(Python\)/g, "(TypeScript)"],
  [/Python 版/g, "TypeScript 版"],
  [/python 版/g, "TypeScript 版"],
  [/LangChain 的 Python/g, "LangChain.js / TypeScript"],
  [/LangGraph 的 Python/g, "LangGraph.js / TypeScript"],
];

const fenceLangMap = {
  python: "typescript",
  py: "typescript",
  ipython: "typescript",
  shell: "bash",
};

function convertCodeBody(code) {
  let out = code;
  // common import block rewrite first
  out = out.replace(
    /from langchain_core\.prompts import ChatPromptTemplate/g,
    'import { ChatPromptTemplate } from "@langchain/core/prompts"',
  );
  out = out.replace(
    /from langchain_core\.messages import ([^\n]+)/g,
    'import { $1 } from "@langchain/core/messages"',
  );
  out = out.replace(
    /from langchain_core\.output_parsers import ([^\n]+)/g,
    'import { $1 } from "@langchain/core/output_parsers"',
  );
  out = out.replace(
    /from langchain_core\.runnables import ([^\n]+)/g,
    'import { $1 } from "@langchain/core/runnables"',
  );
  for (const [re, to] of textReplacements) {
    out = out.replace(re, to);
  }
  // strip leftover python-only decorators remnants
  out = out.replace(/@mcp\.tool\(\)\s*\n/g, "// MCP tool\n");
  out = out.replace(/@mcp\.resource\([^\)]*\)\s*\n/g, "// MCP resource\n");
  out = out.replace(/@mcp\.prompt\(\)\s*\n/g, "// MCP prompt\n");
  // very rough: convert self.x to this.x
  out = out.replace(/\bself\./g, "this.");
  // convert dict-like TypedDict fields "x: str" already partially handled
  out = out.replace(/: str\b/g, ": string");
  out = out.replace(/: int\b/g, ": number");
  out = out.replace(/: float\b/g, ": number");
  out = out.replace(/: bool\b/g, ": boolean");
  out = out.replace(/: list\b/g, ": any[]");
  out = out.replace(/: dict\b/g, ": Record<string, any>");
  out = out.replace(/List\[(.+?)\]/g, "$1[]");
  out = out.replace(/Dict\[(.+?),\s*(.+?)\]/g, "Record<$1, $2>");
  out = out.replace(/Optional\[(.+?)\]/g, "$1 | null");
  // add note for imperfect auto conversion
  if (!out.includes("[TS-PORT]")) {
    out =
      "// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读\n" +
      out;
  }
  return out;
}

function convertMarkdown(md, relPath) {
  let out = md;

  // rewrite case include links from .py to .ts
  out = out.replace(
    /案例与源码-2-LangChain框架\//g,
    "cases-langchain/",
  );
  out = out.replace(
    /案例与源码-3-LangGraph框架\//g,
    "cases-langgraph/",
  );
  out = out.replace(
    /案例与源码-1-Coze&Dify工作流智能体\//g,
    "cases-coze-dify/",
  );
  out = out.replace(/实战项目-电商问数\//g, "projects/shop-query/");
  out = out.replace(/实战项目-深度研搜\//g, "projects/deep-research/");
  out = out.replace(/\.py(\s|"|#|\))/g, ".ts$1");
  out = out.replace(/\.py`/g, ".ts`");

  // convert fenced code blocks
  out = out.replace(
    /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,
    (full, lang, body) => {
      const l = (lang || "").toLowerCase();
      if (["python", "py", "ipython", ""].includes(l) && /def |import |print\(|from |class |@tool|ChatOpenAI|init_chat_model/.test(body)) {
        return "```typescript\n" + convertCodeBody(body) + "\n```";
      }
      if (fenceLangMap[l]) {
        if (l === "python" || l === "py" || l === "ipython") {
          return "```typescript\n" + convertCodeBody(body) + "\n```";
        }
        return "```" + fenceLangMap[l] + "\n" + body + "\n```";
      }
      // bare fences that look like python
      if (!l && /def |import |print\(|from langchain|from langgraph/.test(body)) {
        return "```typescript\n" + convertCodeBody(body) + "\n```";
      }
      return full;
    },
  );

  // prose replacements outside code (already applied partially via whole-file)
  for (const [re, to] of [
    [/Python 调用/g, "TypeScript / Node.js 调用"],
    [/pip install/g, "npm install"],
    [/PyCharm/g, "VS Code / WebStorm"],
    [/虚拟环境（venv\/conda）/g, "Node.js 环境（nvm / fnm）"],
    [/requirements\.txt/g, "package.json"],
    [/本教程主线聚焦 \*\*Python \+ LangChain \+ LangGraph\*\*/g, "本 TypeScript 版主线聚焦 **TypeScript + LangChain.js + LangGraph.js**"],
    [/聚焦 Python 生态/g, "聚焦 TypeScript / Node.js 生态"],
  ]) {
    out = out.replace(re, to);
  }

  // banner after first title
  if (!out.includes("<!-- TS-TRACK-BANNER -->")) {
    const banner =
      "\n\n<!-- TS-TRACK-BANNER -->\n" +
      "> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js**。\n" +
      "> 可运行精校示例见仓库根目录 `examples/` 与 `apps/shop-query-agent/`。自动迁移的代码块若与最新 SDK API 有差异，以可运行示例为准。\n\n";
    out = out.replace(/^(# .+\r?\n)/m, `$1${banner}`);
  }

  // chapter 4/5 titles style
  if (relPath.includes("4-Python调用Dify") || /4-.*Dify/.test(relPath)) {
    out = out.replace(/^# .+/m, "# 第 4 章 TypeScript / Node.js 调用 Dify 平台工作流");
  }
  if (relPath.includes("5-Python调用Coze") || /5-.*Coze/.test(relPath)) {
    out = out.replace(/^# .+/m, "# 第 5 章 TypeScript / Node.js 调用 Coze 平台工作流");
  }

  return out;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function ensureTsFromPy(pyPath) {
  const tsPath = pyPath.replace(/\.py$/i, ".ts");
  const raw = fs.readFileSync(pyPath, "utf8");
  const converted = convertCodeBody(raw);
  const header =
    "/**\n" +
    " * Auto-ported from Python case for TypeScript track.\n" +
    ` * Source: ${path.relative(BOOK, pyPath).replace(/\\/g, "/")}\n` +
    " * Prefer the curated runnable examples under /examples when APIs differ.\n" +
    " */\n\n";
  fs.writeFileSync(tsPath, header + converted, "utf8");
  return tsPath;
}

function main() {
  const files = walk(BOOK);
  let mdCount = 0;
  let pyCount = 0;
  let tsCount = 0;

  for (const file of files) {
    if (file.endsWith(".md")) {
      const rel = path.relative(BOOK, file);
      const md = fs.readFileSync(file, "utf8");
      const next = convertMarkdown(md, rel);
      fs.writeFileSync(file, next, "utf8");
      mdCount++;
    } else if (file.endsWith(".py")) {
      ensureTsFromPy(file);
      pyPathNote(file);
      pyCount++;
      tsCount++;
    }
  }

  // write conversion report
  const report = [
    "# TypeScript 全书迁移报告",
    "",
    `- 处理 Markdown 章节：${mdCount}`,
    `- 由 Python 生成 TypeScript 案例：${tsCount}`,
    `- 原 Python 文件保留（便于对照）：${pyCount}`,
    "",
    "## 迁移策略",
    "",
    "1. **中文正文**：保留原教程讲解，仅替换 Python 技术栈表述为 TypeScript / Node.js。",
    "2. **代码块**：` ```python ` 自动迁移为 ` ```typescript `，并映射常见 LangChain/LangGraph API。",
    "3. **案例源码**：每个 `.py` 生成同名 `.ts`；精校可运行版本在仓库 `examples/`。",
    "4. **低代码章节**（Coze/Dify）：平台操作与语言无关，正文保留，调用章改为 Node fetch/SDK。",
    "5. **微调章**：训练侧仍以 Python 生态为主，文中标注；推理/接入侧用 TS。",
    "",
    "## 建议阅读顺序",
    "",
    "先读 `book/README.md` 与 `book/教程目录大纲.md`，再按 `_sidebar.md` 目录学。",
    "代码以 `examples/01..14` 与 `apps/shop-query-agent` 为准做练习。",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(BOOK, "TS迁移说明.md"), report, "utf8");
  console.log(JSON.stringify({ mdCount, pyCount, tsCount }, null, 2));
}

function pyPathNote(pyPath) {
  // leave python files; optional marker file
  const note = pyPath + ".README-TS.txt";
  fs.writeFileSync(
    note,
    "This Python file is kept for comparison. Prefer the sibling .ts file and /examples curated demos.\n",
    "utf8",
  );
}

main();