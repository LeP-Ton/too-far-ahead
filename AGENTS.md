# 项目认知与协作约定

## 基本信息
- 《遥遥领先》（Too Far Ahead）是一个横版高铁反应跑酷游戏；核心压力来自自动提速和车头向右推进，前方判断空间同步缩小。
- 项目从空目录初始化，初始目录不是 Git 仓库。每轮开始检查分支；若与已知上轮分支不同，先告知用户并确认。
- 沟通、文档和代码注释使用中文；回答以“会话-${index}：”开头。

## 技术与架构
- React + TypeScript + Vite；Canvas 2D 渲染游戏，React 渲染操作面板。
- `src/game/config.ts` 集中定义速度阶段和时间参数。
- `src/game/engine.ts` 管理确定性状态更新、变道、制动、领先、信号和碰撞，与浏览器渲染解耦。
- `src/game/renderer.ts` 绘制多层视差铁路世界；`src/game/audio.ts` 提供 Web Audio 合成反馈。
- `src/App.tsx` 连接游戏循环、键盘/触屏输入、暂停和结算。
- 障碍波次必须给出提前信号、保留可达安全轨道，并避开提速的镜头移动窗口。

## 运行方式
- `npm install` 安装依赖；`npm run dev` 启动；`npm run build` 检查类型并构建。
- `npm test` 使用 Node 内置测试运行器与 tsx 验证核心玩法；`npm run lint` 执行严格 TypeScript 静态检查。

## 检索与记录
- 项目检索先读取 `.agentdocs/index.md`，再按需读取其中关联的具体文档，禁止直接全量检索 `.agentdocs/workflow/`。
- 每轮代码变更在 `.agentdocs/workflow/` 新建带 `YYYYMMDDHHmmss` 时间前缀的 Markdown 文档，记录所有代码行的完整 diff，并更新根索引。
- 只有整体架构与核心认知改变才更新本文件；需求细节留在变更文档。
- 每轮包含代码变更的最终回复总结测试方法；不覆盖用户已有变更。
