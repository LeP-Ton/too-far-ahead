import { LANE_NAMES, RULES } from "./config";
import type { GameState, Wave } from "./engine";

const C = {
  mint: "#b6f36b",
  cyan: "#66dfd0",
  red: "#ff7773",
  amber: "#f4c56e",
};
const fract = (n: number) => n - Math.floor(n);
const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// 轨道与实体共享同一组几何基准，轮底接触下侧钢轨，避免各自偏移。
const TRACK = { firstLane: 0.58, laneGap: 0.147, farRail: 5, nearRail: 31 };
const WHEEL = { top: 3, height: 5 };
// 保持车厢比例，以完整编组覆盖画面；宽屏增加车厢，不把单节车厢拉长。
const TRAIN = { minCars: 8, carAspect: 5.4, minCarLength: 156, viewportSpan: 1.2 };

/** 世界只消费状态，不参与规则计算；所有坐标随画布缩放。 */
export class WorldRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private ratio = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.ratio);
    this.canvas.height = Math.round(height * this.ratio);
  }

  private laneY(lane: number) {
    return this.height * (TRACK.firstLane + lane * TRACK.laneGap);
  }

  private lowerRailY(lane: number) {
    return this.laneY(lane) + TRACK.nearRail;
  }

  private trainY(lane: number) {
    // lane 可以是变轨中的小数，接触点会随列车连续移动。
    return this.lowerRailY(lane) - WHEEL.top - WHEEL.height;
  }

  render(s: GameState, clock: number, reducedMotion: boolean) {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    c.clearRect(0, 0, w, h);
    const shake = reducedMotion ? 0 : s.impact * 6 + s.burst * 1.3;
    c.save();
    c.translate(
      Math.sin(clock * 70) * shake,
      Math.cos(clock * 59) * shake * 0.4,
    );
    this.sky(s, clock);
    this.city(s);
    this.rails(s);
    if (s.phase !== "READY") this.sightline(s);
    // 轨道按远近绘制，避免下轨实体被上轨列车覆盖。
    for (let lane = 0; lane < 3; lane++) {
      for (const wave of s.waves) {
        if (wave.blocked.includes(lane) && wave.x < 1.2)
          this.obstacle(wave, lane);
      }
      const currentLane = Math.round(s.train.laneY);
      if (currentLane === lane) {
        const ready = s.phase === "READY";
        const x = ready ? w * 0.69 : s.train.screenX * w;
        const y = this.trainY(ready ? 1 : s.train.laneY);
        this.train(
          x,
          y,
          w * TRAIN.viewportSpan,
          Math.max(26, Math.min(h * 0.064, 47)),
          false,
          s,
        );
      }
    }
    this.foreground(s);
    if (!reducedMotion) this.speedLines(s, clock);
    // 信号是决策信息，最后绘制，避免被前景电线杆和速度线遮挡。
    for (const wave of s.waves) {
      // 已通过的信号仍留在轨旁，直到随场景移出画面。
      for (let lane = 0; lane < 3; lane++) this.signal(wave, lane, clock);
    }
    c.restore();
    const vignette = c.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, "#04111000");
    vignette.addColorStop(0.87, "#04111000");
    vignette.addColorStop(1, "#04111090");
    c.fillStyle = vignette;
    c.fillRect(0, 0, w, h);
  }

  private sky(s: GameState, clock: number) {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    const sky = c.createLinearGradient(0, 0, 0, h * 0.68);
    sky.addColorStop(0, "#071719");
    sky.addColorStop(0.55, "#102b2c");
    sky.addColorStop(1, "#2b5350");
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    const halo = c.createRadialGradient(
      w * 0.75,
      h * 0.27,
      0,
      w * 0.75,
      h * 0.27,
      h * 0.3,
    );
    halo.addColorStop(0, "#a4d6b80d");
    halo.addColorStop(1, "#a4d6b800");
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h * 0.6);
    for (let i = 0; i < 75; i++) {
      const x = fract(noise(i) - s.scroll * 0.001) * w;
      const y = noise(i + 80) * h * 0.43;
      c.fillStyle = `rgba(182,218,207,${0.15 + noise(i + 50) * 0.35 + Math.sin(clock * 0.5 + i) * 0.04})`;
      c.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
    }
    c.fillStyle = "#d1dfbf";
    c.beginPath();
    c.arc(w * 0.77, h * 0.255, h * 0.025, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#173234";
    c.beginPath();
    c.arc(w * 0.775, h * 0.247, h * 0.023, 0, Math.PI * 2);
    c.fill();
    for (let layer = 0; layer < 3; layer++) {
      const base = h * (0.45 + layer * 0.052);
      c.fillStyle = ["#1a393b", "#163333", "#102b2a"][layer];
      c.beginPath();
      c.moveTo(-100, h);
      for (let j = -1; j <= 23; j++) {
        const offset = s.scroll * (0.006 + layer * 0.006);
        const index = j + Math.floor(offset * 20);
        const x = (j / 20 - fract(offset * 20) / 20) * w;
        c.lineTo(
          x,
          base - noise(index + layer * 70) * h * (0.12 - layer * 0.025),
        );
      }
      c.lineTo(w + 100, h);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = "#8cb5a51c";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, h * 0.49);
    c.lineTo(w, h * 0.49);
    c.stroke();
  }

  private city(s: GameState) {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    const step = 39;
    const shift = s.scroll * w * 0.047;
    for (let i = -1; i < w / step + 2; i++) {
      const id = i + Math.floor(shift / step);
      const x = i * step - (shift % step);
      const bh = 12 + noise(id + 42) * h * 0.095;
      const bw = 17 + noise(id + 87) * 23;
      c.fillStyle = "#0e2526";
      c.fillRect(x, h * 0.514 - bh, bw, bh);
      c.fillStyle = "#95bc9229";
      for (let row = 0; row < bh / 9 - 1; row++) {
        for (let col = 0; col < bw / 8 - 1; col++) {
          if (noise(id * 31 + row * 7 + col) > 0.6)
            c.fillRect(x + 5 + col * 8, h * 0.514 - bh + 7 + row * 9, 2, 2);
        }
      }
    }
  }

  private rails(s: GameState) {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    c.fillStyle = "#112422";
    c.fillRect(0, h * 0.53, w, h);
    for (let lane = 0; lane < 3; lane++) {
      const y = this.laneY(lane);
      c.fillStyle = lane === 1 ? "#172d29" : "#142925";
      c.fillRect(0, y - 13, w, h * 0.11);
      const shift = (s.scroll * w) % 39;
      c.strokeStyle = "#24423a";
      c.lineWidth = 5;
      c.beginPath();
      for (let x = -40; x < w + 40; x += 39) {
        c.moveTo(x - shift - 7, y + 2);
        c.lineTo(x - shift + 8, y + 40);
      }
      c.stroke();
      for (const dy of [TRACK.farRail, TRACK.nearRail]) {
        c.fillStyle = "#081b19";
        c.fillRect(0, y + dy, w, 7);
        c.fillStyle = "#577469";
        c.fillRect(0, y + dy, w, 1);
        c.fillStyle = "#314e42";
        c.fillRect(0, y + dy + 1, w, 2);
      }
      c.fillStyle = "#91afa238";
      c.font = "11px monospace";
      c.fillText(`0${lane + 1}`, 18, y + 23);
      c.strokeStyle = "#63857826";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, y + h * 0.105);
      c.lineTo(w, y + h * 0.105);
      c.stroke();
    }
  }

  private sightline(s: GameState) {
    const c = this.ctx,
      w = this.width,
      h = this.height,
      x = s.train.screenX * w;
    c.fillStyle = "#06100f22";
    c.fillRect(0, h * 0.51, x, h * 0.46);
    c.strokeStyle = `${C.mint}38`;
    c.lineWidth = 1;
    c.setLineDash([4, 7]);
    c.beginPath();
    c.moveTo(x, h * 0.37);
    c.lineTo(x, h * 0.96);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = "#b6f36b40";
    c.beginPath();
    c.moveTo(x + 4, h * 0.38);
    c.lineTo(w - 24, h * 0.38);
    c.stroke();
    c.fillStyle = "#afcfb5";
    c.font = "11px monospace";
    c.fillText(
      `前方视野 ${Math.round((1 - s.train.screenX) * 100)}%`,
      x + 10,
      h * 0.38 - 10,
    );
  }

  private train(
    x: number,
    y: number,
    length: number,
    height: number,
    slow: boolean,
    s?: GameState,
  ) {
    const c = this.ctx;
    const carLength = slow
      ? length
      : Math.max(TRAIN.minCarLength, height * TRAIN.carAspect);
    const carCount = slow ? 1 : Math.max(TRAIN.minCars, Math.ceil(length / carLength));
    c.save();
    c.translate(x, y);
    if (s?.phase === "GAME_OVER") c.rotate(0.035);
    // 玩家列车至少八节且总长超过画布，车头推进至右边缘也不会露出车尾。
    // 只绘制可见车厢及左侧余量，避免长编组增加无效绘制。
    for (let car = carCount - 1; car >= 0; car--) {
      const right = -car * carLength;
      if (x + right < -carLength) continue;
      this.trainCar(right, carLength, height, car === 0, slow, car + 1);
    }

    c.fillStyle = "#f1ffde";
    c.shadowColor = "#d9f6b4";
    c.shadowBlur = 12;
    c.beginPath();
    c.roundRect(-height * 0.43, -height * 0.18, height * 0.23, 2.5, 1.2);
    c.fill();
    c.shadowBlur = 0;
    if (!slow) {
      const beam = c.createLinearGradient(0, 0, 120, 0);
      beam.addColorStop(0, "#d7f9a326");
      beam.addColorStop(1, "#d7f9a300");
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(-5, -7);
      c.lineTo(130, -20);
      c.lineTo(130, 10);
      c.closePath();
      c.fill();
    }
    if (s?.train.isBraking || s?.phase === "GAME_OVER") {
      c.strokeStyle = "#f5c578";
      c.lineWidth = 2;
      for (let i = 0; i < 11; i++) {
        c.beginPath();
        c.moveTo(-25 - i * 13, 8);
        c.lineTo(-45 - i * 15, 12 + noise(i + s.time) * 9);
        c.stroke();
      }
    }
    c.restore();
  }

  /** 每节车厢独立绘制车壳、车门和连接处，车头使用延长的流线轮廓。 */
  private trainCar(
    right: number,
    length: number,
    height: number,
    head: boolean,
    slow: boolean,
    number: number,
  ) {
    const c = this.ctx;
    const left = -length + 4;
    c.save();
    c.translate(right, 0);

    // 风挡连接与屋顶设备先绘制，再由车壳覆盖接缝边缘。
    c.fillStyle = "#20372f";
    c.fillRect(left - 5, -height + 7, 7, height - 10);
    c.strokeStyle = "#60786a";
    c.lineWidth = 1;
    for (let fold = 0; fold < 3; fold++) {
      c.beginPath();
      c.moveTo(left - 4 + fold * 2, -height + 8);
      c.lineTo(left - 4 + fold * 2, -3);
      c.stroke();
    }
    if (!head) {
      c.fillStyle = slow ? "#789084" : "#a9bbb0";
      c.beginPath();
      c.roundRect(left + length * 0.38, -height - 3, length * 0.28, 5, 2);
      c.fill();
    }

    const outline = new Path2D();
    if (head) {
      outline.moveTo(left + 5, -height);
      outline.lineTo(-height * 2.2, -height);
      outline.bezierCurveTo(
        -height * 1.23, -height,
        -height * 0.79, -height * 0.65,
        -height * 0.18, -height * 0.22,
      );
      outline.quadraticCurveTo(0, -height * 0.12, 0, -height * 0.07);
      outline.quadraticCurveTo(0, 2, -height * 0.3, 2);
      outline.lineTo(left + 5, 2);
      outline.quadraticCurveTo(left, 2, left, -3);
      outline.lineTo(left, -height + 5);
      outline.quadraticCurveTo(left, -height, left + 5, -height);
      outline.closePath();
    } else {
      outline.roundRect(left, -height, length - 4, height + 2, 4);
    }
    const body = c.createLinearGradient(0, -height, 0, 3);
    body.addColorStop(0, slow ? "#b2bcb0" : "#f2f7ed");
    body.addColorStop(0.26, slow ? "#8faaa0" : "#e1ebe1");
    body.addColorStop(0.73, slow ? "#718b7f" : "#bfd2c6");
    body.addColorStop(1, slow ? "#475e52" : "#7e9b8b");
    c.fillStyle = body;
    c.shadowColor = "#0008";
    c.shadowBlur = 9;
    c.shadowOffsetY = 6;
    c.fill(outline);
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.strokeStyle = slow ? "#668071" : "#d4e2d3";
    c.lineWidth = 0.8;
    c.stroke(outline);

    c.save();
    c.clip(outline);
    // 细腰线与深色底裙沿整个编组贯通，车厢接缝仍清楚可见。
    c.fillStyle = slow ? "#d5ae6d" : "#317e69";
    c.fillRect(left, -height * 0.21, length, 3);
    c.fillStyle = slow ? "#f0d39c" : "#b0d8ba";
    c.fillRect(left, -height * 0.21 - 1, length, 1);
    c.fillStyle = slow ? "#40594d" : "#587767";
    c.fillRect(left, -2, length, 5);
    c.fillStyle = "#ffffff5c";
    c.fillRect(left + 6, -height + 2, length - 12, 1);

    const doorX = left + height * 0.3;
    const doorWidth = height * 0.43;
    c.strokeStyle = slow ? "#5d7a68" : "#8ca897";
    c.lineWidth = 0.8;
    c.beginPath();
    c.roundRect(doorX, -height + 5, doorWidth, height - 7, 2);
    c.stroke();
    c.fillStyle = "#1c3c3d";
    c.beginPath();
    c.roundRect(doorX + 3, -height * 0.72, doorWidth - 6, height * 0.24, 1.5);
    c.fill();
    c.fillStyle = "#75917e";
    c.fillRect(doorX + doorWidth - 3, -height * 0.37, 1, 4);

    // 深色车窗带内保留独立窗框、玻璃明暗与细小反光。
    const windowStart = doorX + doorWidth + 7;
    const windowEnd = head ? -height * 2.23 : -height * 0.45;
    const glass = c.createLinearGradient(0, -height * 0.76, 0, -height * 0.44);
    glass.addColorStop(0, "#0e2429");
    glass.addColorStop(1, slow ? "#2d4c43" : "#365d60");
    c.fillStyle = slow ? "#58776b" : "#9bb8ab";
    c.fillRect(windowStart - 2, -height * 0.77, windowEnd - windowStart + 4, height * 0.34);
    const windowWidth = height * 0.38;
    const windowStep = height * 0.51;
    for (let wx = windowStart; wx + windowWidth <= windowEnd; wx += windowStep) {
      c.fillStyle = glass;
      c.beginPath();
      c.roundRect(wx, -height * 0.74, windowWidth, height * 0.27, 2);
      c.fill();
      c.fillStyle = "#cae9df42";
      c.fillRect(wx + 2, -height * 0.71, windowWidth - 4, 1);
      c.fillStyle = "#9fc7c21c";
      c.fillRect(wx + 2, -height * 0.66, 2, height * 0.14);
    }

    if (head) {
      c.fillStyle = glass;
      c.beginPath();
      c.moveTo(-height * 2.07, -height * 0.91);
      c.quadraticCurveTo(-height * 1.49, -height * 0.89, -height * 1.02, -height * 0.59);
      c.lineTo(-height * 0.68, -height * 0.37);
      c.quadraticCurveTo(-height * 1.19, -height * 0.39, -height * 1.52, -height * 0.51);
      c.closePath();
      c.fill();
      c.strokeStyle = "#bad8cf8c";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-height * 1.92, -height * 0.85);
      c.quadraticCurveTo(-height * 1.45, -height * 0.82, -height * 1.08, -height * 0.59);
      c.stroke();
      c.strokeStyle = "#7f9c8a";
      c.beginPath();
      c.moveTo(-height * 1.12, -height * 0.28);
      c.quadraticCurveTo(-height * 0.57, -height * 0.16, -height * 0.12, -height * 0.1);
      c.stroke();
      if (!slow) {
        c.fillStyle = "#416a57";
        c.font = `italic bold ${Math.max(8, height * 0.21)}px sans-serif`;
        c.fillText("CR · 领先号", -height * 3.36, -height * 0.29);
      }
    } else {
      c.fillStyle = "#668372";
      c.font = "8px monospace";
      c.fillText(String(number).padStart(2, "0"), left + height * 0.35, -height * 0.05);
    }
    c.restore();

    // 两组转向架支撑每节车厢，车轮底部继续使用下侧钢轨的接触基准。
    for (const bx of [left + height * 0.83, head ? -height * 1.18 : -height * 0.72]) {
      c.fillStyle = "#152b24";
      c.beginPath();
      c.roundRect(bx - 15, 0, 30, 5, 2);
      c.fill();
      for (const axle of [-9, 9]) {
        const wheelY = WHEEL.top + WHEEL.height / 2;
        c.fillStyle = "#081711";
        c.beginPath();
        c.arc(bx + axle, wheelY, WHEEL.height / 2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#6a8470";
        c.beginPath();
        c.arc(bx + axle, wheelY, 0.9, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  private signal(wave: Wave, lane: number, clock: number) {
    const c = this.ctx,
      w = this.width;
    // 整根灯柱收在自己的轨道间距内，顶部与上一条轨道留出空隙。
    const scale = Math.min(1, (this.height * TRACK.laneGap - 8) / 86);
    const halfWidth = 24 * scale;
    // 信号固定在对应障碍前方，与场景同速移动，不受车头位置或视口边缘牵引。
    const x = (wave.x - RULES.signalLead * 0.34) * w;
    // 完整移出画面后才停止绘制，经过车头或已通过障碍都不改变实体位置。
    if (x + halfWidth < 0 || x - halfWidth > w) return;
    const blocked = wave.blocked.includes(lane);
    // 三个灯位固定为上红、中黄、下绿，同一时刻只点亮当前状态。
    const active = blocked
      ? wave.kind === "debris" || wave.kind === "train"
        ? 1
        : 0
      : 2;
    const colors = [C.red, C.amber, C.mint];
    const unlit = ["#452824", "#423922", "#283e2b"];
    c.save();
    c.translate(x, this.lowerRailY(lane));
    c.scale(scale, scale);

    // 底座直接压在所属轨道的下侧钢轨上，短色线加强落点的对应关系。
    c.strokeStyle = `${colors[active]}99`;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-24, 0);
    c.lineTo(24, 0);
    c.stroke();
    const metal = c.createLinearGradient(-3, 0, 3, 0);
    metal.addColorStop(0, "#344b41");
    metal.addColorStop(0.5, "#8a9b80");
    metal.addColorStop(1, "#3c5548");
    c.fillStyle = metal;
    c.fillRect(-3, -25, 6, 23);
    c.fillStyle = "#667c65";
    c.fillRect(-11, -3, 22, 3);

    // 背板、金属灯壳与独立遮光檐保留实体铁路信号灯的轮廓。
    c.fillStyle = "#071310";
    c.strokeStyle = "#415d4e";
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(-18, -85, 36, 66, 10);
    c.fill();
    c.stroke();
    const housing = c.createLinearGradient(-15, 0, 15, 0);
    housing.addColorStop(0, "#34453a");
    housing.addColorStop(0.35, "#17291f");
    housing.addColorStop(1, "#253c2e");
    c.fillStyle = housing;
    c.strokeStyle = "#71846b";
    c.beginPath();
    c.roundRect(-14, -81, 28, 58, 7);
    c.fill();
    c.stroke();
    for (let light = 0; light < 3; light++) {
      const y = -70 + light * 18;
      const lit = light === active;
      c.fillStyle = "#060e0a";
      c.beginPath();
      c.arc(0, y, 9, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = lit ? colors[light] : unlit[light];
      c.shadowColor = colors[light];
      c.shadowBlur = lit ? 10 + Math.sin(clock * 4) * 1.5 : 0;
      c.beginPath();
      c.arc(0, y, 6.2, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      if (lit) {
        c.fillStyle = "#f6ffdcbb";
        c.beginPath();
        c.ellipse(-1.5, y - 2, 2.5, 1.6, -0.35, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = "#809078";
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, y - 1, 8.5, Math.PI * 1.08, Math.PI * 1.92);
      c.stroke();
    }

    // 铭牌在矮画布中单独放大一些，避免随灯柱一起缩成难辨的文字。
    c.translate(0, -5);
    const plaqueScale = Math.min(1 / scale, 1.45);
    c.scale(plaqueScale, plaqueScale);
    c.fillStyle = "#b8c8a5";
    c.fillRect(-16, -12, 32, 12);
    c.fillStyle = "#20382a";
    c.font = "bold 10px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(LANE_NAMES[lane], 0, -5.5);
    c.restore();
  }

  private obstacle(wave: Wave, lane: number) {
    const c = this.ctx,
      x = wave.x * this.width;
    if (wave.kind === "train") {
      this.train(x + 145, this.trainY(lane), 145, 34, true);
      return;
    }
    // 各实体以实际底部落在同一根钢轨上，施工栏底部为 13，落石为 8。
    const y = this.lowerRailY(lane) - (wave.kind === "debris" ? 8 : 13);
    c.save();
    c.translate(x, y);
    c.fillStyle = "#020d0b66";
    c.beginPath();
    c.ellipse(8, 14, 35, 12, 0, 0, Math.PI * 2);
    c.fill();
    if (wave.kind === "debris") {
      c.fillStyle = "#6f8272";
      c.strokeStyle = "#acb793";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-18, 6);
      c.lineTo(-11, -17);
      c.lineTo(4, -26);
      c.lineTo(20, -12);
      c.lineTo(29, 8);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#465e50";
      c.beginPath();
      c.moveTo(4, -26);
      c.lineTo(2, -4);
      c.lineTo(29, 8);
      c.closePath();
      c.fill();
      c.fillStyle = C.amber;
      c.fillRect(-20, -4, 4, 3);
    } else {
      c.fillStyle = "#8f9d82";
      c.fillRect(-20, -30, 4, 43);
      c.fillRect(21, -30, 4, 43);
      c.fillStyle = "#f0bb67";
      c.fillRect(-25, -29, 55, 17);
      c.save();
      c.beginPath();
      c.rect(-25, -29, 55, 17);
      c.clip();
      c.strokeStyle = "#483f28";
      c.lineWidth = 8;
      for (let i = -35; i < 45; i += 20) {
        c.beginPath();
        c.moveTo(i, -30);
        c.lineTo(i + 17, -11);
        c.stroke();
      }
      c.restore();
      c.fillStyle = C.red;
      c.shadowColor = C.red;
      c.shadowBlur = 12;
      c.beginPath();
      c.arc(-18, -35, 3, 0, 7);
      c.arc(23, -35, 3, 0, 7);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = "#db7354";
      c.beginPath();
      c.moveTo(35, 10);
      c.lineTo(41, -9);
      c.lineTo(49, 10);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  private foreground(s: GameState) {
    const c = this.ctx,
      w = this.width,
      h = this.height;
    const gap = Math.max(w * 0.5, 430),
      shift = (s.scroll * w * 1.15) % gap;
    c.strokeStyle = "#537f6920";
    c.lineWidth = 1;
    for (let i = -1; i < w / gap + 2; i++) {
      const x = i * gap - shift;
      c.beginPath();
      c.moveTo(x, h * 0.405);
      c.quadraticCurveTo(x + gap * 0.5, h * 0.48, x + gap, h * 0.405);
      c.stroke();
      c.fillStyle = "#091d1a";
      c.fillRect(x, h * 0.41, 5, h * 0.55);
      c.fillStyle = "#4f726235";
      c.fillRect(x + 3, h * 0.41, 1, h * 0.55);
      c.fillStyle = "#17362b";
      c.fillRect(x - 27, h * 0.405, 35, 3);
    }
    c.fillStyle = "#071a16";
    c.fillRect(0, h * 0.97, w, h * 0.03);
    c.fillStyle = "#2c5140";
    c.fillRect(0, h * 0.97, w, 1);
  }

  private speedLines(s: GameState, clock: number) {
    if (
      s.phase === "PAUSED" ||
      s.phase === "GAME_OVER" ||
      s.phase === "VICTORY"
    )
      return;
    const c = this.ctx,
      w = this.width,
      h = this.height;
    const count = s.phase === "READY" ? 7 : 8 + s.stage * 4;
    c.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const x =
        fract(noise(i + 17) - clock * (0.2 + s.stage * 0.055)) * (w + 150) - 75;
      const y = noise(i + 220) * h * 0.58 + h * 0.37;
      c.strokeStyle = `rgba(162,207,164,${0.025 + noise(i) * 0.065 + s.burst * 0.08})`;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 15 + s.stage * 10 + noise(i) * 65, y);
      c.stroke();
    }
  }
}
