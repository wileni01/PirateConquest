Pirate Conquest – Performance Baseline (Initial)

Scopes
- Menu idle, World sail, Small skirmish, Large battle – 60s each.

Method
- Run with `?perf=1` to auto-execute scenarios.
- Metrics captured per-frame: dt, fps, updateMs, aiMs, collisionMs, drawCalls, heapUsedMB.
- CSVs emitted to browser downloads and to console as METRIC_CSV markers.

Environment
- Fill: Chrome version, GPU, resolution, OS.

Flamegraphs & Screenshots
- Attach Chrome Performance panel captures for each scenario.

Baseline Numbers (to be filled after first run)
- Menu idle: avg FPS, p1/p99, avg update/ai/collision, draw calls.
- World sail: same metrics.
- Small skirmish: same metrics.
- Large battle: same metrics.

Notes
- GeoJSON load timing is logged as PERF_GEOJSON entries.


