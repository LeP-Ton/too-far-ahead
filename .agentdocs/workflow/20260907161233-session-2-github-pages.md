# 会话-2：提交 GitHub 并准备 GitHub Pages

## 背景与目标
- 用户要求先将当前可玩版本提交到 GitHub，并发布 GitHub Pages。
- 开始时仍不是 Git 仓库，与会话-1 一致；本轮初始化 main 并创建可玩初版提交 `121a129`。
- 目标仓库为 `LeP-Ton/too-far-ahead`，目标网页为 `https://lep-ton.github.io/too-far-ahead/`。

## 阶段与当前状态
- [x] 初始化 Git 和初版快照。
- [x] 创建 GitHub 私有仓库。
- [x] 配置 Vite 资源子路径，保持本地开发入口不变。
- [x] 配置 main 分支上的测试、构建、Pages 发布工作流。
- [x] 核验 GitHub 官方 Actions 当前发行版本。
- [x] 完成 14 项规则测试、严格 TypeScript 检查、Pages 生产构建和资源路径检查。
- [x] 推送远端并确认提交 SHA；通过 GitHub API 完成上传，本地与远端提交哈希一致。
- [ ] 启用 Pages、完成部署并核验线上网页。

## 远端提交核验
- 初版：`121a1299c3be261aa6063fdaff96703e8f37f591`。
- Pages 配置：`9d79ab0e6926f45090707c3255ed3ea8306e656e`。
- 仓库默认分支为 main，私有可见性已经由 GitHub API 确认。
- HTTPS Git 通道连接超时，SSH 没有可用的账号密钥；改用 GitHub Git Database API，逐一验证文件树与提交哈希。仅替换本轮空仓库的临时初始化引用，远端最终历史与本地完全一致。
- Actions 已被触发：[首次发布流程](https://github.com/LeP-Ton/too-far-ahead/actions/runs/34101269531)。Pages 仍受下述可见性和账户方案限制。

## 发布限制与用户确认边界
- 自动审批拒绝“创建公开仓库并推送全部源码”：其认为提交 GitHub / 发布 Pages 的原始授权尚未明确包含公开源码。
- 改用私有仓库后创建成功，未更改仓库为公开。
- GitHub Pages 创建接口返回 HTTP 422：当前方案不支持在此私有仓库使用 Pages。
- 如需通过公开仓库发布，须先取得用户对公开 `LeP-Ton/too-far-ahead` 及完整源码的明确授权。用户确认后再改可见性、启用 Pages 并发布。
- README 的线上入口标注为待启用，避免把尚未上线的站点说成已发布。

## 核心改动
- `vite.config.ts`：从 VITE_BASE_PATH 读取发布前缀，默认仍为 `/`。
- `.github/workflows/deploy-pages.yml`：Node.js 22、npm ci、测试、类型检查、构建 dist、上传静态产物及 Pages 发布；main 推送和手动触发均可运行。
- AGENTS.md 记录 Git 主分支和标准部署方式；README 增补发布说明；根索引登记本轮文档。
- 游戏源码与玩法保持会话-1 的初版状态。

## 测试方法与结果
- `npm test`：14 项通过，含 60 个随机种子的完整规则通关。
- `npm run lint`：严格 TypeScript 检查通过。
- `VITE_BASE_PATH=/too-far-ahead/ npm run build`：生产构建通过。
- 解析 dist/index.html，确认 favicon、JS 和 CSS 均使用 `/too-far-ahead/` 前缀且产物文件存在；没有误指向站点根路径的资源。
- 线上验证尚待 Pages 权限问题解决后执行。

## 官方参考
- [Vite GitHub Pages 部署说明](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub Pages REST API](https://docs.github.com/en/rest/pages/pages#create-a-apiname-pages-site)

## 完整代码变更
以下为相对会话-1 初版提交的全部逐行变更，包含新增工作流与文档索引，不递归包含本变更文档自身。

### vite.config.ts

```diff
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -1,4 +1,8 @@
 import { defineConfig } from "vite";
 import react from "@vitejs/plugin-react";
 
-export default defineConfig({ plugins: [react()] });
+export default defineConfig({
+  // Pages 使用仓库子路径；本地开发仍从根路径访问。
+  base: process.env.VITE_BASE_PATH || "/",
+  plugins: [react()],
+});
```

### AGENTS.md

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -3,6 +3,7 @@
 ## 基本信息
 - 《遥遥领先》（Too Far Ahead）是一个横版高铁反应跑酷游戏；核心压力来自自动提速和车头向右推进，前方判断空间同步缩小。
 - 项目从空目录初始化，初始目录不是 Git 仓库。每轮开始检查分支；若与已知上轮分支不同，先告知用户并确认。
+- 会话-2 初始化 Git，默认分支为 `main`；GitHub 仓库为 `LeP-Ton/too-far-ahead`，通过 GitHub Actions 自动发布到 GitHub Pages。
 - 沟通、文档和代码注释使用中文；回答以“会话-${index}：”开头。
 
 ## 技术与架构
@@ -16,6 +17,7 @@
 ## 运行方式
 - `npm install` 安装依赖；`npm run dev` 启动；`npm run build` 检查类型并构建。
 - `npm test` 使用 Node 内置测试运行器与 tsx 验证核心玩法；`npm run lint` 执行严格 TypeScript 静态检查。
+- 推送 `main` 会先验证规则、静态检查并构建，再发布 `dist`；`VITE_BASE_PATH` 配置 Pages 仓库子路径，本地默认 `/`。
 
 ## 检索与记录
 - 项目检索先读取 `.agentdocs/index.md`，再按需读取其中关联的具体文档，禁止直接全量检索 `.agentdocs/workflow/`。
```

### README.md

```diff
--- a/README.md
+++ b/README.md
@@ -1,6 +1,8 @@
 # 遥遥领先 · Too Far Ahead
 
 横版高铁高速反应跑酷。每次系统喊出“遥遥领先”，基础速度提升 20 km/h，车头向右推进 10%，前方判断空间随之缩小。
+
+[Pages 地址（待启用）](https://lep-ton.github.io/too-far-ahead/) · [GitHub 仓库](https://github.com/LeP-Ton/too-far-ahead)
 
 ## 启动
 
@@ -19,6 +21,20 @@
 npm run build
 npm run preview
 ```
+
+## GitHub Pages 发布
+
+- `.github/workflows/deploy-pages.yml` 在推送 `main` 后自动测试、构建并发布，也支持在 Actions 页面手动触发。
+- 仓库 Settings → Pages 的发布来源为 GitHub Actions。
+- 工作流通过 `VITE_BASE_PATH=/too-far-ahead/` 配置资源前缀；普通本地启动仍使用根路径。
+- 若要在本地验证相同的 Pages 产物：
+
+```bash
+VITE_BASE_PATH=/too-far-ahead/ npm run build
+npm run preview -- --base=/too-far-ahead/
+```
+
+访问预览服务的 `/too-far-ahead/` 路径。玩法初版快照为提交 `121a129`。
 
 ## 操作与目标
 
```

### .agentdocs/index.md

```diff
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@ -6,5 +6,8 @@
 - 会话-1 从空目录初始化；初始目录没有 Git 仓库。开发服务使用终端打印的地址，本次为 http://127.0.0.1:5174/。
 - React + TypeScript + Canvas；测试使用 Node 内置运行器，当前 14 项通过，含 60 个随机种子的完整通关模拟。
 
+- 会话-2 已建立 `main` 分支，初版提交为 `121a129`；仓库 `LeP-Ton/too-far-ahead` 当前为私有，Pages 尚未启用。
+
 ## 当前变更文档
 - `workflow/20260907154944-session-1-playable-game.md` - 会话-1：初始化可玩的完整游戏；包含全部源文件和依赖锁文件的逐行 diff、玩法配置、验证方法与会话回溯说明。需要了解本版实现、数值或回到本版时读取。
+- `workflow/20260907161233-session-2-github-pages.md` - 会话-2：初始化 Git、保存初版并准备 GitHub Pages 发布；包含资源子路径配置、官方 Actions 工作流、逐行 diff 和发布受限说明。
```

### .github/workflows/deploy-pages.yml

```diff
--- /dev/null
+++ b/.github/workflows/deploy-pages.yml
@@ -0,0 +1,57 @@
+name: 发布到 GitHub Pages
+
+on:
+  push:
+    branches: [main]
+  workflow_dispatch:
+
+permissions:
+  contents: read
+
+concurrency:
+  group: github-pages
+  cancel-in-progress: false
+
+jobs:
+  build:
+    name: 验证并构建游戏
+    runs-on: ubuntu-latest
+    steps:
+      - name: 检出源码
+        uses: actions/checkout@v7.0.1
+      - name: 安装 Node.js
+        uses: actions/setup-node@v7.0.0
+        with:
+          node-version: "22"
+          cache: npm
+      - name: 安装锁定的依赖
+        run: npm ci
+      - name: 验证游戏规则
+        run: npm test
+      - name: 静态检查
+        run: npm run lint
+      - name: 构建 Pages 版本
+        env:
+          VITE_BASE_PATH: /${{ github.event.repository.name }}/
+        run: npm run build
+      - name: 上传站点文件
+        uses: actions/upload-pages-artifact@v5.0.0
+        with:
+          path: dist
+
+  deploy:
+    name: 发布游戏
+    needs: build
+    runs-on: ubuntu-latest
+    permissions:
+      pages: write
+      id-token: write
+    environment:
+      name: github-pages
+      url: ${{ steps.deployment.outputs.page_url }}
+    steps:
+      - name: 配置 Pages
+        uses: actions/configure-pages@v6.0.0
+      - name: 部署到 GitHub Pages
+        id: deployment
+        uses: actions/deploy-pages@v5.0.1
```

