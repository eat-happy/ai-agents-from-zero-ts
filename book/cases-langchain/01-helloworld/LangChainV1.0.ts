/**
 * 【精校可运行】LangChain HelloWorld（对应第 10 章）
 * 原 Python: LangChainV1.0.py
 *
 * 运行（仓库根目录）:
 *   npx tsx book/cases-langchain/01-helloworld/LangChainV1.0.ts
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

function createModel(model: string, apiKeyEnv: string) {
  const apiKey = process.env[apiKeyEnv] || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(`缺少 API Key：请设置 ${apiKeyEnv} 或 OPENAI_API_KEY`);
  }
  return new ChatOpenAI({
    model,
    apiKey,
    temperature: 0.2,
    configuration: {
      baseURL:
        process.env.OPENAI_BASE_URL ||
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
  });
}

async function main() {
  // 统一用 OpenAI 兼容接口（百炼 / DeepSeek / OpenAI 等）
  const model = createModel(process.env.OPENAI_MODEL || "qwen-plus", "OPENAI_API_KEY");
  const res = await model.invoke("你是谁？用两句话自我介绍。");
  console.log(res.content);
  console.log("*".repeat(50));

  // 演示：同一套写法可切换模型名（若你的网关支持）
  const model2Name = process.env.OPENAI_MODEL_2 || process.env.OPENAI_MODEL || "qwen-plus";
  const model2 = createModel(model2Name, "OPENAI_API_KEY");
  const res2 = await model2.invoke("你是谁？用一句话回答。");
  console.log(res2.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});