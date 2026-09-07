# 会话-7：信号灯固定在轨旁

## 背景与目标
- 用户指出红绿灯没有必要跟着列车移动。
- 原实现用车头位置给信号灯设置横向下限，导致信号灯接近列车后停在车头前方，并随车头推进。
- 移除跟随与边界吸附，让轨旁信号灯随场景经过列车并自然离屏。

## 约束与原则
- 当前分支为 `main`，与上一轮一致；起始提交为 `2d16f874ef32217fc1d9b7118d5dab742ebf82a1`。
- 保留实体红黄绿灯外形、轨道铭牌、底座与列车贴轨坐标。
- 只调整绘制位置与可见性，沿用障碍运动、预警和碰撞规则。
- 公开源码和 Pages 发布继续使用用户已明确授权的仓库。

## 阶段与 TODO
- [x] 定位车头位置下限及视口边缘吸附。
- [x] 信号坐标直接取对应障碍位置减去固定提前距离。
- [x] 已通过的信号继续绘制，直到完整移出画面。
- [x] 检查车头解耦、场景移动、通过后保留与离屏行为。
- [x] 完成规则回归、静态检查、构建和完整变更记录。

## 实现与边界
- `signal` 不再接收 `GameState`，其横向坐标不依赖 `train.screenX`。
- 保留原提前距离，直接使用 `(wave.x - RULES.signalLead * 0.34) * width`，与所属障碍保持固定相对位置。
- 移除左右边界位置钳制；灯体进入可见范围时绘制，完全移出范围时跳过。
- 移除 `wave.passed` 对信号绘制的限制。障碍通过后仍保留轨旁实体，不会在车头附近突然消失。
- 既有障碍清理位置在信号离开画面之后，无需改变引擎生命周期。

## 测试方法与结果
### TC-001 车头位置解耦
- 类型：浏览器视觉检查；优先级：高；关联模块：WorldRenderer。
- 打开本地检查页 `artifacts/signal-motion-preview.html`，视窗 1280 × 720。
- 保持“接近”场景，切换车头 10% 与 60%；再保持“经过车头”场景，切换车头 60% 与 10%。
- 预期：同一场景的三组信号灯不随车头改变位置。
- 结果：通过，尤其在信号已经位于 60% 车头后方时，不再被推回车头前方。

### TC-002 随场景经过与通过后保留
- 类型：浏览器视觉检查；优先级：高。
- 车头保持 60%，依次选择“接近”“经过车头”“画面左侧”；在“画面左侧”选择“已安全通过”。
- 预期：信号与场景一起左移，经过车头后继续移动；通过状态不会使仍可见的灯体消失。
- 结果：通过。

### TC-003 完整离屏与浏览器日志
- 类型：浏览器视觉检查；优先级：高。
- 继续选择“驶出画面”。
- 预期：信号从左侧退出，不滞留在车头或边界。
- 结果：通过；浏览器错误与警告日志为空。

### TC-004 玩法回归与构建
- `npm test`：14 项通过，含 60 个随机种子的完整通关模拟；玩法测试与视觉检查分别验证各自范围。
- `npm run lint`：通过。
- `VITE_BASE_PATH=/too-far-ahead/ npm run build`：通过；生产脚本为 `index-B_p64WhL.js`。
- `git diff --check -- src/game/renderer.ts`：通过。

## 发布与回溯
- 将本轮提交同步到 `LeP-Ton/too-far-ahead` 的 `main`，通过既有工作流发布到 https://lep-ton.github.io/too-far-ahead/ 。
- 回到本轮之前使用起始提交 `2d16f874ef32217fc1d9b7118d5dab742ebf82a1`；回到本轮使用引入本文档的提交。

## 代码变更
以下为源码与根索引相对本轮起点的完整统一 diff；本文档自身不递归嵌入。

```diff
diff --git a/.agentdocs/index.md b/.agentdocs/index.md
index 923bf9a..a23a24c 100644
--- a/.agentdocs/index.md
+++ b/.agentdocs/index.md
@@ -14,3 +14,4 @@
 - `workflow/20260907164532-session-3-public-pages-release.md` - 会话-3：公开源码、启用 Pages 并完成发布；包含授权记录、线上网址、成功部署与 HTTP 验证结果，以及发布文档的完整 diff。
 - `workflow/20260907222816-session-4-rail-signal-alignment.md` - 会话-4：列车、慢车与障碍对齐下侧钢轨，信号灯改为所属轨道内的灯牌；包含完整逐行 diff、桌面与窄屏视觉验证及回溯基准。
 - `workflow/20260907224158-session-5-physical-traffic-lights.md` - 会话-5：将状态灯牌重绘为红黄绿三灯实体信号灯，增加灯罩、支杆和轨道铭牌；包含完整 diff、三种屏幕尺寸的视觉验证与回溯基准。
+- `workflow/20260907225351-session-7-fixed-track-signals.md` - 会话-7：移除信号灯跟随车头与边界吸附，恢复随场景经过和离屏；包含完整 diff、车头位置解耦与通过后离屏的视觉验证。
diff --git a/src/game/renderer.ts b/src/game/renderer.ts
index d743ed1..57ab626 100644
--- a/src/game/renderer.ts
+++ b/src/game/renderer.ts
@@ -87,9 +87,8 @@ export class WorldRenderer {
     if (!reducedMotion) this.speedLines(s, clock);
     // 信号是决策信息，最后绘制，避免被前景电线杆和速度线遮挡。
     for (const wave of s.waves) {
-      if (!wave.passed) {
-        for (let lane = 0; lane < 3; lane++) this.signal(wave, lane, s, clock);
-      }
+      // 已通过的信号仍留在轨旁，直到随场景移出画面。
+      for (let lane = 0; lane < 3; lane++) this.signal(wave, lane, clock);
     }
     c.restore();
     const vignette = c.createLinearGradient(0, 0, 0, h);
@@ -351,20 +350,16 @@ export class WorldRenderer {
     c.restore();
   }
 
-  private signal(wave: Wave, lane: number, s: GameState, clock: number) {
+  private signal(wave: Wave, lane: number, clock: number) {
     const c = this.ctx,
       w = this.width;
     // 整根灯柱收在自己的轨道间距内，顶部与上一条轨道留出空隙。
     const scale = Math.min(1, (this.height * TRACK.laneGap - 8) / 86);
     const halfWidth = 24 * scale;
-    const x = Math.min(
-      w - halfWidth - 10,
-      Math.max(
-        s.train.screenX * w + halfWidth + 14,
-        (wave.x - RULES.signalLead * 0.34) * w,
-      ),
-    );
-    if (wave.x < s.train.screenX - 0.04) return;
+    // 信号固定在对应障碍前方，与场景同速移动，不受车头位置或视口边缘牵引。
+    const x = (wave.x - RULES.signalLead * 0.34) * w;
+    // 完整移出画面后才停止绘制，经过车头或已通过障碍都不改变实体位置。
+    if (x + halfWidth < 0 || x - halfWidth > w) return;
     const blocked = wave.blocked.includes(lane);
     // 三个灯位固定为上红、中黄、下绿，同一时刻只点亮当前状态。
     const active = blocked
```

## 本地视觉检查页的完整 diff
该页面位于已忽略的 `artifacts/`，仅用于复现验证，不进入生产包。

```diff
diff --git a/artifacts/signal-motion-preview.html b/artifacts/signal-motion-preview.html
new file mode 100644
index 0000000..dd5bb05
--- /dev/null
+++ b/artifacts/signal-motion-preview.html
@@ -0,0 +1,26 @@
+<!doctype html>
+<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>信号灯场景移动检查</title>
+<style>body{margin:0;background:#081211;color:#def3d2;font:14px sans-serif}header{padding:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}select{font:inherit;background:#163525;color:#def3d2;padding:8px;border:1px solid #567d4f;border-radius:4px}label{display:flex;gap:8px;align-items:center}canvas{display:block;width:100%;height:calc(100vh - 90px);min-height:260px}</style>
+<header>
+<label>车头位置<select id="nose"><option value="0.1">10% 起步</option><option value="0.45">45% 中途</option><option value="0.6">60% 极速</option></select></label>
+<label>场景进度<select id="position"><option value="1.53">刚出现</option><option value="1.2" selected>接近</option><option value="0.85">经过车头</option><option value="0.52">画面左侧</option><option value="0.4">驶出画面</option></select></label>
+<label>障碍状态<select id="passed"><option value="false">尚未通过</option><option value="true">已安全通过</option></select></label>
+</header><canvas aria-label="信号灯相对场景固定的检查画面"></canvas>
+<script type="module">
+import { GameEngine } from '/src/game/engine.ts';
+import { WorldRenderer } from '/src/game/renderer.ts';
+const canvas = document.querySelector('canvas');
+const renderer = new WorldRenderer(canvas);
+function draw() {
+  const game = new GameEngine(() => 0); game.start();
+  const state = game.state; state.phase = 'PAUSED';
+  const position = Number(document.querySelector('#position').value);
+  state.train.screenX = Number(document.querySelector('#nose').value);
+  state.scroll = 1.53 - position;
+  state.waves = [{id:1,x:position,blocked:[1],safeLane:0,kind:'construction',passed:document.querySelector('#passed').value === 'true',decisionTime:2,laneAtSpawn:1}];
+  renderer.resize(canvas.clientWidth, canvas.clientHeight);
+  renderer.render(state, 0, true);
+}
+document.querySelectorAll('select').forEach(select => select.addEventListener('change', draw));
+window.addEventListener('resize', draw); draw();
+</script></html>
```
