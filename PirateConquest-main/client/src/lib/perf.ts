/*
  Minimal performance harness and metrics collector.
  - Activate with query param perf=1 (http://localhost:5173/?perf=1)
  - Runs scripted scenarios unless perf=manual
  - Collects frame/update/AI/collision timings, draw calls, FPS, memory
  - Emits CSV via downloadable Blob and console marker for automation
*/

import type { WebGLRenderer } from "three";
import { usePirateGame } from "./stores/usePirateGame";

export type FrameSample = {
  t: number; // timestamp ms
  dt: number; // frame delta ms
  updateMs: number;
  aiMs: number;
  collisionMs: number;
  drawCalls: number;
  fps: number;
  heapUsedMB?: number;
};

type ScenarioName = "menu_idle" | "world_sail" | "small_skirmish" | "large_battle";

type ScenarioSpec = {
  name: ScenarioName;
  durationSec: number;
  setup: () => void;
};

const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
export const PERF_ACTIVE = params.get("perf") === "1" || params.get("perf") === "true";
const PERF_MANUAL = params.get("perf") === "manual";

// Global, reset each scenario
let currentScenario: ScenarioName | null = null;
let samples: FrameSample[] = [];
let lastFrameTimeMs = performance.now();

// Hooks from game loop (conditionally called from Game.tsx)
export function perfBeginFrame(): void {
  if (!PERF_ACTIVE) return;
  const now = performance.now();
  const dt = now - lastFrameTimeMs;
  lastFrameTimeMs = now;
  // Create a placeholder sample; others will fill fields
  samples.push({
    t: now,
    dt,
    fps: dt > 0 ? 1000 / dt : 0,
    updateMs: 0,
    aiMs: 0,
    collisionMs: 0,
    drawCalls: 0,
    heapUsedMB: (performance as any).memory ? (performance as any).memory.usedJSHeapSize / (1024 * 1024) : undefined,
  });
}

export function perfRecordUpdate(ms: number): void {
  if (!PERF_ACTIVE || samples.length === 0) return;
  samples[samples.length - 1].updateMs = ms;
}

export function perfRecordAI(ms: number): void {
  if (!PERF_ACTIVE || samples.length === 0) return;
  samples[samples.length - 1].aiMs = ms;
}

export function perfRecordCollision(ms: number): void {
  if (!PERF_ACTIVE || samples.length === 0) return;
  samples[samples.length - 1].collisionMs = ms;
}

export function perfAfterRender(gl: WebGLRenderer): void {
  if (!PERF_ACTIVE || samples.length === 0) return;
  const info = (gl as any).info;
  const drawCalls: number = info?.render?.calls ?? 0;
  samples[samples.length - 1].drawCalls = drawCalls;
}

function toCsv(rows: Array<Record<string, number | string | undefined>>): string {
  const headers = [
    "scenario",
    "t",
    "dt",
    "fps",
    "updateMs",
    "aiMs",
    "collisionMs",
    "drawCalls",
    "heapUsedMB",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => String(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    // no-op
  }
}

function summarize(name: ScenarioName) {
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const p = (arr: number[], q: number) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
    return sorted[idx];
  };
  const fpsArr = samples.map((s) => s.fps);
  const updateArr = samples.map((s) => s.updateMs);
  const aiArr = samples.map((s) => s.aiMs);
  const colArr = samples.map((s) => s.collisionMs);
  const drawArr = samples.map((s) => s.drawCalls);
  // Console summary
  console.log("PERF_SUMMARY", {
    scenario: name,
    frames: samples.length,
    avgFps: avg(fpsArr).toFixed(1),
    p1Fps: p(fpsArr, 0.01).toFixed(1),
    p99Fps: p(fpsArr, 0.99).toFixed(1),
    avgUpdateMs: avg(updateArr).toFixed(3),
    avgAiMs: avg(aiArr).toFixed(3),
    avgCollisionMs: avg(colArr).toFixed(3),
    avgDrawCalls: avg(drawArr).toFixed(1),
  });
}

function flushScenario(name: ScenarioName) {
  const rows = samples.map((s) => ({
    scenario: name,
    t: Math.round(s.t),
    dt: s.dt.toFixed(3),
    fps: s.fps.toFixed(2),
    updateMs: s.updateMs.toFixed(3),
    aiMs: s.aiMs.toFixed(3),
    collisionMs: s.collisionMs.toFixed(3),
    drawCalls: s.drawCalls,
    heapUsedMB: s.heapUsedMB?.toFixed(1),
  }));
  const csv = toCsv(rows);
  const filename = `${name}.csv`;
  downloadCsv(filename, csv);
  // Marker for automation to capture and write files from console
  console.log(`METRIC_CSV:${filename}|` + csv);
  summarize(name);
}

function resetScenario(name: ScenarioName) {
  currentScenario = name;
  samples = [];
  lastFrameTimeMs = performance.now();
}

function setupMenuIdle() {
  const api = usePirateGame.getState();
  api.setGameState("menu");
}

function setupWorldSail() {
  const api = usePirateGame.getState();
  api.startGame(); // positions player and enters sailing
}

function setupSmallSkirmish() {
  setupWorldSail();
  // Spawn a few enemies near player
  const s = usePirateGame.getState();
  const playerPos = s.player.ship.position;
  const ships = [...s.ships];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ships.push({
      ...s.player.ship,
      id: `perf_enemy_${i}`,
      isPlayer: false,
      isEnemy: true,
      position: [playerPos[0] + Math.cos(angle) * 30, 0, playerPos[2] + Math.sin(angle) * 30],
      faction: "spanish",
    });
  }
  usePirateGame.setState({ ships });
  usePirateGame.getState().setGameState("combat");
}

function setupLargeBattle() {
  setupWorldSail();
  const s = usePirateGame.getState();
  const playerPos = s.player.ship.position;
  const ships = [...s.ships];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    ships.push({
      ...s.player.ship,
      id: `perf_enemy_big_${i}`,
      isPlayer: false,
      isEnemy: true,
      position: [playerPos[0] + Math.cos(angle) * 55, 0, playerPos[2] + Math.sin(angle) * 55],
      faction: i % 2 === 0 ? "spanish" : "french",
      cannons: Math.max(6, s.player.ship.cannons - 2),
      speed: Math.max(4, s.player.ship.speed - 2),
      maxHealth: Math.max(200, s.player.ship.maxHealth - 50),
      health: Math.max(200, s.player.ship.maxHealth - 50),
    });
  }
  usePirateGame.setState({ ships });
  usePirateGame.getState().setGameState("combat");
}

const SCENARIOS: ScenarioSpec[] = [
  { name: "menu_idle", durationSec: 60, setup: setupMenuIdle },
  { name: "world_sail", durationSec: 60, setup: setupWorldSail },
  { name: "small_skirmish", durationSec: 60, setup: setupSmallSkirmish },
  { name: "large_battle", durationSec: 60, setup: setupLargeBattle },
];

async function runScenarioSequentially(specs: ScenarioSpec[]) {
  for (const spec of specs) {
    resetScenario(spec.name);
    console.log("PERF_SCENARIO_START", spec.name);
    spec.setup();
    await new Promise<void>((resolve) => setTimeout(resolve, spec.durationSec * 1000));
    flushScenario(spec.name);
  }
  console.log("PERF_DONE");
}

export function startPerfHarnessIfRequested(): void {
  if (!PERF_ACTIVE) return;
  if (PERF_MANUAL) {
    console.log("PERF_HARNESS: manual mode. Use window.__runPerf() to start.");
    (window as any).__runPerf = () => runScenarioSequentially(SCENARIOS);
    return;
  }
  // Auto-start after a brief delay to allow app mount
  setTimeout(() => {
    runScenarioSequentially(SCENARIOS);
  }, 1000);
}

// GeoJSON load timing helper (used by MapView)
export function markGeoJsonLoad(label: string, ms: number, features: number) {
  if (!PERF_ACTIVE) return;
  console.log("PERF_GEOJSON", { label, ms: Number(ms.toFixed(2)), features });
}


