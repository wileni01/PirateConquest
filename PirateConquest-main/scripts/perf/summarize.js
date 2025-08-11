// Summarize perf CSVs into simple stats for baseline.md
// Usage: node scripts/perf/summarize.js
import fs from 'fs';
import path from 'path';

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) return [];
  const cols = header.split(',');
  const colIndex = Object.fromEntries(cols.map((c, i) => [c, i]));
  const rows = [];
  for (const line of lines) {
    if (!line) continue;
    const parts = line.split(',');
    // Guard against malformed lines
    if (parts.length < cols.length) continue;
    rows.push({
      fps: Number(parts[colIndex['fps']]),
      updateMs: Number(parts[colIndex['updateMs']]),
      aiMs: Number(parts[colIndex['aiMs']]),
      collisionMs: Number(parts[colIndex['collisionMs']]),
      drawCalls: Number(parts[colIndex['drawCalls']]),
    });
  }
  return rows;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

function summarize(rows) {
  const fps = rows.map((r) => r.fps).filter((n) => Number.isFinite(n));
  const updateMs = rows.map((r) => r.updateMs).filter((n) => Number.isFinite(n));
  const aiMs = rows.map((r) => r.aiMs).filter((n) => Number.isFinite(n));
  const collisionMs = rows.map((r) => r.collisionMs).filter((n) => Number.isFinite(n));
  const drawCalls = rows.map((r) => r.drawCalls).filter((n) => Number.isFinite(n));

  return {
    avgFps: mean(fps),
    p1Fps: percentile(fps, 0.01),
    p99Fps: percentile(fps, 0.99),
    avgUpdateMs: mean(updateMs),
    avgAiMs: mean(aiMs),
    avgCollisionMs: mean(collisionMs),
    avgDrawCalls: mean(drawCalls),
  };
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1) : 'n/a';
}

const files = [
  { key: 'Menu idle', file: 'menu_idle.csv' },
  { key: 'World sail', file: 'world_sail.csv' },
  { key: 'Small skirmish', file: 'small_skirmish.csv' },
  { key: 'Large battle', file: 'large_battle.csv' },
];

const perfDir = path.resolve('perf');
const results = {};

for (const { key, file } of files) {
  const p = path.join(perfDir, file);
  if (!fs.existsSync(p)) {
    console.error('Missing CSV:', p);
    continue;
  }
  const rows = readCsv(p);
  results[key] = summarize(rows);
}

// Print a compact markdown snippet for baseline.md consumption
for (const key of Object.keys(results)) {
  const r = results[key];
  console.log(`${key}: avg FPS ${fmt(r.avgFps)}, p1 ${fmt(r.p1Fps)}, p99 ${fmt(r.p99Fps)}, update ${fmt(r.avgUpdateMs)}ms, ai ${fmt(r.avgAiMs)}ms, collision ${fmt(r.avgCollisionMs)}ms, drawCalls ${fmt(r.avgDrawCalls)}`);
}


