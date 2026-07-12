/**
 * Maps to: 案例与源码-2-LangChain框架/08-tools
 * Python refs: Tool_AddNumberTool.py, QueryWeatherTool.py, LLMQueryWeatherDemo.py
 */
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel } from "../../src/shared/llm.js";
import { addNumberTool, getWeatherTool } from "../../src/shared/tools.js";
import { printRunHeader } from "../../src/shared/env.js";

async function demoDirectToolCall() {
  printRunHeader("07-tools | direct tool invoke");
  const sum = await addNumberTool.invoke({ a: 12, b: 30 });
  console.log("add_number(12,30) =>", sum);
  const weather = await getWeatherTool.invoke({ city: "北京" });
  console.log("get_weather(北京) =>", weather);
}

async function demoModelChoosesTool() {
  printRunHeader("07-tools | model tool calling");
  const model = createChatModel(0).bindTools([addNumberTool, getWeatherTool]);
  const ai = await model.invoke([
    new HumanMessage("帮我算 19+23，再查一下上海天气。"),
  ]);

  console.log("content:", ai.content);
  console.log("tool_calls:", JSON.stringify(ai.tool_calls, null, 2));

  if (!ai.tool_calls?.length) {
    console.log("Model did not request tools (provider/model may differ).");
    return;
  }

  for (const call of ai.tool_calls) {
    let output: string;
    if (call.name === "add_number") {
      output = String(await addNumberTool.invoke(call.args as { a: number; b: number }));
    } else if (call.name === "get_weather") {
      output = String(await getWeatherTool.invoke(call.args as { city: string }));
    } else {
      continue;
    }
    console.log(`\nexecuted ${call.name}(${JSON.stringify(call.args)}) =>`, output);
  }
}

async function main() {
  await demoDirectToolCall();
  await demoModelChoosesTool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});