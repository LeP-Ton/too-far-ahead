import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "./game/engine";
import { GameAudio } from "./game/audio";
import { WorldRenderer } from "./game/renderer";
import { LANE_NAMES, RULES, STAGES } from "./game/config";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "ahead"
    | "sound"
    | "muted"
    | "pause"
    | "play"
    | "restart"
    | "arrow"
    | "up"
    | "down"
    | "brake"
    | "close"
    | "expand";
  size?: number;
}) {
  const paths: Record<typeof name, React.ReactNode> = {
    ahead: (
      <>
        <path d="m3 4 8 8-8 8m10-16 8 8-8 8" />
      </>
    ),
    sound: (
      <>
        <path d="M11 4 5 9H2v6h3l6 5V4Z" />
        <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    muted: (
      <>
        <path d="M11 4 5 9H2v6h3l6 5V4Z" />
        <path d="m16 9 6 6m0-6-6 6" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8V4Z" />,
    restart: (
      <>
        <path d="M3 10a9 9 0 1 1 1 7M3 3v7h7" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    up: <path d="m5 15 7-7 7 7" />,
    down: <path d="m5 9 7 7 7-7" />,
    brake: (
      <>
        <path d="M6 3H3v18h3m12-18h3v18h-3" />
        <circle cx="12" cy="12" r="5" />
        <path d="M12 9v4m0 2h.01" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const hazardNames = {
  construction: "前方施工封闭",
  train: "前方慢车占道",
  debris: "前方轨道异物",
  switch: "道岔即将分流",
};

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const engine = useRef(new GameEngine());
  const audio = useRef<GameAudio | null>(null);
  const closeHelp = useRef<HTMLButtonElement>(null);
  const [, refresh] = useState(0);
  const [muted, setMuted] = useState(false);
  const [help, setHelp] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const helpRef = useRef(false);
  const pausedForHelp = useRef(false);
  const s = engine.current.state;
  const t = s.train;
  const active = engine.current.active;
  const finished = s.phase === "GAME_OVER" || s.phase === "VICTORY";
  const upcoming = s.waves.find((w) => !w.passed);

  const start = useCallback(() => {
    audio.current?.unlock();
    engine.current.start();
    setHelp(false);
    helpRef.current = false;
    refresh((v) => v + 1);
    world.current?.focus({ preventScroll: true });
  }, []);

  const toggleHelp = useCallback((open: boolean) => {
    if (open) {
      pausedForHelp.current = engine.current.active;
      engine.current.pause();
    } else if (pausedForHelp.current) {
      engine.current.resume();
      pausedForHelp.current = false;
    }
    helpRef.current = open;
    setHelp(open);
    refresh((v) => v + 1);
    if (!open) world.current?.focus({ preventScroll: true });
  }, []);

  const toggleSound = () => {
    audio.current?.unlock();
    audio.current?.setMuted(!muted);
    setMuted(!muted);
  };

  useEffect(() => {
    const surface = canvas.current!,
      host = world.current!;
    const renderer = new WorldRenderer(surface);
    const gameAudio = new GameAudio();
    audio.current = gameAudio;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      renderer.resize(width, height);
    });
    observer.observe(host);
    const rect = host.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      previous = performance.now(),
      uiAt = 0,
      visualClock = 0;
    const run = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      engine.current.update(delta);
      const state = engine.current.state;
      if (state.phase !== "PAUSED" && state.phase !== "VICTORY")
        visualClock += delta;
      renderer.render(state, visualClock, motion.matches);
      for (const event of engine.current.drainSounds()) gameAudio.play(event);
      gameAudio.drive(state.train.speed, engine.current.active);
      if (now - uiAt > 50) {
        refresh((v) => v + 1);
        uiAt = now;
      }
      frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    const onKey = (event: KeyboardEvent) => {
      if (helpRef.current) {
        if (event.key === "Escape") toggleHelp(false);
        return;
      }
      const key = event.key.toLowerCase();
      // 保留按钮自身的 Enter / Space 行为，避免一次按键触发两次操作。
      if (
        event.target instanceof HTMLButtonElement &&
        (key === " " || key === "enter")
      )
        return;
      if (
        [
          "w",
          "s",
          "arrowup",
          "arrowdown",
          " ",
          "escape",
          "p",
          "enter",
        ].includes(key)
      )
        event.preventDefault();
      if (event.repeat) return;
      if (key === "w" || key === "arrowup") engine.current.changeLane(-1);
      if (key === "s" || key === "arrowdown") engine.current.changeLane(1);
      if (key === " ") {
        gameAudio.unlock();
        engine.current.brake();
      }
      if (key === "escape" || key === "p") engine.current.togglePause();
      if (key === "enter") {
        if (
          ["READY", "GAME_OVER", "VICTORY"].includes(engine.current.state.phase)
        )
          start();
        else if (engine.current.state.phase === "PAUSED")
          engine.current.resume();
      }
      refresh((v) => v + 1);
    };
    const blur = () => {
      engine.current.pause();
      refresh((v) => v + 1);
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    const onFullScreen = () => setFullScreen(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", onFullScreen);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gameAudio.dispose();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", onFullScreen);
    };
  }, [start, toggleHelp]);

  useEffect(() => {
    if (help) closeHelp.current?.focus();
  }, [help]);

  const fullScreenToggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() => undefined);
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="ahead" size={25} />
          </span>
          <span className="brand-name">
            遥遥领先<span>TOO FAR AHEAD</span>
          </span>
        </div>
        <div className="header-center">
          <span className="live-dot" /> 高速反应 · 生存挑战
        </div>
        <nav className="header-actions" aria-label="游戏选项">
          <button className="text-button" onClick={() => toggleHelp(true)}>
            <span className="help-symbol">?</span>
            <span>操作指南</span>
          </button>
          <span className="divider" />
          <button
            className="icon-button"
            title={muted ? "开启音效" : "关闭音效"}
            aria-label={muted ? "开启音效" : "关闭音效"}
            aria-pressed={!muted}
            onClick={toggleSound}
          >
            <Icon name={muted ? "muted" : "sound"} size={18} />
          </button>
          <button
            className="icon-button fullscreen-button"
            title={fullScreen ? "退出全屏" : "全屏"}
            aria-label={fullScreen ? "退出全屏" : "全屏"}
            onClick={fullScreenToggle}
          >
            <Icon name="expand" size={18} />
          </button>
        </nav>
      </header>

      <main className="game-frame">
        <div
          className="world"
          ref={world}
          tabIndex={-1}
          aria-label="高铁游戏区域：W 或上箭头上移，S 或下箭头下移，空格制动，P 暂停"
        >
          <canvas ref={canvas} aria-label="三轨高铁行驶场景" />
          <div className="hud">
            <div className={`speed-block ${t.isBraking ? "braking" : ""}`}>
              <div className="eyebrow">
                <span className="tiny-square" />
                {t.isBraking ? "紧急制动中" : "当前速度"}
              </div>
              <div className="speed-value">
                {Math.round(t.speed)}
                <span>km/h</span>
              </div>
              <div className="speed-meter">
                {Array.from({ length: 24 }, (_, i) => (
                  <i key={i} className={i < 8 + s.stage * 3 ? "lit" : ""} />
                ))}
              </div>
              <span className="base-speed">基础速度 {t.targetSpeed} km/h</span>
            </div>
            <div className="journey-hud">
              <div className="journey-title">
                {s.stage === 5 ? "遥遥领先状态" : "下一次领先"}
                <span>
                  {s.stage === 5
                    ? `${Math.ceil(RULES.victoryDuration - s.peakTime)}s`
                    : s.phase === "READY"
                      ? "待发车"
                      : `${Math.max(0, Math.ceil(s.leadingAt - s.time))}s`}
                </span>
              </div>
              <div className="stage-track">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage.speed}
                    className={`stage-point ${i <= s.stage ? "reached" : ""} ${i === s.stage ? "current" : ""}`}
                  >
                    <i />
                    <span>{stage.speed}</span>
                  </div>
                ))}
              </div>
              <div className="journey-caption">
                {s.stage === 5
                  ? "保持领先 · 再坚持 60 秒"
                  : "每一次领先，都更接近极限"}
              </div>
            </div>
            <div className="brake-hud">
              <div className="eyebrow">
                紧急制动 <Icon name="brake" size={14} />
              </div>
              <button
                className={`brake-status ${t.brakeCooldown === 0 ? "ready" : ""}`}
                disabled={!active || t.brakeCooldown > 0}
                onClick={() => {
                  audio.current?.unlock();
                  engine.current.brake();
                  world.current?.focus({ preventScroll: true });
                }}
              >
                <span>
                  {t.isBraking
                    ? "制动中"
                    : t.brakeCooldown > 0
                      ? `${t.brakeCooldown.toFixed(1)}s`
                      : "已就绪"}
                </span>
                <kbd>SPACE</kbd>
              </button>
              <div className="cooldown-track">
                <i
                  style={{
                    width: `${(1 - t.brakeCooldown / RULES.brakeCooldown) * 100}%`,
                  }}
                />
              </div>
              <span className="brake-hint">0.8s 制动 / 3s 冷却</span>
            </div>
          </div>

          {s.phase === "READY" && (
            <div className="start-screen">
              <section className="start-content">
                <div className="route-label">
                  <span /> G001 · 夜行高架线
                </div>
                <h1>
                  遥遥<span>领先</span>
                  <i>。</i>
                </h1>
                <p className="english-title">TOO FAR AHEAD</p>
                <p className="tagline">越领先，越危险。</p>
                <p className="intro">
                  速度不断攀升，前方视野不断缩小。
                  <br />
                  读懂信号，在来不及之前，做出选择。
                </p>
                <button className="primary-button start-button" onClick={start}>
                  <Icon name="play" size={17} />
                  开始驾驶
                  <Icon name="arrow" size={20} />
                </button>
                <span className="enter-hint">
                  或按 <kbd>ENTER</kbd> 发车
                </span>
              </section>
              <aside className="mission-card">
                <span className="mission-index">本次任务 / 01</span>
                <div className="mission-speed">
                  350<span>km/h</span>
                </div>
                <p>
                  到达极速，再生存 <strong>60 秒</strong>
                </p>
                <div className="mission-rule" />
                <div className="mission-note">
                  <Icon name="ahead" size={16} />
                  <span>
                    系统会自动提速
                    <br />
                    领先无法撤回
                  </span>
                </div>
              </aside>
              <div className="scene-coordinate">
                <span>31° 13′ N &nbsp; 121° 28′ E</span>
                <span>城市边界 · 夜间运行</span>
              </div>
            </div>
          )}

          {active && (
            <>
              <div className={`signal-ribbon ${upcoming ? "has-signal" : ""}`}>
                <span className={`signal-dot ${upcoming ? "amber" : ""}`} />
                {upcoming ? (
                  <>
                    <span>{hazardNames[upcoming.kind]}</span>
                    <span className="signal-separator">/</span>
                    <strong>驶入{LANE_NAMES[upcoming.safeLane]}</strong>
                    <Icon
                      name={
                        upcoming.safeLane < t.targetLane
                          ? "up"
                          : upcoming.safeLane > t.targetLane
                            ? "down"
                            : "arrow"
                      }
                      size={17}
                    />
                  </>
                ) : (
                  <>
                    <span>前方信号正常</span>
                    <span className="signal-separator">/</span>
                    <strong>保持观察</strong>
                  </>
                )}
              </div>
              <div className="run-stats">
                <span>
                  生存时间 <strong>{formatTime(s.time)}</strong>
                </span>
                <span>
                  安全通过 <strong>{String(s.passed).padStart(2, "0")}</strong>
                </span>
                <button
                  className="icon-button"
                  aria-label="暂停游戏"
                  title="暂停游戏（P）"
                  onClick={() => engine.current.pause()}
                >
                  <Icon name="pause" size={17} />
                </button>
              </div>
              {t.laneProgress < 1 && (
                <div className="changing-label">正在变轨 · 方向已锁定</div>
              )}
            </>
          )}

          {s.phase === "LEADING_WARNING" && (
            <div className="leading-alert" role="status">
              <span>即将遥遥领先</span>
              <strong>
                {Math.max(
                  1,
                  Math.ceil((s.leadingAt - s.time) / (RULES.warning / 3)),
                )}
              </strong>
              <small>速度 +20 · 视野收缩</small>
            </div>
          )}
          {active && s.burst > 0 && (
            <div className="leading-burst" role="status">
              <Icon name="ahead" size={30} />
              <strong>遥遥领先！</strong>
              <span>{t.targetSpeed} km/h</span>
            </div>
          )}

          {s.phase === "PAUSED" && !help && (
            <div className="screen-overlay">
              <section className="result-card pause-card">
                <span className="card-kicker">行程已暂停</span>
                <h2>喘口气，再领先。</h2>
                <p>切回页面不会自动发车，准备好后继续。</p>
                <button
                  className="primary-button"
                  onClick={() => {
                    audio.current?.unlock();
                    engine.current.resume();
                    world.current?.focus({ preventScroll: true });
                  }}
                >
                  <Icon name="play" size={18} />
                  继续驾驶
                </button>
                <button className="secondary-button" onClick={start}>
                  <Icon name="restart" size={16} />
                  重新开始
                </button>
                <span className="panel-footnote">按 P / ESC 也可继续</span>
              </section>
            </div>
          )}

          {finished && (
            <div className="screen-overlay">
              <section
                className={`result-card ${s.phase === "VICTORY" ? "victory" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="result-title"
              >
                <span className="result-symbol">
                  <Icon
                    name={s.phase === "VICTORY" ? "ahead" : "brake"}
                    size={30}
                  />
                </span>
                <span className="card-kicker">
                  {s.phase === "VICTORY"
                    ? "任务完成 · 350 km/h"
                    : "行程结束 · 信号不会等待"}
                </span>
                <h2 id="result-title">
                  {s.phase === "VICTORY"
                    ? "你已经遥遥领先。"
                    : "这次，快了一步。"}
                </h2>
                <p>
                  {s.phase === "VICTORY"
                    ? "在最窄的视野里，你守住了最后 60 秒。"
                    : s.message}
                </p>
                <div className="result-main-stats">
                  <div>
                    <strong>{formatTime(s.time)}</strong>
                    <span>生存时间</span>
                  </div>
                  <div>
                    <strong>
                      {t.targetSpeed}
                      <small> km/h</small>
                    </strong>
                    <span>最高速度</span>
                  </div>
                </div>
                <div className="result-sub-stats">
                  <div>
                    <strong>
                      {s.stage}
                      <small> / 5</small>
                    </strong>
                    <span>领先阶段</span>
                  </div>
                  <div>
                    <strong>{s.changes}</strong>
                    <span>成功切轨</span>
                  </div>
                  <div>
                    <strong>{s.closeCalls}</strong>
                    <span>极限反应</span>
                  </div>
                </div>
                <button className="primary-button" onClick={start}>
                  <Icon name="restart" size={18} />
                  再开一局
                  <Icon name="arrow" size={19} />
                </button>
                <button
                  className="text-button return-button"
                  onClick={() => {
                    engine.current.reset();
                    refresh((v) => v + 1);
                  }}
                >
                  返回发车页
                </button>
                <span className="panel-footnote">
                  {s.phase === "VICTORY"
                    ? "本次行程已完成"
                    : "提前读信号，给变轨留出时间。"}
                </span>
              </section>
            </div>
          )}
        </div>

        <footer className="control-deck">
          <div className="control-group">
            <span className="control-label">驾驶操作</span>
            <div className="lane-controls">
              <button
                aria-label="上移轨道"
                disabled={!active || t.laneProgress < 1 || t.lane === 0}
                onClick={() => {
                  engine.current.changeLane(-1);
                  world.current?.focus({ preventScroll: true });
                }}
              >
                <Icon name="up" size={15} />
                <kbd>W</kbd>
              </button>
              <button
                aria-label="下移轨道"
                disabled={!active || t.laneProgress < 1 || t.lane === 2}
                onClick={() => {
                  engine.current.changeLane(1);
                  world.current?.focus({ preventScroll: true });
                }}
              >
                <Icon name="down" size={15} />
                <kbd>S</kbd>
              </button>
            </div>
            <span className="control-description">切换轨道</span>
            <span className="control-line" />
            <button
              className="space-control"
              disabled={!active || t.brakeCooldown > 0}
              onClick={() => {
                audio.current?.unlock();
                engine.current.brake();
                world.current?.focus({ preventScroll: true });
              }}
            >
              <kbd>SPACE</kbd>
            </button>
            <span className="control-description">紧急制动</span>
          </div>
          <div className="signal-legend">
            <span>
              <i className="legend-dot green" />
              安全
            </span>
            <span>
              <i className="legend-dot yellow" />
              风险
            </span>
            <span>
              <i className="legend-dot red" />
              封闭
            </span>
          </div>
          <div className="goal-caption">
            <span className="target-icon">◎</span>
            <span>
              到达 <strong>350</strong> km/h · 生存 <strong>60s</strong>
            </span>
          </div>
        </footer>
      </main>
      <div className="page-footer">
        <span>
          <i />
          先读信号，再做选择。
        </span>
        <span>
          三个轨道。一次机会。<b> GAME X / 001</b>
        </span>
      </div>

      {help && (
        <div className="help-overlay" onClick={() => toggleHelp(false)}>
          <section
            className="help-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                closeHelp.current?.focus();
              }
            }}
          >
            <button
              ref={closeHelp}
              className="icon-button close-help"
              aria-label="关闭操作指南"
              onClick={() => toggleHelp(false)}
            >
              <Icon name="close" />
            </button>
            <span className="card-kicker">发车前，花 20 秒</span>
            <h2 id="help-title">领先之前，先读懂信号。</h2>
            <div className="help-controls">
              <p>
                <kbd>W / ↑</kbd>
                <span>上移一轨</span>
              </p>
              <p>
                <kbd>S / ↓</kbd>
                <span>下移一轨</span>
              </p>
              <p>
                <kbd>SPACE</kbd>
                <span>制动 0.8 秒，冷却 3 秒</span>
              </p>
              <p>
                <kbd>P / ESC</kbd>
                <span>暂停 / 继续</span>
              </p>
            </div>
            <ol>
              <li>
                <strong>信号先行。</strong>
                红灯表示封闭，黄灯表示慢车或异物，绿灯指向安全轨道；顶部会提前提示推荐路线。
              </li>
              <li>
                <strong>变轨需要时间。</strong>耗时 0.48–0.78
                秒，途中不能反向取消。不要等障碍来到车头才转向。
              </li>
              <li>
                <strong>领先不可撤回。</strong>系统每 15–30 秒自动提速 20
                km/h，并提前 2 秒预警。车头从 10% 推进到 60%。
              </li>
              <li>
                <strong>保持 350 km/h，再生存 60 秒。</strong>
                制动只临时减速，碰撞即结束。手机也可使用底部按钮驾驶，横屏视野更好。
              </li>
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
