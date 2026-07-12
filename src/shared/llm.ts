import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { env } from "./env.js";

/** Create a chat model via OpenAI-compatible API (DashScope / DeepSeek / OpenAI / ...). */
export function createChatModel(temperature = 0) {
  return new ChatOpenAI({
    apiKey: env.apiKey,
    model: env.model,
    temperature,
    configuration: env.baseURL ? { baseURL: env.baseURL } : undefined,
  });
}

/** Create embeddings via OpenAI-compatible API. */
export function createEmbeddings() {
  return new OpenAIEmbeddings({
    apiKey: env.apiKey,
    model: env.embeddingModel,
    configuration: env.baseURL ? { baseURL: env.baseURL } : undefined,
  });
}