/**
 * 【精校可运行】内存多轮历史（第 16 章）
 * 原 Python: Memory_InMemoryChatMessageHistory.py 教学意图
 *
 *   npx tsx book/cases-langchain/07-memory/Memory_InMemoryChatMessageHistory.ts
 */
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { createChatModel } from "../../../src/shared/llm.js";

class InMemoryChatHistory {
  private store = new Map<string, BaseMessage[]>();
  get(sessionId: string) {
    return this.store.get(sessionId) ?? [];
  }
  append(sessionId: string, messages: BaseMessage[]) {
    this.store.set(sessionId, [...this.get(sessionId), ...messages]);
  }
}

async function chat(
  history: InMemoryChatHistory,
  sessionId: string,
  text: string,
) {
  const model = createChatModel(0.2);
  const messages: BaseMessage[] = [
    new SystemMessage("你是有记忆的助教，请结合历史对话回答。"),
    ...history.get(sessionId),
    new HumanMessage(text),
  ];
  const ai = await model.invoke(messages);
  history.append(sessionId, [
    new HumanMessage(text),
    new AIMessage(String(ai.content)),
  ]);
  return String(ai.content);
}

async function main() {
  const history = new InMemoryChatHistory();
  const sid = "user-001";
  console.log(await chat(history, sid, "我叫小林，我在学 TypeScript Agent。"));
  console.log("---");
  console.log(await chat(history, sid, "还记得我的名字和在学什么吗？"));
  console.log("history size =", history.get(sid).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});