# 会话-4：列车贴轨与信号归属修复

## 背景与目标
- 用户截图中，列车悬在所属轨道的下侧钢轨上方；信号灯向上悬挂，容易被误认为属于相邻轨道。
- 将列车轮底和障碍实际底部对齐下侧钢轨，使信号归属直接可辨。

## 约束与原则
- 当前分支为 `main`，与上一轮一致；本轮起始提交为 `02af9f2f68193813ca3e631d7f13ef865428f139`。
- 只调整 Canvas 绘制坐标、标识和图层，不改变碰撞、变道、速度、预警时间与障碍生成规则。
- 沿用现有依赖与测试框架；公开源码及 GitHub Pages 发布延续会话-3 的用户明确授权。

## 阶段与 TODO
- [x] 检查轨道、轮底、障碍和信号的坐标基准。
- [x] 共用轨道几何参数，修正玩家列车、慢车与障碍落点。
- [x] 将信号改为轨道内灯牌，标明轨道名称与状态，保留窄屏可读性。
- [x] 完成桌面、窄屏视觉检查和既有规则测试、静态检查、生产构建。
- [x] 记录完整 diff 并更新根索引。

## 当前进展与实现
- 轨道基准为 `画布高度 × (0.58 + lane × 0.147)`；上侧钢轨偏移 5，下侧偏移 31。
- 原列车轮底为轨道基准 + 8，现列车绘制原点由下侧钢轨位置减去轮子顶部 3 和高度 5 得到，轮底恰好落在下側钢轨上。
- 使用小数轨道位置计算列车坐标，保留变轨过程的连续移动；慢车使用相同轮底基准。
- 施工栏及道岔栏底部偏移 13，落石底部偏移 8，分别据此对齐下侧钢轨。
- 灯牌放在所属轨道的两根钢轨之间，下缘直接连接彩色钢轨短线；桌面显示编号、轨道名与状态，画布宽度小于 600 时显示紧凑文字。
- 灯牌保持在车头前方可视区域，并在前景电线杆、速度线之后绘制，避免遮挡决策信息。
- 调试页面 `artifacts/rail-alignment-preview.html` 仅供本地视觉检查，位于已忽略目录，不进入生产包；下文保留其完整内容以便复现。

## 测试用例与结果
### TC-001 三条轨道与变轨位置
- 类型：浏览器视觉检查；优先级：高；关联模块：WorldRenderer。
- 使用本地静态调试场景，桌面视窗为 1280 × 720；依次选择上轨、中轨、下轨以及中轨与下轨之间。
- 预期：停留在各轨道时轮底贴合下侧钢轨；变轨中间位置保持连续，不吸附到整数轨道。
- 结果：通过；玩家列车与上下轨慢车轮底均与对应下侧钢轨重合。

### TC-002 信号归属与障碍
- 类型：浏览器视觉检查；优先级：高。
- 分别选择施工、慢车、落石，检查三个轨道灯牌，并将车头推进到 60%。
- 预期：每个灯牌位于自己的轨道内，明确显示上轨／中轨／下轨及畅通／封闭／慢车／异物状态；车头前方文字完整可见。
- 结果：通过；施工栏、落石底部贴轨，信号未被前景电线杆遮挡。

### TC-003 窄屏与浏览器错误
- 类型：浏览器视觉检查；优先级：高。
- 将视窗设为 390 × 844，选择中轨、施工、60% 车头位置。
- 预期：紧凑灯牌完整显示轨道名与状态，不遮住车头，不越出画布。
- 结果：通过；浏览器警告与错误日志为空。验证后恢复默认视窗。

### TC-004 既有玩法回归与生产构建
- `npm test`：14 项通过，含 60 个随机种子的完整通关模拟；这些测试验证玩法回归，视觉坐标由上述浏览器检查验证。
- `npm run lint`：通过。
- `VITE_BASE_PATH=/too-far-ahead/ npm run build`：通过，产物使用正式 Pages 子路径，脚本为 `index-BJN_QT3T.js`。
- `git diff --check -- src/game/renderer.ts`：通过。

## 发布与会话回溯
- 本轮修复提交到 `main` 后，既有 GitHub Actions 自动执行规则测试、静态检查、构建与 Pages 发布。
- 正式地址：https://lep-ton.github.io/too-far-ahead/ 。
- 若要求回到本轮之前，以起始提交 `02af9f2f68193813ca3e631d7f13ef865428f139` 为基准；若要求回到本轮，定位引入本文档的提交。

## 代码变更
以下为生产源码及根索引相对本轮起点的完整统一 diff；本文档自身不递归嵌入。

```diff
diff --git a/.agentdocs/index.md b/.agentdocs/index.md
index bd96a98..5816ae7 100644
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@ -12,3 +12,4 @@
 - `workflow/20260907154944-session-1-playable-game.md` - 会话-1：初始化可玩的完整游戏；包含全部源文件和依赖锁文件的逐行 diff、玩法配置、验证方法与会话回溯说明。需要了解本版实现、数值或回到本版时读取。
 - `workflow/20260907161233-session-2-github-pages.md` - 会话-2：初始化 Git、保存初版并准备 GitHub Pages 发布；包含资源子路径配置、官方 Actions 工作流、逐行 diff 和发布受限说明。
 - `workflow/20260907164532-session-3-public-pages-release.md` - 会话-3：公开源码、启用 Pages 并完成发布；包含授权记录、线上网址、成功部署与 HTTP 验证结果，以及发布文档的完整 diff。
+- `workflow/20260907222816-session-4-rail-signal-alignment.md` - 会话-4：列车、慢车与障碍对齐下侧钢轨，信号灯改为所属轨道内的灯牌；包含完整逐行 diff、桌面与窄屏视觉验证及回溯基准。
diff --git a/src/game/renderer.ts b/src/game/renderer.ts
index 2ab6fb5..4c37e59 100644
--- a/src/game/renderer.ts
+++ b/src/game/renderer.ts
@@ -10,6 +10,10 @@ const C = {
 const fract = (n: number) => n - Math.floor(n);
 const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
 
+// 轨道与实体共享同一组几何基准，轮底接触下侧钢轨，避免各自偏移。
+const TRACK = { firstLane: 0.58, laneGap: 0.147, farRail: 5, nearRail: 31 };
+const WHEEL = { top: 3, height: 5 };
+
 /** 世界只消费状态，不参与规则计算；所有坐标随画布缩放。 */
 export class WorldRenderer {
   private ctx: CanvasRenderingContext2D;
@@ -29,6 +33,19 @@ export class WorldRenderer {
     this.canvas.height = Math.round(height * this.ratio);
   }
 
+  private laneY(lane: number) {
+    return this.height * (TRACK.firstLane + lane * TRACK.laneGap);
+  }
+
+  private lowerRailY(lane: number) {
+    return this.laneY(lane) + TRACK.nearRail;
+  }
+
+  private trainY(lane: number) {
+    // lane 可以是变轨中的小数，接触点会随列车连续移动。
+    return this.lowerRailY(lane) - WHEEL.top - WHEEL.height;
+  }
+
   render(s: GameState, clock: number, reducedMotion: boolean) {
     const c = this.ctx,
       w = this.width,
@@ -45,20 +62,17 @@ export class WorldRenderer {
     this.city(s);
     this.rails(s);
     if (s.phase !== "READY") this.sightline(s);
-    const laneY = (lane: number) => h * (0.58 + lane * 0.147);
-
     // 轨道按远近绘制，避免下轨实体被上轨列车覆盖。
     for (let lane = 0; lane < 3; lane++) {
       for (const wave of s.waves) {
-        if (!wave.passed) this.signal(wave, lane, laneY(lane), s, clock);
         if (wave.blocked.includes(lane) && wave.x < 1.2)
-          this.obstacle(wave, laneY(lane));
+          this.obstacle(wave, lane);
       }
       const currentLane = Math.round(s.train.laneY);
       if (currentLane === lane) {
         const ready = s.phase === "READY";
         const x = ready ? w * 0.69 : s.train.screenX * w;
-        const y = ready ? laneY(1) : laneY(s.train.laneY);
+        const y = this.trainY(ready ? 1 : s.train.laneY);
         this.train(
           x,
           y,
@@ -71,6 +85,12 @@ export class WorldRenderer {
     }
     this.foreground(s);
     if (!reducedMotion) this.speedLines(s, clock);
+    // 信号是决策信息，最后绘制，避免被前景电线杆和速度线遮挡。
+    for (const wave of s.waves) {
+      if (!wave.passed) {
+        for (let lane = 0; lane < 3; lane++) this.signal(wave, lane, s, clock);
+      }
+    }
     c.restore();
     const vignette = c.createLinearGradient(0, 0, 0, h);
     vignette.addColorStop(0, "#04111000");
@@ -172,7 +192,7 @@ export class WorldRenderer {
     c.fillStyle = "#112422";
     c.fillRect(0, h * 0.53, w, h);
     for (let lane = 0; lane < 3; lane++) {
-      const y = h * (0.58 + lane * 0.147);
+      const y = this.laneY(lane);
       c.fillStyle = lane === 1 ? "#172d29" : "#142925";
       c.fillRect(0, y - 13, w, h * 0.11);
       const shift = (s.scroll * w) % 39;
@@ -184,7 +204,7 @@ export class WorldRenderer {
         c.lineTo(x - shift + 8, y + 40);
       }
       c.stroke();
-      for (const dy of [5, 31]) {
+      for (const dy of [TRACK.farRail, TRACK.nearRail]) {
         c.fillStyle = "#081b19";
         c.fillRect(0, y + dy, w, 7);
         c.fillStyle = "#577469";
@@ -296,7 +316,8 @@ export class WorldRenderer {
       c.stroke();
     }
     c.fillStyle = "#0c201c";
-    for (let dx = 33; dx < length; dx += 53) c.fillRect(-dx, 3, 20, 5);
+    for (let dx = 33; dx < length; dx += 53)
+      c.fillRect(-dx, WHEEL.top, 20, WHEEL.height);
     c.fillStyle = "#edfbdc";
     c.shadowColor = "#d9f6b4";
     c.shadowBlur = 13;
@@ -330,19 +351,22 @@ export class WorldRenderer {
     c.restore();
   }
 
-  private signal(
-    wave: Wave,
-    lane: number,
-    y: number,
-    s: GameState,
-    clock: number,
-  ) {
+  private signal(wave: Wave, lane: number, s: GameState, clock: number) {
     const c = this.ctx,
       w = this.width;
-    // 信号位于实体前方；实体尚在屏外时，边缘信号仍给出完整预告。
+    const compact = w < 600;
+    const width = compact ? 96 : 126;
+    const upperRail = this.laneY(lane) + TRACK.farRail;
+    const lowerRail = this.lowerRailY(lane);
+    const y = (upperRail + lowerRail) / 2;
+    // 灯牌位于所属轨道的两根钢轨之间，并始终留在车头前方的可视区域。
+    // 窄屏缩短文字、保留轨道名，避免信号越界或压住车头。
     const x = Math.min(
-      w - 42,
-      Math.max(24, (wave.x - RULES.signalLead * 0.34) * w),
+      w - width / 2 - 10,
+      Math.max(
+        s.train.screenX * w + width / 2 + 10,
+        (wave.x - RULES.signalLead * 0.34) * w,
+      ),
     );
     if (wave.x < s.train.screenX - 0.04) return;
     const blocked = wave.blocked.includes(lane);
@@ -351,51 +375,58 @@ export class WorldRenderer {
         ? C.amber
         : C.red
       : C.mint;
-    c.fillStyle = "#132b25";
-    c.fillRect(x - 2, y - 65, 4, 67);
-    c.fillStyle = "#081814";
-    c.strokeStyle = "#527465";
+    const status = blocked
+      ? wave.kind === "train"
+        ? "慢车"
+        : wave.kind === "debris"
+          ? "异物"
+          : "封闭"
+      : "畅通";
+    const left = x - width / 2;
+    c.save();
+    // 彩色钢轨短线与灯牌直接相接，明确指出受控的是当前这一条轨道。
+    c.strokeStyle = `${color}a6`;
+    c.lineWidth = 2;
+    c.beginPath();
+    c.moveTo(left - 12, lowerRail);
+    c.lineTo(left + width + 12, lowerRail);
+    c.stroke();
+    c.fillStyle = "#081814f5";
     c.lineWidth = 1;
     c.beginPath();
-    c.roundRect(x - 12, y - 74, 24, 39, 6);
+    c.roundRect(left, upperRail, width, lowerRail - upperRail, 5);
     c.fill();
     c.stroke();
     c.fillStyle = color;
     c.shadowColor = color;
-    c.shadowBlur = 12 + Math.sin(clock * 4) * 3;
+    c.shadowBlur = 8 + Math.sin(clock * 4) * 2;
     c.beginPath();
-    c.arc(x, y - 59, 4, 0, Math.PI * 2);
+    c.arc(left + 12, y, 4, 0, Math.PI * 2);
     c.fill();
     c.shadowBlur = 0;
     c.fillStyle = color;
-    c.font = "bold 12px sans-serif";
-    c.textAlign = "center";
-    c.fillText(blocked ? "×" : "↑", x, y - 40);
-    c.fillStyle = "#081a17e8";
-    c.fillRect(x - 35, y - 96, 70, 17);
-    c.fillStyle = color;
-    c.font = "10px sans-serif";
+    c.font = `${compact ? 11 : 12}px sans-serif`;
+    c.textAlign = "left";
+    c.textBaseline = "middle";
     c.fillText(
-      blocked
-        ? wave.kind === "train"
-          ? "慢车"
-          : wave.kind === "debris"
-            ? "异物"
-            : "封闭"
-        : `${LANE_NAMES[lane]}畅通`,
-      x,
-      y - 84,
+      compact
+        ? `${LANE_NAMES[lane]}·${status}`
+        : `0${lane + 1} ${LANE_NAMES[lane]} · ${status}`,
+      left + 24,
+      y,
     );
-    c.textAlign = "left";
+    c.restore();
   }
 
-  private obstacle(wave: Wave, y: number) {
+  private obstacle(wave: Wave, lane: number) {
     const c = this.ctx,
       x = wave.x * this.width;
     if (wave.kind === "train") {
-      this.train(x + 145, y, 145, 34, true);
+      this.train(x + 145, this.trainY(lane), 145, 34, true);
       return;
     }
+    // 各实体以实际底部落在同一根钢轨上，施工栏底部为 13，落石为 8。
+    const y = this.lowerRailY(lane) - (wave.kind === "debris" ? 8 : 13);
     c.save();
     c.translate(x, y);
     c.fillStyle = "#020d0b66";
```

## 本地视觉检查页面的完整 diff
该文件被既有 `artifacts/` 忽略规则排除，用于复现上述验证，不随站点发布。

```diff
diff --git a/artifacts/rail-alignment-preview.html b/artifacts/rail-alignment-preview.html
new file mode 100644
index 0000000..163c159
--- /dev/null
+++ b/artifacts/rail-alignment-preview.html
@@ -0,0 +1,21 @@
+<!doctype html>
+<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>轨道与信号视觉检查</title>
+<style>body{margin:0;background:#081211;color:#def3d2;font:14px sans-serif}header{padding:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}select,button{font:inherit;background:#163525;color:#def3d2;padding:8px;border:1px solid #567d4f;border-radius:4px}label{display:flex;gap:8px;align-items:center}canvas{display:block;width:100%;height:calc(100vh - 90px);min-height:260px}output{padding:8px 16px;display:block}</style>
+<header><label>列车轨道<select id="lane"><option value="0">上轨</option><option value="1" selected>中轨</option><option value="2">下轨</option><option value="0.5">上轨与中轨之间</option><option value="1.5">中轨与下轨之间</option></select></label><label>障碍类型<select id="kind"><option value="construction">施工</option><option value="train">慢车</option><option value="debris">落石</option><option value="switch">道岔</option></select></label><label>车头位置<select id="nose"><option value="0.45">45% 检查全车</option><option value="0.1">10% 起步</option><option value="0.6">60% 极速</option></select></label></header><canvas aria-label="静态轨道对齐与信号场景"></canvas>
+<script type="module">
+import { GameEngine } from '/src/game/engine.ts';
+import { WorldRenderer } from '/src/game/renderer.ts';
+const canvas=document.querySelector('canvas');
+const renderer=new WorldRenderer(canvas);
+function draw(){
+  const game=new GameEngine(()=>0); game.start(); const state=game.state; state.phase='PAUSED';
+  state.train.laneY=Number(document.querySelector('#lane').value);
+  state.train.screenX=Number(document.querySelector('#nose').value);
+  state.scroll=0.27;
+  const kind=document.querySelector('#kind').value;
+  state.waves=[{id:1,x:0.8,blocked:kind==='train'?[0,2]:[1],safeLane:0,kind,passed:false,decisionTime:2,laneAtSpawn:1}];
+  renderer.resize(canvas.clientWidth,canvas.clientHeight); renderer.render(state,0,true);
+}
+document.querySelectorAll('select').forEach(select=>select.addEventListener('change',draw));
+window.addEventListener('resize',draw); draw();
+</script></html>
\ No newline at end of file
```
