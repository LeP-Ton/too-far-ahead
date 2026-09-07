import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Pages 使用仓库子路径；本地开发仍从根路径访问。
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
});
