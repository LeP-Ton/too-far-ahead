import { clamp, RULES, smooth, STAGES } from "./config";

export type Phase =
  "READY" | "PLAYING" | "LEADING_WARNING" | "PAUSED" | "GAME_OVER" | "VICTORY";
export type ObstacleKind = "construction" | "train" | "debris" | "switch";
export type SoundEvent =
  | "start"
  | "change"
  | "brake"
  | "warning"
  | "leading"
  | "pass"
  | "crash"
  | "victory";
export interface Wave {
  id: number;
  x: number;
  blocked: number[];
  safeLane: number;
  kind: ObstacleKind;
  passed: boolean;
  decisionTime: number;
  laneAtSpawn: number;
  pendingCloseCall?: boolean;
}
export interface TrainState {
  speed: number;
  targetSpeed: number;
  lane: number;
  targetLane: number;
  fromLane: number;
  laneY: number;
  laneProgress: number;
  laneDuration: number;
  screenX: number;
  targetScreenX: number;
  fromScreenX: number;
  xProgress: number;
  brakeCooldown: number;
  brakeRemaining: number;
  isBraking: boolean;
}
export interface GameState {
  phase: Phase;
  resumePhase: Phase;
  stage: number;
  time: number;
  distance: number;
  leadingAt: number;
  peakTime: number;
  changes: number;
  closeCalls: number;
  passed: number;
  train: TrainState;
  waves: Wave[];
  spawnAt: number;
  scroll: number;
  impact: number;
  burst: number;
  message: string;
}

/** 使用可注入随机源，便于用同一套真实规则重复验证整局游戏。 */
export class GameEngine {
  state!: GameState;
  private sequence = 0;
  private warningTick = -1;
  private sounds: SoundEvent[] = [];

  constructor(private random: () => number = Math.random) {
    this.reset();
  }

  reset() {
    this.sequence = 0;
    this.warningTick = -1;
    this.sounds = [];
    this.state = {
      phase: "READY",
      resumePhase: "PLAYING",
      stage: 0,
      time: 0,
      distance: 0,
      leadingAt: this.nextInterval(),
      peakTime: 0,
      changes: 0,
      closeCalls: 0,
      passed: 0,
      waves: [],
      spawnAt: RULES.firstWave,
      scroll: 0,
      impact: 0,
      burst: 0,
      message: "",
      train: {
        speed: 250,
        targetSpeed: 250,
        lane: 1,
        targetLane: 1,
        fromLane: 1,
        laneY: 1,
        laneProgress: 1,
        laneDuration: STAGES[0].laneDuration,
        screenX: 0.1,
        targetScreenX: 0.1,
        fromScreenX: 0.1,
        xProgress: 1,
        brakeCooldown: 0,
        brakeRemaining: 0,
        isBraking: false,
      },
    };
  }

  start() {
    this.reset();
    this.state.phase = "PLAYING";
    this.sounds.push("start");
  }
  get active() {
    return (
      this.state.phase === "PLAYING" || this.state.phase === "LEADING_WARNING"
    );
  }
  get config() {
    return STAGES[this.state.stage];
  }
  get velocity() {
    return (1 - this.config.screenX) / this.config.reaction;
  }
  drainSounds() {
    return this.sounds.splice(0);
  }

  pause() {
    if (this.active) {
      this.state.resumePhase = this.state.phase;
      this.state.phase = "PAUSED";
    }
  }
  resume() {
    if (this.state.phase === "PAUSED")
      this.state.phase = this.state.resumePhase;
  }
  togglePause() {
    if (this.state.phase === "PAUSED") this.resume();
    else this.pause();
  }

  changeLane(direction: -1 | 1) {
    const t = this.state.train;
    // 变道途中锁定方向，不允许按键连发取消，也不缓存反向操作。
    if (!this.active || t.laneProgress < 1) return false;
    const target = clamp(t.lane + direction, 0, 2);
    if (target === t.lane) return false;
    const imminent = this.state.waves.find(
      (w) => !w.passed && w.blocked.includes(t.lane),
    );
    if (imminent) {
      const eta = (imminent.x - t.screenX) / this.velocity;
      if (
        eta < this.config.laneDuration + 0.4 &&
        eta > this.config.laneDuration
      )
        imminent.pendingCloseCall = true;
    }
    t.fromLane = t.lane;
    t.targetLane = target;
    t.laneProgress = 0;
    t.laneDuration = this.config.laneDuration;
    this.sounds.push("change");
    return true;
  }

  brake() {
    const t = this.state.train;
    if (!this.active || t.brakeCooldown > 0) return false;
    t.brakeRemaining = RULES.brakeDuration;
    t.brakeCooldown = RULES.brakeCooldown;
    t.isBraking = true;
    this.sounds.push("brake");
    return true;
  }

  /** 每帧细分到最多 1/120 秒，避免低帧率下穿透障碍或跳过阶段。 */
  update(delta: number) {
    let remaining = Math.max(0, Math.min(delta, 0.25));
    while (remaining > 0.000001) {
      const dt = Math.min(remaining, 1 / 120);
      this.step(dt);
      remaining -= dt;
    }
  }

  private step(dt: number) {
    const s = this.state;
    if (s.phase === "READY") {
      s.scroll += dt * 0.036;
      return;
    }
    if (s.phase === "GAME_OVER") {
      // 碰撞后的世界短暂慢速滑行，玩法时钟和输入保持冻结。
      s.impact = Math.max(0, s.impact - dt * 0.9);
      s.scroll += dt * this.velocity * s.impact * 0.07;
      return;
    }
    if (!this.active) return;
    const t = s.train;
    s.time += dt;
    s.burst = Math.max(0, s.burst - dt);
    t.brakeCooldown = Math.max(0, t.brakeCooldown - dt);
    t.brakeRemaining = Math.max(0, t.brakeRemaining - dt);
    t.isBraking = t.brakeRemaining > 0;
    t.speed = t.targetSpeed * (t.isBraking ? RULES.brakeFactor : 1);
    const movement = this.velocity * (t.isBraking ? RULES.brakeFactor : 1) * dt;
    s.scroll += movement;
    s.distance += (t.speed / 3600) * dt;

    if (t.laneProgress < 1) {
      t.laneProgress = Math.min(1, t.laneProgress + dt / t.laneDuration);
      t.laneY =
        t.fromLane + (t.targetLane - t.fromLane) * smooth(t.laneProgress);
      if (t.laneProgress === 1) {
        t.lane = t.targetLane;
        s.changes++;
      }
    }
    t.xProgress = Math.min(1, t.xProgress + dt / RULES.leadingMove);
    t.screenX =
      t.fromScreenX + (t.targetScreenX - t.fromScreenX) * smooth(t.xProgress);

    if (s.stage < STAGES.length - 1) {
      const until = s.leadingAt - s.time;
      if (until <= RULES.warning) {
        s.phase = "LEADING_WARNING";
        const tick = Math.max(1, Math.ceil(until / (RULES.warning / 3)));
        if (tick !== this.warningTick) {
          this.warningTick = tick;
          this.sounds.push("warning");
        }
      }
      if (until <= 0) this.advanceStage();
    } else {
      s.peakTime += dt;
      if (s.peakTime >= RULES.victoryDuration) {
        s.peakTime = RULES.victoryDuration;
        s.phase = "VICTORY";
        this.sounds.push("victory");
        return;
      }
    }

    for (const wave of s.waves) {
      const previousX = wave.x;
      wave.x -= movement;
      // 检查扫过的车头区间；过障期间同时覆盖换轨路径中的两条轨道。
      if (
        !wave.passed &&
        wave.x <= t.screenX + 0.009 &&
        previousX >= t.screenX - RULES.collisionTail
      ) {
        const occupied =
          t.laneProgress < 1 ? [t.fromLane, t.targetLane] : [t.lane];
        if (wave.blocked.some((lane) => occupied.includes(lane))) {
          s.phase = "GAME_OVER";
          s.impact = 1;
          s.message =
            wave.kind === "train"
              ? "未能及时避让前方慢车"
              : wave.kind === "switch"
                ? "驶入了关闭的道岔"
                : wave.kind === "debris"
                  ? "撞上了轨道异物"
                  : "驶入了封闭施工区";
          this.sounds.push("crash");
          return;
        }
      }
      if (!wave.passed && wave.x < t.screenX - RULES.collisionTail) {
        wave.passed = true;
        s.passed++;
        this.sounds.push("pass");
        // 只有真正安全通过，才把最后时刻的避让计为极限反应。
        if (wave.pendingCloseCall) s.closeCalls++;
        s.spawnAt = s.time + RULES.waveGap + this.random() * 0.8;
      }
    }
    s.waves = s.waves.filter((w) => w.x > -0.3);
    // 不叠加未通过波次；提速前先清空决策窗口，避免车头推进造成突然撞击。
    const hasWave = s.waves.some((w) => !w.passed);
    const clearTime =
      this.config.reaction + RULES.signalLead + RULES.brakeDuration + 1;
    if (
      !hasWave &&
      s.time >= s.spawnAt &&
      s.burst === 0 &&
      (s.stage === 5 || s.leadingAt - s.time > clearTime + RULES.warning)
    )
      this.spawnWave();
  }

  private advanceStage() {
    const s = this.state;
    // 连续制动或极低帧率下，待当前波次通过才推进镜头，警告仍然有效。
    if (s.waves.some((w) => !w.passed)) {
      s.leadingAt = s.time + 0.1;
      return;
    }
    s.stage++;
    s.phase = "PLAYING";
    const config = this.config;
    Object.assign(s.train, {
      targetSpeed: config.speed,
      fromScreenX: s.train.screenX,
      targetScreenX: config.screenX,
      xProgress: 0,
    });
    s.burst = 1.4;
    s.leadingAt = s.time + this.nextInterval();
    s.spawnAt = s.time + 1.8;
    this.warningTick = -1;
    this.sounds.push("leading");
  }

  private nextInterval() {
    return (
      RULES.leadingMin + this.random() * (RULES.leadingMax - RULES.leadingMin)
    );
  }

  private spawnWave() {
    const s = this.state;
    const origin = s.train.targetLane;
    const types: ObstacleKind[] = ["construction", "train", "debris", "switch"];
    const kind = types[this.sequence % types.length];
    // 安全出口只选当前或相邻轨道；双封闭道岔也不会强迫跨两轨。
    const options = [0, 1, 2].filter(
      (lane) => lane !== origin && Math.abs(lane - origin) === 1,
    );
    const safeLane = options[Math.floor(this.random() * options.length)];
    const blocked =
      kind === "switch"
        ? [0, 1, 2].filter((lane) => lane !== safeLane)
        : [origin];
    const unfinished = (1 - s.train.laneProgress) * s.train.laneDuration;
    const needed =
      unfinished +
      Math.abs(safeLane - origin) * this.config.laneDuration +
      RULES.minDecision;
    const decisionTime = Math.max(
      this.config.reaction + RULES.signalLead,
      needed,
    );
    s.waves.push({
      id: ++this.sequence,
      x: s.train.screenX + this.velocity * decisionTime,
      blocked,
      safeLane,
      kind,
      passed: false,
      decisionTime,
      laneAtSpawn: origin,
    });
  }
}
