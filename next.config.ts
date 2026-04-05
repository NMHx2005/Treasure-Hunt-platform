import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

const rootDir = process.cwd();
// Next không ghi đè biến môi trường đã tồn tại (kể cả chuỗi rỗng). Một số môi trường/Firebase CLI
// có thể để NEXT_PUBLIC_*=""; xóa rỗng để file .env / .env.production được áp dụng khi build.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("NEXT_PUBLIC_") && process.env[key] === "") {
    delete process.env[key];
  }
}
loadEnvConfig(rootDir);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/**" }],
  },
};

export default nextConfig;
