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
          Math.max(w * 0.265, 240),
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
      if (!wave.passed) {
        for (let lane = 0; lane < 3; lane++) this.signal(wave, lane, s, clock);
      }
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
    c.save();
    c.translate(x, y);
    if (s?.phase === "GAME_OVER") c.rotate(0.035);
    const body = c.createLinearGradient(0, -height, 0, 0);
    body.addColorStop(0, slow ? "#a3afa0" : "#edf5df");
    body.addColorStop(0.45, slow ? "#718b7f" : "#b8d1bf");
    body.addColorStop(1, slow ? "#445b50" : "#6e9682");
    c.shadowColor = "#000a";
    c.shadowBlur = 15;
    c.shadowOffsetY = 10;
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(-length, -height);
    c.lineTo(-height * 1.9, -height);
    c.bezierCurveTo(
      -height * 0.85,
      -height,
      -height * 0.28,
      -height * 0.45,
      0,
      -height * 0.13,
    );
    c.quadraticCurveTo(height * 0.12, 4, -height * 0.45, 4);
    c.lineTo(-length, 4);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.fillStyle = "#153c39";
    c.beginPath();
    c.moveTo(-height * 1.76, -height * 0.89);
    c.quadraticCurveTo(
      -height * 0.98,
      -height * 0.81,
      -height * 0.53,
      -height * 0.38,
    );
    c.lineTo(-height * 1.27, -height * 0.43);
    c.closePath();
    c.fill();
    c.fillStyle = "#1a3b35";
    for (let dx = height * 2.05; dx < length - 6; dx += 22)
      c.fillRect(-dx, -height * 0.71, 14, height * 0.26);
    c.fillStyle = slow ? "#e4b579" : "#3c9e7a";
    c.fillRect(-length, -height * 0.18, length - height * 0.38, 3);
    c.strokeStyle = "#4d6e5d";
    c.lineWidth = 1;
    for (let dx = 135; dx < length; dx += 145) {
      c.beginPath();
      c.moveTo(-dx, -height + 3);
      c.lineTo(-dx, 2);
      c.stroke();
    }
    c.fillStyle = "#0c201c";
    for (let dx = 33; dx < length; dx += 53)
      c.fillRect(-dx, WHEEL.top, 20, WHEEL.height);
    c.fillStyle = "#edfbdc";
    c.shadowColor = "#d9f6b4";
    c.shadowBlur = 13;
    c.fillRect(-height * 0.35, -height * 0.21, height * 0.22, 2);
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
      c.fillStyle = "#edf8e1";
      c.font = "italic bold 9px sans-serif";
      c.fillText("CR · 领先号", -Math.min(length - 12, 144), -height * 0.28);
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

  private signal(wave: Wave, lane: number, s: GameState, clock: number) {
    const c = this.ctx,
      w = this.width;
    const compact = w < 600;
    const width = compact ? 96 : 126;
    const upperRail = this.laneY(lane) + TRACK.farRail;
    const lowerRail = this.lowerRailY(lane);
    const y = (upperRail + lowerRail) / 2;
    // 灯牌位于所属轨道的两根钢轨之间，并始终留在车头前方的可视区域。
    // 窄屏缩短文字、保留轨道名，避免信号越界或压住车头。
    const x = Math.min(
      w - width / 2 - 10,
      Math.max(
        s.train.screenX * w + width / 2 + 10,
        (wave.x - RULES.signalLead * 0.34) * w,
      ),
    );
    if (wave.x < s.train.screenX - 0.04) return;
    const blocked = wave.blocked.includes(lane);
    const color = blocked
      ? wave.kind === "debris" || wave.kind === "train"
        ? C.amber
        : C.red
      : C.mint;
    const status = blocked
      ? wave.kind === "train"
        ? "慢车"
        : wave.kind === "debris"
          ? "异物"
          : "封闭"
      : "畅通";
    const left = x - width / 2;
    c.save();
    // 彩色钢轨短线与灯牌直接相接，明确指出受控的是当前这一条轨道。
    c.strokeStyle = `${color}a6`;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(left - 12, lowerRail);
    c.lineTo(left + width + 12, lowerRail);
    c.stroke();
    c.fillStyle = "#081814f5";
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(left, upperRail, width, lowerRail - upperRail, 5);
    c.fill();
    c.stroke();
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 8 + Math.sin(clock * 4) * 2;
    c.beginPath();
    c.arc(left + 12, y, 4, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = color;
    c.font = `${compact ? 11 : 12}px sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(
      compact
        ? `${LANE_NAMES[lane]}·${status}`
        : `0${lane + 1} ${LANE_NAMES[lane]} · ${status}`,
      left + 24,
      y,
    );
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
