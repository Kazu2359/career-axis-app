import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // /home/mount直下に無関係なpackage-lock.json(n8n-mcp用)があり、
  // Turbopackがワークスペースルートを誤検出するため明示的に固定する
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
