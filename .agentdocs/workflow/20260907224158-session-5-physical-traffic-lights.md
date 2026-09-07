# 会话-5：恢复实体红绿灯设计

## 背景与目标
- 用户指出上一版横向状态灯牌已经不像红绿灯。
- 恢复可直接辨认的纵向红黄绿三灯结构，同时通过贴轨底座与轨道铭牌保持轨道归属清楚。

## 约束与原则
- 分支为 `main`，与上一轮一致；本轮起始提交为 `3c5b37c1f9addaadf1e2a9b7723116438a576867`。
- 仅修改 `WorldRenderer.signal` 的视觉实现，保留列车轮底与下侧钢轨的对齐方式。
- 沿用现有红色封闭、黄色风险、绿色畅通的状态规则，预警时间和碰撞规则不变。
- 公开仓库与 Pages 发布延续用户在会话-3 的明确授权。

## 阶段与 TODO
- [x] 将横向灯牌替换为三灯实体灯壳。
- [x] 绘制背板、独立遮光檐、金属支杆、底座与轨道铭牌。
- [x] 根据轨道间距控制总高度；矮屏下单独放大铭牌。
- [x] 检查红黄绿状态、矮屏与窄屏显示，并执行既有验证。
- [x] 记录完整 diff 并更新根索引。

## 实现与关键边界
- 灯位固定为上红、中黄、下绿；每次只点亮对应状态的一盏灯，其余两盏保留暗色灯珠。
- 灯罩加入内外壳、金属明暗、遮光檐、发光与高光，保留实体设备轮廓。
- 支杆底座落在所属轨道的下侧钢轨上，底座下方的短色线辅助确认归属；支杆小铭牌显示上轨／中轨／下轨。
- 灯柱缩放系数为 `min(1, (轨道间距 - 8) / 86)`，给上一条轨道留出间隙。
- 灯柱横向保留完整边界与车头间距；铭牌在矮画布中可相对灯柱放大至 1.45 倍，避免文字过小。
- 信号仍在前景电线杆和速度线之后绘制，避免决策信息被遮挡。

## 测试方法与结果
### TC-001 红黄绿灯与实体外观
- 类型：浏览器视觉检查；优先级：高；关联模块：WorldRenderer。
- 使用会话-4 创建的本地静态检查页 `artifacts/rail-alignment-preview.html`，默认视窗为 1280 × 720。
- 选择施工场景，检查中轨红灯、上下轨绿灯；选择慢车场景，检查上下轨黄灯、中轨绿灯。
- 预期：三个灯位始终可辨，只有当前状态发光；底座与轨道名明确指出所属轨道。
- 结果：通过。静态检查页仅用于本地验证，未改动，也不进入生产包。

### TC-002 矮屏与铭牌
- 类型：浏览器视觉检查；优先级：高。
- 将视窗设为 1280 × 500，检查灯体顶部与上一条轨道的间隙。
- 初次检查发现铭牌随灯柱缩小后文字偏小；单独放大铭牌后复查施工场景。
- 预期：不侵入相邻轨道，铭牌不遮住灯珠，轨道文字可辨。
- 结果：通过。

### TC-003 窄屏、极速位置与浏览器日志
- 类型：浏览器视觉检查；优先级：高。
- 将视窗设为 390 × 844，选择施工场景和 60% 车头位置。
- 预期：三组灯体完整可见，均留在车头前方，底座对应各自轨道。
- 结果：通过；浏览器警告与错误日志为空；验证后恢复默认视窗。

### TC-004 玩法回归与构建
- `npm test`：14 项通过，含 60 个随机种子的完整通关模拟。既有测试验证玩法回归，外观由上述视觉检查验证。
- `npm run lint`：通过。
- `VITE_BASE_PATH=/too-far-ahead/ npm run build`：通过；生产脚本为 `index-CNTgpBkz.js`。
- `git diff --check -- src/game/renderer.ts`：通过。

## 发布与会话回溯
- 将本轮提交同步到公开仓库 `LeP-Ton/too-far-ahead` 的 `main`，由既有工作流验证并发布 Pages。
- 正式地址：https://lep-ton.github.io/too-far-ahead/ 。
- 回到本轮之前使用起始提交 `3c5b37c1f9addaadf1e2a9b7723116438a576867`；回到本轮使用引入本文档的提交。

## 代码变更
以下为生产源码及根索引相对本轮起点的完整统一 diff；本文档自身不递归嵌入。

```diff
diff --git a/.agentdocs/index.md b/.agentdocs/index.md
index 5816ae7..923bf9a 100644
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@ -13,3 +13,4 @@
 - `workflow/20260907161233-session-2-github-pages.md` - 会话-2：初始化 Git、保存初版并准备 GitHub Pages 发布；包含资源子路径配置、官方 Actions 工作流、逐行 diff 和发布受限说明。
 - `workflow/20260907164532-session-3-public-pages-release.md` - 会话-3：公开源码、启用 Pages 并完成发布；包含授权记录、线上网址、成功部署与 HTTP 验证结果，以及发布文档的完整 diff。
 - `workflow/20260907222816-session-4-rail-signal-alignment.md` - 会话-4：列车、慢车与障碍对齐下侧钢轨，信号灯改为所属轨道内的灯牌；包含完整逐行 diff、桌面与窄屏视觉验证及回溯基准。
+- `workflow/20260907224158-session-5-physical-traffic-lights.md` - 会话-5：将状态灯牌重绘为红黄绿三灯实体信号灯，增加灯罩、支杆和轨道铭牌；包含完整 diff、三种屏幕尺寸的视觉验证与回溯基准。
diff --git a/src/game/renderer.ts b/src/game/renderer.ts
index 4c37e59..d743ed1 100644
--- a/src/game/renderer.ts
+++ b/src/game/renderer.ts
@@ -354,67 +354,102 @@ export class WorldRenderer {
   private signal(wave: Wave, lane: number, s: GameState, clock: number) {
     const c = this.ctx,
       w = this.width;
-    const compact = w < 600;
-    const width = compact ? 96 : 126;
-    const upperRail = this.laneY(lane) + TRACK.farRail;
-    const lowerRail = this.lowerRailY(lane);
-    const y = (upperRail + lowerRail) / 2;
-    // 灯牌位于所属轨道的两根钢轨之间，并始终留在车头前方的可视区域。
-    // 窄屏缩短文字、保留轨道名，避免信号越界或压住车头。
+    // 整根灯柱收在自己的轨道间距内，顶部与上一条轨道留出空隙。
+    const scale = Math.min(1, (this.height * TRACK.laneGap - 8) / 86);
+    const halfWidth = 24 * scale;
     const x = Math.min(
-      w - width / 2 - 10,
+      w - halfWidth - 10,
       Math.max(
-        s.train.screenX * w + width / 2 + 10,
+        s.train.screenX * w + halfWidth + 14,
         (wave.x - RULES.signalLead * 0.34) * w,
       ),
     );
     if (wave.x < s.train.screenX - 0.04) return;
     const blocked = wave.blocked.includes(lane);
-    const color = blocked
+    // 三个灯位固定为上红、中黄、下绿，同一时刻只点亮当前状态。
+    const active = blocked
       ? wave.kind === "debris" || wave.kind === "train"
-        ? C.amber
-        : C.red
-      : C.mint;
-    const status = blocked
-      ? wave.kind === "train"
-        ? "慢车"
-        : wave.kind === "debris"
-          ? "异物"
-          : "封闭"
-      : "畅通";
-    const left = x - width / 2;
+        ? 1
+        : 0
+      : 2;
+    const colors = [C.red, C.amber, C.mint];
+    const unlit = ["#452824", "#423922", "#283e2b"];
     c.save();
-    // 彩色钢轨短线与灯牌直接相接，明确指出受控的是当前这一条轨道。
-    c.strokeStyle = `${color}a6`;
+    c.translate(x, this.lowerRailY(lane));
+    c.scale(scale, scale);
+
+    // 底座直接压在所属轨道的下侧钢轨上，短色线加强落点的对应关系。
+    c.strokeStyle = `${colors[active]}99`;
     c.lineWidth = 2;
     c.beginPath();
-    c.moveTo(left - 12, lowerRail);
-    c.lineTo(left + width + 12, lowerRail);
+    c.moveTo(-24, 0);
+    c.lineTo(24, 0);
     c.stroke();
-    c.fillStyle = "#081814f5";
+    const metal = c.createLinearGradient(-3, 0, 3, 0);
+    metal.addColorStop(0, "#344b41");
+    metal.addColorStop(0.5, "#8a9b80");
+    metal.addColorStop(1, "#3c5548");
+    c.fillStyle = metal;
+    c.fillRect(-3, -25, 6, 23);
+    c.fillStyle = "#667c65";
+    c.fillRect(-11, -3, 22, 3);
+
+    // 背板、金属灯壳与独立遮光檐保留实体铁路信号灯的轮廓。
+    c.fillStyle = "#071310";
+    c.strokeStyle = "#415d4e";
     c.lineWidth = 1;
     c.beginPath();
-    c.roundRect(left, upperRail, width, lowerRail - upperRail, 5);
+    c.roundRect(-18, -85, 36, 66, 10);
     c.fill();
     c.stroke();
-    c.fillStyle = color;
-    c.shadowColor = color;
-    c.shadowBlur = 8 + Math.sin(clock * 4) * 2;
+    const housing = c.createLinearGradient(-15, 0, 15, 0);
+    housing.addColorStop(0, "#34453a");
+    housing.addColorStop(0.35, "#17291f");
+    housing.addColorStop(1, "#253c2e");
+    c.fillStyle = housing;
+    c.strokeStyle = "#71846b";
     c.beginPath();
-    c.arc(left + 12, y, 4, 0, Math.PI * 2);
+    c.roundRect(-14, -81, 28, 58, 7);
     c.fill();
-    c.shadowBlur = 0;
-    c.fillStyle = color;
-    c.font = `${compact ? 11 : 12}px sans-serif`;
-    c.textAlign = "left";
+    c.stroke();
+    for (let light = 0; light < 3; light++) {
+      const y = -70 + light * 18;
+      const lit = light === active;
+      c.fillStyle = "#060e0a";
+      c.beginPath();
+      c.arc(0, y, 9, 0, Math.PI * 2);
+      c.fill();
+      c.fillStyle = lit ? colors[light] : unlit[light];
+      c.shadowColor = colors[light];
+      c.shadowBlur = lit ? 10 + Math.sin(clock * 4) * 1.5 : 0;
+      c.beginPath();
+      c.arc(0, y, 6.2, 0, Math.PI * 2);
+      c.fill();
+      c.shadowBlur = 0;
+      if (lit) {
+        c.fillStyle = "#f6ffdcbb";
+        c.beginPath();
+        c.ellipse(-1.5, y - 2, 2.5, 1.6, -0.35, 0, Math.PI * 2);
+        c.fill();
+      }
+      c.strokeStyle = "#809078";
+      c.lineWidth = 1.2;
+      c.beginPath();
+      c.arc(0, y - 1, 8.5, Math.PI * 1.08, Math.PI * 1.92);
+      c.stroke();
+    }
+
+    // 铭牌在矮画布中单独放大一些，避免随灯柱一起缩成难辨的文字。
+    c.translate(0, -5);
+    const plaqueScale = Math.min(1 / scale, 1.45);
+    c.scale(plaqueScale, plaqueScale);
+    c.fillStyle = "#b8c8a5";
+    c.fillRect(-16, -12, 32, 12);
+    c.fillStyle = "#20382a";
+    c.font = "bold 10px sans-serif";
+    c.textAlign = "center";
     c.textBaseline = "middle";
-    c.fillText(
-      compact
-        ? `${LANE_NAMES[lane]}·${status}`
-        : `0${lane + 1} ${LANE_NAMES[lane]} · ${status}`,
-      left + 24,
-      y,
-    );
+    c.fillText(LANE_NAMES[lane], 0, -5.5);
     c.restore();
   }
 
```
