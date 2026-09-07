# 会话-8：长编组列车造型优化

## 背景与目标
- 用户要求优化列车造型，并加长车身，使车头推进到屏幕右侧时车尾仍超出左侧画面。
- 原列车长度为 `max(画面宽度 × 0.265, 240)`，车头推进后会露出车尾，视觉上只有约三节车厢。
- 改为独立车厢组成的长列车，保留高铁流线外形和轨道接触基准。

## 约束与原则
- 当前分支为 `main`，与上一轮一致；本轮起始提交为 `7e8395e2291269b663758e1285ba89a32ce51fee`。
- 仅修改 Canvas 绘制；速度、实际车头推进范围、变轨与碰撞规则保持原有定义。
- 使用已有 Canvas API（画布绘图接口），不新增图片、字体和依赖。
- 公开源码与 Pages 发布继续使用用户已明确授权的仓库。

## 阶段与 TODO
- [x] 核对原列车长度、车头轮廓与轮底坐标。
- [x] 改为至少八节的编组，按画布宽度增加车厢。
- [x] 重绘流线车头、车窗、车门、连接风挡、屋顶设备和转向架。
- [x] 验证右侧边界、三条轨道、变轨、制动、待发车和慢车对照。
- [x] 完成手机与宽屏视觉验证、规则回归和生产构建。
- [x] 记录完整 diff 并更新根索引。

## 实现与边界
- 新增 `TRAIN` 几何参数：最少 8 节，单节长度为 `max(156, 车高 × 5.4)`，目标总长为画布宽度的 1.2 倍。
- 车厢数量为 `max(8, ceil(目标总长 / 单节长度))`，总长始终不小于画布宽度的 120%；宽屏增加车厢而非拉伸单节比例。
- 即便将车头放在画布右边缘，车尾仍至少超出左侧约 20% 画布宽度。正常玩法中的车头推进上限仍为 60%；检查页额外使用 96% 位置验证边界余量。
- `train` 管理编组、可见车厢裁剪、前灯与制动反馈，`trainCar` 管理每节车厢的车壳和细节；屏幕左侧保留一节绘制余量，其他完全不可见的车厢跳过绘制。
- 车头采用延长的曲线鼻锥、倾斜挡风玻璃、反光与鼻锥接缝；车身使用分层亮色涂装、细腰线和深色底裙。
- 独立车厢包含连接风挡、车门、车窗框与玻璃反光、车顶设备和车厢编号。
- 每节车厢有两组转向架；轮心和半径仍取自 `WHEEL`，轮底保持接触对应下侧钢轨。
- 慢车复用细节绘制，保留原有 145 像素长度、34 像素高度及黄色腰线，不随玩家编组加长。

## 测试方法与结果
### TC-001 造型和车尾边界
- 类型：浏览器视觉检查；优先级：高；关联模块：WorldRenderer。
- 使用本地检查页 `artifacts/train-appearance-preview.html`，默认视窗 1280 × 720。
- 先选择中轨、60% 车头位置，再切换到 96% 右侧边缘。
- 预期：流线车头、窗框、门、连接风挡与转向架可辨；车尾始终超出左侧画面。
- 结果：通过。

### TC-002 贴轨和运行状态
- 类型：浏览器视觉检查；优先级：高。
- 在中轨开启慢车对照，检查上下轨短慢车与玩家长列车的贴轨位置与配色区别。
- 关闭慢车，切到上轨并选择制动，再检查中轨与下轨之间的变轨位置；恢复默认视窗后检查待发车。
- 预期：车轮贴轨、制动反馈正常、变轨中的整列绘制连续，待发车也为长编组。
- 结果：通过。

### TC-003 手机与宽屏
- 类型：浏览器视觉检查；优先级：高。
- 在 390 × 844 视窗下选择下轨、96% 车头位置，检查完整车身和左侧边界。
- 在 2560 × 720 视窗下选择中轨、96% 车头位置，检查完整宽屏范围；截图工具对超宽视窗的显示会裁切，额外使用完整页面截图确认右侧车头与左侧车身。
- 预期：两种尺寸中，车尾都在左侧屏外；宽屏车厢数量增加，单节比例没有拉伸。
- 结果：通过；验证后恢复默认视窗。浏览器错误与警告日志为空。
- 本地检查页使用纵向弹性布局，为窄屏换行后的操作控件留出空间；不进入生产包。

### TC-004 玩法回归与生产构建
- `npm test`：14 项通过，含 60 个随机种子的完整通关模拟；这些测试验证玩法回归，外观和车尾边界由上述视觉检查验证。
- `npm run lint`：通过。
- `VITE_BASE_PATH=/too-far-ahead/ npm run build`：通过；生产脚本为 `index-OGCQ3ci5.js`。
- `git diff --check -- src/game/renderer.ts`：通过。

## 发布与会话回溯
- 将本轮提交同步到公开仓库 `LeP-Ton/too-far-ahead` 的 `main`，由既有工作流验证并发布到 https://lep-ton.github.io/too-far-ahead/ 。
- 回到本轮之前使用起始提交 `7e8395e2291269b663758e1285ba89a32ce51fee`；回到本轮使用引入本文档的提交。

## 代码变更
以下为源码及根索引相对本轮起点的完整统一 diff；本文档自身不递归嵌入。

```diff
diff --git a/.agentdocs/index.md b/.agentdocs/index.md
index a23a24c..4f2ae80 100644
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@ -15,3 +15,4 @@
 - `workflow/20260907222816-session-4-rail-signal-alignment.md` - 会话-4：列车、慢车与障碍对齐下侧钢轨，信号灯改为所属轨道内的灯牌；包含完整逐行 diff、桌面与窄屏视觉验证及回溯基准。
 - `workflow/20260907224158-session-5-physical-traffic-lights.md` - 会话-5：将状态灯牌重绘为红黄绿三灯实体信号灯，增加灯罩、支杆和轨道铭牌；包含完整 diff、三种屏幕尺寸的视觉验证与回溯基准。
 - `workflow/20260907225351-session-7-fixed-track-signals.md` - 会话-7：移除信号灯跟随车头与边界吸附，恢复随场景经过和离屏；包含完整 diff、车头位置解耦与通过后离屏的视觉验证。
+- `workflow/20260908073703-session-8-long-train-design.md` - 会话-8：重绘流线车头和独立车厢，改为至少八节且覆盖画面 120% 的长编组；包含完整 diff、屏幕右侧车尾边界与多尺寸视觉验证。
diff --git a/src/game/renderer.ts b/src/game/renderer.ts
index 57ab626..b7d8b99 100644
--- a/src/game/renderer.ts
+++ b/src/game/renderer.ts
@@ -13,6 +13,8 @@ const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
 // 轨道与实体共享同一组几何基准，轮底接触下侧钢轨，避免各自偏移。
 const TRACK = { firstLane: 0.58, laneGap: 0.147, farRail: 5, nearRail: 31 };
 const WHEEL = { top: 3, height: 5 };
+// 保持车厢比例，以完整编组覆盖画面；宽屏增加车厢，不把单节车厢拉长。
+const TRAIN = { minCars: 8, carAspect: 5.4, minCarLength: 156, viewportSpan: 1.2 };
 
 /** 世界只消费状态，不参与规则计算；所有坐标随画布缩放。 */
 export class WorldRenderer {
@@ -76,7 +78,7 @@ export class WorldRenderer {
         this.train(
           x,
           y,
-          Math.max(w * 0.265, 240),
+          w * TRAIN.viewportSpan,
           Math.max(26, Math.min(h * 0.064, 47)),
           false,
           s,
@@ -261,66 +263,27 @@ export class WorldRenderer {
     s?: GameState,
   ) {
     const c = this.ctx;
+    const carLength = slow
+      ? length
+      : Math.max(TRAIN.minCarLength, height * TRAIN.carAspect);
+    const carCount = slow ? 1 : Math.max(TRAIN.minCars, Math.ceil(length / carLength));
     c.save();
     c.translate(x, y);
     if (s?.phase === "GAME_OVER") c.rotate(0.035);
-    const body = c.createLinearGradient(0, -height, 0, 0);
-    body.addColorStop(0, slow ? "#a3afa0" : "#edf5df");
-    body.addColorStop(0.45, slow ? "#718b7f" : "#b8d1bf");
-    body.addColorStop(1, slow ? "#445b50" : "#6e9682");
-    c.shadowColor = "#000a";
-    c.shadowBlur = 15;
-    c.shadowOffsetY = 10;
-    c.fillStyle = body;
-    c.beginPath();
-    c.moveTo(-length, -height);
-    c.lineTo(-height * 1.9, -height);
-    c.bezierCurveTo(
-      -height * 0.85,
-      -height,
-      -height * 0.28,
-      -height * 0.45,
-      0,
-      -height * 0.13,
-    );
-    c.quadraticCurveTo(height * 0.12, 4, -height * 0.45, 4);
-    c.lineTo(-length, 4);
-    c.closePath();
-    c.fill();
-    c.shadowBlur = 0;
-    c.shadowOffsetY = 0;
-    c.fillStyle = "#153c39";
-    c.beginPath();
-    c.moveTo(-height * 1.76, -height * 0.89);
-    c.quadraticCurveTo(
-      -height * 0.98,
-      -height * 0.81,
-      -height * 0.53,
-      -height * 0.38,
-    );
-    c.lineTo(-height * 1.27, -height * 0.43);
-    c.closePath();
-    c.fill();
-    c.fillStyle = "#1a3b35";
-    for (let dx = height * 2.05; dx < length - 6; dx += 22)
-      c.fillRect(-dx, -height * 0.71, 14, height * 0.26);
-    c.fillStyle = slow ? "#e4b579" : "#3c9e7a";
-    c.fillRect(-length, -height * 0.18, length - height * 0.38, 3);
-    c.strokeStyle = "#4d6e5d";
-    c.lineWidth = 1;
-    for (let dx = 135; dx < length; dx += 145) {
-      c.beginPath();
-      c.moveTo(-dx, -height + 3);
-      c.lineTo(-dx, 2);
-      c.stroke();
+    // 玩家列车至少八节且总长超过画布，车头推进至右边缘也不会露出车尾。
+    // 只绘制可见车厢及左侧余量，避免长编组增加无效绘制。
+    for (let car = carCount - 1; car >= 0; car--) {
+      const right = -car * carLength;
+      if (x + right < -carLength) continue;
+      this.trainCar(right, carLength, height, car === 0, slow, car + 1);
     }
-    c.fillStyle = "#0c201c";
-    for (let dx = 33; dx < length; dx += 53)
-      c.fillRect(-dx, WHEEL.top, 20, WHEEL.height);
-    c.fillStyle = "#edfbdc";
+
+    c.fillStyle = "#f1ffde";
     c.shadowColor = "#d9f6b4";
-    c.shadowBlur = 13;
-    c.fillRect(-height * 0.35, -height * 0.21, height * 0.22, 2);
+    c.shadowBlur = 12;
+    c.beginPath();
+    c.roundRect(-height * 0.43, -height * 0.18, height * 0.23, 2.5, 1.2);
+    c.fill();
     c.shadowBlur = 0;
     if (!slow) {
       const beam = c.createLinearGradient(0, 0, 120, 0);
@@ -333,9 +296,6 @@ export class WorldRenderer {
       c.lineTo(130, 10);
       c.closePath();
       c.fill();
-      c.fillStyle = "#edf8e1";
-      c.font = "italic bold 9px sans-serif";
-      c.fillText("CR · 领先号", -Math.min(length - 12, 144), -height * 0.28);
     }
     if (s?.train.isBraking || s?.phase === "GAME_OVER") {
       c.strokeStyle = "#f5c578";
@@ -350,6 +310,173 @@ export class WorldRenderer {
     c.restore();
   }
 
+  /** 每节车厢独立绘制车壳、车门和连接处，车头使用延长的流线轮廓。 */
+  private trainCar(
+    right: number,
+    length: number,
+    height: number,
+    head: boolean,
+    slow: boolean,
+    number: number,
+  ) {
+    const c = this.ctx;
+    const left = -length + 4;
+    c.save();
+    c.translate(right, 0);
+
+    // 风挡连接与屋顶设备先绘制，再由车壳覆盖接缝边缘。
+    c.fillStyle = "#20372f";
+    c.fillRect(left - 5, -height + 7, 7, height - 10);
+    c.strokeStyle = "#60786a";
+    c.lineWidth = 1;
+    for (let fold = 0; fold < 3; fold++) {
+      c.beginPath();
+      c.moveTo(left - 4 + fold * 2, -height + 8);
+      c.lineTo(left - 4 + fold * 2, -3);
+      c.stroke();
+    }
+    if (!head) {
+      c.fillStyle = slow ? "#789084" : "#a9bbb0";
+      c.beginPath();
+      c.roundRect(left + length * 0.38, -height - 3, length * 0.28, 5, 2);
+      c.fill();
+    }
+
+    const outline = new Path2D();
+    if (head) {
+      outline.moveTo(left + 5, -height);
+      outline.lineTo(-height * 2.2, -height);
+      outline.bezierCurveTo(
+        -height * 1.23, -height,
+        -height * 0.79, -height * 0.65,
+        -height * 0.18, -height * 0.22,
+      );
+      outline.quadraticCurveTo(0, -height * 0.12, 0, -height * 0.07);
+      outline.quadraticCurveTo(0, 2, -height * 0.3, 2);
+      outline.lineTo(left + 5, 2);
+      outline.quadraticCurveTo(left, 2, left, -3);
+      outline.lineTo(left, -height + 5);
+      outline.quadraticCurveTo(left, -height, left + 5, -height);
+      outline.closePath();
+    } else {
+      outline.roundRect(left, -height, length - 4, height + 2, 4);
+    }
+    const body = c.createLinearGradient(0, -height, 0, 3);
+    body.addColorStop(0, slow ? "#b2bcb0" : "#f2f7ed");
+    body.addColorStop(0.26, slow ? "#8faaa0" : "#e1ebe1");
+    body.addColorStop(0.73, slow ? "#718b7f" : "#bfd2c6");
+    body.addColorStop(1, slow ? "#475e52" : "#7e9b8b");
+    c.fillStyle = body;
+    c.shadowColor = "#0008";
+    c.shadowBlur = 9;
+    c.shadowOffsetY = 6;
+    c.fill(outline);
+    c.shadowBlur = 0;
+    c.shadowOffsetY = 0;
+    c.strokeStyle = slow ? "#668071" : "#d4e2d3";
+    c.lineWidth = 0.8;
+    c.stroke(outline);
+
+    c.save();
+    c.clip(outline);
+    // 细腰线与深色底裙沿整个编组贯通，车厢接缝仍清楚可见。
+    c.fillStyle = slow ? "#d5ae6d" : "#317e69";
+    c.fillRect(left, -height * 0.21, length, 3);
+    c.fillStyle = slow ? "#f0d39c" : "#b0d8ba";
+    c.fillRect(left, -height * 0.21 - 1, length, 1);
+    c.fillStyle = slow ? "#40594d" : "#587767";
+    c.fillRect(left, -2, length, 5);
+    c.fillStyle = "#ffffff5c";
+    c.fillRect(left + 6, -height + 2, length - 12, 1);
+
+    const doorX = left + height * 0.3;
+    const doorWidth = height * 0.43;
+    c.strokeStyle = slow ? "#5d7a68" : "#8ca897";
+    c.lineWidth = 0.8;
+    c.beginPath();
+    c.roundRect(doorX, -height + 5, doorWidth, height - 7, 2);
+    c.stroke();
+    c.fillStyle = "#1c3c3d";
+    c.beginPath();
+    c.roundRect(doorX + 3, -height * 0.72, doorWidth - 6, height * 0.24, 1.5);
+    c.fill();
+    c.fillStyle = "#75917e";
+    c.fillRect(doorX + doorWidth - 3, -height * 0.37, 1, 4);
+
+    // 深色车窗带内保留独立窗框、玻璃明暗与细小反光。
+    const windowStart = doorX + doorWidth + 7;
+    const windowEnd = head ? -height * 2.23 : -height * 0.45;
+    const glass = c.createLinearGradient(0, -height * 0.76, 0, -height * 0.44);
+    glass.addColorStop(0, "#0e2429");
+    glass.addColorStop(1, slow ? "#2d4c43" : "#365d60");
+    c.fillStyle = slow ? "#58776b" : "#9bb8ab";
+    c.fillRect(windowStart - 2, -height * 0.77, windowEnd - windowStart + 4, height * 0.34);
+    const windowWidth = height * 0.38;
+    const windowStep = height * 0.51;
+    for (let wx = windowStart; wx + windowWidth <= windowEnd; wx += windowStep) {
+      c.fillStyle = glass;
+      c.beginPath();
+      c.roundRect(wx, -height * 0.74, windowWidth, height * 0.27, 2);
+      c.fill();
+      c.fillStyle = "#cae9df42";
+      c.fillRect(wx + 2, -height * 0.71, windowWidth - 4, 1);
+      c.fillStyle = "#9fc7c21c";
+      c.fillRect(wx + 2, -height * 0.66, 2, height * 0.14);
+    }
+
+    if (head) {
+      c.fillStyle = glass;
+      c.beginPath();
+      c.moveTo(-height * 2.07, -height * 0.91);
+      c.quadraticCurveTo(-height * 1.49, -height * 0.89, -height * 1.02, -height * 0.59);
+      c.lineTo(-height * 0.68, -height * 0.37);
+      c.quadraticCurveTo(-height * 1.19, -height * 0.39, -height * 1.52, -height * 0.51);
+      c.closePath();
+      c.fill();
+      c.strokeStyle = "#bad8cf8c";
+      c.lineWidth = 1;
+      c.beginPath();
+      c.moveTo(-height * 1.92, -height * 0.85);
+      c.quadraticCurveTo(-height * 1.45, -height * 0.82, -height * 1.08, -height * 0.59);
+      c.stroke();
+      c.strokeStyle = "#7f9c8a";
+      c.beginPath();
+      c.moveTo(-height * 1.12, -height * 0.28);
+      c.quadraticCurveTo(-height * 0.57, -height * 0.16, -height * 0.12, -height * 0.1);
+      c.stroke();
+      if (!slow) {
+        c.fillStyle = "#416a57";
+        c.font = `italic bold ${Math.max(8, height * 0.21)}px sans-serif`;
+        c.fillText("CR · 领先号", -height * 3.36, -height * 0.29);
+      }
+    } else {
+      c.fillStyle = "#668372";
+      c.font = "8px monospace";
+      c.fillText(String(number).padStart(2, "0"), left + height * 0.35, -height * 0.05);
+    }
+    c.restore();
+
+    // 两组转向架支撑每节车厢，车轮底部继续使用下侧钢轨的接触基准。
+    for (const bx of [left + height * 0.83, head ? -height * 1.18 : -height * 0.72]) {
+      c.fillStyle = "#152b24";
+      c.beginPath();
+      c.roundRect(bx - 15, 0, 30, 5, 2);
+      c.fill();
+      for (const axle of [-9, 9]) {
+        const wheelY = WHEEL.top + WHEEL.height / 2;
+        c.fillStyle = "#081711";
+        c.beginPath();
+        c.arc(bx + axle, wheelY, WHEEL.height / 2, 0, Math.PI * 2);
+        c.fill();
+        c.fillStyle = "#6a8470";
+        c.beginPath();
+        c.arc(bx + axle, wheelY, 0.9, 0, Math.PI * 2);
+        c.fill();
+      }
+    }
+    c.restore();
+  }
+
   private signal(wave: Wave, lane: number, clock: number) {
     const c = this.ctx,
       w = this.width;
```

## 本地视觉检查页的完整 diff
该页面位于已忽略的 `artifacts/`，仅用于复现上述验证，不进入生产包。

```diff
diff --git a/artifacts/train-appearance-preview.html b/artifacts/train-appearance-preview.html
new file mode 100644
index 0000000..43ab35d
--- /dev/null
+++ b/artifacts/train-appearance-preview.html
@@ -0,0 +1,32 @@
+<!doctype html>
+<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>长编组列车视觉检查</title>
+<style>body{height:100vh;display:flex;flex-direction:column;margin:0;background:#081211;color:#def3d2;font:14px sans-serif}header{flex:none;padding:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}select{font:inherit;background:#163525;color:#def3d2;padding:8px;border:1px solid #567d4f;border-radius:4px}label{display:flex;gap:8px;align-items:center}canvas{display:block;width:100%;flex:1;min-height:260px;min-width:0}</style>
+<header>
+<label>车头位置<select id="nose"><option value="0.1">10% 起步</option><option value="0.6" selected>60% 极速</option><option value="0.96">96% 右侧边缘</option></select></label>
+<label>列车轨道<select id="lane"><option value="0">上轨</option><option value="1" selected>中轨</option><option value="2">下轨</option><option value="1.5">变轨中途</option></select></label>
+<label>运行状态<select id="phase"><option value="PAUSED">静止观察</option><option value="READY">待发车</option><option value="BRAKING">制动</option><option value="GAME_OVER">碰撞后</option></select></label>
+<label>慢车对照<select id="obstacle"><option value="false">关闭</option><option value="true">开启</option></select></label>
+</header><canvas aria-label="长编组列车及车尾边界检查场景"></canvas>
+<script type="module">
+import { GameEngine } from '/src/game/engine.ts';
+import { WorldRenderer } from '/src/game/renderer.ts';
+const canvas = document.querySelector('canvas');
+const renderer = new WorldRenderer(canvas);
+function draw() {
+  const game = new GameEngine(() => 0); game.start();
+  const state = game.state;
+  const phase = document.querySelector('#phase').value;
+  state.phase = phase === 'BRAKING' ? 'PAUSED' : phase;
+  state.train.isBraking = phase === 'BRAKING';
+  state.train.screenX = Number(document.querySelector('#nose').value);
+  state.train.laneY = Number(document.querySelector('#lane').value);
+  state.scroll = 0.27;
+  if (document.querySelector('#obstacle').value === 'true') {
+    state.waves = [{id:1,x:0.8,blocked:[0,2],safeLane:1,kind:'train',passed:false,decisionTime:2,laneAtSpawn:1}];
+  }
+  renderer.resize(canvas.clientWidth, canvas.clientHeight);
+  renderer.render(state, 0, true);
+}
+document.querySelectorAll('select').forEach(select => select.addEventListener('change', draw));
+window.addEventListener('resize', draw); draw();
+</script></html>
```
