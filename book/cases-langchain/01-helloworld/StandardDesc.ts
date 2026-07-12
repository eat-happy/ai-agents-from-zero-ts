/**
 * 【精校可运行】企业级封装：统一读 env 创建模型
 * 原 Python: StandardDesc.py 教学意图
 */
import "dotenv/config";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../../../src/shared/llm.js";

async function main() {
  const model = createChatModel(0.2);
  const res = await model.invoke([
    new SystemMessage("你是简洁的中文助教。"),
    new HumanMessage("用三句话说明：为什么 Agent 需要 Tool Calling？"),
  ]);
  console.log(res.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});