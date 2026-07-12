/**
 * Maps to: 案例与源码-2-LangChain框架/09-embedding + 10-rag
 * Course chapters 18-19
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createChatModel, createEmbeddings } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatDocs(docs: Document[]) {
  return docs.map((d, i) => `[#${i + 1}] ${d.pageContent}`).join("\n\n");
}

async function main() {
  printRunHeader("08-embedding-rag | local docs RAG");

  const raw = readFileSync(join(__dirname, "../../data/company-faq.md"), "utf8");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 40,
  });
  const docs = await splitter.createDocuments([raw]);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    createEmbeddings(),
  );
  const retriever = vectorStore.asRetriever({ k: 3 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是企业知识库助手。仅依据提供的上下文回答；不知道就说不知道，并建议联系 HR。\n\n上下文:\n{context}",
    ],
    ["human", "{question}"],
  ]);

  const ragChain = RunnableSequence.from([
    {
      context: async (input: { question: string }) =>
        formatDocs(await retriever.invoke(input.question)),
      question: new RunnablePassthrough<{ question: string }>().pipe(
        (input) => input.question,
      ),
    },
    prompt,
    createChatModel(0),
    new StringOutputParser(),
  ]);

  const question = "差旅报销有什么规则？市内交通上限是多少？";
  console.log("[question]", question);
  const answer = await ragChain.invoke({ question });
  console.log("\n[answer]\n", answer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});