/**
 * Maps to: 案例与源码-2-LangChain框架/07-memory
 * Python refs: Memory_InMemoryChatMessageHistory.py, Memory_RunnableWithMessageHistory*.py
 *
 * JS/TS approach: keep an in-memory message list (same teaching goal as chat history).
 * Redis variants are documented in docs/MAPPING.md for production follow-up.
 */
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { printRunHeader } from "../../src/shared/env.js";

class InMemoryChatHistory {
  private store = new Map<string, BaseMessage[]>();

  get(sessionId: string): BaseMessage[] {
    return this.store.get(sessionId) ?? [];
  }

  append(sessionId: string, messages: BaseMessage[]) {
    const prev = this.get(sessionId);
    this.store.set(sessionId, [...prev, ...messages]);
  }
}

async function chat(sessionId: string, history: InMemoryChatHistory, text: string) {
  const model = createChatModel(0.2);
  const messages: BaseMessage[] = [
    new SystemMessage("你是有记忆的助教。请结合历史对话回答。"),
    ...history.get(sessionId),
    new HumanMessage(text),
  ];
  const ai = await model.invoke(messages);
  history.append(sessionId, [new HumanMessage(text), new AIMessage(String(ai.content))]);
  return String(ai.content);
}

async function main() {
  printRunHeader("06-memory | multi-turn chat history");
  const history = new InMemoryChatHistory();
  const sessionId = "user-001";

  const a1 = await chat(sessionId, history, "我叫小林，我在学 TypeScript Agent。");
  console.log("\n[round1]", a1);

  const a2 = await chat(sessionId, history, "还记得我的名字和在学什么吗？");
  console.log("\n[round2]", a2);

  console.log("\n[history size]", history.get(sessionId).length, "messages");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});