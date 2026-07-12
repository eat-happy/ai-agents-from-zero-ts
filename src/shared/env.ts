import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing env ${name}. Copy .env.example to .env and set your API key / model.`,
    );
  }
  return value;
}

export const env = {
  apiKey: required("OPENAI_API_KEY"),
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  model: process.env.OPENAI_MODEL || "qwen-plus",
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
};

export function printRunHeader(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}