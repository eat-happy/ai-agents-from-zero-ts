import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep tracing rooted at this app, not the monorepo parent lockfile.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;