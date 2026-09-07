import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../src/game/engine";
import { RULES, STAGES } from "../src/game/config";

function advance(game: GameEngine, seconds: number, onFrame?: () => void) {
  const frames = Math.ceil(seconds * 120);
  for (let i = 0; i < frames; i++) {
    onFrame?.();
    game.update(1 / 120);
  }
}

function randomSource(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/** 测试驾驶员只读取正常玩家可见的提前信号，仍调用真实变道与碰撞逻辑。 */
function followSignal(game: GameEngine) {
  const wave = game.state.waves.find((w) => !w.passed);
  if (
    wave &&
    game.state.train.laneProgress === 1 &&
    game.state.train.lane !== wave.safeLane
  ) {
    game.changeLane(wave.safeLane < game.state.train.lane ? -1 : 1);
  }
}

test("发车从 250 km/h、10% 车头位置和中轨开始", () => {
  const game = new GameEngine(() => 0);
  assert.equal(game.state.phase, "READY");
  game.start();
  assert.equal(game.state.phase, "PLAYING");
  assert.equal(game.state.train.speed, 250);
  assert.equal(game.state.train.screenX, 0.1);
  assert.equal(game.state.train.lane, 1);
});

test("换轨连续移动，期间锁定方向，完成后才计数", () => {
  const game = new GameEngine(() => 0);
  game.start();
  assert.equal(game.changeLane(-1), true);
  advance(game, 0.24);
  assert.ok(game.state.train.laneY > 0 && game.state.train.laneY < 1);
  assert.equal(game.changeLane(1), false);
  assert.equal(game.state.changes, 0);
  advance(game, 0.25);
  assert.equal(game.state.train.lane, 0);
  assert.equal(game.state.changes, 1);
  assert.equal(game.changeLane(-1), false);
});

test("制动持续 0.8 秒，3 秒冷却，基础速度永久保留", () => {
  const game = new GameEngine(() => 0);
  game.start();
  assert.equal(game.brake(), true);
  advance(game, 0.4);
  assert.ok(game.state.train.speed < 250);
  assert.equal(game.state.train.targetSpeed, 250);
  assert.equal(game.brake(), false);
  advance(game, 0.41);
  assert.equal(game.state.train.speed, 250);
  assert.equal(game.state.train.isBraking, false);
  assert.equal(game.brake(), false);
  advance(game, 2.2);
  assert.equal(game.brake(), true);
});

test("提前 2 秒预警、倒计时有 3 次音效、提速和车头推进平滑", () => {
  const game = new GameEngine(() => 0);
  game.start();
  advance(game, 12.98, () => followSignal(game));
  assert.equal(game.state.phase, "PLAYING");
  game.drainSounds();
  advance(game, 0.05, () => followSignal(game));
  assert.equal(game.state.phase, "LEADING_WARNING");
  advance(game, 1.99, () => followSignal(game));
  assert.equal(game.state.stage, 1);
  assert.equal(
    game.drainSounds().filter((sound) => sound === "warning").length,
    3,
  );
  assert.ok(game.state.train.screenX >= 0.1 && game.state.train.screenX < 0.15);
  advance(game, 0.45);
  assert.ok(game.state.train.screenX > 0.15 && game.state.train.screenX < 0.2);
  advance(game, 0.45);
  assert.equal(game.state.train.screenX, 0.2);
  assert.equal(game.state.train.targetSpeed, 270);
});

test("每档场景滚动速度增加，实体反应窗口不低于 0.8 秒", () => {
  let previous = 0;
  for (const [stage, config] of STAGES.entries()) {
    const game = new GameEngine();
    game.state.stage = stage;
    assert.ok(game.velocity > previous);
    previous = game.velocity;
    assert.ok(config.reaction >= 0.8);
    assert.ok(config.reaction > config.laneDuration + 0.2);
  }
});

test("信号生成时实体还在屏外，安全出口最多相隔一轨", () => {
  const game = new GameEngine(() => 0);
  game.start();
  advance(game, 3.02);
  const wave = game.state.waves[0];
  assert.ok(wave);
  assert.ok(wave.x > 1);
  assert.ok(!wave.blocked.includes(wave.safeLane));
  assert.equal(Math.abs(wave.safeLane - wave.laneAtSpawn), 1);
  assert.ok(wave.decisionTime > game.config.reaction);
});

test("不操作会碰撞失败，失败后输入不能继续改变轨道", () => {
  const game = new GameEngine(() => 0);
  game.start();
  advance(game, 10);
  assert.equal(game.state.phase, "GAME_OVER");
  const time = game.state.time;
  advance(game, 1);
  assert.equal(game.state.time, time);
  assert.equal(game.changeLane(1), false);
  assert.ok(game.state.message.length > 0);
});

test("低帧率扫掠检测不会穿透障碍", () => {
  const game = new GameEngine(() => 0);
  game.start();
  game.state.waves.push({
    id: 1,
    x: 0.13,
    blocked: [1],
    safeLane: 0,
    kind: "debris",
    passed: false,
    decisionTime: 0.1,
    laneAtSpawn: 1,
  });
  game.update(0.25);
  assert.equal(game.state.phase, "GAME_OVER");
});

test("极限反应只在成功避让后计数，失败尝试不计入", () => {
  const game = new GameEngine(() => 0);
  game.start();
  game.state.waves.push({
    id: 1,
    x: 0.1 + game.velocity * 0.75,
    blocked: [1],
    safeLane: 0,
    kind: "debris",
    passed: false,
    decisionTime: 0.75,
    laneAtSpawn: 1,
  });
  game.changeLane(-1);
  assert.equal(game.state.closeCalls, 0);
  advance(game, 1.1);
  assert.equal(game.state.phase, "PLAYING");
  assert.equal(game.state.closeCalls, 1);
});

test("变道未完成时仍占用原轨，不能最后一刻无成本逃逸", () => {
  const game = new GameEngine(() => 0);
  game.start();
  game.state.waves.push({
    id: 1,
    x: 0.11,
    blocked: [1],
    safeLane: 0,
    kind: "construction",
    passed: false,
    decisionTime: 0.03,
    laneAtSpawn: 1,
  });
  game.changeLane(-1);
  advance(game, 0.1);
  assert.equal(game.state.phase, "GAME_OVER");
});

test("暂停冻结计时、制动冷却、镜头和障碍，恢复后继续", () => {
  const game = new GameEngine(() => 0);
  game.start();
  game.brake();
  advance(game, 0.2);
  game.pause();
  const snapshot = JSON.stringify(game.state);
  advance(game, 10);
  assert.equal(JSON.stringify(game.state), snapshot);
  game.resume();
  advance(game, 0.1);
  assert.ok(game.state.time > 0.2);
});

test("重新开始清除失败、统计、障碍与所有速度阶段", () => {
  const game = new GameEngine(() => 0);
  game.start();
  advance(game, 10);
  game.start();
  assert.equal(game.state.phase, "PLAYING");
  assert.equal(game.state.time, 0);
  assert.equal(game.state.stage, 0);
  assert.equal(game.state.waves.length, 0);
  assert.equal(game.state.changes, 0);
  assert.equal(game.state.train.brakeCooldown, 0);
});

test("60 个随机种子完整通关：保留可行路线，350 后生存足够 60 秒", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const game = new GameEngine(randomSource(seed));
    game.start();
    const observed = new Set<number>();
    for (let frame = 0; frame < 220 * 60 && game.active; frame++) {
      followSignal(game);
      // 部分局持续使用制动，覆盖波次延期与领先预警边界。
      if (seed % 3 === 0 && game.state.train.brakeCooldown === 0) game.brake();
      game.update(1 / 60);
      observed.add(game.state.stage);
      const waves = game.state.waves.filter((w) => !w.passed);
      assert.ok(waves.length <= 1, `种子 ${seed}：出现重叠波次`);
      for (const wave of waves)
        assert.ok(!wave.blocked.includes(wave.safeLane));
    }
    assert.equal(
      game.state.phase,
      "VICTORY",
      `种子 ${seed} 未通关：${game.state.message}`,
    );
    assert.equal(observed.size, 6);
    assert.equal(game.state.train.targetSpeed, 350);
    assert.equal(game.state.train.screenX, 0.6);
    assert.equal(game.state.peakTime, RULES.victoryDuration);
    assert.ok(game.state.time >= 135);
    assert.ok(game.state.passed > 15);
  }
});

test("高速阶段保留 0.8 秒思考余量，已经变道的玩家也能完成安全路线", () => {
  for (let stage = 0; stage < 6; stage++) {
    const game = new GameEngine(() => 0);
    game.start();
    game.state.stage = stage;
    Object.assign(game.state.train, {
      screenX: STAGES[stage].screenX,
      targetScreenX: STAGES[stage].screenX,
      fromScreenX: STAGES[stage].screenX,
      targetSpeed: STAGES[stage].speed,
    });
    game.state.spawnAt = 0;
    game.changeLane(-1);
    game.update(1 / 120);
    const wave = game.state.waves[0];
    assert.ok(wave);
    assert.ok(
      wave.decisionTime >= STAGES[stage].laneDuration + 0.48 + 0.8 - 0.01,
    );
    advance(game, 0.8);
    advance(game, 4, () => followSignal(game));
    assert.notEqual(game.state.phase, "GAME_OVER");
  }
});
