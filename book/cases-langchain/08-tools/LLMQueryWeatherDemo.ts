/**
 * 【精校可运行】天气助手完整链路（第 17 章）
 * 原 Python: LLMQueryWeatherDemo.py
 *
 * 现代写法：bindTools → tool_calls → 执行工具 → ToolMessage → 再生成自然语言
 *
 *   npx tsx book/cases-langchain/08-tools/LLMQueryWeatherDemo.ts
 */
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { createChatModel } from "../../../src/shared/llm.js";
import { getWeather } from "./QueryWeatherTool.js";

async function main() {
  const llm = createChatModel(0);
  const llmWithTools = llm.bindTools([getWeather]);

  const question = process.argv.slice(2).join(" ") || "请问北京今天的天气如何？";
  console.log("[user]", question);

  const ai1 = await llmWithTools.invoke([new HumanMessage(question)]);
  console.log("[model content]", ai1.content);
  console.log("[tool_calls]", JSON.stringify(ai1.tool_calls, null, 2));

  if (!ai1.tool_calls?.length) {
    console.log("模型未触发工具（可能模型不支持 tool calling 或问题不需要工具）");
    return;
  }

  const toolMessages: ToolMessage[] = [];
  for (const call of ai1.tool_calls) {
    if (call.name !== "get_weather") continue;
    const observation = await getWeather.invoke(call.args as { city: string });
    toolMessages.push(
      new ToolMessage({
        content: String(observation),
        tool_call_id: call.id ?? call.name,
      }),
    );
  }

  const final = await llm.invoke([
    new HumanMessage(question),
    ai1 as AIMessage,
    ...toolMessages,
    new HumanMessage("请把上面的天气 JSON 转成简洁中文描述给用户。"),
  ]);
  console.log("\n[final]\n", final.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});