/**
 * 【精校可运行】RAG 最小闭环（第 18-19 章）
 * 原 Python: EmbeddingRagLLM.py 教学意图
 *
 *   npx tsx book/cases-langchain/10-rag/EmbeddingRagLLM.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createChatModel, createEmbeddings } from "../../../src/shared/llm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // 优先用仓库教学文档；不存在则内置一段
  let raw = [
    "差旅报销：火车票/机票可报，需发票；市内交通单日上限 100 元。",
    "年假每年 5 天；事假需主管审批。",
    "Agent 开发推荐 TypeScript + LangGraph.js。",
  ].join("\n");
  try {
    raw = readFileSync(join(__dirname, "../../../data/company-faq.md"), "utf8");
  } catch {
    // keep fallback
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 40,
  });
  const docs = await splitter.createDocuments([raw]);
  const store = await MemoryVectorStore.fromDocuments(docs, createEmbeddings());
  const retriever = store.asRetriever({ k: 3 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是企业知识库助手。仅依据上下文回答；不知道就说不知道。\n\n上下文:\n{context}",
    ],
    ["human", "{question}"],
  ]);

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const hits = await retriever.invoke(input.question);
        return hits.map((d, i) => `[#${i + 1}] ${d.pageContent}`).join("\n\n");
      },
      question: new RunnablePassthrough<{ question: string }>().pipe(
        (x) => x.question,
      ),
    },
    prompt,
    createChatModel(0),
    new StringOutputParser(),
  ]);

  const question =
    process.argv.slice(2).join(" ") || "差旅报销有什么规则？市内交通上限？";
  console.log("[question]", question);
  console.log("[answer]", await chain.invoke({ question }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});