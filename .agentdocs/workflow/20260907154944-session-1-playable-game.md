# 会话-1：《遥遥领先》完整可玩版本

## 背景与目标
- 从空目录创建 React + TypeScript + Canvas 单人小游戏，完成“发车 → 阅读信号 → 变轨 / 制动 → 自动领先 → 碰撞结算 / 固定通关 → 重开”的闭环。
- 核心机制是系统自动提速，同时车头向右推进，持续压缩前方判断空间。
- 初始目录不是 Git 仓库，无上轮分支可比较；未创建提交。初始化 AGENTS.md、CLAUDE.md 和文档索引。

## 约束与原则
- 规则与渲染分离，不引入完整游戏引擎和额外测试框架。
- 采用三条横向轨道，变道具有耗时和锁定，制动不能永久降低基础速度。
- 不提供无尽模式、联网、养成、商店或排行榜。
- 障碍生成必须保留可达安全出口，提速前留出清场窗口。

## 阶段与 TODO
- [x] 初始化最小运行项目和项目认知文档。
- [x] 实现六档领先、缓动车头、变轨锁定、制动、碰撞和胜利条件。
- [x] 实现施工、慢车、异物、道岔与绑定的提前信号。
- [x] 实现视差夜景、三轨铁路、高铁、光效、合成音效、开始 / 暂停 / 结算界面。
- [x] 支持键盘、底部触屏按钮、音效切换、操作指南和全屏入口。
- [x] 通过规则测试、严格类型检查和生产构建，执行浏览器基本交互与布局检查。
- [x] 记录完整逐行 diff，更新索引。

## 关键实现与参数
| 速度 | 车头位置 | 实体反应窗口 | 变道耗时 |
| --- | --- | --- | --- |
| 250 km/h | 10% | 2.8 秒 | 0.48 秒 |
| 270 km/h | 20% | 2.3 秒 | 0.54 秒 |
| 290 km/h | 30% | 2.0 秒 | 0.60 秒 |
| 310 km/h | 40% | 1.7 秒 | 0.66 秒 |
| 330 km/h | 50% | 1.4 秒 | 0.72 秒 |
| 350 km/h | 60% | 1.1 秒 | 0.78 秒 |

- 领先触发为 15–30 秒随机间隔，前 2 秒播放三拍倒计时；推进动画 0.85 秒。
- 最后一档窗口从初稿 1.15 秒调整为 1.1 秒，确保场景相对滚动速度逐档增加，仍在需求允许区间。
- 制动持续 0.8 秒，相对速度乘以 0.38，冷却 3 秒；恢复当前阶段基础速度。
- 信号额外提前 1.45 秒出现，生成时实体还在屏外；推荐出口只在相邻轨道，且校验剩余变道时间和 0.8 秒思考余量。
- 当前未通过波次最多一个，避免组合造成死路；有未通过波次时不推进车头。
- 物理更新细分到不超过 1/120 秒，碰撞采用扫掠区间，变道期间保守占用起始和目标轨。
- 极限反应只在最后时刻发起避让且成功通过后计数；失败尝试不计入。
- 离开页面自动暂停；恢复需要主动确认。焦点切换使用 preventScroll，防止操作导致页面滚动。
- 游戏只使用本地计算，音效无需下载；字体有系统回退，首次加载可选 Google Fonts。

## 验证结果与方法
### TC-001 核心规则与完整通关
- 类型：自动化功能测试；优先级：高。
- 方法：执行 `npm test`。
- 结果：14 项全部通过。覆盖起始参数、变道连续性和锁定、制动恢复、提前预警、车头缓动、速度单调性、信号提前量、碰撞、低帧率穿透、极限反应、暂停、重开以及高速安全余量。
- 其中 60 个随机种子通过正常信号和正式变道接口，保留碰撞检测，完成全部六档并在 350 km/h 下生存 60 秒；部分局持续制动以覆盖清场与延期边界。

### TC-002 静态检查与生产构建
- 方法：`npm run lint` 和 `npm run build`。
- 结果：严格 TypeScript 检查与 Vite 生产构建通过。
- 说明：lint 脚本为严格 TypeScript 静态检查，不宣称集成 ESLint。测试命令改用 `node --import tsx --test`，避免 tsx CLI 的 IPC 管道依赖。

### TC-003 浏览器真实交互
- 方法：在本地页面依次发车、W 上移、Space 制动、等待碰撞、重开、P 暂停。
- 结果：制动时页面显示 95 km/h、基础速度保持 250；变道锁定提示正常；碰撞显示完整结算；重开恢复初始值；暂停面板显示继续入口；浏览器控制台无错误与警告。
- 边界：浏览器未人工驾驶完成整局；完整胜利链通过 TC-001 的真实规则模拟验证。连续实时避让的工具等待受调用时延影响，不作为已通过的浏览器测试记录。

### TC-004 视口与触屏按钮
- 方法：检查 1280×720 桌面与 390×844 手机竖屏布局，并点击手机底部上移按钮。
- 结果：桌面文档宽高 1280×720，无溢出；手机文档宽高 390×844，画布位于 y=69–730、按钮栏 y=730–805，主操作在视口内。手机上移按钮可触发变轨，随后可暂停。
- 修复：页面限定为视口高度，结算内容在短窗口内可滚动，恢复桌面视口后交付。

## 当前进展与运行方式
- 已实现全部 15 项 vertical slice（完整玩法切片）能力。
- 本地开发服务器保持运行。本次预览为 http://127.0.0.1:5174/；端口已占用时 Vite 会自动递增，以实际打印地址为准。
- 后续重启：`npm run dev`。生产版本：`npm run build` 后 `npm run preview`。

## 会话回溯与差异说明
- 以下为本会话从空目录到最终可交付版本的完整净变更，未省略任何源码或依赖锁文件行。
- 每个新增文件均从 `/dev/null` 生成标准 unified diff（统一差异格式）。SHA-256 用于确认以后是否仍是本会话版本。
- 临时安装缓存、node_modules、dist、构建缓存不是源码，不进入 diff；本变更文档不包含自身，以避免递归。
- 后续若要求回到会话-1，应先对照下列文件及校验值，保留用户后续独立工作，再依据会话记录恢复，不盲目删除整个目录。

## 代码变更
### .gitignore

- 新增 5 行；SHA-256：`7c75c7a77cd49b674ecef97fb12889c6cc15ec82ba8481d45aa0804e57cef4aa`。

```diff
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,5 @@
+node_modules/
+dist/
+*.tsbuildinfo
+.DS_Store
+artifacts/
```

### AGENTS.md

- 新增 24 行；SHA-256：`cbfefb107a09d1c9a45ea5497035476121f516879c1decfa3551dcd805e2dac6`。

```diff
--- /dev/null
+++ b/AGENTS.md
@@ -0,0 +1,24 @@
+# 项目认知与协作约定
+
+## 基本信息
+- 《遥遥领先》（Too Far Ahead）是一个横版高铁反应跑酷游戏；核心压力来自自动提速和车头向右推进，前方判断空间同步缩小。
+- 项目从空目录初始化，初始目录不是 Git 仓库。每轮开始检查分支；若与已知上轮分支不同，先告知用户并确认。
+- 沟通、文档和代码注释使用中文；回答以“会话-${index}：”开头。
+
+## 技术与架构
+- React + TypeScript + Vite；Canvas 2D 渲染游戏，React 渲染操作面板。
+- `src/game/config.ts` 集中定义速度阶段和时间参数。
+- `src/game/engine.ts` 管理确定性状态更新、变道、制动、领先、信号和碰撞，与浏览器渲染解耦。
+- `src/game/renderer.ts` 绘制多层视差铁路世界；`src/game/audio.ts` 提供 Web Audio 合成反馈。
+- `src/App.tsx` 连接游戏循环、键盘/触屏输入、暂停和结算。
+- 障碍波次必须给出提前信号、保留可达安全轨道，并避开提速的镜头移动窗口。
+
+## 运行方式
+- `npm install` 安装依赖；`npm run dev` 启动；`npm run build` 检查类型并构建。
+- `npm test` 使用 Node 内置测试运行器与 tsx 验证核心玩法；`npm run lint` 执行严格 TypeScript 静态检查。
+
+## 检索与记录
+- 项目检索先读取 `.agentdocs/index.md`，再按需读取其中关联的具体文档，禁止直接全量检索 `.agentdocs/workflow/`。
+- 每轮代码变更在 `.agentdocs/workflow/` 新建带 `YYYYMMDDHHmmss` 时间前缀的 Markdown 文档，记录所有代码行的完整 diff，并更新根索引。
+- 只有整体架构与核心认知改变才更新本文件；需求细节留在变更文档。
+- 每轮包含代码变更的最终回复总结测试方法；不覆盖用户已有变更。
```

### CLAUDE.md

- 新增 1 行；SHA-256：`336cc4fbf19beaada7ccf9986414fa91851a8d7a07dfb3ccbe800a69eed0ab49`。

```diff
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1 @@
+@AGENTS.md
```

### .agentdocs/index.md

- 新增 10 行；SHA-256：`0d7cdb2079454e25b401313eb621588fa6ca974fb789b8eeef32bd975a57b602`。

```diff
--- /dev/null
+++ b/.agentdocs/index.md
@@ -0,0 +1,10 @@
+# 项目文档索引
+
+## 关键记忆
+- 当前项目是《遥遥领先》浏览器小游戏，以自动提速和前方视野缩小为核心机制。
+- 先读本索引，再按需读取具体变更文档，不全量检索 workflow 目录。
+- 会话-1 从空目录初始化；初始目录没有 Git 仓库。开发服务使用终端打印的地址，本次为 http://127.0.0.1:5174/。
+- React + TypeScript + Canvas；测试使用 Node 内置运行器，当前 14 项通过，含 60 个随机种子的完整通关模拟。
+
+## 当前变更文档
+- `workflow/20260907154944-session-1-playable-game.md` - 会话-1：初始化可玩的完整游戏；包含全部源文件和依赖锁文件的逐行 diff、玩法配置、验证方法与会话回溯说明。需要了解本版实现、数值或回到本版时读取。
```

### README.md

- 新增 48 行；SHA-256：`b2982094385520dc72c5207ba029d71c7e79847c848a5a17523eff149021d040`。

```diff
--- /dev/null
+++ b/README.md
@@ -0,0 +1,48 @@
+# 遥遥领先 · Too Far Ahead
+
+横版高铁高速反应跑酷。每次系统喊出“遥遥领先”，基础速度提升 20 km/h，车头向右推进 10%，前方判断空间随之缩小。
+
+## 启动
+
+需要 Node.js 20.19+。
+
+```bash
+npm install
+npm run dev
+```
+
+打开终端打印的本地地址。生产构建与检查：
+
+```bash
+npm test
+npm run lint
+npm run build
+npm run preview
+```
+
+## 操作与目标
+
+- `W / ↑` 上移；`S / ↓` 下移。一次只能换一轨，变道途中不能取消。
+- `Space` 紧急制动 0.8 秒，冷却 3 秒；本局基础速度不降低。
+- `P / Esc` 暂停或继续；`Enter` 发车或再开一局。离开页面自动暂停。
+- 触屏使用底部变轨和制动按钮，建议横屏游玩。
+- 信号比障碍提前出现。红灯表示封闭，黄灯表示风险，绿灯表示安全；顶部会提示推荐轨道。
+- 速度从 250 升到 350 km/h，车头从屏幕 10% 推进到 60%；到达 350 后再生存 60 秒即通关。
+- 施工、慢车、落石、道岔四种波次轮换。撞击直接失败，结算显示生存时间、最高速度、领先阶段、成功切轨和极限反应次数。
+
+## 实现边界
+
+- 纯前端单人 MVP（最小可行版本），无账号、后端、商店、排行榜或无尽模式。
+- 规则与渲染解耦，Canvas 绘制视差山体、城市、三轨铁路、高铁、信号和障碍；音效使用 Web Audio 即时合成。
+- 配置集中在 `src/game/config.ts`。每次领先在 15–30 秒内随机，提前 2 秒倒计时，车头在 0.85 秒内平滑推进。
+- 高速最后一档实体反应时间为 1.1 秒，确保每档相对滚动速度单调增加。信号另提供 1.45 秒预判。
+- 障碍波次不重叠；按玩家当前目标轨、剩余变道时间和可用思考时间校验安全出口；提速前预留清场窗口。
+- `npm test` 覆盖核心规则，以及 60 个随机种子下的完整通关模拟。测试驾驶员读取信号并通过正式输入接口换轨，不关闭碰撞。
+
+## 文件导航
+
+- `src/App.tsx`：游戏循环、界面、键盘与触屏输入。
+- `src/game/engine.ts`：游戏状态与更新、领先系统、波次规划、碰撞和结算。
+- `src/game/renderer.ts`：独立 Canvas 渲染器。
+- `src/game/audio.ts`：合成音效与行驶反馈。
+- `.agentdocs/index.md`：文档检索入口，每轮代码变更与完整 diff 记在对应 workflow 文档。
```

### package.json

- 新增 26 行；SHA-256：`2a52d9d04349b028942557f2ef8f39c1d912ba2e9b24b8107a80e4e6982a0ffe`。

```diff
--- /dev/null
+++ b/package.json
@@ -0,0 +1,26 @@
+{
+  "name": "too-far-ahead",
+  "version": "1.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "vite --host 0.0.0.0",
+    "build": "tsc -b && vite build",
+    "preview": "vite preview --host 0.0.0.0",
+    "test": "node --import tsx --test tests/*.test.ts",
+    "lint": "tsc -b --pretty false"
+  },
+  "dependencies": {
+    "react": "^19.1.0",
+    "react-dom": "^19.1.0"
+  },
+  "devDependencies": {
+    "@types/node": "^22.15.0",
+    "@types/react": "^19.1.0",
+    "@types/react-dom": "^19.1.0",
+    "@vitejs/plugin-react": "^4.5.0",
+    "tsx": "^4.20.0",
+    "typescript": "~5.8.3",
+    "vite": "^6.3.5"
+  }
+}
```

### package-lock.json

- 新增 2363 行；SHA-256：`3217b8429064a7f9371fed262ae8024a3749f037af0fc0c1afab344cb496fba5`。

```diff
--- /dev/null
+++ b/package-lock.json
@@ -0,0 +1,2363 @@
+{
+  "name": "too-far-ahead",
+  "version": "1.0.0",
+  "lockfileVersion": 3,
+  "requires": true,
+  "packages": {
+    "": {
+      "name": "too-far-ahead",
+      "version": "1.0.0",
+      "dependencies": {
+        "react": "^19.1.0",
+        "react-dom": "^19.1.0"
+      },
+      "devDependencies": {
+        "@types/node": "^22.15.0",
+        "@types/react": "^19.1.0",
+        "@types/react-dom": "^19.1.0",
+        "@vitejs/plugin-react": "^4.5.0",
+        "tsx": "^4.20.0",
+        "typescript": "~5.8.3",
+        "vite": "^6.3.5"
+      }
+    },
+    "node_modules/@babel/code-frame": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
+      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-validator-identifier": "^7.29.7",
+        "js-tokens": "^4.0.0",
+        "picocolors": "^1.1.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/compat-data": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
+      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/core": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
+      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/generator": "^7.29.7",
+        "@babel/helper-compilation-targets": "^7.29.7",
+        "@babel/helper-module-transforms": "^7.29.7",
+        "@babel/helpers": "^7.29.7",
+        "@babel/parser": "^7.29.7",
+        "@babel/template": "^7.29.7",
+        "@babel/traverse": "^7.29.7",
+        "@babel/types": "^7.29.7",
+        "@jridgewell/remapping": "^2.3.5",
+        "convert-source-map": "^2.0.0",
+        "debug": "^4.1.0",
+        "gensync": "^1.0.0-beta.2",
+        "json5": "^2.2.3",
+        "semver": "^6.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/babel"
+      }
+    },
+    "node_modules/@babel/generator": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
+      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.29.8",
+        "@babel/types": "^7.29.8",
+        "@jridgewell/gen-mapping": "^0.3.12",
+        "@jridgewell/trace-mapping": "^0.3.28",
+        "jsesc": "^3.0.2"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-compilation-targets": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
+      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/compat-data": "^7.29.7",
+        "@babel/helper-validator-option": "^7.29.7",
+        "browserslist": "^4.24.0",
+        "lru-cache": "^5.1.1",
+        "semver": "^6.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-globals": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
+      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-module-imports": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.29.7.tgz",
+      "integrity": "sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/traverse": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-module-transforms": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.29.7.tgz",
+      "integrity": "sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-module-imports": "^7.29.7",
+        "@babel/helper-validator-identifier": "^7.29.7",
+        "@babel/traverse": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0"
+      }
+    },
+    "node_modules/@babel/helper-plugin-utils": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.29.7.tgz",
+      "integrity": "sha512-G7sHYigPY17oO5SYWnfD/0MTBwVR781S/JI643e/JhUYgVgWE/61SoW3NH9KWUKyKq5LVh3npif99Wkt6j86Jw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-string-parser": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
+      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-validator-identifier": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
+      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-validator-option": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.29.7.tgz",
+      "integrity": "sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helpers": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.7.tgz",
+      "integrity": "sha512-1k2lAGRMfHTcwuNYcCNUmaUffmQv8KWMfh2iJUUeRlwlwH4FdNG7mfPI10NPfLHJFThE4Tyr4mv7kTNZOiPuBg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/template": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/parser": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.8.tgz",
+      "integrity": "sha512-E8lTAYNB1KW+FH+VGJuZM1ioAx2E6oVlvQFRrf5P8ZZmsiJXYAD9vTFV7yyEURNzgh1dFqMZuO6tUwcARbqFCA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.29.8"
+      },
+      "bin": {
+        "parser": "bin/babel-parser.js"
+      },
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/@babel/plugin-transform-react-jsx-self": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.29.7.tgz",
+      "integrity": "sha512-TL0hMc9xzy86VD31nUiwzd5otRAcyEPcsegCxolO0PvcXuH1v0kECe/UIznYFihpkvU5wg/jk4v0TTEFfm53fw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-plugin-utils": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0-0"
+      }
+    },
+    "node_modules/@babel/plugin-transform-react-jsx-source": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.29.7.tgz",
+      "integrity": "sha512-06IyK09H3wi4cGbhDBwp5gUGo0IKtnYa8tyTiephirPCK6fbobVGiXMMI5zLQ4aKEYP3wZ3ArU44o+8KMrSG/Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-plugin-utils": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0-0"
+      }
+    },
+    "node_modules/@babel/template": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
+      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/parser": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/traverse": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.8.tgz",
+      "integrity": "sha512-I5z7H3bf/41ktsNVLtpN0wAa336HkqIHQ5BuPLEhTkt1jVSyZpeNKIzTgEWmlxjdg81R0IgUCcaE+Ok3NvrfZg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/generator": "^7.29.8",
+        "@babel/helper-globals": "^7.29.7",
+        "@babel/parser": "^7.29.8",
+        "@babel/template": "^7.29.7",
+        "@babel/types": "^7.29.8",
+        "debug": "^4.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/types": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
+      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-string-parser": "^7.29.7",
+        "@babel/helper-validator-identifier": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@esbuild/aix-ppc64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.2.tgz",
+      "integrity": "sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "aix"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-arm": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.2.tgz",
+      "integrity": "sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.2.tgz",
+      "integrity": "sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.2.tgz",
+      "integrity": "sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/darwin-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.2.tgz",
+      "integrity": "sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/darwin-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.2.tgz",
+      "integrity": "sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/freebsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/freebsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.2.tgz",
+      "integrity": "sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-arm": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.2.tgz",
+      "integrity": "sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.2.tgz",
+      "integrity": "sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-ia32": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.2.tgz",
+      "integrity": "sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-loong64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.2.tgz",
+      "integrity": "sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-mips64el": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.2.tgz",
+      "integrity": "sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==",
+      "cpu": [
+        "mips64el"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-ppc64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.2.tgz",
+      "integrity": "sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-riscv64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.2.tgz",
+      "integrity": "sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-s390x": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.2.tgz",
+      "integrity": "sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz",
+      "integrity": "sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/netbsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/netbsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.2.tgz",
+      "integrity": "sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openbsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openbsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.2.tgz",
+      "integrity": "sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openharmony-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.2.tgz",
+      "integrity": "sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/sunos-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.2.tgz",
+      "integrity": "sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "sunos"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.2.tgz",
+      "integrity": "sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-ia32": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz",
+      "integrity": "sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz",
+      "integrity": "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@jridgewell/gen-mapping": {
+      "version": "0.3.13",
+      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
+      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/sourcemap-codec": "^1.5.0",
+        "@jridgewell/trace-mapping": "^0.3.24"
+      }
+    },
+    "node_modules/@jridgewell/remapping": {
+      "version": "2.3.5",
+      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
+      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/gen-mapping": "^0.3.5",
+        "@jridgewell/trace-mapping": "^0.3.24"
+      }
+    },
+    "node_modules/@jridgewell/resolve-uri": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
+      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/@jridgewell/sourcemap-codec": {
+      "version": "1.6.0",
+      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
+      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@jridgewell/trace-mapping": {
+      "version": "0.3.31",
+      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
+      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/resolve-uri": "^3.1.0",
+        "@jridgewell/sourcemap-codec": "^1.4.14"
+      }
+    },
+    "node_modules/@napi-rs/lzma-linux-x64-gnu": {
+      "version": "1.5.1",
+      "resolved": "https://registry.npmjs.org/@napi-rs/lzma-linux-x64-gnu/-/lzma-linux-x64-gnu-1.5.1.tgz",
+      "integrity": "sha512-oTXEIha4SsuXdTA4Iyskj0kpdx2yVXdhd75c2v3xGrHFfVMsbhTPZU/nMPL4sWKo4pBHm3aucLaqGlF696dTyQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^22.20 || ^24.12 || >=25"
+      }
+    },
+    "node_modules/@rolldown/pluginutils": {
+      "version": "1.0.0-beta.27",
+      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
+      "integrity": "sha512-+d0F4MKMCbeVUJwG96uQ4SgAznZNSq93I3V+9NHA4OpvqG8mRCpGdKmK8l/dl02h2CCDHwW2FqilnTyDcAnqjA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@rollup/rollup-android-arm-eabi": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.63.1.tgz",
+      "integrity": "sha512-UZ8sUxPTiHWYX9QNdJedb1kDZSpS1t/VPWBWGSgqHNi9w3Cu6IXvu2mzbhiTiPvtrqgTQJ+zqiAq2iPIPilpaQ==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ]
+    },
+    "node_modules/@rollup/rollup-android-arm64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.63.1.tgz",
+      "integrity": "sha512-cQ4nFQABN5cDvDpbvJ7bMStCpnaVxynZrRMfUJYgxcIk9Sh54FIO1vtfkg0B69REjER77ioZ/ov+eAApx/KmLQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ]
+    },
+    "node_modules/@rollup/rollup-darwin-arm64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.63.1.tgz",
+      "integrity": "sha512-FQNqd1lRy/0QhDk3xeRIkSBiCpXCiDnZO3YLVdcDKN1UBiKToNftCzcXYNLshmPDUMlu2TdeS8tGcsU6f3YF1Q==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ]
+    },
+    "node_modules/@rollup/rollup-darwin-x64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.63.1.tgz",
+      "integrity": "sha512-pvD16V939D3CloK0+qikpGaxiPrDUXTe7Y5cWOMkMSy7m1cawa8EGy/kXYi/G/cKAC4HDAbSnzCIk1WmsoOKXg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ]
+    },
+    "node_modules/@rollup/rollup-freebsd-arm64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.63.1.tgz",
+      "integrity": "sha512-pcFGeL2345VwdTnJhA6zLbew+YgWB0qBG2+dMtXjCicf6+rm6kO6cOoh5VnTe0ZMrMRgRyuHmCJxZWrIdzYuOw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-freebsd-x64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.63.1.tgz",
+      "integrity": "sha512-mRJlqSRulVzcKq/LKA6ICSIc3K/l4fzlVn/gePn2nXIHy8seRi5z/eeRE0d/XMBxcMldiXtQTSpRj0tkkC3g8Q==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.63.1.tgz",
+      "integrity": "sha512-YDUNvVM85TI3g/1OpnqKP1h4NeW/j64DfWMf+G3M809xNk1bJSnpFp4sh83NpmVE5DXnkh8ULor4LTVZKoYLHw==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.63.1.tgz",
+      "integrity": "sha512-7Mcn71p9ZuQFAj+h+dhQXy/yeLePRS2yKRnmW1DijA9thKO5qap0GNOIQK4yQ6iP3SU0Mrb/yWo8h8vgRba8lw==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.63.1.tgz",
+      "integrity": "sha512-4YiLQTX6U4CSl0L9cluep9A9W6UmTfqBDc2/CH6wlu54pl4E7Jn3cOD8oxzvBDEGk/JMKgJ47C8g+radF7mwvg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm64-musl": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.63.1.tgz",
+      "integrity": "sha512-2ra8F7w8OquwZN9z2/fKFnli69wa8PLwaVzRMIPGb13ByMJwC28Fbp8YcVGoUhlYMTt7j5j9bNgpysrN2UM+vw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-loong64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.63.1.tgz",
+      "integrity": "sha512-Sy20ncyhjmBP0Ml+UvQbimjlk6VFgjW5uNP+qqwHB00mTE8Bl2C1TuHTlRwK2YoXeZbee5lP2XevBWVkAQAtSQ==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-loong64-musl": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.63.1.tgz",
+      "integrity": "sha512-noITLp8oNjYliPnGWmLyelIHwULGqbHloQHGw1rtxbWhTuWooRpnZarZQJ1y9EUC4szuCusCc+HEpUtxpIwYvA==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.63.1.tgz",
+      "integrity": "sha512-hlxxXd+F1mWiAcaFR7Sv9ZQT6m6UfI8+Vy/kFJzztq2pDMU/0wZ9sish0iszNZvsQDo8Gc0i5yuFEOz5dDf6fA==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-ppc64-musl": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.63.1.tgz",
+      "integrity": "sha512-EF7OpqQTQ/BvGqLzUi4rEHuagCV9MugAUXSHemwPW5vxZ75RR+jxO/2j95Ph2dalMpFHSVECjRoioHZgA9zOYA==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.63.1.tgz",
+      "integrity": "sha512-wQO3JesW9PRkwlabQ27y7sPfVOOTLRG73I4F2UYHG5PXun3J9U3y+b7ezVKSYbsvSKGQ1k1cq8Qlun4C9kLt3w==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-riscv64-musl": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.63.1.tgz",
+      "integrity": "sha512-ouAGwhO6wHRXdnOVCOsB0tRFkA7nhNB2Nwax6oECXN0YiN8EYUTBAOudADOB1PI+yDL61TeNx/u7MVCzksNbkQ==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-s390x-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.63.1.tgz",
+      "integrity": "sha512-q2R38Sn+1J8RxhfJ+T54wSWmyKXWec+9jgDfqO2AtArEqHO5R2aeayp5H5OYLr5UYDVGsVaZPEFUooMhYCdz5A==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-x64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.63.1.tgz",
+      "integrity": "sha512-gfI5T24WLLuFfSKw7Go/zDXjAAV0fny0swTaDv+WjK7vqcw4cRhFfdsyKL1n+ukI+ooBxn3bVQnyrn06WpI50w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-x64-musl": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.63.1.tgz",
+      "integrity": "sha512-4h6XqthmB4Hspji84wvgk+ElodTsGj+dbZqHJHHtKxj4mYq0ANSEEPX9ys3moJueqsRjwpaJYH7874Itwnj2ow==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-openbsd-x64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.63.1.tgz",
+      "integrity": "sha512-dlfCOa87o1VAYegLQ9EKilx2JCeRofiyPGhTCmqnuXZ6bMPiycO1rq1+sKoulAp7pGLIsTIw+1x5R+zgh5LhhA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-openharmony-arm64": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.63.1.tgz",
+      "integrity": "sha512-cjkLbOlfcm3QGhMM1J5zaZjsw1GggbN6rw9UTSSRrPrR1KkcXnN7Uq9rPw34xImQ9VOY9GN+6u2Zj80B9ptkcw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-arm64-msvc": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.63.1.tgz",
+      "integrity": "sha512-Li1KdUnWGE4N3e1F/B4RTB1ms+nG4WBgjByO46pkeBVX/2UBsY53xf5vK9WygVmnH3RwncIST7lkSdLSY6P9lg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-ia32-msvc": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.63.1.tgz",
+      "integrity": "sha512-t4ZYOSoLTgwhuFMrmTMLx/+i1DQVK7HYqMc6kY46EApwi8X0nIVphzdNoThU3xt6n+N5urG1/gxBdCaKDLavfg==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-x64-gnu": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.63.1.tgz",
+      "integrity": "sha512-RgroPfMmKlD1RzSDxvwgcPiy2HNQKoYV7OmwIXDsk73uKW5t6B/V8KIy27SMv/FNXFo/oSBtWc9J0X7t91ezZg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-x64-msvc": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.63.1.tgz",
+      "integrity": "sha512-at8QVep6S3h5Y6gSbdGU06bRY5WJkf6WUduM9YtvYMbYhB1MOFfUgc6kehitQXzOtMSaT70q7f9ydPhpqu821w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@types/babel__core": {
+      "version": "7.20.5",
+      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
+      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.20.7",
+        "@babel/types": "^7.20.7",
+        "@types/babel__generator": "*",
+        "@types/babel__template": "*",
+        "@types/babel__traverse": "*"
+      }
+    },
+    "node_modules/@types/babel__generator": {
+      "version": "7.27.0",
+      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
+      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.0.0"
+      }
+    },
+    "node_modules/@types/babel__template": {
+      "version": "7.4.4",
+      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
+      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.1.0",
+        "@babel/types": "^7.0.0"
+      }
+    },
+    "node_modules/@types/babel__traverse": {
+      "version": "7.28.0",
+      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
+      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.28.2"
+      }
+    },
+    "node_modules/@types/estree": {
+      "version": "1.0.9",
+      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
+      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@types/node": {
+      "version": "22.20.1",
+      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.20.1.tgz",
+      "integrity": "sha512-EANqOCF9QFyra+4pfxUcX9STKJpCLjMbObVzljIJomAWSnuSIEAvyzEU53GaajbXJEgdh0iEcPL+DGvpUd4k1Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "undici-types": "~6.21.0"
+      }
+    },
+    "node_modules/@types/react": {
+      "version": "19.2.18",
+      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.2.18.tgz",
+      "integrity": "sha512-AnzbBERsrLKtk2XSfTbYRLjQPdy116Sty4q+T+Bp3IC4l6jNBvreVPAHmpq9qhXQM7CXZPjLVmGMw9sy+hxQ3w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "csstype": "^3.2.2"
+      }
+    },
+    "node_modules/@types/react-dom": {
+      "version": "19.2.7",
+      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.7.tgz",
+      "integrity": "sha512-I8bPpDLcHBv1qiIiXDCy71Rt8eQDKJP0sMSWJphDdAcdqiJ1sGpZamavoEIRZmYzjia9LuEb2HlYdDpmoENpvQ==",
+      "dev": true,
+      "license": "MIT",
+      "peerDependencies": {
+        "@types/react": "^19.2.0"
+      }
+    },
+    "node_modules/@vitejs/plugin-react": {
+      "version": "4.7.0",
+      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
+      "integrity": "sha512-gUu9hwfWvvEDBBmgtAowQCojwZmJ5mcLn3aufeCsitijs3+f2NsrPtlAWIR6OPiqljl96GVCUbLe0HyqIpVaoA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/core": "^7.28.0",
+        "@babel/plugin-transform-react-jsx-self": "^7.27.1",
+        "@babel/plugin-transform-react-jsx-source": "^7.27.1",
+        "@rolldown/pluginutils": "1.0.0-beta.27",
+        "@types/babel__core": "^7.20.5",
+        "react-refresh": "^0.17.0"
+      },
+      "engines": {
+        "node": "^14.18.0 || >=16.0.0"
+      },
+      "peerDependencies": {
+        "vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
+      }
+    },
+    "node_modules/baseline-browser-mapping": {
+      "version": "2.11.21",
+      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.21.tgz",
+      "integrity": "sha512-uh8vpY/1/YyFkunIDFH/12p7/7VdPKA1hejMVEbdkEaWnUz0Hesvx5EbiU6XxjyHZIOju+ZMbQJkRh+es3/spQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "bin": {
+        "baseline-browser-mapping": "dist/cli.cjs"
+      },
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/browserslist": {
+      "version": "4.28.9",
+      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.28.9.tgz",
+      "integrity": "sha512-EWazOblFYUvlGZcfGhPUPmYh3nikUxBVb+y9MJun5f3hBi812X+8MSQTujLBtgK3cf51fJWbWfOjyeO954d+Eg==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/browserslist"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "baseline-browser-mapping": "^2.11.20",
+        "caniuse-lite": "^1.0.30001810",
+        "electron-to-chromium": "^1.5.420",
+        "node-releases": "^2.0.54",
+        "update-browserslist-db": "^1.3.2"
+      },
+      "bin": {
+        "browserslist": "cli.js"
+      },
+      "engines": {
+        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
+      }
+    },
+    "node_modules/caniuse-lite": {
+      "version": "1.0.30001810",
+      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001810.tgz",
+      "integrity": "sha512-TITQPUkaz+aVk5GL6NhOdwk1aEaNTSDPsGFWrTuhKGtjTF70jL/Oht2W4c6rXUe5fu7Ie19VIahAXHIIiWWNeg==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "CC-BY-4.0"
+    },
+    "node_modules/convert-source-map": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
+      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/csstype": {
+      "version": "3.2.3",
+      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
+      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/debug": {
+      "version": "4.4.3",
+      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
+      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ms": "^2.1.3"
+      },
+      "engines": {
+        "node": ">=6.0"
+      },
+      "peerDependenciesMeta": {
+        "supports-color": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/electron-to-chromium": {
+      "version": "1.5.422",
+      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.422.tgz",
+      "integrity": "sha512-UvA/32XqrLDdZSn7Jllo1AYNcWji/G0d5M0GTViE7KoGBiMunw3a34Sb2KO4ZZyrSEhqsxFoVhWWJshdyfKqJA==",
+      "dev": true,
+      "license": "ISC"
+    },
+    "node_modules/esbuild": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz",
+      "integrity": "sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==",
+      "dev": true,
+      "hasInstallScript": true,
+      "license": "MIT",
+      "bin": {
+        "esbuild": "bin/esbuild"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "optionalDependencies": {
+        "@esbuild/aix-ppc64": "0.28.2",
+        "@esbuild/android-arm": "0.28.2",
+        "@esbuild/android-arm64": "0.28.2",
+        "@esbuild/android-x64": "0.28.2",
+        "@esbuild/darwin-arm64": "0.28.2",
+        "@esbuild/darwin-x64": "0.28.2",
+        "@esbuild/freebsd-arm64": "0.28.2",
+        "@esbuild/freebsd-x64": "0.28.2",
+        "@esbuild/linux-arm": "0.28.2",
+        "@esbuild/linux-arm64": "0.28.2",
+        "@esbuild/linux-ia32": "0.28.2",
+        "@esbuild/linux-loong64": "0.28.2",
+        "@esbuild/linux-mips64el": "0.28.2",
+        "@esbuild/linux-ppc64": "0.28.2",
+        "@esbuild/linux-riscv64": "0.28.2",
+        "@esbuild/linux-s390x": "0.28.2",
+        "@esbuild/linux-x64": "0.28.2",
+        "@esbuild/netbsd-arm64": "0.28.2",
+        "@esbuild/netbsd-x64": "0.28.2",
+        "@esbuild/openbsd-arm64": "0.28.2",
+        "@esbuild/openbsd-x64": "0.28.2",
+        "@esbuild/openharmony-arm64": "0.28.2",
+        "@esbuild/sunos-x64": "0.28.2",
+        "@esbuild/win32-arm64": "0.28.2",
+        "@esbuild/win32-ia32": "0.28.2",
+        "@esbuild/win32-x64": "0.28.2"
+      }
+    },
+    "node_modules/escalade": {
+      "version": "3.2.0",
+      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
+      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/fdir": {
+      "version": "6.5.0",
+      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
+      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "peerDependencies": {
+        "picomatch": "^3 || ^4"
+      },
+      "peerDependenciesMeta": {
+        "picomatch": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/fsevents": {
+      "version": "2.3.3",
+      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
+      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
+      "dev": true,
+      "hasInstallScript": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
+      }
+    },
+    "node_modules/gensync": {
+      "version": "1.0.0-beta.2",
+      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
+      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/js-tokens": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
+      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/jsesc": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
+      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "jsesc": "bin/jsesc"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/json5": {
+      "version": "2.2.3",
+      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
+      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "json5": "lib/cli.js"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/lru-cache": {
+      "version": "5.1.1",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
+      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "yallist": "^3.0.2"
+      }
+    },
+    "node_modules/ms": {
+      "version": "2.1.3",
+      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
+      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/nanoid": {
+      "version": "3.3.18",
+      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.18.tgz",
+      "integrity": "sha512-DTg4MJbGMWkfi6VZFdNt2/caMbQy4Ou+Op/hJQvGEWcnVfoA1QA+xzRKAzw9jD6+GVOOeYr/mIcuDSdug6F6+w==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "bin": {
+        "nanoid": "bin/nanoid.cjs"
+      },
+      "engines": {
+        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
+      }
+    },
+    "node_modules/node-releases": {
+      "version": "2.0.54",
+      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.54.tgz",
+      "integrity": "sha512-YHs7BmmcsdAI5Ozuf8JZo6PT0mv2GIWC9vMfvUC3dp65M8hn7Ux8CPL+2oBI7juNuj9d0ndhTcznq2ODBps9cQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/picocolors": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
+      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
+      "dev": true,
+      "license": "ISC"
+    },
+    "node_modules/picomatch": {
+      "version": "4.0.7",
+      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
+      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/jonschlinkert"
+      }
+    },
+    "node_modules/postcss": {
+      "version": "8.5.28",
+      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.28.tgz",
+      "integrity": "sha512-RRuzqDtt5Y9h3quz5hWhK+TPnsmVs6WwSU6LkJMeY4HstUEDuYTG8UJSdawMRzmzAtV+KEoG8N3Qg2qLy5vM/A==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/postcss/"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/postcss"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "nanoid": "^3.3.18",
+        "picocolors": "^1.1.1",
+        "source-map-js": "^1.2.1"
+      },
+      "engines": {
+        "node": "^10 || ^12 || >=14"
+      }
+    },
+    "node_modules/react": {
+      "version": "19.2.8",
+      "resolved": "https://registry.npmjs.org/react/-/react-19.2.8.tgz",
+      "integrity": "sha512-PWaYA1L/q9u2u7xYQi+Y3L3Yfnie7XyLeaJICV1MGD6LprsBxcAqGjYyr0eY3p+QdsA+x/Irkt4Qif8D63+Sbw==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/react-dom": {
+      "version": "19.2.8",
+      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.8.tgz",
+      "integrity": "sha512-rVprimfGBG3DR+Tq0IQG2DT5PxKth1WIGDmj5yPmlzr4YBe7uyE+Du4oVqTDXZSHGGGXRtTJEGSSePyQCMBglQ==",
+      "license": "MIT",
+      "dependencies": {
+        "scheduler": "^0.27.0"
+      },
+      "peerDependencies": {
+        "react": "^19.2.8"
+      }
+    },
+    "node_modules/react-refresh": {
+      "version": "0.17.0",
+      "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
+      "integrity": "sha512-z6F7K9bV85EfseRCp2bzrpyQ0Gkw1uLoCel9XBVWPg/TjRj94SkJzUTGfOa4bs7iJvBWtQG0Wq7wnI0syw3EBQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/rollup": {
+      "version": "4.63.1",
+      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.63.1.tgz",
+      "integrity": "sha512-3Df9jsstwhccuEfmAMi9l8XUh/GOkVObmFTU7CCVBysEbcOZLl84jCtaAZMcPiMz2EGKsATzQcU+Xr3n/wU6cg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/estree": "1.0.9"
+      },
+      "bin": {
+        "rollup": "dist/bin/rollup"
+      },
+      "engines": {
+        "node": ">=18.0.0",
+        "npm": ">=8.0.0"
+      },
+      "optionalDependencies": {
+        "@napi-rs/lzma-linux-x64-gnu": "1.5.1",
+        "@rollup/rollup-android-arm-eabi": "4.63.1",
+        "@rollup/rollup-android-arm64": "4.63.1",
+        "@rollup/rollup-darwin-arm64": "4.63.1",
+        "@rollup/rollup-darwin-x64": "4.63.1",
+        "@rollup/rollup-freebsd-arm64": "4.63.1",
+        "@rollup/rollup-freebsd-x64": "4.63.1",
+        "@rollup/rollup-linux-arm-gnueabihf": "4.63.1",
+        "@rollup/rollup-linux-arm-musleabihf": "4.63.1",
+        "@rollup/rollup-linux-arm64-gnu": "4.63.1",
+        "@rollup/rollup-linux-arm64-musl": "4.63.1",
+        "@rollup/rollup-linux-loong64-gnu": "4.63.1",
+        "@rollup/rollup-linux-loong64-musl": "4.63.1",
+        "@rollup/rollup-linux-ppc64-gnu": "4.63.1",
+        "@rollup/rollup-linux-ppc64-musl": "4.63.1",
+        "@rollup/rollup-linux-riscv64-gnu": "4.63.1",
+        "@rollup/rollup-linux-riscv64-musl": "4.63.1",
+        "@rollup/rollup-linux-s390x-gnu": "4.63.1",
+        "@rollup/rollup-linux-x64-gnu": "4.63.1",
+        "@rollup/rollup-linux-x64-musl": "4.63.1",
+        "@rollup/rollup-openbsd-x64": "4.63.1",
+        "@rollup/rollup-openharmony-arm64": "4.63.1",
+        "@rollup/rollup-win32-arm64-msvc": "4.63.1",
+        "@rollup/rollup-win32-ia32-msvc": "4.63.1",
+        "@rollup/rollup-win32-x64-gnu": "4.63.1",
+        "@rollup/rollup-win32-x64-msvc": "4.63.1",
+        "fsevents": "~2.3.2"
+      }
+    },
+    "node_modules/scheduler": {
+      "version": "0.27.0",
+      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
+      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
+      "license": "MIT"
+    },
+    "node_modules/semver": {
+      "version": "6.3.1",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
+      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
+      "dev": true,
+      "license": "ISC",
+      "bin": {
+        "semver": "bin/semver.js"
+      }
+    },
+    "node_modules/source-map-js": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
+      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/tinyglobby": {
+      "version": "0.2.17",
+      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
+      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "fdir": "^6.5.0",
+        "picomatch": "^4.0.4"
+      },
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/SuperchupuDev"
+      }
+    },
+    "node_modules/tsx": {
+      "version": "4.23.13",
+      "resolved": "https://registry.npmjs.org/tsx/-/tsx-4.23.13.tgz",
+      "integrity": "sha512-BL5MGkRln6aDYhb0xbQlEAGw743BaZYWdbWtdJOBriYJboKgUUYCadFp2/FpBBZquBC/ezNBn7wMMPx7FDZUDw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "esbuild": "~0.28.0"
+      },
+      "bin": {
+        "tsx": "dist/cli.mjs"
+      },
+      "engines": {
+        "node": ">=18.0.0"
+      },
+      "optionalDependencies": {
+        "fsevents": "~2.3.3"
+      }
+    },
+    "node_modules/typescript": {
+      "version": "5.8.3",
+      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.8.3.tgz",
+      "integrity": "sha512-p1diW6TqL9L07nNxvRMM7hMMw4c5XOo/1ibL4aAIGmSAt9slTE1Xgw5KWuof2uTOvCg9BY7ZRi+GaF+7sfgPeQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "bin": {
+        "tsc": "bin/tsc",
+        "tsserver": "bin/tsserver"
+      },
+      "engines": {
+        "node": ">=14.17"
+      }
+    },
+    "node_modules/undici-types": {
+      "version": "6.21.0",
+      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
+      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/update-browserslist-db": {
+      "version": "1.3.2",
+      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.3.2.tgz",
+      "integrity": "sha512-UQ+MSxlhRm1bzjhU+DcuXfjFO1FzNtqhK5+9Yvlp90ItDLk5vT932A0rFu619nf7RVS+Y/VeaUW1jaRDqZ8VJw==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/browserslist"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "escalade": "^3.2.0",
+        "picocolors": "^1.1.1"
+      },
+      "bin": {
+        "update-browserslist-db": "cli.js"
+      },
+      "peerDependencies": {
+        "browserslist": ">= 4.21.0"
+      }
+    },
+    "node_modules/vite": {
+      "version": "6.4.3",
+      "resolved": "https://registry.npmjs.org/vite/-/vite-6.4.3.tgz",
+      "integrity": "sha512-NTKlcQjlAK7MlQoyb6LgaqHc8sso/pVyUJYWMws3jg21uTJw/LddqIFPcPqP6PzpgbIcZyKI85sFE4HBrQDA8A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "esbuild": "^0.25.0",
+        "fdir": "^6.4.4",
+        "picomatch": "^4.0.2",
+        "postcss": "^8.5.3",
+        "rollup": "^4.34.9",
+        "tinyglobby": "^0.2.13"
+      },
+      "bin": {
+        "vite": "bin/vite.js"
+      },
+      "engines": {
+        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/vitejs/vite?sponsor=1"
+      },
+      "optionalDependencies": {
+        "fsevents": "~2.3.3"
+      },
+      "peerDependencies": {
+        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
+        "jiti": ">=1.21.0",
+        "less": "*",
+        "lightningcss": "^1.21.0",
+        "sass": "*",
+        "sass-embedded": "*",
+        "stylus": "*",
+        "sugarss": "*",
+        "terser": "^5.16.0",
+        "tsx": "^4.8.1",
+        "yaml": "^2.4.2"
+      },
+      "peerDependenciesMeta": {
+        "@types/node": {
+          "optional": true
+        },
+        "jiti": {
+          "optional": true
+        },
+        "less": {
+          "optional": true
+        },
+        "lightningcss": {
+          "optional": true
+        },
+        "sass": {
+          "optional": true
+        },
+        "sass-embedded": {
+          "optional": true
+        },
+        "stylus": {
+          "optional": true
+        },
+        "sugarss": {
+          "optional": true
+        },
+        "terser": {
+          "optional": true
+        },
+        "tsx": {
+          "optional": true
+        },
+        "yaml": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/aix-ppc64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.25.12.tgz",
+      "integrity": "sha512-Hhmwd6CInZ3dwpuGTF8fJG6yoWmsToE+vYgD4nytZVxcu1ulHpUQRAB1UJ8+N1Am3Mz4+xOByoQoSZf4D+CpkA==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "aix"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/android-arm": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.25.12.tgz",
+      "integrity": "sha512-VJ+sKvNA/GE7Ccacc9Cha7bpS8nyzVv0jdVgwNDaR4gDMC/2TTRc33Ip8qrNYUcpkOHUT5OZ0bUcNNVZQ9RLlg==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/android-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.25.12.tgz",
+      "integrity": "sha512-6AAmLG7zwD1Z159jCKPvAxZd4y/VTO0VkprYy+3N2FtJ8+BQWFXU+OxARIwA46c5tdD9SsKGZ/1ocqBS/gAKHg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/android-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.25.12.tgz",
+      "integrity": "sha512-5jbb+2hhDHx5phYR2By8GTWEzn6I9UqR11Kwf22iKbNpYrsmRB18aX/9ivc5cabcUiAT/wM+YIZ6SG9QO6a8kg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/darwin-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.12.tgz",
+      "integrity": "sha512-N3zl+lxHCifgIlcMUP5016ESkeQjLj/959RxxNYIthIg+CQHInujFuXeWbWMgnTo4cp5XVHqFPmpyu9J65C1Yg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/darwin-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.25.12.tgz",
+      "integrity": "sha512-HQ9ka4Kx21qHXwtlTUVbKJOAnmG1ipXhdWTmNXiPzPfWKpXqASVcWdnf2bnL73wgjNrFXAa3yYvBSd9pzfEIpA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/freebsd-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.25.12.tgz",
+      "integrity": "sha512-gA0Bx759+7Jve03K1S0vkOu5Lg/85dou3EseOGUes8flVOGxbhDDh/iZaoek11Y8mtyKPGF3vP8XhnkDEAmzeg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/freebsd-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.25.12.tgz",
+      "integrity": "sha512-TGbO26Yw2xsHzxtbVFGEXBFH0FRAP7gtcPE7P5yP7wGy7cXK2oO7RyOhL5NLiqTlBh47XhmIUXuGciXEqYFfBQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-arm": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.25.12.tgz",
+      "integrity": "sha512-lPDGyC1JPDou8kGcywY0YILzWlhhnRjdof3UlcoqYmS9El818LLfJJc3PXXgZHrHCAKs/Z2SeZtDJr5MrkxtOw==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.25.12.tgz",
+      "integrity": "sha512-8bwX7a8FghIgrupcxb4aUmYDLp8pX06rGh5HqDT7bB+8Rdells6mHvrFHHW2JAOPZUbnjUpKTLg6ECyzvas2AQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-ia32": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.25.12.tgz",
+      "integrity": "sha512-0y9KrdVnbMM2/vG8KfU0byhUN+EFCny9+8g202gYqSSVMonbsCfLjUO+rCci7pM0WBEtz+oK/PIwHkzxkyharA==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-loong64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.25.12.tgz",
+      "integrity": "sha512-h///Lr5a9rib/v1GGqXVGzjL4TMvVTv+s1DPoxQdz7l/AYv6LDSxdIwzxkrPW438oUXiDtwM10o9PmwS/6Z0Ng==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-mips64el": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.25.12.tgz",
+      "integrity": "sha512-iyRrM1Pzy9GFMDLsXn1iHUm18nhKnNMWscjmp4+hpafcZjrr2WbT//d20xaGljXDBYHqRcl8HnxbX6uaA/eGVw==",
+      "cpu": [
+        "mips64el"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-ppc64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.25.12.tgz",
+      "integrity": "sha512-9meM/lRXxMi5PSUqEXRCtVjEZBGwB7P/D4yT8UG/mwIdze2aV4Vo6U5gD3+RsoHXKkHCfSxZKzmDssVlRj1QQA==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-riscv64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.25.12.tgz",
+      "integrity": "sha512-Zr7KR4hgKUpWAwb1f3o5ygT04MzqVrGEGXGLnj15YQDJErYu/BGg+wmFlIDOdJp0PmB0lLvxFIOXZgFRrdjR0w==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-s390x": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.25.12.tgz",
+      "integrity": "sha512-MsKncOcgTNvdtiISc/jZs/Zf8d0cl/t3gYWX8J9ubBnVOwlk65UIEEvgBORTiljloIWnBzLs4qhzPkJcitIzIg==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/linux-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.25.12.tgz",
+      "integrity": "sha512-uqZMTLr/zR/ed4jIGnwSLkaHmPjOjJvnm6TVVitAa08SLS9Z0VM8wIRx7gWbJB5/J54YuIMInDquWyYvQLZkgw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/netbsd-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.25.12.tgz",
+      "integrity": "sha512-xXwcTq4GhRM7J9A8Gv5boanHhRa/Q9KLVmcyXHCTaM4wKfIpWkdXiMog/KsnxzJ0A1+nD+zoecuzqPmCRyBGjg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/netbsd-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.25.12.tgz",
+      "integrity": "sha512-Ld5pTlzPy3YwGec4OuHh1aCVCRvOXdH8DgRjfDy/oumVovmuSzWfnSJg+VtakB9Cm0gxNO9BzWkj6mtO1FMXkQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/openbsd-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.25.12.tgz",
+      "integrity": "sha512-fF96T6KsBo/pkQI950FARU9apGNTSlZGsv1jZBAlcLL1MLjLNIWPBkj5NlSz8aAzYKg+eNqknrUJ24QBybeR5A==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/openbsd-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.25.12.tgz",
+      "integrity": "sha512-MZyXUkZHjQxUvzK7rN8DJ3SRmrVrke8ZyRusHlP+kuwqTcfWLyqMOE3sScPPyeIXN/mDJIfGXvcMqCgYKekoQw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/openharmony-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.25.12.tgz",
+      "integrity": "sha512-rm0YWsqUSRrjncSXGA7Zv78Nbnw4XL6/dzr20cyrQf7ZmRcsovpcRBdhD43Nuk3y7XIoW2OxMVvwuRvk9XdASg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/sunos-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.25.12.tgz",
+      "integrity": "sha512-3wGSCDyuTHQUzt0nV7bocDy72r2lI33QL3gkDNGkod22EsYl04sMf0qLb8luNKTOmgF/eDEDP5BFNwoBKH441w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "sunos"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/win32-arm64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.25.12.tgz",
+      "integrity": "sha512-rMmLrur64A7+DKlnSuwqUdRKyd3UE7oPJZmnljqEptesKM8wx9J8gx5u0+9Pq0fQQW8vqeKebwNXdfOyP+8Bsg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/win32-ia32": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.25.12.tgz",
+      "integrity": "sha512-HkqnmmBoCbCwxUKKNPBixiWDGCpQGVsrQfJoVGYLPT41XWF8lHuE5N6WhVia2n4o5QK5M4tYr21827fNhi4byQ==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/@esbuild/win32-x64": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.25.12.tgz",
+      "integrity": "sha512-alJC0uCZpTFrSL0CCDjcgleBXPnCrEAhTBILpeAp7M/OFgoqtAetfBzX0xM00MUsVVPpVjlPuMbREqnZCXaTnA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/vite/node_modules/esbuild": {
+      "version": "0.25.12",
+      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.25.12.tgz",
+      "integrity": "sha512-bbPBYYrtZbkt6Os6FiTLCTFxvq4tt3JKall1vRwshA3fdVztsLAatFaZobhkBC8/BrPetoa0oksYoKXoG4ryJg==",
+      "dev": true,
+      "hasInstallScript": true,
+      "license": "MIT",
+      "bin": {
+        "esbuild": "bin/esbuild"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "optionalDependencies": {
+        "@esbuild/aix-ppc64": "0.25.12",
+        "@esbuild/android-arm": "0.25.12",
+        "@esbuild/android-arm64": "0.25.12",
+        "@esbuild/android-x64": "0.25.12",
+        "@esbuild/darwin-arm64": "0.25.12",
+        "@esbuild/darwin-x64": "0.25.12",
+        "@esbuild/freebsd-arm64": "0.25.12",
+        "@esbuild/freebsd-x64": "0.25.12",
+        "@esbuild/linux-arm": "0.25.12",
+        "@esbuild/linux-arm64": "0.25.12",
+        "@esbuild/linux-ia32": "0.25.12",
+        "@esbuild/linux-loong64": "0.25.12",
+        "@esbuild/linux-mips64el": "0.25.12",
+        "@esbuild/linux-ppc64": "0.25.12",
+        "@esbuild/linux-riscv64": "0.25.12",
+        "@esbuild/linux-s390x": "0.25.12",
+        "@esbuild/linux-x64": "0.25.12",
+        "@esbuild/netbsd-arm64": "0.25.12",
+        "@esbuild/netbsd-x64": "0.25.12",
+        "@esbuild/openbsd-arm64": "0.25.12",
+        "@esbuild/openbsd-x64": "0.25.12",
+        "@esbuild/openharmony-arm64": "0.25.12",
+        "@esbuild/sunos-x64": "0.25.12",
+        "@esbuild/win32-arm64": "0.25.12",
+        "@esbuild/win32-ia32": "0.25.12",
+        "@esbuild/win32-x64": "0.25.12"
+      }
+    },
+    "node_modules/yallist": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
+      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
+      "dev": true,
+      "license": "ISC"
+    }
+  }
+}
```

### tsconfig.json

- 新增 19 行；SHA-256：`034b94339014edb2f07c9ea6cf4d16ab344a5ffd245ec1dd9fe72678abf3b2a2`。

```diff
--- /dev/null
+++ b/tsconfig.json
@@ -0,0 +1,19 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "lib": ["ES2022", "DOM", "DOM.Iterable"],
+    "module": "ESNext",
+    "moduleResolution": "Bundler",
+    "jsx": "react-jsx",
+    "strict": true,
+    "skipLibCheck": true,
+    "esModuleInterop": true,
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "noEmit": true,
+    "noUnusedLocals": true,
+    "noUnusedParameters": true,
+    "types": ["vite/client", "node"]
+  },
+  "include": ["src", "tests", "vite.config.ts"]
+}
```

### vite.config.ts

- 新增 4 行；SHA-256：`099316384050c3d7218e68808140ea3c9e69d0dab29e32b34c8540a24fc11e57`。

```diff
--- /dev/null
+++ b/vite.config.ts
@@ -0,0 +1,4 @@
+import { defineConfig } from "vite";
+import react from "@vitejs/plugin-react";
+
+export default defineConfig({ plugins: [react()] });
```

### index.html

- 新增 18 行；SHA-256：`d83034ac7fb66a4a8d7d83abbe4e84ec88cad5e7715e5c00480ecc08bd7db13d`。

```diff
--- /dev/null
+++ b/index.html
@@ -0,0 +1,18 @@
+<!doctype html>
+<html lang="zh-CN">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <meta name="theme-color" content="#071414" />
+    <meta
+      name="description"
+      content="遥遥领先：读取铁路信号，在不断提速、不断缩小的视野中，驾驶高铁生存至 350 km/h。"
+    />
+    <title>遥遥领先 · Too Far Ahead</title>
+    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/main.tsx"></script>
+  </body>
+</html>
```

### public/favicon.svg

- 新增 1 行；SHA-256：`bb3766115b8866ea413e3632288fd414af1856d67409235a199309d5dde9f398`。

```diff
--- /dev/null
+++ b/public/favicon.svg
@@ -0,0 +1 @@
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#071414"/><path d="m14 16 17 16-17 16M33 16l17 16-17 16" fill="none" stroke="#b6f36b" stroke-width="7"/></svg>
```

### src/App.tsx

- 新增 750 行；SHA-256：`111cbe4d916aef59fd5f375aadced799e487b17a4381af774bd2e2a4a9c7b8aa`。

```diff
--- /dev/null
+++ b/src/App.tsx
@@ -0,0 +1,750 @@
+import { useCallback, useEffect, useRef, useState } from "react";
+import { GameEngine } from "./game/engine";
+import { GameAudio } from "./game/audio";
+import { WorldRenderer } from "./game/renderer";
+import { LANE_NAMES, RULES, STAGES } from "./game/config";
+
+function Icon({
+  name,
+  size = 20,
+}: {
+  name:
+    | "ahead"
+    | "sound"
+    | "muted"
+    | "pause"
+    | "play"
+    | "restart"
+    | "arrow"
+    | "up"
+    | "down"
+    | "brake"
+    | "close"
+    | "expand";
+  size?: number;
+}) {
+  const paths: Record<typeof name, React.ReactNode> = {
+    ahead: (
+      <>
+        <path d="m3 4 8 8-8 8m10-16 8 8-8 8" />
+      </>
+    ),
+    sound: (
+      <>
+        <path d="M11 4 5 9H2v6h3l6 5V4Z" />
+        <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
+      </>
+    ),
+    muted: (
+      <>
+        <path d="M11 4 5 9H2v6h3l6 5V4Z" />
+        <path d="m16 9 6 6m0-6-6 6" />
+      </>
+    ),
+    pause: (
+      <>
+        <path d="M8 5v14M16 5v14" />
+      </>
+    ),
+    play: <path d="m8 4 12 8-12 8V4Z" />,
+    restart: (
+      <>
+        <path d="M3 10a9 9 0 1 1 1 7M3 3v7h7" />
+      </>
+    ),
+    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
+    up: <path d="m5 15 7-7 7 7" />,
+    down: <path d="m5 9 7 7 7-7" />,
+    brake: (
+      <>
+        <path d="M6 3H3v18h3m12-18h3v18h-3" />
+        <circle cx="12" cy="12" r="5" />
+        <path d="M12 9v4m0 2h.01" />
+      </>
+    ),
+    close: <path d="m6 6 12 12M6 18 18 6" />,
+    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
+  };
+  return (
+    <svg
+      width={size}
+      height={size}
+      viewBox="0 0 24 24"
+      fill="none"
+      stroke="currentColor"
+      strokeWidth="1.7"
+      strokeLinecap="round"
+      strokeLinejoin="round"
+      aria-hidden="true"
+    >
+      {paths[name]}
+    </svg>
+  );
+}
+
+const formatTime = (seconds: number) =>
+  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
+const hazardNames = {
+  construction: "前方施工封闭",
+  train: "前方慢车占道",
+  debris: "前方轨道异物",
+  switch: "道岔即将分流",
+};
+
+export default function App() {
+  const canvas = useRef<HTMLCanvasElement>(null);
+  const world = useRef<HTMLDivElement>(null);
+  const engine = useRef(new GameEngine());
+  const audio = useRef<GameAudio | null>(null);
+  const closeHelp = useRef<HTMLButtonElement>(null);
+  const [, refresh] = useState(0);
+  const [muted, setMuted] = useState(false);
+  const [help, setHelp] = useState(false);
+  const [fullScreen, setFullScreen] = useState(false);
+  const helpRef = useRef(false);
+  const pausedForHelp = useRef(false);
+  const s = engine.current.state;
+  const t = s.train;
+  const active = engine.current.active;
+  const finished = s.phase === "GAME_OVER" || s.phase === "VICTORY";
+  const upcoming = s.waves.find((w) => !w.passed);
+
+  const start = useCallback(() => {
+    audio.current?.unlock();
+    engine.current.start();
+    setHelp(false);
+    helpRef.current = false;
+    refresh((v) => v + 1);
+    world.current?.focus({ preventScroll: true });
+  }, []);
+
+  const toggleHelp = useCallback((open: boolean) => {
+    if (open) {
+      pausedForHelp.current = engine.current.active;
+      engine.current.pause();
+    } else if (pausedForHelp.current) {
+      engine.current.resume();
+      pausedForHelp.current = false;
+    }
+    helpRef.current = open;
+    setHelp(open);
+    refresh((v) => v + 1);
+    if (!open) world.current?.focus({ preventScroll: true });
+  }, []);
+
+  const toggleSound = () => {
+    audio.current?.unlock();
+    audio.current?.setMuted(!muted);
+    setMuted(!muted);
+  };
+
+  useEffect(() => {
+    const surface = canvas.current!,
+      host = world.current!;
+    const renderer = new WorldRenderer(surface);
+    const gameAudio = new GameAudio();
+    audio.current = gameAudio;
+    const observer = new ResizeObserver((entries) => {
+      const { width, height } = entries[0].contentRect;
+      renderer.resize(width, height);
+    });
+    observer.observe(host);
+    const rect = host.getBoundingClientRect();
+    renderer.resize(rect.width, rect.height);
+    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
+    let frame = 0,
+      previous = performance.now(),
+      uiAt = 0,
+      visualClock = 0;
+    const run = (now: number) => {
+      const delta = Math.min((now - previous) / 1000, 0.1);
+      previous = now;
+      engine.current.update(delta);
+      const state = engine.current.state;
+      if (state.phase !== "PAUSED" && state.phase !== "VICTORY")
+        visualClock += delta;
+      renderer.render(state, visualClock, motion.matches);
+      for (const event of engine.current.drainSounds()) gameAudio.play(event);
+      gameAudio.drive(state.train.speed, engine.current.active);
+      if (now - uiAt > 50) {
+        refresh((v) => v + 1);
+        uiAt = now;
+      }
+      frame = requestAnimationFrame(run);
+    };
+    frame = requestAnimationFrame(run);
+    const onKey = (event: KeyboardEvent) => {
+      if (helpRef.current) {
+        if (event.key === "Escape") toggleHelp(false);
+        return;
+      }
+      const key = event.key.toLowerCase();
+      // 保留按钮自身的 Enter / Space 行为，避免一次按键触发两次操作。
+      if (
+        event.target instanceof HTMLButtonElement &&
+        (key === " " || key === "enter")
+      )
+        return;
+      if (
+        [
+          "w",
+          "s",
+          "arrowup",
+          "arrowdown",
+          " ",
+          "escape",
+          "p",
+          "enter",
+        ].includes(key)
+      )
+        event.preventDefault();
+      if (event.repeat) return;
+      if (key === "w" || key === "arrowup") engine.current.changeLane(-1);
+      if (key === "s" || key === "arrowdown") engine.current.changeLane(1);
+      if (key === " ") {
+        gameAudio.unlock();
+        engine.current.brake();
+      }
+      if (key === "escape" || key === "p") engine.current.togglePause();
+      if (key === "enter") {
+        if (
+          ["READY", "GAME_OVER", "VICTORY"].includes(engine.current.state.phase)
+        )
+          start();
+        else if (engine.current.state.phase === "PAUSED")
+          engine.current.resume();
+      }
+      refresh((v) => v + 1);
+    };
+    const blur = () => {
+      engine.current.pause();
+      refresh((v) => v + 1);
+    };
+    const visibility = () => {
+      if (document.hidden) blur();
+    };
+    const onFullScreen = () => setFullScreen(!!document.fullscreenElement);
+    window.addEventListener("keydown", onKey);
+    window.addEventListener("blur", blur);
+    document.addEventListener("visibilitychange", visibility);
+    document.addEventListener("fullscreenchange", onFullScreen);
+    return () => {
+      cancelAnimationFrame(frame);
+      observer.disconnect();
+      gameAudio.dispose();
+      window.removeEventListener("keydown", onKey);
+      window.removeEventListener("blur", blur);
+      document.removeEventListener("visibilitychange", visibility);
+      document.removeEventListener("fullscreenchange", onFullScreen);
+    };
+  }, [start, toggleHelp]);
+
+  useEffect(() => {
+    if (help) closeHelp.current?.focus();
+  }, [help]);
+
+  const fullScreenToggle = () => {
+    if (document.fullscreenElement) void document.exitFullscreen();
+    else
+      void document.documentElement
+        .requestFullscreen?.()
+        .catch(() => undefined);
+  };
+
+  return (
+    <div className="app-shell">
+      <header className="header">
+        <div className="brand">
+          <span className="brand-mark">
+            <Icon name="ahead" size={25} />
+          </span>
+          <span className="brand-name">
+            遥遥领先<span>TOO FAR AHEAD</span>
+          </span>
+        </div>
+        <div className="header-center">
+          <span className="live-dot" /> 高速反应 · 生存挑战
+        </div>
+        <nav className="header-actions" aria-label="游戏选项">
+          <button className="text-button" onClick={() => toggleHelp(true)}>
+            <span className="help-symbol">?</span>
+            <span>操作指南</span>
+          </button>
+          <span className="divider" />
+          <button
+            className="icon-button"
+            title={muted ? "开启音效" : "关闭音效"}
+            aria-label={muted ? "开启音效" : "关闭音效"}
+            aria-pressed={!muted}
+            onClick={toggleSound}
+          >
+            <Icon name={muted ? "muted" : "sound"} size={18} />
+          </button>
+          <button
+            className="icon-button fullscreen-button"
+            title={fullScreen ? "退出全屏" : "全屏"}
+            aria-label={fullScreen ? "退出全屏" : "全屏"}
+            onClick={fullScreenToggle}
+          >
+            <Icon name="expand" size={18} />
+          </button>
+        </nav>
+      </header>
+
+      <main className="game-frame">
+        <div
+          className="world"
+          ref={world}
+          tabIndex={-1}
+          aria-label="高铁游戏区域：W 或上箭头上移，S 或下箭头下移，空格制动，P 暂停"
+        >
+          <canvas ref={canvas} aria-label="三轨高铁行驶场景" />
+          <div className="hud">
+            <div className={`speed-block ${t.isBraking ? "braking" : ""}`}>
+              <div className="eyebrow">
+                <span className="tiny-square" />
+                {t.isBraking ? "紧急制动中" : "当前速度"}
+              </div>
+              <div className="speed-value">
+                {Math.round(t.speed)}
+                <span>km/h</span>
+              </div>
+              <div className="speed-meter">
+                {Array.from({ length: 24 }, (_, i) => (
+                  <i key={i} className={i < 8 + s.stage * 3 ? "lit" : ""} />
+                ))}
+              </div>
+              <span className="base-speed">基础速度 {t.targetSpeed} km/h</span>
+            </div>
+            <div className="journey-hud">
+              <div className="journey-title">
+                {s.stage === 5 ? "遥遥领先状态" : "下一次领先"}
+                <span>
+                  {s.stage === 5
+                    ? `${Math.ceil(RULES.victoryDuration - s.peakTime)}s`
+                    : s.phase === "READY"
+                      ? "待发车"
+                      : `${Math.max(0, Math.ceil(s.leadingAt - s.time))}s`}
+                </span>
+              </div>
+              <div className="stage-track">
+                {STAGES.map((stage, i) => (
+                  <div
+                    key={stage.speed}
+                    className={`stage-point ${i <= s.stage ? "reached" : ""} ${i === s.stage ? "current" : ""}`}
+                  >
+                    <i />
+                    <span>{stage.speed}</span>
+                  </div>
+                ))}
+              </div>
+              <div className="journey-caption">
+                {s.stage === 5
+                  ? "保持领先 · 再坚持 60 秒"
+                  : "每一次领先，都更接近极限"}
+              </div>
+            </div>
+            <div className="brake-hud">
+              <div className="eyebrow">
+                紧急制动 <Icon name="brake" size={14} />
+              </div>
+              <button
+                className={`brake-status ${t.brakeCooldown === 0 ? "ready" : ""}`}
+                disabled={!active || t.brakeCooldown > 0}
+                onClick={() => {
+                  audio.current?.unlock();
+                  engine.current.brake();
+                  world.current?.focus({ preventScroll: true });
+                }}
+              >
+                <span>
+                  {t.isBraking
+                    ? "制动中"
+                    : t.brakeCooldown > 0
+                      ? `${t.brakeCooldown.toFixed(1)}s`
+                      : "已就绪"}
+                </span>
+                <kbd>SPACE</kbd>
+              </button>
+              <div className="cooldown-track">
+                <i
+                  style={{
+                    width: `${(1 - t.brakeCooldown / RULES.brakeCooldown) * 100}%`,
+                  }}
+                />
+              </div>
+              <span className="brake-hint">0.8s 制动 / 3s 冷却</span>
+            </div>
+          </div>
+
+          {s.phase === "READY" && (
+            <div className="start-screen">
+              <section className="start-content">
+                <div className="route-label">
+                  <span /> G001 · 夜行高架线
+                </div>
+                <h1>
+                  遥遥<span>领先</span>
+                  <i>。</i>
+                </h1>
+                <p className="english-title">TOO FAR AHEAD</p>
+                <p className="tagline">越领先，越危险。</p>
+                <p className="intro">
+                  速度不断攀升，前方视野不断缩小。
+                  <br />
+                  读懂信号，在来不及之前，做出选择。
+                </p>
+                <button className="primary-button start-button" onClick={start}>
+                  <Icon name="play" size={17} />
+                  开始驾驶
+                  <Icon name="arrow" size={20} />
+                </button>
+                <span className="enter-hint">
+                  或按 <kbd>ENTER</kbd> 发车
+                </span>
+              </section>
+              <aside className="mission-card">
+                <span className="mission-index">本次任务 / 01</span>
+                <div className="mission-speed">
+                  350<span>km/h</span>
+                </div>
+                <p>
+                  到达极速，再生存 <strong>60 秒</strong>
+                </p>
+                <div className="mission-rule" />
+                <div className="mission-note">
+                  <Icon name="ahead" size={16} />
+                  <span>
+                    系统会自动提速
+                    <br />
+                    领先无法撤回
+                  </span>
+                </div>
+              </aside>
+              <div className="scene-coordinate">
+                <span>31° 13′ N &nbsp; 121° 28′ E</span>
+                <span>城市边界 · 夜间运行</span>
+              </div>
+            </div>
+          )}
+
+          {active && (
+            <>
+              <div className={`signal-ribbon ${upcoming ? "has-signal" : ""}`}>
+                <span className={`signal-dot ${upcoming ? "amber" : ""}`} />
+                {upcoming ? (
+                  <>
+                    <span>{hazardNames[upcoming.kind]}</span>
+                    <span className="signal-separator">/</span>
+                    <strong>驶入{LANE_NAMES[upcoming.safeLane]}</strong>
+                    <Icon
+                      name={
+                        upcoming.safeLane < t.targetLane
+                          ? "up"
+                          : upcoming.safeLane > t.targetLane
+                            ? "down"
+                            : "arrow"
+                      }
+                      size={17}
+                    />
+                  </>
+                ) : (
+                  <>
+                    <span>前方信号正常</span>
+                    <span className="signal-separator">/</span>
+                    <strong>保持观察</strong>
+                  </>
+                )}
+              </div>
+              <div className="run-stats">
+                <span>
+                  生存时间 <strong>{formatTime(s.time)}</strong>
+                </span>
+                <span>
+                  安全通过 <strong>{String(s.passed).padStart(2, "0")}</strong>
+                </span>
+                <button
+                  className="icon-button"
+                  aria-label="暂停游戏"
+                  title="暂停游戏（P）"
+                  onClick={() => engine.current.pause()}
+                >
+                  <Icon name="pause" size={17} />
+                </button>
+              </div>
+              {t.laneProgress < 1 && (
+                <div className="changing-label">正在变轨 · 方向已锁定</div>
+              )}
+            </>
+          )}
+
+          {s.phase === "LEADING_WARNING" && (
+            <div className="leading-alert" role="status">
+              <span>即将遥遥领先</span>
+              <strong>
+                {Math.max(
+                  1,
+                  Math.ceil((s.leadingAt - s.time) / (RULES.warning / 3)),
+                )}
+              </strong>
+              <small>速度 +20 · 视野收缩</small>
+            </div>
+          )}
+          {active && s.burst > 0 && (
+            <div className="leading-burst" role="status">
+              <Icon name="ahead" size={30} />
+              <strong>遥遥领先！</strong>
+              <span>{t.targetSpeed} km/h</span>
+            </div>
+          )}
+
+          {s.phase === "PAUSED" && !help && (
+            <div className="screen-overlay">
+              <section className="result-card pause-card">
+                <span className="card-kicker">行程已暂停</span>
+                <h2>喘口气，再领先。</h2>
+                <p>切回页面不会自动发车，准备好后继续。</p>
+                <button
+                  className="primary-button"
+                  onClick={() => {
+                    audio.current?.unlock();
+                    engine.current.resume();
+                    world.current?.focus({ preventScroll: true });
+                  }}
+                >
+                  <Icon name="play" size={18} />
+                  继续驾驶
+                </button>
+                <button className="secondary-button" onClick={start}>
+                  <Icon name="restart" size={16} />
+                  重新开始
+                </button>
+                <span className="panel-footnote">按 P / ESC 也可继续</span>
+              </section>
+            </div>
+          )}
+
+          {finished && (
+            <div className="screen-overlay">
+              <section
+                className={`result-card ${s.phase === "VICTORY" ? "victory" : ""}`}
+                role="dialog"
+                aria-modal="true"
+                aria-labelledby="result-title"
+              >
+                <span className="result-symbol">
+                  <Icon
+                    name={s.phase === "VICTORY" ? "ahead" : "brake"}
+                    size={30}
+                  />
+                </span>
+                <span className="card-kicker">
+                  {s.phase === "VICTORY"
+                    ? "任务完成 · 350 km/h"
+                    : "行程结束 · 信号不会等待"}
+                </span>
+                <h2 id="result-title">
+                  {s.phase === "VICTORY"
+                    ? "你已经遥遥领先。"
+                    : "这次，快了一步。"}
+                </h2>
+                <p>
+                  {s.phase === "VICTORY"
+                    ? "在最窄的视野里，你守住了最后 60 秒。"
+                    : s.message}
+                </p>
+                <div className="result-main-stats">
+                  <div>
+                    <strong>{formatTime(s.time)}</strong>
+                    <span>生存时间</span>
+                  </div>
+                  <div>
+                    <strong>
+                      {t.targetSpeed}
+                      <small> km/h</small>
+                    </strong>
+                    <span>最高速度</span>
+                  </div>
+                </div>
+                <div className="result-sub-stats">
+                  <div>
+                    <strong>
+                      {s.stage}
+                      <small> / 5</small>
+                    </strong>
+                    <span>领先阶段</span>
+                  </div>
+                  <div>
+                    <strong>{s.changes}</strong>
+                    <span>成功切轨</span>
+                  </div>
+                  <div>
+                    <strong>{s.closeCalls}</strong>
+                    <span>极限反应</span>
+                  </div>
+                </div>
+                <button className="primary-button" onClick={start}>
+                  <Icon name="restart" size={18} />
+                  再开一局
+                  <Icon name="arrow" size={19} />
+                </button>
+                <button
+                  className="text-button return-button"
+                  onClick={() => {
+                    engine.current.reset();
+                    refresh((v) => v + 1);
+                  }}
+                >
+                  返回发车页
+                </button>
+                <span className="panel-footnote">
+                  {s.phase === "VICTORY"
+                    ? "本次行程已完成"
+                    : "提前读信号，给变轨留出时间。"}
+                </span>
+              </section>
+            </div>
+          )}
+        </div>
+
+        <footer className="control-deck">
+          <div className="control-group">
+            <span className="control-label">驾驶操作</span>
+            <div className="lane-controls">
+              <button
+                aria-label="上移轨道"
+                disabled={!active || t.laneProgress < 1 || t.lane === 0}
+                onClick={() => {
+                  engine.current.changeLane(-1);
+                  world.current?.focus({ preventScroll: true });
+                }}
+              >
+                <Icon name="up" size={15} />
+                <kbd>W</kbd>
+              </button>
+              <button
+                aria-label="下移轨道"
+                disabled={!active || t.laneProgress < 1 || t.lane === 2}
+                onClick={() => {
+                  engine.current.changeLane(1);
+                  world.current?.focus({ preventScroll: true });
+                }}
+              >
+                <Icon name="down" size={15} />
+                <kbd>S</kbd>
+              </button>
+            </div>
+            <span className="control-description">切换轨道</span>
+            <span className="control-line" />
+            <button
+              className="space-control"
+              disabled={!active || t.brakeCooldown > 0}
+              onClick={() => {
+                audio.current?.unlock();
+                engine.current.brake();
+                world.current?.focus({ preventScroll: true });
+              }}
+            >
+              <kbd>SPACE</kbd>
+            </button>
+            <span className="control-description">紧急制动</span>
+          </div>
+          <div className="signal-legend">
+            <span>
+              <i className="legend-dot green" />
+              安全
+            </span>
+            <span>
+              <i className="legend-dot yellow" />
+              风险
+            </span>
+            <span>
+              <i className="legend-dot red" />
+              封闭
+            </span>
+          </div>
+          <div className="goal-caption">
+            <span className="target-icon">◎</span>
+            <span>
+              到达 <strong>350</strong> km/h · 生存 <strong>60s</strong>
+            </span>
+          </div>
+        </footer>
+      </main>
+      <div className="page-footer">
+        <span>
+          <i />
+          先读信号，再做选择。
+        </span>
+        <span>
+          三个轨道。一次机会。<b> GAME X / 001</b>
+        </span>
+      </div>
+
+      {help && (
+        <div className="help-overlay" onClick={() => toggleHelp(false)}>
+          <section
+            className="help-card"
+            role="dialog"
+            aria-modal="true"
+            aria-labelledby="help-title"
+            onClick={(e) => e.stopPropagation()}
+            onKeyDown={(e) => {
+              if (e.key === "Tab") {
+                e.preventDefault();
+                closeHelp.current?.focus();
+              }
+            }}
+          >
+            <button
+              ref={closeHelp}
+              className="icon-button close-help"
+              aria-label="关闭操作指南"
+              onClick={() => toggleHelp(false)}
+            >
+              <Icon name="close" />
+            </button>
+            <span className="card-kicker">发车前，花 20 秒</span>
+            <h2 id="help-title">领先之前，先读懂信号。</h2>
+            <div className="help-controls">
+              <p>
+                <kbd>W / ↑</kbd>
+                <span>上移一轨</span>
+              </p>
+              <p>
+                <kbd>S / ↓</kbd>
+                <span>下移一轨</span>
+              </p>
+              <p>
+                <kbd>SPACE</kbd>
+                <span>制动 0.8 秒，冷却 3 秒</span>
+              </p>
+              <p>
+                <kbd>P / ESC</kbd>
+                <span>暂停 / 继续</span>
+              </p>
+            </div>
+            <ol>
+              <li>
+                <strong>信号先行。</strong>
+                红灯表示封闭，黄灯表示慢车或异物，绿灯指向安全轨道；顶部会提前提示推荐路线。
+              </li>
+              <li>
+                <strong>变轨需要时间。</strong>耗时 0.48–0.78
+                秒，途中不能反向取消。不要等障碍来到车头才转向。
+              </li>
+              <li>
+                <strong>领先不可撤回。</strong>系统每 15–30 秒自动提速 20
+                km/h，并提前 2 秒预警。车头从 10% 推进到 60%。
+              </li>
+              <li>
+                <strong>保持 350 km/h，再生存 60 秒。</strong>
+                制动只临时减速，碰撞即结束。手机也可使用底部按钮驾驶，横屏视野更好。
+              </li>
+            </ol>
+          </section>
+        </div>
+      )}
+    </div>
+  );
+}
```

### src/game/audio.ts

- 新增 96 行；SHA-256：`5e08137e93176f5d2ec4c200a60c5dc33109a791a68770dc993ba304e4e44d7e`。

```diff
--- /dev/null
+++ b/src/game/audio.ts
@@ -0,0 +1,96 @@
+import type { SoundEvent } from "./engine";
+
+/** 音效在用户手势后创建，不加载外部资源；暂停时关闭持续行驶声。 */
+export class GameAudio {
+  private context?: AudioContext;
+  private master?: GainNode;
+  private motor?: OscillatorNode;
+  private motorGain?: GainNode;
+  muted = false;
+
+  unlock() {
+    if (!this.context) {
+      this.context = new AudioContext();
+      this.master = this.context.createGain();
+      this.master.gain.value = 0.18;
+      this.master.connect(this.context.destination);
+      this.motor = this.context.createOscillator();
+      this.motor.type = "sawtooth";
+      const filter = this.context.createBiquadFilter();
+      filter.type = "lowpass";
+      filter.frequency.value = 180;
+      this.motorGain = this.context.createGain();
+      this.motorGain.gain.value = 0;
+      this.motor.connect(filter);
+      filter.connect(this.motorGain);
+      this.motorGain.connect(this.master);
+      this.motor.start();
+    }
+    void this.context.resume().catch(() => undefined);
+  }
+
+  setMuted(value: boolean) {
+    this.muted = value;
+    if (this.master && this.context)
+      this.master.gain.setTargetAtTime(
+        value ? 0 : 0.18,
+        this.context.currentTime,
+        0.03,
+      );
+  }
+
+  drive(speed: number, active: boolean) {
+    if (!this.context || !this.motor || !this.motorGain) return;
+    this.motor.frequency.setTargetAtTime(
+      35 + speed * 0.16,
+      this.context.currentTime,
+      0.1,
+    );
+    this.motorGain.gain.setTargetAtTime(
+      active ? 0.09 : 0,
+      this.context.currentTime,
+      0.08,
+    );
+  }
+
+  play(event: SoundEvent) {
+    if (!this.context || !this.master || this.muted) return;
+    const notes: Record<SoundEvent, number[]> = {
+      start: [392, 523, 784],
+      change: [330, 440],
+      brake: [170, 100],
+      warning: [660],
+      leading: [440, 554, 659, 880],
+      pass: [880],
+      crash: [110, 73, 45],
+      victory: [523, 659, 784, 1046],
+    };
+    notes[event].forEach((freq, i) => {
+      const ctx = this.context!,
+        oscillator = ctx.createOscillator(),
+        gain = ctx.createGain();
+      const at = ctx.currentTime + i * 0.085;
+      oscillator.type =
+        event === "crash" || event === "brake" ? "sawtooth" : "sine";
+      oscillator.frequency.setValueAtTime(freq, at);
+      gain.gain.setValueAtTime(0, at);
+      gain.gain.linearRampToValueAtTime(
+        event === "pass" ? 0.06 : 0.32,
+        at + 0.012,
+      );
+      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.23);
+      oscillator.connect(gain);
+      gain.connect(this.master!);
+      oscillator.start(at);
+      oscillator.stop(at + 0.25);
+      oscillator.onended = () => {
+        oscillator.disconnect();
+        gain.disconnect();
+      };
+    });
+  }
+
+  dispose() {
+    void this.context?.close().catch(() => undefined);
+  }
+}
```

### src/game/config.ts

- 新增 29 行；SHA-256：`7c33ddc1d2d905ce3c7295decfd1ed49dfcbaf58318786cfa66ba76733fac9b4`。

```diff
--- /dev/null
+++ b/src/game/config.ts
@@ -0,0 +1,29 @@
+export const STAGES = [
+  { speed: 250, screenX: 0.1, reaction: 2.8, laneDuration: 0.48 },
+  { speed: 270, screenX: 0.2, reaction: 2.3, laneDuration: 0.54 },
+  { speed: 290, screenX: 0.3, reaction: 2.0, laneDuration: 0.6 },
+  { speed: 310, screenX: 0.4, reaction: 1.7, laneDuration: 0.66 },
+  { speed: 330, screenX: 0.5, reaction: 1.4, laneDuration: 0.72 },
+  { speed: 350, screenX: 0.6, reaction: 1.1, laneDuration: 0.78 },
+] as const;
+
+export const RULES = {
+  leadingMin: 15,
+  leadingMax: 30,
+  warning: 2,
+  leadingMove: 0.85,
+  brakeDuration: 0.8,
+  brakeCooldown: 3,
+  brakeFactor: 0.38,
+  victoryDuration: 60,
+  signalLead: 1.45,
+  firstWave: 3,
+  waveGap: 1.6,
+  collisionTail: 0.075,
+  minDecision: 0.8,
+} as const;
+
+export const LANE_NAMES = ["上轨", "中轨", "下轨"] as const;
+export const smooth = (t: number) => t * t * (3 - 2 * t);
+export const clamp = (v: number, min: number, max: number) =>
+  Math.max(min, Math.min(max, v));
```

### src/game/engine.ts

- 新增 365 行；SHA-256：`89eb809250aa3df153f7834af06aa5bfbd702447dafaad25e58f86cde8ddbdc3`。

```diff
--- /dev/null
+++ b/src/game/engine.ts
@@ -0,0 +1,365 @@
+import { clamp, RULES, smooth, STAGES } from "./config";
+
+export type Phase =
+  "READY" | "PLAYING" | "LEADING_WARNING" | "PAUSED" | "GAME_OVER" | "VICTORY";
+export type ObstacleKind = "construction" | "train" | "debris" | "switch";
+export type SoundEvent =
+  | "start"
+  | "change"
+  | "brake"
+  | "warning"
+  | "leading"
+  | "pass"
+  | "crash"
+  | "victory";
+export interface Wave {
+  id: number;
+  x: number;
+  blocked: number[];
+  safeLane: number;
+  kind: ObstacleKind;
+  passed: boolean;
+  decisionTime: number;
+  laneAtSpawn: number;
+  pendingCloseCall?: boolean;
+}
+export interface TrainState {
+  speed: number;
+  targetSpeed: number;
+  lane: number;
+  targetLane: number;
+  fromLane: number;
+  laneY: number;
+  laneProgress: number;
+  laneDuration: number;
+  screenX: number;
+  targetScreenX: number;
+  fromScreenX: number;
+  xProgress: number;
+  brakeCooldown: number;
+  brakeRemaining: number;
+  isBraking: boolean;
+}
+export interface GameState {
+  phase: Phase;
+  resumePhase: Phase;
+  stage: number;
+  time: number;
+  distance: number;
+  leadingAt: number;
+  peakTime: number;
+  changes: number;
+  closeCalls: number;
+  passed: number;
+  train: TrainState;
+  waves: Wave[];
+  spawnAt: number;
+  scroll: number;
+  impact: number;
+  burst: number;
+  message: string;
+}
+
+/** 使用可注入随机源，便于用同一套真实规则重复验证整局游戏。 */
+export class GameEngine {
+  state!: GameState;
+  private sequence = 0;
+  private warningTick = -1;
+  private sounds: SoundEvent[] = [];
+
+  constructor(private random: () => number = Math.random) {
+    this.reset();
+  }
+
+  reset() {
+    this.sequence = 0;
+    this.warningTick = -1;
+    this.sounds = [];
+    this.state = {
+      phase: "READY",
+      resumePhase: "PLAYING",
+      stage: 0,
+      time: 0,
+      distance: 0,
+      leadingAt: this.nextInterval(),
+      peakTime: 0,
+      changes: 0,
+      closeCalls: 0,
+      passed: 0,
+      waves: [],
+      spawnAt: RULES.firstWave,
+      scroll: 0,
+      impact: 0,
+      burst: 0,
+      message: "",
+      train: {
+        speed: 250,
+        targetSpeed: 250,
+        lane: 1,
+        targetLane: 1,
+        fromLane: 1,
+        laneY: 1,
+        laneProgress: 1,
+        laneDuration: STAGES[0].laneDuration,
+        screenX: 0.1,
+        targetScreenX: 0.1,
+        fromScreenX: 0.1,
+        xProgress: 1,
+        brakeCooldown: 0,
+        brakeRemaining: 0,
+        isBraking: false,
+      },
+    };
+  }
+
+  start() {
+    this.reset();
+    this.state.phase = "PLAYING";
+    this.sounds.push("start");
+  }
+  get active() {
+    return (
+      this.state.phase === "PLAYING" || this.state.phase === "LEADING_WARNING"
+    );
+  }
+  get config() {
+    return STAGES[this.state.stage];
+  }
+  get velocity() {
+    return (1 - this.config.screenX) / this.config.reaction;
+  }
+  drainSounds() {
+    return this.sounds.splice(0);
+  }
+
+  pause() {
+    if (this.active) {
+      this.state.resumePhase = this.state.phase;
+      this.state.phase = "PAUSED";
+    }
+  }
+  resume() {
+    if (this.state.phase === "PAUSED")
+      this.state.phase = this.state.resumePhase;
+  }
+  togglePause() {
+    if (this.state.phase === "PAUSED") this.resume();
+    else this.pause();
+  }
+
+  changeLane(direction: -1 | 1) {
+    const t = this.state.train;
+    // 变道途中锁定方向，不允许按键连发取消，也不缓存反向操作。
+    if (!this.active || t.laneProgress < 1) return false;
+    const target = clamp(t.lane + direction, 0, 2);
+    if (target === t.lane) return false;
+    const imminent = this.state.waves.find(
+      (w) => !w.passed && w.blocked.includes(t.lane),
+    );
+    if (imminent) {
+      const eta = (imminent.x - t.screenX) / this.velocity;
+      if (
+        eta < this.config.laneDuration + 0.4 &&
+        eta > this.config.laneDuration
+      )
+        imminent.pendingCloseCall = true;
+    }
+    t.fromLane = t.lane;
+    t.targetLane = target;
+    t.laneProgress = 0;
+    t.laneDuration = this.config.laneDuration;
+    this.sounds.push("change");
+    return true;
+  }
+
+  brake() {
+    const t = this.state.train;
+    if (!this.active || t.brakeCooldown > 0) return false;
+    t.brakeRemaining = RULES.brakeDuration;
+    t.brakeCooldown = RULES.brakeCooldown;
+    t.isBraking = true;
+    this.sounds.push("brake");
+    return true;
+  }
+
+  /** 每帧细分到最多 1/120 秒，避免低帧率下穿透障碍或跳过阶段。 */
+  update(delta: number) {
+    let remaining = Math.max(0, Math.min(delta, 0.25));
+    while (remaining > 0.000001) {
+      const dt = Math.min(remaining, 1 / 120);
+      this.step(dt);
+      remaining -= dt;
+    }
+  }
+
+  private step(dt: number) {
+    const s = this.state;
+    if (s.phase === "READY") {
+      s.scroll += dt * 0.036;
+      return;
+    }
+    if (s.phase === "GAME_OVER") {
+      // 碰撞后的世界短暂慢速滑行，玩法时钟和输入保持冻结。
+      s.impact = Math.max(0, s.impact - dt * 0.9);
+      s.scroll += dt * this.velocity * s.impact * 0.07;
+      return;
+    }
+    if (!this.active) return;
+    const t = s.train;
+    s.time += dt;
+    s.burst = Math.max(0, s.burst - dt);
+    t.brakeCooldown = Math.max(0, t.brakeCooldown - dt);
+    t.brakeRemaining = Math.max(0, t.brakeRemaining - dt);
+    t.isBraking = t.brakeRemaining > 0;
+    t.speed = t.targetSpeed * (t.isBraking ? RULES.brakeFactor : 1);
+    const movement = this.velocity * (t.isBraking ? RULES.brakeFactor : 1) * dt;
+    s.scroll += movement;
+    s.distance += (t.speed / 3600) * dt;
+
+    if (t.laneProgress < 1) {
+      t.laneProgress = Math.min(1, t.laneProgress + dt / t.laneDuration);
+      t.laneY =
+        t.fromLane + (t.targetLane - t.fromLane) * smooth(t.laneProgress);
+      if (t.laneProgress === 1) {
+        t.lane = t.targetLane;
+        s.changes++;
+      }
+    }
+    t.xProgress = Math.min(1, t.xProgress + dt / RULES.leadingMove);
+    t.screenX =
+      t.fromScreenX + (t.targetScreenX - t.fromScreenX) * smooth(t.xProgress);
+
+    if (s.stage < STAGES.length - 1) {
+      const until = s.leadingAt - s.time;
+      if (until <= RULES.warning) {
+        s.phase = "LEADING_WARNING";
+        const tick = Math.max(1, Math.ceil(until / (RULES.warning / 3)));
+        if (tick !== this.warningTick) {
+          this.warningTick = tick;
+          this.sounds.push("warning");
+        }
+      }
+      if (until <= 0) this.advanceStage();
+    } else {
+      s.peakTime += dt;
+      if (s.peakTime >= RULES.victoryDuration) {
+        s.peakTime = RULES.victoryDuration;
+        s.phase = "VICTORY";
+        this.sounds.push("victory");
+        return;
+      }
+    }
+
+    for (const wave of s.waves) {
+      const previousX = wave.x;
+      wave.x -= movement;
+      // 检查扫过的车头区间；过障期间同时覆盖换轨路径中的两条轨道。
+      if (
+        !wave.passed &&
+        wave.x <= t.screenX + 0.009 &&
+        previousX >= t.screenX - RULES.collisionTail
+      ) {
+        const occupied =
+          t.laneProgress < 1 ? [t.fromLane, t.targetLane] : [t.lane];
+        if (wave.blocked.some((lane) => occupied.includes(lane))) {
+          s.phase = "GAME_OVER";
+          s.impact = 1;
+          s.message =
+            wave.kind === "train"
+              ? "未能及时避让前方慢车"
+              : wave.kind === "switch"
+                ? "驶入了关闭的道岔"
+                : wave.kind === "debris"
+                  ? "撞上了轨道异物"
+                  : "驶入了封闭施工区";
+          this.sounds.push("crash");
+          return;
+        }
+      }
+      if (!wave.passed && wave.x < t.screenX - RULES.collisionTail) {
+        wave.passed = true;
+        s.passed++;
+        this.sounds.push("pass");
+        // 只有真正安全通过，才把最后时刻的避让计为极限反应。
+        if (wave.pendingCloseCall) s.closeCalls++;
+        s.spawnAt = s.time + RULES.waveGap + this.random() * 0.8;
+      }
+    }
+    s.waves = s.waves.filter((w) => w.x > -0.3);
+    // 不叠加未通过波次；提速前先清空决策窗口，避免车头推进造成突然撞击。
+    const hasWave = s.waves.some((w) => !w.passed);
+    const clearTime =
+      this.config.reaction + RULES.signalLead + RULES.brakeDuration + 1;
+    if (
+      !hasWave &&
+      s.time >= s.spawnAt &&
+      s.burst === 0 &&
+      (s.stage === 5 || s.leadingAt - s.time > clearTime + RULES.warning)
+    )
+      this.spawnWave();
+  }
+
+  private advanceStage() {
+    const s = this.state;
+    // 连续制动或极低帧率下，待当前波次通过才推进镜头，警告仍然有效。
+    if (s.waves.some((w) => !w.passed)) {
+      s.leadingAt = s.time + 0.1;
+      return;
+    }
+    s.stage++;
+    s.phase = "PLAYING";
+    const config = this.config;
+    Object.assign(s.train, {
+      targetSpeed: config.speed,
+      fromScreenX: s.train.screenX,
+      targetScreenX: config.screenX,
+      xProgress: 0,
+    });
+    s.burst = 1.4;
+    s.leadingAt = s.time + this.nextInterval();
+    s.spawnAt = s.time + 1.8;
+    this.warningTick = -1;
+    this.sounds.push("leading");
+  }
+
+  private nextInterval() {
+    return (
+      RULES.leadingMin + this.random() * (RULES.leadingMax - RULES.leadingMin)
+    );
+  }
+
+  private spawnWave() {
+    const s = this.state;
+    const origin = s.train.targetLane;
+    const types: ObstacleKind[] = ["construction", "train", "debris", "switch"];
+    const kind = types[this.sequence % types.length];
+    // 安全出口只选当前或相邻轨道；双封闭道岔也不会强迫跨两轨。
+    const options = [0, 1, 2].filter(
+      (lane) => lane !== origin && Math.abs(lane - origin) === 1,
+    );
+    const safeLane = options[Math.floor(this.random() * options.length)];
+    const blocked =
+      kind === "switch"
+        ? [0, 1, 2].filter((lane) => lane !== safeLane)
+        : [origin];
+    const unfinished = (1 - s.train.laneProgress) * s.train.laneDuration;
+    const needed =
+      unfinished +
+      Math.abs(safeLane - origin) * this.config.laneDuration +
+      RULES.minDecision;
+    const decisionTime = Math.max(
+      this.config.reaction + RULES.signalLead,
+      needed,
+    );
+    s.waves.push({
+      id: ++this.sequence,
+      x: s.train.screenX + this.velocity * decisionTime,
+      blocked,
+      safeLane,
+      kind,
+      passed: false,
+      decisionTime,
+      laneAtSpawn: origin,
+    });
+  }
+}
```

### src/game/renderer.ts

- 新增 515 行；SHA-256：`832517a7b37a9cc48b5d443c78cbca5a08abccf351c783c730d87a640e8d56a4`。

```diff
--- /dev/null
+++ b/src/game/renderer.ts
@@ -0,0 +1,515 @@
+import { LANE_NAMES, RULES } from "./config";
+import type { GameState, Wave } from "./engine";
+
+const C = {
+  mint: "#b6f36b",
+  cyan: "#66dfd0",
+  red: "#ff7773",
+  amber: "#f4c56e",
+};
+const fract = (n: number) => n - Math.floor(n);
+const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
+
+/** 世界只消费状态，不参与规则计算；所有坐标随画布缩放。 */
+export class WorldRenderer {
+  private ctx: CanvasRenderingContext2D;
+  private width = 1;
+  private height = 1;
+  private ratio = 1;
+
+  constructor(private canvas: HTMLCanvasElement) {
+    this.ctx = canvas.getContext("2d", { alpha: false })!;
+  }
+
+  resize(width: number, height: number) {
+    this.width = width;
+    this.height = height;
+    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
+    this.canvas.width = Math.round(width * this.ratio);
+    this.canvas.height = Math.round(height * this.ratio);
+  }
+
+  render(s: GameState, clock: number, reducedMotion: boolean) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
+    c.clearRect(0, 0, w, h);
+    const shake = reducedMotion ? 0 : s.impact * 6 + s.burst * 1.3;
+    c.save();
+    c.translate(
+      Math.sin(clock * 70) * shake,
+      Math.cos(clock * 59) * shake * 0.4,
+    );
+    this.sky(s, clock);
+    this.city(s);
+    this.rails(s);
+    if (s.phase !== "READY") this.sightline(s);
+    const laneY = (lane: number) => h * (0.58 + lane * 0.147);
+
+    // 轨道按远近绘制，避免下轨实体被上轨列车覆盖。
+    for (let lane = 0; lane < 3; lane++) {
+      for (const wave of s.waves) {
+        if (!wave.passed) this.signal(wave, lane, laneY(lane), s, clock);
+        if (wave.blocked.includes(lane) && wave.x < 1.2)
+          this.obstacle(wave, laneY(lane));
+      }
+      const currentLane = Math.round(s.train.laneY);
+      if (currentLane === lane) {
+        const ready = s.phase === "READY";
+        const x = ready ? w * 0.69 : s.train.screenX * w;
+        const y = ready ? laneY(1) : laneY(s.train.laneY);
+        this.train(
+          x,
+          y,
+          Math.max(w * 0.265, 240),
+          Math.max(26, Math.min(h * 0.064, 47)),
+          false,
+          s,
+        );
+      }
+    }
+    this.foreground(s);
+    if (!reducedMotion) this.speedLines(s, clock);
+    c.restore();
+    const vignette = c.createLinearGradient(0, 0, 0, h);
+    vignette.addColorStop(0, "#04111000");
+    vignette.addColorStop(0.87, "#04111000");
+    vignette.addColorStop(1, "#04111090");
+    c.fillStyle = vignette;
+    c.fillRect(0, 0, w, h);
+  }
+
+  private sky(s: GameState, clock: number) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    const sky = c.createLinearGradient(0, 0, 0, h * 0.68);
+    sky.addColorStop(0, "#071719");
+    sky.addColorStop(0.55, "#102b2c");
+    sky.addColorStop(1, "#2b5350");
+    c.fillStyle = sky;
+    c.fillRect(0, 0, w, h);
+    const halo = c.createRadialGradient(
+      w * 0.75,
+      h * 0.27,
+      0,
+      w * 0.75,
+      h * 0.27,
+      h * 0.3,
+    );
+    halo.addColorStop(0, "#a4d6b80d");
+    halo.addColorStop(1, "#a4d6b800");
+    c.fillStyle = halo;
+    c.fillRect(0, 0, w, h * 0.6);
+    for (let i = 0; i < 75; i++) {
+      const x = fract(noise(i) - s.scroll * 0.001) * w;
+      const y = noise(i + 80) * h * 0.43;
+      c.fillStyle = `rgba(182,218,207,${0.15 + noise(i + 50) * 0.35 + Math.sin(clock * 0.5 + i) * 0.04})`;
+      c.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
+    }
+    c.fillStyle = "#d1dfbf";
+    c.beginPath();
+    c.arc(w * 0.77, h * 0.255, h * 0.025, 0, Math.PI * 2);
+    c.fill();
+    c.fillStyle = "#173234";
+    c.beginPath();
+    c.arc(w * 0.775, h * 0.247, h * 0.023, 0, Math.PI * 2);
+    c.fill();
+    for (let layer = 0; layer < 3; layer++) {
+      const base = h * (0.45 + layer * 0.052);
+      c.fillStyle = ["#1a393b", "#163333", "#102b2a"][layer];
+      c.beginPath();
+      c.moveTo(-100, h);
+      for (let j = -1; j <= 23; j++) {
+        const offset = s.scroll * (0.006 + layer * 0.006);
+        const index = j + Math.floor(offset * 20);
+        const x = (j / 20 - fract(offset * 20) / 20) * w;
+        c.lineTo(
+          x,
+          base - noise(index + layer * 70) * h * (0.12 - layer * 0.025),
+        );
+      }
+      c.lineTo(w + 100, h);
+      c.closePath();
+      c.fill();
+    }
+    c.strokeStyle = "#8cb5a51c";
+    c.lineWidth = 1;
+    c.beginPath();
+    c.moveTo(0, h * 0.49);
+    c.lineTo(w, h * 0.49);
+    c.stroke();
+  }
+
+  private city(s: GameState) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    const step = 39;
+    const shift = s.scroll * w * 0.047;
+    for (let i = -1; i < w / step + 2; i++) {
+      const id = i + Math.floor(shift / step);
+      const x = i * step - (shift % step);
+      const bh = 12 + noise(id + 42) * h * 0.095;
+      const bw = 17 + noise(id + 87) * 23;
+      c.fillStyle = "#0e2526";
+      c.fillRect(x, h * 0.514 - bh, bw, bh);
+      c.fillStyle = "#95bc9229";
+      for (let row = 0; row < bh / 9 - 1; row++) {
+        for (let col = 0; col < bw / 8 - 1; col++) {
+          if (noise(id * 31 + row * 7 + col) > 0.6)
+            c.fillRect(x + 5 + col * 8, h * 0.514 - bh + 7 + row * 9, 2, 2);
+        }
+      }
+    }
+  }
+
+  private rails(s: GameState) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    c.fillStyle = "#112422";
+    c.fillRect(0, h * 0.53, w, h);
+    for (let lane = 0; lane < 3; lane++) {
+      const y = h * (0.58 + lane * 0.147);
+      c.fillStyle = lane === 1 ? "#172d29" : "#142925";
+      c.fillRect(0, y - 13, w, h * 0.11);
+      const shift = (s.scroll * w) % 39;
+      c.strokeStyle = "#24423a";
+      c.lineWidth = 5;
+      c.beginPath();
+      for (let x = -40; x < w + 40; x += 39) {
+        c.moveTo(x - shift - 7, y + 2);
+        c.lineTo(x - shift + 8, y + 40);
+      }
+      c.stroke();
+      for (const dy of [5, 31]) {
+        c.fillStyle = "#081b19";
+        c.fillRect(0, y + dy, w, 7);
+        c.fillStyle = "#577469";
+        c.fillRect(0, y + dy, w, 1);
+        c.fillStyle = "#314e42";
+        c.fillRect(0, y + dy + 1, w, 2);
+      }
+      c.fillStyle = "#91afa238";
+      c.font = "11px monospace";
+      c.fillText(`0${lane + 1}`, 18, y + 23);
+      c.strokeStyle = "#63857826";
+      c.lineWidth = 1;
+      c.beginPath();
+      c.moveTo(0, y + h * 0.105);
+      c.lineTo(w, y + h * 0.105);
+      c.stroke();
+    }
+  }
+
+  private sightline(s: GameState) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height,
+      x = s.train.screenX * w;
+    c.fillStyle = "#06100f22";
+    c.fillRect(0, h * 0.51, x, h * 0.46);
+    c.strokeStyle = `${C.mint}38`;
+    c.lineWidth = 1;
+    c.setLineDash([4, 7]);
+    c.beginPath();
+    c.moveTo(x, h * 0.37);
+    c.lineTo(x, h * 0.96);
+    c.stroke();
+    c.setLineDash([]);
+    c.strokeStyle = "#b6f36b40";
+    c.beginPath();
+    c.moveTo(x + 4, h * 0.38);
+    c.lineTo(w - 24, h * 0.38);
+    c.stroke();
+    c.fillStyle = "#afcfb5";
+    c.font = "11px monospace";
+    c.fillText(
+      `前方视野 ${Math.round((1 - s.train.screenX) * 100)}%`,
+      x + 10,
+      h * 0.38 - 10,
+    );
+  }
+
+  private train(
+    x: number,
+    y: number,
+    length: number,
+    height: number,
+    slow: boolean,
+    s?: GameState,
+  ) {
+    const c = this.ctx;
+    c.save();
+    c.translate(x, y);
+    if (s?.phase === "GAME_OVER") c.rotate(0.035);
+    const body = c.createLinearGradient(0, -height, 0, 0);
+    body.addColorStop(0, slow ? "#a3afa0" : "#edf5df");
+    body.addColorStop(0.45, slow ? "#718b7f" : "#b8d1bf");
+    body.addColorStop(1, slow ? "#445b50" : "#6e9682");
+    c.shadowColor = "#000a";
+    c.shadowBlur = 15;
+    c.shadowOffsetY = 10;
+    c.fillStyle = body;
+    c.beginPath();
+    c.moveTo(-length, -height);
+    c.lineTo(-height * 1.9, -height);
+    c.bezierCurveTo(
+      -height * 0.85,
+      -height,
+      -height * 0.28,
+      -height * 0.45,
+      0,
+      -height * 0.13,
+    );
+    c.quadraticCurveTo(height * 0.12, 4, -height * 0.45, 4);
+    c.lineTo(-length, 4);
+    c.closePath();
+    c.fill();
+    c.shadowBlur = 0;
+    c.shadowOffsetY = 0;
+    c.fillStyle = "#153c39";
+    c.beginPath();
+    c.moveTo(-height * 1.76, -height * 0.89);
+    c.quadraticCurveTo(
+      -height * 0.98,
+      -height * 0.81,
+      -height * 0.53,
+      -height * 0.38,
+    );
+    c.lineTo(-height * 1.27, -height * 0.43);
+    c.closePath();
+    c.fill();
+    c.fillStyle = "#1a3b35";
+    for (let dx = height * 2.05; dx < length - 6; dx += 22)
+      c.fillRect(-dx, -height * 0.71, 14, height * 0.26);
+    c.fillStyle = slow ? "#e4b579" : "#3c9e7a";
+    c.fillRect(-length, -height * 0.18, length - height * 0.38, 3);
+    c.strokeStyle = "#4d6e5d";
+    c.lineWidth = 1;
+    for (let dx = 135; dx < length; dx += 145) {
+      c.beginPath();
+      c.moveTo(-dx, -height + 3);
+      c.lineTo(-dx, 2);
+      c.stroke();
+    }
+    c.fillStyle = "#0c201c";
+    for (let dx = 33; dx < length; dx += 53) c.fillRect(-dx, 3, 20, 5);
+    c.fillStyle = "#edfbdc";
+    c.shadowColor = "#d9f6b4";
+    c.shadowBlur = 13;
+    c.fillRect(-height * 0.35, -height * 0.21, height * 0.22, 2);
+    c.shadowBlur = 0;
+    if (!slow) {
+      const beam = c.createLinearGradient(0, 0, 120, 0);
+      beam.addColorStop(0, "#d7f9a326");
+      beam.addColorStop(1, "#d7f9a300");
+      c.fillStyle = beam;
+      c.beginPath();
+      c.moveTo(-5, -7);
+      c.lineTo(130, -20);
+      c.lineTo(130, 10);
+      c.closePath();
+      c.fill();
+      c.fillStyle = "#edf8e1";
+      c.font = "italic bold 9px sans-serif";
+      c.fillText("CR · 领先号", -Math.min(length - 12, 144), -height * 0.28);
+    }
+    if (s?.train.isBraking || s?.phase === "GAME_OVER") {
+      c.strokeStyle = "#f5c578";
+      c.lineWidth = 2;
+      for (let i = 0; i < 11; i++) {
+        c.beginPath();
+        c.moveTo(-25 - i * 13, 8);
+        c.lineTo(-45 - i * 15, 12 + noise(i + s.time) * 9);
+        c.stroke();
+      }
+    }
+    c.restore();
+  }
+
+  private signal(
+    wave: Wave,
+    lane: number,
+    y: number,
+    s: GameState,
+    clock: number,
+  ) {
+    const c = this.ctx,
+      w = this.width;
+    // 信号位于实体前方；实体尚在屏外时，边缘信号仍给出完整预告。
+    const x = Math.min(
+      w - 42,
+      Math.max(24, (wave.x - RULES.signalLead * 0.34) * w),
+    );
+    if (wave.x < s.train.screenX - 0.04) return;
+    const blocked = wave.blocked.includes(lane);
+    const color = blocked
+      ? wave.kind === "debris" || wave.kind === "train"
+        ? C.amber
+        : C.red
+      : C.mint;
+    c.fillStyle = "#132b25";
+    c.fillRect(x - 2, y - 65, 4, 67);
+    c.fillStyle = "#081814";
+    c.strokeStyle = "#527465";
+    c.lineWidth = 1;
+    c.beginPath();
+    c.roundRect(x - 12, y - 74, 24, 39, 6);
+    c.fill();
+    c.stroke();
+    c.fillStyle = color;
+    c.shadowColor = color;
+    c.shadowBlur = 12 + Math.sin(clock * 4) * 3;
+    c.beginPath();
+    c.arc(x, y - 59, 4, 0, Math.PI * 2);
+    c.fill();
+    c.shadowBlur = 0;
+    c.fillStyle = color;
+    c.font = "bold 12px sans-serif";
+    c.textAlign = "center";
+    c.fillText(blocked ? "×" : "↑", x, y - 40);
+    c.fillStyle = "#081a17e8";
+    c.fillRect(x - 35, y - 96, 70, 17);
+    c.fillStyle = color;
+    c.font = "10px sans-serif";
+    c.fillText(
+      blocked
+        ? wave.kind === "train"
+          ? "慢车"
+          : wave.kind === "debris"
+            ? "异物"
+            : "封闭"
+        : `${LANE_NAMES[lane]}畅通`,
+      x,
+      y - 84,
+    );
+    c.textAlign = "left";
+  }
+
+  private obstacle(wave: Wave, y: number) {
+    const c = this.ctx,
+      x = wave.x * this.width;
+    if (wave.kind === "train") {
+      this.train(x + 145, y, 145, 34, true);
+      return;
+    }
+    c.save();
+    c.translate(x, y);
+    c.fillStyle = "#020d0b66";
+    c.beginPath();
+    c.ellipse(8, 14, 35, 12, 0, 0, Math.PI * 2);
+    c.fill();
+    if (wave.kind === "debris") {
+      c.fillStyle = "#6f8272";
+      c.strokeStyle = "#acb793";
+      c.lineWidth = 1;
+      c.beginPath();
+      c.moveTo(-18, 6);
+      c.lineTo(-11, -17);
+      c.lineTo(4, -26);
+      c.lineTo(20, -12);
+      c.lineTo(29, 8);
+      c.closePath();
+      c.fill();
+      c.stroke();
+      c.fillStyle = "#465e50";
+      c.beginPath();
+      c.moveTo(4, -26);
+      c.lineTo(2, -4);
+      c.lineTo(29, 8);
+      c.closePath();
+      c.fill();
+      c.fillStyle = C.amber;
+      c.fillRect(-20, -4, 4, 3);
+    } else {
+      c.fillStyle = "#8f9d82";
+      c.fillRect(-20, -30, 4, 43);
+      c.fillRect(21, -30, 4, 43);
+      c.fillStyle = "#f0bb67";
+      c.fillRect(-25, -29, 55, 17);
+      c.save();
+      c.beginPath();
+      c.rect(-25, -29, 55, 17);
+      c.clip();
+      c.strokeStyle = "#483f28";
+      c.lineWidth = 8;
+      for (let i = -35; i < 45; i += 20) {
+        c.beginPath();
+        c.moveTo(i, -30);
+        c.lineTo(i + 17, -11);
+        c.stroke();
+      }
+      c.restore();
+      c.fillStyle = C.red;
+      c.shadowColor = C.red;
+      c.shadowBlur = 12;
+      c.beginPath();
+      c.arc(-18, -35, 3, 0, 7);
+      c.arc(23, -35, 3, 0, 7);
+      c.fill();
+      c.shadowBlur = 0;
+      c.fillStyle = "#db7354";
+      c.beginPath();
+      c.moveTo(35, 10);
+      c.lineTo(41, -9);
+      c.lineTo(49, 10);
+      c.closePath();
+      c.fill();
+    }
+    c.restore();
+  }
+
+  private foreground(s: GameState) {
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    const gap = Math.max(w * 0.5, 430),
+      shift = (s.scroll * w * 1.15) % gap;
+    c.strokeStyle = "#537f6920";
+    c.lineWidth = 1;
+    for (let i = -1; i < w / gap + 2; i++) {
+      const x = i * gap - shift;
+      c.beginPath();
+      c.moveTo(x, h * 0.405);
+      c.quadraticCurveTo(x + gap * 0.5, h * 0.48, x + gap, h * 0.405);
+      c.stroke();
+      c.fillStyle = "#091d1a";
+      c.fillRect(x, h * 0.41, 5, h * 0.55);
+      c.fillStyle = "#4f726235";
+      c.fillRect(x + 3, h * 0.41, 1, h * 0.55);
+      c.fillStyle = "#17362b";
+      c.fillRect(x - 27, h * 0.405, 35, 3);
+    }
+    c.fillStyle = "#071a16";
+    c.fillRect(0, h * 0.97, w, h * 0.03);
+    c.fillStyle = "#2c5140";
+    c.fillRect(0, h * 0.97, w, 1);
+  }
+
+  private speedLines(s: GameState, clock: number) {
+    if (
+      s.phase === "PAUSED" ||
+      s.phase === "GAME_OVER" ||
+      s.phase === "VICTORY"
+    )
+      return;
+    const c = this.ctx,
+      w = this.width,
+      h = this.height;
+    const count = s.phase === "READY" ? 7 : 8 + s.stage * 4;
+    c.lineWidth = 1;
+    for (let i = 0; i < count; i++) {
+      const x =
+        fract(noise(i + 17) - clock * (0.2 + s.stage * 0.055)) * (w + 150) - 75;
+      const y = noise(i + 220) * h * 0.58 + h * 0.37;
+      c.strokeStyle = `rgba(162,207,164,${0.025 + noise(i) * 0.065 + s.burst * 0.08})`;
+      c.beginPath();
+      c.moveTo(x, y);
+      c.lineTo(x + 15 + s.stage * 10 + noise(i) * 65, y);
+      c.stroke();
+    }
+  }
+}
```

### src/main.tsx

- 新增 10 行；SHA-256：`41431cb94a112ca05f90ca6037229d09d4bb8ecc1c27ae3bb3740ace8f01d2a6`。

```diff
--- /dev/null
+++ b/src/main.tsx
@@ -0,0 +1,10 @@
+import React from "react";
+import ReactDOM from "react-dom/client";
+import App from "./App";
+import "./styles.css";
+
+ReactDOM.createRoot(document.getElementById("root")!).render(
+  <React.StrictMode>
+    <App />
+  </React.StrictMode>,
+);
```

### src/styles.css

- 新增 1635 行；SHA-256：`96491d981fef962ea78507211639d2729327d61dc0cd5fe7c2c01918ad621e80`。

```diff
--- /dev/null
+++ b/src/styles.css
@@ -0,0 +1,1635 @@
+@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800;900&display=swap");
+
+:root {
+  font-family: "Noto Sans SC", sans-serif;
+  color: #e5eee4;
+  background: #081211;
+  font-synthesis: none;
+  font-weight: 400;
+  --lime: #b6f36b;
+  --muted: #7d948a;
+  --line: #284037;
+  --red: #ff8276;
+  --amber: #f4c56e;
+  --display: "Barlow Condensed", "Arial Narrow", sans-serif;
+}
+* {
+  box-sizing: border-box;
+}
+body {
+  margin: 0;
+  min-width: 320px;
+}
+button {
+  font: inherit;
+  cursor: pointer;
+  color: inherit;
+  border: 0;
+  background: none;
+  -webkit-tap-highlight-color: transparent;
+  touch-action: manipulation;
+}
+button:focus-visible {
+  outline: 2px solid var(--lime);
+  outline-offset: 5px;
+}
+button:disabled {
+  cursor: default;
+}
+button:not(:disabled) {
+  transition:
+    background 0.18s,
+    color 0.18s,
+    transform 0.18s;
+}
+button:active:not(:disabled) {
+  transform: translateY(1px);
+}
+kbd {
+  font-family: var(--display);
+  font-weight: 500;
+  font-size: 13px;
+  letter-spacing: 1px;
+}
+svg {
+  flex-shrink: 0;
+}
+button:disabled svg,
+button:disabled kbd {
+  opacity: 0.6;
+}
+.app-shell {
+  max-width: 1800px;
+  margin: 0 auto;
+  padding: 0 40px;
+  height: 100dvh;
+  min-height: 620px;
+  display: flex;
+  flex-direction: column;
+}
+.header {
+  height: 90px;
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 28px;
+  flex-shrink: 0;
+}
+.brand {
+  display: flex;
+  align-items: center;
+  gap: 12px;
+}
+.brand-mark {
+  width: 39px;
+  height: 39px;
+  background: var(--lime);
+  color: #143021;
+  display: grid;
+  place-items: center;
+  border-radius: 4px;
+}
+.brand-name {
+  font-size: 19px;
+  font-weight: 800;
+  letter-spacing: 3px;
+}
+.brand-name > span {
+  display: block;
+  font-family: var(--display);
+  font-size: 10px;
+  font-weight: 500;
+  letter-spacing: 2.7px;
+  margin-top: 3px;
+  color: #8ba196;
+}
+.header-center {
+  display: flex;
+  align-items: center;
+  gap: 9px;
+  font-size: 12px;
+  letter-spacing: 2px;
+  color: #99aea3;
+}
+.live-dot,
+.page-footer i {
+  width: 5px;
+  height: 5px;
+  border-radius: 50%;
+  background: var(--lime);
+  display: inline-block;
+  box-shadow: 0 0 8px #b6f36b40;
+}
+.header-actions {
+  display: flex;
+  align-items: center;
+  gap: 16px;
+}
+.text-button {
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  gap: 8px;
+  font-size: 12px;
+  color: #a4b6aa;
+  padding: 8px 0;
+}
+.text-button:hover {
+  color: var(--lime);
+}
+.help-symbol {
+  width: 15px;
+  height: 15px;
+  border: 1px solid #7d948a;
+  border-radius: 50%;
+  display: grid;
+  place-items: center;
+  font-size: 10px;
+}
+.divider {
+  width: 1px;
+  height: 16px;
+  background: #284037;
+  margin: 0 2px;
+}
+.icon-button {
+  width: 30px;
+  height: 32px;
+  display: grid;
+  place-items: center;
+  color: #a4b6aa;
+  border-radius: 4px;
+}
+.icon-button:hover {
+  color: var(--lime);
+  background: #b6f36b0c;
+}
+.game-frame {
+  border: 1px solid #2d483b;
+  border-radius: 8px;
+  overflow: hidden;
+  box-shadow: 0 15px 60px #0003;
+  display: flex;
+  flex-direction: column;
+  flex: 1;
+  min-height: 0;
+  max-height: 1060px;
+}
+.world {
+  position: relative;
+  isolation: isolate;
+  overflow: hidden;
+  flex: 1;
+  min-height: 0;
+  outline: none;
+  background: #102b2c;
+}
+.world canvas {
+  width: 100%;
+  height: 100%;
+  position: absolute;
+  inset: 0;
+  display: block;
+}
+.hud {
+  position: absolute;
+  inset: 0 0 auto;
+  z-index: 2;
+  display: flex;
+  justify-content: space-between;
+  padding: 29px 34px;
+  background: linear-gradient(#071719c9, #07171900);
+  pointer-events: none;
+}
+.hud button {
+  pointer-events: auto;
+}
+.eyebrow {
+  font-size: 10px;
+  letter-spacing: 2px;
+  color: #8aa797;
+  display: flex;
+  align-items: center;
+  gap: 7px;
+}
+.tiny-square {
+  width: 4px;
+  height: 4px;
+  background: var(--lime);
+}
+.speed-block {
+  width: 173px;
+}
+.speed-value {
+  font-family: var(--display);
+  font-size: 66px;
+  line-height: 1.05;
+  font-weight: 500;
+  letter-spacing: 1px;
+  font-variant-numeric: tabular-nums;
+  color: #e4eddb;
+}
+.speed-value > span {
+  font-size: 13px;
+  letter-spacing: 0;
+  margin-left: 9px;
+  font-weight: 400;
+  color: #8aab98;
+}
+.speed-meter {
+  height: 7px;
+  display: flex;
+  gap: 3px;
+  margin-top: 11px;
+  width: 143px;
+  transform: skew(-12deg);
+}
+.speed-meter i {
+  flex: 1;
+  background: #29463a;
+}
+.speed-meter .lit {
+  background: #b6f36b;
+}
+.base-speed {
+  display: block;
+  font-size: 9px;
+  color: #779687;
+  letter-spacing: 0.5px;
+  margin-top: 8px;
+}
+.braking .speed-value {
+  color: var(--amber);
+}
+.braking .lit {
+  background: var(--amber);
+}
+.journey-hud {
+  width: 310px;
+  padding-top: 2px;
+}
+.journey-title {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  font-size: 11px;
+  letter-spacing: 1.5px;
+  color: #a0b6a4;
+}
+.journey-title > span {
+  font-family: var(--display);
+  font-size: 15px;
+  letter-spacing: 1px;
+  color: #c3d8b8;
+}
+.stage-track {
+  display: flex;
+  justify-content: space-between;
+  position: relative;
+  margin-top: 21px;
+}
+.stage-track:before {
+  position: absolute;
+  content: "";
+  height: 1px;
+  background: #456049;
+  left: 5px;
+  right: 5px;
+  top: 4px;
+}
+.stage-point {
+  position: relative;
+  display: flex;
+  align-items: center;
+  flex-direction: column;
+  font-family: var(--display);
+  font-size: 12px;
+  color: #5f7c6b;
+  gap: 9px;
+  min-width: 17px;
+}
+.stage-point i {
+  width: 8px;
+  height: 8px;
+  background: #244135;
+  border: 1px solid #456049;
+  border-radius: 50%;
+}
+.stage-point.reached i {
+  background: #b6f36b;
+  border-color: #b6f36b;
+}
+.stage-point.current {
+  color: var(--lime);
+}
+.stage-point.current i {
+  box-shadow:
+    0 0 0 4px #b6f36b12,
+    0 0 12px #b6f36b40;
+}
+.journey-caption {
+  font-size: 9px;
+  color: #74917d;
+  text-align: center;
+  letter-spacing: 1px;
+  margin-top: 10px;
+}
+.brake-hud {
+  width: 156px;
+  text-align: right;
+}
+.brake-hud .eyebrow {
+  justify-content: flex-end;
+}
+.brake-status {
+  display: flex;
+  width: 100%;
+  justify-content: space-between;
+  align-items: center;
+  gap: 18px;
+  margin-top: 15px;
+  padding: 0;
+  color: #9eae9b;
+}
+.brake-status > span {
+  font-size: 17px;
+  letter-spacing: 1px;
+}
+.brake-status.ready {
+  color: var(--lime);
+}
+.brake-status kbd {
+  color: #95ad95;
+  border: 1px solid #41613f;
+  border-radius: 3px;
+  padding: 3px 6px;
+  font-size: 10px;
+}
+.cooldown-track {
+  height: 2px;
+  width: 100%;
+  background: #3d5138;
+  margin-top: 15px;
+}
+.cooldown-track > i {
+  height: 100%;
+  display: block;
+  background: var(--lime);
+}
+.brake-hint {
+  display: block;
+  font-size: 9px;
+  color: #74917d;
+  margin-top: 11px;
+  letter-spacing: 1px;
+}
+.start-screen {
+  position: absolute;
+  inset: 0;
+  z-index: 3;
+  background: linear-gradient(90deg, #0519167a, transparent 75%);
+  pointer-events: none;
+}
+.start-content {
+  position: absolute;
+  top: 27%;
+  left: 6.1%;
+  pointer-events: auto;
+}
+.route-label {
+  font-family: var(--display);
+  font-size: 11px;
+  letter-spacing: 2px;
+  color: #b1c6ad;
+  display: flex;
+  gap: 9px;
+  align-items: center;
+}
+.route-label > span {
+  width: 17px;
+  height: 1px;
+  background: var(--lime);
+}
+h1 {
+  font-size: clamp(42px, 5.1vw, 78px);
+  font-weight: 900;
+  letter-spacing: -3px;
+  line-height: 1.25;
+  margin: 16px 0 0;
+  text-shadow: 0 3px 25px #07171366;
+}
+h1 > span {
+  color: var(--lime);
+}
+h1 > i {
+  color: var(--lime);
+  font-style: normal;
+  margin-left: -6px;
+}
+.english-title {
+  font-family: var(--display);
+  font-size: 15px;
+  font-weight: 400;
+  letter-spacing: 7.7px;
+  color: #a6bcac;
+  margin: 10px 0 24px;
+}
+.tagline {
+  font-size: 19px;
+  font-weight: 500;
+  letter-spacing: 2px;
+  margin: 0 0 12px;
+  color: #e1e9d5;
+}
+.intro {
+  font-size: 12px;
+  line-height: 1.95;
+  color: #9eb3a2;
+  letter-spacing: 0.8px;
+  margin: 0 0 25px;
+}
+.primary-button {
+  height: 49px;
+  background: var(--lime);
+  color: #19361e;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  gap: 12px;
+  font-size: 14px;
+  font-weight: 700;
+  border-radius: 3px;
+  padding: 0 25px;
+  box-shadow: 0 5px 24px #b6f36b08;
+}
+.primary-button:hover {
+  background: #caff84;
+  box-shadow: 0 5px 28px #b6f36b20;
+}
+.primary-button svg:last-child:not(:first-child) {
+  margin-left: auto;
+}
+.start-button {
+  width: 216px;
+}
+.enter-hint {
+  display: block;
+  margin-top: 12px;
+  font-size: 10px;
+  color: #7d9a83;
+  letter-spacing: 1px;
+}
+.enter-hint kbd {
+  font-size: 10px;
+  margin: 0 5px;
+  color: #bdcdb6;
+}
+.mission-card {
+  position: absolute;
+  right: 5.5%;
+  top: 29%;
+  width: 211px;
+  border-top: 1px solid #76967950;
+  border-left: 1px solid #76967922;
+  padding: 20px 0 16px 20px;
+  background: linear-gradient(120deg, #0a231958, transparent);
+}
+.mission-index {
+  font-size: 9px;
+  color: #8fab96;
+  letter-spacing: 2px;
+}
+.mission-speed {
+  font-family: var(--display);
+  font-size: 62px;
+  line-height: 1.1;
+  letter-spacing: 1px;
+  margin-top: 10px;
+  color: #d5e5c7;
+}
+.mission-speed > span {
+  font-size: 13px;
+  letter-spacing: 0;
+  color: #8eaa8e;
+  margin-left: 8px;
+}
+.mission-card p {
+  font-size: 10px;
+  color: #90ae93;
+  margin: 8px 0 18px;
+  letter-spacing: 0.5px;
+}
+.mission-card strong {
+  color: #c5d8b7;
+  font-weight: 500;
+}
+.mission-rule {
+  height: 1px;
+  background: #71916d29;
+  width: 155px;
+}
+.mission-note {
+  display: flex;
+  gap: 10px;
+  margin-top: 17px;
+  color: var(--lime);
+  align-items: center;
+}
+.mission-note > span {
+  font-size: 10px;
+  line-height: 1.8;
+  color: #95b092;
+  letter-spacing: 1px;
+}
+.scene-coordinate {
+  position: absolute;
+  bottom: 18px;
+  right: 25px;
+  display: flex;
+  gap: 20px;
+  font-size: 8px;
+  font-family: monospace;
+  letter-spacing: 1px;
+  color: #7a9e887a;
+}
+.signal-ribbon {
+  position: absolute;
+  top: 159px;
+  left: 50%;
+  transform: translateX(-50%);
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  background: #081e19d9;
+  border: 1px solid #48644b6b;
+  padding: 10px 18px;
+  border-radius: 4px;
+  white-space: nowrap;
+  font-size: 12px;
+  z-index: 3;
+  color: #a7bda4;
+  backdrop-filter: blur(8px);
+}
+.signal-ribbon strong {
+  font-weight: 500;
+  color: var(--lime);
+}
+.signal-separator {
+  color: #54714f;
+}
+.signal-dot {
+  width: 5px;
+  height: 5px;
+  border-radius: 50%;
+  background: var(--lime);
+  box-shadow: 0 0 8px #b6f36b77;
+}
+.signal-dot.amber {
+  background: var(--amber);
+  box-shadow: 0 0 8px #f4c56e77;
+}
+.has-signal {
+  border-color: #87945677;
+}
+.run-stats {
+  display: flex;
+  align-items: center;
+  gap: 26px;
+  position: absolute;
+  bottom: 21px;
+  left: 28px;
+  right: 28px;
+  font-size: 10px;
+  color: #94b098;
+  z-index: 2;
+}
+.run-stats strong {
+  font-family: var(--display);
+  font-size: 17px;
+  font-weight: 500;
+  color: #d3e7c8;
+  margin-left: 9px;
+}
+.run-stats button {
+  margin-left: auto;
+  background: #142e24e6;
+  border: 1px solid #426044;
+}
+.changing-label {
+  position: absolute;
+  bottom: 27px;
+  left: 50%;
+  transform: translateX(-50%);
+  color: #bde4ba;
+  font-size: 11px;
+  letter-spacing: 1px;
+}
+.leading-alert,
+.leading-burst {
+  position: absolute;
+  top: 31%;
+  left: 50%;
+  transform: translateX(-50%);
+  z-index: 5;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  flex-direction: column;
+  text-shadow: 0 2px 25px #062015;
+  pointer-events: none;
+}
+.leading-alert > span {
+  font-size: 16px;
+  color: var(--amber);
+  letter-spacing: 4px;
+}
+.leading-alert > strong {
+  font-family: var(--display);
+  font-size: 70px;
+  line-height: 1.1;
+  color: #f5da9b;
+}
+.leading-alert > small {
+  font-size: 10px;
+  color: #c7c49b;
+  letter-spacing: 2px;
+}
+.leading-burst {
+  top: 35%;
+  flex-direction: row;
+  gap: 12px;
+  color: var(--lime);
+  animation: burst 0.3s ease-out;
+}
+.leading-burst > strong {
+  font-size: 36px;
+  letter-spacing: 3px;
+  font-style: italic;
+  white-space: nowrap;
+}
+.leading-burst > span {
+  font-family: var(--display);
+  font-size: 19px;
+  white-space: nowrap;
+}
+.control-deck {
+  height: 77px;
+  flex-shrink: 0;
+  background: #10211b;
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  padding: 0 29px;
+  gap: 24px;
+  border-top: 1px solid #2c4835;
+}
+.control-group {
+  display: flex;
+  align-items: center;
+  gap: 11px;
+}
+.control-label {
+  font-size: 10px;
+  color: #6f8c78;
+  margin-right: 7px;
+  letter-spacing: 1px;
+}
+.lane-controls {
+  display: flex;
+  gap: 5px;
+}
+.lane-controls > button {
+  height: 27px;
+  min-width: 42px;
+  border: 1px solid #37523d;
+  border-radius: 3px;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  gap: 5px;
+  background: #192d22;
+  color: #c5d5b9;
+}
+.control-description {
+  font-size: 10px;
+  color: #a6b69e;
+  white-space: nowrap;
+}
+.control-line {
+  height: 20px;
+  width: 1px;
+  background: #2b4331;
+  margin: 0 7px;
+}
+.space-control {
+  height: 27px;
+  border: 1px solid #37523d;
+  border-radius: 3px;
+  padding: 0 9px;
+  background: #192d22;
+  color: #c5d5b9;
+}
+.space-control kbd {
+  font-size: 11px;
+}
+.lane-controls > button:not(:disabled):hover,
+.space-control:not(:disabled):hover {
+  background: #3a5330;
+}
+.signal-legend {
+  display: flex;
+  align-items: center;
+  gap: 16px;
+}
+.signal-legend > span {
+  display: flex;
+  align-items: center;
+  gap: 7px;
+  font-size: 10px;
+  color: #91a88f;
+  white-space: nowrap;
+}
+.legend-dot {
+  width: 5px;
+  height: 5px;
+  display: inline-block;
+  border-radius: 50%;
+}
+.green {
+  background: var(--lime);
+}
+.yellow {
+  background: var(--amber);
+}
+.red {
+  background: var(--red);
+}
+.goal-caption {
+  display: flex;
+  align-items: center;
+  gap: 10px;
+  font-size: 10px;
+  color: #7f9b80;
+  letter-spacing: 0.5px;
+  white-space: nowrap;
+}
+.target-icon {
+  font-size: 23px;
+  color: #8aa578;
+}
+.goal-caption strong {
+  font-family: var(--display);
+  font-size: 12px;
+  font-weight: 500;
+  color: #b9cfa8;
+}
+.page-footer {
+  height: 48px;
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 15px;
+  font-size: 9px;
+  letter-spacing: 1px;
+  color: #587761;
+  flex-shrink: 0;
+}
+.page-footer > span:first-child {
+  display: flex;
+  align-items: center;
+  gap: 8px;
+}
+.page-footer i {
+  width: 4px;
+  height: 4px;
+  background: #648965;
+  box-shadow: none;
+}
+.page-footer b {
+  font-family: var(--display);
+  margin-left: 19px;
+  font-size: 10px;
+  font-weight: 400;
+  color: #829478;
+  letter-spacing: 2px;
+}
+.screen-overlay,
+.help-overlay {
+  position: absolute;
+  inset: 0;
+  z-index: 10;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  background: #04130ed4;
+  backdrop-filter: blur(7px);
+  padding: 20px;
+}
+.result-card {
+  width: 420px;
+  text-align: center;
+  background: #10251cd9;
+  border: 1px solid #48603e;
+  padding: 29px 36px;
+  border-radius: 7px;
+  box-shadow: 0 25px 90px #0005;
+}
+.result-symbol {
+  color: var(--red);
+  width: 56px;
+  height: 56px;
+  background: #ff827609;
+  border: 1px solid #ff827625;
+  border-radius: 50%;
+  margin: 0 auto 17px;
+  display: grid;
+  place-items: center;
+}
+.victory .result-symbol {
+  color: var(--lime);
+  border-color: #b6f36b50;
+  background: #b6f36b0d;
+}
+.card-kicker {
+  display: block;
+  color: #9ab28a;
+  font-size: 10px;
+  letter-spacing: 2px;
+}
+.result-card h2,
+.help-card h2 {
+  font-size: 27px;
+  letter-spacing: -1px;
+  margin: 14px 0 9px;
+  color: #e4edd8;
+}
+.result-card p {
+  font-size: 11px;
+  color: #9aad96;
+  line-height: 1.8;
+  margin: 0 0 19px;
+}
+.result-main-stats {
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  border-top: 1px solid #3c5335;
+  border-bottom: 1px solid #3c5335;
+  padding: 15px 0;
+  gap: 10px;
+  margin-top: 20px;
+}
+.result-main-stats > div {
+  display: flex;
+  flex-direction: column;
+  gap: 7px;
+}
+.result-main-stats > div + div {
+  border-left: 1px solid #3c5335;
+}
+.result-main-stats strong {
+  font-family: var(--display);
+  font-size: 39px;
+  line-height: 1;
+  font-weight: 500;
+  color: #d7e8ca;
+}
+.result-main-stats small {
+  font-size: 13px;
+  font-weight: 400;
+  color: #86a378;
+}
+.result-main-stats span,
+.result-sub-stats span {
+  color: #8ca380;
+  font-size: 10px;
+  letter-spacing: 1px;
+}
+.result-sub-stats {
+  display: flex;
+  justify-content: space-around;
+  margin: 18px 0 24px;
+}
+.result-sub-stats > div {
+  display: flex;
+  flex-direction: column;
+  gap: 5px;
+}
+.result-sub-stats strong {
+  font-family: var(--display);
+  font-size: 24px;
+  font-weight: 500;
+}
+.result-sub-stats small {
+  font-size: 12px;
+  color: #81a072;
+}
+.result-card > .primary-button {
+  width: 100%;
+}
+.return-button {
+  margin: 8px auto 1px;
+  font-size: 11px;
+}
+.panel-footnote {
+  display: block;
+  font-size: 9px;
+  color: #75916b;
+  margin-top: 14px;
+  letter-spacing: 0.5px;
+}
+.pause-card {
+  padding: 42px 35px;
+}
+.pause-card h2 {
+  margin-top: 21px;
+}
+.pause-card .primary-button {
+  margin-top: 30px;
+}
+.secondary-button {
+  width: 100%;
+  height: 43px;
+  border: 1px solid #4b6541;
+  border-radius: 3px;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  gap: 8px;
+  margin-top: 12px;
+  font-size: 12px;
+  color: #b6c9a8;
+}
+.secondary-button:hover {
+  background: #34452b;
+}
+.help-overlay {
+  position: fixed;
+  z-index: 100;
+}
+.help-card {
+  position: relative;
+  background: #12281e;
+  border: 1px solid #4a6340;
+  width: 570px;
+  max-height: 90dvh;
+  overflow: auto;
+  padding: 35px;
+  border-radius: 8px;
+  box-shadow: 0 30px 100px #0007;
+}
+.close-help {
+  position: absolute;
+  right: 18px;
+  top: 15px;
+}
+.help-card h2 {
+  font-size: 25px;
+  margin-top: 15px;
+}
+.help-controls {
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  gap: 0 20px;
+  border-top: 1px solid #3d5435;
+  border-bottom: 1px solid #3d5435;
+  margin: 23px 0;
+  padding: 10px 0;
+}
+.help-controls p {
+  display: flex;
+  align-items: center;
+  gap: 13px;
+  font-size: 12px;
+  color: #b5c6a7;
+}
+.help-controls kbd {
+  min-width: 66px;
+  border: 1px solid #4d6843;
+  border-radius: 3px;
+  padding: 4px 6px;
+  color: #d3e5c0;
+  text-align: center;
+  font-size: 12px;
+}
+.help-card ol {
+  margin: 0;
+  padding-left: 20px;
+  display: flex;
+  flex-direction: column;
+  gap: 15px;
+}
+.help-card li {
+  font-size: 13px;
+  line-height: 1.9;
+  color: #99b38c;
+  padding-left: 5px;
+}
+.help-card strong {
+  font-weight: 500;
+  color: #d0e2bc;
+}
+.help-card li::marker {
+  color: var(--lime);
+  font-family: var(--display);
+}
+@keyframes burst {
+  from {
+    opacity: 0;
+    filter: blur(4px);
+    translate: -15px 0;
+  }
+  to {
+    opacity: 1;
+    filter: blur(0);
+    translate: 0 0;
+  }
+}
+@media (min-width: 1550px) {
+  .app-shell {
+    padding: 0 55px;
+  }
+  .header {
+    height: 100px;
+  }
+  .start-content {
+    top: 28%;
+  }
+  .intro {
+    font-size: 14px;
+  }
+  .mission-card {
+    top: 31%;
+    right: 7%;
+  }
+  .tagline {
+    font-size: 22px;
+  }
+  .english-title {
+    margin-bottom: 31px;
+  }
+  .control-deck {
+    height: 86px;
+  }
+  .start-button {
+    width: 235px;
+    height: 53px;
+  }
+  .control-description,
+  .goal-caption,
+  .signal-legend > span {
+    font-size: 12px;
+  }
+}
+@media (max-width: 1100px) {
+  .app-shell {
+    padding: 0 22px;
+  }
+  .header {
+    height: 76px;
+  }
+  .header-center {
+    font-size: 10px;
+  }
+  .game-frame {
+    min-height: 0;
+  }
+  .control-deck {
+    padding: 0 21px;
+    gap: 15px;
+  }
+  .control-label {
+    display: none;
+  }
+  .signal-legend {
+    gap: 11px;
+  }
+  .goal-caption {
+    font-size: 9px;
+  }
+  .start-content {
+    left: 6%;
+    top: 28%;
+  }
+  .mission-card {
+    right: 5%;
+    width: 185px;
+  }
+  .journey-hud {
+    width: 270px;
+  }
+  .hud {
+    padding: 25px 25px;
+  }
+  .game-frame {
+    max-height: 1000px;
+  }
+  .world {
+    min-height: 0;
+  }
+  .tagline {
+    font-size: 17px;
+  }
+  .english-title {
+    font-size: 12px;
+    letter-spacing: 6px;
+  }
+  .intro {
+    font-size: 11px;
+  }
+  .signal-ribbon {
+    top: 147px;
+  }
+}
+@media (max-width: 820px) {
+  .header-center,
+  .goal-caption,
+  .control-label {
+    display: none;
+  }
+  .journey-hud {
+    width: 230px;
+  }
+  .hud {
+    padding: 22px;
+  }
+  .brake-hud {
+    width: 125px;
+  }
+  .speed-block {
+    width: 130px;
+  }
+  .speed-value {
+    font-size: 56px;
+  }
+  .speed-meter {
+    width: 120px;
+  }
+  .mission-card {
+    width: 165px;
+    right: 4%;
+    padding-left: 15px;
+  }
+  .start-content {
+    top: 29%;
+  }
+  .control-deck {
+    gap: 8px;
+  }
+  .control-group {
+    gap: 8px;
+  }
+  .signal-legend {
+    gap: 10px;
+  }
+  .mission-speed {
+    font-size: 52px;
+  }
+  .mission-card p {
+    font-size: 9px;
+  }
+  .mission-rule {
+    width: 135px;
+  }
+  .signal-ribbon {
+    font-size: 11px;
+    gap: 8px;
+  }
+  .signal-ribbon svg {
+    display: none;
+  }
+}
+@media (max-width: 600px) {
+  .app-shell {
+    padding: 0 12px;
+  }
+  .header {
+    height: 68px;
+    gap: 12px;
+  }
+  .brand {
+    gap: 8px;
+  }
+  .brand-mark {
+    width: 32px;
+    height: 32px;
+  }
+  .brand-name {
+    font-size: 15px;
+    letter-spacing: 2px;
+  }
+  .brand-name > span {
+    font-size: 8px;
+    letter-spacing: 1.7px;
+  }
+  .header-actions {
+    gap: 8px;
+  }
+  .header-actions .divider,
+  .fullscreen-button {
+    display: none;
+  }
+  .header-actions .text-button {
+    font-size: 10px;
+  }
+  .game-frame {
+    min-height: 0;
+  }
+  .world {
+    min-height: 0;
+  }
+  .hud {
+    padding: 19px 17px;
+    flex-wrap: wrap;
+    row-gap: 20px;
+  }
+  .speed-block {
+    width: 120px;
+  }
+  .speed-value {
+    font-size: 51px;
+  }
+  .brake-hud {
+    width: 119px;
+  }
+  .brake-status > span {
+    font-size: 15px;
+  }
+  .eyebrow {
+    font-size: 9px;
+  }
+  .journey-hud {
+    position: absolute;
+    top: 124px;
+    left: 18px;
+    width: calc(100% - 36px);
+  }
+  .stage-track {
+    margin-top: 13px;
+  }
+  .journey-caption {
+    display: none;
+  }
+  .journey-title {
+    font-size: 9px;
+  }
+  .journey-title > span {
+    font-size: 12px;
+  }
+  .stage-point {
+    gap: 6px;
+    font-size: 11px;
+  }
+  .start-content {
+    top: 35%;
+    left: 7%;
+  }
+  h1 {
+    font-size: 49px;
+    letter-spacing: -2px;
+    margin-top: 12px;
+  }
+  .route-label {
+    font-size: 10px;
+  }
+  .english-title {
+    font-size: 11px;
+    letter-spacing: 5px;
+    margin: 8px 0 21px;
+  }
+  .tagline {
+    font-size: 17px;
+    letter-spacing: 1px;
+  }
+  .intro {
+    font-size: 11px;
+    letter-spacing: 0;
+    line-height: 1.9;
+    margin-bottom: 21px;
+  }
+  .start-button {
+    width: 192px;
+    height: 47px;
+    font-size: 13px;
+  }
+  .mission-card {
+    display: none;
+  }
+  .scene-coordinate {
+    right: 15px;
+    bottom: 14px;
+  }
+  .scene-coordinate > span:first-child {
+    display: none;
+  }
+  .control-deck {
+    height: 75px;
+    padding: 0 12px;
+    gap: 5px;
+    flex-wrap: wrap;
+    justify-content: center;
+    align-content: center;
+    row-gap: 10px;
+  }
+  .control-group {
+    gap: 8px;
+  }
+  .control-description {
+    font-size: 9px;
+  }
+  .lane-controls > button {
+    height: 32px;
+    min-width: 42px;
+  }
+  .space-control {
+    height: 32px;
+  }
+  .control-line {
+    margin: 0 3px;
+  }
+  .signal-legend {
+    gap: 19px;
+  }
+  .signal-legend > span {
+    font-size: 9px;
+  }
+  .page-footer {
+    height: 38px;
+    font-size: 8px;
+    letter-spacing: 0.2px;
+  }
+  .page-footer > span:last-child {
+    font-size: 0;
+  }
+  .page-footer b {
+    font-size: 9px;
+    margin-left: 0;
+  }
+  .signal-ribbon {
+    top: 204px;
+    padding: 9px 11px;
+    font-size: 10px;
+    gap: 7px;
+  }
+  .leading-alert {
+    top: 42%;
+  }
+  .leading-burst {
+    top: 46%;
+    gap: 7px;
+  }
+  .leading-burst > strong {
+    font-size: 24px;
+  }
+  .leading-burst > svg {
+    width: 22px;
+  }
+  .leading-burst > span {
+    font-size: 14px;
+  }
+  .run-stats {
+    bottom: 17px;
+    left: 16px;
+    right: 16px;
+    gap: 19px;
+    font-size: 9px;
+  }
+  .run-stats strong {
+    font-size: 16px;
+  }
+  .changing-label {
+    bottom: 61px;
+    font-size: 10px;
+  }
+  .result-card {
+    padding: 24px;
+    width: 100%;
+    max-width: 365px;
+  }
+  .result-card h2 {
+    font-size: 23px;
+  }
+  .result-symbol {
+    width: 46px;
+    height: 46px;
+    margin-bottom: 15px;
+  }
+  .result-main-stats strong {
+    font-size: 34px;
+  }
+  .result-card p {
+    font-size: 10px;
+  }
+  .help-card {
+    padding: 29px 22px;
+  }
+  .help-card h2 {
+    font-size: 21px;
+  }
+  .help-controls {
+    grid-template-columns: 1fr;
+    gap: 0;
+  }
+  .help-controls p {
+    margin: 7px 0;
+  }
+  .help-card li {
+    font-size: 12px;
+  }
+  .screen-overlay {
+    padding: 13px;
+  }
+}
+@media (max-height: 620px) and (min-width: 601px) {
+  .app-shell {
+    padding: 0 16px;
+  }
+  .header {
+    height: 54px;
+  }
+  .brand-mark {
+    width: 29px;
+    height: 29px;
+  }
+  .brand-name {
+    font-size: 14px;
+  }
+  .brand-name > span {
+    font-size: 8px;
+  }
+  .game-frame {
+    min-height: 0;
+    height: calc(100dvh - 76px);
+    flex: none;
+  }
+  .world {
+    min-height: 0;
+  }
+  .control-deck {
+    height: 49px;
+  }
+  .page-footer {
+    height: 22px;
+    font-size: 8px;
+  }
+  .hud {
+    padding: 13px 22px;
+  }
+  .speed-value {
+    font-size: 43px;
+  }
+  .speed-meter {
+    height: 4px;
+    margin-top: 5px;
+  }
+  .base-speed,
+  .brake-hint,
+  .journey-caption {
+    display: none;
+  }
+  .journey-hud {
+    width: 230px;
+  }
+  .stage-track {
+    margin-top: 12px;
+  }
+  .brake-status {
+    margin-top: 9px;
+  }
+  .cooldown-track {
+    margin-top: 9px;
+  }
+  .start-content {
+    top: 29%;
+    left: 6%;
+  }
+  h1 {
+    font-size: 43px;
+    margin-top: 6px;
+  }
+  .english-title {
+    font-size: 10px;
+    margin: 4px 0 11px;
+    letter-spacing: 5px;
+  }
+  .route-label {
+    font-size: 9px;
+  }
+  .tagline {
+    font-size: 14px;
+    margin-bottom: 8px;
+  }
+  .intro {
+    display: none;
+  }
+  .start-button {
+    height: 37px;
+    width: 190px;
+    font-size: 12px;
+  }
+  .enter-hint {
+    margin-top: 7px;
+    font-size: 8px;
+  }
+  .mission-card {
+    top: 33%;
+    padding-top: 12px;
+  }
+  .mission-speed {
+    font-size: 39px;
+  }
+  .mission-note,
+  .mission-rule {
+    display: none;
+  }
+  .mission-card p {
+    margin-bottom: 0;
+  }
+  .signal-ribbon {
+    top: 100px;
+    font-size: 10px;
+    padding: 7px 12px;
+  }
+  .run-stats {
+    bottom: 9px;
+  }
+  .result-card {
+    padding: 18px 26px;
+    width: 450px;
+  }
+  .result-symbol {
+    display: none;
+  }
+  .result-card h2 {
+    margin-top: 9px;
+    font-size: 22px;
+  }
+  .result-card p {
+    margin-bottom: 9px;
+  }
+  .result-main-stats {
+    margin-top: 9px;
+    padding: 9px 0;
+  }
+  .result-main-stats strong {
+    font-size: 29px;
+  }
+  .result-sub-stats {
+    margin: 9px 0 13px;
+  }
+  .result-sub-stats > div {
+    gap: 1px;
+  }
+  .result-sub-stats strong {
+    font-size: 20px;
+  }
+  .result-card .primary-button {
+    height: 37px;
+  }
+  .panel-footnote {
+    display: none;
+  }
+  .return-button {
+    margin-top: 3px;
+    padding: 4px;
+  }
+  .pause-card {
+    padding: 25px;
+  }
+  .pause-card .primary-button {
+    margin-top: 17px;
+  }
+}
+@media (prefers-reduced-motion: reduce) {
+  *,
+  *::before,
+  *::after {
+    animation: none !important;
+    transition: none !important;
+  }
+}
+
+/* 结算内容在短窗口内可滚动，驾驶区始终留在视口中。 */
+.result-card {
+  max-height: 100%;
+  overflow-y: auto;
+  scrollbar-width: thin;
+  scrollbar-color: #4b6541 #10251c;
+}
+.world .screen-overlay {
+  padding: 16px;
+}
+.result-card:not(.pause-card) {
+  padding: 23px 30px;
+}
+.result-symbol {
+  width: 44px;
+  height: 44px;
+  margin-bottom: 12px;
+}
+.result-main-stats {
+  margin-top: 15px;
+  padding: 12px 0;
+}
+.result-sub-stats {
+  margin: 15px 0 18px;
+}
```

### tests/game.test.ts

- 新增 267 行；SHA-256：`18d67ec742f869d61b5421a9403f274469f6b781caf80cd74c32592a5d01cf61`。

```diff
--- /dev/null
+++ b/tests/game.test.ts
@@ -0,0 +1,267 @@
+import { test } from "node:test";
+import assert from "node:assert/strict";
+import { GameEngine } from "../src/game/engine";
+import { RULES, STAGES } from "../src/game/config";
+
+function advance(game: GameEngine, seconds: number, onFrame?: () => void) {
+  const frames = Math.ceil(seconds * 120);
+  for (let i = 0; i < frames; i++) {
+    onFrame?.();
+    game.update(1 / 120);
+  }
+}
+
+function randomSource(seed: number) {
+  let value = seed;
+  return () => {
+    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
+    return value / 4294967296;
+  };
+}
+
+/** 测试驾驶员只读取正常玩家可见的提前信号，仍调用真实变道与碰撞逻辑。 */
+function followSignal(game: GameEngine) {
+  const wave = game.state.waves.find((w) => !w.passed);
+  if (
+    wave &&
+    game.state.train.laneProgress === 1 &&
+    game.state.train.lane !== wave.safeLane
+  ) {
+    game.changeLane(wave.safeLane < game.state.train.lane ? -1 : 1);
+  }
+}
+
+test("发车从 250 km/h、10% 车头位置和中轨开始", () => {
+  const game = new GameEngine(() => 0);
+  assert.equal(game.state.phase, "READY");
+  game.start();
+  assert.equal(game.state.phase, "PLAYING");
+  assert.equal(game.state.train.speed, 250);
+  assert.equal(game.state.train.screenX, 0.1);
+  assert.equal(game.state.train.lane, 1);
+});
+
+test("换轨连续移动，期间锁定方向，完成后才计数", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  assert.equal(game.changeLane(-1), true);
+  advance(game, 0.24);
+  assert.ok(game.state.train.laneY > 0 && game.state.train.laneY < 1);
+  assert.equal(game.changeLane(1), false);
+  assert.equal(game.state.changes, 0);
+  advance(game, 0.25);
+  assert.equal(game.state.train.lane, 0);
+  assert.equal(game.state.changes, 1);
+  assert.equal(game.changeLane(-1), false);
+});
+
+test("制动持续 0.8 秒，3 秒冷却，基础速度永久保留", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  assert.equal(game.brake(), true);
+  advance(game, 0.4);
+  assert.ok(game.state.train.speed < 250);
+  assert.equal(game.state.train.targetSpeed, 250);
+  assert.equal(game.brake(), false);
+  advance(game, 0.41);
+  assert.equal(game.state.train.speed, 250);
+  assert.equal(game.state.train.isBraking, false);
+  assert.equal(game.brake(), false);
+  advance(game, 2.2);
+  assert.equal(game.brake(), true);
+});
+
+test("提前 2 秒预警、倒计时有 3 次音效、提速和车头推进平滑", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  advance(game, 12.98, () => followSignal(game));
+  assert.equal(game.state.phase, "PLAYING");
+  game.drainSounds();
+  advance(game, 0.05, () => followSignal(game));
+  assert.equal(game.state.phase, "LEADING_WARNING");
+  advance(game, 1.99, () => followSignal(game));
+  assert.equal(game.state.stage, 1);
+  assert.equal(
+    game.drainSounds().filter((sound) => sound === "warning").length,
+    3,
+  );
+  assert.ok(game.state.train.screenX >= 0.1 && game.state.train.screenX < 0.15);
+  advance(game, 0.45);
+  assert.ok(game.state.train.screenX > 0.15 && game.state.train.screenX < 0.2);
+  advance(game, 0.45);
+  assert.equal(game.state.train.screenX, 0.2);
+  assert.equal(game.state.train.targetSpeed, 270);
+});
+
+test("每档场景滚动速度增加，实体反应窗口不低于 0.8 秒", () => {
+  let previous = 0;
+  for (const [stage, config] of STAGES.entries()) {
+    const game = new GameEngine();
+    game.state.stage = stage;
+    assert.ok(game.velocity > previous);
+    previous = game.velocity;
+    assert.ok(config.reaction >= 0.8);
+    assert.ok(config.reaction > config.laneDuration + 0.2);
+  }
+});
+
+test("信号生成时实体还在屏外，安全出口最多相隔一轨", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  advance(game, 3.02);
+  const wave = game.state.waves[0];
+  assert.ok(wave);
+  assert.ok(wave.x > 1);
+  assert.ok(!wave.blocked.includes(wave.safeLane));
+  assert.equal(Math.abs(wave.safeLane - wave.laneAtSpawn), 1);
+  assert.ok(wave.decisionTime > game.config.reaction);
+});
+
+test("不操作会碰撞失败，失败后输入不能继续改变轨道", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  advance(game, 10);
+  assert.equal(game.state.phase, "GAME_OVER");
+  const time = game.state.time;
+  advance(game, 1);
+  assert.equal(game.state.time, time);
+  assert.equal(game.changeLane(1), false);
+  assert.ok(game.state.message.length > 0);
+});
+
+test("低帧率扫掠检测不会穿透障碍", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  game.state.waves.push({
+    id: 1,
+    x: 0.13,
+    blocked: [1],
+    safeLane: 0,
+    kind: "debris",
+    passed: false,
+    decisionTime: 0.1,
+    laneAtSpawn: 1,
+  });
+  game.update(0.25);
+  assert.equal(game.state.phase, "GAME_OVER");
+});
+
+test("极限反应只在成功避让后计数，失败尝试不计入", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  game.state.waves.push({
+    id: 1,
+    x: 0.1 + game.velocity * 0.75,
+    blocked: [1],
+    safeLane: 0,
+    kind: "debris",
+    passed: false,
+    decisionTime: 0.75,
+    laneAtSpawn: 1,
+  });
+  game.changeLane(-1);
+  assert.equal(game.state.closeCalls, 0);
+  advance(game, 1.1);
+  assert.equal(game.state.phase, "PLAYING");
+  assert.equal(game.state.closeCalls, 1);
+});
+
+test("变道未完成时仍占用原轨，不能最后一刻无成本逃逸", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  game.state.waves.push({
+    id: 1,
+    x: 0.11,
+    blocked: [1],
+    safeLane: 0,
+    kind: "construction",
+    passed: false,
+    decisionTime: 0.03,
+    laneAtSpawn: 1,
+  });
+  game.changeLane(-1);
+  advance(game, 0.1);
+  assert.equal(game.state.phase, "GAME_OVER");
+});
+
+test("暂停冻结计时、制动冷却、镜头和障碍，恢复后继续", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  game.brake();
+  advance(game, 0.2);
+  game.pause();
+  const snapshot = JSON.stringify(game.state);
+  advance(game, 10);
+  assert.equal(JSON.stringify(game.state), snapshot);
+  game.resume();
+  advance(game, 0.1);
+  assert.ok(game.state.time > 0.2);
+});
+
+test("重新开始清除失败、统计、障碍与所有速度阶段", () => {
+  const game = new GameEngine(() => 0);
+  game.start();
+  advance(game, 10);
+  game.start();
+  assert.equal(game.state.phase, "PLAYING");
+  assert.equal(game.state.time, 0);
+  assert.equal(game.state.stage, 0);
+  assert.equal(game.state.waves.length, 0);
+  assert.equal(game.state.changes, 0);
+  assert.equal(game.state.train.brakeCooldown, 0);
+});
+
+test("60 个随机种子完整通关：保留可行路线，350 后生存足够 60 秒", () => {
+  for (let seed = 1; seed <= 60; seed++) {
+    const game = new GameEngine(randomSource(seed));
+    game.start();
+    const observed = new Set<number>();
+    for (let frame = 0; frame < 220 * 60 && game.active; frame++) {
+      followSignal(game);
+      // 部分局持续使用制动，覆盖波次延期与领先预警边界。
+      if (seed % 3 === 0 && game.state.train.brakeCooldown === 0) game.brake();
+      game.update(1 / 60);
+      observed.add(game.state.stage);
+      const waves = game.state.waves.filter((w) => !w.passed);
+      assert.ok(waves.length <= 1, `种子 ${seed}：出现重叠波次`);
+      for (const wave of waves)
+        assert.ok(!wave.blocked.includes(wave.safeLane));
+    }
+    assert.equal(
+      game.state.phase,
+      "VICTORY",
+      `种子 ${seed} 未通关：${game.state.message}`,
+    );
+    assert.equal(observed.size, 6);
+    assert.equal(game.state.train.targetSpeed, 350);
+    assert.equal(game.state.train.screenX, 0.6);
+    assert.equal(game.state.peakTime, RULES.victoryDuration);
+    assert.ok(game.state.time >= 135);
+    assert.ok(game.state.passed > 15);
+  }
+});
+
+test("高速阶段保留 0.8 秒思考余量，已经变道的玩家也能完成安全路线", () => {
+  for (let stage = 0; stage < 6; stage++) {
+    const game = new GameEngine(() => 0);
+    game.start();
+    game.state.stage = stage;
+    Object.assign(game.state.train, {
+      screenX: STAGES[stage].screenX,
+      targetScreenX: STAGES[stage].screenX,
+      fromScreenX: STAGES[stage].screenX,
+      targetSpeed: STAGES[stage].speed,
+    });
+    game.state.spawnAt = 0;
+    game.changeLane(-1);
+    game.update(1 / 120);
+    const wave = game.state.waves[0];
+    assert.ok(wave);
+    assert.ok(
+      wave.decisionTime >= STAGES[stage].laneDuration + 0.48 + 0.8 - 0.01,
+    );
+    advance(game, 0.8);
+    advance(game, 4, () => followSignal(game));
+    assert.notEqual(game.state.phase, "GAME_OVER");
+  }
+});
```

