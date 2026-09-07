export const STAGES = [
  { speed: 250, screenX: 0.1, reaction: 2.8, laneDuration: 0.48 },
  { speed: 270, screenX: 0.2, reaction: 2.3, laneDuration: 0.54 },
  { speed: 290, screenX: 0.3, reaction: 2.0, laneDuration: 0.6 },
  { speed: 310, screenX: 0.4, reaction: 1.7, laneDuration: 0.66 },
  { speed: 330, screenX: 0.5, reaction: 1.4, laneDuration: 0.72 },
  { speed: 350, screenX: 0.6, reaction: 1.1, laneDuration: 0.78 },
] as const;

export const RULES = {
  leadingMin: 15,
  leadingMax: 30,
  warning: 2,
  leadingMove: 0.85,
  brakeDuration: 0.8,
  brakeCooldown: 3,
  brakeFactor: 0.38,
  victoryDuration: 60,
  signalLead: 1.45,
  firstWave: 3,
  waveGap: 1.6,
  collisionTail: 0.075,
  minDecision: 0.8,
} as const;

export const LANE_NAMES = ["上轨", "中轨", "下轨"] as const;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
